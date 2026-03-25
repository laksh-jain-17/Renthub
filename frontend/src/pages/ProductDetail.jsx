import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${id}`);
      if (response.ok) {
        const data = await response.json();
        setItem(data);
      } else {
        setError('Item not found');
      }
    } catch (err) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isDateValid = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(dateStr);
    return selected >= today;
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setStartDate(value);
    if (value && !isDateValid(value)) {
      setStartDateError('Invalid date: Start date cannot be in the past');
    } else {
      setStartDateError('');
    }
    // Re-validate end date if it's now before new start date
    if (endDate && value && endDate < value) {
      setEndDateError('Invalid date: End date cannot be before start date');
    } else if (endDate && isDateValid(endDate) && endDate >= value) {
      setEndDateError('');
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setEndDate(value);
    if (value && !isDateValid(value)) {
      setEndDateError('Invalid date: End date cannot be in the past');
    } else if (value && startDate && value < startDate) {
      setEndDateError('Invalid date: End date cannot be before start date');
    } else {
      setEndDateError('');
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    if (!item) return 0;
    return item.pricePerDay * calculateDays();
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token) {
      alert('Please login to continue');
      navigate('/login');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select rental dates');
      return;
    }

    // Final validation check before submitting
    if (!isDateValid(startDate)) {
      setStartDateError('Invalid date: Start date cannot be in the past');
      return;
    }
    if (!isDateValid(endDate)) {
      setEndDateError('Invalid date: End date cannot be in the past');
      return;
    }
    if (endDate < startDate) {
      setEndDateError('Invalid date: End date cannot be before start date');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: item._id,
          renterId: userId,
          ownerId: item.owner._id,
          startDate,
          endDate,
          totalPrice: calculateTotal()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Booking confirmed successfully! Check "My Bookings" to view your rental.');
        navigate('/dashboard');
      } else {
        setError(data.message || 'Checkout failed. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Could not connect to server. Please check your connection and try again.');
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h2>{error || 'Item not found'}</h2>
        <Link to="/catalog" style={{
          marginTop: '20px',
          color: '#32be8f',
          textDecoration: 'none'
        }}>Back to Catalog</Link>
      </div>
    );
  }

  const hasDateErrors = startDateError || endDateError;
  const datesAreValid = startDate && endDate && !startDateError && !endDateError;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '100px 5% 50px'
    }}>
      <Link to="/catalog" style={{
        display: 'inline-block',
        marginBottom: '30px',
        color: '#32be8f',
        textDecoration: 'none',
        fontSize: '1rem'
      }}>← Back to Catalog</Link>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '50px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div>
          <div style={{
            width: '100%',
            height: '500px',
            background: item.images && item.images.length > 0 
              ? `url(${item.images[0]}) center/cover` 
              : '#e0e0e0',
            borderRadius: '20px',
            marginBottom: '20px'
          }}></div>

          {item.isVerified && (
            <div style={{
              background: '#e6fffa',
              padding: '15px',
              borderRadius: '10px',
              color: '#32be8f',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              ✓ Verified & Safe
            </div>
          )}
        </div>

        <div>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
          }}>
            <span style={{
              display: 'inline-block',
              padding: '5px 15px',
              background: '#f0f0f0',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#666',
              marginBottom: '15px',
              textTransform: 'uppercase'
            }}>{item.category}</span>

            <h1 style={{
              fontSize: '2.5rem',
              marginBottom: '15px',
              color: '#333'
            }}>{item.title}</h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '25px'
            }}>
              <span style={{
                fontSize: '1.2rem',
                color: '#333'
              }}>★ {item.rating || '5.0'}</span>
              <span style={{ color: '#999' }}>(45 reviews)</span>
            </div>

            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '10px',
              marginBottom: '25px'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#32be8f'
              }}>
                ₹{item.pricePerDay}
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '400',
                  color: '#666'
                }}>/day</span>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{
                fontSize: '1.2rem',
                marginBottom: '10px',
                color: '#333'
              }}>Description</h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6'
              }}>{item.description || 'No description available'}</p>
            </div>

            {/* Start Date */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333'
              }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                min={getTodayString()}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${startDateError ? '#e53e3e' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {startDateError && (
                <p style={{
                  marginTop: '6px',
                  color: '#e53e3e',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ⚠ {startDateError}
                </p>
              )}
            </div>

            {/* End Date */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333'
              }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || getTodayString()}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${endDateError ? '#e53e3e' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {endDateError && (
                <p style={{
                  marginTop: '6px',
                  color: '#e53e3e',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ⚠ {endDateError}
                </p>
              )}
            </div>

            {datesAreValid && (
              <div style={{
                padding: '15px',
                background: '#f0fdf9',
                borderRadius: '8px',
                marginBottom: '25px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span>₹{item.pricePerDay} × {calculateDays()} days</span>
                  <span>₹{item.pricePerDay * calculateDays()}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  color: '#32be8f',
                  paddingTop: '10px',
                  borderTop: '1px solid #ddd'
                }}>
                  <span>Total</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>{error}</div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!!hasDateErrors}
              style={{
                width: '100%',
                padding: '18px',
                background: hasDateErrors ? '#a0a0a0' : '#32be8f',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: hasDateErrors ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => {
                if (!hasDateErrors) e.currentTarget.style.background = '#249c72';
              }}
              onMouseOut={(e) => {
                if (!hasDateErrors) e.currentTarget.style.background = '#32be8f';
              }}
            >
              Confirm Booking
            </button>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '10px',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              <div style={{ marginBottom: '10px' }}>✓ Secure Booking</div>
              <div style={{ marginBottom: '10px' }}>✓ Free Cancellation</div>
              <div>✓ 24/7 Customer Support</div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '20px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
            marginTop: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Owner Information</h3>
            <p style={{ color: '#666', marginBottom: '8px' }}>
              <strong>Name:</strong> {item.owner?.name || 'Not available'}
            </p>
            <p style={{ color: '#666' }}>
              <strong>Email:</strong> {item.owner?.email || 'Not available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
