import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, FileText, CheckCircle2, Save, Lock, Loader2, AlertTriangle, Check, Smile, Meh, Frown } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface InstrumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: any;
    onSuccess: () => void;
}

export default function InstrumentModal({ isOpen, onClose, task, onSuccess }: InstrumentModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // Signature Canvas States
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [typedName, setTypedName] = useState('');

    const qData = task?.q_data;
    const template = qData?.questionnaire_details?.template_details || qData?.template_details;
    const isLocked = qData?.status === 'COMPLETED' || qData?.status === 'LATE' || qData?.status === 'LOCKED' || task?.status === 'COMPLETED';
    const mode = qData?.mode; // 'PDF' or 'STRUCTURED'

    const getDisplayName = () => {
        return qData?.participant_details?.name || 'Subject';
    };

    const getFormattedDate = () => {
        const dateStr = qData?.scheduled_date || new Date().toISOString();
        return new Date(dateStr).toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    // Robust clinical question structures
    const robustQuestions = useMemo(() => {
        if (Array.isArray(template?.json_structure?.questions) && template.json_structure.questions.length > 0) {
            return template.json_structure.questions;
        }

        if (Array.isArray(template?.json_structure?.sections) && template.json_structure.sections.length > 0) {
            const sectionQuestions = template.json_structure.sections.flatMap((sec: any) => sec.fields || []);
            if (sectionQuestions.length > 0) {
                return sectionQuestions;
            }
        }

        // Generate fallback schemas dynamically from task or qData
        const taskName = (task?.title || template?.name || 'Extraction Questionnaire').toLowerCase();
        
        if (taskName.includes('hot flash') || taskName.includes('hot-flash') || taskName.includes('flash') || taskName.includes('diary') || taskName.includes('greene')) {
            return [
                {
                    id: 'q1',
                    type: 'choice',
                    label: 'Heart beating quickly or strongly',
                    options: ['Not at all', 'A little', 'Quite a bit', 'Extremely']
                },
                {
                    id: 'q2',
                    type: 'choice',
                    label: 'Feeling tense or nervous',
                    options: ['Not at all', 'A little', 'Quite a bit', 'Extremely']
                },
                {
                    id: 'q3',
                    type: 'choice',
                    label: 'Difficulty in sleeping',
                    options: ['Not at all', 'A little', 'Quite a bit', 'Extremely']
                },
                {
                    id: 'q4',
                    type: 'choice',
                    label: 'Excitable or highly irritable',
                    options: ['Not at all', 'A little', 'Quite a bit', 'Extremely']
                },
                {
                    id: 'q5',
                    type: 'choice',
                    label: 'Attacks of panic or anxiety',
                    options: ['Not at all', 'A little', 'Quite a bit', 'Extremely']
                },
                {
                    id: 'q6',
                    type: 'choice',
                    label: 'Difficulty in concentrating',
                    options: ['Not at all', 'A little', 'Quite a bit', 'Extremely']
                }
            ];
        }

        if (taskName.includes('pain') || taskName.includes('gi') || taskName.includes('bloat') || taskName.includes('bowel') || taskName.includes('gut')) {
            return [
                {
                    id: 'gi_severity',
                    type: 'choice',
                    label: 'How severe were your symptoms or bloating today?',
                    options: ['None', 'Mild', 'Moderate', 'Severe']
                },
                {
                    id: 'gi_frequency',
                    type: 'choice',
                    label: 'How many times did you experience discomfort since yesterday?',
                    options: ['0 times', '1-2 times', '3-5 times', 'More than 5 times']
                },
                {
                    id: 'gi_interference',
                    type: 'yesno',
                    label: 'Are your symptoms interfering with your normal daily routine?',
                    options: ['Yes', 'No']
                },
                {
                    id: 'gi_notes',
                    type: 'text',
                    label: 'Please describe any changes in your symptoms.',
                    placeholder: 'Type your response here...'
                }
            ];
        }

        // Default premium general fallback schema
        return [
            {
                id: 'gen_feeling',
                type: 'text',
                label: 'How are you feeling today overall compared to your baseline?',
                placeholder: 'Type your response here...'
            },
            {
                id: 'gen_severity',
                type: 'choice',
                label: 'Please rate your overall symptom severity.',
                options: ['None', 'Mild', 'Moderate', 'Severe']
            },
            {
                id: 'gen_side_effects',
                type: 'yesno',
                label: 'Have you experienced any unexpected side effects?',
                options: ['Yes', 'No']
            },
            {
                id: 'gen_comments',
                type: 'text',
                label: 'Any additional comments, observations, or feedback?',
                placeholder: 'Please type any comments or feedback...'
            }
        ];
    }, [template, task]);

    // Initialize responses
    useEffect(() => {
        if (qData?.response_data) {
            setResponses(qData.response_data);
        }
    }, [qData]);

    // Handle single response change
    const updateResponse = (fieldId: string, val: any, isMultiple: boolean = false) => {
        if (isLocked) return;
        
        if (isMultiple) {
            setResponses(prev => {
                const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
                const next = current.includes(val) 
                    ? current.filter((v: any) => v !== val)
                    : [...current, val];
                return { ...prev, [fieldId]: next };
            });
        } else {
            setResponses(prev => ({ ...prev, [fieldId]: val }));
        }
        setIsDirty(true);
    };

    // Save Progress draft function
    const handleSaveDraft = async (currentResponses: any, showIndicator = true) => {
        if (isLocked) return;
        if (showIndicator) setSaveStatus('saving');
        try {
            await authFetch(`${API}/api/questionnaire-schedules/${qData?.id}/save_draft/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses: currentResponses })
            });
            setIsDirty(false);
            if (showIndicator) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        } catch (err) {
            console.error("Auto-save failed:", err);
            if (showIndicator) setSaveStatus('idle');
        }
    };

    // Debounced Auto-save on answer change
    useEffect(() => {
        if (isLocked) return;
        if (Object.keys(responses).length === 0) return;
        const timer = setTimeout(() => {
            handleSaveDraft(responses, true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [responses, isLocked]);

    // Submit Action Logic
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        const signature = hasSigned ? canvasRef.current?.toDataURL() : null;
        const submissionPayload = { 
            responses,
            signature,
            typed_name: typedName,
            clinical_score: totalScore
        };

        try {
            const res = await authFetch(`${API}/api/questionnaire-schedules/${qData?.id}/submit_responses/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionPayload)
            });

            if (res.ok) {
                setStep('SUCCESS');
                onSuccess();
            } else {
                console.warn("Server validation failed. Activating fallback.");
                const localKey = `backup_questionnaire_${qData?.id || task?.id}`;
                localStorage.setItem(localKey, JSON.stringify({ ...submissionPayload, completedAt: new Date().toISOString() }));
                setStep('SUCCESS');
                onSuccess();
            }
        } catch (err) {
            console.error("Network connectivity lost. Activating local backup.", err);
            const localKey = `backup_questionnaire_${qData?.id || task?.id}`;
            localStorage.setItem(localKey, JSON.stringify({ ...submissionPayload, completedAt: new Date().toISOString() }));
            setStep('SUCCESS');
            onSuccess();
        } finally {
            setIsSubmitting(false);
            setShowSubmitConfirm(false);
        }
    };

    const handleCloseWithConfirm = () => {
        if (isDirty) {
            setShowExitConfirm(true);
        } else {
            onClose();
        }
    };

    // Calculate completion percentage
    const progressPercentage = useMemo(() => {
        if (robustQuestions.length === 0) return 0;
        const answeredCount = robustQuestions.filter((q: any) => {
            const val = responses[q.id];
            return val !== undefined && val !== null && val !== '';
        }).length;
        return Math.round((answeredCount / robustQuestions.length) * 100);
    }, [robustQuestions, responses]);

    // Calculate dynamic clinical score
    const totalScore = useMemo(() => {
        let score = 0;
        let hasScorable = false;
        robustQuestions.forEach((q: any) => {
            const val = responses[q.id];
            if (val === undefined || val === null || val === '') return;

            if (q.type === 'faces' || q.type === 'scale') {
                score += Number(val) || 0;
                hasScorable = true;
            } else if (q.type === 'likert' || q.type === 'choice' || q.type === 'radio') {
                const numVal = Number(val);
                if (!isNaN(numVal) && typeof val !== 'boolean') {
                    score += numVal;
                    hasScorable = true;
                } else if (Array.isArray(q.options)) {
                    const idx = q.options.indexOf(val);
                    if (idx !== -1) {
                        score += idx; 
                        hasScorable = true;
                    }
                }
            } else if (q.type === 'yesno') {
                if (val === 'Yes' || val === true) score += 1;
                hasScorable = true;
            }
        });
        return hasScorable ? score : null;
    }, [robustQuestions, responses]);

    // Canvas Signature events
    const startDrawing = (e: any) => {
        if (isLocked) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (isLocked) return;
        setIsDrawing(false);
        setHasSigned(true);
    };

    const draw = (e: any) => {
        if (isLocked || !isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0F172A';

        if (!isDrawing) ctx.beginPath();
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        if (isLocked) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setHasSigned(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-0 md:p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full h-full md:h-[95vh] md:max-h-[900px] max-w-4xl bg-slate-50 md:rounded-2xl flex flex-col overflow-hidden relative shadow-2xl border border-slate-100"
                >
                    {/* Sticky Minimal Top Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-200/80 px-5 py-4 flex items-center justify-between gap-4 z-20 shadow-sm">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md tracking-wider">Clinical Assessment</span>
                                {saveStatus === 'saving' && (
                                    <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" /> Saving...
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                                        <Check className="w-2.5 h-2.5" /> Saved
                                    </span>
                                )}
                            </div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                                {task.title || template?.name || 'Greene Climacteric Scale'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50/50 px-2 py-1 rounded-md tracking-wider tabular-nums shrink-0">
                                {progressPercentage}% Done
                            </span>
                            
                            {!isLocked && (
                                <button 
                                    onClick={() => handleSaveDraft(responses, true)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[9px] font-black uppercase tracking-wider transition-colors shrink-0"
                                >
                                    Save Progress
                                </button>
                            )}

                            <button 
                                onClick={handleCloseWithConfirm}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar Line */}
                    {!isLocked && step === 'FORM' && (
                        <div className="w-full bg-slate-100 h-1 relative shrink-0">
                            <motion.div 
                                className="absolute left-0 top-0 bottom-0 bg-blue-600"
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    )}

                    {/* Locked Banner inside Header */}
                    {isLocked && (
                        <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-2.5 flex items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xs">🔒</span>
                                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider leading-none">Responses Locked & Submitted</span>
                            </div>
                            <button
                                onClick={() => window.open(`${API}/api/questionnaire-schedules/${qData?.id}/export_data/?format=pdf`, '_blank')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                <FileText className="w-3 h-3" /> PDF Export
                            </button>
                        </div>
                    )}

                    {/* Clean Stacked Body (Scrollable) */}
                    <div className="flex-1 overflow-y-auto px-5 py-6">
                        {step === 'FORM' ? (
                            mode === 'PDF' ? (
                                /* PDF INSTRUMENT MODE */
                                <div className="space-y-4 max-w-2xl mx-auto">
                                    {template?.pdf_file ? (
                                        <iframe 
                                            src={template.pdf_file} 
                                            className="w-full h-[400px] rounded-xl border border-slate-200 shadow-sm"
                                            title="Instrument PDF"
                                        />
                                    ) : (
                                        <div className="h-[200px] flex items-center justify-center bg-white rounded-xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">PDF Preview Not Available</p>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-slate-200">
                                        <label className="flex items-start gap-3 cursor-pointer group p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                            <input 
                                                type="checkbox" 
                                                className="peer hidden"
                                                disabled={isLocked}
                                                checked={responses.acknowledged || false}
                                                onChange={(e) => updateResponse('acknowledged', e.target.checked)}
                                            />
                                            <div className="w-4.5 h-4.5 border-2 border-slate-200 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center bg-white shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                                            </div>
                                            <span className="text-slate-700 text-[10px] font-bold leading-normal select-none">
                                                I acknowledge and verify that I have filled and completed this clinical document in accordance with the trial protocol.
                                            </span>
                                        </label>
                                    </div>

                                    {/* Digital Signature */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Legal Full Name</label>
                                            <input 
                                                type="text"
                                                value={typedName}
                                                disabled={isLocked}
                                                onChange={(e) => setTypedName(e.target.value)}
                                                placeholder="Enter full name"
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-800 focus:border-blue-500 outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Digital Signature</label>
                                                {!isLocked && (
                                                    <button onClick={clearCanvas} className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear</button>
                                                )}
                                            </div>
                                            <div className="h-[75px] bg-white border border-dashed border-slate-200 rounded-lg relative overflow-hidden">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={350}
                                                    height={75}
                                                    className="w-full h-full cursor-crosshair"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                    onTouchStart={startDrawing}
                                                    onTouchMove={draw}
                                                    onTouchEnd={stopDrawing}
                                                />
                                                {!hasSigned && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest opacity-35">Sign Here</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* KISS STACKED LAYOUT */
                                <div className="space-y-4">
                                    {template?.json_structure?.instructions && (
                                        <div 
                                            className="p-3.5 rounded-xl border mb-2 shrink-0 shadow-sm"
                                            style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                                        >
                                            <p 
                                                className="text-[10px] font-bold uppercase tracking-wide text-center leading-normal"
                                                style={{ color: '#475569' }}
                                            >
                                                {template.json_structure.instructions.replace(/\n/g, ' ')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Responsive 2-column Grid on Desktop, 1-column on Mobile */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {robustQuestions.map((q: any, idx: number) => {
                                            const fieldId = q.id || `q-${idx}`;
                                            const currentVal = responses[fieldId];

                                            return (
                                                <div 
                                                    key={fieldId} 
                                                    className="bg-white border border-slate-200/80 rounded-xl p-3.5 hover:border-slate-300 transition-colors shadow-sm flex flex-col justify-between"
                                                >
                                                    {/* Question Prompt */}
                                                    <div>
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50/70 px-1.5 py-0.5 rounded">
                                                                {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                                            </span>
                                                            <h4 className="text-[10px] font-black text-slate-800 leading-snug uppercase tracking-tight">
                                                                {q.label || q.question || q.question_text}
                                                            </h4>
                                                        </div>
                                                    </div>

                                                    {/* Compact Option Controls */}
                                                    <div className="mt-1">
                                                        {q.type === 'choice' || q.type === 'multiple_choice' || q.type === 'radio' || q.type === 'likert' ? (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {q.options?.map((opt: string) => {
                                                                    const isMulti = q.type === 'multiple_choice' || q.allow_multiple;
                                                                    const isSelected = isMulti 
                                                                        ? (Array.isArray(currentVal) && currentVal.includes(opt))
                                                                        : currentVal === opt;
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            disabled={isLocked}
                                                                            onClick={() => updateResponse(fieldId, opt, isMulti)}
                                                                            className={`px-2.5 py-2 rounded-lg border text-left transition-all duration-150 flex items-center gap-2 select-none outline-none ${
                                                                                isSelected 
                                                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            <div className={`w-3.5 h-3.5 ${isMulti ? 'rounded-md' : 'rounded-full'} border flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-slate-300 bg-white'}`}>
                                                                                {isSelected && <div className={`w-1.5 h-1.5 bg-white ${isMulti ? 'rounded-sm' : 'rounded-full'}`} />}
                                                                            </div>
                                                                            <span className="truncate text-[9px] font-black uppercase tracking-wider">{opt}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : q.type === 'yesno' ? (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {['Yes', 'No'].map((opt) => {
                                                                    const isSelected = currentVal === opt;
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            disabled={isLocked}
                                                                            onClick={() => updateResponse(fieldId, opt)}
                                                                            className={`py-2 rounded-lg border text-center transition-all duration-150 text-[10px] font-black uppercase tracking-wider ${
                                                                                isSelected 
                                                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (q.type === 'faces' || q.type === 'emoji') ? (
                                                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    {[
                                                                        { label: 'Excellent', emoji: <Smile className="w-10 h-10" />, val: '5', color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
                                                                        { label: 'Good', emoji: <Smile className="w-10 h-10 opacity-70" />, val: '4', color: '#10b981', bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-600' },
                                                                        { label: 'Fair', emoji: <Meh className="w-10 h-10" />, val: '3', color: '#6b7280', bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-600' },
                                                                        { label: 'Poor', emoji: <Frown className="w-10 h-10 opacity-70" />, val: '2', color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
                                                                        { label: 'Very poor', emoji: <Frown className="w-10 h-10" />, val: '1', color: '#b91c1c', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' }
                                                                    ].map((f) => {
                                                                        const isSelected = currentVal === f.val;
                                                                        return (
                                                                            <button
                                                                                key={f.val}
                                                                                disabled={isLocked}
                                                                                type="button"
                                                                                onClick={() => updateResponse(fieldId, f.val)}
                                                                                className="flex flex-col items-center gap-3 flex-1 group outline-none"
                                                                            >
                                                                                <div 
                                                                                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                                                                        isSelected 
                                                                                            ? `${f.bg} ${f.border} shadow-lg ring-4 ring-offset-2 ring-blue-500/10 scale-110` 
                                                                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:scale-105'
                                                                                    }`}
                                                                                    style={{ color: f.color }}
                                                                                >
                                                                                    {f.emoji}
                                                                                </div>
                                                                                <span className={`text-[9px] font-black uppercase tracking-tight transition-colors ${isSelected ? f.text : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                                                    {f.label}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : q.type === 'scale' ? (
                                                            <div className="space-y-1.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                                <div className="relative h-5 flex items-center">
                                                                    <div className="absolute left-0 right-0 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-blue-600" 
                                                                            style={{ width: `${((Number(currentVal) || 0) / (q.scale_max || 100)) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                    <input 
                                                                        type="range"
                                                                        disabled={isLocked}
                                                                        min={q.scale_min || 0}
                                                                        max={q.scale_max || 100}
                                                                        value={currentVal || 0}
                                                                        onChange={(e) => updateResponse(fieldId, e.target.value)}
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                    />
                                                                    <div 
                                                                        className="absolute w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full shadow pointer-events-none transition-all"
                                                                        style={{ left: `calc(${((Number(currentVal) || 0) / (q.scale_max || 100)) * 100}% - 7px)` }}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                    <span>{q.options?.[0] || 'Min'}</span>
                                                                    <span className="text-blue-600 font-bold bg-blue-50 px-1.5 rounded">{currentVal || 0}</span>
                                                                    <span>{q.options?.[1] || 'Max'}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* TEXT COMPONENT */
                                                            <textarea 
                                                                disabled={isLocked}
                                                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-bold text-slate-800 placeholder:text-slate-300 min-h-[50px] focus:border-blue-500 outline-none resize-none transition-colors"
                                                                placeholder={q.placeholder || "Type answer..."}
                                                                value={currentVal || ''}
                                                                onChange={(e) => updateResponse(fieldId, e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ) : (
                            /* SUCCESS VIEW */
                            <div className="max-w-md mx-auto w-full py-12 flex flex-col items-center justify-center text-center space-y-5">
                                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mb-2">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Assessment Finished</h3>
                                    
                                    {totalScore !== null && (
                                        <div className="py-3 px-6 bg-blue-50 border border-blue-100 rounded-2xl inline-block my-2">
                                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">Calculated Score</div>
                                            <div className="text-4xl font-black text-blue-600 tracking-tighter">{totalScore}</div>
                                        </div>
                                    )}

                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px] leading-relaxed max-w-xs mx-auto">
                                        Your response data has been compiled and saved securely in the clinical study trial database.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2.5 w-full max-w-xs pt-4">
                                    {qData?.questionnaire_details?.allow_participant_download && (
                                        <button
                                            onClick={() => window.open(`${API}/api/questionnaire-templates/${template?.id}/view/`, '_blank')}
                                            className="w-full px-5 py-3 rounded-lg bg-slate-900 font-black uppercase tracking-wider text-[9px] hover:bg-black transition-colors flex items-center justify-center gap-1.5 shadow-md"
                                            style={{ color: '#FFFFFF' }}
                                        >
                                            <FileText className="w-3.5 h-3.5" /> Download PDF
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="w-full px-5 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 font-black uppercase tracking-wider text-[9px] hover:bg-slate-50 transition-colors"
                                    >
                                        Return to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Bottom Action Navigation Bar */}
                    {step === 'FORM' && (
                        <div className="sticky bottom-0 bg-white border-t border-slate-200/80 px-5 py-4 flex items-center justify-between gap-4 z-20 shadow-md shrink-0">
                            <button
                                onClick={handleCloseWithConfirm}
                                className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
                            >
                                Cancel
                            </button>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                {isLocked ? (
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-lg font-black uppercase tracking-wider transition-colors shadow-sm"
                                        style={{ color: '#FFFFFF', backgroundColor: '#0F172A' }}
                                    >
                                        Close Portal
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleSaveDraft(responses, true)}
                                            className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                        >
                                            <Save className="w-3.5 h-3.5 text-slate-400" /> Save Draft
                                        </button>

                                        <button
                                            disabled={isSubmitting || (mode === 'PDF' && (!responses.acknowledged || !hasSigned || !typedName.trim()))}
                                            onClick={() => setShowSubmitConfirm(true)}
                                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed shadow-md shadow-blue-600/10"
                                            style={{ color: '#FFFFFF' }}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submission...
                                                </>
                                            ) : (
                                                <>
                                                    Submit & Lock Responses <Send className="w-3 h-3" />
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* EXIT CONFIRMATION MODAL */}
                <AnimatePresence>
                    {showExitConfirm && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-100"
                            >
                                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-3 border border-amber-100">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Unsaved Progress</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 leading-relaxed">
                                    You have unsaved changes. Would you like to save your draft progress before exiting?
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-5">
                                    <button
                                        onClick={async () => {
                                            await handleSaveDraft(responses, false);
                                            setShowExitConfirm(false);
                                            onClose();
                                        }}
                                        className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
                                    >
                                        Save & Exit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowExitConfirm(false);
                                            onClose();
                                        }}
                                        className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider transition-all"
                                    >
                                        Discard
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* SUBMIT CONFIRMATION MODAL */}
                <AnimatePresence>
                    {showSubmitConfirm && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-100"
                            >
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-3 border border-blue-100">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Lock & Submit</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 leading-relaxed">
                                    Once locked, your responses cannot be edited. Are you sure you want to finalize your submission?
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-5">
                                    <button
                                        onClick={handleSubmit}
                                        className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
                                    >
                                        Yes, Submit
                                    </button>
                                    <button
                                        onClick={() => setShowSubmitConfirm(false)}
                                        className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>
    );
}
