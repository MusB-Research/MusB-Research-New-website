import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, FileText, HelpCircle, Settings, X, Check, CheckCircle2, ExternalLink, History, MessageCircle } from 'lucide-react';
import { MOCK_DOCS } from '../SupportConstants';

export const KnowledgeBase: React.FC = () => {
    const [kbCategory, setKbCategory] = useState<string | null>(null);
    const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
    const [downloadSuccessIdx, setDownloadSuccessIdx] = useState<number | null>(null);

    const handleDownload = (idx: number) => {
        setDownloadingIdx(idx);
        setTimeout(() => {
            setDownloadingIdx(null);
            setDownloadSuccessIdx(idx);
            setTimeout(() => setDownloadSuccessIdx(null), 3000);
        }, 1500);
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-20 flex flex-col items-center">
            <AnimatePresence mode="wait">
                {!kbCategory ? (
                    <motion.div 
                        key="hub"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full flex flex-col items-center text-center space-y-12"
                    >
                        <div className="w-24 h-24 lg:w-32 lg:h-32 bg-indigo-600/10 rounded-[2.5rem] lg:rounded-[3rem] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                             <Book className="w-10 h-10 lg:w-16 lg:h-16" />
                        </div>
                        <div className="max-w-2xl space-y-6">
                             <h2 className="text-2xl lg:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">Intelligence Hub & Knowledge Repository</h2>
                             <p className="text-[10px] lg:text-[11px] text-slate-500 font-black uppercase tracking-widest leading-relaxed italic">
                                 Access training manuals, standard operating procedures, and platform video tutorials. 
                                 Our repository is cryptographically synced across global research nodes for unified protocol alignment.
                             </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-5xl">
                             {[
                                 { label: 'SOP Repository', desc: 'Protocol Standard Operating Procedures', icon: FileText },
                                 { label: 'Training Modules', desc: 'CME-certified site coordinator training', icon: HelpCircle },
                                 { label: 'Platform FAQs', desc: 'Technical troubleshooting & FAQ logs', icon: Settings }
                             ].map((kb, i) => (
                                 <button 
                                     key={i} 
                                     onClick={() => setKbCategory(kb.label)}
                                     className="p-6 lg:p-8 bg-white/5 border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] text-left space-y-4 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all group active:scale-95"
                                 >
                                     <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                                         <kb.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                     </div>
                                     <h4 className="text-[10px] lg:text-[11px] font-black text-white uppercase tracking-widest italic">{kb.label}</h4>
                                     <p className="text-[8px] lg:text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed italic line-clamp-2">{kb.desc}</p>
                                 </button>
                             ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="detail"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full max-w-5xl space-y-12"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 pb-8">
                            <div className="flex items-center gap-6">
                                <button 
                                     onClick={() => setKbCategory(null)}
                                     className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/10 italic text-[9px] font-black uppercase flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Back to Hub
                                </button>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{kbCategory}</h2>
                            </div>
                            <p className="text-[9px] text-slate-500 font-black italic uppercase">Repository Synced Oct 2024</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            {MOCK_DOCS.filter(d => d.cat === kbCategory).map((doc, i) => (
                                <div 
                                     key={i} 
                                     onClick={() => !downloadingIdx && handleDownload(i)}
                                     className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                             downloadingIdx === i ? 'bg-indigo-600 text-white animate-pulse' :
                                             downloadSuccessIdx === i ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                             'bg-white/5 text-slate-500'
                                        }`}>
                                            {downloadSuccessIdx === i ? <Check className="w-5 h-5" /> : 
                                             doc.type === 'PDF' ? <FileText className="w-5 h-5" /> : 
                                             doc.type === 'Video' ? <MessageCircle className="w-5 h-5" /> : 
                                             <Settings className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h5 className="text-[11px] font-black text-white uppercase italic tracking-wider">{doc.title || doc.desc}</h5>
                                            <div className="flex items-center gap-3 mt-1.5 font-mono">
                                                <span className="text-[7px] text-indigo-400 font-black uppercase">
                                                    {downloadingIdx === i ? 'TRANSMITTING...' : doc.type}
                                                </span>
                                                <span className="text-[7px] text-slate-700 uppercase italic">Last Updated: {doc.date}</span>
                                                <span className="text-[7px] text-slate-800 font-black">{doc.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {downloadingIdx === i ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="p-3 text-indigo-400">
                                                <History className="w-5 h-5" />
                                            </motion.div>
                                        ) : downloadSuccessIdx === i ? (
                                            <div className="p-3 text-emerald-500">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        ) : (
                                            <button className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
