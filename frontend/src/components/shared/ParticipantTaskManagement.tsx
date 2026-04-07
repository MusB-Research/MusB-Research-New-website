import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, Calendar, Clock, Lock, CheckCircle2, AlertCircle, Search, Filter, Shield, User, HelpCircle, ArrowRight } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface ParticipantTask {
    id: string;
    participant_name: string;
    protocol_id: string;
    title: string;
    due_date: string;
    status: string;
    grace_period: number;
    delay_allowed: number;
}

export default function ParticipantTaskManagement({ primaryColor = 'indigo' }: { primaryColor?: string }) {
    const [tasks, setTasks] = useState<ParticipantTask[]>([
        { id: '1', participant_name: 'John Doe', protocol_id: 'STUDY-101', title: 'Daily Health Log', due_date: '2026-04-05', status: 'OVERDUE', grace_period: 5, delay_allowed: 2 },
        { id: '2', participant_name: 'Alice Smith', protocol_id: 'STUDY-101', title: 'Baseline Bio-Scan', due_date: '2026-04-10', status: 'UPCOMING', grace_period: 5, delay_allowed: 2 },
        { id: '3', participant_name: 'Bob Wilson', protocol_id: 'STUDY-202', title: 'Post-Dose Feedback', due_date: '2026-04-01', status: 'LOCKED', grace_period: 5, delay_allowed: 2 },
    ]);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'OVERDUE': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'LOCKED': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        }
    };

    const colorHex = primaryColor === 'teal' ? '#14b8a6' : '#6366f1';

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        Participant <span style={{ color: colorHex }}>Task Monitor</span>
                    </h2>
                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">
                        Control research protocols, deadlines, and compliance rules.
                    </p>
                </div>
                <button 
                    onClick={() => setShowNewTaskModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl"
                >
                    <Plus className="w-4 h-4" /> Create Study Mission
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 {[
                    { label: 'Active Missions', count: 124, icon: List, color: 'cyan' },
                    { label: 'Overdue Syncs', count: 12, icon: AlertCircle, color: 'red' },
                    { label: 'Locked Protocols', count: 8, icon: Lock, color: 'amber' },
                    { label: 'Completion Rate', count: '92%', icon: CheckCircle2, color: 'emerald' }
                 ].map((stat, i) => (
                    <div key={i} className="bg-[#0B1222] border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-black text-white italic">{stat.count}</div>
                    </div>
                 ))}
            </div>

            <div className="bg-[#0a101f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl flex-1 max-w-md group focus-within:border-cyan-500/50 transition-all">
                        <Search className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY PARTICIPANT OR PROTOCOL ID..." 
                            className="bg-transparent border-none outline-none text-white text-[12px] font-black tracking-widest uppercase w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="px-10 py-6 text-[12px] font-black text-slate-500 uppercase tracking-widest">Participant / Study</th>
                                <th className="px-10 py-6 text-[12px] font-black text-slate-500 uppercase tracking-widest">Mission Title</th>
                                <th className="px-10 py-6 text-[12px] font-black text-slate-500 uppercase tracking-widest">Deadline</th>
                                <th className="px-10 py-6 text-[12px] font-black text-slate-500 uppercase tracking-widest">Status / Intelligence</th>
                                <th className="px-10 py-6 text-[12px] font-black text-slate-500 uppercase tracking-widest text-right">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id} className="border-b border-white/5 group hover:bg-white/[0.01] transition-all">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 italic font-black text-white text-[12px]">
                                                {task.participant_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-white uppercase tracking-tight">{task.participant_name}</div>
                                                <div className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">{task.protocol_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                            <span className="text-[13px] font-black text-white uppercase tracking-tight italic">{task.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-600" />
                                            <span className="text-[12px] font-bold text-slate-300 uppercase">{task.due_date}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-2">
                                            <div className={`px-4 py-1.5 rounded-full border text-[12px] font-black uppercase tracking-widest w-fit ${getStatusStyle(task.status)}`}>
                                                {task.status}
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-600 uppercase italic">
                                                Rules: {task.delay_allowed}d Delay | {task.grace_period}d Grace
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3 transition-opacity">
                                            <button 
                                                onClick={() => alert(`Reviewing clinical compliance metrics for ${task.participant_name}...`)}
                                                className="p-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all shadow-lg"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    alert(`Overriding protocol rules for ${task.title}. Subject now granted 48h emergency extension.`);
                                                    const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'LOCKED' } : t);
                                                    setTasks(updated);
                                                }}
                                                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/40"
                                            >
                                                Override Rules
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* NEW TASK MODAL */}
            <AnimatePresence>
                {showNewTaskModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowNewTaskModal(false)}
                            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 50 }} 
                            className="relative w-full max-w-2xl bg-[#0B101B] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="p-10 space-y-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Initialize <span className="text-cyan-400">Study Mission</span></h3>
                                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Configure protocol timing and compliance thresholds.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2 space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Mission Title</label>
                                        <input type="text" placeholder="E.G. FASTING GLUCOSE LOG" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Deadline Date</label>
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign to Participant ID</label>
                                        <input type="text" placeholder="ID-49201" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Delay Allowed (Days)</label>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between">
                                            <span className="text-white font-black text-sm">2</span>
                                            <div className="flex flex-col gap-1">
                                                <button className="text-cyan-400 hover:text-white transition-colors">▲</button>
                                                <button className="text-cyan-400 hover:text-white transition-colors">▼</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Grace Period (Days)</label>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between">
                                            <span className="text-white font-black text-sm">5</span>
                                            <div className="flex flex-col gap-1">
                                                <button className="text-cyan-400 hover:text-white transition-colors">▲</button>
                                                <button className="text-cyan-400 hover:text-white transition-colors">▼</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        onClick={() => setShowNewTaskModal(false)}
                                        className="flex-1 bg-white/5 border border-white/10 text-slate-400 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.25em] italic hover:bg-white/10 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        className="flex-1 bg-cyan-600 text-white py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.25em] italic hover:bg-cyan-500 transition-all shadow-[0_0_50px_rgba(8,145,178,0.3)]"
                                    >
                                        Deploy Mission
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


