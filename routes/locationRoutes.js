// routes/locationRoutes.js
const express = require("express");
const router = express.Router();
const { validatePincode } = require("../controllers/locationController");

// Public endpoint to check delivery availability
router.get("/validate/:pincode", validatePincode);

module.exports = router;
