import { dbFS } from './firebase.js';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

const DEFAULT_ARTICLES = [
  {
    id: 'art-1',
    title: 'The Silent Cabin: Under the Hood of the Mercedes-Maybach S-Class',
    category: 'Vehicle Review',
    readTime: '5 min read',
    summary: 'An inside look into active noise cancellation, executive recliners, and presidential protection packages.',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600',
    content: 'The Mercedes-Maybach S-Class represents the pinnacle of automotive luxury engineering. With acoustic glass laminates, active road noise compensation embedded into the Burmester High-End 4D sound system, and first-class rear executive seating, every journey transforms into a sanctuary of tranquility.\n\nOur Lagos garage fleet is configured with full rear executive seating packages, champagne coolers, folding work tables, and dedicated 5G Wi-Fi hotspots for seamless productivity on the move.',
    date: '2026-09-18'
  },
  {
    id: 'art-2',
    title: 'Private Jet to Chauffeur Tarmac Handshake: Aviation Protocol',
    category: 'Luxury Travel',
    readTime: '4 min read',
    summary: 'How Reach Chauffeur coordinates directly with FBO handlers for direct tarmac pickups at Murtala Muhammed Airport.',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600',
    content: 'Precision timing and discreet security clearance are essential when transitioning from private aviation to ground transport. Our dispatch system synchronizes with live flight telemetry.\n\nUpon touchdown, verified presidential detail chauffeurs step up directly to the airstairs, ensuring seamless tarmac transfer without security delay.',
    date: '2026-09-15'
  }
];

const DEFAULT_FLEET_UPDATES = [
  {
    id: 'rr-spectre',
    name: '2026 Rolls-Royce Spectre (All-Electric)',
    tierLabel: 'Presidential Limousine',
    tag: 'JUST ADDED',
    desc: 'The defining statement in silent, all-electric ultra-luxury. Just delivered to our Lagos garage.',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=300',
    date: '2026-09-19'
  },
  {
    id: 'maybach-s-2026',
    name: '2026 Mercedes-Maybach S-Class',
    tierLabel: 'Presidential Limousine',
    tag: 'JUST ADDED',
    desc: 'Configured with executive writing tables and champagne flute holsters.',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=300',
    date: '2026-09-17'
  }
];

