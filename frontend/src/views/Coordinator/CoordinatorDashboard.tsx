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
import CCC_VisitsAssessmentsModule from '../../components/coordinator/CCVisitsAssessmentsModule';
import CCC_HelpSupportModule from '../../components/coordinator/support/SupportEntry';
import CCC_QuestionnaireBuilder from '../../components/coordinator/CCQuestionnaireBuilder';

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


import {
    LayoutDashboard,
    Beaker,
    Calendar,
    DraftingCompass,
    Users,
    ClipboardList,
    ShieldCheck,
    Activity,
    MessageSquare,
    FileText,
    Settings,
    TrendingUp,
    Search,
    Bell,
    ChevronDown,
    Plus,
    X,
    Filter,
    HelpCircle,
    Stethoscope,
    UsersRound,
    Clock,
    ArrowUpRight,
    LogOut,
    Globe,
    Rocket,
    Menu,
    FlaskConical,
    History,
    FileSearch,
    Layers,
    ListFilter,
    CheckSquare,
    ScrollText,
    Settings2,
    Database,
    AlertTriangle,
    FileCheck,
    Briefcase
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
    | 'ANALYTICS';

export default function CoordinatorDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeModule, setActiveModule] = useState<CCModule>(() => {
        const route = location.pathname.split('/').pop();
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
        return 'OVERSIGHT';
    });

    // Sync activeModule when URL changes
    useEffect(() => {
        const route = location.pathname.split('/').pop();
        if (route === 'studies') setActiveModule('STUDIES');
        else if (route === 'team') setActiveModule('TEAM');
        else if (route === 'participants') setActiveModule('PARTICIPANTS');
        else if (route === 'subject-review') setActiveModule('SUBJECT_REVIEW');
        else if (route === 'forms') setActiveModule('FORMS');
        else if (route === 'consent') setActiveModule('CONSENT');
        else if (route === 'visits') setActiveModule('VISITS');
        else if (route === 'labs') setActiveModule('LABS');
        else if (route === 'reports') setActiveModule('REPORTS');
        else if (route === 'study-docs') setActiveModule('STUDY_DOCS');
        else if (route === 'my-docs') setActiveModule('MY_DOCS');
        else if (route === 'messages') setActiveModule('MESSAGES');
        else if (route === 'alerts') setActiveModule('ALERTS');
        else if (route === 'launch-study') setActiveModule('LAUNCH_STUDY');
        else if (route === 'support') setActiveModule('SUPPORT');
        else if (route === 'audit-log') setActiveModule('AUDIT_LOG');
        else if (route === 'analytics') setActiveModule('ANALYTICS');
        else if (route === 'sponsors') setActiveModule('SPONSORS');
        else if (location.pathname.endsWith('/coordinator') || !route || route === 'coordinator') setActiveModule('OVERSIGHT');
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
            'ANALYTICS': 'analytics',
            'SPONSORS': 'sponsors'
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
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
    const [loading, setLoading] = useState(true);
    const [selectedStudy, setSelectedStudy] = useState<any>(null);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

    const [globalSelectedStudyId, setGlobalSelectedStudyId] = useState<string | 'all'>('all');

    const [oversightStats, setOversightStats] = useState({
        upcomingVisits: 12,
        overdueFollowUps: 5,
        awaitingCallback: 8,
        pendingForms: 14,
        hasCriticalAlert: true
    });


    const fetchCoordinatorContent = async () => {
        setLoading(true);
        try {
            const apiUrl = API || '';
            const [studiesRes, usersRes] = await Promise.all([
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/users/`)
            ]);

            if (studiesRes.ok) {
                const data = await studiesRes.json();
                setStudies(data.sort((a: any, b: any) =>
                    (a.id || "").localeCompare(b.id || "")
                ));
            }
            if (usersRes.ok) setUsers(await usersRes.json());
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
            ]
        },
        {
            group: 'COORDINATION',
            items: [
                { id: 'STUDIES', label: 'Study Directory', icon: Beaker },
                { id: 'TEAM', label: 'Medical Team', icon: Users },
                { id: 'PARTICIPANTS', label: 'Participant Management', icon: UsersRound },
                { id: 'SUBJECT_REVIEW', label: 'Screening Review', icon: Activity },
                { id: 'FORMS', label: 'Study Questionnaires', icon: ClipboardList },
                { id: 'CONSENT', label: 'Consent Oversight', icon: ShieldCheck },
                { id: 'VISITS', label: 'Visits & Assessments', icon: Calendar },
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
            <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-20 lg:h-24 z-[60] bg-[#0B101B]/95 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-6 md:px-8">
                <div className="flex items-center gap-4 lg:hidden">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all h-10 w-10 shrink-0">
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <div className="hidden lg:flex flex-col h-full justify-center">
                    <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">COORDINATOR TERMINAL</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden xl:flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                        <div className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/10">PROTOCOL NODE</div>
                        <select
                            value={globalSelectedStudyId}
                            onChange={(e) => setGlobalSelectedStudyId(e.target.value)}
                            className="bg-transparent text-[11px] font-black text-indigo-400 uppercase tracking-widest outline-none cursor-pointer px-4"
                        >
                            <option value="all" className="bg-[#0B101B]">ALL STUDIES</option>
                            {studies.map(s => (
                                <option key={s.id} value={s.id} className="bg-[#0B101B]">{s.protocol_id || s.id}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-5" ref={notificationRef}>
                    <div className="flex flex-col items-end text-right border-r border-white/5 pr-4 md:pr-6">
                        <span className="text-sm md:text-xl font-black text-[#14b8a6] font-mono tracking-tighter tabular-nums leading-none">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 md:mt-1.5">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                        </span>
                    </div>

                    <div className="relative">
                        <NotificationBell 
                            unreadCount={unreadCount}
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        />

                        <AnimatePresence>

                            {isNotificationOpen && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 mt-4 w-80 md:w-96 bg-[#0F172A]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Events</h3>
                                        {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Clear All</button>}
                                    </div>
                                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-0">
                                        {notifications.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <Bell className="w-6 h-6 text-slate-600 mx-auto mb-4" />
                                                <p className="text-xs text-slate-500 uppercase tracking-widest text-pretty">No new alerts recorded</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {notifications.map((notif) => (
                                                    <button key={notif.id} onClick={() => markAsRead(notif.id, notif.link)} className={`w-full p-4 text-left hover:bg-white/5 transition-all flex gap-4 items-start relative ${!notif.is_read ? 'bg-indigo-500/[0.03]' : ''}`}>
                                                        <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${notif.type === 'MESSAGE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                                                            {notif.type === 'MESSAGE' ? <MessageSquare className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <h4 className={`text-xs font-bold uppercase tracking-wide ${!notif.is_read ? 'text-white' : 'text-slate-400'}`}>{notif.title}</h4>
                                                                <span className="text-[9px] text-slate-500 uppercase">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-6 md:h-8 w-px bg-white/10 hidden md:block" />

                    <div className="flex items-center gap-4 relative h-full" ref={profileRef}>
                        <div className="text-right hidden lg:flex flex-col h-full justify-center">
                            <p className="text-[16px] font-black text-white uppercase italic leading-none tracking-tight">{userName}</p>
                            <p className="text-[10px] text-[#14b8a6] font-bold uppercase tracking-[0.2em] mt-2">Clinical Coordinator</p>
                        </div>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 p-0.5 hover:border-[#14b8a6] transition-all active:scale-95 group overflow-hidden shadow-2xl">
                            <div className="w-full h-full rounded-[0.9rem] flex items-center justify-center bg-white/10 group-hover:bg-[#14b8a6]/20 transition-colors">
                                {userPicture ? <img src={userPicture} alt={userName} className="w-full h-full object-cover rounded-[0.9rem]" /> : <span className="text-sm font-black text-white uppercase italic">{userName?.[0] || 'CC'}</span>}
                            </div>
                        </button>
                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-4 w-56 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-100 hover:bg-red-500/20 text-[12px] font-black uppercase tracking-widest">
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
            <AnimatedBackground />
            {renderHeader()}

            <aside className={`fixed left-0 top-0 bottom-0 w-[260px] bg-[#0B101B] border-r border-white/5 z-[70] transition-transform duration-300 lg:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-24 px-8 flex justify-between items-center border-b border-white/[0.05] shrink-0">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="group transition-all">
                        <div className="bg-white p-2 rounded-2xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <img src="/logo.jpg" alt="Logo" className="h-12 w-auto object-contain rounded-xl" />
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
                    {sidebarGroups.map((group, i) => (
                        <div key={i} className="space-y-2">
                            <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">{group.group}</p>
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

            <main className="lg:ml-[260px] pt-32 pb-24 px-8 overflow-x-hidden bg-[#0F172A] min-h-screen">
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && (
                        <OversightModule studyCount={studies.length} stats={oversightStats} currentTime={currentTime} onLaunch={() => setActiveModule('LAUNCH_STUDY')} onNavigate={(id) => setActiveModule(id as CCModule)} />
                    )}
                    {activeModule === 'STUDIES' && (
                        <StudyOverviewModule studies={studies} onAdd={() => setActiveModule('LAUNCH_STUDY')} onEdit={(s) => { setSelectedStudy(s); setActiveModule('LAUNCH_STUDY'); }} />
                    )}
                    {activeModule === 'LAUNCH_STUDY' && (
                        <LaunchStudyForm onClose={() => { setActiveModule('STUDIES'); setSelectedStudy(null); }} initialData={selectedStudy} onSave={handleCreateStudy} availablePIs={users.filter(u => u.role === 'PI')} availableCoordinators={users.filter(u => u.role === 'COORDINATOR')} availableSponsors={users.filter(u => u.role === 'SPONSOR')} />
                    )}
                    {activeModule === 'MESSAGES' && <CCC_MessagesModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'SUBJECT_REVIEW' && <CCC_SubjectReviewModule selectedStudyId={globalSelectedStudyId} participantId={selectedParticipantId || 'BTB-023'} />}
                    {activeModule === 'TEAM' && <CCC_TeamModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'PARTICIPANTS' && <ParticipantOversight selectedStudyId={globalSelectedStudyId} onOpenProfile={(id) => { setSelectedParticipantId(id); setActiveModule('SUBJECT_REVIEW'); }} onMessage={() => setActiveModule('MESSAGES')} />}
                    {activeModule === 'FORMS' && <FormsQuestionnairesModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'CONSENT' && <CCConsentModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'VISITS' && <CCC_VisitsAssessmentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'LABS' && <LabsResultsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'REPORTS' && <ReportsSignOffModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'STUDY_DOCS' && <StudyDocumentsModule selectedStudyId={globalSelectedStudyId} />}

                    {activeModule === 'MY_DOCS' && <MyDocumentsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'ALERTS' && <AlertsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'SUPPORT' && <CCC_HelpSupportModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'AUDIT_LOG' && <AuditLogModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'ANALYTICS' && <AnalyticsModule selectedStudyId={globalSelectedStudyId} />}
                    {activeModule === 'SPONSORS' && <SponsorsManagement selectedStudyId={globalSelectedStudyId} allUsers={users} allStudies={studies} onRefresh={fetchCoordinatorContent} />}
                </AnimatePresence>
            </main>

            <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={confirmSignOut} />
        </div>
    );
}

function OversightModule({ studyCount, stats, currentTime, onLaunch, onNavigate }: { studyCount: number, stats: any, currentTime: Date, onLaunch: () => void, onNavigate: (id: string) => void }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Operations <span className="text-[#14b8a6]">Oversight</span></h2>
                    <div className="flex items-center gap-6 py-2">
                        <span className="text-xl font-black text-[#14b8a6] italic tracking-tighter tabular-nums">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
                        <div className="w-px h-3 bg-white/10" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</span>
                    </div>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.4em] italic">Clinical Research Execution & Velocity</p>
                </div>
                <button onClick={onLaunch} className="px-10 py-5 bg-[#14b8a6] text-white rounded-[2rem] text-[12px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-2xl shadow-teal-900/40 hover:scale-105 transition-all"><Rocket className="w-5 h-5" /> INITIALIZE STUDY</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Live Protocols', val: studyCount.toString().padStart(2, '0'), icon: Beaker, color: 'teal', id: 'STUDIES' },
                    { label: 'Active Subjects', val: '1,240', icon: UsersRound, color: 'indigo', id: 'PARTICIPANTS' },
                    { label: 'System Alerts', val: '02', icon: Activity, color: 'red', id: 'ALERTS' },
                ].map((stat, i) => (
                    <div key={i} onClick={() => onNavigate(stat.id)} className="bg-[#0F172A] border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between min-h-[300px] group hover:bg-[#0B101B] hover:border-[#14b8a6]/40 transition-all cursor-pointer relative overflow-hidden">
                        <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform`}><stat.icon className={`w-8 h-8 text-white`} /></div>
                        <div className="mt-8">
                            <h4 className="text-[15px] font-black text-white/50 uppercase tracking-[0.2em] italic mb-4 group-hover:text-white transition-colors">{stat.label}</h4>
                            <p className="text-3xl font-black text-white italic tracking-tighter leading-none group-hover:text-[#14b8a6] transition-colors">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Upcoming visits', val: stats.upcomingVisits, sub: '60-day window', color: 'indigo', id: 'VISITS' },
                    { label: 'Overdue follow-ups', val: stats.overdueFollowUps, sub: 'Action Required', color: 'red', id: 'ALERTS' },
                    { label: 'Awaiting callback', val: stats.awaitingCallback, sub: 'Leads Node', color: 'emerald', id: 'SPONSORS' },
                    { label: 'Pending forms', val: stats.pendingForms, sub: 'Submissions', color: 'amber', id: 'FORMS' }
                ].map((widget, i) => (
                    <div key={i} onClick={() => onNavigate(widget.id)} className="bg-[#0F172A] border border-white/[0.08] rounded-[2.5rem] p-8 hover:bg-[#0B101B] hover:border-white/20 transition-all cursor-pointer relative group">
                        <h4 className="text-sm font-black text-white/50 uppercase tracking-widest italic group-hover:text-white">{widget.label}</h4>
                        <div className="flex items-end gap-4 mt-6">
                            <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{widget.val}</p>
                            <p className="text-[11px] text-white/40 font-black uppercase tracking-widest mb-2 italic">{widget.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function StudyOverviewModule({ studies, onAdd, onEdit }: { studies: any[], onAdd: () => void, onEdit: (s: any) => void }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter">Study <span className="text-[#14b8a6]">Directory</span></h2>
                    <p className="text-[10px] md:text-[11px] text-slate-500 uppercase tracking-widest font-black mt-2">Managing {studies.length} active research protocols</p>
                </div>
                <button onClick={onAdd} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl"><Plus className="w-4 h-4" /> Setup Protocol</button>
            </div>
            <div className="bg-[#0B101B] border border-white/5 rounded-[3rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/[0.03] border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                            <th className="px-8 py-6">Protocol ID</th>
                            <th className="px-8 py-6">Title & Type</th>
                            <th className="px-8 py-6">Sponsor</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {studies.map((s) => (
                            <tr key={s.id} className="hover:bg-white/[0.02] cursor-pointer group" onClick={() => onEdit(s)}>
                                <td className="px-8 py-6 text-sm font-black text-[#14b8a6] italic">{s.protocol_id}</td>
                                <td className="px-8 py-6">
                                    <p className="text-sm font-black text-white uppercase tracking-widest group-hover:text-[#14b8a6]">{s.title}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{s.study_type}</p>
                                </td>
                                <td className="px-8 py-6 text-sm font-black text-slate-400 uppercase">{s.sponsor_name || 'Internal'}</td>
                                <td className="px-8 py-6"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}>{s.status}</span></td>
                                <td className="px-8 py-6 text-right text-slate-500 group-hover:text-white transition-colors"><ChevronDown className="w-5 h-5 ml-auto -rotate-90" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
