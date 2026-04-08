import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import { saveSession } from '../utils/auth';

const inputStyle = {
  width: '100%', padding: '15px', marginBottom: '20px',
  borderRadius: '10px', border: '1px solid #ddd',
  fontSize: '1rem', boxSizing: 'border-box',
};

const btnStyle = (disabled) => ({
  width: '100%', padding: '15px',
  background: disabled ? '#ccc' : '#32be8f',
  color: 'white', border: 'none', borderRadius: '10px',
  fontWeight: 'bold', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '1rem',
});

const cardStyle = {
  background: 'white', padding: '50px', borderRadius: '30px',
  width: '100%', maxWidth: '500px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};

const wrapStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #32be8f 0%, #249c72 100%)',
  padding: '20px',
};

// OTP step
const OtpStep = ({ email, onSuccess }) => {
  const [otp, setOtp]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent]   = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        saveSession({ token: data.token, user: data.user });
        onSuccess();
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResent(false);
    try {
      await fetch(`${API_BASE_URL}/api/auth/resend-verification-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch {
      setError('Could not resend OTP. Please try again.');
    }
  };

  return (
    <div style={wrapStyle}>
      <form onSubmit={handleVerify} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#f0fff8', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>📧</div>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#333', fontSize: '1.8rem' }}>
          Verify your email
        </h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', marginBottom: '30px' }}>
          We sent a 6-digit code to <strong style={{ color: '#333' }}>{email}</strong>
        </p>

        {error && (
          <div style={{
            background: '#fee', color: '#c33', padding: '12px',
            borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem',
          }}>{error}</div>
        )}
        {resent && (
          <div style={{
            background: '#efe', color: '#2a2', padding: '12px',
            borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem',
          }}>OTP resent! Check your inbox.</div>
        )}

        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          style={{
            ...inputStyle,
            fontSize: '1.8rem', letterSpacing: '10px',
            textAlign: 'center', fontWeight: 'bold',
          }}
          required
        />

        <button type="submit" disabled={loading || otp.length !== 6} style={btnStyle(loading || otp.length !== 6)}>
          {loading ? 'Verifying...' : 'Verify & Create Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '0.85rem' }}>
          Didn't receive it?{' '}
          <span onClick={handleResend} style={{ color: '#32be8f', cursor: 'pointer', fontWeight: 'bold' }}>
            Resend OTP
          </span>
        </p>
      </form>
    </div>
  );
};

// Main register form
const Register = () => {
  const navigate = useNavigate();
  const [step, setStep]             = useState('register');
  const [pendingEmail, setPendingEmail] = useState('');
  const [formData, setFormData]     = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (response.ok && data.requiresVerification) {
        setPendingEmail(data.email);
        setStep('otp');
      } else if (!response.ok) {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return <OtpStep email={pendingEmail} onSuccess={() => navigate('/dashboard')} />;
  }

  return (
    <div style={wrapStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#333', fontSize: '2rem' }}>
          Create Account
        </h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', marginBottom: '30px' }}>
          Buy and rent out gear — all in one account
        </p>

        {error && (
          <div style={{
            background: '#fee', color: '#c33', padding: '12px',
            borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem',
          }}>{error}</div>
        )}

        <input type="text" placeholder="Full Name" value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={inputStyle} required />
        <input type="email" placeholder="Email Address" value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={inputStyle} required />
        <input type="password" placeholder="Password (min 6 characters)" value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          style={inputStyle} required />
        <input type="password" placeholder="Confirm Password" value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          style={{ ...inputStyle, marginBottom: '25px' }} required />

        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? 'Sending OTP...' : 'Sign Up'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#32be8f', textDecoration: 'none', fontWeight: 'bold' }}>
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
