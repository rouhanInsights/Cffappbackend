const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
} = require('../controllers/userController');
const {
  sendOtp,
  verifyOtp,
} = require('../controllers/otpController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// 🔓 Public Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// 🔐 Protected Routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, upload.single('profile_image'), updateProfile);


module.exports = router;
