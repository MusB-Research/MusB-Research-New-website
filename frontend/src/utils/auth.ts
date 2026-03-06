const VCT_URL = "https://musb-research-vct.vercel.app";
const MAIN_URL = "https://musbresearchnewwebsite.vercel.app";

export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");

export const saveToken = (token: string, role: string, modules?: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    if (modules) localStorage.setItem("modules", modules);
};

export const clearToken = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("modules");
};

export const isLoggedIn = () => !!getToken();

export const redirectToLogin = () => {
    const callbackUrl = encodeURIComponent(
        window.location.href
    );
    window.location.href =
        `${VCT_URL}/signin?callbackUrl=${MAIN_URL}/auth/callback&source=MAIN`;
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    });
};
