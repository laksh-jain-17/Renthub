const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');

// ── POST /api/reviews — submit a review ──────────────────────────────────────
// Only allowed if:
// 1. User has a completed booking for this item
// 2. They haven't already reviewed this booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { itemId, bookingId, rating, comment } = req.body;

    if (!itemId || !bookingId || !rating) {
      return res.status(400).json({ message: 'itemId, bookingId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify booking belongs to this user and is for this item
    const booking = await Booking.findOne({
      _id: bookingId,
      item: itemId,
      renter: req.user.id,
      status: 'completed'
    });

    if (!booking) {
      return res.status(403).json({ message: 'You can only review items from completed bookings' });
    }

    // Check not already reviewed
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    // Save review
    const review = new Review({
      item: itemId,
      user: req.user.id,
      booking: bookingId,
      rating,
      comment: comment || ''
    });
    await review.save();

    // Recalculate item's average rating
    const allReviews = await Review.find({ item: itemId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Item.findByIdAndUpdate(itemId, {
      rating: Math.round(avgRating * 10) / 10, // round to 1 decimal
      numReviews: allReviews.length
    });

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }
    console.error('Review error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/reviews/:itemId — get all reviews for an item ───────────────────
router.get('/:itemId', async (req, res) => {
  try {
    const reviews = await Review.find({ item: req.params.itemId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/reviews/can-review/:bookingId — check if user can review ────────
router.get('/can-review/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      renter: req.user.id,
      status: 'completed'
    });
    if (!booking) return res.json({ canReview: false });

    const existing = await Review.findOne({ booking: req.params.bookingId });
    res.json({ canReview: !existing, itemId: booking.item });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
