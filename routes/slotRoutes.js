const express = require('express');
const router = express.Router();
const pool = require('../Db');

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT slot_id, slot_details FROM cust_slot_details");
    res.json(result.rows); // [{ slot_id: 1, slot_details: "8am-10am}],...]
  } catch (err) {
    console.error("Slot fetch error:", err);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

module.exports = router;
