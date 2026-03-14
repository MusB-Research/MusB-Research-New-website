import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Beaker, 
    Users, 
    Calendar, 
    Box, 
    Database, 
    ShieldAlert, 
    FileBarChart, 
    Settings,
    FileText,
    UsersRound,
    Search,
    Bell,
    Plus,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    CircleCheck,
    Clock,
    Truck,
    AlertTriangle,
    Globe,
    ChevronDown,
    MoreHorizontal,
    Download,
    Share2,
    Eye,
    Stethoscope,
    TrendingUp,
    MessageSquare,
    Activity,
    X
} from 'lucide-react';

type AdminModule = 'DASHBOARD' | 'STUDIES' | 'RECRUITMENT' | 'CONSENT' | 'FORMS' | 'VISITS' | 'SETUP' | 'KITS' | 'LABS' | 'REPORTS' | 'SETTINGS';

export default function AdminDashboard() {
    const [activeModule, setActiveModule] = useState<AdminModule>('DASHBOARD');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
        { id: 'SETUP', label: 'Study Setup', icon: Settings },
        { id: 'RECRUITMENT', label: 'Recruitment', icon: UsersRound },
        { id: 'CONSENT', label: 'Consent', icon: ShieldAlert },
        { id: 'FORMS', label: 'Forms & Questionnaires', icon: FileText },
        { id: 'VISITS', label: 'Visits & Assessments', icon: Stethoscope },
        { id: 'SETTINGS', label: 'Settings', icon: Settings },
    ];

    const renderHeader = () => (
        <header className="fixed top-0 left-0 right-0 h-24 z-50 bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-black italic shadow-lg shadow-cyan-500/20">
                        M
                    </div>
                    <h2 className="text-white font-black uppercase italic tracking-tighter text-xl">Command <span className="text-cyan-400">Center</span></h2>
                </div>
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search participants, studies, or shipping ID..." 
                        className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-all w-[400px]"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">System Online</span>
                </div>
                <button className="relative p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                    <Bell className="w-5 h-5 text-slate-300" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0B101B]"></span>
                </button>
                {(() => {
                    const userStr = localStorage.getItem('user');
                    let userName = 'Admin';
                    let userEmail = '';
                    let userPicture = '';
                    try {
                        if (userStr) {
                            const u = JSON.parse(userStr);
                            userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || (u.email ? u.email.split('@')[0] : 'Admin'));
                            userEmail = u.email || '';
                            userPicture = u.picture || u.avatar || u.avatar_url || '';
                        }
                    } catch(e) {}
                    
                    return (
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-white uppercase italic leading-none">{userName}</p>
                                <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest mt-1">Administrator</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                <img 
                                    src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`} 
                                    alt="Admin" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
                                    }}
                                />
                            </div>
                        </div>
                    );
                })()}
            </div>
        </header>
    );

    const renderSidebar = () => (
        <aside className="fixed left-0 top-24 bottom-0 w-72 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-6 z-40 overflow-y-auto custom-scrollbar">
            <nav className="space-y-1.5">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id as AdminModule)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${
                            activeModule === item.id 
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                            : 'text-slate-500 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400'}`} />
                        <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                        {activeModule === item.id && (
                            <motion.div layoutId="activeInd" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
                        )}
                    </button>
                ))}
            </nav>
        </aside>
    );

    return (
        <div className="min-h-screen bg-transparent">
            {renderHeader()}
            {renderSidebar()}
            <main className="ml-72 pt-32 pb-24 px-10">
                <AnimatePresence mode="wait">
                    {activeModule === 'DASHBOARD' && <DashboardModule />}
                    {activeModule === 'STUDIES' && <StudiesModule onAdd={() => setShowCreateModal(true)} />}
                    {activeModule === 'RECRUITMENT' && <RecruitmentModule />}
                    {activeModule === 'FORMS' && <FormBuilderModule />}
                    
                    {!['DASHBOARD', 'STUDIES', 'RECRUITMENT', 'FORMS'].includes(activeModule) && (
                        <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4"
                        >
                            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center">
                                <Clock className="w-10 h-10 text-slate-700" />
                            </div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{activeModule.replace('_', ' ')} <span className="text-cyan-400">Integrated</span></h2>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Module initialization in progress</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0B101B] border border-white/10 rounded-[3rem] p-12 overflow-hidden"
                        >
                            <div className="absolute top-8 right-8">
                                <button onClick={() => setShowCreateModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Initialize <span className="text-cyan-400">Study</span></h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 px-1">Configure core protocol details and launch sequence</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Protocol Title</label>
                                            <input type="text" placeholder="e.g. Metabolic Phase II" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/50 transition-all font-bold text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Internal ID / #</label>
                                            <input type="text" placeholder="MB-9921" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/50 transition-all font-bold text-xs" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Sponsor Organization</label>
                                        <input type="text" placeholder="Global Biotech Corp" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/50 transition-all font-bold text-xs" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Trial Model</label>
                                            <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-500/50 transition-all font-black uppercase tracking-widest text-[9px] appearance-none">
                                                <option>In-Person Clinical</option>
                                                <option>Virtual Trial</option>
                                                <option>Hybrid Model</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Target Enrollment</label>
                                            <input type="number" placeholder="250" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/50 transition-all font-bold text-xs" />
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all mt-4">Generate Protocol Blueprint</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- MODULE COMPONENTS ---

function DashboardModule() {
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="space-y-12"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Assigned Studies', val: '08', icon: Beaker },
                    { label: 'Active Leads', val: '242', icon: UsersRound },
                    { label: 'Appointments', val: '12', icon: Calendar },
                    { label: 'Pending Forms', val: '84', icon: FileText },
                ].map((stat) => (
                    <div key={stat.label} className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <stat.icon className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</h4>
                            <p className="text-4xl font-black text-white italic tracking-tighter leading-none mt-2">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12 space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8">
                         <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                             <TrendingUp className="w-5 h-5 text-cyan-400" />
                             Upcoming <span className="text-cyan-400">Visits</span>
                         </h3>
                         <div className="space-y-4">
                             {[
                                 { name: 'Sarah Miller', study: 'Metabolic Phase II', type: 'Screening', time: '10:00 AM' },
                                 { name: 'David Cho', study: 'VITAL-Age Study', type: 'Follow-up', time: '01:30 PM' },
                             ].map((visit, i) => (
                                 <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center font-black text-xs text-cyan-400">{visit.time.split(':')[0]}</div>
                                         <div>
                                             <p className="text-xs font-black text-white uppercase italic tracking-tight">{visit.name}</p>
                                             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{visit.study}</p>
                                         </div>
                                     </div>
                                     <button className="px-5 py-2 bg-white/5 hover:bg-cyan-500 hover:text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">Start Visit</button>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function StudiesModule({ onAdd }: { onAdd: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Assigned <span className="text-cyan-400">Studies</span></h2>
                <button onClick={onAdd} className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Initialize New Study
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                             <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
                        </div>
                        <div className="space-y-2">
                             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Metabolic <span className="text-cyan-400">Phase II</span></h3>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Protocol #M2A-9921</p>
                        </div>
                        <div className="space-y-4">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                 <span>Screening</span>
                                 <span>82/100</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-cyan-500" style={{ width: '82%' }}></div>
                             </div>
                        </div>
                        <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all">Manage Study</button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function RecruitmentModule() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Recruitment <span className="text-cyan-400">Board</span></h2>
                <div className="flex gap-4">
                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Upload Leads</button>
                    <button className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest">Manual Lead</button>
                </div>
            </div>

            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Candidate</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Source</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: 'Marcus Thompson', source: 'Online Intake', status: 'INTERESTED' },
                                { name: 'Elena Rodriguez', source: 'Social Media', status: 'SCREENING' },
                                { name: 'John D. Miller', source: 'Database Import', status: 'ELIGIBLE' },
                            ].map((lead, i) => (
                                <tr key={i} className="group hover:bg-white/5 transition-all">
                                    <td className="py-6 font-black text-white uppercase italic text-xs tracking-tight">{lead.name}</td>
                                    <td className="py-6 text-[10px] text-slate-400 font-black uppercase italic tracking-widest">{lead.source}</td>
                                    <td className="py-6 text-right">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 ${
                                            lead.status === 'ELIGIBLE' ? 'bg-emerald-500/10 text-emerald-400' : 
                                            lead.status === 'SCREENING' ? 'bg-indigo-500/10 text-indigo-400' :
                                            'bg-white/5 text-slate-400'
                                        }`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

function FormBuilderModule() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Form <span className="text-cyan-400">Builder</span></h2>
                <button className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-cyan-500/20">Design Blueprint</button>
            </div>
            
            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto">
                    <FileText className="w-10 h-10 text-slate-700" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">No Active Form <span className="text-cyan-400">Blueprint</span></h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 italic px-12">Select a template or start from scratch to build study-specific logic and conditional flows</p>
                </div>
            </div>
        </motion.div>
    );
}
