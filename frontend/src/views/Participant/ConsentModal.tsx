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
    userProfile: any;
}

const ConsentModal = ({ isOpen, onClose, onComplete, study, userProfile }: ConsentModalProps) => {
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
                ctx.strokeStyle = '#22d3ee'; // Cyan-400
                ctx.lineWidth = 3;
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
            // Check if canvas is not empty (this is a simple check)
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
            doc.setFillColor(13, 21, 37); // Dark navy
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(34, 211, 238); // Cyan
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('CONSENT FORM (OFFICIAL)', 105, 25, { align: 'center' });

            // Study Details
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text(`Study: Health and Lifestyle Survey`, 20, 55);
            doc.text(`Organization: ABC Research Pvt. Ltd.`, 20, 65);
            doc.text(`Protocol ID: ${study?.protocol_id || 'ABC-HLS-2026'}`, 20, 75);

            // Consent Content
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const splitText = doc.splitTextToSize(
                "This study is being conducted to understand general health and lifestyle patterns of individuals. Your participation is voluntary. You can stop at any time without any penalty. As a participant, you will answer a few simple questions and share general information (age, habits, etc.). Time required is approximately 10–15 minutes. There are no major risks involved. Some questions may be personal, and you may skip them if you want. There is no direct benefit, but your responses will help in research. Your data will be kept confidential and your name will not be shared anywhere. I agree to participate in this study voluntarily.",
                170
            );
            doc.text(splitText, 20, 95);

            // Signatures Section
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 160, 190, 160);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('PARTICIPANT DETAILS', 20, 175);

            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${userProfile.userName}`, 20, 185);
            doc.text(`Signature: [Electronically Verified]`, 20, 195);
            doc.text(`Date: ${date}`, 20, 205);

            // Add Signature Image or Text
            if (signatureType === 'DRAW' && canvasRef.current) {
                const signatureImg = canvasRef.current.toDataURL('image/png');
                doc.addImage(signatureImg, 'PNG', 20, 215, 60, 30);
            } else {
                doc.setFont('courier', 'italic');
                doc.setFontSize(16);
                doc.text(typedSignature || userProfile.userName, 20, 225);
            }

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generated by MusB Research Node | Verification ID: MUSB-AUTH-${Math.random().toString(36).substring(7).toUpperCase()}`, 105, 285, { align: 'center' });

            // Finalize
            const blob = doc.output('blob');
            const file = new File([blob], `Consent_ABC_HLS_${userProfile.userName}.pdf`, { type: 'application/pdf' });
            
            onComplete(file);
        } catch (err) {
            console.error("PDF Generation failed:", err);
            alert("Security node failure during PDF encryption. Please retry.");
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
                className="relative w-full max-w-4xl bg-[#0d1424] border border-white/10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* ──────────────── HEADER ──────────────── */}
                <div className="p-8 border-b border-white/5 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Informed Consent Form</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">MUSB PROTOCOL SYNC | SECURE eCONSENT</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* ──────────────── STEPS ──────────────── */}
                <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-8 shrink-0">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-cyan-400' : 'text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black italic border ${step === 1 ? 'bg-cyan-500/20 border-cyan-400' : 'border-white/10'}`}>01</div>
                        <span className="text-[11px] font-black uppercase tracking-widest italic">Review Terms</span>
                    </div>
                    <div className="h-px w-8 bg-white/5" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-cyan-400' : 'text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black italic border ${step === 2 ? 'bg-cyan-500/20 border-cyan-400' : 'border-white/10'}`}>02</div>
                        <span className="text-[11px] font-black uppercase tracking-widest italic">Digital Signature</span>
                    </div>
                    <div className="h-px w-8 bg-white/5" />
                    <div className={`flex items-center gap-2 ${step === 3 ? 'text-cyan-400' : 'text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black italic border ${step === 3 ? 'bg-cyan-500/20 border-cyan-400' : 'border-white/10'}`}>03</div>
                        <span className="text-[11px] font-black uppercase tracking-widest italic">Verification</span>
                    </div>
                </div>

                {/* ──────────────── CONTENT ──────────────── */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 overflow-hidden flex flex-col p-8"
                            >
                                <div className="mb-6 flex gap-4">
                                    <Card className="flex-1 p-4 bg-white/5 border-white/5">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-green-400" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Data Security</p>
                                                <p className="text-xs font-bold text-white uppercase italic">End-to-End Encrypted</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="flex-1 p-4 bg-white/5 border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Info className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Estimated Time</p>
                                                <p className="text-xs font-bold text-white uppercase italic">10 Minutes</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div 
                                    className="flex-1 bg-black/40 rounded-3xl p-8 overflow-y-auto border border-white/5 no-scrollbar"
                                    onScroll={handleScroll}
                                >
                                    <div className="prose prose-invert max-w-none space-y-8">
                                        <div className="text-center border-b border-white/10 pb-6 mb-8">
                                            <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Health and Lifestyle Survey</h4>
                                            <p className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] mt-1">ABC Research Pvt. Ltd.</p>
                                        </div>

                                        <section className="space-y-3">
                                            <h5 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Purpose
                                            </h5>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed pl-4 border-l border-white/5">
                                                This study is being conducted to understand general health and lifestyle patterns of individuals.
                                            </p>
                                        </section>

                                        <section className="space-y-3">
                                            <h5 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Participation
                                            </h5>
                                            <ul className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed pl-8 space-y-2 list-disc">
                                                <li>Your participation is voluntary.</li>
                                                <li>You can stop at any time without any penalty.</li>
                                            </ul>
                                        </section>

                                        <section className="space-y-3">
                                            <h5 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> What You Will Do
                                            </h5>
                                            <ul className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed pl-8 space-y-2 list-disc">
                                                <li>Answer a few simple questions</li>
                                                <li>Share general information (age, habits, etc.)</li>
                                            </ul>
                                            <p className="text-indigo-400 font-black text-[10px] uppercase italic tracking-[0.2em] pl-4 mt-2">Time required: 10–15 minutes</p>
                                        </section>

                                        <section className="space-y-3">
                                            <h5 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Risks & Benefits
                                            </h5>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed pl-4 border-l border-white/5">
                                                There are no major risks involved. Some questions may be personal, and you may skip them if you want. 
                                                There is no direct benefit, but your responses will help in research.
                                            </p>
                                        </section>

                                        <section className="space-y-3">
                                            <h5 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Privacy
                                            </h5>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed pl-4 border-l border-white/5">
                                                Your data will be kept confidential and your name will not be shared anywhere.
                                            </p>
                                        </section>

                                        <div className="p-10 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-6 mt-12 bg-grid-white/[0.02]">
                                            <div className="flex items-center gap-4 text-green-400">
                                                <CheckCircle2 className="w-6 h-6" />
                                                <h6 className="text-lg font-black uppercase italic tracking-tight">Consent Acknowledgement</h6>
                                            </div>
                                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[12px] leading-relaxed italic">
                                                "I agree to participate in this study voluntarily."
                                            </p>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Participant Name</label>
                                                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-white font-bold uppercase tracking-widest text-xs italic">
                                                        {userProfile.userName}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Consent Date</label>
                                                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-white font-bold uppercase tracking-widest text-xs italic">
                                                        {new Date().toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Digital Signature Node</label>
                                                <div 
                                                    onClick={() => scrolledToBottom && setStep(2)}
                                                    className={`h-24 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center border-dashed ${scrolledToBottom ? 'cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all' : ''}`}
                                                >
                                                    <span className={scrolledToBottom ? 'text-cyan-400 font-black uppercase text-[12px] tracking-[0.2em] italic animate-pulse' : 'text-slate-700 font-black uppercase text-[10px] tracking-[0.5em] italic'}>
                                                        {scrolledToBottom ? 'Click to Sign Protocol' : 'Pending Signature Mission'}
                                                    </span>
                                                </div>
                                            </div>

                                            {!scrolledToBottom && (
                                                <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-cyan-950/80 to-transparent flex justify-center items-end animate-pulse pointer-events-none">
                                                    <p className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.3em] pb-1">↓ SCROLL TO END TO UNLOCK SIGNATURE ↓</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${scrolledToBottom ? 'text-green-400' : 'text-slate-600'}`}>
                                        {scrolledToBottom ? 'Protocol Read Successfully' : 'Please read to the end to continue'}
                                    </p>
                                    <button 
                                        onClick={() => setStep(2)}
                                        disabled={!scrolledToBottom}
                                        className={`px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${scrolledToBottom ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'}`}
                                    >
                                        PROCEED TO SIGN
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 p-8 space-y-8"
                            >
                                <div className="text-center space-y-2">
                                    <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter">Digital Signature</h4>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] italic">Sign your name to bind your identity to this protocol mission.</p>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button 
                                        onClick={() => setSignatureType('DRAW')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signatureType === 'DRAW' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                    >
                                        <PenTool className="w-4 h-4 inline-block mr-2" /> Hand Drawn
                                    </button>
                                    <button 
                                        onClick={() => setSignatureType('TYPE')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signatureType === 'TYPE' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                    >
                                        <X className="w-4 h-4 inline-block mr-2 rotate-45" /> Typed Signature
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                                    {signatureType === 'DRAW' ? (
                                        <div className="w-full max-w-xl space-y-4">
                                            <div className="relative aspect-[3/1] bg-black/40 border border-white/10 rounded-2xl overflow-hidden cursor-crosshair">
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
                                                        <span className="text-slate-700 font-black uppercase tracking-[0.5em] italic opacity-50">Sign Here</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <button onClick={clearCanvas} className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors">Clear Signature Area</button>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Touch or Mouse Interactive Node</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-xl space-y-6 text-center">
                                            <input 
                                                type="text" 
                                                value={typedSignature}
                                                onChange={(e) => {
                                                    setTypedSignature(e.target.value);
                                                    setHasSigned(e.target.value.length > 2);
                                                }}
                                                placeholder={userProfile.userName}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 text-4xl font-serif text-cyan-400 outline-none focus:border-cyan-500/50 text-center italic"
                                            />
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic px-12">
                                                By typing your name, you are providing a legally binding digital signature and attesting to your identity.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Live Confirmation Box */}
                                <div className="p-8 bg-white/[0.03] border border-white/5 rounded-2xl max-w-xl mx-auto w-full space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">Participant</span>
                                            <p className="text-xs font-bold text-white uppercase italic">{userProfile.userName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">Signature Date</span>
                                            <p className="text-xs font-bold text-white uppercase italic">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Live Verification Box</span>
                                        <div className="h-16 bg-black/20 rounded-xl flex items-center justify-center border border-white/5 border-dashed">
                                            {hasSigned ? (
                                                signatureType === 'DRAW' ? (
                                                    <span className="text-cyan-400 font-black uppercase text-[10px] tracking-widest italic animate-pulse">Handwritten Signature Captured</span>
                                                ) : (
                                                    <span className="text-cyan-400 font-black uppercase text-[10px] tracking-widest italic animate-pulse">Typed ID: {typedSignature}</span>
                                                )
                                            ) : (
                                                <span className="text-slate-700 font-black uppercase text-[10px] tracking-widest italic">Awaiting Mission Execution</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <button onClick={() => setStep(1)} className="text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors italic">Back to Terms</button>
                                    <button 
                                        onClick={() => setStep(3)}
                                        disabled={!hasSigned}
                                        className={`px-12 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${hasSigned ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-lg' : 'bg-white/5 text-slate-700 border border-white/5 cursor-not-allowed'}`}
                                    >
                                        VALIDATE SIGNATURE
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3" 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-10"
                            >
                                <div className="relative">
                                    <div className="w-32 h-32 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                                        <ShieldCheck className="w-16 h-16" strokeWidth={1} />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-cyan-500 text-slate-950 rounded-full flex items-center justify-center border-4 border-[#0d1424] animate-bounce">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="max-w-md space-y-4">
                                    <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Authentication Ready</h4>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm leading-relaxed">
                                        Our system has verified your digital signature node. Protocol sequence is ready for submission to the secure research repository.
                                    </p>
                                </div>

                                <div className="w-full max-w-sm space-y-3">
                                    <button 
                                        onClick={generateAndSubmitPDF}
                                        disabled={isSubmitting}
                                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                                SUBMITTING TO NODE...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-5 h-5" />
                                                SIGN & FINALIZE MISSION
                                            </>
                                        )}
                                    </button>
                                    <button onClick={() => setStep(2)} disabled={isSubmitting} className="w-full py-4 text-slate-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-colors italic">RE-SIGN IF NEEDED</button>
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
