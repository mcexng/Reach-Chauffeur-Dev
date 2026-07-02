import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kpdfbgtrsiwzfpxrpsbi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGZiZ3Ryc2l3emZweHJwc2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTcyOTcsImV4cCI6MjA5NzM5MzI5N30.OyE6iRgBSZUaRPeAT8N4ywjYU76AV4A70nRLJL8IJ7Y');

async function checkCorp() {
  const { data, error } = await supabase.from('corporate_accounts').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Fields:', Object.keys(data[0] || {}));
    console.log('Sample:', data[0]);
  }
}

checkCorp();
