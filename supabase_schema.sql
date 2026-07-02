-- Supabase Schema for Reach Chauffeur

-- 1. Vehicles Table
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT NOT NULL,
    tierLabel TEXT NOT NULL,
    basePrice NUMERIC NOT NULL,
    standardPrice NUMERIC NOT NULL,
    image1 TEXT,
    image2 TEXT,
    image3 TEXT,
    videoUrl TEXT,
    wifi TEXT,
    refreshments TEXT,
    privacy TEXT,
    passengers INTEGER,
    luggage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Articles Table
CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    readTime TEXT,
    summary TEXT,
    image TEXT,
    content TEXT,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Bookings Table
CREATE TABLE bookings (
    bookingRef TEXT PRIMARY KEY,
    vehicle TEXT NOT NULL,
    personal JSONB NOT NULL,
    logistics JSONB NOT NULL,
    bookingType TEXT,
    totalCost NUMERIC NOT NULL,
    status TEXT NOT NULL,
    dispatchTime TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Corporate Accounts Table
CREATE TABLE corporate_accounts (
    email TEXT PRIMARY KEY,
    companyName TEXT NOT NULL,
    contactName TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    discountRate NUMERIC NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Initial Mock Data (Optional)
INSERT INTO vehicles (id, name, tier, tierLabel, basePrice, standardPrice, passengers, luggage) VALUES
('mb-sclass', 'Mercedes-Benz S-Class', 'sedan', 'Executive Sedan', 170000, 180000, 3, 2),
('esv-escalade', 'Cadillac Escalade ESV', 'suv', 'Executive SUV', 220000, 240000, 6, 6),
('rr-phantom', 'Rolls-Royce Phantom', 'presidential', 'Presidential Suite', 700000, 850000, 3, 2);
