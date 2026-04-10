import React, { useState, useEffect, useRef } from 'react';
import NotificationBell from '../../components/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, clearToken, getRole, performLogout, getUser, getDisplayName, API } from '../../utils/auth';
import LogoutConfirmationModal from '../../components/LogoutConfirmationModal';
import SubmitContentForms from '../../components/coordinator/SubmitContentForms';
import LaunchStudyForm from '../../components/coordinator/LaunchStudyForm';
import SponsorsManagement from '../../components/coordinator/SponsorsManagement';
import CCC_MessagesModule from '../../components/coordinator/CCMessagesModule';
import CCC_SubjectReviewModule from '../../components/coordinator/subject-review/SubjectReviewModule';
import CCC_TeamModule from '../../components/coordinator/team/TeamModule';
import CCC_VisitsAssessmentsModule from '../../components/coordinator/VisitsModule';
import CCC_HelpSupportModule from '../../components/coordinator/support/SupportEntry';


// New Coordinator Panel Modules (Mirrored from PI)
import ParticipantOversight from '../../components/coordinator/panels/ParticipantOversight';
import FormsQuestionnairesModule from '../../components/coordinator/panels/FormsQuestionnairesModule';
import CCConsentModule from '../../components/coordinator/consent/ConsentModule';
import LabsResultsModule from '../../components/coordinator/panels/LabsResultsModule';
import ReportsSignOffModule from '../../components/coordinator/panels/ReportsSignOffModule';
import StudyDocumentsModule from '../../components/coordinator/panels/StudyDocumentsModule';
import MyDocumentsModule from '../../components/coordinator/credentials/CredentialsEntry';
import AlertsModule from '../../components/coordinator/panels/AlertsModule';
import AuditLogModule from '../../components/coordinator/panels/AuditLogModule';
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
    | 'SUBJECT_REVIEW'
    | 'MESSAGES'
    | 'ALERTS'
    | 'LAUNCH_STUDY'
    | 'SPONSORS'
    | 'SUPPORT'
    | 'AUDIT_LOG'
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
        if (route === 'subject-review') return 'SUBJECT_REVIEW';
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
        if (route === 'support') return 'SUPPORT';
        if (route === 'audit-log') return 'AUDIT_LOG';
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
        else if (route === 'participants') setActiveModule('PARTICIPANTS');
        else if (route === 'forms') setActiveModule('FORMS');
        else if (route === 'consent') setActiveModule('CONSENT');
        else if (route === 'visits') setActiveModule('VISITS');
        else if (route === 'subject-review' || route === 'review') setActiveModule('SUBJECT_REVIEW');
        else if (route === 'team') setActiveModule('TEAM');
        else if (route === 'messages') setActiveModule('MESSAGES');
        else if (route === 'labs') setActiveModule('LABS');
        else if (route === 'reports') setActiveModule('REPORTS');
        else if (route === 'study-docs' || route === 'docs') setActiveModule('STUDY_DOCS');
        else if (route === 'my-docs') setActiveModule('MY_DOCS');
        else if (route === 'alerts') setActiveModule('ALERTS');
        else if (route === 'launch-study') setActiveModule('LAUNCH_STUDY');
        else if (route === 'support' || route === 'help') setActiveModule('SUPPORT');
        else if (route === 'audit-log' || route === 'audit') setActiveModule('AUDIT_LOG');
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
    }, [location.pathname]);

    const handleModuleChange = (mod: CCModule) => {
        const slugs: Record<string, string> = {
            'OVERSIGHT': '',
            'STUDIES': 'studies',
            'TEAM': 'team',
            'PARTICIPANTS': 'participants',
            'SUBJECT_REVIEW': 'subject-review',
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
            'SUPPORT': 'support',
            'AUDIT_LOG': 'audit-log',
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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchNotifications();
        return () => clearInterval(timer);
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
            const resp = await authFetch(`${API}/api/notifications/`);
            if (resp.ok) {
                const data = await resp.json();
                setNotifications(data);
            }
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

    useEffect(() => {
        const user = getUser();
        const role = getRole();

        const allowedRoles = ['COORDINATOR', 'ADMIN', 'SUPER_ADMIN'];
        if (!user || !allowedRoles.includes(role)) {
            console.warn("Unauthorized access to Coordinator Dashboard. Redirecting...");
            navigate('/signin');
        }
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
            const apiUrl = API || '';
            const [studiesRes, usersRes, sponsorsRes, visitsRes, participantsRes] = await Promise.all([
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/users/`),
                authFetch(`${apiUrl}/api/sponsor-organizations/`),
                authFetch(`${apiUrl}/api/visits/`),
                authFetch(`${apiUrl}/api/participants/`)
            ]);

            let studiesData = [];
            let visitsData = [];
            let participantsData = [];

            if (studiesRes.ok) {
                studiesData = await studiesRes.json();
                setStudies(studiesData.sort((a: any, b: any) =>
                    (a.id || "").localeCompare(b.id || "")
                ));
            }
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers((data || []).map((u: any) => ({
                    ...u,
                    role: u.role ? u.role.toString().toUpperCase() : 'PARTICIPANT'
                })));
            }
            if (sponsorsRes.ok) setSponsorOrganizations(await sponsorsRes.json());
            
            if (visitsRes.ok) {
                visitsData = await visitsRes.json();
                setVisits(visitsData);
            }

            if (participantsRes.ok) {
                participantsData = await participantsRes.json();
            }

            // Calculate live stats
            const now = new Date();
            const upcoming = visitsData.filter((v: any) => v.status === 'SCHEDULED' && new Date(v.scheduled_date) > now).length;
            const overdue = visitsData.filter((v: any) => v.status === 'SCHEDULED' && new Date(v.scheduled_date) < now).length;
            
            setOversightStats({
                upcomingVisits: upcoming || 12, // Fallback to demo if empty for now
                overdueFollowUps: overdue || 5,
                awaitingCallback: 8,
                pendingForms: 14,
                activeSubjects: participantsData.length,
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

    const handleCreateStudy = async (formData: any) => {
        try {
            const apiUrl = API || '';
            const method = selectedStudy ? 'PATCH' : 'POST';
            const payload: any = {
                ...formData,
                start_date: formData.startDate,
                end_date: formData.endDate,
                description: formData.brief_description,
                primary_indication: formData.indication,
                condition: formData.indication,
                study_type: formData.execution_type,
                target_screened: formData.target_subjects,
                pi_ids: formData.pi_id,
                coordinator_ids: formData.coordinator_id,
            };

            if (!payload.sponsor_id) delete payload.sponsor_id;
            if (!payload.sponsor_org_id) delete payload.sponsor_org_id;

            // Remove singular fields if they are arrays to prevent Backend 400 errors
            // The backend uses pi_ids and coordinator_ids for multi-assignment syncing
            delete payload.pi_id;
            delete payload.coordinator_id;
            delete payload.assigned_pis;
            delete payload.assigned_coordinators;

            // Convert empty strings to null for Date fields to prevent Backend 400
            if (!payload.start_date) payload.start_date = null;
            if (!payload.end_date) payload.end_date = null;
            if (!payload.launch_date) payload.launch_date = null;
            if (!payload.agreement_signed_date) payload.agreement_signed_date = null;
            if (!payload.proposal_submitted_date) payload.proposal_submitted_date = null;

            const url = selectedStudy
                ? `${apiUrl}/api/studies/${selectedStudy.protocol_id || selectedStudy.id}/`
                : `${apiUrl}/api/studies/`;

            const res = await authFetch(url, { method: method, body: JSON.stringify(payload) });

            if (res.ok) {
                handleModuleChange('STUDIES');
                setSelectedStudy(null);
                fetchCoordinatorContent();
            }
        } catch (e) { }
    };

    const sidebarGroups = [
        {
            group: 'GENERAL',
            items: [
                { id: 'WEBSITE', label: 'Main Website', icon: Globe },
                { id: 'OVERSIGHT', label: 'Operations Overview', icon: LayoutDashboard },
                { id: 'TASKS', label: 'My Tasks', icon: CheckSquare, hasNotify: true },
            ]
        },
        {
            group: 'COORDINATION',
            items: [
                { id: 'STUDIES', label: 'Study Directory', icon: Beaker },
                { id: 'TEAM', label: 'Medical Team', icon: Users },
                { id: 'PARTICIPANTS', label: 'Participant Oversight', icon: UsersRound },
                { id: 'SUBJECT_REVIEW', label: 'Screening Review', icon: Activity },
                { id: 'FORMS', label: 'Study Questionnaires', icon: ClipboardList },
                { id: 'CONSENT', label: 'Consent Oversight', icon: ShieldCheck },
                { id: 'VISITS', label: 'Visits & Assessments', icon: Calendar },
                { id: 'LABS', label: 'Health Check Reports', icon: Beaker },
                { id: 'KITS', label: 'Study Kits', icon: Box },
                { id: 'COMPENSATION', label: 'Clinical Rewards Hub', icon: DollarSign },
                { id: 'PARTICIPANT_TASKS', label: 'Participant Tasks', icon: ListFilter },
            ]
        },
        {
            group: 'DOCUMENTS & COMMS',
            items: [
                { id: 'STUDY_DOCS', label: 'Protocol Docs', icon: FileText },
                { id: 'MY_DOCS', label: 'Credentials', icon: Briefcase },
                { id: 'MESSAGES', label: 'Communications', icon: MessageSquare },
                { id: 'ALERTS', label: 'Notifications', icon: Bell, hasNotify: true },
            ]
        },
        {
            group: 'ADMINISTRATION',
            items: [
                { id: 'LAUNCH_STUDY', label: 'Setup Study', icon: Rocket },
                { id: 'SPONSORS', label: 'Sponsor Leads', icon: Database },
                { id: 'ANALYTICS', label: 'Trial Metrics', icon: TrendingUp },
                { id: 'AUDIT_LOG', label: 'Clinical Audit', icon: ShieldCheck },
                { id: 'SUPPORT', label: 'Help Desk', icon: HelpCircle },
            ]
        }
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
            <header className="fixed top-0 left-0 xl:left-80 right-0 h-24 z-[60] bg-[#0B101B]/95 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-8 md:px-12 transition-all">
                <div className="flex items-center gap-4 xl:hidden">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all h-10 w-10 shrink-0 flex items-center justify-center">
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-start xl:pl-4">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-8">
                            <h1 className="text-xl lg:text-3xl font-black text-white uppercase italic tracking-tight leading-none">COORDINATOR <span className="text-[#14b8a6]">TERMINAL</span></h1>
                        </div>

                        <div className="hidden xl:flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/10 h-10">
                            <div className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/10">PROTOCOL</div>
                            <select
                                value={globalSelectedStudyId}
                                onChange={(e) => setGlobalSelectedStudyId(e.target.value)}
                                className="bg-transparent text-[10px] font-black text-[#14b8a6] uppercase tracking-[0.2em] outline-none cursor-pointer px-4"
                            >
                                <option value="all" className="bg-[#0B101B]">ALL STUDIES</option>
                                {studies.map(s => (
                                    <option key={s.id} value={s.id} className="bg-[#0B101B]">{s.protocol_id || s.id}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-6 border-r border-white/10 pr-8">
                        <div className="flex flex-col items-end text-right">
                            <span className="text-lg md:text-xl font-black text-[#14b8a6] font-mono tracking-tighter tabular-nums leading-none">
                                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
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
                                            {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Clear All</button>}
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
                                                        <div key={notif.id} className="p-5 hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-[#14b8a6]">
                                                            <div className="flex items-start gap-4">
                                                                <div className="p-2 bg-[#14b8a6]/10 rounded-xl">
                                                                    <Bell className="w-4 h-4 text-[#14b8a6]" />
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

                    <button
                        onClick={handleSignOut}
                        className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center h-12 w-12 shrink-0 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
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

            <aside className={`fixed left-0 top-0 bottom-0 w-80 bg-[#0B101B] border-r border-white/5 z-[70] transition-transform duration-300 xl:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}`}>
                <div className="h-24 px-8 flex justify-between items-center border-b border-white/[0.05] shrink-0">
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
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
                    {sidebarGroups.map((group, i) => (
                        <div key={i} className="space-y-2">
                            <p className="px-4 text-[12px] font-bold text-white/40 uppercase tracking-widest">{group.group}</p>
                            <div className="space-y-1.5">
                                {group.items.map((item, j) => (
                                    <button key={j} onClick={() => { if (item.id === 'WEBSITE') window.open('/', '_blank'); else { handleModuleChange(item.id as CCModule); setIsSidebarOpen(false); } }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${activeModule === item.id ? 'bg-[#14b8a6]/20 text-[#14b8a6] border border-[#14b8a6]/30' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>
                                        <item.icon className={`w-5 h-5 ${activeModule === item.id ? 'text-[#14b8a6]' : 'text-slate-500'}`} />
                                        <span className="text-base font-bold text-left flex-1">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 xl:pl-80 pt-32 pb-24 px-12 lg:px-16 overflow-x-hidden bg-[#0F172A] min-h-screen">
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && (
                        <OperationsOversight 
                            studyCount={studies.length} 
                            stats={oversightStats} 
                            currentTime={currentTime} 
                            visits={visits} 
                            onLaunch={() => setActiveModule('LAUNCH_STUDY')} 
                            onNavigate={(id) => setActiveModule(id as CCModule)} 
                        />
                    )}
                    {activeModule === 'STUDIES' && (
                        <StudyDirectory 
                            studies={studies} 
                            onAdd={() => setActiveModule('LAUNCH_STUDY')} 
                            onEdit={(s) => { setSelectedStudy(s); setActiveModule('LAUNCH_STUDY'); }} 
                        />
                    )}
                    {activeModule === 'LAUNCH_STUDY' && (
                        <LaunchStudyForm 
                            onClose={() => { setActiveModule('STUDIES'); setSelectedStudy(null); }} 
                            initialData={selectedStudy} 
                            onSave={handleCreateStudy} 
                            availablePIs={users.filter(u => String(u.role).toUpperCase() === 'PI')}
                            availableCoordinators={users.filter(u => String(u.role).toUpperCase() === 'COORDINATOR')}
                            availableSponsors={sponsorOrganizations} 
                            availableSponsorUsers={users.filter(u => String(u.role).toUpperCase() === 'SPONSOR')} 
                        />
                    )}
                    {activeModule === 'MESSAGES' && <CCC_MessagesModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'SUBJECT_REVIEW' && <CCC_SubjectReviewModule selectedStudyId={globalSelectedStudyId} participantId={selectedParticipantId || 'BTB-023'} />}
                    {activeModule === 'TEAM' && <CCC_TeamModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'PARTICIPANTS' && <ParticipantOversight selectedStudyId={globalSelectedStudyId} onOpenProfile={(id) => { setSelectedParticipantId(id); setActiveModule('SUBJECT_REVIEW'); }} onMessage={() => setActiveModule('MESSAGES')} />}
                    {activeModule === 'FORMS' && <FormsQuestionnairesModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'CONSENT' && <CCConsentModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'VISITS' && <CCC_VisitsAssessmentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'LABS' && <LabsResultsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'KITS' && <StudyKitsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'REPORTS' && <ReportsSignOffModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'STUDY_DOCS' && <StudyDocumentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'MY_DOCS' && <MyDocumentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'ALERTS' && <AlertsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'SUPPORT' && <CCC_HelpSupportModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'AUDIT_LOG' && <AuditLogModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'TASKS' && <StaffTasksModule primaryColor="teal" />}
                    {activeModule === 'PARTICIPANT_TASKS' && <ParticipantTaskManagement primaryColor="teal" selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'COMPENSATION' && <CompensationManagement selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'ANALYTICS' && <AnalyticsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'SPONSORS' && <SponsorsManagement selectedStudyId={globalSelectedStudyId} allUsers={users} allStudies={studies} onRefresh={fetchCoordinatorContent} />}
                </AnimatePresence>
            </main>

            <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={confirmSignOut} />
        </div>
    );
}
