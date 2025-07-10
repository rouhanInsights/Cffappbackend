const pool = require('../Db');
const asyncHandler = require('../middlewares/asyncHandler');
const logger = require('../utils/logger');
const path = require('path');

// GET profile
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT user_id, name, phone, email, alt_email, gender, dob, profile_image_url
     FROM cust_users
     WHERE user_id = $1`,
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  logger.info(`🔍 Profile fetched for user ${userId}`);
  res.json(user);
});

// PUT profile with optional image
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    email,
    phone,
    alt_email,
    gender,
    dob,
  } = req.body;

  const profileImagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const result = await pool.query(
    `UPDATE cust_users
     SET 
       name = COALESCE($1, name),
       email = COALESCE($2, email),
       phone = COALESCE($3, phone),
       alt_email = $4,
       gender = $5,
       dob = $6,
       profile_image_url = COALESCE($7, profile_image_url)
     WHERE user_id = $8
     RETURNING user_id, name, phone, email, alt_email, gender, dob, profile_image_url`,
    [name, email, phone, alt_email, gender, dob, profileImagePath, userId]
  );

  logger.info(`✅ Profile updated for user ${userId}`);
  res.json({ message: 'Profile updated successfully', user: result.rows[0] });
});

module.exports = {
  getProfile,
  updateProfile,
};
