// frontend/src/utils/auth.js
// JWT helpers for the frontend.
// All token storage and access logic lives here — never read localStorage directly.

import API_BASE_URL from '../config';

const TOKEN_KEY   = 'token';
const USER_KEY    = 'user';   // stores { id, email, name, roles } as JSON

// ── Storage helpers ────────────────────────────────────────────────────────────

export const saveSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Keep legacy keys so existing components don't break
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userId',    user.id);
  localStorage.setItem('userName',  user.name);
  localStorage.setItem('userRoles', JSON.stringify(user.roles));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRoles');
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(getToken());

export const hasRole = (role) => {
  const user = getUser();
  return user?.roles?.includes(role) ?? false;
};

// ── Token expiry check (client-side, no network) ───────────────────────────────

/**
 * Decode a JWT payload without verifying the signature.
 * Safe for expiry pre-checks only — the server always validates the signature.
 */
const decodePayload = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  // Add a 30-second buffer so we log out slightly before the server rejects us
  return Date.now() >= (payload.exp - 30) * 1000;
};

// ── Server-side token validation ───────────────────────────────────────────────

/**
 * Ping the /verify-token endpoint.
 * Returns { valid: true, user } or { valid: false, expired?: true }.
 * Use this on page load to confirm a stored token is still accepted by the server.
 */
export const verifyTokenWithServer = async () => {
  const token = getToken();
  if (!token) return { valid: false };

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.valid) clearSession(); // token rejected — wipe it
    return data;
  } catch {
    return { valid: false };
  }
};

// ── Authenticated fetch wrapper ────────────────────────────────────────────────

/**
 * Drop-in wrapper around fetch() that:
 *  1. Attaches the Authorization header automatically
 *  2. Clears the session and redirects to /login on 401 (expired/invalid token)
 */
export const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token expired or invalid — force re-login
    clearSession();
    window.location.href = '/login';
    return response;
  }

  return response;
};

// ── Logout ─────────────────────────────────────────────────────────────────────

export const logout = () => {
  clearSession();
  window.location.href = '/login';
};
