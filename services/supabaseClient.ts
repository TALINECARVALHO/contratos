
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access environment variables
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// Configuração com as credenciais fornecidas
// IMPORTANTE: Se o sistema não carrega dados, verifique se este subdomínio (fwcgnoqormklkqhwrrvk) ainda existe no seu painel Supabase.
export const supabaseUrl = getEnv('SUPABASE_URL') || 'https://fwcgnoqormklkqhwrrvk.supabase.co';
export const supabaseKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Y2dub3Fvcm1rbGtxaHdycnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MjY5NDgsImV4cCI6MjA4MDQwMjk0OH0.IqCMDf6X44uZ6kEqPU4bq2Xg-i32ereCk1ijGt8-68Q';

let client: SupabaseClient | null = null;

if (typeof supabaseUrl === 'string' && supabaseUrl.length > 10 && 
    typeof supabaseKey === 'string' && supabaseKey.length > 20) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log("Supabase Client initialized successfully.");
  } catch (error) {
    console.error('CRITICAL: Failed to initialize Supabase client:', error);
  }
} else {
  console.error('CRITICAL: Supabase credentials are missing or invalid format. Connection aborted.');
}

export const supabase = client;
