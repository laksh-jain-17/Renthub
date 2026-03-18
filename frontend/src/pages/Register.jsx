import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://renthub-backend-510573568102.us-central1.run.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'user'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #32be8f 0%, #249c72 100%)',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '50px',
        borderRadius: '30px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '10px',
          color: '#333',
          fontSize: '2rem'
        }}>Create Account</h2>

        <p style={{
          textAlign: 'center',
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '30px'
        }}>
          Buy and rent out gear — all in one account
        </p>

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

        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '25px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            boxSizing: 'border-box'
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
          fontSize: '1rem'
        }}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#666'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#32be8f',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>Login</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;