const express    = require('express');
const router     = express.Router();
const Ticket     = require('../models/Ticket');
const User       = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ── Mailer setup ───────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,     // your gmail address
    pass: process.env.GMAIL_APP_PASS, // your 16-char app password
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"RentHub Support" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
};

const emailAdminNewTicket = async ({ userName, subject, message, category }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  await sendEmail({
    to: adminEmail,
    subject: `New Support Ticket: "${subject}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#32be8f;margin-bottom:8px">New Support Ticket</h2>
        <p style="color:#555">A new ticket has been submitted on RentHub.</p>
        <div style="background:#f8f9fa;border-radius:8px;padding:18px;margin:20px 0">
          <p style="margin:4px 0;color:#333"><strong>From:</strong> ${userName}</p>
          <p style="margin:4px 0;color:#333"><strong>Category:</strong> ${category}</p>
          <p style="margin:4px 0;color:#333"><strong>Subject:</strong> ${subject}</p>
          <p style="margin:4px 0;color:#333"><strong>Message:</strong> ${message}</p>
        </div>
        <p style="color:#aaa;font-size:0.8rem;margin-top:24px">— The RentHub Team</p>
      </div>
    `,
  });
};

const emailUserTicketReceived = async ({ userEmail, userName, subject }) => {
  await sendEmail({
    to: userEmail,
    subject: `We received your ticket: "${subject}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#32be8f;margin-bottom:8px">Ticket Received ✓</h2>
        <p style="color:#555">Hi <strong>${userName}</strong>, we've received your support request.</p>
        <div style="background:#f8f9fa;border-radius:8px;padding:18px;margin:20px 0">
          <p style="margin:4px 0;color:#333"><strong>Subject:</strong> ${subject}</p>
        </div>
        <p style="color:#555">Our team will get back to you as soon as possible.</p>
        <p style="color:#aaa;font-size:0.8rem;margin-top:24px">— The RentHub Team</p>
      </div>
    `,
  });
};

// ── Routes ─────────────────────────────────────────────────────

// POST /api/tickets
// POST /api/tickets
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, priority } = req.body; // ✅ match frontend

    if (!title || !description)
      return res.status(400).json({ message: 'Title and description are required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ticket = new Ticket({
      user,
      title,
      description,
      category: category || 'general',
      priority:  priority || 'medium',
      status:   'open',
    });
    await ticket.save();

    await emailAdminNewTicket({ userName: user.name, subject: title, message: description, category: category || 'general' });
    await emailUserTicketReceived({ userEmail: user.email, userName: user.name, subject: title });

    res.status(201).json({ success: true, ticket });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/tickets — user's own tickets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/tickets/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });
    res.json(ticket);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/tickets/:id/status — admin updates status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'in-progress', 'resolved', 'closed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
