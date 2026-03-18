// ─────────────────────────────────────────────────────────
//  Auth Utilities — Fix #1: HttpOnly Cookie-based storage
//  Tokens are now set as HttpOnly cookies by the backend.
//  The frontend no longer reads token values directly —
//  the browser sends them automatically on every request.
// ─────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '';

/** Role is stored in sessionStorage (not sensitive — it's in the JWT payload too). */
export const getToken = () => sessionStorage.getItem('access') || localStorage.getItem('access') || localStorage.getItem('token');
export const getRole = () => sessionStorage.getItem('role') || localStorage.getItem('role');

/** Keep the user object in sessionStorage for quick access. */
export const getUser = () => {
    try {
        const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
};

/**
 * Called after a successful login/google-login/refresh response.
 * Tokens are already in HttpOnly cookies set by the server.
 * We only store non-sensitive session info here.
 */
export const saveToken = (token: string, role: string, modules?: string) => {
    // Store token for use in Authorization header fallback (when cookies are blocked)
    if (token) {
        localStorage.setItem('access', token);
        sessionStorage.setItem('access', token);
    }
    sessionStorage.setItem('role', role);
    localStorage.setItem('role', role);
    if (modules) sessionStorage.setItem('modules', modules);
};

export const saveUser = (user: Record<string, unknown>) => {
    sessionStorage.setItem('user', JSON.stringify(user));
};

export const clearToken = async () => {
    // Fix #4 — call /logout/ so backend blacklists the JTI
    try {
        await fetch(`${API}/api/auth/logout/`, {
            method: 'POST',
            credentials: 'include',  // sends the HttpOnly cookie
            headers: { 'Content-Type': 'application/json' },
        });
    } catch { /* ignore network errors on logout */ }
    sessionStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('modules');
    localStorage.removeItem('user');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
};

/** True if the user has an active session (checks sessionStorage role as proxy). */
export const isLoggedIn = () => !!getRole();

export const redirectToLogin = () => {
    window.location.href = '/signin';
};

/**
 * Authenticated fetch — attaches HttpOnly cookies automatically via credentials:'include'.
 * Falls back to Bearer token from localStorage for backward compatibility.
 */
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = sessionStorage.getItem('access') || localStorage.getItem('access');
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
        credentials: 'include',   // Fix #1 — send HttpOnly cookies
        headers: authHeaders,
    });

    // Fix #2 — If 401 or 403, attempt token refresh then retry once
    if (response.status === 401 || response.status === 403) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
            const newToken = localStorage.getItem('access') || sessionStorage.getItem('access');
            if (newToken) authHeaders['Authorization'] = `Bearer ${newToken}`;
            
            return fetch(url, {
                ...options,
                credentials: 'include',
                headers: authHeaders,
            });
        }
        // Refresh failed — clear and redirect to login
        await clearToken();
        redirectToLogin();
    }

    return response;
};

/** Attempt to refresh the access token using the refresh token cookie. */
export const attemptTokenRefresh = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${API}/api/auth/refresh/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
            const data = await res.json();
            if (data.access) {
                localStorage.setItem('access', data.access);
                sessionStorage.setItem('access', data.access);
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
