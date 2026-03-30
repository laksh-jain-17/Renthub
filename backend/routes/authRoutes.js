const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lakshjain1705@gmail.com';
const ADMIN_PASSWORD = 'Laksh#1234';

// ─── REGISTER ───────────────────────────────────────────────
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

// ─── LOGIN ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase();

    // Admin direct login (no OTP)
    if (cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: 'admin', email: cleanEmail, roles: ['admin'] },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        token,
        user: { id: 'admin', email: cleanEmail, name: 'Admin', roles: ['admin'] }
      });
    }

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

// ─── FORGOT PASSWORD (STEP 1) ────────────────────────────────
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

// ─── RESET PASSWORD (STEP 2) ─────────────────────────────────
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
