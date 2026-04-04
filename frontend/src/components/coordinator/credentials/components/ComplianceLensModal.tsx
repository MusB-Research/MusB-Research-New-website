import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, History, Fingerprint, CheckCircle2, Download } from 'lucide-react';
import { PersonalDoc } from '../CredentialConstants';

interface ComplianceLensModalProps {
    doc: PersonalDoc | null;
    onClose: () => void;
}

export const ComplianceLensModal: React.FC<ComplianceLensModalProps> = ({ doc, onClose }) => {
    if (!doc) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#0B101B]/90 backdrop-blur-xl"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#0B101B] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
                >
                    {/* Modal Header */}
                    <div className="p-10 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[12px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-1">Chain of Custody • {doc.id}</p>
                                <h3 className="text-4xl font-black text-white italic uppercase tracking-tight leading-tight">{doc.name}</h3>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90 shadow-2xl"
                        >
                            <Plus className="w-8 h-8 rotate-45" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <h4 className="text-[13px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-3">
                                    <History className="w-5 h-5" /> Verification Timeline
                                </h4>
                                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                    {[
                                        { time: '2026-01-01 09:42', label: 'Initial Ingest', user: 'System (Auto)', status: 'Success' },
                                        { time: '2026-01-01 10:15', label: 'AI Metadata Extraction', user: 'ML Engine v4.2', status: 'Verified' },
                                        { time: '2026-01-02 14:20', label: 'Quality Assurance Review', user: 'Senior RA - Dr. S. Miller', status: 'Approved' },
                                        { time: '2026-01-02 16:00', label: 'Immuntable Registry Entry', user: 'Blockchain Sec-Node', status: 'Sealed' }
                                    ].map((log, i) => (
                                        <div key={i} className="flex gap-8 items-start relative pl-10">
                                            <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-[#0B101B] border-2 border-indigo-500 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-slate-600 font-black uppercase italic tracking-widest">{log.time}</p>
                                                <p className="text-[15px] text-white font-black uppercase italic tracking-wider leading-none">{log.label}</p>
                                                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-tight">{log.user}</p>
                                            </div>
                                            <div className="ml-auto px-4 py-1.5 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black text-emerald-400 uppercase tracking-widest shadow-lg">{log.status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="p-10 bg-white/[0.03] border border-white/5 rounded-[2.5rem] space-y-8 shadow-2xl">
                                <h4 className="text-[13px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-3">
                                    <Fingerprint className="w-5 h-5" /> Cryptographic Integrity
                                </h4>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[11px] text-slate-600 font-black uppercase tracking-widest mb-2 shadow-sm">Document Hash (SHA-256)</p>
                                        <p className="text-[12px] text-indigo-200/80 font-mono break-all bg-[#0B101B] p-5 rounded-2xl border border-white/5 leading-relaxed uppercase tracking-tighter shadow-inner">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-600 font-black uppercase tracking-widest mb-1">Digital Signature Node</p>
                                        <p className="text-[13px] text-emerald-400 font-black uppercase italic tracking-[0.1em] mt-2 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> VERIFIED_AUTH_NODE_0921X
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-6">
                                <button 
                                    onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                                    className="flex-1 px-8 py-5 bg-white text-[#0B101B] rounded-[1.5rem] text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-indigo-500/10"
                                >
                                    Full Document Access <Download className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={() => window.print()}
                                    className="px-8 py-5 bg-white/5 border border-white/10 text-slate-400 rounded-[1.5rem] text-[12px] font-black uppercase tracking-widest hover:text-white transition-all active:scale-95 shadow-xl"
                                >
                                    Print Audit Leaf
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
