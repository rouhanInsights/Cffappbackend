const pool = require("../Db");
const Razorpay = require("razorpay");

const createPaymentOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
      amount: amount * 100, // Razorpay requires paise
      currency: "INR",
      receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      order_id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err) {
    console.error("Razorpay create error:", err.message);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

const recordPayment = async (req, res) => {
  const userId = req.user.userId;
  const { order_id, amount, payment_method, payment_status } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO cust_payments (order_id, user_id, amount, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        order_id,
        userId,
        amount,
        payment_method || "Cash on Delivery",
        payment_status || "Pending"
      ]
    );

    res.status(201).json({
      message: "✅ Payment recorded successfully",
      payment: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Payment Record Error:", err);
    res.status(500).json({ error: "Failed to record payment" });
  }
};

module.exports = { createPaymentOrder,recordPayment };
