import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Beaker, 
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
    Stethoscope,
    UsersRound,
    Clock,
    ArrowUpRight
} from 'lucide-react';

type PIModule = 'OVERSIGHT' | 'STUDIES' | 'PARTICIPANTS' | 'MESSAGES' | 'REPORTS';

export default function PIDashboard() {
    const [activeModule, setActiveModule] = useState<PIModule>('OVERSIGHT');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const navItems = [
        { id: 'OVERSIGHT', label: 'Scientific Oversight', icon: Activity },
        { id: 'STUDIES', label: 'My Studies', icon: Beaker },
        { id: 'PARTICIPANTS', label: 'Subject Review', icon: UsersRound },
        { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
        { id: 'REPORTS', label: 'Analytics', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-transparent">
             <header className="fixed top-0 left-0 right-0 h-24 z-50 bg-[#0B101B]/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-12">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-600/20">
                            PI
                        </div>
                        <h2 className="text-white font-black uppercase italic tracking-tighter text-xl">PI <span className="text-indigo-400">Portal</span></h2>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                        <Bell className="w-5 h-5 text-slate-300" />
                    </button>
                    {(() => {
                        const userStr = localStorage.getItem('user');
                        let userName = 'PI';
                        let userPicture = '';
                        try {
                            if (userStr) {
                                const u = JSON.parse(userStr);
                                userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || (u.email ? u.email.split('@')[0] : 'PI'));
                                userPicture = u.picture || u.avatar || u.avatar_url || '';
                            }
                        } catch(e) {}

                        return (
                            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                                <div className="text-right">
                                    <p className="text-xs font-black text-white uppercase italic leading-none">{userName}</p>
                                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Principal Investigator</p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                    <img 
                                        src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=indigo&color=fff`} 
                                        alt="PI" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=indigo&color=fff`;
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </header>

            <aside className="fixed left-0 top-24 bottom-0 w-72 bg-[#0B101B]/40 backdrop-blur-3xl border-r border-white/5 p-8 z-40">
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveModule(item.id as PIModule)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                                activeModule === item.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <item.icon className={`w-4 h-4 ${activeModule === item.id ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="ml-72 pt-32 pb-24 px-12">
                <AnimatePresence mode="wait">
                    {activeModule === 'OVERSIGHT' && <OversightModule />}
                    {activeModule === 'STUDIES' && <StudyOverviewModule onAdd={() => setShowCreateModal(true)} />}
                </AnimatePresence>
            </main>

            {/* Create Study Modal - Reused logic for consistency */}
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
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Initialize <span className="text-indigo-400">Research Protocol</span></h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 px-1">Define scientific parameters and investigator oversight</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Protocol Title</label>
                                            <input type="text" placeholder="e.g. Oncology Phase I" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Protocol Number</label>
                                            <input type="text" placeholder="PRT-2024-X1" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Study Model</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500/50 transition-all font-black uppercase tracking-widest text-[9px] appearance-none">
                                            <option>Randomized Controlled Trial (RCT)</option>
                                            <option>Observational Study</option>
                                            <option>Open Label</option>
                                        </select>
                                    </div>
                                </div>

                                <button className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all mt-4">Generate Research Framework</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OversightModule() {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Active Protocols', val: '04', icon: Beaker, color: 'indigo' },
                    { label: 'Total Subjects', val: '1,240', icon: UsersRound, color: 'emerald' },
                    { label: 'Critical Alerts', val: '02', icon: Activity, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-6">
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
        </motion.div>
    );
}

function StudyOverviewModule({ onAdd }: { onAdd: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Research <span className="text-indigo-400">Portfolio</span></h2>
                <button onClick={onAdd} className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3">
                    <Plus className="w-4 h-4" /> Initialize Protocol
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-[#0B101B]/40 border border-white/10 rounded-[3rem] p-10 space-y-8 relative group cursor-pointer hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start">
                             <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                 <Beaker className="w-7 h-7" />
                             </div>
                             <span className="px-5 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Protocol Approved</span>
                        </div>
                        <div>
                             <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Neuro-Gen <span className="text-indigo-400">Phase I</span></h3>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 italic">Protocol #NG-2024-01</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/5">
                                 <p className="text-[8px] font-black text-slate-500 uppercase">Subjects</p>
                                 <p className="text-lg font-black text-white italic mt-1">142/200</p>
                            </div>
                            <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/5">
                                 <p className="text-[8px] font-black text-slate-500 uppercase">Efficacy</p>
                                 <p className="text-lg font-black text-indigo-400 italic mt-1">94.2%</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
