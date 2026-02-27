export const REQUIRED_ENVS = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export type EnvKey = keyof typeof REQUIRED_ENVS;

export function getMissingEnvs(): EnvKey[] {
    return (Object.keys(REQUIRED_ENVS) as EnvKey[]).filter(
        (key) => !REQUIRED_ENVS[key] || REQUIRED_ENVS[key].includes('your_') || REQUIRED_ENVS[key] === ''
    );
}

export function validateEnvs() {
    const missing = getMissingEnvs();
    if (missing.length > 0) {
        console.error('❌ [MISSING ENV] The following environment variables are missing or not set:', missing.join(', '));
    }
}
