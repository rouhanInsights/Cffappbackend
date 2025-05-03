const pool = require("../Db");

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

module.exports = { recordPayment };
