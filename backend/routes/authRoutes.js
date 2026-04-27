const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const { sendOtpEmail, sendRegistrationOtpEmail } = require('../utils/sendOtpEmail');
const { JWT_SECRET, ACCESS_TOKEN_EXPIRY, RESET_TOKEN_EXPIRY } = require('../config/jwt');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Helpers
const generateOtp = () => String(crypto.randomInt(100000, 999999));
const hashOtp     = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const signAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

const signResetToken = (payload) =>
  jwt.sign({ ...payload, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRY });

let adminOtpStore = null;

// ── REGISTER — Step 1: validate, save unverified user, send OTP ───────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const cleanEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser && existingUser.emailVerified)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    if (existingUser && !existingUser.emailVerified) {
      // Resend OTP to user who registered but never verified
      existingUser.password        = hashedPassword;
      existingUser.verifyOtp       = hashOtp(otp);
      existingUser.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await existingUser.save();
    } else {
      const newUser = new User({
        name,
        email:           cleanEmail,
        password:        hashedPassword,
        gender:          gender || 'prefer-not-to-say',
        roles:           ['buyer', 'seller'],
        emailVerified:   false,
        verifyOtp:       hashOtp(otp),
        verifyOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
      await newUser.save();
    }

    try {
      await sendRegistrationOtpEmail(cleanEmail, otp);
    } catch (mailErr) {
      console.error('Registration OTP email failed:', mailErr.message);
      return res.status(500).json({ message: `OTP email failed: ${mailErr.message}` });
    }

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      requiresVerification: true,
      email: cleanEmail,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── REGISTER — Step 2: verify OTP and activate account ───────────────────────

router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'email and otp are required' });

    const user = await User.findOne({
      email:           email.toLowerCase(),
      verifyOtp:       hashOtp(otp),
      verifyOtpExpiry: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.emailVerified   = true;
    user.verifyOtp       = null;
    user.verifyOtpExpiry = null;
    await user.save();

    const token = signAccessToken({ id: user._id, email: user.email, roles: user.roles });

    res.json({
      success: true,
      message: 'Email verified! Account created successfully.',
      token,
      user: { id: user._id, email: user.email, name: user.name, roles: user.roles },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── REGISTER — Step 3 (optional): resend registration OTP ────────────────────

router.post('/resend-verification-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const user = await User.findOne({ email: email.toLowerCase(), emailVerified: false });
    if (!user)
      return res.json({ success: true, message: 'If that email is pending verification, a new OTP has been sent.' });

    const otp = generateOtp();
    user.verifyOtp       = hashOtp(otp);
    user.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    try {
      await sendRegistrationOtpEmail(email.toLowerCase(), otp);
    } catch (mailErr) {
      console.error('Resend registration OTP failed:', mailErr.message);
      return res.status(500).json({ message: `OTP email failed: ${mailErr.message}` });
    }

    res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const cleanEmail = email.toLowerCase();

    // Admin path
    // Admin path
if (cleanEmail === ADMIN_EMAIL) {
  if (password !== ADMIN_PASSWORD)
    return res.status(400).json({ message: 'Invalid credentials' });
  const otp = generateOtp();
  adminOtpStore = { hashedOtp: hashOtp(otp), expiry: new Date(Date.now() + 10 * 60 * 1000) };
  try {
    await sendOtpEmail(ADMIN_EMAIL, otp);
  } catch (mailErr) {
    console.error('Admin OTP email failed:', mailErr.message);
    return res.status(500).json({ message: `OTP email failed: ${mailErr.message}` });
  }
  return res.json({ success: true, requiresOTP: true });
}

    // Normal user path
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Block unverified accounts
    if (user.emailVerified === false) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: cleanEmail,
      });
    }

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
    if (email.toLowerCase() !== ADMIN_EMAIL)
      return res.status(403).json({ message: 'OTP verification is for admin only' });
    if (!adminOtpStore || new Date() > adminOtpStore.expiry) {
      adminOtpStore = null;
      return res.status(400).json({ message: 'OTP expired — please log in again' });
    }
    if (hashOtp(otp) !== adminOtpStore.hashedOtp)
      return res.status(400).json({ message: 'Invalid OTP' });

    adminOtpStore = null;

    // ✅ FIX: fetch real admin user from DB to get the actual MongoDB _id
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminUser)
      return res.status(404).json({ message: 'Admin user not found in database' });

    const token = signAccessToken({
      id:    adminUser._id,
      email: ADMIN_EMAIL,
      roles: ['admin']
    });

    return res.json({
      success: true,
      token,
      user: {
        id:    adminUser._id,
        email: ADMIN_EMAIL,
        name:  adminUser.name || 'Admin',
        roles: ['admin']
      },
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
      email:          email.toLowerCase(),
      resetOtp:       hashOtp(otp),
      resetOtpExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

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
    if (!resetSessionToken || !newPassword)
      return res.status(400).json({ message: 'resetSessionToken and newPassword are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    let payload;
    try {
      payload = jwt.verify(resetSessionToken, JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Reset session expired — please start over' });
    }

    if (payload.purpose !== 'password-reset')
      return res.status(400).json({ message: 'Invalid token type' });

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

// ── VERIFY TOKEN ──────────────────────────────────────────────────────────────

router.get('/verify-token', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose === 'password-reset')
      return res.status(403).json({ valid: false, message: 'Invalid token type' });
    res.json({ valid: true, user: { id: decoded.id, email: decoded.email, roles: decoded.roles } });
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ valid: false, expired: true, message: 'Token expired' });
    res.status(403).json({ valid: false, message: 'Invalid token' });
  }
});

// ── GOOGLE AUTH ───────────────────────────────────────────────────────────────

// ── GOOGLE AUTH ───────────────────────────────────────────────────────────────

router.post('/google', async (req, res) => {
  try {
    const { name, email, googleId } = req.body;
    if (!email || !googleId)
      return res.status(400).json({ message: 'email and googleId are required' });

    const cleanEmail = email.toLowerCase();

    // ✅ Block admin from using Google sign-in
    if (cleanEmail === ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Admin must log in with email and password.' });
    }

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const hashedPassword = await bcrypt.hash(googleId + process.env.JWT_SECRET, 12);
      user = new User({
        name:          name || cleanEmail.split('@')[0],
        email:         cleanEmail,
        password:      hashedPassword,
        googleId,
        roles:         ['buyer', 'seller'],
        emailVerified: true,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = signAccessToken({ id: user._id, email: user.email, roles: user.roles });
    return res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, roles: user.roles },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ message: 'Google sign-in failed' });
  }
});
module.exports = router;
