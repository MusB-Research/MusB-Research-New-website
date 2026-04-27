// ============================================================
// API INTEGRATION LAYER
// ============================================================
import { authFetch, getToken, API as API_BASE } from './utils/auth';

async function apiFetch<T>(endpoint: string, options?: RequestInit & { skipCache?: boolean }): Promise<T> {
    const res = await authFetch(endpoint, options);
    
    if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${errorBody || res.statusText}`);
    }
    if (res.status === 204) {
        return {} as T;
    }
    const json = await res.json();
    if (json && typeof json === 'object' && Array.isArray((json as any).results)) {
        return (json as any).results as T;
    }
    return json as T;
}

// ---- Page Settings (singletons) ----

export const fetchHomeSettings = () => apiFetch<any>('/api/home/settings/');
export const fetchSupportSettings = () => apiFetch<any>('/api/support/settings/');
export const fetchAboutSettings = () => apiFetch<any>('/api/about/settings/');
export const fetchInnovationSettings = () => apiFetch<any>('/api/innovation/settings/');

// ---- Contact (separate Django app) ----

export const fetchContactSettings = () => apiFetch<any>('/api/contact/settings/');
export const fetchContactFormConfig = () => apiFetch<any>('/api/contact/form-config/');
export const fetchInquiryTypes = () => apiFetch<any[]>('/api/contact/inquiry-types/');
export const submitContactForm = (data: Record<string, any>) =>
    apiFetch<any>('/api/contact/submit/', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// ---- Content Lists ----

export const fetchCapabilities = () => apiFetch<any[]>('/api/capabilities/');
export const fetchFacilities = () => apiFetch<any[]>('/api/facilities/');
export const fetchPartners = (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return apiFetch<any[]>(`/api/partners/${qs}`);
};
export const fetchCertifications = () => apiFetch<any[]>('/api/certifications/');

// ---- News & Events ----

export const fetchNews = (type?: string, search?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<any[]>(`/api/news/${qs}`);
};
export const fetchNewsDetail = (id: string) => apiFetch<any>(`/api/news/${id}/`);
export const fetchEventDetail = (id: string) => apiFetch<any>(`/api/events/${id}/`);

// ---- Careers ----

export const fetchCareerCategories = () => apiFetch<any[]>('/api/careers/categories/');
export const fetchJobOpenings = (filters?: { department?: string; type?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.department) params.set('department', filters.department);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<any[]>(`/api/careers/jobs/${qs}`);
};
export const fetchJobDetail = (id: string) => apiFetch<any>(`/api/careers/jobs/${id}/`);
export const submitJobApplication = (data: FormData) =>
    apiFetch<any>('/api/careers/apply/', {
        method: 'POST',
        body: data,
    });

// ---- Studies / Clinical Trials ----

export const fetchStudies = (condition?: string, status?: string, isPaid?: boolean, isFreeTesting?: boolean) => {
    const params = new URLSearchParams();
    if (condition) params.set('condition', condition);
    if (status) params.set('status', status);
    if (isPaid !== undefined) params.set('is_paid', String(isPaid));
    if (isFreeTesting !== undefined) params.set('is_free_testing', String(isFreeTesting));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<any[]>(`/api/studies/${qs}`);
};

// ---- Team ----

export const fetchTeamMembers = () => apiFetch<any[]>('/api/team/members/');
export const fetchAdvisors = () => apiFetch<any[]>('/api/team/advisors/');
export const fetchCollaborators = () => apiFetch<any[]>('/api/team/collaborators/');
export const fetchStaffMembers = () => apiFetch<any[]>('/api/team/staff/');

// ---- Innovation ----

export const fetchTechnologies = () => apiFetch<any[]>('/api/innovation/technologies/');
export const fetchTechnologyDetail = (id: string) => apiFetch<any>(`/api/innovation/technologies/${id}/`);
export const submitSponsorInquiry = (data: Record<string, any>) =>
    apiFetch<any>('/api/innovation/inquiry/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
export const submitBookletDownload = (data: Record<string, any>) =>
    apiFetch<any>('/api/booklet-download/', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// ---- Newsletter ----

export const subscribeNewsletter = (email: string, userType: string) =>
    apiFetch<any>('/api/newsletter/subscribe/', {
        method: 'POST',
        body: JSON.stringify({ email, userType }),
    });

// ============================================================
// FACILITIES PAGE (Rebuild)
// ============================================================

export const fetchFacilitiesPageData = () => apiFetch<any>('/api/facilities-page/');
export const submitFacilityInquiry = (data: Record<string, any>) =>
    apiFetch<any>('/api/facilities-inquiry/', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const fetchNotifications = (isRead?: boolean) => {
    const params = new URLSearchParams();
    if (isRead !== undefined) params.set('is_read', String(isRead));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<any[]>(`/api/notifications/${qs}`);
};

export const markNotificationRead = (id: string) => 
    apiFetch<any>(`/api/notifications/${id}/read/`, { method: 'POST' });

export const markAllNotificationsRead = () => 
    apiFetch<any>('/api/notifications/read_all/', { method: 'POST' });

export const deleteNotification = (id: string) => 
    apiFetch<any>(`/api/notifications/${id}/`, { method: 'DELETE' });

export { apiFetch };


