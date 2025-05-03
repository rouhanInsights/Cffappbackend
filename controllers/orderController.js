const pool = require('../Db');

// Place order
const placeOrder = async (req, res) => {
  const userId = req.user.userId;
  const { total, address, slot_id, slot_date, items, payment_method } = req.body;

  try {
    console.log("🟡 Received order payload:", { userId, total, address, slot_id, slot_date, payment_method });
    console.log("🟡 Items:", items);

    const orderResult = await pool.query(
      `INSERT INTO cust_orders 
        (user_id, total_price, address, status, slot_id, slot_date, payment_method, order_date)
       VALUES ($1, $2, $3, 'Pending', $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING order_id`,
      [userId, total, address, slot_id, slot_date, payment_method]
    );

    const orderId = orderResult.rows[0]?.order_id;
    console.log("✅ Order created with ID:", orderId);

    if (!orderId) throw new Error("Order ID not returned");

    for (const item of items) {
      const { id: product_id, quantity, price} = item;

      await pool.query(
        `INSERT INTO cust_order_items
   (order_id, product_id, quantity, price)
   VALUES ($1, $2, $3, $4)`,
        [orderId, product_id, quantity, price]
      );
    }

    await pool.query(
      `INSERT INTO cust_payments 
        (order_id, user_id, amount, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, 'Pending')`,
      [orderId, userId, total, payment_method]
    );

    res.json({ message: 'Order & payment recorded successfully', order_id: orderId });
  } catch (err) {
    console.error('🔴 Place Order Error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

// Get all orders for a user
const getUserOrders = async (req, res) => {
  const userId = req.user.userId;
  console.log("Authenticated userId:", req.user.userId);
  try {
    const result = await pool.query(`
      SELECT
        o.order_id,
        o.order_date,
        o.total_price AS total,
        o.status,
        o.address,
        s.slot_details,
        p.payment_method,
        p.payment_status,
        p.payment_date,
        json_agg(
          json_build_object(
            'product_id', pr.product_id,
            'name', pr.name,
            'image_url', pr.image_url,
            'price', oi.price,
            'quantity', oi.quantity
          )
        ) AS items
      FROM cust_orders o
      LEFT JOIN cust_order_items oi ON o.order_id = oi.order_id
      LEFT JOIN cust_products pr ON oi.product_id = pr.product_id
      LEFT JOIN cust_slot_details s ON o.slot_id = s.slot_id
      LEFT JOIN cust_payments p ON o.order_id = p.order_id
      WHERE o.user_id = $1
      GROUP BY o.order_id, s.slot_details, p.payment_method, p.payment_status, p.payment_date
      ORDER BY o.order_date DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};


module.exports = { placeOrder, getUserOrders };
