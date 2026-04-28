import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home           from './pages/Home';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserProfile    from './pages/UserProfile';
import Catalog        from './pages/Catalog';
import ProductDetail  from './pages/ProductDetail';
import Checkout       from './pages/Checkout';         // ✅ Added
import BookingSuccess from './pages/BookingSuccess';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard  from './pages/UserDashboard';
import { isLoggedIn, isTokenExpired, clearSession } from './utils/auth';

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
// Guards routes that require a valid, non-expired JWT.
// `allowedRoles` (optional) restricts to users with at least one of those roles.

const ProtectedRoute = ({ children, allowedRoles }) => {
  const loggedIn = isLoggedIn();

  // Client-side expiry check — clears stale tokens before even rendering
  if (loggedIn && isTokenExpired()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    if (!allowedRoles.some((role) => userRoles.includes(role))) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

// ── App ────────────────────────────────────────────────────────────────────────

function App() {
  // On every mount, silently remove expired tokens so stale data doesn't linger
  useEffect(() => {
    if (isLoggedIn() && isTokenExpired()) {
      clearSession();
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/"                element={<Home />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/catalog"         element={<Catalog />} />
        <Route path="/items/:id"       element={<ProductDetail />} />  {/* ✅ Fixed: was /item/:id, must match Checkout's back-link */}
        <Route path="/booking-success" element={<BookingSuccess />} />

        {/* Protected: checkout */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />                                              {/* ✅ Added */}
            </ProtectedRoute>
          }
        />

        {/* Protected: user profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: all logged-in users including admin */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Legacy dashboard URL redirects */}
        <Route path="/dashboard/buyer/*"  element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/seller/*" element={<Navigate to="/dashboard" replace />} />

        {/* 403 Unauthorized */}
        <Route
          path="/unauthorized"
          element={
            <div style={{
              height: '100vh', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column'
            }}>
              <h1>403 — Unauthorized</h1>
              <p>You do not have permission to view this page.</p>
              <a href="/login" style={{ color: '#32be8f', marginTop: '20px' }}>
                Go to Login
              </a>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
