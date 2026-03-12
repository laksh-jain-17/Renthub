import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    setTimeout(() => {
      navigate('/dashboard/buyer/bookings');
    }, 5000);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa'
    }}>
      <div style={{
        background: 'white',
        padding: '60px',
        borderRadius: '30px',
        textAlign: 'center',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: '#e6fffa',
          borderRadius: '50%',
          margin: '0 auto 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '4rem',
            color: '#32be8f'
          }}>✓</div>
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          color: '#333',
          marginBottom: '20px'
        }}>Booking Confirmed!</h1>

        <p style={{
          color: '#666',
          fontSize: '1.1rem',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Your payment was successful and your booking has been confirmed. 
          You will receive a confirmation email shortly.
        </p>

        <div style={{
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            marginBottom: '5px'
          }}>
            Session ID
          </p>
          <p style={{
            color: '#333',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}>
            {sessionId}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/buyer/bookings')}
          style={{
            padding: '15px 40px',
            background: '#32be8f',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          View My Bookings
        </button>

        <p style={{
          color: '#999',
          fontSize: '0.9rem'
        }}>
          Redirecting in 5 seconds...
        </p>
      </div>
    </div>
  );
};

export default BookingSuccess;
