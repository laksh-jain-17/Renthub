import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserProfile from './pages/UserProfile';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import BookingSuccess from './pages/BookingSuccess';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.some(role => userRoles.includes(role))) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/item/:id" element={<ProductDetail />} />
        <Route path="/booking-success" element={<BookingSuccess />} />

        {/* Protected: user profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* Protected: unified dashboard for all non-admin users */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: admin only */}
        <Route
          path="/dashboard/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect old buyer/seller dashboard URLs to unified dashboard */}
        <Route path="/dashboard/buyer/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/seller/*" element={<Navigate to="/dashboard" replace />} />

        {/* 403 page */}
        <Route
          path="/unauthorized"
          element={
            <div style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <h1>403 - Unauthorized</h1>
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