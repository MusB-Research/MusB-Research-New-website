import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, performLogout } from './auth';

/**
 * Centralized API Instance
 * Configured with credentials: true for cross-domain HttpOnly cookie support.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 
    ((import.meta as any).env?.PROD ? 'https://musbresearchwebsite.onrender.com' : 'http://localhost:8000');

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Crucial for cross-domain auth
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor: Attach Bearer Token
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle Token Refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                performLogout();
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
                    refresh: refreshToken
                }, { withCredentials: true });

                if (response.data.access) {
                    saveTokens(response.data.access, response.data.refresh || refreshToken);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                performLogout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
