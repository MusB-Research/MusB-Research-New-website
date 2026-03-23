// ─────────────────────────────────────────────────────────
//  Auth Utilities — Fix #1: HttpOnly Cookie-based storage
//  Tokens are now set as HttpOnly cookies by the backend.
//  The frontend no longer reads token values directly —
//  the browser sends them automatically on every request.
// ─────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '';

/** 
 * getToken is now VOLATILE.
 * We use sessionStorage exclusively so that closing the tab 
 * or "cutting" the session automatically clears the token.
 */
export const getToken = () => sessionStorage.getItem('access');
export const getRole = () => (sessionStorage.getItem('role') || '').toUpperCase();

/** Keep the user object in sessionStorage ONLY. */
export const getUser = () => {
    try {
        const raw = sessionStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
};

/**
 * Called after a successful login. 
 * We use sessionStorage to ensure the session dies with the tab.
 */
export const saveToken = (token: string, role: string, modules?: string) => {
    // Clear any persistent keys to enforce new session-only rule
    localStorage.clear(); 
    
    if (token) {
        sessionStorage.setItem('access', token);
    }
    
    sessionStorage.setItem('role', role);
    if (modules) sessionStorage.setItem('modules', modules);
};

export const saveUser = (user: any) => {
    const userStr = JSON.stringify(user);
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
    } catch (e) { console.warn("Logout ping failed", e); }

    sessionStorage.clear();
    localStorage.clear();

    // Clear session cookies
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
};

export const performLogout = async () => {
    const role = getRole();
    await clearToken();
    if (role === 'SUPER_ADMIN') {
        window.location.href = '/mainframe/restricted-auth';
    } else {
        window.location.href = '/signin';
    }
};

export const isLoggedIn = () => !!getRole();

export const redirectToLogin = () => {
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
    
    // Attach Bearer token ONLY if it exists locally. 
    // If not, we rely entirely on the HttpOnly cookie attached via credentials:'include'.
    if (token && !authHeaders['Authorization']) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: authHeaders,
    });

    if (response.status === 401) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
            const newToken = getToken();
            if (newToken) authHeaders['Authorization'] = `Bearer ${newToken}`;
            
            return fetch(url, {
                ...options,
                credentials: 'include',
                headers: authHeaders,
            });
        }
        await clearToken();
        redirectToLogin();
    }

    return response;
};

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
