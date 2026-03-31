import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, clearToken, getRole, performLogout, getUser, getDisplayName, API } from '../utils/auth';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import SubmitContentForms from '../components/admin/SubmitContentForms';
import LaunchStudyForm from '../components/admin/LaunchStudyForm';
import SponsorsManagement from '../components/admin/SponsorsManagement';
import PIMessagesModule from '../components/pi/PIMessagesModule';
import PISubjectReviewModule from '../components/pi/PISubjectReviewModule';
import PITeamModule from '../components/pi/PITeamModule';
import PIVisitsAssessmentsModule from '../components/pi/PIVisitsAssessmentsModule';
import PIHelpSupportModule from '../components/pi/PIHelpSupportModule';
import QuestionnaireBuilder from '../components/pi/QuestionnaireBuilder';

// New PI Panel Modules
import ParticipantOversight from '../components/pi/panels/ParticipantOversight';
import FormsQuestionnairesModule from '../components/pi/panels/FormsQuestionnairesModule';
import PIConsentModule from '../components/pi/PIConsentModule';
import LabsResultsModule from '../components/pi/panels/LabsResultsModule';
import ReportsSignOffModule from '../components/pi/panels/ReportsSignOffModule';
import StudyDocumentsModule from '../components/pi/panels/StudyDocumentsModule';
import MyDocumentsModule from '../components/pi/panels/MyDocumentsModule';
import AlertsModule from '../components/pi/panels/AlertsModule';
import AuditLogModule from '../components/pi/panels/AuditLogModule';
import AnalyticsModule from '../components/pi/panels/AnalyticsModule';
import AnimatedBackground from '../components/AnimatedBackground';


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
    FileCheck
} from 'lucide-react';

type PIModule =
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

