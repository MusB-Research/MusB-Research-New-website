import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Clock, Activity, ChevronRight, Check, X,
    FileText, Eye, ShieldCheck, AlertCircle, ExternalLink,
    Download, Pen, ZoomIn, ZoomOut, ClipboardList, AlertTriangle, FileCheck
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';
import { Skeleton } from '../../views/Participant/SharedComponents';


interface StaffTask {
    id: string;
    study: string;
    title: string;
    description: string;
    task_type: string;
    is_completed: boolean;
    created_at: string;
    reference_id?: string;
}

interface GenericRecordDetail {
    id: string;
    full_name?: string;
    participant_name?: string;
    date_of_birth?: string;
    study: string | { protocol_id?: string; title?: string };
    study_details?: { protocol_id?: string; title?: string };
    signed_pdf_url?: string;
    signature_data?: string;
    participant_signature?: string;
    signed_at?: string;
    participant_signed_at?: string;
    status: string;
    pi_verified?: boolean;
    cc_verified?: boolean;
    pi_signed_at?: string;
    coordinator_signed_at?: string;
    medication_name?: string;
    dosage?: string;
    date?: string;
    time_taken?: string;
    noticed_side_effects?: boolean;
    severity?: string;
    side_effect_description?: string;
    template_details?: any;
    version?: string;
    agreed_at?: string;
}

