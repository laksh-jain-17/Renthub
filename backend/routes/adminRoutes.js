const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const Ticket = require('../models/Ticket');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user-details/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) 
    {
      return res.status(404).json({ message: 'User not found' });
    }
    const itemsListed = await Item.countDocuments({ owner: req.params.userId });
    const rentedBookings = await Booking.find({ renter: req.params.userId });
    const itemsRented = rentedBookings.length;
    const totalSpent = rentedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const cancelledAsRenter = rentedBookings.filter(b => b.status === 'cancelled').length;
    const ownerBookings = await Booking.find({ owner: req.params.userId });
    const totalEarnings = ownerBookings
      .filter(b => b.status === 'completed' || b.status === 'active')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const cancelledAsOwner = ownerBookings.filter(b => b.status === 'cancelled').length;
    const cancelledOrders = cancelledAsRenter + cancelledAsOwner;

    const recentTransactions = await Booking.find({
      $or: [{ renter: req.params.userId }, { owner: req.params.userId }]
    })
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user,
      stats: {
        itemsListed,
        itemsRented,
        totalEarnings,
        totalSpent,
        cancelledOrders
      },
      recentTransactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    
    await Item.deleteMany({ owner: req.params.userId });
    await Booking.deleteMany({ 
      $or: [{ renter: req.params.userId }, { owner: req.params.userId }]
    });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/kyc-action/:userId', authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { kycStatus: status },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/items/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const items = await Item.find({ isVerified: false })
      .populate('owner', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/items/:itemId/verify', authenticateToken, isAdmin, async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.itemId,
      { isVerified: true },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/items/:itemId/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.itemId);
    res.json({ message: 'Item rejected and deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/payments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const payments = await Booking.find({})
      .populate('renter', 'name email')
      .populate('owner', 'name email')
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    const totalRevenue = await Booking.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthRevenue = await Booking.aggregate([
      { 
        $match: { 
          status: { $in: ['active', 'completed'] },
          createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1)
          }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const pendingRevenue = await Booking.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      payments,
      stats: {
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        thisMonth: thisMonthRevenue.length > 0 ? thisMonthRevenue[0].total : 0,
        pendingPayments: pendingRevenue.length > 0 ? pendingRevenue[0].total : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tickets', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tickets', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const ticketCount = await Ticket.countDocuments();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;

    const ticket = new Ticket({
      ticketNumber,
      title,
      description,
      priority: priority || 'medium',
      status: 'open',
      user: req.user.id === 'admin' ? null : req.user.id
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tickets/:ticketId/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.ticketId,
      { status },
      { new: true }
    ).populate('user', 'name email');
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    const revenueData = await Booking.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const activeRentals = await Booking.countDocuments({ status: 'active' });
    const completedRentals = await Booking.countDocuments({ status: 'completed' });
    const cancelledRentals = await Booking.countDocuments({ status: 'cancelled' });
    const topCategories = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    const topItems = await Booking.aggregate([
      { $group: { 
        _id: '$item', 
        bookingCount: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }},
      { $sort: { bookingCount: -1 } },
      { $limit: 10 }
    ]);

    const populatedTopItems = await Item.populate(topItems, { 
      path: '_id',
      select: 'title category'
    });

    const formattedTopItems = populatedTopItems.map(item => ({
      title: item._id?.title || 'Unknown',
      category: item._id?.category || 'Unknown',
      bookingCount: item.bookingCount,
      revenue: item.revenue
    }));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Booking.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ['active', 'completed'] }
        } 
      },
      { 
        $group: { 
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' }
        } 
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalUsers,
      totalItems,
      totalBookings,
      totalRevenue: revenueData.length > 0 ? revenueData[0].total : 0,
      activeRentals,
      completedRentals,
      cancelledRentals,
      topCategories,
      topItems: formattedTopItems,
      monthlyRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
