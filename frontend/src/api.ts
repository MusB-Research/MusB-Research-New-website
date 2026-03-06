// ============================================================
// API INTEGRATION LAYER
// ============================================================
import { getToken } from './utils/auth';

// @ts-ignore - Vite provides import.meta.env at runtime
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const headers: Record<string, string> = { ...(options?.headers as any) };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options?.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
        headers,
        ...options,
    });
    if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${errorBody || res.statusText}`);
    }
    return res.json();
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
    apiFetch<any>('/api/innovation/booklet-download/', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// ---- Newsletter ----

export const subscribeNewsletter = (email: string) =>
    apiFetch<any>('/api/newsletter/subscribe/', {
        method: 'POST',
        body: JSON.stringify({ email }),
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
