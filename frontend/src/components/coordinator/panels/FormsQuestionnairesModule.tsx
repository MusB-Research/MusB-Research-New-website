import React, { useState, useEffect, useMemo } from 'react';
import QuestionnaireBuilder from '../QuestionnaireBuilder';
import ScreenerBuilder from '../ScreenerBuilder';
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
import { motion, AnimatePresence } from 'framer-motion';
import { API, authFetch } from '../../../utils/auth';
import { SkeletonLoader } from '../../shared/SkeletonLoader';

interface AssignedForm {
    id: string;
    form_details?: {
        id: string;
        title: string;
    };
    participant: string;
    participant_name?: string;
    status: string;
    updated_at: string;
    due_date?: string;
}

export default function FormsQuestionnairesModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [view, setView] = useState<'Tracking' | 'Splash' | 'Architect' | 'Screener'>('Tracking');
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [builderTab, setBuilderTab] = useState('Create New');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const [forms, setForms] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabDropdownOpen, setTabDropdownOpen] = useState(false);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const apiUrl = API || 'http://localhost:8003';

    const fetchForms = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const baseUrl = selectedStudyId && selectedStudyId !== 'all' 
                ? `study_id=${selectedStudyId}`
                : '';
            
            const [afRes, qsRes, templateRes] = await Promise.all([
                authFetch(`${apiUrl}/api/assigned-forms/${baseUrl ? '?' + baseUrl : ''}`),
                authFetch(`${apiUrl}/api/questionnaire-schedules/${baseUrl ? '?' + baseUrl : ''}`),
                authFetch(`${apiUrl}/api/questionnaire-templates/`)
            ]);

            let mergedForms: any[] = [];

            if (afRes.ok) {
                const data = await afRes.json();
                const afs = (Array.isArray(data) ? data : (data.results || [])).map((f: any) => ({
                    ...f,
                    type: 'ASSIGNED_FORM',
                    title: f.form_details?.title || 'Form Submission'
                }));
                mergedForms = [...mergedForms, ...afs];
            }

            if (qsRes.ok) {
                const data = await qsRes.json();
                const qss = (Array.isArray(data) ? data : (data.results || [])).map((f: any) => ({
                    ...f,
                    type: 'SCHEDULED_INSTRUMENT',
                    title: f.schedule_name || f.template_details?.name || 'Instrument',
                    participant_name: f.participant_details?.full_name || f.participant_name,
                    updated_at: f.completed_at || f.updated_at || f.created_at
                }));
                mergedForms = [...mergedForms, ...qss];
            }

            setForms(mergedForms);

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
            const title = f.title || f.form_details?.title || '';
            const participant = f.participant || '';
            const participantName = f.participant_name || '';
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 participant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 participantName.toLowerCase().includes(searchQuery.toLowerCase());
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
            <div className="space-y-10">
                <SkeletonLoader type="grid" />
                <SkeletonLoader type="table" rows={6} />
            </div>
        );
    }

    const TABS = [
        { id: 'Tracking', label: 'Form Tracking', color: 'blue' },
        { id: 'Splash', label: 'Form Builder', color: 'blue' },
        { id: 'Screener', label: 'Screener Builder', color: 'pink' }
    ];

    const currentTabLabel = TABS.find(t => t.id === view || (t.id === 'Splash' && view === 'Architect'))?.label || 'Form Tracking';

    return (
        <div className="space-y-8">
            <div className={`flex ${isMobile ? 'flex-col' : 'items-end justify-between'} gap-6`}>
                <div>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-xl'} font-bold text-white tracking-tight uppercase`}>Forms</h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-2">Tracking & Design</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchForms} className={`p-3 text-slate-500 hover:text-white transition-colors border border-slate-800 rounded-xl hover:bg-slate-800 ${isMobile ? 'w-full flex justify-center' : ''}`}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Responsive Tabs */}
            <div className="relative">
                {isMobile ? (
                    <div className="relative">
                        <button 
                            onClick={() => setTabDropdownOpen(!tabDropdownOpen)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-[12px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
                        >
                            <span>{currentTabLabel}</span>
                            <Plus className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${tabDropdownOpen ? 'rotate-45' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {tabDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl z-[60] space-y-1"
                                >
                                    {TABS.map(tab => (
                                        <button 
                                            key={tab.id} 
                                            onClick={() => { 
                                                if (tab.id === 'Splash') setSelectedTemplate(null);
                                                setView(tab.id as any); 
                                                setTabDropdownOpen(false); 
                                            }}
                                            className={`w-full flex items-center px-4 py-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${(view === tab.id || (tab.id === 'Splash' && view === 'Architect')) ? `bg-${tab.color}-600 text-white` : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex items-center justify-start border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                            <button
                                onClick={() => setView('Tracking')}
                                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${view === 'Tracking' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Tracking
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTemplate(null);
                                    setView('Splash');
                                }}
                                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${view === 'Splash' || view === 'Architect' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Builder
                            </button>
                            <button
                                onClick={() => setView('Screener')}
                                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${view === 'Screener' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Screeners
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {view === 'Tracking' && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
                        {[
                            { label: 'Done', val: stats.completion, icon: CheckCircle2, color: 'emerald' },
                            { label: 'Pending', val: stats.pending, icon: Clock, color: 'blue' },
                            { label: 'Queries', val: stats.queries, icon: AlertCircle, color: 'rose' },
                            { label: 'Synced', val: stats.synced, icon: Database, color: 'blue' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl flex items-center gap-4 group hover:bg-slate-900/60 transition-all">
                                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-white tracking-tighter leading-none">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-4`}>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input 
                                type="text" placeholder="SEARCH INSTRUMENTS / SUBJECTS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-[12px] text-white font-bold uppercase tracking-widest focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
                            />
                        </div>
                        <select 
                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className={`bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-6 text-[11px] font-bold text-slate-400 focus:outline-none focus:text-white uppercase tracking-wider ${isMobile ? 'w-full' : ''}`}
                        >
                            <option value="All">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    {/* Content List/Table */}
                    <div className="bg-[#0f1133]/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Submissions</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{filteredForms.length} Forms</p>
                            </div>
                        </div>

                        {isMobile ? (
                            <div className="p-4 space-y-4">
                                {filteredForms.length > 0 ? filteredForms.map((f) => (
                                    <div key={f.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${f.type === 'SCHEDULED_INSTRUMENT' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-white uppercase tracking-tight leading-none">{f.title || 'Form'}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">{f.type?.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                                <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                                                f.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                f.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                                'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>
                                                {f.status}
                                            </div>
                                        </div>

                                        <div className="py-4 border-y border-white/5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Participant</span>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white uppercase leading-none">{f.participant_name || 'Anonymous'}</p>
                                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tight mt-1">{f.participant}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last Sync</span>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-300 uppercase leading-none">{new Date(f.updated_at).toLocaleDateString('en-US')}</p>
                                                    <p className="text-[10px] text-slate-600 font-bold tracking-wider mt-1">{new Date(f.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95">
                                            Open <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center">
                                        <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                        <p className="text-sm font-bold uppercase tracking-wider text-slate-600">No submissions found</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.01] border-b border-white/5 whitespace-nowrap">
                                        <th className="px-8 py-5 text-[11px] font-bold text-white/40 uppercase tracking-wider border-r border-white/5">Form</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-white/40 uppercase tracking-wider border-r border-white/5">Participant</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-white/40 uppercase tracking-wider border-r border-white/5">Status</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-white/40 uppercase tracking-wider text-right">Last Sync</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredForms.length > 0 ? filteredForms.map((f) => (
                                        <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5 border-r border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-xl border transition-all ${f.type === 'SCHEDULED_INSTRUMENT' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white'}`}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-bold text-white uppercase tracking-tight leading-none">{f.title || 'Form'}</span>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">{f.type?.replace(/_/g, ' ')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 border-r border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-white uppercase tracking-tighter leading-none">{f.participant_name || 'Anonymous'}</span>
                                                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mt-1.5">{f.participant}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 border-r border-white/5">
                                                <span className={`px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${
                                                    f.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white' : 
                                                    f.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white' : 
                                                    'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                    {f.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="text-[13px] text-white font-bold uppercase leading-none">{new Date(f.updated_at).toLocaleDateString('en-US')}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono opacity-60">{new Date(f.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="px-8 py-24 text-center text-slate-600 text-sm font-bold uppercase tracking-wider opacity-40">No Forms</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {view === 'Splash' && (
                <div className={`p-8 md:p-20 bg-slate-900/30 border border-slate-800 rounded-[3rem] flex flex-col items-center text-center space-y-10 ${isMobile ? 'py-16' : ''}`}>
                    <div className="w-24 h-24 bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-900/20"><Plus className="w-12 h-12" /></div>
                    <div className="max-w-md">
                        <h3 className="text-2xl font-bold text-white uppercase tracking-tighter mb-4">Designer</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed">Create custom forms and questionnaires.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => { setBuilderTab('Create New'); setView('Architect'); }} className="px-12 py-5 bg-white text-slate-950 rounded-[1.5rem] text-[12px] font-bold uppercase tracking-wider hover:scale-105 transition-all shadow-2xl active:scale-95">Create New</button>
                    </div>
                </div>
            )}

            {view === 'Architect' && (
                <div className="">
                    <button onClick={() => { setView('Tracking'); fetchForms(); }} className="mb-8 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back
                    </button>
                    <QuestionnaireBuilder initialTemplate={selectedTemplate} initialTab={builderTab} />
                </div>
            )}

            {view === 'Screener' && (
                <div className="">
                    <button onClick={() => { setView('Tracking'); fetchForms(); }} className="mb-8 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back
                    </button>
                    <ScreenerBuilder />
                </div>
            )}
        </div>
    );
}
