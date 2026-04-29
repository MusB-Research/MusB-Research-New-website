import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import NotificationBell from '../components/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, clearToken, getRole, performLogout, getUser, getDisplayName, API } from '../utils/auth';
import { getMediaUrl } from '../utils/media';
import { apiFetch } from '../api';
import SEO from '../components/SEO';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import SubmitContentForms from '../components/coordinator/SubmitContentForms';
import LaunchStudyForm from '../components/coordinator/LaunchStudyForm';
import SponsorsManagement from '../components/coordinator/SponsorsManagement';
import PIMessagesModule from '../components/pi/PIMessagesModule';
import SubjectReviewModule from '../components/coordinator/subject-review/SubjectReviewModule';
import PITeamModule from '../components/pi/PITeamModule';
import VisitsModule from '../components/coordinator/VisitsModule';
import PIHelpSupportModule from '../components/pi/PIHelpSupportModule';
import InvitationsModule from '../components/shared/InvitationsModule';


// New PI Panel Modules
import ParticipantOversight from '../components/pi/panels/ParticipantOversight';
import FormsQuestionnairesModule from '../components/pi/panels/FormsQuestionnairesModule';
import ConsentModule from '../components/coordinator/consent/ConsentModule';
import LabsResultsModule from '../components/pi/panels/LabsResultsModule';
import ReportsSignOffModule from '../components/pi/panels/ReportsSignOffModule';
import StudyDocumentsModule from '../components/pi/panels/StudyDocumentsModule';
import MyDocumentsModule from '../components/pi/panels/MyDocumentsModule';
import AlertsModule from '../components/pi/panels/AlertsModule';
import AuditLogModule from '../components/pi/panels/AuditLogModule';
import AnalyticsModule from '../components/pi/panels/AnalyticsModule';
import AnimatedBackground from '../components/AnimatedBackground';
import StaffTasksModule from '../components/shared/StaffTasksModule';

import ParticipantTaskManagement from '../components/shared/ParticipantTaskManagement';
import TeamInventoryModule from '../components/pi/panels/TeamInventoryModule';
import StudyKitsModule from '../components/shared/StudyKitsModule';
import { usePolling } from '@/hooks/usePolling';
import ConsentOversight from '../components/coordinator/panels/ConsentOversight';


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
    AlertTriangle, FileCheck, Building2, Truck, UserPlus, User
} from 'lucide-react';

type PIModule =
    | 'WEBSITE'
    | 'OVERVIEW'
    | 'OVERSIGHT'
    | 'STUDIES'
    | 'TEAM'
    | 'PARTICIPANTS'
    | 'FORMS'
    | 'CONSENT'
    | 'VISITS'
    | 'LABS'
    | 'REPORTS'
    | 'MESSAGES'
    | 'ALERTS'
    | 'LAUNCH_STUDY'
    | 'SPONSORS'
    | 'AUDIT_LOG'
    | 'TASKS'
    | 'ANALYTICS'
    | 'PARTICIPANT_TASKS'
    | 'STUDY_DOCS'
    | 'MY_DOCS'
    | 'TEAM_INVENTORY'
    | 'LOGISTICS'
    | 'SUPPORT';

interface SidebarItem {
    id: PIModule | 'WEBSITE';
    label: string;
    icon: any;
    hasNotify?: boolean;
}

interface SidebarGroup {
    group: string;
    items: SidebarItem[];
}

function PISkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl animate-pulse ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white-[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
    );
}

