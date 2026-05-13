import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): url is string => {
    if (!url) {
        return false;
    }

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

if (!isValidUrl(supabaseUrl) || !supabasePublicKey || supabaseUrl.includes('your_')) {
    console.warn('Supabase URL or public key is missing or invalid. Please check your .env.local file.');
}

export const isSupabaseConfigured =
    isValidUrl(supabaseUrl) && Boolean(supabasePublicKey) && !supabaseUrl?.includes('your_');

function createConfiguredSupabaseClient() {
    return createClient(supabaseUrl!, supabasePublicKey!);
}

type SupabaseClientInstance = ReturnType<typeof createConfiguredSupabaseClient>;

const fallbackClient = new Proxy(
    {},
    {
        get() {
            throw new Error('Supabase is not configured. Please check your environment variables.');
        },
    },
) as SupabaseClientInstance;

export const supabase: SupabaseClientInstance = isSupabaseConfigured
    ? createConfiguredSupabaseClient()
    : fallbackClient;
