import React, { useState, useEffect, useMemo } from 'react';
import QuestionnaireBuilder from '../QuestionnaireBuilder';
import {
    ClipboardList,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    FileText,
    Database,
    Loader2,
    RefreshCw,
    ExternalLink,
    Trash2
} from 'lucide-react';
import { API, authFetch } from '../../../utils/auth';

interface AssignedForm {
    id: string;
    form_details?: {
        id: string;
        title: string;
    };
    participant: string;
    status: string;
    updated_at: string;
    due_date?: string;
}

export default function FormsQuestionnairesModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [view, setView] = useState<'Tracking' | 'Splash' | 'Architect'>('Tracking');
    const [builderTab, setBuilderTab] = useState('Create New');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const [forms, setForms] = useState<AssignedForm[]>([]);
    const [templates, setTemplates] = useState<any[]>([]); // To store saved form definitions
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apiUrl = API || 'http://localhost:8000';

    const fetchForms = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = selectedStudyId && selectedStudyId !== 'all' 
                ? `${apiUrl}/api/assigned-forms/?study_id=${selectedStudyId}`
                : `${apiUrl}/api/assigned-forms/`;
            
            const res = await authFetch(url);
            if (res.ok) {
                const data = await res.json();
                setForms(Array.isArray(data) ? data : (data.results || []));
            }

            // Also fetch templates (form definitions)
            const templateRes = await authFetch(
                selectedStudyId && selectedStudyId !== 'all'
                    ? `${apiUrl}/api/forms/?study_id=${selectedStudyId}`
                    : `${apiUrl}/api/forms/`
            );
            if (templateRes.ok) {
                const templateData = await templateRes.json();
                setTemplates(Array.isArray(templateData) ? templateData : (templateData.results || []));
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this study template? This action cannot be undone.")) return;
        
        try {
            const res = await authFetch(`${apiUrl}/api/forms/${templateId}/`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchForms(); // Refresh
            }
        } catch (err) {
            console.error("Failed to delete template", err);
        }
    };

    useEffect(() => {
        fetchForms();
    }, [selectedStudyId]);

    const filteredForms = useMemo(() => {
        return (forms || []).filter(f => {
            const title = f.form_details?.title || '';
            const participant = f.participant || '';
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                participant.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [forms, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        if (!forms?.length) return { completion: '0%', pending: 0, queries: 0, synced: 0 };
        const completed = forms.filter(f => f.status === 'COMPLETED').length;
        const pending = forms.filter(f => f.status === 'PENDING').length;
        const queries = forms.filter(f => f.status === 'PARTICIPANT_SIGNED').length;
        
        return {
            completion: `${Math.round((completed / forms.length) * 100)}%`,
            pending,
            queries,
            synced: completed
        };
    }, [forms]);

    if (isLoading && forms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing metadata...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Eligibility Questionnaires</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">eCRF Management & Dynamic Instrument Design</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchForms} className="p-2 text-slate-500 hover:text-white transition-colors border border-slate-800 rounded-lg hover:bg-slate-800">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-start border-b border-slate-800 pb-6">
                <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setView('Tracking')}
                        className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${view === 'Tracking' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Form Tracking
                    </button>
                    <button
                        onClick={() => { setSelectedTemplate(null); setView('Splash'); }}
                        className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${view !== 'Tracking' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Form Builder
                    </button>
                </div>
            </div>

            {view === 'Tracking' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Completion Rate', val: stats.completion, icon: CheckCircle2, color: 'emerald' },
                            { label: 'Pending Forms', val: stats.pending, icon: Clock, color: 'amber' },
                            { label: 'Active Queries', val: stats.queries, icon: AlertCircle, color: 'rose' },
                            { label: 'Synced to EDC', val: stats.synced, icon: Database, color: 'indigo' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-xl flex items-center gap-4">
                                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-white mt-1">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input 
                                type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <select 
                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-[10px] font-bold text-slate-400 focus:outline-none focus:text-white uppercase tracking-widest"
                        >
                            <option value="All">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    <div className="bg-slate-900/20 border border-slate-800/50 rounded-xl overflow-hidden">
                        <div className="px-6 py-5 bg-slate-800/20 border-b border-slate-800 flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest text-white">Subject Submissions</h4>
                            <span className="text-xs font-bold text-slate-400">{filteredForms.length} Participants</span>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Form Name</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Subject ID</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredForms.length > 0 ? filteredForms.map((f) => (
                                    <tr key={f.id} className="hover:bg-slate-800/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-100">{f.form_details?.title || 'Unknown Form'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-xs font-mono text-slate-400">{f.participant}</span></td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                                                f.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                f.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 
                                                'bg-slate-800 text-slate-400'
                                            }`}>
                                                {f.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs text-slate-300 font-bold">{new Date(f.updated_at).toLocaleDateString('en-US')}</span>
                                                <span className="text-[9px] text-slate-500 uppercase tracking-widest">{new Date(f.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-base font-bold uppercase tracking-widest">No submissions found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* NEW: ACTIVE TEMPLATES SECTION */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Deployed Study Templates</h3>
                            <div className="h-px bg-indigo-500/20 flex-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((t, i) => (
                                <div key={i} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/40 transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20">
                                            <Database className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-widest ${t.is_published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                            {t.is_published ? 'LIVE' : 'DRAFT'}
                                        </span>
                                        <button 
                                            onClick={() => handleDeleteTemplate(t.id)}
                                            className="ml-2 p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
                                            title="Delete Template"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <h5 className="text-base font-black text-white mb-2 group-hover:text-indigo-400 transition-colors uppercase truncate">{t.title}</h5>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 italic">"{t.description}"</p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v{t.version || 1.0}</span>
                                        <button 
                                            onClick={() => { setSelectedTemplate(t); setView('Architect'); }}
                                            className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            Modify Template →
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="col-span-full py-10 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600">
                                     <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">No templates deployed</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {view === 'Splash' && (
                <div className="p-12 bg-slate-900/30 border border-slate-800 rounded-3xl flex flex-col items-center text-center space-y-8">
                    <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400"><Plus className="w-10 h-10" /></div>
                    <div className="max-w-md">
                        <h3 className="text-xl font-bold text-white tracking-tight mb-2 uppercase">Instrument Architect</h3>
                        <p className="text-xs text-slate-400">Design multi-page electronic case report forms (eCRF) with built-in edit checks and logic branching.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => { setBuilderTab('Create New'); setView('Architect'); }} className="px-8 py-3 bg-white text-slate-950 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Create New eCRF</button>
                    </div>
                </div>
            )}

            {view === 'Architect' && (
                <div className="">
                    <button onClick={() => { setView('Tracking'); fetchForms(); }} className="mb-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-white transition-all">← Back to Dashboard</button>
                    <QuestionnaireBuilder initialTemplate={selectedTemplate} />
                </div>
            )}
        </div>
    );
}
