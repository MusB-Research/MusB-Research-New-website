import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ClipboardList, 
    Search, 
    Filter, 
    Plus, 
    MessageSquare, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ChevronRight, 
    Layers, 
    DraftingCompass, 
    ArrowUpRight,
    FileText,
    Settings2,
    Database,
    BarChart
} from 'lucide-react';

interface FormStatus {
    id: string;
    subjectId: string;
    formName: string;
    visit: string;
    status: 'Pending' | 'Completed' | 'Query Open';
    lastUpdated: string;
    completion: number;
}

export default function FormsQuestionnairesModule() {
    const [view, setView] = useState<'Tracking' | 'Splash' | 'Architect'>('Tracking');
    const [builderTab, setBuilderTab] = useState('Create New');
    const [searchQuery, setSearchQuery] = useState('');

    const forms: FormStatus[] = [
        { id: 'FRM-001', subjectId: 'SUB-001', formName: 'Vital Signs', visit: 'Visit 4', status: 'Completed', lastUpdated: '2026-03-20', completion: 100 },
        { id: 'FRM-002', subjectId: 'SUB-001', formName: 'Adverse Events', visit: 'Visit 4', status: 'Query Open', lastUpdated: '2026-03-21', completion: 85 },
        { id: 'FRM-003', subjectId: 'SUB-002', formName: 'Medical History', visit: 'Screening', status: 'Pending', lastUpdated: '--', completion: 0 },
        { id: 'FRM-004', subjectId: 'SUB-003', formName: 'Physical Exam', visit: 'Visit 3', status: 'Completed', lastUpdated: '2026-03-15', completion: 100 },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Forms & <span className="text-indigo-400">Questionnaires</span></h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">eCRF Management & Dynamic Instrument Design</p>
                </div>
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button 
                        onClick={() => setView('Tracking')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'Tracking' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Form Tracking
                    </button>
                    <button 
                        onClick={() => setView('Splash')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'Splash' || view === 'Architect' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Form Builder
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'Tracking' && (
                    <motion.div key="tracking" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Completion Rate', val: '88.4%', icon: CheckCircle2, color: 'emerald' },
                            { label: 'Pending Forms', val: '42', icon: Clock, color: 'blue' },
                            { label: 'Active Queries', val: '12', icon: MessageSquare, color: 'red' },
                            { label: 'Synced to EDC', val: '1,240', icon: Database, color: 'indigo' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-8 space-y-4 hover:border-indigo-500/20 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform pointer-events-none">
                                    <stat.icon className="w-16 h-16" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 bg-${stat.color}-500/10 rounded-xl border border-${stat.color}-500/20 text-${stat.color}-400`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <p className="text-3xl font-black text-white italic tracking-tighter">{stat.val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic tracking-widest">eCRF Instrument</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic tracking-widest">Subject ID</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic tracking-widest">Protocol Visit</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic tracking-widest text-center">Form Health</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {forms.map((f) => (
                                    <motion.tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white italic truncate tracking-tight uppercase">{f.formName}</p>
                                                    <p className="text-[10px] text-slate-700 font-mono tracking-widest mt-1">{f.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <p className="text-sm font-black text-white italic uppercase tracking-tighter">{f.subjectId}</p>
                                        </td>
                                        <td className="px-10 py-7">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{f.visit}</p>
                                            <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest mt-1">UPDATED: {f.lastUpdated}</p>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                                                    f.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                    f.status === 'Query Open' ? 'bg-red-500/10 text-red-500 border-red-500/40 animate-pulse' : 
                                                    'bg-white/5 border-white/10 text-slate-500'
                                                }`}>
                                                    {f.status}
                                                </div>
                                                <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full bg-indigo-600 rounded-full transition-all`} style={{ width: `${f.completion}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><Settings2 className="w-4 h-4" /></button>
                                                <button className="px-6 py-2.5 bg-white text-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all">Open eCRF</button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
                )}

                {view === 'Splash' && (
                    <motion.div key="splash" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-20 bg-[#0B101B]/40 border border-white/5 rounded-[3rem] flex flex-col items-center text-center space-y-10 group">
                        <div className="w-32 h-32 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <DraftingCompass className="w-16 h-16" />
                        </div>
                        <div className="max-w-xl space-y-4">
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Instrument Architect</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">Design multi-page electronic case report forms (eCRF) with built-in edit checks, logic branching, and dynamic field visibility.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                            <button onClick={() => { setBuilderTab('Create New'); setView('Architect'); }} className="py-5 bg-white text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all">Create New eCRF</button>
                            <button onClick={() => { setBuilderTab('Templates'); setView('Architect'); }} className="py-5 bg-white/5 border border-white/10 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Import Template</button>
                        </div>
                    </motion.div>
                )}

                {view === 'Architect' && (
                    <motion.div key="architect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <div className="mb-6">
                            <button onClick={() => setView('Splash')} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-all">← Back to Architect Home</button>
                        </div>
                        <QuestionnaireBuilder initialTab={builderTab} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

import QuestionnaireBuilder from '../QuestionnaireBuilder';
