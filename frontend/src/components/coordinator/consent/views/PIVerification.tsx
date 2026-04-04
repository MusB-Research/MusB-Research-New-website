import React from 'react';
import { ArrowLeft, Clock, CheckSquare, MousePointer2, ShieldCheck, Download, Edit2, Trash2 } from 'lucide-react';
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
    handleVerify: () => void;
    handleReject: () => void;
    addToast: (msg: string, type?: string) => void;
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
    addToast
}) => {
    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
        badge: (c: string) => ({ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    return (
        <div style={{ flex: 1, display: 'flex', backgroundColor: COLORS.bgDark }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <button style={S.btnGhost} onClick={() => setActiveView('records')}><ArrowLeft size={14} /> Back to Registry</button>
                        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.25rem' }}>
                            <button onClick={() => setPiDocTab('signed')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 900, backgroundColor: piDocTab === 'signed' ? COLORS.accent : 'transparent', color: 'white', cursor: 'pointer' }}>Signed Record</button>
                            <button onClick={() => setPiDocTab('original')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 900, backgroundColor: piDocTab === 'original' ? COLORS.accent : 'transparent', color: 'white', cursor: 'pointer' }}>IRB Original</button>
                        </div>
                    </div>
                    <div style={S.badge(COLORS.accent)}><Clock size={12} /> Received: {activeRecord?.participantSignedDate}</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 0', display: 'flex', justifyContent: 'center' }} className="custom-scrollbar">
                    <PDFPage 
                        pageNumber={activeConsent?.pageCount || 1} 
                        placedFields={activeConsent?.placedFields || []} 
                        width="800px" 
                        signedFields={['Participant Signature', 'Participant Date', 'CC Signature']} 
                        participantId={activeRecord?.participantId || activeRecord?.full_name}
                    />
                </div>
            </div>

            <div style={{ width: '440px', borderLeft: COLORS.border, padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', backgroundColor: COLORS.bg, overflowY: 'auto' }} className="custom-scrollbar">
                <div>
                    <h2 style={{ ...S.title, fontSize: '20px' }}>Protocol Verification</h2>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={S.label}>Participant:</span>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: 'white' }}>{activeRecord?.participantId || activeRecord?.full_name}</span>
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

                <div 
                    style={{ padding: '2rem', border: `2px dashed ${piSignature ? COLORS.success : COLORS.accent}`, borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }} 
                    onClick={() => setPiSignature(!piSignature)}
                >
                    {piSignature ? (
                        <div>
                            <div style={{ fontFamily: 'cursive', fontSize: '28px', color: COLORS.success }}>Dr. Yadav — PI</div>
                            <div style={{ fontSize: '10px', color: COLORS.label, marginTop: '0.5rem' }}>TIMESTAMP: {new Date().toLocaleString()}</div>
                        </div>
                    ) : (
                        <div style={{ opacity: 0.3 }}>
                            <MousePointer2 size={32} style={{ marginBottom: '1rem' }} className="mx-auto" />
                            <div style={S.label}>Click to apply PI Signature</div>
                        </div>
                    )}
                </div>

                <div>
                    <label style={S.label}>Assurance Notes</label>
                    <textarea 
                        value={piNotes}
                        onChange={(e) => setPiNotes(e.target.value)}
                        placeholder="Add verification notes or flags..."
                        style={{ width: '100%', height: '120px', backgroundColor: 'rgba(0,0,0,0.2)', border: COLORS.border, borderRadius: '8px', padding: '1rem', color: 'white', fontSize: '14px', outline: 'none', marginTop: '1rem', resize: 'none' }}
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
                        style={{ ...S.btnIndigo, flex: 1, opacity: piSignature ? 1 : 0.5, cursor: piSignature ? 'pointer' : 'not-allowed' }}
                        onClick={handleVerify}
                        disabled={!piSignature}
                    >
                        <ShieldCheck size={18} /> Verify Protocol
                    </button>
                </div>
            </div>
        </div>
    );
};
