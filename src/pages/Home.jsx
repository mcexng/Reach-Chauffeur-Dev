import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home({ onQuickBook, vehicles = [] }) {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('');

  const handleExploreSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !date) return;
    onQuickBook(pickup, date);
    navigate('/fleets');
    setTimeout(() => {
      const fleetSec = document.getElementById('fleet-selection-anchor');
      if (fleetSec) { fleetSec.scrollIntoView({ behavior: 'smooth' }); }
    }, 100);
  };

  const defaultFleet = [
    { name: 'Executive Sedan', desc: 'Sleek luxury for business professionals and standard airport transfers. Ensures quiet focus on the move.', img: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=2115&auto=format&fit=crop' },
    { name: 'Luxury SUV', desc: 'Spacious grandeur built for small delegations and extended itineraries with absolute comfort.', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop' },
    { name: 'First-Class Sprinter', desc: 'The ultimate mobile boardroom. Tailored for corporate roadshows and executive entourages.', img: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop' }
  ];

  // Use the vehicles from DB if available, otherwise fall back to default
  const displayFleet = vehicles.length > 0 ? vehicles.slice(0, 3).map(v => ({
    name: v.name,
    desc: v.tierLabel || v.tier || 'Premium chauffeur vehicle',
    img: v.images?.[0] || v.image1 || defaultFleet[0].img
  })) : defaultFleet;

  const whyUs = [
    { title: '99.8% Punctual', icon: '⏱️', desc: 'Our chauffeurs arrive 15 minutes prior to every scheduled departure.' },
    { title: 'Elite Fleet', icon: '🚘', desc: 'Immaculately maintained vehicles reflecting uncompromising corporate standards.' },
    { title: 'Secure & Discreet', icon: '🛡️', desc: 'Vetted professionals bound by strict non-disclosure and privacy protocols.' },
    { title: 'Seamless Tech', icon: '✨', desc: 'Live flight tracking and instant adjustments for any itinerary changes.' }
  ];

  return (
    <div className="home-layout">
      {/* Hero Banner Area */}
      <section className="hero-banner-wrapper">
        <div className="hero-banner" style={{ backgroundImage: `url(${displayFleet[0]?.img}), url(${defaultFleet[0].img})` }}>
          <div className="hero-content">
            <h1>Elevate Your Journey.<br/>Redefining Luxury Travel.</h1>
            <p>Experience unparalleled comfort, professionalism, and discretion with our premium chauffeur service.</p>
            <button className="btn-gold" onClick={() => document.getElementById('pickup-input').focus()}>BOOK YOUR RIDE</button>
          </div>
        </div>
         
        {/* Horizontal Booking Widget */}
        <div className="horizontal-widget-container">
          <form onSubmit={handleExploreSubmit} className="horizontal-widget">
            <div className="widget-fields">
              <div className="field-group">
                  <label>PICK-UP LOCATION</label>
                  <div className="input-wrapper">
                    <span className="icon">📍</span>
                    <input id="pickup-input" type="text" placeholder="e.g. Airport" value={pickup} onChange={e=>setPickup(e.target.value)} required/>
                  </div>
              </div>
              <div className="field-group">
                  <label>DROP-OFF LOCATION</label>
                  <div className="input-wrapper">
                    <span className="icon">📍</span>
                    <input type="text" placeholder="e.g. Hotel" value={dropoff} onChange={e=>setDropoff(e.target.value)}/>
                  </div>
              </div>
              <div className="field-group">
                <label>DATE & TIME</label>
                <div className="input-wrapper">
                  <span className="icon">📅</span>
                  <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required/>
                </div>
              </div>
              <div className="field-group">
                <label>PASSENGERS</label>
                <div className="input-wrapper">
                  <span className="icon">👥</span>
                  <select value={passengers} onChange={e=>setPassengers(e.target.value)}>
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4+">4+</option>
                  </select>
                </div>
              </div>
              <div className="field-group" style={{ flex: '0.3' }}>
                <button type="submit" className="btn-gold" style={{ height: '48px', marginTop: '22px', width: '100%' }}>EXPLORE & BOOK</button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="main-content-section">
        <div className="two-column-layout">
           
          {/* Left Column: Fleet & About Image */}
          <div className="left-column">
            <h2>Our Premium Fleet</h2>
            <div className="fleet-grid-3">
              {displayFleet.map((car, idx) => (
                <div key={idx} className="fleet-card">
                  <img src={car.img} alt={car.name} onError={(e) => { e.target.onerror = null; e.target.src = defaultFleet[idx % defaultFleet.length].img; }} />
                  <h3>{car.name}</h3>
                  <p>{car.desc}</p>
                  <div className="gold-line"></div>
                </div>
              ))}
            </div>
             
            <div className="about-image-section">
              <h2>Why Reach Chauffeur?</h2>
              <div className="about-image-card">
                <img src={displayFleet[1]?.img || displayFleet[0]?.img} alt="Chauffeur Service" onError={(e) => { e.target.onerror = null; e.target.src = defaultFleet[1]?.img || defaultFleet[0].img; }} />
              </div>
            </div>
          </div>

          {/* Right Column: Why Us Features & Text */}
          <div className="right-column">
            <h2>Why Reach Chauffeur?</h2>
            <div className="features-grid-2x2">
              {whyUs.map((item, idx) => (
                <div key={idx} className="feature-item">
                  <div className="gold-circle-icon">{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="about-text-section">
              <p>We design travel templates that reflect your standards. Every ride features absolute comfort and discretion. Seamless inter-city routing, onboard workspace tools, and private connectivity built for global executives.</p>
              <button className="btn-link-gold" onClick={() => navigate('/corporate')}>Explore Corporate Portal &gt;</button>
            </div>
          </div>

        </div>
      </section>
      
      <style>{`
        .home-layout {
          background-color: #FAFAFA;
          color: #1E293B;
          min-height: 100vh;
          padding-bottom: 100px;
        }

        /* Hero Banner */
        .hero-banner-wrapper {
          position: relative;
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .hero-banner {
          position: relative;
          width: 100%;
          height: 75vh;
          border-radius: 32px;
          background-size: cover;
          background-position: center 30%;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .hero-banner::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 600px;
          padding: 60px;
        }

        .hero-content h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 3.5rem;
          color: #1E293B;
          line-height: 1.1;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .hero-content p {
          font-size: 1.1rem;
          color: #475569;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        .btn-gold {
          background-color: #CBA557;
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-weight: 600;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-gold:hover {
          background-color: #B59045;
          transform: translateY(-2px);
        }

        /* Booking Widget */
        .horizontal-widget-container {
          position: absolute;
          bottom: -40px;
          left: 60px;
          right: 60px;
          z-index: 10;
        }

        .horizontal-widget {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }

        .widget-fields {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .field-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-group label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #1E293B;
          letter-spacing: 0.5px;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 8px;
          padding: 0 12px;
          height: 48px;
          border: 1px solid #E2E8F0;
        }

        .input-wrapper .icon {
          color: #94A3B8;
          margin-right: 8px;
        }

        .input-wrapper input, .input-wrapper select {
          border: none;
          background: none;
          outline: none;
          width: 100%;
          font-family: 'Inter', sans-serif;
          color: #334155;
          font-size: 0.9rem;
        }

        /* Main Content Layout */
        .main-content-section {
          max-width: 1400px;
          margin: 100px auto 0;
          padding: 0 20px;
        }

        .two-column-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 60px;
        }

        .left-column h2, .right-column h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem;
          color: #1E293B;
          margin-bottom: 30px;
        }

        /* Fleet Cards */
        .fleet-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 60px;
        }

        .fleet-card img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .fleet-card h3 {
          font-size: 1.1rem;
          margin-bottom: 8px;
          color: #1E293B;
        }

        .fleet-card p {
          font-size: 0.85rem;
          color: #64748B;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .gold-line {
          width: 40px;
          height: 2px;
          background-color: #CBA557;
        }

        /* About Image Segment */
        .about-image-card img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 20px;
        }

        /* Why Us Features */
        .features-grid-2x2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-bottom: 60px;
        }

        .feature-item {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .gold-circle-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: rgba(203, 165, 87, 0.1);
          color: #CBA557;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 16px;
        }

        .feature-item h4 {
          font-size: 1.1rem;
          margin-bottom: 8px;
          color: #1E293B;
        }

        .feature-item p {
          font-size: 0.85rem;
          color: #64748B;
          line-height: 1.5;
        }

        .about-text-section p {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .btn-link-gold {
          background: none;
          border: none;
          color: #CBA557;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .two-column-layout {
            grid-template-columns: 1fr;
          }
          
          .horizontal-widget-container {
            position: relative;
            bottom: 0;
            left: 0; right: 0;
            margin-top: -40px;
            padding: 0 20px;
          }

          .widget-fields {
            flex-direction: column;
          }
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 2.5rem;
          }
          .fleet-grid-3 {
            grid-template-columns: 1fr;
          }
          .features-grid-2x2 {
            grid-template-columns: 1fr;
          }
          .hero-banner::before {
            background: rgba(255,255,255,0.85);
          }
        }
      `}</style>
    </div>
  );
}
