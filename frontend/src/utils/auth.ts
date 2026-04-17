/**
 * Authentication & Security Utilities
 * Handles JWT storage, encryption fallbacks, and role-based pathing.
 */

// COOKIE MANAGEMENT
export const setCookie = (name: string, value: string, days: number = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const getCookie = (name: string) => {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
};

export const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// CACHE MANAGEMENT
const _apiCache = new Map<string, { data: any; expiry: number }>();
const CACHE_DURATION = 5000; // 5 seconds default cache for repeating GETs

export const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://musb-research-new-website.onrender.com' : 'http://localhost:8000');

interface User {
    id: string;
    email: string;
    full_name?: string;
    decrypted_name?: string;
    first_name?: string;
    last_name?: string;
    role: string;
    [key: string]: any;
}

// TOKEN MANAGEMENT

export const saveTokens = (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};

// Compatibility Alias for legacy components
export const saveToken = (access: string, role?: string, ignored?: any, refresh?: string) => {
    saveTokens(access, refresh || '');
};

export const saveUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    deleteCookie('access_token');
    deleteCookie('refresh_token');
};

export const getToken = () => localStorage.getItem('access_token');
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const getUser = (): User | null => {
    const u = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    try {
        const parsedNode = u ? JSON.parse(u) : null;
        if (parsedNode && token) {
            // Reconstruct ID from token payload without needing a full logout cycle
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload && payload.sub) {
                    parsedNode.id = payload.sub;
                }
            } catch (e) {
                // Ignore silent parsing failures
            }
        }
        return parsedNode;
    } catch (e) {
        return null;
    }
};

export const isLoggedIn = () => !!getAccessToken();
export const getRole = () => getUser()?.role || '';

export const performLogout = () => {
    clearAuth();
    redirectToLogin();
};

export const redirectToLogin = () => {
    window.location.href = '/signin';
};

// ── REFRESH SYNCHRONIZATION ──────────────────────────────
let _refreshPromise: Promise<boolean> | null = null;

// API HELPERS (WITH AUTH)

export async function authFetch(url: string, options: any = {}) {
    const method = options.method || 'GET';
    const isCacheable = method.toUpperCase() === 'GET' && !options.skipCache;
    
    // Ensure URL is absolute if it starts with /
    const fullUrl = url.startsWith('/') ? `${API}${url}` : url;

    // 1. Check Memory Cache
    if (isCacheable) {
        const cached = _apiCache.get(fullUrl);
        if (cached && cached.expiry > Date.now()) {
            return cached.data.clone(); // Return clone to prevent shared state issues
        }
    }

    let accessToken = getAccessToken();
    
    const headers: Record<string, string> = {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        ...options.headers
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
        response = await fetch(fullUrl, { ...options, headers });
        
        // Handle 401 Unauthorized (Token Expiry)
        if (response.status === 401 && getRefreshToken()) {
            // Check if a refresh is already in progress
            if (!_refreshPromise) {
                _refreshPromise = tryRefresh().finally(() => {
                    _refreshPromise = null;
                });
            }

            const refreshed = await _refreshPromise;
            if (refreshed) {
                const newAccessToken = getAccessToken();
                const retryHeaders = { 
                    ...headers, 
                    'Authorization': `Bearer ${newAccessToken}` 
                };
                response = await fetch(fullUrl, { ...options, headers: retryHeaders });
            } else {
                performLogout();
            }
        }

        // 2. Hydrate Cache if successful
        if (isCacheable && response.ok) {
            _apiCache.set(fullUrl, {
                data: response.clone(),
                expiry: Date.now() + CACHE_DURATION
            });
        }

        return response;
    } catch (error) {
        console.error(`Fetch error at ${fullUrl}:`, error);
        throw error;
    }
}

async function tryRefresh() {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
        const res = await fetch(`${API}/api/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });

        if (res.ok) {
            const data = await res.json();
            saveTokens(data.access, data.refresh);
            if (data.user) saveUser(data.user);
            return true;
        }
    } catch (e) {
        console.error("Refresh failed:", e);
    }
    return false;
}

// IDENTITY & DECRYPTION

export const getDisplayName = (u: User | null): string => {
    if (!u) return 'User';
    
    const isEncrypted = (s: any) => typeof s === 'string' && s.toUpperCase().startsWith('GAAAA') && s.length > 40;

    if (u.decrypted_name && !isEncrypted(u.decrypted_name)) {
        return u.decrypted_name.split(' ')[0];
    }

    const fullName = u.full_name || '';
    if (fullName && !isEncrypted(fullName)) {
        return fullName.split(' ')[0];
    }

    const email = u.email || '';
    if (email) {
        return email.split('@')[0];
    }

    return 'User';
};

export function revealValue(val: any, decryptedVal?: any): string {
    const isEncrypted = (s: any) => typeof s === 'string' && s.toUpperCase().startsWith('GAAAA');
    
    if (decryptedVal && typeof decryptedVal === 'string' && !isEncrypted(decryptedVal)) {
        return decryptedVal.trim();
    }
    
    if (val && typeof val === 'string' && !isEncrypted(val)) {
        return val.trim();
    }
    
    return '';
}

// NAVIGATION

export const getDashboardPath = (role: string) => {
    const r = (role || '').toUpperCase();
    switch (r) {
        case 'SUPER_ADMIN': return '/mainframe/terminal';
        case 'ADMIN':       return '/admin/dashboard';
        case 'COORDINATOR': return '/coordinator/dashboard';
        case 'PI':          return '/pi/dashboard';
        case 'PARTICIPANT': return '/portal/dashboard';
        case 'SPONSOR':     return '/sponsor/dashboard';
        default:            return '/signin';
    }
};

// COMPATIBILITY ALIASES
export const clearToken = clearAuth;
