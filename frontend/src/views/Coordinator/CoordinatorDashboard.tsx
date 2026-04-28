import React, { useState, useEffect, useRef, useCallback } from 'react';
import NotificationBell from '../../components/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, clearToken, getRole, performLogout, getUser, getDisplayName, API } from '../../utils/auth';
import { apiFetch } from '../../api';
import SEO from '../../components/SEO';
import LogoutConfirmationModal from '../../components/LogoutConfirmationModal';
import SubmitContentForms from '../../components/coordinator/SubmitContentForms';
import LaunchStudyForm from '../../components/coordinator/LaunchStudyForm';
import SponsorsManagement from '../../components/coordinator/SponsorsManagement';
import CCC_MessagesModule from '../../components/coordinator/CCMessagesModule';
import CCC_SubjectReviewModule from '../../components/coordinator/subject-review/SubjectReviewModule';
import CCC_TeamModule from '../../components/coordinator/team/TeamModule';
import CCC_VisitsAssessmentsModule from '../../components/coordinator/VisitsModule';


// New Coordinator Panel Modules (Mirrored from PI)
import ParticipantOversight from '../../components/coordinator/panels/ParticipantOversight';
import FormsQuestionnairesModule from '../../components/coordinator/panels/FormsQuestionnairesModule';
import CCConsentModule from '../../components/coordinator/consent/ConsentModule';
import LabsResultsModule from '../../components/coordinator/panels/LabsResultsModule';
import ReportsSignOffModule from '../../components/coordinator/panels/ReportsSignOffModule';
import StudyDocumentsModule from '../../components/coordinator/panels/StudyDocumentsModule';
import MyDocumentsModule from '../../components/coordinator/credentials/CredentialsEntry';
import AlertsModule from '../../components/coordinator/panels/AlertsModule';
import AnalyticsModule from '../../components/coordinator/panels/AnalyticsModule';
import AnimatedBackground from '../../components/AnimatedBackground';
import StaffTasksModule from '../../components/shared/StaffTasksModule';

import ParticipantTaskManagement from '../../components/shared/ParticipantTaskManagement';
import CompensationManagement from '../../components/coordinator/panels/CompensationManagement';
import StudyKitsModule from '../../components/shared/StudyKitsModule';
import ConsentOversight from '../../components/coordinator/panels/ConsentOversight';

// Modular Page Components
import { OperationsOversight } from './modules/OperationsOversight';
import { StudyDirectory } from './modules/StudyDirectory';
import InvitationsModule from '../../components/shared/InvitationsModule';
import { usePolling } from '@/hooks/usePolling';


import {
    Calendar, Clock, ArrowRight, ChevronRight, ChevronLeft, Sparkles, Trophy,
    Activity, FileText, CheckCircle2, Zap, PlusCircle,
    AlertCircle, MessageSquare, Microscope, History,
    TrendingUp, Award, LayoutDashboard, Bell, Info, ExternalLink,
    Play, Download, ClipboardList, Beaker, DraftingCompass, Users,
    ShieldCheck, Settings, Search, ChevronDown, Plus, X, Filter,
    HelpCircle, Stethoscope, UsersRound, ArrowUpRight, LogOut,
    Globe, Rocket, Menu, FlaskConical, FileSearch, Layers,
    ListFilter, CheckSquare, ScrollText, Settings2, Database,
    AlertTriangle, FileCheck, Briefcase, DollarSign, Truck, UserPlus
} from 'lucide-react';

type CCModule =
    | 'WEBSITE'
    | 'OVERSIGHT'
    | 'STUDIES'
    | 'TEAM'
    | 'PARTICIPANTS'
    | 'FORMS'
    | 'CONSENT'
    | 'VISITS'
    | 'LABS'
    | 'REPORTS'
    | 'STUDY_DOCS'
    | 'MY_DOCS'
    | 'MESSAGES'
    | 'ALERTS'
    | 'INVITATIONS'
    | 'LAUNCH_STUDY'
    | 'SPONSORS'
    | 'TASKS'
    | 'ANALYTICS'

    | 'COMPENSATION'
    | 'LOGISTICS'
    | 'PARTICIPANT_TASKS'
    | 'CONSENT_NEW'
    | 'ENROLLMENT_WORKFLOW';

