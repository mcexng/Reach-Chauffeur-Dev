import React from 'react';

export default function VideoPopup({ isOpen, onClose, videoUrl, vehicleName }) {
  if (!isOpen) return null;

  return (
    <div className="video-popup-overlay" onClick={onClose}>
      <div className="video-popup-container glass-panel animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="video-popup-header">
          <h3>{vehicleName} — 4K Experience Tour</h3>
          <button className="video-close-btn" onClick={onClose} aria-label="Close Video">×</button>
        </div>
        <div className="video-player-wrapper">
          {/* Using a high-quality free video loop representing luxury driving */}
          <video 
            src={videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-luxury-black-car-driving-through-city-at-night-42171-large.mp4"}
            autoPlay 
            loop 
            muted 
            controls
            className="tour-video"
          />
        </div>
        <div className="video-popup-footer">
          <span className="gold-badge">4K HDR</span>
          <p>Experience the cabin acoustics, active rear steering, and bespoke ambient lighting setups.</p>
        </div>
      </div>

      <style>{`
        .video-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 8, 10, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn 0.4s ease forwards;
        }

        .video-popup-container {
          width: 100%;
          max-width: 800px;
          border-radius: 20px;
          overflow: hidden;
          border-color: rgba(255, 255, 255, 0.15);
          display: flex;
          flex-direction: column;
        }

        .video-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--glass-border);
        }

        .video-popup-header h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--color-platinum);
        }

        .video-close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--color-silver);
          font-size: 1.8rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          transition: var(--transition-smooth);
          line-height: 1;
        }

        .video-close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.4);
          color: var(--color-red-dim);
          transform: rotate(90deg);
        }

        .video-player-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          background: #000;
        }

        .tour-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-popup-footer {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-top: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.3);
        }

        .video-popup-footer p {
          color: var(--color-silver);
          font-size: 0.85rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
