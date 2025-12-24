import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars without crashing if import.meta is not fully defined
const getEnv = (key: string) => {
  try {
    return (import.meta as any).env?.[key] || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Log warning if credentials are missing, but DO NOT hardcode fallbacks in production code.
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.warn("Supabase credentials missing in .env file. Database features will be disabled.");
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');