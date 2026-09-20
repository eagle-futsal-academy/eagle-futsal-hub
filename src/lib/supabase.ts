import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjlfkjmffcejjpyoxzct.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbGZram1mZmNlampweW94emN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTAwMTAsImV4cCI6MjEwNTI4NjAxMH0.j24P3srAW-ldmiyZX5y2DCl3ga9S-efBDMAx8M5J05I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const APP_NAME = 'EagleHub';
export const ACADEMY_NAME = 'Eagle Futsal Academy';
export const MY_TEAM_NAME = 'Eagle Futsal Academy';

// Helper to check if user is authenticated (admin)
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};
