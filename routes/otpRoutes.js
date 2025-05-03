const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp,details } = require('../controllers/otpController');
const {verifyToken} = require('../middlewares/authMiddleware');

// router.post('/', verifyToken, placeOrder);
// router.get('/:userId', verifyToken, getUserOrders);

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get("/details",  verifyToken ,details);

module.exports = router;