// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { authFetch, logout, getUser } from '../utils/auth';

// ── Shared style helpers ───────────────────────────────────────────────────────

const card  = { background:'white', borderRadius:'15px', boxShadow:'0 5px 15px rgba(0,0,0,0.05)' };
const badge = (color, bg) => ({
  padding:'5px 12px', borderRadius:'15px', fontSize:'0.8rem', background:bg, color
});

// ══════════════════════════════════════════════════════════════════════════════
// MY LISTINGS  (admin acting as normal user / owner)
// ══════════════════════════════════════════════════════════════════════════════

const MyListings = () => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const user = getUser();

  useEffect(() => {
    if (!user?._id) { setError('User session missing — please log out and back in.'); setLoading(false); return; }
    authFetch(`${API_BASE_URL}/api/items/owner/${user._id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setItems)
      .catch(() => setError('Failed to load your listings.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading your listings…" />;

  return (
    <div>
      <h2 style={h2}>My Listings</h2>
      {error && <ErrorBox msg={error} />}
      {!error && items.length === 0 && (
        <div style={{ ...card, padding:'50px', textAlign:'center' }}>
          <p style={{ color:'#999' }}>You have no listings yet.</p>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'20px' }}>
        {items.map(item => (
          <div key={item._id} style={{ ...card, overflow:'hidden' }}>
            <div style={{
              height:'160px',
              background: item.images?.[0]
                ? `url(${API_BASE_URL}${item.images[0]}) center/cover`
                : '#e0e0e0'
            }} />
            <div style={{ padding:'20px' }}>
              <h3 style={{ marginBottom:'6px' }}>{item.title}</h3>
              <p style={{ color:'#666', fontSize:'0.9rem' }}>
                ₹{item.pricePerDay}/day &nbsp;•&nbsp;
                <span style={{ textTransform:'capitalize' }}>{item.category}</span>
              </p>
              <span style={{
                ...badge(item.available ? '#32be8f' : '#e53e3e',
                          item.available ? '#e6fffa'  : '#ffebee'),
                display:'inline-block', marginTop:'10px', fontSize:'0.75rem'
              }}>
                {item.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MY RENTALS  (admin acting as normal user / renter + owner bookings)
// ══════════════════════════════════════════════════════════════════════════════

const statusStyle = (status) => {
  const map = {
    active:    ['#32be8f','#e6fffa'],
    pending:   ['#f9a825','#fff9e6'],
    completed: ['#667eea','#f0f4ff'],
    cancelled: ['#e53e3e','#ffebee'],
  };
  const [color, bg] = map[status] || ['#666','#f0f0f0'];
  return badge(color, bg);
};

const BookingCard = ({ booking, showRenter }) => (
  <div style={{ ...card, padding:'20px', marginBottom:'12px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px' }}>
      <div style={{ flex:1 }}>
        <h4 style={{ marginBottom:'4px' }}>{booking.item?.title || '—'}</h4>
        {showRenter && (
          <p style={{ fontSize:'0.82rem', color:'#888', marginBottom:'3px' }}>
            Renter: {booking.renter?.name} ({booking.renter?.email})
          </p>
        )}
        <p style={{ color:'#666', fontSize:'0.85rem' }}>
          {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
        </p>
        <p style={{ color:'#32be8f', fontWeight:'700', marginTop:'4px' }}>₹{booking.totalPrice}</p>
      </div>
      <span style={{ ...statusStyle(booking.status), whiteSpace:'nowrap', fontSize:'0.75rem', fontWeight:'600' }}>
        {booking.status.toUpperCase()}
      </span>
    </div>
  </div>
);

const MyRentals = () => {
  const [ownerBookings,  setOwnerBookings]  = useState([]);
  const [renterBookings, setRenterBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const user = getUser();

  useEffect(() => {
    if (!user?._id) { setError('User session missing — please log out and back in.'); setLoading(false); return; }
    Promise.all([
      authFetch(`${API_BASE_URL}/api/bookings/owner/${user._id}`).then(r => r.ok ? r.json() : []),
      authFetch(`${API_BASE_URL}/api/bookings/user/${user._id}`).then(r  => r.ok ? r.json() : []),
    ])
      .then(([own, ren]) => { setOwnerBookings(own); setRenterBookings(ren); })
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading bookings…" />;

  return (
    <div>
      <h2 style={h2}>My Rental Activity</h2>
      {error && <ErrorBox msg={error} />}

      <Section title="Requests on My Items" count={ownerBookings.length}>
        {ownerBookings.length === 0
          ? <Empty text="No rental requests on your items yet." />
          : ownerBookings.map(b => <BookingCard key={b._id} booking={b} showRenter />)
        }
      </Section>

      <Section title="Items I've Rented" count={renterBookings.length}>
        {renterBookings.length === 0
          ? <Empty text="You haven't rented anything yet." />
          : renterBookings.map(b => <BookingCard key={b._id} booking={b} />)
        }
      </Section>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

const UserManagement = () => {
  const [users,        setUsers]        = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () =>
    authFetch(`${API_BASE_URL}/api/admin/users`)
      .then(r => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));

  const fetchUserDetails = (userId) =>
    authFetch(`${API_BASE_URL}/api/admin/user-details/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSelectedUser(d))
      .catch(() => {});

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this account?')) return;
    const r = await authFetch(`${API_BASE_URL}/api/admin/users/${userId}`, { method:'DELETE' });
    if (r.ok) { setUsers(u => u.filter(x => x._id !== userId)); setSelectedUser(null); }
  };

  const handleKycAction = async (userId, status) => {
    const r = await authFetch(`${API_BASE_URL}/api/admin/kyc-action/${userId}`, {
      method:'PUT', body: JSON.stringify({ status })
    });
    if (r.ok) {
      fetchUsers();
      if (selectedUser?.user._id === userId) fetchUserDetails(userId);
    }
  };

  if (loading) return <Spinner text="Loading users…" />;

  return (
    <div style={{ display:'grid', gridTemplateColumns: selectedUser ? '1fr 400px' : '1fr', gap:'30px' }}>
      <div>
        <h2 style={h2}>User Management</h2>
        <div style={{ ...card, padding:'20px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'2px solid #eee' }}>
                {['Name','Email','KYC Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'15px', textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}
                  style={{ borderBottom:'1px solid #f0f0f0', cursor:'pointer',
                    background: selectedUser?.user._id === user._id ? '#f0f4ff' : 'white' }}
                  onClick={() => fetchUserDetails(user._id)}
                >
                  <td style={{ padding:'15px' }}>{user.name}</td>
                  <td style={{ padding:'15px' }}>{user.email}</td>
                  <td style={{ padding:'15px' }}>
                    <span style={badge(
                      user.kycStatus === 'verified' ? '#32be8f' : '#e53e3e',
                      user.kycStatus === 'verified' ? '#e6fffa' : '#fff5f5'
                    )}>
                      {user.kycStatus || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding:'15px' }}>
                    <div style={{ display:'flex', gap:'8px' }}>
                      {user.kycStatus === 'pending' && <>
                        <ActionBtn color="#32be8f" label="Approve"
                          onClick={e => { e.stopPropagation(); handleKycAction(user._id,'verified'); }} />
                        <ActionBtn color="#e53e3e" label="Reject"
                          onClick={e => { e.stopPropagation(); handleKycAction(user._id,'rejected'); }} />
                      </>}
                      <button onClick={e => { e.stopPropagation(); handleDeleteUser(user._id); }}
                        style={{ background:'#ffebee', color:'#c62828', border:'none',
                          padding:'5px 12px', borderRadius:'5px', cursor:'pointer', fontSize:'0.85rem' }}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div style={{ ...card, padding:'25px', position:'sticky', top:'20px', height:'fit-content' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <h3>User Details</h3>
            <button onClick={() => setSelectedUser(null)}
              style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#999' }}>×</button>
          </div>
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <div style={{
              width:'80px', height:'80px', borderRadius:'50%', margin:'0 auto 12px',
              background:'linear-gradient(135deg,#667eea,#6f449a)',
              color:'white', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'2rem', fontWeight:'700'
            }}>
              {selectedUser.user.name.charAt(0).toUpperCase()}
            </div>
            <h4>{selectedUser.user.name}</h4>
            <p style={{ color:'#666', fontSize:'0.9rem' }}>{selectedUser.user.email}</p>
          </div>
          <div style={{ background:'#f8f9fa', borderRadius:'10px', padding:'15px', marginBottom:'20px' }}>
            {[
              ['Phone',   selectedUser.user.phone   || 'Not provided'],
              ['Address', selectedUser.user.address || 'Not provided'],
              ['Gender',  selectedUser.user.gender  || 'Not provided'],
              ['Member Since', new Date(selectedUser.user.createdAt).toLocaleDateString()],
            ].map(([label, val]) => (
              <div key={label} style={{ marginBottom:'10px' }}>
                <span style={{ color:'#666', fontSize:'0.85rem' }}>{label}:</span>
                <p style={{ fontWeight:'600', textTransform: label==='Gender' ? 'capitalize' : 'none' }}>{val}</p>
              </div>
            ))}
          </div>
          <h4 style={{ marginBottom:'12px' }}>Activity Stats</h4>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
            <StatBox label="Items Listed" value={selectedUser.stats.itemsListed} color="#32be8f" bg="#e6fffa" />
            <StatBox label="Items Rented" value={selectedUser.stats.itemsRented} color="#f57c00" bg="#fff3e0" />
          </div>
          <div style={{ background:'#f0f4ff', borderRadius:'10px', padding:'15px', marginBottom:'10px' }}>
            <StatRow label="Total Earnings" value={`₹${selectedUser.stats.totalEarnings}`} />
            <StatRow label="Total Spent"    value={`₹${selectedUser.stats.totalSpent}`} />
          </div>
          <div style={{ background:'#ffebee', borderRadius:'10px', padding:'15px', marginBottom:'20px' }}>
            <StatRow label="Cancelled Orders" value={selectedUser.stats.cancelledOrders} />
          </div>
          <h4 style={{ marginBottom:'10px' }}>Recent Transactions</h4>
          {selectedUser.recentTransactions.length > 0 ? (
            <div style={{ maxHeight:'200px', overflowY:'auto' }}>
              {selectedUser.recentTransactions.map(t => (
                <div key={t._id} style={{ background:'#f8f9fa', borderRadius:'8px', padding:'10px', marginBottom:'8px', fontSize:'0.85rem' }}>
                  <div style={{ fontWeight:'600' }}>{t.item?.title}</div>
                  <div style={{ color:'#666' }}>₹{t.totalPrice} • {new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color:'#999', fontSize:'0.9rem' }}>No transactions yet</p>}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PROPERTY VERIFICATION
// ══════════════════════════════════════════════════════════════════════════════

const PropertyVerification = () => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/admin/items/pending`)
      .then(r => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const action = async (itemId, endpoint) => {
    const r = await authFetch(`${API_BASE_URL}/api/admin/items/${itemId}/${endpoint}`, { method:'PUT' });
    if (r.ok) setItems(i => i.filter(x => x._id !== itemId));
  };

  if (loading) return <Spinner text="Loading items…" />;

  return (
    <div>
      <h2 style={h2}>Property Verification</h2>
      {items.length === 0
        ? <div style={{ ...card, padding:'50px', textAlign:'center' }}><p style={{ color:'#999' }}>No pending verifications</p></div>
        : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(350px,1fr))', gap:'25px' }}>
            {items.map(item => (
              <div key={item._id} style={{ ...card, overflow:'hidden' }}>
                <div style={{
                  height:'200px',
                  background: item.images?.[0] ? `url(${item.images[0]}) center/cover` : '#e0e0e0'
                }} />
                <div style={{ padding:'20px' }}>
                  <h3 style={{ marginBottom:'8px' }}>{item.title}</h3>
                  <p style={{ color:'#666', fontSize:'0.9rem', marginBottom:'10px' }}>{item.description}</p>
                  <p style={{ color:'#666', fontSize:'0.9rem' }}><strong>Category:</strong> {item.category}</p>
                  <p style={{ color:'#666', fontSize:'0.9rem' }}><strong>Price:</strong> ₹{item.pricePerDay}/day</p>
                  <p style={{ color:'#666', fontSize:'0.9rem', marginBottom:'15px' }}>
                    <strong>Owner:</strong> {item.owner?.name} ({item.owner?.email})
                  </p>
                  <div style={{ display:'flex', gap:'10px' }}>
                    <ActionBtn color="#32be8f" label="Verify"  onClick={() => action(item._id,'verify')}  flex />
                    <ActionBtn color="#e53e3e" label="Reject"  onClick={() => action(item._id,'reject')}  flex />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENT MONITORING
// ══════════════════════════════════════════════════════════════════════════════

const PaymentMonitoring = () => {
  const [payments, setPayments] = useState([]);
  const [stats,    setStats]    = useState({ totalRevenue:0, thisMonth:0, pendingPayments:0 });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/admin/payments`)
      .then(r => r.ok ? r.json() : { payments:[], stats:{} })
      .then(d => { setPayments(d.payments||[]); setStats(d.stats||{}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading payments…" />;

  return (
    <div>
      <h2 style={h2}>Payment Monitoring</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:'20px', marginBottom:'30px' }}>
        <div style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', padding:'30px', borderRadius:'15px' }}>
          <div style={{ fontSize:'0.9rem', opacity:0.9, marginBottom:'10px' }}>Total Revenue</div>
          <div style={{ fontSize:'2.5rem', fontWeight:'700' }}>₹{stats.totalRevenue}</div>
        </div>
        <div style={{ ...card, padding:'30px' }}>
          <div style={{ fontSize:'0.9rem', color:'#666', marginBottom:'10px' }}>This Month</div>
          <div style={{ fontSize:'2.5rem', fontWeight:'700', color:'#32be8f' }}>₹{stats.thisMonth}</div>
        </div>
        <div style={{ ...card, padding:'30px' }}>
          <div style={{ fontSize:'0.9rem', color:'#666', marginBottom:'10px' }}>Pending</div>
          <div style={{ fontSize:'2.5rem', fontWeight:'700', color:'#f57c00' }}>₹{stats.pendingPayments}</div>
        </div>
      </div>
      <div style={{ ...card, padding:'20px' }}>
        <h3 style={{ marginBottom:'20px' }}>Recent Payments</h3>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'2px solid #eee' }}>
              {['Date','Transaction ID','User','Item','Amount','Method','Status'].map(h => (
                <th key={h} style={{ padding:'15px', textAlign:'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map(p => {
              const ok = p.status === 'completed' || p.status === 'active';
              return (
                <tr key={p._id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                  <td style={{ padding:'15px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding:'15px', fontSize:'0.85rem', color:'#999' }}>{p.paymentId}</td>
                  <td style={{ padding:'15px' }}>{p.renter?.name}</td>
                  <td style={{ padding:'15px' }}>{p.item?.title}</td>
                  <td style={{ padding:'15px', fontWeight:'600', color:'#667eea' }}>₹{p.totalPrice}</td>
                  <td style={{ padding:'15px', textTransform:'capitalize' }}>{p.paymentMethod || 'Card'}</td>
                  <td style={{ padding:'15px' }}>
                    <span style={badge(ok ? '#32be8f' : '#e53e3e', ok ? '#e6fffa' : '#ffebee')}>
                      {ok ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {payments.length === 0 && <div style={{ textAlign:'center', padding:'30px', color:'#999' }}>No payment records yet</div>}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SUPPORT TICKETS
// ══════════════════════════════════════════════════════════════════════════════

const ADMIN_PRIORITY_COLORS = {
  low:    { color:'#388e3c', bg:'#e8f5e9' },
  medium: { color:'#f57c00', bg:'#fff3e0' },
  high:   { color:'#d32f2f', bg:'#ffebee' },
  urgent: { color:'#fff',    bg:'#c62828' },
};
const ADMIN_STATUS_COLORS = {
  open:           { color:'#1565c0', bg:'#e3f2fd' },
  'in-progress':  { color:'#f57c00', bg:'#fff3e0' },
  resolved:       { color:'#32be8f', bg:'#e6fffa' },
  closed:         { color:'#666',    bg:'#f0f0f0' },
};

const SupportTickets = () => {
  const [tickets,      setTickets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText,    setReplyText]    = useState('');
  const [sending,      setSending]      = useState(false);
  const [filter,       setFilter]       = useState('all');

  const fetchTickets = () =>
    authFetch(`${API_BASE_URL}/api/admin/tickets`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTickets(data); return data; })
      .catch(() => [])
      .finally(() => setLoading(false));

  useEffect(() => { fetchTickets(); }, []);

  // keep activeTicket in sync
  useEffect(() => {
    if (activeTicket) {
      const updated = tickets.find(t => t._id === activeTicket._id);
      if (updated) setActiveTicket(updated);
    }
  }, [tickets]);

  const handleStatus = async (id, status) => {
    const r = await authFetch(`${API_BASE_URL}/api/admin/tickets/${id}/status`, { method:'PUT', body:JSON.stringify({ status }) });
    if (r.ok) {
      const updated = await r.json();
      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !activeTicket) return;
    setSending(true);
    const r = await authFetch(`${API_BASE_URL}/api/admin/tickets/${activeTicket._id}/messages`, {
      method:'POST', body:JSON.stringify({ text: replyText.trim() }),
    });
    if (r.ok) {
      const updated = await r.json();
      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
      setActiveTicket(updated);
      setReplyText('');
    }
    setSending(false);
  };

  if (loading) return <Spinner text="Loading tickets…" />;

  const inputSt = { width:'100%', padding:'10px 14px', border:'1px solid #e0e0e0', borderRadius:10, fontSize:'0.95rem', boxSizing:'border-box', outline:'none', fontFamily:'inherit' };

  // ── Thread view ──────────────────────────────────────────────────────────────
  if (activeTicket) {
    const sc = ADMIN_STATUS_COLORS[activeTicket.status] || ADMIN_STATUS_COLORS.open;
    const pc = ADMIN_PRIORITY_COLORS[activeTicket.priority];
    const isResolved = activeTicket.status === 'resolved' || activeTicket.status === 'closed';
    return (
      <div>
        <button onClick={() => setActiveTicket(null)}
          style={{ background:'none', border:'none', color:'#667eea', cursor:'pointer', fontWeight:700, fontSize:'0.95rem', marginBottom:20, padding:0, display:'flex', alignItems:'center', gap:6 }}>
          ← Back to Tickets
        </button>

        {/* Header */}
        <div style={{ ...card, padding:'24px 28px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div style={{ flex:1 }}>
              <p style={{ color:'#aaa', fontSize:'0.78rem', margin:'0 0 6px' }}>#{activeTicket.ticketNumber}</p>
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, margin:'0 0 6px' }}>{activeTicket.title}</h2>
              <p style={{ color:'#666', fontSize:'0.9rem', margin:'0 0 10px' }}>{activeTicket.description}</p>
              {activeTicket.user && (
                <p style={{ color:'#888', fontSize:'0.82rem', margin:0 }}>
                  👤 {activeTicket.user.name} · {activeTicket.user.email}
                  {activeTicket.category && ` · ${activeTicket.category.charAt(0).toUpperCase()+activeTicket.category.slice(1)}`}
                </p>
              )}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', flexShrink:0 }}>
              <span style={{ padding:'5px 12px', borderRadius:20, fontSize:'0.75rem', fontWeight:700, ...pc }}>
                {activeTicket.priority.toUpperCase()}
              </span>
              <span style={{ padding:'5px 12px', borderRadius:20, fontSize:'0.75rem', fontWeight:700, ...sc }}>
                {activeTicket.status.replace('-',' ').toUpperCase()}
              </span>
            </div>
          </div>
          {/* Status actions */}
          <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
            {activeTicket.status !== 'in-progress' && activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
              <button onClick={() => handleStatus(activeTicket._id,'in-progress')}
                style={{ padding:'8px 18px', background:'#fff3e0', color:'#f57c00', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                Mark In Progress
              </button>
            )}
            {activeTicket.status !== 'resolved' && (
              <button onClick={() => handleStatus(activeTicket._id,'resolved')}
                style={{ padding:'8px 18px', background:'#e6fffa', color:'#32be8f', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                Mark Resolved
              </button>
            )}
            {activeTicket.status !== 'closed' && (
              <button onClick={() => handleStatus(activeTicket._id,'closed')}
                style={{ padding:'8px 18px', background:'#f5f5f5', color:'#666', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                Close Ticket
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
          {activeTicket.messages.length === 0 && (
            <div style={{ ...card, padding:28, textAlign:'center', color:'#bbb' }}>No messages yet.</div>
          )}
          {activeTicket.messages.map((msg, i) => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div key={i} style={{ display:'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:'75%', padding:'12px 16px',
                  borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isAdmin ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fff',
                  color: isAdmin ? '#fff' : '#333',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.07)', fontSize:'0.9rem', lineHeight:1.5,
                }}>
                  <p style={{ margin:'0 0 4px', fontWeight:600, fontSize:'0.75rem', opacity:0.75 }}>
                    {isAdmin ? '🛡️ Admin (You)' : `👤 ${activeTicket.user?.name || 'User'}`}
                  </p>
                  <p style={{ margin:0 }}>{msg.text}</p>
                  <p style={{ margin:'6px 0 0', fontSize:'0.72rem', opacity:0.6, textAlign:'right' }}>
                    {new Date(msg.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply box */}
        {!isResolved ? (
          <div style={{ ...card, padding:20 }}>
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Write your reply to the user…" rows={3}
              style={{ ...inputSt, resize:'vertical', marginBottom:12 }} />
            <button onClick={handleReply} disabled={sending || !replyText.trim()}
              style={{ padding:'11px 28px', background: sending || !replyText.trim() ? '#ccc' : 'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer', fontSize:'0.95rem' }}>
              {sending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        ) : (
          <div style={{ background:'#e6fffa', border:'1px solid #32be8f', borderRadius:12, padding:'16px 20px', color:'#0f9f6e', fontWeight:600, fontSize:'0.9rem' }}>
            ✓ This ticket is {activeTicket.status}.
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const STATUSES = ['all','open','in-progress','resolved','closed'];
  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const counts   = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? tickets.length : tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <h2 style={h2}>Support & Dispute Tickets</h2>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'8px 18px', borderRadius:20, border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.82rem',
              background: filter === s ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f0f0f0',
              color: filter === s ? '#fff' : '#666' }}>
            {s === 'all' ? 'All' : s.replace('-',' ').replace(/\b\w/g, c => c.toUpperCase())} ({counts[s]})
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gap:16 }}>
        {filtered.length === 0 && (
          <div style={{ ...card, padding:'50px', textAlign:'center' }}>
            <p style={{ color:'#999' }}>No tickets in this category.</p>
          </div>
        )}
        {filtered.map(t => {
          const sc = ADMIN_STATUS_COLORS[t.status] || ADMIN_STATUS_COLORS.open;
          const pc = ADMIN_PRIORITY_COLORS[t.priority];
          const lastMsg = t.messages[t.messages.length - 1];
          const unread  = t.messages.length > 0 && t.messages[t.messages.length - 1].sender === 'user';
          return (
            <div key={t._id} onClick={() => setActiveTicket(t)}
              style={{ ...card, padding:'22px 26px', cursor:'pointer', borderLeft:`4px solid ${sc.color}`, transition:'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 5px 15px rgba(0,0,0,0.05)'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, fontSize:'1rem' }}>{t.title}</span>
                    {unread && (
                      <span style={{ padding:'2px 8px', background:'#fdecea', color:'#c62828', borderRadius:20, fontSize:'0.7rem', fontWeight:700 }}>
                        User replied
                      </span>
                    )}
                  </div>
                  <p style={{ color:'#888', fontSize:'0.85rem', margin:'0 0 10px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {lastMsg ? lastMsg.text : t.description}
                  </p>
                  <div style={{ display:'flex', gap:10, fontSize:'0.75rem', color:'#bbb', flexWrap:'wrap' }}>
                    <span>#{t.ticketNumber}</span><span>·</span>
                    {t.user && <><span>{t.user.name}</span><span>·</span></>}
                    {t.category && <><span>{t.category.charAt(0).toUpperCase()+t.category.slice(1)}</span><span>·</span></>}
                    <span>{new Date(t.updatedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                    <span>·</span><span>{t.messages.length} msg{t.messages.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                  <span style={{ padding:'4px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, ...sc }}>
                    {t.status.replace('-',' ').toUpperCase()}
                  </span>
                  <span style={{ padding:'4px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, ...pc }}>
                    {t.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

const Analytics = () => {
  const [data,    setData]    = useState({ totalUsers:0, totalItems:0, totalBookings:0, totalRevenue:0,
    activeRentals:0, completedRentals:0, cancelledRentals:0, topCategories:[], topItems:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/admin/analytics`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setData(prev => ({ ...prev, ...d })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading analytics…" />;

  const Bar = ({ value, total, color }) => (
    <div style={{ height:'8px', background:'#f0f0f0', borderRadius:'4px', overflow:'hidden' }}>
      <div style={{ height:'100%', background:color, width:`${total ? (value/total)*100 : 0}%` }} />
    </div>
  );

  return (
    <div>
      <h2 style={h2}>System Analytics</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'20px', marginBottom:'30px' }}>
        <div style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', padding:'25px', borderRadius:'15px' }}>
          <div style={{ fontSize:'0.85rem', opacity:0.9, marginBottom:'8px' }}>Total Revenue</div>
          <div style={{ fontSize:'2rem', fontWeight:'700' }}>₹{data.totalRevenue}</div>
        </div>
        {[
          { label:'Total Users',    val:data.totalUsers,    color:'#667eea' },
          { label:'Total Items',    val:data.totalItems,    color:'#32be8f' },
          { label:'Total Bookings', val:data.totalBookings, color:'#f57c00' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ ...card, padding:'25px' }}>
            <div style={{ fontSize:'0.85rem', color:'#666', marginBottom:'8px' }}>{label}</div>
            <div style={{ fontSize:'2rem', fontWeight:'700', color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', marginBottom:'30px' }}>
        <div style={{ ...card, padding:'25px' }}>
          <h3 style={{ marginBottom:'20px' }}>Rental Status</h3>
          {[
            { label:'Active Rentals',    val:data.activeRentals,    color:'#32be8f' },
            { label:'Completed Rentals', val:data.completedRentals, color:'#667eea' },
            { label:'Cancelled Rentals', val:data.cancelledRentals, color:'#c62828' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ marginBottom:'15px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ color:'#666' }}>{label}</span>
                <span style={{ fontWeight:'700', color }}>{val}</span>
              </div>
              <Bar value={val} total={data.totalBookings} color={color} />
            </div>
          ))}
        </div>

        <div style={{ ...card, padding:'25px' }}>
          <h3 style={{ marginBottom:'20px' }}>Top Categories</h3>
          {data.topCategories.map((cat, i) => (
            <div key={i} style={{ marginBottom:'15px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ color:'#666', textTransform:'capitalize' }}>{cat.category}</span>
                <span style={{ fontWeight:'700', color:'#667eea' }}>{cat.count} items</span>
              </div>
              <Bar value={cat.count} total={data.topCategories[0]?.count} color="#667eea" />
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding:'25px' }}>
        <h3 style={{ marginBottom:'20px' }}>Top Performing Items</h3>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'2px solid #eee' }}>
              {['Item','Category','Bookings','Revenue'].map(h => (
                <th key={h} style={{ padding:'15px', textAlign:'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.topItems.map((item, i) => (
              <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                <td style={{ padding:'15px' }}>{item.title}</td>
                <td style={{ padding:'15px', textTransform:'capitalize' }}>{item.category}</td>
                <td style={{ padding:'15px' }}>{item.bookingCount}</td>
                <td style={{ padding:'15px', fontWeight:'600', color:'#667eea' }}>₹{item.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.topItems.length === 0 && <div style={{ textAlign:'center', padding:'30px', color:'#999' }}>No data yet</div>}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD SHELL
// ══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { to:'.',            tab:'users',        label:'User Management' },
  { to:'verification', tab:'verification', label:'Property Verification' },
  { to:'payments',     tab:'payments',     label:'Payment Monitoring' },
  { to:'support',      tab:'support',      label:'Support Tickets' },
  { to:'analytics',    tab:'analytics',    label:'Analytics' },
  { to:'my-listings',  tab:'my-listings',  label:'My Listings' },
  { to:'my-rentals',   tab:'my-rentals',   label:'My Rentals' },
];

const AdminDashboard = () => {
  const navigate   = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  const navStyle = (tab) => ({
    padding:'12px 15px', borderRadius:'10px', textDecoration:'none', display:'block',
    color:      activeTab === tab ? '#e74c3c' : '#666',
    background: activeTab === tab ? '#fee'    : 'transparent',
    fontWeight: activeTab === tab ? '600'     : '400',
  });

  // Divider between admin tabs and user tabs
  const isUserTab = (tab) => ['my-listings','my-rentals'].includes(tab);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f4f7fa' }}>
      <aside style={{
        width:'260px', background:'white', borderRight:'1px solid #e0e0e0',
        padding:'30px 20px', display:'flex', flexDirection:'column'
      }}>
        <div style={{
          fontSize:'1.2rem', fontWeight:'800', marginBottom:'40px',
          background:'linear-gradient(135deg,#e74c3c,#c0392b)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
        }}>
          ADMIN PANEL
        </div>

        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
          {NAV_ITEMS.map(({ to, tab, label }, i) => (
            <React.Fragment key={tab}>
              {/* Divider before user tabs */}
              {i > 0 && isUserTab(tab) && !isUserTab(NAV_ITEMS[i-1].tab) && (
                <div style={{ margin:'10px 0 4px', padding:'0 15px', fontSize:'0.72rem',
                  color:'#aaa', fontWeight:'700', letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  My Activity
                </div>
              )}
              <Link to={to} onClick={() => setActiveTab(tab)} style={navStyle(tab)}>
                {label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        <button onClick={() => navigate('/dashboard')}
          style={{ padding:'12px 15px', background:'#e6fffa', color:'#32be8f',
            border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700',
            textAlign:'left', fontSize:'0.95rem', marginBottom:'8px' }}>
          ← User Dashboard
        </button>
        <button onClick={logout}
          style={{ padding:'12px', background:'none', border:'none',
            color:'#d32f2f', cursor:'pointer', fontWeight:'500' }}>
          Logout
        </button>
      </aside>

      <main style={{ flex:1, padding:'40px', overflowY:'auto' }}>
        <Routes>
          <Route path="/"            element={<UserManagement />} />
          <Route path="verification" element={<PropertyVerification />} />
          <Route path="payments"     element={<PaymentMonitoring />} />
          <Route path="support"      element={<SupportTickets />} />
          <Route path="analytics"    element={<Analytics />} />
          <Route path="my-listings"  element={<MyListings />} />
          <Route path="my-rentals"   element={<MyRentals />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;

// ══════════════════════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

const h2 = { marginBottom:'30px', fontSize:'2rem', fontWeight:'700' };

const Spinner  = ({ text }) => <div style={{ padding:'50px', textAlign:'center', color:'#666' }}>{text}</div>;
const ErrorBox = ({ msg  }) => (
  <div style={{ background:'#ffebee', color:'#c62828', padding:'16px', borderRadius:'10px', marginBottom:'20px' }}>{msg}</div>
);
const Empty    = ({ text }) => <p style={{ color:'#999', margin:'10px 0 20px' }}>{text}</p>;

const Section = ({ title, count, children }) => (
  <div style={{ marginBottom:'32px' }}>
    <h3 style={{ marginBottom:'14px', color:'#444', fontSize:'1.1rem' }}>
      {title} <span style={{ color:'#aaa', fontWeight:'400', fontSize:'0.9rem' }}>({count})</span>
    </h3>
    {children}
  </div>
);

const StatBox = ({ label, value, color, bg }) => (
  <div style={{ padding:'15px', background:bg, borderRadius:'10px', textAlign:'center' }}>
    <div style={{ fontSize:'1.8rem', fontWeight:'700', color }}>{value}</div>
    <div style={{ fontSize:'0.8rem', color:'#666', marginTop:'5px' }}>{label}</div>
  </div>
);

const StatRow = ({ label, value }) => (
  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
    <span style={{ color:'#666', fontSize:'0.9rem' }}>{label}</span>
    <span style={{ fontWeight:'700', color:'#667eea' }}>{value}</span>
  </div>
);

const ActionBtn = ({ color, label, onClick, flex }) => (
  <button onClick={onClick} style={{
    ...(flex ? { flex:1 } : {}),
    padding:'8px 16px', background:color, color:'white',
    border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem'
  }}>
    {label}
  </button>
);
