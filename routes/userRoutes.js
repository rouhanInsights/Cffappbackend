const express = require('express');
const router = express.Router();
const {getProfile,updateProfile} = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// router.post('/register', registerUser);
// router.post('/login', loginUser);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);




module.exports = router;