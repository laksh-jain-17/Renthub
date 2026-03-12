const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['camera', 'gaming', 'gym', 'camping']
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 5.0
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Item', itemSchema);
