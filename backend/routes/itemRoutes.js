const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Email helpers ─────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
  } catch (err) {
    // Never crash the API because of email failure
    console.error('[Email] Failed to send:', err.message);
  }
};

// Email: sent to owner when someone books their item
const emailOwnerNewBooking = async ({ ownerEmail, ownerName, renterName, itemTitle, startDate, endDate, totalPrice }) => {
  await sendEmail({
    to: ownerEmail,
    subject: `New booking request for "${itemTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#32be8f;margin-bottom:8px">New Rental Request</h2>
        <p style="color:#555">Hi <strong>${ownerName}</strong>, you have a new booking request on RentHub.</p>
        <div style="background:#f8f9fa;border-radius:8px;padding:18px;margin:20px 0">
          <p style="margin:4px 0;color:#333"><strong>Item:</strong> ${itemTitle}</p>
          <p style="margin:4px 0;color:#333"><strong>Renter:</strong> ${renterName}</p>
          <p style="margin:4px 0;color:#333"><strong>From:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p style="margin:4px 0;color:#333"><strong>To:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          <p style="margin:4px 0;color:#32be8f;font-size:1.1rem"><strong>Total: ₹${totalPrice}</strong></p>
        </div>
        <p style="color:#555">Please log in to <strong>RentHub</strong> to accept or reject this request.</p>
        <p style="color:#aaa;font-size:0.8rem;margin-top:24px">— The RentHub Team</p>
      </div>
    `
  });
};

// Email: sent to renter when owner accepts
const emailRenterAccepted = async ({ renterEmail, renterName, itemTitle, startDate, endDate, totalPrice }) => {
  await sendEmail({
    to: renterEmail,
    subject: `Your booking for "${itemTitle}" has been accepted!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#32be8f;margin-bottom:8px">Booking Accepted ✓</h2>
        <p style="color:#555">Hi <strong>${renterName}</strong>, great news! Your booking has been confirmed.</p>
        <div style="background:#f8f9fa;border-radius:8px;padding:18px;margin:20px 0">
          <p style="margin:4px 0;color:#333"><strong>Item:</strong> ${itemTitle}</p>
          <p style="margin:4px 0;color:#333"><strong>From:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p style="margin:4px 0;color:#333"><strong>To:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          <p style="margin:4px 0;color:#32be8f;font-size:1.1rem"><strong>Total: ₹${totalPrice}</strong></p>
        </div>
        <p style="color:#555">Enjoy your rental! You can view your booking in the <strong>My Bookings</strong> section on RentHub.</p>
        <p style="color:#aaa;font-size:0.8rem;margin-top:24px">— The RentHub Team</p>
      </div>
    `
  });
};

// Email: sent to renter when owner rejects
const emailRenterRejected = async ({ renterEmail, renterName, itemTitle }) => {
  await sendEmail({
    to: renterEmail,
    subject: `Booking update for "${itemTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#e53e3e;margin-bottom:8px">Booking Not Accepted</h2>
        <p style="color:#555">Hi <strong>${renterName}</strong>, unfortunately the owner was unable to accept your booking for <strong>${itemTitle}</strong>.</p>
        <p style="color:#555">Please browse other available items on RentHub and try again.</p>
        <p style="color:#aaa;font-size:0.8rem;margin-top:24px">— The RentHub Team</p>
      </div>
    `
  });
};

// Email: sent to renter when they cancel
const emailRenterCancelled = async ({ renterEmail, renterName, itemTitle }) => {
  await sendEmail({
    to: renterEmail,
    subject: `Booking cancelled for "${itemTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#f57c00;margin-bottom:8px">Booking Cancelled</h2>
        <p style="color:#555">Hi <strong>${renterName}</strong>, your booking for <strong>${itemTitle}</strong> has been cancelled as requested.</p>
        <p style="color:#555">Browse other available items on RentHub anytime.</p>
        <p style="color:#aaa;font-size:0.8rem;margin-top:24px">— The RentHub Team</p>
      </div>
    `
  });
};

// ── Date conflict helper ───────────────────────────────────────

