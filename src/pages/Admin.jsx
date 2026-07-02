import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { dbFS } from '../utils/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
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

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204121.png', // Car icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Component to handle dynamic map bounds if needed
function MapBoundsUpdater({ drivers }) {
  const map = useMap();
  useEffect(() => {
    if (drivers && drivers.length > 0) {
      const activeDrivers = drivers.filter(d => d.current_lat && d.current_lng);
      if (activeDrivers.length > 0) {
        const bounds = L.latLngBounds(activeDrivers.map(d => [d.current_lat, d.current_lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [drivers, map]);
  return null;
}

export default function Admin({ onFleetUpdate, onNewsUpdate, onBookingsUpdate }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [articles, setArticles] = useState([]);
  const [corpAccounts, setCorpAccounts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // Admin Security
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [schedulingRef, setSchedulingRef] = useState(null);
  const [dispatchDateTime, setDispatchDateTime] = useState('');
  
  const [dispatchingRef, setDispatchingRef] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [editingAssignmentRef, setEditingAssignmentRef] = useState(null);

  // History Tab States
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySelectedVehicleId, setHistorySelectedVehicleId] = useState(null);

  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Form states - Add Vehicle
  const [newCar, setNewCar] = useState({
    id: '',
    name: '',
    tier: 'presidential',
    tierLabel: 'Presidential Limousine',
    priceAirport: '',
    price12hr: '',
    price24hr: '',
    priceHourly: '',
    promoActive: false,
    promoDiscount: 0,
    image1: '',
    image2: '',
    image3: '',
    videoUrl: '',
    wifi: '5G Dedicated Hotspot',
    refreshments: 'Dom Pérignon Chilled + Gold Standard Water',
    privacy: 'Level 4 Max',
    passengers: 4,
    luggage: 3,
    color: 'Midnight Obsidian Black',
    licensePlate: 'Pending Registry',
    image1File: null,
    videoUrlFile: null
  });

  // Form states - Add Article
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'Vehicle Review',
    readTime: '5 min read',
    summary: '',
    image: '',
    imageFile: null,
    content: ''
  });

  // Form states - Add Driver
  const [newDriver, setNewDriver] = useState({
    id: '',
    name: '',
    phone: '',
    tier: 'Executive',
    rating: 5.0
  });

  // Form states - Promo Code
  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    discountPercent: '',
    maxUses: 1
  });
  const [promoCodes, setPromoCodes] = useState([]);

  // Form states - Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    bankName: '',
    accountNo: '',
    accountName: ''
  });

  const [pricingSettings, setPricingSettings] = useState({
    promoActive: false,
    promoDiscountPercent: 0,
    multipliers: {
      airport: 0.65,
      '12hr': 1.0,
      '24hr': 1.95,
      other: 0.15
    }
  });

  // Corporate Accounts Edit States
  const [selectedCorpEmail, setSelectedCorpEmail] = useState('');
  const [editCorpName, setEditCorpName] = useState('');
  const [editCorpContact, setEditCorpContact] = useState('');
  const [editCorpPhone, setEditCorpPhone] = useState('');
  const [editCorpId, setEditCorpId] = useState('');
  const [editCorpDiscount, setEditCorpDiscount] = useState(0);
  const [editCorpDiscountEnabled, setEditCorpDiscountEnabled] = useState(true);

  // Load datasets on mount
  useEffect(() => {
    refreshData();

    // Subscribe to driver GPS updates in Firestore
    const unsubscribe = onSnapshot(collection(dbFS, 'drivers'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const updatedDriver = { id: change.doc.id, ...change.doc.data() };
          setDrivers((prev) => 
            prev.map(d => d.id === updatedDriver.id ? { ...d, current_lat: updatedDriver.current_lat, current_lng: updatedDriver.current_lng, status: updatedDriver.status } : d)
          );
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshData = async () => {
    setBookings(await db.getBookings());
    setVehicles(await db.getVehicles());
    setPromoCodes(await db.getPromoCodes());
    setArticles(await db.getArticles());
    setCorpAccounts(await db.getCorpAccounts());
    setDrivers(await db.getDrivers());
    setPaymentSettings(await db.getPaymentSettings());
    setPricingSettings(await db.getPricingSettings());
  };

  const handleStatusChange = async (ref, status, extraData = {}) => {
    await db.updateBookingStatus(ref, status, extraData);
    refreshData();
    if (onBookingsUpdate) onBookingsUpdate();
  };

  const handleSelectCorp = (corp) => {
    setSelectedCorpEmail(corp.email);
    setEditCorpName(corp.companyName);
    setEditCorpContact(corp.contactName);
    setEditCorpPhone(corp.phone || '');
    setEditCorpId(corp.corporateId || '');
    setEditCorpDiscount(corp.discountRate || 0);
    setEditCorpDiscountEnabled((corp.discountRate || 0) > 0);
  };

  const handleSaveCorp = async (e) => {
    e.preventDefault();
    if (!selectedCorpEmail) return;
    
    const finalDiscount = editCorpDiscountEnabled ? Number(editCorpDiscount) : 0;
    
    await db.updateCorpAccount(selectedCorpEmail, {
      companyName: editCorpName,
      contactName: editCorpContact,
      phone: editCorpPhone,
      corporateId: editCorpId,
      discountRate: finalDiscount
    });
    
    alert('Corporate account updated successfully!');
    refreshData();
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    // For MVP, we use a simple hardcoded passkey until Supabase Auth is fully linked
    if (adminPassword === 'reach2026') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Command Center Credentials.');
    }
  };

  // Fleet management operations
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newCar.name || !newCar.priceAirport || !newCar.price12hr || !newCar.price24hr || !newCar.priceHourly) {
      alert('Please fill in Name and all four Pricing fields.');
      return;
    }

    setIsUploading(true);
    try {
      let imgUrl = newCar.image1 || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600';
      if (newCar.image1File) {
        imgUrl = await db.uploadMedia(newCar.image1File) || imgUrl;
      }

      let vidUrl = newCar.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-luxury-black-car-driving-through-city-at-night-42171-large.mp4';
      if (newCar.videoUrlFile) {
        vidUrl = await db.uploadMedia(newCar.videoUrlFile) || vidUrl;
      }

      const carData = {
        id: newCar.id || newCar.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: newCar.name,
        tier: newCar.tier,
        tierLabel: newCar.tierLabel,
        basePrice: Number(newCar.priceHourly),
        standardPrice: Number(newCar.price12hr),
        priceAirport: Number(newCar.priceAirport),
        price12hr: Number(newCar.price12hr),
        price24hr: Number(newCar.price24hr),
        priceHourly: Number(newCar.priceHourly),
        promoActive: newCar.promoActive,
        promoDiscount: Number(newCar.promoDiscount),
        images: [imgUrl, imgUrl, imgUrl],
        videoUrl: vidUrl,
        specs: {
          passengers: Number(newCar.passengers),
          luggage: Number(newCar.luggage),
          wifi: newCar.wifi,
          refreshments: newCar.refreshments,
          privacy: newCar.privacy,
          color: newCar.color || 'Midnight Obsidian Black',
          licensePlate: newCar.licensePlate || 'Pending Registry'
        },
        isNew: true
      };

      await db.addVehicle(carData);
      refreshData();
      if (onFleetUpdate) onFleetUpdate();

    // Reset Form
    setNewCar({
      id: '',
      name: '',
      tier: 'presidential',
      tierLabel: 'Presidential Limousine',
      priceAirport: '',
      price12hr: '',
      price24hr: '',
      priceHourly: '',
      promoActive: false,
      promoDiscount: 0,
      image1: '',
      image2: '',
      image3: '',
      videoUrl: '',
      wifi: '5G Dedicated Hotspot',
      refreshments: 'Dom Pérignon Chilled + Gold Standard Water',
      privacy: 'Level 4 Max',
      passengers: 4,
      luggage: 3,
      color: 'Midnight Obsidian Black',
      licensePlate: 'Pending Registry',
      image1File: null,
      videoUrlFile: null
    });
    alert('Vehicle added to fleet catalog.');
    } catch (err) {
      console.error(err);
      alert('Failed to register vehicle or upload media.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm('Delete this vehicle from fleet matrix?')) {
      await db.deleteVehicle(id);
      refreshData();
      if (onFleetUpdate) onFleetUpdate();
    }
  };

  // Article operations
  const handleAddArticle = async (e) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content) {
      alert('Please fill in Article Title and Content.');
      return;
    }

    setIsUploading(true);
    try {
      let imgUrl = newArticle.image || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=400';
      if (newArticle.imageFile) {
        imgUrl = await db.uploadMedia(newArticle.imageFile) || imgUrl;
      }

      await db.addArticle({
        title: newArticle.title,
        category: newArticle.category,
        readTime: newArticle.readTime,
        summary: newArticle.summary || newArticle.content.substring(0, 120) + '...',
        image: imgUrl,
        content: newArticle.content
      });

      refreshData();
      if (onNewsUpdate) onNewsUpdate();

    setNewArticle({
      title: '',
      category: 'Vehicle Review',
      readTime: '5 min read',
      summary: '',
      image: '',
      imageFile: null,
      content: ''
    });
    alert('Editorial article published to News Hub.');
    } catch(err) {
      console.error(err);
      alert('Failed to publish article.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (window.confirm('Delete this article from News Hub?')) {
      await db.deleteArticle(id);
      refreshData();
      if (onNewsUpdate) onNewsUpdate();
    }
  };

  // Driver operations
  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.phone) {
      alert('Please fill in Name and Phone number.');
      return;
    }
    
    await db.addDriver({
      id: 'drv-' + Math.random().toString(36).substr(2, 9),
      name: newDriver.name,
      phone: newDriver.phone,
      tier: newDriver.tier,
      rating: Number(newDriver.rating),
      current_lat: 6.45407, // Default to a central Lagos location or something reasonable
      current_lng: 3.4246,
      status: 'Available'
    });
    
    refreshData();
    setNewDriver({
      id: '',
      name: '',
      phone: '',
      tier: 'Executive',
      rating: 5.0
    });
    alert('Chauffeur added to roster.');
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm('Remove this chauffeur from the active roster?')) {
      await db.deleteDriver(id);
      refreshData();
    }
  };

  // Database Sync Operations
  const handleDownloadJSON = async () => {
    const dataString = await db.exportDatabase();
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reach_chauffeur_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const success = await db.importDatabase(event.target.result);
      if (success) {
        alert('Database successfully restored from backup.');
        refreshData();
      } else {
        alert('Failed to import database. Invalid format.');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page-wrapper section-container">
        <div className="auth-form-wrapper glass-panel animate-slide-up" style={{ maxWidth: '400px', margin: '100px auto' }}>
          <div className="login-icon">🛡️</div>
          <h3>Command Center</h3>
          <p className="auth-subtitle">Restricted Access. Enter operator key.</p>
          <form onSubmit={handleAdminLogin} className="login-form">
            <div className="input-group">
              <label>Operator Passkey</label>
              <input
                type="password"
                placeholder="••••••••"
                className="glass-input"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            {loginError && <p className="login-error-text" style={{ color: 'red' }}>⚠️ {loginError}</p>}
            <button type="submit" className="btn-champagne login-btn">
              Authenticate
            </button>
          </form>
          <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>Demo passkey: reach2026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper section-container">
      <div className="section-header animate-slide-up">
        <span className="gold-badge">Administration Center</span>
        <h2>Reach Operator Desk</h2>
        <p className="section-subtitle">
          Manage live vehicle dispatches, edit fleet details, publish articles, and verify corporate accounts.
        </p>
      </div>

      <div className="admin-grid animate-fade-in">
        {/* Left Control Tabs */}
        <div className="admin-tabs-panel glass-panel">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          >
            🔔 Bookings Queue ({bookings.filter(b => b.status === 'Pending Payment').length} New)
          </button>
          <button 
            onClick={() => setActiveTab('fleet')}
            className={`admin-tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          >
            🚗 Fleet Matrix Manager
          </button>
          <button 
            onClick={() => setActiveTab('news')}
            className={`admin-tab-btn ${activeTab === 'news' ? 'active' : ''}`}
          >
            📰 News Hub Curation
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            className={`admin-tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          >
            🧑‍✈️ Chauffeur Roster
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`admin-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          >
            📊 Ride History & Analytics
          </button>
          <button 
            onClick={() => setActiveTab('corporate')}
            className={`admin-tab-btn ${activeTab === 'corporate' ? 'active' : ''}`}
          >
            🏢 Corporate Accounts
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`admin-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
            style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}
          >
            💾 Database Sync
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`admin-tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          >
            💳 Payment Settings
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
          >
            🏷️ Pricing & Promos
          </button>
        </div>

        {/* Right Active View Pane */}
        <div className="admin-content-panel">
          {/* BOOKINGS VIEW */}
          {activeTab === 'bookings' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Active Booking Requests</h3>
                <p>Verify customer logs, click payment approvals, and trigger driver dispatch tracking.</p>
              </div>

              <div className="admin-list bookings-admin-list">
                {bookings.length === 0 ? (
                  <p className="empty-msg">No bookings recorded in database.</p>
                ) : (
                  bookings.map((booking) => (
                    <div key={booking.bookingRef} className="admin-booking-card glass-panel">
                      <div className="booking-card-top">
                        <div>
                          <span className="b-ref font-display">{booking.bookingRef}</span>
                          <h4 className="b-vehicle">{booking.vehicle}</h4>
                        </div>
                        <span className="status-badge" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-champagne)', border: '1px solid var(--color-champagne)' }}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="booking-card-mid">
                        <div className="b-detail-col">
                          <strong>Passenger:</strong> {booking.personal.name} • {booking.personal.phone}
                        </div>
                        <div className="b-detail-col">
                          <strong>Route Pickup:</strong> {booking.logistics.pickup}
                        </div>
                        <div className="b-detail-col" style={{ color: 'var(--color-champagne)' }}>
                          <strong>Duration Type:</strong> {booking.bookingType === 'multiday' ? `${booking.logistics.days || '?'} Days (Multi-day)` : booking.bookingType.toUpperCase()}
                        </div>
                        {booking.dispatchTime && (
                          <div className="b-detail-col">
                            <strong>Dispatch Date/Time:</strong> {new Date(booking.dispatchTime).toLocaleString()}
                          </div>
                        )}
                        {booking.driver_id && (
                          <div className="b-detail-col">
                            <strong>Assigned Chauffeur:</strong> {drivers.find(d => d.id === booking.driver_id)?.name || 'Unknown'} 
                            ({drivers.find(d => d.id === booking.driver_id)?.phone})
                          </div>
                        )}
                        {booking.logistics.stops && booking.logistics.stops.length > 0 && (
                          <div className="b-detail-col">
                            <strong>Additional Stops:</strong> {booking.logistics.stops.join(' → ')}
                          </div>
                        )}
                        <div className="b-detail-col">
                          <strong>Tariff Total:</strong> <span className="gradient-text-gold font-display bold">₦{booking.totalCost.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="booking-card-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        {/* 1. Pending Admin Approval */}
                        {booking.status === 'Pending Admin Approval' && (
                          <button 
                            className="btn-champagne btn-small"
                            onClick={() => handleStatusChange(booking.bookingRef, 'Awaiting Payment')}
                          >
                            Approve Booking Request
                          </button>
                        )}
                        
                        {/* 2. Awaiting Payment or Payment Processing */}
                        {(booking.status === 'Awaiting Payment' || booking.status === 'Payment Processing') && (
                          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            {booking.status === 'Payment Processing' && <span style={{ color: '#34d399', fontSize: '0.85rem', alignSelf: 'center' }}>User flagged payment as sent!</span>}
                            <button 
                              className="btn-champagne btn-small"
                              style={{ marginLeft: 'auto' }}
                              onClick={() => setSchedulingRef(booking.bookingRef)}
                            >
                              Verify Payment & Schedule
                            </button>
                          </div>
                        )}

                        {/* Schedule Dispatch Time Prompt */}
                        {schedulingRef === booking.bookingRef && (
                          <div className="scheduling-box glass-panel" style={{ width: '100%', padding: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div className="input-group" style={{ flexGrow: 1 }}>
                              <label style={{ fontSize: '0.8rem' }}>Set Official Dispatch Time</label>
                              <input 
                                type="datetime-local" 
                                className="glass-input"
                                value={dispatchDateTime}
                                onChange={(e) => setDispatchDateTime(e.target.value)}
                              />
                            </div>
                            <button 
                              className="btn-champagne btn-small"
                              onClick={() => {
                                if(!dispatchDateTime) return alert('Select dispatch time');
                                
                                // Calculate end time based on booking duration
                                const start = new Date(dispatchDateTime).getTime();
                                let hours = 24; // default for 'other'
                                if (booking.bookingType === 'airport') hours = 6;
                                else if (booking.bookingType === '12hr') hours = 12;
                                else if (booking.bookingType === '24hr') hours = 24;
                                else if (booking.bookingType === 'multiday') {
                                  const days = booking.logistics.days || 2;
                                  hours = days * 24;
                                }

                                const endTime = new Date(start + hours * 60 * 60 * 1000).toISOString();

                                handleStatusChange(booking.bookingRef, 'Payment Confirmed - Scheduled', { dispatchTime: dispatchDateTime, endTime });
                                setSchedulingRef(null);
                                setDispatchDateTime('');
                              }}
                            >
                              Confirm
                            </button>
                            <button className="btn-glass btn-small" onClick={() => setSchedulingRef(null)}>Cancel</button>
                          </div>
                        )}

                        {/* 3. Scheduled */}
                        {booking.status === 'Payment Confirmed - Scheduled' && (
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: dispatchingRef === booking.bookingRef ? '10px' : '0' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-silver)' }}>
                                Scheduled for: {new Date(booking.dispatchTime).toLocaleString()}
                              </span>
                              {dispatchingRef !== booking.bookingRef && (
                                <button 
                                  className="btn-champagne btn-small"
                                  onClick={() => setDispatchingRef(booking.bookingRef)}
                                >
                                  Assign Driver & Dispatch
                                </button>
                              )}
                            </div>
                            
                            {/* Driver Selection Box */}
                            {dispatchingRef === booking.bookingRef && (
                              <div className="scheduling-box glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <div className="input-group" style={{ flexGrow: 1 }}>
                                    <label style={{ fontSize: '0.8rem' }}>Select Chauffeur to Assign</label>
                                    <select 
                                      className="glass-input select-dark"
                                      value={selectedDriverId}
                                      onChange={(e) => setSelectedDriverId(e.target.value)}
                                    >
                                      <option value="">-- Choose a Driver --</option>
                                      {drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.tier} - ⭐{d.rating})</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="input-group" style={{ flexGrow: 1 }}>
                                    <label style={{ fontSize: '0.8rem' }}>Select Physical Vehicle</label>
                                    <select 
                                      className="glass-input select-dark"
                                      value={selectedVehicleId}
                                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                                    >
                                      <option value="">-- Choose a Vehicle --</option>
                                      {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>
                                          {v.name} ({v.licensePlate || 'Pending Registry'})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button 
                                    className="btn-champagne btn-small"
                                    onClick={() => {
                                      if(!selectedDriverId) return alert('Select a driver to dispatch');
                                      if(!selectedVehicleId) return alert('Select a vehicle to dispatch');
                                      
                                      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                                      
                                      // Recalculate endTime starting from actual dispatch moment
                                      let hours = 24;
                                      if (booking.bookingType === 'airport') hours = 6;
                                      else if (booking.bookingType === '12hr') hours = 12;
                                      else if (booking.bookingType === '24hr') hours = 24;
                                      else if (booking.bookingType === 'multiday') {
                                        const days = booking.logistics?.days || 2;
                                        hours = days * 24;
                                      }
                                      const actualEndTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

                                      handleStatusChange(booking.bookingRef, 'Chauffeur Dispatched', { 
                                        driver_id: selectedDriverId,
                                        assigned_vehicle_id: selectedVehicleId,
                                        assigned_license_plate: vehicle.licensePlate,
                                        endTime: actualEndTime
                                      });
                                      setDispatchingRef(null);
                                      setSelectedDriverId('');
                                      setSelectedVehicleId('');
                                    }}
                                  >
                                    Dispatch Now
                                  </button>
                                  <button className="btn-glass btn-small" onClick={() => {
                                    setDispatchingRef(null);
                                    setSelectedVehicleId('');
                                    setSelectedDriverId('');
                                  }}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. Dispatched */}
                        {booking.status === 'Chauffeur Dispatched' && (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {editingAssignmentRef === booking.bookingRef ? (
                              <div className="scheduling-box glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid var(--color-champagne)' }}>
                                <h5>Edit Dispatch Assignment</h5>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <div className="input-group" style={{ flexGrow: 1 }}>
                                    <label style={{ fontSize: '0.8rem' }}>Reassign Chauffeur</label>
                                    <select 
                                      className="glass-input select-dark"
                                      value={selectedDriverId}
                                      onChange={(e) => setSelectedDriverId(e.target.value)}
                                    >
                                      <option value="">-- Maintain Current Driver --</option>
                                      {drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.tier})</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="input-group" style={{ flexGrow: 1 }}>
                                    <label style={{ fontSize: '0.8rem' }}>Reassign Vehicle</label>
                                    <select 
                                      className="glass-input select-dark"
                                      value={selectedVehicleId}
                                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                                    >
                                      <option value="">-- Maintain Current Vehicle --</option>
                                      {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>
                                          {v.name} ({v.licensePlate || 'Pending'})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button 
                                    className="btn-champagne btn-small"
                                    onClick={() => {
                                      const updates = {};
                                      if (selectedDriverId) updates.driver_id = selectedDriverId;
                                      if (selectedVehicleId) {
                                        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                                        updates.assigned_vehicle_id = selectedVehicleId;
                                        updates.assigned_license_plate = vehicle.licensePlate;
                                      }
                                      if (Object.keys(updates).length > 0) {
                                        handleStatusChange(booking.bookingRef, 'Chauffeur Dispatched', updates);
                                      }
                                      setEditingAssignmentRef(null);
                                      setSelectedDriverId('');
                                      setSelectedVehicleId('');
                                    }}
                                  >
                                    Update Assignment
                                  </button>
                                  <button className="btn-glass btn-small" onClick={() => {
                                    setEditingAssignmentRef(null);
                                    setSelectedVehicleId('');
                                    setSelectedDriverId('');
                                  }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                className="btn-glass btn-small"
                                style={{ alignSelf: 'flex-start' }}
                                onClick={() => setEditingAssignmentRef(booking.bookingRef)}
                              >
                                Edit Assignment (Swap Driver/Vehicle)
                              </button>
                            )}

                            {booking.extension?.status === 'Pending Admin Approval' && (
                              <div style={{ padding: '10px', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--color-champagne)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-champagne)' }}>Extension Requested: +{booking.extension.hours} Hours</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button className="btn-champagne btn-small" onClick={() => db.updateBookingExtension(booking.bookingRef, { ...booking.extension, status: 'Pending Extension Payment' }).then(refreshData)}>Approve & Request Payment</button>
                                  <button className="btn-glass btn-small" style={{ color: '#ff6b6b' }} onClick={() => db.updateBookingExtension(booking.bookingRef, null).then(refreshData)}>Decline</button>
                                </div>
                              </div>
                            )}
                            {booking.extension?.status === 'Pending Extension Payment' && (
                              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Waiting for user to pay for +{booking.extension.hours} hr extension...</span>
                              </div>
                            )}
                            {booking.extension?.status === 'Extension Payment Processing' && (
                              <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#34d399', fontSize: '0.85rem' }}>User marked extension paid!</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button className="btn-champagne btn-small" onClick={() => {
                                    const newEnd = new Date(new Date(booking.endTime).getTime() + booking.extension.hours * 60 * 60 * 1000).toISOString();
                                    db.updateBookingStatus(booking.bookingRef, booking.status, { endTime: newEnd }).then(() => 
                                      db.updateBookingExtension(booking.bookingRef, { ...booking.extension, status: 'Paid' })
                                    ).then(refreshData);
                                  }}>Verify Payment</button>
                                  <button className="btn-glass btn-small" style={{ color: '#ff6b6b' }} onClick={() => db.updateBookingExtension(booking.bookingRef, null).then(refreshData)}>Decline</button>
                                </div>
                              </div>
                            )}
                            <button 
                              className="btn-glass btn-small"
                              style={{ marginLeft: 'auto' }}
                              onClick={() => handleStatusChange(booking.bookingRef, 'Completed')}
                            >
                              Mark Ride Complete
                            </button>
                          </div>
                        )}

                        {/* 5. Completed */}
                        {booking.status === 'Completed' && (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span className="completion-checked">✓ Ride Complete</span>
                            
                            {booking.extension?.status === 'Pending Admin Approval' && (
                              <div style={{ padding: '10px', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--color-champagne)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-champagne)' }}>Extension Requested: +{booking.extension.hours} Hours</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button className="btn-champagne btn-small" onClick={() => db.updateBookingExtension(booking.bookingRef, { ...booking.extension, status: 'Pending Extension Payment' }).then(refreshData)}>Approve & Request Payment</button>
                                  <button className="btn-glass btn-small" style={{ color: '#ff6b6b' }} onClick={() => db.updateBookingExtension(booking.bookingRef, null).then(refreshData)}>Decline</button>
                                </div>
                              </div>
                            )}

                            {booking.extension?.status === 'Pending Extension Payment' && (
                              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Waiting for user to pay for +{booking.extension.hours} hr extension...</span>
                              </div>
                            )}

                            {booking.extension?.status === 'Extension Payment Processing' && (
                              <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#34d399', fontSize: '0.85rem' }}>User marked extension paid!</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button className="btn-champagne btn-small" onClick={() => {
                                    const newEnd = new Date(new Date(booking.endTime).getTime() + booking.extension.hours * 60 * 60 * 1000).toISOString();
                                    // Change status back to Chauffeur Dispatched since it is extended
                                    db.updateBookingStatus(booking.bookingRef, 'Chauffeur Dispatched', { endTime: newEnd }).then(() => 
                                      db.updateBookingExtension(booking.bookingRef, { ...booking.extension, status: 'Paid' })
                                    ).then(refreshData);
                                  }}>Verify Payment</button>
                                  <button className="btn-glass btn-small" style={{ color: '#ff6b6b' }} onClick={() => db.updateBookingExtension(booking.bookingRef, null).then(refreshData)}>Decline</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FLEET MATRIX MANAGER */}
          {activeTab === 'fleet' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Fleet Catalog Manager</h3>
                <p>Register new luxury sedans/SUVs, adjust booking rates, or remove decommissioned vehicles.</p>
              </div>

              {/* Add Vehicle Form */}
              <form onSubmit={handleAddVehicle} className="admin-form glass-panel">
                <h4>Add New Vehicle to Catalog</h4>
                
                <div className="form-row">
                  <div className="input-group">
                    <label>Vehicle Model Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2026 Mercedes-Maybach S-Class"
                      className="glass-input"
                      value={newCar.name}
                      onChange={(e) => setNewCar({ ...newCar, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Tier Segment</label>
                    <select 
                      className="glass-input select-dark"
                      value={newCar.tier}
                      onChange={(e) => {
                        let label = 'Executive Sedan';
                        if (e.target.value === 'presidential') label = 'Presidential Limousine';
                        if (e.target.value === 'suv') label = 'Luxury SUV';
                        setNewCar({ ...newCar, tier: e.target.value, tierLabel: label });
                      }}
                    >
                      <option value="sedan">Executive Sedan</option>
                      <option value="suv">Luxury SUV</option>
                      <option value="presidential">Presidential Limousine</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Airport Transfer Price (NGN)</label>
                    <input 
                      type="number" 
                      placeholder="150000"
                      className="glass-input"
                      value={newCar.priceAirport}
                      onChange={(e) => setNewCar({ ...newCar, priceAirport: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>12-Hour Daily Care Price (NGN)</label>
                    <input 
                      type="number" 
                      placeholder="350000"
                      className="glass-input"
                      value={newCar.price12hr}
                      onChange={(e) => setNewCar({ ...newCar, price12hr: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>24-Hour Full Day Price (NGN)</label>
                    <input 
                      type="number" 
                      placeholder="550000"
                      className="glass-input"
                      value={newCar.price24hr}
                      onChange={(e) => setNewCar({ ...newCar, price24hr: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Custom Hourly Price (NGN)</label>
                    <input 
                      type="number" 
                      placeholder="60000"
                      className="glass-input"
                      value={newCar.priceHourly}
                      onChange={(e) => setNewCar({ ...newCar, priceHourly: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ background: 'rgba(212,175,55,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '20px' }}>
                  <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label>Enable Vehicle Promo?</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '10px' }}>
                      <input 
                        type="checkbox" 
                        checked={newCar.promoActive}
                        onChange={(e) => setNewCar({ ...newCar, promoActive: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span>Active Promo</span>
                    </label>
                  </div>
                  <div className="input-group">
                    <label>Vehicle Promo Discount (%)</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 10"
                      className="glass-input"
                      value={newCar.promoDiscount}
                      onChange={(e) => setNewCar({ ...newCar, promoDiscount: e.target.value })}
                      disabled={!newCar.promoActive}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Primary Image (JPG/PNG)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="glass-input"
                      onChange={(e) => setNewCar({ ...newCar, image1File: e.target.files[0] })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Cinematic Video Tour (MP4)</label>
                    <input 
                      type="file" 
                      accept="video/mp4,video/x-m4v,video/*"
                      className="glass-input"
                      onChange={(e) => setNewCar({ ...newCar, videoUrlFile: e.target.files[0] })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group input-third">
                    <label>Passengers</label>
                    <input 
                      type="number" 
                      className="glass-input"
                      value={newCar.passengers}
                      onChange={(e) => setNewCar({ ...newCar, passengers: e.target.value })}
                    />
                  </div>
                  <div className="input-group input-third">
                    <label>Luggage Capacity</label>
                    <input 
                      type="number" 
                      className="glass-input"
                      value={newCar.luggage}
                      onChange={(e) => setNewCar({ ...newCar, luggage: e.target.value })}
                    />
                  </div>
                  <div className="input-group input-third">
                    <label>Comfort Level Privacy</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Level 4 Max"
                      className="glass-input"
                      value={newCar.privacy}
                      onChange={(e) => setNewCar({ ...newCar, privacy: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Vehicle Exterior Color</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Midnight Obsidian Black"
                      className="glass-input"
                      value={newCar.color}
                      onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>License Plate / Registration</label>
                    <input 
                      type="text" 
                      placeholder="e.g. LA-99A-02"
                      className="glass-input"
                      value={newCar.licensePlate}
                      onChange={(e) => setNewCar({ ...newCar, licensePlate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-champagne" disabled={isUploading}>
                  {isUploading ? 'Uploading Media & Registering...' : 'Register Vehicle to Matrix'}
                </button>
              </form>

              {/* Current Vehicles list */}
              <div className="current-items-list">
                <h4>Registered Fleet Catalog & Analytics</h4>
                <div className="catalog-grid">
                  {vehicles.map((car) => {
                    const completedTrips = bookings.filter(b => b.vehicle === car.name && b.status === 'Completed').length;
                    const totalRevenue = bookings.filter(b => b.vehicle === car.name && b.status === 'Completed').reduce((sum, b) => sum + (b.totalCost || 0), 0);
                    
                    return (
                      <div key={car.id} className="catalog-car-card glass-panel" style={{ display: 'flex', flexDirection: 'column', opacity: car.isActive ? 1 : 0.6 }}>
                        <img src={car.images[0]} alt={car.name} style={{ height: '180px', objectFit: 'cover' }} />
                        <div className="car-card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <h5>{car.name}</h5>
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-champagne)', fontWeight: 'bold' }}>{car.licensePlate || 'Pending Registry'}</span>
                          <p style={{ marginTop: '5px' }}>{car.tierLabel}</p>
                          <span className="price-tag" style={{ marginBottom: '15px' }}>₦{car.basePrice.toLocaleString()} / hr</span>
                          
                          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ color: '#aaa' }}>Completed Trips:</span>
                              <strong style={{ color: 'var(--color-champagne)' }}>{completedTrips}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#aaa' }}>Lifetime Revenue:</span>
                              <strong style={{ color: 'var(--color-platinum)' }}>₦{totalRevenue.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                            <button 
                              className={`btn-small ${car.isActive ? 'btn-glass' : 'btn-champagne'}`}
                              style={{ flex: 1 }}
                              onClick={() => {
                                db.toggleVehicleStatus(car.id, !car.isActive).then(refreshData);
                              }}
                            >
                              {car.isActive ? 'Mark Inactive' : 'Mark Active'}
                            </button>
                            <button 
                              className="btn-glass btn-small delete-btn"
                              style={{ flex: 1 }}
                              onClick={() => handleDeleteVehicle(car.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* NEWS HUB CURATION */}
          {activeTab === 'news' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>News Hub Publisher</h3>
                <p>Publish luxury reviews, travel digests, and concierge columns to the public editorial space.</p>
              </div>

              <form onSubmit={handleAddArticle} className="admin-form glass-panel">
                <h4>Publish New Editorial Article</h4>

                <div className="form-row">
                  <div className="input-group">
                    <label>Article Headline</label>
                    <input 
                      type="text" 
                      placeholder="e.g. The Silent Cabin: Under the Hood of the Mercedes-Maybach"
                      className="glass-input"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Editorial Category</label>
                    <select 
                      className="glass-input select-dark"
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                    >
                      <option value="Vehicle Review">Vehicle Review</option>
                      <option value="Luxury Travel">Luxury Travel</option>
                      <option value="Chauffeur Culture">Chauffeur Culture</option>
                      <option value="Concierge Etiquette">Concierge Etiquette</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Cover Photo (JPG/PNG)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="glass-input"
                      onChange={(e) => setNewArticle({ ...newArticle, imageFile: e.target.files[0] })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Estimated Read Time</label>
                    <input 
                      type="text" 
                      placeholder="5 min read"
                      className="glass-input"
                      value={newArticle.readTime}
                      onChange={(e) => setNewArticle({ ...newArticle, readTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Brief Headline Summary</label>
                  <input 
                    type="text" 
                    placeholder="Provide a 1-2 sentence preview hook..."
                    className="glass-input"
                    value={newArticle.summary}
                    onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Full Content Body</label>
                  <textarea 
                    rows="8"
                    placeholder="Write details of the post here. Double space paragraph shifts..."
                    className="glass-input textarea-dark"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn-champagne" disabled={isUploading}>
                  {isUploading ? 'Uploading & Publishing...' : 'Publish to News Hub'}
                </button>
              </form>

              {/* Current Articles list */}
              <div className="current-items-list">
                <h4>Published Articles</h4>
                <div className="articles-admin-list">
                  {articles.map((art) => (
                    <div key={art.id} className="article-admin-card glass-panel">
                      <div>
                        <h5>{art.title}</h5>
                        <span>{art.category} • {art.date}</span>
                      </div>
                      <button 
                        className="btn-glass btn-small delete-btn"
                        onClick={() => handleDeleteArticle(art.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAUFFEUR ROSTER */}
          {activeTab === 'drivers' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Chauffeur Roster & Live Tracking</h3>
                <p>Monitor real-time GPS telemetry of your active fleet and register new verified chauffeurs.</p>
              </div>

              {/* LIVE MAP TRACKING */}
              <div className="admin-form glass-panel" style={{ marginBottom: '40px', padding: 0, overflow: 'hidden' }}>
                <div style={{ height: '350px', width: '100%', backgroundColor: '#1a1a1d', position: 'relative' }}>
                  <MapContainer center={[6.5244, 3.3792]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    {drivers.filter(d => d.current_lat && d.current_lng).map((driver) => (
                      <Marker key={driver.id} position={[driver.current_lat, driver.current_lng]} icon={driverIcon}>
                        <Popup>
                          <strong style={{ color: '#000' }}>{driver.name}</strong><br/>
                          <span style={{ color: '#333' }}>Status: {driver.status}</span><br/>
                          <span style={{ color: '#333' }}>Phone: {driver.phone}</span>
                        </Popup>
                      </Marker>
                    ))}
                    <MapBoundsUpdater drivers={drivers} />
                  </MapContainer>
                </div>
              </div>

              <form onSubmit={handleAddDriver} className="admin-form glass-panel">
                <h4>Register New Chauffeur</h4>

                <div className="form-row">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Adeyemi Vance"
                      className="glass-input"
                      value={newDriver.name}
                      onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone Number (Login ID)</label>
                    <input 
                      type="text" 
                      placeholder="+234..."
                      className="glass-input"
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Assigned Tier</label>
                    <select 
                      className="glass-input select-dark"
                      value={newDriver.tier}
                      onChange={(e) => setNewDriver({ ...newDriver, tier: e.target.value })}
                    >
                      <option value="Executive">Executive Class Chauffeur</option>
                      <option value="Presidential">Presidential Detail</option>
                      <option value="Aviation">Aviation Access Cleared</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Initial Rating</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      className="glass-input"
                      value={newDriver.rating}
                      onChange={(e) => setNewDriver({ ...newDriver, rating: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-champagne">
                  Register Chauffeur
                </button>
              </form>

              {/* Current Drivers list */}
              <div className="current-items-list">
                <h4>Active Roster</h4>
                <div className="articles-admin-list">
                  {drivers.map((drv) => (
                    <div key={drv.id} className="article-admin-card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h5>{drv.name} <span style={{fontSize: '0.8rem', color: '#888'}}>({drv.status})</span></h5>
                        <span>{drv.tier} • ⭐ {drv.rating} • {drv.phone}</span>
                      </div>
                      <button 
                        className="btn-glass btn-small delete-btn"
                        onClick={() => handleDeleteDriver(drv.id)}
                      >
                        Revoke Access
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CORPORATE ACCOUNTS */}
          {activeTab === 'corporate' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Corporate Account Management Ledger</h3>
                <p>Review registered accounts, track active rides, audit ride histories, and manage discount rates.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '25px' }} className="corp-admin-grid">
                
                {/* Left Side: Master List */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h4>Registered Partners ({corpAccounts.length})</h4>
                  
                  {corpAccounts.length === 0 ? (
                    <p className="empty-msg">No corporate accounts registered.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
                      {corpAccounts.map((acc, index) => {
                        const isCurrentlyOnRide = bookings.some(
                          b => b.personal?.email?.trim().toLowerCase() === acc.email?.trim().toLowerCase() && 
                               b.status === 'Chauffeur Dispatched'
                        );
                        const isSelected = selectedCorpEmail === acc.email;
                        
                        return (
                          <div 
                            key={index} 
                            onClick={() => handleSelectCorp(acc)}
                            className="glass-panel-hover"
                            style={{ 
                              padding: '15px', 
                              borderRadius: '12px', 
                              cursor: 'pointer', 
                              border: isSelected ? '1px solid var(--color-champagne)' : '1px solid var(--glass-border)',
                              background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.01)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ margin: 0, color: isSelected ? 'var(--color-champagne)' : '#fff' }}>{acc.companyName}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)' }}>ID: {acc.corporateId || 'N/A'}</span>
                              </div>
                              {isCurrentlyOnRide && (
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  background: 'rgba(52, 211, 153, 0.1)', 
                                  color: '#34d399', 
                                  padding: '4px 8px', 
                                  borderRadius: '6px', 
                                  border: '1px solid rgba(52, 211, 153, 0.2)',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                                  ON RIDE
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{acc.email}</span>
                              <strong style={{ color: 'var(--color-champagne)' }}>{acc.discountRate}% Off</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Side: Account Details & Editing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {!selectedCorpEmail ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-silver)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                      <span style={{ fontSize: '3rem', marginBottom: '15px' }}>🏢</span>
                      <p>Select a corporate account from the ledger to view details, configure discounts, and audit ride history.</p>
                    </div>
                  ) : (() => {
                    const activeAcc = corpAccounts.find(a => a.email === selectedCorpEmail);
                    if (!activeAcc) return null;
                    const corpRides = bookings.filter(
                      b => b.personal?.email?.trim().toLowerCase() === selectedCorpEmail.trim().toLowerCase()
                    );
                    
                    return (
                      <>
                        <div className="glass-panel" style={{ padding: '25px' }}>
                          <h4 style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Account Matrix Editor</span>
                            <span className="gold-badge" style={{ fontSize: '0.75rem' }}>{editCorpId}</span>
                          </h4>
                          
                          <form onSubmit={handleSaveCorp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              <div className="input-group">
                                <label>Company Name</label>
                                <input 
                                  type="text" 
                                  className="glass-input" 
                                  value={editCorpName} 
                                  onChange={(e) => setEditCorpName(e.target.value)} 
                                  required 
                                />
                              </div>
                              <div className="input-group">
                                <label>Corporate ID</label>
                                <input 
                                  type="text" 
                                  className="glass-input" 
                                  value={editCorpId} 
                                  onChange={(e) => setEditCorpId(e.target.value)} 
                                  required 
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              <div className="input-group">
                                <label>Primary Contact Name</label>
                                <input 
                                  type="text" 
                                  className="glass-input" 
                                  value={editCorpContact} 
                                  onChange={(e) => setEditCorpContact(e.target.value)} 
                                  required 
                                />
                              </div>
                              <div className="input-group">
                                <label>Contact Phone</label>
                                <input 
                                  type="text" 
                                  className="glass-input" 
                                  value={editCorpPhone} 
                                  onChange={(e) => setEditCorpPhone(e.target.value)} 
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              <div className="input-group">
                                <label>Registered Partner Email</label>
                                <input 
                                  type="text" 
                                  className="glass-input" 
                                  value={selectedCorpEmail} 
                                  disabled 
                                  style={{ opacity: 0.6 }}
                                />
                              </div>
                              <div className="input-group">
                                <label>Account Passkey/Password</label>
                                <input 
                                  type="text" 
                                  className="glass-input" 
                                  value={activeAcc.password} 
                                  disabled 
                                  style={{ opacity: 0.6 }}
                                />
                              </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginTop: '-8px' }}>Email and Password are managed by the partner client.</span>

                            <div className="glass-panel" style={{ padding: '15px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                                  <input 
                                    type="checkbox" 
                                    checked={editCorpDiscountEnabled} 
                                    onChange={(e) => setEditCorpDiscountEnabled(e.target.checked)} 
                                  />
                                  <span>Offer Active Partner Discount</span>
                                </label>
                              </div>
                              
                              {editCorpDiscountEnabled && (
                                <div className="input-group" style={{ marginTop: '10px' }}>
                                  <label>Discount Percentage (%)</label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      className="glass-input" 
                                      style={{ width: '100px' }} 
                                      value={editCorpDiscount} 
                                      onChange={(e) => setEditCorpDiscount(Number(e.target.value))} 
                                    />
                                    <span>% Discount on all bookings</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <button type="submit" className="btn-champagne" style={{ width: '100%', marginTop: '10px' }}>
                              Save Partner Configuration
                            </button>
                          </form>
                        </div>

                        <div className="glass-panel" style={{ padding: '25px' }}>
                          <h4 style={{ marginBottom: '15px' }}>Partner Ride History ({corpRides.length})</h4>
                          
                          {corpRides.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-silver)' }}>No rides booked under this account yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '300px' }}>
                              {corpRides.map((ride, rIdx) => (
                                <div key={rIdx} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong>{ride.bookingRef} • {ride.vehicle}</strong>
                                    <span style={{ color: ride.status === 'Completed' ? '#34d399' : ride.status === 'Chauffeur Dispatched' ? 'var(--color-champagne)' : '#aaa', fontWeight: 'bold' }}>
                                      {ride.status}
                                    </span>
                                  </div>
                                  <div style={{ color: 'var(--color-silver)', fontSize: '0.8rem' }}>
                                    Pickup: {ride.logistics?.pickup}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.8rem' }}>
                                    <span>Date: {ride.logistics?.date} at {ride.logistics?.time}</span>
                                    <strong style={{ color: 'var(--color-champagne)' }}>₦{ride.totalCost?.toLocaleString()}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            </div>
          )}

          {/* PAYMENT SETTINGS */}
          {activeTab === 'payment' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Payment Gateway Configuration</h3>
                <p>Update the corporate bank account details that passengers will see during the booking authorization phase.</p>
              </div>
              
              <div className="admin-form glass-panel" style={{ maxWidth: '600px' }}>
                <div className="form-group-grid">
                  <div className="input-group full-width">
                    <label>Corporate Bank Name</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={paymentSettings.bankName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                    />
                  </div>
                  <div className="input-group full-width">
                    <label>Account Number</label>
                    <input
                      type="text"
                      className="glass-input font-display"
                      value={paymentSettings.accountNo}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, accountNo: e.target.value })}
                    />
                  </div>
                  <div className="input-group full-width">
                    <label>Registered Account Name</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={paymentSettings.accountName}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, accountName: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  className="btn-champagne" 
                  style={{ marginTop: '20px' }}
                  onClick={async () => {
                    await db.updatePaymentSettings(paymentSettings);
                    alert('Payment details updated successfully across the platform.');
                  }}
                >
                  Save Payment Details
                </button>
              </div>
            </div>
          )}

          {/* DATABASE SYNC */}
          {activeTab === 'database' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Database Synchronization</h3>
                <p>Force sync local state with Firebase cloud infrastructure.</p>
              </div>
              <button className="btn-champagne" onClick={refreshData}>
                Sync Now
              </button>
            </div>
          )}

          {/* PRICING SETTINGS */}
          {activeTab === 'pricing' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Pricing & Promos Engine</h3>
                <p>Manage global promotional discounts and generate custom promo codes for specific users.</p>
              </div>
              
              <div className="admin-form glass-panel" style={{ maxWidth: '700px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--color-champagne)' }}>Global Promo Status</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>If active, this discount applies to all bookings automatically unless overridden by a Promo Code or Vehicle-specific promo.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={pricingSettings.promoActive}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, promoActive: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                <div className="form-group-grid">
                  <div className="input-group full-width">
                    <label>Global Promo Discount (%)</label>
                    <input
                      type="number"
                      className="glass-input font-display"
                      value={pricingSettings.promoDiscountPercent}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, promoDiscountPercent: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <button 
                  className="btn-champagne" 
                  style={{ marginTop: '20px', width: '100%' }}
                  onClick={async () => {
                    await db.updatePricingSettings({
                      promoActive: pricingSettings.promoActive,
                      promoDiscountPercent: pricingSettings.promoDiscountPercent
                    });
                    alert('Global pricing engine updated successfully!');
                  }}
                >
                  Apply Global Promo
                </button>
              </div>

              {/* Promo Code Manager */}
              <div className="pane-header" style={{ marginTop: '40px' }}>
                <h3>Promo Code Manager</h3>
                <p>Create and distribute custom discount codes for specific users or marketing campaigns.</p>
              </div>

              <div className="admin-form glass-panel" style={{ maxWidth: '700px', marginBottom: '20px' }}>
                <div className="form-row">
                  <div className="input-group" style={{ flex: 2 }}>
                    <label>Promo Code</label>
                    <input
                      type="text"
                      className="glass-input font-display"
                      placeholder="e.g. VIP-JOHN-20"
                      value={newPromoCode.code}
                      onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      className="glass-input"
                      placeholder="20"
                      value={newPromoCode.discountPercent}
                      onChange={(e) => setNewPromoCode({ ...newPromoCode, discountPercent: e.target.value })}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Max Uses</label>
                    <input
                      type="number"
                      className="glass-input"
                      placeholder="1"
                      value={newPromoCode.maxUses}
                      onChange={(e) => setNewPromoCode({ ...newPromoCode, maxUses: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  className="btn-glass" 
                  style={{ marginTop: '10px' }}
                  onClick={async () => {
                    if (!newPromoCode.code || !newPromoCode.discountPercent) return alert('Enter code and discount.');
                    await db.addPromoCode({
                      code: newPromoCode.code,
                      discount_percent: Number(newPromoCode.discountPercent),
                      max_uses: Number(newPromoCode.maxUses),
                      current_uses: 0,
                      is_active: true
                    });
                    setNewPromoCode({ code: '', discountPercent: '', maxUses: 1 });
                    refreshData();
                  }}
                >
                  + Generate New Promo Code
                </button>
              </div>

              <div className="corp-accounts-table-wrapper" style={{ maxWidth: '900px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Uses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center' }}>No promo codes generated yet.</td></tr>
                    )}
                    {promoCodes.map(promo => (
                      <tr key={promo.id} style={{ opacity: promo.is_active ? 1 : 0.5 }}>
                        <td className="font-display font-gold-bold">{promo.code}</td>
                        <td>{promo.discount_percent}% Off</td>
                        <td>{promo.current_uses} / {promo.max_uses}</td>
                        <td>{promo.is_active ? 'Active' : 'Disabled'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              className="btn-glass btn-small"
                              onClick={() => db.updatePromoCode(promo.id, { is_active: !promo.is_active }).then(refreshData)}
                            >
                              Toggle
                            </button>
                            <button 
                              className="btn-glass btn-small delete-btn"
                              onClick={() => {
                                if(window.confirm('Delete this promo code?')) {
                                  db.deletePromoCode(promo.id).then(refreshData);
                                }
                              }}
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}
          {/* RIDE HISTORY VIEW */}
          {activeTab === 'history' && (
            <div className="admin-tab-pane animate-fade-in">
              <div className="pane-header">
                <h3>Ride History & Analytics Hub</h3>
                <p>Track lifetime telemetry, passenger logs, and revenue for every physical vehicle in the fleet.</p>
              </div>

              <div className="admin-form glass-panel" style={{ marginBottom: '20px' }}>
                <div className="input-group full-width">
                  <label>Search Fleet Ledger</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Search by License Plate, Vehicle Model, Driver Name, or Booking Ref..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="catalog-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {vehicles.filter(v => 
                  !historySearchQuery || 
                  v.name.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
                  (v.licensePlate || '').toLowerCase().includes(historySearchQuery.toLowerCase())
                ).map(vehicle => {
                  const vehicleTrips = bookings.filter(b => b.assigned_vehicle_id === vehicle.id || (b.vehicle === vehicle.name && !b.assigned_vehicle_id));
                  
                  const isExpanded = historySelectedVehicleId === vehicle.id;
                  
                  return (
                    <div key={vehicle.id} className="admin-booking-card glass-panel" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => setHistorySelectedVehicleId(isExpanded ? null : vehicle.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <img src={vehicle.images[0]} alt={vehicle.name} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                          <div>
                            <h4 style={{ margin: 0 }}>{vehicle.name}</h4>
                            <span style={{ color: 'var(--color-champagne)', fontSize: '0.85rem', fontWeight: 'bold' }}>{vehicle.licensePlate || 'Pending Registry'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Total Trips</span>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{vehicleTrips.length}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Total Revenue</span>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-champagne)' }}>₦{vehicleTrips.reduce((sum, b) => sum + (b.totalCost || 0), 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                          <h5 style={{ marginBottom: '15px', color: 'var(--color-silver)' }}>Historical Trip Ledger</h5>
                          {vehicleTrips.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-silver)' }}>No trips logged for this physical vehicle yet.</p>
                          ) : (
                            <div className="corp-accounts-table-wrapper">
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Ref Code</th>
                                    <th>Passenger</th>
                                    <th>Assigned Chauffeur</th>
                                    <th>Status</th>
                                    <th>Revenue</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vehicleTrips.map(trip => {
                                    const driver = drivers.find(d => d.id === trip.driver_id);
                                    return (
                                      <tr key={trip.bookingRef}>
                                        <td>{new Date(trip.dispatchTime || trip.createdAt || Date.now()).toLocaleDateString()}</td>
                                        <td><code>{trip.bookingRef}</code></td>
                                        <td>{trip.personal?.name}</td>
                                        <td>{driver?.name || 'N/A'}</td>
                                        <td>{trip.status}</td>
                                        <td className="font-gold-bold">₦{trip.totalCost?.toLocaleString()}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        .admin-grid {
          display: grid;
          grid-template-columns: 1fr 3.2fr;
          gap: 32px;
          margin-top: 40px;
        }

        @media (max-width: 900px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-tabs-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: fit-content;
        }

        @media (max-width: 900px) {
          .admin-tabs-panel {
            flex-direction: row;
            overflow-x: auto;
          }
        }

        .admin-tab-btn {
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
          .admin-tab-btn {
            white-space: nowrap;
          }
        }

        .admin-tab-btn:hover {
          color: var(--color-platinum);
          background: rgba(255, 255, 255, 0.03);
        }

        .admin-tab-btn.active {
          color: var(--color-champagne);
          background: rgba(212, 175, 55, 0.06);
          border-left: 2px solid var(--color-champagne);
          border-radius: 0 8px 8px 0;
        }

        @media (max-width: 900px) {
          .admin-tab-btn.active {
            border-left: none;
            border-bottom: 2px solid var(--color-champagne);
            border-radius: 8px 8px 0 0;
          }
        }

        .pane-header {
          margin-bottom: 30px;
        }

        .pane-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .pane-header p {
          font-size: 0.9rem;
          color: var(--color-silver);
        }

        /* Bookings list styles */
        .bookings-admin-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .admin-booking-card {
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .booking-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .b-ref {
          font-size: 0.8rem;
          color: var(--color-silver-dark);
          text-transform: uppercase;
        }

        .b-vehicle {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-platinum);
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 30px;
          text-transform: uppercase;
        }

        .status-pendingpayment {
          background: rgba(212, 175, 55, 0.1);
          color: var(--color-champagne);
          border: 1px solid rgba(212, 175, 55, 0.25);
        }

        .status-approvedpaid {
          background: rgba(52, 211, 153, 0.1);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.25);
        }

        .status-chauffeurdispatched {
          background: rgba(96, 165, 250, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.25);
        }

        .status-completed {
          background: rgba(156, 163, 175, 0.1);
          color: var(--color-silver);
          border: 1px solid var(--glass-border);
        }

        .booking-card-mid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 24px;
          font-size: 0.85rem;
          color: var(--color-silver);
          border-top: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
          padding: 16px 0;
        }

        @media (max-width: 600px) {
          .booking-card-mid {
            grid-template-columns: 1fr;
          }
        }

        .booking-card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          align-items: center;
        }

        .btn-small {
          padding: 8px 16px;
          font-size: 0.8rem;
          border-radius: 6px;
        }

        .completion-checked {
          font-size: 0.85rem;
          color: #34d399;
          font-weight: 600;
        }

        /* Forms styling */
        .admin-form {
          padding: 30px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 40px;
        }

        .admin-form h4 {
          font-size: 1.15rem;
          color: var(--color-champagne);
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 10px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .select-dark {
          background-color: #08080a;
          color: var(--color-platinum);
          cursor: pointer;
        }

        .input-third {
          grid-column: span 1;
        }

        .textarea-dark {
          background-color: transparent;
          color: var(--color-platinum);
          resize: vertical;
        }

        /* Current items list styling */
        .current-items-list h4 {
          font-size: 1.15rem;
          margin-bottom: 20px;
        }

        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 1100px) {
          .catalog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .catalog-grid {
            grid-template-columns: 1fr;
          }
        }

        .catalog-car-card {
          border-radius: 12px;
          overflow: hidden;
        }

        .catalog-car-card img {
          width: 100%;
          height: 140px;
          object-fit: cover;
        }

        .car-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .car-card-body h5 {
          font-size: 1rem;
          font-weight: 700;
        }

        .car-card-body p {
          font-size: 0.75rem;
          color: var(--color-silver);
        }

        .price-tag {
          font-size: 0.85rem;
          color: var(--color-champagne);
          font-weight: 600;
        }

        .delete-btn {
          margin-top: 8px;
          width: 100%;
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--color-red-dim);
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .articles-admin-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .article-admin-card {
          padding: 16px 24px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .article-admin-card h5 {
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .article-admin-card span {
          font-size: 0.75rem;
          color: var(--color-silver);
        }

        /* Corporate Accounts Table */
        .corp-accounts-table-wrapper {
          overflow-x: auto;
          border-radius: 16px;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }

        .admin-table th, .admin-table td {
          padding: 18px 24px;
          border-bottom: 1px solid var(--glass-border);
        }

        .admin-table th {
          background: rgba(0, 0, 0, 0.2);
          color: var(--color-silver);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .font-gold-bold {
          font-weight: bold;
          color: var(--color-champagne);
        }

        .admin-table code {
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .empty-msg {
          text-align: center;
          padding: 40px;
          color: var(--color-silver);
          font-style: italic;
        }
        .sync-card p {
          font-size: 0.9rem;
          color: var(--color-silver);
          line-height: 1.5;
        }

        .database-sync-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        @media (max-width: 768px) {
          .database-sync-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
