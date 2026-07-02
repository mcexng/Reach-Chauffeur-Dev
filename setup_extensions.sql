ALTER TABLE bookings ADD COLUMN IF NOT EXISTS endtime TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extension JSONB;

-- Set a default end time for currently active rides so the timer shows up!
UPDATE bookings 
SET endtime = NOW() + INTERVAL '24 hours' 
WHERE status = 'Chauffeur Dispatched' AND endtime IS NULL;
