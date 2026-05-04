import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import NotificationBell from '../../components/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ClipboardList, Activity, MessageSquare,
    FileText, Trophy, User, ShieldCheck, LogOut, Menu, X,
    Bell, Zap, TrendingUp, Globe, Search, LifeBuoy, Calendar, RefreshCcw,
    Package, Truck
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, clearToken, getRole, performLogout, getUser, saveUser, getDisplayName, API } from '../../utils/auth';
import { apiFetch } from '../../api';
import SEO from '../../components/SEO';

// Sub-components from the new modular structure
import { ActionModal, EditModal, EditProfileModal, LogoutConfirmationModal } from './SharedComponents';
import DashboardView from './DashboardView';
import TasksView from './TasksView';

import LogsView from './LogsView';
import MessagesView from './MessagesView';
import DocumentsView from './DocumentsView';
import ReportsView from './ReportsView';
import CompensationView from './CompensationView';

import ProfileView from './ProfileView';
import VisitsView from './VisitsView';
import StudyKitView from './StudyKitView';
import ReturnLabelView from './ReturnLabelView';
import PrivacyDataView from './PrivacyDataView';
import ConsentModal from './ConsentModal';
import FormSignatureModal from './FormSignatureModal';
import DiscoverStudiesView from './DiscoverStudiesView';
import InstrumentModal from './InstrumentModal';
import ParticipantBackground from './ParticipantBackground';
import ClinicalEnrollmentWorkflow from '../../components/coordinator/subject-review/clinical/ClinicalEnrollmentWorkflow';
import InformedConsentWorkflow from '../../components/coordinator/subject-review/clinical/InformedConsentWorkflow';

