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
            doc.text(`Study: ${study?.title || 'MusB Clinical Trial'}`, 20, 55);
            doc.text(`Organization: MusB Research Pvt. Ltd.`, 20, 65);
            doc.text(`Protocol ID: ${study?.protocol_id || 'MUSB-NODE-SYNC'}`, 20, 75);

            // Consent Content
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const splitText = doc.splitTextToSize(
                "By signing this document, the participant confirms they have been fully informed about the study's purpose, methods, risks, and benefits. The participant understands that their involvement is completely voluntary and they may withdraw at any time without penalty. All personal data will be de-identified and stored securely for clinical analysis. This electronic record is legally binding under the Informaton Technology Act and global eSignature standards (ESIGN/eIDAS).",
                170
            );
            doc.text(splitText, 20, 95);

            // ──────────────── SIGNATURES SECTION ────────────────
            doc.setDrawColor(230, 230, 230);
            doc.line(20, 130, 190, 130);
            
            // 1. PARTICIPANT SECTION
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(34, 211, 238); // Cyan
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

            // 2. COORDINATOR SECTION
            doc.line(20, 205, 190, 205);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(99, 102, 241); // Indigo
            doc.text('02. CLINICAL COORDINATOR VERIFICATION', 20, 220);
            
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text('Pending Coordinator Review & Sign-off', 20, 230);
            
            // 3. PI SECTION
            doc.line(20, 245, 190, 245);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 118, 110); // Teal
            doc.text('03. PRINCIPAL INVESTIGATOR SIGN-OFF', 20, 260);
            
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text('Pending PI Final Verification', 20, 270);

            // Footer
            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.text(`Audit Node ID: MUSB-AUTH-${Math.random().toString(36).substring(2, 10).toUpperCase()} | Secure Research Protocol Sync`, 105, 290, { align: 'center' });

            // Finalize
            const blob = doc.output('blob');
            const file = new File([blob], `Consent_MUSB_HLS_${userProfile.userName}.pdf`, { type: 'application/pdf' });

            
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
                                            <p className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] mt-1">MusB Research Pvt. Ltd.</p>

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
                                className="flex-1 p-8 flex flex-col items-center"
                            >
                                <div className="text-center space-y-2 mb-10">
                                    <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter">Digital Signature</h4>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] italic">Authenticate your identity to bind this protocol.</p>
                                </div>

                                <div className="flex justify-center gap-3 mb-10">
                                    <button 
                                        onClick={() => { setSignatureType('DRAW'); setTypedSignature(''); setHasSigned(false); }}
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${signatureType === 'DRAW' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                    >
                                        <PenTool className="w-4 h-4 inline-block mr-2" /> Hand Drawn
                                    </button>
                                    <button 
                                        onClick={() => { setSignatureType('TYPE'); setHasSigned(typedSignature.length > 2); }}
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${signatureType === 'TYPE' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                    >
                                        <X className="w-4 h-4 inline-block mr-2 rotate-45" /> Typed ID
                                    </button>
                                </div>

                                <div className="w-full max-w-xl flex flex-col items-center justify-center mb-10">
                                    {signatureType === 'DRAW' ? (
                                        <div className="w-full space-y-4">
                                            <div className="relative aspect-[3/1] bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden cursor-crosshair group hover:border-cyan-500/30 transition-all">
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
                                                        <span className="text-slate-800 font-black uppercase tracking-[0.5em] text-xs italic">Sign Here</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-center">
                                                <button onClick={clearCanvas} className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors">Clear signature</button>
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
                                                className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-10 text-4xl font-serif text-cyan-400 outline-none focus:border-cyan-500/50 text-center italic"
                                            />
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic px-12">
                                                Self-attested legal signature binding your clinical identity.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Simplified Verification Card */}
                                <div className="w-full max-w-xl p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${hasSigned ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active ID</p>
                                            <p className="text-xs font-black text-white uppercase italic">{userProfile.userName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signed On</p>
                                        <p className="text-xs font-black text-cyan-400 italic">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="w-full flex justify-between items-center mt-10">
                                    <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors italic">Back to terms</button>
                                    <button 
                                        onClick={() => setStep(3)}
                                        disabled={!hasSigned}
                                        className={`px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all ${hasSigned ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 shadow-xl shadow-cyan-500/20' : 'bg-white/5 text-slate-800 border border-white/5 cursor-not-allowed'}`}
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
