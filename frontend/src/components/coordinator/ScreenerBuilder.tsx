import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, MousePointer2,
    Settings2, Trash2, LayoutGrid, Type,
    ChevronLeft, Database, Boxes, Rocket, Eye, Terminal, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface Question {
    id: string;
    type: 'short_text' | 'choice' | 'dropdown' | 'date';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
}

export default function ScreenerBuilder() {
    const [studies, setStudies] = useState<any[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchStudies();
    }, []);

    const fetchStudies = async () => {
        try {
            const res = await authFetch(`${API}/api/studies/`);
            if (res.ok) {
                const data = await res.json();
                setStudies(data.results || data || []);
            }
        } catch (err) { }
    };

    useEffect(() => {
        if (selectedStudyId) {
            fetchExistingScreener();
        } else {
            setQuestions([]);
        }
    }, [selectedStudyId]);

    const fetchExistingScreener = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch(`${API}/api/studies/${selectedStudyId}/`);
            if (res.ok) {
                const data = await res.json();
                // Extract questions from screener_config.steps
                const screenerStep = data.screener_config?.steps?.find((s: any) => s.type === 'user_input');
                if (screenerStep && screenerStep.questions) {
                    setQuestions(screenerStep.questions);
                } else {
                    setQuestions([]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const addQuestion = (type: Question['type']) => {
        const newQ: Question = {
            id: `sq_${Date.now()}`,
            type,
            label: '',
            placeholder: 'Enter your response...',
            required: true,
            options: type === 'choice' || type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined
        };
        setQuestions([...questions, newQ]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const handleSave = async () => {
        if (!selectedStudyId) {
            setStatusMessage({ text: 'Please select a context protocol first.', type: 'error' });
            return;
        }

        setIsSaving(true);
        setStatusMessage(null);

        // Construct standard screener_config structure
        // StudyScreener expects: { steps: [ { id: 'STEP1', type: 'system' }, { id: 'STEP2', type: 'user_input', questions: [...] }, { id: 'STEP3', type: 'system' } ] }
        const screenerConfig = {
            steps: [
                { id: 'STEP1', type: 'system', label: 'Basics & location' },
                { 
                    id: 'STEP2', 
                    type: 'user_input', 
                    label: 'Eligibility criteria',
                    questions: questions.map(q => ({
                        ...q,
                        id: q.id || `idx_${Math.random().toString(36).substr(2, 9)}`
                    }))
                },
                { id: 'STEP3', type: 'system', label: 'Contact & availability' }
            ]
        };

        try {
            const res = await authFetch(`${API}/api/studies/${selectedStudyId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    screener_config: screenerConfig
                })
            });

            if (res.ok) {
                setStatusMessage({ text: 'Screener architecture deployed and synchronized.', type: 'success' });
                setTimeout(() => setStatusMessage(null), 5000);
            } else {
                setStatusMessage({ text: 'Failed to synchronize screener.', type: 'error' });
            }
        } catch (err) {
            setStatusMessage({ text: 'Network synchronization error.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-4 h-4 text-pink-500" />
                        <span className="text-[10px] font-black text-pink-500 tracking-[0.3em]">Architecture: Protocol design</span>
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">Screener builder</h2>
                    <p className="text-sm text-slate-400 mt-2 font-medium opacity-70">Design logical recruitment funnels with dynamic branching and integrated validation triggers.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 h-14">
                        <select
                            value={selectedStudyId}
                            onChange={(e) => setSelectedStudyId(e.target.value)}
                            className="bg-transparent text-[12px] font-black text-white tracking-widest outline-none cursor-pointer px-6 min-w-[240px]"
                        >
                            <option value="" className="bg-[#0B101B]">Select context protocol</option>
                            {studies.map(s => (
                                <option key={s.id} value={s.id} className="bg-[#0B101B]">{s.protocol_id || s.id}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedStudyId}
                        className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-[12px] font-black tracking-[0.2em] transition-all shadow-xl shadow-pink-500/20 active:scale-95 ${isSaving ? 'bg-pink-900 text-pink-300' : 'bg-[#be185d] text-white hover:bg-pink-600'}`}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Synchronizing...' : 'Save form'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left: Toolbox */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-[#0f172a]/50 border border-white/5 rounded-[2rem] p-8">
                        <h3 className="text-[11px] font-black text-slate-500 tracking-widest mb-2">Question toolbox</h3>
                        <p className="text-[9px] text-slate-600 font-bold tracking-widest mb-8">Tap component to append to architecture</p>
                        
                        <div className="space-y-3">
                            {[
                                { type: 'short_text', icon: Type, label: 'Short response' },
                                { type: 'choice', icon: List, label: 'Single/multi choice' },
                                { type: 'dropdown', icon: ChevronDown, label: 'Dropdown list' },
                                { type: 'date', icon: Calendar, label: 'Date selection' }
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => addQuestion(item.type as any)}
                                    className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-pink-500/20 group-hover:text-pink-400 transition-all">
                                            <item.icon className="w-5 h-5 opacity-60 group-hover:opacity-100" />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-400 tracking-widest group-hover:text-white transition-all">{item.label}</span>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-700 group-hover:text-pink-500" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-pink-500/5 border border-pink-500/10 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-pink-500 shrink-0" />
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                Protocols must be approved before screeners can be globally activated.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Canvas */}
                <div className="col-span-12 lg:col-span-9">
                    <div className="min-h-[600px] border-2 border-dashed border-white/5 rounded-[3rem] p-10 flex flex-col items-center bg-black/20">
                        <AnimatePresence mode="popLayout">
                            {questions.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center py-20"
                                >
                                    <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                                        <LayoutGrid className="w-10 h-10 text-slate-700" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Virtual canvas empty</h3>
                                    <p className="text-[10px] text-slate-500 font-black tracking-[0.3em]">Deploy components from the toolbox</p>
                                </motion.div>
                            ) : (
                                <div className="w-full space-y-4 max-w-4xl">
                                    {questions.map((q, idx) => (
                                        <motion.div
                                            key={q.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 group relative"
                                        >
                                            <div className="flex items-start gap-8">
                                                <div className="text-3xl font-black text-slate-800 italic group-hover:text-pink-500/20 transition-colors">
                                                    {(idx + 1).toString().padStart(2, '0')}
                                                </div>
                                                <div className="flex-1 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                         <input
                                                             value={q.label}
                                                             onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                                                             placeholder="Click to define eligibility criteria question..."
                                                             className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-transparent focus:border-pink-500/30 transition-all pb-2"
                                                         />
                                                         <div className="flex items-center gap-3 ml-4">
                                                              <button
                                                                 onClick={() => updateQuestion(q.id, { required: !q.required })}
                                                                 className={`text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg border transition-all ${q.required ? 'bg-pink-500/10 border-pink-500/30 text-pink-500' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                                                             >
                                                                 {q.required ? 'Required' : 'Optional'}
                                                             </button>
                                                             <span className="text-[10px] font-black text-slate-500 tracking-widest px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                                                 {q.type.replace('_', ' ')}
                                                             </span>
                                                         </div>
                                                     </div>

                                                     {(q.type === 'choice' || q.type === 'dropdown') && (
                                                         <div className="space-y-3 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                                             <div className="flex items-center justify-between mb-2">
                                                                 <span className="text-[10px] font-bold text-slate-500 tracking-wider">Response options</span>
                                                                 <button
                                                                     onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                                                                     className="text-[10px] font-bold text-pink-500 tracking-wider hover:text-white transition-all"
                                                                 >
                                                                     + Add response option
                                                                 </button>
                                                             </div>
                                                             <div className="grid grid-cols-2 gap-3">
                                                                 {q.options?.map((opt, oIdx) => (
                                                                     <div key={oIdx} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                                                                         <input
                                                                             value={opt}
                                                                             onChange={(e) => {
                                                                                 const newOpts = [...(q.options || [])];
                                                                                 newOpts[oIdx] = e.target.value;
                                                                                 updateQuestion(q.id, { options: newOpts });
                                                                             }}
                                                                             className="bg-transparent text-[13px] font-bold text-slate-300 outline-none flex-1"
                                                                         />
                                                                         <button onClick={() => updateQuestion(q.id, { options: q.options?.filter((_, i) => i !== oIdx) })} className="p-1 text-slate-600 hover:text-pink-500 transition-colors">
                                                                             <X className="w-3.5 h-3.5" />
                                                                         </button>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         </div>
                                                     )}
                                                </div>

                                                <button
                                                    onClick={() => removeQuestion(q.id)}
                                                    className="p-3 text-slate-600 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all h-fit"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Notification Portal */}
            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-12 right-12 px-8 py-5 rounded-2xl border flex items-center gap-4 shadow-2xl z-[100] backdrop-blur-xl ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                    >
                        {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="text-[11px] font-black uppercase tracking-widest">{statusMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
