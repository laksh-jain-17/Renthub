import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';

/* ─── tiny helpers ─────────────────────────────────────── */
const isoDate = (d) => d.toISOString().split('T')[0];
const today   = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ─── Calendar component ────────────────────────────────── */
const RentalCalendar = ({ bookedRanges, onRangeSelect }) => {
  const [viewDate, setViewDate]     = useState(today());
  const [hoverDay, setHoverDay]     = useState(null);
  const [startDate, setStartDate]   = useState(null);
  const [endDate, setEndDate]       = useState(null);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // build a Set of booked ISO strings for O(1) lookup
  const bookedSet = React.useMemo(() => {
    const s = new Set();
    bookedRanges.forEach(({ start, end }) => {
      let cur = new Date(start);
      const last = new Date(end);
      while (cur <= last) { s.add(isoDate(cur)); cur = addDays(cur,1); }
    });
    return s;
  }, [bookedRanges]);

  const isBooked   = (d) => bookedSet.has(isoDate(d));
  const isPast     = (d) => d < today();
  const isDisabled = (d) => isBooked(d) || isPast(d);

  const isInRange = (d) => {
    if (!startDate) return false;
    const end = endDate || hoverDay;
    if (!end) return false;
    const lo = startDate < end ? startDate : end;
    const hi = startDate < end ? end : startDate;
    return d > lo && d < hi;
  };

  const isStart   = (d) => startDate && isoDate(d) === isoDate(startDate);
  const isEnd     = (d) => endDate   && isoDate(d) === isoDate(endDate);

  // check if any booked day lies within a candidate range
  const rangeHasBooked = (a, b) => {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    let cur = addDays(lo,1);
    while (cur < hi) { if (isBooked(cur)) return true; cur = addDays(cur,1); }
    return false;
  };

  const handleDayClick = (d) => {
    if (isDisabled(d)) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(d); setEndDate(null); setHoverDay(null);
    } else {
      if (isoDate(d) === isoDate(startDate)) { setStartDate(null); return; }
      if (rangeHasBooked(startDate, d)) {
        // reset and start fresh from clicked day
        setStartDate(d); setEndDate(null); return;
      }
      const lo = startDate < d ? startDate : d;
      const hi = startDate < d ? d : startDate;
      setStartDate(lo); setEndDate(hi);
      onRangeSelect(lo, hi);
    }
  };

  // days grid for current month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(year, month, d));

  const prevMonth = () => setViewDate(new Date(year, month-1, 1));
  const nextMonth = () => setViewDate(new Date(year, month+1, 1));
  const canPrev   = new Date(year, month, 1) > today();

  const days = startDate && endDate
    ? Math.ceil((endDate - startDate)/(1000*60*60*24)) || 1
    : 0;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <button onClick={prevMonth} disabled={!canPrev}
          style={{ background:'none', border:'none', fontSize:'1.4rem', cursor: canPrev ? 'pointer':'not-allowed',
                   color: canPrev ? '#111':'#ccc', lineHeight:1, padding:'4px 8px', borderRadius:'6px' }}>‹</button>
        <span style={{ fontWeight:700, fontSize:'1.05rem', color:'#111', letterSpacing:'-0.3px' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth}
          style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer',
                   color:'#111', lineHeight:1, padding:'4px 8px', borderRadius:'6px' }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'6px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'0.7rem', fontWeight:600,
                                color:'#999', paddingBottom:'6px', letterSpacing:'0.5px' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`}/>;
          const booked   = isBooked(d);
          const past     = isPast(d);
          const disabled = booked || past;
          const start    = isStart(d);
          const end      = isEnd(d);
          const inRange  = isInRange(d);
          const hovering = hoverDay && startDate && !endDate && isoDate(d) === isoDate(hoverDay);
          const isToday  = isoDate(d) === isoDate(today());

          let bg = 'transparent', color = '#222', radius = '8px';
          let textDeco = 'none', opacity = 1, fontWeight = 400;

          if (booked)  { bg = '#fde8e8'; color = '#e05'; }
          if (past)    { color = '#ccc'; }
          if (inRange) { bg = '#dcfbef'; radius = '0'; }
          if (start || end || hovering) {
            bg = '#32be8f'; color = '#fff'; fontWeight = 700;
            radius = start ? '8px 0 0 8px' : end ? '0 8px 8px 0' : '8px';
            if (start && !endDate && !hoverDay) radius = '8px';
          }
          if (isToday && !start && !end) { fontWeight = 700; }

          return (
            <div key={i}
              onClick={() => handleDayClick(d)}
              onMouseEnter={() => { if (startDate && !endDate) setHoverDay(d); }}
              onMouseLeave={() => setHoverDay(null)}
              style={{
                position:'relative', textAlign:'center', padding:'9px 2px',
                background: bg, borderRadius: radius,
                color, fontWeight, textDecoration: textDeco,
                opacity: disabled && !booked ? 0.35 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize:'0.88rem', transition:'background 0.12s',
                userSelect:'none'
              }}
            >
              {d.getDate()}
              {booked && (
                <div style={{
                  position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)',
                  width:4, height:4, borderRadius:'50%', background:'#e05'
                }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'18px', marginTop:'16px', flexWrap:'wrap' }}>
        {[
          { color:'#32be8f', label:'Selected' },
          { color:'#dcfbef', label:'Your range', border:'1px solid #32be8f' },
          { color:'#fde8e8', label:'Booked', border:'1px solid #fca5a5' },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', color:'#666' }}>
            <div style={{ width:12, height:12, borderRadius:3, background:color, border: border||'none' }}/>
            {label}
          </div>
        ))}
      </div>

      {/* Summary pill */}
      {startDate && (
        <div style={{
          marginTop:'16px', padding:'12px 16px',
          background: endDate ? '#f0fdf9' : '#fffbeb',
          border: `1px solid ${endDate ? '#6ee7c7' : '#fcd34d'}`,
          borderRadius:'10px', fontSize:'0.85rem', color:'#333'
        }}>
          {endDate ? (
            <span>
               <strong>{startDate.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</strong>
              {' → '}
              <strong>{endDate.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</strong>
              {' · '}
              <strong style={{ color:'#32be8f' }}>{days} day{days!==1?'s':''}</strong>
            </span>
          ) : (
            <span>🖱 Click another date to select end date</span>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main ProductDetail ────────────────────────────────── */
const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd,   setSelectedEnd]   = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => { fetchItemDetails(); }, [id]);

  const fetchItemDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data);
        // fetch existing bookings for this item to show on calendar
        fetchBookedRanges(data._id);
      } else { setError('Item not found'); }
    } catch { setError('Failed to load item'); }
    finally  { setLoading(false); }
  };

  const fetchBookedRanges = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/item/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        // expects [{startDate, endDate}, ...]
        setBookedRanges(data.map(b => ({ start: b.startDate, end: b.endDate })));
      }
    } catch {
      // silently fail — calendar still works, just no blocked dates shown
    }
  };

  const calculateDays = () => {
    if (!selectedStart || !selectedEnd) return 0;
    return Math.ceil((selectedEnd - selectedStart)/(1000*60*60*24)) || 1;
  };

  const calculateTotal = () => item ? item.pricePerDay * calculateDays() : 0;

  const handleRangeSelect = (start, end) => {
    setSelectedStart(start);
    setSelectedEnd(end);
    setBookingError('');
  };

  const handleCheckout = async () => {
    const token  = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token) { alert('Please login to continue'); navigate('/login'); return; }
    if (!selectedStart || !selectedEnd) { setBookingError('Please select your rental dates on the calendar.'); return; }

    setBooking(true); setBookingError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({
          itemId:     item._id,
          renterId:   userId,
          ownerId:    item.owner._id,
          startDate:  isoDate(selectedStart),
          endDate:    isoDate(selectedEnd),
          totalPrice: calculateTotal()
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Booking confirmed! Check "My Bookings" to view your rental.');
        navigate('/dashboard');
      } else {
        setBookingError(data.message || 'Checkout failed. Please try again.');
      }
    } catch {
      setBookingError('Could not connect to server. Please try again.');
    } finally { setBooking(false); }
  };

  /* ── loading / error states ── */
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #eee', borderTop:'3px solid #32be8f',
                      borderRadius:'50%', margin:'0 auto 16px', animation:'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:'#999', fontFamily:"'DM Sans', sans-serif" }}>Loading…</p>
      </div>
    </div>
  );

  if (error || !item) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
      <h2 style={{ fontFamily:"'DM Sans', sans-serif" }}>{error || 'Item not found'}</h2>
      <Link to="/catalog" style={{ marginTop:20, color:'#32be8f', textDecoration:'none' }}>← Back to Catalog</Link>
    </div>
  );

  const days = calculateDays();
  const total = calculateTotal();
  const ready = selectedStart && selectedEnd;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .btn-book { transition: background 0.2s, transform 0.1s; }
        .btn-book:hover:not(:disabled) { background: #249c72 !important; transform: translateY(-1px); }
        .btn-book:active:not(:disabled) { transform: translateY(0); }
        @media(max-width:900px){
          .pd-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#f5f5f3', padding:'100px 5% 60px', fontFamily:"'DM Sans', sans-serif" }}>

        <Link to="/catalog" style={{
          display:'inline-flex', alignItems:'center', gap:6, marginBottom:32,
          color:'#555', textDecoration:'none', fontSize:'0.9rem', fontWeight:500,
          background:'#fff', padding:'8px 16px', borderRadius:40,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)'
        }}>← Back to Catalog</Link>

        <div className="pd-grid" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, maxWidth:1200, margin:'0 auto'
        }}>
          {/* ── LEFT: image + info ── */}
          <div>
            <div style={{
              width:'100%', height:440,
              background: item.images?.length
                ? `url(${item.images[0]}) center/cover no-repeat`
                : 'linear-gradient(135deg,#e0f7ef,#b2f0d4)',
              borderRadius:20, marginBottom:16,
              boxShadow:'0 8px 32px rgba(50,190,143,0.12)'
            }}/>

            {item.isVerified && (
              <div style={{
                display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px',
                background:'#f0fdf9', border:'1px solid #6ee7c7', borderRadius:40,
                color:'#0f9f6e', fontSize:'0.85rem', fontWeight:600, marginBottom:16
              }}>
                <span style={{ fontSize:'1rem' }}>✓</span> Verified & Safe to rent
              </div>
            )}

            {/* Owner card */}
            <div style={{
              background:'#fff', borderRadius:16, padding:'20px 24px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <p style={{ fontSize:'0.75rem', fontWeight:600, color:'#999', letterSpacing:'0.8px',
                          textTransform:'uppercase', marginBottom:12 }}>Listed by</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:40, height:40, borderRadius:'50%',
                  background:'linear-gradient(135deg,#32be8f,#1a8c62)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:700, fontSize:'1rem'
                }}>
                  {(item.owner?.name||'?')[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight:600, color:'#222', fontSize:'0.95rem' }}>{item.owner?.name || 'Unknown'}</p>
                  <p style={{ color:'#999', fontSize:'0.8rem' }}>{item.owner?.email || ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: booking panel ── */}
          <div>
            {/* Title block */}
            <div style={{ marginBottom:24 }}>
              <span style={{
                display:'inline-block', padding:'4px 14px',
                background:'#f0f0ee', borderRadius:20, fontSize:'0.75rem',
                fontWeight:700, color:'#888', textTransform:'uppercase',
                letterSpacing:'0.6px', marginBottom:12
              }}>{item.category}</span>

              <h1 style={{
                fontFamily:"'DM Serif Display', serif", fontSize:'2.4rem',
                color:'#111', lineHeight:1.15, marginBottom:10
              }}>{item.title}</h1>

              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'#facc15', fontSize:'1rem' }}>★★★★★</span>
                <span style={{ color:'#666', fontSize:'0.85rem' }}>
                  {item.rating || '5.0'} · 45 reviews
                </span>
              </div>
            </div>

            {/* Price */}
            <div style={{
              display:'flex', alignItems:'baseline', gap:6,
              padding:'16px 20px', background:'#fff', borderRadius:14,
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:24
            }}>
              <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:'2.2rem', color:'#32be8f', fontWeight:400 }}>
                ₹{item.pricePerDay}
              </span>
              <span style={{ color:'#999', fontSize:'0.95rem' }}>/ day</span>
            </div>

            {/* Description */}
            {item.description && (
              <p style={{ color:'#666', lineHeight:1.7, fontSize:'0.92rem', marginBottom:24 }}>
                {item.description}
              </p>
            )}

            {/* ── CALENDAR CARD ── */}
            <div style={{
              background:'#fff', borderRadius:20,
              padding:'24px', marginBottom:20,
              boxShadow:'0 2px 16px rgba(0,0,0,0.07)'
            }}>
              <p style={{
                fontWeight:700, fontSize:'0.95rem', color:'#111',
                marginBottom:18, display:'flex', alignItems:'center', gap:8
              }}> Select Rental Dates
              </p>
              <RentalCalendar
                bookedRanges={bookedRanges}
                onRangeSelect={handleRangeSelect}
              />
            </div>

            {/* Price breakdown */}
            {ready && (
              <div style={{
                background:'#f0fdf9', border:'1px solid #6ee7c7',
                borderRadius:14, padding:'18px 20px', marginBottom:20
              }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                              color:'#555', fontSize:'0.9rem', marginBottom:10 }}>
                  <span>₹{item.pricePerDay} × {days} day{days!==1?'s':''}</span>
                  <span>₹{item.pricePerDay * days}</span>
                </div>
                <div style={{
                  display:'flex', justifyContent:'space-between', fontWeight:700,
                  fontSize:'1.15rem', color:'#0f9f6e',
                  paddingTop:10, borderTop:'1px solid #a7f3d0'
                }}>
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            )}

            {bookingError && (
              <div style={{
                background:'#fef2f2', border:'1px solid #fca5a5',
                color:'#b91c1c', padding:'12px 16px', borderRadius:10,
                fontSize:'0.85rem', marginBottom:16
              }}>{bookingError}</div>
            )}

            {/* CTA */}
            <button
              className="btn-book"
              onClick={handleCheckout}
              disabled={!ready || booking}
              style={{
                width:'100%', padding:'17px',
                background: ready ? '#32be8f' : '#d1d5db',
                color:'#fff', border:'none', borderRadius:12,
                fontSize:'1.05rem', fontWeight:700,
                cursor: ready ? 'pointer' : 'not-allowed',
                letterSpacing:'-0.2px'
              }}
            >
              {booking ? 'Confirming…' : ready ? `Confirm Booking · ₹${total}` : 'Pick dates above to continue'}
            </button>

            {/* Trust badges */}
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              gap:8, marginTop:16
            }}>
              {[' Secure', '↩ Free Cancel', ' 24/7 Support'].map(t => (
                <div key={t} style={{
                  textAlign:'center', padding:'10px 6px',
                  background:'#f9f9f7', borderRadius:10,
                  fontSize:'0.75rem', color:'#666', fontWeight:500
                }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
