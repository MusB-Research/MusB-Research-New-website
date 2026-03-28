import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    FileText, 
    Calendar, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Download, 
    Upload, 
    Plus, 
    ChevronRight, 
    ShieldCheck, 
    Stethoscope, 
    Fingerprint, 
    History,
    XCircle,
    Bell
} from 'lucide-react';

interface PersonalDoc {
    id: string;
    name: string;
    type: 'Medical License' | 'CV' | 'GCP Training' | 'Board Cert' | 'Financial Disclosure';
    status: 'Valid' | 'Expiring Soon' | 'Expired';
    expiryDate: string;
    fileUrl: string;
}

export default function MyDocumentsModule() {
    const [docs, setDocs] = useState<PersonalDoc[]>([
        { id: 'PD-01', name: 'FL State Medical License - 2026', type: 'Medical License', status: 'Valid', expiryDate: '2027-12-31', fileUrl: '#' },
        { id: 'PD-02', name: 'Curriculum Vitae (CV) - Jan 2026', type: 'CV', status: 'Valid', expiryDate: '2028-01-01', fileUrl: '#' },
        { id: 'PD-03', name: 'CITI GCP Training Certification', type: 'GCP Training', status: 'Expiring Soon', expiryDate: '2026-04-15', fileUrl: '#' },
        { id: 'PD-04', name: 'Financial Disclosure Form', type: 'Financial Disclosure', status: 'Valid', expiryDate: '--', fileUrl: '#' },
    ]);

    const [selectedDoc, setSelectedDoc] = useState<PersonalDoc | null>(null);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Valid': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Expiring Soon': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
            case 'Expired': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 relative">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">My <span className="text-indigo-400">Credentials</span></h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Professional Certification & Compliance Vault</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            const blob = new Blob(['Simulated Credential Archive'], { type: 'application/zip' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'Dr_Michael_Chen_Credential_Bundle.zip';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        }}
                        className="px-6 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                    >
                        Bulk Credential Package
                    </button>
                    <div className="relative">
                        <input type="file" id="credential-upload" className="hidden" onChange={(e) => {
                            if (e.target.files?.length) alert(`Uploading Credential: [${e.target.files[0].name}]... Initiating secure compliance ingest.`);
                        }} />
                        <button 
                            onClick={() => document.getElementById('credential-upload')?.click()}
                            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] hover:shadow-indigo-500/40 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3 active:scale-95"
                        >
                            Add New Credential <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Compliance Radar / Profile Summary */}
            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="flex items-center gap-8">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <User className="w-12 h-12" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-full border-4 border-[#0B101B]">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Dr. Michael Chen</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">NPI: 1289304122 • MD, PhD</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-black uppercase tracking-widest">Compliant</span>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Active Credentials', val: '12', icon: FileText, color: 'indigo' },
                        { label: 'Expiring Soon', val: '01', icon: Bell, color: 'amber' },
                        { label: 'Verified Exports', val: '24', icon: CheckCircle2, color: 'emerald' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{s.label}</p>
                            <p className={`text-2xl font-black ${s.color === 'amber' ? 'text-amber-400' : s.color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400'} italic`}>{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Credential Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {docs.map((doc) => (
                    <motion.div key={doc.id} className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8 group hover:border-indigo-500/20 transition-all relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                                    <Stethoscope className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest italic">{doc.type}</p>
                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tight">{doc.name}</h4>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(doc.status)}`}>
                                {doc.status}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-white/5">
                            <div className="flex items-center gap-10">
                                <div>
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Expiration</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${doc.status === 'Expiring Soon' ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>{doc.expiryDate}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Audit Track</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Verified 2026-01-01</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                                    className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setSelectedDoc(doc)}
                                    className="p-3 bg-white text-slate-950 rounded-xl hover:scale-105 transition-all outline-none active:scale-95"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Regulatory Summary Banner */}
            <div className="p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] flex flex-col md:flex-row md:items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Your Regulatory <span className="text-indigo-500">Binder Ready</span></h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-xl">All credentials are verified for <span className="text-white">Cohort B Entry</span>. Automated credentialing for Sponsor review is active.</p>
                </div>
                <button 
                    onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                    className="px-8 py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none"
                >
                    Download Audit Package
                </button>
            </div>

            {/* Compliance Lens Modal */}
            <AnimatePresence>
                {selectedDoc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDoc(null)}
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
                                        <p className="text-[12px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-1">Chain of Custody • {selectedDoc.id}</p>
                                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tight leading-tight">{selectedDoc.name}</h3>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedDoc(null)}
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
                )}
            </AnimatePresence>
        </motion.div>
    );
}
