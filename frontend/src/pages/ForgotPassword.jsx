import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
const ForgetPassword = () => {
  const [email,setEmail] = useState('');
  const [newPassword,setNewPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if(newPassword !== confirmPassword)
    {
      setError("Password do not match");
      return;
    }
    if(newPassword.length < 6) 
    {
      setError("Password must be at least 6 charcters");
      return;
    }
    setLoading(true);
    try
    {
      const response = await fetch('http://localhost:5000/api/auth/reset-password',
                                   method: 'POST',
                                   headers: { 'Content-Type':'application/json'},
                                   body: JSON.stringify({ email, newPassword })
      });
      const data = await response.json();
      if(response.ok) 
      {
        setMessage("Password reset successfull redirecting to login...");
        setTimeout(() => navigate('/login'),2500);
      }
      else{
        setError(data.message || "Failed to reset password");
      }
  }
  catch(err) 
  {
    setError("Connection error. Please try again");
  }
  finally
  {
    setLoading(false);
  }
};
const inputStyle = {
  width: '100%',
  padding: '13px 15px',
  marginBottom: '16px',
  borderRadius: '1px solid #ddd',
  fontSize: '1rem',
  boxSizing: 'border-box',
  outline: 'none'
};
return (
  <div style={{
    height: '100vh',
    display:'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #32be8f 0%, #249c72 100%)'
  }}>
    <form onSubmit={handleSubmit} style={{
      background: 'white',
      padding: '50px',
      borderRadius: '30px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <h2 style={{
        textAlign:'center',
        marginBottom: '8px',
        color:'#333',
        fontSize:'2rem',
      }}>Reset Password</h2>
      <p style={{
        textAlign: 'center',
        color:'#666',
        marginBottom: '30px',
        fontSize: '0.9rem'
      }}>Enter your email and choose new Password</p>
      {error && (
        <div style={{
          background: #fee',
            color: '#c33',
            padding:'12px',
            borderRadius:'8px',
            marginBottom:'20px',
            fontSize:'0.9rem'
          }}>{error}</div>div>
      )}
      {message && (
        <div style={{
          background:'#efe',
          color:'#2a2',
          padding:'12px',
          borderRadius:'8px',
          marginBottom:'20px',
          fontSize:'0.9rem'
        }}>{message}</div>div>
      )}
      <input type="email" placeholder="Email Address" value={email} onChange={(e) =>setEmail(e.target.value)} style={inputStyle} required></input>
      <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required></input>
      <input 
        type="password" 
        placeholder="Confirm new password" 
        value={confirmPassword} 
        onChnage={(e) => setConfirmPassword(e.target.value)} 
        style={{...inputStyle, marginBottom:'24px'}} 
        required></input> 
      <button
          type="submit"
          disabled={loading}
          style={{
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
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        <div style={{ textAlign: 'center', color: '#666' }}>
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
export default ForgetPassword;
