import React, { useState } from 'react';

export default function Footer({ setCurrentPage, onOpenLegal }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 5000);
    }
  };

  const handleLinkClick = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-section">
      <div className="section-container">
        <div className="footer-grid">
          {/* Brand Manifesto */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-reach">REACH</span>
              <span className="logo-chauffeur gradient-text-gold">CHAUFFEUR</span>
            </div>
            <p className="footer-manifesto">
              Crafting premium travel narratives since 2018. We operate at the intersection of absolute punctuality, tailored privacy, and unmatched executive comfort.
            </p>
            <div className="social-links" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', alignItems: 'flex-start' }}>
              <a href="https://instagram.com/reachchauffeur" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: 'fit-content', padding: '6px 12px', borderRadius: '20px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-champagne)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                <span>@reachchauffeur</span>
              </a>
              <a href="https://wa.me/2349010335811" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: 'fit-content', padding: '6px 12px', borderRadius: '20px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--color-champagne)" className="bi bi-whatsapp" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.69-3.186c-.2-.1-.1.21-.613-.164-.207-.154-.45-.27-.61-.341-.161-.07-.278-.105-.394.07-.116.175-.45.568-.55.68-.1.117-.2.13-.4.03-.2-.1-.849-.313-1.616-.997-.597-.533-1.002-1.192-1.12-1.392-.116-.2-.013-.308.087-.408.09-.09.2-.233.3-.349.098-.117.13-.2.2-.33-.07-.13-.035-.24-.017-.34-.017-.1-.175-.425-.24-.583-.063-.155-.13-.134-.176-.136-.045-.002-.1-.002-.156-.002-.056 0-.15.021-.227.106-.077.085-.295.289-.295.704s.302.818.344.875c.042.057.596.909 1.444 1.272.2.087.357.14.479.177.201.064.385.056.53.034.161-.024.5-.205.57-.403.07-.198.07-.367.05-.403-.02-.034-.08-.057-.18-.106z"/></svg>
                <span>+234 901 033 5811</span>
              </a>
              <a href="mailto:reachchauffeur@gmail.com" className="social-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: 'fit-content', padding: '6px 12px', borderRadius: '20px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-champagne)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>reachchauffeur@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h3>The Experience</h3>
            <ul className="footer-links">
              <li><button onClick={() => handleLinkClick('home')}>Overview</button></li>
              <li><button onClick={() => handleLinkClick('fleet')}>Fleet Matrix</button></li>
              <li><button onClick={() => handleLinkClick('tracking')}>Live Tracking</button></li>
              <li><button onClick={() => handleLinkClick('corporate')}>Corporate Portal</button></li>
              <li><button onClick={() => handleLinkClick('news')}>News Hub</button></li>
              <li><a href="/admin">Command Center (Admin)</a></li>
              <li><a href="/chauffeur">Chauffeur Portal</a></li>
            </ul>
          </div>

          {/* Fleet Tiers */}
          <div className="footer-links-col">
            <h3>Elite Tiers</h3>
            <ul className="footer-links">
              <li><button onClick={() => handleLinkClick('fleet')}>Executive Sedans</button></li>
              <li><button onClick={() => handleLinkClick('fleet')}>Luxury SUVs</button></li>
              <li><button onClick={() => handleLinkClick('fleet')}>Presidential Limousines</button></li>
              <li><button onClick={() => handleLinkClick('fleet')}>New Arrivals</button></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <h3>Join the Elite Circle</h3>
            <p>Subscribe to receive exclusive access to new arrivals, bespoke tour releases, and corporate travel updates.</p>
            
            {subscribed ? (
              <div className="subscribe-success animate-fade-in">
                <span className="success-badge">✓</span> Subscription Confirmed
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="glass-input newsletter-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn-champagne newsletter-btn">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© 2026 Reach Chauffeur. All rights reserved.</p>
          <div className="legal-links">
            <a href="#terms" onClick={(e) => { e.preventDefault(); if (onOpenLegal) onOpenLegal('terms'); }}>Terms of Service</a>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); if (onOpenLegal) onOpenLegal('privacy'); }}>Privacy Charter</a>
            <a href="#cookie" onClick={(e) => { e.preventDefault(); if (onOpenLegal) onOpenLegal('cookie'); }}>Cookie Policy</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer-section {
          background-color: var(--color-obsidian-light);
          border-top: 1px solid var(--glass-border);
          position: relative;
          z-index: 10;
          margin-top: 100px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
          gap: 48px;
          margin-bottom: 60px;
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .footer-logo {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .footer-logo .logo-reach {
          color: var(--color-platinum);
        }

        .footer-manifesto {
          color: var(--color-silver);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .social-links {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .social-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          font-size: 0.75rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--color-silver);
          transition: var(--transition-smooth);
        }

        .social-icon:hover {
          color: var(--color-champagne);
          border-color: var(--color-champagne);
          background: rgba(212, 175, 55, 0.05);
          transform: translateY(-2px);
        }

        .footer-links-col h3, .footer-newsletter h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 24px;
          letter-spacing: 0.02em;
          color: var(--color-platinum);
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-links a, .footer-links button {
          background: none;
          border: none;
          color: var(--color-silver);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-smooth);
          padding: 2px 0;
          text-decoration: none;
          display: inline-block;
        }

        .footer-links a:hover, .footer-links button:hover {
          color: var(--color-champagne);
          transform: translateX(4px);
        }

        .footer-newsletter {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-newsletter p {
          color: var(--color-silver);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .newsletter-input {
          width: 100%;
        }

        .newsletter-btn {
          width: 100%;
          padding: 12px;
          font-size: 0.9rem;
        }

        .subscribe-success {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--color-champagne);
          font-weight: 600;
          padding: 12px;
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 8px;
          justify-content: center;
        }

        .success-badge {
          background: var(--color-champagne);
          color: var(--color-obsidian);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 768px) {
          .footer-bottom {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
        }

        .copyright {
          color: var(--color-silver-dark);
          font-size: 0.85rem;
        }

        .legal-links {
          display: flex;
          gap: 24px;
        }

        .legal-links a {
          color: var(--color-silver-dark);
          font-size: 0.85rem;
          transition: var(--transition-smooth);
        }

        .legal-links a:hover {
          color: var(--color-champagne);
        }
      `}</style>
    </footer>
  );
}
