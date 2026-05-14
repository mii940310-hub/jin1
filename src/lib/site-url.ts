const PRODUCTION_SITE_URL = 'https://www.shoongfarm.co.kr';

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

export function getSiteUrl() {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (configuredSiteUrl) {
        return trimTrailingSlash(configuredSiteUrl);
    }

    if (typeof window !== 'undefined') {
        const { hostname, origin } = window.location;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return origin;
        }
    }

    return PRODUCTION_SITE_URL;
}

function normalizePath(path: string) {
    if (!path) {
        return '/';
    }

    try {
        const parsed = new URL(path);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return path.startsWith('/') ? path : `/${path}`;
    }
}

export function getAuthRedirectUrl(path = '/') {
    return new URL(normalizePath(path), getSiteUrl()).toString();
}
