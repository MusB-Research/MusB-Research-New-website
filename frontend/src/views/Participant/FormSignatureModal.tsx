import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle2, ShieldCheck,
    PenTool, X, ArrowRight
} from 'lucide-react';

interface FormSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: any, signature: string) => void;
    task: any;
    userProfile: any;
}

const BooleanChoice = ({ value, onChange, label }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-8 p-6 bg-white border border-[#E3ECF5] rounded-[24px] hover:border-[#1E88E5]/40 transition-all shadow-sm">
        <div className="flex gap-2 p-1.5 bg-[#F8FBFF] border border-[#E3ECF5] rounded-[1.2rem] w-fit shadow-inner shrink-0">
            <button
                onClick={() => onChange(true)}
                className={`px-10 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all ${value === true ? 'bg-[#1E7F4F] text-white shadow-lg' : 'text-[#8A99B3] hover:text-[#5F6F89]'}`}
            >
                Yes
            </button>
            <button
                onClick={() => onChange(false)}
                className={`px-10 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all ${value === false ? 'bg-rose-600 text-white shadow-lg' : 'text-[#8A99B3] hover:text-[#5F6F89]'}`}
            >
                No
            </button>
        </div>
        {label && <label className="text-[15px] font-bold text-[#1A2B49] uppercase tracking-tight block flex-1 leading-relaxed">{label}</label>}
    </div>
);

const FormSignatureModal = ({ isOpen, onClose, onComplete, task, userProfile }: FormSignatureModalProps) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Record<string, any>>({});
    
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
                ctx.strokeStyle = '#1E88E5';
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#1A2B49]/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-white border border-[#E3ECF5] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="p-8 border-b border-[#F8FBFF] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#E3F2FD] text-[#1E88E5] rounded-2xl flex items-center justify-center border border-[#BBDEFB]">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight leading-none">{formTitle}</h3>
                            <p className="text-[#8A99B3] font-bold uppercase tracking-widest text-[12px] mt-1">Electronic Signature Workflow</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-[#F8FBFF] hover:bg-[#F0F6FF] rounded-xl text-[#8A99B3] hover:text-[#1A2B49] border border-[#E3ECF5] transition-all"><X className="w-6 h-6" /></button>
                </div>

                {/* STEPS */}
                <div className="px-8 py-4 bg-[#F8FBFF] border-b border-[#E3ECF5] flex items-center gap-8 shrink-0">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#1E88E5]' : 'text-[#8A99B3]'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold border ${step === 1 ? 'bg-[#1E88E5] border-[#1E88E5] text-white' : 'bg-white border-[#E3ECF5]'}`}>01</div>
                        <span className="text-[12px] font-bold uppercase tracking-widest">Form Entry</span>
                    </div>
                    <div className="h-px w-8 bg-[#E3ECF5]" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#1E88E5]' : 'text-[#8A99B3]'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold border ${step === 2 ? 'bg-[#1E88E5] border-[#1E88E5] text-white' : 'bg-white border-[#E3ECF5]'}`}>02</div>
                        <span className="text-[12px] font-bold uppercase tracking-widest">Review & Sign</span>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="space-y-3">
                                    <h4 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Clinical Questionnaire</h4>
                                    <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[12px]">{formDescription}</p>
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
                                                <div className="space-y-4 p-8 bg-white border border-[#E3ECF5] rounded-[24px] shadow-sm">
                                                    <label className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight block">{field.label}</label>
                                                    <textarea 
                                                        className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-6 text-[#1A2B49] font-bold outline-none focus:border-[#1E88E5] transition-all no-scrollbar shadow-inner"
                                                        rows={3}
                                                        value={formData[field.id] || ''}
                                                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                                        placeholder="Enter clinical details here..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {(!formSchema || formSchema.length === 0) && (
                                        <div className="p-16 bg-[#F8FBFF] border border-dashed border-[#E3ECF5] rounded-[32px] text-center">
                                            <p className="text-[#8A99B3] font-bold uppercase tracking-widest text-sm italic">This protocol instrument has no structured input fields. Proceed to clinical synchronization.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-[#F8FBFF] flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-10 py-5 bg-[#1E88E5] text-white rounded-2xl font-bold text-[14px] uppercase tracking-widest hover:bg-[#1565C0] active:scale-95 shadow-lg shadow-blue-500/20 flex items-center gap-3 transition-all"
                                    >
                                        Authenticate & Sign <ArrowRight className="w-5 h-5" />
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
                                    <h4 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Digital Validation</h4>
                                    <p className="text-[#8A99B3] font-bold uppercase tracking-widest text-[12px]">By signing, you confirm that the data entered is accurate and truthful.</p>
                                </div>

                                <div className="flex justify-center gap-3 mb-10 w-full">
                                    <button
                                        onClick={() => { setSignatureType('DRAW'); setTypedSignature(''); setHasSigned(false); }}
                                        className={`flex-1 max-w-[200px] py-4 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all ${signatureType === 'DRAW' ? 'bg-[#E3F2FD] text-[#1E88E5] border border-[#1E88E5] shadow-sm' : 'bg-[#F8FBFF] text-[#8A99B3] border border-[#E3ECF5] hover:text-[#5F6F89]'}`}
                                    >
                                        <PenTool className="w-4 h-4 inline-block mr-2" /> Hand Drawn
                                    </button>
                                    <button
                                        onClick={() => { setSignatureType('TYPE'); setHasSigned(typedSignature.length > 2); }}
                                        className={`flex-1 max-w-[200px] py-4 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all ${signatureType === 'TYPE' ? 'bg-[#E3F2FD] text-[#1E88E5] border border-[#1E88E5] shadow-sm' : 'bg-[#F8FBFF] text-[#8A99B3] border border-[#E3ECF5] hover:text-[#5F6F89]'}`}
                                    >
                                        <PenTool className="w-4 h-4 inline-block mr-2 rotate-45" /> Typed ID
                                    </button>
                                </div>

                                <div className="w-full max-w-xl mb-10">
                                    {signatureType === 'DRAW' ? (
                                        <div className="space-y-4">
                                            <div className="relative aspect-[3/1] bg-[#F8FBFF] border-2 border-dashed border-[#E3ECF5] rounded-[24px] overflow-hidden cursor-crosshair">
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
                                                        <span className="text-[#B0BCCF] font-bold uppercase tracking-[0.5em] text-[12px]">Sign Within This Zone</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-center">
                                                <button onClick={clearCanvas} className="text-[12px] font-bold text-[#8A99B3] hover:text-rose-600 uppercase tracking-widest transition-colors">Clear signature</button>
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
                                                className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-8 text-4xl font-serif text-[#1E88E5] outline-none focus:border-[#1E88E5] text-center italic shadow-inner"
                                            />
                                            <p className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest leading-relaxed">
                                                Your typed name serves as a legally binding digital signature for clinical research documentation.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full max-w-xl p-8 bg-[#F8FBFF] border border-[#E3ECF5] rounded-[24px] flex items-center justify-between mb-12 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${hasSigned ? 'bg-[#E9F7EF] border-[#C8E6C9] text-[#1E7F4F]' : 'bg-white border-[#E3ECF5] text-[#B0BCCF]'}`}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Signee</p>
                                            <p className="text-[14px] font-bold text-[#1A2B49] uppercase">{userProfile.userName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Signed Date</p>
                                        <p className="text-[14px] font-bold text-[#1E88E5]">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="w-full flex justify-between items-center mt-auto">
                                    <button onClick={() => setStep(1)} className="text-[12px] font-bold text-[#8A99B3] hover:text-[#1A2B49] uppercase tracking-widest transition-colors">Back to Form</button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!hasSigned || isSubmitting}
                                        className={`px-12 py-5 rounded-2xl font-bold text-[14px] uppercase tracking-[0.2em] transition-all ${hasSigned && !isSubmitting ? 'bg-[#1E7F4F] text-white hover:bg-[#1E7F4F]/90 active:scale-95 shadow-xl shadow-[#1E7F4F]/20' : 'bg-[#F8FBFF] text-[#B0BCCF] border border-[#E3ECF5] cursor-not-allowed'}`}
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
