import { createClient } from '@supabase/supabase-js';

// Supabase client configuration with project defaults and env override
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kpdfbgtrsiwzfpxrpsbi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGZiZ3Ryc2l3emZweHJwc2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTcyOTcsImV4cCI6MjA5NzM5MzI5N30.OyE6iRgBSZUaRPeAT8N4ywjYU76AV4A70nRLJL8IJ7Y';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase is connected
export const isSupabaseConnected = () => {
  return !!supabase;
};
