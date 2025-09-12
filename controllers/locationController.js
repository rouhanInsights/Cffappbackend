// controllers/locationController.js
const pool = require("../Db");

// ✅ Validate a pincode and get location info
const validatePincode = async (req, res) => {
  const { pincode } = req.params;

  if (!pincode) {
    return res.status(400).json({ error: "Pincode is required" });
  }

  try {
    const result = await pool.query(
      `SELECT location_id, area_name, is_serviceable
       FROM location_pincodes
       WHERE pincode = $1
       LIMIT 1`,
      [pincode]
    );

    if (result.rowCount === 0) {
      return res.json({ is_serviceable: false });
    }

    const { location_id, area_name, is_serviceable } = result.rows[0];
    res.json({ location_id, area_name, is_serviceable });
  } catch (err) {
    console.error("Pincode validation error:", err.message);
    res.status(500).json({ error: "Failed to validate pincode" });
  }
};

// 🔁 Helper function to fetch location_id from pincode
const getLocationIdByPincode = async (pincode) => {
  try {
    const result = await pool.query(
      `SELECT location_id FROM location_pincodes WHERE pincode = $1 AND is_serviceable = TRUE LIMIT 1`,
      [pincode]
    );
    return result.rowCount ? result.rows[0].location_id : null;
  } catch (err) {
    console.error("Error in getLocationIdByPincode:", err.message);
    return null;
  }
};

module.exports = {
  validatePincode,
  getLocationIdByPincode
};
