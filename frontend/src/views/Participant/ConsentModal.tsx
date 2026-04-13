import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle2, Clock, ShieldCheck,
    Download, Printer, AlertTriangle, Info,
    User, Calendar, PenTool, X
} from 'lucide-react';
import { Card, Badge, ProgressBar } from './SharedComponents';
import { authFetch, API } from '../../utils/auth';
import { jsPDF } from 'jspdf';

interface ConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (signedPdf: File) => void;
    study: any;
    template: any;
    userProfile: any;
}

const ConsentModal = ({ isOpen, onClose, onComplete, study, template, userProfile }: ConsentModalProps) => {
    const [step, setStep] = useState(1);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [signatureType, setSignatureType] = useState<'DRAW' | 'TYPE'>('DRAW');
    const [typedSignature, setTypedSignature] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Canvas Logic for Drawing Signature
    useEffect(() => {
        if (step === 2 && signatureType === 'DRAW' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
            }
        }
    }, [step, signatureType]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsSigning(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsSigning(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setHasSigned(true);
        }
    };

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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setScrolledToBottom(true);
        }
    };

    const generateAndSubmitPDF = async () => {
        setIsSubmitting(true);
        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString();

            // Header
            doc.setFillColor(13, 21, 37);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(251, 191, 36);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('CONSENT FORM (OFFICIAL)', 105, 25, { align: 'center' });

            // Study Details
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text(`Study: ${study?.title || 'MusB Clinical Trial'}`, 20, 55);
            doc.text(`Organization: MusB Research Pvt. Ltd.`, 20, 65);
            doc.text(`Protocol ID: ${study?.protocol_id || 'MUSB-PROTOCOL-SYNC'}`, 20, 75);

            // Consent Content
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const consentText = template?.terms_content || "By signing this document, the participant confirms they have been fully informed about the study's purpose, methods, risks, and benefits. The participant understands that their involvement is completely voluntary and they may withdraw at any time without penalty. All personal data will be de-identified and stored securely for clinical analysis.";
            const splitText = doc.splitTextToSize(consentText, 170);
            doc.text(splitText, 20, 95);

            doc.setDrawColor(230, 230, 230);
            doc.line(20, 130, 190, 130);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(251, 191, 36);
            doc.text('01. PARTICIPANT SIGNATURE', 20, 145);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Participant: ${userProfile.userName}`, 20, 155);
            doc.text(`Signed At: ${date} ${time}`, 20, 165);

            if (signatureType === 'DRAW' && canvasRef.current) {
                const imgData = canvasRef.current.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 20, 175, 40, 15);
            } else {
                doc.setFont('courier', 'italic');
                doc.text(typedSignature || userProfile.userName, 20, 185);
            }

            doc.line(20, 205, 190, 205);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(251, 191, 36);
            doc.text('02. CLINICAL COORDINATOR VERIFICATION', 20, 220);

            doc.setTextColor(150, 150, 150);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text('Pending Review', 20, 230);

            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.text(`Audit ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()} | Secure Clinical Protocol`, 105, 290, { align: 'center' });

            const blob = doc.output('blob');
            const file = new File([blob], `Consent_${userProfile.userName}.pdf`, { type: 'application/pdf' });
            onComplete(file);
        } catch (err) {
            console.error("PDF Generation failed:", err);
            alert("Error during submission. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0a0e1a]/95 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-[#0d1424] border border-white/10 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="p-8 border-b border-white/5 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Informed Consent Form</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] mt-1 italic">SECURE eCONSENT SYSTEM</p>
                        </div>
                    </div>
                </div>

                {/* STEPS */}
                <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-8 shrink-0">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-amber-500' : 'text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-black italic border ${step === 1 ? 'bg-amber-500/20 border-amber-500/40' : 'border-white/10'}`}>01</div>
                        <span className="text-[12px] font-black uppercase tracking-widest italic">Review Terms</span>
                    </div>
                    <div className="h-px w-8 bg-white/5" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-amber-500' : 'text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-black italic border ${step === 2 ? 'bg-amber-500/20 border-amber-500/40' : 'border-white/10'}`}>02</div>
                        <span className="text-[12px] font-black uppercase tracking-widest italic">Digital Signature</span>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 overflow-hidden flex flex-col p-8"
                            >
                                <div className="flex-1 bg-black/40 rounded-3xl p-8 overflow-y-auto border border-white/5 no-scrollbar" onScroll={handleScroll}>
                                    <div className="prose prose-invert max-w-none space-y-8">
                                        <div className="text-center border-b border-white/10 pb-6 mb-8">
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">{study?.title || 'HEALTH AND LIFESTYLE SURVEY'}</h4>
                                            <p className="text-amber-500 font-bold uppercase tracking-widest text-[12px] mt-1">MusB Research Pvt. Ltd.</p>
                                        </div>

                                        {template?.terms_content ? (
                                            <section className="space-y-4">
                                                <h5 className="text-[14px] font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Full Informational Protocol
                                                </h5>
                                                <div className="text-slate-400 font-bold uppercase tracking-widest text-[12px] leading-relaxed pl-4 border-l border-white/5 whitespace-pre-wrap">
                                                    {template.terms_content}
                                                </div>
                                            </section>
                                        ) : (
                                            <>
                                                <section className="space-y-4">
                                                    <h5 className="text-[14px] font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Study Purpose
                                                    </h5>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[12px] leading-relaxed pl-4 border-l border-white/5">
                                                        This protocol study is being conducted to understand health and lifestyle patterns.
                                                        Your participation will help form the baseline for future clinical assessments.
                                                    </p>
                                                </section>

                                                <section className="space-y-4">
                                                    <h5 className="text-[14px] font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Participation & Withdrawal
                                                    </h5>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[12px] leading-relaxed pl-4 border-l border-white/5">
                                                        Your participation is strictly voluntary. You may withdraw at any time for any reason without any negative consequences.
                                                    </p>
                                                </section>

                                                <section className="space-y-4">
                                                    <h5 className="text-[14px] font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Data Protection
                                                    </h5>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[12px] leading-relaxed pl-4 border-l border-white/5">
                                                        All shared data will be de-identified and stored on a secure, HIPAA-compliant server. Personal identifiable information (PII) will not be released to any third parties without your explicit consent.
                                                    </p>
                                                </section>
                                            </>
                                        )}

                                        <div className="p-10 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-6 mt-12">
                                            <div className="flex items-center gap-4 text-green-400">
                                                <CheckCircle2 className="w-6 h-6" />
                                                <h6 className="text-[16px] font-black uppercase italic tracking-tight">Consent Acknowledgement</h6>
                                            </div>
                                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[13px] leading-relaxed italic">
                                                "I confirm that I have read the information above and voluntarily agree to participate in this study."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <button onClick={onClose} className="text-[12px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors italic">Previous Page</button>
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!scrolledToBottom}
                                        className={`px-10 py-4 rounded-xl font-black text-[14px] uppercase tracking-widest transition-all ${scrolledToBottom ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'}`}
                                    >
                                        SIGN AND FINALIZE FORM
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 p-8 flex flex-col items-center"
                            >
                                <div className="text-center space-y-2 mb-10">
                                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Digital Signature</h4>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] italic">Sign below to authenticate your identity.</p>
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

                                <div className="w-full max-w-xl flex flex-col items-center justify-center mb-10">
                                    {signatureType === 'DRAW' ? (
                                        <div className="w-full space-y-4">
                                            <div className="relative aspect-[3/1] bg-white border border-indigo-500/30 rounded-[2rem] overflow-hidden cursor-crosshair shadow-2xl">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={600}
                                                    height={200}
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
                                                        <span className="text-slate-300 font-black uppercase tracking-[0.5em] text-[12px] italic">Sign Here</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-center">
                                                <button onClick={clearCanvas} className="text-[12px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors">Clear signature</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-6 text-center">
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
                                            <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic">
                                                Your typed name serves as a legal digital signature.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full max-w-xl p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between mt-auto">
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

                                <div className="w-full flex justify-between items-center mt-10">
                                    <button onClick={() => setStep(1)} className="text-[12px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors italic">Review Terms</button>
                                    <button
                                        onClick={generateAndSubmitPDF}
                                        disabled={!hasSigned || isSubmitting}
                                        className={`px-12 py-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all ${hasSigned && !isSubmitting ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-xl shadow-amber-500/20' : 'bg-white/5 text-slate-800 border border-white/5 cursor-not-allowed'}`}
                                    >
                                        {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
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

export default ConsentModal;


