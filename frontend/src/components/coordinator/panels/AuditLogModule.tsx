import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, 
    Search, 
    Filter, 
    Download, 
    Clock, 
    User, 
    ShieldCheck, 
    Lock, 
    History as HistoryIcon, 
    ChevronRight, 
    Database, 
    Terminal, 
    Settings, 
    Eye, 
    Key, 
    FileSignature,
    ClipboardList
} from 'lucide-react';

interface AuditEntry {
    id: string;
    action: string;
    category: 'Security' | 'Clinical' | 'Financial' | 'System';
    user: string;
    role: string;
    timestamp: string;
    details: string;
    status: 'Verified' | 'Unverified';
}

export default function AuditLogModule() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<'All' | 'Security' | 'Clinical' | 'System'>('All');

    const entries: AuditEntry[] = [
        { id: 'LOG-881', action: 'EConsent Verified', category: 'Clinical', user: 'Dr. Michael Chen', role: 'PI', timestamp: '2026-03-21 14:22', details: 'Subject SUB-023 Informed Consent verified with 2FA.', status: 'Verified' },
        { id: 'LOG-882', action: 'Lab Result Modified', category: 'Clinical', user: 'Sarah Jenkins', role: 'Coord', timestamp: '2026-03-21 11:05', details: 'Correction to CBC-Metabolic entry (typo in HB level).', status: 'Verified' },
        { id: 'LOG-883', action: 'Authorized Login', category: 'Security', user: 'Dr. Michael Chen', role: 'PI', timestamp: '2026-03-21 08:30', details: 'Successful login from IP: 192.168.1.10 (Miami Hub).', status: 'Verified' },
        { id: 'LOG-884', action: 'Protocol Manual Updated', category: 'System', user: 'Admin Console', role: 'System', timestamp: '2026-03-20 16:00', details: 'Protocol v3.4 push to production complete.', status: 'Verified' },
        { id: 'LOG-885', action: 'NPI Credentials Read', category: 'Security', user: 'Sponsor QC', role: 'Sponsor', timestamp: '2026-03-20 14:12', details: 'Credential package download for site verification.', status: 'Verified' },
    ];

    const filteredEntries = entries.filter(e => {
        const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
        const matchesSearch = e.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             e.details.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'Security': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'Clinical': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'System': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Immutable <span className="text-indigo-400">Audit Log</span></h2>
                    <p className="text-[13px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">21 CFR Part 11 Compliant Digital Ledger</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> View Rawlings
                    </button>
                    <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3">
                        Generate PDF Export <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tactical Grid Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0B101B]/60 border border-white/5 p-4 rounded-3xl">
                <div className="flex gap-2">
                    {['All', 'Security', 'Clinical', 'System'].map((cat: any) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Trace Log..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-xs text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-72 uppercase tracking-widest font-mono placeholder:text-slate-700"
                    />
                </div>
            </div>

            {/* Audit Feed */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-4 lg:p-10 space-y-4">
                {filteredEntries.map((log) => (
                    <motion.div 
                        key={log.id} 
                        layout 
                        className="p-8 rounded-[2rem] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all grid grid-cols-1 lg:grid-cols-4 gap-8 group"
                    >
                        <div className="lg:col-span-1 flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-700 group-hover:bg-indigo-600/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all border border-transparent">
                                <HistoryIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">{log.timestamp}</p>
                                <div className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest mt-1 border ${getCategoryStyle(log.category)}`}>
                                    {log.category}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                {log.action}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
                            </h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight italic leading-relaxed">{log.details}</p>
                        </div>

                        <div className="lg:col-span-1 flex items-center justify-end gap-10">
                            <div className="text-right">
                                <p className="text-[13px] text-white font-black uppercase tracking-widest">{log.user}</p>
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{log.role}</p>
                            </div>
                            <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><Eye className="w-5 h-5" /></button>
                        </div>
                    </motion.div>
                ))}
                {filteredEntries.length === 0 && (
                    <div className="py-20 text-center space-y-6">
                        <Terminal className="w-16 h-16 text-slate-800 mx-auto" />
                        <p className="text-sm font-black text-slate-600 uppercase tracking-widest italic">No matching audit entries found in this vector</p>
                    </div>
                )}
            </div>

            {/* Bottom Proof of Authenticity */}
            <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <FileSignature className="w-7 h-7" />
                    </div>
                    <div>
                        <h5 className="text-xl font-black text-white italic uppercase tracking-tighter">Verified Audit Integrity</h5>
                        <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hash Verification: SHA-256 Validated • Blockchain Anchor Active</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Verify Chain</button>
                </div>
            </div>
        </motion.div>
    );
}
