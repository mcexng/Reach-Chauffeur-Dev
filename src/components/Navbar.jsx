import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ onOpenBooking }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Services', path: '/' },
    { id: 'fleet', label: 'Fleet', path: '/fleets' },
    { id: 'tracking', label: 'Live Tracking', path: '/tracking' },
    { id: 'corporate', label: 'Corporate Portal', path: '/corporate' },
    { id: 'news', label: 'News Hub', path: '/news' }
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container glass-panel">
        <Link to="/" className="logo" onClick={handleNavClick}>
          <img src="/reach-logo.png" alt="Reach Chauffeur Logo" className="brand-logo-img" />
          <div className="logo-text">
            <span className="logo-reach">REACH</span>
            <span className="logo-chauffeur gradient-text-gold">CHAUFFEUR</span>
          </div>
        </Link>

        {/* Universal Nav */}
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={handleNavClick}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="btn-gold nav-cta" onClick={onOpenBooking}>
            BOOK NOW
          </button>
        </div>
      </div>



      <style>{`
        .navbar-header {
          position: fixed;
          top: 20px;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0 24px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .navbar-container {
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          height: auto;
          padding: 16px;
        }

        @media (max-width: 768px) {
          .navbar-container {
            border-radius: 20px;
          }
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          cursor: pointer;
        }
        
        .brand-logo-img {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border-radius: 8px;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
          font-family: 'Outfit', sans-serif;
        }

        .logo-reach {
          color: var(--color-platinum);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: 0.15em;
        }

        .logo-chauffeur {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .desktop-nav {
          display: flex;
          gap: 28px;
          align-items: center;
        }

        @media (max-width: 900px) {
          .desktop-nav {
            width: 100%;
            overflow-x: auto;
            white-space: nowrap;
            justify-content: flex-start;
            gap: 16px;
            padding: 4px 0;
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          
          .desktop-nav::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }
        }

        .nav-link {
          background: none;
          border: none;
          color: var(--color-silver);
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-smooth);
          padding: 6px 0;
          position: relative;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--color-platinum);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--color-champagne);
          transition: var(--transition-smooth);
        }

        .nav-link:hover::after, .nav-link.active::after {
          width: 100%;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-cta {
          background-color: #CBA557;
          color: #fff;
          border: none;
          padding: 10px 24px;
          font-size: 0.85rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-cta:hover {
          background-color: #B59045;
          transform: translateY(-2px);
        }

        @media (max-width: 900px) {
          .nav-actions {
            position: absolute;
            top: 24px;
            right: 16px;
          }

          .nav-cta {
            padding: 8px 16px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </header>
  );
}
