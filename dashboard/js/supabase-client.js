// supabase-client.js — inicializa el cliente Supabase
// Estas keys son públicas (anon key) — la seguridad real está en las RLS policies de la base.

(function () {
  const SUPABASE_URL = 'https://jqnomnahoendyxyywegh.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxbm9tbmFob2VuZHl4eXl3ZWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzY1MjIsImV4cCI6MjA5MzA1MjUyMn0.-2afw1tCbVf1wpL6O_k-JBXS-_wu7VnRYH6rw_C7ydA';

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('Supabase SDK no cargó');
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();
