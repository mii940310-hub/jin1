import { PORTONE_CHANNEL_KEY, PORTONE_STORE_ID } from './portone-config';

export const REQUIRED_ENVS = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PORTONE_STORE_ID: PORTONE_STORE_ID,
    NEXT_PUBLIC_PORTONE_CHANNEL_KEY: PORTONE_CHANNEL_KEY,
};

export type EnvKey = keyof typeof REQUIRED_ENVS;

function isMissing(value: string | undefined) {
    return !value || value.includes('your_') || value === '';
}

export function getMissingEnvs(): EnvKey[] {
    return (Object.keys(REQUIRED_ENVS) as EnvKey[]).filter((key) => isMissing(REQUIRED_ENVS[key]));
}

export function validateEnvs() {
    const missing = getMissingEnvs();
    if (missing.length > 0) {
        console.error('❌ [MISSING ENV] The following environment variables are missing or not set:', missing.join(', '));
    }
}
