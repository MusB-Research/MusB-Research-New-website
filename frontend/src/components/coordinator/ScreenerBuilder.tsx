import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, MousePointer2,
    Settings2, Trash2, LayoutGrid, Type,
    ChevronLeft, ChevronRight, Database, Boxes, Rocket, Eye, Terminal, CheckCircle2, AlertTriangle, Upload
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface Question {
    id: string;
    type: 'short_text' | 'choice' | 'dropdown' | 'date';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
    allow_multiple?: boolean;
}

export default function ScreenerBuilder({ 
    initialQuestions = [], 
    onSave, 
    standalone = false 
}: { 
    initialQuestions?: Question[], 
    onSave?: (questions: Question[]) => void,
    standalone?: boolean
}) {
    const [studies, setStudies] = useState<any[]>([]);
    const [selectedStudyId, setSelectedStudyId] = useState('');
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSmartImportModal, setShowSmartImportModal] = useState(false);
    const [smartImportText, setSmartImportText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!standalone) {
            fetchStudies();
        }
    }, [standalone]);

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
        if (selectedStudyId && !standalone) {
            fetchExistingScreener();
        } else if (!standalone) {
            setQuestions([]);
        }
    }, [selectedStudyId, standalone]);

    const fetchExistingScreener = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch(`${API}/api/studies/${selectedStudyId}/`);
            if (res.ok) {
                const data = await res.json();
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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        setStatusMessage({ text: `Deep analyzing ${file.name}...`, type: 'success' });

        try {
            // 1. Upload as a temporary Template for processing
            const formData = new FormData();
            formData.append('pdf_file', file);
            formData.append('name', `Extraction_${file.name.split('.')[0]}_${Date.now()}`);
            formData.append('mode', 'PDF');

            const uploadRes = await authFetch(`${API}/api/questionnaire-templates/`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const templateData = await uploadRes.json();
            const tempId = templateData.id;

            // 2. Trigger Extraction
            const extractRes = await authFetch(`${API}/api/questionnaire-templates/${tempId}/extract_text/`);
            if (!extractRes.ok) throw new Error("Extraction failed");
            const data = await extractRes.json();
            const rawLines: string[] = data.lines || [];

            if (rawLines.length === 0) {
                setStatusMessage({ text: "No text found in document. Is it a scanned image?", type: 'error' });
                return;
            }

            // 3. Process into Blocks (Logic synced with QuestionnaireBuilder)
            const blocks: string[] = [];
            let currentBlock = "";
            for (const line of rawLines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('©') || trimmed.includes('All rights reserved') || /page\s+\d+/i.test(trimmed)) continue;

                const isNewQuestion = /^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])\s+/.test(trimmed);
                const isSectionHeader = /^(PART|SECTION|BLOCK)\s+\d+/i.test(trimmed) || (trimmed.toUpperCase() === trimmed && trimmed.length < 50 && trimmed.length > 5);

                if ((isNewQuestion || isSectionHeader) && currentBlock) {
                    blocks.push(currentBlock.trim());
                    currentBlock = trimmed;
                } else {
                    currentBlock += (currentBlock ? " " : "") + trimmed;
                }
            }
            if (currentBlock) blocks.push(currentBlock.trim());

            // 4. Identify Global Scoring Scale
            let globalScale: string[] = [];
            const scaleDetectPattern = /(\d)\s*[=\-:]\s*([A-Z][A-Z\s]+?)(?=\s+\d|\s*$)/g;
            for (const b of blocks.slice(0, 5)) {
                let match;
                while ((match = scaleDetectPattern.exec(b)) !== null) {
                    globalScale.push(`${match[1]} ${match[2].trim()}`);
                }
                if (globalScale.length > 0) break;
            }

            // 5. Transform Blocks into Screener Questions
            const extractedQs: Question[] = [];
            for (const block of blocks) {
                // Ignore blocks that are likely just headers/instructions
                if (!/^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])/.test(block) && block.length < 20) continue;

                let options: string[] = [];
                let label = block;

                // Clinical Pattern A: Binary (0 for NO, 1 for YES)
                if (/\(0 for NO, 1 for YES\)/i.test(block)) {
                    label = block.replace(/\(0 for NO, 1 for YES\)/i, '').trim();
                    options = ["0 - NO", "1 - YES"];
                }
                // Pattern B: Explicit Inline Options (e.g., 0 None 1 Some)
                else {
                    const inlineScorePattern = /(\d)\s*[=\-:]?\s*([A-Za-z][A-Za-z\s\/\\,\(\)-]+?)(?=\s+\d|\s*$)/g;
                    const inlineMatches = [...block.matchAll(inlineScorePattern)];
                    if (inlineMatches.length > 1) {
                        options = inlineMatches.map(m => `${m[1]} ${m[2].trim()}`);
                        const firstMatchIdx = block.search(/\d\s*[=\-:]?\s*[A-Za-z]/);
                        if (firstMatchIdx > 5) label = block.substring(0, firstMatchIdx).trim();
                    } else if (globalScale.length > 0 && block.match(/\s(\d\s*){2,}\d\s?$/)) {
                        label = block.replace(/\s(\d\s*)+$/, '').trim();
                        options = [...globalScale];
                    }
                }

                // Advanced Cleaning: Strip leaked table headers and response keywords
                let cleanLabel = label.replace(/^\d+[\.\)]\s+/, '').replace(/^[A-G][\.\)]\s+/, '').trim();

                const responseKeywords = [
                    'No problem', 'Mild', 'Moderate', 'Severe', 'Very severe',
                    'None', 'Some', 'A lot', 'Extreme',
                    'Yes', 'No', 'N/A', 'Not at all', 'Somewhat', 'Very much',
                    'Rarely', 'Occasionally', 'Frequently', 'Always'
                ];

                // Pattern: Strip anything after a pipe or multiple spaces if it matches a keyword
                const cleanupPattern = new RegExp(`\\s*(\\||\\s{2,})\\s*(${responseKeywords.join('|')}).*$`, 'i');
                cleanLabel = cleanLabel.replace(cleanupPattern, '').trim();

                // Specific check for the user's PDF table headers leaking (split by pipe)
                if (cleanLabel.includes('|')) {
                    const parts = cleanLabel.split('|');
                    if (parts[0].trim().length > 5) {
                        cleanLabel = parts[0].trim();
                    }
                }

                if (cleanLabel.length < 4) continue;

                extractedQs.push({
                    id: `sq_ai_${Math.random().toString(36).substr(2, 9)}`,
                    type: options.length > 0 ? 'choice' : 'short_text',
                    label: cleanLabel,
                    placeholder: options.length > 0 ? 'Select an option...' : 'Enter your response...',
                    required: true,
                    options: options.length > 0 ? options : undefined,
                    allow_multiple: false
                });
            }

            if (extractedQs.length > 0) {
                setQuestions(prev => [...prev, ...extractedQs]);
                setStatusMessage({ text: `Successfully extracted ${extractedQs.length} questions.`, type: 'success' });
            } else {
                setStatusMessage({ text: "Could not identify specific questions in document.", type: 'error' });
            }

        } catch (err) {
            console.error("Extraction Error:", err);
            setStatusMessage({ text: 'AI Extraction failed. Please try "Smart Import" instead.', type: 'error' });
        } finally {
            setIsExtracting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSmartImport = () => {
        if (!smartImportText.trim()) return;
        const blocks = smartImportText.trim().split(/\n\n+/);
        const newQs: Question[] = [];
        
        for (const block of blocks) {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length === 0) continue;
            const label = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
            const options = lines.slice(1).map(l => l.replace(/^[A-Za-z0-9][\.\)]\s*/, '').replace(/^-\s*/, '').trim());
            
            if (options.length > 0) {
                newQs.push({
                    id: `sq_smart_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'choice',
                    label,
                    placeholder: 'Select an option...',
                    required: true,
                    options,
                    allow_multiple: false
                });
            } else {
                newQs.push({
                    id: `sq_smart_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'short_text',
                    label,
                    placeholder: 'Enter response...',
                    required: true
                });
            }
        }
        
        if (newQs.length > 0) {
            setQuestions([...questions, ...newQs]);
            setStatusMessage({ text: `Smart extracted ${newQs.length} questions.`, type: 'success' });
        }
        setShowSmartImportModal(false);
        setSmartImportText('');
    };

    const handleSave = async () => {
        if (onSave) {
            onSave(questions);
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
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 500);
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

                <div className="flex items-center gap-4">
                    {!standalone && (
                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 h-14">
                            <select
                                value={selectedStudyId}
                                onChange={(e) => setSelectedStudyId(e.target.value)}
                                className="bg-transparent text-[12px] font-black text-white tracking-widest outline-none cursor-pointer px-6 min-w-[240px]"
                            >
                                <option value="" className="bg-[#0B101B]">Select Study Context</option>
                                {studies.map(s => (
                                    <option key={s.id} value={s.id} className="bg-[#0B101B]">{s.protocol_id || s.id}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => setShowSmartImportModal(true)}
                        className="flex items-center gap-3 px-6 h-14 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-[11px] font-black text-pink-400 uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all active:scale-95"
                    >
                        <Terminal className="w-4 h-4" /> AI Extract
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || (!standalone && !selectedStudyId)}
                        className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-[12px] font-black tracking-[0.2em] transition-all shadow-xl active:scale-95 ${isSaving ? 'bg-pink-900 text-pink-300' : 'bg-[#be185d] text-white hover:bg-pink-600 shadow-pink-500/20'}`}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Screener'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-[#0f172a]/50 border border-white/5 rounded-[2rem] p-8">
                        <h3 className="text-[11px] font-black text-slate-500 tracking-widest mb-6 uppercase">Toolbox</h3>
                        <div className="space-y-3">
                            {[
                                { type: 'short_text', icon: Type, label: 'Text Input' },
                                { type: 'choice', icon: List, label: 'Single Choice' },
                                { type: 'dropdown', icon: ChevronDown, label: 'Dropdown' },
                                { type: 'date', icon: Calendar, label: 'Date' }
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

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isExtracting}
                                className="w-full flex flex-col items-center justify-center p-8 bg-pink-500/5 border-2 border-dashed border-pink-500/20 rounded-[2rem] hover:border-pink-500/50 transition-all group relative overflow-hidden"
                            >
                                {isExtracting && (
                                    <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                <Upload className="w-7 h-7 text-pink-500 mb-4" />
                                <span className="text-[12px] font-black text-white uppercase italic">Upload Doc</span>
                                <span className="text-[9px] text-pink-500/60 font-bold uppercase mt-2">AI Extraction</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-9">
                    <div className="min-h-[600px] border-2 border-dashed border-white/5 rounded-[3rem] p-10 flex flex-col items-center bg-black/20">
                        <AnimatePresence>
                            {questions.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
                                    <LayoutGrid className="w-12 h-12 text-slate-700 mb-6" />
                                    <h3 className="text-xl font-black text-white italic">No questions yet</h3>
                                </motion.div>
                            ) : (
                                <div className="w-full space-y-4 max-w-4xl">
                                    {questions.map((q, idx) => (
                                        <motion.div
                                            key={q.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-[#0f172a] border border-white/5 rounded-[2rem] p-8 group relative"
                                        >
                                            <div className="flex items-start gap-6">
                                                <div className="text-2xl font-black italic text-slate-700 group-hover:text-pink-500 transition-colors">
                                                    {(idx + 1).toString().padStart(2, '0')}
                                                </div>
                                                <div className="flex-1 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                         <input
                                                             value={q.label}
                                                             onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                                                             placeholder="Type question here..."
                                                             className="w-full bg-transparent text-lg font-bold text-white outline-none border-b border-white/5 focus:border-pink-500/50 pb-2"
                                                         />
                                                         <div className="flex items-center gap-2 ml-4">
                                                              <button
                                                                 onClick={() => updateQuestion(q.id, { required: !q.required })}
                                                                 className={`text-[9px] font-black px-3 py-1.5 rounded-lg border ${q.required ? 'bg-pink-500/10 border-pink-500/30 text-pink-500' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                                              >
                                                                  {q.required ? 'Required' : 'Optional'}
                                                              </button>
                                                              <span className="text-[9px] font-black text-slate-500 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 uppercase">
                                                                  {q.type}
                                                              </span>
                                                         </div>
                                                     </div>
                                                     {(q.type === 'choice' || q.type === 'dropdown') && (
                                                         <div className="space-y-3 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                                             <div className="flex items-center justify-between">
                                                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Choices</span>
                                                                 <button onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `New Choice`] })} className="text-[10px] font-bold text-pink-500 uppercase">+ Add</button>
                                                             </div>
                                                             <div className="grid grid-cols-2 gap-3">
                                                                 {q.options?.map((opt, oIdx) => (
                                                                     <div key={oIdx} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2">
                                                                         <input
                                                                             value={opt}
                                                                             onChange={(e) => {
                                                                                 const newOpts = [...(q.options || [])];
                                                                                 newOpts[oIdx] = e.target.value;
                                                                                 updateQuestion(q.id, { options: newOpts });
                                                                             }}
                                                                             className="bg-transparent text-xs text-slate-300 outline-none flex-1"
                                                                         />
                                                                         <button onClick={() => updateQuestion(q.id, { options: q.options?.filter((_, i) => i !== oIdx) })} className="text-slate-600 hover:text-pink-500"><X className="w-3 h-3" /></button>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         </div>
                                                     )}
                                                </div>
                                                <button onClick={() => removeQuestion(q.id)} className="p-2 text-slate-700 hover:text-white hover:bg-rose-500/20 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
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

            <AnimatePresence>
                {showSmartImportModal && (
                    <React.Fragment>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSmartImportModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000]" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto w-full max-w-2xl h-fit bg-[#0f172a] border border-white/10 rounded-[2rem] p-10 z-[1001] shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-white italic uppercase">AI Extract Questions</h3>
                                <button onClick={() => setShowSmartImportModal(false)} className="text-slate-500 hover:text-white"><X /></button>
                            </div>
                            <textarea
                                value={smartImportText}
                                onChange={(e) => setSmartImportText(e.target.value)}
                                placeholder="Paste your questions here..."
                                className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-slate-300 outline-none focus:border-pink-500/50 mb-6 resize-none"
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowSmartImportModal(false)} className="px-6 py-2 text-xs font-bold text-slate-400">Cancel</button>
                                <button onClick={handleSmartImport} className="px-8 py-2 bg-pink-600 text-white rounded-lg text-xs font-black uppercase">Extract & Import</button>
                            </div>
                        </motion.div>
                    </React.Fragment>
                )}
            </AnimatePresence>
        </div>
    );
}
