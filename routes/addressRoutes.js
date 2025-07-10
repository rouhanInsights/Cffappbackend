const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getalladdress,
  addaddress,
  editaddress,
  deladdress,setDefaultAddress  
} = require('../controllers/addressController');

// 📤 GET all addresses
router.get('/', verifyToken, getalladdress);

// 📥 Add new address
router.post('/', verifyToken, addaddress);

// ✏️ Update address
router.put('/:id', verifyToken, editaddress);

router.put("/:addressId/default", verifyToken, setDefaultAddress);

// ❌ Delete address
router.delete('/:addressId', verifyToken, deladdress);

module.exports = router;
