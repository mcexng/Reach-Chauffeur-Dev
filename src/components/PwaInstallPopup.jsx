import React, { useState, useEffect } from 'react';

export default function PwaInstallPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if user has dismissed it recently (7 days)
    const dismissedAt = localStorage.getItem('pwaPromptDismissed');
    if (dismissedAt && (Date.now() - parseInt(dismissedAt)) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect mobile and OS
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua);
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    
    if (isMobile) {
      setIsIOS(isIOSDevice);
      // Wait a few seconds before showing to not interrupt immediate loading
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Optionally show the popup here if not already handled
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("To install on iOS: Tap the 'Share' icon at the bottom of Safari, then select 'Add to Home Screen'.");
    } else if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPopup(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for Android browsers without beforeinstallprompt support
      alert("To install the app, tap the menu button (3 dots) and select 'Install app' or 'Add to Home screen'.");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <div className="pwa-install-popup animate-slide-up">
      <button className="pwa-close-btn" onClick={handleDismiss}>&times;</button>
      <div className="pwa-content">
        <img src="/reach-logo.png" alt="Reach Logo" className="pwa-logo" />
        <div className="pwa-text">
          <h4>Reach Chauffeur App</h4>
          <p>Install the app for a faster, premium booking experience.</p>
        </div>
      </div>
      <button className="btn-champagne pwa-install-btn" onClick={handleInstallClick}>
        Install App
      </button>

      <style>{`
        .pwa-install-popup {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 20px;
          z-index: 9999;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .pwa-close-btn {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--color-silver);
          cursor: pointer;
        }

        .pwa-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .pwa-logo {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          object-fit: contain;
          background: #08080A;
          padding: 5px;
        }

        .pwa-text h4 {
          margin: 0;
          font-size: 1.1rem;
          color: #08080A;
        }

        .pwa-text p {
          margin: 4px 0 0;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .pwa-install-btn {
          width: 100%;
          padding: 12px;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
