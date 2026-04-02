import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
const API = API_BASE_URL;

// ✅ Star rating display component
const StarRating = ({ rating, size = '0.95rem' }) => {
  if (!rating || rating === 0) return <span style={{ color: '#bbb', fontSize: size }}>No reviews yet</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: rating >= i ? '#facc15' : '#e0e0e0', fontSize: size }}>★</span>
      ))}
    </span>
  );
};

const Catalog = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API}/api/items/all`);
      if (response.ok) {
        setItems(await response.json());
      } else {
        setError('Failed to load items');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (images) => {
    if (!images || images.length === 0) return null;
    const img = images[0];
    if (img.startsWith('http')) return img;
    if (img.startsWith('/uploads')) return `${API}${img}`;
    return `${API}/uploads/${img}`;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleProfileClick = () => {
    navigate(localStorage.getItem('token') ? '/profile' : '/login');
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h2>Loading Items...</h2>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 5%', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100
      }}>
        <Link to="/" style={{ fontWeight: 'bold', color: '#32be8f', fontSize: '1.5rem', textDecoration: 'none' }}>RENTHUB</Link>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link to="/catalog" style={{ padding: '10px 26px', color: '#32be8f', textDecoration: 'none', fontWeight: '600' }}>Catalog</Link>
          <button onClick={handleProfileClick} style={{
            padding: '10px 25px', background: '#32be8f', color: 'white',
            border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: '600'
          }}>My Profile</button>
        </div>
      </nav>

      <div style={{ padding: '100px 5% 50px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '30px' }}>Explore Gear</h1>

        <input type="text" placeholder="Search items..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '250px', padding: '15px 20px', borderRadius: '50px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', marginBottom: '20px', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {['All', 'Camera', 'Gaming', 'Camping', 'Gym'].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
              padding: '10px 25px', borderRadius: '25px', border: '1px solid #ddd',
              background: selectedCategory === cat ? '#32be8f' : 'white',
              color: selectedCategory === cat ? 'white' : '#333',
              cursor: 'pointer', fontWeight: '500', transition: 'all 0.3s'
            }}>{cat}</button>
          ))}
        </div>

        {error && <div style={{ background: '#fee', color: '#c33', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
          {filteredItems.length > 0 ? filteredItems.map((item) => {
            const imageUrl = getImageUrl(item.images);
            return (
              <Link key={item._id} to={`/item/${item._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'white', borderRadius: '20px', overflow: 'hidden',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.08)', transition: 'transform 0.3s', cursor: 'pointer', height: '100%'
                }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    height: '220px',
                    background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : '#e0e0e0',
                    position: 'relative'
                  }}>
                    {item.isVerified && (
                      <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'rgba(255,255,255,0.95)', color: '#32be8f',
                        padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold'
                      }}>✓ Verified</div>
                    )}
                  </div>

                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ color: '#999', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>{item.category}</span>
                      {/* ✅ Real star rating from reviews */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#666' }}>
                        <StarRating rating={item.rating} />
                        {item.numReviews > 0 && <span style={{ color: '#aaa', fontSize: '0.78rem' }}>({item.numReviews})</span>}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#333', minHeight: '50px' }}>{item.title}</h3>
                    <p style={{
                      fontSize: '0.9rem', color: '#666', marginBottom: '15px',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '40px'
                    }}>{item.description || 'No description available'}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#32be8f' }}>
                        ₹{item.pricePerDay}<span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#999' }}>/day</span>
                      </p>
                      <button style={{
                        padding: '10px 25px', background: '#32be8f', color: 'white',
                        border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
                      }}>View Details</button>
                    </div>

                    {item.isVerified && (
                      <div style={{ marginTop: '15px', padding: '10px', background: '#e6fffa', borderRadius: '8px', fontSize: '0.8rem', color: '#32be8f', textAlign: 'center' }}>
                        Safety Tutorial Available
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          }) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#999' }}>
              <h3 style={{ marginBottom: '10px' }}>No items found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