export default function PIDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeModule, setActiveModule] = useState<PIModule>(() => {
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

    // Sync activeModule when URL changes (for browser back button support)
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
        else if (location.pathname.endsWith('/pi') || !route || route === 'pi') setActiveModule('OVERSIGHT');
    }, [location.pathname]);

    const handleModuleChange = (mod: PIModule) => {
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
        navigate(`/dashboard/pi${slug ? '/' + slug : ''}`);
    };
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const user = getUser();
        const role = getRole();

        const allowedRoles = ['PI', 'COORDINATOR', 'ONSITE'];
        if (!user || !allowedRoles.includes(role)) {
            console.warn("Unauthorized access to PI Dashboard. Redirecting...");
            navigate('/signin');
        }
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Dynamic state for Operational Widgets
    // IMPORTANT: upcomingVisits should fetch data for a 2-month rolling window (60 days)
    const [oversightStats, setOversightStats] = useState({
        upcomingVisits: 12,
        overdueFollowUps: 5,
        awaitingCallback: 8,
        pendingForms: 14,
        hasCriticalAlert: true
    });

    useEffect(() => {
        const handleNav = () => handleModuleChange('PARTICIPANTS');
        window.addEventListener('nav-to-participants', handleNav);
        return () => window.removeEventListener('nav-to-participants', handleNav);
    }, []);

    const fetchPIContent = async () => {
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
            console.error("PI Data Fetch Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPIContent();
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
                fetchPIContent();
            } else {
                const err = await res.json();
                console.error("Study Save Failed:", err);
                alert(`Operation failed: ${JSON.stringify(err)}`);
            }
        } catch (e) {
            alert("Operation failed due to network error");
        }
    };



    const sidebarGroups = [
        {
            group: 'GENERAL',
            items: [
                { id: 'WEBSITE', label: 'Main Website', icon: Globe },
                { id: 'OVERSIGHT', label: 'Dashboard', icon: LayoutDashboard },
            ]
        },
        {
            group: 'RESEARCH MANAGEMENT',
            items: [
                { id: 'STUDIES', label: 'My Studies', icon: Beaker },
                { id: 'TEAM', label: 'My Team', icon: Users },
                { id: 'PARTICIPANTS', label: 'Participant Oversight', icon: UsersRound },
                { id: 'SUBJECT_REVIEW', label: 'Subject Review', icon: Activity },
                { id: 'FORMS', label: 'Forms & Questionnaires', icon: ClipboardList },
                { id: 'CONSENT', label: 'Consent Oversight', icon: ShieldCheck },
                { id: 'VISITS', label: 'Visits & Assessments', icon: Calendar },
            ]
        },
        {
            group: 'DOCUMENTS & COMMS',
            items: [
                { id: 'STUDY_DOCS', label: 'Study Documents', icon: FileText },
                { id: 'MY_DOCS', label: 'My Documents', icon: Settings2 },
                { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
                { id: 'ALERTS', label: 'Alerts', icon: Bell, hasNotify: true },
            ]
        },
        {
            group: 'RESOURCES',
            items: [
                { id: 'LAUNCH_STUDY', label: 'Launch a Study', icon: Rocket },
                { id: 'SUPPORT', label: 'Help / Support', icon: HelpCircle },
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
            <header className="fixed top-0 lg:left-72 left-0 right-0 h-16 md:h-18 lg:h-24 z-[60] bg-[#0B101B]/95 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-6 md:px-8">

                <div className="flex items-center gap-4 lg:gap-7 lg:hidden">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="flex items-center group transition-all hover:scale-105 active:scale-95">
                        <div className="h-10 px-4 rounded-full bg-white flex items-center justify-center shadow-lg group/logo overflow-hidden">
                            <img src="/logo.jpg" alt="MusB Research" className="h-6 w-auto object-contain" />
                        </div>
                    </Link>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex items-center justify-center h-10 w-10 hover:bg-white/10 shrink-0"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                <div className="hidden lg:flex flex-col">
                    <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">PI DASHBOARD</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 font-mono">RESEARCH TERMINAL</span>
                    </div>
                </div>



                <div className="flex items-center gap-4 h-10 md:h-14">
                    <button 
                        onClick={() => handleModuleChange('ALERTS')}
                        className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-slate-300 hover:text-white shrink-0 relative group shadow-lg active:scale-90"
                    >
                        <Bell className="w-4 h-4 md:w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,1)]" />
                    </button>

                    <div className="h-6 md:h-8 w-px bg-white/10 hidden md:block" />


                    <div className="flex items-center gap-4 relative" ref={profileRef}>
                        <div className="text-right hidden lg:block">
                            <p className="text-[16px] font-black text-white uppercase italic leading-none tracking-tight">{userName}</p>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-2">Principal Investigator</p>
                        </div>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 p-0.5 hover:border-indigo-600 transition-all active:scale-95 group overflow-hidden shadow-2xl"
                        >
                            <div className="w-full h-full rounded-[0.9rem] flex items-center justify-center bg-white/10 group-hover:bg-indigo-600/20 transition-colors">
                                {userPicture ? (
                                    <img src={userPicture} alt={userName} className="w-full h-full object-cover rounded-[0.9rem]" />
                                ) : (
                                    <span className="text-sm font-black text-white uppercase italic">
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
                                        <p className="text-xs font-bold text-white truncate">{userName}</p>
                                        <p className="text-[9px] text-slate-500 truncate">{getUser()?.email}</p>
                                    </div>
                                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-100 hover:text-white hover:bg-red-500/20 transition-all text-[12px] font-black uppercase tracking-widest">
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

            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[55] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-0 bottom-0 w-72 bg-[#0B101B] border-r border-white/5 z-[70] transition-transform duration-300 lg:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-20 md:h-28 flex items-center px-10 border-b border-white/5">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="group">
                        <div className="bg-white p-2.5 rounded-2xl group-hover:scale-105 transition-transform inline-block shadow-2xl">
                            <img src="/logo.jpg" alt="Logo" className="h-6 md:h-8 w-auto object-contain" />
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-10 md:space-y-12 custom-scrollbar">
                    {sidebarGroups.map((group, i) => (
                        <div key={i} className="space-y-4 md:space-y-6">
                            <p className="px-4 text-[11px] font-black text-white/50 uppercase tracking-[0.3em] font-mono">{group.group}</p>
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
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative ${activeModule === item.id
                                            ? 'bg-indigo-600/20 text-white border-l-[3px] border-indigo-500 shadow-lg shadow-indigo-900/10'
                                            : 'text-[#8b8fa8] hover:bg-white/[0.02] hover:text-white'
                                            }`}
                                    >
                                        <div className="w-8 flex items-center justify-center flex-shrink-0">
                                            <item.icon className={`w-5 h-5 ${activeModule === item.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-white'}`} />
                                        </div>
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-left flex-1 italic leading-tight">{item.label}</span>
                                        {item.hasNotify && (
                                            <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.6)]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="mt-auto p-4 border-t border-white/5 space-y-2">
                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[#8b8fa8] hover:bg-red-500/10 hover:text-red-400 transition-all group">
                        <div className="w-8 flex items-center justify-center flex-shrink-0">
                            <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-widest italic">Terminate Session</span>
                    </button>
                </div>
            </aside>


            <main className="lg:ml-72 pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-24 px-4 md:px-8 overflow-x-hidden bg-[#0F172A] min-h-screen">
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && (
                        <OversightModule 
                            studyCount={studies.length} 
                            stats={oversightStats}
                            onLaunch={() => setActiveModule('LAUNCH_STUDY')} 
                            onNavigate={(id) => setActiveModule(id as PIModule)} 
                        />
                    )}
                    {activeModule === 'STUDIES' && (
                        <StudyOverviewModule
                            studies={studies}
                            onAdd={() => setActiveModule('LAUNCH_STUDY')}
                            onEdit={(s) => {
                                setSelectedStudy(s);
                                setActiveModule('LAUNCH_STUDY');
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
                            availablePIs={users.filter(u => u.role === 'PI')}
                            availableCoordinators={users.filter(u => u.role === 'COORDINATOR')}
                            availableSponsors={users.filter(u => u.role === 'SPONSOR')}
                        />
                    )}
                    {activeModule === 'MESSAGES' && <PIMessagesModule />}
                    {activeModule === 'SUBJECT_REVIEW' && <PISubjectReviewModule participantId={selectedParticipantId || 'BTB-023'} />}
                    {activeModule === 'TEAM' && <PITeamModule />}
                    {activeModule === 'PARTICIPANTS' && <ParticipantOversight
                        onOpenProfile={(id) => {
                            setSelectedParticipantId(id);
                            setActiveModule('SUBJECT_REVIEW');
                        }}
                        onMessage={() => {
                            setActiveModule('MESSAGES');
                        }}
                    />}
                    {activeModule === 'FORMS' && <FormsQuestionnairesModule />}
                    {activeModule === 'CONSENT' && <PIConsentModule />}
                    {activeModule === 'VISITS' && <PIVisitsAssessmentsModule />}
                    {activeModule === 'LABS' && <LabsResultsModule />}
                    {activeModule === 'REPORTS' && <ReportsSignOffModule />}
                    {activeModule === 'STUDY_DOCS' && <StudyDocumentsModule />}
                    {activeModule === 'MY_DOCS' && <MyDocumentsModule />}
                    {activeModule === 'ALERTS' && <AlertsModule />}
                    {activeModule === 'SUPPORT' && <PIHelpSupportModule />}
                    {activeModule === 'AUDIT_LOG' && <AuditLogModule />}
                    {activeModule === 'ANALYTICS' && <AnalyticsModule />}
                    {activeModule === 'SPONSORS' && (
                        <SponsorsManagement
                            allUsers={users}
                            allStudies={studies}
                            onRefresh={fetchPIContent}
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

function OversightModule({ studyCount, stats, onLaunch, onNavigate }: { studyCount: number, stats: any, onLaunch: () => void, onNavigate: (id: string) => void }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 md:space-y-5">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white italic uppercase tracking-tighter line-clamp-2 leading-none">
                        Scientific <span className="text-indigo-400">Oversight</span>
                    </h2>
                    <p className="text-[11px] md:text-[14px] lg:text-[18px] text-white/50 font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] mt-4 md:mt-6 italic">
                        Portfolio Performance & clinical research velocity
                    </p>
                </div>
                <button
                    onClick={onLaunch}
                    className="w-full md:w-auto px-6 md:px-10 py-4 md:py-5 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] text-[10px] md:text-[12px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 shadow-2xl shadow-indigo-900/40 hover:scale-[1.05] active:scale-95 transition-all font-mono"
                >
                    <Rocket className="w-5 h-5" /> LAUNCH A STUDY
                </button>
            </div>

            {/* Row 1 - KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
                {[
                    { label: 'Active Protocols', val: studyCount.toString().padStart(2, '0'), icon: Beaker, color: 'indigo' },
                    { label: 'Total Subjects', val: '1,240', icon: UsersRound, color: 'emerald' },
                    { label: 'Critical Alerts', val: '02', icon: Activity, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#0F172A] border border-white/10 rounded-2xl md:rounded-[3rem] p-5 md:p-10 flex flex-col justify-between min-h-[180px] md:min-h-[300px] group hover:bg-[#0B101B] hover:border-indigo-500/40 transition-all duration-500 shadow-2xl shadow-black/60 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
                        <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10`}>
                            <stat.icon className={`w-5 h-5 md:w-8 md:h-8 text-${stat.color}-400`} />
                        </div>
                        <div className="mt-3 md:mt-8 relative z-10">
                            <h4 className="text-[10px] md:text-[15px] font-black text-white/50 uppercase tracking-[0.1em] md:tracking-[0.2em] italic mb-1 md:mb-4 group-hover:text-white transition-colors uppercase">{stat.label}</h4>
                            <p className="text-2xl md:text-4xl lg:text-5xl font-black text-white italic tracking-tighter leading-none group-hover:text-indigo-400 transition-colors uppercase">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Upcoming visits', val: stats.upcomingVisits.toString().padStart(2, '0'), sub: 'this 60 days', color: 'indigo', action: () => onNavigate('VISITS') },
                    { label: 'Overdue follow-ups', val: stats.overdueFollowUps.toString().padStart(2, '0'), sub: 'Urgent Action', color: 'red', alert: stats.hasCriticalAlert },
                    { label: 'Awaiting callback', val: stats.awaitingCallback.toString().padStart(2, '0'), sub: 'Participant leads', color: 'emerald' },
                    { label: 'Pending forms', val: stats.pendingForms.toString().padStart(2, '0'), sub: 'Completion required', color: 'amber' }
                ].map((widget, i) => (
                    <div key={i} onClick={widget.action} className="bg-[#0F172A] border border-white/[0.08] rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 hover:bg-[#0B101B] hover:border-white/20 transition-all duration-500 cursor-pointer relative overflow-hidden group shadow-2xl shadow-black/40">
                        {widget.alert && <div className="absolute top-4 right-4 md:top-6 md:right-6 w-2.5 h-2.5 md:w-3 h-3 bg-red-500 rounded-full animate-ping shadow-[0_0_15px_rgba(239,68,68,0.5)]" />}
                        <h4 className="text-[11px] md:text-sm font-black text-white/50 uppercase tracking-widest italic group-hover:text-white transition-colors">{widget.label}</h4>
                        <div className="flex items-end gap-3 md:gap-4 mt-3 md:mt-6">
                            <p className={`text-2xl md:text-4xl font-black text-${widget.color}-400 italic tracking-tighter leading-none group-hover:scale-105 transition-transform origin-left uppercase`}>{widget.val}</p>
                            <p className="text-[9px] md:text-[11px] text-white/40 font-black uppercase tracking-widest mb-1 md:mb-2 italic">{widget.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 3 — Calendar Widget Placeholder */}
            <div className="bg-[#0B101B] border border-white/10 rounded-2xl md:rounded-[3rem] p-5 md:p-10 space-y-5 md:space-y-8 shadow-2xl shadow-black/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <h3 className="text-xs md:text-xl font-black text-white italic uppercase tracking-widest">Active Schedule <span className="text-indigo-400">Calendar</span></h3>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {['Confirmed', 'Pending', 'Overdue'].map((label, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-white/5 rounded-full border border-white/5">
                                <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                <span className="text-[7px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto pb-6 custom-scrollbar-horizontal -mx-2 px-2 snap-x">
                    <div className="grid grid-cols-7 gap-2 md:gap-4 min-w-[700px] lg:min-w-0 md:min-h-[300px]">
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                            <div key={i} className="space-y-4">
                                <div className="text-center py-2 bg-white/5 border border-white/5 rounded-xl text-[11px] font-black text-white/50 uppercase tracking-widest">{day}</div>
                                {i === 1 && (
                                    <div className="p-2.5 md:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl md:rounded-2xl space-y-1 md:space-y-2 snap-center">
                                        <p className="text-[10px] md:text-[13px] font-black text-emerald-400 uppercase leading-tight">BTB-021</p>
                                        <p className="text-[8px] md:text-[11px] text-white/40 font-bold uppercase tracking-widest">Visit 3 @ 10:00</p>
                                    </div>
                                )}
                                {i === 3 && (
                                    <div className="p-2.5 md:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl md:rounded-2xl space-y-1 md:space-y-2 snap-center">
                                        <p className="text-[10px] md:text-[13px] font-black text-amber-400 uppercase leading-tight">MHC-104</p>
                                        <p className="text-[8px] md:text-[11px] text-white/40 font-bold uppercase tracking-widest">Screening @ 14:00</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 4 — Quick Access Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Alert Center', sub: '02 New Notifications', icon: Bell, id: 'ALERTS' },
                    { label: 'Messaging Node', sub: '05 Unread Messages', icon: MessageSquare, id: 'MESSAGES' },
                    { label: 'Study Archive', sub: '12 Recent Uploads', icon: FileText, id: 'STUDY_DOCS' },
                    { label: 'Verified Docs', sub: '01 Expiry Warning', icon: ShieldCheck, id: 'MY_DOCS' }
                ].map((card, i) => (
                    <button key={i} onClick={() => onNavigate(card.id)} className="bg-[#111827] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 hover:bg-[#0B101B] hover:border-indigo-500/30 transition-all duration-300 text-left flex flex-col justify-between h-[150px] md:h-[200px] group shadow-xl shadow-black/30 relative overflow-hidden">
                        <card.icon className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <div>
                            <h4 className="text-base md:text-lg font-black text-white italic uppercase tracking-tighter leading-none">{card.label}</h4>
                            <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 md:mt-3">{card.sub}</p>
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

function StudyOverviewModule({ studies, onAdd, onEdit }: { studies: any[], onAdd: () => void, onEdit: (s: any) => void }) {
    const [filter, setFilter] = useState('ALL');

    const categories = [
        { id: 'ALL', label: 'Total Assigned Studies', subtext: '(Include all)', count: studies.length, icon: Layers },
        { id: 'ACTIVE', label: 'Active Studies', subtext: '(include only active)', count: studies.filter(s => s.status === 'Active').length, icon: Activity },
        { id: 'RECRUITING', label: 'Recruiting Studies', subtext: '(include only that are recruiting)', count: studies.filter(s => s.status === 'Recruiting').length, icon: UsersRound },
        { id: 'ANALYSIS', label: 'Studies in Analysis', subtext: '(include that completed recruitment)', count: studies.filter(s => s.status === 'Analysis').length, icon: TrendingUp },
        { id: 'COMPLETED', label: 'Studies Completed', subtext: '(Include that are completed)', count: studies.filter(s => s.status === 'Completed').length, icon: CheckSquare },
        { id: 'PAUSED', label: 'Studies Paused', subtext: '(include that are paused)', count: studies.filter(s => s.status === 'Paused').length, icon: Settings2 },
    ];

    const filteredStudies = filter === 'ALL' ? studies : studies.filter(s => s.status.toUpperCase() === filter);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Research <span className="text-indigo-400">Portfolio</span></h2>
                <button onClick={onAdd} className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[12.5px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all">
                    <Rocket className="w-4 h-4" /> LAUNCH A STUDY
                </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`p-8 rounded-[2.5rem] border transition-all duration-300 text-left flex flex-col justify-between h-[180px] group ${filter === cat.id
                            ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50'
                            : 'bg-[#0B101B]/60 backdrop-blur-md border-white/5 hover:bg-[#0B101B] hover:border-white/10 shadow-lg shadow-black/30'}`}
                    >
                        <cat.icon className={`w-8 h-8 ${filter === cat.id ? 'text-white' : 'text-indigo-400 group-hover:scale-110 transition-transform'}`} />
                        <div>
                            <p className={`text-5xl font-black italic tracking-tighter leading-none ${filter === cat.id ? 'text-white' : 'text-white'}`}>{cat.count.toString().padStart(2, '0')}</p>
                            <p className={`text-[11px] font-black uppercase tracking-widest mt-2 ${filter === cat.id ? 'text-indigo-200' : 'text-slate-500 font-bold'}`}>{cat.label}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 italic ${filter === cat.id ? 'text-indigo-300/80' : 'text-slate-600'}`}>{cat.subtext}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                {filteredStudies.length === 0 ? (
                    <div className="col-span-2 py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem] text-center">
                        <p className="text-slate-500 font-bold uppercase tracking-widest italic">No matching protocols in this matrix</p>
                    </div>
                ) : filteredStudies.map((study, i) => (
                    <div key={i} className="bg-[#0B101B]/60 backdrop-blur-md border border-white/5 rounded-[3rem] p-10 space-y-8 relative group hover:bg-[#0B101B] hover:border-indigo-500/30 transition-all duration-300 shadow-2xl shadow-black/50">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Beaker className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-5 py-2 rounded-full text-[12px] font-black uppercase tracking-widest border ${study.status === 'Active' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                    study.status === 'Recruiting' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-white/5 text-slate-500 border-white/10'
                                    }`}>{study.status}</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter truncate leading-tight group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{study.title}</h3>
                            <p className="text-[14px] text-white/40 font-black uppercase tracking-widest mt-2 italic">Protocol #{study.protocol_id || '---'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</p>
                                <p className="text-3xl font-black text-white italic mt-1.5">{study.actual_screened || '0'}<span className="text-[14px] text-slate-500 ml-1">/{study.target_screened || '100'}</span></p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</p>
                                <p className="text-3xl font-black text-white italic mt-1.5">{study.completed_count || '0'}<span className="text-[14px] text-slate-500 ml-1">/{study.total_required || '90'}</span></p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Next Milestone</p>
                            <p className="text-[15px] font-black text-white italic mt-2 uppercase tracking-tight">{study.next_milestone || "Recruitment Closing"}</p>
                        </div>
                        <button
                            onClick={() => onEdit(study)}
                            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-slate-950 transition-all shadow-lg"
                        >
                            Configure Protocol Matrix
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function ComplianceModule() {
    const user = getUser() || {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                    Compliance <span className="text-indigo-400">& Credentials</span>
                </h2>
                <p className="text-[13px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-3 italic">
                    Verified professional documentation and node synchronization
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-1000" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {[
                        { id: 'medical_licence', label: 'Medical Licence', path: user.medical_licence, desc: 'Official state-issued medical practice authorization' },
                        { id: 'insurance_certificate', label: 'Professional Insurance', path: user.insurance_certificate, desc: 'Coverage for clinical trial liability and oversight' },
                        { id: 'cv_document', label: 'Curriculum Vitae', path: user.cv_document, desc: 'Up-to-date professional history and research experience' }
                    ].map((doc, i) => (
                        <div key={i} className="bg-[#0B101B]/60 border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-indigo-500/30 transition-all flex flex-col">
                            <div className="flex justify-between items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                {doc.path ? (
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]" />
                                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Pending</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white italic uppercase tracking-widest">{doc.label}</h4>
                                <p className="text-[12px] text-slate-500 font-bold mt-2 leading-relaxed italic">{doc.desc}</p>
                            </div>
                            <div className="mt-4 pt-6 border-t border-white/5">
                                {doc.path ? (
                                    <a
                                        href={`${API}/media/${doc.path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-slate-950 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/link"
                                    >
                                        <Globe className="w-4 h-4 group-hover/link:rotate-12 transition-transform" /> VIEW DOCUMENT
                                    </a>
                                ) : (
                                    <button className="w-full py-4 bg-amber-500/5 text-amber-500 border border-amber-500/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] opacity-50 cursor-not-allowed">
                                        UPLOAD REQUIRED
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12 p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-white uppercase italic tracking-widest">Authorization Status</p>
                        <p className="text-[12px] text-indigo-300/60 font-black uppercase tracking-widest mt-1">Global Scientific Network Verification</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest line-clamp-1 italic">Synchronization Complete</span>
                </div>
            </div>
        </motion.div>
    );
}
