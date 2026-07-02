import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kpdfbgtrsiwzfpxrpsbi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGZiZ3Ryc2l3emZweHJwc2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTcyOTcsImV4cCI6MjA5NzM5MzI5N30.OyE6iRgBSZUaRPeAT8N4ywjYU76AV4A70nRLJL8IJ7Y');

async function checkBookings() {
  const { data, error } = await supabase.from('bookings').select('*');
  console.log('Bookings:', data);
  if (error) console.error('Error:', error);
}

checkBookings();
