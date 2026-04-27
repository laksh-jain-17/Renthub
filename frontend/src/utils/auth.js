// frontend/src/utils/auth.js
import API_BASE_URL from '../config';

const TOKEN_KEY = 'token';
const USER_KEY  = 'user';

// ── Storage ────────────────────────────────────────────────────────────────────

export const saveSession = ({ token, user }) => {
  // Normalize: backend returns `id`, components expect `_id` — store both
  const normalized = { ...user, _id: user._id || user.id };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  localStorage.setItem('userEmail', normalized.email);
  localStorage.setItem('userId',    normalized._id);
  localStorage.setItem('userName',  normalized.name);
  localStorage.setItem('userRoles', JSON.stringify(normalized.roles));
};

export const clearSession = () => {
  ['token','user','userEmail','userId','userName','userRoles'].forEach(k =>
    localStorage.removeItem(k)
  );
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    if (!user) return null;
    // Always guarantee _id exists regardless of how it was saved
    return { ...user, _id: user._id || user.id };
  } catch { return null; }
};

export const isLoggedIn  = () => Boolean(getToken());
export const hasRole     = (role) => getUser()?.roles?.includes(role) ?? false;

// ── Token expiry (client-side pre-check) ──────────────────────────────────────

const decodePayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  } catch { return null; }
};

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  const p = decodePayload(token);
  if (!p?.exp) return true;
  return Date.now() >= (p.exp - 30) * 1000;
};

// ── Server-side validation ─────────────────────────────────────────────────────

export const verifyTokenWithServer = async () => {
  const token = getToken();
  if (!token) return { valid: false };
  try {
    const res  = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.valid) clearSession();
    return data;
  } catch { return { valid: false }; }
};

// ── Authenticated fetch ────────────────────────────────────────────────────────

export const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearSession();
    window.location.href = '/login';
  }
  return response;
};

// ── Logout ─────────────────────────────────────────────────────────────────────

export const logout = () => {
  clearSession();
  window.location.href = '/login';
};
