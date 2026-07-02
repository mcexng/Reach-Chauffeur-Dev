-- 1. Create Promo Codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent NUMERIC NOT NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Add exact pricing and promo columns to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_airport NUMERIC DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_12hr NUMERIC DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_24hr NUMERIC DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_hourly NUMERIC DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS promo_active BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS promo_discount NUMERIC DEFAULT 0;
