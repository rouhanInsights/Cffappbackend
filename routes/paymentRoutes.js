const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const { recordPayment } = require("../controllers/paymentController");

router.post("/", verifyToken, recordPayment);

module.exports = router;