export default function PIDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeModule, setActiveModule] = useState<PIModule>(() => {
        const path = location.pathname.toLowerCase().replace(/\/$/, "");
        const parts = path.split('/');
        const route = parts[parts.length - 1];
        
        if (route === 'studies') return 'STUDIES';
        if (route === 'team') return 'TEAM';
        if (route === 'participants') return 'PARTICIPANTS';
        if (route === 'subject-review') return 'PARTICIPANTS';
        if (route === 'forms') return 'FORMS';
        if (route === 'consent') return 'CONSENT';
        if (route === 'visits') return 'VISITS';
        if (route === 'labs') return 'LABS';
        if (route === 'reports' || route === 'docs') return 'REPORTS';
        if (route === 'study-docs') return 'STUDY_DOCS';
        if (route === 'my-docs') return 'MY_DOCS';
        if (route === 'team-inventory') return 'TEAM_INVENTORY';
        if (route === 'messages') return 'MESSAGES';
        if (route === 'alerts') return 'ALERTS';
        if (route === 'launch-study') return 'LAUNCH_STUDY';
        if (route === 'support' || route === 'help') return 'SUPPORT';
        if (route === 'audit-log' || route === 'audit') return 'AUDIT_LOG';
        if (route === 'analytics') return 'ANALYTICS';
        if (route === 'tasks') return 'TASKS';
        if (route === 'logistics') return 'LOGISTICS';
        if (route === 'participant-tasks') return 'PARTICIPANT_TASKS';
        return 'OVERVIEW';
    });

    // Sync activeModule when URL changes (for browser back button support)
    useEffect(() => {
        const path = location.pathname.toLowerCase().replace(/\/$/, "");
        const parts = path.split('/');
        const route = parts[parts.length - 1];

        console.log("[PIDashboard] Route sync:", { path, route });

        if (route === 'pi' || !route || route === 'oversight' || route === 'overview') setActiveModule('OVERVIEW');
        else if (route === 'studies') setActiveModule('STUDIES');
        else if (route === 'participants') setActiveModule('PARTICIPANTS');
        else if (route === 'forms') setActiveModule('FORMS');
        else if (route === 'consent') setActiveModule('CONSENT');
        else if (route === 'visits') setActiveModule('VISITS');
        else if (route === 'subject-review' || route === 'review') setActiveModule('PARTICIPANTS');
        else if (route === 'team') setActiveModule('TEAM');
        else if (route === 'messages') setActiveModule('MESSAGES');
        else if (route === 'labs') setActiveModule('LABS');
        else if (route === 'reports') setActiveModule('REPORTS');
        else if (route === 'study-docs' || route === 'docs') setActiveModule('STUDY_DOCS');
        else if (route === 'my-docs') setActiveModule('MY_DOCS');
        else if (route === 'team-inventory') setActiveModule('TEAM_INVENTORY');
        else if (route === 'alerts') setActiveModule('ALERTS');
        else if (route === 'launch-study') setActiveModule('LAUNCH_STUDY');
        else if (route === 'support' || route === 'help') setActiveModule('SUPPORT');
        else if (route === 'audit-log' || route === 'audit') setActiveModule('AUDIT_LOG');
        else if (route === 'analytics') setActiveModule('ANALYTICS');
        else if (route === 'tasks') setActiveModule('TASKS');
        else if (route === 'logistics') setActiveModule('LOGISTICS');
        else if (route === 'sponsors') setActiveModule('SPONSORS');
        else if (route === 'participant-tasks') setActiveModule('PARTICIPANT_TASKS');
        else setActiveModule('OVERVIEW');
    }, [location.pathname]);

    const handleModuleChange = (mod: PIModule) => {
        const slugs: Record<string, string> = {
            'OVERVIEW': '',
            'STUDIES': 'studies',
            'TEAM': 'team',
            'PARTICIPANTS': 'participants',
            'SUBJECT_REVIEW': 'participants',
            'FORMS': 'forms',
            'CONSENT': 'consent',
            'VISITS': 'visits',
            'LABS': 'labs',
            'REPORTS': 'reports',
            'STUDY_DOCS': 'study-docs',
            'TEAM_INVENTORY': 'team-inventory',
            'LOGISTICS': 'logistics',
            'MY_DOCS': 'my-docs',
            'MESSAGES': 'messages',
            'ALERTS': 'alerts',
            'LAUNCH_STUDY': 'launch-study',
            'SUPPORT': 'support',
            'AUDIT_LOG': 'audit-log',
            'TASKS': 'tasks',
            'ANALYTICS': 'analytics',
            'SPONSORS': 'sponsors',
            'INVITATIONS': 'invitations',
            'CONSENT_NEW': 'consent-new',
            'PARTICIPANT_TASKS': 'participant-tasks'
        };
        const slug = slugs[mod];
        setActiveModule(mod);
        navigate(`/dashboard/pi${slug ? '/' + slug : ''}`);
    };
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const user = getUser();
        const role = getRole();

        const allowedRoles = ['PI', 'COORDINATOR', 'ONSITE'];
        if (!user || !allowedRoles.includes(role)) {
            console.warn("Unauthorized access to PI Dashboard. Redirecting...");
            navigate('/signin');
        }
    }, [navigate]);

    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                // If we had an isNotificationOpen state, we'd close it here
            }
        };

        const handleScroll = () => {
            if (isProfileOpen) setIsProfileOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, false);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, false);
        };
    }, [isProfileOpen]);

    // Bridge: coordinator SubjectReviewModule dispatches this event when ← back is clicked
    useEffect(() => {
        const handler = () => setActiveModule('PARTICIPANTS');
        window.addEventListener('nav-to-participants', handler);
        return () => window.removeEventListener('nav-to-participants', handler);
    }, []);

    const handleSignOut = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = async () => {
        await performLogout();
    };
     const [studies, setStudies] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedStudy, setSelectedStudy] = useState<any>(null);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [oversightStats, setOversightStats] = useState({
        upcomingVisits: 0,
        overdueFollowUps: 0,
        awaitingCallback: 0,
        pendingForms: 0,
        unreadAlerts: 0,
        hasCriticalAlert: false
    });
    const [participantsByStudy, setParticipantsByStudy] = useState<Record<string, number>>({});
    const [globalSelectedStudyId, setGlobalSelectedStudyId] = useState<string>('all');
    const [summaryData, setSummaryData] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Consolidated Data Orchestration: Fetch Summary when selection changes
    useEffect(() => {
        const fetchSummary = async () => {
            if (!globalSelectedStudyId || globalSelectedStudyId === 'all') {
                setSummaryData(null);
                return;
            }
            
            setSummaryLoading(true);
            try {
                // Use the consolidated coordinator_summary endpoint (reused for PI as well)
                const res = await authFetch(`${API}/api/studies/${globalSelectedStudyId}/coordinator_summary/`);
                if (res.ok) {
                    const data = await res.json();
                    setSummaryData(data);
                }
            } catch (err) {
                console.error("[PI Dashboard] Failed to fetch study summary:", err);
            } finally {
                setSummaryLoading(false);
            }
        };

        fetchSummary();
    }, [globalSelectedStudyId]);



    const fetchAllData = useCallback(async (showLoading = true, skipCache = false) => {
        if (showLoading) setLoading(true);
        try {
            const fetchOpts = { skipCache };
            // OPTIMIZED: Added pagination limits to reduce payload
            const [studiesRaw, participantsRaw, notificationsRaw, visitsRaw, staffTasksRaw, usersRaw] = await Promise.all([
                authFetch(`${API}/api/studies/?limit=50`, fetchOpts).then(r => r.json()),
                authFetch(`${API}/api/participants/?pi=true&limit=50`, fetchOpts).then(r => r.json()), 
                authFetch(`${API}/api/notifications/?limit=50`, fetchOpts).then(r => r.json()),
                authFetch(`${API}/api/visits/?limit=50`, fetchOpts).then(r => r.json()),
                authFetch(`${API}/api/staff-tasks/?limit=50`, fetchOpts).then(r => r.json()),
                authFetch(`${API}/api/auth/personnel-fetch/?limit=50`, fetchOpts).then(r => r.json()).catch(() => [])
            ]);

            // Senior Dev: Normalize DRF Paginated results to Standard Arrays
            const normalize = (data: any) => {
                if (Array.isArray(data)) return data;
                if (data && Array.isArray(data.results)) return data.results;
                return [];
            };

            const studiesData = normalize(studiesRaw);
            const participantsData = normalize(participantsRaw);
            const notificationsData = normalize(notificationsRaw);
            const visitsData = normalize(visitsRaw);
            const staffTasksData = normalize(staffTasksRaw);
            const usersData = normalize(usersRaw);

            setStudies(studiesData);
            setParticipants(participantsData);
            setNotifications(notificationsData);
            setVisits(visitsData);
            setTasks(staffTasksData);
            setUsers(usersData);

            // Calculate Oversite Stats locally to prevent 404s
            const now = new Date();
            const upcoming = visitsData.filter((v: any) => v.status === 'SCHEDULED' && new Date(v.scheduled_date) > now).length;
            const overdue = visitsData.filter((v: any) => v.status === 'SCHEDULED' && new Date(v.scheduled_date) < now).length;
            const pendingForms = staffTasksData.filter((t: any) => !t.is_completed).length;
            const unreadAlerts = notificationsData.filter((n: any) => !n.is_read).length;

            setOversightStats({
                upcomingVisits: upcoming,
                overdueFollowUps: overdue,
                awaitingCallback: 0,
                pendingForms: pendingForms,
                unreadAlerts: unreadAlerts,
                hasCriticalAlert: overdue > 0 || notificationsData.some((n: any) => n.priority === 'CRITICAL' && !n.is_read)
            });

            const grouped: Record<string, number> = {};
            participantsData.forEach((p: any) => {
                const sId = p.study_id || (p.study?.id || p.study);
                grouped[sId] = (grouped[sId] || 0) + 1;
            });
            setParticipantsByStudy(grouped);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    const mountGuard = useRef({ checkMissed: false });

    useEffect(() => {
        fetchAllData(true, false);
    }, [fetchAllData]);

    // Removed background polling per user request to reduce redundant network requests.
    // Data is refreshed on mount and upon specific mutations.
    // usePolling(() => fetchAllData(false, true), 10000);

    // [PERFORMANCE] One-time Dashboard Initialization
    useEffect(() => {
        const initializeDashboard = async () => {
            if (mountGuard.current.checkMissed) return;
            mountGuard.current.checkMissed = true;

            try {
                // Trigger missed visit check to ensure oversight stats are accurate
                await authFetch(`${API}/api/visits/check_missed/`, { method: 'POST' });
            } catch (e) { /* silent check */ }
        };

        initializeDashboard();
    }, []);

    useEffect(() => {
        const handleNav = () => handleModuleChange('PARTICIPANTS');
        window.addEventListener('nav-to-participants', handleNav);
        return () => window.removeEventListener('nav-to-participants', handleNav);
    }, []);

    const handleCreateStudy = async (formData: any) => {
        try {
            const apiUrl = API || '';
            const method = selectedStudy ? 'PATCH' : 'POST';

            // Map frontend fields back to backend model names
            const payload = {
                ...formData,
                start_date: formData.startDate,
                end_date: formData.endDate,
                description: formData.brief_description,
                primary_indication: formData.indication,
                condition: formData.indication,
                study_type: formData.execution_type,
                target_screened: formData.target_subjects,
                pi_ids: formData.assigned_pis,
                coordinator_ids: formData.assigned_coordinators,
            };

            const url = selectedStudy
                ? `${apiUrl}/api/studies/${selectedStudy.protocol_id || selectedStudy.id}/`
                : `${apiUrl}/api/studies/`;

            const res = await authFetch(url, {
                method: method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                handleModuleChange('STUDIES');
                setSelectedStudy(null);
                fetchAllData(); // Re-fetch data immediately after mutation
            } else {
                const err = await res.json();
                console.error("Study Save Failed:", err);
                alert(`Operation failed: ${JSON.stringify(err)}`);
            }
        } catch (e) {
            alert("Operation failed due to network error");
        }
    };



    const sidebarGroups: SidebarGroup[] = [
        {
            group: 'Overview',
            items: [
                { id: 'WEBSITE', label: 'Website', icon: Globe },
                { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutDashboard },
            ]
        },
        {
            group: 'Work',
            items: [
                { id: 'STUDIES', label: 'Studies', icon: Beaker },
                { id: 'TEAM', label: 'Team', icon: Users },
                { id: 'PARTICIPANTS', label: 'Participants', icon: UsersRound },
                { id: 'FORMS', label: 'Forms', icon: ClipboardList },
                { id: 'VISITS', label: 'Visits', icon: Calendar },
                { id: 'SPONSORS', label: 'Sponsors', icon: Building2 },
                { id: 'TASKS', label: 'Staff Tasks', icon: ClipboardList },
                { id: 'LABS', label: 'Labs', icon: Beaker },
                { id: 'PARTICIPANT_TASKS', label: 'Subject Tasks', icon: ListFilter },
                { id: 'LOGISTICS', label: 'Logistics', icon: Truck },
                { id: 'LAUNCH_STUDY', label: 'New Study', icon: Rocket },
            ]
        },
        {
            group: 'Comms',
            items: [
                { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
                { id: 'ALERTS', label: 'Alerts', icon: Bell, hasNotify: true },
            ]
        }
    ];

    const renderHeader = () => {
        const u = getUser();
        let userName = 'PI';
        let userPicture = '';
        try {
            if (u) {
                userName = getDisplayName(u);
                userPicture = u.picture || u.avatar || u.avatar_url || u.profile_picture || '';
            }
        } catch (e) { }

        return (
            <header className="fixed top-0 left-0 lg:left-64 right-0 h-20 z-[60] bg-[#0B101B]/95 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 md:px-6 lg:px-8">

                <div className="flex items-center lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex items-center justify-center h-10 w-10 hover:bg-white/10 shrink-0"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <div className="hidden lg:flex flex-col">
                    <h1 className="text-xl font-bold text-white uppercase tracking-tight leading-none">PI Dashboard</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden xl:flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
                        <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-white/10 shrink-0">Study</div>
                        <select
                            value={globalSelectedStudyId}
                            onChange={(e) => setGlobalSelectedStudyId(e.target.value)}
                            className="bg-transparent text-[13px] font-bold text-teal-400 uppercase tracking-widest outline-none cursor-pointer px-4"
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



                <div className="flex items-center gap-4 h-10 md:h-14">
                    <div className="flex flex-col items-end text-right border-r border-white/5 pr-4 md:pr-6">
                        <span className="text-sm md:text-xl font-bold text-cyan-400 font-mono tracking-tighter tabular-nums leading-none">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 md:mt-1.5">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                        </span>
                    </div>

                    <div className="relative" ref={notificationRef}>
                        <NotificationBell
                            unreadCount={oversightStats.hasCriticalAlert ? 1 : 0}
                            onClick={() => handleModuleChange('ALERTS')}
                        />
                    </div>

                    <div className="h-6 md:h-8 w-px bg-white/10 hidden md:block" />


                    <div className="flex items-center gap-4 relative" ref={profileRef}>
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-bold text-white uppercase tracking-tight">{userName}</p>
                        </div>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/5 border border-white/10 p-0.5 hover:border-teal-600 transition-all active:scale-95 group overflow-hidden shadow-2xl"
                        >
                            <div className="w-full h-full rounded-[0.6rem] flex items-center justify-center bg-white/10 group-hover:bg-teal-600/20 transition-colors">
                                {userPicture ? (
                                    <img src={userPicture} alt={userName} className="w-full h-full object-cover rounded-[0.9rem]" />
                                ) : (
                                    <span className="text-sm font-bold text-white uppercase ">
                                        {userName.split(' ').map((n: string) => n?.[0]).join('').toUpperCase().slice(0, 2) || 'PI'}
                                    </span>
                                )}
                            </div>
                        </button>


                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-56 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                                >
                                    <div className="p-3 border-b border-white/5 mb-2">
                                        <p className="text-sm font-bold text-white truncate">{userName}</p>
                                        <p className="text-sm text-slate-500 truncate">{getUser()?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => { handleModuleChange('MY_DOCS'); setIsProfileOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
                                    >
                                        <User className="w-4 h-4 text-teal-400" /> My Profile
                                    </button>
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-100 hover:text-white hover:bg-red-500/20 transition-all text-sm font-bold uppercase tracking-widest">
                                        <LogOut className="w-4 h-4" /> Sign Out
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
                title="Principal Investigator Dashboard | Clinical Trial System"
                description="Manage studies, participants, and clinical data efficiently."
                canonical="https://www.musbhealth.com/pi-dashboard"
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
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#0B101B] border-r border-white/5 z-[100] transition-transform duration-300 lg:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-20 px-6 flex justify-between items-center border-b border-white/[0.05]">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="group transition-all">
                        <div className="bg-white p-2 rounded-2xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <img src="/logo.jpg" alt="Logo" className="h-12 w-auto object-contain rounded-xl" />
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                    {sidebarGroups.map((group, i) => (
                        <div key={i} className="space-y-1">
                            <p className="px-4 text-[13px] font-bold text-white/30 uppercase tracking-widest mb-1">{group.group}</p>
                            <div className="space-y-1.5">
                                {group.items.map((item, j) => (
                                    <button
                                        key={j}
                                        onClick={() => {
                                            if (item.id === 'WEBSITE') window.open('/', '_blank');
                                            else {
                                                handleModuleChange(item.id as PIModule);
                                                setIsSidebarOpen(false);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all group relative ${activeModule === item.id
                                            ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 shadow-lg shadow-teal-500/5'
                                            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-teal-400' : 'text-slate-500'}`} />
                                        <span className="text-sm font-bold text-left flex-1 tracking-tight">{item.label}</span>
                                        {item.hasNotify && (
                                            <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.6)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="mt-auto p-4 border-t border-white/5 space-y-1">
                    <button
                        onClick={() => { setActiveModule('MY_DOCS'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${activeModule === 'MY_DOCS' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-[#8b8fa8] hover:bg-teal-500/10 hover:text-teal-400'}`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-sm font-bold">My Profile</span>
                    </button>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[#8b8fa8] hover:bg-red-500/10 hover:text-red-400 transition-all group">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-bold">Sign Out</span>
                    </button>
                </div>
            </aside>


            <main className={`flex-1 lg:pl-64 pt-20 lg:pt-24 pb-8 md:pb-12 px-4 md:px-6 lg:px-8 overflow-x-hidden bg-[#0F172A] min-h-screen transition-all duration-500 ease-in-out ${loading ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERVIEW' && (
                        <OverviewModule
                            loading={loading}
                            studyCount={studies.length}
                            participantCount={participants.length}
                            stats={oversightStats}
                            visits={visits}
                            viewDate={viewDate}
                            setViewDate={setViewDate}
                            onLaunch={() => setActiveModule('LAUNCH_STUDY')}
                            onNavigate={(id) => handleModuleChange(id as PIModule)}
                        />
                    )}
                    {activeModule === 'STUDIES' && (
                        <StudyOverviewModule
                            studies={studies}
                            onAdd={() => setActiveModule('LAUNCH_STUDY')}
                            onEdit={async (s) => {
                                try {
                                    const res = await authFetch(`${API}/api/studies/${s.protocol_id}/`);
                                    if (res.ok) {
                                        const fullStudy = await res.json();
                                        setSelectedStudy(fullStudy);
                                    } else {
                                        setSelectedStudy(s);
                                    }
                                } catch (e) {
                                    setSelectedStudy(s);
                                }
                                setActiveModule('LAUNCH_STUDY');
                            }}
                            onStatusUpdate={async (protocolId, newStatus) => {
                                try {
                                    const res = await authFetch(`${API}/api/studies/${protocolId}/`, {
                                        method: 'PATCH',
                                        body: JSON.stringify({ status: newStatus, stage: newStatus })
                                    });
                                    if (res.ok) {
                                        fetchAllData();
                                    }
                                } catch (e) {
                                    console.error("Status update failed:", e);
                                }
                            }}
                        />
                    )}
                    {activeModule === 'LAUNCH_STUDY' && (
                        <LaunchStudyForm
                            onClose={() => {
                                setActiveModule('STUDIES');
                                setSelectedStudy(null);
                            }}
                            initialData={selectedStudy}
                            onSave={handleCreateStudy}
                        />
                    )}
                    {activeModule === 'TEAM_INVENTORY' && (
                        <TeamInventoryModule 
                            members={users} 
                            loading={loading}
                            onRefresh={fetchAllData}
                            selectedStudyId={globalSelectedStudyId}
                        />
                    )}
                    {activeModule === 'LOGISTICS' && (
                        <StudyKitsModule 
                            selectedStudyId={globalSelectedStudyId}
                            preloadedStudies={studies}
                            preloadedParticipants={participants}
                        />
                    )}
                    {activeModule === 'MESSAGES' && <PIMessagesModule />}
                    {activeModule === 'TEAM' && (
                        <PITeamModule 
                            allUsers={users} 
                            allStudies={studies} 
                            onRefresh={fetchAllData} 
                            selectedStudyId={globalSelectedStudyId}
                        />
                    )}

                    {activeModule === 'PARTICIPANTS' && (
                        selectedParticipantId ? (
                            <div className="bg-[#0B101B] rounded-[2.5rem] -mt-6">
                                <SubjectReviewModule 
                                    participantId={selectedParticipantId} 
                                    onClose={() => setSelectedParticipantId(null)} 
                                />
                            </div>
                        ) : (
                            <ParticipantOversight
                                selectedStudyId={globalSelectedStudyId}
                                preloadedData={summaryData}
                                isLoading={summaryLoading}
                                onOpenProfile={(id) => setSelectedParticipantId(id)}
                            />
                        )
                    )}
                    {activeModule === 'FORMS' && <FormsQuestionnairesModule />}


                    {activeModule === 'VISITS' && (
                        <VisitsModule 
                            selectedStudyId={globalSelectedStudyId !== 'all' ? globalSelectedStudyId : undefined} 
                            preloadedParticipants={participants}
                            preloadedStudies={studies}
                            preloadedTasks={tasks}
                            onRefresh={fetchAllData}
                            isLoading={summaryLoading}
                        />
                    )}
                    {activeModule === 'LABS' && (
                        <LabsResultsModule 
                            selectedStudyId={globalSelectedStudyId} 
                            preloadedStudies={studies}
                            isLoading={summaryLoading}
                        />
                    )}

                    {activeModule === 'ALERTS' && <AlertsModule />}
                    {activeModule === 'SUPPORT' && <PIHelpSupportModule />}
                    {activeModule === 'AUDIT_LOG' && <AuditLogModule />}
                    {activeModule === 'TASKS' && (
                        <StaffTasksModule 
                            primaryColor="teal" 
                            onRefresh={fetchAllData} 
                            preloadedTasks={tasks}
                        />
                    )}
                    {activeModule === 'PARTICIPANT_TASKS' && <ParticipantTaskManagement primaryColor="teal" />}
                    {activeModule === 'STUDY_DOCS' && <StudyDocumentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'ANALYTICS' && (
                        <AnalyticsModule 
                            selectedStudyId={globalSelectedStudyId}
                            preloadedData={summaryData}
                            isLoading={summaryLoading}
                        />
                    )}
                    {activeModule === 'SPONSORS' && (
                        <SponsorsManagement 
                            onRefresh={fetchAllData}
                            selectedStudyId={globalSelectedStudyId !== 'all' ? globalSelectedStudyId : undefined}
                            preloadedStudies={studies}
                        />
                    )}
                </AnimatePresence>
            </main>



            <LogoutConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmSignOut}
            />
        </div>
    );
}

function OverviewModule({ loading, studyCount, participantCount, stats, visits, viewDate, setViewDate, onLaunch, onNavigate }: { loading: boolean, studyCount: number, participantCount: number, stats: any, visits: any[], viewDate: Date, setViewDate: (d: Date) => void, onLaunch: () => void, onNavigate: (id: string) => void }) {
    
    const calendarData = useMemo(() => {
        if (loading) return { daysInMonth: 30, firstDay: 0, sessionsByDate: {} };
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
        const sessionsByDate: Record<string, any[]> = {};

        visits.forEach(v => {
            if (!v.scheduled_date) return;
            try {
                const dateObj = new Date(v.scheduled_date);
                if (isNaN(dateObj.getTime())) return;
                const d = dateObj.toISOString().split('T')[0];
                if (!sessionsByDate[d]) sessionsByDate[d] = [];
                sessionsByDate[d].push({ 
                    label: `${v.participant_sid || 'SUB'}: ${(v.visit_type || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}`, 
                    status: v.status 
                });
            } catch (e) {}
        });

        return { daysInMonth, firstDay, sessionsByDate };
    }, [viewDate, visits]);

    const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight leading-none">
                    Research <span className="text-teal-400">Overview</span>
                </h2>
                <button
                    onClick={onLaunch}
                    className="w-full md:w-auto px-6 py-3 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" /> START NEW STUDY
                </button>
            </div>

            {/* Metrics Boxes Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5 border-t border-white/10 pt-6">
                {loading ? (
                    Array.from({ length: 7 }).map((_, i) => (
                        <PISkeleton key={i} className="h-24" />
                    ))
                ) : (
                    <>
                        {[
                            { label: 'Active Studies', val: studyCount.toString().padStart(2, '0'), icon: Beaker, color: 'teal', action: () => onNavigate('STUDIES') },
                            { label: 'Participants', val: participantCount.toLocaleString(), icon: UsersRound, color: 'emerald', action: () => onNavigate('PARTICIPANTS') },
                            { label: 'Alerts', val: stats.unreadAlerts.toString().padStart(2, '0'), icon: Activity, color: 'red', action: () => onNavigate('ALERTS') },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                onClick={stat.action}
                                className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col justify-between gap-1.5 group cursor-pointer hover:bg-white/10 hover:border-teal-500/30 transition-all shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                     <div className={`w-6 h-6 rounded bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon className={`w-3.5 h-3.5 text-${stat.color}-400`} />
                                    </div>
                                    <span className="text-lg font-bold text-white tracking-tight group-hover:text-teal-400 transition-colors">{stat.val}</span>
                                </div>
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none truncate">{stat.label}</h4>
                            </div>
                        ))}
        
                        {[
                            { label: 'Upcoming', val: stats.upcomingVisits.toString().padStart(2, '0'), sub: 'Next 60d', color: 'teal', action: () => onNavigate('VISITS') },
                            { label: 'Overdue', val: stats.overdueFollowUps.toString().padStart(2, '0'), sub: 'Critical', color: 'red', alert: stats.hasCriticalAlert },
                            { label: 'Callbacks', val: stats.awaitingCallback.toString().padStart(2, '0'), sub: 'Leads', color: 'emerald' },
                            { label: 'Forms', val: stats.pendingForms.toString().padStart(2, '0'), sub: 'Pending', color: 'amber' }
                        ].map((widget, i) => (
                            <div key={i} onClick={widget.action} className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col justify-between gap-1.5 group cursor-pointer hover:bg-white/10 hover:border-teal-500/30 transition-all relative shadow-md">
                                {widget.alert && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                                <div className="flex items-center justify-between">
                                    <span className={`text-lg font-bold text-${widget.color}-400`}>{widget.val}</span>
                                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-none truncate ml-2">{widget.sub}</span>
                                </div>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none group-hover:text-white transition-colors">{widget.label}</p>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Row 3 — Enhanced Full Month Calendar */}
            <div className="bg-[#0B101B]/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest leading-none">
                            Study Schedule <span className="text-teal-400">Calendar</span>
                        </h3>
                        <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Global Study Activity</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex gap-4 mr-4">
                            {[
                                { label: 'Completed', color: 'bg-emerald-500' },
                                { label: 'Scheduled', color: 'bg-teal-500' },
                                { label: 'Overdue', color: 'bg-red-500' }
                            ].map((l, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${l.color}`} />
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{l.label}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1 border border-white/5">
                            <button 
                                onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} 
                                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-white min-w-[100px] text-center uppercase tracking-widest">{monthYear}</span>
                            <button 
                                onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} 
                                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-7 bg-white/[0.02] border-b border-white/5">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="py-3 text-center text-[10px] md:text-xs font-black text-white/30 tracking-[0.2em] uppercase">
                            <span className="hidden md:inline">{['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'][i]}</span>
                            <span className="md:hidden">{d}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr md:min-h-[400px]">
                    {Array.from({ length: 35 }).map((_, i) => {
                        const { daysInMonth, firstDay, sessionsByDate } = calendarData;
                        const adjFirstDay = (firstDay === 0 ? 6 : firstDay - 1);
                        const dayNum = i - adjFirstDay + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        
                        const currentDayDate = isCurrentMonth ? new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum) : null;
                        const dateString = currentDayDate ? currentDayDate.toISOString().split('T')[0] : '';
                        const daySessions = sessionsByDate[dateString] || [];
                        const isToday = currentDayDate?.toDateString() === new Date().toDateString();

                        return (
                            <div 
                                key={i} 
                                className={`p-1.5 md:p-3 border-r border-b border-white/5 aspect-square md:aspect-auto min-h-[60px] md:min-h-[90px] group transition-all relative overflow-hidden
                                    ${!isCurrentMonth ? 'bg-black/20 opacity-[0.05]' : 'hover:bg-teal-500/[0.02]'}
                                    ${isToday ? 'bg-teal-500/[0.07] ring-1 ring-inset ring-teal-500/20' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1 md:mb-2">
                                    <span className={`text-[10px] md:text-xs font-black italic tracking-tighter ${isToday ? 'text-teal-400' : isCurrentMonth ? 'text-white/40 group-hover:text-white/80' : 'text-white/10'}`}>
                                        {isCurrentMonth ? dayNum.toString().padStart(2, '0') : ''}
                                    </span>
                                    {isToday && isCurrentMonth && <div className="w-1 h-1 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />}
                                </div>

                                {/* Desktop View: Text Labels */}
                                <div className="hidden md:block space-y-1.5">
                                    {daySessions.slice(0, 3).map((s, idx) => (
                                        <button 
                                            key={idx} 
                                            title={`Visit Tracker: ${s.label}`}
                                            onClick={(e) => { e.stopPropagation(); onNavigate('VISITS'); }}
                                            className={`px-2 py-1 rounded-lg text-[9px] leading-none font-black uppercase tracking-widest truncate w-full text-left transition-all active:scale-95 border
                                                ${s.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                  s.status === 'SCHEDULED' ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 
                                                  'bg-red-500/10 text-red-400 border-red-500/20'}
                                            `}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                    {daySessions.length > 3 && (
                                        <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] pl-1">+{daySessions.length - 3} More</p>
                                    )}
                                </div>

                                {/* Mobile/Tablet View: Activity Dots */}
                                <div className="flex flex-wrap gap-1 md:hidden mt-1">
                                    {daySessions.map((s, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`w-1.5 h-1.5 rounded-full shadow-sm
                                                ${s.status === 'COMPLETED' ? 'bg-emerald-500' : 
                                                  s.status === 'SCHEDULED' ? 'bg-teal-500' : 
                                                  'bg-red-500'}
                                            `}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Row 4 — Quick Access Bottom Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                {[
                    { label: 'Alert Center', sub: `${stats.unreadAlerts.toString().padStart(2, '0')} New Findings`, icon: Bell, id: 'ALERTS' },
                    { label: 'Message Center', sub: '05 Real-time Channels', icon: MessageSquare, id: 'MESSAGES' },
                    { label: 'Study Archive', sub: '12 Study Records', icon: FileText, id: 'STUDY_DOCS' },
                    { label: 'Verified Docs', sub: '01 Compliance Flag', icon: ShieldCheck, id: 'MY_DOCS' }
                ].map((card, i) => (
                    <button 
                        key={i} 
                        onClick={() => onNavigate(card.id)} 
                        className="group bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left hover:bg-white/[0.04] hover:border-teal-500/30 transition-all shadow-lg"
                    >
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <card.icon className="w-5 h-5 text-teal-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight leading-none group-hover:text-teal-400 transition-colors uppercase">{card.label}</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 whitespace-nowrap">{card.sub}</p>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

const STUDY_STATUS_CHOICES = [
    { value: 'DRAFT', label: 'DRAFT' },
    { value: 'PROPOSAL_SUBMITTED', label: 'PROPOSAL SUBMITTED' },
    { value: 'PROPOSAL_UNDER_NEGOTIATION', label: 'PROPOSAL UNDER NEGOTIATION' },
    { value: 'AGREEMENT_SIGNED', label: 'AGREEMENT SIGNED' },
    { value: 'IRB_PROTOCOL_INITIATED', label: 'IRB PROTOCOL INITIATED' },
    { value: 'UNDER_IRB_SUBMISSION', label: 'UNDER IRB SUBMISSION / DEV' },
    { value: 'IRB_APPROVED', label: 'IRB APPROVED' },
    { value: 'PREPARING_TO_LAUNCH', label: 'PREPARING TO LAUNCH' },
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'RECRUITING', label: 'RECRUITING' },
    { value: 'RECRUITMENT_COMPLETED', label: 'RECRUITMENT COMPLETED' },
    { value: 'ANALYSIS_UNDERWAY', label: 'ANALYSIS UNDERWAY' },
    { value: 'PROGRESS_REPORT_DRAFT', label: 'PROGRESS REPORT DRAFT' },
    { value: 'FINAL_REPORT_SENT', label: 'FINAL REPORT SENT' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'PAUSED', label: 'PAUSED' },
    { value: 'CLOSED_ARCHIVED', label: 'CLOSED / ARCHIVED' },
];

function StudyOverviewModule({ studies, onAdd, onEdit, onStatusUpdate }: { studies: any[], onAdd: () => void, onEdit: (s: any) => void, onStatusUpdate: (pid: string, status: string) => void }) {
    const [filter, setFilter] = useState('ALL');
    const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveStatusMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const categories = [
        { id: 'ALL', label: 'Total Studies', count: studies.length, icon: Layers },
        { id: 'ACTIVE', label: 'Active Studies', count: studies.filter(s => s.status?.toUpperCase() === 'ACTIVE').length, icon: Activity },
        { id: 'RECRUITING', label: 'Recruiting Studies', count: studies.filter(s => s.status?.toUpperCase() === 'RECRUITING').length, icon: UsersRound },
        { id: 'ANALYSIS', label: 'In Analysis', count: studies.filter(s => s.status?.toUpperCase() === 'ANALYSIS').length, icon: TrendingUp },
        { id: 'COMPLETED', label: 'Completed Studies', count: studies.filter(s => s.status?.toUpperCase() === 'COMPLETED').length, icon: CheckSquare },
        { id: 'PAUSED', label: 'Paused Studies', count: studies.filter(s => s.status?.toUpperCase() === 'PAUSED').length, icon: Settings2 },
    ];

    const filteredStudies = filter === 'ALL' ? studies : studies.filter(s => s.status?.toUpperCase() === filter);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight leading-none">Research <span className="text-teal-400">Studies</span></h2>
                <button onClick={onAdd} className="px-8 py-3.5 bg-teal-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-teal-900/40 hover:scale-[1.02] transition-all">
                    <Plus className="w-4 h-4" /> START NEW STUDY
                </button>
            </div>

            {/* Filter Hub */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 border-t border-white/10 pt-10">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all text-left relative group overflow-hidden ${
                            filter === cat.id 
                            ? 'bg-teal-500/10 border-teal-500/30 shadow-lg shadow-teal-500/5' 
                            : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                        }`}
                    >
                        {filter === cat.id && (
                            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/10 blur-2xl rounded-full -mr-8 -mt-8" />
                        )}
                        <div className="flex items-center gap-3 relative z-10">
                            <cat.icon className={`w-3.5 h-3.5 ${filter === cat.id ? 'text-teal-400' : 'text-slate-500'}`} />
                            <span className={`text-[11px] font-black uppercase tracking-widest ${filter === cat.id ? 'text-teal-400' : 'text-slate-500'}`}>
                                {cat.label}
                            </span>
                        </div>
                        <p className={`text-4xl font-black tracking-tighter leading-none relative z-10 ${filter === cat.id ? 'text-white' : 'text-white/60'}`}>
                            {cat.count.toString().padStart(2, '0')}
                        </p>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                {filteredStudies.length === 0 ? (
                    <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No active studies found in this section</p>
                    </div>
                ) : filteredStudies.map((study, i) => (
                    <div key={i} className="group bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6 relative hover:bg-white/[0.04] hover:border-teal-500/30 transition-all duration-300 shadow-xl shadow-black/20">
                        {/* Card Header: Study ID & Status */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-teal-400 group-hover:border-teal-500/40 transition-all shadow-lg">
                                    <Beaker className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-teal-400/60 tracking-widest font-mono italic">Study Node</span>
                                        <p className="text-sm font-black text-[#2dd4bf] tracking-widest leading-none">{study.protocol_id}</p>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-tight group-hover:text-teal-400 transition-colors">
                                        {study.title}
                                    </h3>
                                </div>
                            </div>
                            
                            {/* Status Indicator with Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveStatusMenu(activeStatusMenu === study.protocol_id ? null : study.protocol_id);
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shrink-0 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                                        study.status?.toUpperCase() === 'ACTIVE' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                        study.status?.toUpperCase() === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-white/5 text-slate-500 border-white/10'
                                    }`}
                                >
                                    {(study.status || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                    <ChevronDown className={`w-3 h-3 transition-transform ${activeStatusMenu === study.protocol_id ? 'rotate-180' : ''}`} />
                                </button>

                                {activeStatusMenu === study.protocol_id && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-[#0B101B] border border-white/10 rounded-xl shadow-3xl z-[100] p-1 overflow-hidden"
                                        ref={dropdownRef}
                                    >
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {STUDY_STATUS_CHOICES.map((choice) => (
                                                <button
                                                    key={choice.value}
                                                    onClick={() => {
                                                        onStatusUpdate(study.protocol_id, choice.value);
                                                        setActiveStatusMenu(null);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all transition-all flex items-center justify-between ${
                                                        study.status === choice.value 
                                                        ? 'bg-teal-500/10 text-teal-400' 
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    {choice.label}
                                                    {study.status === choice.value && <CheckCircle2 className="w-3 h-3" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Enrollment', val: study.actual_screened || '0', target: study.target_screened || '100', color: 'text-white' },
                                { label: 'Completion', val: study.completed_count || '0', target: study.total_required || '90', color: 'text-white' },
                                { label: 'Phase', val: (study.phase || 'Phase II/III').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()), color: 'text-teal-400' },
                                { label: 'Diversity', val: study.diversity_score || '94%', color: 'text-emerald-400' }
                            ].map((met, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors relative h-24 flex flex-col justify-end">
                                    <span className="text-[10px] text-white/40 font-black uppercase tracking-widest italic absolute top-4 left-4">{met.label}</span>
                                    <p className={`text-lg font-black ${met.color}`}>
                                        {met.val}
                                        {met.target && <span className="text-xs text-slate-600 ml-1 font-bold">/{met.target}</span>}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveStatusMenu(activeStatusMenu === study.protocol_id ? null : study.protocol_id);
                                }}
                                className="flex-1 p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 cursor-pointer hover:bg-teal-500/10 transition-all flex flex-col justify-center gap-1"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black text-teal-400 uppercase tracking-widest italic">Study Lifecycle Stage</p>
                                    <ListFilter className="w-3 h-3 text-teal-400/50" />
                                </div>
                                <p className="text-sm font-black text-white italic uppercase tracking-tight">
                                    {(study.stage || study.status || "In Evaluation").replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                </p>
                            </div>
                            <button
                                onClick={() => onEdit(study)}
                                className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black italic uppercase tracking-[0.2em] hover:bg-white hover:text-slate-950 transition-all shadow-lg active:scale-95 shrink-0"
                            >
                                STUDY DETAILS
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function ComplianceModule() {
    const user: any = getUser() || {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div>
                <h2 className="text-2xl font-bold text-white  uppercase tracking-tighter leading-none">
                    Compliance <span className="text-teal-400">& Credentials</span>
                </h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.3em] mt-3 ">
                    Verified professional documentation and node synchronization
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/5 blur-[100px] rounded-full group-hover:bg-teal-500/10 transition-colors duration-1000" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {[
                        { id: 'medical_licence', label: 'Medical Licence', path: user.medical_licence, desc: 'Official state-issued medical practice authorization' },
                        { id: 'insurance_certificate', label: 'Professional Insurance', path: user.insurance_certificate, desc: 'Coverage for clinical trial liability and oversight' },
                        { id: 'cv_document', label: 'Curriculum Vitae', path: user.cv_document, desc: 'Up-to-date professional history and research experience' }
                    ].map((doc, i) => (
                        <div key={i} className="bg-[#0B101B]/60 border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-teal-500/30 transition-all flex flex-col">
                            <div className="flex justify-between items-center">
                                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                {doc.path ? (
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]" />
                                        <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Verified</span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Pending</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white  uppercase tracking-widest">{doc.label}</h4>
                                <p className="text-sm text-slate-500 font-bold mt-2 leading-relaxed ">{doc.desc}</p>
                            </div>
                            <div className="mt-4 pt-6 border-t border-white/5">
                                {doc.path ? (
                                    <a
                                        href={getMediaUrl(doc.path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-slate-950 border border-white/10 rounded-2xl text-sm font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/link"
                                    >
                                        <Globe className="w-4 h-4 group-hover/link:rotate-12 transition-transform" /> View Document
                                    </a>
                                ) : (
                                    <button className="w-full py-4 bg-amber-500/5 text-amber-500 border border-amber-500/20 rounded-2xl text-sm font-bold uppercase tracking-[0.2em] opacity-50 cursor-not-allowed">
                                        Upload Required
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12 p-8 bg-teal-500/10 border border-teal-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white uppercase  tracking-widest">Authorization Status</p>
                        <p className="text-sm text-teal-300/60 font-bold uppercase tracking-widest mt-1">Global Scientific Network Verification</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest line-clamp-1 ">Synchronization Complete</span>
                </div>
            </div>
        </motion.div>
    );
}


