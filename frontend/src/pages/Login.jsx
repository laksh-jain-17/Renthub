import React, { useState } from 'react';
import { saveSession } from '../utils/auth';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';

const ADMIN_EMAIL = 'lakshjain1705@gmail.com';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP
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

  // Step 1: submit email + password
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

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      if (data.requiresOTP) {
        // Admin — move to OTP step
        setStep(2);
        setOtpMessage(`OTP sent to ${ADMIN_EMAIL}`);
      } else if (data.success) {
        // Normal user — done
        saveAndRedirect(data);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: submit OTP
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

      if (response.ok && data.success) {
        saveAndRedirect(data);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtpMessage('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.requiresOTP) {
        setOtpMessage('New OTP sent to your email');
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

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
        <h2 style={{
          textAlign: 'center',
          marginBottom: '8px',
          color: '#333',
          fontSize: '2rem'
        }}>
          {step === 1 ? 'Member Login' : 'Admin Verification'}
        </h2>

        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
          fontSize: '0.9rem'
        }}>
          {step === 2 ? `Enter the OTP sent to ${ADMIN_EMAIL}` : ''}
        </p>

        {error && (
          <div style={{
            background: '#fee', color: '#c33',
            padding: '12px', borderRadius: '8px',
            marginBottom: '20px', fontSize: '0.9rem'
          }}>{error}</div>
        )}

        {otpMessage && (
          <div style={{
            background: '#efe', color: '#2a2',
            padding: '12px', borderRadius: '8px',
            marginBottom: '20px', fontSize: '0.9rem'
          }}>{otpMessage}</div>
        )}

        {step === 1 ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <Link to="/forgot-password" style={{
                color: '#32be8f', fontSize: '0.9rem', textDecoration: 'none'
              }}>Forgot Password?</Link>
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px',
              background: loading ? '#ccc' : '#32be8f',
              color: 'white', border: 'none', borderRadius: '10px',
              fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{
                color: '#32be8f', textDecoration: 'none', fontWeight: 'bold'
              }}>Sign Up</Link>
            </div>
          </form>
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
