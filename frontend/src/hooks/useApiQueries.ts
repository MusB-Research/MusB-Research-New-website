import { useQuery } from '@tanstack/react-query';
import { authFetch, API } from '../utils/auth';

// Define reusable API fetch functions
const fetchStudies = async () => {
    const res = await authFetch(`${API}/api/studies/`);
    if (!res.ok) throw new Error('Failed to fetch studies');
    const data = await res.json();
    return data.results !== undefined ? data.results : data;
};

const fetchParticipants = async () => {
    const res = await authFetch(`${API}/api/participants/`);
    if (!res.ok) throw new Error('Failed to fetch participants');
    const data = await res.json();
    return data.results !== undefined ? data.results : data;
};

const fetchStaffTasks = async () => {
    const res = await authFetch(`${API}/api/staff-tasks/`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    return data.results !== undefined ? data.results : data;
};

const fetchNotifications = async () => {
    const res = await authFetch(`${API}/api/notifications/`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const data = await res.json();
    return data.results !== undefined ? data.results : data;
};

const fetchUsers = async () => {
    const res = await authFetch(`${API}/api/users/?limit=100`);
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.results !== undefined ? data.results : data;
};

const fetchSponsorOrganizations = async () => {
    const res = await authFetch(`${API}/api/sponsor-organizations/?limit=50`);
    if (!res.ok) throw new Error('Failed to fetch sponsors');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
};

const fetchVisits = async () => {
    const res = await authFetch(`${API}/api/visits/?limit=50`);
    if (!res.ok) throw new Error('Failed to fetch visits');
    const data = await res.json();
    return data.results !== undefined ? data.results : data;
};

const fetchQuestionnaireSchedules = async () => {
    const res = await authFetch(`${API}/api/questionnaire-schedules/?limit=50`);
    if (!res.ok) throw new Error('Failed to fetch schedules');
    const data = await res.json();
    return data.results !== undefined ? data.results : data;
};

// Define reusable React Query Hooks
export function useStudies() {
    return useQuery({
        queryKey: ['studies'],
        queryFn: fetchStudies,
    });
}

export function useParticipants() {
    return useQuery({
        queryKey: ['participants'],
        queryFn: fetchParticipants,
    });
}

export function useTasks() {
    return useQuery({
        queryKey: ['tasks'],
        queryFn: fetchStaffTasks,
    });
}

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
    });
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });
}

export function useSponsorOrganizations() {
    return useQuery({
        queryKey: ['sponsor-organizations'],
        queryFn: fetchSponsorOrganizations,
    });
}

export function useVisits() {
    return useQuery({
        queryKey: ['visits'],
        queryFn: fetchVisits,
    });
}

export function useQuestionnaireSchedules() {
    return useQuery({
        queryKey: ['questionnaire-schedules'],
        queryFn: fetchQuestionnaireSchedules,
    });
}

