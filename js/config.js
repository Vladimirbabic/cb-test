const SUPABASE_URL = 'https://kbtvduhjskwiqpcxdquq.supabase.co';

// Supabase Anon Key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidHZkdWhqc2t3aXFwY3hkcXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTQ3NzksImV4cCI6MjA4MDM5MDc3OX0.VLoIG0y6jrzjvogBobc4_BOLNSRyHFMBGNSn-mMr6FA'; 

// Ensure global supabase object is available (it comes from the CDN script)
if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Supabase client library not loaded. Check your internet connection or CDN URL.');
}
