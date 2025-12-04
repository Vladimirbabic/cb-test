const SUPABASE_URL = 'https://pqqxftklsxlrwrpozoeu.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Please replace with your actual Anon Key

// Ensure global supabase object is available (it comes from the CDN script)
if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase client library not loaded. Check your internet connection or CDN URL.');
}
