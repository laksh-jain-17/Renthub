const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!req.user.roles || (!req.user.roles.includes('admin') && req.user.id !== 'admin')) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

const isSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.roles || !req.user.roles.includes('seller')) {
    return res.status(403).json({ message: 'Seller access required' });
  }
  
  next();
};

const isBuyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.roles || !req.user.roles.includes('buyer')) {
    return res.status(403).json({ message: 'Buyer access required' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  isAdmin,
  isSeller,
  isBuyer
};
