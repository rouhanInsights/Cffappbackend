const pool = require('../Db');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cust_products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product
const getProductById = async (req, res) => {
  const productId = parseInt(req.params.id, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM cust_products WHERE product_id = $1",
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new product
const createProduct = async (req, res) => {
  const { name, description, price, sale_price, stock_quantity, category_id, image_url } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO cust_products (name, description, price, sale_price, stock_quantity, category_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, price, sale_price, stock_quantity, category_id, image_url]
    );

    res.status(201).json({ message: 'Product created', product: result.rows[0] });
  } catch (err) {
    console.error('Create Product Error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};
// Update product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, sale_price, stock_quantity, category_id, image_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE cust_products
       SET name = $1, description = $2, price = $3, sale_price = $4, stock_quantity = $5, category_id = $6, image_url = $7
       WHERE product_id = $8
       RETURNING *`,
      [name, description, price, sale_price, stock_quantity, category_id, image_url, id]
    );

    res.json({ message: 'Product updated', product: result.rows[0] });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM cust_products WHERE product_id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
//Search Products
const search = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const queryText = `SELECT * FROM cust_products WHERE name ILIKE $1;`
    const values = [`%${q}%`];

    console.log("Executing Query:", queryText, "with values:", values); // 🔍 Debug
    const result = await pool.query(queryText, values);

    console.log("Search Results:", result.rows); // 🔍 Debug

    res.json(result.rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
};
const category = async (req, res) => {
  const { name } = req.query;
  console.log("✅ Category route hit with name:", name);

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const query = `
      SELECT p.*
      FROM cust_products p
      JOIN cust_categories c ON p.category_id = c.category_id
      WHERE c.category_name ILIKE $1
    `;

    const values = [name];
    const result = await pool.query(query, values);

    console.log("✅ Query successful, rows returned:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ DATABASE ERROR:", err); // SHOW THE ERROR
    res.status(500).json({ error: "Failed to fetch product" });
  }
};
const relateditems = async (req, res) => {
  const categoryId = parseInt(req.params.category_id, 10);
  const excludeId = parseInt(req.params.exclude_id, 10);

  if (isNaN(categoryId) || isNaN(excludeId)) {
    return res.status(400).json({ message: "Invalid category ID or product ID" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM cust_products 
       WHERE category_id = $1 AND product_id != $2 
       ORDER BY category_id DESC LIMIT 4`,
      [categoryId, excludeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  search,
  category, relateditems
};
