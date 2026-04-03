// backend/config/jwt.js
// Single source of truth for JWT configuration.
// Import this everywhere instead of re-declaring JWT_SECRET per file.

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    '[JWT] WARNING: JWT_SECRET is not set in environment variables. ' +
    'Using an insecure default — set JWT_SECRET in your .env file before deploying.'
  );
}

const JWT_SECRET_RESOLVED = JWT_SECRET || 'renthub-insecure-default-change-me';

// Token lifetimes
const ACCESS_TOKEN_EXPIRY  = '7d';   // regular user / admin sessions
const RESET_TOKEN_EXPIRY   = '5m';   // password-reset one-time tokens

module.exports = {
  JWT_SECRET: JWT_SECRET_RESOLVED,
  ACCESS_TOKEN_EXPIRY,
  RESET_TOKEN_EXPIRY,
};
