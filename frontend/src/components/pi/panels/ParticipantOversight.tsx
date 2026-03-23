import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Search, 
    Filter, 
    MoreHorizontal, 
    MessageSquare, 
    User, 
    ChevronRight, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    XCircle,
    TrendingUp,
    Download
} from 'lucide-react';

interface Participant {
    id: string;
    name: string;
    study: string;
    status: 'Screening' | 'Active' | 'Completed' | 'Withdrawn' | 'Fail';
    progress: number;
    lastVisit: string;
    risk: 'Low' | 'Medium' | 'High';
}

export default function ParticipantOversight({ onOpenProfile }: { onOpenProfile?: (id: string) => void }) {
    const [activeTab, setActiveTab] = useState<'All' | 'Screening' | 'Active' | 'Completed' | 'Fails'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const participants: Participant[] = [
        { id: 'SUB-001', name: 'Alice Johnson', study: 'Metabolic-202B', status: 'Active', progress: 65, lastVisit: '2026-03-15', risk: 'Low' },
        { id: 'SUB-002', name: 'Bob Smith', study: 'Metabolic-202B', status: 'Screening', progress: 10, lastVisit: '2026-03-20', risk: 'Medium' },
        { id: 'SUB-003', name: 'Charlie Davis', study: 'Metabolic-202B', status: 'Completed', progress: 100, lastVisit: '2026-03-10', risk: 'Low' },
        { id: 'SUB-004', name: 'Diana Prince', study: 'Metabolic-202B', status: 'Fail', progress: 5, lastVisit: '2026-03-18', risk: 'High' },
        { id: 'SUB-005', name: 'Edward Norton', study: 'Cognitive-X1', status: 'Active', progress: 40, lastVisit: '2026-03-19', risk: 'Low' },
    ];

    const filteredParticipants = participants.filter(p => {
        const matchesTab = activeTab === 'All' || 
                         (activeTab === 'Fails' ? p.status === 'Withdrawn' || p.status === 'Fail' : p.status === activeTab);
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Screening': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'Completed': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'Fail': 
            case 'Withdrawn': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Participant <span className="text-indigo-400">Oversight</span></h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Real-time Subject Portfolio Monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search Subject ID or Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-xs text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-64 uppercase tracking-widest"
                        />
                    </div>
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                        <Download className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-[#0B101B]/60 border border-white/5 rounded-2xl w-fit">
                {['All', 'Screening', 'Active', 'Completed', 'Fails'].map((tab: any) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Subject Information</th>
                            <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Clinical Status</th>
                            <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Trial Progress</th>
                            <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Visit</th>
                            <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredParticipants.map((p) => (
                                <motion.tr 
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white italic truncate">{p.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">{p.id} • {p.study}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(p.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                                            {p.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="w-48 space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] font-black text-slate-600 uppercase italic">Cohort Alpha</span>
                                                <span className="text-[10px] font-black text-white">{p.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${p.progress}%` }}
                                                    className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-400 italic">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{p.lastVisit}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onOpenProfile?.(p.id)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                Open Profile <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {filteredParticipants.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <Users className="w-12 h-12 text-slate-800 mx-auto" />
                        <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.2em] italic">No participants match your criteria</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
