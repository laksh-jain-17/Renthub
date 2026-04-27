const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
require('dotenv').config();
const autoCompleteBookings = require('./cron/autoComplete');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());

// ❌ REMOVED: app.use('/uploads', express.static('uploads'));
// Images are now stored on Cloudinary — never on local disk.
// Render's filesystem is ephemeral; local uploads vanish on every deploy.

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

// ── Seed admin user ────────────────────────────────────────────────────────────
const User = require('./models/User');

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass  = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPass) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed');
    return;
  }

  const existing = await User.findOne({ email: adminEmail });

  if (!existing) {
    const hashed = await bcrypt.hash(adminPass, 10);
    await User.create({
      name:          'Admin',
      email:         adminEmail,
      password:      hashed,
      roles:         ['admin'],
      emailVerified: true,
    });
    console.log('✅ Admin user seeded to DB');
  } else if (!existing.roles?.includes('admin')) {
    existing.roles = ['admin'];
    existing.emailVerified = true;
    await existing.save();
    console.log('✅ Admin user roles updated');
  } else {
    console.log('✅ Admin user already exists in DB');
  }
};

// ── Start server ───────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/renthub')
  .then(async () => {
    console.log('MongoDB Connected');
    await seedAdmin();
    autoCompleteBookings();
    setInterval(autoCompleteBookings, 60 * 60 * 1000);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log('DB Connection Error:', err));
