const express = require('express');
const router  = express.Router();
const Item    = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// GET /api/items/all
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
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/items/owner/:userId  ← FIXES the 404
router.get('/owner/:userId', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.params.userId });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/items/my
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user.id });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/items/:id  ← MUST be after all named routes
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/items/add  ← FIXES the 404
router.post('/add', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, category, pricePerDay, description, owner } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const item = new Item({
      title, category,
      pricePerDay: Number(pricePerDay),
      description,
      owner: owner || req.user.id,
      images: image ? [image] : [],
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/items (generic create)
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
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/items/:id
router.put('/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const updates = req.body;
    if (req.files?.length) updates.images = req.files.map(f => `/uploads/${f.filename}`);
    const updated = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/items/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
