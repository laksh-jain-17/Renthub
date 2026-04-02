const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  roles: { type: [String], default: ['buyer'] },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },

  // ✅ OTP fields for forgot password
  resetOtp:       { type: String, default: null },
  resetOtpExpiry: { type: Date,   default: null },
});

module.exports = mongoose.model('User', userSchema);
