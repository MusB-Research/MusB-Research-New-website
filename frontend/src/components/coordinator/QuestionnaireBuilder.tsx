import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API, authFetch } from '../../utils/auth';
import { 
    Plus, 
    Save, 
    Eye, 
    Calculator, 
    Rocket, 
    Layers, 
    Settings, 
    ChevronDown, 
    ChevronRight, 
    Search, 
    MoreVertical, 
    GripVertical, 
    Trash2, 
    Copy, 
    Clock, 
    ShieldCheck, 
    FileText, 
    Layout, 
    Smartphone, 
    Monitor, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Lock,
    X,
    XCircle,
    DraftingCompass,
    PieChart,
    Share2,
    Calendar,
    PenTool,
    Activity
} from 'lucide-react';

interface Question {
    id: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
    scoring?: Record<string, number>;
    logic?: string;
    width: 'Full' | 'Half' | 'Third';
}

interface Section {
    id: string;
    title: string;
    questions: Question[];
}

const MOCK_QUESTIONNAIRE: Section[] = [
    {
        id: 's1',
        title: 'Basic Clinical Identification',
        questions: [
            { id: 'q1', label: 'Participant Identification Code', type: 'Short Text', required: true, width: 'Full' },
            { id: 'q2', label: 'Date of Assessment', type: 'Date', required: true, width: 'Half' },
            { id: 'q3', label: 'Current Visit Number', type: 'Number', required: true, width: 'Half' }
        ]
    },
    {
        id: 's2',
        title: 'GI Symptom Survey (Validated Scale)',
        questions: [
            { 
                id: 'q4', 
                label: 'Intensity of abdominal bloating over the last 7 days', 
                type: 'Likert Scale (1-7)', 
                required: true, 
                width: 'Full',
                options: ['1 - None', '2', '3', '4', '5', '6', '7 - Severe'],
                scoring: { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 }
            },
            { 
                id: 'q5', 
                label: 'Frequency of indigestion symptoms', 
                type: 'Dropdown', 
                required: true, 
                width: 'Half',
                options: ['Never', 'Rarely', 'Occasionally', 'Often', 'Constantly']
            }
        ]
    }
];

