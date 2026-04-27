const express    = require('express');
const router     = express.Router();
const Item       = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// ── Cloudinary config (CLOUDINARY_URL auto-configures everything) ─────────────
cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

// ── Multer: store file in memory, no extra package needed ─────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// ── Helper: upload a buffer to Cloudinary and return the result ───────────────
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:          'renthub',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation:  [{ width: 1000, quality: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// ── Helper: upload multiple files and return array of secure URLs ─────────────
const uploadFiles = (files = []) =>
  Promise.all(files.map(f => uploadToCloudinary(f.buffer).then(r => r.secure_url)));

// ── Helper: extract Cloudinary public_id from a secure URL ───────────────────
const getPublicId = (url) => {
  // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/renthub/abc.jpg
  // → renthub/abc
  const parts = url.split('/');
  const filename = parts[parts.length - 1].split('.')[0];
  return `renthub/${filename}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/items/all
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/items/owner/:userId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/owner/:userId', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.params.userId });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/items/my
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user.id });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/items/:id  ← must stay after all named routes
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/items/add  (single image)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/add', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, category, pricePerDay, description, owner } = req.body;

    let image = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      image = result.secure_url;
    }

    const item = new Item({
      title, category,
      pricePerDay: Number(pricePerDay),
      description,
      owner:  owner || req.user.id,
      images: image ? [image] : [],
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/items  (generic create, up to 5 images)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, category, pricePerDay, location } = req.body;

    const images = req.files?.length ? await uploadFiles(req.files) : [];

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

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/items/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const updates = { ...req.body };
    if (req.files?.length) {
      updates.images = await uploadFiles(req.files);
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/items/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Delete images from Cloudinary (best-effort, don't fail the request)
    if (item.images?.length) {
      await Promise.all(
        item.images.map(url =>
          cloudinary.uploader.destroy(getPublicId(url)).catch(() => {})
        )
      );
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
