import React from 'react';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { COLORS, ConsentTemplate } from '../ConsentConstants';
import { PDFPage } from '../components/PDFPage';

interface SignatureConfigurationProps {
    activeConsent: ConsentTemplate | undefined;
    setActiveView: (view: string) => void;
    setConfirmModal: (modal: any) => void;
    addToast: (msg: string, type?: string) => void;
    signatureActiveField: string | null;
    setSignatureActiveField: (field: string) => void;
    currentViewerPage: number;
    consents: ConsentTemplate[];
    setConsents: (consents: ConsentTemplate[]) => void;
}

export const SignatureConfiguration: React.FC<SignatureConfigurationProps> = ({
    activeConsent,
    setActiveView,
    setConfirmModal,
    addToast,
    signatureActiveField,
    setSignatureActiveField,
    currentViewerPage,
    consents,
    setConsents
}) => {
    const handlePlaceField = (e: React.MouseEvent) => {
        if (!signatureActiveField || !activeConsent) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const newField = {
            id: 'f' + Date.now(),
            type: signatureActiveField,
            page: currentViewerPage,
            x,
            y
        };

        const updated = {
            ...activeConsent,
            placedFields: [...activeConsent.placedFields, newField]
        };
        setConsents(consents.map(c => c.id === updated.id ? updated : c));
        addToast(`Mapped [${signatureActiveField}] at ${Math.round(x)}% x ${Math.round(y)}%`, 'info');
    };

    const handleDeleteField = (fieldId: string) => {
        if (!activeConsent) return;
        const updated = {
            ...activeConsent,
            placedFields: activeConsent.placedFields.filter((field: any) => field.id !== fieldId)
        };
        setConsents(consents.map(c => c.id === updated.id ? updated : c));
    };

    const S = {
        title: { fontSize: '22px', fontWeight: 900, fontStyle: 'italic' as const, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', color: 'white' },
        label: { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: COLORS.text, opacity: 0.6 },
        btnIndigo: { backgroundColor: COLORS.accent, color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)' },
        btnGhost: { backgroundColor: 'transparent', color: 'white', border: COLORS.border, padding: '1rem 2rem', borderRadius: '8px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem 3rem', borderBottom: COLORS.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button style={S.btnGhost} onClick={() => setActiveView('builder')}><ArrowLeft size={14} /> Back to Builder</button>
                    <div style={{ height: '24px', width: '1px', backgroundColor: COLORS.border }} />
                    <span style={S.title}>Signature Configuration Engine</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{ ...S.btnGhost, color: COLORS.danger, borderColor: COLORS.danger }} onClick={() => setConfirmModal({ message: 'Wipe all signature fields from this protocol?', onConfirm: () => addToast('Field registry cleared', 'warning') })}><Trash2 size={14} /> Clear All</button>
                    <button style={S.btnIndigo} onClick={() => { setActiveView('builder'); addToast('Signature mappings committed'); }}><Save size={14} /> Commit Changes</button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: '240px', borderRight: COLORS.border, padding: '2rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <label style={S.label}>Field Library</label>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { l: 'Participant Signature', c: COLORS.success },
                            { l: 'Participant Date', c: COLORS.info },
                            { l: 'Participant Initials', c: COLORS.warning },
                            { l: 'CC Signature', c: COLORS.accent },
                            { l: 'Witness Signature', c: '#a855f7' },
                            { l: 'PI Verification', c: '#f43f5e' }
                        ].map(tool => (
                            <button 
                                key={tool.l}
                                onClick={() => setSignatureActiveField(tool.l)}
                                style={{ 
                                    ...S.btnGhost, padding: '0.75rem', textAlign: 'left', justifyContent: 'flex-start',
                                    border: `1px solid ${signatureActiveField === tool.l ? tool.c : COLORS.border}`,
                                    backgroundColor: signatureActiveField === tool.l ? `${tool.c}10` : 'transparent',
                                    color: signatureActiveField === tool.l ? 'white' : COLORS.text
                                }}
                            >
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tool.c }} />
                                {tool.l}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, backgroundColor: COLORS.bgDark, overflowY: 'auto', padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="custom-scrollbar">
                    <div 
                        onClick={handlePlaceField}
                        style={{ position: 'relative', cursor: signatureActiveField ? 'crosshair' : 'default' }}
                    >
                        <PDFPage pageNumber={currentViewerPage} placedFields={activeConsent?.placedFields || []} width="800px" />
                    </div>
                </div>

                <div style={{ width: '280px', borderLeft: COLORS.border, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <label style={S.label}>Assigned Nodes</label>
                    <div style={{ marginTop: '1.5rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {activeConsent?.placedFields.map((f: any) => (
                            <div key={f.id} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: COLORS.border }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: 'white' }}>{f.type}</div>
                                    <div style={{ fontSize: '9px', color: COLORS.label }}>Page {f.page} · {Math.round(f.x)}% x {Math.round(f.y)}%</div>
                                </div>
                                <button 
                                    style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}
                                    onClick={() => handleDeleteField(f.id)}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
