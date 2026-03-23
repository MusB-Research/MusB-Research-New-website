import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-[#0B101B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            {/* Top Tactical Header */}
            <div className="flex-shrink-0 bg-[#0B101B]/80 backdrop-blur-3xl border-b border-white/5 z-40">
                <div className="px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4 lg:gap-6 shrink-0">
                        <DraftingCompass className="w-6 h-6 lg:w-8 lg:h-8 text-indigo-500" />
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter">Questionnaire Architect</h2>
                            <p className="text-[8px] lg:text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] mt-1 italic">Protocol Synchronized Data Collection Hub</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 lg:gap-4 ml-auto">
                        <button className="px-4 lg:px-5 py-2.5 lg:py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 italic">
                            <Save className="w-3.5 h-3.5" /> Save Draft
                        </button>
                        <button className="px-4 lg:px-5 py-2.5 lg:py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 italic">
                            <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button 
                            onClick={() => setIsFormulaOpen(true)}
                            className="px-4 lg:px-5 py-2.5 lg:py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 italic"
                        >
                            <Calculator className="w-3.5 h-3.5" /> Scoring Engine
                        </button>
                        <button className="px-6 lg:px-8 py-2.5 lg:py-3 bg-indigo-600 text-white rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-[1.02] transition-all flex items-center gap-2 italic">
                            <Rocket className="w-3.5 h-3.5" /> Publish & Assign
                        </button>
                    </div>
                </div>


                <div className="px-10 flex gap-10">
                    {['My Questionnaires', 'Create New', 'Templates', 'Scoring & Formulas', 'Registry'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative ${
                                activeTab === tab ? 'text-white italic' : 'text-slate-600 hover:text-slate-300'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && <motion.div layoutId="nav-ind" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Structure Orchestration */}
                <div className="w-[340px] border-r border-white/5 flex flex-col overflow-hidden bg-white/[0.01]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Protocol map</span>
                        <div className="flex gap-2">
                            <button className="p-2 bg-white/5 rounded-lg text-slate-600 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
                            <button className="p-2 bg-white/5 rounded-lg text-slate-600 hover:text-white"><Layers className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {sections.map(section => (
                            <div key={section.id} className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                                        <h4 className="text-[10px] font-black text-white uppercase italic tracking-widest leading-tight w-40 truncate">{section.title}</h4>
                                    </div>
                                    <button onClick={() => addQuestion(section.id)} className="p-1 px-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-md text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Add</button>
                                </div>
                                <div className="pl-4 space-y-2 relative">
                                    <div className="absolute left-1.5 top-0 bottom-0 w-[1px] bg-white/5" />
                                    {section.questions.map(q => (
                                        <button 
                                            key={q.id}
                                            onClick={() => setSelectedQId(q.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all relative ${
                                                selectedQId === q.id 
                                                ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                                                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-400'
                                            }`}
                                        >
                                            <GripVertical className="w-3 h-3 text-slate-800" />
                                            <span className="text-[9px] font-black uppercase tracking-tight truncate flex-1 text-left italic">{q.label}</span>
                                            <XCircle className="w-3 h-3 text-red-900 opacity-0 hover:opacity-100 transition-opacity" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteQuestion(q.id); }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Center Panel: Architectural Canvas */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 xl:p-16 bg-[#0B101B]">
                    <div className="max-w-5xl mx-auto space-y-12 lg:space-y-16">
                        <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 xl:p-12 shadow-2xl overflow-visible">
                            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8 lg:gap-12 items-start overflow-visible">
                                <div className="2xl:col-span-9 space-y-4 w-full overflow-visible">
                                    <label className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic shrink-0">Inventory Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="GI Health Assessment..." 
                                        defaultValue="MusB-GI HyperImmunity Screening" 
                                        className="w-full bg-transparent border-b border-white/5 py-2 lg:py-3 text-[11px] md:text-sm lg:text-base xl:text-lg font-black text-white italic uppercase placeholder-slate-900 outline-none focus:border-indigo-500/50 transition-all tracking-tight" 
                                    />
                                </div>

                                <div className="2xl:col-span-3 flex flex-wrap 2xl:flex-col items-start gap-4 lg:gap-6 2xl:pt-8 w-full shrink-0">
                                    <div className="flex-1 2xl:w-full min-w-[140px] space-y-3">
                                        <label className="text-[8px] text-slate-700 font-black uppercase tracking-widest italic shrink-0 truncate">Study ID</label>
                                        <div className="py-2.5 px-4 bg-white/5 border border-white/5 rounded-xl text-[9px] lg:text-[10px] font-black text-indigo-400 uppercase italic truncate">HI-202B</div>
                                    </div>
                                    <div className="flex-1 2xl:w-full min-w-[140px] space-y-3">
                                        <label className="text-[8px] text-slate-700 font-black uppercase tracking-widest italic shrink-0 truncate">Version</label>
                                        <div className="py-2.5 px-4 bg-white/5 border border-white/5 rounded-xl text-[9px] lg:text-[10px] font-black text-slate-500 uppercase italic truncate">v1.4.2 [DRAFT]</div>
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
                                                    <span className={`text-[9px] font-black uppercase tracking-widest italic ${selectedQId === q.id ? 'text-indigo-200' : 'text-slate-600'}`}>
                                                        {q.type} Field • ID-{q.id.split('-').pop()}
                                                    </span>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><Copy className="w-4 h-4 text-white" /></button>
                                                        <button className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/40 text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                <h5 className={`text-base font-black uppercase tracking-tight italic mb-8 ${selectedQId === q.id ? 'text-white' : 'text-slate-300'}`}>
                                                    {q.label} {q.required && <span className="text-red-500 ml-1">*</span>}
                                                </h5>
                                                
                                                <div className="h-16 w-full bg-black/20 rounded-2xl border border-white/10 border-dashed flex items-center px-6 italic text-slate-800 uppercase tracking-widest text-[9px] font-black">
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
                </div>

                {/* Right Panel: Granular Intelligence & Behavioral Config */}
                <div className="w-[420px] border-l border-white/5 flex flex-col overflow-hidden bg-white/[0.02]">
                    <div className="p-8 border-b border-white/5 bg-white/[0.03] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Settings className="w-5 h-5 text-indigo-400" />
                            <h4 className="text-[10px] font-black text-white uppercase italic tracking-widest">Question Intelligence</h4>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                        {selectedQuestion ? (
                            <>
                                <section className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[8px] text-slate-700 font-black uppercase tracking-widest italic">Operational Label</label>
                                        <textarea 
                                            value={selectedQuestion.label}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, { label: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black text-white italic uppercase outline-none focus:border-indigo-500/50 resize-none h-24" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className="text-[8px] text-slate-700 font-black uppercase tracking-widest italic">Mandatory</label>
                                            <button 
                                                onClick={() => updateQuestion(selectedQuestion.id, { required: !selectedQuestion.required })}
                                                className={`w-full py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    selectedQuestion.required ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white/5 text-slate-600 border-white/5'
                                                }`}
                                            >
                                                {selectedQuestion.required ? 'MANDATORY' : 'OPTIONAL'}
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[8px] text-slate-700 font-black uppercase tracking-widest italic">Display Logic</label>
                                            <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-indigo-400 uppercase italic flex items-center justify-center gap-2">
                                                <Share2 className="w-3 h-3" /> Branching
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3 italic">Behavioral Specs</h5>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Scoring Weight', val: '1.0x', icon: Calculator },
                                            { label: 'Validation Rule', val: 'No Duplicates', icon: ShieldCheck },
                                            { label: 'Audit Logging', val: 'Full Epoch', icon: Clock }
                                        ].map((spec, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <spec.icon className="w-3.5 h-3.5 text-slate-700" />
                                                    <span className="text-[9px] font-black text-slate-600 uppercase italic">{spec.label}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-400 uppercase italic">{spec.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[3rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[10px] font-black text-indigo-400 uppercase italic tracking-widest">MusB Core AI Insight</h5>
                                        <AlertCircle className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight italic leading-relaxed">
                                        "This question mirrors the GSRS-Validated scale. Changes to the label may impact subscale cross-analysis scoring."
                                    </p>
                                </section>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30">
                                <Search className="w-12 h-12 text-slate-800" />
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select an architectural node to modify its scientific properties</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scoring Engine Overlay */}
            <AnimatePresence>
                {isFormulaOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormulaOpen(false)} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100]" />
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[85vh] bg-[#0B101B] border border-white/10 rounded-[4rem] z-[101] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="flex-shrink-0 p-12 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <Calculator className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Situational Scoring Engine</h3>
                                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-3 italic">Calculated Endpoints and Risk Assessment Formulae</p>
                                    </div>
                                </div>
                                <X className="w-10 h-10 text-slate-700 cursor-pointer hover:text-white" onClick={() => setIsFormulaOpen(false)} />
                            </div>
                            
                            <div className="flex-1 grid grid-cols-2 gap-1 px-12 py-10 overflow-hidden">
                                <div className="border-r border-white/5 p-8 overflow-y-auto custom-scrollbar space-y-12">
                                     <section>
                                         <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-3 italic">Available Output Scores</h4>
                                         <div className="space-y-4">
                                             {[
                                                 { label: 'GI Distress Total', val: 'SUM (q4 + q5)', status: 'Active' },
                                                 { label: 'Symptom Slope', val: 'Calculated Field-88', status: 'Draft' },
                                                 { label: 'BMI Analysis', val: 'Wt / Ht^2', status: 'Locked' }
                                             ].map((s, i) => (
                                                 <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-indigo-500/30">
                                                     <div>
                                                         <p className="text-[11px] font-black text-white italic uppercase">{s.label}</p>
                                                         <p className="text-[8px] text-slate-700 font-mono mt-2">{s.val}</p>
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                         <span className="text-[7px] font-black uppercase text-slate-800">{s.status}</span>
                                                         <ArrowRight className="w-4 h-4 text-slate-900 group-hover:text-indigo-400 transition-colors" />
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </section>
                                     <button className="w-full py-6 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-[2rem] text-[9px] font-black uppercase italic tracking-widest">+ Define New Endpoint Formula</button>
                                </div>
                                <div className="p-8 flex flex-col items-center justify-center text-center space-y-8 bg-indigo-500/[0.02]">
                                     <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-800">
                                         <PieChart className="w-10 h-10" />
                                     </div>
                                     <div className="max-w-xs space-y-4">
                                         <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Formula Analysis Node</h4>
                                         <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-relaxed">
                                             Select a score definition to modify algebraic weights, reverse-scoring logic, and risk categorization thresholds.
                                         </p>
                                     </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0 p-10 bg-[#0B101B]/95 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[9px] text-slate-700 font-black italic uppercase">Formula versioning tracked via Epoch-0992-X</p>
                                <button onClick={() => setIsFormulaOpen(false)} className="px-14 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-indigo-900/40">Synchronize Scoring Engine</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
