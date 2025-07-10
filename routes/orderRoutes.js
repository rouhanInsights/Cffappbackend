const express = require('express');
const router = express.Router();
const { placeOrder, getUserOrders, getOrderById, getOrderInvoice } = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Secure routes
router.post('/', verifyToken, placeOrder);                     // Place new order
router.get('/my-orders', verifyToken, getUserOrders);          // Get all orders for logged-in user
router.get('/:id', verifyToken, getOrderById);                 // Get one specific order
router.get('/:id/invoice', verifyToken, getOrderInvoice);      // Download invoice

module.exports = router;
