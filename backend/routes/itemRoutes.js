const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// GET /api/items/all — fetch all available items
router.get('/all', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search)   filter.title = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    const items = await Item.find(filter).populate('owner', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/items/my — items listed by logged-in user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user.id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/items/:id — single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/items — create new item listing
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, category, pricePerDay, location } = req.body;
    const images = req.files?.map(f => `/uploads/${f.filename}`) || [];

    const item = new Item({
      title, description, category,
      pricePerDay: Number(pricePerDay),
      location, images,
      owner: req.user.id,
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/items/:id — update item
router.put('/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const updates = req.body;
    if (req.files?.length) updates.images = req.files.map(f => `/uploads/${f.filename}`);

    const updated = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/items/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
