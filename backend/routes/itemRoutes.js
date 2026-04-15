// backend/routes/itemRoutes.js
// Only change: removed `rating: 4.5 + Math.random() * 0.5` from the /add route
// Rating now starts at 0 and gets updated by the review system

const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Booking = require('../models/Booking');
const { authenticateToken } = require('../middleware/auth');
const { getItemRecommendations } = require('../utils/recommendationSystem');

const { upload, uploadToCloudinary, cloudinary } = require('../middleware/upload');

router.post('/add', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = null;

    // Upload to Cloudinary if image was provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url; // ✅ permanent HTTPS Cloudinary URL
    }

    const newItem = new Item({
      owner:       req.body.owner,
      title:       req.body.title,
      category:    req.body.category,
      pricePerDay: req.body.pricePerDay,
      description: req.body.description,
      images:      imageUrl ? [imageUrl] : [],
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);

  } catch (err) {
    console.error('Add item error:', err);
    res.status(400).json({ message: err.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const items = await Item.find({ available: true }).populate('owner', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const recommendations = await getItemRecommendations(req.params.userId, Booking, Item);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/owner/:ownerId', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.params.ownerId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email phone');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Clean up Cloudinary image
    if (item.images && item.images.length > 0) {
      const url = item.images[0];
      // Extract public_id: everything after /upload/ and before the extension
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/);
      if (match) {
        await cloudinary.uploader.destroy(match[1]);
      }
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
