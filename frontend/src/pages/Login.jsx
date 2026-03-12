import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userRoles', JSON.stringify(data.user.roles));

        if (data.user.roles.includes('admin')) {
          navigate('/dashboard/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
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
      <form onSubmit={handleLogin} style={{
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
        }}>Member Login</h2>
        
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
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <Link to="/forgot-password" style={{
            color: '#32be8f',
            fontSize: '0.9rem',
            textDecoration: 'none'
          }}>Forgot Password?</Link>
        </div>

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
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#666'
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{
            color: '#32be8f',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>Sign Up</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;