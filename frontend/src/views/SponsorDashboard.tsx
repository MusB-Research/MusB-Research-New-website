import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Beaker,
    TrendingUp,
    Users,
    PieChart,
    FlaskConical,
    ShieldAlert,
    BarChart,
    FileText,
    MessageSquare,
    Bell,
    Settings,
    Activity,
    ChevronRight,
    ArrowUpRight,
    Search,
    Download,
    CheckCircle2,
    ClipboardList,
    Globe,
    Plus,
    ExternalLink,
    Shield,
    Users2,
    ArrowRight,
    LogOut,
    Mail,
    ShieldCheck,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import { clearToken, getToken, getUser, authFetch, getRole, performLogout } from '../utils/auth';
import InquireStudyModal from '../components/InquireStudyModal';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';

type SponsorModule = 'DASHBOARD' | 'STUDIES' | 'RECRUITMENT' | 'DATA' | 'ARMS' | 'LAB' | 'SAFETY' | 'REPORTS' | 'DOCS' | 'MESSAGES';

const BackgroundAnimation = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

        {/* Dynamic Tech Grid - Blue Tint */}
        <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
                backgroundImage: `linear-gradient(rgba(37,99,235,0.08) 1.5px, transparent 1.5px), 
                                 linear-gradient(90deg, rgba(37,99,235,0.08) 1.5px, transparent 1.5px)`,
                backgroundSize: '100px 100px',
                maskImage: 'radial-gradient(ellipse at 50% 50%, black 10%, transparent 90%)'
            }}
        />

        {/* Primary Deep Blue Nebula */}
        <motion.div
            animate={{
                x: [-20, 40, -20],
                y: [-30, 30, -30],
                scale: [1, 1.2, 1],
                rotate: [0, 15, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-15%] w-[80%] h-[80%] rounded-full bg-blue-900/20 blur-[130px] will-change-transform"
        />

        {/* Secondary Electric Blue Nebula */}
        <motion.div
            animate={{
                x: [40, -10, 40],
                y: [30, -20, 30],
                scale: [1.2, 1, 1.2],
                rotate: [0, -10, 0]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-10%] w-[75%] h-[75%] rounded-full bg-blue-600/10 blur-[110px] will-change-transform"
        />

        {/* Floating Data Pulses (Enhanced) */}
        {[...Array(6)].map((_, i) => (
            <motion.div
                key={`pulse-${i}`}
                initial={{
                    x: Math.random() * 100 + "%",
                    y: "110%",
                }}
                animate={{
                    y: "-10%",
                    opacity: [0, 0.3, 0],
                }}
                transition={{
                    duration: 15 + Math.random() * 20,
                    repeat: Infinity,
                    delay: Math.random() * 10,
                    ease: "easeInOut"
                }}
                className="absolute w-[2px] h-[60px] bg-gradient-to-t from-transparent via-blue-400 to-transparent will-change-transform"
            />
        ))}

        {/* Scanning Light Sweep - Deep Blue Version */}
        <motion.div
            animate={{ y: ['-50%', '250%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-[30vh] bg-gradient-to-b from-transparent via-blue-500/[0.04] to-transparent opacity-40 skew-y-12 will-change-transform"
        />
    </div>
);

export default function SponsorDashboard() {
    const [activeModule, setActiveModule] = useState<SponsorModule>('DASHBOARD');
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isInquireModalOpen, setIsInquireModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'MANAGER', scope: 'ALL', study_ids: [] as string[] });

    // API Data State
    const [studies, setStudies] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const profileRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        const role = getRole();

        if (!user || role !== 'SPONSOR') {
            console.warn("Unauthorized access to Sponsor Dashboard. Redirecting...");
            navigate('/signin');
        }
    }, [navigate]);

    // Intelligence Metrics Calculations
    const last7Days = participants.filter(p => {
        const created = new Date(p.created_at);
        const now = new Date();
        return (now.getTime() - created.getTime()) / (1000 * 3600 * 24) <= 7;
    });

    const avgDaily = (last7Days.length / 7).toFixed(1);
    
    const totalTarget = studies.reduce((acc, s) => acc + (s.target_randomized || 100), 0);
    const goalPct = totalTarget > 0 ? Math.round((participants.length / totalTarget) * 100) : 0;
    
    const activeParticipants = participants.filter(p => p.status !== 'DROPPED' && p.status !== 'INELIGIBLE');
    const retentionRating = participants.length > 0 ? ((activeParticipants.length / participants.length) * 100).toFixed(1) : "100";
    
    const velocity = participants.length > 0 ? ((last7Days.length / participants.length) * 100).toFixed(1) : "0";

    const fetchSponsorData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            const [studiesRes, participantsRes, teamRes] = await Promise.all([
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/participants/`),
                authFetch(`${apiUrl}/api/auth/list-team-members/`)
            ]);

            if (studiesRes.ok) setStudies(await studiesRes.json());
            if (participantsRes.ok) setParticipants(await participantsRes.json());
            if (teamRes.ok) setTeamMembers(await teamRes.json());

        } catch (e) {
            console.error("Sponsor Data Fetch Failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (studyId?: string) => {
        let targets = participants;
        let filename = "all_studies";

        if (studyId) {
            targets = participants.filter(p => p.study === studyId);
            const study = studies.find(s => s.id === studyId);
            filename = study?.protocol_id || "study_export";
        }

        // Prepare CSV Content
        const headers = ["Protocol ID", "Study Title", "Participant SID", "Status", "Gender", "Age", "Enrollment Date"];
        const rows = targets.map(p => {
            const study = studies.find(s => s.id === p.study);
            return [
                study?.protocol_id || "N/A",
                study?.title || "Unknown",
                p.participant_sid,
                p.status,
                p.gender || "N/A",
                p.age || "N/A",
                new Date(p.created_at).toLocaleDateString()
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `musb_${filename}_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportModalOpen(false);
    };

    useEffect(() => {
        fetchSponsorData();
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsTabDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = async () => {
        await performLogout();
    };

    const handleInviteMember = async () => {
        try {
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/auth/invite-team-member/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...inviteForm,
                    admin_email: user.email,
                    organization: user.organization || "MusB Research Partner"
                })
            });
            if (res.ok) {
                setIsInviteModalOpen(false);
                setInviteForm({ email: '', role: 'MANAGER', scope: 'ALL', study_ids: [] });
                // Success feedback can be added here
            }
        } catch (e) {
            console.error("Invite Failed", e);
        }
    };

    const renderHeader = () => {
        const userStr = localStorage.getItem('user');
        let userName = 'Sponsor Partner';
        let organization = '';
        try {
            if (userStr) {
                const u = JSON.parse(userStr);
                const rawName = u.full_name || "Sponsor Partner";
                userName = (rawName.startsWith('gAAAA') && rawName.length > 40) ? "Sponsor Admin" : rawName;
                const rawOrg = u.organization;
                organization = (rawOrg && rawOrg.startsWith('gAAAA') && rawOrg.length > 40) ? "" : rawOrg;
            }
        } catch (e) { }

        const displayName = organization || userName;

        return (
            <header className="fixed top-0 left-0 lg:left-[280px] right-0 h-20 z-40 flex items-center justify-between lg:justify-end px-4 sm:px-8 lg:px-12 pointer-events-none border-b border-white/[0.02]">
                <div className="flex items-center gap-4 sm:gap-8 pointer-events-auto bg-black/20 backdrop-blur-3xl px-4 sm:px-6 py-2 rounded-2xl border border-white/5 shadow-2xl">
                    <button className="hidden sm:block p-2.5 bg-white/[0.03] rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/[0.08] relative group">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-[#05080f] group-hover:scale-110 transition-transform"></span>
                    </button>

                    <div className="flex items-center gap-3 sm:gap-5 group" ref={profileRef}>
                        <div className="text-right flex flex-col justify-center max-w-[120px] sm:max-w-[180px]">
                            <p className="text-[10px] sm:text-[11px] font-black text-white uppercase italic tracking-tighter leading-tight truncate">
                                {displayName}
                            </p>
                            <p className="text-[7px] sm:text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Sponsor Portal</p>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden hover:border-cyan-500/50 transition-all active:scale-95 shadow-lg group-hover:bg-slate-800"
                            >
                                <Users2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            </button>
                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-[#0d1424] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden backdrop-blur-3xl shadow-cyan-500/5"
                                    >
                                        <div className="px-4 py-4 border-b border-white/5 mb-2 bg-white/[0.02] rounded-xl">
                                            <p className="text-[10px] font-black text-white truncate uppercase italic">{userName}</p>
                                            <p className="text-[8px] text-slate-500 truncate mt-1.5 uppercase tracking-widest font-bold">Authorized Sponsor</p>
                                        </div>
                                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest">
                                            <Settings className="w-4 h-4" /> Account Config
                                        </button>
                                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-100 hover:text-white hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest mt-1">
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>
        );
    };

    const navItems = [
        { id: 'WEBSITE', label: 'MAIN WEBSITE', icon: Globe },
        { id: 'DASHBOARD', label: 'DASHBOARD (OVERVIEW)', icon: LayoutDashboard },
        { id: 'STUDIES', label: 'OUR STUDIES', icon: Beaker },
        { id: 'RECRUITMENT', label: 'RECRUITMENT PROGRESS', icon: TrendingUp },
        { id: 'DATA', label: 'PARTICIPANT DATA', icon: Users },
        { id: 'ARMS', label: 'INTERVENTION / ARM VIEW', icon: PieChart },
        { id: 'LAB', label: 'LAB & SAMPLE DATA', icon: FlaskConical },
        { id: 'SAFETY', label: 'SAFETY (AE/SAE)', icon: ShieldAlert },
        { id: 'REPORTS', label: 'REPORTS & CLAIMS', icon: BarChart },
        { id: 'DOCS', label: 'DOCUMENTS', icon: FileText },
        { id: 'MESSAGES', label: 'MESSAGES', icon: MessageSquare },
    ];

    const renderSidebar = () => (
        <>
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-0 bottom-0 w-[280px] bg-[#050b18] border-r border-blue-500/10 z-[60] flex flex-col overflow-hidden transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-10 pb-12 flex justify-between items-center lg:justify-center">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="flex items-center group">
                        <div className="h-10 px-5 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            <img src="/logo.jpg" alt="MusB Research" className="h-6 w-auto object-contain" />
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 text-slate-500 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-6 space-y-1.5 py-4 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'WEBSITE') window.open('/', '_blank');
                                else {
                                    // Map Sidebar Modules to active content blocks
                                    const moduleToTab: Record<string, string> = {
                                        'DASHBOARD': 'OVERVIEW',
                                        'STUDIES': 'STUDIES',
                                        'RECRUITMENT': 'OVERVIEW',
                                        'DATA': 'PARTICIPANTS',
                                        'TEAM': 'TEAM',
                                        'SAFETY': 'SAFETY',
                                        'DOCS': 'DOCS',
                                        'REPORTS': 'REPORTS'
                                    };
                                    
                                    setActiveModule('DASHBOARD'); // Keep the main wrapper open
                                    if (moduleToTab[item.id]) {
                                        setActiveTab(moduleToTab[item.id]);
                                    }
                                    
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 transition-all group relative ${activeModule === item.id
                                ? 'text-blue-400 bg-blue-500/5'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                                }`}
                        >
                            {activeModule === item.id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_#3b82f6]"
                                />
                            )}
                            <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeModule === item.id ? 'text-blue-400' : 'text-slate-600 group-hover:text-blue-400/60'}`} />
                            <span className={`text-[13px] font-bold uppercase tracking-tight transition-all ${activeModule === item.id ? 'opacity-100 ml-1' : 'opacity-60 group-hover:opacity-100 group-hover:ml-1'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-white/[0.03]">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group text-red-500/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Sign Out System
                            </span>
                        </button>
                    </div>
                </nav>

                <div className="p-8">
                    <div className="bg-slate-900/40 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                        <div className="space-y-4 relative z-10">
                            <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Sponsor Hub</h4>
                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">Enterprise Insight v1.2</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '40%' }}
                                        className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );

    return (
        <div className="min-h-screen bg-transparent text-slate-200 flex font-sans overflow-hidden relative">
            <BackgroundAnimation />
            {renderSidebar()}

            <div className="flex-1 lg:ml-[280px] flex flex-col relative z-10 overflow-y-auto h-screen custom-scrollbar">
                {renderHeader()}

                <main className="p-4 sm:p-6 lg:p-10 pt-24 space-y-8 lg:space-y-10 max-w-[1530px] w-full mx-auto">
                    <AnimatePresence mode="wait">
                        {activeModule === 'DASHBOARD' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-12"
                            >
                                {/* Title Area - Logo Removed */}
                                <div className="space-y-6 pb-2">
                                    <div className="flex flex-col">
                                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none italic uppercase">Sponsor Dashboard</h1>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sponsor Partner</span>
                                            <span className="text-slate-500 leading-none">·</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">ID: SP-6996D917</span>
                                        </div>
                                    </div>

                                    {/* Action Header Buttons */}
                                    <div className="flex flex-wrap items-center gap-3 pt-4">

                                        <button
                                            onClick={() => setIsInquireModalOpen(true)}
                                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-cyan-500/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4 stroke-[3]" /> INQUIRE NEW STUDY
                                        </button>
                                        <button
                                            onClick={() => setIsExportModalOpen(true)}
                                            className="px-5 py-2.5 bg-[#0b1121]/60 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                        >
                                            <Download className="w-3.5 h-3.5" /> EXPORT
                                        </button>
                                    </div>
                                </div>

                                {/* Main Tab Navigation - Responsive Dropdown for Mobile/Tablet */}
                                <div className="relative z-[40]">
                                    {/* Desktop Horizontal Tabs */}
                                    <div className="hidden lg:flex bg-[#0b1121]/40 backdrop-blur-3xl border border-white/[0.03] rounded-[2rem] p-2 items-center justify-between gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
                                        {[
                                            { id: 'OVERVIEW', label: 'EXECUTIVE OVERVIEW', icon: LayoutDashboard },
                                            { id: 'STUDIES', label: 'PROTOCOL PORTFOLIO', icon: Beaker },
                                            { id: 'PARTICIPANTS', label: 'CLINICAL COHORTS', icon: Users2 },
                                            { id: 'SAFETY', label: 'SAFETY / PHARMACOVIGILANCE', icon: ShieldAlert },
                                            { id: 'DOCS', label: 'REGULATORY / TMF', icon: FileText },
                                            { id: 'REPORTS', label: 'DATA REPORTS', icon: BarChart },
                                            { id: 'TEAM', label: 'TEAM ACCESS', icon: Globe },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`min-w-fit px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-500 relative group truncate ${activeTab === tab.id
                                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20'
                                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                                                    }`}
                                            >
                                                <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-600'}`} />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Mobile/Tablet Dropdown */}
                                    <div className="lg:hidden relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                                            className="w-full bg-[#0b1121]/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                {(() => {
                                                    const currentTab = [
                                                        { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
                                                        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
                                                        { id: 'PARTICIPANTS', label: 'Participants', icon: Users },
                                                        { id: 'SAFETY', label: 'Safety', icon: ShieldAlert },
                                                        { id: 'DOCS', label: 'Documents', icon: FileText },
                                                        { id: 'REPORTS', label: 'Reports', icon: BarChart },
                                                        { id: 'TEAM', label: 'Team', icon: Users2 },
                                                    ].find(t => t.id === activeTab);
                                                    return currentTab && (
                                                        <>
                                                            <currentTab.icon className="w-5 h-5 text-cyan-400" />
                                                            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{currentTab.label}</span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isTabDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full left-0 right-0 mt-3 p-3 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl z-[50] space-y-1"
                                                >
                                                    {[
                                                        { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
                                                        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
                                                        { id: 'PARTICIPANTS', label: 'Participants', icon: Users },
                                                        { id: 'SAFETY', label: 'Safety', icon: ShieldAlert },
                                                        { id: 'DOCS', label: 'Documents', icon: FileText },
                                                        { id: 'REPORTS', label: 'Reports', icon: BarChart },
                                                        { id: 'TEAM', label: 'Team', icon: Users2 },
                                                    ].map((tab) => (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => {
                                                                setActiveTab(tab.id);
                                                                setIsTabDropdownOpen(false);
                                                            }}
                                                            className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${activeTab === tab.id
                                                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-600'}`} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                                            </div>
                                                            {activeTab === tab.id && <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]" />}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Tab-Specific Content */}
                                <AnimatePresence mode="wait">
                                    {activeTab === 'OVERVIEW' ? (
                                        <motion.div
                                            key="overview"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-8 sm:space-y-12"
                                        >
                                            {/* KPI Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                    {
                                                        label: 'TOTAL PARTICIPANTS',
                                                        val: participants.length.toString(),
                                                        sub: '+12%',
                                                        icon: Users,
                                                        color: 'text-cyan-400',
                                                        trend: 'up',
                                                        action: () => setActiveTab('PARTICIPANTS')
                                                    },
                                                    {
                                                        label: 'ACTIVE SITES',
                                                        val: studies.length.toString(),
                                                        sub: 'Stable',
                                                        icon: Activity,
                                                        color: 'text-indigo-400',
                                                        trend: 'stable',
                                                        action: () => setActiveTab('STUDIES')
                                                    },
                                                    {
                                                        label: 'COMPLETION RATE',
                                                        val: `${participants.length > 0 ? ((participants.filter(p => p.status === 'COMPLETED').length / participants.length) * 100).toFixed(1) : '0'}%`,
                                                        sub: '+0.4%',
                                                        icon: CheckCircle2,
                                                        color: 'text-emerald-400',
                                                        trend: 'up',
                                                        action: () => setActiveTab('PARTICIPANTS')
                                                    },
                                                    {
                                                        label: 'DROPPED / ALERTS',
                                                        val: participants.filter(p => p.status === 'DROPPED').length.toString(),
                                                        sub: 'Attention',
                                                        icon: ShieldAlert,
                                                        color: 'text-red-400',
                                                        trend: 'down',
                                                        action: () => setActiveTab('PARTICIPANTS')
                                                    },
                                                ].map((card, i) => (
                                                    <div 
                                                        key={i} 
                                                        onClick={card.action}
                                                        className="bg-[#0b1121]/40 border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all group relative overflow-hidden cursor-pointer active:scale-95"
                                                    >
                                                        <div className="flex justify-between items-start mb-6">
                                                            <h4 className="text-[10px] font-black text-white/70 group-hover:text-white uppercase tracking-widest leading-tight transition-colors">{card.label}</h4>
                                                            <div className="w-1.5 h-1.5 relative">
                                                                <div className={`absolute inset-0 rounded-full blur-[4px] ${card.trend === 'up' ? 'bg-emerald-500' : card.trend === 'down' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                                                <TrendingUp className={`w-3.5 h-3.5 relative z-10 ${card.trend === 'up' ? 'text-emerald-500' : card.trend === 'down' ? 'text-red-500' : 'text-slate-500'}`} />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-4xl font-black text-white italic tracking-tighter drop-shadow-lg">{card.val}</p>
                                                            <span className={`text-[10px] font-black ${card.trend === 'up' ? 'text-emerald-400' : card.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                                                                {card.sub}
                                                            </span>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}

                                            </div>

                                            {/* Main Chart Section & Activity */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div className="bg-[#0b1121]/40 border border-white/5 rounded-[2.5rem] p-10 min-h-[450px] relative overflow-hidden">
                                                        <div className="flex justify-between items-start mb-12">
                                                            <div>
                                                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">ENROLLMENT INTELLIGENCE</h3>
                                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">CROSS-SITE ACTIVITY (PAST 7 DAYS)</p>
                                                            </div>
                                                            <div className="flex gap-10">
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AVG. DAILY</p>
                                                                    <p className="text-xl font-black text-white">+{avgDaily}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GOAL PCT</p>
                                                                    <p className="text-xl font-black text-emerald-400">{goalPct}%</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Placeholder for Chart Visualization */}
                                                        <div className="absolute bottom-32 inset-x-12 h-40 flex items-end justify-between opacity-20">
                                                            {[...Array(7)].map((_, i) => (
                                                                <div key={i} className="flex flex-col items-center gap-4 w-full">
                                                                    <div className="w-px h-full bg-white/20 relative">
                                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-cyan-500/50 rounded-full" style={{ height: `${Math.random() * 80 + 20}%` }} />
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-slate-600">D0{i + 1}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="absolute bottom-10 left-10 right-10 grid grid-cols-2 gap-6">
                                                            <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ENROLLMENT VELOCITY</span>
                                                                </div>
                                                                <p className="text-xl font-black text-white">+{velocity}% <span className="text-slate-500 text-[10px] italic">vs total</span></p>
                                                            </div>
                                                            <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RETENTION RATING</span>
                                                                </div>
                                                                <p className="text-xl font-black text-white">{retentionRating}% <span className="text-slate-500 text-[10px] italic">Stability</span></p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Active Protocol Banner */}
                                                    <div className="bg-indigo-600 rounded-[2.5rem] p-10 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:bg-indigo-500 transition-all">
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/20">ACTIVE PROTOCOL</span>
                                                                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">MUSB-2024-012</span>
                                                            </div>
                                                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter max-w-xl leading-tight">NAD+ PRECURSOR SAFETY & LONGEVITY STUDY</h3>
                                                            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-2">Healthy Aging · Phase II</p>
                                                        </div>
                                                        <div className="text-right relative z-10 flex items-center gap-12">
                                                            <div>
                                                                <p className="text-5xl font-black text-white italic leading-none">0%</p>
                                                                <p className="text-[9px] font-black text-white uppercase tracking-widest mt-2">ENROLLMENT</p>
                                                            </div>
                                                            <ArrowUpRight className="w-12 h-12 text-white/40 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                                        </div>
                                                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.05] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="bg-[#0b1121]/40 border border-white/5 rounded-[2.5rem] p-8 min-h-[450px] flex flex-col">
                                                        <div className="flex justify-between items-center mb-8">
                                                            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] italic">SITE ACTIVITY</h3>
                                                            <Bell className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                        <div className="flex-1 space-y-8">
                                                            {[
                                                                { type: 'SAFETY ALERT', msg: 'NEW ADVERSE EVENT REPORTED', details: 'Subject ID #992 (NAD+ Study) reported mild fatigue.', time: '2H AGO', color: 'text-red-500' },
                                                                { type: 'DATA ALERT', msg: 'LAB RESULTS SYNCED', details: 'Biomarker data for Batch 04 is now available.', time: '5H AGO', color: 'text-cyan-500' },
                                                                { type: 'RECRUITMENT ALERT', msg: 'NEW LEAD QUALIFIED', details: 'Lead from social campaign verified by clinical coordinator.', time: '8H AGO', color: 'text-indigo-400' },
                                                            ].map((evt, i) => (
                                                                <div key={i} className="space-y-2 relative pl-4">
                                                                    <div className={`absolute left-0 top-1 bottom-1 w-[2px] ${evt.color.replace('text', 'bg').replace('500', '500/30')}`} />
                                                                    <div className="flex justify-between items-center">
                                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${evt.color}`}>{evt.type}</span>
                                                                        <span className="text-[8px] font-bold text-slate-600">{evt.time}</span>
                                                                    </div>
                                                                    <h4 className="text-[11px] font-black text-white italic uppercase tracking-tight">{evt.msg}</h4>
                                                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{evt.details}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button className="w-full mt-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                                                            BROWSE AUDIT LOGS
                                                        </button>
                                                    </div>

                                                    <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-[2.5rem] p-10 relative overflow-hidden group cursor-pointer hover:from-blue-600 hover:to-indigo-700 transition-all shadow-2xl">
                                                        <div className="relative z-10 space-y-6">
                                                            <div className="space-y-2">
                                                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">NEW PROTOCOL INQUIRY</h3>
                                                                <p className="text-[11px] font-bold text-white/70 leading-relaxed uppercase tracking-widest">READY TO EXPLORE A NEW CLINICAL COHORT OR ANALYTIC SITE?</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setIsInquireModalOpen(true)}
                                                                className="w-full bg-white text-blue-900 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl group-hover:shadow-blue-500/20"
                                                            >
                                                                LAUNCH SETUP <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <FlaskConical className="absolute top-1/2 right-10 -translate-y-1/2 w-40 h-40 text-white/[0.05] pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* My Pipeline */}
                                            <div className="space-y-6 sm:space-y-8">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                                                    <h3 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.4em] opacity-30 italic">My Pipeline</h3>
                                                    <button className="w-fit text-[9px] font-black text-cyan-500 uppercase tracking-widest hover:text-white transition-colors">View All Protocols</button>
                                                </div>

                                                {studies.length === 0 ? (
                                                    <div className="h-[300px] sm:h-[400px] rounded-[2rem] sm:rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-6 bg-white/[0.01] p-6 text-center">
                                                        <div className="p-6 sm:p-8 bg-slate-900/40 rounded-full border border-white/5 shadow-2xl">
                                                            <Search className="w-8 h-8 sm:w-12 sm:h-12 text-slate-700 opacity-20" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">No Studies Found</h4>
                                                            <p onClick={() => setIsInquireModalOpen(true)} className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-cyan-500/30 pb-1 cursor-pointer hover:text-white transition-all">Inquire about your first protocol</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                                        {studies.map((study, i) => (
                                                            <div key={i} className="bg-[#0b1121]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 space-y-6 hover:border-cyan-500/20 transition-all group relative overflow-hidden">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                                                        <Beaker className="w-6 h-6 text-cyan-500" />
                                                                    </div>
                                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${study.status === 'COMPLETED'
                                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                            : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                                                        }`}>{study.status}</span>
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight truncate">{study.title}</h3>
                                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Protocol #{study.protocol_id}</p>
                                                                </div>
                                                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="w-3.5 h-3.5 text-slate-600" />
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                            {study.status === 'COMPLETED'
                                                                                ? `CONCLUDED: ${participants.filter(p => p.study === study.id && p.status === 'COMPLETED').length} FINISHED`
                                                                                : `Enrolled: ${participants.filter(p => p.study === study.id).length}`}
                                                                        </span>
                                                                    </div>
                                                                    <ArrowUpRight className="w-4 h-4 text-slate-800 group-hover:text-cyan-500 transition-all" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : activeTab === 'PARTICIPANTS' ? (
                                        <motion.div
                                            key="participants"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8 sm:space-y-12"
                                        >
                                            <div className="space-y-2">
                                                <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-wider">De-Identified Participant Data</h3>
                                                <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60">PII Redacted — Clinical Trial Oversight View</p>
                                            </div>

                                            <div className="bg-[#0b1121]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] overflow-hidden">
                                                <div className="hidden lg:grid grid-cols-5 p-8 bg-white/[0.03] border-b border-white/5">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Participant SID</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Gender / Age</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Assigned Arm</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-4">Timeline</div>
                                                </div>

                                                {participants.length === 0 ? (
                                                    <div className="p-20 text-center opacity-30">
                                                        <Users className="w-12 h-12 mx-auto mb-4" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No participant data available</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-white/[0.03]">
                                                        {participants.map((p, i) => (
                                                            <div key={i} className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-5 items-center gap-4 lg:gap-0 hover:bg-white/[0.02] transition-all group">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-cyan-500 text-[10px]">
                                                                        SID
                                                                    </div>
                                                                    <h4 className="text-xs font-black text-white uppercase italic tracking-tight">{p.participant_sid}</h4>
                                                                </div>
                                                                <div className="lg:text-center">
                                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${p.status === 'ENROLLED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                                                        }`}>
                                                                        {p.status}
                                                                    </span>
                                                                </div>
                                                                <div className="lg:text-center">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.gender || 'Unknown'} / {p.age || 'N/A'}</p>
                                                                </div>
                                                                <div className="lg:text-center">
                                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                                                        {p.assigned_arm || 'Standard'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right pr-4">
                                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{p.completion_date ? 'Completed' : 'Active Protocol'}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : activeTab === 'TEAM' ? (
                                        <motion.div
                                            key="team"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8 sm:space-y-12"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                <div className="space-y-2 text-center sm:text-left">
                                                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-wider">Team Management</h3>
                                                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60 max-w-lg mx-auto sm:mx-0">Manage organizational access and tiered study assignments</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsInviteModalOpen(true)}
                                                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 text-white rounded-[1.2rem] sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Plus className="w-4 h-4 stroke-[3]" /> Invite Member
                                                </button>
                                            </div>

                                            {/* Team Authorization Table - Responsive handling */}
                                            <div className="bg-[#0b1121]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
                                                <div className="hidden lg:grid grid-cols-6 p-8 bg-white/[0.03] border-b border-white/5 items-center">
                                                    <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-6">Authorized Member</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Permissions</div>
                                                    <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Contact</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-6">Access Status</div>
                                                </div>
                                                <div className="divide-y divide-white/[0.03]">
                                                    {teamMembers.length === 0 ? (
                                                        <div className="p-12 text-center opacity-30">
                                                            <p className="text-[10px] font-black uppercase tracking-widest italic">No team members identified</p>
                                                        </div>
                                                    ) : (
                                                        teamMembers.map((member, i) => (
                                                            <div key={i} className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-6 items-center gap-6 lg:gap-0 hover:bg-white/[0.02] transition-all group cursor-pointer relative">
                                                                <div className="lg:col-span-2 flex items-center gap-4 sm:gap-6">
                                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 font-black text-base sm:text-lg group-hover:border-blue-500/30 transition-all shrink-0 uppercase italic">
                                                                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tight truncate">{member.name}</h4>
                                                                        <p className="text-[9px] sm:text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-widest truncate">{member.email}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="lg:text-center">
                                                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                                                        {member.role}
                                                                    </span>
                                                                </div>
                                                                <div className="lg:col-span-2 text-center">
                                                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                                                        {member.email}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right flex lg:justify-end items-center gap-3 absolute top-6 right-6 lg:static">
                                                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500 opacity-50'}`}></div>
                                                                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] ${member.status === 'ACTIVE' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                                        {member.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : activeTab === 'SAFETY' ? (
                                        <motion.div
                                            key="safety"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="h-[500px] flex flex-col items-center justify-center space-y-6"
                                        >
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="bg-[#0b1121]/40 border border-white/5 rounded-[2rem] p-8 space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
                                                            <ShieldAlert className="w-5 h-5 text-red-500" />
                                                        </div>
                                                        <h4 className="text-sm font-black text-white uppercase italic tracking-wider">Priority Signals</h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {participants.filter(p => p.status === 'DROPPED' || p.status === 'INELIGIBLE').length === 0 ? (
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase py-10 text-center italic">No immediate safety signals detected</p>
                                                        ) : (
                                                            participants.filter(p => p.status === 'DROPPED' || p.status === 'INELIGIBLE').map((p, i) => (
                                                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                                                        <span className="text-[10px] font-black text-white uppercase italic">{p.participant_sid}</span>
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">{p.status}</span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-[#0b1121]/40 border border-white/5 rounded-[2rem] p-8 space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                                            <Activity className="w-5 h-5 text-orange-500" />
                                                        </div>
                                                        <h4 className="text-sm font-black text-white uppercase italic tracking-wider">Protocol Compliance</h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="p-10 text-center space-y-2">
                                                            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Signal Monitoring Initialized</p>
                                                            <div className="h-1 bg-slate-900 rounded-full w-24 mx-auto overflow-hidden">
                                                                <div className="h-full bg-orange-500 w-1/3 animate-[shimmer_2s_infinite]" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : activeTab === 'DOCS' ? (
                                        <motion.div
                                            key="docs"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="h-[500px] flex flex-col items-center justify-center space-y-6"
                                        >
                                            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                <FileText className="w-10 h-10 text-blue-500" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h3 className="text-xl font-black text-white uppercase italic tracking-wider">Regulatory / TMF</h3>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest max-w-[320px]">Unified protocol repository and trial master file access coming soon.</p>
                                            </div>
                                        </motion.div>
                                    ) : activeTab === 'REPORTS' ? (
                                        <motion.div
                                            key="reports"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="h-[500px] flex flex-col items-center justify-center space-y-6"
                                        >
                                            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                <BarChart className="w-10 h-10 text-indigo-500" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h3 className="text-xl font-black text-white uppercase italic tracking-wider">Data Insights & Claims</h3>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest max-w-[300px]">Generating enterprise-level enrollment and retention intelligence reports.</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="fallback"
                                            className="h-[300px] sm:h-[400px] flex items-center justify-center opacity-30 px-6 text-center"
                                        >
                                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em]">Module view under development</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Invitation Modal - Mobile Friendly */}
                    <AnimatePresence>
                        {isInviteModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="absolute inset-0 bg-[#05080f]/90 backdrop-blur-xl"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="relative w-full max-w-xl bg-[#0b1121] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                                >
                                    <div className="absolute top-0 right-0 p-6 sm:p-8">
                                        <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-8 sm:space-y-10">
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 sm:mb-6">
                                                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter italic">Authorize Member</h3>
                                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Provision secure access to your organization's study data</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Team Member Email</label>
                                                <input
                                                    type="email"
                                                    value={inviteForm.email}
                                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                                    placeholder="e.g. associate@organization.com"
                                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Role</label>
                                                    <select
                                                        value={inviteForm.role}
                                                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 transition-all outline-none appearance-none"
                                                    >
                                                        <option value="MANAGER">Study Manager</option>
                                                        <option value="VIEWER">Sponsor Viewer</option>
                                                        <option value="ADMIN">Sponsor Admin</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Scope</label>
                                                    <select
                                                        value={inviteForm.scope}
                                                        onChange={(e) => setInviteForm({ ...inviteForm, scope: e.target.value, study_ids: [] })}
                                                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 transition-all outline-none appearance-none"
                                                    >
                                                        <option value="ALL">All Active Protocols</option>
                                                        <option value="SPECIFIC">Assign Specific Studies</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Specific Study Selection for Sequestration Logic */}
                                            {inviteForm.scope === 'SPECIFIC' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Selection (Required)</label>
                                                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                        {studies.map(study => (
                                                            <div
                                                                key={study.protocol_id}
                                                                onClick={() => {
                                                                    const ids = [...inviteForm.study_ids];
                                                                    if (ids.includes(study.protocol_id)) {
                                                                        setInviteForm({ ...inviteForm, study_ids: ids.filter(id => id !== study.protocol_id) });
                                                                    } else {
                                                                        setInviteForm({ ...inviteForm, study_ids: [...ids, study.protocol_id] });
                                                                    }
                                                                }}
                                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${inviteForm.study_ids.includes(study.protocol_id)
                                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                                                    }`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[11px] font-black uppercase italic ${inviteForm.study_ids.includes(study.protocol_id) ? 'text-blue-400' : 'text-slate-300'}`}>
                                                                        {study.title}
                                                                    </span>
                                                                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">#{study.protocol_id}</span>
                                                                </div>
                                                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${inviteForm.study_ids.includes(study.protocol_id)
                                                                    ? 'bg-blue-500 border-blue-500'
                                                                    : 'border-white/20'
                                                                    }`}>
                                                                    {inviteForm.study_ids.includes(study.protocol_id) && <CheckCircle2 className="w-3 h-3 text-[#05080f]" />}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleInviteMember}
                                            className="w-full py-5 sm:py-6 bg-blue-600 text-white rounded-xl sm:rounded-[2rem] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl shadow-blue-500/10 hover:scale-[1.02] active:scale-95 transition-all mt-4 leading-none"
                                        >
                                            Dispatch Secure Invitation
                                        </button>

                                        <div className="flex items-center gap-3 justify-center opacity-30">
                                            <ShieldCheck className="w-3 h-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">End-to-End Encrypted Auth Pipeline</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Inquire New Study Modal */}
            <InquireStudyModal
                isOpen={isInquireModalOpen}
                onClose={() => setIsInquireModalOpen(false)}
            />
            <LogoutConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmSignOut}
            />

            {/* Study Selection Modal for Export */}
            <AnimatePresence>
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExportModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0b1424] border border-white/10 w-full max-w-xl rounded-[2.5rem] p-8 sm:p-12 relative z-10 overflow-hidden shadow-2xl"
                        >
                            <div className="relative z-10 space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Export Selection</h2>
                                        <button onClick={() => setIsExportModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                            <X className="w-6 h-6 text-slate-400" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Choose which clinical trial protocol you wish to export into a de-identified CSV format.</p>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    <button
                                        onClick={() => handleExport()}
                                        className="w-full flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group"
                                    >
                                        <div className="text-left">
                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Global Master Export</h4>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Combine data from all listed studies</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-cyan-500 transition-colors" />
                                    </button>

                                    {studies.map((study) => (
                                        <button
                                            key={study.id}
                                            onClick={() => handleExport(study.id)}
                                            className="w-full flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
                                        >
                                            <div className="text-left max-w-[80%]">
                                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest truncate">{study.title}</h4>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Protocol #{study.protocol_id}</p>
                                            </div>
                                            <Download className="w-5 h-5 text-slate-700 group-hover:text-indigo-500 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
