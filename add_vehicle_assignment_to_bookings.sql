ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_vehicle_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_license_plate TEXT;
