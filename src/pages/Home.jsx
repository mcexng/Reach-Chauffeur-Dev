import React, { useEffect, useRef, useState } from 'react';

export default function Home({ onQuickBook, setCurrentPage }) {
  const [pickup, setPickup] = useState('');
  const [date, setDate] = useState('');
  const canvasRef = useRef(null);

  // Cinematic night lights simulation for background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Light beam particles representing city highway lights at night
    const particles = [];
    const particleCount = 20;

    class LightBeam {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        this.length = Math.random() * 200 + 100;
        this.speed = Math.random() * 2 + 1;
        this.angle = -Math.PI / 2 + (Math.random() * 0.2 - 0.1); // slightly tilted upwards
        this.opacity = Math.random() * 0.4 + 0.1;
        this.color = Math.random() > 0.5 ? '#D4AF37' : '#9CA3AF'; // Gold or Platinum
        this.width = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.y -= this.speed;
        this.x += Math.sin(this.angle) * this.speed;

        if (this.y < -this.length) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        const endX = this.x + Math.sin(this.angle) * this.length;
        const endY = this.y - Math.cos(this.angle) * this.length;

        const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new LightBeam());
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(8, 8, 10, 0.2)'; // trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleExploreSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !date) return;
    
    // Save details to state, move to fleet page, and prefill details
    onQuickBook(pickup, date);
    setCurrentPage('fleet');
    setTimeout(() => {
      const fleetSec = document.getElementById('fleet-selection-anchor');
      if (fleetSec) {
        fleetSec.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const trustMetrics = [
    { value: '99.8%', label: 'Punctuality Rate' },
    { value: '10+', label: 'Elite Vehicles' },
    { value: '1k+', label: 'Executive Transfers' },
    { value: '5-Star', label: 'Safety Verification' }
  ];

  const philosophyItems = [
    {
      title: 'Corporate Travel',
      desc: 'Seamless inter-city routing, onboard workspace tools, and private Wi-Fi connectivity built for global executives.',
      icon: '🏢'
    },
    {
      title: 'Airport Transfers',
      desc: 'Flight telemetry integration allows us to adapt in real time to any arrival shifts, greeting you immediately on landing.',
      icon: '✈️'
    },
    {
      title: 'Bespoke Events',
      desc: 'Tailored transport coordinates, bridal party matrices, and red-carpet limousines to honor life’s grandest ceremonies.',
      icon: '💍'
    }
  ];

  return (
    <div className="home-container">
      {/* Background Lights Canvas */}
      <canvas ref={canvasRef} className="night-lights-canvas" />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="section-container hero-content-grid animate-slide-up">
          <div className="hero-text-block">
            <span className="gold-badge">★ REACH CHAUFFEUR PRIVATE ELITE</span>
            <h1>
              Your Destination Awaits.<br />
              <span className="gradient-text-gold">Arrive in Uncompromising Luxury.</span>
            </h1>
            <p>
              World-class chauffeured fleets for corporate elites, wedding celebrations, airport private transfers, and bespoke inter-city journeys.
            </p>
          </div>

          {/* Floating Booking Widget */}
          <div className="hero-booking-widget glass-panel">
            <h2>Reserve Your Chauffeur</h2>
            <p className="widget-subtitle">Enter details to explore our executive tiers.</p>
            
            <form onSubmit={handleExploreSubmit} className="widget-form">
              <div className="input-group">
                <label>Pick-up Location</label>
                <input
                  type="text"
                  placeholder="e.g. Murtala Muhammed International Airport"
                  className="glass-input"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Select Date</label>
                <input
                  type="date"
                  className="glass-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-champagne widget-btn">
                Explore Fleet & Book Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Trust Metrics Bar */}
      <section className="metrics-section">
        <div className="section-container">
          <div className="metrics-grid glass-panel">
            {trustMetrics.map((metric, idx) => (
              <div key={idx} className="metric-item">
                <div className="metric-value gradient-text-gold">{metric.value}</div>
                <div className="metric-label">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Philosophy Section */}
      <section className="philosophy-section">
        <div className="section-container">
          <div className="section-header">
            <span className="gold-badge">Our Services</span>
            <h2>Tailored Journeys, Exquisite Conduct</h2>
            <p className="section-subtitle">
              We design travel templates that reflect your standards. Every ride features absolute comfort and discretion.
            </p>
          </div>

          <div className="philosophy-grid">
            {philosophyItems.map((item, idx) => (
              <div key={idx} className="philosophy-card glass-panel glass-panel-hover">
                <div className="card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .home-container {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }

        .night-lights-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          opacity: 0.85;
        }

        .hero-section {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          padding-top: 130px;
          z-index: 2;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 70% 30%, rgba(212, 175, 55, 0.03) 0%, transparent 60%);
          pointer-events: none;
        }

        .hero-content-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 60px;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .hero-content-grid {
            grid-template-columns: 1fr;
            gap: 40px;
            text-align: center;
          }
        }

        .hero-text-block {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .hero-text-block {
            align-items: center;
          }
        }

        .hero-text-block h1 {
          font-size: 3.5rem;
          line-height: 1.15;
          font-weight: 800;
        }

        @media (max-width: 768px) {
          .hero-text-block h1 {
            font-size: 2.5rem;
          }
        }

        .hero-text-block p {
          font-size: 1.1rem;
          color: var(--color-silver);
          line-height: 1.6;
          max-width: 600px;
        }

        .hero-booking-widget {
          padding: 40px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-color: rgba(255, 255, 255, 0.12);
        }

        @media (max-width: 480px) {
          .hero-booking-widget {
            padding: 24px;
          }
        }

        .hero-booking-widget h2 {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .widget-subtitle {
          font-size: 0.9rem;
          color: var(--color-silver);
        }

        .widget-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-silver);
          font-weight: 600;
        }

        .widget-btn {
          margin-top: 10px;
          width: 100%;
        }

        /* Metrics */
        .metrics-section {
          position: relative;
          z-index: 2;
          padding: 20px 0;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 30px;
          border-radius: 20px;
          text-align: center;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
          }
        }

        @media (max-width: 480px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        .metric-value {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .metric-label {
          font-size: 0.85rem;
          color: var(--color-silver);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        /* Philosophy */
        .philosophy-section {
          position: relative;
          z-index: 2;
        }

        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .section-header h2 {
          font-size: 2.4rem;
          font-weight: 700;
        }

        .section-subtitle {
          font-size: 1.05rem;
          color: var(--color-silver);
          line-height: 1.6;
        }

        .philosophy-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        @media (max-width: 900px) {
          .philosophy-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        .philosophy-card {
          padding: 40px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }

        .card-icon {
          font-size: 2.5rem;
          background: rgba(255, 255, 255, 0.03);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .philosophy-card h3 {
          font-size: 1.4rem;
          color: var(--color-platinum);
          font-weight: 600;
        }

        .philosophy-card p {
          color: var(--color-silver);
          font-size: 0.95rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
