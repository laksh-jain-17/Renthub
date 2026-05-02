const ticketSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['general','booking','payment','listing','account','dispute','other'], default: 'general' },
  priority:    { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  status:      { type: String, enum: ['open','in-progress','resolved','closed'], default: 'open' },
  ticketNumber: { type: Number },
  messages:    [{
    sender:    { type: String, enum: ['user', 'admin'], required: true },
    text:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

// Auto-generate ticket number
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = count + 1;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