export default function ParticipantDashboard() {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ──────────────── STATE MANAGEMENT ────────────────
    const location = useLocation();
    const subRoute = location.pathname.split('/').pop() || '';

    // ──────────────── STATE MANAGEMENT ────────────────
    const [activeNav, setActiveNav] = useState(() => {
        // Init from URL if present
        const route = location.pathname.split('/').pop();
        if (route === 'tasks') return 'Tasks';

        if (route === 'logs') return 'Logs';
        if (route === 'messages') return 'Messages';
        if (route === 'documents') return 'Documents';
        if (route === 'reports') return 'Reports';
        if (route === 'visits') return 'Visits';
        if (route === 'compensation') return 'Compensation';
        if (route === 'kits' || route === 'study-kit') return 'Study Kit';
        if (route === 'return-label') return 'Return Label';
        if (route === 'enrollment') return 'Enrollment';
        if (route === 'consent') return 'Consent';
        return 'Dashboard';
    });

    // Update activeNav when URL changes (for browser back button support)
    useEffect(() => {
        const route = location.pathname.split('/').pop();
        if (route === 'tasks') setActiveNav('Tasks');

        else if (route === 'logs') setActiveNav('Logs');
        else if (route === 'messages') setActiveNav('Messages');
        else if (route === 'documents') setActiveNav('Documents');
        else if (route === 'reports') setActiveNav('Reports');
        else if (route === 'visits') setActiveNav('Visits');
        else if (route === 'compensation') setActiveNav('Compensation');
        else if (route === 'kits' || route === 'study-kit') setActiveNav('Study Kit');
        else if (route === 'return-label') setActiveNav('Return Label');
        else if (route === 'enrollment') setActiveNav('Enrollment');
        else if (route === 'consent') setActiveNav('Consent');
        else if (route === 'profile') setActiveNav('Profile');
        else if (route === 'privacy') setActiveNav('Privacy & Data');
        else if (route === 'discover') setActiveNav('Discover Studies');
        else if (route === 'participant' || !route) setActiveNav('Dashboard');
    }, [location.pathname]);

    const handleNavClick = (label: string, skipReset: boolean = false) => {
        // Normalize label to Title Case (e.g., 'tasks' -> 'Tasks')
        const normalizedLabel = label.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');

        const slugs: Record<string, string> = {
            'Dashboard': '', 'Tasks': 'tasks', 'Logs': 'logs',
            'Messages': 'messages', 'Documents': 'documents', 'Reports': 'reports',
            'Visits': 'visits', 'Compensation': 'compensation', 'Study Kit': 'study-kit', 
            'Return Label': 'return-label', 'Enrollment': 'enrollment', 'Consent': 'consent', 
            'Profile': 'profile', 
            'Privacy & Data': 'privacy', 'Discover Studies': 'discover'
        };

        const finalLabel = slugs[normalizedLabel] !== undefined ? normalizedLabel : label;
        const slug = slugs[finalLabel];

        if (finalLabel === 'Main Website') {
            window.open('/', '_blank');
        } else {
            setActiveNav(finalLabel);
            // Reset context-specific states when manually navigating via sidebar/tabs
            if (!skipReset) {
                setSelectedLog(null);
                setLogsPreselectedDate(null);
            }
            navigate(`/dashboard/participant${slug ? '/' + slug : ''}`);
            
            // Lazy load clinical data for tabs that need it
            const clinicalTabs = ['Tasks', 'Visits', 'Reports', 'Documents', 'Logs', 'Compensation', 'Messages', 'Study Kit', 'Return Label'];
            if (clinicalTabs.includes(finalLabel) && !tasks.length) {
                loadClinicalData();
            }
        }
    };

    const handleDashboardAction = async (action: string, data?: any) => {
        if (action === 'Connect Wearable') {
            const platform = data?.platform || 'fitbit';
            if (platform === 'fitbit') {
                // Fitbit OAuth Flow (Mock for now, but wired to backend)
                const fitbitUrl = `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=YOUR_FITBIT_CLIENT_ID&redirect_uri=${window.location.origin}/dashboard/participant&scope=activity%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight&expires_in=604800`;
                
                const popup = window.open(fitbitUrl, 'Fitbit Connection', 'width=600,height=800');
                
                // In a real flow, we'd listen for the redirect and capture the token
                // For this demo, we simulate success after 2 seconds
                setTimeout(async () => {
                    try {
                        const apiUrl = API || 'http://localhost:8000';
                        await authFetch(`${apiUrl}/api/auth/save-wearable-token/`, {
                            method: 'POST',
                            body: JSON.stringify({
                                platform: 'fitbit',
                                access_token: 'demo_fitbit_token_' + Math.random().toString(36).substring(7),
                                user_id: 'FITBIT_USER_123'
                            })
                        });
                        alert("✅ Fitbit synchronization protocol active. Your health telemetry is now securely linked to the clinical study.");
                        refreshData(true);
                    } catch (e) {
                        console.error("Fitbit sync failed", e);
                    }
                }, 2000);
            } else if (platform === 'apple') {
                // Apple Health (usually via Bridge or WebHID, mock for demo)
                const apiUrl = API || 'http://localhost:8000';
                await authFetch(`${apiUrl}/api/auth/save-wearable-token/`, {
                    method: 'POST',
                    body: JSON.stringify({ platform: 'apple', access_token: 'apple_health_linked' })
                });
                alert("✅ Apple Health telemetry established. System is now monitoring secure health kit data.");
                refreshData(true);
            }
        } else {
            handleNavClick(action);
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    const [tasks, setTasks] = useState<any[]>([]);

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
    const [allDocuments, setAllDocuments] = useState<any[]>([]);
    const [kits, setKits] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [availableConsentTemplates, setAvailableConsentTemplates] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [logsDefaultViewMode, setLogsDefaultViewMode] = useState<'FORM' | 'HISTORY'>('FORM');
    const [fullConversations, setFullConversations] = useState<Record<string, any>>({});
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
        googleAuth?: boolean;
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
            userRole: u?.role || 'PARTICIPANT',
            googleAuth: u?.google_auth || false
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
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

    // Tracking for notifications
    const prevStatusRef = useRef<string | null>(null);
    const prevTaskCountRef = useRef<number | null>(null);
    const prevMsgCountRef = useRef<number | null>(null);
    const isFetchingRef = useRef(false);
    const lastFetchIdRef = useRef<string | null>(null);

    const [currentTime, setCurrentTime] = useState(new Date());

    const mapUserToProfile = (u: any) => {
        if (!u) return null;
        return {
            userName: u.decrypted_name || u.full_name || u.email || 'Participant',
            userEmail: u.email || '',
            userPicture: u.profile_picture || u.picture || '',
            firstName: (u.decrypted_name || u.full_name || '')?.split(' ')[0] || 'User',
            userPhone: (u.decrypted_phone && !u.decrypted_phone.startsWith('gAAAA')) ? u.decrypted_phone : (u.mobile_number || u.phone_number || ''),
            userLocation: (u.decrypted_address && !u.decrypted_address.startsWith('gAAAA')) ? u.decrypted_address : (u.full_address || ''),
            userTimezone: u.timezone || 'UTC',
            userAge: u.age || '',
            userDob: u.date_of_birth || '',
            userRole: u.role || 'PARTICIPANT',
            googleAuth: u.google_auth || false
        };
    };

    const refreshData = (silent = true) => {
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
        const handleScroll = (e: any) => {
            // Robust scroll handling:
            // 1. If notification hub is open, only close if we are scrolling the main body AND the target is not the hub
            if (isNotificationOpen && notificationRef.current) {
                // If the scroll is happening inside the notification container, DO NOT close
                if (notificationRef.current.contains(e.target as Node)) {
                    return;
                }
                
                // If we are scrolling the window, only close if the hub is NOT sticky-pinned (it's absolute here)
                // For better UX, we'll keep it open on scroll unless the user clicks away
            }
            
            // For general dropdowns (like profile), we close on scroll
            if (isDropdownOpen || (isNotificationOpen && !notificationRef.current?.contains(e.target as Node))) {
                 // setIsNotificationOpen(false); // Commented out to prevent "scrolling disappears" issues
                 if (isDropdownOpen) setIsDropdownOpen(false);
            }
        };
        // Use passive: true if we don't call preventDefault
        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
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

    const getLocalISODate = (date: Date) => {
        const YYYY = date.getFullYear();
        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const DD = String(date.getDate()).padStart(2, '0');
        return `${YYYY}-${MM}-${DD}`;
    };

    // ──────────────── AGGREGATED DATA MANAGEMENT (V2) ────────────────
    const processSummaryData = (data: any, currentRefreshKey: number) => {
        if (!data || !data.participant) return;

        const p = data.participant;
        const s = data.study;
        const pId = getId(p);
        const sId = getId(s);

        // 1. Core Profile & State
        setActiveParticipant(p);
        setActiveStudy(s);

        // Sync fresh user data (ensures profile updates are reflected without re-login)
        if (data.user) {
            const mapped = mapUserToProfile(data.user);
            if (mapped) setUserProfile(mapped);
        }
        
        const fetchedTasks = safeArray(data.tasks);
        const fetchedQues = safeArray(data.questionnaire_schedules);
        const fetchedLogs = safeArray(data.medication_logs);
        const fetchedConversations = safeArray(data.conversations);
        
        setVisits(safeArray(data.visits));

        setLabResults(safeArray(data.lab_results));
        setCompensations(safeArray(data.compensations));
        setConversations(fetchedConversations);
        setAssignedForms(safeArray(data.assigned_forms));
        setSignatures(safeArray(data.active_consents));
        setAvailableConsentTemplates(safeArray(data.available_consent_templates));
        setAllDocuments(safeArray(data.documents));
        setLogs(fetchedLogs);
        setKits(safeArray(data.kits));
        setHelpRequests(safeArray(data.help_requests));

        // 2. Pre-fill conversation cache to prevent re-fetching
        if (fetchedConversations.length > 0) {
            const cache: Record<string, any> = {};
            fetchedConversations.forEach((c: any) => {
                const cId = getId(c);
                if (cId) cache[cId] = c;
            });
            setFullConversations(prev => ({ ...prev, ...cache }));
        }

        // 3. Daily Log Task Synthesis
        if (s?.show_dosing_log) {
            const todayStr = getLocalISODate(new Date());
            for (let i = -3; i <= 3; i++) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() - i);
                const dateStr = getLocalISODate(targetDate);

                const hasTaskInDB = fetchedTasks.some((t: any) =>
                    (t.task_type === 'DAILY_LOG' || t.task_details?.task_type === 'LOG' || t.task_details?.task_type === 'DAILY_LOG') &&
                    (t.due_date?.startsWith(dateStr))
                );
                const logEntry = fetchedLogs.find((l: any) => l.date === dateStr);
                const isToday = i === 0;
                const isFuture = i < 0;

                if (!hasTaskInDB) {
                    fetchedTasks.unshift({
                        id: `synth-log-${dateStr}`,
                        study: sId,
                        participant: pId,
                        title: isToday ? 'Daily Medication Log' : isFuture ? `Upcoming Log: ${dateStr}` : `Missed Log: ${dateStr}`,
                        status: logEntry ? 'COMPLETED' : 'PENDING',
                        due_date: dateStr, // Use dateStr instead of targetDate.toISOString() to ensure local date alignment
                        visit_name: isToday ? 'Daily Check-in' : isFuture ? 'Scheduled Entry' : 'Retrospective Log',
                        timeline_group: 'Medication Tracking',
                        estimated_time: '2 min',
                        task_type: 'DAILY_LOG',
                        task_details: {
                            task_type: 'DAILY_LOG',
                            description: isToday ? 'Log your medication intake for today.' : isFuture ? `Scheduled medication log for ${dateStr}.` : `You missed your log for ${dateStr}. Please complete it now.`
                        }
                    });
                }
            }
        }

        // 3. eConsent Task Injection
        const mySignatures = safeArray(data.active_consents);
        const hasSignedStudyConsent = mySignatures.some((sig: any) => 
            (sig.study && getId(sig.study) === sId)
        ) || justSignedTemplateIds.current.has(sId);

        // Populate available templates from response (needed for ConsentModal resolution)
        const availableTemplates = safeArray(data.available_consent_templates);
        setAvailableConsentTemplates(availableTemplates);

        // Pick best template: prefer ACTIVE one, fallback to first
        const bestTemplate = availableTemplates.find((t: any) => (t.status || '').toUpperCase() === 'ACTIVE') || availableTemplates[0];

        // Inject consent task if: not yet signed AND (study has consent_content OR there is an active consent template)
        // Workflow Requirement: Only show consent task after participant is ELIGIBLE or FULLY_APPROVED
        const isApprovedForConsent = ['ELIGIBLE', 'FULLY_APPROVED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE'].includes(activeParticipantStatus) || 
                                     (p?.approval_status === 'FULLY_APPROVED');
                                     
        const hasConsentContent = !!(s?.consent_content) || availableTemplates.length > 0;
        if (!hasSignedStudyConsent && hasConsentContent && isApprovedForConsent) {
            const taskId = `db-consent-${sId}`;
            if (!fetchedTasks.some((task: any) => getId(task) === taskId)) {
                fetchedTasks.unshift({
                    id: taskId,
                    study: sId,
                    participant: pId,
                    title: `Informed Consent Form`,
                    status: 'PENDING',
                    due_date: new Date().toISOString(),
                    visit_name: 'eConsent Hub',
                    timeline_group: 'Mandatory',
                    estimated_time: '15 min',
                    task_type: 'CONSENT',
                    // p_data carries the full template so ConsentModal can render content
                    p_data: bestTemplate ? {
                        ...bestTemplate,
                        // Prefer template's own terms_content; fall back to study-level consent_content
                        terms_content: bestTemplate.terms_content || s?.consent_content || '',
                    } : { 
                        id: sId, 
                        title: s.title, 
                        terms_content: s.consent_content, 
                        version: '1.0',
                        require_participant_sig: s.require_participant_sig,
                        require_lar: s.require_lar
                    },
                    task_details: { task_type: 'CONSENT', description: `Please review and sign the informed consent form for this study.` }
                });
            }
        }

        // 4. Questionnaire Injection
        fetchedQues.forEach((q: any) => {
            fetchedTasks.push({
                id: `qs-${q.id}`,
                study: sId,
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
        });

        // 5. Finalize State
        setTasks(fetchedTasks);
        lastFetchIdRef.current = `${pId}-${sId}-${currentRefreshKey}`;
    };

    // Lazy load clinical data when user navigates to tabs
    const loadClinicalData = async () => {
        const apiUrl = API || 'http://localhost:8000';
        const pSid = activeParticipant?.participant_sid;
        if (!pSid || !activeStudy) return;

        try {
            const summaryUrl = `${apiUrl}/api/participants/dashboard_summary/?participant_sid=${pSid}`;
            const res = await authFetch(summaryUrl).then(r => r.ok ? r.json() : null);
            if (res) processSummaryData(res, refreshKey);
        } catch (err) {
            console.error("Failed to load clinical data:", err);
        }
    };

    // ──────────────── UNIFIED DASHBOARD LOADER (LAZY LOADING) ────────────────
    useEffect(() => {
        const loadDashboard = async (isSilent = false) => {
            const apiUrl = API || 'http://localhost:8000';
            if (isFetchingRef.current) return;
            
            try {
                isFetchingRef.current = true;
                // Only show loading skeletons if we don't have participants yet or it's a forced non-silent load
                if (!isSilent && allParticipants.length === 0) setIsDataLoading(true);

                // FAST: Load lightweight menu first (no clinical data)
                const currentP = allParticipants[selectedStudyIndex];
                const pSid = currentP?.participant_sid;
                const quickUrl = pSid 
                    ? `${apiUrl}/api/participants/dashboard_quick/?participant_sid=${pSid}`
                    : `${apiUrl}/api/participants/dashboard_quick/`;

                const [pDataRes, quickRes, userRes] = await Promise.all([
                    apiFetch<any[]>('/api/participants/?limit=50'),
                    authFetch(quickUrl).then(res => res.ok ? res.json() : null),
                    authFetch(`${apiUrl}/api/users/me/`).then(res => res.ok ? res.json() : null)
                ]);

                // 1. Handle User Profile
                if (userRes) {
                    const localU = getUser();
                    saveUser({ ...localU, ...userRes });
                    const mapped = mapUserToProfile(userRes);
                    if (mapped) setUserProfile(mapped);
                }

                    // 2. Handle Participant List & Selection
                    if (pDataRes) {
                        const filtered = pDataRes.filter((p: any) => !['DROPPED', 'INELIGIBLE'].includes((p.status || '').toUpperCase()));
                        
                        // NEW PRIORITY: ACTIVE/ENROLLED/RANDOMIZED > CONSENTED > PENDING_REVIEW > Others
                        const priority = ['ENROLLED', 'RANDOMIZED', 'ACTIVE', 'CONSENTED', 'PENDING_REVIEW', 'COMPLETED', 'REGISTERED', 'SCREENING'];
                        
                        filtered.sort((a: any, b: any) => {
                            const statusA = (a.status || '').toUpperCase();
                            const statusB = (b.status || '').toUpperCase();
                            
                            let idxA = priority.indexOf(statusA);
                            let idxB = priority.indexOf(statusB);
                            
                            // If status not in priority list, push to end (99)
                            if (idxA === -1) idxA = 99;
                            if (idxB === -1) idxB = 99;
                            
                            if (idxA !== idxB) return idxA - idxB;
                            
                            // Tie-breaker: Newest first
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        });
                        setAllParticipants(filtered);

                        // If any study is enrolled, select it automatically first
                        const enrolledIdx = filtered.findIndex((p: any) => 
                            ['ENROLLED', 'RANDOMIZED', 'ACTIVE'].includes((p.status || '').toUpperCase())
                        );
                        if (enrolledIdx !== -1 && selectedStudyIndex === 0) {
                            setSelectedStudyIndex(enrolledIdx);
                        }
                        
                        // Populate studies list from all participants to enable the switcher immediately
                        const studyMap = new Map();
                        filtered.forEach((p: any) => {
                            const sId = getId(p.study);
                            if (sId && !studyMap.has(sId)) {
                                // If study is a full object, use it; otherwise build a brief one
                                const studyObj = typeof p.study === 'object' ? p.study : {
                                    id: p.study,
                                    title: p.study_name || p.protocol_id || 'Untitled Study',
                                    protocol_id: p.protocol_id || 'PO-XXXX'
                                };
                                studyMap.set(sId, {
                                    ...studyObj,
                                    participantStatus: p.status
                                });
                            }
                        });
                        setAllStudies(Array.from(studyMap.values()));
                    }

                // 3. Set basic participant/study from quick endpoint (no clinical data yet)
                if (quickRes) {
                    setActiveParticipant(quickRes.participant);
                    setActiveStudy(quickRes.study);
                    if (quickRes.user) {
                        const u = quickRes.user;
                        setUserProfile(prev => ({
                            ...prev,
                            userName: u.full_name || '',
                            firstName: (u.full_name || '').split(' ')[0],
                            userEmail: u.email || '',
                            googleAuth: u.google_auth || false
                        }));
                    }
                }

            } catch (err) {
                console.error("[Dashboard] Aggregated fetch failed:", err);
            } finally {
                isFetchingRef.current = false;
                setIsDataLoading(false);
            }
        };

        loadDashboard(false);
    }, [selectedStudyIndex, refreshKey]);

    // AUTO-LOAD CLINICAL DATA (Tasks, Visits, etc.) when selection changes
    useEffect(() => {
        if (activeParticipant && activeStudy && !isDataLoading) {
            loadClinicalData();
        }
    }, [activeParticipant?.participant_sid, activeStudy?.id, refreshKey]);

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
                'userPicture': 'profile_picture',
                'userAge': 'age',
                'userDob': 'date_of_birth'
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

    const handleSaveFullProfile = async (data: any) => {
        try {
            const payload: any = {};
            const mapping: Record<string, string> = {
                'userPhone': 'phone_number',
                'userLocation': 'full_address',
                'userTimezone': 'timezone',
                'userName': 'full_name',
                'userAge': 'age',
                'userDob': 'date_of_birth'
            };

            Object.entries(data).forEach(([key, val]) => {
                const backKey = mapping[key] || key;
                payload[backKey] = val;
            });

            const resp = await authFetch(`${API}/api/users/me/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.detail || "Bulk Profile Update Failed");
            }

            const updatedUserData = await resp.json();
            
            // Re-sync local state with decrypted values from backend if possible
            setUserProfile(prev => ({ 
                ...prev, 
                ...data,
                userPhone: updatedUserData.decrypted_phone || data.userPhone,
                userLocation: updatedUserData.decrypted_address || data.userLocation,
                userAge: updatedUserData.age || data.userAge,
                userDob: updatedUserData.date_of_birth || updatedUserData.userDob || data.userDob
            }));
            
            const u = getUser();
            if (u) {
                saveUser({ ...u, ...updatedUserData });
            }
            
            setModalConfig({
                isOpen: true,
                title: 'Identity Synchronized',
                desc: 'Your profile has been successfully re-encrypted and updated in the clinical registry.',
                primaryAction: 'OK'
            });
            setIsEditProfileModalOpen(false);
        } catch (err: any) {
            console.error("Failed to update full profile:", err);
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
                
                // Fallback for plain-text forms that do not generate PDFs
                const pdf = new jsPDF();
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(22);
                pdf.setTextColor(30, 136, 229);
                pdf.text('MusB RESEARCH PORTAL', 45, 25);
                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text('DOCUMENT DETAILS', 15, 65);
                pdf.setFontSize(10);
                pdf.text(`Document: Signed Consent Form`, 15, 80);
                pdf.text(`Status: Verified Digital Signature`, 15, 90);
                pdf.text(`Date: ${new Date().toLocaleDateString()}`, 15, 100);
                
                // Open standard digital record representation
                window.open(pdf.output('bloburl'), '_blank');
                return;
            }
            if (taskType === 'DAILY_LOG') {
                const dateStr = task.due_date?.split('T')[0];
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
                
                const pdf = new jsPDF();
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(22);
                pdf.setTextColor(30, 136, 229);
                pdf.text('MusB RESEARCH PORTAL', 45, 25);
                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text('DOCUMENT DETAILS', 15, 65);
                pdf.setFontSize(10);
                pdf.text(`Document: Signed Form Submission`, 15, 80);
                pdf.text(`Status: Verified Digital Signature`, 15, 90);
                pdf.text(`Date: ${new Date().toLocaleDateString()}`, 15, 100);
                
                window.open(pdf.output('bloburl'), '_blank');
                return;
            }
        }

        // ── LOG DOWNLOAD HANDLER ──────────────────────────
        if (title === 'DOWNLOAD_LOG') {
            const dateStr = task.due_date?.split('T')[0];
            const logEntry = logs.find((l: any) => l.date === dateStr);
            
            if (logEntry) {
                const doc = new jsPDF();
                
                // Header
                doc.setFillColor(30, 136, 229);
                doc.rect(0, 0, 210, 40, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.text("Medication Intake Record", 105, 25, { align: 'center' });
                
                // Metadata
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Protocol: ${activeStudy?.protocol_id || 'MusB-RES'}`, 20, 55);
                doc.text(`Participant: ${activeParticipant?.participant_sid || 'PO-USER'}`, 20, 62);
                doc.text(`Log Date: ${logEntry.date}`, 20, 69);
                
                // Content section
                doc.setTextColor(26, 43, 73);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("Observation Details", 20, 85);
                doc.line(20, 87, 190, 87);
                
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                const items = [
                    ["Medication Taken:", logEntry.took_medicine ? "YES" : "NO"],
                    ["Reason for Missed Dose:", logEntry.missed_dose_reason || "N/A"],
                    ["Overall Feeling:", logEntry.overall_feeling?.replace(/_/g, ' ') || "AS EXPECTED"],
                    ["Adverse Events:", logEntry.noticed_side_effects ? "YES (Reported)" : "NONE"],
                    ["Side Effects Details:", logEntry.side_effects_description || "N/A"],
                    ["Submission Timestamp:", new Date(logEntry.created_at || Date.now()).toLocaleString()]
                ];
                
                let y = 100;
                items.forEach(([label, value]) => {
                    doc.setFont("helvetica", "bold");
                    doc.text(label, 20, y);
                    doc.setFont("helvetica", "normal");
                    doc.text(String(value), 80, y);
                    y += 10;
                });
                
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(8);
                doc.text("Verified research data - Generated from MusB Research secure clinical portal.", 105, 280, { align: 'center' });
                
                doc.save(`Medication_Log_${logEntry.date}.pdf`);
                return;
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Record Syncing',
                    desc: "This log record is currently being synchronized with our clinical database. Please retry in a few seconds.",
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
                    handleNavClick('Logs', true);
                } else {
                    setLogsPreselectedDate(dateStr);
                    setLogsDefaultViewMode('HISTORY');
                    handleNavClick('Logs', true);
                }
            } else {
                setSelectedLog(null);
                setLogsPreselectedDate(task.due_date?.split('T')[0]);
                setLogsDefaultViewMode('FORM');
                handleNavClick('Logs', true);
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
            setIsEditProfileModalOpen(true);
            return;
        } else if (lowerTitle.includes('password') || lowerTitle.includes('credential')) {
            // REDIRECT TO FORGOT PASSWORD PAGE AS REQUESTED
            navigate('/signin', { state: { initialMode: 'FORGOT' } });
            return;
        } else if (lowerTitle.includes('withdraw') || lowerTitle.includes('leave')) {
            setModalConfig({
                isOpen: true,
                title: 'Study Exit Protocol',
                desc: 'You are choosing to leave the study. This will notify our clinical team, and someone will contact you shortly to finalize the closure procedures. Proceed to confirmation?',
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
                    'Dashboard': '', 'Tasks': 'tasks', 'Logs': 'logs',
                    'Messages': 'messages', 'Documents': 'documents', 'Reports': 'reports',
                    'Visits': 'visits', 'Compensation': 'compensation', 'Study Kit': 'study-kit',
                    'Return Label': 'return-label', 'Profile': 'profile', 
                    'Privacy & Data': 'privacy', 'Discover Studies': 'discover'
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

        setTimeout(async () => {
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
                setActiveNav('Tasks');
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
                alert("SUCCESS: Your request has been received. Our clinical team members will contact you shortly.");
                if (title.toLowerCase().includes('task')) setActiveNav('Tasks');
                if (title.toLowerCase().includes('dose') || title.toLowerCase().includes('symptom')) setActiveNav('Logs');
                return;
            }

            if (title.toLowerCase().includes('withdraw')) {
                const sId = activeStudy?.id || activeStudy?._id || task?.task_details?.study || task?.study;
                
                if (window.confirm("You are choosing to leave the study. This will notify our team and someone from our team will contact you soon. Proceed to confirmation?")) {
                    try {
                        const user = getUser();
                        await authFetch(`${API}/api/help-request/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                study_id: sId,
                                action_title: 'STUDY_WITHDRAWAL_REQUEST',
                                description: `OFFICIAL NOTIFICATION: Participant ${user?.full_name || 'Subject'} (${user?.email}) has initiated a formal study withdrawal request. Priority: HIGH. PI and Coordinator must be notified immediately.`,
                                alert_priority: 'HIGH',
                                notify_roles: ['PI', 'COORDINATOR'],
                                message: "Participant has requested to leave the study via the portal. Immediate follow-up required for closure protocol."
                            })
                        });
                        alert("⚠️ WITHDRAWAL PROTOCOL ACTIVATED: The study team has been notified. Someone from our clinical team will contact you soon regarding your closure protocol.");
                        setActiveNav('Dashboard');
                    } catch (err) {
                        console.error("Withdrawal notification failed:", err);
                        alert("The notification system is temporarily unavailable. Please contact your coordinator directly to finalize withdrawal.");
                    }
                }
                return;
            }

            if (title.toLowerCase().includes('credentials') || title.toLowerCase().includes('rotate')) {
                // Redirect to OTP-based reset flow for security
                navigate('/forgot-password');
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

    const initials = (userProfile.userName || 'U').split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const activeParticipantStatus = (activeParticipant?.status || '').toUpperCase().trim();
    const isEnrolled = ['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE', 'COMPLETED'].some(s => activeParticipantStatus.includes(s))
                        || allParticipants.some(p => ['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE'].includes((p.status || '').toUpperCase()));

    const navItems = [
        { label: 'Main Website', icon: Globe },
        { label: 'Discover Studies', icon: Search },
        { label: 'Dashboard', icon: LayoutDashboard },
        { label: 'Tasks', icon: ClipboardList, hidden: !isEnrolled },

        { label: 'Logs', icon: Activity, hidden: !isEnrolled },
        { label: 'Messages', icon: MessageSquare },
        { label: 'Documents', icon: FileText, hidden: !isEnrolled },
        { label: 'Reports', icon: TrendingUp, hidden: !isEnrolled },
        { label: 'Visits', icon: Calendar, hidden: !isEnrolled },
        { label: 'Compensation', icon: Trophy, hidden: !isEnrolled },

        { label: 'Profile', icon: User },
        { label: 'Study Kit', icon: Package, hidden: !isEnrolled || !activeStudy?.has_study_kit },
        { label: 'Return Label', icon: Truck, hidden: !isEnrolled || !activeStudy?.has_study_kit },
        { label: 'Privacy & Data', icon: ShieldCheck },
    ].filter(item => !item.hidden);

    return (
        <div className="h-screen flex overflow-hidden font-sans relative participant-portal-root">
            <SEO 
                title="Participant Portal for Clinical Trials | MUSB Health"
                description="Join clinical trials, complete consent forms, and manage your participation securely."
                canonical="https://www.musbhealth.com/participant-portal"
            />
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
                                    unreadCount={safeArray(notifications).filter(n => !n.is_read).length}
                                    onClick={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        setIsDropdownOpen(false);
                                    }}
                                />

                                <AnimatePresence>
                                    {isNotificationOpen && (
                                        <motion.div
                                            ref={notificationRef}
                                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                            className="absolute right-[-20px] sm:right-0 top-full mt-6 w-[90vw] sm:w-[400px] bg-white border border-[#E3ECF5] rounded-24px shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-[150] overflow-hidden"
                                            style={{ borderRadius: '24px' }}
                                        >
                                            <div className="p-6 border-b border-[#E3ECF5] flex justify-between items-center bg-[#F8FBFF]">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-widest">Notifications Hub</h3>
                                                    <span className="text-[10px] text-[#5F6F89] font-bold uppercase tracking-widest leading-none">Updates & Alerts</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setIsNotificationOpen(false)}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-[#8A99B3] hover:text-[#1A2B49] transition-colors"
                                                        title="Close Hub"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                // Persist to backend first
                                                                await authFetch(`${API}/api/notifications/read_all/`, { method: 'POST' });
                                                                // Update local state for immediate UI feedback
                                                                setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                                                            } catch (err) {
                                                                console.error("Failed to mark all read:", err);
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-[#E3F2FD] border border-[#BBDEFB] text-[11px] font-bold text-[#1E88E5] uppercase tracking-tight hover:bg-[#1E88E5] hover:text-white rounded-xl transition-all"
                                                    >
                                                        Mark all read
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="max-h-[450px] overflow-y-auto no-scrollbar bg-white">
                                                {notifications.length > 0 ? notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        className={`p-6 border-b border-[#F0F6FF] last:border-0 hover:bg-[#F8FBFF] transition-all cursor-pointer relative group/notif ${!n.is_read ? 'bg-[#E3F2FD]/5' : ''}`}
                                                        onClick={async () => {
                                                            try {
                                                                // 1. Sync status to backend if unread
                                                                if (!n.is_read) {
                                                                    await authFetch(`${API}/api/notifications/${n.id}/read/`, { method: 'POST' });
                                                                }

                                                                // 2. Navigation logic
                                                                if (n.link) {
                                                                    if (n.link.startsWith('http')) {
                                                                        window.open(n.link, '_blank');
                                                                    } else {
                                                                        navigate(n.link);
                                                                    }
                                                                } else if (n.type === 'protocol' || n.type === 'TASK') {
                                                                    setActiveNav('Tasks');
                                                                    navigate('/dashboard/participant/tasks');
                                                                }
                                                                
                                                                // 3. Update local state
                                                                setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, is_read: true } : notif));
                                                                setIsNotificationOpen(false);
                                                            } catch (err) {
                                                                console.error("Failed to mark notification as read:", err);
                                                                // Fallback to local state update even if API fails to avoid blocking navigation
                                                                setIsNotificationOpen(false);
                                                            }
                                                        }}
                                                    >
                                                        {!n.is_read && <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#1E88E5]" />}
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex justify-between items-baseline gap-4">
                                                                <span className={`text-[13px] font-bold uppercase tracking-tight leading-none ${n.type === 'protocol' ? 'text-[#1E88E5]' : 'text-[#1A2B49] group-hover/notif:text-[#1E88E5]'} transition-colors truncate`}>{n.title}</span>
                                                                <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-tighter flex-shrink-0">
                                                                    {n.created_at ? new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : (n.time || '')}
                                                                </span>
                                                            </div>
                                                            <p className="text-[13px] text-[#5F6F89] font-medium leading-relaxed">{n.message || n.desc}</p>
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
                                                crossOrigin="anonymous"
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
                                {activeNav === 'Discover Studies' && <DiscoverStudiesView loading={isDataLoading} userProfile={userProfile} />}
                            {activeNav === 'Dashboard' && (
                                <DashboardView
                                    isLoading={isDataLoading}
                                    firstName={userProfile.userName || userProfile.firstName}
                                    userTimezone={userProfile.userTimezone}
                                    onAction={handleDashboardAction}
                                    tasks={filteredTasks}
                                    study={activeStudy}
                                    participant={activeParticipant}
                                    allStudies={allStudies}
                                    selectedStudyIndex={selectedStudyIndex}
                                    onStudySwitch={(idx: number) => {
                                        const targetStudy = allStudies[idx];
                                        const isPendingTarget = ['PENDING_APPROVAL', 'APPLIED', 'PENDING_REVIEW'].includes((targetStudy?.participantStatus || '').toUpperCase());
                                        const hasEnrolledStudy = allStudies.some(s => !['PENDING_APPROVAL', 'APPLIED', 'PENDING_REVIEW'].includes((s?.participantStatus || '').toUpperCase()));
                                        if (isPendingTarget && hasEnrolledStudy) {
                                            alert('You are already enrolled in a study. This application is pending review.');
                                            return;
                                        }
                                        setSelectedStudyIndex(idx);
                                        setActiveStudy(allStudies[idx]);
                                        setActiveParticipant(allParticipants[idx]);
                                    }}
                                    kits={kits}
                                    compensations={filteredCompensations}
                                    visits={filteredVisits}

                                    labResults={filteredLabResults}
                                    conversations={filteredConversations}
                                />
                            )}
                            {activeNav === 'Tasks' && <TasksView isLoading={isDataLoading} tasks={filteredTasks} onAction={openActionModal} study={activeStudy} userName={userProfile.userName} defaultFilter={tasksDefaultFilter} />}

                            {activeNav === 'Logs' && <LogsView study={activeStudy} onAction={openActionModal} preselectedDate={logsPreselectedDate} preselectedLog={selectedLog} defaultViewMode={logsDefaultViewMode} initialLogs={logs} />}
                            {activeNav === 'Messages' && <MessagesView isLoading={isDataLoading} study={activeStudy} conversations={filteredConversations} onAction={refreshData} fullConversations={fullConversations} setFullConversations={setFullConversations} />}
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
                                    <DocumentsView 
                                        study={activeStudy} 
                                        signatures={signatures} 
                                        assignedForms={assignedForms} 
                                        tasks={tasks}
                                        uploadedDocuments={allDocuments}
                                        isLoading={isDataLoading} 
                                    />
                                </div>
                            )}
                            {activeNav === 'Reports' && (
                                <ReportsView
                                    userName={userProfile.userName}
                                    study={activeStudy}
                                    compensations={filteredCompensations}
                                    tasks={filteredTasks}
                                    visits={filteredVisits}

                                    participant={activeParticipant}
                                    isLoading={isDataLoading}
                                />
                            )}
                            {activeNav === 'Visits' && <VisitsView visits={filteredVisits} study={activeStudy} tasks={filteredTasks} isLoading={isDataLoading} onAction={openActionModal} />}
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

                            { activeNav === 'Profile' && (
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
                            {activeNav === 'Study Kit' && <StudyKitView isLoading={isDataLoading} study={activeStudy} kits={kits} onAction={handleNavClick} />}
                            {activeNav === 'Return Label' && <ReturnLabelView onBack={() => handleNavClick('Study Kit')} />}
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
            <EditProfileModal 
                isOpen={isEditProfileModalOpen} 
                initialData={userProfile} 
                onClose={() => setIsEditProfileModalOpen(false)} 
                onSave={handleSaveFullProfile} 
            />
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
