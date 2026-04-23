import React, { useState, useEffect } from 'react';
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
    ScrollText,
    ChevronDown
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
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pt-4">
            {/* Header / KPI Row */}
            <div className={`flex ${isMobile ? 'flex-col items-start gap-10' : 'flex-row items-center justify-between gap-8'}`}>
                <div className="space-y-2">
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white italic uppercase tracking-tighter`}>Consent <span className="text-indigo-400">Oversight</span></h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] italic">Legal Compliance & ICF Tracking</p>
                </div>
                <div className={`flex items-center ${isMobile ? 'w-full gap-4' : 'gap-6'}`}>
                    <div className={`flex items-center gap-3 px-6 py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] ${isMobile ? 'flex-1' : ''}`}>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Compliance</p>
                            <p className="text-sm font-black text-white italic">94.2%</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 px-6 py-4 bg-red-500/5 border border-red-500/10 rounded-[1.5rem] ${isMobile ? 'flex-1' : ''}`}>
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pending</p>
                            <p className="text-sm font-black text-white italic">03 Action</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row items-center justify-between'} gap-4 bg-[#0B101B]/40 backdrop-blur-xl border border-white/5 p-4 rounded-[2rem]`}>
                <div className="flex gap-2 relative">
                    {isMobile ? (
                        <div className="w-full relative">
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <Filter className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Filter: {activeFilter}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-[60] space-y-1"
                                    >
                                        {['All', 'Pending', 'Expired', 'Action Required'].map((f: any) => (
                                            <button
                                                key={f}
                                                onClick={() => { setActiveFilter(f); setIsFilterOpen(false); }}
                                                className={`w-full flex items-center px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                                    activeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5'
                                                }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        ['All', 'Pending', 'Expired', 'Action Required'].map((f: any) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {f}
                            </button>
                        ))
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Subject ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-[12px] text-white font-bold outline-none focus:border-indigo-500/50 transition-all ${isMobile ? 'w-full' : 'w-72'} uppercase tracking-widest placeholder:text-slate-700`}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className={`grid grid-cols-1 ${isTablet ? 'grid-cols-2' : isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
                <AnimatePresence mode="popLayout">
                    {filteredRecords.map((r) => (
                        <motion.div 
                            key={r.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B101B]/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 group-hover:opacity-20 transition-all pointer-events-none">
                                <ScrollText className="w-16 h-16 text-indigo-400" />
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(r.status)} shadow-[0_0_15px_rgba(var(--status-rgb),0.1)]`}>
                                    {r.status}
                                </div>
                                <p className="text-[10px] text-slate-700 font-mono font-black tracking-widest uppercase italic">{r.signedDate}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.2em] italic">{r.type}</p>
                                </div>
                                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter truncate leading-tight group-hover:text-indigo-400 transition-colors">{r.subjectName}</h4>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] italic">{r.subjectId} • {r.method}</p>
                            </div>

                            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Protocol Version</p>
                                    <p className="text-[11px] text-white/80 font-black uppercase italic tracking-widest leading-none">{r.version}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"><Download className="w-4 h-4" /></button>
                                    <button className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl shadow-indigo-600/30"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            {filteredRecords.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                    <div className="w-20 h-20 bg-indigo-500/5 rounded-full flex items-center justify-center mb-6">
                        <FileSignature className="w-8 h-8 text-indigo-400 opacity-20" />
                    </div>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] italic">No consent records found</p>
                </div>
            )}
        </motion.div>
    );
}
}


