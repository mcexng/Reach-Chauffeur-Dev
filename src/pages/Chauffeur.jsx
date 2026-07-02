import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

export default function Chauffeur() {
  const [phone, setPhone] = useState('');
  const [driver, setDriver] = useState(null);
  const [error, setError] = useState('');
  const [assignedBooking, setAssignedBooking] = useState(null);
  const [driverHistory, setDriverHistory] = useState([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  // Load driver active booking when driver logs in
  useEffect(() => {
    if (driver) {
      checkAssignments();
      const interval = setInterval(checkAssignments, 10000); // Check every 10s
      return () => clearInterval(interval);
    }
  }, [driver]);

  const checkAssignments = async () => {
    const allBookings = await db.getBookings();
    const myBookings = allBookings.filter(b => b.driver_id === driver.id);
    const active = myBookings.find(b => b.status !== 'Completed');
    setAssignedBooking(active || null);
    setDriverHistory(myBookings.filter(b => b.status === 'Completed').sort((a, b) => new Date(b.dispatchTime || 0) - new Date(a.dispatchTime || 0)));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const allDrivers = await db.getDrivers();
    const match = allDrivers.find(d => d.phone === phone);
    if (match) {
      setDriver(match);
      setError('');
    } else {
      setError('No chauffeur registered with this phone number.');
    }
  };

  const toggleTransmission = () => {
    if (isTransmitting) {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      setIsTransmitting(false);
      setWatchId(null);
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }
      
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          db.updateDriverLocation(driver.id, lat, lng);
        },
        (error) => {
          console.error("Error watching position:", error);
          if (error.code === 1) {
            alert('Location permission denied. Please allow GPS access in your browser.');
            setIsTransmitting(false);
          }
          // Ignore timeout errors, it will keep trying
        },
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 20000 }
      );
      
      setWatchId(id);
      setIsTransmitting(true);
    }
  };

  if (!driver) {
    return (
      <div className="chauffeur-portal section-container">
        <div className="auth-form-wrapper glass-panel animate-slide-up" style={{ maxWidth: '400px', margin: '100px auto' }}>
          <div className="login-icon">🧑‍✈️</div>
          <h3>Chauffeur Access</h3>
          <p className="auth-subtitle">Log in to transmit telemetry and view manifests.</p>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Registered Phone Number</label>
              <input
                type="text"
                placeholder="+234..."
                className="glass-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            {error && <p className="login-error-text" style={{ color: 'red' }}>⚠️ {error}</p>}
            <button type="submit" className="btn-champagne login-btn">
              Authenticate
            </button>
          </form>
        </div>
        <style>{`
          .chauffeur-portal {
            min-height: 100vh;
            background-color: var(--color-obsidian);
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="chauffeur-portal-dashboard">
      <div className="dashboard-header">
        <h2>Driver Interface: {driver.name}</h2>
        <span className="tier-badge">{driver.tier} Class</span>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel telemetry-card">
          <h3>Live Telemetry Feed</h3>
          <div className={`status-orb ${isTransmitting ? 'pulsing active' : 'inactive'}`}></div>
          <p className="status-text">{isTransmitting ? 'Broadcasting live GPS to Command Center...' : 'Transmission Offline'}</p>
          
          {coords.lat && (
            <p className="coords-text">LAT: {coords.lat.toFixed(5)} | LNG: {coords.lng.toFixed(5)}</p>
          )}

          <button 
            className={`btn-large ${isTransmitting ? 'btn-glass btn-danger' : 'btn-champagne'}`}
            onClick={toggleTransmission}
            style={{ width: '100%', marginTop: '20px' }}
          >
            {isTransmitting ? 'Stop Transmission' : 'Start Engine & Broadcast GPS'}
          </button>
        </div>

        <div className="glass-panel manifest-card">
          <h3>Active Dispatch Manifest</h3>
          {assignedBooking ? (
            <div className="manifest-details">
              <span className="b-ref">{assignedBooking.bookingRef}</span>
              <h4>{assignedBooking.vehicle} <span style={{ fontSize: '0.8rem', color: 'var(--color-champagne)' }}>({assignedBooking.assigned_license_plate || 'Pending Registry'})</span></h4>
              <hr />
              <p><strong>Passenger:</strong> {assignedBooking.personal.name}</p>
              <p><strong>Phone:</strong> <a href={`tel:${assignedBooking.personal.phone}`}>{assignedBooking.personal.phone}</a></p>
              <p><strong>Pickup:</strong> {assignedBooking.logistics.pickup}</p>
              {assignedBooking.logistics.stops?.length > 0 && (
                 <p><strong>Stops:</strong> {assignedBooking.logistics.stops.join(' → ')}</p>
              )}
              <div className="status-banner">
                {assignedBooking.status}
              </div>
            </div>
          ) : (
            <div className="empty-manifest">
              <p>No active assignments from Command Center.</p>
              <p style={{fontSize: '0.8rem', color: '#888'}}>Waiting for dispatch...</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        <div className="glass-panel manifest-card">
          <h3>Your Ride History</h3>
          {driverHistory.length === 0 ? (
            <div className="empty-manifest">
              <p>No completed rides found in your log.</p>
            </div>
          ) : (
            <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {driverHistory.map(trip => (
                <div key={trip.bookingRef} className="history-item" style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--color-champagne)', fontWeight: 'bold' }}>{trip.bookingRef}</span>
                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{new Date(trip.dispatchTime || trip.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginBottom: '5px' }}><strong>Vehicle:</strong> {trip.vehicle} <span style={{ color: 'var(--color-silver)', fontSize: '0.85rem' }}>[{trip.assigned_license_plate || 'Pending Registry'}]</span></div>
                  <div><strong>Route:</strong> {trip.logistics.pickup} {trip.logistics.stops?.length > 0 ? ' (Multi-stop)' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .chauffeur-portal-dashboard {
          min-height: 100vh;
          background-color: var(--color-obsidian);
          padding: 40px 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .tier-badge {
          background-color: rgba(212, 175, 55, 0.2);
          color: var(--color-champagne);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .telemetry-card {
          text-align: center;
          padding: 40px 20px;
        }
        .status-orb {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          margin: 20px auto;
          background-color: #333;
        }
        .status-orb.active {
          background-color: #34d399;
          box-shadow: 0 0 20px rgba(52, 211, 153, 0.5);
        }
        .pulsing {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(52, 211, 153, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
        .status-text {
          color: var(--color-silver);
          font-family: 'Outfit', sans-serif;
        }
        .coords-text {
          font-family: monospace;
          color: var(--color-champagne);
          margin-top: 10px;
        }
        .manifest-card {
          padding: 30px;
        }
        .manifest-details p {
          margin: 10px 0;
          color: var(--color-silver);
        }
        .manifest-details strong {
          color: white;
        }
        .b-ref {
          color: var(--color-champagne);
          font-weight: bold;
          font-size: 0.9rem;
        }
        .status-banner {
          margin-top: 20px;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid var(--color-champagne);
          color: var(--color-champagne);
          text-align: center;
          padding: 10px;
          border-radius: 8px;
          font-weight: bold;
        }
        .empty-manifest {
          text-align: center;
          padding: 40px 0;
          color: #888;
        }
        .btn-danger {
          border: 1px solid #ef4444;
          color: #ef4444;
        }
        .btn-danger:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
}
