const pool = require("../Db");

const submitFeedback = async (req, res) => {
  const user_id = req.user?.userId;
  const { order_id, rating_product, comment_product, rating_da, comment_da } = req.body;

  if (!order_id || !rating_product || !rating_da) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cust_feedback 
        (user_id, order_id, rating_product, comment_product, rating_da, comment_da)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, order_id, rating_product, comment_product, rating_da, comment_da]
    );
    res.status(201).json({ message: "Feedback submitted", feedback: result.rows[0] });
  } catch (err) {
    console.error("Feedback error:", err.message);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
};
const getSubmittedFeedbacks = async (req, res) => {
  const user_id = req.user?.userId;

  try {
    const result = await pool.query(
      `SELECT order_id FROM cust_feedback WHERE user_id = $1`,
      [user_id]
    );
    const order_ids = result.rows.map(row => row.order_id);
    res.json({ order_ids });
  } catch (err) {
    console.error("Error fetching submitted feedbacks:", err.message);
    res.status(500).json({ error: "Could not load submitted feedbacks" });
  }
};


module.exports = { submitFeedback,getSubmittedFeedbacks };
