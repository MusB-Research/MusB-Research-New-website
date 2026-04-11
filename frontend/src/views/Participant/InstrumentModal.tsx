import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, FileText, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
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
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                />
                
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Instrument</span>
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                {task.title}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {step === 'FORM' && (
                            <div className="space-y-8">
                                {mode === 'PDF' ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4">
                                            <FileText className="w-8 h-8 text-indigo-400" />
                                            <div>
                                                <h4 className="text-white font-black uppercase italic tracking-tighter text-sm">Official PDF Documentation</h4>
                                                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Please review the master document below and acknowledge.</p>
                                            </div>
                                        </div>
                                        
                                        {template.pdf_file ? (
                                            <iframe 
                                                src={template.pdf_file} 
                                                className="w-full h-[500px] rounded-2xl border border-white/10"
                                                title="Instrument PDF"
                                            />
                                        ) : (
                                            <div className="h-[400px] flex items-center justify-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                                <p className="text-slate-500 font-black uppercase italic tracking-widest">PDF Preview Not Available</p>
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-white/5">
                                            <label className="flex items-start gap-4 cursor-pointer group">
                                                <div className="relative mt-1">
                                                    <input 
                                                        type="checkbox" 
                                                        className="peer hidden"
                                                        checked={responses.acknowledged || false}
                                                        onChange={(e) => setResponses({acknowledged: e.target.checked})}
                                                    />
                                                    <div className="w-6 h-6 border-2 border-white/10 rounded-lg peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                                        <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                <span className="text-slate-400 text-sm font-black uppercase italic tracking-tight group-hover:text-white transition-colors">
                                                    I have reviewed and completed this clinical instrument in its entirety following the protocol guidelines.
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {Array.isArray(structure) && structure.length > 0 ? structure.map((q: any, i: number) => (
                                            <div key={i} className="space-y-4">
                                                <div className="flex gap-4">
                                                    <span className="text-indigo-500 font-black italic text-xl">Q{i+1}.</span>
                                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-tight">
                                                        {q.question_text}
                                                    </h3>
                                                </div>
                                                
                                                {q.type === 'multiple_choice' ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                                                        {q.options?.map((opt: string) => (
                                                            <button 
                                                                key={opt}
                                                                onClick={() => setResponses({...responses, [q.id || i]: opt})}
                                                                className={`p-4 rounded-xl border text-left text-sm font-black uppercase tracking-widest transition-all ${responses[q.id || i] === opt ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-white'}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="pl-12">
                                                        <textarea 
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold placeholder:text-slate-700 min-h-[100px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                            placeholder="Enter your response here..."
                                                            value={responses[q.id || i] || ''}
                                                            onChange={(e) => setResponses({...responses, [q.id || i]: e.target.value})}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                                <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                                <p className="text-slate-500 font-black uppercase italic tracking-widest">No structured questions found in this template.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'SUCCESS' && (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 bg-green-500/20 border border-green-500/20 rounded-[2rem] flex items-center justify-center shadow-2xl">
                                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Submission Successful</h3>
                                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Your clinical data has been securely synchronized with the trial repository.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {step === 'FORM' && (
                        <div className="p-8 border-t border-white/5 bg-slate-950/40 flex items-center justify-between">
                            {error && (
                                <div className="flex items-center gap-2 text-rose-500 font-black uppercase tracking-tighter text-sm italic">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <div className="ml-auto flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-black uppercase tracking-widest text-[13px] hover:bg-white/5 transition-all"
                                >
                                    Save Draft
                                </button>
                                <button
                                    disabled={isSubmitting || (mode === 'PDF' && !responses.acknowledged)}
                                    onClick={handleSubmit}
                                    className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[13px] shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
