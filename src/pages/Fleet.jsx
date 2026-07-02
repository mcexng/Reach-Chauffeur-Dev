import React, { useState } from 'react';
import VideoPopup from '../components/VideoPopup';

export default function Fleet({ onOpenBooking, quickBookDetails, vehicles = [] }) {
  const [activeTier, setActiveTier] = useState('all');
  const [activeVideo, setActiveVideo] = useState({ isOpen: false, url: '', name: '' });
  const [imageIndexes, setImageIndexes] = useState({});

  const fleetData = vehicles;

  const newArrivals = [
    {
      id: 'rr-spectre',
      name: '2026 Rolls-Royce Spectre (All-Electric)',
      tierLabel: 'Presidential Limousine',
      desc: 'The defining statement in silent, all-electric ultra-luxury. Just delivered to our Lagos garage.',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'maybach-s-2026',
      name: '2026 Mercedes-Maybach S-Class',
      tierLabel: 'Presidential Limousine',
      desc: 'Configured with executive writing tables and champagne flute holsters.',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=300'
    }
  ];

  const handleNextImage = (carId, imagesLength, e) => {
    e.stopPropagation();
    setImageIndexes((prev) => ({
      ...prev,
      [carId]: ((prev[carId] || 0) + 1) % imagesLength
    }));
  };

  const handlePrevImage = (carId, imagesLength, e) => {
    e.stopPropagation();
    setImageIndexes((prev) => ({
      ...prev,
      [carId]: ((prev[carId] || 0) - 1 + imagesLength) % imagesLength
    }));
  };

  const filteredCars = activeTier === 'all' 
    ? fleetData 
    : fleetData.filter(car => car.tier === activeTier);

  return (
    <div className="fleet-page-wrapper section-container" id="fleet-selection-anchor">
      <div className="section-header animate-slide-up">
        <span className="gold-badge">Executive Garage</span>
        <h2>The Reach Fleets</h2>
        <p className="section-subtitle">
          From executive meeting setups to presidential motorcades, select the model that aligns with your criteria.
        </p>
      </div>

      {/* Main Grid: Left is Showcase, Right is New Arrivals */}
      <div className="fleet-layout-grid">
        <div className="fleet-main-content">
          {/* Filter Bar */}
          <div className="filter-bar glass-panel">
            {[
              { id: 'all', label: 'All Tiers' },
              { id: 'sedan', label: 'Executive Sedans' },
              { id: 'suv', label: 'Luxury SUVs' },
              { id: 'presidential', label: 'Presidential Limousines' }
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`filter-btn ${activeTier === tier.id ? 'active' : ''}`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* QuickBook Details Indicator */}
          {quickBookDetails.pickup && (
            <div className="quickbook-indicator glass-panel animate-fade-in">
              <span className="pulse-dot"></span>
              <p>
                Applying prefill: Pick-up at <strong>{quickBookDetails.pickup}</strong> on <strong>{quickBookDetails.date}</strong>. Select a vehicle to finalize logistics.
              </p>
            </div>
          )}

          {/* Fleet Grid */}
          <div className="fleet-matrix-grid">
            {filteredCars.map((car) => {
              const currentImgIdx = imageIndexes[car.id] || 0;
              return (
                <div key={car.id} className="fleet-card glass-panel glass-panel-hover">
                  {/* Slider Wrapper */}
                  <div className="card-media-slider">
                    <img 
                      src={car.images[currentImgIdx]} 
                      alt={car.name} 
                      className="slider-image animate-fade-in"
                      key={currentImgIdx}
                    />
                    
                    {/* Navigation Arrows */}
                    <button 
                      className="slider-arrow prev" 
                      onClick={(e) => handlePrevImage(car.id, car.images.length, e)}
                    >
                      ‹
                    </button>
                    <button 
                      className="slider-arrow next" 
                      onClick={(e) => handleNextImage(car.id, car.images.length, e)}
                    >
                      ›
                    </button>

                    {/* Dots indicator */}
                    <div className="slider-dots">
                      {car.images.map((_, idx) => (
                        <span 
                          key={idx} 
                          className={`slider-dot ${idx === currentImgIdx ? 'active' : ''}`}
                        />
                      ))}
                    </div>

                    <button 
                      className="btn-glass play-tour-btn"
                      onClick={() => setActiveVideo({ isOpen: true, url: car.videoUrl, name: car.name })}
                    >
                      ▶ Video Tour
                    </button>

                    {car.isNew && (
                      <span className="card-badge-new">Just Added</span>
                    )}
                  </div>

                  {/* Vehicle Info */}
                  <div className="card-info">
                    <span className="card-tier">{car.tierLabel}</span>
                    <h3>{car.name}</h3>

                    {/* Persistent Chauffeur Guarantee */}
                    <div className="chauffeur-guarantee">
                      <span className="guarantee-icon">🛡</span> Includes Professional Executive Chauffeur
                    </div>

                    {/* Pricing */}
                    <div className="card-pricing">
                      <div className="price-label">Daily Standard Rate</div>
                      <div className="price-values">
                        <span className="price-standard">₦{car.standardPrice.toLocaleString()}</span>
                        <span className="price-promo gradient-text-gold">₦{car.basePrice.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Specs Reveal Overlay (revealed via CSS on hover) */}
                    <div className="card-specs-overlay">
                      <h4>Technical & Luxury Specs</h4>
                      <ul>
                        <li><strong>Capacity:</strong> {car.specs.passengers} Passengers / {car.specs.luggage} bags</li>
                        <li><strong>Wi-Fi:</strong> {car.specs.wifi}</li>
                        <li><strong>Amenities:</strong> {car.specs.refreshments}</li>
                        <li><strong>Privacy:</strong> {car.specs.privacy}</li>
                      </ul>
                    </div>

                    <button 
                      className="btn-champagne card-reserve-btn"
                      onClick={() => onOpenBooking(car)}
                    >
                      Reserve Vehicle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel: New Arrivals */}
        <aside className="new-arrivals-column glass-panel">
          <div className="column-header">
            <span className="gold-badge">Fleet Updates</span>
            <h3>New Deliveries</h3>
            <p>Chronologically tracked fleet expansions recently deployed to our garage.</p>
          </div>

          <div className="new-arrivals-list">
            {newArrivals.map((arrival) => (
              <div key={arrival.id} className="arrival-item glass-panel">
                <img src={arrival.image} alt={arrival.name} />
                <div className="arrival-details">
                  <span className="arrival-tag">JUST ADDED</span>
                  <h4>{arrival.name}</h4>
                  <p>{arrival.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="garage-manifesto glass-panel">
            <h4>Pristine Standards</h4>
            <p>Each vehicle undergoes a detailed 120-point diagnostic check and absolute steam disinfection before and after dispatch operations.</p>
          </div>
        </aside>
      </div>

      {/* Video Popup Renderer */}
      <VideoPopup 
        isOpen={activeVideo.isOpen} 
        onClose={() => setActiveVideo({ isOpen: false, url: '', name: '' })}
        videoUrl={activeVideo.url}
        vehicleName={activeVideo.name}
      />

      <style>{`
        .fleet-layout-grid {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 40px;
          margin-top: 40px;
        }

        @media (max-width: 1100px) {
          .fleet-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .fleet-main-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .filter-bar {
          display: flex;
          gap: 12px;
          padding: 12px 24px;
          border-radius: 50px;
          overflow-x: auto;
          white-space: nowrap;
        }

        .filter-btn {
          background: none;
          border: none;
          color: var(--color-silver);
          padding: 10px 20px;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          border-radius: 30px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .filter-btn:hover {
          color: var(--color-platinum);
          background: rgba(255, 255, 255, 0.03);
        }

        .filter-btn.active {
          color: #08080A;
          background: var(--color-champagne);
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
        }

        .quickbook-indicator {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          border-color: rgba(212, 175, 55, 0.2);
          background: rgba(212, 175, 55, 0.03);
          border-radius: 12px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: var(--color-champagne);
          border-radius: 50%;
          display: inline-block;
          animation: pulseGold 2s infinite;
        }

        .quickbook-indicator p {
          font-size: 0.9rem;
          color: var(--color-silver);
        }

        .quickbook-indicator strong {
          color: var(--color-champagne-light);
        }

        /* Fleet Matrix Grid */
        .fleet-matrix-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
        }

        @media (max-width: 768px) {
          .fleet-matrix-grid {
            grid-template-columns: 1fr;
          }
        }

        .fleet-card {
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .card-media-slider {
          position: relative;
          width: 100%;
          height: 240px;
          overflow: hidden;
          background: #000;
        }

        .slider-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .fleet-card:hover .slider-image {
          transform: scale(1.04);
        }

        .slider-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(8, 8, 10, 0.5);
          border: 1px solid var(--glass-border);
          color: #fff;
          font-size: 1.5rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          transition: var(--transition-smooth);
          z-index: 10;
        }

        .slider-arrow:hover {
          background: var(--color-champagne);
          color: #08080A;
        }

        .slider-arrow.prev { left: 12px; }
        .slider-arrow.next { right: 12px; }

        .slider-dots {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 10;
        }

        .slider-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transition: var(--transition-smooth);
        }

        .slider-dot.active {
          background: var(--color-champagne);
          width: 18px;
          border-radius: 10px;
        }

        .play-tour-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 8px 14px;
          font-size: 0.75rem;
          border-radius: 30px;
          z-index: 10;
        }

        .card-badge-new {
          position: absolute;
          top: 16px;
          left: 16px;
          background: var(--color-champagne);
          color: #08080A;
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          z-index: 10;
        }

        .card-info {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          flex-grow: 1;
        }

        .card-tier {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-silver);
          font-weight: 500;
        }

        .card-info h3 {
          font-size: 1.4rem;
          font-weight: 700;
        }

        .chauffeur-guarantee {
          font-size: 0.8rem;
          color: var(--color-champagne-light);
          background: rgba(212, 175, 55, 0.04);
          border: 1px dashed rgba(212, 175, 55, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .card-pricing {
          border-top: 1px solid var(--glass-border);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label {
          font-size: 0.8rem;
          color: var(--color-silver);
        }

        .price-values {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .price-standard {
          color: var(--color-silver-dark);
          text-decoration: line-through;
          font-size: 0.9rem;
        }

        .price-promo {
          font-size: 1.3rem;
          font-weight: 800;
        }

        /* Hover Specs Overlay */
        .card-specs-overlay {
          position: absolute;
          bottom: 76px;
          left: 0;
          right: 0;
          background: rgba(8, 8, 10, 0.95);
          backdrop-filter: blur(10px);
          padding: 24px 30px;
          transform: translateY(100%);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-top: 1px solid var(--glass-border);
          pointer-events: none;
        }

        .fleet-card:hover .card-specs-overlay {
          transform: translateY(0);
          opacity: 1;
        }

        .card-specs-overlay h4 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-champagne);
          margin-bottom: 12px;
        }

        .card-specs-overlay ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-specs-overlay li {
          font-size: 0.85rem;
          color: var(--color-silver);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding-bottom: 6px;
        }

        .card-specs-overlay li strong {
          color: var(--color-platinum);
        }

        .card-reserve-btn {
          width: 100%;
          z-index: 2;
        }

        /* New Arrivals Column */
        .new-arrivals-column {
          padding: 30px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 30px;
          height: fit-content;
          border-color: rgba(212, 175, 55, 0.15); /* Special border */
        }

        .column-header h3 {
          font-size: 1.3rem;
          margin-top: 12px;
          margin-bottom: 6px;
        }

        .column-header p {
          font-size: 0.8rem;
          color: var(--color-silver);
          line-height: 1.4;
        }

        .new-arrivals-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .arrival-item {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          overflow: hidden;
        }

        .arrival-item img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
        }

        .arrival-tag {
          font-size: 0.65rem;
          color: var(--color-champagne);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .arrival-details h4 {
          font-size: 0.95rem;
          margin: 4px 0;
          color: var(--color-platinum);
        }

        .arrival-details p {
          font-size: 0.75rem;
          color: var(--color-silver);
          line-height: 1.4;
        }

        .garage-manifesto {
          padding: 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(255, 255, 255, 0.01);
        }

        .garage-manifesto h4 {
          font-size: 0.9rem;
          color: var(--color-champagne);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .garage-manifesto p {
          font-size: 0.75rem;
          color: var(--color-silver);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
