import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip } from 'lucide-react';

interface NewRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[80vh] bg-[#0B101B] border border-white/10 rounded-[4rem] z-[101] flex flex-col shadow-2xl overflow-hidden"
                    >
                        <div className="flex-shrink-0 px-12 py-10 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Initiate Incident Report</h3>
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-3 italic">Structured Routing and Protocol Synchronization</p>
                            </div>
                            <button onClick={onClose} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-16 space-y-16">
                            <section className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Incident Title</label>
                                    <input type="text" placeholder="Summary of the incident..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black italic uppercase text-white placeholder-slate-800 outline-none focus:border-indigo-500/50" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Incident Category</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-black italic uppercase text-white outline-none focus:border-indigo-500/50 appearance-none">
                                        <option>Technical Support</option>
                                        <option>Clinical / Protocol</option>
                                        <option>Study Operations</option>
                                        <option>Data & Reports</option>
                                        <option>Access & Permissions</option>
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Incident Description & Observation Logs</label>
                                    <textarea placeholder="Describe the behavior or required clarification in detail..." className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-sm font-black italic uppercase text-white placeholder-slate-800 outline-none focus:border-indigo-500/50 h-32 resize-none" />
                                </div>
                            </section>

                            <section className="grid grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Target Study</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black uppercase text-white outline-none appearance-none">
                                        <option>HI-202B</option>
                                        <option>MS-801</option>
                                        <option>NR-009</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Priority Coefficient</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black uppercase text-white outline-none appearance-none">
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Urgent</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Participant Tracking ID</label>
                                    <input type="text" placeholder="BTB-XXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-[10px] font-black uppercase text-white placeholder-slate-800 outline-none" />
                                </div>
                            </section>

                            <div className="p-12 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 group hover:border-indigo-500/30 transition-all border-dashed">
                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-all">
                                    <Paperclip className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-white uppercase italic">Append Scientific Evidence</p>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2 italic">Drag and drop screenshots, PDFs, or Lab reports (MAX 50MB)</p>
                                </div>
                                <button className="px-8 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Browse Cryptographic Files</button>
                            </div>
                        </div>

                        <div className="flex-shrink-0 px-12 py-10 bg-[#0B101B]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-between">
                            <button onClick={onClose} className="px-10 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Abort Submission</button>
                            <div className="flex gap-4">
                                <button className="px-10 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white">Save Temporary Draft</button>
                                <button 
                                    onClick={onClose}
                                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-900/40 hover:scale-105 transition-all italic"
                                >
                                    Transmit Incident Report
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
