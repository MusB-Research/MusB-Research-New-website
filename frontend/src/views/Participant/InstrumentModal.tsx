import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, FileText, CheckCircle2, Activity } from 'lucide-react';
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
    const [step, setStep] = useState<'INITIAL' | 'FORM' | 'SUCCESS'>('FORM');
    const [error, setError] = useState<string | null>(null);

    const qData = task?.q_data;
    const template = qData?.template_details;
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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await authFetch(`${API}/api/questionnaire-schedules/${qData.id}/submit_responses/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses })
            });

            if (res.ok) {
                setStep('SUCCESS');
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
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
                    <div className="p-8 border-b border-[#F8FBFF] flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Activity className="w-5 h-5 text-[#1E88E5]" />
                                <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">Clinical Instrument</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">
                                {task.title}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-2xl bg-[#F8FBFF] text-[#8A99B3] hover:text-[#1A2B49] transition-colors border border-[#E3ECF5]">
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
                                    </div>
                                ) : (
                                    <div className="space-y-12 pb-10">
                                        {Array.isArray(template?.json_structure?.sections) && template.json_structure.sections.length > 0 ? template.json_structure.sections.map((section: any, si: number) => (
                                            <div key={si} className="space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E3ECF5]" />
                                                    <h3 className="text-[12px] font-black text-[#1E88E5] uppercase tracking-[0.3em] font-mono italic">
                                                        {section.label || section.title || `Section ${si + 1}`}
                                                    </h3>
                                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E3ECF5]" />
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
                                                                            className={`p-5 rounded-2xl border text-left text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${responses[q.id || `${si}-${i}`] === opt ? 'bg-[#1E88E5] border-[#1E88E5] text-white shadow-xl shadow-blue-500/20 scale-[1.02]' : 'bg-white border-[#E3ECF5] text-[#5F6F89] hover:border-[#1E88E5]/40 hover:bg-white/80'}`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-3 h-3 rounded-full border-2 transition-all ${responses[q.id || `${si}-${i}`] === opt ? 'border-white bg-white' : 'border-[#E3ECF5]'}`} />
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
                            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 bg-[#E9F7EF] border border-[#C8E6C9] rounded-[2rem] flex items-center justify-center shadow-xl">
                                    <CheckCircle2 className="w-10 h-10 text-[#1E7F4F]" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-[#1A2B49] uppercase tracking-tight mb-2">Submission Successful</h3>
                                    <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-sm">Your clinical data has been securely synchronized with the trial repository.</p>
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
                                    disabled={isSubmitting || (mode === 'PDF' && !responses.acknowledged)}
                                    onClick={handleSubmit}
                                    className="px-10 py-4 rounded-2xl bg-[#1E88E5] text-white font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-[#1E88E5]/20 hover:bg-[#1565C0] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Syncing...' : 'Submit Entry'}
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
