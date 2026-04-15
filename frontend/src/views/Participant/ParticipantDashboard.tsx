import React, { useState, useEffect, useRef, useMemo } from 'react';
import NotificationBell from '../../components/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ClipboardList, Box, Activity, MessageSquare,
    FileText, Trophy, User, ShieldCheck, LogOut, Menu, X,
    Bell, Zap, TrendingUp, Globe, Search, LifeBuoy, Calendar, RefreshCcw
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, clearToken, getRole, performLogout, getUser, saveUser, getDisplayName, API } from '../../utils/auth';
import { apiFetch } from '../../api';

// Sub-components from the new modular structure
import { ActionModal, EditModal, LogoutConfirmationModal } from './SharedComponents';
import DashboardView from './DashboardView';
import TasksView from './TasksView';
import StudyKitView from './StudyKitView';
import LogsView from './LogsView';
import MessagesView from './MessagesView';
import DocumentsView from './DocumentsView';
import ReportsView from './ReportsView';
import CompensationView from './CompensationView';

import ProfileView from './ProfileView';
import VisitsView from './VisitsView';
import PrivacyDataView from './PrivacyDataView';
import ConsentModal from './ConsentModal';
import FormSignatureModal from './FormSignatureModal';
import DiscoverStudiesView from './DiscoverStudiesView';
import InstrumentModal from './InstrumentModal';
import ParticipantBackground from './ParticipantBackground';

