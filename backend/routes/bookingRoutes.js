const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/bookings/create — called by Checkout.jsx
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { itemId, startDate, endDate, totalPrice, deliveryAddress, deliveryType, paymentMethod, deliveryCharge } = req.body;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const booking = new Booking({
      item: itemId, renter: req.user.id, owner: item.owner,
      startDate, endDate, totalPrice,
      deliveryAddress: deliveryAddress || '',
      deliveryType:    deliveryType    || 'standard',
      paymentMethod:   paymentMethod   || 'card',
      deliveryCharge:  deliveryCharge  || 50,
      status: 'pending',
    });
    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── RAZORPAY: Step 1 — Create Razorpay order ──────────────────
// POST /api/bookings/create-razorpay-order
router.post('/create-razorpay-order', authenticateToken, async (req, res) => {
  try {
    const { itemId, startDate, endDate, totalPrice } = req.body;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount:   totalPrice * 100,
      currency: 'INR',
      receipt:  `receipt_${Date.now()}`,
      notes:    { itemId, startDate, endDate }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── RAZORPAY: Step 2 — Verify payment & save booking ─────────
// POST /api/bookings/verify-payment
router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, itemId, startDate, endDate, totalPrice } = req.body;

    // Verify signature
    const sign     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
    if (expected !== razorpay_signature)
      return res.status(400).json({ message: 'Payment verification failed' });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Save booking after verified payment
    const booking = new Booking({
      item:      itemId,
      renter:    req.user.id,
      owner:     item.owner,
      startDate, endDate, totalPrice,
      status:    'active',
      paymentId: razorpay_payment_id,
    });
    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── OWNER: Accept or Reject booking ──────────────────────────
// PUT /api/bookings/:id/status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'cancelled'
    if (!['active', 'cancelled', 'completed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only owner can change status
    if (booking.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    booking.status = status;
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/bookings/item/:itemId — booked date ranges for calendar
router.get('/item/:itemId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      item: req.params.itemId,
      status: { $in: ['active', 'confirmed', 'pending'] }
    }).select('startDate endDate -_id');
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/bookings/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.params.userId })
      .populate('item',  'title category images pricePerDay')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/bookings/owner/:userId
router.get('/owner/:userId', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.params.userId })
      .populate('item',   'title category images pricePerDay')
      .populate('renter', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
