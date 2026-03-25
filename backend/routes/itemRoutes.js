const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Booking = require('../models/Booking');
const { authenticateToken } = require('../middleware/auth');
const { getItemRecommendations } = require('../utils/recommendationSystem');

const { upload, saveFileLocally } = require('../middleware/upload');

router.post('/add', authenticateToken, upload.single('image'), saveFileLocally, async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.localUrl : null;
    const newItem = new Item({
      owner: req.body.owner,
      title: req.body.title,
      category: req.body.category,
      pricePerDay: req.body.pricePerDay,
      description: req.body.description,
      images: imageUrl ? [imageUrl] : [],
      rating: 4.5 + Math.random() * 0.5
    });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
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
    const recommendations = await getItemRecommendations(
      req.params.userId,
      Booking,
      Item
    );
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
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
