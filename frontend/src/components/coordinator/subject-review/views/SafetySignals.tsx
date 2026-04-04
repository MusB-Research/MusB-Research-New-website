import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';

interface SafetySignalsProps {
    participant: any;
}

export const SafetySignals: React.FC<SafetySignalsProps> = ({ participant }) => {
    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div>
                <h3 style={S.title}>Adverse Event Registry</h3>
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {participant.adverseEvents.map((ae: any, i: number) => (
                        <div key={i} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '15px', fontWeight: 900, color: COLORS.danger }}>{ae.event.toUpperCase()}</span>
                                <span style={S.badge(COLORS.danger)}>SERIOUS AE (SAE)</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                                <div>
                                    <label style={S.label}>Severity</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.severity}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Relatedness</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.relatedness}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Status</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.status}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Onset Date</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{ae.onset}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {participant.adverseEvents.length === 0 && (
                        <div style={{ ...S.card, textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                            <ShieldAlert size={48} style={{ marginBottom: '1rem' }} />
                            <p style={S.title}>No Safety Signals Detected</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
