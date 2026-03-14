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
import { clearToken } from '../utils/auth';
import InquireStudyModal from '../components/InquireStudyModal';

type SponsorModule = 'DASHBOARD' | 'STUDIES' | 'RECRUITMENT' | 'DATA' | 'ARMS' | 'LAB' | 'SAFETY' | 'REPORTS' | 'DOCS' | 'MESSAGES';

const BackgroundAnimation = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Atmosphere Layer - Removed solid bg to show global dots */}

        {/* Dynamic Tech Grid */}
        <div 
            className="absolute inset-0 opacity-[0.12] sm:opacity-[0.15]"
            style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), 
                                 linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                backgroundSize: '100px 100px',
                maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)'
            }}
        />

        {/* Primary Nebula - Cyan Focus */}
        <motion.div 
            animate={{ 
                x: [-20, 60, -20],
                y: [-30, 40, -30],
                scale: [1, 1.3, 1],
                rotate: [0, 45, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[120px]" 
        />

        {/* Secondary Nebula - Indigo Depth */}
        <motion.div 
            animate={{ 
                x: [60, -20, 60],
                y: [40, -40, 40],
                scale: [1.3, 1, 1.3],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-15%] right-[-5%] w-[75%] h-[75%] rounded-full bg-indigo-600/10 blur-[150px]" 
        />

        {/* Accent Nebula - Amber Pulse */}
        <motion.div 
            animate={{ 
                opacity: [0.03, 0.1, 0.03],
                scale: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[100px]" 
        />

        {/* Background Particles (Tech Stars) */}
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ 
                    x: Math.random() * 100 + "%", 
                    y: Math.random() * 100 + "%",
                    scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                    y: (Math.random() > 0.5 ? "-" : "+") + (Math.random() * 10 + 5) + "vh",
                    opacity: [0.1, 0.4, 0.1],
                }}
                transition={{ 
                    duration: 15 + Math.random() * 20, 
                    repeat: Infinity, 
                    ease: "easeInOut"
                }}
                className="absolute w-[2px] h-[2px] bg-white rounded-full opacity-20"
            />
        ))}

        {/* Floating Data Pulses */}
        {[...Array(5)].map((_, i) => (
            <motion.div
                key={`pulse-${i}`}
                initial={{ 
                    x: Math.random() * 100 + "%", 
                    y: "110%", 
                    opacity: 0 
                }}
                animate={{ 
                    y: "-10%",
                    opacity: [0, 0.4, 0],
                    scale: [0.5, 1, 0.5]
                }}
                transition={{ 
                    duration: 12 + Math.random() * 18, 
                    repeat: Infinity, 
                    delay: Math.random() * 10,
                    ease: "easeInOut"
                }}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] z-[1]"
            />
        ))}

        {/* Scanning Light Sweep */}
        <motion.div 
            animate={{ y: ['-100%', '250%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-[40vh] bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent opacity-40 skew-y-12"
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
    const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
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

    const handleSignOut = () => {
        clearToken();
        localStorage.removeItem('user');
        navigate('/signin');
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
        } catch(e) {}

        const displayName = organization || userName;

        return (
            <header className="fixed top-0 left-0 lg:left-[280px] right-0 h-20 z-40 flex items-center justify-between lg:justify-end px-4 sm:px-8 lg:px-12 pointer-events-none border-b border-white/[0.02]">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2.5 bg-black/20 backdrop-blur-3xl rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all pointer-events-auto"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 sm:gap-8 pointer-events-auto bg-black/20 backdrop-blur-3xl px-4 sm:px-6 py-2 rounded-2xl border border-white/5 shadow-2xl">
                    <button className="hidden sm:block p-2.5 bg-white/[0.03] rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/[0.08] relative group">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-[#05080f] group-hover:scale-110 transition-transform"></span>
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
                                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden hover:border-amber-500/50 transition-all active:scale-95 shadow-lg group-hover:bg-slate-800"
                            >
                                <Users2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                            </button>
                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-[#0d1424] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden backdrop-blur-3xl shadow-amber-500/5"
                                    >
                                        <div className="px-4 py-4 border-b border-white/5 mb-2 bg-white/[0.02] rounded-xl">
                                            <p className="text-[10px] font-black text-white truncate uppercase italic">{userName}</p>
                                            <p className="text-[8px] text-slate-500 truncate mt-1.5 uppercase tracking-widest font-bold">Authorized Sponsor</p>
                                        </div>
                                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest">
                                            <Settings className="w-4 h-4" /> Account Config
                                        </button>
                                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-100 hover:text-white hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest mt-1">
                                            <LogOut className="w-4 h-4" /> End Session
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
        { id: 'DASHBOARD', label: 'Dashboard (Overview)', icon: LayoutDashboard },
        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
        { id: 'RECRUITMENT', label: 'Recruitment Progress', icon: TrendingUp },
        { id: 'DATA', label: 'Participant Data', icon: Users },
        { id: 'ARMS', label: 'Intervention / Arm View', icon: PieChart },
        { id: 'LAB', label: 'Lab & Sample Data', icon: FlaskConical },
        { id: 'SAFETY', label: 'Safety (AE/SAE)', icon: ShieldAlert },
        { id: 'REPORTS', label: 'Reports & Claims', icon: BarChart },
        { id: 'DOCS', label: 'Documents', icon: FileText },
        { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
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

            <aside className={`fixed left-0 top-0 bottom-0 w-[280px] bg-[#05080f] border-r border-white/5 z-[60] flex flex-col overflow-hidden transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-10 pb-12 flex justify-between items-center lg:justify-center">
                    <Link to="/" className="flex items-center gap-3 bg-white rounded-full px-5 py-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <img src="/logo.jpg" alt="Logo" className="h-6 w-auto" />
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
                                setActiveModule(item.id as SponsorModule);
                                if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group relative ${
                                activeModule === item.id 
                                ? 'bg-amber-500/10 text-amber-500 border border-white/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            {activeModule === item.id && (
                                <motion.div 
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1.5 h-8 bg-amber-500 rounded-r-full shadow-[0_0_15px_#f59e0b] -translate-x-6"
                                />
                            )}
                            <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-amber-500' : 'text-slate-600 group-hover:text-slate-400'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${activeModule === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
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
                                        className="h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" 
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
        <div className="min-h-screen bg-[#05080f]/50 text-slate-200 flex font-sans overflow-hidden relative backdrop-blur-[3px]">
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
                                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">Sponsor Dashboard</h1>
                                        <div className="flex items-center gap-4 mt-4 opacity-80">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sponsor Partner</span>
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">SP-6996D917</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Header Buttons - Left Aligned */}
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2"> 
                                        <a 
                                            href="https://www.musbhealth.com/trials#current-studies"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-3.5 bg-[#0b1121]/40 border border-white/5 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 backdrop-blur-3xl group"
                                        >
                                            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Public Directory <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-all hidden sm:block" />
                                        </a>
                                        <button onClick={() => setIsInquireModalOpen(true)} className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 bg-amber-500 text-slate-950 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> Inquire New Study
                                        </button>
                                        <button className="w-full sm:w-auto px-6 py-3.5 bg-[#0b1121]/40 border border-white/5 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 backdrop-blur-xl group">
                                            <Download className="w-3.5 h-3.5" /> Export
                                        </button>
                                    </div>
                                </div>

                                {/* Main Tab Navigation - Responsive Dropdown for Mobile/Tablet */}
                                <div className="relative z-[40]">
                                    {/* Desktop Horizontal Tabs */}
                                    <div className="hidden lg:flex bg-[#0b1121]/40 backdrop-blur-3xl border border-white/[0.03] rounded-[2rem] p-2 items-center justify-between gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
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
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`min-w-fit px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-500 relative group truncate ${
                                                    activeTab === tab.id 
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
                                                            className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${
                                                                activeTab === tab.id 
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                                {[
                                                    { label: 'Active Studies', val: '0', sub: '+1 this month', icon: Beaker, color: 'text-amber-500' },
                                                    { label: 'Total Participants', val: '0', sub: 'Across all protocols', icon: Users, color: 'text-cyan-400' },
                                                    { label: 'Enrolled Rate', val: '0%', sub: 'Target: 85% avg', icon: TrendingUp, color: 'text-emerald-400' },
                                                    { label: 'Data Integrity', val: '99.8%', sub: 'HIPAA Compliant', icon: Shield, color: 'text-indigo-400' },
                                                ].map((card, i) => (
                                                    <div key={i} className="bg-[#0b1121]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-6 sm:space-y-8 hover:border-white/10 transition-all group overflow-hidden relative">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center relative z-10">
                                                            <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                                                        </div>
                                                        <div className="relative z-10">
                                                            <p className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none">{card.val}</p>
                                                            <h4 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3 sm:mt-4 opacity-70">{card.label}</h4>
                                                        </div>
                                                        <div className="pt-3 sm:pt-4 border-t border-white/5 flex items-center gap-2 opacity-50 relative z-10">
                                                            <ArrowUpRight className={`w-3 h-3 ${card.color}`} />
                                                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.sub}</span>
                                                        </div>
                                                        <div className="absolute -bottom-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Main Dashboard Content */}
                                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-10">
                                                <div className="lg:col-span-3 space-y-6 sm:space-y-8">
                                                    <h3 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.4em] opacity-30 italic ml-2">Intelligence Feed</h3>
                                                    <div className="bg-[#0b1121]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 space-y-6 sm:space-y-8">
                                                        {[
                                                            { icon: Activity, msg: 'Study protocol #882-X finalized by PI', time: '2 HOURS AGO', color: 'text-emerald-400' },
                                                            { icon: FileText, msg: 'Monthly Safety Report available for download', time: 'YESTERDAY', color: 'text-indigo-400' },
                                                            { icon: ShieldAlert, msg: '1 Adverse Event flagged — MILD severity', time: '2 DAYS AGO', color: 'text-amber-400' },
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex items-start sm:items-center justify-between group cursor-pointer">
                                                                <div className="flex items-start sm:items-center gap-6 sm:gap-10">
                                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shrink-0">
                                                                        <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color}`} />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-[11px] sm:text-[13px] font-bold text-white uppercase tracking-tight opacity-90 leading-tight">{item.msg}</h4>
                                                                        <p className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.time}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                                                    <h3 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.4em] opacity-30 italic ml-2">Quick Actions</h3>
                                                    <div className="space-y-4">
                                                        {[
                                                            { label: 'Request IRB Review', icon: Shield },
                                                            { label: 'Invite Coordinators', icon: Users2 },
                                                            { label: 'System Audit Export', icon: ClipboardList },
                                                        ].map((action, i) => (
                                                            <button key={i} className="w-full flex items-center justify-between p-6 sm:p-8 bg-[#0b1121]/40 border border-white/5 rounded-2xl sm:rounded-3xl hover:border-white/20 hover:bg-white/5 transition-all group shadow-xl">
                                                                <div className="flex items-center gap-4 sm:gap-6 text-left">
                                                                    <action.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 group-hover:text-amber-500 transition-colors" />
                                                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{action.label}</span>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-slate-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* My Pipeline Empty State */}
                                            <div className="space-y-6 sm:space-y-8">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                                                    <h3 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.4em] opacity-30 italic">My Pipeline</h3>
                                                    <button className="w-fit text-[9px] font-black text-amber-500 uppercase tracking-widest hover:text-white transition-colors">View All Protocols</button>
                                                </div>
                                                <div className="h-[300px] sm:h-[400px] rounded-[2rem] sm:rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-6 bg-white/[0.01] p-6 text-center">
                                                    <div className="p-6 sm:p-8 bg-slate-900/40 rounded-full border border-white/5 shadow-2xl">
                                                        <Search className="w-8 h-8 sm:w-12 sm:h-12 text-slate-700 opacity-20" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">No Studies Found</h4>
                                                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-amber-500/30 pb-1 cursor-pointer hover:text-white transition-all">Inquire about your first protocol</p>
                                                    </div>
                                                </div>
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
                                                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-amber-500 text-slate-950 rounded-[1.2rem] sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Plus className="w-4 h-4 stroke-[3]" /> Invite Member
                                                </button>
                                            </div>

                                              {/* Team Authorization Table - Responsive handling */}
                                            <div className="bg-[#0b1121]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
                                                <div className="hidden lg:grid grid-cols-6 p-8 bg-white/[0.03] border-b border-white/5 items-center">
                                                    <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-6">Authorized Member</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Permissions</div>
                                                    <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-10">Study Scope</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-6">Access Status</div>
                                                </div>
                                                <div className="divide-y divide-white/[0.03]">
                                                    {[
                                                        { name: 'Sarah Jenkins', email: 's.jenkins@vitaspharma.com', role: 'Sponsor Admin', studies: 'Global Organization Portfolio', status: 'ACTIVE', color: 'text-emerald-400' },
                                                        { name: 'Marcus Chen', email: 'm.chen@vitaspharma.com', role: 'Study Manager', studies: 'Protocol #882-X, Protocol #901-Y', status: 'ACTIVE', color: 'text-emerald-400' },
                                                        { name: 'Elena Rodriguez', email: 'e.rod@audit-external.com', role: 'Viewer', studies: 'Protocol #882-X (Safety Data Only)', status: 'PENDING', color: 'text-amber-500' },
                                                    ].map((member, i) => (
                                                        <div key={i} className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-6 items-center gap-6 lg:gap-0 hover:bg-white/[0.02] transition-all group cursor-pointer relative">
                                                            <div className="lg:col-span-2 flex items-center gap-4 sm:gap-6">
                                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 font-black text-base sm:text-lg group-hover:border-amber-500/30 transition-all shrink-0">
                                                                    {member.name.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-500 transition-colors uppercase italic tracking-tight truncate">{member.name}</h4>
                                                                    <p className="text-[9px] sm:text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-widest truncate">{member.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="lg:text-center">
                                                                <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                                                    {member.role}
                                                                </span>
                                                            </div>
                                                            <div className="lg:col-span-2 lg:pl-10">
                                                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                                                    {member.studies}
                                                                </p>
                                                            </div>
                                                            <div className="text-right flex lg:justify-end items-center gap-3 absolute top-6 right-6 lg:static">
                                                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 opacity-50'}`}></div>
                                                                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] ${member.color}`}>
                                                                    {member.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Access Control Information Card - Responsive Text */}
                                            <div className="p-8 sm:p-12 bg-gradient-to-br from-[#0b1121]/80 to-transparent border border-white/5 rounded-[2rem] sm:rounded-[3rem] relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-5 group-hover:opacity-10 transition-opacity hidden sm:block">
                                                    <ShieldCheck className="w-24 h-24 sm:w-32 sm:h-32 text-amber-500" />
                                                </div>
                                                <div className="relative z-10 max-w-2xl space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                                                        </div>
                                                        <h4 className="text-base sm:text-lg font-black text-white uppercase italic tracking-tight">Security Compliance & Role Governance</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2 sm:pt-4">
                                                        <div className="space-y-2">
                                                            <h5 className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest">Invitation Logic</h5>
                                                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">System generates encrypted single-use tokens for secure credential setup via verified corporate email.</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h5 className="text-[9px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest">Study Sequestration</h5>
                                                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">Granular data isolation ensures managers only interact with explicitly authorized clinical protocols.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="h-[300px] sm:h-[400px] flex items-center justify-center opacity-30 px-6 text-center">
                                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em]">Module view under development</p>
                                        </div>
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
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 sm:mb-6">
                                                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter italic">Authorize Member</h3>
                                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Provision secure access to your organization's study data</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Team Member Email</label>
                                                <input 
                                                    type="email" 
                                                    placeholder="e.g. associate@organization.com"
                                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm text-white focus:border-amber-500/50 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Role</label>
                                                    <select className="w-full bg-slate-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm text-white focus:border-amber-500/50 transition-all outline-none appearance-none">
                                                        <option value="MANAGER">Study Manager</option>
                                                        <option value="VIEWER">Sponsor Viewer</option>
                                                        <option value="ADMIN">Sponsor Admin</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Scope</label>
                                                    <select className="w-full bg-slate-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm text-white focus:border-amber-500/50 transition-all outline-none appearance-none">
                                                        <option value="ALL">All Active Protocols</option>
                                                        <option value="SPECIFIC">Assign Specific Studies</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="w-full py-5 sm:py-6 bg-amber-500 text-slate-950 rounded-xl sm:rounded-[2rem] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl shadow-amber-500/10 hover:scale-[1.02] active:scale-95 transition-all mt-4 leading-none">
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
        </div>
    );
}
