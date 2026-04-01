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
  // CHANGE 1: Set default to 0.0 so it starts empty
  rating: {
    type: Number,
    default: 0.0 
  },
  // CHANGE 2: Add this to track the count of reviews
  numReviews: {
    type: Number,
    default: 0
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
