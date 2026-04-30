// backend/routes/wishlistRoutes.js
// Wishlist endpoints — all require authentication.

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Item    = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/wishlist ──────────────────────────────────────────────────────
// Returns the authenticated user's wishlist (populated with item details).
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'wishlist',
        populate: { path: 'owner', select: 'name email' },
      });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/wishlist/:itemId ─────────────────────────────────────────────
// Adds an item to the wishlist (idempotent).
router.post('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Ensure the item actually exists
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only add if not already present
    const alreadyIn = user.wishlist.some(id => id.toString() === itemId);
    if (!alreadyIn) {
      user.wishlist.push(itemId);
      await user.save();
    }

    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/wishlist/:itemId ───────────────────────────────────────────
// Removes an item from the wishlist.
router.delete('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wishlist = user.wishlist.filter(id => id.toString() !== itemId);
    await user.save();

    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
