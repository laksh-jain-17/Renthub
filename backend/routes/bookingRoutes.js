const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');

// POST /api/bookings/create — called by Checkout.jsx
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      itemId,
      startDate,
      endDate,
      totalPrice,
      deliveryAddress,
      deliveryType,
      paymentMethod,
      deliveryCharge
    } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const booking = new Booking({
      item: itemId,
      renter: req.user.id,
      owner: item.owner,
      startDate,
      endDate,
      totalPrice,
      deliveryAddress: deliveryAddress || '',
      deliveryType: deliveryType || 'standard',
      paymentMethod: paymentMethod || 'card',
      deliveryCharge: deliveryCharge || 50,
      status: 'active',
      paymentId: `PAY-${Date.now()}`
    });

    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings/create-checkout — called by ProductDetail.jsx
router.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { itemId, startDate, endDate, totalPrice } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const booking = new Booking({
      item: itemId,
      renter: req.user.id,
      owner: item.owner,
      startDate,
      endDate,
      totalPrice,
      status: 'active',
      paymentId: `PAY-${Date.now()}`
    });

    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/user/:userId — My Bookings + Payments tabs
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.params.userId })
      .populate('item', 'title category images pricePerDay')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/owner/:userId — Rental Requests + Earnings tabs
router.get('/owner/:userId', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.params.userId })
      .populate('item', 'title category images pricePerDay')
      .populate('renter', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
