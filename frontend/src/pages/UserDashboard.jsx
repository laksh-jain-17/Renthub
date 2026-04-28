import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GREEN = '#32be8f';
const GREEN_DARK = '#249c72';
const GREEN_LIGHT = '#e6fffa';
import API_BASE_URL from '../config';
const API = API_BASE_URL;

const isAdmin = () => JSON.parse(localStorage.getItem('userRoles') || '[]').includes('admin');

const StarRating = ({ rating, size = '0.9rem' }) => {
  if (!rating || rating === 0) return <span style={{ color: '#bbb', fontSize: '0.78rem' }}>No reviews</span>;
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: rating >= i ? '#facc15' : '#e0e0e0', fontSize: size }}>★</span>
      ))}
    </span>
  );
};

// ── Profile Completion Banner ────────────────────────────────────────────────

const getProfileCompletion = (user) => {
  if (!user) return { percent: 0, missing: [], filled: [] };
  const fields = [
    { key: 'name',    label: 'Full Name',    icon: '👤' },
    { key: 'email',   label: 'Email',        icon: '📧' },
    { key: 'phone',   label: 'Phone Number', icon: '📱' },
    { key: 'address', label: 'Address',      icon: '📍' },
  ];
  const filled  = fields.filter(f => user[f.key] && String(user[f.key]).trim() !== '');
  const missing = fields.filter(f => !user[f.key] || String(user[f.key]).trim() === '');
  const percent = Math.round((filled.length / fields.length) * 100);
  return { percent, missing, filled };
};

const ProfileCompletionBanner = ({ onGoToProfile }) => {
  const [user, setUser] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;
    fetch(`${API}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data);
          // Trigger bar animation after mount
          setTimeout(() => setAnimating(true), 100);
        }
      })
      .catch(() => {});
  }, []);

  if (!user || dismissed) return null;

  const { percent, missing, filled } = getProfileCompletion(user);

  // Don't show if 100% complete
  if (percent === 100) return null;

  const isLow    = percent < 50;
  const isMid    = percent >= 50 && percent < 75;
  const isAlmost = percent >= 75;

  const barColor  = isLow ? '#f59e0b' : isMid ? '#3b82f6' : GREEN;
  const bgGrad    = isLow
    ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
    : isMid
    ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
    : 'linear-gradient(135deg, #f0fdf9 0%, #d1fae5 100%)';
  const borderCol = isLow ? '#fbbf24' : isMid ? '#93c5fd' : '#6ee7c7';
  const textColor = isLow ? '#92400e' : isMid ? '#1e40af' : '#065f46';
  const tagBg     = isLow ? '#fef3c7' : isMid ? '#dbeafe' : '#d1fae5';
  const tagColor  = isLow ? '#b45309' : isMid ? '#1d4ed8' : GREEN_DARK;

  const emoji  = isLow ? '⚡' : isMid ? '🚀' : '✨';
  const label  = isLow
    ? 'Your profile needs attention!'
    : isMid
    ? "You're halfway there!"
    : 'Almost complete!';

  return (
    <div style={{
      background: bgGrad,
      border: `1.5px solid ${borderCol}`,
      borderRadius: '20px',
      padding: '20px 24px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      animation: 'bannerSlideIn 0.4s ease',
    }}>

      {/* Decorative background circles */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: borderCol, opacity: 0.15, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20px', right: '80px',
        width: '70px', height: '70px', borderRadius: '50%',
        background: borderCol, opacity: 0.1, pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes bannerSlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barFill {
          from { width: 0%; }
        }
        .profile-banner-dismiss {
          opacity: 0.5; transition: opacity 0.2s;
        }
        .profile-banner-dismiss:hover { opacity: 1; }
        .complete-btn {
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .complete-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.15) !important;
        }
        .missing-chip {
          transition: transform 0.15s;
        }
        .missing-chip:hover { transform: scale(1.04); }
      `}</style>

      {/* Dismiss button */}
      <button
        className="profile-banner-dismiss"
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute', top: '14px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.1rem', color: textColor, lineHeight: 1,
          padding: '2px 6px', borderRadius: '6px',
        }}
        title="Dismiss"
      >✕</button>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left: progress ring + percent */}
        <div style={{
          flexShrink: 0,
          width: '72px', height: '72px', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke={borderCol} strokeWidth="6" opacity="0.4" />
            <circle
              cx="36" cy="36" r="30" fill="none"
              stroke={barColor} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - (animating ? percent : 0) / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: textColor, lineHeight: 1 }}>{percent}%</div>
          </div>
        </div>

        {/* Right: content */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem' }}>{emoji}</span>
            <span style={{ fontWeight: '700', color: textColor, fontSize: '0.98rem' }}>{label}</span>
            <span style={{
              padding: '2px 10px', borderRadius: '20px',
              background: tagBg, color: tagColor,
              fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase'
            }}>
              {filled.length}/{filled.length + missing.length} fields
            </span>
          </div>

          {/* Linear progress bar */}
          <div style={{
            height: '7px', background: `${borderCol}55`, borderRadius: '10px',
            marginBottom: '12px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '10px', background: barColor,
              width: animating ? `${percent}%` : '0%',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>

          {/* Missing fields chips */}
          {missing.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {missing.map(f => (
                <span
                  key={f.key}
                  className="missing-chip"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 12px', borderRadius: '20px',
                    background: 'rgba(255,255,255,0.7)', border: `1px solid ${borderCol}`,
                    fontSize: '0.78rem', fontWeight: '600', color: textColor, cursor: 'default',
                  }}
                >
                  {f.icon} {f.label} <span style={{ color: isLow ? '#ef4444' : '#94a3b8', fontSize: '0.7rem' }}>missing</span>
                </span>
              ))}
            </div>
          )}

          <button
            className="complete-btn"
            onClick={onGoToProfile}
            style={{
              padding: '9px 22px',
              background: barColor, color: 'white',
              border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
              boxShadow: `0 4px 12px ${barColor}55`,
            }}
          >
            Complete Profile →
          </button>
        </div>
      </div>
    </div>
  );
};

