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
    MessageSquare,
    Activity,
    X
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
    const [view, setView] = useState<'Splash' | 'Tracking' | 'Screeners' | 'Architect'>('Splash');
    const [builderTab, setBuilderTab] = useState<'Catalog' | 'Create New' | 'Templates'>('Catalog');
    const [selectedStudyForDetails, setSelectedStudyForDetails] = useState<any>(null);
    const [studies, setStudies] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [forms, setForms] = useState<LiveForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<string>('');

    const apiUrl = API || 'http://localhost:8003';

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

    const loadStudiesAndLeads = useCallback(async () => {
        setIsLoading(true);
        try {
            const [sRes, lRes] = await Promise.all([
                authFetch(`${API}/api/studies/`),
                authFetch(`${API}/api/leads/`)
            ]);
            if (sRes.ok) {
                const sData = await sRes.json();
                setStudies(sData.results || sData || []);
            }
            if (lRes.ok) {
                const lData = await lRes.json();
                setLeads(lData.results || lData || []);
            }
        } catch (err) {
            console.error("Failed to load study data:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getScreenerFieldCount = (s: any) => {
        const inputStep = s.screener_config?.steps?.find((st: any) => st.type === 'user_input');
        return inputStep?.questions?.length || 0;
    };

    const getScreenerQuestions = (s: any) => {
        const inputStep = s.screener_config?.steps?.find((st: any) => st.type === 'user_input');
        return inputStep?.questions || [];
    };

    const getAvgTime = (studyId: string) => {
        const studyLeads = leads.filter(l => l.study === studyId && l.metadata?.performance?.total_seconds);
        if (studyLeads.length === 0) return 'N/A';
        const total = studyLeads.reduce((acc, l) => acc + l.metadata.performance.total_seconds, 0);
        const avg = total / studyLeads.length;
        if (avg > 60) return `${Math.floor(avg / 60)}m ${Math.round(avg % 60)}s`;
        return `${Math.round(avg)}s`;
    };

    useEffect(() => {
        loadForms();
        loadStudiesAndLeads();
    }, [loadForms, loadStudiesAndLeads]);

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
                    <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight">
                        Forms
                    </h2>
                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-wider mt-2">
                        Tracking & Design
                        {lastRefresh && <span className="ml-3 text-teal-600">· {lastRefresh}</span>}
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
                            Tracking
                        </button>
                        <button
                            onClick={() => setView('Splash')}
                            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'Splash' || view === 'Architect' ? 'bg-[#1e1b4b] border border-teal-500/30 text-white shadow-lg shadow-teal-600/10' : 'text-slate-500 hover:text-white'}`}
                        >
                            Builder
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
                                { label: 'Done', val: `${completionRate}%`, icon: CheckCircle2, color: 'emerald' },
                                { label: 'Pending',   val: String(pending),       icon: Clock,        color: 'amber'   },
                                { label: 'Queries',      val: String(queryOpen),     icon: MessageSquare,color: 'red'     },
                                { label: 'Total',     val: String(total),         icon: Database,     color: 'teal'    },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center gap-4 group bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                                    <div className={`flex-shrink-0 w-10 h-10 bg-${stat.color}-500/5 border border-${stat.color}-500/10 rounded-xl flex items-center justify-center text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">{stat.label}</span>
                                        <p className="text-xl font-bold text-white tracking-tighter leading-none">{stat.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white font-bold outline-none focus:border-teal-500/50 transition-all uppercase tracking-wider placeholder:text-slate-700"
                            />
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-400 font-bold uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20 gap-3">
                                <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                                <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Loading...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-20 text-center space-y-6">
                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/5 opacity-40">
                                    <ClipboardList className="w-10 h-10 text-slate-600" />
                                </div>
                                <div className="max-w-sm mx-auto">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tighter mb-4">No Submissions</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                                        Forms will appear here. 
                                        {searchQuery && ' No matches found.'}
                                    </p>
                                    <button 
                                        onClick={() => setView('Splash')}
                                        className="mt-8 px-8 py-3 bg-teal-600/10 border border-teal-500/20 text-teal-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all italic"
                                    >
                                        Form Builder →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Table */
                            <div className="overflow-x-auto custom-scrollbar-horizontal">
                                <table className="w-full text-left min-w-[900px] border-t border-white/5">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-4 py-3 text-[10px] font-bold text-white/60 uppercase tracking-wider border-r border-white/5">Form</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-white/60 uppercase tracking-wider border-r border-white/5">Participant</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-white/60 uppercase tracking-wider border-r border-white/5">Visit</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-white/60 uppercase tracking-wider border-r border-white/5">Status</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-white/60 uppercase tracking-wider text-right">Actions</th>
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
                                                            <p className="text-sm font-bold text-white tracking-tight uppercase leading-none">{f.formName}</p>
                                                            <p className="text-[10px] text-slate-500 tracking-wider mt-0.5">{f.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Subject */}
                                                <td className="px-4 py-3 border-r border-white/5">
                                                    <p className="text-sm font-bold text-white uppercase tracking-tighter">{f.subjectId}</p>
                                                </td>
                                                {/* Visit */}
                                                <td className="px-4 py-3 border-r border-white/5">
                                                    <p className="text-xs text-teal-300/70 font-bold uppercase tracking-wider mb-1">{f.visit}</p>
                                                    {f.lastUpdated !== '--' && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-60">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Last Sync: <span className="text-slate-400">{f.lastUpdated}</span></span>
                                                        </div>
                                                    )}
                                                </td>
                                                {/* Status + Progress */}
                                                <td className="px-4 py-3 border-r border-white/5">
                                                    <div className="flex flex-col items-start gap-2">
                                                        <div className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider shadow-lg ${statusStyle(f.status)}`}>
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
                                                            onClick={() => alert(`Opening ${f.formName}`)}
                                                            className="px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                                        >
                                                            View <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-right mt-2">
                                    Showing {filtered.length} of {total} forms
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'Splash' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center min-h-[600px]">
                        <div onClick={() => setView('Tracking')} className="group p-10 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col items-center text-center hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all cursor-pointer h-full">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                                <Activity className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tighter mb-4">Tracking</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider leading-relaxed">Track form progress.</p>
                        </div>

                        <div onClick={() => setView('Screeners')} className="group p-10 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col items-center text-center hover:bg-white/[0.08] hover:border-pink-500/30 transition-all cursor-pointer h-full">
                            <div className="w-20 h-20 bg-pink-500/10 rounded-3xl flex items-center justify-center mb-8 border border-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tighter mb-4">Screeners</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider leading-relaxed">Review screening responses.</p>
                        </div>

                        <div className="md:col-span-2 p-12 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] flex flex-col md:flex-row items-center gap-12 group hover:bg-indigo-600/[0.15] transition-all">
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 text-white shrink-0 group-hover:rotate-12 transition-transform">
                                <DraftingCompass className="w-12 h-12" />
                            </div>
                            <div className="flex-1 space-y-3 text-center md:text-left">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Designer</h3>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider leading-relaxed">Create custom forms and questionnaires.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full md:w-auto max-w-sm">
                                <button onClick={() => { setBuilderTab('Create New'); setView('Architect'); }} className="px-8 py-4 bg-white text-slate-950 rounded-[2rem] text-[10px] font-bold uppercase tracking-wider hover:scale-[1.05] transition-all">Create New</button>
                                <button onClick={() => { setBuilderTab('Templates'); setView('Architect'); }} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all">Templates</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'Screeners' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="mb-8 flex items-center justify-between">
                            <button onClick={() => setView('Splash')} className="text-xs font-bold text-slate-600 uppercase tracking-wider hover:text-white transition-all">← Back</button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center gap-2">
                                    <Search className="w-4 h-4 text-pink-400" />
                                    <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{leads.length} Leads Screened</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-[#0f172a] border border-white/5 rounded-[2rem] overflow-hidden">
                                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                        <Database className="w-5 h-5 text-indigo-400" /> Screener Library
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Screeners</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1 p-1 bg-white/[0.01]">
                                    {studies.map(s => (
                                        <div 
                                            key={s.id} 
                                            onClick={() => setSelectedStudyForDetails(s)}
                                            className="p-6 bg-[#0f172a] hover:bg-white/[0.03] transition-all border border-white/5 m-1 rounded-2xl group cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                                                    {s.protocol_id}
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                            <h4 className="text-base font-bold text-white uppercase leading-tight mb-2 line-clamp-1">{s.title}</h4>
                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Questions</p>
                                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                                                        {getScreenerFieldCount(s)}
                                                    </p>
                                                </div>
                                                <div className="h-8 w-px bg-white/5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total</p>
                                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                                                        {leads.filter(l => l.study === s.id).length}
                                                    </p>
                                                </div>
                                                <div className="h-8 w-px bg-white/5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Avg Time</p>
                                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                                                        {getAvgTime(s.id)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'Architect' && (
                    <motion.div key="architect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <div className="mb-4">
                            <button onClick={() => setView('Splash')} className="text-xs font-bold text-slate-600 uppercase tracking-wider hover:text-white transition-all">← Back</button>
                        </div>
                        <QuestionnaireBuilder initialTab={builderTab} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Screener Detail Modal */}
            <AnimatePresence>
                {selectedStudyForDetails && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0B101B] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Database className="w-4 h-4 text-pink-500" />
                                        <span className="text-sm font-black text-pink-500 tracking-widest uppercase">{selectedStudyForDetails.protocol_id}</span>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter">{selectedStudyForDetails.title}</h3>
                                </div>
                                <button onClick={() => setSelectedStudyForDetails(null)} className="p-3 hover:bg-white/5 rounded-xl transition-all group">
                                    <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                <section>
                                    <h5 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Questions</h5>
                                    <div className="space-y-4">
                                        {getScreenerQuestions(selectedStudyForDetails).length > 0 ? (
                                            getScreenerQuestions(selectedStudyForDetails).map((q: any, idx: number) => (
                                                <div key={idx} className="p-5 bg-white/5 border border-white/5 rounded-xl flex items-start gap-5 group hover:border-indigo-500/30 transition-all">
                                                    <span className="text-sm md:text-base font-black text-slate-600 group-hover:text-indigo-400 mt-1">{(idx+1).toString().padStart(2, '0')}</span>
                                                    <div className="flex-1">
                                                        <p className="text-base md:text-lg font-bold text-white mb-2">{q.label}</p>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[11px] md:text-xs font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-md border border-white/10">{q.type.replace('_', ' ')}</span>
                                                            {q.required && <span className="text-[11px] md:text-xs font-black text-pink-500/80 uppercase tracking-widest">Required</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                                <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
                                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No questions configured for this protocol</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                            <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-center">
                                <p className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic">SECURE DATA VIEW · MusB RESEARCH</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
