const pool = require('../Db');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const nodemailer = require("nodemailer");

// === Static Test Credentials (for Play Console reviewers) ===
// Change these if you want different test creds.
const TEST_PHONE = "9876543210";
const TEST_EMAIL = "test-login@calcuttafreshfoods.com"; // optional if you want an email test too
const TEST_OTP = "123456";

// --- Static Config ---
const JWT_SECRET = process.env.JWT_SECRET;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_PER_HOUR = 5; // Max OTPs per hour per contact

// --- OTP Store (in-memory)
const otpStore = new Map(); // key: sms:98765..., val: { code, expiresAt, ... }

// --- Email Transporter (optional)
const emailUser = process.env.GMAIL_USER;
const emailPass = process.env.GMAIL_PASS;

const transporter =
  emailUser && emailPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass },
      })
    : null;

// --- Helper: Generate OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// --- Helper: Normalize Indian Phone Number
const normalizePhoneIN = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
};

const now = () => Date.now();
const getKey = (channel, contact) => `${channel}:${contact}`;

// --- Rate Limiting
const checkRateLimit = (record) => {
  const oneHourAgo = now() - 60 * 60 * 1000;
  record.sentTimestamps = (record.sentTimestamps || []).filter(
    (t) => t >= oneHourAgo
  );
  return record.sentTimestamps.length >= MAX_PER_HOUR;
};

const isOnCooldown = (record) =>
  record.lastSentAt && now() - record.lastSentAt < RESEND_COOLDOWN_MS;

const recordSent = (record) => {
  record.lastSentAt = now();
  record.sentTimestamps = record.sentTimestamps || [];
  record.sentTimestamps.push(record.lastSentAt);
};

// --- Send OTP via SMS (Fast2SMS DLT)
const sendOtpViaSMS = async (phone, otp) => {
  const API_KEY = process.env.FAST2SMS_API_KEY;
  const DLT_TEMPLATE_ID = "195092";      // Your approved DLT template ID
  const SENDER_ID = "CFFOTP";            // Your approved sender ID

  if (!API_KEY) throw new Error("FAST2SMS_API_KEY not set");

  const payload = {
    route: "dlt",
    sender_id: SENDER_ID,
    message: DLT_TEMPLATE_ID,            // DLT Template ID instead of text
    variables_values: `${otp}|`,         // OTP value here
    flash: 0,
    numbers: phone,
  };

  const headers = {
    authorization: API_KEY,
    "Content-Type": "application/json",
  };

  await axios.post("https://www.fast2sms.com/dev/bulkV2", payload, {
    headers,
    timeout: 10000,
  });
};

// --- Controller: Send OTP
const sendOtp = async (req, res) => {
  try {
    const { phone, email } = req.body;
    let contact, channel;

    if (phone) {
      const norm = normalizePhoneIN(phone);
      if (!norm) return res.status(400).json({ error: "Invalid phone number" });
      contact = norm;
      channel = "sms";
    } else if (email) {
      if (!/^\S+@\S+\.\S+$/.test(email))
        return res.status(400).json({ error: "Invalid email address" });
      contact = email.toLowerCase();
      channel = "email";
    } else {
      return res.status(400).json({ error: "Phone or email required" });
    }

    const key = getKey(channel, contact);
    const existing = otpStore.get(key) || {
      sentTimestamps: [],
      lastSentAt: 0,
      used: false,
    };

    if (checkRateLimit(existing)) {
      return res.status(429).json({
        error: "Too many OTP requests. Try again later.",
      });
    }

    if (isOnCooldown(existing)) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (now() - existing.lastSentAt)) / 1000
      );
      return res
        .status(429)
        .json({ error: `Please wait ${wait}s before retrying.` });
    }

    // === TEST SHORT-CIRCUIT: don't call SMS/email providers for the test contact ===
    const isTestContact =
      (channel === "sms" && contact === TEST_PHONE) ||
      (channel === "email" && contact === TEST_EMAIL);

    const code = isTestContact ? TEST_OTP : generateOtp();
    const expiresAt = now() + OTP_TTL_MS;

    const record = {
      code,
      expiresAt,
      attempts: 0,
      sentTimestamps: existing.sentTimestamps,
      lastSentAt: 0,
      used: false,
    };

    if (!isTestContact) {
      if (channel === "sms") {
        await sendOtpViaSMS(contact, code);
      } else {
        if (!transporter)
          return res
            .status(500)
            .json({ error: "Email transporter not configured" });

        await transporter.sendMail({
          from: `"Calcutta Fresh Foods" <${emailUser}>`,
          to: contact,
          subject: "Your OTP Code",
          text: `Your OTP is ${code}. Valid for 5 minutes.`,
        });
      }
    }
    // For test contact, we silently store TEST_OTP and return success.

    recordSent(record);
    otpStore.set(key, record);

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("sendOtp error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

// --- Controller: Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: "Invalid OTP format" });
    }

    let contact, channel;
    if (phone) {
      const norm = normalizePhoneIN(phone);
      if (!norm) return res.status(400).json({ error: "Invalid phone number" });
      contact = norm;
      channel = "sms";
    } else if (email) {
      if (!/^\S+@\S+\.\S+$/.test(email))
        return res.status(400).json({ error: "Invalid email" });
      contact = email.toLowerCase();
      channel = "email";
    } else {
      return res.status(400).json({ error: "Phone or email required" });
    }

    const key = getKey(channel, contact);
    const isTestContact =
      (channel === "sms" && contact === TEST_PHONE) ||
      (channel === "email" && contact === TEST_EMAIL);

    if (isTestContact) {
      // Bypass store checks; accept only the fixed TEST_OTP.
      if (String(otp) !== TEST_OTP) {
        return res.status(401).json({ error: "Incorrect OTP" });
      }
      // proceed to upsert user below
    } else {
      const record = otpStore.get(key);
      if (!record) return res.status(401).json({ error: "OTP not found" });
      if (record.used) return res.status(401).json({ error: "OTP already used" });
      if (now() > record.expiresAt)
        return res.status(401).json({ error: "OTP expired" });

      if (record.code !== String(otp)) {
        record.attempts += 1;
        otpStore.set(key, record);
        return res.status(401).json({ error: "Incorrect OTP" });
      }

      record.used = true;
      otpStore.set(key, record);
    }

    // Upsert user
    let user;
    if (channel === "sms") {
      const r = await pool.query("SELECT * FROM cust_users WHERE phone = $1", [
        contact,
      ]);
      user =
        r.rows.length > 0
          ? r.rows[0]
          : (
              await pool.query(
                "INSERT INTO cust_users (phone, created_at) VALUES ($1, now()) RETURNING *",
                [contact]
              )
            ).rows[0];
    } else {
      const r = await pool.query("SELECT * FROM cust_users WHERE email = $1", [
        contact,
      ]);
      user =
        r.rows.length > 0
          ? r.rows[0]
          : (
              await pool.query(
                "INSERT INTO cust_users (email, created_at) VALUES ($1, now()) RETURNING *",
                [contact]
              )
            ).rows[0];
    }

    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ message: "OTP verified", token, user });
  } catch (err) {
    console.error("verifyOtp error:", err.message);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

module.exports = { sendOtp, verifyOtp };
