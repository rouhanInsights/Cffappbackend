const jwt = require('jsonwebtoken');
const pool = require('../Db');

// Temporary in-memory store for OTPs (dev/test only)
const otpStore = {};

// Step 1: Send OTP
const sendOtp = async (req, res) => {
  const { phone, email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or Email is required' });
  }

  const key = phone || email;

  // Store OTP with expiration (5 minutes)
  otpStore[key] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  console.log(`✅ OTP sent to ${key}: ${otp}`);

  res.json({ message: 'OTP sent successfully' });
};

// Step 2: Verify OTP and generate JWT
const verifyOtp = async (req, res) => {
  const { phone, email, otp_code } = req.body;
  const key = phone || email;

  const record = otpStore[key];
  if (!record || record.otp !== otp_code || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Remove OTP after use
  delete otpStore[key];

  try {
    let user;

    if (phone) {
      const userQuery = await pool.query('SELECT * FROM cust_users WHERE phone = $1', [phone]);
      user = userQuery.rows[0];
    } else {
      const userQuery = await pool.query('SELECT * FROM cust_users WHERE email = $1', [email]);
      user = userQuery.rows[0];
    }

    // Create user if not exists
    if (!user) {
      const insertQuery = phone
        ? await pool.query(
            'INSERT INTO cust_users (phone, name) VALUES ($1, $2) RETURNING *',
[phone, 'New User']
          )
        : await pool.query(
            'INSERT INTO cust_users (email, name) VALUES ($1, $2) RETURNING *',
[email, 'New User']
          );
      user = insertQuery.rows[0];
    }

    const token = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};



module.exports = { sendOtp, verifyOtp};
