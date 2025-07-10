const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const { recordPayment, createPaymentOrder } = require("../controllers/paymentController");

router.post("/create-order", verifyToken, createPaymentOrder);
router.post("/", verifyToken, recordPayment); // ✅ protect this route

module.exports = router;
