const pool = require('../Db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// GET /api/users/profile
const getProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT user_id, name, email, phone
       FROM cust_users
       WHERE user_id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get Profile Error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { name, email } = req.body;

  try {
    const result = await pool.query(
      `UPDATE cust_users
       SET name = $1, email = $2
       WHERE user_id = $3
       RETURNING user_id, name, email, phone`,
      [name, email, userId]
    );

    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};





module.exports = { getProfile, updateProfile };
