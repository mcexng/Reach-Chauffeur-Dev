import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Fleet from './pages/Fleet';
import Tracking from './pages/Tracking';
import Corporate from './pages/Corporate';
import NewsHub from './pages/NewsHub';
import Admin from './pages/Admin';
import Chauffeur from './pages/Chauffeur';
import BookingEngine from './components/BookingEngine';
import LegalModal from './components/LegalModal';
import PwaInstallPopup from './components/PwaInstallPopup';
import { db } from './utils/db';

export default function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Legal Modals states
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalType, setLegalType] = useState('terms');
  
  // Dynamic states synchronized with localStorage
  const [vehicles, setVehicles] = useState([]);
  const [articles, setArticles] = useState([]);
  const [fleetUpdates, setFleetUpdates] = useState([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  
  // Shared quick-booking prefill state
  const [prefillDetails, setPrefillDetails] = useState({ pickup: '', date: '' });
  
  // Live booking instance to track
  const [activeBooking, setActiveBooking] = useState(null);

  // Initialize DB and load states
  useEffect(() => {
    db.init();
    refreshStates();
  }, []);

  const refreshStates = async () => {
    setVehicles(await db.getVehicles());
    setArticles(await db.getArticles());
    setFleetUpdates(await db.getFleetUpdates());
    const allBookings = await db.getBookings();
    setBookingsCount(allBookings.length);
    
    // Update active booking status dynamically if currently tracked
    let currentRef = activeBooking?.bookingRef || localStorage.getItem('activeBookingRef');
    if (currentRef) {
      const current = allBookings.find(b => b.bookingRef === currentRef);
      if (current) {
        setActiveBooking(current);
      } else {
        localStorage.removeItem('activeBookingRef');
      }
    }
  };

  const handleOpenBooking = async (vehicle = null, pref = null) => {
    // If no vehicle is selected, default to the first sedan in catalog
    const catalog = await db.getVehicles();
    const fallbackCar = catalog.find(v => v.tier === 'sedan') || catalog[0] || {
      id: 'mb-sclass',
      name: 'Mercedes-Benz S-Class',
      tierLabel: 'Executive Sedan',
      basePrice: 170000,
      standardPrice: 180000
    };

    setSelectedVehicle(vehicle || fallbackCar);
    if (pref) {
      setPrefillDetails(pref);
    }
    setIsBookingOpen(true);
  };

  const handleQuickBookFromHome = (pickup, date) => {
    setPrefillDetails({ pickup, date });
  };

  const handleBookingSuccess = (bookingDetails) => {
    // Refresh bookings count and synchronizations
    localStorage.setItem('activeBookingRef', bookingDetails.bookingRef);
    refreshStates();
    setActiveBooking(bookingDetails);
    setIsBookingOpen(false);
    window.location.href = '/tracking';
  };

  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={
          <div className="admin-isolated-shell">
            <Admin 
              onFleetUpdate={refreshStates}
              onNewsUpdate={refreshStates}
              onBookingsUpdate={refreshStates}
            />
            <style>{`
              .admin-isolated-shell {
                min-height: 100vh;
                background-color: var(--color-bg-base);
                color: var(--color-text-main);
              }
            `}</style>
          </div>
        } />
        <Route path="/chauffeur/*" element={<Chauffeur />} />
        
        <Route path="*" element={
          <div className="app-shell">
            {/* Premium Header */}
            <Navbar onOpenBooking={() => handleOpenBooking()} />

            {/* Main Content Pane */}
            <main className="main-content-pane">
              <Routes>
                <Route path="/" element={<Home onQuickBook={handleQuickBookFromHome} vehicles={vehicles.filter(v => v.isActive)} />} />
                <Route path="/fleets" element={<Fleet onOpenBooking={handleOpenBooking} quickBookDetails={prefillDetails} vehicles={vehicles.filter(v => v.isActive)} fleetUpdates={fleetUpdates} />} />
                <Route path="/tracking" element={<Tracking activeBooking={activeBooking} onSearchRefresh={refreshStates} />} />
                <Route path="/corporate" element={<Corporate onOpenBooking={handleOpenBooking} />} />
                <Route path="/news" element={<NewsHub articles={articles} />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer onOpenLegal={(type) => { setLegalType(type); setLegalModalOpen(true); }} />

            {/* Multi-step Booking Form */}
            <BookingEngine
              isOpen={isBookingOpen}
              onClose={() => setIsBookingOpen(false)}
              selectedVehicle={selectedVehicle}
              prefillDetails={prefillDetails}
              onBookingSuccess={handleBookingSuccess}
            />

            {/* Legal policies (Terms, Privacy, Cookies) Modal */}
            <LegalModal 
              isOpen={legalModalOpen} 
              onClose={() => setLegalModalOpen(false)} 
              type={legalType} 
            />

            {/* Global PWA Install Prompt for Mobile */}
            <PwaInstallPopup />

            <style>{`
              .app-shell {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                position: relative;
              }

              .main-content-pane {
                flex-grow: 1;
                padding-top: 100px;
              }
            `}</style>
          </div>
        } />
      </Routes>
    </Router>
  );
}
