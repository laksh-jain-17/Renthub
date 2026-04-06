// frontend/src/pages/Login.jsx  (FULL REPLACEMENT)
import React, { useState } from 'react';
import { saveSession } from '../utils/auth';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import { signInWithGoogle } from '../firebase';  // ← NEW

const ADMIN_EMAIL = 'lakshjain1705@gmail.com';

// ── Google "G" SVG logo ────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.302 0-9.8-3.493-11.292-8.28l-6.51 5.017C9.517 39.501 16.257 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const inputStyle = {
    width: '100%',
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    boxSizing: 'border-box'
  };

  const saveAndRedirect = (data) => {
    saveSession({ token: data.token, user: data.user });
    if (data.user.roles.includes('admin')) {
      navigate('/dashboard/admin');
    } else {
      navigate('/dashboard');
    }
  };

  // ── Email/Password login ───────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) { setError(data.message || 'Login failed'); return; }

      if (data.requiresOTP) {
        setStep(2);
        setOtpMessage(`OTP sent to ${ADMIN_EMAIL}`);
      } else if (data.success) {
        saveAndRedirect(data);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP verify ────────────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (response.ok && data.success) { saveAndRedirect(data); }
      else { setError(data.message || 'Invalid OTP'); }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(''); setOtpMessage(''); setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.requiresOTP) setOtpMessage('New OTP sent to your email');
    } catch {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          name:     firebaseUser.displayName,
          email:    firebaseUser.email,
          googleId: firebaseUser.uid,
        }),
      });
      const data = await response.json();
      if (data.success) {
        saveAndRedirect(data);
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #32be8f 0%, #249c72 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '50px',
        borderRadius: '30px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#333', fontSize: '2rem' }}>
          {step === 1 ? 'Member Login' : 'Admin Verification'}
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '0.9rem' }}>
          {step === 2 ? `Enter the OTP sent to ${ADMIN_EMAIL}` : ''}
        </p>

        {error && (
          <div style={{ background: '#fee', color: '#c33', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        {otpMessage && (
          <div style={{ background: '#efe', color: '#2a2', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {otpMessage}
          </div>
        )}

        {step === 1 ? (
          <>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email Address" value={email}
                onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              <input type="password" placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <Link to="/forgot-password" style={{ color: '#32be8f', fontSize: '0.9rem', textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '15px',
                background: loading ? '#ccc' : '#32be8f',
                color: 'white', border: 'none', borderRadius: '10px',
                fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem'
              }}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#32be8f', textDecoration: 'none', fontWeight: 'bold' }}>
                  Sign Up
                </Link>
              </div>
            </form>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
              <span style={{ margin: '0 15px', color: '#aaa', fontSize: '0.85rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            </div>

            {/* ── Google button ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '13px',
                background: 'white',
                color: '#333',
                border: '1.5px solid #ddd',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              style={{ ...inputStyle, letterSpacing: '6px', textAlign: 'center', fontSize: '1.4rem' }}
              required
            />
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px',
              background: loading ? '#ccc' : '#32be8f',
              color: 'white', border: 'none', borderRadius: '10px',
              fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem', marginBottom: '16px'
            }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <button type="button" onClick={() => { setStep(1); setError(''); setOtp(''); }}
                style={{ background: 'none', border: 'none', color: '#32be8f', cursor: 'pointer', fontWeight: 'bold' }}>
                ← Back
              </button>
              <button type="button" onClick={handleResendOTP} disabled={loading}
                style={{ background: 'none', border: 'none', color: '#32be8f', cursor: 'pointer', fontWeight: 'bold' }}>
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