// ── NavBar ───────────────────────────────────────────────────────────────────

const NavBar = ({ activeTab, setActiveTab, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const tabs = [
    { key: 'browse',          label: 'Browse' },
    { key: 'my-bookings',     label: 'My Bookings' },
    { key: 'my-listings',     label: 'My Listings' },
    { key: 'rental-bookings', label: 'Rental Requests' },
    { key: 'earnings',        label: 'Earnings' },
    { key: 'payments',        label: 'Payments' },
  ];

  const handleTab = (key) => { setActiveTab(key); setMenuOpen(false); };

  return (
    <>
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 4%', height: '65px', background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100
      }}>
        <span style={{ fontWeight: '800', color: GREEN, fontSize: '1.4rem', letterSpacing: '1px' }}>
          RENTHUB
        </span>

        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'nowrap' }}
          className="desktop-tabs">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => handleTab(key)} style={{
              padding: '7px 14px', border: 'none', borderRadius: '20px',
              background: activeTab === key ? GREEN : 'transparent',
              color: activeTab === key ? 'white' : '#555',
              fontWeight: activeTab === key ? '700' : '500',
              cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}>{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin() && (
            <button
              onClick={() => window.location.href = '/dashboard/admin'}
              style={{
                padding: '7px 16px', background: '#c62828', color: 'white',
                border: 'none', borderRadius: '20px', cursor: 'pointer',
                fontWeight: '700', fontSize: '0.85rem'
              }}
            >🔴 Admin Panel</button>
          )}
          <button onClick={() => handleTab('profile')} style={{
            padding: '7px 18px',
            background: activeTab === 'profile' ? GREEN : 'white',
            color: activeTab === 'profile' ? 'white' : GREEN,
            border: `2px solid ${GREEN}`, borderRadius: '20px',
            cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
          }}>Profile</button>
          <button onClick={onLogout} style={{
            padding: '7px 16px', background: 'none',
            border: '2px solid #e57373', borderRadius: '20px',
            color: '#e57373', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
          }}>Logout</button>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'none', flexDirection: 'column', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            }}
            id="hamburger"
          >
            {[0,1,2].map(i => (
              <span key={i} style={{ display: 'block', width: '22px', height: '2px', background: '#555', borderRadius: '2px' }} />
            ))}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: '65px', left: 0, right: 0, zIndex: 99,
          background: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          padding: '12px 0', borderTop: '1px solid #eee'
        }}>
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => handleTab(key)} style={{
              display: 'block', width: '100%', padding: '13px 24px',
              border: 'none', background: activeTab === key ? GREEN_LIGHT : 'transparent',
              color: activeTab === key ? GREEN : '#333',
              fontWeight: activeTab === key ? '700' : '500',
              cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left',
              borderLeft: activeTab === key ? `4px solid ${GREEN}` : '4px solid transparent'
            }}>{label}</button>
          ))}
          {isAdmin() && (
            <button
              onClick={() => window.location.href = '/dashboard/admin'}
              style={{
                display: 'block', width: '100%', padding: '13px 24px',
                border: 'none', background: '#fff5f5', color: '#c62828',
                fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', textAlign: 'left',
                borderLeft: '4px solid #c62828'
              }}
            >🔴 Admin Panel</button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-tabs { display: none !important; }
          #hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
};

// ── BrowseItems (with Profile Banner) ───────────────────────────────────────

const BrowseItems = ({ onGoToProfile }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/items/all`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setItems)
      .catch(() => setError('Failed to load items'))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', 'Camera', 'Gaming', 'Camping', 'Gym'];

  const filtered = items
    .filter(item => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchPrice = item.pricePerDay <= maxPrice;
      return matchSearch && matchCategory && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'newest')     return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'price-asc')  return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'price-desc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'rating')     return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  if (loading) return <Loader text="Loading items..." />;

  return (
    <div>
      {/* ✅ Profile Completion Banner */}
      <ProfileCompletionBanner onGoToProfile={onGoToProfile} />

      <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '25px', fontWeight: '700' }}>
        Explore Gear
      </h1>

      <input
        type="text" placeholder="Search items..."
        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        style={{
          width: '100%', padding: '14px 20px', borderRadius: '50px',
          border: '1px solid #ddd', fontSize: '1rem', marginBottom: '18px',
          outline: 'none', boxSizing: 'border-box'
        }}
      />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
            padding: '9px 22px', borderRadius: '25px', border: '1px solid #ddd',
            background: selectedCategory === cat ? GREEN : 'white',
            color: selectedCategory === cat ? 'white' : '#333',
            cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s'
          }}>{cat}</button>
        ))}
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{
            marginLeft: 'auto', padding: '9px 16px', borderRadius: '25px',
            border: '1px solid #ddd', fontSize: '0.88rem', cursor: 'pointer',
            background: 'white', color: '#333', outline: 'none'
          }}
        >
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        background: 'white', padding: '14px 20px', borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '28px'
      }}>
        <span style={{ fontSize: '0.88rem', color: '#555', whiteSpace: 'nowrap', fontWeight: '600' }}>
          Max Price:
        </span>
        <input
          type="range" min="100" max="5000" step="100"
          value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
          style={{ flex: 1, accentColor: GREEN }}
        />
        <span style={{
          minWidth: '80px', padding: '5px 14px', background: GREEN_LIGHT,
          color: GREEN, borderRadius: '20px', fontWeight: '700', fontSize: '0.88rem', textAlign: 'center'
        }}>₹{maxPrice}/day</span>
        <button
          onClick={() => { setMaxPrice(5000); setSearchTerm(''); setSelectedCategory('All'); setSortBy('newest'); }}
          style={{
            padding: '6px 14px', background: '#f5f5f5', border: 'none',
            borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', color: '#888'
          }}
        >Reset</button>
      </div>

      <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '18px' }}>
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} found
      </p>

      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
        {filtered.length > 0 ? filtered.map(item => (
          <div
            key={item._id}
            onClick={() => navigate(`/items/${item._id}`)}
            style={{
              background: 'white', borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 5px 15px rgba(0,0,0,0.08)', transition: 'transform 0.3s', cursor: 'pointer'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              height: '210px',
              background: item.images?.length > 0 ? `url(${item.images[0]}) center/cover` : '#e0e0e0',
              position: 'relative'
            }}>
              {item.isVerified && (
                <div style={{
                  position: 'absolute', top: '10px', left: '10px',
                  background: 'rgba(255,255,255,0.95)', color: GREEN,
                  padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold'
                }}>✓ Verified</div>
              )}
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'rgba(0,0,0,0.55)', color: 'white',
                padding: '5px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '700'
              }}>₹{item.pricePerDay}/day</div>
            </div>
            <div style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#999', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '600' }}>
                  {item.category}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <StarRating rating={item.rating} />
                  {item.numReviews > 0 && <span style={{ color: '#aaa', fontSize: '0.75rem' }}>({item.numReviews})</span>}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#333', minHeight: '44px' }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '0.88rem', color: '#666', marginBottom: '14px',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '38px'
              }}>
                {item.description || 'No description available'}
              </p>
              <button style={{
                width: '100%', padding: '10px', background: GREEN, color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
              }}>View Details</button>
              {item.isVerified && (
                <div style={{ marginTop: '10px', padding: '9px', background: GREEN_LIGHT, borderRadius: '8px', fontSize: '0.78rem', color: GREEN, textAlign: 'center' }}>
                  Safety Tutorial Available
                </div>
              )}
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#999' }}>
            <h3 style={{ marginBottom: '10px' }}>No items found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MyBookings ───────────────────────────────────────────────────────────────

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    fetch(`${API}/api/bookings/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(async (data) => {
        setBookings(data);
        const reviewedMap = {};
        for (const b of data) {
          if (b.status === 'completed') {
            try {
              const res = await fetch(`${API}/api/reviews/can-review/${b._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const { canReview } = await res.json();
                reviewedMap[b._id] = !canReview;
              }
            } catch {}
          }
        }
        setReviewed(reviewedMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (res.ok) setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
  };

  if (loading) return <Loader text="Loading bookings..." />;

  return (
    <div>
      <h1 style={{ fontSize: '2.2rem', color: '#333', marginBottom: '28px', fontWeight: '700' }}>
        My Bookings <span style={{ fontSize: '1rem', color: '#999', fontWeight: '400' }}>(items I rented)</span>
      </h1>
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" sub="Start by browsing available gear!" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '24px' }}>
          {bookings.map(b => (
            <div key={b._id} style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.07)' }}>
              <div style={{ height: '150px', background: b.item?.images?.[0] ? `url(${b.item.images[0]}) center/cover` : GREEN_LIGHT }} />
              <div style={{ padding: '18px' }}>
                <h4 style={{ fontSize: '1.05rem', color: '#333', marginBottom: '4px' }}>{b.item?.title || 'Item'}</h4>
                <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '12px' }}>{b.item?.category}</p>
                <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <strong>Dates:</strong> {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                </p>
                <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <strong>Total:</strong> <span style={{ color: GREEN, fontWeight: '700' }}>₹{b.totalPrice}</span>
                </p>
                <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '14px' }}>
                  <strong>Delivery:</strong> {b.deliveryType || 'Standard'}
                </p>
                <StatusBadge status={b.status} />
                {b.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(b._id)}
                    style={{
                      marginTop: '10px', width: '100%', padding: '9px',
                      background: '#fef2f2', color: '#b91c1c',
                      border: '1px solid #fca5a5', borderRadius: '8px',
                      cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                    }}
                  >Cancel Booking</button>
                )}
                {b.status === 'completed' && (
                  reviewed[b._id] ? (
                    <p style={{ marginTop: '12px', fontSize: '0.82rem', color: GREEN, fontWeight: '600' }}>✓ Reviewed</p>
                  ) : (
                    <button
                      onClick={() => navigate(`/items/${b.item?._id}`)}
                      style={{
                        marginTop: '12px', width: '100%', padding: '9px',
                        background: GREEN_LIGHT, color: GREEN,
                        border: `1px solid ${GREEN}`, borderRadius: '8px',
                        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                      }}
                    >★ Rate this item</button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── ImageUpload ──────────────────────────────────────────────────────────────

const ImageUpload = ({ onFileSelect, preview }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select a valid image file.'); return; }
    onFileSelect(file);
  };

  return (
    <div>
      <div
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${dragOver ? GREEN : '#ccc'}`, borderRadius: '10px',
          padding: '20px', textAlign: 'center', cursor: 'pointer',
          background: dragOver ? GREEN_LIGHT : preview ? '#f0fdf9' : '#fafafa',
          transition: 'all 0.2s', minHeight: '110px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" style={{ maxHeight: '90px', maxWidth: '100%', borderRadius: '8px', objectFit: 'cover' }} />
            <span style={{ fontSize: '0.75rem', color: GREEN, fontWeight: '600' }}>✓ Image selected — click to change</span>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem' }}>📷</div>
            <p style={{ margin: 0, color: '#888', fontSize: '0.88rem' }}>Click to upload or drag & drop</p>
            <p style={{ margin: 0, color: '#bbb', fontSize: '0.78rem' }}>PNG, JPG, WEBP supported</p>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
};

// ── MyListings ───────────────────────────────────────────────────────────────

const MyListings = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({ title: '', category: 'camera', pricePerDay: '', description: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    try {
      const r = await fetch(`${API}/api/items/owner/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) setItems(await r.json());
    } catch {} finally { setLoading(false); }
  };

  const handleFileSelect = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('pricePerDay', formData.pricePerDay);
      data.append('description', formData.description);
      data.append('owner', userId);
      if (imageFile) data.append('image', imageFile);
      const r = await fetch(`${API}/api/items/add`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: data
      });
      if (r.ok) {
        const newItem = await r.json();
        setItems(prev => [...prev, newItem]);
        setShowForm(false);
        setFormData({ title: '', category: 'camera', pricePerDay: '', description: '' });
        setImageFile(null); setImagePreview('');
      }
    } catch {}
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${API}/api/items/${itemId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) setItems(prev => prev.filter(i => i._id !== itemId));
    } catch {}
  };

  const handleEditClick = (item) => {
    setEditingItem(item._id);
    setEditForm({ title: item.title, category: item.category, pricePerDay: item.pricePerDay, description: item.description || '' });
  };

  const handleEditSave = async (itemId) => {
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${API}/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (r.ok) {
        const updated = await r.json();
        setItems(prev => prev.map(i => i._id === itemId ? updated : i));
        setEditingItem(null);
      }
    } catch {}
  };

  if (loading) return <Loader text="Loading your listings..." />;

  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '7px', fontWeight: '600', color: '#444', fontSize: '0.9rem' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2.2rem', color: '#333', fontWeight: '700' }}>
          My Listings <span style={{ fontSize: '1rem', color: '#999', fontWeight: '400' }}>(items I rent out)</span>
        </h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '11px 24px', background: showForm ? '#ddd' : GREEN,
          color: showForm ? '#333' : 'white', border: 'none', borderRadius: '10px',
          cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem'
        }}>{showForm ? 'Cancel' : '+ Add Item'}</button>
      </div>

      <div style={{ display: 'block', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '2.2rem', color: '#333', fontWeight: '700' }}>Terms and Conditions</h3>
        <ul style={{ marginTop: '15px' }}>
          <li>The seller must check its item whether it's in good condition before renting it to someone.</li>
          <li>The item must be not more than 10-15 years old.</li>
          <li>The seller is aware and face consequences if he / she doesn't follow the terms.</li>
        </ul>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '18px', marginBottom: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.07)' }}>
          <h3 style={{ marginBottom: '22px', color: '#333' }}>List New Item</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Item Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                  <option value="camera">Camera</option>
                  <option value="gaming">Gaming</option>
                  <option value="camping">Camping</option>
                  <option value="gym">Gym</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price Per Day (₹)</label>
                <input type="number" value={formData.pricePerDay} onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Item Image</label>
                <ImageUpload onFileSelect={handleFileSelect} preview={imagePreview} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} />
            </div>
            <button type="submit" style={{ padding: '12px 30px', background: GREEN, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Save Item</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '22px' }}>
        {items.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }}>
            <EmptyState title="No listings yet" sub='Click "+ Add Item" to list your first item.' />
          </div>
        ) : items.map(item => (
          <div key={item._id} style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.06)' }}>
            <div style={{ height: '150px', background: item.images?.length > 0 ? `url(${item.images[0]}) center/cover` : '#f0fdf9', borderRadius: '15px 15px 0 0' }} />
            <div style={{ padding: '16px' }}>
              {editingItem === item._id ? (
                <div>
                  <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' }} />
                  <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' }}>
                    <option value="camera">Camera</option>
                    <option value="gaming">Gaming</option>
                    <option value="camping">Camping</option>
                    <option value="gym">Gym</option>
                  </select>
                  <input type="number" value={editForm.pricePerDay} onChange={e => setEditForm({ ...editForm, pricePerDay: e.target.value })} placeholder="Price per day"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '8px', boxSizing: 'border-box' }} />
                  <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditSave(item._id)} style={{ flex: 1, padding: '8px', background: GREEN, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Save</button>
                    <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '8px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 style={{ marginBottom: '4px', fontSize: '1.05rem', color: '#333' }}>{item.title}</h4>
                  <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '14px', textTransform: 'uppercase' }}>{item.category}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                    <span style={{ fontWeight: '700', color: GREEN, fontSize: '1.1rem' }}>₹{item.pricePerDay}/day</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditClick(item)} style={{ padding: '7px 14px', background: '#e8f4fd', color: '#1a73e8', border: '1px solid #b3d4f5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>Edit</button>
                      <button onClick={() => handleDelete(item._id)} style={{ padding: '7px 14px', background: '#fee', color: '#e53e3e', border: '1px solid #fcc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>Delete</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── RentalBookings ───────────────────────────────────────────────────────────

const RentalBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    fetch(`${API}/api/bookings/owner/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBookingStatus = async (bookingId, status) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status } : b));
  };

  if (loading) return <Loader text="Loading rental requests..." />;

  return (
    <div>
      <h1 style={{ fontSize: '2.2rem', color: '#333', marginBottom: '28px', fontWeight: '700' }}>
        Rental Requests <span style={{ fontSize: '1rem', color: '#999', fontWeight: '400' }}>(bookings on my listings)</span>
      </h1>
      {bookings.length === 0 ? (
        <EmptyState title="No rental requests yet" sub="Once someone books your item, it will appear here." />
      ) : (
        <div style={{ background: 'white', borderRadius: '18px', padding: '8px 20px', boxShadow: '0 5px 15px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                {['Item', 'Renter', 'Dates', 'Amount', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px', textAlign: 'left', color: '#555', fontWeight: '600', fontSize: '0.88rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '14px', fontWeight: '500' }}>{b.item?.title}</td>
                  <td style={{ padding: '14px', color: '#555' }}>{b.renter?.name}</td>
                  <td style={{ padding: '14px', fontSize: '0.85rem', color: '#666' }}>
                    {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px', fontWeight: '700', color: GREEN }}>₹{b.totalPrice}</td>
                  <td style={{ padding: '14px' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '14px' }}>
                    {b.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleBookingStatus(b._id, 'active')} style={{ padding: '6px 14px', background: '#e6fffa', color: '#0f9f6e', border: '1px solid #6ee7c7', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Accept</button>
                        <button onClick={() => handleBookingStatus(b._id, 'cancelled')} style={{ padding: '6px 14px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Earnings ─────────────────────────────────────────────────────────────────

const Earnings = () => {
  const [data, setData] = useState({ total: 0, thisMonth: 0, pending: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    fetch(`${API}/api/bookings/owner/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(bookings => {
        const total = bookings.reduce((s, b) => b.status === 'completed' || b.status === 'active' ? s + b.totalPrice : s, 0);
        const thisMonth = bookings.filter(b => new Date(b.createdAt).getMonth() === new Date().getMonth()).reduce((s, b) => s + b.totalPrice, 0);
        const pending = bookings.filter(b => b.status === 'active').reduce((s, b) => s + b.totalPrice, 0);
        setData({ total, thisMonth, pending, transactions: bookings });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading earnings..." />;

  return (
    <div>
      <h1 style={{ fontSize: '2.2rem', color: '#333', marginBottom: '28px', fontWeight: '700' }}>Earnings & Reports</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[
          { label: 'Total Earnings', value: `₹${data.total}`,     color: 'white',    bg: GREEN },
          { label: 'This Month',     value: `₹${data.thisMonth}`, color: GREEN,      bg: 'white' },
          { label: 'Pending',        value: `₹${data.pending}`,   color: '#f57c00',  bg: 'white' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, padding: '28px', borderRadius: '16px', boxShadow: '0 5px 15px rgba(0,0,0,0.07)', border: bg === 'white' ? '1px solid #eee' : 'none' }}>
            <div style={{ fontSize: '0.88rem', color: bg === GREEN ? 'rgba(255,255,255,0.85)' : '#888', marginBottom: '10px' }}>{label}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: '700', color }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: '18px', padding: '8px 20px', boxShadow: '0 5px 15px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <h3 style={{ padding: '14px 0', color: '#333', borderBottom: '2px solid #eee', marginBottom: '0' }}>Recent Transactions</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              {['Date', 'Item', 'Customer', 'Amount', 'Status'].map(h => (
                <th key={h} style={{ padding: '14px', textAlign: 'left', color: '#555', fontWeight: '600', fontSize: '0.88rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.transactions.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#bbb' }}>No transactions yet</td></tr>
            ) : data.transactions.map(t => (
              <tr key={t._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '14px', fontSize: '0.88rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '14px' }}>{t.item?.title}</td>
                <td style={{ padding: '14px', color: '#666' }}>{t.renter?.name}</td>
                <td style={{ padding: '14px', fontWeight: '700', color: GREEN }}>₹{t.totalPrice}</td>
                <td style={{ padding: '14px' }}><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Payments ─────────────────────────────────────────────────────────────────

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    fetch(`${API}/api/bookings/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setPayments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading payments..." />;

  const totalSpent = payments
    .filter(p => p.status === 'active' || p.status === 'completed')
    .reduce((s, p) => s + (p.totalPrice || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: '2.2rem', color: '#333', marginBottom: '10px', fontWeight: '700' }}>Payment History</h1>
      <div style={{ display: 'inline-flex', gap: '40px', background: 'white', borderRadius: '16px', padding: '18px 32px', boxShadow: '0 5px 15px rgba(0,0,0,0.06)', marginBottom: '28px' }}>
        <div>
          <p style={{ color: '#999', fontSize: '0.82rem', marginBottom: '4px' }}>Total Spent</p>
          <p style={{ color: GREEN, fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>₹{totalSpent}</p>
        </div>
        <div>
          <p style={{ color: '#999', fontSize: '0.82rem', marginBottom: '4px' }}>Transactions</p>
          <p style={{ color: '#333', fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>{payments.length}</p>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '18px', padding: '8px 20px', boxShadow: '0 5px 15px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              {['Date', 'Item', 'Amount', 'Status', 'Payment ID'].map(h => (
                <th key={h} style={{ padding: '14px', textAlign: 'left', color: '#555', fontWeight: '600', fontSize: '0.88rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#bbb' }}>No payment history yet</td></tr>
            ) : payments.map(p => {
              const paid = p.status === 'active' || p.status === 'completed';
              return (
                <tr key={p._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '14px', fontSize: '0.88rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px', fontWeight: '500' }}>{p.item?.title}</td>
                  <td style={{ padding: '14px', fontWeight: '700', color: GREEN }}>₹{p.totalPrice}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ padding: '5px 12px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: '600', background: paid ? GREEN_LIGHT : '#ffebee', color: paid ? GREEN : '#e53e3e' }}>
                      {paid ? 'Paid' : 'Cancelled'}
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontSize: '0.8rem', color: '#bbb' }}>{p.paymentId || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Profile ──────────────────────────────────────────────────────────────────

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    fetch(`${API}/api/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data);
          setFormData({ name: data.name || '', email: data.email || '', phone: data.phone || '', address: data.address || '' });
        } else navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const r = await fetch(`${API}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    const data = await r.json();
    if (r.ok) { setUser(data); setEditing(false); localStorage.setItem('userName', data.name); setMsg({ type: 'ok', text: 'Profile updated successfully!' }); }
    else setMsg({ type: 'err', text: data.message || 'Update failed' });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) return setMsg({ type: 'err', text: 'Passwords do not match' });
    if (pwData.newPassword.length < 6) return setMsg({ type: 'err', text: 'Min 6 characters' });
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const r = await fetch(`${API}/api/users/${userId}/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword })
    });
    const data = await r.json();
    if (r.ok) { setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setMsg({ type: 'ok', text: 'Password changed!' }); }
    else setMsg({ type: 'err', text: data.message || 'Failed' });
  };

  if (loading) return <Loader text="Loading profile..." />;

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', boxSizing: 'border-box' };
  const admin = isAdmin();

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '2.2rem', color: '#333', marginBottom: '28px', fontWeight: '700' }}>My Profile</h1>
      {msg.text && (
        <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', background: msg.type === 'ok' ? '#e6fffa' : '#fee', color: msg.type === 'ok' ? GREEN : '#c33', fontWeight: '500' }}>{msg.text}</div>
      )}

      <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.07)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '22px' }}>
        <div style={{
          width: '75px', height: '75px', borderRadius: '50%',
          background: admin ? 'linear-gradient(135deg, #c62828, #e53935)' : `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', color: 'white', fontWeight: '700', flexShrink: 0
        }}>
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.3rem' }}>{user?.name}</h2>
          <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '0.85rem' }}>{user?.email}</p>
          <span style={{
            display: 'inline-block', marginTop: '6px', padding: '3px 12px',
            background: admin ? '#fee2e2' : GREEN_LIGHT,
            color: admin ? '#c62828' : GREEN,
            borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700'
          }}>
            {admin ? '🔴 Admin' : 'Buyer & Seller'}
          </span>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.07)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Personal Information</h3>
          {!editing && <button onClick={() => setEditing(true)} style={{ padding: '8px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Edit</button>}
        </div>
        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
            {[
              { label: 'Full Name', key: 'name',  type: 'text' },
              { label: 'Email',     key: 'email', type: 'email', disabled: true },
              { label: 'Phone',     key: 'phone', type: 'tel' },
            ].map(({ label, key, type, disabled }) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>{label}</label>
                <input type={type} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                  disabled={!editing || disabled}
                  style={{ ...inputStyle, background: (!editing || disabled) ? '#f9f9f9' : 'white' }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>Address</label>
            <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
              disabled={!editing}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', background: !editing ? '#f9f9f9' : 'white' }} />
          </div>
          {editing && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ padding: '11px 28px', background: GREEN, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Save Changes</button>
              <button type="button" onClick={() => { setEditing(false); setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' }); }}
                style={{ padding: '11px 28px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
            </div>
          )}
        </form>
      </div>

      {admin ? (
        <div style={{ background: '#fff3e0', borderRadius: '20px', padding: '24px 30px', boxShadow: '0 5px 20px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 8px', color: '#f57c00' }}>Change Password</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
            Admin password is managed via server environment variables and cannot be changed here.
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 22px', color: '#333' }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            {[
              { label: 'Current Password',    key: 'currentPassword' },
              { label: 'New Password',         key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirmPassword' },
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>{label}</label>
                <input type="password" value={pwData[key]} onChange={e => setPwData({ ...pwData, [key]: e.target.value })} style={inputStyle} required />
              </div>
            ))}
            <button type="submit" style={{ padding: '11px 28px', background: GREEN, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Change Password</button>
          </form>
        </div>
      )}
    </div>
  );
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

const Loader = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '55vh' }}>
    <h2 style={{ color: GREEN }}>{text}</h2>
  </div>
);

const ErrorBox = ({ msg }) => (
  <div style={{ background: '#fee', color: '#c33', padding: '14px', borderRadius: '10px', marginBottom: '18px' }}>{msg}</div>
);

const EmptyState = ({ icon, title, sub }) => (
  <div style={{ background: 'white', borderRadius: '20px', padding: '60px', textAlign: 'center', color: '#999', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
    <div style={{ fontSize: '3rem', marginBottom: '14px' }}>{icon}</div>
    <h3 style={{ color: '#666', marginBottom: '8px' }}>{title}</h3>
    <p>{sub}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    active:    { bg: GREEN_LIGHT, color: GREEN },
    completed: { bg: '#e8f5e9',   color: '#2e7d32' },
    cancelled: { bg: '#ffebee',   color: '#c62828' },
    pending:   { bg: '#fff3e0',   color: '#f57c00' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', background: s.bg, color: s.color }}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
    </span>
  );
};

// ── UserDashboard ─────────────────────────────────────────────────────────────

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const renderTab = () => {
    switch (activeTab) {
      case 'browse':          return <BrowseItems onGoToProfile={() => setActiveTab('profile')} />;
      case 'my-bookings':     return <MyBookings />;
      case 'my-listings':     return <MyListings />;
      case 'rental-bookings': return <RentalBookings />;
      case 'earnings':        return <Earnings />;
      case 'payments':        return <Payments />;
      case 'profile':         return <Profile />;
      default:                return <BrowseItems onGoToProfile={() => setActiveTab('profile')} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main style={{ padding: '85px 5% 50px' }}>
        {renderTab()}
      </main>
    </div>
  );
};

export default UserDashboard;
