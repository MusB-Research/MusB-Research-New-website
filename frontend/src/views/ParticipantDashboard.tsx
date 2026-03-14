import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../utils/auth';
import { 
    LayoutDashboard, 
    ClipboardList, 
    Box, 
    Activity, 
    MessageSquare, 
    FileText, 
    BarChart3, 
    User, 
    Bell, 
    LogOut,
    CheckCircle2,
    TrendingUp,
    Trophy,
    Target,
    ListTodo,
    ChevronRight,
    Circle,
    PlusCircle,
    ArrowRight,
    Globe
} from 'lucide-react';

// --- Types ---
interface StatCardProps {
    icon: React.ReactNode;
    value: string;
    label: string;
    colorClass: string;
}

interface TaskItemProps {
    title: string;
    duration: string;
    isLast?: boolean;
}

interface SupplementItemProps {
    name: string;
    time: string;
    isActive: boolean;
}

// --- Components ---

const BackgroundDots = () => null; // Use the global AnimatedBackground instead

const StatCard = ({ icon, value, label, colorClass }: StatCardProps) => (
    <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 flex items-center gap-5 hover:border-white/10 transition-all group">
        <div className={`w-14 h-14 rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center text-current`}>
            {icon}
        </div>
        <div>
            <div className="text-3xl font-black text-white leading-none">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[#00e5ff] mt-2 opacity-80">{label}</div>
        </div>
    </div>
);

const TaskItem = ({ title, duration, isLast }: TaskItemProps) => (
    <div className="relative pl-12 pb-8 group last:pb-0">
        {!isLast && <div className="task-timeline-line" />}
        <div className="task-dot top-2 group-hover:bg-[#00e5ff] transition-colors" />
        <div className="flex items-center justify-between bg-[#0f172a]/40 p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
            <div>
                <h4 className="text-lg font-black text-white">{title}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">NAD+ LONGEVITY TRIAL | {duration}</p>
            </div>
            <button className="bg-[#00e5ff] text-slate-950 px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
                Start Task
            </button>
        </div>
    </div>
);

const SupplementToggle = ({ name, time, isActive }: SupplementItemProps) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f172a]/30 border border-white/5 hover:border-white/10 transition-all">
        <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{name}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{time}</span>
        </div>
        <div className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${isActive ? 'bg-[#00ff88]' : 'bg-slate-800'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isActive ? 'left-5 shadow-sm' : 'left-1'}`} />
            {isActive && <CheckCircle2 className="absolute right-[-1.5rem] w-4 h-4 text-[#00ff88]" />}
        </div>
    </div>
);

export default function ParticipantDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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
        clearToken();
        localStorage.removeItem('user');
        navigate('/');
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList },
        { id: 'kit', label: 'Study Kit', icon: Box },
        { id: 'logs', label: 'Logs', icon: Activity },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-[#0a0e1a]/70 text-slate-200 flex overflow-hidden font-sans relative backdrop-blur-[2px]">
            <BackgroundDots />

            {/* --- Sidebar --- */}
            <aside className={`fixed lg:relative z-40 h-full bg-[#080c18] border-r border-white/5 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-72' : 'w-20'} overflow-hidden`}>
                <div className="p-8">
                    <Link to="/" className="bg-white rounded-[1.5rem] px-5 py-3 shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform group/logo">
                        <img src="/logo.jpg" alt="MusB Research" className="h-10 w-auto object-contain brightness-110" />
                    </Link>
                </div>

                <div className="px-6 mb-8">
                    {(() => {
                        const userStr = localStorage.getItem('user');
                        let userName = 'User';
                        let userPicture = '';
                        try {
                            if (userStr) {
                                const u = JSON.parse(userStr);
                                userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || (u.email ? u.email.split('@')[0] : 'User'));
                                userPicture = u.picture || u.avatar || u.avatar_url || '';
                            }
                        } catch(e) {}

                        return (
                            <div className="bg-[#0f172a] rounded-[2rem] p-5 flex items-center gap-4 border border-white/5">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-400 to-indigo-600 p-0.5">
                                    <img 
                                        src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=000&color=fff`} 
                                        alt="User" 
                                        className="w-full h-full rounded-[1.1rem] object-cover" 
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=000&color=fff`;
                                        }}
                                    />
                                </div>
                                {isSidebarOpen && (
                                    <div className="overflow-hidden">
                                        <h3 className="text-sm font-black text-white truncate uppercase">{userName}</h3>
                                        <span className="text-[9px] font-black text-[#00e5ff] uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 mt-1 inline-block">Participant</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                                item.active 
                                ? 'sidebar-active-gradient text-[#00e5ff]' 
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <Link to="/" className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-[#00e5ff] hover:bg-[#00e5ff]/5 transition-all">
                        <Globe className="w-5 h-5" />
                        {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-[0.15em]">View Website</span>}
                    </Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-[0.15em]">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* --- Main Area --- */}
            <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-[#0a0e1a]/80 backdrop-blur-3xl px-8 py-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-[#00e5ff]" />
                        <h1 className="text-xl font-black text-white uppercase tracking-wider">Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        {(() => {
                            const userStr = localStorage.getItem('user');
                            let userName = 'User';
                            let userEmail = '';
                            let userPicture = '';
                            try {
                                if (userStr) {
                                    const u = JSON.parse(userStr);
                                    userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || (u.email ? u.email.split('@')[0] : 'User'));
                                    userEmail = u.email || '';
                                    userPicture = u.picture || u.avatar || u.avatar_url || '';
                                }
                            } catch(e) {}

                            return (
                                <>
                                    <div className="hidden md:flex flex-col items-end">
                                        <span className="text-xs font-black text-white uppercase">{userName}</span>
                                        <span className="text-[10px] font-bold text-slate-500">{userEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-4" ref={profileRef}>
                                        <button className="relative p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                                            <Bell className="w-5 h-5 text-slate-400 group-hover:text-[#00e5ff]" />
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0e1a]"></span>
                                        </button>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                                className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 hover:border-[#00e5ff]/50 transition-all active:scale-95"
                                            >
                                                <img 
                                                    src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00e5ff&color=0a0e1a`} 
                                                    alt="User" 
                                                    className="w-full h-full object-cover" 
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00e5ff&color=0a0e1a`;
                                                    }}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </header>

                <main className="p-8 space-y-12">
                    {/* Welcome Text */}
                    {(() => {
                        const userStr = localStorage.getItem('user');
                        let firstName = 'User';
                        let today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                        try {
                            if (userStr) {
                                const u = JSON.parse(userStr);
                                firstName = u.first_name || (u.name ? u.name.split(' ')[0] : 'User');
                            }
                        } catch(e) {}

                        return (
                            <div className="space-y-4">
                                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] ml-1">{today}</p>
                                <h2 className="text-5xl md:text-7xl font-black italic text-white tracking-[-0.02em] leading-tight">Welcome back, <span className="text-white opacity-80 uppercase">{firstName}</span></h2>
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-4 group">
                                    <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_10px_#00ff88]" />
                                    Live Study Status
                                </div>
                            </div>
                        );
                    })()}

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<TrendingUp />} value="94%" label="Medication Adherence" colorClass="text-[#00ff88]" />
                        <StatCard icon={<Trophy />} value="$120" label="Protocol Earnings" colorClass="text-[#fbbf24]" />
                        <StatCard icon={<Target />} value="18" label="Days in Study" colorClass="text-[#818cf8]" />
                        <StatCard icon={<ListTodo />} value="3" label="Pending Tasks" colorClass="text-[#22d3ee]" />
                    </div>

                    {/* Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-10">
                        {/* Task List - 2/3 width */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-[#00e5ff]" />
                                <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">Today's Tasks</h3>
                            </div>
                            
                            <div className="space-y-2">
                                <TaskItem title="Morning Supplement Log" duration="2 mins" />
                                <TaskItem title="Daily Symptoms Check-in" duration="5 mins" />
                                <TaskItem title="Weekly Energy Survey" duration="15 mins" isLast />
                            </div>
                        </div>

                        {/* Supplements & Insights - 1/3 width */}
                        <div className="space-y-10">
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <PlusCircle className="w-5 h-5 text-[#00e5ff]" />
                                    <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">Supplements</h3>
                                </div>
                                <div className="space-y-3 bg-[#0f172a]/40 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
                                    <SupplementToggle name="NAD+ Supplement (Capsule)" time="08:00 AM" isActive={true} />
                                    <SupplementToggle name="Multivitamin" time="08:00 AM" isActive={true} />
                                    <SupplementToggle name="NAD+ Supplement (Capsule)" time="02:00 PM" isActive={false} />
                                    <SupplementToggle name="Omega-3 (Fish Oil)" time="08:00 PM" isActive={false} />
                                </div>
                            </div>

                            {/* Study Insights */}
                            <div className="bg-[#0f172a]/40 rounded-[2.5rem] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/5 blur-3xl -mr-16 -mt-16 group-hover:bg-[#00e5ff]/10 transition-all duration-700" />
                                
                                <div className="flex items-center gap-3 relative z-10">
                                    <Activity className="w-5 h-5 text-[#00e5ff]" />
                                    <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">Study Insights</h3>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-end gap-3">
                                        <span className="text-6xl font-black text-white leading-none">84%</span>
                                        <span className="text-[11px] font-black text-[#00e5ff] uppercase tracking-[0.2em] mb-1">Compliance</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner border border-white/5">
                                        <div className="h-full bg-gradient-to-r from-cyan-400 to-[#00e5ff] shadow-[0_0_15px_#00e5ff]" style={{ width: '84%' }} />
                                    </div>
                                    <button className="w-full py-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-center justify-center gap-3 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all group/btn">
                                        Full Report <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform text-[#00e5ff]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
