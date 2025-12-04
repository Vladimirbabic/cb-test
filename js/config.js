const SUPABASE_URL = 'https://kbtvduhjskwiqpcxdquq.supabase.co';

// IMPORTANT: Replace the string below with your actual Anon Key from the "Churnbuddy test site" project
// Settings > API > Project API keys > anon public
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; 

// Ensure global supabase object is available (it comes from the CDN script)
if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase client library not loaded. Check your internet connection or CDN URL.');
}
