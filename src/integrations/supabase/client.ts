// Firebase client that replaces Supabase client
// This maintains backward compatibility during migration
import { firebase } from '../firebase/client';

// Export firebase client as supabase for compatibility
export const supabase = firebase;

// Legacy Supabase client (commented out during migration)
/*
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://irghpvvoparqettcnpnh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo";

export const supabaseOriginal = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
*/