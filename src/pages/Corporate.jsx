import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

export default function Corporate({ onOpenBooking }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [currentFirm, setCurrentFirm] = useState(null);
  const [rides, setRides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  // Registration Form States
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({ name: '', email: '', phone: '', password: '', contactName: '' });
  const [registeredId, setRegisteredId] = useState('');

  // Custom dispatcher address shortcut list
  const corporateDestinations = [
    { name: 'Sterling Holdings HQ', address: 'Plot 14, Kingsway Rd, Ikoyi, Lagos' },
    { name: 'Airport VIP Wing', address: 'MMIA Private Terminal, Ikeja' },
    { name: 'Lekki Executive Guesthouse', address: 'Block B2, Admiralty Way, Lekki Phase 1' },
    { name: 'Eko Atlantic Conference Ctr', address: 'Block 3, Harbor Point Rd, Victoria Island' }
  ];

  // Load corporate session and vehicles on mount
  useEffect(() => {
    const stored = localStorage.getItem('current_corporate_partner');
    if (stored) {
      const parsed = JSON.parse(stored);
      setCurrentFirm(parsed);
      setIsLoggedIn(true);
    }
    db.getVehicles().then(setVehicles);
  }, []);

  // Poll for rides & updated firm settings
  const refreshRides = async () => {
    if (!currentFirm) return;
    
    // Refresh corporate details (like updated discountRate)
    const accounts = await db.getCorpAccounts();
    const updatedFirm = accounts.find(a => a.email.toLowerCase() === currentFirm.email.toLowerCase());
    if (updatedFirm) {
      setCurrentFirm(updatedFirm);
      localStorage.setItem('current_corporate_partner', JSON.stringify(updatedFirm));
    }

    const all = await db.getBookings();
    const myRides = all.filter(
      b => b.personal?.email?.trim().toLowerCase() === currentFirm.email?.trim().toLowerCase()
    );
    setRides(myRides);
  };

  useEffect(() => {
    if (isLoggedIn && currentFirm) {
      refreshRides();
      const interval = setInterval(refreshRides, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentFirm?.email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const accounts = await db.getCorpAccounts();
    const inputToken = email.trim().toLowerCase();
    const matched = accounts.find(
      (acc) => 
        (acc.email?.trim().toLowerCase() === inputToken || 
         acc.phone?.trim().toLowerCase() === inputToken || 
         acc.corporateId?.trim().toLowerCase() === inputToken) && 
        acc.password === password
    );

    if (matched) {
      setIsLoggedIn(true);
      setCurrentFirm(matched);
      localStorage.setItem('current_corporate_partner', JSON.stringify(matched));
      setError('');
    } else {
      setError('Invalid Corporate Email, Phone, ID or Password.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpData.name || !signUpData.email || !signUpData.password || !signUpData.contactName) {
      setError('Please fill in all required fields.');
      return;
    }

    const corpId = 'CORP-' + Math.floor(1000 + Math.random() * 9000);
    const newAccount = {
      email: signUpData.email.toLowerCase(),
      companyName: signUpData.name,
      contactName: signUpData.contactName,
      phone: signUpData.phone,
      password: signUpData.password,
      discountRate: 15,
      status: 'Active',
      corporateId: corpId
    };
    
    await db.registerCorpAccount(newAccount);

    setRegisteredId(corpId);
    setError('');
    setSignUpData({ name: '', email: '', phone: '', password: '', contactName: '' });
  };

  const handleDemoSignIn = () => {
    setEmail('vip@sterlingholdings.com');
    setPassword('admin');
    const demoFirm = {
      companyName: 'Corporate VIP Partner',
      email: 'vip@sterlingholdings.com',
      phone: '+2348000000000',
      discountRate: 15,
      corporateId: 'CORP-2026',
      status: 'Active'
    };
    setCurrentFirm(demoFirm);
    localStorage.setItem('current_corporate_partner', JSON.stringify(demoFirm));
    setIsLoggedIn(true);
    setError('');
  };

  const handleQuickBook = (address) => {
    const maybach = vehicles.find(v => v.id === 'maybach-s' || v.name.toLowerCase().includes('maybach')) || {
      id: 'maybach-s',
      name: '2026 Mercedes-Maybach S-Class',
      tierLabel: 'Presidential Limousine',
      basePrice: 320000,
      standardPrice: 340000
    };
    onOpenBooking(maybach, { pickup: address });
  };

  const mockInvoices = isLoggedIn && currentFirm ? [
    { id: 'INV-2026-004', period: 'May 2026', total: `₦${Math.round(1420000 * (1 - (currentFirm.discountRate / 100))).toLocaleString()}`, status: 'Settled via Account Credit' },
    { id: 'INV-2026-005', period: 'June 2026 (Current)', total: `₦${Math.round(890000 * (1 - (currentFirm.discountRate / 100))).toLocaleString()}`, status: 'Pending Auto-Debit (July 1)' }
  ] : [];

  return (
    <div className="corporate-page-wrapper section-container">
      <div className="section-header animate-slide-up">
        <span className="gold-badge">Private Business Desk</span>
        <h2>Reach Corporate Portal</h2>
        <p className="section-subtitle">
          Manage corporate travel accounts, monthly invoice settlement, recurring executive rides, and multi-car transport arrangements.
        </p>
      </div>

      {isLoggedIn ? (
        <div className="corp-dashboard animate-fade-in">
          {/* Header Dashboard Banner */}
          <div className="corp-header-banner glass-panel">
            <div className="corp-profile">
              <span className="corp-avatar-badge">🏢</span>
              <div>
                <h3>{currentFirm.companyName}</h3>
                <p>Enterprise Tier Partner • <strong>{currentFirm.discountRate}% Active Account Discount</strong></p>
              </div>
            </div>
            <div className="corp-stats">
              <div className="corp-stat-item">
                <span>Account Balance (Total Spent)</span>
                <span className="stat-val gradient-text-gold">₦{rides.filter(r => r.status === 'Completed' || r.status === 'Chauffeur Dispatched').reduce((sum, r) => sum + (r.totalCost || 0), 0).toLocaleString()}</span>
              </div>
              <div className="corp-stat-item">
                <span>Active Rides</span>
                <span className="stat-val">{rides.filter(r => r.status === 'Chauffeur Dispatched').length} Rides</span>
              </div>
            </div>
          </div>

          {currentFirm.discountRate > 0 && (
            <div className="discount-alert-banner" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.15) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>🎁</span>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: 'var(--color-champagne)', fontSize: '0.95rem' }}>Preferred Partner Discount Offered!</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-silver)' }}>You have been granted a <strong>{currentFirm.discountRate}% discount</strong> on all rides booked through your corporate account. This discount will be automatically stacked at checkout.</p>
              </div>
            </div>
          )}

          <div className="corp-main-grid">
            {/* Left Nav Tabs */}
            <div className="corp-tabs-panel glass-panel">
              <button 
                onClick={() => setActiveTab('history')}
                className={`corp-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              >
                🚗 Ride History ({rides.length})
              </button>
              <button 
                onClick={() => setActiveTab('invoices')}
                className={`corp-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
              >
                💳 Invoices & Statement
              </button>
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setCurrentFirm(null);
                  localStorage.removeItem('current_corporate_partner');
                  setEmail('');
                  setPassword('');
                }}
                className="corp-tab-btn logout-btn"
              >
                Logout Account
              </button>
            </div>

            {/* Right Tab Content */}
            <div className="corp-content-panel">

              {activeTab === 'history' && (
                <div className="tab-pane-content animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <h3>Executive Ride History</h3>
                      <p className="pane-desc" style={{ margin: 0 }}>Audit previous transfers, active dispatches, and pending bookings.</p>
                    </div>
                    <button 
                      className="btn-champagne"
                      onClick={() => onOpenBooking()}
                    >
                      ✨ Book Custom Ride
                    </button>
                  </div>

                  <div className="corp-stats-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div className="stat-card glass-panel" style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)', display: 'block', marginBottom: '5px' }}>TOTAL BOOKED RIDES</span>
                      <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--color-champagne)' }}>{rides.length}</h3>
                    </div>
                    <div className="stat-card glass-panel" style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)', display: 'block', marginBottom: '5px' }}>CURRENTLY ON RIDE</span>
                      <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#34d399' }}>
                        {rides.filter(r => r.status === 'Chauffeur Dispatched').length}
                      </h3>
                    </div>
                    <div className="stat-card glass-panel" style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)', display: 'block', marginBottom: '5px' }}>ACTIVE DISCOUNT</span>
                      <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--color-champagne)' }}>{currentFirm.discountRate}% Off</h3>
                    </div>
                  </div>

                  {rides.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-silver)' }}>
                      No rides registered for this corporate account yet. Click "Book Custom Ride" to start.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                      {rides.map((ride) => (
                        <div key={ride.bookingRef} className="ride-history-card glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-champagne)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div>
                              <span className="gold-badge" style={{ fontSize: '0.7rem' }}>{ride.bookingRef}</span>
                              <h4 style={{ margin: '5px 0 2px 0' }}>{ride.vehicle}</h4>
                              <span style={{ fontSize: '0.8rem', color: ride.status === 'Completed' ? '#34d399' : ride.status === 'Chauffeur Dispatched' ? 'var(--color-champagne)' : '#aaa' }}>
                                Status: <strong>{ride.status}</strong>
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-champagne)', display: 'block' }}>
                                ₦{ride.totalCost?.toLocaleString()}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)' }}>
                                {ride.logistics?.date} at {ride.logistics?.time}
                              </span>
                            </div>
                          </div>

                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <div style={{ marginBottom: '6px' }}>
                              <span style={{ color: 'var(--color-silver)' }}>Pick-up:</span> <strong>{ride.logistics?.pickup}</strong>
                            </div>
                            {ride.logistics?.stops && ride.logistics.stops.filter(Boolean).length > 0 && (
                              <div>
                                <span style={{ color: 'var(--color-silver)' }}>Stops:</span>
                                <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                                  {ride.logistics.stops.filter(Boolean).map((stop, sIdx) => (
                                    <li key={sIdx}>{stop}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invoices' && (
                <div className="tab-pane-content animate-fade-in">
                  <h3>Monthly Invoices & Accruals</h3>
                  <p className="pane-desc">Download detailed billing statement sheets and verify historical account ledger balances.</p>
                  
                  <div className="invoices-list">
                    {mockInvoices.map((inv) => (
                      <div key={inv.id} className="invoice-item-card glass-panel">
                        <div className="inv-meta">
                          <span className="inv-id">{inv.id}</span>
                          <h4>{inv.period}</h4>
                          <span className="inv-status">{inv.status}</span>
                        </div>
                        <div className="inv-actions">
                          <span className="inv-total">{inv.total}</span>
                          <button className="btn-glass download-btn" onClick={() => alert(`Downloading Statement ledger: ${inv.id}`)}>
                            Download PDF Statement
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Login / Sign Up State */
        <div className="corp-auth-card glass-panel animate-slide-up">
          {/* Tabs switch */}
          <div className="auth-tab-triggers">
            <button 
              className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(false); setError(''); setRegisteredId(''); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(true); setError(''); setRegisteredId(''); }}
            >
              Register Partner
            </button>
          </div>

          {registeredId ? (
            <div className="auth-success-alert animate-fade-in">
              <span className="success-badge-large">✓</span>
              <h3>Corporate Account Registered</h3>
              <p className="success-desc">Your corporate account credentials have been processed successfully.</p>
              
              <div className="credentials-code-box">
                <span className="cred-label font-display">Corporate ID</span>
                <span className="cred-code gradient-text-gold">{registeredId}</span>
              </div>

              <p className="cred-instructions">Copy the Corporate ID above. Use this ID and your chosen passkey to sign in.</p>
              
              <button 
                className="btn-champagne continue-login-btn"
                onClick={() => {
                  setEmail(registeredId);
                  setIsSignUp(false);
                  setRegisteredId('');
                }}
              >
                Proceed to Login Dashboard
              </button>
            </div>
          ) : !isSignUp ? (
            /* Sign In Form */
            <div className="auth-form-wrapper animate-fade-in">
              <div className="login-icon">🔒</div>
              <h3>Enterprise Portal Access</h3>
              <p className="auth-subtitle">Provide verified corporate ID credentials to audit ride lists.</p>
              
              <form onSubmit={handleLogin} className="login-form">
                <div className="input-group">
                  <label>Corporate Email, Phone, or ID</label>
                  <input
                    type="text"
                    placeholder="e.g. CORP-1234, business email, or contact number"
                    className="glass-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Access Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="glass-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="login-error-text">⚠️ {error}</p>}

                <button type="submit" className="btn-champagne login-btn">
                  Authenticate Account
                </button>
              </form>

              <button className="btn-glass demo-login-btn" onClick={handleDemoSignIn}>
                Direct Demo Access (CORP-2026)
              </button>
            </div>
          ) : (
            /* Sign Up Form */
            <div className="auth-form-wrapper animate-fade-in">
              <div className="login-icon">💼</div>
              <h3>Request Corporate Access</h3>
              <p className="auth-subtitle">Establish a recurring billing account for your enterprise group.</p>
              
              <form onSubmit={handleSignUp} className="login-form">
                <div className="input-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    placeholder="Sterling Holdings Ltd"
                    className="glass-input"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Primary Contact Name</label>
                  <input
                    type="text"
                    placeholder="Johnathan Sterling"
                    className="glass-input"
                    value={signUpData.contactName}
                    onChange={(e) => setSignUpData({ ...signUpData, contactName: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Business Email</label>
                  <input
                    type="email"
                    placeholder="exec.travel@sterling.com"
                    className="glass-input"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+234 80 3000 0000"
                    className="glass-input"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Create Access Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    className="glass-input"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                  />
                </div>

                {error && <p className="login-error-text">⚠️ {error}</p>}

                <button type="submit" className="btn-champagne login-btn">
                  Create Corporate Account
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <style>{`
        .corp-auth-card {
          max-width: 500px;
          margin: 60px auto;
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-color: rgba(255, 255, 255, 0.12);
        }

        .auth-tab-triggers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.15);
        }

        .auth-tab-triggers .auth-tab-btn {
          background: none;
          border: none;
          padding: 18px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          color: var(--color-silver);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .auth-tab-triggers .auth-tab-btn.active {
          color: var(--color-champagne);
          background: rgba(212, 175, 55, 0.05);
          border-bottom: 2px solid var(--color-champagne);
        }

        .auth-form-wrapper {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }

        .login-icon {
          font-size: 3rem;
          background: rgba(255, 255, 255, 0.03);
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--glass-border);
          color: var(--color-champagne);
        }

        .auth-form-wrapper h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .auth-subtitle {
          font-size: 0.9rem;
          color: var(--color-silver);
          line-height: 1.5;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }

        .login-btn {
          width: 100%;
        }

        .demo-login-btn {
          width: 100%;
          font-size: 0.85rem;
          padding: 10px;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .login-error-text {
          font-size: 0.85rem;
          color: var(--color-red-dim);
          text-align: center;
        }

        /* Success screen */
        .auth-success-alert {
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .success-badge-large {
          background: var(--color-champagne);
          color: #08080A;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          box-shadow: 0 0 20px var(--color-gold-glow);
        }

        .auth-success-alert h3 {
          font-size: 1.6rem;
          font-weight: 700;
        }

        .success-desc {
          font-size: 0.9rem;
          color: var(--color-silver);
        }

        .credentials-code-box {
          background: rgba(212, 175, 55, 0.05);
          border: 1px dashed rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 16px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 100%;
        }

        .cred-label {
          font-size: 0.75rem;
          color: var(--color-silver);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .cred-code {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .cred-instructions {
          font-size: 0.8rem;
          color: var(--color-silver);
          line-height: 1.4;
        }

        .continue-login-btn {
          width: 100%;
          margin-top: 10px;
        }

        /* Corp Dashboard Styles */
        .corp-header-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 30px 40px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .corp-header-banner {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
            padding: 24px;
          }
        }

        .corp-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .corp-avatar-badge {
          font-size: 2.2rem;
          background: rgba(255, 255, 255, 0.03);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .corp-profile h3 {
          font-size: 1.3rem;
          margin-bottom: 4px;
        }

        .corp-profile p {
          font-size: 0.85rem;
          color: var(--color-silver);
        }

        .corp-stats {
          display: flex;
          gap: 40px;
        }

        @media (max-width: 480px) {
          .corp-stats {
            gap: 20px;
            width: 100%;
            justify-content: space-between;
          }
        }

        .corp-stat-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .corp-stat-item span:first-child {
          font-size: 0.75rem;
          color: var(--color-silver);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
        }

        .corp-main-grid {
          display: grid;
          grid-template-columns: 1fr 3fr;
          gap: 30px;
          margin-top: 30px;
        }

        @media (max-width: 900px) {
          .corp-main-grid {
            grid-template-columns: 1fr;
          }
        }

        .corp-tabs-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: fit-content;
        }

        @media (max-width: 900px) {
          .corp-tabs-panel {
            flex-direction: row;
            overflow-x: auto;
          }
        }

        .corp-tab-btn {
          background: none;
          border: none;
          color: var(--color-silver);
          padding: 14px 20px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        @media (max-width: 900px) {
          .corp-tab-btn {
            white-space: nowrap;
          }
        }

        .corp-tab-btn:hover {
          color: var(--color-platinum);
          background: rgba(255, 255, 255, 0.03);
        }

        .corp-tab-btn.active {
          color: var(--color-champagne);
          background: rgba(212, 175, 55, 0.06);
          border-left: 2px solid var(--color-champagne);
          border-radius: 0 8px 8px 0;
        }

        @media (max-width: 900px) {
          .corp-tab-btn.active {
            border-left: none;
            border-bottom: 2px solid var(--color-champagne);
            border-radius: 8px 8px 0 0;
          }
        }

        .logout-btn {
          color: var(--color-red-dim);
          border-top: 1px solid var(--glass-border);
          margin-top: 20px;
        }

        @media (max-width: 900px) {
          .logout-btn {
            border-top: none;
            margin-top: 0;
            margin-left: auto;
          }
        }

        .corp-content-panel {
          display: flex;
          flex-direction: column;
        }

        .tab-pane-content h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .pane-desc {
          font-size: 0.9rem;
          color: var(--color-silver);
          margin-bottom: 30px;
        }

        .destinations-quick-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        @media (max-width: 600px) {
          .destinations-quick-grid {
            grid-template-columns: 1fr;
          }
        }

        .dest-shortcut-card {
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 20px;
        }

        .dest-shortcut-card h4 {
          font-size: 1rem;
          color: var(--color-platinum);
          margin-bottom: 6px;
        }

        .dest-shortcut-card p {
          font-size: 0.8rem;
          color: var(--color-silver);
          line-height: 1.4;
        }

        .shortcut-book-btn {
          width: 100%;
          padding: 10px;
          font-size: 0.8rem;
        }

        .multi-car-schedule-box {
          margin-top: 40px;
          padding: 30px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-color: rgba(212, 175, 55, 0.1);
        }

        .multi-car-schedule-box h4 {
          font-size: 1.1rem;
          color: var(--color-champagne);
        }

        .multi-car-schedule-box p {
          font-size: 0.85rem;
          color: var(--color-silver);
          line-height: 1.5;
        }

        .event-btn {
          width: fit-content;
          padding: 10px 20px;
          font-size: 0.85rem;
        }

        /* Invoices List */
        .invoices-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .invoice-item-card {
          padding: 24px 30px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media (max-width: 600px) {
          .invoice-item-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
        }

        .inv-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .inv-id {
          font-size: 0.75rem;
          color: var(--color-silver-dark);
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .inv-meta h4 {
          font-size: 1.1rem;
        }

        .inv-status {
          font-size: 0.8rem;
          color: var(--color-champagne-light);
        }

        .inv-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        @media (max-width: 600px) {
          .inv-actions {
            width: 100%;
            justify-content: space-between;
          }
        }

        .inv-total {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .download-btn {
          padding: 10px 18px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
