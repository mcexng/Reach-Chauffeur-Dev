-- Enable Realtime for the bookings table
-- This allows the Tracking page to instantly receive updates when the Admin approves a booking
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
