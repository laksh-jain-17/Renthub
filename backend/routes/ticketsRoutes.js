const express = require('express');
const router  = express.Router();
const Ticket  = require('../models/Ticket');
const { protect } = require('../middleware/authMiddleware'); // adjust path if different

// POST /api/tickets — create a new ticket
router.post('/', protect, async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    const ticket = await Ticket.create({
      user:     req.user._id,
      subject,
      message,
      category,
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets — get tickets for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/:id — get single ticket
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tickets/:id — update ticket status (admin)
router.patch('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
