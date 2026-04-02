import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1=email, 2=OTP, 3=new password
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetSessionToken, setResetSessionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const inputStyle = {
    width: '100%',
    padding: '13px 15px',
    marginBottom: '16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const btnStyle = (disabled) => ({
    width: '100%',
    padding: '15px',
    background: disabled ? '#ccc' : '#32be8f',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '1rem'
  });

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
        setResendCooldown(30);
      } else {
        setError(data.message || 'Email not found');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setOtpDigits(['', '', '', '', '', '']);
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
      setMessage('New OTP sent!');
      setResendCooldown(30);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input helpers ───────────────────────────────────────────────────────
  const handleOtpInput = (i, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[i] = digit;
    setOtpDigits(updated);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeydown = (e, i) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    setOtpDigits(updated);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) { setError('Please enter the full 6-digit OTP.'); return; }
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResetSessionToken(data.resetSessionToken);
        setStep(3);
      } else {
        setError(data.message || 'Invalid or expired OTP.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ──────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetSessionToken, newPassword })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = { 1: 'Reset Password', 2: 'Enter OTP', 3: 'New Password' };
  const stepSubtitle = {
    1: 'Enter your registered email',
    2: `OTP sent to ${email}. Expires in 10 minutes.`,
    3: `Create a new password for ${email}`
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #32be8f 0%, #249c72 100%)' }}>
      <div style={{ background: 'white', padding: '50px', borderRadius: '30px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#333', fontSize: '2rem' }}>{stepTitle[step]}</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '0.9rem' }}>{stepSubtitle[step]}</p>

        {error && <div style={{ background: '#fee', color: '#c33', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        {message && <div style={{ background: '#efe', color: '#2a2', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeydown(e, i)}
                  onPaste={handleOtpPaste}
                  style={{
                    width: '48px', height: '56px', textAlign: 'center',
                    fontSize: '1.5rem', fontWeight: 'bold',
                    border: '2px solid #ddd', borderRadius: '10px', outline: 'none',
                    color: '#32be8f'
                  }}
                />
              ))}
            </div>
            <button type="submit" disabled={loading || otpDigits.join('').length < 6} style={btnStyle(loading || otpDigits.join('').length < 6)}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.9rem' }}>
              <button type="button" onClick={() => { setStep(1); setError(''); setOtpDigits(['','','','','','']); }}
                style={{ background: 'none', border: 'none', color: '#32be8f', cursor: 'pointer', fontWeight: 'bold' }}>
                ← Change Email
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#aaa' : '#32be8f', cursor: resendCooldown > 0 ? 'default' : 'pointer', fontWeight: 'bold' }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New password */}
        {step === 3 && (
          <form onSubmit={handlePasswordSubmit}>
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} required />
            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: '#32be8f', textDecoration: 'none', fontWeight: 'bold' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
