// ─────────────────────────────────────────────────────────────────────────────
//  Auth Utilities
//  Tokens are stored in localStorage/sessionStorage.
//  HttpOnly access_token cookie is sent automatically by the browser.
//  Key Fix: Global refresh mutex — only ONE refresh call can run at a time,
//           preventing 429 "Too Many Requests" when multiple concurrent API
//           calls all fail with 403 at the same time.
// ─────────────────────────────────────────────────────────────────────────────

const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocal && (!envUrl || envUrl.includes('localhost'))) {
        return 'https://musb-research-new-website.onrender.com';
    }

    return envUrl || 'http://localhost:8000';
};

const API = getApiUrl();
export { API };

// ─── GLOBAL REFRESH MUTEX ────────────────────────────────────────────────────
// This prevents multiple simultaneous refresh calls.
// All concurrent requests that need a refresh will queue behind this single promise.
let _refreshPromise: Promise<boolean> | null = null;
let _isRedirecting = false;

function getRefreshLock(): Promise<boolean> {
    if (_refreshPromise) {
        // Already refreshing — return the same promise so all callers wait on the same result
        return _refreshPromise;
    }
    _refreshPromise = attemptTokenRefresh().finally(() => {
        _refreshPromise = null; // Release lock when done
    });
    return _refreshPromise;
}
// ─────────────────────────────────────────────────────────────────────────────

export const getToken = () => {
    const t = localStorage.getItem('access') || sessionStorage.getItem('access');
    return (t === 'null' || t === 'undefined') ? null : t;
};
export const getRole = () => (localStorage.getItem('role') || sessionStorage.getItem('role') || '').toUpperCase();

export const getUser = () => {
    try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
};

export const saveToken = (token: string, role: string, modules?: string, refresh?: string) => {
    if (token) {
        localStorage.setItem('access', token);
        sessionStorage.setItem('access', token);
    }
    if (refresh) {
        localStorage.setItem('refresh', refresh);
    }
    localStorage.setItem('role', role);
    sessionStorage.setItem('role', role);
    if (modules) {
        localStorage.setItem('modules', modules);
        sessionStorage.setItem('modules', modules);
    }
};

export const saveUser = (user: any) => {
    const userStr = JSON.stringify(user);
    localStorage.setItem('user', userStr);
    sessionStorage.setItem('user', userStr);
    window.dispatchEvent(new Event('storage'));
};

export const clearToken = async () => {
    try {
        await fetch(`${API}/api/auth/logout/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.warn('Logout ping failed', e);
    }

    // Always clear storage even if the API logout fails
    sessionStorage.clear();
    localStorage.clear();
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
};

export const performLogout = async () => {
    if (_isRedirecting) return;
    _isRedirecting = true;
    
    const role = getRole();
    await clearToken();
    
    // Crucial: Dispatch storage event so other components know the state wiped
    window.dispatchEvent(new Event('storage'));

    if (role === 'SUPER_ADMIN') {
        window.location.href = '/mainframe/restricted-auth';
    } else {
        window.location.href = '/signin';
    }
};

export const isLoggedIn = () => !!getRole();

export const redirectToLogin = () => {
    if (_isRedirecting) return;
    _isRedirecting = true;
    if (window.location.pathname.startsWith('/mainframe') || window.location.pathname.includes('/super-admin')) {
        window.location.href = '/mainframe/restricted-auth';
    } else {
        window.location.href = '/signin';
    }
};

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getToken();
    const authHeaders: Record<string, string> = {
        ...options.headers as Record<string, string>,
    };

    if (!(options.body instanceof FormData) && !authHeaders['Content-Type']) {
        authHeaders['Content-Type'] = 'application/json';
    }

    if (token && !authHeaders['Authorization']) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: authHeaders,
    });

    // On 401 or 403, attempt ONE refresh (using the global mutex)
    if (response.status === 401 || response.status === 403) {
        const refreshed = await getRefreshLock();

        if (refreshed) {
            // Refresh succeeded — rebuild headers with new token and retry ONCE
            const newToken = getToken();
            const retryHeaders = { ...authHeaders };
            if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;

            const retryResponse = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: retryHeaders,
            });

            // If retry still fails, the session is genuinely dead — redirect
            if (retryResponse.status === 401 || retryResponse.status === 403) {
                await clearToken();
                redirectToLogin();
            }

            return retryResponse;
        }

        // Refresh failed — session is expired and refresh token is gone too
        await clearToken();
        redirectToLogin();
    }

    return response;
};

export const attemptTokenRefresh = async (): Promise<boolean> => {
    try {
        const storedRefresh = localStorage.getItem('refresh');
        
        const reqBody = storedRefresh ? JSON.stringify({ refresh: storedRefresh }) : undefined;
        
        const res = await fetch(`${API}/api/auth/refresh/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
        });

        if (res.ok) {
            const data = await res.json();
            if (data.access) {
                localStorage.setItem('access', data.access);
                sessionStorage.setItem('access', data.access);
            }
            if (data.refresh) {
                localStorage.setItem('refresh', data.refresh);
            }
            if (data.user?.role) {
                sessionStorage.setItem('role', data.user.role);
                localStorage.setItem('role', data.user.role);
            }
            return true;
        }

        return false;
    } catch {
        return false;
    }
};