const hasDateConflict = async (itemId, startDate, endDate, excludeBookingId = null) => {
  const query = {
    item: itemId,
    status: { $in: ['pending', 'active'] },
    $or: [
      { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
    ]
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const conflict = await Booking.findOne(query);
  return !!conflict;
};

// ── Routes ────────────────────────────────────────────────────

// POST /api/bookings/create
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { itemId, startDate, endDate, totalPrice, deliveryAddress, deliveryType, paymentMethod, deliveryCharge } = req.body;

    const item = await Item.findById(itemId).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const conflict = await hasDateConflict(itemId, startDate, endDate);
    if (conflict) return res.status(409).json({ message: 'Item is already booked for these dates' });

    const renter = await User.findById(req.user.id);

    const booking = new Booking({
      item: itemId, renter: req.user.id, owner: item.owner._id,
      startDate, endDate, totalPrice,
      deliveryAddress: deliveryAddress || '',
      deliveryType:    deliveryType    || 'standard',
      paymentMethod:   paymentMethod   || 'card',
      deliveryCharge:  deliveryCharge  || 50,
      status: 'pending',
    });
    await booking.save();

    // ✅ Notify owner of new booking request
    await emailOwnerNewBooking({
      ownerEmail:  item.owner.email,
      ownerName:   item.owner.name,
      renterName:  renter.name,
      itemTitle:   item.title,
      startDate, endDate, totalPrice,
    });

    res.status(201).json({ success: true, booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/bookings/create-razorpay-order
router.post('/create-razorpay-order', authenticateToken, async (req, res) => {
  try {
    const { itemId, startDate, endDate, totalPrice } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const conflict = await hasDateConflict(itemId, startDate, endDate);
    if (conflict) return res.status(409).json({ message: 'Item is already booked for these dates' });

    const order = await razorpay.orders.create({
      amount:   totalPrice * 100,
      currency: 'INR',
      receipt:  `receipt_${Date.now()}`,
      notes:    { itemId, startDate, endDate }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/bookings/verify-payment
router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, itemId, startDate, endDate, totalPrice } = req.body;

    const sign     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
    if (expected !== razorpay_signature)
      return res.status(400).json({ message: 'Payment verification failed' });

    const item = await Item.findById(itemId).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const conflict = await hasDateConflict(itemId, startDate, endDate);
    if (conflict) return res.status(409).json({ message: 'Item was just booked by someone else. Please contact support for a refund.' });

    const renter = await User.findById(req.user.id);

    const booking = new Booking({
      item: itemId, renter: req.user.id, owner: item.owner._id,
      startDate, endDate, totalPrice,
      status: 'active',
      paymentId: razorpay_payment_id,
    });
    await booking.save();

    // ✅ Notify owner of paid booking
    await emailOwnerNewBooking({
      ownerEmail:  item.owner.email,
      ownerName:   item.owner.name,
      renterName:  renter.name,
      itemTitle:   item.title,
      startDate, endDate, totalPrice,
    });

    res.status(201).json({ success: true, booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/bookings/:id/status — owner accepts or rejects, renter cancels
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'cancelled', 'completed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const booking = await Booking.findById(req.params.id)
      .populate('item',   'title')
      .populate('renter', 'name email')
      .populate('owner',  'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner  = booking.owner._id.toString()  === req.user.id;
    const isRenter = booking.renter._id.toString() === req.user.id;

    // Owner can accept/reject, renter can only cancel their own pending booking
    if (status === 'cancelled' && isRenter) {
      booking.status = 'cancelled';
      await booking.save();

      // ✅ Confirm cancellation to renter
      await emailRenterCancelled({
        renterEmail: booking.renter.email,
        renterName:  booking.renter.name,
        itemTitle:   booking.item.title,
      });

      return res.json({ success: true, booking });
    }

    if (!isOwner) return res.status(403).json({ message: 'Not authorized' });

    booking.status = status;
    await booking.save();

    // ✅ Notify renter of accept or reject
    if (status === 'active') {
      await emailRenterAccepted({
        renterEmail: booking.renter.email,
        renterName:  booking.renter.name,
        itemTitle:   booking.item.title,
        startDate:   booking.startDate,
        endDate:     booking.endDate,
        totalPrice:  booking.totalPrice,
      });
    } else if (status === 'cancelled') {
      await emailRenterRejected({
        renterEmail: booking.renter.email,
        renterName:  booking.renter.name,
        itemTitle:   booking.item.title,
      });
    }

    res.json({ success: true, booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/bookings/item/:itemId
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
