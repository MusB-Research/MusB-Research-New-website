import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileSignature, 
    Search, 
    Filter, 
    Download, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    TrendingUp, 
    ChevronRight,
    FileText,
    ShieldCheck,
    History,
    Lock,
    Key,
    UserCheck,
    PenTool
} from 'lucide-react';

interface ClinicalReport {
    id: string;
    title: string;
    type: 'Safety' | 'Efficacy' | 'End-of-Month' | 'Protocol Violation';
    status: 'Pending' | 'Signed' | 'Draft';
    date: string;
    description: string;
    author: string;
}

export default function ReportsSignOffModule({ selectedStudyId }: { selectedStudyId?: string }) {

    const [isSigning, setIsSigning] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const reports: ClinicalReport[] = [
        { id: 'CSR-01', title: 'Monthly Safety Signal - Cohort Alpha', type: 'Safety', status: 'Pending', date: '2026-03-21', description: 'Review of all AEs/SAEs for previous dosing cycle.', author: 'Dr. Sarah Smith' },
        { id: 'CSR-02', title: 'Visit 3 Data Integrity Audit', type: 'End-of-Month', status: 'Signed', date: '2026-03-15', description: 'Internal audit of V3 entries for all 42 subjects.', author: 'Sarah Jenkins (Coord)' },
        { id: 'CSR-03', title: 'Efficacy Analysis Pre-Read - Phase II', type: 'Efficacy', status: 'Draft', date: '2026-03-18', description: 'Preliminary review of primary endpoint metrics.', author: 'Dr. Chen (PI)' },
        { id: 'CSR-04', title: 'PV-02 Protocol Deviation Summary', type: 'Protocol Violation', status: 'Pending', date: '2026-03-21', description: 'Reporting of medication window deviation for Subject SUB-012.', author: 'Elena Rodriguez' },
    ];

    const handleSignOff = (report: ClinicalReport) => {
        setSelectedReport(report);
        setIsSigning(true);
    };

    const confirmSignOff = () => {
        // Mock 2FA verification
        setIsSigning(false);
        setSelectedReport(null);
        setTwoFactorCode('');
        // Real app would trigger API and audit trail here
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Reports & <span className="text-indigo-400">Sign-Off</span></h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Clinical Study Reports & Regulatory Approval Queue</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2">
                        <History className="w-4 h-4" /> Signature Audit
                    </button>
                    <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3">
                        <PenTool className="w-5 h-5" /> Batch Sign-Off
                    </button>
                </div>
            </div>

            {/* Pending Sign-offs Highlight */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform pointer-events-none">
                    <ShieldCheck className="w-32 h-32 text-indigo-400" />
                </div>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3 bg-indigo-500/20 w-fit px-4 py-1.5 rounded-full border border-indigo-500/30">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Regulated Environment (21 CFR Part 11)</span>
                    </div>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Your Pending <span className="text-indigo-500">Approvals</span></h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-xl">You have <span className="text-white">04 Reports</span> awaiting your clinical verification. These must be reviewed and signed within 24 hours to maintain regulatory compliance.</p>
                </div>
                <button className="px-10 py-5 bg-white text-slate-950 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.05] transition-all shrink-0">Review Sign-Off Queue</button>
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reports.map((r) => (
                    <motion.div 
                        key={r.id} 
                        className={`bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-10 space-y-8 hover:border-indigo-500/20 transition-all group overflow-hidden relative ${r.status === 'Pending' ? 'shadow-[0_0_30px_rgba(var(--indigo-rgb),0.05)] border-indigo-500/10' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest italic">{r.type}</p>
                                    <h4 className="text-xl font-black text-white italic truncate tracking-tight">{r.title}</h4>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                                r.status === 'Signed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                r.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                'bg-white/5 border-white/10 text-slate-500'
                            }`}>
                                {r.status}
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 font-bold italic leading-relaxed uppercase tracking-tight line-clamp-2">{r.description}</p>

                        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest">Authored By</p>
                                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">{r.author} • {r.date}</p>
                            </div>
                            {r.status === 'Pending' && (
                                <button onClick={() => handleSignOff(r)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.03] transition-all shadow-xl shadow-indigo-900/40">
                                    Apply Sign-Off <FileSignature className="w-4 h-4" />
                                </button>
                            )}
                            {r.status === 'Signed' && (
                                <button className="px-6 py-3 bg-white/5 border border-white/5 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> View Signature
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Signing Modal (Simulation) */}
            <AnimatePresence>
                {isSigning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B101B]/95 backdrop-blur-xl p-6">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0B101B] border border-white/10 rounded-[3rem] p-12 max-w-xl w-full text-center space-y-10 shadow-[0_0_100px_rgba(99,102,241,0.2)]"
                        >
                            <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Key className="w-10 h-10 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Clinical Verification</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">{selectedReport?.id} • Identity Confirmation Required</p>
                            </div>
                            <div className="space-y-6">
                                <p className="text-sm text-slate-400 font-bold italic">By signing this document, I confirm that the data represented is accurate to the best of my medical knowledge and complies with the clinical protocol.</p>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Enter Verification Code</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••" 
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl text-center text-indigo-400 font-mono tracking-[0.5em] outline-none focus:border-indigo-500/50"
                                    />
                                    <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest">Code sent to registered mobile device</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsSigning(false)} className="flex-1 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                <button onClick={confirmSignOff} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30">Verify & Apply Stamp</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
