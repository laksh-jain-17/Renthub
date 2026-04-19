const Booking = require('../models/Booking');

// Runs every hour — marks bookings as completed when endDate has passed
const autoCompleteBookings = async () => {
  try {
    const result = await Booking.updateMany(
      {
        status: 'active',
        endDate: { $lt: new Date() } // endDate is in the past
      },
      { $set: { status: 'completed' } }
    );

    if (result.modifiedCount > 0) {
      console.log(`[AutoComplete] Marked ${result.modifiedCount} booking(s) as completed`);
    }
  } catch (err) {
    console.error('[AutoComplete] Error:', err.message);
  }
};

module.exports = autoCompleteBookings;