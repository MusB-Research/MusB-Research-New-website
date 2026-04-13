import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle2, Clock, ShieldCheck,
    AlertTriangle, Info, User, Calendar, PenTool, X,
    ChevronRight, Save, ArrowRight
} from 'lucide-react';
import { Card, Badge, ProgressBar } from './SharedComponents';
import { authFetch, API } from '../../utils/auth';
import { jsPDF } from 'jspdf';

interface FormSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: any, signature: string) => void;
    task: any;
    userProfile: any;
}

const BooleanChoice = ({ value, onChange, label }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
        <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] w-fit shadow-inner shrink-0">
            <button
                onClick={() => onChange(true)}
                className={`px-10 py-3 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all ${value === true ? 'bg-[#00e676] text-slate-900 shadow-xl shadow-[#00e676]/20 scale-105' : 'text-slate-500 hover:text-white'}`}
            >
                Yes
            </button>
            <button
                onClick={() => onChange(false)}
                className={`px-10 py-3 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all ${value === false ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 scale-105' : 'text-slate-500 hover:text-white'}`}
            >
                No
            </button>
        </div>
        {label && <label className="text-[16px] font-black text-slate-400 uppercase tracking-widest block flex-1 leading-relaxed italic">{label}</label>}
    </div>
);

const FormSignatureModal = ({ isOpen, onClose, onComplete, task, userProfile }: FormSignatureModalProps) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    
    // Signature State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [signatureType, setSignatureType] = useState<'DRAW' | 'TYPE'>('DRAW');
    const [typedSignature, setTypedSignature] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formSchema = task?.task_details?.form_details?.schema || [];
    const formTitle = task?.task_details?.form_details?.title || task?.title || 'Study Form';
    const formDescription = task?.task_details?.form_details?.description || 'Please complete the following details and sign.';

    useEffect(() => {
        if (step === 2 && signatureType === 'DRAW' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
            }
        }
    }, [step, signatureType]);

    const draw = (e: any) => {
        if (!isSigning || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
        if (e.type === 'mousedown' || e.type === 'touchstart') {
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
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
        let finalSignature = '';
        if (signatureType === 'DRAW' && canvasRef.current) {
            finalSignature = canvasRef.current.toDataURL('image/png');
        } else {
            finalSignature = typedSignature || userProfile.userName;
        }
        
        setIsSubmitting(true);
        onComplete(formData, finalSignature);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0a0e1a]/95 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-[#0d1424] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center shrink-0 bg-gradient-to-r from-amber-950/20 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{formTitle}</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] mt-1 italic">Electronic Signature Workflow</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                </div>

                {/* STEPS */}
                <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-8 shrink-0">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-amber-500' : 'text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-black italic border ${step === 1 ? 'bg-amber-500/20 border-amber-400' : 'border-white/10'}`}>01</div>
                        <span className="text-[12px] font-black uppercase tracking-widest italic">Form Entry</span>
                    </div>
                    <div className="h-px w-8 bg-white/5" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-amber-500' : 'text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-black italic border ${step === 2 ? 'bg-amber-500/20 border-amber-400' : 'border-white/10'}`}>02</div>
                        <span className="text-[12px] font-black uppercase tracking-widest italic">Review & Sign</span>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-4">
                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Clinical Questionnaire</h4>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] italic">{formDescription}</p>
                                </div>

                                <div className="space-y-6">
                                    {Array.isArray(formSchema) && formSchema.map((field: any, idx: number) => (
                                        <div key={idx}>
                                            {field.type === 'BOOLEAN' ? (
                                                <BooleanChoice 
                                                    label={field.label} 
                                                    value={formData[field.id]} 
                                                    onChange={(val: boolean) => setFormData({ ...formData, [field.id]: val })} 
                                                />
                                            ) : (
                                                <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest block">{field.label}</label>
                                                    <textarea 
                                                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-bold outline-none focus:border-amber-500/30 transition-all no-scrollbar"
                                                        rows={3}
                                                        value={formData[field.id] || ''}
                                                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                                        placeholder="Enter details here..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {(!formSchema || formSchema.length === 0) && (
                                        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2rem] text-center">
                                            <p className="text-slate-500 font-black italic uppercase text-base">This form has no required fields. Proceed to signature.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-white/5 flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-10 py-4 bg-amber-500 text-slate-950 rounded-xl font-black text-[14px] uppercase tracking-widest hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-3 transition-all italic"
                                    >
                                        Next: Review & Sign <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center"
                            >
                                <div className="text-center space-y-2 mb-10 w-full">
                                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Digital Signature</h4>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] italic">By signing, you confirm that the data entered is accurate and truthful.</p>
                                </div>

                                <div className="flex justify-center gap-3 mb-10">
                                    <button
                                        onClick={() => { setSignatureType('DRAW'); setTypedSignature(''); setHasSigned(false); }}
                                        className={`px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${signatureType === 'DRAW' ? 'bg-amber-500 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                    >
                                        <PenTool className="w-4 h-4 inline-block mr-2" /> Hand Drawn
                                    </button>
                                    <button
                                        onClick={() => { setSignatureType('TYPE'); setHasSigned(typedSignature.length > 2); }}
                                        className={`px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${signatureType === 'TYPE' ? 'bg-amber-500 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                    >
                                        <X className="w-4 h-4 inline-block mr-2 rotate-45" /> Typed ID
                                    </button>
                                </div>

                                <div className="w-full max-w-xl mb-10">
                                    {signatureType === 'DRAW' ? (
                                        <div className="space-y-4">
                                            <div className="relative aspect-[3/1] bg-white border border-amber-500/30 rounded-[2rem] overflow-hidden cursor-crosshair shadow-2xl">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={600}
                                                    height={200}
                                                    className="w-full h-full"
                                                    onMouseDown={(e) => { setIsSigning(true); draw(e); }}
                                                    onMouseMove={draw}
                                                    onMouseUp={() => { setIsSigning(false); setHasSigned(true); }}
                                                    onMouseLeave={() => setIsSigning(false)}
                                                    onTouchStart={(e) => { setIsSigning(true); draw(e); }}
                                                    onTouchMove={draw}
                                                    onTouchEnd={() => { setIsSigning(false); setHasSigned(true); }}
                                                />
                                                {!hasSigned && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-slate-300 font-black uppercase tracking-[0.5em] text-[12px] italic">Sign Here</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-center">
                                                <button onClick={clearCanvas} className="text-[12px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors">Clear signature</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 text-center">
                                            <input
                                                type="text"
                                                value={typedSignature}
                                                onChange={(e) => {
                                                    setTypedSignature(e.target.value);
                                                    setHasSigned(e.target.value.length > 2);
                                                }}
                                                placeholder={userProfile.userName}
                                                className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-10 text-4xl font-serif text-amber-500 outline-none focus:border-amber-500/50 text-center italic"
                                            />
                                            <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic leading-relaxed">
                                                Your typed name serves as a legally binding digital signature for clinical research documentation.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full max-w-xl p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${hasSigned ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Signee</p>
                                            <p className="text-[14px] font-black text-white uppercase italic">{userProfile.userName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Date</p>
                                        <p className="text-[14px] font-black text-amber-500 italic">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="w-full flex justify-between items-center mt-auto">
                                    <button onClick={() => setStep(1)} className="text-[12px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors italic">Back to Form</button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!hasSigned || isSubmitting}
                                        className={`px-12 py-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all italic ${hasSigned && !isSubmitting ? 'bg-[#00e676] text-slate-950 hover:bg-[#00c853] active:scale-95 shadow-xl shadow-[#00e676]/20' : 'bg-white/5 text-slate-800 border border-white/5 cursor-not-allowed'}`}
                                    >
                                        {isSubmitting ? 'SECURELY SAVING...' : 'FINALIZE & SUBMIT'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default FormSignatureModal;


