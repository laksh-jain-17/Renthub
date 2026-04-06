// backend/routes/authRoutes.js

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const sendOtpEmail = require('../utils/sendOtpEmail');
const { JWT_SECRET, ACCESS_TOKEN_EXPIRY, RESET_TOKEN_EXPIRY } = require('../config/jwt');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ── Helpers ────────────────────────────────────────────────────────────────────

const generateOtp = () => String(crypto.randomInt(100000, 999999));
const hashOtp     = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

/** Build a signed JWT for a regular user or admin session */
const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

/** Build a short-lived JWT for the password-reset flow */
const signResetToken = (payload) =>
  jwt.sign({ ...payload, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRY });

// In-memory OTP store for admin (single-admin setup)
let adminOtpStore = null;

// ── REGISTER ──────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email: cleanEmail,
      password: hashedPassword,
      gender: gender || 'prefer-not-to-say',
      roles: ['buyer', 'seller'],
    });
    await newUser.save();

    // Issue a token immediately on registration so the client can log in right away
    const token = signAccessToken({ id: newUser._id, email: newUser.email, roles: newUser.roles });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, email: newUser.email, name: newUser.name, roles: newUser.roles },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const cleanEmail = email.toLowerCase();

    // ── Admin path: send OTP instead of returning a token directly ──
    if (cleanEmail === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const otp = generateOtp();
      adminOtpStore = { hashedOtp: hashOtp(otp), expiry: new Date(Date.now() + 10 * 60 * 1000) };
      await sendOtpEmail(ADMIN_EMAIL, otp);
      return res.json({ success: true, requiresOTP: true });
    }

    // ── Normal user path ──
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signAccessToken({ id: user._id, email: user.email, roles: user.roles });

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, roles: user.roles },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── VERIFY ADMIN OTP ──────────────────────────────────────────────────────────

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'email and otp are required' });
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return res.status(403).json({ message: 'OTP verification is for admin only' });
    }
    if (!adminOtpStore || new Date() > adminOtpStore.expiry) {
      adminOtpStore = null;
      return res.status(400).json({ message: 'OTP expired — please log in again' });
    }
    if (hashOtp(otp) !== adminOtpStore.hashedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    adminOtpStore = null; // one-time use

    const token = signAccessToken({ id: 'admin', email: ADMIN_EMAIL, roles: ['admin'] });
    return res.json({
      success: true,
      token,
      user: { id: 'admin', email: ADMIN_EMAIL, name: 'Admin', roles: ['admin'] },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── FORGOT PASSWORD — Step 1: Send OTP ───────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const cleanEmail = email.toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      const otp = generateOtp();
      user.resetOtp       = hashOtp(otp);
      user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(cleanEmail, otp);
    }
    // Always return the same message to prevent email enumeration
    res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── FORGOT PASSWORD — Step 2: Verify OTP ─────────────────────────────────────

router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'email and otp are required' });

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetOtp: hashOtp(otp),
      resetOtpExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    // Issue a short-lived, purpose-scoped token for the reset step
    const resetSessionToken = signResetToken({ id: user._id });
    return res.json({ success: true, resetSessionToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── FORGOT PASSWORD — Step 3: Reset Password ─────────────────────────────────

router.post('/reset-password', async (req, res) => {
  try {
    const { resetSessionToken, newPassword } = req.body;
    if (!resetSessionToken || !newPassword) {
      return res.status(400).json({ message: 'resetSessionToken and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    let payload;
    try {
      payload = jwt.verify(resetSessionToken, JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Reset session expired — please start over' });
    }

    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password       = await bcrypt.hash(newPassword, 10);
    user.resetOtp       = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── VERIFY TOKEN (used by frontend to validate a stored token on page load) ──

router.get('/verify-token', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ valid: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose === 'password-reset') {
      return res.status(403).json({ valid: false, message: 'Invalid token type' });
    }
    res.json({ valid: true, user: { id: decoded.id, email: decoded.email, roles: decoded.roles } });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, expired: true, message: 'Token expired' });
    }
    res.status(403).json({ valid: false, message: 'Invalid token' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { name, email, googleId } = req.body;
 
    if (!email || !googleId) {
      return res.status(400).json({ message: 'email and googleId are required' });
    }
 
    const cleanEmail = email.toLowerCase();
    let user = await User.findOne({ email: cleanEmail });
 
    if (!user) {
      // ── New user: create account via Google ─────────────────────────────────
      // Use a strong deterministic hash as the password so the account works
      // even if the user later tries to set a password via forgot-password.
      const hashedPassword = await bcrypt.hash(googleId + process.env.JWT_SECRET, 12);
      user = new User({
        name:     name || cleanEmail.split('@')[0],
        email:    cleanEmail,
        password: hashedPassword,
        googleId,
        roles:    ['buyer', 'seller'],
      });
      await user.save();
    } else if (!user.googleId) {
      // ── Existing email/password user: link their Google account ─────────────
      user.googleId = googleId;
      await user.save();
    }
    // If user.googleId already matches, just proceed (normal sign-in)
 
    const token = signAccessToken({
      id:     user._id,
      email:  user.email,
      roles:  user.roles,
    });
 
    return res.json({
      success: true,
      token,
      user: {
        id:    user._id,
        email: user.email,
        name:  user.name,
        roles: user.roles,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ message: 'Google sign-in failed' });
  }
});

module.exports = router;
