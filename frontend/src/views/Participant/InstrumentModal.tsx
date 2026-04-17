import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, FileText, CheckCircle2, Activity, PenTool, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
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
    
    // Signature States
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [typedName, setTypedName] = useState('');

    const qData = task?.q_data;
    const template = qData?.questionnaire_details?.template_details || qData?.template_details;
    
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
    const mode = qData?.mode; // 'PDF' or 'STRUCTURED'
    const structure = template?.json_structure || [];

    // Initialize responses from task if available
    React.useEffect(() => {
        if (qData?.response_data) {
            setResponses(qData.response_data);
        }
    }, [qData]);

    const handleSaveDraft = async (currentResponses: any) => {
        try {
            await authFetch(`${API}/api/questionnaire-schedules/${qData.id}/save_draft/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses: currentResponses })
            });
        } catch (err) {
            console.error("Auto-save failed:", err);
        }
    };

    // Debounced Auto-save
    React.useEffect(() => {
        if (Object.keys(responses).length === 0) return;
        const timer = setTimeout(() => {
            handleSaveDraft(responses);
        }, 2000);
        return () => clearTimeout(timer);
    }, [responses]);

    // Canvas Logic
    const startDrawing = (e: any) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            // Check if canvas has any pixels (simplistic)
            setHasSigned(true);
        }
    };

    const draw = (e: any) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1E88E5';

        if (!isDrawing) ctx.beginPath();
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setHasSigned(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const signature = hasSigned ? canvasRef.current?.toDataURL() : null;
            
            const res = await authFetch(`${API}/api/questionnaire-schedules/${qData.id}/submit_responses/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    responses,
                    signature,
                    typed_name: typedName
                })
            });

            if (res.ok) {
                setStep('SUCCESS');
                // Don't auto-close, let them read the success message and download if allowed
                onSuccess();
            } else {
                const err = await res.json();
                setError(err.detail || 'Submission failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#1A2B49]/40 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-[#E3ECF5] rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-10 pt-10 pb-6 border-b border-[#E3ECF5]">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-[#1A2B49] uppercase italic tracking-tighter">
                                {task.title}
                            </h2>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-b border-[#E3ECF5] py-4 px-2">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-[#5F6F89] uppercase tracking-[0.2em]">Name:</span>
                                <span className="text-[13px] font-black text-[#1A2B49] border-b-2 border-[#1E88E5]/20 pb-0.5 px-4 min-w-[150px]">
                                    {getDisplayName()}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-[#5F6F89] uppercase tracking-[0.2em]">Date:</span>
                                <span className="text-[13px] font-black text-[#1A2B49] border-b-2 border-[#1E88E5]/20 pb-0.5 px-4 min-w-[120px]">
                                    {getFormattedDate()}
                                </span>
                            </div>
                        </div>

                        <button onClick={onClose} className="absolute top-6 right-6 p-3 rounded-2xl bg-[#F8FBFF] text-[#8A99B3] hover:text-[#1A2B49] transition-colors border border-[#E3ECF5] z-10">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                        {step === 'FORM' && (
                            <div className="space-y-8">
                                {mode === 'PDF' ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-[#E3F2FD] border border-[#BBDEFB] rounded-2xl flex items-center gap-4">
                                            <FileText className="w-8 h-8 text-[#1E88E5]" />
                                            <div>
                                                <h4 className="text-[#1A2B49] font-bold uppercase tracking-tight text-sm">Official PDF Documentation</h4>
                                                <p className="text-[#5F6F89] text-[11px] font-bold uppercase tracking-widest">Please review the master document below and acknowledge.</p>
                                            </div>
                                        </div>
                                        
                                        {template.pdf_file ? (
                                            <iframe 
                                                src={template.pdf_file} 
                                                className="w-full h-[500px] rounded-2xl border border-[#E3ECF5]"
                                                title="Instrument PDF"
                                            />
                                        ) : (
                                            <div className="h-[400px] flex items-center justify-center bg-[#F8FBFF] rounded-2xl border border-dashed border-[#E3ECF5]">
                                                <p className="text-[#8A99B3] font-bold uppercase tracking-widest text-xs italic">PDF Preview Not Available</p>
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-[#F8FBFF]">
                                            <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl hover:bg-[#F8FBFF] transition-all">
                                                <div className="relative mt-1">
                                                    <input 
                                                        type="checkbox" 
                                                        className="peer hidden"
                                                        checked={responses.acknowledged || false}
                                                        onChange={(e) => setResponses({acknowledged: e.target.checked})}
                                                    />
                                                    <div className="w-6 h-6 border-2 border-[#E3ECF5] rounded-lg peer-checked:bg-[#1E88E5] peer-checked:border-[#1E88E5] transition-all flex items-center justify-center bg-white shadow-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                <span className="text-[#1A2B49] text-sm font-bold uppercase tracking-tight group-hover:text-[#1A2B49] transition-colors">
                                                    I have reviewed and completed this clinical instrument in its entirety following the protocol guidelines.
                                                </span>
                                            </label>
                                        </div>

                                        {/* Signature Section for PDF */}
                                        <div className="space-y-6 pt-6 border-t border-[#E3ECF5]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[#1E88E5] uppercase tracking-widest block">Legal Full Name</label>
                                                    <input 
                                                        type="text"
                                                        value={typedName}
                                                        onChange={(e) => setTypedName(e.target.value)}
                                                        placeholder="Enter legal name"
                                                        className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl px-4 py-3 text-sm font-bold text-[#1A2B49] focus:border-[#1E88E5] outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-black text-[#1E88E5] uppercase tracking-widest block">Digital Signature</label>
                                                        <button onClick={clearCanvas} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear</button>
                                                    </div>
                                                    <div className="h-[100px] bg-[#F8FBFF] border-2 border-dashed border-[#BBDEFB] rounded-xl relative cursor-crosshair overflow-hidden">
                                                        <canvas
                                                            ref={canvasRef}
                                                            width={400}
                                                            height={100}
                                                            className="w-full h-full"
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
                                                                <span className="text-[#8A99B3] text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Sign Here</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className={`w-5 h-5 ${hasSigned && typedName ? 'text-emerald-500' : 'text-[#8A99B3]'}`} />
                                                    <div>
                                                        <p className="text-[9px] font-black text-[#8A99B3] uppercase tracking-widest">Authentication Status</p>
                                                        <p className="text-[11px] font-black text-[#1A2B49] uppercase italic">{hasSigned && typedName ? 'READY TO SUBMIT' : 'PENDING NAME & SIGNATURE'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-[#8A99B3] uppercase tracking-widest">Global Timestamp</p>
                                                    <p className="text-[11px] font-black text-[#1A2B49]">{new Date().toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-12 pb-10">
                                         {template?.json_structure?.instructions && (
                                             <div className="p-6 bg-slate-900 rounded-2xl shadow-xl border border-white/5">
                                                 <p className="text-white text-[11px] font-black uppercase tracking-[0.05em] leading-relaxed text-center">
                                                     {template.json_structure.instructions.replace(/\n/g, ' ')}
                                                 </p>
                                             </div>
                                         )}

                                         {Array.isArray(template?.json_structure?.questions) && template.json_structure.questions.length > 0 ? (
                                             <div className="space-y-6">
                                                 {template.json_structure.questions.map((q: any, i: number) => (
                                                     <div key={i} className="bg-[#F8FBFF]/50 border border-[#E3ECF5] rounded-[24px] p-6 sm:p-8 transition-all hover:border-[#1E88E5]/30 group">
                                                         <div className="flex gap-6 mb-6">
                                                             <span className="text-[#1E88E5] font-black italic text-xl tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
                                                                 {i + 1 < 10 ? `0${i + 1}` : i + 1}
                                                             </span>
                                                             <h4 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight leading-snug">
                                                                 {q.label || q.question || q.question_text}
                                                             </h4>
                                                         </div>
                                                         
                                                         {q.type === 'choice' || q.type === 'multiple_choice' ? (
                                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-12">
                                                                 {q.options?.map((opt: string) => (
                                                                     <button 
                                                                         key={opt}
                                                                         onClick={() => setResponses({...responses, [q.id || `q-${i}`]: opt})}
                                                                         className={`p-5 rounded-xl border text-left text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${responses[q.id || `q-${i}`] === opt ? 'bg-[#1E88E5] border-[#1E88E5] text-white shadow-xl shadow-blue-500/20' : 'bg-white border-[#E3ECF5] text-[#5F6F89] hover:border-[#1E88E5]/40'}`}
                                                                     >
                                                                         <div className="flex items-center gap-4">
                                                                             <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${responses[q.id || `q-${i}`] === opt ? 'border-white bg-white/20' : 'border-[#E3ECF5] bg-white'}`}>
                                                                                 {responses[q.id || `q-${i}`] === opt && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                             </div>
                                                                             {opt}
                                                                         </div>
                                                                     </button>
                                                                 ))}
                                                             </div>
                                                         ) : q.type === 'yesno' ? (
                                                             <div className="flex gap-4 pl-0 sm:pl-12">
                                                                 {['Yes', 'No'].map((opt) => (
                                                                     <button 
                                                                         key={opt}
                                                                         onClick={() => setResponses({...responses, [q.id || `q-${i}`]: opt})}
                                                                         className={`px-8 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${responses[q.id || `q-${i}`] === opt ? 'bg-[#1E88E5] border-[#1E88E5] text-white' : 'bg-white border-[#E3ECF5] text-[#5F6F89] hover:border-[#1E88E5]/40'}`}
                                                                     >
                                                                         {opt}
                                                                     </button>
                                                                 ))}
                                                             </div>
                                                         ) : (
                                                             <div className="pl-0 sm:pl-12">
                                                                 <textarea 
                                                                     className="w-full bg-white border border-[#E3ECF5] rounded-2xl p-5 text-[#1A2B49] font-bold placeholder:text-[#B0BCCF] min-h-[120px] focus:border-[#1E88E5] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                                     placeholder={q.placeholder || "Type your response here..."}
                                                                     value={responses[q.id || `q-${i}`] || ''}
                                                                     onChange={(e) => setResponses({...responses, [q.id || `q-${i}`]: e.target.value})}
                                                                 />
                                                             </div>
                                                         )}
                                                     </div>
                                                 ))}
                                             </div>
                                         ) : Array.isArray(template?.json_structure?.sections) && template.json_structure.sections.length > 0 ? template.json_structure.sections.map((section: any, si: number) => (
                                            <div key={si} className="space-y-8">
                                                    <div className="bg-[#1A2B49] py-3 px-6 rounded-xl shadow-lg border-l-4 border-[#1E88E5]">
                                                        <h3 className="text-[14px] font-black text-white uppercase tracking-[0.1em]">
                                                            {section.label || section.title || `Section ${si + 1}`}
                                                        </h3>
                                                    </div>

                                                <div className="space-y-6">
                                                    {section.fields?.map((q: any, i: number) => (
                                                        <div key={i} className="bg-[#F8FBFF]/50 border border-[#E3ECF5] rounded-[24px] p-6 sm:p-8 transition-all hover:border-[#1E88E5]/30 group">
                                                            <div className="flex gap-6 mb-6">
                                                                <span className="text-[#1E88E5] font-black italic text-xl tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
                                                                    {i + 1 < 10 ? `0${i + 1}` : i + 1}
                                                                </span>
                                                                <h4 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight leading-snug">
                                                                    {q.label || q.question || q.question_text}
                                                                </h4>
                                                            </div>
                                                            
                                                            {q.type === 'multiple_choice' ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-12">
                                                                    {q.options?.map((opt: string) => (
                                                                    <button 
                                                                        key={opt}
                                                                        onClick={() => setResponses({...responses, [q.id || `${si}-${i}`]: opt})}
                                                                        className={`p-5 rounded-xl border text-left text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${responses[q.id || `${si}-${i}`] === opt ? 'bg-[#1E88E5] border-[#1E88E5] text-white shadow-xl shadow-blue-500/20' : 'bg-white border-[#E3ECF5] text-[#5F6F89] hover:border-[#1E88E5]/40'}`}
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${responses[q.id || `${si}-${i}`] === opt ? 'border-white bg-white/20' : 'border-[#E3ECF5] bg-white'}`}>
                                                                                {responses[q.id || `${si}-${i}`] === opt && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="pl-0 sm:pl-12">
                                                                    <textarea 
                                                                        className="w-full bg-white border border-[#E3ECF5] rounded-2xl p-5 text-[#1A2B49] font-bold placeholder:text-[#B0BCCF] min-h-[120px] focus:border-[#1E88E5] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                                        placeholder="Type your response here..."
                                                                        value={responses[q.id || `${si}-${i}`] || ''}
                                                                        onChange={(e) => setResponses({...responses, [q.id || `${si}-${i}`]: e.target.value})}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-20 bg-[#F8FBFF] rounded-[2.5rem] border border-dashed border-[#E3ECF5]">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E3ECF5]">
                                                    <AlertCircle className="w-8 h-8 text-[#B0BCCF]" />
                                                </div>
                                                <p className="text-[#1A2B49] font-black uppercase tracking-widest text-[10px] italic">
                                                    Structured Protocol Missing<br/>
                                                    <span className="text-[#8A99B3] font-bold opacity-60">Please contact your trial coordinator</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'SUCCESS' && (
                            <div className="h-[450px] flex flex-col items-center justify-center text-center space-y-8 px-12">
                                <motion.div 
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="w-24 h-24 bg-[#E9F7EF] border border-[#C8E6C9] rounded-[2.5rem] flex items-center justify-center shadow-xl mb-4"
                                >
                                    <CheckCircle2 className="w-12 h-12 text-[#1E7F4F]" />
                                </motion.div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-[#1A2B49] uppercase tracking-tighter italic">Task Completed</h3>
                                    <p className="text-[#5F6F89] font-black uppercase tracking-[0.1em] text-xs leading-relaxed max-w-sm mx-auto">
                                        You completed the task. Thanks for submitting all the questions. your clinical data has been securely synchronized with the trial repository.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 w-full max-w-xs pt-8">
                                    {qData?.questionnaire_details?.allow_participant_download && (
                                        <button
                                            onClick={() => window.open(`${API}/api/questionnaire-templates/${template?.id}/view/`, '_blank')}
                                            className="w-full px-8 py-5 rounded-[22px] bg-[#1A2B49] text-white font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Download Questionnaire PDF
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="w-full px-8 py-5 rounded-[22px] bg-white border-2 border-[#E3ECF5] text-[#1A2B49] font-black uppercase tracking-widest text-[11px] hover:bg-[#F8FBFF] transition-all"
                                    >
                                        Return to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {step === 'FORM' && (
                        <div className="p-8 border-t border-[#F8FBFF] bg-[#F8FBFF]/50 flex items-center justify-between">
                            {error && (
                                <div className="flex items-center gap-2 text-rose-600 font-bold uppercase tracking-tight text-sm italic">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <div className="ml-auto flex gap-4">
                                <button
                                    onClick={() => handleSaveDraft(responses)}
                                    className="px-8 py-4 rounded-2xl bg-white border border-[#E3ECF5] text-[#8A99B3] font-bold uppercase tracking-widest text-[11px] hover:text-[#5F6F89] hover:bg-[#F8FBFF] transition-all shadow-sm"
                                >
                                    Force Save
                                </button>
                                <button
                                    disabled={isSubmitting || (mode === 'PDF' && (!responses.acknowledged || !hasSigned || !typedName.trim()))}
                                    onClick={handleSubmit}
                                    className="px-10 py-4 rounded-2xl bg-[#1E88E5] text-white font-black uppercase tracking-widest text-[12px] shadow-lg shadow-[#1E88E5]/20 hover:bg-[#1565C0] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Syncing Repository</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Protocol Submission</span>
                                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