export default function CoordinatorDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(String(getRole()).toUpperCase());

    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [initialTab, setInitialTab] = useState('Overview');

    const [activeModule, setActiveModule] = useState<CCModule>(() => {
        const path = location.pathname.toLowerCase().replace(/\/$/, "");
        const parts = path.split('/');
        
        // Deep Link: /participants/:id
        if (path.includes('/participants/')) {
            const pIdx = parts.indexOf('participants');
            if (parts[pIdx + 1]) {
                // We'll set this in useEffect to avoid state update during render,
                // but the module should be PARTICIPANTS
                return 'PARTICIPANTS';
            }
        }

        const route = parts[parts.length - 1];
        if (route === 'studies') return 'STUDIES';
        if (route === 'team') return 'TEAM';
        if (route === 'participants') return 'PARTICIPANTS';
        if (route === 'forms') return 'FORMS';
        if (route === 'consent') return 'CONSENT';
        if (route === 'visits') return 'VISITS';
        if (route === 'labs') return 'LABS';
        if (route === 'reports') return 'REPORTS';
        if (route === 'study-docs') return 'STUDY_DOCS';
        if (route === 'my-docs') return 'MY_DOCS';
        if (route === 'messages') return 'MESSAGES';
        if (route === 'alerts') return 'ALERTS';
        if (route === 'invitations') return 'INVITATIONS';
        if (route === 'launch-study') return 'LAUNCH_STUDY';
        if (route === 'analytics') return 'ANALYTICS';
        if (route === 'sponsors') return 'SPONSORS';
        if (route === 'tasks') return 'TASKS';
        if (route === 'logistics') return 'LOGISTICS';

        if (route === 'participant-tasks') return 'PARTICIPANT_TASKS';
        return 'OVERSIGHT';
    });

    const mountGuard = useRef({ checkMissed: false, fetchContent: false, notifications: false });

    // Sync activeModule when URL changes (for browser back button support)
    useEffect(() => {
        const path = location.pathname.toLowerCase().replace(/\/$/, "");
        const parts = path.split('/');
        const route = parts[parts.length - 1];

        // Deep Link Detection
        if (path.includes('/participants/')) {
            const pIdx = parts.indexOf('participants');
            const pId = parts[pIdx + 1];
            const sub = parts[pIdx + 2];
            
            if (pId) {
                if (pId !== selectedParticipantId) setSelectedParticipantId(pId);
                setActiveModule('PARTICIPANTS');
                if (sub === 'logs') setInitialTab('Safety');
                else if (sub === 'assessments') setInitialTab('Outcomes');
                else setInitialTab('Overview');
                return;
            }
        }

        if (route === 'coordinator' || !route || route === 'oversight') setActiveModule('OVERSIGHT');
        else if (route === 'studies') setActiveModule('STUDIES');
        else if (route === 'participants' || route === 'subject-review' || route === 'review') {
            setActiveModule('PARTICIPANTS');
            setSelectedParticipantId(null);
        }
        else if (route === 'team') setActiveModule('TEAM');
        else if (route === 'messages') setActiveModule('MESSAGES');
        else if (route === 'labs') setActiveModule('LABS');
        else if (route === 'reports') setActiveModule('REPORTS');
        else if (route === 'study-docs' || route === 'docs') setActiveModule('STUDY_DOCS');
        else if (route === 'my-docs') setActiveModule('MY_DOCS');
        else if (route === 'alerts') setActiveModule('ALERTS');
        else if (route === 'invitations') setActiveModule('INVITATIONS');
        else if (route === 'launch-study') setActiveModule('LAUNCH_STUDY');
        else if (route === 'analytics') setActiveModule('ANALYTICS');
        else if (route === 'tasks') setActiveModule('TASKS');
        else if (route === 'logistics') setActiveModule('LOGISTICS');
        else if (route === 'participant-tasks') setActiveModule('PARTICIPANT_TASKS');
        else if (route === 'sponsors') setActiveModule('SPONSORS');

        else if (route === 'compensation' || route === 'rewards') setActiveModule('COMPENSATION');
        else if (location.pathname.includes('/dashboard/coordinator')) {
            // Stay consistent with dashboard root
            if (location.pathname.endsWith('/coordinator')) setActiveModule('OVERSIGHT');
        }
    }, [location.pathname, navigate]);

    // [PERFORMANCE] One-time Dashboard Initialization
    useEffect(() => {
        const initializeDashboard = async () => {
            if (mountGuard.current.checkMissed) return;
            mountGuard.current.checkMissed = true;

            try {
                const res = await authFetch(`${API}/api/visits/check_missed/`, { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.missed_marked > 0) {
                        addToast(`DEVIATION ALERT: ${data.missed_marked} participants missed scheduled visits. Marking as MISSED.`, 'danger');
                    }
                }
            } catch (e) { /* silent check */ }
        };

        initializeDashboard();
    }, []);

    const handleModuleChange = (mod: CCModule) => {
        const slugs: Record<string, string> = {
            'OVERSIGHT': '',
            'STUDIES': 'studies',
            'TEAM': 'team',
            'PARTICIPANTS': 'participants',
            'FORMS': 'forms',
            'CONSENT': 'consent',
            'VISITS': 'visits',
            'LABS': 'labs',
            'REPORTS': 'reports',
            'STUDY_DOCS': 'study-docs',
            'MY_DOCS': 'my-docs',
            'MESSAGES': 'messages',
            'ALERTS': 'alerts',
            'INVITATIONS': 'invitations',
            'LAUNCH_STUDY': 'launch-study',
            'TASKS': 'tasks',
            'ANALYTICS': 'analytics',
            'SPONSORS': 'sponsors',

            'COMPENSATION': 'compensation',
            'ENROLLMENT_WORKFLOW': 'enrollment-workflow',
            'LOGISTICS': 'logistics',
            'PARTICIPANT_TASKS': 'participant-tasks'
        };
        const slug = slugs[mod];
        setActiveModule(mod);
        navigate(`/dashboard/coordinator${slug ? '/' + slug : ''}`);
    };

    const startNewStudyLaunch = () => {
        localStorage.removeItem('study_launch_draft');
        setSelectedStudy(null);
        handleModuleChange('LAUNCH_STUDY');
    };

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const [toasts, setToasts] = useState<any[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);

    const addToast = (msg: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        // Initial Notification Sync
        if (!mountGuard.current.notifications) {
            mountGuard.current.notifications = true;
            fetchNotifications();
        }
        
        return () => {
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (isNotificationOpen) setIsNotificationOpen(false);
            if (isProfileOpen) setIsProfileOpen(false);
        };

        // Senior DEV: Disable capture phase to ignore internal div scrolls (bubbling phase)
        window.addEventListener('scroll', handleScroll, false);
        return () => window.removeEventListener('scroll', handleScroll, false);
    }, [isNotificationOpen, isProfileOpen]);

    const fetchNotifications = async () => {
        try {
            const data = await apiFetch<any[]>('/api/notifications/');
            const newNotifications = Array.isArray(data) ? data : [];
            
            // Trigger toast for any NEW unread DANGER notifications
            newNotifications.forEach(n => {
                if (!n.is_read && n.type === 'DANGER' && !notifications.find(prev => prev.id === n.id)) {
                    addToast(n.message, 'danger');
                }
            });
            
            setNotifications(newNotifications);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    const markAsRead = async (id: string, link?: string) => {
        try {
            await authFetch(`${API}/api/notifications/${id}/read/`, { method: 'POST' });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            if (link) {
                if (link.startsWith('http')) window.open(link, '_blank');
                else navigate(link);
            }
        } catch (err) { }
    };

    const markAllAsRead = async () => {
        try {
            await authFetch(`${API}/api/notifications/read_all/`, { method: 'POST' });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) { }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Security & Authorization check
    useEffect(() => {
        const user = getUser();
        const role = getRole();
        const allowedRoles = ['COORDINATOR', 'ADMIN', 'SUPER_ADMIN'];
        if (!user || !allowedRoles.includes(role)) {
            console.warn("Unauthorized access to Coordinator Dashboard. Redirecting...");
            navigate('/signin');
        }
    }, [navigate]);

    // Handle events from modular components (e.g., Subject Review)
    useEffect(() => {
        const handleNav = () => {
            setActiveModule('PARTICIPANTS');
            setSelectedParticipantId(null);
            navigate('/dashboard/coordinator/participants');
        };
        window.addEventListener('nav-to-participants', handleNav);
        return () => window.removeEventListener('nav-to-participants', handleNav);
    }, [navigate]);

    const handleSignOut = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = async () => {
        await performLogout();
    };

    const [studies, setStudies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [globalTasks, setGlobalTasks] = useState<any[]>([]);
    const [sponsorOrganizations, setSponsorOrganizations] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [visits, setVisits] = useState<any[]>([]);
    const [selectedStudy, setSelectedStudy] = useState<any>(null);
    const [oversightStats, setOversightStats] = useState({
        upcomingVisits: 0,
        overdueFollowUps: 0,
        awaitingCallback: 0,
        pendingForms: 0,
        activeSubjects: 0,
        hasCriticalAlert: false
    });
    const [participantsByStudy, setParticipantsByStudy] = useState<Record<string, number>>({});
    const [globalSelectedStudyId, setGlobalSelectedStudyId] = useState<string>('all');
    const [summaryData, setSummaryData] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Fetch Aggregated Summary when Study Changes
    useEffect(() => {
        const fetchSummary = async () => {
            if (!globalSelectedStudyId || globalSelectedStudyId === 'all') {
                setSummaryData(null);
                return;
            }
            
            setSummaryLoading(true);
            try {
                const res = await authFetch(`${API}/api/studies/${globalSelectedStudyId}/coordinator_summary/`);
                if (res.ok) {
                    const data = await res.json();
                    setSummaryData(data);
                }
            } catch (err) {
                console.error("Failed to fetch coordinator summary:", err);
            } finally {
                setSummaryLoading(false);
            }
        };

        fetchSummary();
    }, [globalSelectedStudyId]);



    const fetchCoordinatorContent = useCallback(async (showLoading = true, skipCache = false) => {
        if (showLoading) setLoading(true);
        try {
            const fetchOpts = { skipCache };
            const [
                studiesData,
                usersData,
                sponsorsData,
                visitsData,
                participantsData,
                questionnairesData,
                staffTasksData
            ] = await Promise.all([
                apiFetch<any[]>('/api/studies/?limit=50', fetchOpts),
                apiFetch<any[]>('/api/users/?limit=100', fetchOpts),
                apiFetch<any[]>('/api/sponsor-organizations/?limit=50', fetchOpts),
                apiFetch<any[]>('/api/visits/?limit=50', fetchOpts),
                apiFetch<any[]>('/api/participants/?limit=50', fetchOpts),
                apiFetch<any[]>('/api/questionnaire-schedules/?limit=50', fetchOpts),
                apiFetch<any[]>('/api/staff-tasks/?limit=50', fetchOpts)
            ]);

            setStudies(studiesData || []);

            setUsers((usersData || []).map((u: any) => ({
                ...u,
                role: u.role ? u.role.toString().toUpperCase() : 'PARTICIPANT'
            })));

            setSponsorOrganizations(Array.isArray(sponsorsData) ? sponsorsData : (sponsorsData as any)?.results || []);
            setVisits(visitsData || []);
            setParticipants(participantsData || []);
            setGlobalTasks(staffTasksData || []);

            const activeParticipants = participantsData || [];

            // Build participant count map per study
            const pCountMap: Record<string, number> = {};
            activeParticipants.forEach((p: any) => {
                const sid = String(p.study?.id || p.study || '');
                if (sid) pCountMap[sid] = (pCountMap[sid] || 0) + 1;
            });
            setParticipantsByStudy(pCountMap);

            const now = new Date();
            const upcoming = (visitsData || []).filter((v: any) => v.status === 'SCHEDULED' && new Date(v.scheduled_date) > now).length;
            const overdue = (visitsData || []).filter((v: any) => v.status === 'SCHEDULED' && new Date(v.scheduled_date) < now).length;

            const pendingFormsCount = (questionnairesData || []).filter((q: any) => q.status === 'PENDING').length;

            setOversightStats({
                upcomingVisits: upcoming,
                overdueFollowUps: overdue,
                awaitingCallback: 0,
                pendingForms: pendingFormsCount,
                activeSubjects: activeParticipants.length,
                hasCriticalAlert: overdue > 0
            });
        } catch (e) {
            console.error("Coordinator Data Fetch Failed", e);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!mountGuard.current.fetchContent) {
            mountGuard.current.fetchContent = true;
            fetchCoordinatorContent(true, false);
        }
    }, [fetchCoordinatorContent]);

    // Removed background polling per user request to reduce redundant network requests.
    // Data is refreshed on mount and upon specific mutations (launch/update).
    // usePolling(() => fetchCoordinatorContent(false, true), 10000);

    const toStudyAssignmentIds = (value: any) => {
        const list = Array.isArray(value) ? value : value ? [value] : [];
        return list
            .map((item: any) => {
                if (!item) return '';
                if (typeof item === 'object') return item.id || item.pk || item.user_id || '';
                return String(item);
            })
            .filter(Boolean);
    };

    const parseMultilineList = (value: any) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        return String(value)
            .split('\n')
            .map((line) => line.replace(/^[\s*-•]+/, '').trim())
            .filter(Boolean);
    };

    const toTrialModel = (value: string) => {
        const map: Record<string, string> = {
            'Randomized controlled trial': 'RCT',
            'Open label study': 'OPEN_LABEL',
            'In-home use test': 'IHUT',
            'Patient repository': 'REGISTRY',
            'Observational study': 'OBSERVATIONAL',
            'Bioequivalence study': 'BIOEQUIVALENCE'
        };
        return map[value] || value || 'RCT';
    };

    const toPhase = (value: string) => {
        const map: Record<string, string> = {
            'N/A': 'N/A',
            'Phase 0': 'PHASE_0',
            'Phase 1': 'PHASE_1',
            'Phase 1/2': 'PHASE_1_2',
            'Phase 2': 'PHASE_2',
            'Phase 2/3': 'PHASE_2_3',
            'Phase 3': 'PHASE_3',
            'Phase 4': 'PHASE_4',
            'Pilot': 'PILOT',
            'Bioequivalence': 'BIOEQUIVALENCE'
        };
        return map[value] || value || 'N/A';
    };

    const toMaskingStrategy = (value: string) => {
        const map: Record<string, string> = {
            'None (open label)': 'NONE',
            'Single blind': 'SINGLE_BLIND',
            'Double blind': 'DOUBLE_BLIND',
            'Triple blind': 'TRIPLE_BLIND',
            'Quadruple blind': 'QUADRUPLE_BLIND'
        };
        return map[value] || value || 'NONE';
    };

    const toStudyType = (value: string) => {
        const map: Record<string, string> = {
            'In-person': 'IN_PERSON',
            'Remote': 'VIRTUAL',
            'Hybrid': 'DECENTRALIZED'
        };
        return map[value] || value || 'IN_PERSON';
    };

    const toRewardType = (value: string) => {
        const map: Record<string, string> = {
            'Cash': 'CASH',
            'Gift Card': 'VISA_CARD',
            'Product': 'MIXED',
            'None': 'CASH'
        };
        return map[value] || value || 'CASH';
    };

    const toRewardLogic = (value: string) => {
        const map: Record<string, string> = {
            'Per study completion': 'FULL_STUDY',
            'Per visit': 'PER_VISIT',
            'Milestone based': 'PER_TASK'
        };
        return map[value] || value || 'FULL_STUDY';
    };

    const buildConsentCollection = (consentMethods: Record<string, boolean> | undefined) => {
        if (!consentMethods) return [];
        const labelMap: Record<string, string> = {
            eConsent: 'ECONSENT',
            paperConsent: 'PAPER',
            remoteWitness: 'REMOTE_WITNESS',
            lar: 'LAR',
            parentGuardian: 'PARENT_GUARDIAN'
        };
        return Object.entries(consentMethods)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([key]) => labelMap[key] || key.toUpperCase());
    };

    const buildConsentMode = (consentMethods: Record<string, boolean> | undefined) => {
        if (!consentMethods) return 'ECONSENT';
        if (consentMethods.eConsent && consentMethods.paperConsent) return 'HYBRID';
        if (consentMethods.paperConsent) return 'PAPER';
        return 'ECONSENT';
    };

    const buildScreenerConfig = (questions: any[]) => ({
        steps: [
            { id: 'STEP1', type: 'system', label: 'Basics' },
            {
                id: 'STEP2',
                type: 'user_input',
                label: 'Eligibility',
                questions: (questions || []).map((q: any, index: number) => ({
                    ...q,
                    id: q?.id || `launch_screener_${index + 1}`
                }))
            },
            { id: 'STEP3', type: 'system', label: 'Contact' }
        ]
    });

    const normalizeStudyPayload = (formData: any) => {
        const sponsorOrg = sponsorOrganizations.find((org: any) => String(org.id) === String(formData.sponsor));
        const piIds = toStudyAssignmentIds(formData.selectedPIs ?? formData.pi_ids ?? formData.pi_id);
        const coordinatorIds = toStudyAssignmentIds(formData.selectedCoordinators ?? formData.coordinator_ids ?? formData.coordinator_id);
        const sponsorIds = toStudyAssignmentIds(formData.selectedSponsorUsers ?? formData.sponsor_ids ?? formData.sponsor_id);
        const overviewItems = parseMultilineList(formData.studyOverview);
        const benefitItems = parseMultilineList(formData.benefits);
        const stipendAmount = formData.stipendAmount ? Number(formData.stipendAmount) : 0;
        const questionnaireIds = Array.isArray(formData.selectedQuestionnaires) ? formData.selectedQuestionnaires : [];

        const payload: any = { ...formData };

        payload.start_date = formData.startDate ?? formData.start_date ?? null;
        payload.end_date = formData.endDate ?? formData.end_date ?? null;
        payload.launch_date = formData.launch_date || new Date().toISOString().slice(0, 10);
        payload.title = formData.shortTitle ?? formData.title ?? formData.fullTitle ?? 'Untitled Study';
        payload.full_title = formData.fullTitle ?? formData.full_title ?? payload.title;
        payload.protocol_id = formData.internalId ?? formData.protocol_id ?? '';
        payload.description = formData.briefSummary ?? formData.brief_description ?? formData.description ?? '';
        payload.primary_indication = formData.category ?? formData.indication ?? formData.primary_indication ?? '';
        payload.condition = formData.category ?? formData.indication ?? formData.condition ?? formData.primary_indication ?? '';
        payload.study_type = toStudyType(formData.executionMode ?? formData.execution_type ?? formData.study_type);
        payload.target_subjects = Number(formData.targetEnrollment ?? formData.target_subjects ?? formData.target_screened ?? 0) || 0;
        payload.target_screened = formData.target_screened ?? payload.target_subjects;
        payload.pi_ids = piIds;
        payload.coordinator_ids = coordinatorIds;
        payload.sponsor_ids = sponsorIds;
        payload.sponsor_id = sponsorIds[0] || undefined;
        payload.sponsor_org_id = sponsorOrg?.id || formData.sponsor_org_id || undefined;
        payload.sponsor_name = sponsorOrg?.name || formData.sponsor_name || '';
        payload.trial_model = toTrialModel(formData.primaryModel ?? formData.trial_model);
        payload.phase = toPhase(formData.clinicalPhase ?? formData.phase);
        payload.masking_strategy = toMaskingStrategy(formData.maskingStrategy ?? formData.masking_strategy);
        payload.is_double_blind = payload.masking_strategy === 'DOUBLE_BLIND';
        payload.remote_participation = payload.study_type !== 'IN_PERSON';
        payload.shipment_mode = formData.requireStudyKit ? 'DTP' : (payload.study_type === 'DECENTRALIZED' ? 'HYBRID' : 'CLINIC');
        payload.has_study_kit = Boolean(formData.requireStudyKit ?? formData.has_study_kit);
        payload.overview = overviewItems.join('\n');
        payload.benefit = benefitItems.join('\n');
        payload.timeline = overviewItems;
        payload.tags = Array.from(new Set([payload.condition, formData.primaryModel, formData.executionMode].filter(Boolean)));
        payload.participation_message = formData.participationMessage ?? formData.participation_message ?? '';
        payload.duration = formData.duration ?? '';
        payload.compensation = stipendAmount > 0 ? `${formData.currency || 'USD'} ${stipendAmount}` : (formData.compensation ?? '');
        payload.compensation_currency = formData.currency ?? formData.compensation_currency ?? 'USD';
        payload.reward_type = toRewardType(formData.rewardType ?? formData.reward_type);
        payload.reward_logic = toRewardLogic(formData.incentiveLogic ?? formData.reward_logic);
        payload.reward_config = {
            amount: stipendAmount,
            currency: formData.currency || 'USD',
            logic_label: formData.incentiveLogic || '',
            reward_label: formData.rewardType || ''
        };
        payload.consent_collection = buildConsentCollection(formData.consentMethods);
        payload.consent_mode = buildConsentMode(formData.consentMethods);
        payload.screener_config = buildScreenerConfig(formData.screenerQuestions ?? []);
        payload.study_questionnaires = questionnaireIds.map((templateId: string) => ({
            template: templateId,
            mode: 'STRUCTURED',
            frequency_interval: 1,
            frequency_unit: 'WEEKS',
            repetitions: 1,
            frequency: 'ONCE'
        }));
        payload.status = formData.status ?? selectedStudy?.status ?? 'RECRUITING';
        payload.stage = formData.stage ?? selectedStudy?.stage ?? 'RECRUITING';

        delete payload.pi_id;
        delete payload.coordinator_id;
        delete payload.sponsor;
        delete payload.assigned_pis;
        delete payload.assigned_coordinators;
        delete payload.assigned_sponsors;
        delete payload.startDate;
        delete payload.endDate;
        delete payload.internalId;
        delete payload.fullTitle;
        delete payload.shortTitle;
        delete payload.category;
        delete payload.briefSummary;
        delete payload.studyOverview;
        delete payload.benefits;
        delete payload.primaryModel;
        delete payload.clinicalPhase;
        delete payload.maskingStrategy;
        delete payload.executionMode;
        delete payload.rewardType;
        delete payload.incentiveLogic;
        delete payload.stipendAmount;
        delete payload.currency;
        delete payload.requireStudyKit;
        delete payload.targetEnrollment;
        delete payload.selectedPIs;
        delete payload.selectedCoordinators;
        delete payload.selectedSponsorUsers;
        delete payload.invitePIEmail;
        delete payload.inviteCoordinatorEmail;
        delete payload.inviteSponsorEmail;
        delete payload.selectedQuestionnaires;
        delete payload.consentMethods;
        delete payload.screenerQuestions;
        delete payload.consentFormFile;
        delete payload.additionalDocuments;
        delete payload.brief_description;
        delete payload.indication;
        delete payload.execution_type;

        ['start_date', 'end_date', 'launch_date', 'agreement_signed_date', 'proposal_submitted_date'].forEach((field) => {
            if (!payload[field]) payload[field] = null;
        });

        Object.keys(payload).forEach((key) => {
            if (payload[key] === undefined) delete payload[key];
        });

        return payload;
    };

    const uploadStudyFiles = async (study: any, formData: any) => {
        const apiUrl = API || '';
        const studyId = study?.id || study?.protocol_id;
        if (!studyId) return;

        if (formData.consentFormFile) {
            const consentData = new FormData();
            consentData.append('study', studyId);
            consentData.append('title', `${formData.shortTitle || formData.fullTitle || study.title || 'Study'} Consent Form`);
            consentData.append('version', '1.0');
            consentData.append('status', 'ACTIVE');
            consentData.append('file', formData.consentFormFile);
            consentData.append('require_participant_sig', 'true');
            consentData.append('require_cc_verification', 'true');
            consentData.append('require_pi_signoff', formData.selectedPIs?.length ? 'true' : 'false');
            consentData.append('require_witness', formData.consentMethods?.remoteWitness ? 'true' : 'false');
            consentData.append('require_lar', formData.consentMethods?.lar ? 'true' : 'false');
            await authFetch(`${apiUrl}/api/consent-templates/`, {
                method: 'POST',
                body: consentData
            });
        }

        for (const file of formData.additionalDocuments || []) {
            const documentData = new FormData();
            documentData.append('study', studyId);
            documentData.append('title', file.name.replace(/\.[^.]+$/, ''));
            documentData.append('version', '1.0');
            documentData.append('visibility', JSON.stringify(['PI', 'COORDINATOR', 'SPONSOR']));
            documentData.append('file', file);
            await authFetch(`${apiUrl}/api/documents/`, {
                method: 'POST',
                body: documentData
            });
        }
    };

    const handleCreateStudy = async (formData: any) => {
        try {
            const apiUrl = API || '';
            const method = selectedStudy ? 'PATCH' : 'POST';
            const payload = normalizeStudyPayload(formData);

            const url = selectedStudy
                ? `${apiUrl}/api/studies/${selectedStudy.protocol_id || selectedStudy.id}/`
                : `${apiUrl}/api/studies/`;

            const hasPdf = Boolean(formData.consent_pdf_file);

            let res: Response;

            if (hasPdf) {
                // Use FormData only when a file is attached — JSON-stringify arrays so DRF parses them correctly
                const body = new FormData();
                Object.keys(payload).forEach(key => {
                    const val = payload[key];
                    if (Array.isArray(val)) {
                        body.append(key, JSON.stringify(val));   // send as JSON string, backend must parse
                    } else if (val !== null && val !== undefined) {
                        body.append(key, String(val));
                    }
                });
                body.append('consent_pdf_template', formData.consent_pdf_file);
                res = await authFetch(url, { method, body });
            } else {
                // No file — send clean JSON; DRF handles arrays natively
                res = await authFetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                const study = await res.json().catch(() => null);
                addToast("Study launched and synchronized successfully!", "success");
                await uploadStudyFiles(study || selectedStudy || payload, formData);
                localStorage.removeItem('study_launch_draft');
                handleModuleChange('STUDIES');
                setSelectedStudy(null);
                fetchCoordinatorContent(true, true);
                return true;
            }

            const err = await res.json().catch(() => null);
            console.error("Study Save Failed:", err);
            throw new Error(`Study save failed: ${err ? JSON.stringify(err) : res.statusText}`);
        } catch (e) {
            console.error("Coordinator study launch failed:", e);
            throw e instanceof Error ? e : new Error("Study save failed due to a network error.");
        }
    };


    const handleDeleteStudy = async (study: any) => {
        const studyId = study?.id || study?.protocol_id;
        const res = await authFetch(`${API}/api/studies/${studyId}/`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            addToast(`Study ${study.protocol_id || 'Untitled'} deleted successfully`, 'success');
            // Force skip cache to ensure deleted study disappears
            fetchCoordinatorContent(true, true);
        } else {
            const err = await res.json().catch(() => null);
            addToast(`Failed to delete study: ${err?.detail || res.statusText}`, 'danger');
        }
    };

    const handleUpdateStudyStatus = async (studyId: string, newStatus: string) => {
        try {
            const res = await authFetch(`${API}/api/studies/${studyId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus, stage: newStatus })
            });
            if (res.ok) {
                setStudies(studies.map(s => s.id === studyId ? { ...s, status: newStatus, stage: newStatus } : s));
                // Also fetch fresh data to sync other stats
                fetchCoordinatorContent(false, true);
            }
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const sidebarGroups = [
        {
            group: 'Overview',
            items: [
                { id: 'WEBSITE', label: 'Website', icon: Globe },
                { id: 'OVERSIGHT', label: 'Dashboard', icon: LayoutDashboard },
            ]
        },
        {
            group: 'Work',
            items: [
                { id: 'STUDIES', label: 'Studies', icon: Beaker },
                { id: 'TEAM', label: 'Team', icon: Users },
                { id: 'PARTICIPANTS', label: 'Participants', icon: UsersRound },
                { id: 'FORMS', label: 'Forms', icon: ClipboardList },
                { id: 'CONSENT', label: 'Consent', icon: ShieldCheck },
                { id: 'VISITS', label: 'Visits', icon: Calendar },
                { id: 'LABS', label: 'Labs', icon: Beaker },
                { id: 'COMPENSATION', label: 'Payments', icon: DollarSign },
                { id: 'TASKS', label: 'Staff Tasks', icon: ClipboardList },
                { id: 'ENROLLMENT_WORKFLOW', label: 'Enrollment', icon: UserPlus },
                { id: 'PARTICIPANT_TASKS', label: 'Subject Tasks', icon: CheckSquare },
            ]
        },
        {
            group: 'Communication',
            items: [
                { id: 'STUDY_DOCS', label: 'Documents', icon: FileText },
                { id: 'MY_DOCS', label: 'Credentials', icon: Briefcase },
                { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
                { id: 'INVITATIONS', label: 'Invitations', icon: UserPlus },
                { id: 'ALERTS', label: 'Alerts', icon: Bell, hasNotify: true },
            ]
        },
        ...(isAdmin ? [{
            group: 'Admin',
            items: [
                { id: 'LAUNCH_STUDY', label: 'Setup', icon: Rocket },
                { id: 'SPONSORS', label: 'Sponsors', icon: Database },
                { id: 'ANALYTICS', label: 'Analytics', icon: TrendingUp },
            ]
        }] : [])
    ];

    const renderHeader = () => {
        const u = getUser();
        let userName = 'Coordinator';
        let userPicture = '';

        try {
            if (u) {
                userName = getDisplayName(u);
                userPicture = u.picture || u.avatar || u.avatar_url || u.profile_picture || '';
            }
        } catch (e) { }

        return (
            <header className="fixed top-0 left-0 lg:left-[240px] right-0 h-16 md:h-20 z-[80] bg-[#0B101B]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-3 md:px-6 transition-all">
                <div className="flex items-center gap-2 lg:hidden">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all h-9 w-9 shrink-0 flex items-center justify-center">
                        {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-start lg:pl-4">
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 h-10">
                            <div className="px-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-r border-white/10 shrink-0">Study</div>
                             <select
                                 value={globalSelectedStudyId}
                                 onChange={(e) => setGlobalSelectedStudyId(e.target.value)}
                                 className="bg-transparent text-[12px] font-black text-blue-400 uppercase tracking-[0.15em] outline-none cursor-pointer px-3 min-w-[140px] max-w-[240px] truncate"
                             >
                                 <option value="all" className="bg-[#0B101B]">
                                     All Studies ({Object.values(participantsByStudy).reduce((a,b)=>a+b,0)} participant{Object.values(participantsByStudy).reduce((a,b)=>a+b,0) !== 1 ? 's' : ''})
                                 </option>
                                 {studies.map(s => {
                                     const cnt = participantsByStudy[s.id] ?? 0;
                                     return (
                                         <option key={s.id} value={s.id} className="bg-[#0B101B]">
                                             {s.protocol_id || s.id} ({cnt} participant{cnt !== 1 ? 's' : ''})
                                         </option>
                                     );
                                 })}
                             </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-5 border-r border-white/10 pr-3 md:pr-6">
                         <div className="flex flex-col items-end text-right shrink-0">
                             <span className="text-[14px] md:text-lg font-black text-blue-400 font-mono tracking-tighter tabular-nums leading-none">
                                 {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                             </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                            </span>
                        </div>

                        <div className="relative" ref={notificationRef}>
                            <NotificationBell
                                unreadCount={unreadCount}
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            />

                            <AnimatePresence>
                                {isNotificationOpen && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 mt-6 w-80 md:w-96 bg-[#0F172A]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Alerts</h3>
                                            <button 
                                                onClick={() => setIsNotificationOpen(false)}
                                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-0">
                                             {notifications.length === 0 ? (
                                                <div className="p-12 text-center">
                                                    <Bell className="w-6 h-6 text-slate-700 mx-auto mb-4" />
                                                    <p className="text-[11px] text-slate-500 uppercase tracking-widest">Monitoring active...</p>
                                                </div>
                                            ) : (
                                                 <div className="divide-y divide-white/5">
                                                     {notifications.map((notif) => (
                                                         <div 
                                                            key={notif.id} 
                                                            onClick={async () => {
                                                                setSelectedNotification(notif);
                                                                if (!notif.is_read) {
                                                                    await markAsRead(notif.id);
                                                                }
                                                                setIsNotificationOpen(false);
                                                            }}
                                                            className="p-5 hover:bg-white/[0.04] transition-all border-l-2 border-transparent hover:border-blue-500 cursor-pointer group"
                                                         >
                                                             <div className="flex items-start gap-4">
                                                                 <div className={`p-2 rounded-xl border transition-colors ${notif.is_read ? 'bg-white/5 border-white/5' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                                                     <Bell className={`w-4 h-4 ${notif.is_read ? 'text-slate-500' : 'text-blue-400'}`} />
                                                                 </div>
                                                                 <div className="flex-1 min-w-0">
                                                                     <p className={`text-[13px] leading-snug transition-colors ${notif.is_read ? 'text-slate-400 font-medium' : 'text-white font-bold'}`}>
                                                                         {notif.message}
                                                                     </p>
                                                                     <div className="flex items-center gap-2 mt-2">
                                                                         <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">
                                                                             {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                         </p>
                                                                         {!notif.is_read && <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />}
                                                                     </div>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 relative" ref={profileRef}>
                        <div className="hidden md:flex flex-col items-end text-right max-w-[80px] lg:max-w-[140px]">
                            <p className="text-[10px] lg:text-[11px] font-black text-white uppercase italic tracking-tighter truncate w-full">
                                {userName}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate w-full">
                                {u?.email}
                            </p>
                        </div>
                         <button
                             onClick={() => setIsProfileOpen(!isProfileOpen)}
                             className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                         >
                            <div className="w-full h-full bg-[#0B101B] rounded-[0.6rem] flex items-center justify-center font-black text-white uppercase italic text-[10px] md:text-[11px]">
                                {userName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                        </button>


                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-64 bg-[#0F172A]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[100] overflow-hidden"
                                >
                                    <div className="p-5 border-b border-white/5 mb-2">
                                         <p className="text-sm font-bold text-white uppercase tracking-tight">
                                             {getDisplayName(getUser())}
                                         </p>
                                         <p className="text-[11px] text-blue-400 font-black uppercase tracking-widest mt-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg inline-block">
                                             {getRole()?.replace('_', ' ') || 'Coordinator'}
                                         </p>
                                        <p className="text-[11px] text-slate-500 font-bold lowercase tracking-normal mt-2.5 truncate">
                                            {getUser()?.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-wider"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>
        );
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <SEO 
                title="Clinical Study Coordinator Portal | MUSB Health"
                description="Coordinate clinical trials, manage patient visits, and review study documents securely."
                canonical="https://www.musbhealth.com/coordinator-portal"
            />
            <AnimatedBackground />
            {renderHeader()}

            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md z-[65] xl:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-[#0B101B] border-r border-white/5 z-[70] transition-transform duration-300 lg:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-20 px-8 flex justify-between items-center border-b border-white/[0.05] shrink-0">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="group transition-all">
                        <div className="bg-white p-2 rounded-2xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <img src="/logo.jpg" alt="Logo" className="h-12 w-auto object-contain rounded-xl" />
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all h-10 w-10 flex items-center justify-center shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
                     {sidebarGroups.flatMap(g => g.items).map((item, j) => (
                          <button 
                            key={j} 
                            onClick={() => { 
                                if (item.id === 'WEBSITE') window.open('/', '_blank'); 
                                else if (item.id === 'LAUNCH_STUDY') { startNewStudyLaunch(); setIsSidebarOpen(false); }
                                else { handleModuleChange(item.id as CCModule); setIsSidebarOpen(false); } 
                            }} 
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group relative ${activeModule === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-400/20' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}
                        >
                             <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
                             <span className="text-[13px] font-bold text-left flex-1">{item.label}</span>
                          </button>
                     ))}
                </nav>

                <div className="p-4 border-t border-white/5 shrink-0 bg-black/20">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all group"
                    >
                        <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 lg:pl-[240px] pt-24 md:pt-32 pb-20 bg-[#0F172A] min-h-screen">
                <div className="px-3 md:px-6 flex-1">
                    <AnimatePresence mode="wait">
                        {activeModule === 'OVERSIGHT' && (
                            <OperationsOversight
                                studyCount={studies.length}
                                stats={oversightStats}
                                currentTime={currentTime}
                                visits={visits}
                                onLaunch={startNewStudyLaunch}
                                onNavigate={(id) => handleModuleChange(id as CCModule)}
                                isAdmin={isAdmin}
                                isLoading={loading}
                            />
                        )}
                        {activeModule === 'STUDIES' && (
                            <StudyDirectory
                                studies={studies}
                                onAdd={startNewStudyLaunch}
                                onEdit={(s) => { setSelectedStudy(s); handleModuleChange('LAUNCH_STUDY'); }}
                                onDelete={handleDeleteStudy}
                                onUpdateStatus={handleUpdateStudyStatus}
                                isLoading={loading}
                            />
                        )}
                        {activeModule === 'LAUNCH_STUDY' && (
                            <LaunchStudyForm
                                onClose={() => { setSelectedStudy(null); handleModuleChange('STUDIES'); }}
                                initialData={selectedStudy}
                                onSave={handleCreateStudy}
                                availablePIs={users.filter(u => String(u.role).toUpperCase() === 'PI')}
                                availableCoordinators={users.filter(u => String(u.role).toUpperCase() === 'COORDINATOR')}
                                availableSponsors={sponsorOrganizations}
                                availableSponsorUsers={users.filter(u => String(u.role).toUpperCase() === 'SPONSOR')}
                            />
                        )}
                        {activeModule === 'MESSAGES' && <CCC_MessagesModule selectedStudyId={globalSelectedStudyId} />}
                        {activeModule === 'TEAM' && (
                            <CCC_TeamModule 
                                selectedStudyId={globalSelectedStudyId} 
                                initialUsers={users}
                                allStudies={studies}
                                onRefresh={fetchCoordinatorContent}
                            />
                        )}
                        {activeModule === 'INVITATIONS' && (
                            <InvitationsModule allStudies={studies} />
                        )}
                        {activeModule === 'ALERTS' && (
                            <AlertsModule 
                                selectedStudyId={globalSelectedStudyId} 
                                initialNotifications={notifications}
                            />
                        )}
                        {activeModule === 'PARTICIPANTS' && (
                            selectedParticipantId ? (
                                <CCC_SubjectReviewModule 
                                    selectedStudyId={globalSelectedStudyId} 
                                    participantId={selectedParticipantId}
                                    preloadedTracking={summaryData?.participant_tracking}
                                    initialTab={initialTab}
                                />
                            ) : (
                                <ParticipantOversight 
                                    selectedStudyId={globalSelectedStudyId} 
                                    onOpenProfile={(id) => setSelectedParticipantId(id)} 
                                    onMessage={() => setActiveModule('MESSAGES')}
                                    initialParticipants={participants}
                                    onRefresh={fetchCoordinatorContent}
                                />
                            )
                        )}
                        {activeModule === 'FORMS' && <FormsQuestionnairesModule selectedStudyId={globalSelectedStudyId} />}
                        {activeModule === 'CONSENT' && (
                            <div className="bg-[#0B101B] rounded-[2.5rem] -mt-6">
                                <ConsentOversight />
                            </div>
                        )}
                        {activeModule === 'ENROLLMENT_WORKFLOW' && (
                            <div className="bg-[#0B101B] rounded-[2.5rem] -mt-6">
                                <ParticipantOversight selectedStudyId={globalSelectedStudyId} />
                            </div>
                        )}
                        {activeModule === 'VISITS' && (
                            <CCC_VisitsAssessmentsModule 
                                selectedStudyId={globalSelectedStudyId} 
                                preloadedParticipants={participants}
                                preloadedStudies={studies}
                                preloadedTasks={globalTasks}
                                onRefresh={fetchCoordinatorContent}
                                isLoading={loading}
                            />
                        )}
                        {activeModule === 'LABS' && (
                            <LabsResultsModule 
                                selectedStudyId={globalSelectedStudyId} 
                                preloadedStudies={studies}
                                isLoading={loading}
                            />
                        )}
                        {activeModule === 'REPORTS' && (
                            <ReportsSignOffModule 
                                selectedStudyId={globalSelectedStudyId} 
                                preloadedStudies={studies}
                                isLoading={loading}
                            />
                        )}
                        {activeModule === 'STUDY_DOCS' && (
                            <StudyDocumentsModule 
                                selectedStudyId={globalSelectedStudyId} 
                                preloadedStudies={studies}
                                isLoading={loading}
                            />
                        )}
                        {activeModule === 'MY_DOCS' && <MyDocumentsModule />}

                        {activeModule === 'TASKS' && (
                            <StaffTasksModule 
                                primaryColor="blue" 
                                preloadedTasks={globalTasks}
                                isLoading={loading}
                            />
                        )}
                        {activeModule === 'PARTICIPANT_TASKS' && (
                            <ParticipantTaskManagement 
                                primaryColor="blue" 
                                selectedStudyId={globalSelectedStudyId} 
                            />
                        )}
                        {activeModule === 'COMPENSATION' && <CompensationManagement selectedStudyId={globalSelectedStudyId} />}
                        {activeModule === 'LOGISTICS' && (
                            <StudyKitsModule 
                                selectedStudyId={globalSelectedStudyId}
                                preloadedStudies={studies}
                                preloadedParticipants={participants}
                            />
                        )}
                        {activeModule === 'ANALYTICS' && (
                            <AnalyticsModule 
                                selectedStudyId={globalSelectedStudyId}
                                preloadedData={summaryData}
                                isLoading={summaryLoading}
                                onViewProfile={(id) => {
                                    setSelectedParticipantId(id);
                                    setActiveModule('PARTICIPANTS');
                                }}
                            />
                        )}
                        {activeModule === 'SPONSORS' && (
                            <SponsorsManagement 
                                selectedStudyId={globalSelectedStudyId} 
                                allUsers={users} 
                                preloadedStudies={studies} 
                                onRefresh={fetchCoordinatorContent}
                                isLoading={loading}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* TOAST SYSTEM (Sleek, Command Center Style) */}
            <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 50 }}
                            className={`px-8 py-5 rounded-[22px] shadow-2xl backdrop-blur-3xl border flex items-center gap-5 min-w-[320px] max-w-md ${
                                t.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                t.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}
                        >
                            <div className={`p-2 rounded-xl bg-white/5`}>
                                {t.type === 'danger' ? <AlertTriangle size={20} /> :
                                 t.type === 'warning' ? <AlertCircle size={20} /> :
                                 t.type === 'success' ? <CheckCircle2 size={20} /> :
                                 <Bell size={20} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-[12px] font-black uppercase tracking-tighter italic leading-tight">{t.msg}</p>
                            </div>
                            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="p-1 hover:bg-white/10 rounded-lg outline-none">
                                <X size={14} className="opacity-50" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={confirmSignOut} />

            {/* Notification Detail Overlay */}
            <AnimatePresence>
                {selectedNotification && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNotification(null)}
                            className="absolute inset-0 bg-[#0B101B]/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                        <Bell className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <button 
                                        onClick={() => setSelectedNotification(null)}
                                        className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter shrink-0">Alert <span className="text-blue-400">Details</span></h3>
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <p className="text-lg font-medium text-slate-200 leading-relaxed italic">
                                            "{selectedNotification.message}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Received At</p>
                                        <p className="text-sm font-bold text-white italic">
                                            {new Date(selectedNotification.created_at).toLocaleString('en-US', { 
                                                weekday: 'short', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    {selectedNotification.link && (
                                        <button 
                                            onClick={() => {
                                                navigate(selectedNotification.link);
                                                setSelectedNotification(null);
                                            }}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            View Related Record
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
