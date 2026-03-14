import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, 
    Activity, 
    Users, 
    Server, 
    Lock, 
    Globe, 
    Zap, 
    BarChart3, 
    Layers,
    Terminal,
    Bell,
    Settings,
    Search,
    ChevronRight,
    ArrowUpRight,
    Cpu,
    HardDrive,
    Network,
    Plus,
    Beaker,
    UsersRound,
    Briefcase,
    ShieldAlert,
    Trash2,
    Eye,
    MessageSquare
} from 'lucide-react';

type SuperAdminModule = 'DASHBOARD' | 'STUDIES' | 'SPONSORS' | 'USERS' | 'SYSTEM' | 'AUDIT';

export default function SuperAdminDashboard() {
    const [activeModule, setActiveModule] = useState<SuperAdminModule>('DASHBOARD');
    const [systemHealth, setSystemHealth] = useState({
        api: '99.9%',
        db: 'Optimal',
        load: '12%',
        uptime: '342d 12h'
    });

    const navItems = [
        { id: 'DASHBOARD', label: 'Global Overview', icon: Activity },
        { id: 'STUDIES', label: 'All Studies', icon: Beaker },
        { id: 'SPONSORS', label: 'Sponsor Accounts', icon: Briefcase },
        { id: 'USERS', label: 'User Directory', icon: UsersRound },
        { id: 'AUDIT', label: 'Full Audit Trail', icon: Terminal },
        { id: 'SYSTEM', label: 'Node Health', icon: Cpu },
    ];

    return (
        <div className="min-h-screen bg-transparent text-slate-200">
            {/* Sidebar Overlay */}
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#0B101B]/80 backdrop-blur-3xl border-r border-white/5 p-8 z-50 overflow-y-auto">
                <Link to="/" className="flex items-center gap-3 mb-12 group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">System <span className="text-indigo-400">Main</span></h2>
                </Link>

                {(() => {
                    const userStr = localStorage.getItem('user');
                    let userName = 'Super Admin';
                    let userPicture = '';
                    try {
                        if (userStr) {
                            const u = JSON.parse(userStr);
                            userName = u.full_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || (u.email ? u.email.split('@')[0] : 'Super Admin')));
                            userPicture = u.picture || u.avatar || u.avatar_url || '';
                        }
                    } catch(e) {}

                    return (
                        <div className="mb-10 p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10">
                                <img 
                                    src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`} 
                                    alt="Super Admin" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff`;
                                    }}
                                />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-black text-white uppercase italic truncate">{userName}</p>
                                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Global Admin</p>
                            </div>
                        </div>
                    );
                })()}

                <nav className="space-y-1.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveModule(item.id as SuperAdminModule)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                                activeModule === item.id 
                                ? 'bg-indigo-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.4)]' 
                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-20 p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black uppercase text-indigo-400">Infrastructure</span>
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                            <span>Storage</span>
                            <span>42%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[42%]"></div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="pl-72 pt-32 pb-24 px-10">
                <AnimatePresence mode="wait">
                    {activeModule === 'DASHBOARD' && <OverviewModule systemHealth={systemHealth} />}
                    {activeModule === 'STUDIES' && <StudyMgmtModule />}
                    {activeModule === 'SPONSORS' && <SponsorMgmtModule />}
                    
                    {!['DASHBOARD', 'STUDIES', 'SPONSORS'].includes(activeModule) && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center">
                                <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{activeModule} <span className="text-indigo-400">Node</span></h2>
                                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">Module synchronization in progress</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// --- SUB-MODULES ---

function OverviewModule({ systemHealth }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12 max-w-[1400px]"
        >
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">System <span className="text-indigo-400">Oversight</span></h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Universal RBAC & Data Persistence Monitoring</p>
                </div>
                <div className="flex gap-4">
                    {Object.entries(systemHealth).map(([k, v]: [string, any]) => (
                        <div key={k} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase">{k}</span>
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-tighter italic">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Organizations', val: '42', icon: Layers, color: 'emerald' },
                    { label: 'Live Clinical Trials', val: '286', icon: Beaker, color: 'indigo' },
                    { label: 'System Transactions', val: '1.2M', icon: Zap, color: 'cyan' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-6 group hover:border-indigo-500/30 transition-all">
                        <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center`}>
                            <stat.icon className={`w-7 h-7 text-${stat.color}-400`} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</h4>
                            <p className="text-5xl font-black text-white italic tracking-tighter mt-2">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-indigo-400" />
                        Global <span className="text-indigo-400">Security Stream</span>
                    </h3>
                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">Download Audit PDF</button>
                </div>
                <div className="space-y-4">
                    {[
                        { action: 'Admin Role Escalated', user: 'sarah.s@musb.com', time: '4m ago', status: 'CRITICAL' },
                        { action: 'Protocol Approved', user: 'PI Michael Chen', time: '22m ago', status: 'SUCCESS' },
                        { action: 'Database Index Sync', user: 'System (Automated)', time: '1h ago', status: 'INFO' },
                    ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[1.5rem] border border-white/5">
                            <div className="flex items-center gap-6">
                                <div className={`w-2 h-2 rounded-full ${log.status === 'CRITICAL' ? 'bg-red-500 animate-pulse' : log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase italic tracking-tight">{log.action}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{log.user}</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">{log.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function StudyMgmtModule() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Global <span className="text-indigo-400">Studies</span></h2>
                <button className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-3">
                    <Plus className="w-4 h-4" /> Initialize Universal Study
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { title: 'Metabolic Phase II', proto: 'MB-9921', status: 'ACTIVE', progress: 78 },
                    { title: 'VITAL-Age Study', proto: 'MB-1120', status: 'RECRUITING', progress: 42 },
                    { title: 'Cardiac Monitoring', proto: 'MB-4420', status: 'DRAFT', progress: 0 },
                ].map((study, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                 <Beaker className="w-6 h-6" />
                             </div>
                             <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${study.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                 {study.status}
                             </span>
                        </div>
                        <div>
                             <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{study.title}</h3>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Protocol #{study.proto}</p>
                        </div>
                        <div className="space-y-4">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                 <span>Global Enrolment</span>
                                 <span>{study.progress}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${study.progress}%` }}></div>
                             </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all">Audit Data</button>
                            <button className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function SponsorMgmtModule() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Sponsor <span className="text-indigo-400">Networks</span></h2>
                <button className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3">
                    <Plus className="w-4 h-4" /> Create Sponsor Account
                </button>
            </div>

            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Organization</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Core Team</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Active Trials</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Identity Security</th>
                                <th className="pb-6 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: 'Global Biotech Corp', team: '12 Users', trials: 0.08, roles: ['Admin', 'Viewer', 'Scientist'] },
                                { name: 'Astra Pharmaceuticals', team: '28 Users', trials: 0.15, roles: ['Director', 'Auditor'] },
                                { name: 'Alpha Clinical Labs', team: '05 Users', trials: 0.02, roles: ['Admin', 'Lab Tech'] },
                            ].map((sponsor, i) => (
                                <tr key={i} className="group hover:bg-white/5 transition-all">
                                    <td className="py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-xs text-indigo-400">
                                                {sponsor.name[0]}
                                            </div>
                                            <span className="font-black text-white uppercase italic text-xs tracking-tight">{sponsor.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-8">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-300 font-bold">{sponsor.team}</span>
                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Teams Managed</span>
                                        </div>
                                    </td>
                                    <td className="py-8">
                                        <span className="text-xs text-indigo-400 font-black italic uppercase tracking-tighter">{sponsor.trials * 100} Projects</span>
                                    </td>
                                    <td className="py-8">
                                        <div className="flex gap-2">
                                            {sponsor.roles.map(r => (
                                                <span key={r} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">{r}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-8 text-right">
                                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white transition-all"><Eye className="w-4 h-4" /></button>
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
