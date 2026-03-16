const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lakshjain1705@gmail.com';
const ADMIN_PASSWORD = 'Laksh#1234';

// Store OTPs temporarily in memory { email: { otp, expiresAt } }
const otpStore = {};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── REGISTER ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
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

// ─── LOGIN ───────────────────────────────────────────────────
// For normal users: returns token immediately
// For admin: returns { requiresOTP: true }, then OTP is sent to email
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin check
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const otp = generateOTP();
      otpStore[email] = {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      };

      await transporter.sendMail({
        from: `"Renthub Admin" <${process.env.EMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: 'Your Renthub Admin OTP',
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:30px;border-radius:10px;border:1px solid #eee;">
            <h2 style="color:#32be8f;">Renthub Admin Login</h2>
            <p>Your one-time password is:</p>
            <h1 style="letter-spacing:8px;color:#333;">${otp}</h1>
            <p style="color:#999;font-size:0.85rem;">Expires in 5 minutes. Do not share this with anyone.</p>
          </div>
        `
      });

      return res.json({ requiresOTP: true, message: 'OTP sent to admin email' });
    }

    // Normal user
    const user = await User.findOne({ email });
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
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: user.roles
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── VERIFY ADMIN OTP ────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ message: 'OTP not found. Please login again.' });
    }
    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP correct — clear it and issue token
    delete otpStore[email];

    const token = jwt.sign(
      { id: 'admin', email, roles: ['admin'] },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: 'admin',
        email,
        name: 'Admin',
        roles: ['admin']
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }
    res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── RESET PASSWORD ──────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
