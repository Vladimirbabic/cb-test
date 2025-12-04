const SUPABASE_URL = 'https://kbtvduhjskwiqpcxdquq.supabase.co';

// API Key provided by user
const SUPABASE_ANON_KEY = 'sb_publishable_9Y9xbds48dYNGjsfJewonw_YMlIvB8W'; 

// Ensure global supabase object is available (it comes from the CDN script)
if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase client library not loaded. Check your internet connection or CDN URL.');
}
