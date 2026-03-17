import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Beaker, 
    Plus, 
    Search, 
    Filter, 
    MoreHorizontal, 
    ExternalLink, 
    ArrowRight,
    Target,
    Users,
    Activity
} from 'lucide-react';

interface Study {
    id: number;
    title: string;
    protocol_id: string;
    status: string;
    actual_screened: number;
    target_screened: number;
    sponsor_name?: string;
}

interface StudiesModuleProps {
    studies: Study[];
    onAdd: () => void;
    onEdit: (study: Study) => void;
    onLaunch: (id: number) => void;
}

export default function StudiesModule({ studies, onAdd, onEdit, onLaunch }: StudiesModuleProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const filteredStudies = studies.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             s.protocol_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Study <span className="text-cyan-400">Lifecycle</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Protocol management and recruitment tracking
                    </p>
                </div>
                <button 
                    onClick={onAdd}
                    className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all self-start"
                >
                    <Plus className="w-4 h-4" /> Initialize New Protocol
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search protocols, sponsors, or study IDs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-xs text-white outline-none focus:border-cyan-500/50 transition-all font-bold uppercase tracking-widest placeholder:text-slate-700 placeholder:italic"
                    />
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
                    {['ALL', 'RECRUITING', 'ACTIVE', 'PAUSED', 'COMPLETED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === status 
                                ? 'bg-cyan-500 text-slate-950 shadow-lg' 
                                : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredStudies.map((study, i) => (
                        <motion.div
                            layout
                            key={study.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8 relative group overflow-hidden hover:border-cyan-500/30 transition-all"
                        >
                            {/* Glass background decoration */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full group-hover:bg-cyan-500/10 transition-colors" />

                            {/* Card Header */}
                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Beaker className="w-4 h-4 text-cyan-400" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{study.protocol_id}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter line-clamp-2 leading-none">
                                        {study.title}
                                    </h3>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                        study.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        study.status === 'RECRUITING' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                        study.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        study.status === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                        'bg-white/5 text-slate-500 border-white/10'
                                    }`}>
                                        {study.status}
                                    </span>
                                </div>
                            </div>

                            {/* Metrics Section */}
                            <div className="space-y-6 bg-white/5 rounded-[2rem] p-6 border border-white/5">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Target className="w-3 h-3" />
                                            <span>Recruitment Progress</span>
                                        </div>
                                        <span className="text-white italic">{study.actual_screened} / {study.target_screened || 100}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((study.actual_screened / (study.target_screened || 100)) * 100, 100)}%` }}
                                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Retention</p>
                                        <p className="text-lg font-black text-white italic tracking-tighter mt-1">98.2%</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Compliance</p>
                                        <p className="text-lg font-black text-white italic tracking-tighter mt-1">94.5%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="pt-2 flex flex-col gap-3">
                                {['PAUSED'].includes(study.status) ? (
                                    <button 
                                        onClick={() => onLaunch(study.id)}
                                        className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                                    >
                                        <Activity className="w-4 h-4 animate-pulse" /> Launch Protocol
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => onEdit(study)}
                                        className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-slate-950 transition-all flex items-center justify-center gap-3 group/btn"
                                    >
                                        Manage Study <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                )}
                                
                                <div className="flex justify-between gap-3">
                                    <button className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-white transition-all">Analytics</button>
                                    <button className="px-4 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-2xl hover:text-white transition-all">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredStudies.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="col-span-1 md:col-span-2 lg:col-span-3 py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem] text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-slate-700">
                                <Search className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-white font-black uppercase italic tracking-tight">No Protocols Found</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Adjust filters or search criteria</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
