import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const categories = [
    { name: 'Home Gym', desc: 'Weights & Benches' },
    { name: 'Camera Gear', desc: 'Lenses & Bodies' },
    { name: 'Gaming', desc: 'Consoles & VR' },
    { name: 'Camping', desc: 'Tents & Hiking' }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 5%',
        background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100
      }}>
        <div style={{
          fontWeight: 'bold',
          color: '#32be8f',
          fontSize: '1.5rem'
        }}>RENTHUB</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/login" style={{
            padding: '10px 25px',
            background: '#32be8f',
            color: 'white',
            borderRadius: '25px',
            textDecoration: 'none'
          }}>Login</Link>
          <Link to="/register" style={{
            padding: '10px 25px',
            border: '2px solid #32be8f',
            color: '#32be8f',
            borderRadius: '25px',
            textDecoration: 'none'
          }}>Register</Link>
        </div>
      </nav>

      <header style={{
        padding: '150px 5% 100px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #32be8f 0%, #249c72 100%)',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>Rent Premium Gear, Save Thousands.</h1>
        <p style={{
          fontSize: '1.2rem',
          maxWidth: '600px',
          margin: '20px auto 40px',
          opacity: 0.95
        }}>
          The marketplace where everyone can rent high-quality gear and list their own equipment — all in one account.
        </p>
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link to="/catalog" style={{
            padding: '15px 40px',
            background: 'white',
            color: '#32be8f',
            borderRadius: '30px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>Browse Catalog</Link>
          <Link to="/register" style={{
            padding: '15px 40px',
            border: '2px solid white',
            color: 'white',
            borderRadius: '30px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>Get Started</Link>
        </div>
      </header>

      <section style={{
        padding: '80px 5%',
        background: '#f9f9f9'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: '#333',
            marginBottom: '10px'
          }}>Popular Categories</h2>
          <p style={{
            color: '#666',
            fontSize: '1.1rem'
          }}>Explore our wide range of rental equipment</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {categories.map((cat, i) => (
            <div key={i} style={{
              background: 'white',
              padding: '40px 30px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
              transition: 'transform 0.3s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '80px',
                height: '80px',
                background: 'rgba(50, 190, 143, 0.1)',
                borderRadius: '50%',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#32be8f'
              }}>
                {cat.name.charAt(0)}
              </div>
              <h3 style={{
                fontSize: '1.3rem',
                marginBottom: '10px',
                color: '#333'
              }}>{cat.name}</h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#888'
              }}>{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{
        padding: '80px 5%',
        background: 'white'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: '#333',
            marginBottom: '30px'
          }}>How It Works</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            marginTop: '50px'
          }}>
            {[
              { step: '1', title: 'Create an Account', desc: 'Sign up once — rent gear and list your own equipment' },
              { step: '2', title: 'Browse & Book',     desc: 'Find the perfect gear, pick dates and pay securely' },
              { step: '3', title: 'Enjoy & Return',    desc: 'Use the equipment and return on time' },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: '#32be8f',
                  color: 'white',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>{step}</div>
                <h3 style={{ marginBottom: '10px', color: '#333' }}>{title}</h3>
                <p style={{ color: '#666' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{
        padding: '40px 5%',
        background: '#333',
        color: 'white',
        textAlign: 'center'
      }}>
        <p>© 2024 RentHub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;