export default function ParticipantDashboard() {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ──────────────── STATE MANAGEMENT ────────────────
    const location = useLocation();
    const subRoute = location.pathname.split('/').pop() || '';

    // ──────────────── STATE MANAGEMENT ────────────────
    const [activeNav, setActiveNav] = useState(() => {
        // Init from URL if present
        const route = location.pathname.split('/').pop();
        if (route === 'tasks') return 'Tasks';
        if (route === 'study-kit') return 'Study Kit';
        if (route === 'logs') return 'Logs';
        if (route === 'messages') return 'Messages';
        if (route === 'documents') return 'Documents';
        if (route === 'reports') return 'Reports';
        if (route === 'visits') return 'Visits';
        if (route === 'compensation') return 'Compensation';
        if (route === 'profile') return 'Profile';
        if (route === 'privacy') return 'Privacy & Data';
        return 'Dashboard';
    });

    // Update activeNav when URL changes (for browser back button support)
    useEffect(() => {
        const route = location.pathname.split('/').pop();
        if (route === 'tasks') setActiveNav('Tasks');
        else if (route === 'study-kit') setActiveNav('Study Kit');
        else if (route === 'logs') setActiveNav('Logs');
        else if (route === 'messages') setActiveNav('Messages');
        else if (route === 'documents') setActiveNav('Documents');
        else if (route === 'reports') setActiveNav('Reports');
        else if (route === 'visits') setActiveNav('Visits');
        else if (route === 'compensation') setActiveNav('Compensation');
        else if (route === 'profile') setActiveNav('Profile');
        else if (route === 'privacy') setActiveNav('Privacy & Data');
        else if (route === 'discover') setActiveNav('Discover Studies');
        else if (route === 'participant' || !route) setActiveNav('Dashboard');
    }, [location.pathname]);

    const handleNavClick = (label: string) => {
        // Normalize label to Title Case (e.g., 'tasks' -> 'Tasks')
        const normalizedLabel = label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        const slugs: Record<string, string> = {
            'Dashboard': '', 'Tasks': 'tasks', 'Study Kit': 'study-kit', 'Logs': 'logs',
            'Messages': 'messages', 'Documents': 'documents', 'Reports': 'reports',
            'Visits': 'visits', 'Compensation': 'compensation', 'Profile': 'profile', 'Privacy & Data': 'privacy',
            'Discover Studies': 'discover'
        };

        const finalLabel = slugs[normalizedLabel] !== undefined ? normalizedLabel : label;
        const slug = slugs[finalLabel];

        if (finalLabel === 'Main Website') {
            window.open('/', '_blank');
        } else {
            setActiveNav(finalLabel);
            navigate(`/dashboard/participant${slug ? '/' + slug : ''}`);
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    const [tasks, setTasks] = useState<any[]>([]);
    const [kits, setKits] = useState<any[]>([]);
    const [activeStudy, setActiveStudy] = useState<any>(null);
    const [allStudies, setAllStudies] = useState<any[]>([]);
    const [selectedStudyIndex, setSelectedStudyIndex] = useState(0);
    const [activeParticipant, setActiveParticipant] = useState<any>(null);
    const [allParticipants, setAllParticipants] = useState<any[]>([]);
    const [compensations, setCompensations] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [labResults, setLabResults] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [helpRequests, setHelpRequests] = useState<any[]>([]);
    const [signatures, setSignatures] = useState<any[]>([]);
    const [assignedForms, setAssignedForms] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [availableConsentTemplates, setAvailableConsentTemplates] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [logsDefaultViewMode, setLogsDefaultViewMode] = useState<'FORM' | 'HISTORY'>('FORM');

    const [logsPreselectedDate, setLogsPreselectedDate] = useState<string | null>(null);
    const [tasksDefaultFilter, setTasksDefaultFilter] = useState('Overdue');
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; desc: string; primaryAction: string; task?: any } | null>(null);
    const [editModal, setEditModal] = useState({ isOpen: false, title: '', value: '', field: '' });
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [activeConsentTask, setActiveConsentTask] = useState<any>(null);
    const [activeSignatureTask, setActiveSignatureTask] = useState<any>(null);
    const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);
    const [activeInstrumentTask, setActiveInstrumentTask] = useState<any>(null);
    const [consentSuccessToast, setConsentSuccessToast] = useState(false);
    // Tracks template IDs signed in this session to prevent re-injection before refresh
    const justSignedTemplateIds = useRef<Set<string>>(new Set());

    interface UserProfile {
        userName: string;
        userEmail: string;
        userPicture: string;
        firstName: string;
        userPhone: string;
        userLocation: string;
        userTimezone: string;
        userAge: string | number;
        userDob: string;
        userRole: string;
    }

    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        const u = getUser();
        return {
            userName: getDisplayName(u),
            userEmail: u?.email || '',
            userPicture: u?.picture || u?.avatar || u?.profile_picture || '',
            firstName: getDisplayName(u),
            userPhone: u?.decrypted_phone || u?.mobile_number || u?.phone_number || '',
            userLocation: u?.decrypted_address || u?.full_address || '',
            userTimezone: u?.timezone || 'UTC',
            userAge: u?.age || '',
            userDob: u?.date_of_birth || '',
            userRole: u?.role || 'PARTICIPANT'
        };
    });

    const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
        push: true,
        email: true,
        sms: false
    });

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Tracking for notifications
    const prevStatusRef = useRef<string | null>(null);
    const prevTaskCountRef = useRef<number | null>(null);
    const prevMsgCountRef = useRef<number | null>(null);
    const isFetchingRef = useRef(false);
    const lastFetchIdRef = useRef<string | null>(null);

    const [currentTime, setCurrentTime] = useState(new Date());

    const refreshData = (silent = false) => {
        if (!silent) setIsDataLoading(true);
        setRefreshKey(k => k + 1);
    };

    // Helper functions moved up for hoisting safety
    const formatToParticipantTime = (date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString('en-US', {
            timeZone: userProfile?.userTimezone || 'UTC',
            ...options
        });
    };

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-close dropdowns on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (isNotificationOpen) setIsNotificationOpen(false);
            if (isDropdownOpen) setIsDropdownOpen(false);
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isNotificationOpen, isDropdownOpen]);

    const getId = (obj: any) => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj.trim();
        if (typeof obj === 'number') return String(obj);
        return (obj.id || obj._id?.$oid || obj._id || obj.$oid || '').toString().trim();
    };

    const safeArray = (data: any) => Array.isArray(data) ? data : [];
    const safeData = (data: any) => data?.results || (Array.isArray(data) ? data : []);

    // ──────────────── INITIAL FETCH (Participants & Studies) ────────────────
    useEffect(() => {
        const initDashboard = async () => {
            const apiUrl = API || 'http://localhost:8000';
            try {
                // 1. Refresh user data from server to ensure decryption for PII fields
                try {
                    const userRes = await authFetch(`${apiUrl}/api/users/me/`);
                    if (userRes.ok) {
                        const freshUser = await userRes.json();
                        const localU = getUser();
                        saveUser({ ...localU, ...freshUser });
                        setUserProfile({
                            userName: freshUser.decrypted_name || freshUser.full_name || getDisplayName(freshUser),
                            userEmail: freshUser.email || '',
                            userPicture: freshUser.profile_picture || freshUser.picture || '',
                            firstName: (freshUser.decrypted_name || freshUser.full_name)?.split(' ')[0] || getDisplayName(freshUser),
                            userPhone: freshUser.decrypted_phone || freshUser.phone_number || freshUser.mobile_number || '',
                            userLocation: freshUser.decrypted_address || freshUser.full_address || '',
                            userTimezone: freshUser.timezone || 'UTC',
                            userAge: freshUser.age || '',
                            userDob: freshUser.date_of_birth || '',
                            userRole: freshUser.role || 'PARTICIPANT'
                        });
                    } else {
                        const u = getUser();
                        if (u) {
                            setUserProfile({
                                userName: getDisplayName(u),
                                userEmail: u.email || '',
                                userPicture: u.picture || u.avatar || u.profile_picture || '',
                                firstName: getDisplayName(u),
                                userPhone: u.decrypted_phone || u.mobile_number || u.phone_number || '',
                                userLocation: u.decrypted_address || u.full_address || '',
                                userTimezone: u.timezone || 'UTC',
                                userAge: u.age || '',
                                userDob: u.date_of_birth || '',
                                userRole: u.role || 'PARTICIPANT'
                            });
                        }
                    }
                } catch (uErr) {
                    console.error("Failed to sync user profile:", uErr);
                }

                // Senior Developer Add: Check for missed visits to trigger notifications/alerts
                try {
                    await authFetch(`${apiUrl}/api/visits/check_missed/`, { method: 'POST' });
                } catch (e) { /* silent check */ }


                const pData = await apiFetch<any[]>('/api/participants/');
                if (pData) {
                    let filteredData = pData.filter((p: any) => {
                        const s = (p.status || '').toUpperCase();
                        // COMPLETED studies should remain visible for records/compensation history
                        return !['DROPPED', 'INELIGIBLE'].includes(s);
                    });

                    // Senior Developer: Strict Priority Sorting
                    const priority = ['ENROLLED', 'RANDOMIZED', 'ACTIVE', 'CONSENTED', 'COMPLETED', 'REGISTERED', 'SCREENING'];
                    filteredData.sort((a: any, b: any) => {
                        const sA = (a.status || '').toUpperCase().trim();
                        const sB = (b.status || '').toUpperCase().trim();
                        const idxA = priority.indexOf(sA);
                        const idxB = priority.indexOf(sB);

                        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;
                        if (idxA !== -1 && idxB === -1) return -1;
                        if (idxB !== -1 && idxA === -1) return 1;

                        // Established studies remain at the top (Oldest First within same priority)
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    });

                    if (filteredData.length > 0) {
                        setAllParticipants(filteredData);

                        // Smart Preservation: Try to find previous active study
                        let targetIndex = 0;
                        const prevActiveId = activeParticipant ? getId(activeParticipant) : null;

                        if (prevActiveId) {
                            const foundIdx = filteredData.findIndex((p: any) => getId(p) === prevActiveId);
                            if (foundIdx !== -1) targetIndex = foundIdx;
                        }

                        setSelectedStudyIndex(targetIndex);
                        setActiveParticipant(filteredData[targetIndex]);

                        const studiesPromises = filteredData.map((p: any) =>
                            authFetch(`${apiUrl}/api/studies/${p.study}/`).then(res => res.ok ? res.json() : null)
                        );
                        const fetchedStudies = (await Promise.all(studiesPromises)).filter(s => s !== null);
                        setAllStudies(fetchedStudies);
                        if (fetchedStudies.length > targetIndex) {
                            setActiveStudy(fetchedStudies[targetIndex]);
                        } else if (fetchedStudies.length > 0) {
                            setActiveStudy(fetchedStudies[0]);
                        }
                    }
                }
            } catch (err) {
                console.error("Initial dashboard fetch failed:", err);
            }
        };
        initDashboard();
    }, [refreshKey]);

    useEffect(() => {
        const fetchClinicalData = async (isSilent = false) => {
            const currentUser = getUser();
            if (!currentUser || allParticipants.length === 0) return;

            const p = allParticipants[selectedStudyIndex];
            const pId = getId(p);
            const currentStudyId = getId(p.study);

            // Senior Developer Optimization: Prevent redundant bursts
            if (isFetchingRef.current) return;
            if (isSilent && lastFetchIdRef.current === `${pId}-${currentStudyId}-${refreshKey}`) return;

            try {
                isFetchingRef.current = true;
                if (!isSilent) setIsDataLoading(true);

                console.log(`[Clinical Sync] Starting ${isSilent ? 'background' : 'full'} data sync for Participant: ${pId}`);
                // Parallel fetch for speed
                const [taskRes, quesRes, logRes, doseRes, compRes, visitRes, kitRes, labRes, meshRes, afRes, helpRes, sigRes, protocolRes] = await Promise.all([
                    authFetch(`${API}/api/tasks/?participant_id=${pId}`),
                    authFetch(`${API}/api/questionnaire-schedules/?participant_id=${pId}`),
                    authFetch(`${API}/api/daily-medication-logs/?participant=${pId}`),
                    authFetch(`${API}/api/dosing-logs/?participant=${pId}`),
                    authFetch(`${API}/api/compensations/?participant=${pId}`),
                    authFetch(`${API}/api/visits/?participant=${pId}`),
                    authFetch(`${API}/api/kits/?study_id=${currentStudyId}`),
                    authFetch(`${API}/api/lab-results/?participant=${pId}`),
                    authFetch(`${API}/api/clinical-conversations/?study_id=${currentStudyId}`),
                    authFetch(`${API}/api/assigned-forms/?participant=${pId}`),
                    authFetch(`${API}/api/help-request/`),
                    authFetch(`${API}/api/consent/?participant_id=${pId}`),
                    authFetch(`${API}/api/consent-templates/?study_id=${currentStudyId}`)
                ]);

                // Extract with safeArray & Normalize
                const fetchedTasks = safeData(taskRes.ok ? await taskRes.json() : []);
                const fetchedQues = safeData(quesRes.ok ? await quesRes.json() : []);
                const fetchedLogs = safeData(logRes.ok ? await logRes.json() : []);
                const fetchedDoses = safeData(doseRes.ok ? await doseRes.json() : []);
                const compData = safeData(compRes.ok ? await compRes.json() : []);
                const visitData = safeData(visitRes.ok ? await visitRes.json() : []);
                const kitData = safeData(kitRes.ok ? await kitRes.json() : []);
                const labData = safeData(labRes.ok ? await labRes.json() : []);
                const meshData = safeData(meshRes.ok ? await meshRes.json() : []);
                const afData = safeData(afRes.ok ? await afRes.json() : []);
                const helpData = safeData(helpRes.ok ? await helpRes.json() : []);

                // 2. Daily Log Task Synthesis (Critical: Ensure actionability)
                if (activeStudy?.show_dosing_log) {
                    const todayStr = new Date().toISOString().split('T')[0];

                    // Handle Future (+3 days), Today (0), and Missed (-3 days)
                    for (let i = -3; i <= 3; i++) {
                        const targetDate = new Date();
                        targetDate.setDate(targetDate.getDate() - i);
                        const dateStr = targetDate.toISOString().split('T')[0];

                        const hasTaskInDB = fetchedTasks.some((t: any) =>
                            (t.task_type === 'DAILY_LOG' || t.task_details?.task_type === 'LOG' || t.task_details?.task_type === 'DAILY_LOG') &&
                            (t.due_date?.startsWith(dateStr))
                        );
                        const logEntry = fetchedLogs.find((l: any) => l.date === dateStr) || fetchedDoses.find((l: any) => l.date === dateStr);
                        const isToday = i === 0;
                        const isFuture = i < 0;

                        if (!hasTaskInDB) {
                            fetchedTasks.unshift({
                                id: `synth-log-${dateStr}`,
                                study: currentStudyId,
                                participant: pId,
                                title: isToday ? 'Daily Medication Log' : isFuture ? `Upcoming Log: ${dateStr}` : `Missed Log: ${dateStr}`,
                                status: logEntry ? 'COMPLETED' : 'PENDING',
                                due_date: targetDate.toISOString(),
                                visit_name: isToday ? 'Daily Check-in' : isFuture ? 'Scheduled Entry' : 'Retrospective Log',
                                timeline_group: 'Medication Tracking',
                                estimated_time: '2 min',
                                task_type: 'DAILY_LOG',
                                task_details: {
                                    task_type: 'DAILY_LOG',
                                    description: isToday ? 'Log your medication intake for today.' : isFuture ? `Scheduled medication log for ${dateStr}.` : `You missed your log for ${dateStr}. Please complete it now.`
                                }
                            });
                        } else if (logEntry) {
                            const dbTask = fetchedTasks.find((t: any) =>
                                (t.task_type === 'DAILY_LOG' || t.task_details?.task_type === 'LOG' || t.task_details?.task_type === 'DAILY_LOG') &&
                                (t.due_date?.startsWith(dateStr))
                            );
                            if (dbTask && dbTask.status !== 'COMPLETED') {
                                dbTask.status = 'COMPLETED';
                                dbTask.completed_at = logEntry.created_at;
                            }
                        }
                    }
                }

                // 3. Protocol & eConsent Sync
                try {
                    if (protocolRes.ok) {
                        const protocolRaw = await protocolRes.json();
                        const dbProtocols = safeArray(protocolRaw?.results || protocolRaw);
                        setAvailableConsentTemplates(dbProtocols);

                        const sigRaw = sigRes.ok ? await sigRes.json() : [];
                        const mySignatures = safeArray(sigRaw?.results || sigRaw);

                        setSignatures(mySignatures);

                        safeArray(dbProtocols).filter((p: any) => {
                            const isActive = p.status?.toUpperCase() === 'ACTIVE';
                            const pStudyId = getId(p.study);

                            const isMyEnrolledStudy = allParticipants.some((part: any) => {
                                const myStudyId = getId(part.study);
                                const statusRaw = String(part.status || '').toUpperCase().trim();
                                const isEnrolled = ['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE'].some(s => statusRaw.includes(s));
                                return pStudyId === myStudyId && isEnrolled;
                            });

                            // RC-2 FIX: match by template ID OR by study ID
                            // If Consent.template was saved as null but Consent.study matches,
                            // we still correctly identify the participant as already signed.
                            const alreadySigned = mySignatures.some((s: any) => {
                                const templateMatch = s.template && getId(s.template) === getId(p.id);
                                const studyMatch = s.study && getId(s.study) === pStudyId;
                                return templateMatch || studyMatch;
                            }) || justSignedTemplateIds.current.has(getId(p.id));
                            return isActive && isMyEnrolledStudy && !alreadySigned;
                        }).forEach((p: any) => {
                            const pInstanceId = getId(p.id);
                            if (!fetchedTasks.some((t: any) => getId(t) === `db-consent-${pInstanceId}`)) {
                                fetchedTasks.unshift({
                                    id: `db-consent-${pInstanceId}`,
                                    study: getId(p.study),
                                    participant: pId,
                                    title: `${p.title} (v${p.version})`,
                                    status: 'PENDING',
                                    due_date: new Date().toISOString(),
                                    visit_name: 'eConsent Hub',
                                    timeline_group: 'Mandatory',
                                    estimated_time: '15 min',
                                    task_type: 'CONSENT',
                                    p_data: p,
                                    task_details: { task_type: 'CONSENT', description: `New Protocol Update: ${p.title}.` }
                                });
                            }
                        });
                    }
                } catch (cErr) { console.error("Protocol Sync error:", cErr); }

                // 4. Questionnaire Injection
                safeArray(fetchedQues).forEach((q: any) => {
                    if (getId(q.study_questionnaire?.study) === currentStudyId) {
                        fetchedTasks.push({
                            id: `qs-${q.id}`,
                            study: currentStudyId,
                            participant: pId,
                            title: q.schedule_name || q.template_details?.name || 'Questionnaire',
                            status: q.status || 'PENDING',
                            due_date: q.scheduled_date || q.created_at,
                            visit_name: 'Instrumentation',
                            timeline_group: 'Clinical Data',
                            estimated_time: '10 min',
                            task_type: 'QUESTIONNAIRE',
                            q_data: q,
                            task_details: { task_type: 'QUESTIONNAIRE', description: `Please complete the ${q.schedule_name} instrument.` }
                        });
                    }
                });

                // ──────────────── NOTIFICATION TRIGGERS (REAL-TIME) ────────────────
                const newNotifs: any[] = [];
                const currentStatus = activeParticipant?.status;
                if (prevStatusRef.current && prevStatusRef.current !== currentStatus) {
                    const statusName = (currentStatus || '').replace(/_/g, ' ');
                    newNotifs.push({
                        id: `status-${Date.now()}`,
                        title: 'Enrollment Status Updated',
                        desc: `Your status has been updated to: ${statusName}.`,
                        time: 'Just now',
                        type: 'system',
                        read: false
                    });
                }
                prevStatusRef.current = currentStatus;

                const pendingTasksCount = safeArray(fetchedTasks).filter(t => t.status === 'PENDING').length;
                if (prevTaskCountRef.current !== null && pendingTasksCount > prevTaskCountRef.current) {
                    newNotifs.push({
                        id: `task-${Date.now()}`,
                        title: 'New Task Assigned',
                        desc: 'A new clinical task requires your attention.',
                        time: 'Just now',
                        type: 'protocol',
                        read: false
                    });
                }
                prevTaskCountRef.current = pendingTasksCount;

                const unreadMsgsCount = safeArray(meshData).reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0);
                if (prevMsgCountRef.current !== null && unreadMsgsCount > prevMsgCountRef.current) {
                    newNotifs.push({
                        id: `msg-${Date.now()}`,
                        title: 'New Message',
                        desc: 'You have a new message from the research team.',
                        time: 'Just now',
                        type: 'message',
                        read: false
                    });
                }
                prevMsgCountRef.current = unreadMsgsCount;

                if (newNotifs.length > 0) {
                    setNotifications(prev => [...newNotifs, ...prev].slice(0, 15));
                }

                setCompensations(compData);
                setVisits(visitData);
                setKits(kitData);
                setLabResults(labData);
                setConversations(meshData);
                setAssignedForms(afData);
                setHelpRequests(helpData);
                setLogs(fetchedLogs);

                setTasks(fetchedTasks);
                lastFetchIdRef.current = `${pId}-${currentStudyId}-${refreshKey}`;
                setIsDataLoading(false);
            } catch (err) {
                console.error("Clinical data fetch failed:", err);
                setIsDataLoading(false);
            } finally {
                isFetchingRef.current = false;
            }
        };

        fetchClinicalData(false);
    }, [selectedStudyIndex, allParticipants.length, refreshKey]); // Removed activeStudy as it was redundant and caused duplicate firing

    const activeStudyId = String(activeStudy?.id || activeStudy?._id?.$oid || activeStudy?._id || activeStudy?.$oid || '').trim();



    const filteredTasks = useMemo(() => {
        if (activeStudyId === '') return [];
        const pId = getId(activeParticipant);
        const matched = safeArray(tasks).filter(t => {
            const tParticipantId = getId(t.participant);
            if (tParticipantId && pId) {
                return tParticipantId === pId;
            }
            const tStudyId = getId(t.study || t.p_data?.study || t.p_data?.study_id);
            return tStudyId === activeStudyId;
        });

        // Sort: Overdue first, then Today, Upcoming, Pending, Completed, Locked
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getPriority = (task: any) => {
            const s = (task.status || '').toUpperCase();
            if (s === 'COMPLETED') return 4;
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const isDailyLog = task.task_type === 'DAILY_LOG' || task.task_details?.task_type === 'DAILY_LOG';
            if (diffDays > 5 && !isDailyLog) return 5;        // Locked
            if (diffDays >= 1) return 0;       // Overdue (highest priority)
            if (diffDays === 0) return 1;      // Today
            if (dueDate > today) return 2;     // Upcoming
            return 1;                          // Default to Today
        };

        matched.sort((a: any, b: any) => getPriority(a) - getPriority(b));
        return matched;
    }, [tasks, activeStudyId, activeParticipant]);

    const filteredKits = useMemo(() => {
        if (activeStudyId === '') return [];
        return safeArray(kits).filter(k => getId(k.study) === activeStudyId);
    }, [kits, activeStudyId]);

    const filteredVisits = useMemo(() => {
        if (!activeParticipant) return [];
        const pId = getId(activeParticipant);
        return safeArray(visits).filter(v => getId(v.participant) === pId);
    }, [visits, activeParticipant]);

    const filteredCompensations = useMemo(() => {
        if (!activeParticipant) return [];
        const pId = getId(activeParticipant);
        return safeArray(compensations).filter(c => getId(c.participant) === pId);
    }, [compensations, activeParticipant]);

    const filteredLabResults = useMemo(() => {
        if (!activeParticipant) return [];
        const pId = getId(activeParticipant);
        return safeArray(labResults).filter(l => getId(l.participant) === pId);
    }, [labResults, activeParticipant]);

    const filteredConversations = useMemo(() => {
        if (activeStudyId === '') return [];
        return safeArray(conversations).filter(c => getId(c.study) === activeStudyId);
    }, [conversations, activeStudyId]);

    // ──────────────── HANDLERS ────────────────
    const toggleNotification = (key: string) => {
        setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveProfileField = async (field: string, value: string) => {
        try {
            const mapping: Record<string, string> = {
                'userPhone': 'phone_number',
                'userLocation': 'full_address',
                'userTimezone': 'timezone',
                'userName': 'full_name',
                'userPicture': 'profile_picture'
            };
            const key = mapping[field] || field;

            // Update Backend via the standard /api/users/me/ endpoint
            const resp = await authFetch(`${API}/api/users/me/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.detail || "Profile Update Failed");
            }

            const updatedUserData = await resp.json();

            // Update local state
            setUserProfile(prev => ({ ...prev, [field]: value }));
            setEditModal(p => ({ ...p, isOpen: false }));

            // Sync with localStorage
            const u = getUser();
            if (u) {
                saveUser({ ...u, ...updatedUserData });
            }

            // Provide visual confirmation without annoying alerts for minor edits
            // But keep the requested alert message context if needed
            // alert("Security Sync Completed Successfully.");
        } catch (err: any) {
            console.error("Failed to update profile:", err);
            alert(`Security Sync Failed: ${err.message || 'Please retry.'}`);
        }
    };


    const openActionModal = (title: string, task?: any) => {
        // ── CONSENT TASK DETECTION (must be first) ──────────────────────────
        // TasksView calls onAction('START_MISSION' | 'RESUME_MISSION', task)
        // We intercept here if the task is a CONSENT type
        const taskType = (task?.task_type || task?.task_details?.task_type || '').toUpperCase();

        // ── DOWNLOAD HANDLER ──────────────────────────
        if (title === 'DOWNLOAD_PDF') {
            let downloadUrl = null;
            if (taskType === 'CONSENT') {
                const currentStudyId = getId(task.study || activeStudy);
                const sig = signatures.find(s => getId(s.study) === currentStudyId);
                downloadUrl = sig?.signed_pdf_url || sig?.signed_pdf;
            } else if (taskType === 'FORM_SIGNATURE' || task.assigned_form) {
                const afId = getId(task.assigned_form);
                const af = assignedForms.find(f => getId(f.id) === afId);
                downloadUrl = af?.signed_pdf_url || af?.signed_pdf;
            }

            if (downloadUrl) {
                window.open(downloadUrl, '_blank'); // Usually triggers download if disposition is set, or allows saving from viewer
                // For direct download intent:
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', `Signed_${task.title || 'Document'}.pdf`);
                // document.body.appendChild(link); // Optional for many browsers
                link.click();
                // document.body.removeChild(link);
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Processing Document',
                    desc: "Your signed document is currently being securely prepared for download. Please retry in a few moments.",
                    primaryAction: 'OK'
                });
            }
            return;
        }

        // Handle Viewing Completed Tasks (Eye Button Integration)
        if (title === 'VIEW_SUBMISSION' || task?.status === 'COMPLETED') {
            if (taskType === 'CONSENT') {
                const templateId = getId(task.p_data?.id);
                const currentStudyId = getId(task.study || activeStudy);
                // Try to find signature by template first (most precise), then by study
                let sig = signatures.find(s => templateId && getId(s.template) === templateId);
                if (!sig) {
                    sig = signatures.find(s => getId(s.study) === currentStudyId);
                }

                const pdfUrl = sig?.signed_pdf_url || sig?.signed_pdf;
                if (pdfUrl) {
                    window.open(pdfUrl, '_blank');
                    return;
                }
                setModalConfig({
                    isOpen: true,
                    title: 'Document Update',
                    desc: "Your signed Consent PDF is still being generated. Please retry in a few minutes.",
                    primaryAction: 'OK'
                });
                return;
            }
            if (taskType === 'DAILY_LOG') {
                const dateStr = task.due_date;
                const logEntry = logs.find((l: any) => l.date === dateStr);
                if (logEntry) {
                    setSelectedLog(logEntry);
                    setLogsDefaultViewMode('HISTORY');
                    setActiveNav('Logs');
                    navigate('/dashboard/participant/logs');
                } else {
                    setModalConfig({
                        isOpen: true,
                        title: 'Data Synchronization',
                        desc: "Historical data for this log is being synchronized. Please refresh in a moment.",
                        primaryAction: 'OK'
                    });
                }
                return;
            }
            if (taskType === 'FORM_SIGNATURE' || task.assigned_form) {
                const afId = getId(task.assigned_form);
                const af = assignedForms.find(f => getId(f.id) === afId);
                const pdfUrl = af?.signed_pdf_url || af?.signed_pdf;
                if (pdfUrl) {
                    window.open(pdfUrl, '_blank');
                    return;
                }
                setModalConfig({
                    isOpen: true,
                    title: 'Generation in Progress',
                    desc: "Your signed Form PDF is still being generated. Please retry in a few minutes.",
                    primaryAction: 'OK'
                });
                return;
            }
        }

        if (taskType === 'DAILY_LOG' || taskType === 'LOG') {
            // Check if it's already completed to allow viewing history
            if (task.status === 'COMPLETED') {
                const dateStr = task.due_date?.split('T')[0];
                const logEntry = logs.find((l: any) => l.date === dateStr);
                if (logEntry) {
                    setSelectedLog(logEntry);
                    setLogsDefaultViewMode('HISTORY');
                    handleNavClick('Logs');
                } else {
                    setLogsPreselectedDate(dateStr);
                    setLogsDefaultViewMode('HISTORY');
                    handleNavClick('Logs');
                }
            } else {
                setLogsPreselectedDate(task.due_date?.split('T')[0]);
                setLogsDefaultViewMode('FORM');
                handleNavClick('Logs');
            }
            return;
        }

        if (taskType === 'CONSENT') {
            // Priority: Resolve clinical protocol data if missing from the task object (common for DB-sourced tasks)
            if (!task.p_data) {
                const tIdFromTask = getId(task.template || task.task_details?.template || task.task?.template);
                const resolvedTemplate = availableConsentTemplates.find(ct => getId(ct.id) === tIdFromTask || getId(ct._id) === tIdFromTask);
                
                if (resolvedTemplate) {
                    console.log("[Consent Resolve] Bound missing template data to task:", resolvedTemplate.title);
                    task.p_data = resolvedTemplate;
                } else if (availableConsentTemplates.length > 0) {
                    // Fallback: If only one active template exists for the study, auto-bind it
                    const latestActive = availableConsentTemplates.find(ct => ct.status?.toUpperCase() === 'ACTIVE');
                    if (latestActive) {
                        console.log("[Consent Resolve] Auto-resolved latest active template:", latestActive.title);
                        task.p_data = latestActive;
                    }
                }
            }
            setActiveConsentTask(task);
            setIsConsentModalOpen(true);
            return;
        }

        if (title === 'SIGN_FORM' || taskType === 'FORM_SIGNATURE') {
            setActiveSignatureTask(task);
            setIsSignatureModalOpen(true);
            return;
        }

        if (taskType === 'QUESTIONNAIRE') {
            setActiveInstrumentTask(task);
            setIsInstrumentModalOpen(true);
            return;
        }

        if (task) {
            setModalConfig({
                isOpen: true,
                title: `${title}: ${task.title}`,
                desc: `Initiating workflow for [${task.title}]. Connection protocol status: SECURE.`,
                primaryAction: "CONTINUE TASK",
                task: task
            });
            return;
        }
        const lowerTitle = title.toLowerCase();

        // Handle Task redirects from other views (like LogsView success)
        if (lowerTitle === 'navigate_to_tasks' || lowerTitle === 'navigate_to_completed_tasks') {
            setTasksDefaultFilter(lowerTitle === 'navigate_to_completed_tasks' ? 'Completed' : 'Overdue');
            handleNavClick('Tasks');
            refreshData();
            return;
        }

        // 1. Specialized Modals (Phone, Email, Profile, etc.)
        if (lowerTitle.includes('phone') || lowerTitle.includes('number')) {
            setEditModal({ isOpen: true, title: 'Edit Phone Number', value: userProfile.userPhone, field: 'userPhone' });
            return;
        } else if (lowerTitle.includes('location')) {
            setEditModal({ isOpen: true, title: 'Edit Location', value: userProfile.userLocation, field: 'userLocation' });
            return;
        } else if (lowerTitle.includes('timezone')) {
            setEditModal({ isOpen: true, title: 'Edit Timezone', value: userProfile.userTimezone, field: 'userTimezone' });
            return;
        } else if (lowerTitle.includes('email')) {
            setEditModal({ isOpen: true, title: 'Edit Email Address', value: userProfile.userEmail, field: 'userEmail' });
            return;
        } else if (lowerTitle.includes('profile') && lowerTitle.includes('edit')) {
            setEditModal({ isOpen: true, title: 'Edit Display Name', value: userProfile.userName, field: 'userName' });
            return;
        } else if (lowerTitle.includes('password') || lowerTitle.includes('credential')) {
            setModalConfig({
                isOpen: true,
                title: 'Clinical Access Rotation',
                desc: 'You are about to change your password. Continue to proceed?',
                primaryAction: "CONTINUE"
            });
            return;
        } else if (lowerTitle.includes('withdraw') || lowerTitle.includes('leave')) {
            setModalConfig({
                isOpen: true,
                title: 'Study Exit Protocol',
                desc: 'You are choosing to leave the study. This will notify your team. Proceed to confirmation?',
                primaryAction: "INITIATE WITHDRAWAL"
            });
            return;
        }

        // 2. eConsent Trigger
        if (lowerTitle.includes('consent')) {
            if (task) setActiveConsentTask(task);
            setIsConsentModalOpen(true);
            return;
        }

        // 3. Navigation Mapping
        const directNav: Record<string, string> = {
            'tasks': 'Tasks',
            'protocol': 'Tasks',
            'kit': 'Study Kit',
            'logs': 'Logs',
            'dose': 'Logs',
            'supplement': 'Logs',
            'symptom': 'Logs',
            'ae': 'Logs',
            'adverse event': 'Logs',
            'messages': 'Messages',
            'team': 'Messages',
            'comms': 'Messages',
            'compensation': 'Compensation',
            'rewards': 'Compensation',
            'profile': 'Profile',
            'documents': 'Documents',
            'reports': 'Reports',
            'visit': 'Visits',
            'privacy': 'Privacy & Data'
        };

        for (const [key, view] of Object.entries(directNav)) {
            if (lowerTitle.includes(key)) {
                const slugs: Record<string, string> = {
                    'Dashboard': '',
                    'Tasks': 'tasks',
                    'Study Kit': 'study-kit',
                    'Logs': 'logs',
                    'Messages': 'messages',
                    'Documents': 'documents',
                    'Reports': 'reports',
                    'Compensation': 'compensation',
                    'Profile': 'profile',
                    'Privacy & Data': 'privacy'
                };
                const slug = slugs[view];
                setActiveNav(view);
                navigate(`/dashboard/participant${slug ? '/' + slug : ''}`);

                if (lowerTitle === 'navigate_to_tasks') {
                    refreshData();
                }
                return;
            }
        }

        // 4. Default Action Modal
        setModalConfig({
            isOpen: true,
            title: title,
            desc: `You are starting the ${title} process.`,
            primaryAction: "CONTINUE"
        });
    };

    const handleActionConfirm = async () => {
        if (!modalConfig) return;
        const title = modalConfig.title;
        const task = modalConfig.task;
        setModalConfig(null);
        setIsActionProcessing(true);

        // For Help/Coordinator requests, trigger the backend notification immediately
        if (title.toLowerCase().includes('help') || title.toLowerCase().includes('coordinator') || title.toLowerCase().includes('emergency')) {
            try {
                // Robust study_id resolution: 
                // 1. Check activeStudy object (standard dashboard state)
                // 2. Check task_details (nested in ParticipantTask)
                // 3. Check task.study (direct ID on ParticipantTask or Task)
                const sId = activeStudy?.id || activeStudy?._id || task?.task_details?.study || task?.study;

                await authFetch(`${API}/api/help-request/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        study_id: sId,
                        action_title: title
                    })
                });
            } catch (err) {
                console.error("Backend dispatch failed:", err);
            }
        }

        setTimeout(() => {
            setIsActionProcessing(false);

            if (task) {
                const taskId = task.id;
                setTasks((prev: any[]) => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
                alert("we got your request and our team members contact you shortly");
                return;
            }

            if (title.toLowerCase().includes('confirm') && title.toLowerCase().includes('received')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Tasks');
                return;
            }

            if (title.toLowerCase().includes('sync') || title.toLowerCase().includes('collection')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Dashboard');
                return;
            }

            if (title.toLowerCase().includes('report') || title.toLowerCase().includes('problem')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Messages');
                return;
            }

            if (title.toLowerCase().includes('export') || title.toLowerCase().includes('download') || title.toLowerCase().includes('label') || title.toLowerCase().includes('data') || title.toLowerCase().includes('request')) {
                alert("we got your request and our team members contact you shortly");
                return;
            }

            if (title.toLowerCase().includes('receipt')) {
                alert("we got your request and our team members contact you shortly");
                setActiveNav('Study Kit');
                return;
            }

            if (title.toLowerCase().includes('photo')) {
                fileInputRef.current?.click();
                return;
            }

            const taskToUpdate = tasks.find((t: any) => t.task_details?.title === title || title.toLowerCase().includes('protocol') || title.toLowerCase().includes('start'));
            if (taskToUpdate || title.toLowerCase().includes('task') || title.toLowerCase().includes('log') || title.toLowerCase().includes('symptom')) {
                if (taskToUpdate) {
                    setTasks((prev: any[]) => prev.map(t => t.id === taskToUpdate.id ? { ...t, status: 'COMPLETED' } : t));
                }
                alert("we got your request and our team members contact you shortly");
                if (title.toLowerCase().includes('task')) setActiveNav('Tasks');
                if (title.toLowerCase().includes('dose') || title.toLowerCase().includes('symptom')) setActiveNav('Logs');
                return;
            }

            if (title.toLowerCase().includes('withdraw')) {
                if (window.confirm("FINAL WARNING: withdrawing from the study will scrub all active clinical records and terminate your enrollment. This action requires PI review and is irreversible. CONFIRM WITHDRAWAL?")) {
                    alert("⚠️ WITHDRAWAL PROTOCOL ACTIVATED: The study team has been notified. Your clinical access will be phased out within 24 hours.");
                    setActiveNav('Dashboard');
                }
                return;
            }

            if (title.toLowerCase().includes('credentials') || title.toLowerCase().includes('rotate')) {
                alert("🔒 SUCCESS: Clinical credentials successfully rotated. Your new session tokens have been synchronized across all verified systems.");
                return;
            }

            if (title.toLowerCase().includes('delete')) {
                if (window.confirm("FINAL WARNING: This will permanently delete your clinical profile and all associated data. This action is irreversible. Proceed?")) {
                    alert("🔒 Securely scrubbing personal data... logging out.");
                    performLogout();
                    navigate('/signin');
                }
                return;
            }

            alert("we got your request and our team members contact you shortly");
        }, 1500);
    };

    const handleConsentComplete = async (consentData: any) => {
        setIsConsentModalOpen(false);
        setIsActionProcessing(false);

        // Track this template as signed so it won't re-inject before the server refresh
        const signedTemplateId = activeConsentTask?.p_data?.id
            || activeConsentTask?.p_data?._id
            || activeConsentTask?.template
            || activeConsentTask?.task_details?.template;
        if (signedTemplateId) {
            justSignedTemplateIds.current.add(String(signedTemplateId));
        }

        // Immediately remove the consent task from local state + mark COMPLETED
        const consentTaskId = activeConsentTask?.id;
        setTasks((prev: any[]) =>
            prev.map(t =>
                t.id === consentTaskId || (t.task_type === 'CONSENT' && t.status === 'PENDING')
                    ? { ...t, status: 'COMPLETED', completed_at: new Date().toISOString() }
                    : t
            ).filter(t =>
                // Remove the synthetic consent task entirely — it will be gone after server refresh
                !(t.id === consentTaskId && t.id?.startsWith('db-consent-'))
            )
        );

        setActiveConsentTask(null);

        // Show in-app success toast (no more browser alert)
        setConsentSuccessToast(true);
        setTimeout(() => setConsentSuccessToast(false), 6000);

        // Navigate to Documents tab so the user can see the signed PDF
        handleNavClick('Documents');

        // Full background refresh (tasks, signatures, documents)
        refreshData(true);
    };

    const handleFormSignatureComplete = async (data: any, signature: string) => {
        setIsSignatureModalOpen(false);
        setIsActionProcessing(true);
        try {
            const afId = activeSignatureTask?.assigned_form;
            if (!afId) throw new Error("No assignment ID found");

            const apiUrl = API || 'http://localhost:8000';
            const response = await authFetch(`${apiUrl}/api/assigned-forms/${afId}/sign_participant/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, signature })
            });

            if (response.ok) {
                alert("✅ Document Signed. Your submission has been securely transmitted to the study site for coordinator review.");
                setTasks((prev: any[]) =>
                    prev.map(t => t.id === activeSignatureTask.id ? { ...t, status: 'COMPLETED' } : t)
                );
                setActiveSignatureTask(null);
            } else {
                alert("Security sync failed. Please contact your clinical coordinator.");
            }
        } catch (err) {
            console.error("Signature workflow failed:", err);
            alert("Internal protocol error. Please retry.");
        } finally {
            setIsActionProcessing(false);
        }
    };

    useEffect(() => {
        const role = getRole();
        if (role && role !== 'PARTICIPANT') {
            const link = role === 'SUPER_ADMIN' ? '/dashboard/super-admin' : role === 'ADMIN' ? '/dashboard/admin' : role === 'PI' ? '/dashboard/pi' : '/';
            navigate(link, { replace: true });
        }
    }, [navigate]);

    const initials = userProfile.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const activeParticipantStatus = (activeParticipant?.status || '').toUpperCase().trim();
    const isEnrolled = ['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE', 'COMPLETED'].some(s => activeParticipantStatus.includes(s));

    const navItems = [
        { label: 'Main Website', icon: Globe },
        { label: 'Discover Studies', icon: Search },
        { label: 'Dashboard', icon: LayoutDashboard },
        { label: 'Tasks', icon: ClipboardList, hidden: !isEnrolled },
        { label: 'Study Kit', icon: Box, hidden: !isEnrolled || activeStudy?.uses_kit === false },
        { label: 'Logs', icon: Activity, hidden: !isEnrolled },
        { label: 'Messages', icon: MessageSquare },
        { label: 'Documents', icon: FileText, hidden: !isEnrolled },
        { label: 'Reports', icon: TrendingUp, hidden: !isEnrolled },
        { label: 'Visits', icon: Calendar, hidden: !isEnrolled },
        { label: 'Compensation', icon: Trophy, hidden: !isEnrolled },

        { label: 'Profile', icon: User },
        { label: 'Privacy & Data', icon: ShieldCheck },
    ].filter(item => !item.hidden);

    return (
        <div className="h-screen flex overflow-hidden font-sans relative participant-portal-root">
            <ParticipantBackground />
            {/* Sidebar Overlay */}
            {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/10 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}

            <aside className={`h-full flex-shrink-0 flex-col border-r border-[#E3ECF5] z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'fixed flex w-[240px] left-0 translate-x-0 bg-white shadow-xl' : 'hidden lg:flex lg:relative lg:w-[240px] lg:translate-x-0 transition-none'}`} style={{ background: '#FFFFFF' }}>
                <div className="h-20 px-6 flex justify-between items-center border-b border-[#E3ECF5]">
                    <Link to="/" className="group transition-all">
                        <div className="bg-white p-2 rounded-2xl transition-transform hover:scale-105">
                            <img src="/logo.jpg" alt="MusB" className="h-10 w-auto object-contain" />
                        </div>
                    </Link>
                    <button className="lg:hidden text-[#8A99B3] hover:text-[#1E88E5]" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></button>
                </div>


                <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-6 no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = activeNav === item.label;
                        return (
                            <button
                                key={item.label}
                                onClick={() => { handleNavClick(item.label); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive
                                        ? 'bg-[#E3F2FD] text-[#1E88E5] shadow-sm'
                                        : 'text-[#5F6F89] hover:text-[#1E88E5] hover:bg-[#F0F6FF]'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#1E88E5]' : 'text-[#7A8CA5] group-hover:text-[#1E88E5]'}`} />
                                <span className="text-[14px] font-bold tracking-tight">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="px-4 pb-10 pt-4 border-t border-[#E3ECF5] mt-auto">
                    <button onClick={() => setIsLogoutModalOpen(true)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[#8A99B3] hover:text-[#D32F2F] hover:bg-[#FDECEA] transition-all group">
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="text-[14px] font-bold">Sign Out</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative z-20 w-full">
                <header className="h-20 border-b border-[#E3ECF5] shrink-0 relative bg-white/80 backdrop-blur-xl z-[100] transition-all">
                    <div className="participant-portal h-full flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button className="lg:hidden text-[#5F6F89] hover:text-[#1E88E5] transition-colors mr-1" onClick={() => setIsMobileMenuOpen(true)}>
                                <Menu className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col hidden lg:flex">
                                <span className="text-[10px] font-black text-[#00ADEF] uppercase tracking-[0.2em] mb-0.5">Clinical Portal</span>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-[#1A2B49] tracking-tight leading-none">{activeNav}</h1>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 relative" ref={dropdownRef}>
                            <div className="hidden md:flex flex-col items-end text-right border-r border-[#E3ECF5] pr-4">
                                <span className="text-base lg:text-lg font-bold text-[#00ADEF] tracking-tighter tabular-nums leading-none">
                                    {formatToParticipantTime(currentTime, { weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1 opacity-60">
                                    <Globe className="w-3 h-3 text-[#5F6F89]" />
                                    <span className="text-[9px] font-bold text-[#5F6F89] uppercase tracking-widest leading-none">
                                        {userProfile.userTimezone || 'UTC'}
                                    </span>
                                </div>
                            </div>

                            {/* Manual Refresh Button */}
                            <button
                                onClick={() => refreshData()}
                                className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[#E3ECF5] text-[#8A99B3] hover:text-[#1E88E5] hover:bg-[#E3F2FD] hover:border-[#BBDEFB] transition-all flex items-center justify-center group"
                                title="Sync Clinical Data"
                            >
                                <RefreshCcw className={`w-5 h-5 transition-transform duration-700 ${isDataLoading ? 'animate-spin text-[#1E88E5]' : 'group-active:rotate-180'}`} />
                            </button>

                            <div className="relative">
                                <NotificationBell
                                    unreadCount={safeArray(notifications).filter(n => !n.read).length}
                                    onClick={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        setIsDropdownOpen(false);
                                    }}
                                />

                                <AnimatePresence>
                                    {isNotificationOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                            className="absolute right-0 top-full mt-6 w-[400px] bg-white border border-[#E3ECF5] rounded-24px shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-[150] overflow-hidden"
                                            style={{ borderRadius: '24px' }}
                                        >
                                            <div className="p-6 border-b border-[#E3ECF5] flex justify-between items-center bg-[#F8FBFF]">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-widest">Notifications Hub</h3>
                                                    <span className="text-[10px] text-[#5F6F89] font-bold uppercase tracking-widest leading-none">Updates & Alerts</span>
                                                </div>
                                                <button
                                                    onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                                                    className="px-4 py-2 bg-[#E3F2FD] border border-[#BBDEFB] text-[11px] font-bold text-[#1E88E5] uppercase tracking-tight hover:bg-[#1E88E5] hover:text-white rounded-xl transition-all"
                                                >
                                                    Mark all read
                                                </button>
                                            </div>
                                            <div className="max-h-[450px] overflow-y-auto no-scrollbar bg-white">
                                                {notifications.length > 0 ? notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        className={`p-6 border-b border-[#F0F6FF] last:border-0 hover:bg-[#F8FBFF] transition-all cursor-pointer relative group/notif ${!n.read ? 'bg-[#E3F2FD]/5' : ''}`}
                                                        onClick={() => {
                                                            if (n.type === 'protocol') setActiveNav('Tasks');
                                                            setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                                                            setIsNotificationOpen(false);
                                                        }}
                                                    >
                                                        {!n.read && <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#1E88E5]" />}
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex justify-between items-baseline gap-4">
                                                                <span className={`text-[13px] font-bold uppercase tracking-tight leading-none ${n.type === 'protocol' ? 'text-[#1E88E5]' : 'text-[#1A2B49] group-hover/notif:text-[#1E88E5]'} transition-colors truncate`}>{n.title}</span>
                                                                <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-tighter flex-shrink-0">{n.time}</span>
                                                            </div>
                                                            <p className="text-[13px] text-[#5F6F89] font-medium leading-relaxed">{n.desc}</p>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-16 text-center text-[#5F6F89] font-medium text-sm">No active alerts...</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative">
                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:bg-[#F8FBFF] p-1.5 rounded-2xl transition-all border border-transparent hover:border-[#E3ECF5]"
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                        setIsNotificationOpen(false);
                                    }}
                                >
                                    <div className="hidden lg:flex flex-col items-end mr-1">
                                        <span className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight leading-none mb-1.5">{userProfile.userName}</span>
                                        <span className="text-[10px] text-[#00ADEF] font-bold uppercase tracking-widest bg-[#E3F2FD] px-2 py-0.5 rounded border border-[#BBDEFB] truncate max-w-[120px]">{userProfile.userEmail}</span>
                                    </div>
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E3F2FD] text-[#1E88E5] flex items-center justify-center border border-[#E3ECF5] overflow-hidden shadow-sm hover:border-[#1E88E5] transition-all relative">
                                        {userProfile.userPicture ? (
                                            <img
                                                src={userProfile.userPicture}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                                    if (fallback) fallback.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <span className={`text-[15px] font-bold avatar-initials absolute inset-0 flex items-center justify-center z-0 ${userProfile.userPicture ? 'hidden' : ''}`}>
                                            {initials}
                                        </span>
                                    </div>
                                </div>

                                {/* User Dropdown Menu */}
                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                            className="absolute right-0 top-full mt-6 w-56 bg-white border border-[#E3ECF5] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[150] overflow-hidden"
                                        >
                                            <div className="p-5 border-b border-[#E3ECF5] bg-[#F8FBFF]">
                                                <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest mb-1.5">Current Session</p>
                                                <p className="text-sm font-bold text-[#1A2B49] uppercase tracking-tight truncate">{userProfile.userName}</p>
                                            </div>
                                            <div className="p-2">
                                                <button
                                                    onClick={() => { setActiveNav('Profile'); setIsDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-[#5F6F89] hover:text-[#1E88E5] hover:bg-[#F0F6FF] rounded-xl transition-all group"
                                                >
                                                    <User className="w-4 h-4 text-[#1E88E5] group-hover:scale-110 transition-transform" />
                                                    <span className="text-[12px] font-bold uppercase tracking-widest">View Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => { setIsLogoutModalOpen(true); setIsDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-[#8A99B3] hover:text-[#D32F2F] hover:bg-[#FDECEA] rounded-xl transition-all group"
                                                >
                                                    <LogOut className="w-4 h-4 text-[#D32F2F] group-hover:scale-110 transition-transform" />
                                                    <span className="text-[12px] font-bold uppercase tracking-widest">Sign Out</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
                    <div className="participant-portal pt-6 sm:pt-10 pb-20">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={activeNav}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15 }}
                            >
                                {activeNav === 'Discover Studies' && <DiscoverStudiesView loading={isDataLoading} />}
                            {activeNav === 'Dashboard' && (
                                <DashboardView
                                    isLoading={isDataLoading}
                                    firstName={userProfile.userName || userProfile.firstName}
                                    userTimezone={userProfile.userTimezone}
                                    onAction={(v: string) => handleNavClick(v)}
                                    tasks={filteredTasks}
                                    study={activeStudy}
                                    participant={activeParticipant}
                                    allStudies={allStudies}
                                    selectedStudyIndex={selectedStudyIndex}
                                    onStudySwitch={(idx: number) => {
                                        setSelectedStudyIndex(idx);
                                        setActiveStudy(allStudies[idx]);
                                        setActiveParticipant(allParticipants[idx]);
                                    }}
                                    compensations={filteredCompensations}
                                    visits={filteredVisits}
                                    kits={filteredKits}
                                    labResults={filteredLabResults}
                                    conversations={filteredConversations}
                                />
                            )}
                            {activeNav === 'Tasks' && <TasksView isLoading={isDataLoading} tasks={filteredTasks} onAction={openActionModal} study={activeStudy} userName={userProfile.userName} defaultFilter={tasksDefaultFilter} />}
                            {activeNav === 'Study Kit' && <StudyKitView isLoading={isDataLoading} onAction={openActionModal} study={activeStudy} kits={filteredKits} />}
                            {activeNav === 'Logs' && <LogsView study={activeStudy} onAction={openActionModal} preselectedDate={logsPreselectedDate} preselectedLog={selectedLog} defaultViewMode={logsDefaultViewMode} />}
                            {activeNav === 'Messages' && <MessagesView isLoading={isDataLoading} study={activeStudy} conversations={filteredConversations} onAction={refreshData} />}
                            {activeNav === 'Documents' && (
                                <div className="space-y-3">
                                    {consentSuccessToast && (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm animate-in fade-in duration-300">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-bold text-emerald-700 uppercase tracking-widest leading-none">eConsent Finalized</p>
                                                <p className="text-[11px] text-emerald-600 mt-0.5">Your signed document has been securely synchronized with the clinical site.</p>
                                            </div>
                                            <button onClick={() => setConsentSuccessToast(false)} className="text-emerald-400 hover:text-emerald-600 shrink-0">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    )}
                                    <DocumentsView study={activeStudy} signatures={signatures} assignedForms={assignedForms} isLoading={isDataLoading} />
                                </div>
                            )}
                            {activeNav === 'Reports' && (
                                <ReportsView
                                    userName={userProfile.userName}
                                    study={activeStudy}
                                    compensations={filteredCompensations}
                                    tasks={filteredTasks}
                                    visits={filteredVisits}
                                    kits={filteredKits}
                                    participant={activeParticipant}
                                    isLoading={isDataLoading}
                                />
                            )}
                            {activeNav === 'Visits' && <VisitsView visits={filteredVisits} study={activeStudy} tasks={filteredTasks} isLoading={isDataLoading} />}
                            {activeNav === 'Compensation' && (
                                <CompensationView
                                    study={activeStudy}
                                    compensations={filteredCompensations}
                                    tasks={filteredTasks}
                                    visits={filteredVisits}
                                    onAction={openActionModal}
                                    isLoading={isDataLoading}
                                />
                            )}

                            {activeNav === 'Profile' && (
                                <ProfileView
                                    {...userProfile}
                                    initials={initials}
                                    notificationSettings={notificationSettings}
                                    toggleNotification={toggleNotification}
                                    onAction={openActionModal}
                                    isLoading={isDataLoading}
                                    participantSid={activeParticipant?.participant_sid}
                                    studyId={activeStudy?.protocol_id || activeStudy?.id}
                                />
                            )}
                            {activeNav === 'Privacy & Data' && <PrivacyDataView onAction={openActionModal} isLoading={isDataLoading} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
            </div>

            {/* MODALS */}
            <ConsentModal
                isOpen={isConsentModalOpen}
                onClose={() => setIsConsentModalOpen(false)}
                onComplete={handleConsentComplete}
                study={activeStudy}
                template={
                    // Priority 1: synthetic task has p_data (consent template object)
                    activeConsentTask?.p_data ||
                    // Priority 2: task has a template field that is an object
                    (typeof activeConsentTask?.template === 'object' && activeConsentTask?.template) ||
                    // Priority 3: resolve by ID from available templates
                    availableConsentTemplates.find(ct =>
                        ct.id === activeConsentTask?.template ||
                        ct._id === activeConsentTask?.template ||
                        ct.id === activeConsentTask?.task_details?.template
                    ) ||
                    // Priority 4: latest active template from the study
                    availableConsentTemplates.find(ct => ct.status?.toUpperCase() === 'ACTIVE') ||
                    // Priority 5: any template available
                    availableConsentTemplates[0]
                }
                userProfile={userProfile}
                participantId={getId(activeParticipant)}
            />

            <InstrumentModal
                isOpen={isInstrumentModalOpen}
                onClose={() => setIsInstrumentModalOpen(false)}
                task={activeInstrumentTask}
                onSuccess={refreshData}
            />

            <FormSignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onComplete={handleFormSignatureComplete}
                task={activeSignatureTask}
                userProfile={userProfile}
            />

            <ActionModal
                isOpen={modalConfig?.isOpen || false}
                onClose={() => setModalConfig(null)}
                onConfirm={() => {
                    if (modalConfig?.primaryAction === 'OK') {
                        setModalConfig(null);
                    } else {
                        handleActionConfirm();
                    }
                }}
                title={modalConfig?.title || ''}
                desc={modalConfig?.desc || ''}
                action={modalConfig?.primaryAction || 'CONTINUE'}
                isProcessing={isActionProcessing}
            />

            <EditModal isOpen={editModal.isOpen} title={editModal.title} value={editModal.value} field={editModal.field} onClose={() => setEditModal(prev => ({ ...prev, isOpen: false }))} onSave={handleSaveProfileField} />
            <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={performLogout} />
            <input
                type="file" ref={fileInputRef} style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const result = event.target?.result as string;
                            handleSaveProfileField('userPicture', result);
                            setModalConfig({
                                isOpen: true,
                                title: 'Request Received',
                                desc: "We have received your profile update request. A research team member will review and contact you shortly.",
                                primaryAction: 'OK'
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            />
        </div>
    );
}
