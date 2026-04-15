import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle2, ShieldCheck,
    PenTool, X, Globe, Eye, ExternalLink,
    ChevronLeft, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface ConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: any) => void;
    study: any;
    template: any;
    userProfile: any;
    participantId?: string; // Explicit participant DB ID — eliminates ambiguous fallback on backend
}

// ─── Step indicators ───────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Review Summary' },
    { id: 2, label: 'Read Document' },
    { id: 3, label: 'Sign & Submit' },
];

// ─── Read Document Sub-Component ───────────────────────────────────────────────
const ReadDocumentStep = ({
    fileUrl, hasFileUrl, termsContent, study,
    docAcknowledged, setDocAcknowledged,
    docTimerDone, setDocTimerDone,
    docSecondsLeft, setDocSecondsLeft,
    timerRef, onBack, onNext
}: any) => {
    // Start reading timer on mount
    useEffect(() => {
        setDocTimerDone(false);
        setDocSecondsLeft(15);
        timerRef.current = setInterval(() => {
            setDocSecondsLeft((s: number) => {
                if (s <= 1) {
                    clearInterval(timerRef.current!);
                    setDocTimerDone(true);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const canProceed = docTimerDone && docAcknowledged;

    return (
        <motion.div key="step2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-hidden flex flex-col px-5 pb-4 pt-3">

            {/* Top bar */}
            <div className="mb-2 flex items-center justify-between shrink-0">
                <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest">
                    Read the full consent document before proceeding to sign.
                </p>
                <div className="flex items-center gap-2">
                    {!docTimerDone && (
                        <span className="px-3 py-1 bg-[#FFF3E0] border border-[#FFE0B2] text-[#E65100] text-[10px] font-bold rounded-full uppercase tracking-widest">
                            Reading: {docSecondsLeft}s
                        </span>
                    )}
                    {fileUrl && (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F4FA] text-[#1E88E5] text-[10px] font-bold rounded-lg hover:bg-[#DBEAFE] transition-all uppercase tracking-widest">
                            <ExternalLink className="w-3 h-3" /> New Tab
                        </a>
                    )}
                </div>
            </div>

            {/* PDF / Text viewer — fills remaining height */}
            <div className="flex-1 rounded-2xl border border-[#E3ECF5] overflow-hidden min-h-0">
                {hasFileUrl && fileUrl ? (
                    <iframe
                        src={fileUrl}
                        className="w-full h-full border-0"
                        title="Consent Document"
                        style={{ minHeight: '100%' }}
                    />
                ) : (
                    <div
                        onScroll={(e) => {
                            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                            if (scrollHeight - scrollTop <= clientHeight + 60) setDocTimerDone(true);
                        }}
                        className="h-full overflow-y-auto p-6"
                    >
                        <h3 className="text-base font-bold text-[#1A2B49] uppercase mb-4 text-center">{study?.title}</h3>
                        <div className="text-sm text-[#1A2B49] leading-relaxed whitespace-pre-wrap font-medium">
                            {termsContent || 'No document content available. Please contact your study coordinator.'}
                        </div>
                    </div>
                )}
            </div>

            {/* Acknowledgement checkbox */}
            <div className="mt-3 shrink-0">
                <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all ${docAcknowledged ? 'bg-emerald-50 border-emerald-200' : 'bg-[#F8FBFF] border-[#E3ECF5] hover:border-[#1E88E5]/40'}`}>
                    <div
                        onClick={() => docTimerDone && setDocAcknowledged(!docAcknowledged)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                            ${docAcknowledged ? 'bg-emerald-500 border-emerald-500' : docTimerDone ? 'bg-white border-[#1E88E5] cursor-pointer' : 'bg-[#F0F4FA] border-[#D1D9E6] cursor-not-allowed'}`}
                    >
                        {docAcknowledged && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-[11px] font-bold uppercase tracking-widest leading-relaxed ${docTimerDone ? 'text-[#1A2B49]' : 'text-[#B0BCCF]'}`}>
                            I confirm that I have read and understood the complete informed consent document and voluntarily agree to participate in this clinical research study.
                        </p>
                        {!docTimerDone && (
                            <p className="text-[10px] text-[#B0BCCF] font-bold mt-0.5">Available after reading timer completes ({docSecondsLeft}s remaining)</p>
                        )}
                    </div>
                </label>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center justify-between shrink-0">
                <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-bold text-[#8A99B3] hover:text-[#1A2B49] uppercase tracking-widest transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canProceed}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all
                        ${canProceed
                            ? 'bg-[#1E88E5] hover:bg-[#1565C0] text-white shadow-md active:scale-95'
                            : 'bg-[#F0F4FA] text-[#B0BCCF] border border-[#E3ECF5] cursor-not-allowed'}`}
                >
                    I Have Read the Document <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};


const ConsentModal = ({ isOpen, onClose, onComplete, study, template, userProfile, participantId }: ConsentModalProps) => {
    const [step, setStep] = useState(1);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [docViewed, setDocViewed] = useState(false);
    const [docAcknowledged, setDocAcknowledged] = useState(false);
    const [docTimerDone, setDocTimerDone] = useState(false);
    const [docSecondsLeft, setDocSecondsLeft] = useState(15);
    const contentRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [signatureType, setSignatureType] = useState<'DRAW' | 'TYPE'>('DRAW');
    const [typedSignature, setTypedSignature] = useState('');
    const [typedName, setTypedName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [docFullscreen, setDocFullscreen] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setScrolledToBottom(false);
            setDocViewed(false);
            setDocAcknowledged(false);
            setDocTimerDone(false);
            setDocSecondsLeft(15);
            setHasSigned(false);
            setTypedName('');
            setTypedSignature('');
            setSignatureType('DRAW');
            setDocFullscreen(false);
        }
    }, [isOpen]);

    // Canvas setup
    useEffect(() => {
        if (step === 3 && signatureType === 'DRAW' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#1E88E5';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, [step, signatureType]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsSigning(true);
        draw(e);
    };
    const stopDrawing = () => {
        setIsSigning(false);
        if (canvasRef.current) setHasSigned(true);
    };
    const draw = (e: any) => {
        if (!isSigning || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches?.[0].clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches?.[0].clientY) - rect.top) * scaleY;
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
        if (scrollHeight - scrollTop <= clientHeight + 60) setScrolledToBottom(true);
    };

    const handleFinalSubmit = async () => {
        if (!hasSigned || !typedName) return;

        const sId = study?.id || study?._id;
        const tId = template?.id || template?._id;

        // sId is not strictly required — backend can derive study from participant_id + template
        if (!tId) {
            setSubmitError('Unable to submit: consent form template could not be identified. Please close and try again.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        try {
            let finalSignature = '';
            if (signatureType === 'DRAW' && canvasRef.current) {
                finalSignature = canvasRef.current.toDataURL('image/png');
            } else {
                finalSignature = typedSignature || typedName;
            }

            const email = userProfile?.userEmail || userProfile?.email || userProfile?.user_email || '';

            const response = await authFetch(`${API}/api/consent/`, {
                method: 'POST',
                body: JSON.stringify({
                    study: sId,
                    template: tId,
                    participant_id: participantId || '',   // ← RC-1 fix: explicit participant
                    full_name: typedName,
                    email: email,
                    participant_signature: finalSignature,
                    timezone_detected: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    source: 'PARTICIPANT_PORTAL',
                })
            });

            if (response.ok) {
                const data = await response.json();
                onComplete(data);
            } else {
                const errData = await response.json().catch(() => ({}));
                // ALREADY_SIGNED is an idempotent success — participant already submitted,
                // so treat it as completed and navigate them to documents.
                if (errData?.detail === 'ALREADY_SIGNED') {
                    console.log('[Consent] Already signed — treating as success:', errData);
                    onComplete({ already_signed: true, ...errData });
                    return;
                }
                const msg = errData?.message || errData?.detail || errData?.error || JSON.stringify(errData) || 'Failed to save consent';
                throw new Error(msg);
            }
        } catch (err) {
            console.error('Consent submission failed:', err);
            setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please contact your study coordinator.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const hasFileUrl = !!(template?.file_url || template?.file);
    const fileUrl = template?.file_url || (template?.file ? `${API}${template.file}` : null);
    const termsContent = template?.terms_content || '';

    // ─── Document Fullscreen Viewer ────────────────────────────────────────────
    if (docFullscreen) {
        return (
            <div className="fixed inset-0 z-[200] flex flex-col bg-[#0d1526]">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 bg-[#1A2B49] border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#1E88E5]" />
                        <span className="text-white font-bold text-sm uppercase tracking-widest">
                            {template?.title || 'Consent Document'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-widest">
                                <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                            </a>
                        )}
                        <button
                            onClick={() => { setDocViewed(true); setDocFullscreen(false); }}
                            className="flex items-center gap-2 px-5 py-2 bg-[#1E88E5] hover:bg-[#1565C0] text-white text-xs font-bold rounded-lg transition-all uppercase tracking-widest">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done Reading
                        </button>
                        <button onClick={() => setDocFullscreen(false)}
                            className="p-2 text-white/50 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Document Area */}
                <div className="flex-1 overflow-hidden">
                    {hasFileUrl && fileUrl ? (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full border-0"
                            title="Consent Document"
                            onLoad={() => setDocViewed(true)}
                        />
                    ) : (
                        <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto">
                            <div className="bg-white rounded-2xl p-10 shadow-xl">
                                <h2 className="text-2xl font-bold text-[#1A2B49] mb-6 text-center uppercase">{study?.title}</h2>
                                <div className="prose max-w-none text-[#1A2B49] leading-relaxed whitespace-pre-wrap">
                                    {termsContent || 'No document content available. Please contact your study coordinator.'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#1A2B49]/50 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full max-w-4xl bg-white border border-[#E3ECF5] rounded-[24px] shadow-2xl flex flex-col"
                style={{ maxHeight: '96vh', height: '96vh' }}
            >
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-[#F0F4FA] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#E3F2FD] text-[#1E88E5] rounded-xl flex items-center justify-center border border-[#BBDEFB]">
                            <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[#1A2B49] uppercase tracking-tight leading-none">Informed Consent</h3>
                            <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest mt-0.5">Secure eConsent System · {template?.version ? `v${template.version}` : 'Latest'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-[#8A99B3] hover:text-[#1A2B49] hover:bg-[#F0F4FA] transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* STEP PROGRESS */}
                <div className="px-6 py-3 bg-[#F8FBFE] border-b border-[#E3ECF5] flex items-center gap-3 shrink-0">
                    {STEPS.map((s, idx) => (
                        <React.Fragment key={s.id}>
                            <div className={`flex items-center gap-2 ${step === s.id ? 'text-[#1E88E5]' : step > s.id ? 'text-emerald-600' : 'text-[#B0BCCF]'}`}>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0
                                    ${step === s.id ? 'bg-[#1E88E5] text-white' : step > s.id ? 'bg-emerald-500 text-white' : 'bg-white border border-[#E3ECF5] text-[#B0BCCF]'}`}>
                                    {step > s.id ? '✓' : s.id}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">{s.label}</span>
                            </div>
                            {idx < STEPS.length - 1 && <div className="flex-1 h-px bg-[#E3ECF5]" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">

                        {/* ── STEP 1: Review Summary ── */}
                        {step === 1 && (
                            <motion.div key="step1"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="flex-1 overflow-hidden flex flex-col p-5">

                                {/* Study Meta */}
                                <div className="mb-4 p-4 bg-[#F0F6FF] rounded-2xl border border-[#DBEAFE] flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-[#1E88E5] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-[#1A2B49] uppercase tracking-widest leading-none mb-1">{study?.title || 'Study'}</p>
                                        <p className="text-[11px] text-[#5F6F89] font-bold uppercase tracking-tight">
                                            Protocol: {study?.protocol_id} · Template: {template?.title || 'Informed Consent'} · Version: {template?.version || '1.0'}
                                        </p>
                                    </div>
                                </div>

                                {/* Terms summary */}
                                <div
                                    ref={contentRef}
                                    onScroll={handleScroll}
                                    className="flex-1 overflow-y-auto bg-[#F8FBFF] rounded-2xl border border-[#E3ECF5] p-5 text-sm text-[#1A2B49] leading-relaxed whitespace-pre-wrap font-medium no-scrollbar"
                                >
                                    {termsContent || (
                                        <span className="text-[#8A99B3] italic">
                                            Standard clinical study participation terms apply. Please use the "View Full Document" button below to read the complete consent form before proceeding.
                                        </span>
                                    )}
                                </div>

                                {/* View Document CTA */}
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <button
                                        onClick={() => { setDocFullscreen(true); }}
                                        className="flex items-center gap-2 px-5 py-3 bg-[#1A2B49] hover:bg-[#0f1e38] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Full Document
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <button onClick={onClose} className="text-[11px] font-bold text-[#8A99B3] hover:text-[#1A2B49] uppercase tracking-widest transition-colors">Cancel</button>
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!!(termsContent && !scrolledToBottom) && !docViewed}
                                            className={`px-6 py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all
                                                ${(scrolledToBottom || docViewed || !termsContent)
                                                    ? 'bg-[#1E88E5] text-white hover:bg-[#1565C0] shadow-md'
                                                    : 'bg-[#F0F4FA] text-[#B0BCCF] cursor-not-allowed'}`}
                                        >
                                            {scrolledToBottom || docViewed || !termsContent ? 'Continue →' : 'Scroll to Continue'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 2: Full Document Read ── */}
                        {step === 2 && (
                            <ReadDocumentStep
                                fileUrl={fileUrl}
                                hasFileUrl={hasFileUrl}
                                termsContent={termsContent}
                                study={study}
                                docAcknowledged={docAcknowledged}
                                setDocAcknowledged={setDocAcknowledged}
                                docTimerDone={docTimerDone}
                                setDocTimerDone={setDocTimerDone}
                                docSecondsLeft={docSecondsLeft}
                                setDocSecondsLeft={setDocSecondsLeft}
                                timerRef={timerRef}
                                onBack={() => setStep(1)}
                                onNext={() => { setDocViewed(true); setStep(3); }}
                            />
                        )}

                        {/* ── STEP 3: Sign ── */}
                        {step === 3 && (
                            <motion.div key="step3"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="flex-1 overflow-y-auto flex flex-col p-5 gap-4 no-scrollbar">

                                {/* Full name */}
                                <div>
                                    <label className="text-[10px] font-black text-[#1E88E5] uppercase tracking-widest mb-1 block">
                                        Legal Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={typedName}
                                        onChange={(e) => setTypedName(e.target.value)}
                                        className="w-full bg-[#F8FBFF] border border-[#E3ECF5] focus:border-[#1E88E5] rounded-xl px-5 py-3.5 text-[#1A2B49] font-bold text-base outline-none transition-colors"
                                        placeholder="Enter your legal full name"
                                    />
                                </div>

                                {/* Signature type toggle */}
                                <div className="flex gap-2">
                                    {(['DRAW', 'TYPE'] as const).map((t) => (
                                        <button key={t} onClick={() => { setSignatureType(t); setHasSigned(false); }}
                                            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2
                                                ${signatureType === t ? 'bg-[#E3F2FD] border-[#1E88E5] text-[#1E88E5]' : 'bg-white border-[#E3ECF5] text-[#8A99B3] hover:text-[#5F6F89]'}`}>
                                            <PenTool className="w-3.5 h-3.5" />
                                            {t === 'DRAW' ? 'Hand Draw' : 'Type Signature'}
                                        </button>
                                    ))}
                                </div>

                                {/* Signature area */}
                                {signatureType === 'DRAW' ? (
                                    <div className="space-y-2">
                                        <div className="relative rounded-2xl bg-[#F8FBFF] border-2 border-dashed border-[#BBDEFB] overflow-hidden cursor-crosshair" style={{ height: 150 }}>
                                            <canvas
                                                ref={canvasRef} width={700} height={150}
                                                className="w-full h-full"
                                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                            />
                                            {!hasSigned && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="text-[#B0BCCF] font-bold uppercase tracking-[0.4em] text-[11px]">Sign within this zone</span>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={clearCanvas} className="text-[11px] font-bold text-[#8A99B3] hover:text-rose-500 uppercase tracking-widest transition-colors">
                                            Clear Signature
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="text" value={typedSignature}
                                        onChange={(e) => { setTypedSignature(e.target.value); setHasSigned(e.target.value.length > 2); }}
                                        placeholder={typedName || 'Type your signature here'}
                                        className="w-full bg-[#F8FBFF] border border-[#E3ECF5] focus:border-[#1E88E5] rounded-xl px-5 py-4 text-3xl font-serif text-[#1E88E5] italic outline-none text-center transition-colors"
                                    />
                                )}

                                {/* Auth summary bar */}
                                <div className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all ${hasSigned && typedName ? 'bg-emerald-50 border-emerald-200' : 'bg-[#F8FBFF] border-[#E3ECF5]'}`}>
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className={`w-5 h-5 ${hasSigned && typedName ? 'text-emerald-500' : 'text-[#B0BCCF]'}`} />
                                        <div>
                                            <p className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest">Digital Auth</p>
                                            <p className="text-[13px] font-bold text-[#1A2B49] uppercase">{typedName || 'Awaiting Name'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest">Auto Timestamp</p>
                                        <p className="text-[12px] font-bold text-[#1A2B49]">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center justify-between pt-1">
                                    <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-[11px] font-bold text-[#8A99B3] hover:text-[#1A2B49] uppercase tracking-widest transition-colors">
                                        <ChevronLeft className="w-3.5 h-3.5" /> Back
                                    </button>
                                    <button
                                        onClick={handleFinalSubmit}
                                        disabled={!hasSigned || !typedName || isSubmitting}
                                        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all
                                            ${hasSigned && typedName && !isSubmitting
                                                ? 'bg-[#1E88E5] text-white hover:bg-[#1565C0] shadow-lg shadow-blue-500/20 active:scale-95'
                                                : 'bg-[#F0F4FA] text-[#B0BCCF] border border-[#E3ECF5] cursor-not-allowed'}`}
                                    >
                                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> Submit Consent</>}
                                    </button>
                                </div>

                                {/* Inline error (replaces browser alert) */}
                                {submitError && (
                                    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl mt-1">
                                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18A2 2 0 003.64 21h16.72a2 2 0 001.82-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                                        <p className="text-[11px] font-semibold text-red-700 leading-tight">{submitError}</p>
                                        <button onClick={() => setSubmitError(null)} className="ml-auto text-red-400 hover:text-red-600 shrink-0">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}

                                {/* Legal notice */}
                                <p className="text-[10px] text-[#B0BCCF] font-bold uppercase tracking-widest text-center pb-1">
                                    By submitting, you confirm you have read and understand the informed consent document and voluntarily agree to participate.
                                </p>
                            </motion.div>

                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ConsentModal;
