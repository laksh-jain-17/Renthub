const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // adjust to your auth middleware path

// GET all tickets (admin)
router.get('/', protect, async (req, res) => {
  try {
    // your logic here
    res.json({ tickets: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a ticket
router.post('/', protect, async (req, res) => {
  try {
    // your logic here
    res.status(201).json({ message: 'Ticket created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
