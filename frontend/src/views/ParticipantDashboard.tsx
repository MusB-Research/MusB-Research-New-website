import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, 
    ClipboardList, 
    Box, 
    Activity, 
    MessageSquare, 
    FileText, 
    User, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ChevronRight,
    ArrowUpRight,
    Plus,
    Calendar,
    Bell,
    Settings,
    LogOut,
    Truck,
    PlayCircle,
    Download,
    ShieldCheck
} from 'lucide-react';

type TabType = 'HOME' | 'TASKS' | 'KIT' | 'LOGS' | 'MESSAGES' | 'DOCS' | 'PROFILE';

export default function ParticipantDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('HOME');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Mock User Data
    const user = {
        name: "Alex Johnson",
        study: "Phase II: Metabolic Wellness Study",
        progress: 65,
        nextMilestone: "Week 4 Clinical Check-in",
        daysToMilestone: 3
    };

    const navItems = [
        { id: 'HOME', label: 'Home', icon: Home },
        { id: 'TASKS', label: 'Tasks', icon: ClipboardList },
        { id: 'KIT', label: 'Study Kit', icon: Box },
        { id: 'LOGS', label: 'Logs', icon: Activity },
        { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
        { id: 'DOCS', label: 'Documents', icon: FileText },
        { id: 'PROFILE', label: 'Profile', icon: User },
    ];

    const renderHeader = () => (
        <header className="fixed top-24 left-0 right-0 z-40 px-4 md:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black italic shadow-lg">
                        M
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase italic tracking-tighter leading-none">Participant <span className="text-cyan-400">Portal</span></h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID: #MS-7822-VJ</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all relative">
                        <Bell className="w-5 h-5 text-slate-300" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-cyan-500 rounded-full border-2 border-[#0B101B]"></span>
                    </button>
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-all hidden md:flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-3 bg-cyan-500 md:hidden rounded-xl text-slate-950 shadow-lg"
                    >
                        <User className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );

    const renderSidebar = () => (
        <aside className="fixed left-8 top-56 bottom-8 w-64 hidden lg:flex flex-col bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl z-30">
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabType)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                            activeTab === item.id 
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_10px_20px_rgba(6,182,212,0.3)]' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-slate-950' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                        <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Need Help?</p>
                    <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                        Support Center
                    </button>
                </div>
            </div>
        </aside>
    );

    const renderContent = () => (
        <main className="lg:ml-80 pt-56 pb-24 px-4 md:px-8">
            <AnimatePresence mode="wait">
                {activeTab === 'HOME' && <HomeView user={user} />}
                {activeTab === 'TASKS' && <TasksView />}
                {activeTab === 'KIT' && <KitView />}
                {activeTab === 'LOGS' && <LogsView />}
                {activeTab === 'MESSAGES' && <MessagesView />}
                {activeTab === 'DOCS' && <DocsView />}
                {activeTab === 'PROFILE' && <ProfileView user={user} />}
            </AnimatePresence>
        </main>
    );

    return (
        <div className="min-h-screen bg-transparent text-slate-200">
            {renderHeader()}
            {renderSidebar()}
            {renderContent()}

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-6 left-4 right-4 h-20 lg:hidden bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-4 z-50 shadow-2xl">
                {navItems.slice(0, 5).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabType)}
                        className={`p-4 rounded-2xl transition-all ${
                            activeTab === item.id 
                            ? 'bg-cyan-500 text-slate-950 shadow-lg' 
                            : 'text-slate-500'
                        }`}
                    >
                        <item.icon className="w-6 h-6" />
                    </button>
                ))}
            </nav>
        </div>
    );
}

// --- SUB-VIEWS ---

