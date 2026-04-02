import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

if (!isValidUrl(supabaseUrl) || !supabasePublicKey || supabaseUrl.includes('your_')) {
    console.warn('⚠️ Supabase URL or public key is missing or invalid. Please check your .env.local file.');
}

export const isSupabaseConfigured =
    isValidUrl(supabaseUrl) && Boolean(supabasePublicKey) && !supabaseUrl?.includes('your_');

// Ensure the client is only initialized if the URL is valid
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabasePublicKey)
    : (null as any); // Type cast to prevent breaks, but operations will fail gracefully
