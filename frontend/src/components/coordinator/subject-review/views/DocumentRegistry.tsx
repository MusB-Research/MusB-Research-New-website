import React from 'react';
import { FileText, ArrowUpRight } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';

interface DocumentRegistryProps {
    participant: any;
}

export const DocumentRegistry: React.FC<DocumentRegistryProps> = ({ participant }) => {
    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div>
                <h3 style={S.title}>Participant Document Repository</h3>
                <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {[
                        { n: 'Signed Informed Consent', d: '2026-04-01', v: '1.0', t: 'PDF' },
                        { n: 'Medical History Report', d: '2026-03-28', v: '2.1', t: 'PDF' },
                        { n: 'Lab Results - Visit 2', d: '2026-04-10', v: '1.0', t: 'XLSX' },
                        { n: 'ECG Recording', d: '2026-04-10', v: '1.0', t: 'EDF' }
                    ].map((doc, i) => (
                        <div key={i} style={S.card} className="group">
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={20} color={COLORS.accent} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{doc.n}</div>
                                    <div style={{ fontSize: '11px', color: COLORS.label }}>v{doc.v} • {doc.d}</div>
                                </div>
                                <button style={{ ...S.btnGhost, padding: '0.5rem', opacity: 0.5 }} className="group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
