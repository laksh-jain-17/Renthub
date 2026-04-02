const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendOtpEmail = require('../utils/sendOtpEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // ✅ moved out of code into .env

// ── OTP helpers ───────────────────────────────────────────────────────────────
const generateOtp = () => String(crypto.randomInt(100000, 999999));
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// In-memory OTP store for admin (no DB needed since there's only one admin)
// { hashedOtp, expiry }
let adminOtpStore = null;

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;
    const cleanEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email: cleanEmail,
      password: hashedPassword,
      gender: gender || 'prefer-not-to-say',
      roles: ['buyer', 'seller']
    });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase();

    // ✅ Admin login — verify credentials then send OTP (no direct token)
    if (cleanEmail === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate OTP, hash it, store in memory with 10 min expiry
      const otp = generateOtp();
      adminOtpStore = {
        hashedOtp: hashOtp(otp),
        expiry: new Date(Date.now() + 10 * 60 * 1000)
      };

      await sendOtpEmail(ADMIN_EMAIL, otp);

      // Tell frontend to show OTP step — no token yet
      return res.json({ success: true, requiresOTP: true });
    }

    // Normal user login
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, roles: user.roles }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── VERIFY ADMIN OTP ──────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return res.status(403).json({ message: 'OTP verification is for admin only' });
    }

    // Check OTP exists and not expired
    if (!adminOtpStore || new Date() > adminOtpStore.expiry) {
      adminOtpStore = null;
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }

    // Check OTP matches
    if (hashOtp(otp) !== adminOtpStore.hashedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ OTP correct — clear it so it can't be reused
    adminOtpStore = null;

    // Issue admin token
    const token = jwt.sign(
      { id: 'admin', email: ADMIN_EMAIL, roles: ['admin'] },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin', roles: ['admin'] }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── FORGOT PASSWORD (STEP 1) ──────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });
    res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── RESET PASSWORD (STEP 2) ───────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
