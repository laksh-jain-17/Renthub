import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { authFetch } from '../utils/auth';

const Checkout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryType, setDeliveryType] = useState('standard');
  const [loading, setLoading] = useState(false);

  const INSTANT_DELIVERY_CHARGE = 200;
  const STANDARD_DELIVERY_CHARGE = 50;

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem('userId');
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}`);
      const data = await response.json();
      setUser(data);
    };
    fetchUser();
  }, []);

  const calculateTotal = () => {
    const deliveryCharge = deliveryType === 'instant' ? INSTANT_DELIVERY_CHARGE : STANDARD_DELIVERY_CHARGE;
    return state.totalPrice + deliveryCharge;
  };

  const handleBooking = async () => {
    setLoading(true);
    const finalDeliveryAddress = currentAddress.trim() === '' ? user.address : currentAddress;
    
    if (!finalDeliveryAddress) {
      alert('Please provide a delivery address');
      setLoading(false);
      return;
    }

    const deliveryCharge = deliveryType === 'instant' ? INSTANT_DELIVERY_CHARGE : STANDARD_DELIVERY_CHARGE;
    const finalTotal = state.totalPrice + deliveryCharge;

    const payload = {
      itemId: state.item._id,
      startDate: state.startDate,
      endDate: state.endDate,
      totalPrice: finalTotal,
      deliveryAddress: finalDeliveryAddress,
      deliveryType: deliveryType,
      paymentMethod: paymentMethod,
      deliveryCharge: deliveryCharge
    };

    try {
      const response = await authFetch(`${API_BASE_URL}/api/bookings/create`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/booking-success');
      } else {
        alert('Booking failed. Please try again.');
      }
    } catch (err) {
      alert('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <p>Loading Checkout...</p>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa', 
      padding: '50px 20px' 
    }}>
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto' 
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '40px', 
          color: '#333',
          fontWeight: '700'
        }}>Checkout</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px'
        }}>
          {}
          <div>
            {}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Item Details</h3>
              <div style={{
                height: '150px',
                background: state.item.images && state.item.images.length > 0 
                  ? `url(${state.item.images[0]}) center/cover` 
                  : '#e0e0e0',
                borderRadius: '10px',
                marginBottom: '15px'
              }}></div>
              <h4 style={{ marginBottom: '10px' }}>{state.item.title}</h4>
              <p style={{ color: '#666', marginBottom: '10px' }}>
                {new Date(state.startDate).toLocaleDateString()} - {new Date(state.endDate).toLocaleDateString()}
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#667eea' }}>
                ₹{state.totalPrice}
              </p>
            </div>

            {}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Delivery Address</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
                <strong>Default Address:</strong> {user.address || 'Not set in profile'}
              </p>
              <textarea 
                placeholder="Enter delivery address (optional - leave blank to use default)" 
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  borderRadius: '10px', 
                  border: '1px solid #ddd',
                  minHeight: '100px',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
              />
            </div>

            {}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Delivery Type</h3>
              
              <div 
                onClick={() => setDeliveryType('standard')}
                style={{
                  padding: '20px',
                  border: deliveryType === 'standard' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  cursor: 'pointer',
                  background: deliveryType === 'standard' ? '#f0f4ff' : 'white',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ marginBottom: '5px' }}>Standard Delivery</h4>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Delivery in 3-5 business days</p>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#667eea' }}>
                    ₹{STANDARD_DELIVERY_CHARGE}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setDeliveryType('instant')}
                style={{
                  padding: '20px',
                  border: deliveryType === 'instant' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: deliveryType === 'instant' ? '#f0f4ff' : 'white',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ marginBottom: '5px' }}>Instant Delivery ⚡</h4>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Same day delivery within 6 hours</p>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#667eea' }}>
                    ₹{INSTANT_DELIVERY_CHARGE}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div>
            {}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Payment Method</h3>
              
              <div 
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '15px',
                  border: paymentMethod === 'card' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  cursor: 'pointer',
                  background: paymentMethod === 'card' ? '#f0f4ff' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {paymentMethod === 'card' && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#667eea'
                    }}></div>
                  )}
                </div>
                <div>
                  <h4 style={{ marginBottom: '3px' }}>Credit/Debit Card</h4>
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>Visa, Mastercard, Rupay</p>
                </div>
              </div>

              <div 
                onClick={() => setPaymentMethod('upi')}
                style={{
                  padding: '15px',
                  border: paymentMethod === 'upi' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  cursor: 'pointer',
                  background: paymentMethod === 'upi' ? '#f0f4ff' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {paymentMethod === 'upi' && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#667eea'
                    }}></div>
                  )}
                </div>
                <div>
                  <h4 style={{ marginBottom: '3px' }}>UPI</h4>
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>Google Pay, PhonePe, Paytm</p>
                </div>
              </div>

              <div 
                onClick={() => setPaymentMethod('netbanking')}
                style={{
                  padding: '15px',
                  border: paymentMethod === 'netbanking' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  cursor: 'pointer',
                  background: paymentMethod === 'netbanking' ? '#f0f4ff' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {paymentMethod === 'netbanking' && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#667eea'
                    }}></div>
                  )}
                </div>
                <div>
                  <h4 style={{ marginBottom: '3px' }}>Net Banking</h4>
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>All major banks</p>
                </div>
              </div>

              <div 
                onClick={() => setPaymentMethod('cod')}
                style={{
                  padding: '15px',
                  border: paymentMethod === 'cod' ? '2px solid #667eea' : '1px solid #ddd',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: paymentMethod === 'cod' ? '#f0f4ff' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {paymentMethod === 'cod' && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#667eea'
                    }}></div>
                  )}
                </div>
                <div>
                  <h4 style={{ marginBottom: '3px' }}>Cash on Delivery</h4>
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>Pay when you receive</p>
                </div>
              </div>
            </div>

            {}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Order Summary</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '10px',
                  color: '#666'
                }}>
                  <span>Rental Price</span>
                  <span>₹{state.totalPrice}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '15px',
                  color: '#666'
                }}>
                  <span>Delivery Charge</span>
                  <span>₹{deliveryType === 'instant' ? INSTANT_DELIVERY_CHARGE : STANDARD_DELIVERY_CHARGE}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingTop: '15px',
                  borderTop: '2px solid #eee',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: '#333'
                }}>
                  <span>Total</span>
                  <span style={{ color: '#667eea' }}>₹{calculateTotal()}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleBooking} 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '18px', 
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '15px', 
                fontWeight: 'bold', 
                fontSize: '1.1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
              }}
            >
              {loading ? 'Processing...' : 'Confirm & Pay'}
            </button>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f0f4ff',
              borderRadius: '10px',
              fontSize: '0.85rem',
              color: '#666'
            }}>
              <div style={{ marginBottom: '8px' }}>✓ Secure Payment</div>
              <div style={{ marginBottom: '8px' }}>✓ Easy Cancellation</div>
              <div>✓ 24/7 Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
