const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');
const pool = require("../Db");

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  search,
  category,
  relateditems,getBestSellers,getTopOffers
} = require('../controllers/productController');

// PUBLIC ROUTES (order matters!)
router.get('/category', category); // /products/category
router.get('/search', search);     // /products/search
router.get('/related/:category_id/:exclude_id', relateditems); // /products/related/...
router.get("/top-offers", getTopOffers);
router.get("/best-sellers", getBestSellers);

// Must come AFTER the above
router.get('/', getAllProducts);   // /products

// DYNAMIC ROUTES (MUST BE LAST)
router.get('/:id', getProductById); // /products/:id → should always be a number

// ADMIN ROUTES
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
