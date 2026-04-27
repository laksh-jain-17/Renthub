import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import { authFetch } from '../utils/auth';

// ✅ Load Razorpay script dynamically
const loadRazorpayScript = () =>
  new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [paymentError, setPaymentError] = useState('');

  const INSTANT_DELIVERY_CHARGE  = 200;
  const STANDARD_DELIVERY_CHARGE = 50;

  useEffect(() => {
    // Redirect if no booking state passed
    if (!state?.item) { navigate('/catalog'); return; }

    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await authFetch(`${API_BASE_URL}/api/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch {}
      finally { setPageLoading(false); }
    };
    fetchUser();
  }, []);

  const deliveryCharge = deliveryType === 'instant' ? INSTANT_DELIVERY_CHARGE : STANDARD_DELIVERY_CHARGE;
  const grandTotal = (state?.totalPrice || 0) + deliveryCharge;

  // ✅ Full Razorpay payment flow
  const handleBooking = async () => {
    setPaymentError('');
    const finalDeliveryAddress = currentAddress.trim() !== '' ? currentAddress.trim() : user?.address;

    if (!finalDeliveryAddress) {
      setPaymentError('Please provide a delivery address.');
      return;
    }

    setLoading(true);
    try {
      // Step 1 — load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentError('Razorpay failed to load. Check your internet connection.');
        setLoading(false);
        return;
      }

      // Step 2 — create Razorpay order on backend
      const orderRes = await authFetch(`${API_BASE_URL}/api/bookings/create-razorpay-order`, {
        method: 'POST',
        body: JSON.stringify({
          itemId:     state.item._id,
          startDate:  state.startDate,
          endDate:    state.endDate,
          totalPrice: grandTotal,
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setPaymentError(orderData.message || 'Could not create order. Please try again.');
        setLoading(false);
        return;
      }

      // Step 3 — open Razorpay checkout
      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      orderData.amount,
        currency:    'INR',
        order_id:    orderData.orderId,
        name:        'RentHub',
        description: `Rental: ${state.item.title}`,
        prefill:     { name: localStorage.getItem('userName') || user?.name || '' },
        theme:       { color: '#32be8f' },
        handler: async (response) => {
          // Step 4 — verify payment and save booking
          const verifyRes = await authFetch(`${API_BASE_URL}/api/bookings/verify-payment`, {
            method: 'POST',
            body: JSON.stringify({
              ...response,
              itemId:          state.item._id,
              startDate:       state.startDate,
              endDate:         state.endDate,
              totalPrice:      grandTotal,
              deliveryAddress: finalDeliveryAddress,
              deliveryType,
              deliveryCharge,
              paymentMethod:   'razorpay',
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            navigate('/booking-success');
          } else {
            setPaymentError(verifyData.message || 'Payment verification failed. Contact support.');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setPaymentError('Payment was cancelled.');
            setLoading(false);
          }
        }
      };
      new window.Razorpay(options).open();

    } catch {
      setPaymentError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f3' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #eee', borderTop:'3px solid #32be8f', borderRadius:'50%', margin:'0 auto 16px', animation:'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:'#999', fontFamily:"'DM Sans',sans-serif" }}>Loading Checkout…</p>
      </div>
    </div>
  );

  if (!state?.item) return null;

  const { item, startDate, endDate, totalPrice } = state;
  const rentalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) || 1;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0}
        body{font-family:'DM Sans',sans-serif}
        .delivery-card{transition:all 0.2s ease;cursor:pointer}
        .delivery-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(50,190,143,0.15)!important}
        .btn-pay{transition:background 0.2s,transform 0.1s,box-shadow 0.2s}
        .btn-pay:hover:not(:disabled){background:#249c72!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(50,190,143,0.4)!important}
        .btn-pay:active:not(:disabled){transform:translateY(0)}
        @media(max-width:900px){.co-grid{grid-template-columns:1fr!important}}
        @media(max-width:600px){.co-wrap{padding:80px 4% 48px!important}}
      `}</style>

      <div className="co-wrap" style={{ minHeight:'100vh', background:'#f5f5f3', padding:'100px 5% 60px', fontFamily:"'DM Sans',sans-serif" }}>

        {/* Back link */}
        <Link to={`/items/${item._id}`} style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:32, color:'#555', textDecoration:'none', fontSize:'0.9rem', fontWeight:500, background:'#fff', padding:'8px 16px', borderRadius:40, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          ← Back to Item
        </Link>

        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'2.4rem', color:'#111', marginBottom:8 }}>Checkout</h1>
        <p style={{ color:'#888', marginBottom:36, fontSize:'0.95rem' }}>Review your booking details and complete payment.</p>

        <div className="co-grid" style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:28, maxWidth:1160, margin:'0 auto', alignItems:'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Item card */}
            <div style={{ background:'#fff', borderRadius:20, padding:'24px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#aaa', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:16 }}>Booking Summary</p>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{
                  width:90, height:80, borderRadius:12, flexShrink:0,
                  background: item.images?.length ? `url(${item.images[0]}) center/cover` : 'linear-gradient(135deg,#e0f7ef,#b2f0d4)'
                }}/>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:'1.1rem', color:'#111', fontWeight:700, marginBottom:6 }}>{item.title}</h3>
                  <span style={{ display:'inline-block', padding:'2px 10px', background:'#f0f0ee', borderRadius:20, fontSize:'0.7rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>{item.category}</span>
                  <div style={{ display:'flex', gap:12, fontSize:'0.85rem', color:'#666', flexWrap:'wrap' }}>
                    <span>📅 {new Date(startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                    <span>→</span>
                    <span>{new Date(endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                    <span style={{ color:'#32be8f', fontWeight:600 }}>· {rentalDays} day{rentalDays !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:'0.75rem', color:'#aaa', marginBottom:2 }}>Rental</p>
                  <p style={{ fontSize:'1.3rem', fontWeight:700, color:'#32be8f', fontFamily:"'DM Serif Display',serif" }}>₹{totalPrice}</p>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div style={{ background:'#fff', borderRadius:20, padding:'24px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#aaa', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:16 }}>Delivery Address</p>
              {user?.address && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#f0fdf9', border:'1px solid #6ee7c7', borderRadius:10, marginBottom:14, fontSize:'0.85rem', color:'#0f9f6e' }}>
                  <span>📍</span>
                  <span><strong>Default:</strong> {user.address}</span>
                </div>
              )}
              <textarea
                placeholder={user?.address ? 'Enter a different address (optional)' : 'Enter your delivery address *'}
                value={currentAddress}
                onChange={e => setCurrentAddress(e.target.value)}
                style={{ width:'100%', padding:'14px', borderRadius:12, border:'1px solid #e5e7eb', fontSize:'0.9rem', minHeight:90, resize:'vertical', outline:'none', fontFamily:"'DM Sans',sans-serif", color:'#333' }}
              />
              {!user?.address && !currentAddress.trim() && (
                <p style={{ fontSize:'0.78rem', color:'#e05', marginTop:6 }}>⚠ Address required — no default address set on your profile.</p>
              )}
            </div>

            {/* Delivery type */}
            <div style={{ background:'#fff', borderRadius:20, padding:'24px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#aaa', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:16 }}>Delivery Type</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { key:'standard', label:'Standard Delivery', sub:'Delivered in 3–5 business days', price: STANDARD_DELIVERY_CHARGE, icon:'📦' },
                  { key:'instant',  label:'Instant Delivery ⚡', sub:'Same day within 6 hours',       price: INSTANT_DELIVERY_CHARGE,  icon:'🚀' },
                ].map(opt => (
                  <div
                    key={opt.key}
                    className="delivery-card"
                    onClick={() => setDeliveryType(opt.key)}
                    style={{
                      padding:'18px 20px',
                      border: deliveryType === opt.key ? '2px solid #32be8f' : '1.5px solid #e5e7eb',
                      borderRadius:14,
                      background: deliveryType === opt.key ? '#f0fdf9' : '#fff',
                      boxShadow: deliveryType === opt.key ? '0 4px 16px rgba(50,190,143,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background: deliveryType === opt.key ? '#dcfbef' : '#f5f5f3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>{opt.icon}</div>
                      <div>
                        <p style={{ fontWeight:700, color:'#111', fontSize:'0.95rem', marginBottom:2 }}>{opt.label}</p>
                        <p style={{ color:'#999', fontSize:'0.8rem' }}>{opt.sub}</p>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontWeight:700, fontSize:'1.05rem', color: deliveryType === opt.key ? '#32be8f' : '#555' }}>₹{opt.price}</p>
                      {deliveryType === opt.key && <p style={{ fontSize:'0.7rem', color:'#32be8f', fontWeight:600 }}>Selected ✓</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Order Summary ── */}
          <div style={{ position:'sticky', top:100 }}>
            <div style={{ background:'#fff', borderRadius:20, padding:'28px', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', marginBottom:16 }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#aaa', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:20 }}>Order Summary</p>

              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'#666' }}>
                  <span>Rental ({rentalDays} day{rentalDays !== 1 ? 's' : ''})</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'#666' }}>
                  <span>{deliveryType === 'instant' ? 'Instant' : 'Standard'} Delivery</span>
                  <span>₹{deliveryCharge}</span>
                </div>
              </div>

              <div style={{ borderTop:'1.5px solid #f0f0ee', paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontWeight:700, color:'#111', fontSize:'1rem' }}>Total</span>
                <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1.8rem', color:'#32be8f' }}>₹{grandTotal}</span>
              </div>
            </div>

            {/* Payment error */}
            {paymentError && (
              <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'12px 16px', borderRadius:12, fontSize:'0.85rem', marginBottom:16 }}>
                {paymentError}
              </div>
            )}

            {/* Pay button */}
            <button
              className="btn-pay"
              onClick={handleBooking}
              disabled={loading}
              style={{
                width:'100%', padding:'18px',
                background: loading ? '#d1d5db' : '#32be8f',
                color:'#fff', border:'none', borderRadius:14,
                fontSize:'1.1rem', fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow:'0 4px 16px rgba(50,190,143,0.3)',
              }}>
              {loading ? 'Opening Payment…' : `Pay ₹${grandTotal} via Razorpay`}
            </button>

            {/* Trust badges */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14 }}>
              {[['🔒','Secure Payment'],['↩','Free Cancel'],['🛡','Buyer Protected'],['💬','24/7 Support']].map(([icon,label]) => (
                <div key={label} style={{ textAlign:'center', padding:'10px 8px', background:'#f9f9f7', borderRadius:10, fontSize:'0.72rem', color:'#666', fontWeight:500 }}>
                  {icon} {label}
                </div>
              ))}
            </div>

            <p style={{ textAlign:'center', fontSize:'0.75rem', color:'#bbb', marginTop:14 }}>
              Powered by Razorpay · 256-bit SSL encrypted
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
