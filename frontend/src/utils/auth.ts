
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
    window.location.href = "/signin";
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
