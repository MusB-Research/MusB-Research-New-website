import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Search, 
    Filter, 
    MoreVertical, 
    Download, 
    Plus,
    Tag,
    Beaker,
    Activity,
    ChevronRight,
    SearchX
} from 'lucide-react';

interface Participant {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: 'INTERESTED' | 'SCREENING' | 'ELIGIBLE' | 'ENROLLED' | 'FAIL' | 'WITHDREW';
    study_title: string;
    date_joined: string;
}

const MOCK_PARTICIPANTS: Participant[] = [
    { id: '1', first_name: 'Marcus', last_name: 'Thompson', email: 'm.thompson@example.com', status: 'ENROLLED', study_title: 'Metabolic Phase II', date_joined: '2026-02-15' },
    { id: '2', first_name: 'Elena', last_name: 'Rodriguez', email: 'elena.r@web.de', status: 'SCREENING', study_title: 'VITAL-Age Study', date_joined: '2026-03-01' },
    { id: '3', first_name: 'Sarah', last_name: 'Miller', email: 'smiller@clinical.org', status: 'ELIGIBLE', study_title: 'Metabolic Phase II', date_joined: '2026-03-10' },
    { id: '4', first_name: 'David', last_name: 'Cho', email: 'dcho@tech.edu', status: 'WITHDREW', study_title: 'Sleep Pattern Alpha', date_joined: '2026-01-20' },
    { id: '5', first_name: 'John', last_name: 'Miller', email: 'john.m@gmail.com', status: 'INTERESTED', study_title: 'Metabolic Phase II', date_joined: '2026-03-14' },
];

export default function ParticipantsModule() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const filtered = MOCK_PARTICIPANTS.filter(p => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ENROLLED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'ELIGIBLE': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            case 'SCREENING': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'FAIL': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'WITHDREW': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            default: return 'bg-white/5 text-slate-400 border-white/10';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Participant <span className="text-cyan-400">Directory</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Unified Cross-Protocol Subject Records
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <Plus className="w-4 h-4" /> Add Record
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Find by name, email, or internal ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-xs text-white outline-none focus:border-cyan-500/50 transition-all font-bold uppercase tracking-widest"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                         <Filter className="w-4 h-4 text-cyan-400" />
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status:</span>
                         <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                         >
                            <option value="ALL">All Subjects</option>
                            <option value="ENROLLED">Enrolled</option>
                            <option value="ELIGIBLE">Eligible</option>
                            <option value="SCREENING">Screening</option>
                            <option value="WITHDREW">Withdrew</option>
                            <option value="FAIL">Screen Fail</option>
                         </select>
                    </div>
                </div>

                {/* Dense Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-6 pt-2 pl-4 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Subject</th>
                                <th className="pb-6 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Protocol</th>
                                <th className="pb-6 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Phase Status</th>
                                <th className="pb-6 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Onboarding</th>
                                <th className="pb-6 pt-2 text-right pr-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((p) => (
                                    <motion.tr 
                                        layout
                                        key={p.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="group hover:bg-white/5 transition-all cursor-pointer"
                                    >
                                        <td className="py-6 pl-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-slate-400 group-hover:text-cyan-400 transition-colors">
                                                    {p.first_name[0]}{p.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase italic tracking-tight">{p.first_name} {p.last_name}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold tracking-widest mt-1 lowercase">{p.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex items-center gap-2">
                                                <Beaker className="w-3.5 h-3.5 text-indigo-400" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-tight">{p.study_title}</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5 text-slate-600" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.date_joined}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 pr-4 text-right">
                                            <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-500 hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="py-24 text-center space-y-4">
                            <SearchX className="w-12 h-12 text-slate-800 mx-auto" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">No active records match the criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
