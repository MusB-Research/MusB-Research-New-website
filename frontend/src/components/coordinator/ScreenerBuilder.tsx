import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, MousePointer2,
    Settings2, Trash2, LayoutGrid, Type,
    ChevronLeft, ChevronRight, Database, Boxes, Rocket, Eye, Terminal, CheckCircle2, AlertTriangle, Upload, Sparkles, Smile, CheckSquare
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface Question {
    id: string;
    type: 'short_text' | 'number' | 'choice' | 'dropdown' | 'date' | 'header' | 'description' | 'scale' | 'faces';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
    allow_multiple?: boolean;
    scale_min?: number;
    scale_max?: number;
}

interface LibraryTemplate {
    id: string;
    name: string;
    description: string;
    json_structure: any;
    category: string;
}

export default function ScreenerBuilder({ 
    initialQuestions = [], 
    initialTitle = '',
    initialInstructions = '', 
    onSave, 
    standalone = false 
}: { 
    initialQuestions?: Question[], 
    initialTitle?: string,
    initialInstructions?: string, 
    onSave?: (questions: Question[], title?: string, instructions?: string) => void,
    standalone?: boolean
}) {
    const [studies, setStudies] = useState<any[]>([]);
    const [libraryTemplates, setLibraryTemplates] = useState<LibraryTemplate[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState('');
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
    const [formTitle, setFormTitle] = useState(initialTitle);
    const [formInstructions, setFormInstructions] = useState(initialInstructions);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [showSmartImportModal, setShowSmartImportModal] = useState(false);
    const [smartImportText, setSmartImportText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const onSaveRef = useRef(onSave);
    const didMountRef = useRef(false);

    useEffect(() => {
        fetchLibraryTemplates();
        if (!standalone) {
            fetchStudies();
        }
    }, [standalone]);

    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        if (onSaveRef.current) {
            onSaveRef.current(questions, formTitle, formInstructions);
        }
    }, [questions, formTitle, formInstructions]);

    useEffect(() => {
        if (initialQuestions && initialQuestions.length > 0 && questions.length === 0) {
            setQuestions(initialQuestions);
        }
        if (initialTitle && !formTitle) setFormTitle(initialTitle);
        if (initialInstructions && !formInstructions) setFormInstructions(initialInstructions);
    }, [initialQuestions, initialTitle, initialInstructions]);

    const fetchStudies = async () => {
        try {
            const res = await authFetch(`${API}/api/studies/`);
            if (res.ok) {
                const data = await res.json();
                setStudies(data.results || data || []);
            }
        } catch (err) { }
    };

    const fetchLibraryTemplates = async () => {
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/?category=SCREENER`);
            if (res.ok) {
                const data = await res.json();
                setLibraryTemplates(data.results || data || []);
            }
        } catch (err) { }
    };

    useEffect(() => {
        if (selectedStudyId && !standalone) {
            fetchExistingScreener();
        } else if (!standalone) {
            setQuestions([]);
        }
    }, [selectedStudyId, standalone]);

    const fetchExistingScreener = async () => {
        if (!selectedStudyId || selectedStudyId === 'all') {
            setQuestions([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await authFetch(`${API}/api/studies/${selectedStudyId}/`);
            if (res.ok) {
                const data = await res.json();
                const screenerStep = data.screener_config?.steps?.find((s: any) => s.type === 'user_input');
                if (screenerStep) {
                    if (screenerStep.questions) setQuestions(screenerStep.questions);
                    if (screenerStep.title) setFormTitle(screenerStep.title);
                    if (screenerStep.instructions) setFormInstructions(screenerStep.instructions);
                } else {
                    setQuestions([]);
                    setFormTitle('');
                    setFormInstructions('');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const addQuestion = (type: string) => {
        const isCheckbox = type === 'checkbox';
        const actualType: Question['type'] = isCheckbox ? 'choice' : type as any;

        const newQ: Question = {
            id: `sq_${Date.now()}`,
            type: actualType,
            label: actualType === 'header' ? 'New Section' : (actualType === 'description' ? 'Information block' : ''),
            placeholder: actualType === 'header' ? 'Section Header' : (actualType === 'description' ? 'Write instructions here...' : 'Enter your response...'),
            required: !(actualType === 'header' || actualType === 'description'),
            options: (actualType === 'choice' || actualType === 'dropdown') ? ['Option 1', 'Option 2'] : (actualType === 'scale' ? ['Min Label', 'Max Label'] : undefined),
            allow_multiple: isCheckbox,
            scale_min: actualType === 'scale' ? 0 : undefined,
            scale_max: actualType === 'scale' ? 10 : undefined
        };
        setQuestions([...questions, newQ]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };
    
    const handleImport = async (sourceStudyId: string) => {
        try {
            const res = await authFetch(`${API}/api/studies/${sourceStudyId}/`);
            if (res.ok) {
                const data = await res.json();
                const screenerStep = data.screener_config?.steps?.find((s: any) => s.type === 'user_input');
                if (screenerStep && screenerStep.questions) {
                    const imported = screenerStep.questions.map((q: Question) => ({
                        ...q,
                        id: `sq_imp_${Math.random().toString(36).substr(2, 9)}`
                    }));
                    setQuestions([...questions, ...imported]);
                    setStatusMessage({ text: `Imported ${imported.length} questions.`, type: 'success' });
                    setShowImportModal(false);
                }
            }
        } catch (err) {
            setStatusMessage({ text: 'Failed to fetch source screener.', type: 'error' });
        }
    };

    const handleLibraryImport = (template: LibraryTemplate) => {
        try {
            const importedQs = (template.json_structure?.questions || []).map((q: any) => ({
                id: `sq_lib_${Math.random().toString(36).substr(2, 9)}`,
                type: q.type || 'short_text',
                label: q.label || q.text || '',
                placeholder: q.placeholder || 'Enter response...',
                required: q.required !== undefined ? q.required : true,
                options: q.options,
                allow_multiple: q.allow_multiple
            }));

            if (importedQs.length > 0) {
                setQuestions([...questions, ...importedQs]);
                setStatusMessage({ text: `Imported ${importedQs.length} questions from library.`, type: 'success' });
                setShowLibraryModal(false);
            } else {
                setStatusMessage({ text: 'Template has no compatible questions.', type: 'error' });
            }
        } catch (err) {
            setStatusMessage({ text: 'Failed to process library template.', type: 'error' });
        }
    };

    const handleSaveToLibrary = async () => {
        if (questions.length === 0) {
            setStatusMessage({ text: 'Cannot save an empty screener.', type: 'error' });
            return;
        }

        const name = prompt("Enter a name for this library template:");
        if (!name) return;

        setIsSavingToLibrary(true);
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    category: 'SCREENER',
                    json_structure: {
                        questions: questions.map(({ id, ...q }) => q)
                    }
                })
            });

            if (res.ok) {
                setStatusMessage({ text: 'Saved to library successfully.', type: 'success' });
                fetchLibraryTemplates();
            } else {
                throw new Error("Save failed");
            }
        } catch (err) {
            setStatusMessage({ text: 'Failed to save to library.', type: 'error' });
        } finally {
            setIsSavingToLibrary(false);
        }
    };

    const processExtractionResult = (data: any) => {
        const suggested: Question[] = [];
        const sections = data.sections || [];

        for (const section of sections) {
            // Add section header as a visual separator
            if (section.title && section.title !== 'General') {
                suggested.push({
                    id: `section_${Date.now()}_${Math.random()}`,
                    type: 'header',
                    label: section.title,
                    placeholder: 'Section Header',
                    required: false,
                });
            }

            for (const field of (section.fields || [])) {
                const base = {
                    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                    required: field.required ?? true,
                    placeholder: field.placeholder || 'Enter response...',
                };

                // Map backend types to ScreenerBuilder types
                let type: Question['type'] = 'short_text';
                if (field.type === 'radio' || field.type === 'choice' || field.type === 'checkbox') type = 'choice';
                else if (field.type === 'scale' || field.type === 'vas') type = 'scale';
                else if (field.type === 'faces' || field.type === 'emoji_scale') type = 'faces';
                else if (field.type === 'number') type = 'number';
                else if (field.type === 'date') type = 'date';
                else if (field.type === 'header') type = 'header';
                else if (field.type === 'instruction' || field.type === 'description') type = 'description';

                suggested.push({
                    ...base,
                    type,
                    label: field.label || field.text || 'Question',
                    options: field.options || field.columns || [],
                    allow_multiple: field.type === 'checkbox' || !!field.allow_multiple,
                    scale_min: field.min ?? 0,
                    scale_max: field.max ?? 10
                } as Question);
            }
        }

        if (suggested.length > 0) {
            setQuestions(prev => [...prev, ...suggested]);
            setStatusMessage({ text: `Extracted ${suggested.length} fields.`, type: 'success' });
        } else {
            setStatusMessage({ text: "No structured fields detected.", type: 'error' });
        }
    };

    const handleSmartImport = async (text: string) => {
        setIsExtracting(true);
        setStatusMessage({ text: 'AI engine analyzing text...', type: 'success' });
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/smart-extract/`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            if (res.ok) {
                const data = await res.json();
                processExtractionResult(data);
            } else {
                throw new Error("Smart extraction failed");
            }
        } catch (err) {
            setStatusMessage({ text: 'Neural extraction failed.', type: 'error' });
        } finally {
            setIsExtracting(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        setStatusMessage({ text: `Deep analyzing ${file.name}...`, type: 'success' });

        try {
            const formData = new FormData();
            formData.append('pdf_file', file);
            formData.append('name', `Extraction_${file.name.split('.')[0]}_${Date.now()}`);
            formData.append('category', 'SCREENER');
            formData.append('mode', 'PDF');

            const uploadRes = await authFetch(`${API}/api/questionnaire-templates/`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const templateData = await uploadRes.json();
            const tempId = templateData.id;

            const extractRes = await authFetch(`${API}/api/questionnaire-templates/${tempId}/extract_text/`);
            if (!extractRes.ok) throw new Error("Extraction failed");
            const data = await extractRes.json();
            
            processExtractionResult(data);
            fetchLibraryTemplates(); // Refresh library
        } catch (err) {
            setStatusMessage({ text: 'Extraction failed.', type: 'error' });
        } finally {
            setIsExtracting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (onSave) {
            onSave(questions, formTitle, formInstructions);
            setStatusMessage({ text: 'Screener questions updated.', type: 'success' });
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        if (!selectedStudyId) {
            setStatusMessage({ text: 'Please select a study context.', type: 'error' });
            return;
        }

        setIsSaving(true);
        const screenerConfig = {
            steps: [
                { id: 'STEP1', type: 'system', label: 'Basics' },
                { 
                    id: 'STEP2', 
                    type: 'user_input', 
                    label: 'Eligibility',
                    title: formTitle,
                    instructions: formInstructions,
                    questions: questions.map(q => ({
                        ...q,
                        id: q.id || `idx_${Math.random().toString(36).substr(2, 9)}`
                    }))
                },
                { id: 'STEP3', type: 'system', label: 'Contact' }
            ]
        };

        try {
            const res = await authFetch(`${API}/api/studies/${selectedStudyId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ screener_config: screenerConfig })
            });
            if (res.ok) {
                setStatusMessage({ text: 'Screener saved successfully.', type: 'success' });
                setTimeout(() => setStatusMessage(null), 3000);
            }
        } catch (err) {
            setStatusMessage({ text: 'Error saving screener.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const saveToLibrary = async () => {
        if (!formTitle) {
            setStatusMessage({ text: 'Please enter a form title.', type: 'error' });
            return;
        }
        setIsSavingToLibrary(true);
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/`, {
                method: 'POST',
                body: JSON.stringify({
                    name: formTitle,
                    category: 'SCREENER',
                    json_structure: {
                        title: formTitle,
                        instructions: formInstructions,
                        questions: questions
                    }
                })
            });
            if (res.ok) {
                setStatusMessage({ text: 'Screener saved to library.', type: 'success' });
                fetchLibraryTemplates();
            } else {
                throw new Error("Failed to save to library");
            }
        } catch (err) {
            setStatusMessage({ text: 'Error saving to library.', type: 'error' });
        } finally {
            setIsSavingToLibrary(false);
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-4 h-4 text-pink-500" />
                        <span className="text-[10px] font-black text-pink-500 tracking-[0.3em]">STUDY SETTING: ELIGIBILITY CHECK</span>
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">Eligibility Designer</h2>
                    <p className="text-sm text-slate-400 mt-2 font-medium opacity-70">Create a screening questionnaire for potential participants.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {!standalone && (
                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 h-14">
                            <select
                                value={selectedStudyId}
                                onChange={(e) => setSelectedStudyId(e.target.value)}
                                className="bg-transparent text-[11px] font-black text-white tracking-widest outline-none cursor-pointer px-4 min-w-[200px]"
                            >
                                <option value="" className="bg-[#0B101B]">Select Context</option>
                                {studies.map(s => (
                                    <option key={s.id} value={s.id} className="bg-[#0B101B]">{s.protocol_id || s.id}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button onClick={() => setShowLibraryModal(true)} className="flex items-center justify-center gap-3 px-6 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95 whitespace-nowrap"><Boxes className="w-4 h-4" /> Library</button>
                    <button onClick={saveToLibrary} disabled={isSavingToLibrary} className="flex items-center justify-center gap-3 px-6 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95 whitespace-nowrap">
                        {isSavingToLibrary ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save to Library
                    </button>
                    <button onClick={() => setShowSmartImportModal(true)} className="flex items-center justify-center gap-3 px-6 h-14 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-[10px] font-black text-pink-400 uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all active:scale-95 whitespace-nowrap"><Terminal className="w-4 h-4" /> AI Extract</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-3 px-8 h-14 bg-[#be185d] text-white rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all shadow-xl active:scale-95 whitespace-nowrap shadow-pink-500/20 hover:bg-pink-600">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
                        Save & Deploy
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    <div className="bg-[#0f172a]/50 border border-white/5 rounded-[2rem] p-8">
                        <h3 className="text-[11px] font-black text-slate-500 tracking-widest mb-6 uppercase">Toolbox</h3>
                        <div className="space-y-2">
                            {[
                                { type: 'short_text', icon: Type, label: 'Text Input', color: 'text-blue-400' },
                                { type: 'number', icon: Database, label: 'Number Input', color: 'text-emerald-400' },
                                { type: 'choice', icon: List, label: 'Radio Buttons', color: 'text-indigo-400' },
                                { type: 'checkbox', icon: CheckSquare, label: 'Checkboxes', color: 'text-sky-400' },
                                { type: 'scale', icon: MousePointer2, label: 'Linear Slider', color: 'text-orange-400' },
                                { type: 'faces', icon: Smile, label: 'Emoji Scale', color: 'text-yellow-400' },
                                { type: 'dropdown', icon: ChevronDown, label: 'Dropdown', color: 'text-purple-400' },
                                { type: 'date', icon: Calendar, label: 'Date', color: 'text-amber-400' },
                                { type: 'header', icon: Layout, label: 'Header', color: 'text-rose-400' },
                                { type: 'description', icon: FileText, label: 'Description', color: 'text-emerald-400' }
                            ].map((item, idx) => (
                                <button key={idx} onClick={() => addQuestion(item.type as any)} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group transition-all hover:bg-white/10">
                                    <div className="flex items-center gap-4">
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white">{item.label}</span>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-700 group-hover:text-white" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-9 space-y-6">
                    <div className="bg-[#0f172a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                        <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Enter Form Title..." className="w-full bg-transparent text-4xl font-black text-white outline-none border-b border-white/5 focus:border-pink-500/50 pb-6 mb-8 placeholder:text-slate-800 transition-all" />
                        <textarea value={formInstructions} onChange={(e) => setFormInstructions(e.target.value)} placeholder="Write instructions here..." className="w-full bg-[#0B101B]/50 border border-white/5 rounded-[1.5rem] p-6 text-slate-300 text-sm outline-none focus:border-pink-500/30 transition-all min-h-[140px] resize-none shadow-inner placeholder:text-slate-700" />
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {questions.map((q, idx) => (
                                <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0f172a] border border-white/5 rounded-[2rem] p-8 group relative">
                                    <div className="flex items-start gap-6">
                                        <div className="text-2xl font-black italic text-slate-700 group-hover:text-pink-500">{(idx + 1).toString().padStart(2, '0')}</div>
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <input value={q.label} onChange={(e) => updateQuestion(q.id, { label: e.target.value })} placeholder="Type question here..." className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-white/5 focus:border-pink-500/50 pb-2 mr-4" />
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateQuestion(q.id, { required: !q.required })} className={`text-[9px] font-black px-3 py-1.5 rounded-lg border ${q.required ? 'bg-pink-500/10 border-pink-500/30 text-pink-500' : 'bg-white/5 border-white/5 text-slate-500'}`}>{q.required ? 'Required' : 'Optional'}</button>
                                                    <span className="text-[9px] font-black text-slate-500 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 uppercase">{q.type.replace('_', ' ')}</span>
                                                    <button onClick={() => removeQuestion(q.id)} className="p-2 text-slate-700 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            {q.type === 'header' && (
                                                <div className="py-2 border-b-2 border-white/10">
                                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Header Preview</h3>
                                                </div>
                                            )}

                                            {q.type === 'description' && (
                                                <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-4">
                                                    <p className="text-xs text-slate-400 leading-relaxed italic">Description text will appear here as informational content for the participant.</p>
                                                </div>
                                            )}

                                            {q.type === 'short_text' && (
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                                    <input disabled placeholder={q.placeholder || "User types here..."} className="w-full bg-transparent text-slate-500 outline-none" />
                                                </div>
                                            )}

                                            {q.type === 'number' && (
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                                    <input type="number" disabled placeholder="0" className="w-32 bg-transparent text-slate-500 outline-none" />
                                                </div>
                                            )}

                                            {q.type === 'date' && (
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-slate-600" />
                                                    <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">MM/DD/YYYY</span>
                                                </div>
                                            )}

                                            {(q.type === 'choice' || q.type === 'dropdown') && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Options</div>
                                                        {q.type === 'choice' && (
                                                            <button 
                                                                onClick={() => updateQuestion(q.id, { allow_multiple: !q.allow_multiple })}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-widest ${q.allow_multiple ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}
                                                            >
                                                                {q.allow_multiple ? <CheckSquare className="w-3 h-3" /> : <List className="w-3 h-3" />}
                                                                {q.allow_multiple ? 'Multiple Choice (Checkboxes)' : 'Single Choice (Radio)'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {q.options?.map((opt, oIdx) => (
                                                            <div key={oIdx} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-3 group/opt">
                                                                <input value={opt} onChange={(e) => {
                                                                    const newOpts = [...(q.options || [])];
                                                                    newOpts[oIdx] = e.target.value;
                                                                    updateQuestion(q.id, { options: newOpts });
                                                                }} className="bg-transparent text-xs text-slate-300 outline-none flex-1 font-bold" />
                                                                <button onClick={() => updateQuestion(q.id, { options: q.options?.filter((_, i) => i !== oIdx) })} className="text-slate-700 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `New Option`] })} className="text-[9px] font-black text-pink-500 uppercase tracking-widest hover:text-pink-400 transition-colors">+ Add Option</button>
                                                </div>
                                            )}

                                            {q.type === 'scale' && (
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <input value={q.options?.[0] || ''} onChange={(e) => { const opts = [...(q.options || [])]; opts[0] = e.target.value; updateQuestion(q.id, { options: opts }); }} placeholder="Min Label" className="bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none border-b border-white/5 w-32 focus:border-pink-500/50" />
                                                        <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                                                            <div className="absolute left-1/2 -top-1.5 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-orange-500" />
                                                        </div>
                                                        <input value={q.options?.[1] || ''} onChange={(e) => { const opts = [...(q.options || [])]; opts[1] = e.target.value; updateQuestion(q.id, { options: opts }); }} placeholder="Max Label" className="bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none border-b border-white/5 w-32 text-right focus:border-pink-500/50" />
                                                    </div>
                                                    <div className="flex items-center gap-6 pt-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Min Value:</span>
                                                            <input type="number" value={q.scale_min ?? 0} onChange={(e) => updateQuestion(q.id, { scale_min: parseInt(e.target.value) })} className="w-16 bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-xs font-bold text-white outline-none focus:border-pink-500/50" />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Max Value:</span>
                                                            <input type="number" value={q.scale_max ?? 10} onChange={(e) => updateQuestion(q.id, { scale_max: parseInt(e.target.value) })} className="w-16 bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-xs font-bold text-white outline-none focus:border-pink-500/50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {q.type === 'faces' && (
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex justify-center gap-10">
                                                    {[
                                                        { e: '😢', l: 'Very Poor' },
                                                        { e: '😕', l: 'Poor' },
                                                        { e: '😐', l: 'Fair' },
                                                        { e: '🙂', l: 'Good' },
                                                        { e: '😊', l: 'Excellent' }
                                                    ].map((f, i) => (
                                                        <div key={i} className="flex flex-col items-center gap-3">
                                                            <span className="text-4xl grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default transform hover:scale-110">{f.e}</span>
                                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{f.l}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {statusMessage && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl border flex items-center gap-3 z-[100] backdrop-blur-xl ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{statusMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Library Modal */}
            <AnimatePresence>
                {showLibraryModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLibraryModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-[#0b101b] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Screener Library</h3>
                                    <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">Pre-built templates & saved forms</p>
                                </div>
                                <button onClick={() => setShowLibraryModal(false)} className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-slate-500 rounded-2xl transition-all"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {libraryTemplates.length > 0 ? (
                                        libraryTemplates.map((template) => (
                                            <div key={template.id} className="group bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-pink-500/30 transition-all relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Boxes className="w-4 h-4" /></div>
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{template.category || 'TEMPLATE'}</span>
                                                    </div>
                                                    <h4 className="text-lg font-black text-white mb-2 leading-tight">{template.name}</h4>
                                                    <p className="text-xs text-slate-500 line-clamp-2 mb-6 font-medium">{template.description || 'No description available for this template.'}</p>
                                                    <button 
                                                        onClick={() => {
                                                            const structure = template.json_structure;
                                                            const templateQs = structure?.questions || structure?.steps?.[1]?.questions || [];
                                                            if (templateQs.length > 0) {
                                                                setQuestions(templateQs.map((q: any) => ({
                                                                    ...q,
                                                                    id: `sq_lib_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                                                                })));
                                                                if (structure?.title || template.name) setFormTitle(structure.title || template.name);
                                                                if (structure?.instructions) setFormInstructions(structure.instructions);
                                                                setShowLibraryModal(false);
                                                                setStatusMessage({ text: 'Template imported successfully.', type: 'success' });
                                                            }
                                                        }}
                                                        className="w-full py-3 bg-white/5 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        Use This Template
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 py-20 text-center">
                                            <div className="inline-flex p-6 bg-white/5 rounded-full mb-4"><Database className="w-8 h-8 text-slate-700" /></div>
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No templates found in library</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Smart Import Modal */}
            <AnimatePresence>
                {showSmartImportModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSmartImportModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-[#0b101b] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl"><Sparkles className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic tracking-tight uppercase">AI Extraction</h3>
                                        <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">Paste text to extract questions</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSmartImportModal(false)} className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-slate-500 rounded-2xl transition-all"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol or Questionnaire Text</label>
                                    <textarea 
                                        value={smartImportText}
                                        onChange={(e) => setSmartImportText(e.target.value)}
                                        placeholder="Paste your clinical criteria, screening questions, or protocol text here..."
                                        className="w-full h-64 bg-[#0B101B] border border-white/5 rounded-2xl p-6 text-slate-300 text-sm outline-none focus:border-pink-500/30 transition-all resize-none shadow-inner"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowSmartImportModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                                    <button 
                                        onClick={() => {
                                            if (smartImportText.trim()) {
                                                handleSmartImport(smartImportText);
                                                setShowSmartImportModal(false);
                                            }
                                        }}
                                        disabled={!smartImportText.trim() || isExtracting}
                                        className="flex-[2] py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isExtracting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
                                        Run AI Extraction
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
