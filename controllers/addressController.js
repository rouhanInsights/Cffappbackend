const pool = require('../Db');
 const getalladdress= async (req, res) => {
    const userId = req.user.userId;
  
    try {
      const result = await pool.query(
        `SELECT * FROM cust_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Get Addresses Error:", err.message);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  };
  const addaddress= async (req, res) => {
    const userId = req.user.userId;
    const {
      name,
      phone,
      address_line1,
      address_line2,
      address_line3,
      city,
      state,
      pincode,
      is_default = false,
    } = req.body;
  
    try {
      if (is_default) {
        await pool.query(`UPDATE cust_addresses SET is_default = false WHERE user_id = $1`, [userId]);
      }
  
      const result = await pool.query(
        `INSERT INTO cust_addresses 
          (user_id, name, phone, address_line1, address_line2, address_line3, city, state, pincode, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [userId, name, phone, address_line1, address_line2, address_line3, city, state, pincode, is_default]
      );
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Add Address Error:", err.message);
      res.status(500).json({ error: "Failed to save address" });
    }
  };
  const updaddress = async (req, res) => {
    const addressId = req.params.addressId;
    const userId = req.user.userId;
    const { is_default } = req.body;
  
    if (is_default === true) {
      try {
        // Remove default from all addresses for this user
        await pool.query(`UPDATE cust_addresses SET is_default = false WHERE user_id = $1`, [userId]);
  
        // Set the selected address as default
        await pool.query(
          `UPDATE cust_addresses SET is_default = true WHERE address_id = $1 AND user_id = $2`,
          [addressId, userId]
        );
  
        return res.json({ message: "Default address updated" });
      } catch (err) {
        console.error("Update Address Error:", err);
        return res.status(500).json({ error: "Failed to update default address" });
      }
    }
  
    return res.status(400).json({ error: "Invalid request. Only 'is_default' update is supported here." });
  };
  const deladdress= async (req, res) => {
    const userId = req.user.userId;
    const addressId = req.params.addressId;
  
    try {
      const result = await pool.query(
        `DELETE FROM cust_addresses WHERE address_id = $1 AND user_id = $2 RETURNING *`,
        [addressId, userId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Address not found" });
      }
  
      res.json({ message: "Address deleted successfully" });
    } catch (err) {
      console.error("Delete Address Error:", err.message);
      res.status(500).json({ error: "Failed to delete address" });
    }
  };
  // ✅ Set one address as default

  

  module.exports={getalladdress,addaddress,updaddress,deladdress}