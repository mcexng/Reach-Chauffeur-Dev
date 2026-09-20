import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { dbFS } from '../utils/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { triggerPaymentReceivedAlert, triggerExtensionRequestAlert } from '../utils/notificationService';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Luxury Car Icon
const carIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204121.png', // A free car icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Component to dynamically recenter the map when driver moves
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Tracking({ activeBooking }) {
  const [searchRef, setSearchRef] = useState('');
  const [booking, setBooking] = useState(activeBooking || null);
  const [eta, setEta] = useState(12); // minutes
  const [speed, setSpeed] = useState(55); // km/h
  const [statusText, setStatusText] = useState('En route to pickup location');
  const [driverLoc, setDriverLoc] = useState({ lat: 6.45407, lng: 3.4246 }); // Default Lagos
  const [driverInfo, setDriverInfo] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [extensionHours, setExtensionHours] = useState(1);

  useEffect(() => {
    if (!booking?.endTime) return;
    if (booking.status === 'Completed') {
      setTimeRemaining('RIDE COMPLETED');
      return;
    }
    const interval = setInterval(() => {
      const diff = new Date(booking.endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('TIME ELAPSED');
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [booking?.endTime, booking?.status]);

  useEffect(() => {
    db.getPaymentSettings().then(setPaymentSettings);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchRef.trim()) return;

    // Search the live database
    const allBookings = await db.getBookings();
    const found = allBookings.find(b => b.bookingRef === searchRef.trim().toUpperCase());

    if (found) {
      setBooking(found);
      localStorage.setItem('activeBookingRef', found.bookingRef);
      setEta(9);
      if (found.status === 'Pending Admin Approval') {
        setStatusText('Request submitted to command center');
      } else if (found.status === 'Chauffeur Dispatched') {
        setStatusText('Dispatch approved. Driver outbound.');
      } else {
        setStatusText('Tracking update received.');
      }
    } else {
      alert('Tracking reference not found. Please verify the code.');
    }
  };

  // Sync with active bookings completed in booking engine
  useEffect(() => {
    if (activeBooking) {
      setBooking(activeBooking);
      setEta(9);
    }
  }, [activeBooking]);

  // Load Vehicle Info
  useEffect(() => {
    if (booking?.vehicle) {
      const loadVehicle = async () => {
        const vehicles = await db.getVehicles();
        const v = vehicles.find(car => car.name.toLowerCase() === booking.vehicle.toLowerCase());
        if (v) setVehicleInfo(v);
      };
      loadVehicle();
    }
  }, [booking?.vehicle]);

  // Sync status text whenever booking status changes
  useEffect(() => {
    if (!booking) return;
    if (booking.status === 'Pending Admin Approval') {
      setStatusText('Request submitted to command center');
    } else if (booking.status === 'Awaiting Payment') {
      setStatusText('Awaiting payment authorization');
    } else if (booking.status === 'Payment Processing') {
      setStatusText('Verifying bank transfer settlement');
    } else if (booking.status === 'Payment Confirmed - Scheduled') {
      setStatusText('Chauffeur scheduled for dispatch');
    } else if (booking.status === 'Chauffeur Dispatched') {
      setStatusText('Dispatch approved. Driver outbound.');
    } else if (booking.status === 'Completed') {
      setStatusText('Ride completed');
    }
  }, [booking?.status]);

  // Real-time Firestore Subscription for Status Updates
  useEffect(() => {
    if (!booking || !booking.bookingRef) return;

    const unsubscribe = onSnapshot(doc(dbFS, 'bookings', booking.bookingRef), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBooking(prev => ({
          ...prev,
          status: data.status || prev.status,
          dispatchTime: data.dispatchtime || data.dispatchTime || prev.dispatchTime,
          driver_id: data.driver_id || data.driverId || prev.driver_id,
          endTime: data.endtime || data.endTime || prev.endTime,
          extension: data.extension || prev.extension
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [booking?.bookingRef]);

  const handlePaymentSent = async () => {
    await db.updateBookingStatus(booking.bookingRef, 'Payment Processing');
    setBooking({ ...booking, status: 'Payment Processing' });
    
    try {
      await triggerPaymentReceivedAlert(booking.bookingRef, booking.personal?.name || 'Unknown');
    } catch (e) {
      console.error('Failed to send payment alert:', e);
    }
    
    alert('Payment flagged as sent. Command Center will verify shortly.');
  };

  const requestExtension = async () => {
    const ext = { hours: extensionHours, status: 'Pending Admin Approval' };
    await db.updateBookingExtension(booking.bookingRef, ext);
    setBooking({ ...booking, extension: ext });
    
    try {
      await triggerExtensionRequestAlert(booking.bookingRef, `${extensionHours} hour(s)`);
    } catch (e) {
      console.error('Failed to send extension alert:', e);
    }
  };

  const handleExtensionPaymentSent = async () => {
    const ext = { ...booking.extension, status: 'Extension Payment Processing' };
    await db.updateBookingExtension(booking.bookingRef, ext);
    setBooking({ ...booking, extension: ext });
  };

  // Fetch and Subscribe to Driver GPS Location
  useEffect(() => {
    if (!booking || !booking.driver_id || booking.status !== 'Chauffeur Dispatched') return;

    // Fetch initial driver info
    const loadDriver = async () => {
      const d = await db.getDriver(booking.driver_id);
      if (d) {
        setDriverInfo(d);
        if (d.current_lat && d.current_lng) {
          setDriverLoc({ lat: d.current_lat, lng: d.current_lng });
        }
      }
    };
    loadDriver();

    // Subscribe to GPS updates from this specific driver in Firestore
    const unsubscribe = onSnapshot(doc(dbFS, 'drivers', booking.driver_id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.current_lat && data.current_lng) {
          setDriverLoc({ lat: data.current_lat, lng: data.current_lng });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [booking?.driver_id, booking?.status]);



  return (
    <div className="tracking-page-wrapper section-container">
      <div className="section-header animate-slide-up">
        <span className="gold-badge">Real-Time Telemetry</span>
        <h2>Chauffeur Dispatch Center</h2>
        <p className="section-subtitle">
          Track the verified credentials, route itinerary, and live ETA calculations of your assigned chauffeur.
        </p>
      </div>

      {booking ? (
        <div className="tracking-dashboard-grid animate-fade-in">
          {/* Left: Map canvas and live telemetry indicators */}
          <div className="map-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {booking.status === 'Pending Admin Approval' && (
              <div className="status-overlay-card">
                <h3>Pending Dispatch Center Review</h3>
                <p>Your booking request is securely submitted and currently being reviewed by our command center. Once approved, payment instructions will appear here.</p>
                <div className="loader-spinner" style={{ margin: '30px auto' }}></div>
              </div>
            )}

            {booking.status === 'Awaiting Payment' && (
              <div className="status-overlay-card">
                <h3>Payment Authorization Required</h3>
                <p>Your itinerary has been approved. Please transfer <strong>₦{booking.totalCost.toLocaleString()} NGN</strong> to confirm dispatch.</p>
                <div className="payment-details-box glass-panel">
                  <div className="detail-row"><span>Bank Name</span> <strong>{paymentSettings?.bankName || 'Sterling Corporate Bank'}</strong></div>
                  <div className="detail-row"><span>Account No.</span> <strong className="gradient-text-gold font-display">{paymentSettings?.accountNo || '009 812 3456'}</strong></div>
                  <div className="detail-row"><span>Account Name</span> <strong>{paymentSettings?.accountName || 'Reach Chauffeur Executive Ltd'}</strong></div>
                </div>
                <button className="btn-champagne" style={{ marginTop: '20px', width: '100%' }} onClick={handlePaymentSent}>
                  I Have Transferred the Funds
                </button>
              </div>
            )}

            {booking.status === 'Payment Processing' && (
              <div className="status-overlay-card">
                <h3>Verifying Transfer</h3>
                <p>Our operator desk is actively confirming your payment settlement. Your scheduled dispatch time will be assigned momentarily.</p>
                <div className="loader-spinner" style={{ margin: '30px auto' }}></div>
              </div>
            )}

            {booking.status === 'Payment Confirmed - Scheduled' && (
              <div className="status-overlay-card">
                <span className="gold-badge" style={{ margin: '0 auto 15px auto', display: 'table' }}>Payment Settled</span>
                <h3>Chauffeur Scheduled</h3>
                <p>Your vehicle has been secured and will dispatch at the operator-designated time below.</p>
                <div className="countdown-box glass-panel">
                  <span>DISPATCH SCHEDULED FOR</span>
                  <h2 className="gradient-text-gold">{booking.dispatchTime ? new Date(booking.dispatchTime).toLocaleString() : 'Pending Official Time'}</h2>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginTop: '20px' }}>
                  The live telemetry map will activate here once your chauffeur is dispatched.
                </p>
              </div>
            )}

            {(booking.status === 'Chauffeur Dispatched' || booking.status === 'Completed' || booking.status === 'Pending Payment') && (
              <>
                <div className="telemetry-bar">
                  <div className="telemetry-data">
                    <span className="telemetry-label">Active ETA</span>
                    <span className="telemetry-val gradient-text-gold">{eta} Mins</span>
                  </div>
                  <div className="telemetry-data">
                    <span className="telemetry-label">Telemetry Speed</span>
                    <span className="telemetry-val">{speed} km/h</span>
                  </div>
                  <div className="telemetry-data status-indicator-col">
                    <span className="telemetry-label">Dispatch Status</span>
                    <span className="telemetry-val pulse-text">{statusText}</span>
                  </div>
                </div>
                
                {booking.endTime && (
                  <div className="countdown-bar glass-panel" style={{ margin: '15px 0', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)' }}>REMAINING DURATION</span>
                      <h2 className="gradient-text-gold font-display" style={{ margin: 0, fontSize: '1.8rem' }}>{timeRemaining}</h2>
                    </div>
                    
                    {(!booking.extension || booking.extension.status === 'Paid') && (Date.now() - new Date(booking.endTime).getTime() < 24 * 60 * 60 * 1000) ? (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select className="glass-input select-dark" value={extensionHours} onChange={e => setExtensionHours(Number(e.target.value))} style={{ padding: '8px' }}>
                          <option value={1}>+1 Hour</option>
                          <option value={2}>+2 Hours</option>
                          <option value={4}>+4 Hours</option>
                          <option value={12}>+12 Hours</option>
                          <option value={24}>+24 Hours</option>
                        </select>
                        <button className="btn-champagne btn-small" onClick={requestExtension}>Extend Ride</button>
                      </div>
                    ) : (!booking.extension || booking.extension.status === 'Paid') ? (
                      <div style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>Ride extension period expired (24h limit)</div>
                    ) : null}

                    {booking.extension?.status === 'Pending Admin Approval' && (
                      <div style={{ color: 'var(--color-champagne)', fontSize: '0.9rem' }}>Extension Requested. Awaiting Operator Approval...</div>
                    )}
                  </div>
                )}
                
                {booking.extension?.status === 'Pending Extension Payment' && (
                  <div className="status-overlay-card" style={{ marginBottom: '20px', padding: '30px 20px' }}>
                    <h3 style={{ fontSize: '1.4rem' }}>Extension Authorized: Payment Required</h3>
                    <p style={{ fontSize: '0.9rem' }}>Your request to extend the ride by {booking.extension.hours} hours is approved. Please transfer funds to confirm.</p>
                    <div className="payment-details-box glass-panel" style={{ marginTop: '10px', padding: '15px' }}>
                      <div className="detail-row"><span>Bank Name</span> <strong>{paymentSettings?.bankName || 'Sterling Corporate Bank'}</strong></div>
                      <div className="detail-row"><span>Account No.</span> <strong className="gradient-text-gold font-display">{paymentSettings?.accountNo || '009 812 3456'}</strong></div>
                      <div className="detail-row"><span>Account Name</span> <strong>{paymentSettings?.accountName || 'Reach Chauffeur Executive Ltd'}</strong></div>
                    </div>
                    <button className="btn-champagne" style={{ marginTop: '15px', width: '100%' }} onClick={handleExtensionPaymentSent}>
                      I Have Transferred the Funds
                    </button>
                  </div>
                )}

                {booking.extension?.status === 'Extension Payment Processing' && (
                  <div className="status-overlay-card" style={{ marginBottom: '20px', padding: '30px 20px' }}>
                    <h3 style={{ fontSize: '1.4rem' }}>Verifying Extension Transfer</h3>
                    <p style={{ fontSize: '0.9rem' }}>Our operator desk is verifying your payment for the {booking.extension.hours}-hour extension. Your remaining time will update momentarily.</p>
                    <div className="loader-spinner" style={{ margin: '15px auto', width: '40px', height: '40px' }}></div>
                  </div>
                )}

                <div className="map-wrapper" style={{ height: '400px', width: '100%', position: 'relative' }}>
                  <MapContainer center={[driverLoc.lat, driverLoc.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[driverLoc.lat, driverLoc.lng]} icon={carIcon}>
                      <Popup>
                        Chauffeur Current Position
                      </Popup>
                    </Marker>
                    <MapUpdater center={[driverLoc.lat, driverLoc.lng]} />
                  </MapContainer>
                </div>
              </>
            )}
          </div>

          {/* Right: Driver Profile and Details */}
          <div className="driver-profile-panel glass-panel">
            <div className="booking-ref-banner">
              <span>REFERENCE CODE</span>
              <h3>{booking.bookingRef}</h3>
            </div>

            <div className="chauffeur-card-details">
              <div className="chauffeur-avatar">
                <span className="avatar-letter">{driverInfo ? driverInfo.name.charAt(0) : '?'}</span>
                <div className="verified-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>

              <div className="chauffeur-identity">
                <h4>{driverInfo ? driverInfo.name : 'Chauffeur Pending Assignment'}</h4>
                <span className="gold-badge">{driverInfo ? driverInfo.tier : 'Executive'} Class Chauffeur</span>
              </div>

              <div className="verification-pills">
                <div className="verif-pill">
                  <span className="pill-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </span>
                  Background Checked
                </div>
                <div className="verif-pill">
                  <span className="pill-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
                  </span>
                  Aviation Cleared
                </div>
                <div className="verif-pill">
                  <span className="pill-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </span>
                  Rating: {driverInfo ? driverInfo.rating : '4.99'}
                </div>
              </div>

              <div className="vehicle-tracking-details">
                <h4>Assigned Fleet Transport</h4>
                <p className="detail-row"><span>Vehicle</span> <strong>{booking.vehicle}</strong></p>
                <p className="detail-row"><span>Color</span> <strong>{vehicleInfo?.color || vehicleInfo?.specs?.color || 'Midnight Obsidian Black'}</strong></p>
                <p className="detail-row"><span>License Plate</span> <strong>{booking.assigned_license_plate || vehicleInfo?.licensePlate || vehicleInfo?.specs?.licensePlate || 'Pending Registry'}</strong></p>
                <p className="detail-row"><span>Itinerary Start</span> <strong>{booking.logistics.pickup}</strong></p>
              </div>

              <div className="operator-contact-box glass-panel">
                <h4>Dispatch & Operator Contacts</h4>
                <p>For immediate coordinate modifications or concierge cargo requests, contact dispatch control direct.</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button 
                    className="btn-glass call-operator-btn" 
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => window.open('https://wa.me/2349010335811', '_blank')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    CALL OFFICE
                  </button>
                  {driverInfo && driverInfo.phone && (
                    <button 
                      className="btn-champagne call-operator-btn" 
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={() => window.open(`https://wa.me/${driverInfo.phone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      CALL DRIVER
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Search for Reference */
        <div className="tracking-search-box glass-panel animate-slide-up">
          <div className="search-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-champagne)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3>Verify Active Dispatch</h3>
          <p>Please enter your booking reference number to activate real-time telemetry tracking.</p>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="e.g. RC-99824"
              className="glass-input search-input"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              required
            />
            <button type="submit" className="btn-champagne search-btn">
              Track Ride
            </button>
          </form>
        </div>
      )}

      <style>{`
        .tracking-dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1.1fr;
          gap: 40px;
          margin-top: 40px;
        }

        @media (max-width: 1024px) {
          .tracking-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .map-panel {
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .telemetry-bar {
          display: grid;
          grid-template-columns: 1fr 1fr 2fr;
          padding: 24px 30px;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.2);
          gap: 20px;
        }

        @media (max-width: 600px) {
          .telemetry-bar {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }

        .telemetry-data {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .telemetry-label {
          font-size: 0.75rem;
          color: var(--color-silver);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .telemetry-val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
        }

        .pulse-text {
          font-size: 1rem;
          color: var(--color-champagne-light);
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .canvas-wrapper {
          width: 100%;
          background: #060608;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .map-canvas {
          width: 100%;
          max-height: 400px;
          display: block;
        }

        /* Driver Profile Panel */
        .driver-profile-panel {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .booking-ref-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 16px;
        }

        .booking-ref-banner span {
          font-size: 0.75rem;
          color: var(--color-silver);
          letter-spacing: 0.05em;
        }

        .booking-ref-banner h3 {
          font-size: 1.4rem;
          color: var(--color-champagne);
          font-weight: 800;
        }

        .chauffeur-card-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
        }

        .chauffeur-avatar {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--color-champagne) 0%, var(--color-champagne-dark) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--glass-border);
        }

        .avatar-letter {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #08080A;
        }

        .verified-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #10B981;
          color: #fff;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
          border: 2px solid var(--color-obsidian-light);
        }

        .chauffeur-identity h4 {
          font-size: 1.3rem;
          margin-bottom: 6px;
        }

        .verification-pills {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .verif-pill {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.8rem;
          color: var(--color-silver);
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }

        .pill-icon {
          color: var(--color-champagne);
        }

        .vehicle-tracking-details {
          width: 100%;
          text-align: left;
          border-top: 1px solid var(--glass-border);
          padding-top: 20px;
        }

        .vehicle-tracking-details h4 {
          font-size: 0.95rem;
          margin-bottom: 14px;
          color: var(--color-champagne);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
          padding: 8px 0;
          color: var(--color-silver);
        }

        .detail-row strong {
          color: var(--color-platinum);
        }

        .operator-contact-box {
          width: 100%;
          padding: 20px;
          border-radius: 12px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(255, 255, 255, 0.01);
        }

        .operator-contact-box h4 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-champagne);
        }

        .operator-contact-box p {
          font-size: 0.75rem;
          color: var(--color-silver);
          line-height: 1.5;
        }

        .call-operator-btn {
          width: 100%;
          padding: 10px;
          font-size: 0.8rem;
        }

        /* Empty State Search */
        .tracking-search-box {
          max-width: 500px;
          margin: 60px auto;
          padding: 50px 40px;
          border-radius: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .search-icon {
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

        .tracking-search-box h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .tracking-search-box p {
          font-size: 0.9rem;
          color: var(--color-silver);
          line-height: 1.5;
        }

        .search-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }

        .search-input {
          text-align: center;
          font-size: 1.1rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .search-btn {
          width: 100%;
        }

        .status-overlay-card {
          padding: 60px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .status-overlay-card h3 {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .status-overlay-card p {
          color: var(--color-silver);
          line-height: 1.6;
          max-width: 400px;
          margin: 0 auto;
        }

        .payment-details-box {
          width: 100%;
          max-width: 400px;
          margin-top: 20px;
          padding: 20px;
          border-radius: 12px;
          background: rgba(212, 175, 55, 0.05);
          border: 1px dashed rgba(212, 175, 55, 0.3);
        }

        .countdown-box {
          margin-top: 30px;
          padding: 30px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--glass-border);
        }

        .countdown-box span {
          font-size: 0.75rem;
          color: var(--color-silver);
          letter-spacing: 0.1em;
        }

        .countdown-box h2 {
          font-size: 1.5rem;
          margin-top: 10px;
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
    </div>
  );
}