export const db = {
  // Initialization
  init: async () => {
    console.log('Reach Chauffeur Production Firestore Database Initialized.');
  },

  // -------------------------------------------------------------
  // VEHICLES (Primary source of truth: Cloud Firestore)
  // -------------------------------------------------------------
  getVehicles: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'vehicles'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (data.length > 0) {
        const mapped = data.map(car => ({
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
          isActive: car.is_active !== false && car.isActive !== false,
          images: [car.image1 || car.images?.[0], car.image2 || car.images?.[1], car.image3 || car.images?.[2]].filter(Boolean),
          specs: car.specs || {
            passengers: car.passengers,
            luggage: car.luggage,
            wifi: car.wifi || '5G Dedicated Hotspot',
            refreshments: car.refreshments || 'Dom Pérignon Chilled + Gold Standard Water',
            privacy: car.privacy || 'Level 4 Max',
            color: car.color,
            licensePlate: car.licenseplate
          }
        }));
        try {
          localStorage.setItem('reach_cached_vehicles', JSON.stringify(mapped));
        } catch(e) {}
        return mapped;
      }
    } catch (e) {
      console.error('Error fetching vehicles from Firestore:', e);
    }

    // Local cache fallback
    const cached = localStorage.getItem('reach_cached_vehicles');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch(err) {}
    }
    return [];
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
        wifi: vehicle.specs?.wifi || '5G Dedicated Hotspot',
        refreshments: vehicle.specs?.refreshments || 'Dom Pérignon Chilled + Gold Standard Water',
        privacy: vehicle.specs?.privacy || 'Level 4 Max',
        passengers: vehicle.specs?.passengers || 4,
        luggage: vehicle.specs?.luggage || 2,
        color: vehicle.specs?.color || 'Midnight Obsidian Black',
        licenseplate: vehicle.specs?.licensePlate || 'Pending Registry',
        is_active: vehicle.isActive !== false
      };
      await setDoc(doc(dbFS, 'vehicles', vehicle.id), flatVehicle);
      return flatVehicle;
    } catch (e) {
      console.error('Error adding vehicle to Firestore:', e);
      throw e;
    }
  },

  deleteVehicle: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'vehicles', id));
    } catch (e) {
      console.error('Error deleting vehicle from Firestore:', e);
      throw e;
    }
  },

  toggleVehicleStatus: async (id, isActive) => {
    try {
      await updateDoc(doc(dbFS, 'vehicles', id), { is_active: isActive });
    } catch (e) {
      console.error('Error toggling vehicle status in Firestore:', e);
      throw e;
    }
  },

  // -------------------------------------------------------------
  // FLEET UPDATES / NEW DELIVERIES (Primary: Cloud Firestore)
  // -------------------------------------------------------------
  getFleetUpdates: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'fleet_updates'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (data.length > 0) {
        const mapped = data.map(u => ({
          ...u,
          tierLabel: u.tierLabel || u.tierlabel || 'Presidential Limousine',
          name: u.name || u.title || ''
        })).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        try {
          localStorage.setItem('reach_fleet_updates', JSON.stringify(mapped));
        } catch(e) {}
        return mapped;
      }
    } catch (e) {
      console.warn('Firestore fleet_updates error, reading local cache:', e);
    }

    const cached = localStorage.getItem('reach_fleet_updates');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch(err) {}
    }
    return DEFAULT_FLEET_UPDATES;
  },

  addFleetUpdate: async (updateData) => {
    const id = updateData.id || 'del-' + Date.now();
    const flat = {
      id,
      name: updateData.name || updateData.title || '',
      tierlabel: updateData.tierLabel || 'Presidential Limousine',
      tag: updateData.tag || 'JUST ADDED',
      desc: updateData.desc || updateData.description || '',
      image: updateData.image || '',
      date: updateData.date || new Date().toISOString().split('T')[0]
    };

    // Update local cache immediately
    try {
      const cached = await db.getFleetUpdates();
      const updatedList = [flat, ...cached.filter(item => item.id !== id)];
      localStorage.setItem('reach_fleet_updates', JSON.stringify(updatedList));
    } catch(e) {}

    // Persist to Firestore
    try {
      await setDoc(doc(dbFS, 'fleet_updates', id), flat);
    } catch (e) {
      console.warn('Firestore fleet_updates setDoc error:', e);
    }
    return flat;
  },

  updateFleetUpdate: async (id, updateData) => {
    const flat = {};
    if (updateData.name !== undefined) flat.name = updateData.name;
    if (updateData.tierLabel !== undefined) flat.tierlabel = updateData.tierLabel;
    if (updateData.tag !== undefined) flat.tag = updateData.tag;
    if (updateData.desc !== undefined) flat.desc = updateData.desc;
    if (updateData.image !== undefined) flat.image = updateData.image;

    try {
      const cached = await db.getFleetUpdates();
      const updatedList = cached.map(item => item.id === id ? { ...item, ...flat, tierLabel: flat.tierlabel || item.tierLabel } : item);
      localStorage.setItem('reach_fleet_updates', JSON.stringify(updatedList));
    } catch(e) {}

    try {
      await updateDoc(doc(dbFS, 'fleet_updates', id), flat);
    } catch (e) {
      console.warn('Firestore fleet_updates updateDoc error:', e);
    }
  },

  deleteFleetUpdate: async (id) => {
    try {
      const cached = await db.getFleetUpdates();
      const updatedList = cached.filter(item => item.id !== id);
      localStorage.setItem('reach_fleet_updates', JSON.stringify(updatedList));
    } catch(e) {}

    try {
      await deleteDoc(doc(dbFS, 'fleet_updates', id));
    } catch (e) {
      console.warn('Firestore fleet_updates deleteDoc error:', e);
    }
  },

  // -------------------------------------------------------------
  // ARTICLES (Primary: Cloud Firestore)
  // -------------------------------------------------------------
  getArticles: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'articles'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (data.length > 0) {
        return data.map(art => ({
          ...art,
          readTime: art.readtime || art.readTime
        })).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      }
    } catch (e) {
      console.error('Error fetching articles from Firestore:', e);
    }

    return DEFAULT_ARTICLES;
  },

  addArticle: async (article) => {
    try {
      if (!article.id) article.id = 'art-' + Date.now();
      const flatArticle = {
        id: article.id,
        title: article.title || '',
        category: article.category || '',
        readtime: article.readTime || article.readtime || '',
        summary: article.summary || '',
        image: article.image || '',
        content: article.content || '',
        date: article.date || new Date().toISOString().split('T')[0]
      };
      await setDoc(doc(dbFS, 'articles', article.id), flatArticle);
      return flatArticle;
    } catch (e) {
      console.error('Error adding article to Firestore:', e);
      throw e;
    }
  },

  updateArticle: async (id, updates) => {
    try {
      const flat = {};
      if (updates.title !== undefined) flat.title = updates.title;
      if (updates.category !== undefined) flat.category = updates.category;
      if (updates.readTime !== undefined || updates.readtime !== undefined) flat.readtime = updates.readTime || updates.readtime;
      if (updates.summary !== undefined) flat.summary = updates.summary;
      if (updates.image !== undefined) flat.image = updates.image;
      if (updates.content !== undefined) flat.content = updates.content;
      if (updates.date !== undefined) flat.date = updates.date;

      await updateDoc(doc(dbFS, 'articles', id), flat);
    } catch (e) {
      console.error('Error updating article in Firestore:', e);
      throw e;
    }
  },

  deleteArticle: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'articles', id));
    } catch (e) {
      console.error('Error deleting article in Firestore:', e);
      throw e;
    }
  },

  // -------------------------------------------------------------
  // BOOKINGS (Primary: Cloud Firestore)
  // -------------------------------------------------------------
  getBookings: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'bookings'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });

      data.sort((a, b) => {
        const tA = a.created_at || a.bookingref || a.bookingRef || '';
        const tB = b.created_at || b.bookingref || b.bookingRef || '';
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
      console.error('Error fetching bookings from Firestore:', e);
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
      console.error('Error adding booking to Firestore:', e);
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
      console.error('Error updating booking in Firestore:', e);
    }
  },

  updateBookingExtension: async (bookingRef, extensionData) => {
    try {
      await updateDoc(doc(dbFS, 'bookings', bookingRef), { extension: extensionData });
    } catch (e) {
      console.error('Error updating booking extension in Firestore:', e);
    }
  },

  // -------------------------------------------------------------
  // CHAUFFEURS / DRIVERS (Primary: Cloud Firestore)
  // -------------------------------------------------------------
  getDrivers: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'drivers'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      return data;
    } catch (e) {
      console.error('Error fetching drivers from Firestore:', e);
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
      console.error('Error fetching driver from Firestore:', e);
      return null;
    }
  },

  addDriver: async (driver) => {
    try {
      await setDoc(doc(dbFS, 'drivers', driver.id), driver);
    } catch (e) {
      console.error('Error adding driver to Firestore:', e);
    }
  },

  updateDriverLocation: async (id, lat, lng) => {
    try {
      await updateDoc(doc(dbFS, 'drivers', id), { current_lat: lat, current_lng: lng });
    } catch (e) {
      console.error('Error updating driver location in Firestore:', e);
    }
  },

  deleteDriver: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'drivers', id));
    } catch (e) {
      console.error('Error deleting driver from Firestore:', e);
    }
  },

  // -------------------------------------------------------------
  // CORPORATE ACCOUNTS (Primary: Cloud Firestore)
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
          if (!corporateId) corporateId = parts[1] || '';
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
      console.error('Error fetching corp accounts from Firestore:', e);
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
      console.error('Error registering corporate account in Firestore:', e);
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
      console.error('Error updating corporate account in Firestore:', e);
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
    const fleetUpdates = await db.getFleetUpdates();
    
    return JSON.stringify({ vehicles, articles, bookings, corpAccounts, fleetUpdates }, null, 2);
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
      if (data.fleetUpdates) {
        for (const u of data.fleetUpdates) await db.addFleetUpdate(u);
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
    } catch (e) {
      console.warn('Error fetching payment settings:', e);
    }

    return {
      bankName: 'Sterling Corporate Bank',
      accountNo: '009 812 3456',
      accountName: 'Reach Chauffeur Executive Ltd'
    };
  },

  updatePaymentSettings: async (settings) => {
    try {
      await setDoc(doc(dbFS, 'settings', 'payment_details'), { value: settings });
    } catch (e) {
      console.error('Error updating payment settings in Firestore:', e);
    }
  },

  getPricingSettings: async () => {
    try {
      const docSnap = await getDoc(doc(dbFS, 'settings', 'pricing_details'));
      if (docSnap.exists()) {
        return docSnap.data().value || {};
      }
    } catch (e) {
      console.warn('Error fetching pricing settings:', e);
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
  },

  updatePricingSettings: async (settings) => {
    try {
      await setDoc(doc(dbFS, 'settings', 'pricing_details'), { value: settings });
    } catch (e) {
      console.error('Error updating pricing settings in Firestore:', e);
    }
  },

  // -------------------------------------------------------------
  // PROMO CODES
  // -------------------------------------------------------------
  getPromoCodes: async () => {
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'promo_codes'));
      const data = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      return data;
    } catch (e) {
      console.error('Error fetching promo codes from Firestore:', e);
      return [];
    }
  },

  addPromoCode: async (promoData) => {
    try {
      await setDoc(doc(dbFS, 'promo_codes', promoData.id), promoData);
    } catch (e) {
      console.error('Error adding promo code to Firestore:', e);
    }
  },

  updatePromoCode: async (id, updates) => {
    try {
      await updateDoc(doc(dbFS, 'promo_codes', id), updates);
    } catch (e) {
      console.error('Error updating promo code in Firestore:', e);
    }
  },

  deletePromoCode: async (id) => {
    try {
      await deleteDoc(doc(dbFS, 'promo_codes', id));
    } catch (e) {
      console.error('Error deleting promo code in Firestore:', e);
    }
  },

  // -------------------------------------------------------------
  // MEDIA UPLOADS (Fast client-side canvas compression to Base64)
  // -------------------------------------------------------------
  uploadMedia: async (file) => {
    if (!file) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        if (file.type && file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1200;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        } else {
          resolve(dataUrl);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  // -------------------------------------------------------------
  // ADMIN AUTHENTICATION
  // -------------------------------------------------------------
  getAdminAuth: async () => {
    try {
      const docSnap = await getDoc(doc(dbFS, 'settings', 'adminAuth'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {
      console.warn('Error fetching admin auth from Firestore:', e);
    }

    return { email: 'reachchauffeur@gmail.com', password: 'reach2026' };
  },

  updateAdminAuth: async (authData) => {
    try {
      await setDoc(doc(dbFS, 'settings', 'adminAuth'), authData);
      return true;
    } catch (e) {
      console.error('Error updating admin auth in Firestore:', e);
      return false;
    }
  }
};
