import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle2, Clock, ShieldCheck,
    Download, Printer, AlertTriangle, Info,
    User, Calendar, PenTool, X
} from 'lucide-react';
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

            doc.setFillColor(30, 136, 229);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('CONSENT FORM (OFFICIAL)', 105, 25, { align: 'center' });

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text(`Study: ${study?.title || 'MusB Clinical Trial'}`, 20, 55);
            doc.text(`Organization: MusB Research Pvt. Ltd.`, 20, 65);
            doc.text(`Protocol ID: ${study?.protocol_id || 'MUSB-PROTOCOL-SYNC'}`, 20, 75);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const consentText = template?.terms_content || "By signing this document, the participant confirms they have been fully informed about the study's purpose, methods, risks, and benefits. The participant understands that their involvement is completely voluntary and they may withdraw at any time without penalty.";
            const splitText = doc.splitTextToSize(consentText, 170);
            doc.text(splitText, 20, 95);

            doc.setDrawColor(230, 230, 230);
            doc.line(20, 130, 190, 130);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 136, 229);
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#1A2B49]/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-white border border-[#E3ECF5] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="p-8 border-b border-[#F8FBFF] flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#E3F2FD] text-[#1E88E5] rounded-2xl flex items-center justify-center border border-[#BBDEFB]">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight leading-none">Informed Consent Form</h3>
                            <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[12px] mt-1">SECURE eCONSENT SYSTEM</p>
                        </div>
                    </div>
                </div>

                {/* STEPS */}
                <div className="px-8 py-4 bg-[#F8FBFF] border-b border-[#E3ECF5] flex items-center gap-8 shrink-0">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#1E88E5]' : 'text-[#5F6F89]'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold border ${step === 1 ? 'bg-[#1E88E5] border-[#1E88E5] text-white' : 'bg-white border-[#E3ECF5]'}`}>01</div>
                        <span className="text-[12px] font-bold uppercase tracking-widest">Review Terms</span>
                    </div>
                    <div className="h-px w-8 bg-[#E3ECF5]" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#1E88E5]' : 'text-[#5F6F89]'}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold border ${step === 2 ? 'bg-[#1E88E5] border-[#1E88E5] text-white' : 'bg-white border-[#E3ECF5]'}`}>02</div>
                        <span className="text-[12px] font-bold uppercase tracking-widest">Digital Signature</span>
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
                                <div className="flex-1 bg-[#F8FBFF] rounded-[24px] p-8 overflow-y-auto border border-[#E3ECF5] no-scrollbar shadow-inner" onScroll={handleScroll}>
                                    <div className="space-y-8">
                                        <div className="text-center border-b border-[#E3ECF5] pb-6 mb-8">
                                            <h4 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">{study?.title || 'HEALTH AND LIFESTYLE SURVEY'}</h4>
                                            <p className="text-[#1E88E5] font-bold uppercase tracking-widest text-[12px] mt-1">MusB Research Pvt. Ltd.</p>
                                        </div>

                                        <section className="space-y-4">
                                            <h5 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-[#1E88E5] rounded-full" /> Full Informational Protocol
                                            </h5>
                                            <div className="text-[#1A2B49] text-sm font-bold uppercase tracking-tight group-hover:text-[#1A2B49] transition-colors pl-4 border-l-2 border-[#E3ECF5] whitespace-pre-wrap">
                                                {template?.terms_content || "CONSENT INFORMATION: Standard study participation terms apply."}
                                            </div>
                                        </section>

                                        <div className="p-10 bg-white border border-[#E3ECF5] rounded-[24px] space-y-6 mt-12 shadow-sm">
                                            <div className="flex items-center gap-4 text-[#1E7F4F]">
                                                <CheckCircle2 className="w-6 h-6" />
                                                <h6 className="text-[16px] font-bold uppercase tracking-tight">Consent Acknowledgement</h6>
                                            </div>
                                            <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[13px] leading-relaxed italic">
                                                "I confirm that I have read the information above and voluntarily agree to participate in this study."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <button onClick={onClose} className="text-[12px] font-bold text-[#8A99B3] hover:text-[#1A2B49] uppercase tracking-widest transition-colors">Cancel Process</button>
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!scrolledToBottom && template?.terms_content}
                                        className={`px-10 py-5 rounded-2xl font-bold text-[14px] uppercase tracking-widest transition-all ${scrolledToBottom || !template?.terms_content ? 'bg-[#1E88E5] text-white hover:bg-[#1565C0] shadow-lg shadow-blue-500/20' : 'bg-[#F8FBFF] text-[#B0BCCF] cursor-not-allowed border border-[#E3ECF5]'}`}
                                    >
                                        Sign and Finalize Form
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 p-8 flex flex-col items-center overflow-y-auto no-scrollbar"
                            >
                                <div className="text-center space-y-2 mb-10">
                                    <h4 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Digital Signature</h4>
                                    <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[12px]">Sign below to authenticate your identity.</p>
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

                                <div className="w-full max-w-xl flex flex-col items-center justify-center mb-10">
                                    {signatureType === 'DRAW' ? (
                                        <div className="w-full space-y-4">
                                            <div className="relative aspect-[3/1] bg-[#F8FBFF] border-2 border-dashed border-[#E3ECF5] rounded-[24px] overflow-hidden cursor-crosshair">
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
                                                        <span className="text-[#B0BCCF] font-bold uppercase tracking-[0.5em] text-[12px]">Sign Within This Zone</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-center">
                                                <button onClick={clearCanvas} className="text-[12px] font-bold text-[#8A99B3] hover:text-rose-600 uppercase tracking-widest transition-colors">Clear signature</button>
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
                                                className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-8 text-4xl font-serif text-[#1E88E5] outline-none focus:border-[#1E88E5] text-center italic shadow-inner"
                                            />
                                            <p className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest leading-relaxed">
                                                Your typed name serves as a legal digital signature.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full max-w-xl p-8 bg-[#F8FBFF] border border-[#E3ECF5] rounded-[24px] flex items-center justify-between mt-auto shadow-sm">
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
                                        <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">Clinical Instrument</span>
                                        <p className="text-[14px] font-bold text-[#1E88E5]">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="w-full flex justify-between items-center mt-10 shrink-0">
                                    <button onClick={() => setStep(1)} className="text-[12px] font-bold text-[#8A99B3] hover:text-[#1A2B49] uppercase tracking-widest transition-colors">Review Terms</button>
                                    <button
                                        onClick={generateAndSubmitPDF}
                                        disabled={!hasSigned || isSubmitting}
                                        className={`px-12 py-5 rounded-2xl font-bold text-[14px] uppercase tracking-widest transition-all ${hasSigned && !isSubmitting ? 'bg-[#1E88E5] text-white hover:bg-[#1565C0] shadow-xl shadow-blue-500/20 active:scale-95' : 'bg-[#F8FBFF] text-[#B0BCCF] border border-[#E3ECF5] cursor-not-allowed'}`}
                                    >
                                        {isSubmitting ? 'Syncing...' : 'Finalize Submission'}
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
