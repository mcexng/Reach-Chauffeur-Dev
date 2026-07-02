import React from 'react';

export default function LegalModal({ isOpen, onClose, type }) {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'terms':
        return (
          <>
            <h3>Terms of Service</h3>
            <p className="legal-update">Last Updated: June 2026</p>
            <div className="legal-body">
              <h4>1. Executive Chauffeur Services</h4>
              <p>Reach Chauffeur provides executive vehicle dispatch and private travel rental services. By booking a ride on our platform, you agree to comply with our code of conduct and booking requirements.</p>

              <h4>2. Zero Tolerance Policy: Smoking & Illegal Drugs</h4>
              <div className="legal-highlight-box">
                <strong>CRITICAL REQUIREMENT:</strong> Smoking, vaping, or the possession or consumption of illegal drugs is strictly prohibited inside all Reach Chauffeur vehicles at all times.
                <br /><br />
                <strong>Penalties for Violation:</strong> Any failure to comply will automatically result in:
                <ul>
                  <li>An immediate sanitization and cleaning fee of <strong>₦50,000 NGN</strong>.</li>
                  <li>Immediate termination of the active ride.</li>
                  <li>Dismissal of the chauffeur and cancellation of the itinerary <strong>without any refund</strong>.</li>
                </ul>
              </div>

              <h4>3. Payment Policies</h4>
              <p style={{ color: 'var(--color-champagne)', fontWeight: 'bold' }}>
                WARNING: Under no circumstances should any payments be paid directly to the driver or chauffeur.
              </p>
              <p>All transactions, deposits, extensions, and fees must be processed securely online or verified through our official corporate billing desk. Reach Chauffeur will not honor or be held liable for any unofficial cash or private transfer agreements made with chauffeurs.</p>

              <h4>4. Booking Tiers & Extensions</h4>
              <p>Bookings are allocated strictly by duration (Airport pickup, 12-hour hire, 24-hour hire, or custom multi-day). Any ride extensions are subject to administrative approval, current vehicle availability, and advance payment confirmation.</p>
            </div>
          </>
        );
      case 'privacy':
        return (
          <>
            <h3>Privacy Charter</h3>
            <p className="legal-update">Last Updated: June 2026</p>
            <div className="legal-body">
              <h4>1. High-Tier Discretion</h4>
              <p>Our business operates on absolute client privacy. Your personal identities, itineraries, locations, stops, and passenger lists are treated with the highest degree of confidentiality.</p>

              <h4>2. Telemetry and Location Data</h4>
              <p>We track the real-time GPS locations of our dispatched drivers and vehicles to ensure ETA accuracy and client safety. Passenger location data is only accessed during active commute mapping and is never shared, leased, or sold to third parties.</p>

              <h4>3. Secure Account Data</h4>
              <p>Corporate accounts and billing histories are securely stored. Access keys and passwords are encrypted and managed strictly by the partner client.</p>
            </div>
          </>
        );
      case 'cookie':
        return (
          <>
            <h3>Cookie Policy</h3>
            <p className="legal-update">Last Updated: June 2026</p>
            <div className="legal-body">
              <h4>1. Session Cookies</h4>
              <p>We use essential cookies and browser local storage configurations to persist authenticated corporate sessions and active live-tracking reference coordinates.</p>

              <h4>2. Functional Telemetry</h4>
              <p>These local files are required to authorize booking forms, skip steps for signed-in corporate accounts, and synchronize the maps on active rides.</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="legal-modal-overlay">
      <div className="legal-modal-container glass-panel animate-slide-up">
        <div className="legal-modal-header">
          <span className="gold-badge">Reach Chauffeur Legal</span>
          <button className="legal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="legal-modal-content">
          {renderContent()}
        </div>
        <div className="legal-modal-footer">
          <button className="btn-champagne" onClick={onClose}>Understood</button>
        </div>
      </div>

      <style>{`
        .legal-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 8, 10, 0.9);
          backdrop-filter: blur(15px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 24px;
        }

        .legal-modal-container {
          width: 100%;
          max-width: 600px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          border: 1px solid var(--glass-border);
          overflow: hidden;
        }

        .legal-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0,0,0,0.2);
        }

        .legal-close-btn {
          background: none;
          border: none;
          color: var(--color-silver);
          font-size: 1.8rem;
          cursor: pointer;
          line-height: 1;
        }

        .legal-close-btn:hover {
          color: var(--color-champagne);
        }

        .legal-modal-content {
          padding: 24px;
          overflow-y: auto;
          text-align: left;
        }

        .legal-modal-content h3 {
          font-size: 1.6rem;
          color: #fff;
          margin-bottom: 5px;
        }

        .legal-update {
          font-size: 0.8rem;
          color: var(--color-silver);
          margin-bottom: 20px;
        }

        .legal-body h4 {
          font-size: 1.05rem;
          color: var(--color-champagne);
          margin: 20px 0 10px 0;
        }

        .legal-body p {
          font-size: 0.9rem;
          color: var(--color-silver);
          line-height: 1.6;
        }

        .legal-highlight-box {
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.25);
          padding: 15px;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #fff;
          margin: 15px 0;
          line-height: 1.6;
        }

        .legal-highlight-box ul {
          margin: 8px 0 0 20px;
          padding: 0;
        }

        .legal-modal-footer {
          padding: 15px 24px;
          border-top: 1px solid var(--glass-border);
          display: flex;
          justify-content: flex-end;
          background: rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
