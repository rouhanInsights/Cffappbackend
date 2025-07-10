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
  const addaddress = async (req, res) => {
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
      floor_no,
      landmark,
      is_default = false,
    } = req.body;
  
    try {
      if (is_default) {
        await pool.query(`UPDATE cust_addresses SET is_default = false WHERE user_id = $1`, [userId]);
      }
  
      const result = await pool.query(
        `INSERT INTO cust_addresses 
          (user_id, name, phone, address_line1, address_line2, city, state, pincode, floor_no, landmark, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [userId, name, phone, address_line1, address_line2, city, state, pincode, floor_no, landmark, is_default]
      );
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Add Address Error:", err.message);
      res.status(500).json({ error: "Failed to save address" });
    }
  };
  
  const editaddress = async (req, res) => {
  const userId = req.user.userId;
  const addressId = req.params.id;
  const {
    name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pincode,
    is_default = false,
    floor_no,
    landmark,
  } = req.body;

  try {
    

    const result = await pool.query(
      `UPDATE cust_addresses SET
        name = $1,
        phone = $2,
        address_line1 = $3,
        address_line2 = $4,
        city = $5,
        state = $6,
        pincode = $7,
        is_default = $8,
        floor_no = $9,
        landmark = $10
      WHERE address_id = $11 AND user_id = $12
      RETURNING *`,
      [
        name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        is_default,
        floor_no,
        landmark,
        addressId,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: "Unauthorized edit attempt" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Edit Address Error:", err.message);
    res.status(500).json({ error: "Failed to update address" });
  }
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
const setDefaultAddress = async (req, res) => {
  const userId = req.user.userId;
  const addressId = req.params.addressId;

  try {
    // Step 1: Unset all other default addresses
    await pool.query(
      `UPDATE cust_addresses SET is_default = false WHERE user_id = $1`,
      [userId]
    );

    // Step 2: Set selected address as default
    const result = await pool.query(
      `UPDATE cust_addresses SET is_default = true 
       WHERE address_id = $1 AND user_id = $2
       RETURNING *`,
      [addressId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Address not found or unauthorized" });
    }

    res.json({ message: "Default address updated", address: result.rows[0] });
  } catch (err) {
    console.error("Set Default Error:", err.message);
    res.status(500).json({ error: "Failed to set default address" });
  }
};

  

  module.exports={getalladdress,addaddress,editaddress,deladdress,setDefaultAddress}