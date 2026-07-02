-- Create drivers table for chauffeur management and live telemetry
CREATE TABLE drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'Executive',
  rating NUMERIC DEFAULT 5.0,
  current_lat NUMERIC DEFAULT 6.45407,
  current_lng NUMERIC DEFAULT 3.4246,
  status TEXT DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add driver_id to bookings table to link assignments
ALTER TABLE bookings ADD COLUMN driver_id TEXT REFERENCES drivers(id);

-- Enable Supabase Realtime for the drivers table so the map updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
