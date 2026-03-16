import React from 'react';
import { motion } from 'framer-motion';
import { 
    FileText, 
    FileDigit, 
    FileLock, 
    Upload, 
    Search, 
    Filter, 
    ChevronRight, 
    MoreHorizontal,
    Folder,
    FileCode,
    Clock,
    History
} from 'lucide-react';

export default function DocumentsModule() {
    const documents = [
        { name: 'Protocol_v2.1_Final.pdf', type: 'PDF', size: '4.2 MB', date: '2026-03-01', folder: 'Protocols', status: 'Approved' },
        { name: 'Informed_Consent_Form_CA.docx', type: 'DOCX', size: '1.4 MB', date: '2026-03-12', folder: 'Consent', status: 'Draft' },
        { name: 'Investigator_Brochure_2026.pdf', type: 'PDF', size: '12.8 MB', date: '2026-01-15', folder: 'IB', status: 'Approved' },
        { name: 'Lab_Manual_Ops.pdf', type: 'PDF', size: '2.1 MB', date: '2026-02-20', folder: 'Operational', status: 'Approved' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        eTMF <span className="text-cyan-400">Repository</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Scientific Documentation & Version Control
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
                         <History className="w-4 h-4" /> Global Audit Trail
                    </button>
                    <button className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <Upload className="w-4 h-4" /> Secure Drop
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* File Explorer */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                             <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                                <span>Root</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-white">Active Protocols</span>
                             </div>
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                <input type="text" placeholder="Find documents..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] text-white outline-none focus:border-cyan-500/50 transition-all w-48 font-bold uppercase tracking-widest"/>
                             </div>
                        </div>

                        <div className="space-y-2">
                             {/* Mock Folders */}
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {['Protocols', 'Consent', 'SOPs', 'Legal'].map((f, i) => (
                                    <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-cyan-500/30 transition-all cursor-pointer">
                                        <Folder className="w-8 h-8 text-slate-700 group-hover:text-cyan-500 transition-colors mb-4" />
                                        <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{f}</p>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">12 Files</p>
                                    </div>
                                ))}
                             </div>

                             {/* File List */}
                             <div className="divide-y divide-white/5">
                                {documents.map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between py-6 group hover:bg-white/5 transition-all px-4 rounded-[2rem] -mx-4 cursor-pointer">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                {doc.type === 'PDF' ? <FileDigit className="w-6 h-6 text-red-400/50" /> : <FileCode className="w-6 h-6 text-indigo-400/50" />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{doc.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">{doc.folder}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{doc.size}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="hidden md:block text-right">
                                                <p className="text-[10px] font-black text-slate-500 italic uppercase">Modified</p>
                                                <p className="text-[9px] font-bold text-white uppercase tracking-widest mt-1">{doc.date}</p>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/5 ${
                                                doc.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                                            }`}>
                                                {doc.status}
                                            </span>
                                            <button className="p-3 text-slate-600 hover:text-white transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Right: Security & Signing */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <FileLock className="w-5 h-5 text-indigo-400" />
                            Digital <span className="text-indigo-400">Signing</span>
                        </h4>
                        <div className="space-y-6">
                             <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase italic tracking-tight">E-Consent Required</p>
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                                </div>
                                <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">03 Participants awaiting investigator countersignature on Consent Form v1.2</p>
                                <button className="w-full py-4 bg-indigo-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all italic">Launch Sign Portal</button>
                             </div>

                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Recent Activity</p>
                                {[
                                    { msg: 'Dr. Vance approved Protocol v2.1', time: '2h ago' },
                                    { msg: 'System backup completed', time: '14h ago' },
                                ].map((log, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl items-start">
                                        <Clock className="w-3.5 h-3.5 text-slate-600 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{log.msg}</p>
                                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
