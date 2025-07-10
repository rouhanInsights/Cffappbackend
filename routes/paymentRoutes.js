const express = require("express");
const router = express.Router();
//const { verifyToken } = require("../middlewares/authMiddleware");
const { recordPayment,createPaymentOrder } = require("../controllers/paymentController");

router.post("/", recordPayment);
router.post("/create-order",  createPaymentOrder);
module.exports = router;
