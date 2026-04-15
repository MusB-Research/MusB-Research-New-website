import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionnaireBuilder from '../../coordinator/QuestionnaireBuilder';
import { authFetch, API } from '../../../utils/auth';
import {
    ClipboardList,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    DraftingCompass,
    FileText,
    Settings2,
    Database,
    RefreshCw,
    MessageSquare
} from 'lucide-react';

interface LiveForm {
    id: string;
    formName: string;
    formId: string;
    subjectId: string;   // participant_sid
    visit: string;
    status: 'Completed' | 'Query Open' | 'Pending' | 'In Progress';
    lastUpdated: string;
    completion: number;
    rawId: string;       // DB id for navigation
}

export default function FormsQuestionnairesModule() {
    const [view, setView] = useState<'Tracking' | 'Splash' | 'Architect'>('Tracking');
    const [builderTab, setBuilderTab] = useState('Create New');
    const [searchQuery, setSearchQuery] = useState('');
    const [forms, setForms] = useState<LiveForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<string>('');

    const apiUrl = API || 'http://localhost:8000';

    const loadForms = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${apiUrl}/api/assigned-forms/`);
            if (!res.ok) throw new Error(`API ${res.status}`);
            const raw = await res.json();
            const list: any[] = Array.isArray(raw) ? raw : (raw.results || []);

            const mapped: LiveForm[] = list.map((af: any) => {
                // Determine status from backend fields
                let status: LiveForm['status'] = 'Pending';
                const beStatus = (af.status || '').toUpperCase();
                if (beStatus === 'COMPLETED' || beStatus === 'SIGNED') {
                    status = 'Completed';
                } else if (beStatus === 'QUERY_OPEN' || beStatus === 'DISCREPANCY') {
                    status = 'Query Open';
                } else if (beStatus === 'IN_PROGRESS' || beStatus === 'SUBMITTED') {
                    status = 'In Progress';
                }

                // Completion: if completed = 100, otherwise use data field count heuristic
                let completion = 0;
                if (status === 'Completed') completion = 100;
                else if (status === 'In Progress') completion = 60;
                else if (status === 'Query Open') completion = 85;

                // Prefer form_details.title, fallback to form id
                const formName = af.form_details?.title || af.form_details?.name || `Form ${af.form}`;

                // Visit name from visit_name field or visit object
                const visit = af.visit_name || af.visit?.visit_type || af.timeline_group || 'General';

                // Subject SID
                const subjectId = af.participant_sid || af.participant_details?.participant_sid || `P-${String(af.participant).slice(-4)}`;

                // Last updated
                const lastUpdated = af.updated_at
                    ? new Date(af.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
                    : '--';

                return {
                    id: `FRM-${String(af.id).slice(-4).toUpperCase()}`,
                    formName,
                    formId: String(af.form || ''),
                    subjectId,
                    visit,
                    status,
                    lastUpdated,
                    completion,
                    rawId: String(af.id)
                };
            });

            setForms(mapped);
            setLastRefresh(new Date().toLocaleTimeString());
        } catch (err: any) {
            console.error('[FormsQuestionnairesModule] Load error:', err);
            setError('Failed to load form data. Check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => { loadForms(); }, [loadForms]);

    // ── KPI Computations ──────────────────────────────────────────
    const total = forms.length;
    const completed = forms.filter(f => f.status === 'Completed').length;
    const pending = forms.filter(f => f.status === 'Pending').length;
    const queryOpen = forms.filter(f => f.status === 'Query Open').length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

    const filtered = forms.filter(f =>
        !searchQuery ||
        f.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.subjectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.visit.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusStyle = (s: string) => {
        switch (s) {
            case 'Completed':  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10';
            case 'Query Open': return 'bg-red-500/10 text-red-400 border-red-500/40 animate-pulse shadow-red-500/10';
            case 'In Progress':return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default:           return 'bg-amber-500/10 text-amber-500 border-amber-500/40 shadow-amber-500/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight">
                        ELIGIBILITY <span className="text-teal-400">QUESTIONNAIRES</span>
                    </h2>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.4em] mt-2 italic">
                        eCRF Management &amp; Dynamic Instrument Design
                        {lastRefresh && <span className="ml-3 text-teal-600">· Synced {lastRefresh}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadForms}
                        disabled={isLoading}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-teal-500/40 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
                    </button>
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full lg:w-auto">
                        <button
                            onClick={() => setView('Tracking')}
                            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'Tracking' ? 'bg-[#1e1b4b] border border-teal-500/30 text-white shadow-lg shadow-teal-600/10' : 'text-slate-500 hover:text-white'}`}
                        >
                            Form Tracking
                        </button>
                        <button
                            onClick={() => setView('Splash')}
                            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'Splash' || view === 'Architect' ? 'bg-[#1e1b4b] border border-teal-500/30 text-white shadow-lg shadow-teal-600/10' : 'text-slate-500 hover:text-white'}`}
                        >
                            Form Builder
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'Tracking' && (
                    <motion.div key="tracking" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

                        {/* KPI Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'Completion Rate', val: `${completionRate}%`, icon: CheckCircle2, color: 'emerald' },
                                { label: 'Pending Forms',   val: String(pending),       icon: Clock,        color: 'amber'   },
                                { label: 'Query Open',      val: String(queryOpen),     icon: MessageSquare,color: 'red'     },
                                { label: 'Total eCRFs',     val: String(total),         icon: Database,     color: 'teal'    },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center gap-4 group bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                                    <div className={`flex-shrink-0 w-10 h-10 bg-${stat.color}-500/5 border border-${stat.color}-500/10 rounded-xl flex items-center justify-center text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest italic block">{stat.label}</span>
                                        <p className="text-xl font-black text-white italic tracking-tighter leading-none">{stat.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by form name, subject ID, or visit..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white font-bold outline-none focus:border-teal-500/50 transition-all uppercase tracking-widest font-mono placeholder:text-slate-700"
                            />
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-400 font-bold uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20 gap-3">
                                <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                                <span className="text-sm text-slate-500 font-black uppercase tracking-widest">Loading eCRF Records...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-16 text-center space-y-4">
                                <ClipboardList className="w-12 h-12 text-slate-800 mx-auto" />
                                <p className="text-sm font-black text-slate-600 uppercase tracking-widest italic">
                                    {searchQuery ? 'No forms match your search.' : 'No assigned forms found for this study.'}
                                </p>
                            </div>
                        ) : (
                            /* Table */
                            <div className="overflow-x-auto custom-scrollbar-horizontal">
                                <table className="w-full text-left min-w-[900px] border-t border-white/5">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-4 py-3 text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">eCRF Instrument</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Subject ID</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Study Visit</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-white/60 uppercase tracking-widest border-r border-white/5">Form Health</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-white/60 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((f) => (
                                            <motion.tr key={f.rawId} className="hover:bg-white/[0.02] transition-colors group">
                                                {/* Form Name */}
                                                <td className="px-4 py-3 border-r border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-teal-400 group-hover:border-teal-500/40 transition-all flex-shrink-0">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white italic truncate tracking-tight uppercase leading-none">{f.formName}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5">{f.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Subject */}
                                                <td className="px-4 py-3 border-r border-white/5">
                                                    <p className="text-sm font-black text-white italic uppercase tracking-tighter">{f.subjectId}</p>
                                                </td>
                                                {/* Visit */}
                                                <td className="px-4 py-3 border-r border-white/5">
                                                    <p className="text-xs text-teal-300/70 font-black uppercase tracking-widest italic mb-1">{f.visit}</p>
                                                    {f.lastUpdated !== '--' && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-60">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Updated: <span className="text-slate-400">{f.lastUpdated}</span></span>
                                                        </div>
                                                    )}
                                                </td>
                                                {/* Status + Progress */}
                                                <td className="px-4 py-3 border-r border-white/5">
                                                    <div className="flex flex-col items-start gap-2">
                                                        <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-lg ${statusStyle(f.status)}`}>
                                                            {f.status}
                                                        </div>
                                                        <div className="w-28 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-teal-500 to-teal-700 rounded-full transition-all"
                                                                style={{ width: `${f.completion}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                                            <Settings2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => alert(`Opening eCRF for ${f.formName} — Subject ${f.subjectId}`)}
                                                            className="px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                                        >
                                                            Open eCRF <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-right mt-2">
                                    Showing {filtered.length} of {total} eCRF records
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'Splash' && (
                    <motion.div key="splash" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-16 bg-[#0B101B]/40 border border-white/5 rounded-[3rem] flex flex-col items-center text-center space-y-8 group">
                        <div className="w-24 h-24 bg-teal-600/10 border border-teal-500/20 rounded-[2.5rem] flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                            <DraftingCompass className="w-12 h-12" />
                        </div>
                        <div className="max-w-xl space-y-3">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Instrument Architect</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">Design multi-page electronic case report forms (eCRF) with built-in edit checks, logic branching, and dynamic field visibility.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <button onClick={() => { setBuilderTab('Create New'); setView('Architect'); }} className="py-4 bg-white text-slate-950 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:scale-[1.05] transition-all">Create New eCRF</button>
                            <button onClick={() => { setBuilderTab('Templates'); setView('Architect'); }} className="py-4 bg-white/5 border border-white/10 text-slate-400 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:text-white transition-all">Import Template</button>
                        </div>
                    </motion.div>
                )}

                {view === 'Architect' && (
                    <motion.div key="architect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <div className="mb-4">
                            <button onClick={() => setView('Splash')} className="text-xs font-black text-slate-600 uppercase tracking-widest hover:text-white transition-all">← Back to Architect Home</button>
                        </div>
                        <QuestionnaireBuilder initialTab={builderTab} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
