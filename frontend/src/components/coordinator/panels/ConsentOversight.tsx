import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileSignature, 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    History, 
    Download, 
    FileCheck, 
    Users,
    ShieldCheck,
    ChevronRight,
    MessageSquare,
    ScrollText
} from 'lucide-react';

interface ConsentRecord {
    id: string;
    subjectId: string;
    subjectName: string;
    version: string;
    status: 'Signed' | 'Pending' | 'Expired' | 'Verified';
    signedDate: string;
    type: 'Main ICF' | 'Genetic' | 'Storage';
    method: 'eConsent' | 'Paper';
}

export default function ConsentOversight() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Expired' | 'Action Required'>('All');

    const records: ConsentRecord[] = [
        { id: 'C-001', subjectId: 'SUB-001', subjectName: 'Alice Johnson', version: 'v2.4 (2026)', status: 'Verified', signedDate: '2026-03-01', type: 'Main ICF', method: 'eConsent' },
        { id: 'C-002', subjectId: 'SUB-002', subjectName: 'Bob Smith', version: 'v2.4 (2026)', status: 'Pending', signedDate: '--', type: 'Main ICF', method: 'eConsent' },
        { id: 'C-003', subjectId: 'SUB-003', subjectName: 'Charlie Davis', version: 'v2.3 (2025)', status: 'Expired', signedDate: '2025-06-12', type: 'Main ICF', method: 'Paper' },
        { id: 'C-004', subjectId: 'SUB-005', subjectName: 'Edward Norton', version: 'v2.4 (2026)', status: 'Signed', signedDate: '2026-03-18', type: 'Genetic', method: 'eConsent' },
    ];

    const filteredRecords = records.filter(r => {
        const matchesSearch = r.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             r.subjectId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' || 
                             (activeFilter === 'Action Required' ? r.status === 'Expired' || r.status === 'Pending' : r.status === activeFilter);
        return matchesSearch && matchesFilter;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Verified': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Signed': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'Pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Expired': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header / KPI Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Consent <span className="text-indigo-400">Oversight</span></h2>
                    <p className="text-[13px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Legal Compliance & ICF Tracking</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Compliance</p>
                            <p className="text-sm font-black text-white italic">94.2% Verified</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Actions Req.</p>
                            <p className="text-sm font-black text-white italic">03 Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B101B]/40 border border-white/5 p-4 rounded-3xl">
                <div className="flex gap-2">
                    {['All', 'Pending', 'Expired', 'Action Required'].map((f: any) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-6 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-60 uppercase tracking-widest placeholder:text-slate-700"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredRecords.map((r) => (
                        <motion.div 
                            key={r.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B101B]/40 border border-white/5 rounded-[2rem] p-8 space-y-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 group-hover:opacity-20 transition-all">
                                <ScrollText className="w-12 h-12 text-indigo-400" />
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-tighter ${getStatusStyle(r.status)} shadow-[0_0_10px_rgba(var(--status-rgb),0.1)]`}>
                                    {r.status}
                                </div>
                                <p className="text-[10px] text-slate-700 font-mono tracking-widest">{r.signedDate}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] italic underline decoration-indigo-800 underline-offset-4">{r.type}</p>
                                <h4 className="text-xl font-black text-white italic truncate">{r.subjectName}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{r.subjectId} • {r.method}</p>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] text-slate-600 font-black uppercase">Active Version</p>
                                    <p className="text-[10px] text-white font-black uppercase italic tracking-widest mt-0.5">{r.version}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                                    <button className="p-3 bg-indigo-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
