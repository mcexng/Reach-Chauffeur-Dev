import React, { useState, useEffect } from 'react';
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
import { db } from './utils/db';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Legal Modals states
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalType, setLegalType] = useState('terms');
  
  // Dynamic states synchronized with localStorage
  const [vehicles, setVehicles] = useState([]);
  const [articles, setArticles] = useState([]);
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
    const allBookings = await db.getBookings();
    setBookingsCount(allBookings.length);
    
    // Update active booking status dynamically if currently tracked
    if (activeBooking) {
      const current = allBookings.find(b => b.bookingRef === activeBooking.bookingRef);
      if (current) {
        setActiveBooking(current);
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
    refreshStates();
    setActiveBooking(bookingDetails);
    setIsBookingOpen(false);
    
    // Route user immediately to live tracking
    setCurrentPage('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state if user switches tabs to tracking to pull latest status
  const handlePageChange = (pageId) => {
    refreshStates();
    setCurrentPage(pageId);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home 
            onQuickBook={handleQuickBookFromHome}
            setCurrentPage={handlePageChange} 
          />
        );
      case 'fleet':
        return (
          <Fleet 
            onOpenBooking={handleOpenBooking} 
            quickBookDetails={prefillDetails}
            vehicles={vehicles.filter(v => v.isActive)}
          />
        );
      case 'tracking':
        return (
          <Tracking 
            activeBooking={activeBooking} 
            onSearchRefresh={refreshStates}
          />
        );
      case 'corporate':
        return (
          <Corporate 
            onOpenBooking={handleOpenBooking} 
          />
        );
      case 'news':
        return (
          <NewsHub 
            articles={articles}
          />
        );
      case 'news':
        return (
          <NewsHub 
            articles={articles}
          />
        );
      default:
        return (
          <Home 
            onQuickBook={handleQuickBookFromHome}
            setCurrentPage={handlePageChange} 
          />
        );
    }
  };

  // If path is /admin, completely isolate the layout
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <div className="admin-isolated-shell">
        <Admin 
          onFleetUpdate={refreshStates}
          onNewsUpdate={refreshStates}
          onBookingsUpdate={refreshStates}
        />
        <style>{`
          .admin-isolated-shell {
            min-height: 100vh;
            background-color: var(--color-obsidian);
          }
        `}</style>
      </div>
    );
  }

  // If path is /chauffeur, completely isolate the layout
  if (window.location.pathname.startsWith('/chauffeur')) {
    return <Chauffeur />;
  }

  return (
    <div className="app-shell">
      {/* Premium Header */}
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={handlePageChange} 
        onOpenBooking={() => handleOpenBooking()} 
      />

      {/* Main Content Pane */}
      <main className="main-content-pane">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer 
        setCurrentPage={handlePageChange} 
        onOpenLegal={(type) => { setLegalType(type); setLegalModalOpen(true); }}
      />

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

      <style>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .main-content-pane {
          flex-grow: 1;
          padding-top: 100px; /* spacing for floating navbar */
        }
      `}</style>
    </div>
  );
}
