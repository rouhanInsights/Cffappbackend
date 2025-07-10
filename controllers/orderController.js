const pool = require('../Db');
const PDFDocument = require("pdfkit");

// ✅ Place Order
const placeOrder = async (req, res) => {
  const userId = req.user.userId;
  const { total, address,address_id, slot_id, slot_date, items, payment_method } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO cust_orders 
  (user_id, total_price, address, address_id, status, slot_id, slot_date, payment_method, order_date)
VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, CURRENT_TIMESTAMP)
RETURNING order_id`,
      [userId, total, address, address_id, slot_id, slot_date, payment_method]
    );

    const orderId = orderResult.rows[0]?.order_id;
    if (!orderId) throw new Error("Order ID not returned");

    for (const item of items) {
      const { id: product_id, quantity, price } = item;
      await client.query(
        `INSERT INTO cust_order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, product_id, quantity, price]
      );
    }

    await client.query(
      `INSERT INTO cust_payments 
        (order_id, user_id, amount, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, 'Pending')`,
      [orderId, userId, total, payment_method]
    );

    await client.query('COMMIT');
    res.json({ message: 'Order & payment recorded successfully', order_id: orderId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('🔴 Transaction Failed:', err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
};

// ✅ Get all orders 
const getUserOrders = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(`
      SELECT
  o.order_id,
  o.order_date,
  o.total_price AS total,
  o.status,
  CONCAT_WS(', ', a.address_line1, a.city, a.pincode) AS full_address,
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
LEFT JOIN cust_addresses a ON o.address_id = a.address_id
WHERE o.user_id = $1
GROUP BY o.order_id, full_address, s.slot_details, p.payment_method, p.payment_status, p.payment_date
ORDER BY o.order_date DESC

    `, [userId]);

    res.json({ orders: result.rows });
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

const getOrderById = async (req, res) => {
  const { id: order_id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `
      SELECT 
        o.order_id,
        o.order_date,
        o.total_price AS total,
        o.status,
        CONCAT_WS(', ', a.address_line1, a.city, a.pincode) AS full_address,
        a.name AS address_name,
        a.phone AS address_phone,
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
      LEFT JOIN cust_addresses a ON o.address_id = a.address_id
      LEFT JOIN cust_slot_details s ON o.slot_id = s.slot_id
      LEFT JOIN cust_payments p ON o.order_id = p.order_id
      WHERE o.order_id = $1 AND o.user_id = $2
      GROUP BY o.order_id, full_address, a.name, a.phone, s.slot_details, p.payment_method, p.payment_status, p.payment_date
      `,
      [order_id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get Order By ID Error:", err.message);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};



const getOrderInvoice = async (req, res) => {
  const { id: order_id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `
      SELECT 
        o.order_id,
        o.order_date,
        o.total_price AS total,
        o.status,
        a.name AS address_name,
        a.phone AS address_phone,
        a.address_line1,
        a.city,
        a.state,
        a.pincode,
        p.payment_method,
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
      LEFT JOIN cust_addresses a ON o.address_id = a.address_id
      LEFT JOIN cust_payments p ON o.order_id = p.order_id
      WHERE o.order_id = $1 AND o.user_id = $2
      GROUP BY o.order_id, a.name, a.phone, a.address_line1, a.city, a.state, a.pincode, p.payment_method
      `,
      [order_id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.order_id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Calcutta Fresh Foods", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #${order.order_id}`);
    doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment Method: ${order.payment_method}`);
    doc.moveDown();

    // Address
    doc.fontSize(14).text("Shipping Address:");
    doc.fontSize(12).text(`${order.address_name}`);
    doc.text(`${order.address_line1}, ${order.city}, ${order.state} - ${order.pincode}`);
    doc.text(`Phone: ${order.address_phone}`);
    doc.moveDown();

    // Items
    doc.fontSize(14).text("Order Items:");
    doc.moveDown();
    order.items.forEach((item) => {
      doc.fontSize(12).text(`${item.name} - ₹${item.price} x ${item.quantity}`);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${order.total}`, { align: "right" });

    doc.end();
  } catch (err) {
    console.error("Invoice generation error:", err.message);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
};


module.exports = {
  placeOrder,
  getUserOrders,
  getOrderById,
  getOrderInvoice,
};