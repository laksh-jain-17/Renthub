import React, { useState } from 'react';

const PaymentModal = ({ amount, itemTitle, onSuccess, onClose }) => {
  const [tab, setTab] = useState('card');
  const [step, setStep] = useState('form'); // form | processing | success
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [upi, setUpi] = useState('');
  const [errors, setErrors] = useState({});

  const formatCardNumber = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    return clean.length > 2 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean;
  };

  const validateCard = () => {
    const e = {};
    if (!card.name.trim())                          e.name   = 'Name is required';
    if (card.number.replace(/\s/g,'').length !== 16) e.number = 'Enter valid 16-digit card number';
    if (card.expiry.length !== 5)                   e.expiry = 'Enter valid expiry MM/YY';
    if (card.cvv.length < 3)                        e.cvv    = 'Enter valid CVV';
    return e;
  };

  const validateUpi = () => {
    const e = {};
    if (!upi.trim())                              e.upi = 'UPI ID is required';
    else if (!/^[\w.\-]+@[\w]+$/.test(upi.trim())) e.upi = 'Invalid UPI ID (e.g. name@upi)';
    return e;
  };

  const handlePay = () => {
    const errs = tab === 'card' ? validateCard() : validateUpi();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep('processing');
    setTimeout(() => setStep('success'), 2200);
  };

  const txnId = `PAY-${Date.now()}`;

  /* ── shared styles ── */
  const inp = (err) => ({
    width: '100%', padding: '12px 14px',
    border: `1.5px solid ${err ? '#f87171' : '#e5e7eb'}`,
    borderRadius: 10, fontSize: '0.95rem', outline: 'none',
    background: '#fafafa', color: '#111', boxSizing: 'border-box',
    transition: 'border 0.15s'
  });
  const lbl = { display: 'block', fontSize: '0.78rem', fontWeight: 600,
                color: '#555', marginBottom: 6, letterSpacing: '0.3px' };
  const err = (msg) => msg
    ? <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{msg}</p>
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', fontFamily: "'DM Sans', sans-serif"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop  { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fade { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .pm-tab { transition: all 0.2s; }
        .pm-tab:hover { background: #f3f4f6 !important; }
        .pm-btn { transition: background 0.2s, transform 0.1s; }
        .pm-btn:hover:not(:disabled) { filter: brightness(0.93); transform: translateY(-1px); }
        .pm-btn:active:not(:disabled) { transform: translateY(0); }
        .pm-inp:focus { border-color: #32be8f !important; background: #fff !important; }
      `}</style>

      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        animation: 'fade 0.25s ease'
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: 2 }}>Paying for</p>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem',
                        maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {itemTitle}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: 2 }}>Total</p>
            <p style={{ fontWeight: 800, color: '#32be8f', fontSize: '1.3rem' }}>₹{amount}</p>
          </div>
        </div>

        {/* ── STEP: form ── */}
        {step === 'form' && (
          <div style={{ padding: '20px 24px 24px' }}>
            {/* Tabs */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 22
            }}>
              {['card', 'upi'].map(t => (
                <button key={t} className="pm-tab"
                  onClick={() => { setTab(t); setErrors({}); }}
                  style={{
                    padding: '9px', border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.85rem',
                    background: tab === t ? '#fff' : 'transparent',
                    color: tab === t ? '#111' : '#888',
                    boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}>
                  {t === 'card' ? '💳 Card' : '📱 UPI'}
                </button>
              ))}
            </div>

            {/* ── Card tab ── */}
            {tab === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>Name on card</label>
                  <input className="pm-inp" placeholder="Laksh Jain" style={inp(errors.name)}
                    value={card.name}
                    onChange={e => setCard({ ...card, name: e.target.value })}/>
                  {err(errors.name)}
                </div>
                <div>
                  <label style={lbl}>Card number</label>
                  <input className="pm-inp" placeholder="4111 1111 1111 1111" style={inp(errors.number)}
                    value={card.number}
                    onChange={e => setCard({ ...card, number: formatCardNumber(e.target.value) })}/>
                  {err(errors.number)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Expiry</label>
                    <input className="pm-inp" placeholder="MM/YY" style={inp(errors.expiry)}
                      value={card.expiry}
                      onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}/>
                    {err(errors.expiry)}
                  </div>
                  <div>
                    <label style={lbl}>CVV</label>
                    <input className="pm-inp" placeholder="•••" type="password" maxLength={4} style={inp(errors.cvv)}
                      value={card.cvv}
                      onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g,'').slice(0,4) })}/>
                    {err(errors.cvv)}
                  </div>
                </div>

                {/* test card hint */}
                <div style={{
                  background: '#f0fdf9', border: '1px solid #6ee7c7',
                  borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#0f9f6e'
                }}>
                  💡 Test card: <strong>4111 1111 1111 1111</strong> · Expiry: <strong>12/26</strong> · CVV: <strong>123</strong>
                </div>
              </div>
            )}

            {/* ── UPI tab ── */}
            {tab === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: 20,
                  padding: '16px 0', flexWrap: 'wrap'
                }}>
                  {[
                    { name: 'GPay',    color: '#4285F4', icon: 'G' },
                    { name: 'PhonePe', color: '#5f259f', icon: 'P' },
                    { name: 'Paytm',   color: '#00BAF2', icon: 'T' },
                    { name: 'BHIM',    color: '#00A859', icon: 'B' },
                  ].map(app => (
                    <div key={app.name} style={{ textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: app.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1.1rem', margin: '0 auto 6px',
                        boxShadow: `0 4px 12px ${app.color}44`
                      }}>{app.icon}</div>
                      <p style={{ fontSize: '0.7rem', color: '#666', fontWeight: 500 }}>{app.name}</p>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, color: '#bbb', fontSize: '0.8rem'
                }}>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}/>
                  or enter UPI ID
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}/>
                </div>

                <div>
                  <label style={lbl}>UPI ID</label>
                  <input className="pm-inp" placeholder="yourname@upi" style={inp(errors.upi)}
                    value={upi}
                    onChange={e => setUpi(e.target.value)}/>
                  {err(errors.upi)}
                </div>

                <div style={{
                  background: '#f0fdf9', border: '1px solid #6ee7c7',
                  borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#0f9f6e'
                }}>
                  💡 Use any UPI ID for testing e.g. <strong>test@upi</strong>
                </div>
              </div>
            )}

            {/* Pay button */}
            <button className="pm-btn"
              onClick={handlePay}
              style={{
                width: '100%', marginTop: 22, padding: '15px',
                background: '#32be8f', color: '#fff', border: 'none',
                borderRadius: 12, fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', letterSpacing: '-0.2px'
              }}>
              Pay ₹{amount} Securely
            </button>

            <button onClick={onClose} style={{
              width: '100%', marginTop: 10, padding: '11px',
              background: 'none', color: '#999', border: 'none',
              fontSize: '0.85rem', cursor: 'pointer'
            }}>Cancel</button>

            {/* Trust strip */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16,
              fontSize: '0.72rem', color: '#bbb'
            }}>
              {['🔒 256-bit SSL', '✓ PCI DSS', '🛡 Secure checkout'].map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: processing ── */}
        {step === 'processing' && (
          <div style={{
            padding: '60px 24px', textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '4px solid #e5e7eb', borderTop: '4px solid #32be8f',
              margin: '0 auto 24px',
              animation: 'spin 0.8s linear infinite'
            }}/>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111', marginBottom: 8 }}>
              Processing Payment…
            </p>
            <p style={{ color: '#999', fontSize: '0.85rem' }}>
              Please do not close this window
            </p>
          </div>
        )}

        {/* ── STEP: success ── */}
        {step === 'success' && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#dcfce7', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pop 0.4s ease'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111', marginBottom: 6 }}>
              Payment Successful!
            </p>
            <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: 20 }}>
              Your booking is confirmed
            </p>

            <div style={{
              background: '#f8f9fa', borderRadius: 12, padding: '14px 18px',
              textAlign: 'left', marginBottom: 24
            }}>
              {[
                ['Item',       itemTitle],
                ['Amount',     `₹${amount}`],
                ['Txn ID',     txnId],
                ['Status',     'Paid'],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: '1px solid #f0f0f0',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: '#888' }}>{k}</span>
                  <span style={{
                    fontWeight: 600, color: k === 'Status' ? '#16a34a' : '#111',
                    maxWidth: 200, textAlign: 'right', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>{v}</span>
                </div>
              ))}
            </div>

            <button className="pm-btn"
              onClick={() => onSuccess(txnId)}
              style={{
                width: '100%', padding: '14px',
                background: '#32be8f', color: '#fff', border: 'none',
                borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: 'pointer'
              }}>
              View Order Confirmation →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
