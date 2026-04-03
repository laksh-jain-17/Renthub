// backend/middleware/auth.js
// JWT authentication middleware.
// Uses the shared jwt config so the secret is never duplicated.

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

/**
 * authenticateToken
 * Reads the Bearer token from the Authorization header, verifies it, and
 * attaches the decoded payload to req.user so downstream handlers can use it.
 *
 * Payload shape:  { id, email, roles, iat, exp }
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Authentication required: no token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired — please log in again', expired: true });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Reject password-reset tokens from accessing normal routes
    if (decoded.purpose === 'password-reset') {
      return res.status(403).json({ message: 'Invalid token type for this route' });
    }

    req.user = decoded;
    next();
  });
};

/**
 * isAdmin — must come after authenticateToken
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!req.user.roles?.includes('admin') && req.user.id !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

/**
 * isSeller — must come after authenticateToken
 */
const isSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!req.user.roles?.includes('seller')) {
    return res.status(403).json({ message: 'Seller access required' });
  }
  next();
};

/**
 * isBuyer — must come after authenticateToken
 */
const isBuyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!req.user.roles?.includes('buyer')) {
    return res.status(403).json({ message: 'Buyer access required' });
  }
  next();
};

/**
 * isSelfOrAdmin
 * Allows a user to access/modify their own resource OR lets an admin do anything.
 * Expects req.params.id to be the target user's ID.
 */
const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const isOwner = req.user.id?.toString() === req.params.id?.toString();
  const isAdminUser = req.user.roles?.includes('admin') || req.user.id === 'admin';
  if (!isOwner && !isAdminUser) {
    return res.status(403).json({ message: 'Access denied: you can only modify your own account' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAdmin,
  isSeller,
  isBuyer,
  isSelfOrAdmin,
};
