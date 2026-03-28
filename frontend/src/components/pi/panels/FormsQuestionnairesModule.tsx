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
                    <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter">Forms & <span className="text-indigo-400">Questionnaires</span></h2>
                    <p className="text-[9px] md:text-[11px] text-white/50 font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] mt-3 md:mt-4 italic">eCRF Management & Dynamic Instrument Design</p>
                </div>
                <div className="flex bg-white/5 p-1.5 md:p-2 rounded-2xl border border-white/10 w-full lg:w-auto">
                    <button
                        onClick={() => setView('Tracking')}
                        className={`flex-1 lg:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all ${view === 'Tracking' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Form Tracking
                    </button>
                    <button
                        onClick={() => setView('Splash')}
                        className={`flex-1 lg:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all ${view === 'Splash' || view === 'Architect' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
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
                                <div key={i} className="bg-[#0F172A] border border-white/10 rounded-2xl md:rounded-[3rem] p-6 md:p-8 space-y-4 md:space-y-6 hover:border-indigo-500/40 transition-all group overflow-hidden relative shadow-2xl shadow-black/40">
                                    <div className="absolute -bottom-4 -right-4 p-6 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
                                        <stat.icon className="w-16 h-16 md:w-20 md:h-20" />
                                    </div>
                                    <div className="flex items-center gap-4 md:gap-5 relative z-10">
                                        <div className={`flex-shrink-0 p-2.5 md:p-3 bg-${stat.color}-500/10 rounded-xl md:rounded-2xl border border-${stat.color}-500/20 text-${stat.color}-400`}>
                                            <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <span className="text-[9px] md:text-[10px] text-white/50 font-black uppercase tracking-widest italic leading-tight">{stat.label}</span>
                                    </div>
                                    <p className="text-2xl md:text-4xl font-black text-white italic tracking-tighter leading-none relative z-10">{stat.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-[#0B101B]/40 border border-white/5 rounded-[1.5rem] md:rounded-[3rem] overflow-x-auto custom-scrollbar-horizontal">
                            <table className="w-full text-left min-w-[900px]">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="w-[30%] px-6 py-6 text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic border-r border-white/5">eCRF Instrument</th>
                                        <th className="w-[15%] px-6 py-6 text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic text-center border-r border-white/5">Subject ID</th>
                                        <th className="w-[20%] px-6 py-6 text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic text-center border-r border-white/5">Protocol Visit</th>
                                        <th className="w-[20%] px-6 py-6 text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic text-center border-r border-white/5">Form Health</th>
                                        <th className="w-[15%] px-6 py-6 text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {forms.map((f) => (
                                        <motion.tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-8 border-r border-white/5">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all shadow-lg shadow-black/20">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm md:text-base font-black text-white italic truncate tracking-tight uppercase leading-none">{f.formName}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1.5">{f.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center border-r border-white/5">
                                                <p className="text-base md:text-lg font-black text-white italic uppercase tracking-tighter leading-none">{f.subjectId}</p>
                                            </td>
                                            <td className="px-6 py-8 text-center border-r border-white/5">
                                                <p className="text-[11px] md:text-[12px] text-indigo-300/60 font-black uppercase tracking-widest italic mb-1.5">{f.visit}</p>
                                                <div className="flex flex-col items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest italic opacity-60">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        <span>UPDATED: <span className="text-slate-400">{f.lastUpdated}</span></span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center border-r border-white/5">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className={`px-5 py-2 rounded-xl border text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg ${f.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' :
                                                            f.status === 'Query Open' ? 'bg-red-500/10 text-red-500 border-red-500/40 animate-pulse shadow-red-500/10' :
                                                                f.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/40 shadow-amber-500/10' :
                                                                    'bg-white/5 border-white/10 text-slate-500'
                                                        }`}>
                                                        {f.status}
                                                    </div>
                                                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className={`h-full bg-indigo-600 rounded-full transition-all shadow-[0_0_10px_rgba(79,70,229,0.5)]`} style={{ width: `${f.completion}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-right pr-10">
                                                <div className="flex items-center justify-end gap-3 transition-all">
                                                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95 group/btn">
                                                        <Settings2 className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={() => alert(`Reviewing Instrument ${f.formName} for Subject ${f.subjectId}...`)}
                                                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-900 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-3 whitespace-nowrap"
                                                    >
                                                        Open <span className="hidden xl:inline">eCRF</span> <ChevronRight className="w-5 h-5" />
                                                    </button>
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
