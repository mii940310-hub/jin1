import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if variables are valid URLs before creating client
const isValidUrl = (url: string | undefined): url is string => {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseUrl.includes('your_')) {
    console.warn('⚠️ Supabase URL or Anon Key is missing or invalid. Please check your .env.local file.');
}

// Ensure the client is only initialized if the URL is valid
export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey && !supabaseUrl.includes('your_')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any); // Type cast to prevent breaks, but operations will fail gracefully
