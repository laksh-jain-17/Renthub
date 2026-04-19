const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const autoCompleteBookings = require('./cron/autoComplete');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

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

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/renthub')
  .then(() => {
    console.log('MongoDB Connected');

    // ✅ Only start cron AFTER DB is ready
    autoCompleteBookings();
    setInterval(autoCompleteBookings, 60 * 60 * 1000);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log('DB Connection Error:', err));
