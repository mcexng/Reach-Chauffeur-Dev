import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';

const AddressAutocomplete = ({ label, placeholder, value, onChange, className }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    // Only update internal query if it's completely different from value 
    // to prevent cursor jumping when parent re-renders.
    if (value && value !== query && !isFocused) {
      setQuery(value);
    }
  }, [value, isFocused]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    // Always update parent form state so manual entry works
    onChange(val);

    if (typingTimeout) clearTimeout(typingTimeout);
    
    setTypingTimeout(setTimeout(async () => {
      if (val.length > 2) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`, {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const data = await res.json();
          setSuggestions(data);
        } catch (err) {
          console.error('Nominatim fetch error:', err);
        }
      } else {
        setSuggestions([]);
      }
    }, 800)); // 800ms debounce
  };

  return (
    <div className={`input-group autocomplete-wrapper ${className || ''}`} style={{ position: 'relative', width: '100%' }}>
      {label && <label>{label}</label>}
      <input
        type="text"
        placeholder={placeholder}
        className="glass-input"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 250)}
        required
      />
      {suggestions.length > 0 && isFocused && (
        <div className="autocomplete-suggestions" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#111113', border: '1px solid var(--glass-border)',
          zIndex: 9999, borderRadius: '8px', marginTop: '5px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
        }}>
          {suggestions.map((s, idx) => (
            <div 
              key={idx} 
              className="suggestion-item" 
              style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              onClick={() => {
                setQuery(s.display_name);
                onChange(s.display_name);
                setSuggestions([]);
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#eee', display: 'block', lineHeight: '1.4' }}>{s.display_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function BookingEngine({ isOpen, onClose, selectedVehicle: initialVehicle, prefillDetails, onBookingSuccess }) {
  const [activeVehicle, setActiveVehicle] = useState(initialVehicle);
  const [vehicles, setVehicles] = useState([]);

  const selectedVehicle = activeVehicle || initialVehicle;

  const [step, setStep] = useState(1);
  const [personal, setPersonal] = useState({ name: '', phone: '', email: '' });
  const [logistics, setLogistics] = useState({
    pickup: (prefillDetails && prefillDetails.pickup) ? prefillDetails.pickup : '',
    date: (prefillDetails && prefillDetails.date) ? prefillDetails.date : '',
    time: '12:00',
    stops: [''] // starts with no stops, can add multiple
  });
  const [bookingType, setBookingType] = useState('12hr');
  const [days, setDays] = useState(2); // for multi-day bookings
  const [customRequest, setCustomRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [pricingSettings, setPricingSettings] = useState(null);
  
  // Promo states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    db.getPricingSettings().then(setPricingSettings);
    db.getVehicles().then(list => setVehicles(list.filter(v => v.isActive)));
  }, []);

  useEffect(() => {
    if (initialVehicle) {
      setActiveVehicle(initialVehicle);
    }
  }, [initialVehicle]);

  // Reset steps on open
  useEffect(() => {
    if (isOpen) {
      const corpData = localStorage.getItem('current_corporate_partner');
      if (corpData) {
        const currentFirm = JSON.parse(corpData);
        setPersonal({
          name: currentFirm.companyName || currentFirm.contactName || '',
          phone: currentFirm.phone || '',
          email: currentFirm.email || ''
        });
        setStep(2); // Auto take them to next which is itinerary
      } else {
        setStep(1);
        setPersonal({ name: '', phone: '', email: '' });
      }
      setLogistics(prev => ({
        ...prev,
        pickup: (prefillDetails && prefillDetails.pickup) ? prefillDetails.pickup : '',
        date: (prefillDetails && prefillDetails.date) ? prefillDetails.date : ''
      }));
    }
  }, [isOpen, prefillDetails, selectedVehicle]);

  // Pricing Engine Calculations
  const calculateRates = () => {
    if (!selectedVehicle) {
      return { standard: 0, promo: 0, savings: 0, activeDiscountPercent: 0, discountLabel: '' };
    }
    let baseRate = 0;
    
    switch (bookingType) {
      case 'airport': baseRate = Number(selectedVehicle.priceAirport || selectedVehicle.basePrice); break;
      case '12hr': baseRate = Number(selectedVehicle.price12hr || selectedVehicle.basePrice); break;
      case '24hr': baseRate = Number(selectedVehicle.price24hr || selectedVehicle.basePrice); break;
      case 'multiday': baseRate = Number(selectedVehicle.price24hr || selectedVehicle.basePrice) * days; break;
      case 'other': baseRate = Number(selectedVehicle.priceHourly || selectedVehicle.basePrice); break;
      default: baseRate = Number(selectedVehicle.basePrice); break;
    }

    // Stack Discounts: User Promo Code stacks with existing Vehicle/Global/Corporate Promos
    let activeDiscountPercent = 0;
    let appliedPromos = [];

    // 1. Check for logged-in Corporate Account discount
    const corpData = localStorage.getItem('current_corporate_partner');
    if (corpData) {
      const currentFirm = JSON.parse(corpData);
      if (currentFirm.discountRate > 0) {
        activeDiscountPercent += Number(currentFirm.discountRate) || 0;
        appliedPromos.push(`Corporate (${currentFirm.discountRate}%)`);
      }
    }

    // 2. Check for vehicle promo or global promo (vehicle promo overrides global promo if active)
    if (selectedVehicle.promoActive) {
      activeDiscountPercent += Number(selectedVehicle.promoDiscount) || 0;
      appliedPromos.push(`Vehicle (${selectedVehicle.promoDiscount}%)`);
    } else if (pricingSettings?.promoActive) {
      activeDiscountPercent += Number(pricingSettings.promoDiscountPercent) || 0;
      appliedPromos.push(`Global (${pricingSettings.promoDiscountPercent}%)`);
    }

    // 3. User promo code stacks on top
    if (appliedPromo) {
      activeDiscountPercent += Number(appliedPromo.discount_percent) || 0;
      appliedPromos.push(`Code (${appliedPromo.discount_percent}%)`);
    }

    if (activeDiscountPercent > 100) activeDiscountPercent = 100;

    const promoRate = baseRate * (1 - (activeDiscountPercent / 100));

    return {
      standard: Math.round(baseRate),
      promo: Math.round(promoRate),
      savings: Math.round(baseRate - promoRate),
      activeDiscountPercent,
      discountLabel: appliedPromos.join(' + ')
    };
  };

  const handleApplyPromo = async () => {
    setPromoError('');
    if (!promoCodeInput.trim()) return;
    
    const codes = await db.getPromoCodes();
    const match = codes.find(c => c.code === promoCodeInput.trim().toUpperCase() && c.is_active);
    
    if (match) {
      if (match.max_uses > 0 && match.current_uses >= match.max_uses) {
        setPromoError('This promo code has reached its maximum usage limit.');
        setAppliedPromo(null);
      } else {
        setAppliedPromo(match);
        setPromoCodeInput('');
      }
    } else {
      setPromoError('Invalid or expired promo code.');
      setAppliedPromo(null);
    }
  };

  const rates = calculateRates();

  const handleAddStop = () => {
    setLogistics(prev => ({
      ...prev,
      stops: [...prev.stops, '']
    }));
  };

  const handleStopChange = (index, value) => {
    const newStops = [...logistics.stops];
    newStops[index] = value;
    setLogistics(prev => ({
      ...prev,
      stops: newStops
    }));
  };

  const handleRemoveStop = (index) => {
    const newStops = logistics.stops.filter((_, idx) => idx !== index);
    setLogistics(prev => ({
      ...prev,
      stops: newStops
    }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    setLoading(true);
    
    const stages = [
      'Authenticating cryptographic payment gateway...',
      'Running background telemetry checks on vehicle...',
      'Assigning closest certified executive chauffeur...',
      'Mapping navigation routing protocols...',
      'Securing itinerary confirmation dispatch...'
    ];

    let currentStage = 0;
    setLoadingStage(stages[0]);

    const interval = setInterval(async () => {
      currentStage += 1;
      if (currentStage < stages.length) {
        setLoadingStage(stages[currentStage]);
      } else {
        clearInterval(interval);
        setLoading(false);
        // Generate a random booking reference code
        const bookingRef = 'RC-' + Math.floor(10000 + Math.random() * 90000);
        const bookingRecord = {
          bookingRef,
          vehicle: selectedVehicle.name,
          personal,
          logistics: { ...logistics, days: bookingType === 'multiday' ? days : undefined },
          bookingType,
          totalCost: rates.promo,
          status: 'Pending Admin Approval'
        };
        await db.addBooking(bookingRecord);
        
        // Increment promo code usage if applicable
        if (appliedPromo) {
          await db.updatePromoCode(appliedPromo.id, { current_uses: appliedPromo.current_uses + 1 });
        }
        
        onBookingSuccess(bookingRecord);
      }
    }, 1200);
  };

  if (!isOpen || !initialVehicle || !selectedVehicle) return null;

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-container glass-panel animate-slide-up">
        {loading ? (
          <div className="dispatch-loader">
            <div className="loader-spinner"></div>
            <h3>Dispatching Executive Fleet</h3>
            <p className="loading-status-text">{loadingStage}</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="modal-header">
              <div className="vehicle-mini-details">
                <span className="gold-badge">{selectedVehicle.tierLabel}</span>
                <h3>Book {selectedVehicle.name}</h3>
              </div>
              <button className="modal-close-btn" onClick={onClose}>×</button>
            </div>

            {/* Stepper Steps Tracker */}
            <div className="stepper-indicator">
              {[
                { s: 1, label: 'Identity' },
                { s: 2, label: 'Itinerary' },
                { s: 3, label: 'Rates & Confirm' }
              ].map((item) => (
                <div key={item.s} className={`step-dot-wrapper ${step === item.s ? 'active' : ''} ${step > item.s ? 'completed' : ''}`}>
                  <span className="step-dot">{step > item.s ? '✓' : item.s}</span>
                  <span className="step-label">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Form Steps */}
            <div className="modal-form-content">
              {/* STEP 1: Personal Data */}
              {step === 1 && (
                <div className="form-step-section animate-fade-in">
                  <div className="form-group-grid">
                    <div className="input-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="Johnathan Sterling"
                        className="glass-input"
                        value={personal.name}
                        onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="+234 80 0000 0000"
                        className="glass-input"
                        value={personal.phone}
                        onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-group full-width">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="j.sterling@sterlingholdings.com"
                        className="glass-input"
                        value={personal.email}
                        onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="btn-glass" onClick={onClose}>Cancel</button>
                    <button 
                      className="btn-champagne" 
                      onClick={handleNext}
                      disabled={!personal.name || !personal.phone || !personal.email}
                    >
                      Next: Logistics
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Logistics / Itinerary */}
              {step === 2 && (
                <div className="form-step-section animate-fade-in">
                  <div className="form-group-grid">
                    {vehicles.length > 0 && (
                      <div className="input-group full-width">
                        <label>Preferred Vehicle Model</label>
                        <select
                          className="glass-input"
                          style={{ background: 'var(--color-obsidian-light)', color: '#fff', border: '1px solid var(--glass-border)' }}
                          value={activeVehicle?.id || ''}
                          onChange={(e) => {
                            const found = vehicles.find(v => v.id === e.target.value);
                            if (found) {
                              setActiveVehicle(found);
                            }
                          }}
                        >
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id} style={{ background: '#0a0a0a', color: '#fff' }}>
                              {v.name} ({v.tierLabel}) — ₦{Number(v.basePrice).toLocaleString()} Base
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="input-group full-width">
                      <AddressAutocomplete
                        label="Pick-up Location"
                        placeholder="Airport private terminal, hotel name, or street address"
                        value={logistics.pickup}
                        onChange={(val) => setLogistics({ ...logistics, pickup: val })}
                      />
                    </div>

                    {/* Intermediate Destination Stops */}
                    <div className="input-group full-width destination-stops-group">
                      <label>Destination Stops</label>
                      {logistics.stops.map((stop, idx) => (
                        <div key={idx} className="stop-input-wrapper">
                          <span className="stop-number-badge">Stop {idx + 1}</span>
                          <AddressAutocomplete
                            placeholder="Add stop address..."
                            value={stop}
                            onChange={(val) => handleStopChange(idx, val)}
                            className="stop-input"
                          />
                          {logistics.stops.length > 1 && (
                            <button 
                              type="button" 
                              className="remove-stop-btn"
                              onClick={() => handleRemoveStop(idx)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        type="button" 
                        className="btn-glass add-stop-btn" 
                        onClick={handleAddStop}
                      >
                        + Add Stop
                      </button>
                    </div>

                    <div className="input-group">
                      <label>Pick-up Date</label>
                      <input
                        type="date"
                        className="glass-input"
                        value={logistics.date}
                        onChange={(e) => setLogistics({ ...logistics, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label>Pick-up Time</label>
                      <input
                        type="time"
                        className="glass-input"
                        value={logistics.time}
                        onChange={(e) => setLogistics({ ...logistics, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-glass" onClick={handlePrev}>Back</button>
                    <button 
                      className="btn-champagne" 
                      onClick={handleNext}
                      disabled={!logistics.pickup || !logistics.date || !logistics.time}
                    >
                      Next: Calculator
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Rates & Confirm */}
              {step === 3 && (
                <div className="form-step-section animate-fade-in">
                  <div className="form-group-grid">
                    <div className="input-group full-width">
                      <label>Select Duration Booking Type</label>
                      <select 
                        className="glass-input select-dark"
                        value={bookingType}
                        onChange={(e) => setBookingType(e.target.value)}
                      >
                        <option value="12hr">12-Hour Daily Care</option>
                        <option value="airport">Airport Pick-up / Drop-off (Short Term)</option>
                        <option value="24hr">24-Hour Full Day Care</option>
                        <option value="multiday">2 to 7 Days Booking (Tiered Discount)</option>
                        <option value="other">Others / Custom Event Charter</option>
                      </select>
                    </div>

                    {bookingType === 'multiday' && (
                      <div className="input-group full-width animate-fade-in">
                        <label>Select Number of Days ({days} Days Selected)</label>
                        <input
                          type="range"
                          min="2"
                          max="7"
                          className="slider-days-picker"
                          value={days}
                          onChange={(e) => setDays(parseInt(e.target.value))}
                        />
                        <div className="days-range-labels">
                          <span>2 Days</span>
                          <span>4 Days</span>
                          <span>7 Days</span>
                        </div>
                      </div>
                    )}

                    {bookingType === 'other' && (
                      <div className="input-group full-width animate-fade-in">
                        <label>Specify Custom Duration or Event Needs</label>
                        <textarea
                          placeholder="e.g. 5 hours corporate event tour, presidential motorcade coordination..."
                          className="glass-input text-area"
                          rows="3"
                          value={customRequest}
                          onChange={(e) => setCustomRequest(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="input-group full-width">
                      <label>Promo Code (Optional)</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="Enter code..."
                          className="glass-input font-display"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          disabled={!!appliedPromo}
                        />
                        <button 
                          type="button" 
                          className="btn-glass"
                          onClick={appliedPromo ? () => setAppliedPromo(null) : handleApplyPromo}
                        >
                          {appliedPromo ? 'Remove' : 'Apply'}
                        </button>
                      </div>
                      {promoError && <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px' }}>{promoError}</span>}
                      {appliedPromo && <span style={{ color: 'var(--color-champagne)', fontSize: '0.8rem', marginTop: '5px' }}>{appliedPromo.discount_percent}% Promo Code Applied!</span>}
                    </div>

                    {/* Dynamic Pricing Tally */}
                    <div className="invoice-tally-box glass-panel full-width">
                      <h4>Booking Invoice Tally</h4>
                      <div className="invoice-row">
                        <span>Vehicle Selection</span>
                        <span>{selectedVehicle.name}</span>
                      </div>
                      <div className="invoice-row">
                        <span>Rate Tariff Base</span>
                        <span>{bookingType === 'multiday' ? `${days} Days Multiplier` : bookingType.toUpperCase()}</span>
                      </div>
                      <div className="invoice-row divider"></div>
                      <div className="invoice-row">
                        <span>Standard Rate</span>
                        <span className={rates.activeDiscountPercent > 0 ? "std-strike" : ""}>₦{rates.standard.toLocaleString()} NGN</span>
                      </div>
                      
                      {rates.activeDiscountPercent > 0 && (
                        <div className="invoice-row" style={{ color: 'var(--color-champagne)', fontSize: '0.9rem' }}>
                          <span>{rates.discountLabel} Applied</span>
                          <span>- ₦{rates.savings.toLocaleString()} NGN</span>
                        </div>
                      )}

                      <div className="invoice-row final-row">
                        <span>Total Corporate Rate</span>
                        <span className="total-promo gradient-text-gold">₦{rates.promo.toLocaleString()} NGN</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleDispatch} className="modal-actions full-width-action">
                    <button type="button" className="btn-glass" onClick={handlePrev}>Back</button>
                    <button type="submit" className="btn-champagne secure-dispatch-btn">
                      Secure Booking & Dispatch Chauffeur
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .booking-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 8, 10, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1500;
          padding: 24px;
        }

        .booking-modal-container {
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 24px;
          border-color: rgba(255, 255, 255, 0.12);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 30px;
          border-bottom: 1px solid var(--glass-border);
        }

        .vehicle-mini-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .vehicle-mini-details h3 {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: var(--color-silver);
          font-size: 2rem;
          cursor: pointer;
          transition: var(--transition-smooth);
          line-height: 1;
        }

        .modal-close-btn:hover {
          color: var(--color-champagne);
        }

        /* Stepper Indicators */
        .stepper-indicator {
          display: flex;
          justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.15);
        }

        .step-dot-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.4;
          transition: var(--transition-smooth);
        }

        .step-dot-wrapper.active {
          opacity: 1;
        }

        .step-dot-wrapper.completed {
          opacity: 0.8;
        }

        .step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid var(--color-silver);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .step-dot-wrapper.active .step-dot {
          border-color: var(--color-champagne);
          background: var(--color-champagne);
          color: #08080A;
          box-shadow: 0 0 10px var(--color-gold-glow);
        }

        .step-dot-wrapper.completed .step-dot {
          border-color: var(--color-champagne);
          background: rgba(212, 175, 55, 0.1);
          color: var(--color-champagne);
        }

        .step-label {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Forms */
        .modal-form-content {
          padding: 30px;
        }

        .form-group-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .full-width {
          grid-column: span 2;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 30px;
        }

        .full-width-action {
          grid-column: span 2;
          display: flex;
          justify-content: space-between;
          width: 100%;
        }

        .secure-dispatch-btn {
          flex-grow: 1;
          max-width: 70%;
        }

        /* Stops */
        .stop-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .stop-number-badge {
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 10px;
          border-radius: 6px;
          color: var(--color-silver);
          border: 1px solid var(--glass-border);
          min-width: 65px;
          text-align: center;
        }

        .stop-input {
          flex-grow: 1;
        }

        .remove-stop-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-red-dim);
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .remove-stop-btn:hover {
          background: var(--color-red-dim);
          color: #fff;
        }

        .add-stop-btn {
          padding: 8px 16px;
          font-size: 0.8rem;
          width: fit-content;
          align-self: flex-start;
        }

        .dropdown-select {
          width: 100%;
          cursor: pointer;
        }

        .dropdown-select option {
          background: var(--color-obsidian-light);
          color: var(--color-platinum);
        }

        .slider-days-picker {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          cursor: pointer;
          margin: 15px 0;
        }

        .slider-days-picker::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-champagne);
          cursor: pointer;
          box-shadow: 0 0 10px var(--color-gold-glow);
          transition: var(--transition-smooth);
        }

        .slider-days-picker::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .days-range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--color-silver);
        }

        .text-area {
          resize: none;
          width: 100%;
        }

        /* Invoice */
        .invoice-tally-box {
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(0, 0, 0, 0.25);
        }

        .invoice-tally-box h4 {
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-champagne);
          margin-bottom: 8px;
        }

        .invoice-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--color-silver);
        }

        .invoice-row.divider {
          border-bottom: 1px solid var(--glass-border);
          margin: 8px 0;
        }

        .invoice-row.final-row {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-platinum);
          align-items: center;
        }

        .std-strike {
          text-decoration: line-through;
          color: var(--color-silver-dark);
        }

        .total-promo {
          font-size: 1.3rem;
          font-weight: 800;
        }

        /* Loader */
        .dispatch-loader {
          padding: 60px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .loader-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(212, 175, 55, 0.1);
          border-top-color: var(--color-champagne);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dispatch-loader h3 {
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .loading-status-text {
          font-size: 0.9rem;
          color: var(--color-silver);
          height: 20px;
        }

        .progress-bar-container {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 10px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-champagne-dark), var(--color-champagne));
          width: 0%;
          animation: loadProgress 6s forwards ease-in-out;
        }

        @keyframes loadProgress {
          to { width: 100%; }
        }

        /* Responsive Design */
        @media (max-width: 900px) {
          .booking-engine-grid {
            grid-template-columns: 1fr;
            height: auto;
            max-height: 90vh;
            overflow-y: auto;
          }
          .form-group-grid {
            grid-template-columns: 1fr;
          }
          .full-width {
            grid-column: span 1;
          }
          .summary-img {
            height: 120px;
          }
        }

        @media (max-width: 600px) {
          .stepper-indicator {
            padding: 15px 20px;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
          }
          .modal-form-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
