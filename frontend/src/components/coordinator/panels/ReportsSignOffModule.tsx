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

export default function ReportsSignOffModule({ 
    selectedStudyId, preloadedStudies, isLoading 
}: { 
    selectedStudyId?: string;
    preloadedStudies?: any[];
    isLoading?: boolean;
}) {
    const [isSigning, setIsSigning] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        setIsSigning(false);
        setSelectedReport(null);
        setTwoFactorCode('');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-10 pb-20">
            {/* Header */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-6 md:gap-8`}>
                <div>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white italic uppercase tracking-tighter`}>Reports & <span className="text-indigo-400">Sign-Off</span></h2>
                    <p className="text-[11px] md:text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Clinical Study Reports & Regulatory Approval Queue</p>
                </div>
                <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                    <button className={`px-6 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 ${isMobile ? 'w-full' : ''}`}>
                        <History className="w-4 h-4" /> Signature Audit
                    </button>
                    <button className={`px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 ${isMobile ? 'w-full' : ''}`}>
                        <PenTool className="w-5 h-5" /> Batch Sign-Off
                    </button>
                </div>
            </div>

            {/* Pending Sign-offs Highlight */}
            <div className={`bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col ${isMobile ? '' : 'md:flex-row md:items-center'} justify-between gap-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none hidden md:block">
                    <ShieldCheck className="w-32 h-32 text-indigo-400" />
                </div>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3 bg-indigo-500/20 w-fit px-4 py-1.5 rounded-full border border-indigo-500/30">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] md:text-[12px] font-black text-indigo-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Regulated Environment (21 CFR Part 11)</span>
                    </div>
                    <h3 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white italic uppercase tracking-tighter`}>Your Pending <span className="text-indigo-500">Approvals</span></h3>
                    <p className="text-[11px] md:text-[12px] text-slate-400 font-bold uppercase tracking-widest max-w-xl">You have <span className="text-white">04 Reports</span> awaiting your clinical verification. These must be reviewed and signed within 24 hours.</p>
                </div>
                <button className={`px-10 py-5 bg-white text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.05] transition-all shrink-0 ${isMobile ? 'w-full' : ''}`}>Review Queue</button>
            </div>

            {/* Reports List */}
            <div className={`grid grid-cols-1 ${isTablet ? 'grid-cols-2' : 'lg:grid-cols-2'} gap-6 md:gap-8`}>
                {reports.map((r) => (
                    <motion.div 
                        key={r.id} 
                        className={`bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 space-y-6 md:space-y-8 hover:border-indigo-500/20 transition-all group overflow-hidden relative ${r.status === 'Pending' ? 'shadow-[0_0_30px_rgba(var(--indigo-rgb),0.05)] border-indigo-500/10' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4">
                                 <div className="p-2.5 md:p-3 bg-white/5 border border-white/5 rounded-xl md:rounded-2xl text-slate-500">
                                    <FileText className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-[12px] text-indigo-400 font-black uppercase tracking-widest italic">{r.type}</p>
                                    <h4 className="text-lg md:text-xl font-black text-white italic truncate tracking-tight">{r.title}</h4>
                                </div>
                            </div>
                            <div className={`px-3 md:px-4 py-1.5 rounded-xl border text-[9px] md:text-[12px] font-black uppercase tracking-widest shrink-0 ${
                                r.status === 'Signed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                r.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                'bg-white/5 border-white/10 text-slate-500'
                            }`}>
                                {r.status}
                            </div>
                        </div>

                        <p className="text-[11px] md:text-[12px] text-slate-500 font-bold italic leading-relaxed uppercase tracking-tight line-clamp-3 md:line-clamp-2">{r.description}</p>

                        <div className={`pt-6 md:pt-8 border-t border-white/5 flex flex-col ${isMobile ? 'gap-6' : 'md:flex-row md:items-center md:justify-between'}`}>
                             <div>
                                <p className="text-[10px] md:text-[12px] text-slate-700 font-black uppercase tracking-widest">Authored By</p>
                                <p className="text-[11px] md:text-[12px] text-slate-300 font-black uppercase tracking-widest mt-1">{r.author} • {r.date}</p>
                            </div>
                            {r.status === 'Pending' && (
                                 <div className={`flex ${isMobile ? 'flex-col' : 'gap-3'}`}>
                                    <button onClick={() => handleSignOff(r)} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] md:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.03] transition-all shadow-xl shadow-indigo-900/40">
                                        Participant <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleSignOff(r)} className="px-5 py-3 bg-white/5 border border-white/10 text-indigo-400 rounded-xl text-[10px] md:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                        Sign-Off <FileSignature className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            {r.status === 'Signed' && (
                                 <button className={`px-6 py-3 bg-white/5 border border-white/5 text-emerald-400 rounded-xl text-[10px] md:text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${isMobile ? 'w-full' : ''}`}>
                                    <ShieldCheck className="w-4 h-4" /> View Signature
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Signing Modal */}
            <AnimatePresence>
                {isSigning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B101B]/95 backdrop-blur-xl p-4 md:p-6">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0B101B] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 max-w-xl w-full text-center space-y-8 md:space-y-10 shadow-[0_0_100px_rgba(99,102,241,0.2)] overflow-y-auto max-h-[90vh]"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
                                <Key className="w-8 h-8 md:w-10 md:h-10 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">Clinical Verification</h3>
                                <p className="text-[10px] md:text-[12px] text-slate-500 font-bold uppercase tracking-widest mt-2">{selectedReport?.id} • Identity Confirmation</p>
                            </div>
                            <div className="space-y-6">
                                <p className="text-xs md:text-sm text-slate-400 font-bold italic leading-relaxed">By signing this document, I confirm that the data represented is accurate and complies with the clinical protocol.</p>
                                 <div className="space-y-3">
                                    <label className="text-[10px] md:text-[12px] font-black text-slate-600 uppercase tracking-widest">Verification Code</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••" 
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 md:py-5 text-xl md:text-2xl text-center text-indigo-400 font-mono tracking-[0.5em] outline-none focus:border-indigo-500/50"
                                    />
                                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest leading-relaxed">Code sent to registered mobile device</p>
                                </div>
                            </div>
                             <div className="flex flex-col sm:flex-row gap-4">
                                 <button onClick={() => setIsSigning(false)} className="flex-1 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest order-2 sm:order-1">Cancel</button>
                                 <button onClick={confirmSignOff} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 order-1 sm:order-2">Verify & Apply</button>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}


