import { dbFS } from './firebase.js';
import { supabase } from './supabase.js';
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
  // Initialization - placeholder for backwards compatibility
  init: async () => {
    console.log('Reach Chauffeur Database synchronized.');
  },

  // -------------------------------------------------------------
  // VEHICLES
  // -------------------------------------------------------------
  getVehicles: async () => {
    // 1. Try Supabase first (contains verified fleet catalog and storage images)
    try {
      if (supabase) {
        const { data, error } = await supabase.from('vehicles').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
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
        }
      }
    } catch (err) {
      console.warn('Supabase getVehicles error, trying fallback:', err);
    }

    // 2. Fallback to Firestore if configured
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
    } catch (e) {
      console.error('Error fetching vehicles:', e);
      return [];
    }
  },

  addVehicle: async (vehicle) => {
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

    if (supabase) {
      try {
        await supabase.from('vehicles').upsert([flatVehicle]);
      } catch (err) {
        console.warn('Supabase vehicle upsert warning:', err);
      }
    }
    try {
      await setDoc(doc(dbFS, 'vehicles', vehicle.id), flatVehicle);
    } catch (e) {
      console.warn('Firestore addVehicle warning:', e);
    }
  },

  deleteVehicle: async (id) => {
    if (supabase) {
      try {
        await supabase.from('vehicles').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase vehicle delete warning:', err);
      }
    }
    try {
      await deleteDoc(doc(dbFS, 'vehicles', id));
    } catch (e) {
      console.warn('Firestore deleteVehicle warning:', e);
    }
  },

  toggleVehicleStatus: async (id, isActive) => {
    if (supabase) {
      try {
        await supabase.from('vehicles').update({ is_active: isActive }).eq('id', id);
      } catch (err) {
        console.warn('Supabase toggle status warning:', err);
      }
    }
    try {
      await updateDoc(doc(dbFS, 'vehicles', id), { is_active: isActive });
    } catch (e) {
      console.warn('Firestore toggleVehicleStatus warning:', e);
    }
  },

  // -------------------------------------------------------------
  // FLEET UPDATES / NEW DELIVERIES
  // -------------------------------------------------------------
  getFleetUpdates: async () => {
    // 1. Try Supabase if table exists
    try {
      if (supabase) {
        const { data, error } = await supabase.from('fleet_updates').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
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
      }
    } catch (err) {
      // Ignore schema cache table missing
    }

    // 2. Try Firestore
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
      // Ignore
    }

    // 3. Fallback to localStorage cache or default
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

    // 1. Immediately update localStorage cache so UI updates instantaneously
    try {
      const cached = await db.getFleetUpdates();
      const updatedList = [flat, ...cached.filter(item => item.id !== id)];
      localStorage.setItem('reach_fleet_updates', JSON.stringify(updatedList));
    } catch(e) {}

    // 2. Persist to Supabase if available
    if (supabase) {
      try {
        await supabase.from('fleet_updates').upsert([flat]);
      } catch (err) {}
    }

    // 3. Persist to Firestore
    try {
      await setDoc(doc(dbFS, 'fleet_updates', id), flat);
    } catch (e) {}

    return flat;
  },

  updateFleetUpdate: async (id, updateData) => {
    const flat = {};
    if (updateData.name !== undefined) flat.name = updateData.name;
    if (updateData.tierLabel !== undefined) flat.tierlabel = updateData.tierLabel;
    if (updateData.tag !== undefined) flat.tag = updateData.tag;
    if (updateData.desc !== undefined) flat.desc = updateData.desc;
    if (updateData.image !== undefined) flat.image = updateData.image;

    // Update local cache
    try {
      const cached = await db.getFleetUpdates();
      const updatedList = cached.map(item => item.id === id ? { ...item, ...flat, tierLabel: flat.tierlabel || item.tierLabel } : item);
      localStorage.setItem('reach_fleet_updates', JSON.stringify(updatedList));
    } catch(e) {}

    if (supabase) {
      try {
        await supabase.from('fleet_updates').update(flat).eq('id', id);
      } catch(err) {}
    }

    try {
      await updateDoc(doc(dbFS, 'fleet_updates', id), flat);
    } catch (e) {}
  },

  deleteFleetUpdate: async (id) => {
    try {
      const cached = await db.getFleetUpdates();
      const updatedList = cached.filter(item => item.id !== id);
      localStorage.setItem('reach_fleet_updates', JSON.stringify(updatedList));
    } catch(e) {}

    if (supabase) {
      try {
        await supabase.from('fleet_updates').delete().eq('id', id);
      } catch(err) {}
    }

    try {
      await deleteDoc(doc(dbFS, 'fleet_updates', id));
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // ARTICLES
  // -------------------------------------------------------------
  getArticles: async () => {
    // 1. Try Supabase first
    try {
      if (supabase) {
        const { data, error } = await supabase.from('articles').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(art => ({
            ...art,
            readTime: art.readtime || art.readTime
          })).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        }
      }
    } catch (err) {
      console.warn('Supabase articles error:', err);
    }

    // 2. Try Firestore
    try {
      const querySnapshot = await getDocs(collection(dbFS, 'articles'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      if (data.length > 0) {
        return data.map(art => ({
          ...art,
          readTime: art.readtime || art.readTime
        })).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      }
    } catch (e) {}

    return DEFAULT_ARTICLES;
  },

  addArticle: async (article) => {
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

    if (supabase) {
      try {
        await supabase.from('articles').upsert([flatArticle]);
      } catch (err) {
        console.warn('Supabase article upsert warning:', err);
      }
    }

    try {
      await setDoc(doc(dbFS, 'articles', article.id), flatArticle);
    } catch (e) {
      console.warn('Firestore addArticle warning:', e);
    }
    return flatArticle;
  },

  updateArticle: async (id, updates) => {
    const flat = {};
    if (updates.title !== undefined) flat.title = updates.title;
    if (updates.category !== undefined) flat.category = updates.category;
    if (updates.readTime !== undefined || updates.readtime !== undefined) flat.readtime = updates.readTime || updates.readtime;
    if (updates.summary !== undefined) flat.summary = updates.summary;
    if (updates.image !== undefined) flat.image = updates.image;
    if (updates.content !== undefined) flat.content = updates.content;
    if (updates.date !== undefined) flat.date = updates.date;

    if (supabase) {
      try {
        await supabase.from('articles').update(flat).eq('id', id);
      } catch (err) {}
    }

    try {
      await updateDoc(doc(dbFS, 'articles', id), flat);
    } catch (e) {}
  },

  deleteArticle: async (id) => {
    if (supabase) {
      try {
        await supabase.from('articles').delete().eq('id', id);
      } catch (err) {}
    }
    try {
      await deleteDoc(doc(dbFS, 'articles', id));
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // BOOKINGS
  // -------------------------------------------------------------
  getBookings: async () => {
    // 1. Try Supabase first
    try {
      if (supabase) {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
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
        }
      }
    } catch (err) {
      console.warn('Supabase getBookings error:', err);
    }

    // 2. Try Firestore
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
      return [];
    }
  },

  addBooking: async (booking) => {
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

    if (supabase) {
      try {
        await supabase.from('bookings').insert([flatBooking]);
      } catch (err) {
        console.warn('Supabase booking insert warning:', err);
      }
    }

    try {
      await setDoc(doc(dbFS, 'bookings', booking.bookingRef), flatBooking);
    } catch (e) {}
  },

  updateBookingStatus: async (bookingRef, status, extraData = {}) => {
    const updatePayload = { status };
    if (extraData.dispatchTime !== undefined) updatePayload.dispatchtime = extraData.dispatchTime;
    if (extraData.driver_id !== undefined) updatePayload.driver_id = extraData.driver_id;
    if (extraData.endTime !== undefined) updatePayload.endtime = extraData.endTime;
    if (extraData.assigned_vehicle_id !== undefined) updatePayload.assigned_vehicle_id = extraData.assigned_vehicle_id;
    if (extraData.assigned_license_plate !== undefined) updatePayload.assigned_license_plate = extraData.assigned_license_plate;

    if (supabase) {
      try {
        await supabase.from('bookings').update(updatePayload).eq('bookingref', bookingRef);
      } catch (err) {}
    }

    try {
      await updateDoc(doc(dbFS, 'bookings', bookingRef), updatePayload);
    } catch (e) {}
  },

  updateBookingExtension: async (bookingRef, extensionData) => {
    if (supabase) {
      try {
        await supabase.from('bookings').update({ extension: extensionData }).eq('bookingref', bookingRef);
      } catch (err) {}
    }

    try {
      await updateDoc(doc(dbFS, 'bookings', bookingRef), { extension: extensionData });
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // CHAUFFEURS / DRIVERS
  // -------------------------------------------------------------
  getDrivers: async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('drivers').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {}
    }

    try {
      const querySnapshot = await getDocs(collection(dbFS, 'drivers'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data;
    } catch (e) {
      return [];
    }
  },

  getDriver: async (id) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('drivers').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (err) {}
    }

    try {
      const docSnap = await getDoc(doc(dbFS, 'drivers', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  addDriver: async (driver) => {
    if (supabase) {
      try {
        await supabase.from('drivers').upsert([driver]);
      } catch (err) {}
    }

    try {
      await setDoc(doc(dbFS, 'drivers', driver.id), driver);
    } catch (e) {}
  },

  updateDriverLocation: async (id, lat, lng) => {
    if (supabase) {
      try {
        await supabase.from('drivers').update({ current_lat: lat, current_lng: lng }).eq('id', id);
      } catch (err) {}
    }

    try {
      await updateDoc(doc(dbFS, 'drivers', id), { current_lat: lat, current_lng: lng });
    } catch (e) {}
  },

  deleteDriver: async (id) => {
    if (supabase) {
      try {
        await supabase.from('drivers').delete().eq('id', id);
      } catch (err) {}
    }

    try {
      await deleteDoc(doc(dbFS, 'drivers', id));
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // CORPORATE ACCOUNTS
  // -------------------------------------------------------------
  getCorpAccounts: async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('corporate_accounts').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
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
        }
      } catch (err) {}
    }

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
      return [];
    }
  },

  registerCorpAccount: async (account) => {
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

    if (supabase) {
      try {
        await supabase.from('corporate_accounts').upsert([flatAccount]);
      } catch (err) {}
    }

    try {
      await setDoc(doc(dbFS, 'corporate_accounts', account.email), flatAccount);
    } catch (e) {}
  },

  updateCorpAccount: async (email, updates) => {
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

    if (supabase) {
      try {
        await supabase.from('corporate_accounts').update(flatUpdates).eq('email', email);
      } catch (err) {}
    }

    try {
      await updateDoc(doc(dbFS, 'corporate_accounts', email), flatUpdates);
    } catch (e) {}
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
    if (supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'payment_details').single();
        if (!error && data && data.value) return data.value;
      } catch (err) {}
    }

    try {
      const docSnap = await getDoc(doc(dbFS, 'settings', 'payment_details'));
      if (docSnap.exists()) {
        return docSnap.data().value || {};
      }
    } catch (e) {}

    return {
      bankName: 'Sterling Corporate Bank',
      accountNo: '009 812 3456',
      accountName: 'Reach Chauffeur Executive Ltd'
    };
  },

  updatePaymentSettings: async (settings) => {
    if (supabase) {
      try {
        await supabase.from('settings').upsert([{ id: 'payment_details', value: settings }]);
      } catch (err) {}
    }
    try {
      await setDoc(doc(dbFS, 'settings', 'payment_details'), { value: settings });
    } catch (e) {}
  },

  getPricingSettings: async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'pricing_details').single();
        if (!error && data && data.value) return data.value;
      } catch (err) {}
    }

    try {
      const docSnap = await getDoc(doc(dbFS, 'settings', 'pricing_details'));
      if (docSnap.exists()) {
        return docSnap.data().value || {};
      }
    } catch (e) {}

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
    if (supabase) {
      try {
        await supabase.from('settings').upsert([{ id: 'pricing_details', value: settings }]);
      } catch (err) {}
    }
    try {
      await setDoc(doc(dbFS, 'settings', 'pricing_details'), { value: settings });
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // PROMO CODES
  // -------------------------------------------------------------
  getPromoCodes: async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('promo_codes').select('*');
        if (!error && Array.isArray(data) && data.length > 0) return data;
      } catch (err) {}
    }

    try {
      const querySnapshot = await getDocs(collection(dbFS, 'promo_codes'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data;
    } catch (e) {
      return [];
    }
  },

  addPromoCode: async (promoData) => {
    if (supabase) {
      try {
        await supabase.from('promo_codes').upsert([promoData]);
      } catch (err) {}
    }
    try {
      await setDoc(doc(dbFS, 'promo_codes', promoData.id), promoData);
    } catch (e) {}
  },

  updatePromoCode: async (id, updates) => {
    if (supabase) {
      try {
        await supabase.from('promo_codes').update(updates).eq('id', id);
      } catch (err) {}
    }
    try {
      await updateDoc(doc(dbFS, 'promo_codes', id), updates);
    } catch (e) {}
  },

  deletePromoCode: async (id) => {
    if (supabase) {
      try {
        await supabase.from('promo_codes').delete().eq('id', id);
      } catch (err) {}
    }
    try {
      await deleteDoc(doc(dbFS, 'promo_codes', id));
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // MEDIA UPLOADS (Direct Supabase bucket upload or compressed Base64 fallback)
  // -------------------------------------------------------------
  uploadMedia: async (file) => {
    if (!file) return null;

    // 1. Try uploading to Supabase Storage bucket 'reach_media'
    if (supabase && typeof supabase.storage?.from === 'function') {
      try {
        const cleanName = (file.name || 'upload')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .toLowerCase();
        const fileName = `${Date.now()}_${cleanName}`;
        
        const { data, error } = await supabase.storage
          .from('reach_media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('reach_media')
            .getPublicUrl(fileName);
          
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload error, falling back to base64 compression:', storageErr);
      }
    }

    // 2. Client-side compressed Base64 fallback
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
    if (supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 'adminAuth').single();
        if (!error && data && data.value) return data.value;
      } catch (err) {}
    }

    try {
      const docSnap = await getDoc(doc(dbFS, 'settings', 'adminAuth'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {}

    return { email: 'reachchauffeur@gmail.com', password: 'reach2026' };
  },

  updateAdminAuth: async (authData) => {
    if (supabase) {
      try {
        await supabase.from('settings').upsert([{ id: 'adminAuth', value: authData }]);
      } catch (err) {}
    }
    try {
      await setDoc(doc(dbFS, 'settings', 'adminAuth'), authData);
      return true;
    } catch (e) {
      return false;
    }
  }
};
