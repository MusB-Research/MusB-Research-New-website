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
    PenTool
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
        <div className="flex flex-col h-auto 2xl:h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden 2xl:overflow-hidden shadow-2xl relative mb-10 2xl:mb-0">
            {/* Top Tactical Header */}
            <div className="flex-shrink-0 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 z-40">
                <div className="px-6 lg:px-12 py-8 lg:py-12 flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-8">
                    <div className="flex items-start gap-6 lg:gap-10 shrink-0">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-[1.75rem] flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/10 shrink-0 mt-1">
                            <DraftingCompass className="w-10 h-10 lg:w-12 lg:h-12" />
                        </div>
                        <div>
                            <h2 className="text-3xl lg:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">ELIGIBILITY QUESTIONNAIRES</h2>
                            <p className="text-[10px] lg:text-[11px] text-indigo-400 font-bold uppercase tracking-[0.3em] lg:tracking-[0.4em] italic opacity-80 max-w-2xl">Design logical recruitment funnels with dynamic branching and integrated validation triggers.</p>
                        </div>
                    </div>

                    <div className="w-full xl:w-auto flex flex-wrap lg:flex-row items-center gap-3 lg:gap-4 justify-center xl:justify-end">
                        <button 
                            onClick={() => handleSave(false)}
                            disabled={isLoading}
                            className="px-6 py-4 lg:py-5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-4 group shadow-xl"
                        >
                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">SAVE</p>
                                <p className="text-[9px] font-black uppercase tracking-widest leading-none mt-1 opacity-50">DRAFT</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setIsPreviewOpen(true)}
                            className="px-6 py-4 lg:py-5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-4 group shadow-xl"
                        >
                            <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <div className="text-left font-black uppercase tracking-widest text-[10px]">PREVIEW</div>
                        </button>

                        <button 
                            onClick={() => setIsFormulaOpen(true)}
                            className="px-6 py-4 lg:py-5 bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/80 rounded-2xl hover:bg-indigo-500/10 hover:text-indigo-400 transition-all flex items-center gap-4 group shadow-xl"
                        >
                            <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">SCORING</p>
                                <p className="text-[9px] font-black uppercase tracking-widest leading-none mt-1 opacity-50">ENGINE</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleSave(true)}
                            disabled={isLoading}
                            className="px-8 py-4 lg:py-5 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 border border-indigo-400/20 group outline-none"
                        >
                            <Rocket className="w-5 h-5 group-hover:animate-bounce" />
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{isLoading ? "SYNCING..." : "PUBLISH"}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest leading-none mt-1 opacity-80">& ASSIGN</p>
                            </div>
                        </button>
                    </div>
                </div>


                <div className="px-6 lg:px-12 flex gap-8 lg:gap-12 overflow-x-auto custom-scrollbar-horizontal whitespace-nowrap bg-white/[0.02]">
                    {['My Questionnaires', 'Create New', 'Templates', 'Scoring & Formulas', 'Registry'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-5 pt-2 text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.25em] transition-all relative ${
                                activeTab === tab ? 'text-white italic' : 'text-slate-600 hover:text-slate-300'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && <motion.div layoutId="nav-ind" className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col 2xl:flex-row overflow-visible 2xl:overflow-hidden">
                {/* Left Panel: Structure Orchestration */}
                <div className="w-full 2xl:w-[340px] border-b 2xl:border-b-0 2xl:border-r border-white/5 flex flex-col overflow-hidden bg-[#0B101B]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Protocol map</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    const newS: Section = { id: `s-${Date.now()}`, title: 'New Research Section', questions: [] };
                                    setSections([...sections, newS]);
                                }}
                                className="p-2 bg-white/5 rounded-lg text-slate-600 hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-white/5 rounded-lg text-slate-600 hover:text-white transition-colors"><Layers className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {sections.map(section => (
                            <div key={section.id} className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <ChevronDown className="w-4 h-4 text-slate-700" />
                                        <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest leading-tight w-40 truncate">{section.title}</h4>
                                    </div>
                                    <button onClick={() => addQuestion(section.id)} className="p-1 px-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-md text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Add</button>
                                </div>
                                <div className="pl-4 space-y-2 relative">
                                    <div className="absolute left-1.5 top-0 bottom-0 w-[1px] bg-white/5" />
                                    {section.questions.map(q => (
                                        <button 
                                            key={q.id}
                                            onClick={() => setSelectedQId(q.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all relative ${
                                                selectedQId === q.id 
                                                ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' 
                                                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-400'
                                            }`}
                                        >
                                            <GripVertical className="w-3.5 h-3.5 text-slate-800" />
                                            <span className="text-[11px] font-black uppercase tracking-tight truncate flex-1 text-left italic">{q.label}</span>
                                            <XCircle className="w-4 h-4 text-red-900 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteQuestion(q.id); }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Center Panel: Architectural Canvas */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 xl:p-16 bg-[#0B101B] min-h-[500px] 2xl:min-h-0 border-b 2xl:border-b-0 border-white/5">
                    <div className="max-w-5xl mx-auto space-y-12 lg:space-y-16">
                        <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 xl:p-12 shadow-2xl relative overflow-visible group/header backdrop-blur-md">
                            <div className="flex flex-col xl:flex-row gap-10 xl:gap-20 items-start">
                                <div className="flex-1 min-w-0 space-y-6 w-full">
                                     <div className="flex items-center gap-4">
                                         <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                         <label className="text-[11px] text-slate-600 font-black uppercase tracking-widest italic whitespace-nowrap">Inventory Strategic Title</label>
                                     </div>
                                     <input 
                                         type="text" 
                                         placeholder="Enter Protocol Title..." 
                                         value={formTitle} 
                                         onChange={(e) => setFormTitle(e.target.value)}
                                         className="w-full bg-transparent border-b border-white/5 py-4 text-sm md:text-base lg:text-xl font-black text-white italic uppercase placeholder-slate-930 outline-none focus:border-indigo-500/50 transition-all tracking-tight leading-none" 
                                     />
                                 </div>

                                 <div className="w-full xl:w-auto flex flex-row xl:flex-col items-center xl:items-start gap-8 shrink-0">
                                     <div className="space-y-4 min-w-[240px] relative group/select">
                                         <label className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">Target Study</label>
                                         
                                         {/* Custom Dropdown Button */}
                                         <div className="relative">
                                             <div 
                                                onClick={() => setIsStudyDropdownOpen(!isStudyDropdownOpen)}
                                                className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-all shadow-lg select-none"
                                             >
                                                 <span className="text-[11px] font-black text-indigo-400 uppercase italic">
                                                     {studies.find(s => s.id === selectedStudyId)?.protocol_id || (isLoading ? 'Loading...' : 'Select Study')}
                                                 </span>
                                                 <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${isStudyDropdownOpen ? 'rotate-180' : ''}`} />
                                             </div>
                                             
                                             <AnimatePresence>
                                                {isStudyDropdownOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                                                    >
                                                        {studies.map(s => (
                                                            <div 
                                                                key={s.id}
                                                                onClick={() => {
                                                                    setSelectedStudyId(s.id);
                                                                    setIsStudyDropdownOpen(false);
                                                                }}
                                                                className="px-6 py-4 text-[11px] font-bold text-slate-300 uppercase italic hover:bg-indigo-600 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                                            >
                                                                {s.protocol_id}
                                                            </div>
                                                        ))}
                                                        {studies.length === 0 && <div className="px-6 py-4 text-[11px] italic text-slate-500">No studies available</div>}
                                                    </motion.div>
                                                )}
                                             </AnimatePresence>
                                         </div>
                                     </div>
                                     <div className="space-y-4 min-w-[120px]">
                                         <label className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">Version</label>
                                         <div className="py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-slate-500 uppercase italic shadow-lg">v1.0.0 [DRAFT]</div>
                                     </div>
                                 </div>
                            </div>
                        </section>






                        <div className="space-y-24 pb-32">
                            {sections.map(section => (
                                <section key={section.id} className="relative">
                                    <div className="flex items-center gap-6 mb-12">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-black italic">S</div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{section.title}</h3>
                                        <div className="flex-1 h-[1px] bg-white/5" />
                                    </div>
                                    
                                    <div className="space-y-12">
                                        {section.questions.map(q => (
                                            <motion.div 
                                                key={q.id}
                                                layout
                                                onClick={() => setSelectedQId(q.id)}
                                                className={`p-10 rounded-[3rem] border transition-all cursor-pointer relative group ${
                                                    selectedQId === q.id 
                                                    ? 'bg-indigo-600 border-indigo-400 shadow-[0_30px_60px_-15px_rgba(99,102,241,0.2)]' 
                                                    : 'bg-white/[0.02] border-white/5 shadow-xl hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-8">
                                                    <span className={`text-[11px] font-black uppercase tracking-widest italic ${selectedQId === q.id ? 'text-indigo-200' : 'text-slate-600'}`}>
                                                        {q.type} Field • ID-{q.id.split('-').pop()}
                                                    </span>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newQ = { ...q, id: `q-${Date.now()}` };
                                                                setSections(prev => prev.map(s => s.questions.find(quest => quest.id === q.id) ? { ...s, questions: [...s.questions, newQ] } : s));
                                                            }}
                                                            className="p-2 bg-white/10 rounded-xl hover:bg-white/20"
                                                        >
                                                            <Copy className="w-4 h-4 text-white" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                                                            className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/40 text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h5 className={`text-base font-black uppercase tracking-tight italic mb-8 ${selectedQId === q.id ? 'text-white' : 'text-slate-300'}`}>
                                                    {q.label} {q.required && <span className="text-red-500 ml-1">*</span>}
                                                </h5>
                                                
                                                <div className="h-16 w-full bg-black/20 rounded-2xl border border-white/10 border-dashed flex items-center px-6 italic text-slate-800 uppercase tracking-widest text-[11px] font-black">
                                                    Interactive Participant Node Preview
                                                </div>
                                                
                                                {selectedQId === q.id && (
                                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-white rounded-full shadow-[0_0_15px_white]" />
                                                )}
                                            </motion.div>
                                        ))}
                                        
                                        <button 
                                            onClick={() => addQuestion(section.id)}
                                            className="w-full py-8 border-2 border-dashed border-white/5 rounded-[3rem] text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-indigo-500/40 hover:text-indigo-400 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Plus className="w-5 h-5" /> Append Protocol Question
                                        </button>
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>                {/* Right Panel: Granular Intelligence & Behavioral Config */}
                <div className="w-full 2xl:w-[420px] border-t 2xl:border-t-0 2xl:border-l border-white/5 flex flex-col overflow-hidden bg-white/[0.02]">
                    <div className="p-10 border-b border-white/5 bg-white/[0.03] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Settings className="w-5 h-5 text-indigo-400" />
                            <h4 className="text-[12px] font-black text-white uppercase italic tracking-[0.2em] leading-none">Question Intelligence</h4>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    </div>                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-8 group/right-panel scroll-smooth pb-40">
                        {selectedQuestion ? (
                            <div className="space-y-8">
                                {/* Section 1: Strategic Specs */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                        <h5 className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] italic">Strategic Specs</h5>
                                    </div>
                                    
                                    {/* Card: Protocol Format */}
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] shadow-xl group/card hover:bg-white/[0.05] transition-all">
                                        <label className="text-[9px] text-slate-700 font-black uppercase tracking-widest italic mb-4 block">Question Format</label>
                                        <div className="relative group/type">
                                            <div className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-all select-none">
                                                <span className="text-[10px] font-black text-white uppercase italic tracking-widest">{selectedQuestion.type}</span>
                                                <ChevronDown className="w-4 h-4 text-indigo-400 group-hover/type:rotate-180 transition-transform" />
                                            </div>
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden opacity-0 invisible group-hover/type:opacity-100 group-hover/type:visible transition-all z-[70] backdrop-blur-3xl translate-y-2 group-hover/type:translate-y-0 text-left">
                                                {['Short Text', 'Likert Scale (1-7)', 'Dropdown', 'Number', 'Date'].map(type => (
                                                    <div key={type} onClick={() => updateQuestion(selectedQuestion.id, { type })} className={`px-6 py-4 text-[9px] font-black uppercase italic transition-all cursor-pointer border-b border-white/5 last:border-0 hover:bg-indigo-600 hover:text-white ${selectedQuestion.type === type ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                        {type}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Card: Options Registry */}
                                    {(selectedQuestion.type === 'Dropdown' || selectedQuestion.type.includes('Likert')) && (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] shadow-xl">
                                            <label className="text-[9px] text-slate-700 font-black uppercase tracking-widest italic mb-4 block">Options Registry</label>
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                {(selectedQuestion.options || ['Option 1']).map((opt, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl group/opt hover:border-indigo-500/30 transition-all">
                                                        <span className="text-[9px] font-black text-slate-800 w-3">{i + 1}</span>
                                                        <input 
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOpts = [...(selectedQuestion.options || [])];
                                                                newOpts[i] = e.target.value;
                                                                updateQuestion(selectedQuestion.id, { options: newOpts });
                                                            }}
                                                            className="flex-1 bg-transparent border-none text-[10px] font-black text-white italic uppercase focus:outline-none placeholder-slate-900" 
                                                        />
                                                        <XCircle className="w-4 h-4 text-slate-900 group-hover/opt:text-red-500/50 hover:text-red-500 cursor-pointer transition-all" onClick={() => {
                                                            const newOpts = (selectedQuestion.options || []).filter((_, idx) => idx !== i);
                                                            updateQuestion(selectedQuestion.id, { options: newOpts });
                                                        }} />
                                                    </div>
                                                ))}
                                                <button onClick={() => updateQuestion(selectedQuestion.id, { options: [...(selectedQuestion.options || []), `New Node`] })} className="w-full py-3 border border-dashed border-indigo-500/10 rounded-xl text-[9px] font-black text-indigo-400/40 uppercase italic hover:bg-indigo-500/5 hover:text-indigo-400 transition-all">
                                                    + Append Node
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Section 2: Narrative Config */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1 h-3 bg-slate-700 rounded-full" />
                                        <h5 className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] italic">Narrative Config</h5>
                                    </div>
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] shadow-xl">
                                        <textarea 
                                            value={selectedQuestion.label}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, { label: e.target.value })}
                                            className="w-full bg-transparent border-none text-[11px] font-black text-white italic uppercase outline-none resize-none h-24 placeholder-slate-900" 
                                            placeholder="Translate architectural requirements into question narrative..."
                                        />
                                    </motion.div>
                                </div>

                                {/* Section 3: Field Architecture */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                        <h5 className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] italic">Architecture Logic</h5>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => updateQuestion(selectedQuestion.id, { required: !selectedQuestion.required })}
                                            className={`p-6 rounded-[2rem] border transition-all text-[10px] font-black uppercase tracking-widest italic flex flex-col items-center gap-3 ${
                                                selectedQuestion.required ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/20 shadow-xl' : 'bg-white/5 border-white/10 text-slate-700 hover:bg-white/10'
                                            }`}
                                        >
                                            <CheckCircle2 className={`w-5 h-5 ${selectedQuestion.required ? 'text-white' : 'text-slate-800'}`} />
                                            {selectedQuestion.required ? 'MANDATORY' : 'OPTIONAL'}
                                        </button>
                                        <button 
                                            onClick={() => alert(`Logic Pathing Active for [${selectedQuestion.id}]`)}
                                            className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] font-black text-indigo-400 uppercase italic flex flex-col items-center gap-3 hover:bg-white/10 transition-all shadow-xl"
                                        >
                                            <Share2 className="w-5 h-5 text-indigo-500/50" />
                                            BRANCHING
                                        </button>
                                    </div>
                                </div>

                                {/* AI Diagnostic Card */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-[2.5rem] relative overflow-hidden group shadow-inner">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                        <h5 className="text-[10px] font-black text-indigo-400 uppercase italic tracking-widest leading-none">AI Structural Diagnostic</h5>
                                    </div>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-tight italic leading-relaxed opacity-60">
                                        High validation strength detected. Logic branch for node [{selectedQuestion.id.split('-').pop()}] is optimized for GSRS-Score aggregation.
                                    </p>
                                </motion.div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30">
                                <Search className="w-16 h-16 text-slate-800" />
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">Select an architectural node to modify its properties</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-3 italic opacity-70">Calculated Endpoints and Risk Assessment Formulae</p>
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
                                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3 italic">Available Output Scores</h4>
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
                                                         <p className="text-[10px] text-slate-600 font-mono tracking-tight">{s.val}</p>
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                         <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border ${
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
                                        className="w-full py-5 bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all rounded-2xl text-[10px] font-black uppercase italic tracking-widest flex items-center justify-center gap-3"
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
                                         <p className="text-[11px] lg:text-[12px] text-slate-500 font-bold uppercase tracking-[0.1em] lg:tracking-[0.2em] leading-relaxed italic opacity-80">
                                             {selectedFormula ? `Current Logic: ${selectedFormula.val}` : "Select a strategic score definition from the registry to modify algebraic weights, reverse-scoring logic, and risk categorization thresholds in real-time."}
                                         </p>
                                     </div>
                                     <div className="grid grid-cols-3 gap-4 w-full max-w-xl pt-8 border-t border-white/5">
                                         {['Algebraic Node', 'Logic Branch', 'Audit Trail'].map((t, i) => (
                                             <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                 <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{t}</p>
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
                                        <p className="text-[10px] text-white font-black italic uppercase tracking-widest">Protocol Compliance Guaranteed</p>
                                        <p className="text-[8px] text-slate-700 font-black italic uppercase tracking-widest mt-1">Formula versioning tracked via Epoch-0992-X [GSRS-AUDITED]</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        const btn = document.getElementById('sync-btn');
                                        if (btn) btn.innerText = "SYNCHRONIZING...";
                                        setTimeout(() => setIsFormulaOpen(false), 800);
                                    }} 
                                    id="sync-btn"
                                    className="w-full sm:w-auto px-12 lg:px-20 py-4 lg:py-5 bg-indigo-600 text-white rounded-2xl text-[11px] lg:text-[12px] font-black uppercase tracking-[0.2em] italic shadow-xl shadow-indigo-900/40 hover:scale-[1.02] transition-all active:scale-95"
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
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{formTitle}</p>
                                    </div>
                                </div>
                                <X className="w-10 h-10 text-slate-700 cursor-pointer hover:text-white transition-all hover:scale-110" onClick={() => setIsPreviewOpen(false)} />
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-930/50">
                                <div className="space-y-12">
                                    {sections.map(section => (
                                        <div key={section.id} className="space-y-6">
                                            <h6 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] italic border-b border-indigo-500/10 pb-3">{section.title}</h6>
                                            <div className="space-y-8">
                                                {section.questions.map(q => (
                                                    <div key={q.id} className="space-y-4">
                                                        <label className="text-sm font-black text-white italic uppercase tracking-tight">{q.label} {q.required && <span className="text-red-500">*</span>}</label>
                                                        <div className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 text-slate-700 text-[11px] font-black uppercase tracking-widest italic border-dashed">
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
                                <p className="text-[9px] text-center text-slate-700 font-black uppercase tracking-[0.2em]">Validated via PhotoVault Behavioral Engine</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
