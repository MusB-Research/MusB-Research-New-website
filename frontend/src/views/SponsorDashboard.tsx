import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Beaker, 
    TrendingUp, 
    Database, 
    FileBarChart, 
    FileText, 
    MessageSquare, 
    Settings,
    Search,
    Bell,
    CheckCircle2,
    PieChart,
    BarChart,
    ArrowUpRight,
    Users,
    Download,
    Share2,
    EyeOff
} from 'lucide-react';

type SponsorModule = 'DASHBOARD' | 'STUDIES' | 'RECRUITMENT' | 'DATA' | 'REPORTS' | 'DOCS' | 'MESSAGES';

export default function SponsorDashboard() {
    const [activeModule, setActiveModule] = useState<SponsorModule>('DASHBOARD');

    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
        { id: 'RECRUITMENT', label: 'Recruitment Metrics', icon: TrendingUp },
        { id: 'DATA', label: 'De-identified Data', icon: Database },
        { id: 'REPORTS', label: 'Analytics & Reports', icon: FileBarChart },
        { id: 'DOCS', label: 'Shared Documents', icon: FileText },
        { id: 'MESSAGES', label: 'Study Communication', icon: MessageSquare },
    ];

    const renderHeader = () => (
        <header className="fixed top-0 left-0 right-0 h-24 z-50 bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-8">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black italic shadow-lg shadow-emerald-500/20">
                        S
                    </div>
                    <h2 className="text-white font-black uppercase italic tracking-tighter text-xl">Sponsor <span className="text-emerald-400">Portfolio</span></h2>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Privacy Guard Active</span>
                </div>
                {(() => {
                    const userStr = localStorage.getItem('user');
                    let userName = 'Sponsor';
                    let userPicture = '';
                    try {
                        if (userStr) {
                            const u = JSON.parse(userStr);
                            userName = u.organization || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || (u.email ? u.email.split('@')[0] : 'Sponsor')));
                            userPicture = u.picture || u.avatar || u.avatar_url || '';
                        }
                    } catch(e) {}

                    return (
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-white uppercase italic leading-none">{userName}</p>
                                <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Sponsor Account</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                <img 
                                    src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=emerald&color=fff`} 
                                    alt="Sponsor" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=emerald&color=fff`;
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
        <aside className="fixed left-0 top-24 bottom-0 w-72 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-6 z-40">
            <nav className="space-y-1.5">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id as SponsorModule)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${
                            activeModule === item.id 
                            ? 'bg-emerald-500 text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.3)]' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeModule === item.id ? 'text-slate-950' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                        <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );

    return (
        <div className="min-h-screen bg-transparent text-slate-200">
            {renderHeader()}
            {renderSidebar()}
            
            <main className="pl-72 pt-24 min-h-screen">
                <div className="p-10 space-y-12">
                    <AnimatePresence mode="wait">
                        {activeModule === 'DASHBOARD' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Study Progress', val: '72%', icon: trendingUp, color: 'emerald' },
                                        { label: 'Total Enrolled', val: '240', icon: Users, color: 'cyan' },
                                        { label: 'Active Arms', val: '04', icon: PieChart, color: 'indigo' },
                                        { label: 'Data Points Collected', val: '12K+', icon: Database, color: 'emerald' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                                            <div className={`w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center`}>
                                                <TrendingUp className={`w-6 h-6 text-emerald-400`} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</h4>
                                                <p className="text-4xl font-black text-white italic tracking-tighter leading-none mt-2">{stat.val}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid lg:grid-cols-12 gap-10">
                                    <div className="lg:col-span-12 bg-[#0B101B]/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                                <Database className="w-5 h-5 text-emerald-400" />
                                                De-identified <span className="text-emerald-400">Participant Stream</span>
                                            </h3>
                                            <button className="px-6 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <Download className="w-3.5 h-3.5" /> Export Data Set
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/5">
                                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Participant ID</th>
                                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Age</th>
                                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Gender</th>
                                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Assignment</th>
                                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Visit Status</th>
                                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Progress</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {[
                                                        { id: 'SUB-001-RX', age: 42, gender: 'M', arm: 'Group A', status: 'Visit 4 Done', prog: 65 },
                                                        { id: 'SUB-002-RX', age: 38, gender: 'F', arm: 'Group B', status: 'Visit 2 Done', prog: 30 },
                                                        { id: 'SUB-003-RX', age: 55, gender: 'F', arm: 'Group A', status: 'Screening', prog: 10 },
                                                        { id: 'SUB-004-RX', age: 29, gender: 'M', arm: 'Group B', status: 'Completed', prog: 100 },
                                                    ].map((row, i) => (
                                                        <tr key={i} className="group hover:bg-white/5 transition-all">
                                                            <td className="py-6 font-black text-white italic text-xs uppercase tracking-tight">{row.id}</td>
                                                            <td className="py-6 text-xs text-slate-400 font-bold">{row.age}</td>
                                                            <td className="py-6 text-xs text-slate-400 font-bold">{row.gender}</td>
                                                            <td className="py-6">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${row.arm === 'Group A' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                                                    {row.arm}
                                                                </span>
                                                            </td>
                                                            <td className="py-6 text-xs text-slate-300 font-bold uppercase italic">{row.status}</td>
                                                            <td className="py-6 text-right">
                                                                <div className="flex items-center justify-end gap-3">
                                                                    <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-emerald-500" style={{ width: `${row.prog}%` }}></div>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-emerald-400">{row.prog}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

const trendingUp = TrendingUp;
