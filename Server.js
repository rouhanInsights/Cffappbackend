const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./Db');

const app = express();

app.use(cors({ origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"], }));
app.use(express.json());
const userRoutes = require('./routes/userRoutes');

const productRoutes = require('./routes/productRoutes');

const orderRoutes = require('./routes/orderRoutes');
const otpRoutes = require('./routes/otpRoutes');
const adminRoutes=require("./routes/adminproductRoutes")
const slotRoutes = require('./routes/slotRoutes');
app.use('/api/slots', slotRoutes);
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);
const addressRoutes = require('./routes/addressRoutes');
app.use('/api/users/addresses', addressRoutes);



// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running ✅' });
});
// User route
app.use('/api/users', userRoutes);
//Admin route
// app.use("./api/admin",adminRoutes)
// Product route
app.use('/api/products', productRoutes);
// Order route
app.use('/api/orders', orderRoutes);
// Otp route
app.use('/api/users', otpRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});