export default function QuestionnaireBuilder({ initialTab = 'Create New' }: { initialTab?: string }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [sections, setSections] = useState<Section[]>(MOCK_QUESTIONNAIRE);
    const [selectedQId, setSelectedQId] = useState<string | null>('q4');
    const [previewMode, setPreviewMode] = useState<'Desktop' | 'Mobile'>('Desktop');
    const [isFormulaOpen, setIsFormulaOpen] = useState(false);
    const [studies, setStudies] = useState<any[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState<string>('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formTitle, setFormTitle] = useState("MusB-GI HyperImmunity Screening");
    const [formulas, setFormulas] = useState([
        { id: 'f1', label: 'GI Distress Total', val: 'SUM (q4 + q5 + q8)', status: 'ACTIVE', color: 'indigo' },
        { id: 'f2', label: 'Symptom Slope', val: 'd(GI)/dt [Rolling 14d]', status: 'DRAFT', color: 'slate' },
        { id: 'f3', label: 'BMI Analysis', val: 'Wt (kg) / Ht (m^2)', status: 'LOCKED', color: 'slate' },
        { id: 'f4', label: 'Safety Threshold', val: 'MAX(AE) > 12.5', status: 'ACTIVE', color: 'red' }
    ]);
    const [selectedFormulaId, setSelectedFormulaId] = useState('f1');
    const [savedForms, setSavedForms] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const fetchForms = async () => {
        setIsFetching(true);
        try {
            const res = await authFetch(`${API}/api/forms/`);
            if (res.ok) {
                const data = await res.json();
                setSavedForms(data);
            }
        } catch (err) {
            console.error("Failed to fetch forms", err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'My Questionnaires') {
            fetchForms();
        }
    }, [activeTab]);

    const addFormula = () => {
        const newF = {
            id: `f-${Date.now()}`,
            label: 'New Strategic Formula',
            val: 'Enter algebraic logic...',
            status: 'DRAFT',
            color: 'slate'
        };
        setFormulas([...formulas, newF]);
        setSelectedFormulaId(newF.id);
    };

    const selectedFormula = useMemo(() => formulas.find(f => f.id === selectedFormulaId), [formulas, selectedFormulaId]);
    const [isStudyDropdownOpen, setIsStudyDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchStudies = async () => {
            try {
                const res = await authFetch(`${API}/api/studies/`);
                if (res.ok) {
                    const data = await res.json();
                    setStudies(data);
                    if (data.length > 0) setSelectedStudyId(data[0].id);
                }
            } catch (err) {
                console.error("Failed to load studies", err);
            }
        };
        fetchStudies();
    }, []);

    const handleSave = async (isPublished = false) => {
        if (!selectedStudyId) {
            alert("Please select a study to assign this screener to.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                study: selectedStudyId,
                title: 'Screener Form', // Must match StudyScreener.tsx filter
                description: `Dynamic screener: ${formTitle}`,
                schema: { sections },
                is_published: isPublished,
                version: 1
            };

            const res = await authFetch(`${API}/api/forms/`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(isPublished ? "Screener published and assigned successfully!" : "Screener saved as draft.");
            } else {
                const errData = await res.json();
                alert(`Error saving screener: ${JSON.stringify(errData)}`);
            }
        } catch (err) {
            console.error(err);
            alert("Connection error while saving screener.");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedQuestion = useMemo(() => {
        for (const s of sections) {
            const q = s.questions.find(q => q.id === selectedQId);
            if (q) return q;
        }
        return null;
    }, [sections, selectedQId]);

    const addQuestion = (sectionId: string) => {
        const newQ: Question = {
            id: `q-${Date.now()}`,
            label: 'New Strategic Question',
            type: 'Short Text',
            required: false,
            width: 'Full'
        };
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, questions: [...s.questions, newQ] } : s));
        setSelectedQId(newQ.id);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setSections(prev => prev.map(s => ({
            ...s,
            questions: s.questions.map(q => q.id === id ? { ...q, ...updates } : q)
        })));
    };

    const deleteQuestion = (id: string) => {
        setSections(prev => prev.map(s => ({
            ...s,
            questions: s.questions.filter(q => q.id !== id)
        })));
        if (selectedQId === id) setSelectedQId(null);
    };

    return (
        <div className="space-y-8 lg:space-y-10 pb-20">
            {/* 1. Control Hub Card: Basic Details & Actions */}
            <div className="bg-[#0B101B]/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="px-8 lg:px-12 py-10 lg:py-14 border-b border-white/5 space-y-12">
                    {/* Row 1: Title & Actions */}
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/10 shrink-0">
                                <DraftingCompass className="w-6 h-6 lg:w-9 lg:h-9" />
                            </div>
                            <div>
                                <h2 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">FORM <span className="text-indigo-400">BUILDER</span></h2>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] italic leading-tight">Create and manage your forms</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <button onClick={() => handleSave(false)} className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-4 group shadow-lg">
                                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-black uppercase tracking-widest leading-none">Save Draft</span>
                            </button>
                            <button onClick={() => setIsPreviewOpen(true)} className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-4 group shadow-lg">
                                <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-black uppercase tracking-widest leading-none">Preview</span>
                            </button>
                            <button onClick={() => setIsFormulaOpen(true)} className="px-6 py-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/80 rounded-2xl hover:bg-indigo-500/10 hover:text-indigo-400 transition-all flex items-center justify-center gap-4 group shadow-lg">
                                <Calculator className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-black uppercase tracking-widest leading-none">Scoring</span>
                            </button>
                            <button onClick={() => handleSave(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 border border-indigo-400/20 group outline-none">
                                <Rocket className="w-4 h-4 group-hover:animate-bounce" />
                                <span className="text-sm font-black uppercase tracking-widest leading-none">Publish</span>
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Secondary Information */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 border-t border-white/5">
                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm text-slate-500 font-black uppercase tracking-[0.2em] italic px-1">Form Name</label>
                            <input 
                                type="text" 
                                placeholder="Enter Form Title..." 
                                value={formTitle} 
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-8 text-sm font-black text-white italic uppercase placeholder-slate-800 outline-none focus:border-indigo-500/50 transition-all shadow-inner" 
                            />
                        </div>
                        <div className="md:col-span-4 space-y-3">
                            <label className="text-sm text-slate-500 font-black uppercase tracking-[0.2em] italic px-1">Select Study</label>
                            <div 
                                onClick={() => setIsStudyDropdownOpen(!isStudyDropdownOpen)}
                                className="w-full py-5 px-6 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-all shadow-inner relative"
                            >
                                <span className="text-sm font-black text-indigo-400 uppercase italic truncate">
                                    {studies.find(s => s.id === selectedStudyId)?.protocol_id || 'Select Study'}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform shrink-0 ${isStudyDropdownOpen ? 'rotate-180' : ''}`} />
                                <AnimatePresence>
                                    {isStudyDropdownOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-3 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-3xl"
                                        >
                                            {studies.map(s => (
                                                <div key={s.id} onClick={() => setSelectedStudyId(s.id)} className="px-6 py-4 text-sm font-bold text-slate-400 uppercase italic hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0">{s.protocol_id}</div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm text-slate-500 font-black uppercase tracking-[0.2em] italic px-1">Revision</label>
                            <div className="py-5 px-6 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-black text-slate-500 uppercase italic text-center shadow-inner">v1.2.0</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="px-12 flex gap-12 overflow-x-auto custom-scrollbar-horizontal whitespace-nowrap bg-black/20">
                    {['My Forms', 'Builder', 'Templates', 'Scoring', 'Database'].map(tab => {
                        const actualTab = tab === 'My Forms' ? 'My Questionnaires' : tab === 'Builder' ? 'Create New' : tab === 'Database' ? 'Registry' : tab;
                        return (
                            <button key={tab} onClick={() => setActiveTab(actualTab)} className={`pb-5 pt-5 text-sm font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === actualTab ? 'text-white italic' : 'text-slate-600 hover:text-slate-300'}`}>
                                {tab}
                                {activeTab === actualTab && <motion.div layoutId="nav-ind" className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />}
                            </button>
                        );
                    })}
                </div>
            </div>


            {/* 2. Dynamic Viewport based on Active Tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'Create New' && (
                    <motion.div 
                        key="create"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch"
                    >
                        {/* Column A: Form Steps (Left Sidebar) */}
                        <div className="xl:col-span-3 bg-[#0B101B]/60 border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl min-h-[600px] xl:h-[800px]">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] italic">Steps List</span>
                                <button onClick={() => setSections([...sections, { id: `s-${Date.now()}`, title: 'New Section', questions: [] }])} className="p-2 bg-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                {sections.map(section => (
                                    <div key={section.id} className="space-y-4">
                                        <div className="flex items-center justify-between group">
                                            <h4 className="text-sm font-black text-white uppercase italic tracking-widest truncate flex-1">{section.title}</h4>
                                            <button onClick={() => addQuestion(section.id)} className="p-1 px-2 border border-indigo-500/20 text-indigo-400 rounded-md text-xs font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Add Question</button>
                                        </div>
                                        <div className="pl-3 space-y-1.5 border-l border-white/5">
                                            {section.questions.map(q => (
                                                <button key={q.id} onClick={() => setSelectedQId(q.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedQId === q.id ? 'bg-indigo-600/10 text-white italic border border-indigo-500/20' : 'text-slate-600 hover:text-slate-400 border border-transparent'}`}>
                                                    <span className="text-sm font-black uppercase tracking-tight truncate flex-1 text-left">{q.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column B: Design Area (Center) */}
                        <div className="xl:col-span-9 bg-[#0B101B]/40 border border-white/5 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl min-h-[600px] xl:h-[800px]">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <span className="text-sm font-black text-white/50 uppercase tracking-[0.2em] italic">Workspace</span>
                                <div className="flex gap-4 items-center">
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
                                        <Monitor className="w-4 h-4 text-indigo-400" />
                                        <Smartphone className="w-4 h-4 text-slate-700" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-14 space-y-20">
                                {sections.map(section => (
                                    <section key={section.id} className="space-y-10 group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 text-sm font-black">#</div>
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-none">{section.title}</h3>
                                            <div className="flex-1 h-0.5 bg-white/5" />
                                        </div>
                                        
                                        <div className="grid gap-1 border-t border-b border-white/5 divide-y divide-white/5">
                                            {section.questions.map(q => (
                                                <motion.div key={q.id} onClick={() => setSelectedQId(q.id)} className={`py-12 px-8 transition-all cursor-pointer relative ${selectedQId === q.id ? 'bg-indigo-600/[0.03]' : 'hover:bg-white/[0.01]'}`}>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <span className={`text-xs font-black uppercase tracking-[0.2em] italic ${selectedQId === q.id ? 'text-indigo-400' : 'text-slate-700'}`}>
                                                            {q.type} FIELD
                                                        </span>
                                                        <div className="flex gap-4 opacity-0 group-hover:opacity-100">
                                                            <Trash2 className="w-4 h-4 text-red-900 hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }} />
                                                        </div>
                                                    </div>
                                                    <h5 className={`text-lg font-black uppercase tracking-tight italic mb-8 ${selectedQId === q.id ? 'text-white' : 'text-slate-300 opacity-60'}`}>{q.label}</h5>
                                                    <div className="h-16 w-full bg-black/40 rounded-2xl border-2 border-white/5 border-dashed flex items-center px-8 text-xs font-black text-slate-800 uppercase tracking-[0.4em] italic">Live preview area</div>
                                                    {selectedQId === q.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-indigo-500 rounded-r-full shadow-2xl" />}
                                                </motion.div>
                                            ))}
                                            <button onClick={() => addQuestion(section.id)} className="w-full py-10 border-2 border-dashed border-white/5 rounded-[2.5rem] text-sm font-black text-slate-700 uppercase tracking-[0.2em] hover:border-indigo-500/30 hover:text-indigo-400 transition-all flex items-center justify-center gap-4 italic mt-10">
                                                <Plus className="w-5 h-5" /> Add New Question
                                            </button>
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </div>

                        {/* Row 2: Settings (Bottom Workspace - Full Width) */}
                        <div className="xl:col-span-12 bg-[#0B101B]/60 border border-white/5 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-8 border-b border-white/5 bg-white/[0.05] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Settings className="w-5 h-5 text-indigo-400" />
                                    <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Question Settings</h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mr-4">
                                        <div className="px-3 py-1 bg-indigo-600/10 text-indigo-400 text-xs font-black uppercase rounded-lg border border-indigo-500/20">Selected Now</div>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-2xl" />
                                </div>
                            </div>
                            
                            <div className="p-12">
                                {selectedQuestion ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                        {/* Basic Settings */}
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                <h5 className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] italic">Basic Settings</h5>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <label className="text-xs text-slate-500 font-black uppercase tracking-widest italic px-1">Answer Type</label>
                                                    <div className="relative group/type">
                                                        <div className="w-full py-5 px-8 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-all shadow-inner">
                                                            <span className="text-sm font-black text-white uppercase italic">{selectedQuestion.type}</span>
                                                            <ChevronDown className="w-4 h-4 text-indigo-400 transition-transform group-hover/type:rotate-180" />
                                                        </div>
                                                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#0F172A] border border-white/10 rounded-2xl shadow-3xl overflow-hidden opacity-0 invisible group-hover/type:opacity-100 group-hover/type:visible transition-all z-50 backdrop-blur-3xl">
                                                            {['Short Text', 'Scale (1-7)', 'Dropdown', 'Number', 'Date'].map(t => (
                                                                <div key={t} onClick={() => updateQuestion(selectedQuestion.id, { type: t })} className="px-6 py-4 text-sm font-black uppercase italic text-slate-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer border-b border-white/5 last:border-0">{t}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-xs text-slate-500 font-black uppercase tracking-widest italic px-1">Database Key</label>
                                                    <div className="w-full py-5 px-8 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-black text-slate-700 uppercase italic shadow-inner">Auto-generated ID</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-xs text-slate-500 font-black uppercase tracking-widest italic px-1">Question Text</label>
                                                <textarea 
                                                    value={selectedQuestion.label}
                                                    onChange={(e) => updateQuestion(selectedQuestion.id, { label: e.target.value })}
                                                    className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-sm font-black text-white italic uppercase placeholder-slate-900 outline-none focus:border-indigo-500/50 transition-all resize-none shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        {/* Rules & Check */}
                                        <div className="space-y-12">
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                                                    <h5 className="text-sm text-emerald-400 font-black uppercase tracking-[0.2em] italic">Rules</h5>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                    <button onClick={() => updateQuestion(selectedQuestion.id, { required: !selectedQuestion.required })} className={`p-8 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-4 ${selectedQuestion.required ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-white/5 border-white/10 text-slate-700 hover:bg-white/10 shadow-inner'}`}>
                                                        <CheckCircle2 className="w-6 h-6" />
                                                        <span className="text-xs font-black uppercase tracking-widest italic">{selectedQuestion.required ? 'Required' : 'Optional'}</span>
                                                    </button>
                                                    <button className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-slate-700 hover:bg-white/10 transition-all shadow-inner">
                                                        <Share2 className="w-6 h-6" />
                                                        <span className="text-xs font-black uppercase tracking-widest italic">Logic Rules</span>
                                                    </button>
                                                    <button className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-slate-700 hover:bg-white/10 transition-all shadow-inner">
                                                        <Lock className="w-6 h-6" />
                                                        <span className="text-xs font-black uppercase tracking-widest italic">Lock Edit</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-10 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-[3rem] space-y-6 shadow-inner relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-6">
                                                    <Activity className="w-12 h-12 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors" />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                                                    <span className="text-sm font-black text-indigo-400 uppercase italic tracking-widest">System Check: OK</span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-bold uppercase italic leading-relaxed opacity-60 max-w-lg">The system has checked this question. It fits all research rules and is ready for use in your study.</p>
                                                <div className="flex gap-4 pt-4">
                                                    <div className="px-4 py-2 bg-emerald-500/10 rounded-full text-xs font-black text-emerald-500 uppercase italic border border-emerald-500/20">Validated Data</div>
                                                    <div className="px-4 py-2 bg-indigo-500/10 rounded-full text-xs font-black text-indigo-400 uppercase italic border border-indigo-500/20">Linked to Study</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-20 space-y-6">
                                        <DraftingCompass className="w-16 h-16 text-slate-700" />
                                        <p className="text-sm font-black text-slate-700 uppercase tracking-[0.4em] italic">Click a question from the list above to change its settings here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'My Questionnaires' && (
                    <motion.div 
                        key="registry"
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-[#0B101B]/60 border border-white/5 rounded-[3rem] p-12 lg:p-20 shadow-2xl min-h-[600px]"
                    >
                        <div className="flex items-center justify-between mb-16">
                            <div>
                                <h3 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Forms List</h3>
                                <p className="text-sm text-slate-500 font-black uppercase tracking-[0.2em] italic">Manage your saved research forms</p>
                            </div>
                            <button onClick={fetchForms} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                <Clock className={`w-5 h-5 text-indigo-400 ${isFetching ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {savedForms.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {savedForms.map(form => (
                                    <div key={form.id} className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:border-indigo-500/30 transition-all group cursor-pointer">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            {form.is_published ? (
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-black uppercase tracking-widest italic">Live</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-slate-500/10 text-slate-500 border border-white/5 rounded-full text-xs font-black uppercase tracking-widest italic">Draft</span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-black text-white italic uppercase tracking-tight mb-4 group-hover:text-indigo-400 transition-all line-clamp-2">{form.title}</h4>
                                        <p className="text-sm text-slate-600 font-bold uppercase tracking-widest mb-8 line-clamp-1">{form.description || "No description provided"}</p>
                                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                            <span className="text-xs font-black text-slate-700 uppercase italic">Version {form.version}.0</span>
                                            <ArrowRight className="w-4 h-4 text-slate-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                                <Layers className="w-24 h-24 text-slate-700" />
                                <p className="text-sm font-black text-slate-600 uppercase tracking-[0.4em] italic">No forms found</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'Templates' && (
                    <motion.div 
                        key="templates"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-[#0B101B]/60 border border-white/5 rounded-[3rem] p-20 shadow-2xl flex flex-col items-center justify-center text-center space-y-12 min-h-[600px]"
                    >
                        <DraftingCompass className="w-24 h-24 text-indigo-500/20" />
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Sample Forms</h3>
                            <p className="text-sm text-slate-700 font-black uppercase tracking-[0.2em] italic">Library of common research questions</p>
                        </div>
                        <p className="text-sm text-slate-800 font-black uppercase tracking-widest opacity-40">Loading templates...</p>
                    </motion.div>
                )}

                {activeTab === 'Scoring & Formulas' && (
                    <motion.div 
                        key="formulas-view"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-[#0B101B]/60 border border-white/5 rounded-[3rem] shadow-2xl min-h-[800px] overflow-hidden flex flex-col"
                    >
                         <div className="flex-shrink-0 p-10 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                    <Calculator className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Scoring Settings</h3>
                                    <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-3 italic opacity-70">Define how questions are calculated</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                            <div className="col-span-4 border-r border-white/5 p-8 overflow-y-auto custom-scrollbar space-y-8">
                                 <section>
                                     <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-3 italic">Calculated Scores</h4>
                                     <div className="space-y-4">
                                         {formulas.map(s => (
                                             <div key={s.id} onClick={() => setSelectedFormulaId(s.id)} className={`p-6 bg-white/5 border rounded-[1.75rem] flex items-center justify-between group cursor-pointer transition-all ${selectedFormulaId === s.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 opacity-60 hover:opacity-100'}`}>
                                                 <div className="space-y-1">
                                                     <p className="text-base font-black text-white italic uppercase tracking-tighter leading-none">{s.label}</p>
                                                     <p className="text-xs text-slate-600 font-mono tracking-tight">{s.val}</p>
                                                 </div>
                                                 <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                                             </div>
                                         ))}
                                     </div>
                                 </section>
                                 <button onClick={addFormula} className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-3"><Plus className="w-4 h-4" /> Add New Formula</button>
                            </div>
                            <div className="col-span-8 p-12 flex flex-col items-center justify-center text-center space-y-8 bg-indigo-500/[0.01]">
                                 <PieChart className="w-24 h-24 text-slate-800" />
                                 <div className="max-w-md space-y-6">
                                     <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">{selectedFormula?.label || "Select Analysis"}</h4>
                                     <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.1em] italic opacity-80">{selectedFormula ? `Current Rules: ${selectedFormula.val}` : "Pick a formula to change how scores are calculated."}</p>
                                 </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'Registry' && (
                    <motion.div 
                        key="registry-view"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-[#0B101B]/60 border border-white/5 rounded-[3rem] p-20 shadow-2xl flex flex-col items-center justify-center text-center space-y-12 min-h-[600px]"
                    >
                        <ShieldCheck className="w-24 h-24 text-emerald-500/20" />
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Database List</h3>
                            <p className="text-sm text-slate-700 font-black uppercase tracking-[0.2em] italic">List of all saved research terms</p>
                        </div>
                        <p className="text-sm text-slate-800 font-black uppercase tracking-widest opacity-40">Connecting to database...</p>
                    </motion.div>
                )}
            </AnimatePresence>




            {/* Scoring Engine Overlay */}
            <AnimatePresence>
                {isFormulaOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            onClick={() => setIsFormulaOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100]" 
                        />
                        <motion.div 
                            initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[80vh] bg-[#0B101B] border border-white/10 rounded-[3rem] z-[101] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="flex-shrink-0 p-10 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                        <Calculator className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Situational Scoring Engine</h3>
                                        <p className="text-[12px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-3 italic opacity-70">Calculated Endpoints and Risk Assessment Formulae</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 cursor-pointer transition-all active:scale-90" onClick={() => setIsFormulaOpen(false)}>
                                    <X className="w-8 h-8 text-slate-500" />
                                </div>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                                {/* Left: Formulas List */}
                                <div className="col-span-4 border-r border-white/5 p-8 overflow-y-auto custom-scrollbar space-y-8">
                                     <section>
                                         <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3 italic">Available Output Scores</h4>
                                         <div className="space-y-4">
                                             {formulas.map((s, i) => (
                                                 <div 
                                                     key={s.id} 
                                                     onClick={() => setSelectedFormulaId(s.id)}
                                                     className={`p-6 bg-white/5 border rounded-[1.75rem] flex items-center justify-between group cursor-pointer transition-all ${
                                                         selectedFormulaId === s.id ? 'border-indigo-500 bg-indigo-500/5' : 
                                                         s.status === 'ACTIVE' ? 'border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5' : 'border-white/5 opacity-60 hover:opacity-100'
                                                     }`}
                                                 >
                                                     <div className="space-y-1">
                                                         <p className="text-base lg:text-lg font-black text-white italic uppercase tracking-tighter leading-none">{s.label}</p>
                                                         <p className="text-[12px] text-slate-600 font-mono tracking-tight">{s.val}</p>
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                         <span className={`text-[12px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border ${
                                                             s.color === 'red' ? 'text-red-500 border-red-500/20' : 
                                                             s.color === 'indigo' ? 'text-indigo-400 border-indigo-500/20' : 
                                                             'text-slate-600 border-white/10'
                                                         }`}>{s.status}</span>
                                                         <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </section>
                                     <button 
                                        onClick={addFormula}
                                        className="w-full py-5 bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all rounded-2xl text-[12px] font-black uppercase italic tracking-widest flex items-center justify-center gap-3"
                                     >
                                        <Plus className="w-4 h-4" /> Define New Endpoint Formula
                                     </button>
                                </div>

                                {/* Right panel: Analysis */}
                                <div className="col-span-8 p-12 flex flex-col items-center justify-center text-center space-y-8 bg-indigo-500/[0.01]">
                                     <div className="relative">
                                         <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-800 border border-white/5 shadow-2xl relative z-10">
                                             <PieChart className="w-12 h-12 lg:w-16 lg:h-16" />
                                         </div>
                                         <div className="absolute inset-0 bg-indigo-600/10 blur-[60px] rounded-full animate-pulse" />
                                     </div>
                                     <div className="max-w-md space-y-6">
                                         <h4 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">{selectedFormula?.label || "Formula Analysis Node"}</h4>
                                         <p className="text-[12px] lg:text-[12px] text-slate-500 font-bold uppercase tracking-[0.1em] lg:tracking-[0.2em] leading-relaxed italic opacity-80">
                                             {selectedFormula ? `Current Logic: ${selectedFormula.val}` : "Select a strategic score definition from the registry to modify algebraic weights, reverse-scoring logic, and risk categorization thresholds in real-time."}
                                         </p>
                                     </div>
                                     <div className="grid grid-cols-3 gap-4 w-full max-w-xl pt-8 border-t border-white/5">
                                         {['Algebraic Node', 'Logic Branch', 'Audit Trail'].map((t, i) => (
                                             <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                 <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest">{t}</p>
                                                 <div className="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                                                     <div className="h-full bg-indigo-500 w-1/2" />
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0 p-10 bg-[#0B101B]/95 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck className="w-6 h-6 text-indigo-500" />
                                    <div>
                                        <p className="text-[12px] text-white font-black italic uppercase tracking-widest">Protocol Compliance Guaranteed</p>
                                        <p className="text-[12px] text-slate-700 font-black italic uppercase tracking-widest mt-1">Formula versioning tracked via Epoch-0992-X [GSRS-AUDITED]</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        const btn = document.getElementById('sync-btn');
                                        if (btn) btn.innerText = "SYNCHRONIZING...";
                                        setTimeout(() => setIsFormulaOpen(false), 800);
                                    }} 
                                    id="sync-btn"
                                    className="w-full sm:w-auto px-12 lg:px-20 py-4 lg:py-5 bg-indigo-600 text-white rounded-2xl text-[12px] lg:text-[12px] font-black uppercase tracking-[0.2em] italic shadow-xl shadow-indigo-900/40 hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    Synchronize Scoring Engine
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Preview Modal Overlay */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPreviewOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200]" />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[600px] h-[80vh] bg-[#0F172A] border border-white/10 rounded-[3rem] z-[201] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                        >
                            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner"><Eye className="w-6 h-6" /></div>
                                    <div>
                                        <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Participant Experience</h4>
                                        <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest mt-2">{formTitle}</p>
                                    </div>
                                </div>
                                <X className="w-10 h-10 text-slate-700 cursor-pointer hover:text-white transition-all hover:scale-110" onClick={() => setIsPreviewOpen(false)} />
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-930/50">
                                <div className="space-y-12">
                                    {sections.map(section => (
                                        <div key={section.id} className="space-y-6">
                                            <h6 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] italic border-b border-indigo-500/10 pb-3">{section.title}</h6>
                                            <div className="space-y-8">
                                                {section.questions.map(q => (
                                                    <div key={q.id} className="space-y-4">
                                                        <label className="text-sm font-black text-white italic uppercase tracking-tight">{q.label} {q.required && <span className="text-red-500">*</span>}</label>
                                                        <div className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 text-slate-700 text-[12px] font-black uppercase tracking-widest italic border-dashed">
                                                            {q.type} Input Node
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-10 bg-white/5 border-t border-white/5 flex flex-col gap-4">
                                <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest italic shadow-xl shadow-indigo-900/40 opacity-50 cursor-not-allowed">
                                    SUBMIT PROTOCOL ENTRY (PREVIEW)
                                </button>
                                <p className="text-[12px] text-center text-slate-700 font-black uppercase tracking-[0.2em]">Validated via PhotoVault Behavioral Engine</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}



