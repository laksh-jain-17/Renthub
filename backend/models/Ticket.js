const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['booking', 'payment', 'item', 'account', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
