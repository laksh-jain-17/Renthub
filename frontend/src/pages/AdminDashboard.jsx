import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/user-details/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch user details');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Permanently delete this account?")) return;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUsers(users.filter(u => u._id !== userId));
        setSelectedUser(null);
        alert("Account removed successfully");
      }
    } catch (err) { 
      console.error("Delete failed"); 
    }
  };

  const handleKycAction = async (userId, status) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/kyc-action/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchUsers();
        if (selectedUser && selectedUser.user._id === userId) {
          fetchUserDetails(userId);
        }
      }
    } catch (err) {
      console.error('KYC action failed');
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading users...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 400px' : '1fr', gap: '30px' }}>
      <div>
        <h2 style={{ marginBottom: '30px', fontSize: '2rem', fontWeight: '700' }}>User Management</h2>
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>KYC Status</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr 
                  key={user._id} 
                  style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: selectedUser?.user._id === user._id ? '#f0f4ff' : 'white'
                  }}
                  onClick={() => fetchUserDetails(user._id)}
                >
                  <td style={{ padding: '15px' }}>{user.name}</td>
                  <td style={{ padding: '15px' }}>{user.email}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      background: user.kycStatus === 'verified' ? '#e6fffa' : '#fff5f5',
                      color: user.kycStatus === 'verified' ? '#32be8f' : '#e53e3e'
                    }}>
                      {user.kycStatus || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {user.kycStatus === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKycAction(user._id, 'verified');
                            }}
                            style={{
                              padding: '5px 15px',
                              background: '#32be8f',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKycAction(user._id, 'rejected');
                            }}
                            style={{
                              padding: '5px 15px',
                              background: '#e53e3e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user._id);
                        }}
                        style={{ 
                          background: '#ffebee', 
                          color: '#c62828', 
                          border: 'none', 
                          padding: '5px 12px', 
                          borderRadius: '5px', 
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}>
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
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: '20px',
          height: 'fit-content'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '1.3rem' }}>User Details</h3>
            <button 
              onClick={() => setSelectedUser(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#999'
              }}
            >×</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #6f449a 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '700',
              margin: '0 auto 15px'
            }}>
              {selectedUser.user.name.charAt(0).toUpperCase()}
            </div>
            <h4 style={{ textAlign: 'center', marginBottom: '5px' }}>{selectedUser.user.name}</h4>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>{selectedUser.user.email}</p>
          </div>

          <div style={{ 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>Phone:</span>
              <p style={{ fontWeight: '600' }}>{selectedUser.user.phone || 'Not provided'}</p>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>Address:</span>
              <p style={{ fontWeight: '600' }}>{selectedUser.user.address || 'Not provided'}</p>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>Gender:</span>
              <p style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                {selectedUser.user.gender || 'Not provided'}
              </p>
            </div>
            <div>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>Member Since:</span>
              <p style={{ fontWeight: '600' }}>
                {new Date(selectedUser.user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>Activity Stats</h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{ 
                padding: '15px', 
                background: '#e6fffa', 
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#32be8f' }}>
                  {selectedUser.stats.itemsListed}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Items Listed</div>
              </div>
              <div style={{ 
                padding: '15px', 
                background: '#fff3e0', 
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f57c00' }}>
                  {selectedUser.stats.itemsRented}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Items Rented</div>
              </div>
            </div>

            <div style={{ 
              padding: '15px', 
              background: '#f0f4ff', 
              borderRadius: '10px',
              marginBottom: '10px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Total Earnings:</span>
                <span style={{ fontWeight: '700', color: '#667eea' }}>
                  ₹{selectedUser.stats.totalEarnings}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Total Spent:</span>
                <span style={{ fontWeight: '700', color: '#667eea' }}>
                  ₹{selectedUser.stats.totalSpent}
                </span>
              </div>
            </div>

            <div style={{ 
              padding: '15px', 
              background: '#ffebee', 
              borderRadius: '10px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>Cancelled Orders:</span>
                <span style={{ fontWeight: '700', color: '#c62828' }}>
                  {selectedUser.stats.cancelledOrders}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '10px', fontSize: '1.1rem' }}>Recent Transactions</h4>
            {selectedUser.recentTransactions.length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {selectedUser.recentTransactions.map(transaction => (
                  <div 
                    key={transaction._id}
                    style={{
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '3px' }}>
                      {transaction.item?.title}
                    </div>
                    <div style={{ color: '#666' }}>
                      ₹{transaction.totalPrice} • {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontSize: '0.9rem' }}>No transactions yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyVerification = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/items/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (itemId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/items/${itemId}/verify`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setItems(items.filter(item => item._id !== itemId));
        alert('Item verified successfully');
      }
    } catch (err) {
      console.error('Verification failed');
    }
  };

  const handleReject = async (itemId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/items/${itemId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setItems(items.filter(item => item._id !== itemId));
        alert('Item rejected');
      }
    } catch (err) {
      console.error('Rejection failed');
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading items...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '30px', fontSize: '2rem', fontWeight: '700' }}>Property Verification</h2>
      
      {items.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '50px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#999', fontSize: '1.1rem' }}>No pending verifications</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '25px'
        }}>
          {items.map(item => (
            <div key={item._id} style={{
              background: 'white',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                height: '200px',
                background: item.images && item.images.length > 0 
                  ? `url(${item.images[0]}) center/cover` 
                  : '#e0e0e0'
              }}></div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ color: '#666', marginBottom: '10px', fontSize: '0.9rem' }}>
                  {item.description}
                </p>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    <strong>Category:</strong> {item.category}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    <strong>Price:</strong> ₹{item.pricePerDay}/day
                  </p>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    <strong>Owner:</strong> {item.owner?.name} ({item.owner?.email})
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleVerify(item._id)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#32be8f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleReject(item._id)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PaymentMonitoring = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonth: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading payments...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '30px', fontSize: '2rem', fontWeight: '700' }}>Payment Monitoring</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '15px'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '10px' }}>Total Revenue</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>₹{stats.totalRevenue}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>This Month</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#32be8f' }}>₹{stats.thisMonth}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>Pending</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f57c00' }}>₹{stats.pendingPayments}</div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Recent Payments</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Transaction ID</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Amount</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Method</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '15px' }}>{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '15px', fontSize: '0.85rem', color: '#999' }}>
                  {payment.paymentId}
                </td>
                <td style={{ padding: '15px' }}>{payment.renter?.name}</td>
                <td style={{ padding: '15px' }}>{payment.item?.title}</td>
                <td style={{ padding: '15px', fontWeight: '600', color: '#667eea' }}>
                  ₹{payment.totalPrice}
                </td>
                <td style={{ padding: '15px', textTransform: 'capitalize' }}>
                  {payment.paymentMethod || 'Card'}
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '5px 12px',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    background: payment.status === 'completed' || payment.status === 'active' 
                      ? '#e6fffa' : '#ffebee',
                    color: payment.status === 'completed' || payment.status === 'active' 
                      ? '#32be8f' : '#e53e3e'
                  }}>
                    {payment.status === 'completed' || payment.status === 'active' ? 'Success' : 'Failed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
            No payment records yet
          </div>
        )}
      </div>
    </div>
  );
};

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTicket)
      });
      
      if (response.ok) {
        const ticket = await response.json();
        setTickets([ticket, ...tickets]);
        setShowForm(false);
        setNewTicket({ title: '', description: '', priority: 'medium' });
      }
    } catch (err) {
      console.error('Failed to create ticket');
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket');
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading tickets...</div>;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Support & Dispute Tickets</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 25px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {showForm ? 'Cancel' : 'Create Ticket'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>New Support Ticket</h3>
          <form onSubmit={handleCreateTicket}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Title
              </label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Priority
              </label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Create Ticket
            </button>
          </form>
        </div>
      )}

      <div style={{
        display: 'grid',
        gap: '20px'
      }}>
        {tickets.map(ticket => (
          <div
            key={ticket._id}
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '15px'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '8px' }}>{ticket.title}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
                  {ticket.description}
                </p>
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#999' }}>
                  <span>Ticket #{ticket.ticketNumber}</span>
                  <span>•</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  {ticket.user && (
                    <>
                      <span>•</span>
                      <span>{ticket.user.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: '15px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: ticket.priority === 'urgent' ? '#ffebee' :
                             ticket.priority === 'high' ? '#fff3e0' :
                             ticket.priority === 'medium' ? '#fff9e6' : '#f0f0f0',
                  color: ticket.priority === 'urgent' ? '#c62828' :
                        ticket.priority === 'high' ? '#f57c00' :
                        ticket.priority === 'medium' ? '#f9a825' : '#666'
                }}>
                  {ticket.priority.toUpperCase()}
                </span>
                <span style={{
                  padding: '5px 12px',
                  borderRadius: '15px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: ticket.status === 'resolved' ? '#e6fffa' :
                             ticket.status === 'in-progress' ? '#fff3e0' : '#f0f0f0',
                  color: ticket.status === 'resolved' ? '#32be8f' :
                        ticket.status === 'in-progress' ? '#f57c00' : '#666'
                }}>
                  {ticket.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {ticket.status !== 'resolved' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(ticket._id, 'in-progress')}
                    style={{
                      padding: '8px 20px',
                      background: '#fff3e0',
                      color: '#f57c00',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(ticket._id, 'resolved')}
                    style={{
                      padding: '8px 20px',
                      background: '#e6fffa',
                      color: '#32be8f',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}
                  >
                    Resolve
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div style={{
            background: 'white',
            padding: '50px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#999', fontSize: '1.1rem' }}>No tickets yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalItems: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeRentals: 0,
    completedRentals: 0,
    cancelledRentals: 0,
    monthlyRevenue: [],
    topCategories: [],
    topItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading analytics...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '30px', fontSize: '2rem', fontWeight: '700' }}>System Analytics</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '15px'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>₹{analytics.totalRevenue}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#667eea' }}>
            {analytics.totalUsers}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Total Items</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#32be8f' }}>
            {analytics.totalItems}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Total Bookings</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f57c00' }}>
            {analytics.totalBookings}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Rental Status</h3>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#666' }}>Active Rentals</span>
              <span style={{ fontWeight: '700', color: '#32be8f' }}>
                {analytics.activeRentals}
              </span>
            </div>
            <div style={{
              height: '8px',
              background: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: '#32be8f',
                width: `${(analytics.activeRentals / analytics.totalBookings) * 100}%`
              }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#666' }}>Completed Rentals</span>
              <span style={{ fontWeight: '700', color: '#667eea' }}>
                {analytics.completedRentals}
              </span>
            </div>
            <div style={{
              height: '8px',
              background: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: '#667eea',
                width: `${(analytics.completedRentals / analytics.totalBookings) * 100}%`
              }}></div>
            </div>
          </div>

          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#666' }}>Cancelled Rentals</span>
              <span style={{ fontWeight: '700', color: '#c62828' }}>
                {analytics.cancelledRentals}
              </span>
            </div>
            <div style={{
              height: '8px',
              background: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: '#c62828',
                width: `${(analytics.cancelledRentals / analytics.totalBookings) * 100}%`
              }}></div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Top Categories</h3>
          {analytics.topCategories.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#666', textTransform: 'capitalize' }}>{cat.category}</span>
                <span style={{ fontWeight: '700', color: '#667eea' }}>
                  {cat.count} items
                </span>
              </div>
              <div style={{
                height: '8px',
                background: '#f0f0f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  background: '#667eea',
                  width: `${(cat.count / analytics.topCategories[0].count) * 100}%`
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Top Performing Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Bookings</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {analytics.topItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '15px' }}>{item.title}</td>
                <td style={{ padding: '15px', textTransform: 'capitalize' }}>{item.category}</td>
                <td style={{ padding: '15px' }}>{item.bookingCount}</td>
                <td style={{ padding: '15px', fontWeight: '600', color: '#667eea' }}>
                  ₹{item.revenue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {analytics.topItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
            No data available yet
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fa' }}>
      <aside style={{
        width: '260px',
        background: 'white',
        borderRight: '1px solid #e0e0e0',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          fontSize: '1.2rem',
          fontWeight: '800',
          marginBottom: '40px',
          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>ADMIN PANEL</div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/dashboard/admin" onClick={() => setActiveTab('users')} style={{
            padding: '12px 15px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: activeTab === 'users' ? '#e74c3c' : '#666',
            background: activeTab === 'users' ? '#fee' : 'transparent',
            fontWeight: activeTab === 'users' ? '600' : '400'
          }}>
            User Management
          </Link>
          <Link to="verification" onClick={() => setActiveTab('verification')} style={{
            padding: '12px 15px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: activeTab === 'verification' ? '#e74c3c' : '#666',
            background: activeTab === 'verification' ? '#fee' : 'transparent',
            fontWeight: activeTab === 'verification' ? '600' : '400'
          }}>
            Property Verification
          </Link>
          <Link to="payments" onClick={() => setActiveTab('payments')} style={{
            padding: '12px 15px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: activeTab === 'payments' ? '#e74c3c' : '#666',
            background: activeTab === 'payments' ? '#fee' : 'transparent',
            fontWeight: activeTab === 'payments' ? '600' : '400'
          }}>
            Payment Monitoring
          </Link>
          <Link to="support" onClick={() => setActiveTab('support')} style={{
            padding: '12px 15px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: activeTab === 'support' ? '#e74c3c' : '#666',
            background: activeTab === 'support' ? '#fee' : 'transparent',
            fontWeight: activeTab === 'support' ? '600' : '400'
          }}>
            Support Tickets
          </Link>
          <Link to="analytics" onClick={() => setActiveTab('analytics')} style={{
            padding: '12px 15px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: activeTab === 'analytics' ? '#e74c3c' : '#666',
            background: activeTab === 'analytics' ? '#fee' : 'transparent',
            fontWeight: activeTab === 'analytics' ? '600' : '400'
          }}>
            Analytics
          </Link>
        </nav>
        
        <button onClick={handleLogout} style={{
          padding: '12px',
          background: 'none',
          border: 'none',
          color: '#d32f2f',
          cursor: 'pointer',
          fontWeight: '500'
        }}>
          Logout
        </button>
      </aside>

      <main style={{ flex: 1, padding: '40px' }}>
        <Routes>
          <Route path="/" element={<UserManagement />} />
          <Route path="verification" element={<PropertyVerification />} />
          <Route path="payments" element={<PaymentMonitoring />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
