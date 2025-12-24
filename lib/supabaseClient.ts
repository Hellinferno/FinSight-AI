import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars without crashing if import.meta is not fully defined
const getEnv = (key: string) => {
  try {
    return import.meta.env?.[key] || '';
  } catch (e) {
    return '';
  }
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Fallback to the provided values if env vars are missing
const DEFAULT_URL = 'https://aklcxwvmfpadhsmldjoj.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbGN4d3ZtZnBhZGhzbWxkam9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTQzMDMsImV4cCI6MjA4MjE3MDMwM30.OKm33jOSsx07DuYPPgKghRcgx2ryObPtsGNLwIPxeJE';

// Use env vars if available, otherwise use defaults
const supabaseUrl = (envUrl && envUrl.trim().length > 0) ? envUrl : DEFAULT_URL;
const supabaseAnonKey = (envKey && envKey.trim().length > 0) ? envKey : DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.warn("Supabase credentials missing. Auth and Cloud features will be disabled.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