// ─── PDF / Consent Viewer Modal ───────────────────────────────────────────────
function ConsentReviewModal({
    task,
    primaryColor,
    onClose,
    onCoSigned,
    onMarkComplete,
}: {
    task: StaffTask;
    primaryColor: string;
    onClose: () => void;
    onCoSigned: (taskId: string) => void;
    onMarkComplete?: (taskId: string) => void;
}) {
    const [record, setRecord] = useState<GenericRecordDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [signed, setSigned] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfZoom, setPdfZoom] = useState(100);
    
    // Signature State
    const [signatureStep, setSignatureStep] = useState(false);
    const [signatureType, setSignatureType] = useState<'DRAW' | 'TYPE'>('DRAW');
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [typedName, setTypedName] = useState('');
    const [typedSignature, setTypedSignature] = useState('');
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const accent = primaryColor === 'indigo' ? 'indigo' : 'blue';

    const fetchRecord = useCallback(async () => {
        if (!task.reference_id) { setLoading(false); return; }
        try {
            // Senior Dev: Determine correct endpoint based on task type to avoid 404s
            let endpoint = `/api/consent/${task.reference_id}/`;
            if (task.task_type === 'FORM_SIGNATURE') {
                endpoint = `/api/assigned-forms/${task.reference_id}/`;
            } else if (task.task_type === 'LOG_REVIEW') {
                endpoint = `/api/daily-medication-logs/${task.reference_id}/`;
            }

            const res = await authFetch(`${API}${endpoint}`);
            
            // Handle Orphaned Tasks Gracefully
            if (res.status === 404) {
                throw new Error('This record no longer exists or you do not have permission to view it.');
            }
            if (!res.ok) throw new Error('Could not load record details');
            
            const data = await res.json();
            setRecord(data);
            
            // Check if already signed
            const isSigned = 
                data.cc_verified || 
                data.pi_verified || 
                data.coordinator_signed_at || 
                data.pi_signed_at ||
                data.status === 'COMPLETED' || 
                data.status === 'FULLY_SIGNED';
                
            setSigned(isSigned);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [task.reference_id, task.task_type]);

    useEffect(() => { fetchRecord(); }, [fetchRecord]);
    
    // Canvas setup when signature pad opens
    useEffect(() => {
        if (signatureStep && signatureType === 'DRAW' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = accent === 'indigo' ? '#6366f1' : '#3b82f6';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, [signatureStep, signatureType, accent]);

    const startDrawing = (e: any) => { setIsDrawing(true); draw(e); };
    const stopDrawing = () => { setIsDrawing(false); if (canvasRef.current) setHasSigned(true); };
    const draw = (e: any) => {
        if (!isDrawing || !canvasRef.current) return;
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
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
        setHasSigned(false);
    };

    const handleCoSign = async () => {
        if (!record) return;
        setSigning(true); setError(null);
        try {
            let finalSignature = '';
            if (signatureType === 'DRAW' && canvasRef.current) {
                finalSignature = canvasRef.current.toDataURL('image/png');
            } else {
                finalSignature = typedSignature || typedName;
            }

            // Senior Dev: Route to the correct verification endpoint
            let verifyEndpoint = `/api/consent/${record.id}/verify/`;
            if (task.task_type === 'CONSENT_COORDINATOR_SIGN') {
                verifyEndpoint = `/api/consent/${record.id}/coordinator_sign/`;
            } else if (task.task_type === 'CONSENT_SIGNATURE') {
                verifyEndpoint = `/api/consent/${record.id}/pi_sign/`;
            } else if (task.task_type === 'FORM_SIGNATURE') {
                // Determine roles for Form signing
                const isPI = (localStorage.getItem('userRole') || '').toUpperCase() === 'PI';
                verifyEndpoint = `/api/assigned-forms/${record.id}/${isPI ? 'sign_pi' : 'sign_coordinator'}/`;
            }

            const res = await authFetch(`${API}${verifyEndpoint}`, {
                method: 'POST',
                body: JSON.stringify({
                    signature: finalSignature,
                    name: typedName,
                    source: 'STAFF_DASHBOARD'
                })
            });
            
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || err.detail || 'Co-sign failed');
            }
            setSigned(true);
            onCoSigned(task.id);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSigning(false);
        }
    };

    const pdfUrl = record?.signed_pdf_url || '';

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 20 }}
                className="bg-[#111827]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl bg-${accent}-500/10 border border-${accent}-500/20 flex items-center justify-center`}>
                            <FileText className={`w-5 h-5 text-${accent}-400`} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white uppercase tracking-tight">
                                {record?.template_details?.require_cc_verification === false ? 'Acknowledge Consent' : 'Co-Sign Consent'}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                {record?.template_details?.require_cc_verification === false ? 'Plain-text disclosure acknowledgement' : task.description}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                        <AlertCircle className="w-10 h-10 text-red-500/50" />
                        <p className="text-[12px] text-red-400 font-bold uppercase text-center max-w-sm px-10">{error}</p>
                        <div className="flex gap-3">
                            <button onClick={fetchRecord} className="text-[11px] font-black text-white px-5 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all uppercase">Retry</button>
                            <button onClick={() => onCoSigned(task.id)} className="text-[11px] font-bold text-slate-400 px-5 py-2 border border-white/5 rounded-full hover:bg-white/5 transition-all uppercase">Dismiss Task</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Record Metadata */}
                        {record && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-7 py-4 border-b border-white/5 shrink-0">
                                {[
                                    { label: 'Participant', value: record.full_name || record.participant_name || '—' },
                                    { label: 'Study', value: record.study_details?.protocol_id || (typeof record.study === 'object' ? record.study.protocol_id : record.study) || '—' },
                                    { label: 'Signed At', value: (record.signed_at || record.participant_signed_at) ? new Date(record.signed_at || record.participant_signed_at || '').toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—' },
                                    { label: 'Status', value: record.status || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                                        <p className="text-[12px] font-bold text-white mt-1 uppercase tracking-tight truncate">{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PDF Viewer */}
                        {/* PDF Viewer / Signature Pad */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                             {signatureStep ? (
                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    <div className="max-w-xl mx-auto space-y-8">
                                        <div>
                                            <h4 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Apply Signature</h4>
                                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Confirm your signature to finish.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className={`text-[10px] font-black text-${accent}-400 uppercase tracking-widest mb-2 block`}>Staff Full Name</label>
                                                <input 
                                                    type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black text-base outline-none focus:border-indigo-500 transition-all uppercase italic"
                                                    placeholder="Enter your legal full name"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                {(['DRAW', 'TYPE'] as const).map(t => (
                                                    <button key={t} onClick={() => { setSignatureType(t); setHasSigned(false); }}
                                                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${signatureType === t ? `bg-${accent}-500/10 border-${accent}-500/40 text-${accent}-400` : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                                        {t === 'DRAW' ? 'Hand Draw' : 'Type Signature'}
                                                    </button>
                                                ))}
                                            </div>

                                            {signatureType === 'DRAW' ? (
                                                <div className="space-y-3">
                                                    <div className="relative h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden cursor-crosshair">
                                                        <canvas
                                                            ref={canvasRef} width={600} height={160} className="w-full h-full"
                                                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                                            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                                        />
                                                        {!hasSigned && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Sign here</div>}
                                                    </div>
                                                    <button onClick={clearCanvas} className="text-[10px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors">Clear Signature</button>
                                                </div>
                                            ) : (
                                                <input 
                                                    type="text" value={typedSignature} onChange={(e) => { setTypedSignature(e.target.value); setHasSigned(e.target.value.length > 2); }}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-6 text-2xl font-serif text-indigo-400 italic outline-none text-center"
                                                    placeholder="Type signature here"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : task.task_type === 'LOG_REVIEW' ? (
                                 <div className="flex-1 overflow-auto p-8 space-y-8 bg-[#060A14]/30">
                                     <div className="max-w-2xl mx-auto space-y-6">
                                         <div className="flex items-center gap-4 mb-8">
                                             <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                                                 <ClipboardList className="w-6 h-6 text-teal-400" />
                                             </div>
                                             <div>
                                                 <h4 className="text-xl font-bold text-white uppercase tracking-tight">Daily Medication Log</h4>
                                                 <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Submitted by {record?.participant_name || 'Participant'}</p>
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-2 gap-6">
                                             <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Medication</p>
                                                 <p className="text-base font-bold text-white uppercase">{record?.medication_name || '—'}</p>
                                             </div>
                                             <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dosage</p>
                                                 <p className="text-base font-bold text-white uppercase">{record?.dosage || '—'}</p>
                                             </div>
                                             <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date</p>
                                                 <p className="text-base font-bold text-white uppercase">{record?.date || '—'}</p>
                                             </div>
                                             <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Taken</p>
                                                 <p className="text-base font-bold text-white uppercase">{record?.time_taken || '—'}</p>
                                             </div>
                                         </div>

                                         <div className={`rounded-2xl p-6 border ${record?.noticed_side_effects ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                             <div className="flex items-center gap-3 mb-4">
                                                 {record?.noticed_side_effects ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                                 <h5 className={`text-sm font-black uppercase tracking-widest ${record?.noticed_side_effects ? 'text-red-400' : 'text-emerald-400'}`}>
                                                     {record?.noticed_side_effects ? 'Adverse Effects Reported' : 'No Side Effects Reported'}
                                                 </h5>
                                             </div>
                                             {record?.noticed_side_effects && (
                                                 <div className="space-y-4">
                                                     <div>
                                                         <p className="text-[10px] font-black text-red-500/50 uppercase tracking-widest mb-1">Severity</p>
                                                         <p className="text-sm font-bold text-white uppercase">{record?.severity || '—'}</p>
                                                     </div>
                                                     <div>
                                                         <p className="text-[10px] font-black text-red-500/50 uppercase tracking-widest mb-1">Description</p>
                                                         <p className="text-sm text-slate-300 leading-relaxed italic">"{record?.side_effect_description || 'No additional details provided.'}"</p>
                                                     </div>
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             ) : pdfUrl ? (
                                <>
                                    {/* PDF Toolbar */}
                                    <div className="flex items-center justify-between px-7 py-2.5 border-b border-white/5 bg-white/[0.02] shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Consent Document</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPdfZoom(z => Math.max(60, z - 20))}
                                                className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <ZoomOut className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-[10px] font-black text-slate-500 w-10 text-center">{pdfZoom}%</span>
                                            <button
                                                onClick={() => setPdfZoom(z => Math.min(200, z + 20))}
                                                className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <ZoomIn className="w-3.5 h-3.5" />
                                            </button>
                                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                                                className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1" title="Open in new tab">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <a href={pdfUrl} download
                                                className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Download PDF">
                                                <Download className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                    {/* Embedded PDF */}
                                    <div className="flex-1 overflow-auto bg-[#060A14] p-4">
                                        <div style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                                            <iframe
                                                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                                className="w-full rounded-xl border border-white/10"
                                                style={{ height: '60vh', minHeight: 400 }}
                                                title="Signed Document PDF"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (record?.signature_data || record?.participant_signature) ? (
                                // Fallback: show signature image if no PDF
                                <div className="flex-1 overflow-auto p-6 flex flex-col items-center gap-6">
                                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Participant Signature</p>
                                        <img
                                            src={record.signature_data || record.participant_signature}
                                            alt="Participant Signature"
                                            className="max-w-sm rounded-xl border border-white/10 bg-white p-3"
                                        />
                                    </div>
                                    <div className="w-full bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                                        <div className="flex items-center gap-3 text-amber-400">
                                            <AlertCircle className="w-4 h-4" />
                                            <p className="text-[11px] font-black uppercase tracking-widest">No PDF available — signature image shown above</p>
                                        </div>
                                    </div>
                                </div>
                             ) : record?.template_details?.terms_content ? (
                                // Plain Text Consent View
                                <div className="flex-1 overflow-auto bg-[#060A14] p-8">
                                    <div className="max-w-3xl mx-auto bg-white/[0.02] border border-white/5 rounded-3xl p-10 shadow-2xl">
                                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-white uppercase">Disclosure Terms</h4>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Plain-Text eConsent Version {record.version || '1.0'}</p>
                                            </div>
                                        </div>
                                        <div className="prose prose-invert max-w-none">
                                            <div className="text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-serif text-lg italic opacity-90">
                                                {record.template_details.terms_content}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Participant Acknowledged</p>
                                                    <p className="text-sm font-bold text-white uppercase">{record.full_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time of Agreement</p>
                                                <p className="text-sm font-bold text-slate-400">{(record.agreed_at || record.participant_signed_at) ? new Date((record.agreed_at || record.participant_signed_at) as any).toLocaleString() : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
                                    <FileText className="w-10 h-10 text-slate-700 opacity-50" />
                                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest">No PDF or signature data available yet</p>
                                    <p className="text-[10px] text-slate-600 uppercase tracking-widest max-w-xs text-center">The system may still be generating the signed document. Please try again in a moment.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer: Co-Sign Action */}
                        <div className="px-7 py-5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3">
                                {signed ? (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest">Verified</span>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest max-w-md italic">
                                        {signatureStep ? 'Confirm your name and apply signature above.' : 'Review the consent document above, then apply your co-signature to finalize.'}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button onClick={signatureStep ? () => setSignatureStep(false) : onClose}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                    {signed ? 'Close' : signatureStep ? 'Back' : 'Cancel'}
                                </button>
                                 {!signed && (
                                    signatureStep ? (
                                        <button
                                            onClick={handleCoSign}
                                            disabled={signing || !hasSigned || !typedName}
                                            className={`px-7 py-3 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-30 flex items-center gap-2 active:scale-95`}
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {signing ? 'Finalizing...' : 'Sign & Verify Record'}
                                        </button>
                                    ) : task.task_type === 'LOG_REVIEW' ? (
                                        <button
                                            onClick={() => onMarkComplete?.(task.id)}
                                            className="px-7 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Mark as Reviewed
                                        </button>
                                    ) : (
                                        <button onClick={record?.template_details?.require_cc_verification === false ? handleCoSign : () => setSignatureStep(true)}
                                            className={`px-7 py-3 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95`}>
                                            {record?.template_details?.require_cc_verification === false ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge Receipt</>
                                            ) : (
                                                <><FileCheck className="w-3.5 h-3.5" /> Co-Sign Record</>
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                        {error && (
                            <div className="px-7 pb-4 shrink-0">
                                <p className="text-[11px] text-red-400 font-bold uppercase tracking-widest">{error}</p>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface StaffTasksModuleProps {
    primaryColor?: string;
    onRefresh?: () => void;
    preloadedTasks?: StaffTask[];
    isLoading?: boolean;
    onViewParticipant?: (participantId: string, tab?: string) => void;
}

export default function StaffTasksModule({ primaryColor = 'indigo', onRefresh, preloadedTasks, isLoading, onViewParticipant }: StaffTasksModuleProps) {
    const [tasks, setTasks] = useState<StaffTask[]>(preloadedTasks || []);
    const [loading, setLoading] = useState(!preloadedTasks || preloadedTasks.length === 0);
    const [reviewTask, setReviewTask] = useState<StaffTask | null>(null);

    const isConsentTask = (t: StaffTask) =>
        t.task_type === 'CONSENT_SIGNATURE' ||
        t.task_type === 'CONSENT_COORDINATOR_SIGN' ||
        t.task_type === 'FORM_SIGNATURE' ||
        t.task_type === 'LOG_REVIEW';
    
    const isScreenerReview = (t: StaffTask) => t.task_type === 'SCREENER_REVIEW' || t.task_type === 'SCREENING_REVIEW';

    const isOverdueAlert = (t: StaffTask) => t.task_type === 'OVERDUE_ALERT';

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await authFetch(`${API}/api/staff-tasks/`);
            if (res.ok) {
                const data = await res.json();
                const results = data.results !== undefined ? data.results : data;
                setTasks(Array.isArray(results) ? results : []);
            }
        } catch (err) {
            console.error('Failed to fetch staff tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!preloadedTasks || preloadedTasks.length === 0) {
            fetchTasks();
        } else {
            setTasks(preloadedTasks);
            setLoading(false);
        }
    }, [preloadedTasks]);

    const markComplete = async (taskId: string) => {
        try {
            const res = await authFetch(`${API}/api/staff-tasks/${taskId}/complete/`, { method: 'POST' });
            if (res.ok) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: true } : t));
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            console.error('Failed to complete task:', err);
        }
    };

    const handleCoSigned = (taskId: string) => {
        // Mark task complete locally (backend /verify/ already does it too)
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: true } : t));
        setReviewTask(null);
        if (onRefresh) onRefresh();
    };

    const handleSendReminder = async (task: StaffTask) => {
        if (!task.reference_id) return;
        try {
            const res = await authFetch(`${API}/api/participant-tasks/${task.reference_id}/send_reminder/`, {
                method: 'POST'
            });
            if (res.ok) {
                alert('Reminder sent to participant successfully.');
                // Optionally mark the alert as addressed
                markComplete(task.id);
            }
        } catch (err) {
            console.error('Failed to send reminder:', err);
        }
    };

    const pendingTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    const accent = primaryColor === 'indigo' ? 'indigo' : 'blue';


    return (
        <div className="space-y-6 md:space-y-10">
            {/* Consent Review Modal */}
            <AnimatePresence>
                {reviewTask && (
                    <ConsentReviewModal
                        task={reviewTask}
                        primaryColor={primaryColor}
                        onClose={() => setReviewTask(null)}
                        onCoSigned={handleCoSigned}
                        onMarkComplete={markComplete}
                    />
                )}
            </AnimatePresence>

            {/* Premium SaaS Header Section */}
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-end justify-between'} pb-6 md:pb-8 border-b border-white/[0.07] mb-4`}>
                <div className="flex flex-col gap-1 md:gap-2">
                    <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold text-white tracking-tighter uppercase leading-none`}>My Tasks</h2>
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Actions</p>
                </div>
                
                <div className={`flex items-center gap-4 text-slate-500/50 pb-1.5 transition-opacity hover:opacity-100 ${isMobile ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="w-8 md:w-12 h-px bg-white/10 hidden md:block" />
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Finished</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Pending Tasks */}
                <div className="lg:col-span-7 space-y-5">
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-3 uppercase tracking-tighter px-2">
                        Pending Actions
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                            {pendingTasks.length.toString().padStart(2, '0')}
                        </span>
                    </h3>

                    <div className="space-y-3">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-5 rounded-[2rem] border border-white/5 bg-white/[0.03] space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Skeleton variant="circle" size="w-9 h-9" dark={true} className="rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="text" className="w-1/3 h-3" dark={true} />
                                            <Skeleton variant="text" className="w-2/3 h-2" dark={true} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <Skeleton variant="text" className="w-24 h-2 opacity-30" dark={true} />
                                        <Skeleton variant="text" className="w-24 h-8 rounded-xl" dark={true} />
                                    </div>
                                </div>
                            ))
                        ) : pendingTasks.length === 0 ? (
                            <div className="py-16 text-center bg-white/[0.02] border border-white/5 border-dashed rounded-[2.5rem]">
                                <CheckCircle2 className="w-8 h-8 text-slate-700 mx-auto mb-4 opacity-40" />
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest opacity-60">Zero pending tasks detected</p>
                            </div>
                        ) : (
                            pendingTasks.map(task => {
                                const isConsent = isConsentTask(task);
                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-5 rounded-[2rem] border transition-all group ${
                                            isConsent
                                                ? `bg-${accent}-500/[0.04] border-${accent}-500/20 hover:bg-${accent}-500/[0.07]`
                                                : 'bg-[#0B101B]/50 backdrop-blur-xl border-white/10 hover:bg-[#0B101B]/70'
                                        } shadow-xl`}
                                    >
                                        <div className={`flex ${(isMobile || isTablet) ? 'flex-col' : 'items-start justify-between'} gap-6`}>
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                {/* Icon */}
                                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                                    isConsent
                                                        ? `bg-${accent}-500/10 border border-${accent}-500/20 text-${accent}-400`
                                                        : 'bg-white/5 border border-white/10 text-slate-500'
                                                }`}>
                                                    {isConsent
                                                        ? <ShieldCheck className="w-5 h-5" />
                                                        : <Clock className="w-5 h-5" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-sm md:text-base font-black text-white uppercase tracking-tight leading-tight">{task.title}</h4>
                                                        {isConsent && (
                                                            <span className={`text-[8px] md:text-[9px] font-black text-${accent}-400 bg-${accent}-500/10 border border-${accent}-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                                                                Audit
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed font-bold opacity-80 mt-1.5">{task.description}</p>
                                                    
                                                    <div className="flex items-center gap-3 mt-4">
                                                        <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-full">
                                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">
                                                                {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(task.created_at))}
                                                            </p>
                                                        </div>
                                                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
                                                            {new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(new Date(task.created_at))}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`flex ${(isMobile || isTablet) ? 'flex-col mt-2' : 'items-center'} gap-2 shrink-0`}>
                                                {isConsent ? (
                                                    <button
                                                        onClick={() => setReviewTask(task)}
                                                        className={`px-6 py-4 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-[1.25rem] text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-${accent}-900/20 uppercase tracking-widest ${(isMobile || isTablet) ? 'w-full' : ''}`}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {task.task_type === 'LOG_REVIEW' ? 'Review Log' : 'Review Record'}
                                                    </button>
                                                ) : isScreenerReview(task) ? (
                                                    <button
                                                        onClick={() => {
                                                            if (onViewParticipant && task.reference_id) {
                                                                onViewParticipant(task.reference_id, 'Eligibility');
                                                            } else {
                                                                alert('Viewing screening details...');
                                                                markComplete(task.id);
                                                            }
                                                        }}
                                                        className={`px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.25rem] text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-900/20 uppercase tracking-widest ${(isMobile || isTablet) ? 'w-full' : ''}`}
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        Review Submission
                                                    </button>
                                                ) : isOverdueAlert(task) ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSendReminder(task)}
                                                            className="px-5 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-[1.25rem] text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-orange-900/20 uppercase tracking-widest"
                                                        >
                                                            Send Reminder
                                                        </button>
                                                        <button
                                                            onClick={() => markComplete(task.id)}
                                                            className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[1.25rem] text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            alert(`Task finished.`);
                                                            markComplete(task.id);
                                                        }}
                                                        className={`px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.25rem] text-[11px] font-bold flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 shadow-xl shadow-blue-900/20 uppercase tracking-widest ${(isMobile || isTablet) ? 'w-full' : ''}`}
                                                    >
                                                        Finish <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Completed Tasks */}
                <div className="lg:col-span-5 space-y-5">
                    <h3 className="text-lg font-bold text-slate-500 flex items-center gap-3 uppercase tracking-tighter">
                        Finished
                        <span className="text-xs font-bold text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            {completedTasks.length.toString().padStart(2, '0')}
                        </span>
                    </h3>

                    <div className="space-y-2.5">
                        {completedTasks.length === 0 ? (
                            <div className="py-8 text-center text-slate-600 text-sm font-bold uppercase tracking-widest opacity-40">
                                No recently completed tasks
                            </div>
                        ) : (
                            completedTasks.map(task => {
                                const isConsent = isConsentTask(task);
                                return (
                                    <div key={task.id}
                                        className="p-4 bg-transparent border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                                <Check className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-black text-slate-400 line-through opacity-40 leading-tight uppercase tracking-tight">{task.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1 font-bold opacity-60 line-clamp-1">{task.description}</p>
                                            </div>
                                        </div>
                                        {/* Allow viewing completed consent records too */}
                                        {isConsent && task.reference_id && (
                                            <button
                                                onClick={() => setReviewTask(task)}
                                                className="ml-3 p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
                                                title="View consent record"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