function HomeView({ user }: { user: any }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
        >
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Welcome Back, <span className="text-cyan-400">{user.name.split(' ')[0]}</span></h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] ml-1">{user.study}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Today's Tasks</h3>
                                <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-[9px] font-black tracking-[0.2em] border border-cyan-500/20 uppercase">2 Pending</div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Morning Supplement', time: 'Before 9:00 AM', done: true },
                                    { label: 'Wellness Questionnaire', time: 'Due by 12:00 PM', done: false }
                                ].map((task, i) => (
                                    <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${task.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${task.done ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-white/10'}`}>
                                            {task.done && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-xs font-black uppercase tracking-tight ${task.done ? 'text-slate-400 line-through' : 'text-white'}`}>{task.label}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{task.time}</p>
                                        </div>
                                        {!task.done && <ChevronRight className="w-4 h-4 text-slate-600" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-cyan-500 rounded-[2.5rem] p-8 text-slate-950 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                             <Clock className="absolute top-8 right-8 w-32 h-32 opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                             <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Next Milestone</h3>
                                <p className="text-2xl font-black uppercase italic tracking-tight leading-tight mt-1">{user.nextMilestone}</p>
                             </div>
                             <div className="pt-8">
                                <div className="text-5xl font-black italic tracking-tighter leading-none">{user.daysToMilestone} <span className="text-lg non-italic uppercase tracking-widest opacity-60">Days</span></div>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50 italic">Countdown to clinic visit #3</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-4 italic">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { label: 'Log Supplement', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', icon: Plus },
                            { label: 'Report Symptom / AE', color: 'bg-red-500/10 border-red-500/20 text-red-500', icon: AlertCircle },
                        ].map((action, i) => (
                            <button key={i} className={`w-full p-6 rounded-[2rem] border ${action.color} flex items-center justify-between group hover:scale-[1.02] transition-all`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-current opacity-20 flex items-center justify-center">
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest">{action.label}</span>
                                </div>
                                <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>

                    <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500 italic">Total Adherence</span>
                            <span className="text-cyan-400">{user.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${user.progress}%` }} className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function TasksView() {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
        >
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Study <span className="text-cyan-400">Timeline</span></h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] ml-1 text-xs">Phased activities and requirements</p>
            </div>

            <div className="space-y-8 relative">
                <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-500/50 via-white/5 to-transparent"></div>
                
                {[
                    { phase: 'Baseline', label: 'Enrollment & Initial Setup', status: 'COMPLETED', date: 'Oct 12, 2025' },
                    { phase: 'Week 1', label: 'Supplement Phase Alpha', status: 'COMPLETED', date: 'Oct 19, 2025' },
                    { phase: 'Week 4', label: 'Interim Assessment Call', status: 'PENDING', date: 'Nov 12, 2025', active: true },
                    { phase: 'Day 90', label: 'Final Clinical Assessment', status: 'UPCOMING', date: 'Jan 15, 2026' }
                ].map((item, idx) => (
                    <div key={idx} className={`flex gap-10 items-start group ${item.active ? 'scale-[1.02]' : 'opacity-60 hover:opacity-100 transition-opacity'}`}>
                        <div className="relative z-10">
                            <div className={`w-20 h-20 rounded-[2rem] border flex flex-col items-center justify-center backdrop-blur-3xl transition-all duration-500 ${
                                item.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                item.active ? 'bg-cyan-500 text-slate-900 border-cyan-500 shadow-2xl' :
                                'bg-slate-950/50 border-white/5 text-slate-600'
                            }`}>
                                <span className="text-[10px] font-black uppercase tracking-tighter">{item.phase.split(' ')[0]}</span>
                                <span className="text-lg font-black italic -mt-1">{item.phase.split(' ')[1] || '0'}</span>
                            </div>
                        </div>
                        <div className={`flex-1 p-8 rounded-[3rem] border transition-all ${item.active ? 'bg-white/5 border-white/20 shadow-2xl' : 'bg-[#0f172a]/20 border-white/5'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${item.status === 'COMPLETED' ? 'text-emerald-500' : item.active ? 'text-cyan-400' : 'text-slate-600'}`}>{item.status}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.date}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{item.label}</h3>
                            <div className="mt-6 flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 italic">
                                    <Clock className="w-3 h-3 text-cyan-500" /> ~15 MINS
                                </div>
                                {item.active && (
                                    <button className="px-6 py-2 bg-cyan-500 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform active:scale-95">
                                        START ASSESSMENT
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function KitView() {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
        >
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Study <span className="text-cyan-400">Kit</span></h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] ml-1 text-xs">Logistics & Instructions</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-[#0f172a]/40 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-14 border border-white/10 space-y-10 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-3xl bg-cyan-500 flex items-center justify-center text-slate-950 shadow-xl">
                                <Truck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Outbound shipment</h3>
                                <p className="text-cyan-400 font-black text-[10px] uppercase tracking-widest mt-1">Status: In Transit</p>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500 italic">FedEx Standard Tracking</span>
                                <span className="text-white">#8124 9902 2211</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-cyan-500 animate-pulse transition-all" />
                            </div>
                            <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-3 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 transition-all">
                                Open Track Link <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button className="py-4 px-6 bg-cyan-500 text-slate-950 rounded-[2rem] text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-500/20">Confirm Received</button>
                            <button className="py-4 px-6 bg-white/5 border border-white/10 text-slate-400 rounded-[2rem] text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Report Issue</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-6 italic">Training & materials</h3>
                    <div className="space-y-4">
                        {[
                            { title: 'Kit Unboxing & Setup', type: 'VIDEO', dur: '4:20', icon: PlayCircle },
                            { title: 'Safe Usage Protocol', type: 'PDF', dur: '1.2MB', icon: FileText },
                            { title: 'Returning Your Samples', type: 'VIDEO', dur: '2:45', icon: PlayCircle }
                        ].map((doc, i) => (
                            <div key={i} className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] group hover:border-cyan-500/30 transition-all cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                                    <doc.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-cyan-400 italic mb-1">{doc.type}</div>
                                    <h4 className="text-sm font-black text-white uppercase italic tracking-widest ">{doc.title}</h4>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">{doc.dur}</span>
                                <Download className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function LogsView() {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
        >
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Daily <span className="text-cyan-400">Logs</span></h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] ml-1 text-xs">Phased activities and requirements</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                 {[
                    { title: 'Supplement', label: 'Alpha Complex', icon: Box, color: 'cyan' },
                    { title: 'Feelings', label: 'Wellness Daily', icon: Activity, color: 'indigo' },
                    { title: 'Adverse Events', label: 'Report AE/SAE', icon: AlertCircle, color: 'red' }
                 ].map((log, i) => (
                    <button key={i} className={`h-64 rounded-[3.5rem] bg-white/5 backdrop-blur-2xl border border-white/5 p-10 flex flex-col justify-between group hover:border-${log.color}-500/50 hover:bg-${log.color}-500/5 transition-all text-left relative overflow-hidden`}>
                         <div className={`w-14 h-14 rounded-3xl bg-${log.color}-500/10 flex items-center justify-center text-${log.color}-400 group-hover:bg-${log.color}-500 group-hover:text-slate-950 transition-all shadow-xl`}>
                            <log.icon className="w-7 h-7" />
                         </div>
                         <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic mb-2">{log.label}</h4>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{log.title}</h3>
                         </div>
                         <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-${log.color}-500/10 blur-[60px] rounded-full`}></div>
                         <ArrowUpRight className={`absolute top-10 right-10 w-6 h-6 text-slate-700 group-hover:text-${log.color}-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all`} />
                    </button>
                 ))}
            </div>
        </motion.div>
    );
}

function MessagesView() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[60vh] flex items-center justify-center text-center">
            <div className="space-y-6">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20">
                    <MessageSquare className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white uppercase italic">Secure Messenger</h2>
                    <p className="text-slate-400 text-sm italic tracking-widest font-black uppercase">Direct clinical support active</p>
                </div>
                <button className="px-10 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-white transition-all active:scale-95">Open Chat</button>
            </div>
        </motion.div>
    );
}

function DocsView() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">My <span className="text-cyan-400">Documents</span></h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] ml-1 text-xs">Legal, Protocols & Reports</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                {[
                    'Signed Informed Consent Form (ICF)',
                    'Official Study Protocol Summary',
                    'Privacy & Data Use Agreement',
                    'Baseline Lab Report (PDF)'
                ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <FileText className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            <span className="text-sm font-bold text-slate-300 uppercase italic">{doc}</span>
                        </div>
                        <Download className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function ProfileView({ user }: { user: any }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-12">
            <div className="text-center space-y-6">
                <div className="w-32 h-32 rounded-[3.5rem] bg-gradient-to-br from-cyan-500 to-indigo-600 p-1 mx-auto">
                    <div className="w-full h-full rounded-[3.4rem] bg-slate-950 flex items-center justify-center text-4xl font-black italic text-white border-4 border-slate-950 shadow-2xl overflow-hidden">
                        AJ
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{user.name}</h2>
                    <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-[10px]">Active participant since Oct 2025</p>
                </div>
            </div>

            <div className="bg-white/5 rounded-[3rem] border border-white/10 p-10 space-y-8 backdrop-blur-3xl">
                <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Email Address</label>
                        <p className="text-sm font-bold text-white uppercase italic">alex.j@example.com</p>
                    </div>
                    <div className="space-y-2 text-right">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Phone</label>
                        <p className="text-sm font-bold text-white uppercase italic">+1 (555) 782-2901</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Location</label>
                        <p className="text-sm font-bold text-white uppercase italic">TAMPA, FLORIDA, USA</p>
                    </div>
                    <div className="space-y-2 text-right">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">DOB</label>
                        <p className="text-sm font-bold text-white uppercase italic">MARCH 12, 1988</p>
                    </div>
                </div>
                
                <div className="pt-8 border-t border-white/5 flex gap-4">
                    <button className="flex-1 py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-cyan-500 transition-all">Edit Profile</button>
                    <button className="p-4 bg-white/5 hover:bg-red-500/10 rounded-2xl border border-white/5 text-slate-500 hover:text-red-500 transition-all"><Settings className="w-5 h-5" /></button>
                </div>
            </div>

            {/* GDPR & Privacy Compliance Section */}
            <div className="bg-red-500/5 rounded-[3rem] border border-red-500/10 p-10 space-y-8 backdrop-blur-3xl">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Privacy & <span className="text-red-400">Compliance</span></h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                        MusB Research adheres to global clinical data standards including <span className="text-slate-300">HIPAA (USA)</span> and <span className="text-slate-300">GDPR (EU/UK)</span>. You have full control over your participation and personal health information.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">Regional Settings</h4>
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Detected Timezone</span>
                                <span className="text-cyan-400">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-white text-[9px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group">
                                <span>Withdraw from Study</span>
                                <ArrowUpRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-all text-red-400" />
                            </button>
                            <button className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-white text-[9px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group">
                                <span>Request Data Deletion (GDPR)</span>
                                <ArrowUpRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-all text-red-400" />
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest italic">
                    Refer to the <span className="text-slate-400 underline cursor-pointer">Privacy & Data Use Agreement</span> for details.
                </p>
            </div>
        </motion.div>
    );
}
