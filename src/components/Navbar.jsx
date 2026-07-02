import React, { useState } from 'react';

export default function Navbar({ currentPage, setCurrentPage, onOpenBooking }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'fleet', label: 'Our Fleet' },
    { id: 'tracking', label: 'Live Tracking' },
    { id: 'corporate', label: 'Corporate Portal' },
    { id: 'news', label: 'News Hub' }
  ];

  const handleNavClick = (id) => {
    setCurrentPage(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container glass-panel">
        <div className="logo" onClick={() => handleNavClick('home')}>
          <span className="logo-reach">REACH</span>
          <span className="logo-chauffeur gradient-text-gold">CHAUFFEUR</span>
        </div>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="btn-champagne nav-cta" onClick={onOpenBooking}>
            Book Ride
          </button>

          {/* Hamburger Menu Icon */}
          <button 
            className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-nav-drawer glass-panel ${mobileMenuOpen ? 'active' : ''}`}>
        <nav className="mobile-nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
          <button 
            className="btn-champagne mobile-nav-cta" 
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBooking();
            }}
          >
            Book Ride
          </button>
        </nav>
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-radius: 50px;
          height: 70px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .logo-reach {
          color: var(--color-platinum);
        }

        .logo-chauffeur {
          font-weight: 500;
        }

        .desktop-nav {
          display: flex;
          gap: 28px;
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
          padding: 10px 22px;
          font-size: 0.85rem;
          border-radius: 20px;
        }

        .hamburger-btn {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 16px;
          background: none;
          border: none;
          cursor: pointer;
          z-index: 1001;
        }

        .hamburger-btn span {
          width: 100%;
          height: 2px;
          background-color: var(--color-platinum);
          transition: var(--transition-smooth);
        }

        .hamburger-btn.open span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
          background-color: var(--color-champagne);
        }

        .hamburger-btn.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger-btn.open span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
          background-color: var(--color-champagne);
        }

        .mobile-nav-drawer {
          position: absolute;
          top: 85px;
          left: 24px;
          right: 24px;
          padding: 24px;
          display: none;
          flex-direction: column;
          border-radius: 20px;
          opacity: 0;
          transform: translateY(-20px);
          pointer-events: none;
          transition: var(--transition-smooth);
        }

        .mobile-nav-drawer.active {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
          display: flex;
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }

        .mobile-nav-link {
          background: none;
          border: none;
          color: var(--color-silver);
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-smooth);
          width: 100%;
          text-align: center;
          padding: 8px 0;
        }

        .mobile-nav-link:hover, .mobile-nav-link.active {
          color: var(--color-champagne);
        }

        .mobile-nav-cta {
          width: 100%;
          margin-top: 10px;
        }

        @media (max-width: 900px) {
          .desktop-nav {
            display: none;
          }

          .nav-cta {
            display: none;
          }

          .hamburger-btn {
            display: flex;
          }

          .mobile-nav-drawer {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
}
