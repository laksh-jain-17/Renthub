const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendOtpEmail = require('../utils/sendOtpEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const generateOtp = () => String(crypto.randomInt(100000, 999999));
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

let adminOtpStore = null;

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;
    const cleanEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email: cleanEmail, password: hashedPassword, gender: gender || 'prefer-not-to-say', roles: ['buyer', 'seller'] });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase();

    if (cleanEmail === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) return res.status(400).json({ message: 'Invalid credentials' });
      const otp = generateOtp();
      adminOtpStore = { hashedOtp: hashOtp(otp), expiry: new Date(Date.now() + 10 * 60 * 1000) };
      await sendOtpEmail(ADMIN_EMAIL, otp);
      return res.json({ success: true, requiresOTP: true });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email, roles: user.roles }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, email: user.email, name: user.name, roles: user.roles } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// VERIFY ADMIN LOGIN OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    if (email.toLowerCase() !== ADMIN_EMAIL) return res.status(403).json({ message: 'OTP verification is for admin only' });
    if (!adminOtpStore || new Date() > adminOtpStore.expiry) { adminOtpStore = null; return res.status(400).json({ message: 'OTP expired. Please login again.' }); }
    if (hashOtp(otp) !== adminOtpStore.hashedOtp) return res.status(400).json({ message: 'Invalid OTP' });
    adminOtpStore = null;
    const token = jwt.sign({ id: 'admin', email: ADMIN_EMAIL, roles: ['admin'] }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin', roles: ['admin'] } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FORGOT PASSWORD — Step 1: Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      const otp = generateOtp();
      user.resetOtp = hashOtp(otp);
      user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(cleanEmail, otp);
    }
    res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FORGOT PASSWORD — Step 2: Verify OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    const user = await User.findOne({ email: email.toLowerCase(), resetOtp: hashOtp(otp), resetOtpExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });
    const resetSessionToken = jwt.sign({ id: user._id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '5m' });
    return res.json({ success: true, resetSessionToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FORGOT PASSWORD — Step 3: Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetSessionToken, newPassword } = req.body;
    if (!resetSessionToken || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    let payload;
    try { payload = jwt.verify(resetSessionToken, JWT_SECRET); } catch { return res.status(400).json({ message: 'Reset session expired. Please start over.' }); }
    if (payload.purpose !== 'password-reset') return res.status(400).json({ message: 'Invalid token.' });
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
