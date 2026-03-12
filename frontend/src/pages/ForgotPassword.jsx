import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset link sent to your email');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
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
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '50px',
        borderRadius: '30px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#333',
          fontSize: '2rem'
        }}>Forgot Password</h2>

        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
          fontSize: '0.9rem'
        }}>Enter your email to receive a password reset link</p>

        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>{error}</div>
        )}

        {message && (
          <div style={{
            background: '#efe',
            color: '#2a2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>{message}</div>
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '1rem'
          }}
          required
        />

        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '15px',
          background: loading ? '#ccc' : '#32be8f',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          marginBottom: '20px'
        }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div style={{
          textAlign: 'center',
          color: '#666'
        }}>
          <Link to="/login" style={{
            color: '#32be8f',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>Back to Login</Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
