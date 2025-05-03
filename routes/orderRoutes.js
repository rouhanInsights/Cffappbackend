const express = require('express');
const router = express.Router();
const { placeOrder, getUserOrders } = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/my-orders', verifyToken, getUserOrders);

router.post('/',verifyToken, placeOrder);           // Place order
router.get('/:userId', verifyToken,getUserOrders);  // Get all orders by user

module.exports = router;
