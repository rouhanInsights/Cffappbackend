const express = require('express');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const feedbackRoutes = require("./routes/feedbackRoutes");
const locationRoutes=require("./routes/locationRoutes");
const errorHandler = require('./middlewares/errorHandler');
const pool=require('./Db')

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later.',
}));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/users/addresses', require('./routes/addressRoutes'));
app.use("/api/feedback", feedbackRoutes);
app.use("/api/location", locationRoutes);
// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running ✅' });
});
app.get('/api/health/db', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
// Global error handler (MUST be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
