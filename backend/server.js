const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const autoCompleteBookings = require('./cron/autoComplete');
require('dotenv').config();

const app = express();

// ✅ CORS FIRST — before everything
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Handle preflight for ALL routes
app.options('*', cors());

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Run once on startup, then every hour
autoCompleteBookings();
setInterval(autoCompleteBookings, 60 * 60 * 1000);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/renthub')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('DB Connection Error:', err));

const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const itemRoutes    = require('./routes/itemRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const reviewRoutes  = require('./routes/reviewRoutes');

app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/items',    itemRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/reviews',  reviewRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
