import React, { useState, useEffect, useRef } from 'react';
import NotificationBell from '../../components/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, clearToken, getRole, performLogout, getUser, getDisplayName, API } from '../../utils/auth';
import { apiFetch } from '../../api';
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
import StudyKitsModule from '../../components/shared/StudyKitsModule';
import ParticipantTaskManagement from '../../components/shared/ParticipantTaskManagement';
import CompensationManagement from '../../components/coordinator/panels/CompensationManagement';

// Modular Page Components
import { OperationsOversight } from './modules/OperationsOversight';
import { StudyDirectory } from './modules/StudyDirectory';


import {
    Calendar, Clock, ArrowRight, ChevronRight, ChevronLeft, Sparkles, Trophy,
    Activity, FileText, CheckCircle2, Box, Zap, PlusCircle,
    AlertCircle, MessageSquare, Ship, Microscope, History,
    TrendingUp, Award, LayoutDashboard, Bell, Info, ExternalLink,
    Play, Download, ClipboardList, Beaker, DraftingCompass, Users,
    ShieldCheck, Settings, Search, ChevronDown, Plus, X, Filter,
    HelpCircle, Stethoscope, UsersRound, ArrowUpRight, LogOut,
    Globe, Rocket, Menu, FlaskConical, FileSearch, Layers,
    ListFilter, CheckSquare, ScrollText, Settings2, Database,
    AlertTriangle, FileCheck, Briefcase, DollarSign
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
    | 'LAUNCH_STUDY'
    | 'SPONSORS'
    | 'TASKS'
    | 'ANALYTICS'
    | 'KITS'
    | 'COMPENSATION'
    | 'PARTICIPANT_TASKS';

export default function CoordinatorDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeModule, setActiveModule] = useState<CCModule>(() => {
        const path = location.pathname.toLowerCase().replace(/\/$/, "");
        const parts = path.split('/');
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
        if (route === 'launch-study') return 'LAUNCH_STUDY';
        if (route === 'analytics') return 'ANALYTICS';
        if (route === 'sponsors') return 'SPONSORS';
        if (route === 'tasks') return 'TASKS';
        if (route === 'kits') return 'KITS';
        if (route === 'participant-tasks') return 'PARTICIPANT_TASKS';
        return 'OVERSIGHT';
    });

    // Sync activeModule when URL changes (for browser back button support)
    useEffect(() => {
        const path = location.pathname.toLowerCase().replace(/\/$/, "");
        const parts = path.split('/');
        const route = parts[parts.length - 1];

        if (route === 'coordinator' || !route || route === 'oversight') setActiveModule('OVERSIGHT');
        else if (route === 'studies') setActiveModule('STUDIES');
        else if (route === 'participants' || route === 'subject-review' || route === 'review') setActiveModule('PARTICIPANTS');
        else if (route === 'team') setActiveModule('TEAM');
        else if (route === 'messages') setActiveModule('MESSAGES');
        else if (route === 'labs') setActiveModule('LABS');
        else if (route === 'reports') setActiveModule('REPORTS');
        else if (route === 'study-docs' || route === 'docs') setActiveModule('STUDY_DOCS');
        else if (route === 'my-docs') setActiveModule('MY_DOCS');
        else if (route === 'alerts') setActiveModule('ALERTS');
        else if (route === 'launch-study') setActiveModule('LAUNCH_STUDY');
        else if (route === 'analytics') setActiveModule('ANALYTICS');
        else if (route === 'tasks') setActiveModule('TASKS');
        else if (route === 'participant-tasks') setActiveModule('PARTICIPANT_TASKS');
        else if (route === 'sponsors') setActiveModule('SPONSORS');
        else if (route === 'kits') setActiveModule('KITS');
        else if (route === 'compensation' || route === 'rewards') setActiveModule('COMPENSATION');
        else if (location.pathname.includes('/dashboard/coordinator')) {
            // Stay consistent with dashboard root
            if (location.pathname.endsWith('/coordinator')) setActiveModule('OVERSIGHT');
        }

        // Senior Developer Add: Check for missed visits on load to trigger alerts/notifications
        const checkMissed = async () => {
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
        checkMissed();
    }, [location.pathname]);

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
            'LAUNCH_STUDY': 'launch-study',
            'TASKS': 'tasks',
            'ANALYTICS': 'analytics',
            'SPONSORS': 'sponsors',
            'KITS': 'kits',
            'COMPENSATION': 'compensation',
            'PARTICIPANT_TASKS': 'participant-tasks'
        };
        const slug = slugs[mod];
        setActiveModule(mod);
        navigate(`/dashboard/coordinator${slug ? '/' + slug : ''}`);
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

    const addToast = (msg: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        // Initial Notification Sync
        fetchNotifications();
        
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

        function handleScroll() {
            if (isNotificationOpen) setIsNotificationOpen(false);
            if (isProfileOpen) setIsProfileOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true); // true to catch all scrolls
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
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
    const [sponsorOrganizations, setSponsorOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudy, setSelectedStudy] = useState<any>(null);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [globalSelectedStudyId, setGlobalSelectedStudyId] = useState<string | 'all'>('all');
    // Participant count per study for the dropdown
    const [participantsByStudy, setParticipantsByStudy] = useState<Record<string, number>>({});

    const [visits, setVisits] = useState<any[]>([]);
    const [oversightStats, setOversightStats] = useState({
        upcomingVisits: 0,
        overdueFollowUps: 0,
        awaitingCallback: 0,
        pendingForms: 0,
        activeSubjects: 0,
        hasCriticalAlert: false
    });


    const fetchCoordinatorContent = async () => {
        setLoading(true);
        try {
            const [studiesData, usersData, sponsorsData, visitsData, participantsData, questionnairesData] = await Promise.all([
                apiFetch<any[]>('/api/studies/'),
                apiFetch<any[]>('/api/users/'),
                apiFetch<any[]>('/api/sponsor-organizations/'),
                apiFetch<any[]>('/api/visits/'),
                apiFetch<any[]>('/api/participants/'),
                apiFetch<any[]>('/api/questionnaire-schedules/')
            ]);

            setStudies((studiesData || []).sort((a: any, b: any) =>
                (a.id || "").localeCompare(b.id || "")
            ));

            setUsers((usersData || []).map((u: any) => ({
                ...u,
                role: u.role ? u.role.toString().toUpperCase() : 'PARTICIPANT'
            })));

            setSponsorOrganizations(sponsorsData || []);
            setVisits(visitsData || []);

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
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoordinatorContent();
    }, []);

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

    const normalizeStudyPayload = (formData: any) => {
        const payload: any = { ...formData };

        payload.start_date = formData.startDate ?? formData.start_date ?? null;
        payload.end_date = formData.endDate ?? formData.end_date ?? null;
        payload.description = formData.brief_description ?? formData.description ?? '';
        payload.primary_indication = formData.indication ?? formData.primary_indication ?? '';
        payload.condition = formData.indication ?? formData.condition ?? formData.primary_indication ?? '';
        payload.study_type = formData.execution_type ?? formData.study_type ?? 'IN_PERSON';
        payload.target_subjects = formData.target_subjects ?? formData.target_screened ?? 0;
        payload.target_screened = formData.target_screened ?? payload.target_subjects;
        payload.pi_ids = toStudyAssignmentIds(formData.pi_ids ?? formData.pi_id);
        payload.coordinator_ids = toStudyAssignmentIds(formData.coordinator_ids ?? formData.coordinator_id);

        if (!payload.sponsor_id) delete payload.sponsor_id;
        if (!payload.sponsor_org_id) delete payload.sponsor_org_id;

        delete payload.pi_id;
        delete payload.coordinator_id;
        delete payload.assigned_pis;
        delete payload.assigned_coordinators;
        delete payload.assigned_sponsors;
        delete payload.startDate;
        delete payload.endDate;
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

    const handleCreateStudy = async (formData: any) => {
        try {
            const apiUrl = API || '';
            const method = selectedStudy ? 'PATCH' : 'POST';
            const payload = normalizeStudyPayload(formData);

            const url = selectedStudy
                ? `${apiUrl}/api/studies/${selectedStudy.protocol_id || selectedStudy.id}/`
                : `${apiUrl}/api/studies/`;

            const res = await authFetch(url, { method: method, body: JSON.stringify(payload) });

            if (res.ok) {
                handleModuleChange('STUDIES');
                setSelectedStudy(null);
                fetchCoordinatorContent();
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

    const handleUpdateStudyStatus = async (studyId: string, newStatus: string) => {
        try {
            const res = await authFetch(`${API}/api/studies/${studyId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus, stage: newStatus })
            });
            if (res.ok) {
                setStudies(studies.map(s => s.id === studyId ? { ...s, status: newStatus, stage: newStatus } : s));
            }
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const role = getRole();
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    const sidebarGroups = [
        {
            group: 'GENERAL',
            items: [
                { id: 'WEBSITE', label: 'Website', icon: Globe },
                { id: 'OVERSIGHT', label: 'Overview', icon: LayoutDashboard },
                { id: 'TASKS', label: 'Tasks', icon: CheckSquare, hasNotify: true },
            ]
        },
        {
            group: 'COORDINATION',
            items: [
                { id: 'STUDIES', label: 'Studies', icon: Beaker },
                { id: 'TEAM', label: 'Team', icon: Users },
                { id: 'PARTICIPANTS', label: 'Participants', icon: UsersRound },
                { id: 'FORMS', label: 'Forms', icon: ClipboardList },
                { id: 'CONSENT', label: 'Consent', icon: ShieldCheck },
                { id: 'VISITS', label: 'Visits', icon: Calendar },
                { id: 'LABS', label: 'Labs', icon: Beaker },
                { id: 'KITS', label: 'Kits', icon: Box },
                { id: 'COMPENSATION', label: 'Payments', icon: DollarSign },
                { id: 'PARTICIPANT_TASKS', label: 'Tasks', icon: ListFilter },
            ]
        },
        {
            group: 'DOCUMENTS & COMMS',
            items: [
                { id: 'STUDY_DOCS', label: 'Documents', icon: FileText },
                { id: 'MY_DOCS', label: 'Credentials', icon: Briefcase },
                { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
                { id: 'ALERTS', label: 'Alerts', icon: Bell, hasNotify: true },
            ]
        },
        ...(isAdmin ? [{
            group: 'ADMINISTRATION',
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
            <header className="fixed top-0 left-0 xl:left-[240px] right-0 h-16 md:h-20 z-[60] bg-[#0B101B] border-b border-white/5 flex items-center justify-between px-3 md:px-6 transition-all">
                <div className="flex items-center gap-2 xl:hidden">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all h-9 w-9 shrink-0 flex items-center justify-center">
                        {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-start xl:pl-4">
                    <div className="flex items-center gap-4">
                        <div className="hidden xl:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 h-10">
                            <div className="px-2 text-[9px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/10 shrink-0">Study</div>
                             <select
                                 value={globalSelectedStudyId}
                                 onChange={(e) => setGlobalSelectedStudyId(e.target.value)}
                                 className="bg-transparent text-[12px] font-black text-blue-400 uppercase tracking-[0.15em] outline-none cursor-pointer px-3 min-w-[140px] max-w-[240px] truncate"
                             >
                                 <option value="all" className="bg-[#0B101B]">All Studies ({Object.values(participantsByStudy).reduce((a,b)=>a+b,0)} participants)</option>
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
                                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">System Alerts</h3>
                                            {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Clear All</button>}
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
                                                         <div key={notif.id} className="p-5 hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-blue-500">
                                                             <div className="flex items-start gap-4">
                                                                 <div className="p-2 bg-blue-500/10 rounded-xl">
                                                                     <Bell className="w-4 h-4 text-blue-400" />
                                                                 </div>
                                                                 <div className="flex-1 min-w-0">
                                                                     <p className="text-sm font-bold text-white leading-snug">{notif.message}</p>
                                                                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{new Date(notif.created_at).toLocaleTimeString()}</p>
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
                                         <p className="text-sm font-black text-white uppercase italic truncate tracking-tight">
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
                                        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all text-[11px] font-black uppercase tracking-widest"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Terminate Session</span>
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

            <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-[#0B101B] border-r border-white/5 z-[70] transition-transform duration-300 xl:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}`}>
                <div className="h-20 px-8 flex justify-between items-center border-b border-white/[0.05] shrink-0">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="group transition-all">
                        <div className="bg-white p-2 rounded-2xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <img src="/logo.jpg" alt="Logo" className="h-12 w-auto object-contain rounded-xl" />
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="xl:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all h-10 w-10 flex items-center justify-center shrink-0"
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
                        <span className="text-[12px] font-black uppercase tracking-widest">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 xl:pl-[240px] pt-20 md:pt-24 pb-20 overflow-x-hidden bg-[#0F172A] min-h-screen">
                <div className="px-8 flex-1">
                    <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && (
                        <OperationsOversight
                            studyCount={studies.length}
                            stats={oversightStats}
                            currentTime={currentTime}
                            visits={visits}
                            onLaunch={() => handleModuleChange('LAUNCH_STUDY')}
                            onNavigate={(id) => handleModuleChange(id as CCModule)}
                            isAdmin={isAdmin}
                        />
                    )}
                    {activeModule === 'STUDIES' && (
                        <StudyDirectory
                            studies={studies}
                            onAdd={() => handleModuleChange('LAUNCH_STUDY')}
                            onEdit={(s) => { setSelectedStudy(s); handleModuleChange('LAUNCH_STUDY'); }}
                            onUpdateStatus={handleUpdateStudyStatus}
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
                    {activeModule === 'TEAM' && <CCC_TeamModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'PARTICIPANTS' && (
                        selectedParticipantId ? (
                            <CCC_SubjectReviewModule 
                                selectedStudyId={globalSelectedStudyId} 
                                participantId={selectedParticipantId} 
                            />
                        ) : (
                            <ParticipantOversight 
                                selectedStudyId={globalSelectedStudyId} 
                                onOpenProfile={(id) => setSelectedParticipantId(id)} 
                                onMessage={() => setActiveModule('MESSAGES')} 
                            />
                        )
                    )}
                    {activeModule === 'FORMS' && <FormsQuestionnairesModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'CONSENT' && <CCConsentModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'VISITS' && <CCC_VisitsAssessmentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'LABS' && <LabsResultsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'KITS' && <StudyKitsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'REPORTS' && <ReportsSignOffModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'STUDY_DOCS' && <StudyDocumentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'MY_DOCS' && <MyDocumentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'ALERTS' && <AlertsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'TASKS' && <StaffTasksModule primaryColor="blue" />}
                    {activeModule === 'PARTICIPANT_TASKS' && <ParticipantTaskManagement primaryColor="blue" selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'COMPENSATION' && <CompensationManagement selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'ANALYTICS' && (
                        <AnalyticsModule 
                            selectedStudyId={globalSelectedStudyId} 
                            onViewProfile={(id) => {
                                setSelectedParticipantId(id);
                                setActiveModule('PARTICIPANTS');
                            }}
                        />
                    )}
                    {activeModule === 'SPONSORS' && <SponsorsManagement selectedStudyId={globalSelectedStudyId} allUsers={users} allStudies={studies} onRefresh={fetchCoordinatorContent} />}
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
        </div>
    );
}