/**
 * Returns a human-friendly "First Name" or "Display Name" for any user object.
 * Logic:
 * - Sponsors: Use first word of Organization name if available.
 * - Others: Use first_name if available.
 * - Fallback: Use first word of full_name or name.
 * - Last Fallback: Email prefix or 'User'.
 */
export const getDisplayName = (u: any): string => {
    if (!u) return 'User';
    
    // Normalize role and check for encryption markers
    const role = (u.role || '').toUpperCase();
    const isEncrypted = (s: any) => typeof s === 'string' && s.startsWith('gAAAA') && s.length > 40;

    // helper to clean and return first word
    const firstWord = (s: any) => {
        if (!s || typeof s !== 'string' || isEncrypted(s)) return null;
        const trimmed = s.trim();
        if (!trimmed || trimmed.includes('@')) return null; // Skip if it's an email
        return trimmed.split(/\s+/)[0];
    };

    // 1. Resolve for Sponsors (Organization/Company priority)
    if (role === 'SPONSOR') {
        const org = firstWord(u.organization || u.company);
        if (org) return org;
    }

    // 2. Comprehensive check for First Name across various possible keys
    const first = firstWord(u.first_name) || 
                  firstWord(u.decrypted_first_name) || 
                  firstWord(u.given_name) || 
                  firstWord(u.firstName) || 
                  firstWord(u.displayName);
    if (first) return first;

    // 3. Fallback to Full Name parsing
    const full = firstWord(u.full_name) || 
                 firstWord(u.name) || 
                 firstWord(u.decrypted_name) || 
                 firstWord(u.fullName);
    if (full) return full;

    // 4. Final fallback: Email prefix
    const email = u.email || '';
    if (email) {
        // Return the clean prefix (before @)
        return email.split('@')[0];
    }

    return 'User';
};

/**
 * Reveals a potentially encrypted value, favoring the decrypted_ prefix version
 * if the primary value is encrypted. Returns empty string if no valid value is found.
 */
export const revealValue = (val: any, decryptedVal?: any): string => {
    const isEncrypted = (s: any) => typeof s === 'string' && s.startsWith('gAAAA') && s.length > 40;
    
    // If the base value is valid and not encrypted, use it
    if (val && typeof val === 'string' && !isEncrypted(val)) {
        return val.trim();
    }
    
    // If encrypted or missing, try the decrypted version if provided
    if (decryptedVal && typeof decryptedVal === 'string' && !isEncrypted(decryptedVal)) {
        return decryptedVal.trim();
    }
    
    return '';
};
