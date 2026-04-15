import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Clock, Activity, ChevronRight, Check, X,
    FileText, Eye, ShieldCheck, AlertCircle, ExternalLink,
    Download, Pen, ZoomIn, ZoomOut
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

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
}

// ─── PDF / Consent Viewer Modal ───────────────────────────────────────────────
function ConsentReviewModal({
    task,
    primaryColor,
    onClose,
    onCoSigned,
}: {
    task: StaffTask;
    primaryColor: string;
    onClose: () => void;
    onCoSigned: (taskId: string) => void;
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
                className="bg-[#0B101B] border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl bg-${accent}-500/10 border border-${accent}-500/20 flex items-center justify-center`}>
                            <FileText className={`w-5 h-5 text-${accent}-400`} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase italic tracking-tight">
                                Co-Sign Consent Form
                            </h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                {task.description}
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
                            <button onClick={() => onCoSigned(task.id)} className="text-[11px] font-black text-slate-400 px-5 py-2 border border-white/5 rounded-full hover:bg-white/5 transition-all uppercase italic">Dismiss Orphaned Task</button>
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
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                                        <p className="text-[12px] font-black text-white mt-1 uppercase tracking-tight truncate">{value}</p>
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
                                            <h4 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">Apply Co-Signature</h4>
                                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Provide your digital authentication to finalize this consent record.</p>
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
                            ) : pdfUrl ? (
                                <>
                                    {/* PDF Toolbar */}
                                    <div className="flex items-center justify-between px-7 py-2.5 border-b border-white/5 bg-white/[0.02] shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Signed Consent Document</span>
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
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
                                    <FileText className="w-10 h-10 text-slate-700 opacity-50" />
                                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest">No PDF or signature data available yet</p>
                                </div>
                            )}
                        </div>

                        {/* Footer: Co-Sign Action */}
                        <div className="px-7 py-5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3">
                                {signed ? (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest">Co-Signature Verified</span>
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
                                    ) : (
                                        <button
                                            onClick={() => setSignatureStep(true)}
                                            className={`px-7 py-3 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95`}
                                        >
                                            <Pen className="w-3.5 h-3.5" />
                                            Proceed to Sign
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
}

export default function StaffTasksModule({ primaryColor = 'indigo', onRefresh }: StaffTasksModuleProps) {
    const [tasks, setTasks] = useState<StaffTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewTask, setReviewTask] = useState<StaffTask | null>(null);

    const isConsentTask = (t: StaffTask) =>
        t.task_type === 'CONSENT_SIGNATURE' ||
        t.task_type === 'CONSENT_COORDINATOR_SIGN' ||
        t.task_type === 'FORM_SIGNATURE';

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
        fetchTasks();
    }, []);

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

    const pendingTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    const accent = primaryColor === 'indigo' ? 'indigo' : 'blue';

    if (loading) {
        return (
            <div className="py-24 text-center">
                <Activity className="w-10 h-10 text-slate-700 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Loading your tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Consent Review Modal */}
            <AnimatePresence>
                {reviewTask && (
                    <ConsentReviewModal
                        task={reviewTask}
                        primaryColor={primaryColor}
                        onClose={() => setReviewTask(null)}
                        onCoSigned={handleCoSigned}
                    />
                )}
            </AnimatePresence>

            {/* Premium SaaS Header Section */}
            <div className="flex items-end justify-between pb-8 border-b border-white/[0.07] mb-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">My Tasks</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Outstanding Actions and Signatures</p>
                </div>
                
                <div className="flex items-center gap-4 text-slate-500/50 pb-1.5 transition-opacity hover:opacity-100 opacity-60">
                    <div className="w-12 h-px bg-white/10 hidden md:block" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Completed History</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Pending Tasks */}
                <div className="lg:col-span-7 space-y-5">
                    <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
                        Pending Tasks
                        <span className="text-xs font-black text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            {pendingTasks.length.toString().padStart(2, '0')}
                        </span>
                    </h3>

                    <div className="space-y-3">
                        {pendingTasks.length === 0 ? (
                            <div className="py-12 text-center">
                                <CheckCircle2 className="w-7 h-7 text-slate-700 mx-auto mb-4 opacity-40" />
                                <p className="text-sm text-slate-500 font-black uppercase tracking-widest opacity-60">No pending tasks</p>
                            </div>
                        ) : (
                            pendingTasks.map(task => {
                                const isConsent = isConsentTask(task);
                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-5 rounded-2xl border transition-all group ${
                                            isConsent
                                                ? `bg-${accent}-500/[0.04] border-${accent}-500/20 hover:bg-${accent}-500/[0.07]`
                                                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                {/* Icon */}
                                                <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isConsent
                                                        ? `bg-${accent}-500/10 border border-${accent}-500/20`
                                                        : 'bg-white/5 border border-white/10'
                                                }`}>
                                                    {isConsent
                                                        ? <ShieldCheck className={`w-4 h-4 text-${accent}-400`} />
                                                        : <Clock className="w-4 h-4 text-slate-500" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{task.title}</h4>
                                                        {isConsent && (
                                                            <span className={`text-[9px] font-black text-${accent}-400 bg-${accent}-500/10 border border-${accent}-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                                                                Consent Review
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed font-bold opacity-80 mt-1">{task.description}</p>
                                                    <p className="text-[10px] text-slate-600 mt-2.5 font-black uppercase tracking-widest">
                                                        {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.created_at))}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isConsent ? (
                                                    <button
                                                        onClick={() => setReviewTask(task)}
                                                        className={`px-5 py-2.5 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-${accent}-900/20 uppercase tracking-widest`}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Review & Co-Sign
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => markComplete(task.id)}
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-all active:scale-95 shadow-lg shadow-blue-900/20 uppercase tracking-widest"
                                                    >
                                                        Complete <ChevronRight className="w-4 h-4" />
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
                    <h3 className="text-lg font-black text-slate-500 flex items-center gap-3 uppercase tracking-tighter italic">
                        Completed
                        <span className="text-xs font-black text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
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
