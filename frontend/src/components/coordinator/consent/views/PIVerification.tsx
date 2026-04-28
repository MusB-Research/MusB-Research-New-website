import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Clock, 
    CheckSquare, 
    MousePointer2, 
    ShieldCheck, 
    Save,
    Plus,
    X
} from 'lucide-react';
import { COLORS, ConsentRecord, ConsentTemplate } from '../ConsentConstants';
import { PDFPage } from '../components/PDFPage';

interface PIVerificationProps {
    activeRecord: ConsentRecord | undefined;
    activeConsent: ConsentTemplate | undefined;
    setActiveView: (view: string) => void;
    piDocTab: string;
    setPiDocTab: (tab: string) => void;
    piSignature: boolean;
    setPiSignature: (sig: boolean) => void;
    piNotes: string;
    setPiNotes: (notes: string) => void;
    handleVerify: (mode: 'COORDINATOR' | 'PI', signature?: string, name?: string) => void;
    handleReject: () => void;
    addToast: (message: string, type?: string) => void;
    activeView?: string;
}

export const PIVerification: React.FC<PIVerificationProps> = ({
    activeRecord,
    activeConsent,
    setActiveView,
    piDocTab,
    setPiDocTab,
    piSignature,
    setPiSignature,
    piNotes,
    setPiNotes,
    handleVerify,
    handleReject,
    addToast,
    activeView
}) => {
    const [signingRole, setSigningRole] = React.useState<'COORDINATOR' | 'PI' | null>(null);
    const [typedName, setTypedName] = React.useState('');
    const [signatureType, setSignatureType] = React.useState<'DRAW' | 'TYPE'>('DRAW');
    const [typedSignature, setTypedSignature] = React.useState('');
    const [isSubmittingLocal, setIsSubmittingLocal] = React.useState(false);
    
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [hasCanvasSigned, setHasCanvasSigned] = React.useState(false);

    React.useEffect(() => {
        if (signingRole && signatureType === 'DRAW' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
            }
        }
    }, [signingRole, signatureType]);

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const draw = (e: any) => {
        if (!isDrawing || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            if (e.type === 'mousedown' || e.type === 'touchstart') {
                ctx.beginPath();
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
                ctx.stroke();
                setHasCanvasSigned(true);
            }
        }
    };

    const onExecuteSign = async () => {
        if (!typedName) {
            addToast('Legal Full Name is required for clinical audit', 'warning');
            return;
        }

        const sig = signatureType === 'DRAW' ? canvasRef.current?.toDataURL() : typedSignature || typedName;
        if (!sig || (signatureType === 'DRAW' && !hasCanvasSigned)) {
            addToast('Please provide your digital signature', 'warning');
            return;
        }

        setIsSubmittingLocal(true);
        await handleVerify(signingRole!, sig, typedName);
        setIsSubmittingLocal(false);
        setSigningRole(null);
        setTypedName('');
        setHasCanvasSigned(false);
    };

    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    return (
        <div style={{ flex: 1, display: 'flex', backgroundColor: COLORS.bgDark, overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <button style={S.btnGhost} onClick={() => setActiveView('records')}><ArrowLeft size={14} /> Back to Registry</button>
                        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.25rem' }}>
                            <button onClick={() => setPiDocTab('signed')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 900, backgroundColor: piDocTab === 'signed' ? COLORS.accent : 'transparent', color: 'white', cursor: 'pointer' }}>Signed Record</button>
                            <button onClick={() => setPiDocTab('original')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 900, backgroundColor: piDocTab === 'original' ? COLORS.accent : 'transparent', color: 'white', cursor: 'pointer' }}>IRB Original</button>
                        </div>
                    </div>
                    <div style={S.badge(COLORS.accent)}><Clock size={12} /> Received: {activeRecord?.participantSignedDate}</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 0', display: 'flex', justifyContent: 'center', backgroundColor: COLORS.bgDark }} className="custom-scrollbar">
                    {piDocTab === 'signed' && activeRecord?.signed_pdf_url ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ width: '90%', maxWidth: '900px', height: '1200px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                        >
                            <iframe 
                                src={`${activeRecord.signed_pdf_url}#toolbar=0`}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="Signed Consent Record"
                            />
                        </motion.div>
                    ) : piDocTab === 'original' && activeConsent?.file_url ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ width: '90%', maxWidth: '900px', height: '1200px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                        >
                            <iframe 
                                src={`${activeConsent.file_url}#toolbar=0`}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="Original IRB Template"
                            />
                        </motion.div>
                    ) : (
                        <PDFPage 
                            pageNumber={activeConsent?.pageCount || 1} 
                            placedFields={activeConsent?.placedFields || []} 
                            width="800px" 
                            signedFields={['Participant Signature', 'Participant Date', 'CC Signature']} 
                            participantId={activeRecord?.participantId || activeRecord?.full_name}
                        />
                    )}
                </div>
            </div>

            <div style={{ width: '440px', borderLeft: COLORS.border, padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', backgroundColor: COLORS.bg, overflowY: 'auto' }} className="custom-scrollbar">
                <div>
                    <h2 style={{ ...S.title, fontSize: '20px' }}>Protocol Verification</h2>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={S.label}>Participant:</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>{activeRecord?.participantId || activeRecord?.full_name}</span>
                    </div>
                </div>

                <div>
                    <label style={S.label}>Validation Checklist</label>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { l: `Correct Protocol Version (${activeRecord?.template_version || 'v1.0'})`, v: true },
                            { l: 'Participant Identity Verification', v: true },
                            { l: 'All Signature Nodes Captured', v: true },
                            { l: 'Clinical Coordinator Sign-off', v: true },
                            { l: 'IRB Metadata Synchronized', v: true }
                        ].map(row => (
                            <div key={row.l} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <CheckSquare size={18} color={COLORS.success} />
                                <span style={{ fontSize: '13px', color: 'white' }}>{row.l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* NODE 01: COORDINATOR */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={14} className={activeRecord?.cc_signature ? "text-emerald-400" : "text-indigo-400"} />
                                <span style={S.label}>Node 01: Clinical Coordinator</span>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.1em' }}>MANDATORY</span>
                        </div>
                        <div 
                            style={{ 
                                padding: '2rem', 
                                border: `1.5px solid ${activeRecord?.cc_signature ? COLORS.success + '40' : COLORS.accent + '20'}`, 
                                borderRadius: '16px', 
                                textAlign: 'center', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s',
                                backgroundColor: activeRecord?.cc_signature ? COLORS.success + '05' : 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(10px)'
                            }} 
                            onClick={() => !activeRecord?.cc_signature && setSigningRole('COORDINATOR')}
                        >
                            {activeRecord?.cc_signature ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <CheckSquare size={24} color={COLORS.success} style={{ marginBottom: '12px' }} />
                                    <div style={{ fontFamily: 'monospace', fontSize: '18px', color: COLORS.success, fontWeight: 900, letterSpacing: '2px' }}>VERIFIED</div>
                                    <div style={{ fontSize: '10px', color: COLORS.label, marginTop: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>{activeRecord?.cc_name || 'Clinical Seal Applied'}</div>
                                </motion.div>
                            ) : (
                                <div style={{ opacity: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <MousePointer2 size={24} style={{ marginBottom: '0.75rem' }} className="text-indigo-400" />
                                    <div style={{ ...S.label, fontSize: '11px', fontWeight: 800 }}>Execute Coordinator ID Auth</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PI Node View updated to support sign workflow */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={14} className={activeRecord?.pi_verified ? "text-blue-400" : "text-slate-500"} />
                                <span style={S.label}>Node 02: Research PI</span>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', letterSpacing: '0.1em' }}>OPTIONAL</span>
                        </div>
                        <div 
                            style={{ 
                                padding: '2rem', 
                                border: `1.5px solid ${activeRecord?.pi_verified ? COLORS.accent + '40' : 'rgba(255,255,255,0.05)'}`, 
                                borderRadius: '16px', 
                                textAlign: 'center', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s',
                                backgroundColor: activeRecord?.pi_verified ? COLORS.accent + '05' : 'rgba(0,0,0,0.2)',
                                opacity: !activeRecord?.cc_signature ? 0.3 : 1
                            }} 
                            onClick={() => {
                                if (activeRecord?.cc_signature) {
                                    if (!activeRecord?.pi_verified) setSigningRole('PI');
                                } else {
                                    addToast('Coordinator protocol sign-off required first', 'warning');
                                }
                            }}
                        >
                            {activeRecord?.pi_verified ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <ShieldCheck size={24} color={COLORS.accent} style={{ marginBottom: '12px' }} />
                                    <div style={{ fontFamily: 'monospace', fontSize: '18px', color: COLORS.accent, fontWeight: 900, letterSpacing: '2px' }}>CONFIRMED</div>
                                    <div style={{ fontSize: '10px', color: COLORS.label, marginTop: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>{activeRecord?.pi_name || 'PI Oversight Applied'}</div>
                                </motion.div>
                            ) : (
                                <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Plus size={20} style={{ marginBottom: '0.75rem' }} className="text-slate-500" />
                                    <div style={{ ...S.label, fontSize: '11px', fontWeight: 800 }}>Apply Optional PI Review</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SIGNATURE DRAWER/MODAL FOR STAFF */}
                <AnimatePresence>
                    {signingRole && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 500, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ width: '100%', maxWidth: '600px', backgroundColor: COLORS.bg, border: COLORS.border, borderRadius: '32px', padding: '3rem', position: 'relative' }}>
                                <button onClick={() => setSigningRole(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: COLORS.text, cursor: 'pointer' }}><X size={24} /></button>
                                
                                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                    <ShieldCheck size={32} color={COLORS.accent} style={{ margin: '0 auto 1rem' }} />
                                    <h3 style={S.title}>Staff Authentication</h3>
                                    <p style={{ ...S.label, fontSize: '10px', marginTop: '0.5rem' }}>Role: <span style={{ color: COLORS.accent }}>{signingRole}</span></p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <div>
                                        <label style={{ ...S.label, marginBottom: '0.75rem', display: 'block' }}>Legal Full Name</label>
                                        <input 
                                            type="text" 
                                            value={typedName}
                                            onChange={(e) => setTypedName(e.target.value)}
                                            placeholder="Enter your full name for audit"
                                            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: COLORS.border, borderRadius: '12px', padding: '1rem', color: 'white', fontWeight: 700, outline: 'none' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={() => setSignatureType('DRAW')} style={{ flex: 1, borderRadius: '12px', padding: '0.75rem', backgroundColor: signatureType === 'DRAW' ? COLORS.accent + '20' : 'transparent', border: COLORS.border, color: 'white', fontSize: '11px', fontWeight: 900 }}>HAND DRAWN</button>
                                        <button onClick={() => setSignatureType('TYPE')} style={{ flex: 1, borderRadius: '12px', padding: '0.75rem', backgroundColor: signatureType === 'TYPE' ? COLORS.accent + '20' : 'transparent', border: COLORS.border, color: 'white', fontSize: '11px', fontWeight: 900 }}>TYPED ID</button>
                                    </div>

                                    <div style={{ height: '200px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '16px', border: COLORS.border, overflow: 'hidden', position: 'relative' }}>
                                        {signatureType === 'DRAW' ? (
                                            <canvas 
                                                ref={canvasRef}
                                                width={536}
                                                height={200}
                                                style={{ cursor: 'crosshair', width: '100%', height: '100%' }}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                        ) : (
                                            <input 
                                                type="text"
                                                value={typedSignature}
                                                onChange={(e) => setTypedSignature(e.target.value)}
                                                placeholder="Sign your name"
                                                style={{ width: '100%', height: '100%', background: 'none', border: 'none', textAlign: 'center', fontSize: '42px', fontFamily: '"Yellowtail", cursive', color: COLORS.accent, outline: 'none' }}
                                            />
                                        )}
                                        {!hasCanvasSigned && signatureType === 'DRAW' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.3, letterSpacing: '4px', fontSize: '10px', fontWeight: 900, color: 'white' }}>SIGN HERE</div>}
                                    </div>

                                    <button 
                                        onClick={onExecuteSign}
                                        disabled={isSubmittingLocal}
                                        style={{ ...S.btnIndigo, width: '100%', padding: '1.25rem', marginTop: '1rem' }}
                                    >
                                        {isSubmittingLocal ? 'EXECUTING AUTH...' : 'COMMIT DIGITAL SIGNATURE'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div>
                    <label style={S.label}>Assurance Notes</label>
                    <textarea 
                        value={piNotes}
                        onChange={(e) => setPiNotes(e.target.value)}
                        placeholder="Add verification notes or flags..."
                        style={{ width: '100%', height: '100px', backgroundColor: 'rgba(0,0,0,0.2)', border: COLORS.border, borderRadius: '8px', padding: '1rem', color: 'white', fontSize: '14px', outline: 'none', marginTop: '1rem', resize: 'none' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: 'auto' }}>
                    <button 
                        style={{ ...S.btnGhost, flex: 1, borderColor: COLORS.danger, color: COLORS.danger }}
                        onClick={handleReject}
                    >
                        Reject Record
                    </button>
                    <button 
                        style={{ ...S.btnIndigo, flex: 1, opacity: (activeRecord?.cc_signature || signingRole) ? 1 : 0.5, cursor: (activeRecord?.cc_signature || signingRole) ? 'pointer' : 'not-allowed' }}
                        onClick={() => {
                            if (piSignature && !activeRecord?.pi_verified) setSigningRole('PI');
                            else if (!activeRecord?.cc_signature) setSigningRole('COORDINATOR');
                            else handleVerify(piSignature ? 'PI' : 'COORDINATOR');
                        }}
                        disabled={!activeRecord?.cc_signature && !signingRole && activeView !== 'pi-verify'}
                    >
                        <Save size={18} /> Finalize Sync
                    </button>
                </div>
            </div>
        </div>
    );
};
