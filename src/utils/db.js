import { dbFS } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

export const db = {
  // Initialization - placeholder for backwards compatibility
  init: async () => {
    console.log('Firebase Firestore DB initialized.');
  },

  // -------------------------------------------------------------
  // VEHICLES
  // -------------------------------------------------------------
  getVehicles: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'vehicles'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data.map(car => ({
        ...car,
        licensePlate: car.licenseplate || car.licensePlate,
        tierLabel: car.tierlabel || car.tierLabel,
        basePrice: car.baseprice || car.basePrice,
        standardPrice: car.standardprice || car.standardPrice,
        priceAirport: car.price_airport || car.priceAirport || car.baseprice || car.basePrice,
        price12hr: car.price_12hr || car.price12hr || car.baseprice || car.basePrice,
        price24hr: car.price_24hr || car.price24hr || car.baseprice || car.basePrice,
        priceHourly: car.price_hourly || car.priceHourly || car.baseprice || car.basePrice,
        promoActive: car.promo_active || car.promoActive || false,
        promoDiscount: car.promo_discount || car.promoDiscount || 0,
        videoUrl: car.videourl || car.videoUrl,
        isActive: car.is_active !== false && car.isActive !== false, // defaults to true
        images: [car.image1 || car.images?.[0], car.image2 || car.images?.[1], car.image3 || car.images?.[2]].filter(Boolean),
        specs: car.specs || {
          passengers: car.passengers,
          luggage: car.luggage,
          wifi: car.wifi,
          refreshments: car.refreshments,
          privacy: car.privacy,
          color: car.color,
          licensePlate: car.licenseplate
        }
      }));
    } catch (e) {
      console.error('Error fetching vehicles:', e);
      return [];
    }
  },

  addVehicle: async (vehicle) => {
    try {
      const flatVehicle = {
        id: vehicle.id,
        name: vehicle.name || '',
        tier: vehicle.tier || '',
        tierlabel: vehicle.tierLabel || '',
        baseprice: Number(vehicle.basePrice || 0),
        standardprice: Number(vehicle.standardPrice || 0),
        price_airport: Number(vehicle.priceAirport || 0),
        price_12hr: Number(vehicle.price12hr || 0),
        price_24hr: Number(vehicle.price24hr || 0),
        price_hourly: Number(vehicle.priceHourly || 0),
        promo_active: vehicle.promoActive || false,
        promo_discount: Number(vehicle.promoDiscount || 0),
        image1: vehicle.images?.[0] || '',
        image2: vehicle.images?.[1] || '',
        image3: vehicle.images?.[2] || '',
        videourl: vehicle.videoUrl || '',
        wifi: vehicle.specs?.wifi || '',
        refreshments: vehicle.specs?.refreshments || '',
        privacy: vehicle.specs?.privacy || '',
        passengers: vehicle.specs?.passengers || 4,
        luggage: vehicle.specs?.luggage || 2,
        color: vehicle.specs?.color || 'Midnight Obsidian Black',
        licenseplate: vehicle.specs?.licensePlate || 'Pending Registry',
        is_active: vehicle.isActive !== false
      };
      await setDoc(doc(dbFS, 'vehicles', vehicle.id), flatVehicle);
    } catch (e) {
      console.error('Error adding vehicle:', e);
    }
  },

  deleteVehicle: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'vehicles', id));
    } catch (e) {
      console.error('Error deleting vehicle:', e);
    }
  },

  toggleVehicleStatus: async (id, isActive) => {
    try {
      await updateDoc(doc(dbFS, 'vehicles', id), { is_active: isActive });
    } catch (e) {
      console.error('Error toggling vehicle status:', e);
    }
  },

  // -------------------------------------------------------------
  // ARTICLES
  // -------------------------------------------------------------
  getArticles: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'articles'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data.map(art => ({
        ...art,
        readTime: art.readtime || art.readTime
      }));
    } catch (e) {
      console.error('Error fetching articles:', e);
      return [];
    }
  },

  addArticle: async (article) => {
    try {
      if (!article.id) article.id = 'art-' + Date.now();
      const flatArticle = {
        id: article.id,
        title: article.title || '',
        category: article.category || '',
        readtime: article.readTime || '',
        summary: article.summary || '',
        image: article.image || '',
        content: article.content || '',
        date: article.date || new Date().toISOString().split('T')[0]
      };
      await setDoc(doc(dbFS, 'articles', article.id), flatArticle);
    } catch (e) {
      console.error('Error adding article:', e);
    }
  },

  deleteArticle: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'articles', id));
    } catch (e) {
      console.error('Error deleting article:', e);
    }
  },

  // -------------------------------------------------------------
  // BOOKINGS
  // -------------------------------------------------------------
  getBookings: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'bookings'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      data.sort((a, b) => {
        const tA = a.created_at || a.bookingRef || '';
        const tB = b.created_at || b.bookingRef || '';
        return tB.localeCompare(tA);
      });
      return data.map(b => ({
        ...b,
        bookingRef: b.bookingref || b.bookingRef,
        bookingType: b.bookingtype || b.bookingType,
        totalCost: b.totalcost || b.totalCost,
        dispatchTime: b.dispatchtime || b.dispatchTime,
        endTime: b.endtime || b.endTime,
        extension: b.extension || null,
        assigned_vehicle_id: b.assigned_vehicle_id || null,
        assigned_license_plate: b.assigned_license_plate || null
      }));
    } catch (e) {
      console.error('Error fetching bookings:', e);
      return [];
    }
  },

  addBooking: async (booking) => {
    try {
      const flatBooking = {
        bookingref: booking.bookingRef,
        vehicle: booking.vehicle || {},
        personal: booking.personal || {},
        logistics: booking.logistics || {},
        bookingtype: booking.bookingType || '',
        totalcost: Number(booking.totalCost || 0),
        status: booking.status || 'Pending Dispatch',
        dispatchtime: booking.dispatchTime || null,
        created_at: new Date().toISOString()
      };
      await setDoc(doc(dbFS, 'bookings', booking.bookingRef), flatBooking);
    } catch (e) {
      console.error('Error adding booking:', e);
    }
  },

  updateBookingStatus: async (bookingRef, status, extraData = {}) => {
    try {
      const updatePayload = { status };
      if (extraData.dispatchTime !== undefined) updatePayload.dispatchtime = extraData.dispatchTime;
      if (extraData.driver_id !== undefined) updatePayload.driver_id = extraData.driver_id;
      if (extraData.endTime !== undefined) updatePayload.endtime = extraData.endTime;
      if (extraData.assigned_vehicle_id !== undefined) updatePayload.assigned_vehicle_id = extraData.assigned_vehicle_id;
      if (extraData.assigned_license_plate !== undefined) updatePayload.assigned_license_plate = extraData.assigned_license_plate;
      
      await updateDoc(doc(dbFS, 'bookings', bookingRef), updatePayload);
    } catch (e) {
      console.error('Error updating booking status:', e);
    }
  },

  updateBookingExtension: async (bookingRef, extensionData) => {
    try {
      await updateDoc(doc(dbFS, 'bookings', bookingRef), { extension: extensionData });
    } catch (e) {
      console.error('Error updating booking extension:', e);
    }
  },

  // -------------------------------------------------------------
  // CHAUFFEURS / DRIVERS
  // -------------------------------------------------------------
  getDrivers: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'drivers'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data;
    } catch (e) {
      console.error('Error fetching drivers:', e);
      return [];
    }
  },

  getDriver: async (id) => {
    try {
      const docSnap = await getDoc(doc(dbFS, 'drivers', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (e) {
      console.error('Error fetching driver:', e);
      return null;
    }
  },

  addDriver: async (driver) => {
    try {
      await setDoc(doc(dbFS, 'drivers', driver.id), driver);
    } catch (e) {
      console.error('Error adding driver:', e);
    }
  },

  updateDriverLocation: async (id, lat, lng) => {
    try {
      await updateDoc(doc(dbFS, 'drivers', id), { current_lat: lat, current_lng: lng });
    } catch (e) {
      console.error('Error updating driver location:', e);
    }
  },

  deleteDriver: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'drivers', id));
    } catch (e) {
      console.error('Error deleting driver:', e);
    }
  },

  // -------------------------------------------------------------
  // CORPORATE ACCOUNTS
  // -------------------------------------------------------------
  getCorpAccounts: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'corporate_accounts'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ email: docSnap.id, ...docSnap.data() });
      });
      return data.map(acc => {
        let actualPhone = acc.phone || '';
        let corporateId = acc.corporate_id || acc.corporateId || '';
        
        if (actualPhone.includes('|')) {
          const parts = actualPhone.split('|');
          actualPhone = parts[0] || '';
          if (!corporateId) {
            corporateId = parts[1] || '';
          }
        }
        
        return {
          ...acc,
          companyName: acc.companyname || acc.companyName,
          contactName: acc.contactname || acc.contactName,
          phone: actualPhone,
          discountRate: acc.discountrate || acc.discountRate,
          corporateId: corporateId || ''
        };
      });
    } catch (e) {
      console.error('Error fetching corp accounts:', e);
      return [];
    }
  },

  registerCorpAccount: async (account) => {
    try {
      const flatAccount = {
        email: account.email,
        companyname: account.companyName,
        contactname: account.contactName,
        phone: `${account.phone || ''}|${account.corporateId || ''}`,
        password: account.password,
        discountrate: Number(account.discountRate || 0),
        status: account.status || 'Active',
        corporate_id: account.corporateId || ''
      };
      await setDoc(doc(dbFS, 'corporate_accounts', account.email), flatAccount);
    } catch (e) {
      console.error('Error registering corp account:', e);
    }
  },

  updateCorpAccount: async (email, updates) => {
    try {
      const flatUpdates = {};
      if (updates.companyName !== undefined) flatUpdates.companyname = updates.companyName;
      if (updates.contactName !== undefined) flatUpdates.contactname = updates.contactName;
      if (updates.status !== undefined) flatUpdates.status = updates.status;
      
      if (updates.phone !== undefined || updates.corporateId !== undefined) {
        const phoneVal = updates.phone !== undefined ? updates.phone : '';
        const idVal = updates.corporateId !== undefined ? updates.corporateId : '';
        flatUpdates.phone = `${phoneVal}|${idVal}`;
      }
      
      if (updates.corporateId !== undefined) {
        flatUpdates.corporate_id = updates.corporateId;
      }
      if (updates.discountRate !== undefined) {
        flatUpdates.discountrate = Number(updates.discountRate);
      }
      
      await updateDoc(doc(dbFS, 'corporate_accounts', email), flatUpdates);
    } catch (e) {
      console.error('Error updating corp account:', e);
    }
  },

  // -------------------------------------------------------------
  // BACKUP / SYNC
  // -------------------------------------------------------------
  exportDatabase: async () => {
    const vehicles = await db.getVehicles();
    const articles = await db.getArticles();
    const bookings = await db.getBookings();
    const corpAccounts = await db.getCorpAccounts();
    
    return JSON.stringify({ vehicles, articles, bookings, corpAccounts }, null, 2);
  },

  importDatabase: async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.vehicles) {
        for (const v of data.vehicles) await db.addVehicle(v);
      }
      if (data.articles) {
        for (const a of data.articles) await db.addArticle(a);
      }
      if (data.bookings) {
        for (const b of data.bookings) await db.addBooking(b);
      }
      if (data.corpAccounts) {
        for (const c of data.corpAccounts) await db.registerCorpAccount(c);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // -------------------------------------------------------------
  // APP SETTINGS
  // -------------------------------------------------------------
  getPaymentSettings: async () => {
    try {
      const docSnap = await getDoc(doc(dbFS, 'settings', 'payment_details'));
      if (docSnap.exists()) {
        return docSnap.data().value || {};
      }
      return {
        bankName: 'Sterling Corporate Bank',
        accountNo: '009 812 3456',
        accountName: 'Reach Chauffeur Executive Ltd'
      };
    } catch (e) {
      console.error('Error fetching payment settings:', e);
      return {
        bankName: 'Sterling Corporate Bank',
        accountNo: '009 812 3456',
        accountName: 'Reach Chauffeur Executive Ltd'
      };
    }
  },

  updatePaymentSettings: async (settings) => {
    try {
      await setDoc(doc(dbFS, 'settings', 'payment_details'), { value: settings });
    } catch (e) {
      console.error('Error updating payment settings:', e);
    }
  },

  getPricingSettings: async () => {
    try {
      const docSnap = await getDoc(doc(dbFS, 'settings', 'pricing_details'));
      if (docSnap.exists()) {
        return docSnap.data().value || {};
      }
      return {
        promoActive: true,
        promoDiscountPercent: 20,
        multipliers: {
          airport: 0.65,
          '12hr': 1.0,
          '24hr': 1.95,
          other: 0.15
        }
      };
    } catch (e) {
      console.error('Error fetching pricing settings:', e);
      return {
        promoActive: true,
        promoDiscountPercent: 20,
        multipliers: {
          airport: 0.65,
          '12hr': 1.0,
          '24hr': 1.95,
          other: 0.15
        }
      };
    }
  },

  updatePricingSettings: async (settings) => {
    try {
      await setDoc(doc(dbFS, 'settings', 'pricing_details'), { value: settings });
    } catch (e) {
      console.error('Error updating pricing settings:', e);
    }
  },

  // -------------------------------------------------------------
  // PROMO CODES
  // -------------------------------------------------------------
  getPromoCodes: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'promo_codes'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data;
    } catch (e) {
      console.error('Error fetching promo codes:', e);
      return [];
    }
  },

  addPromoCode: async (promoData) => {
    try {
      await setDoc(doc(dbFS, 'promo_codes', promoData.id), promoData);
    } catch (e) {
      console.error('Error adding promo code:', e);
    }
  },

  updatePromoCode: async (id, updates) => {
    try {
      await updateDoc(doc(dbFS, 'promo_codes', id), updates);
    } catch (e) {
      console.error('Error updating promo code:', e);
    }
  },

  deletePromoCode: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'promo_codes', id));
    } catch (e) {
      console.error('Error deleting promo code:', e);
    }
  },

  // -------------------------------------------------------------
  // MEDIA UPLOADS (Base64 conversion, fully independent and free)
  // -------------------------------------------------------------
  uploadMedia: async (file) => {
    if (!file) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
};
