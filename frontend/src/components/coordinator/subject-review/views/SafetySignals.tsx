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
            
            <div>
                <h3 style={S.title}>Subject Daily Health Logs</h3>
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(participant.daily_logs || []).filter((log: any) => log.noticed_side_effects).map((log: any, i: number) => (
                        <div key={i} style={{...S.card, borderLeft: '4px solid #F59E0B'}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '13px', fontWeight: 900, color: '#F59E0B' }}>SIDE EFFECT REPORTED: {log.date}</span>
                                <span style={{...S.badge('#F59E0B'), color: 'white'}}>DAILY LOG SIGNAL</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                                <div>
                                    <label style={S.label}>Severity</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.severity || 'Not Rated'}</p>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={S.label}>Description</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.side_effect_description}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Care Sought?</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.sought_medical_care ? 'YES' : 'NO'}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Medication Taken?</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.took_medicine ? 'YES' : 'NO'}</p>
                                </div>
                                <div>
                                    <label style={S.label}>Interfered with Activities?</label>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.interfered_daily_activities ? 'YES' : 'NO'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!(participant.daily_logs || []).some((log: any) => log.noticed_side_effects) && (
                        <div style={{ ...S.card, textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                            <p style={{...S.title, fontSize: '14px'}}>No side effects reported in daily logs</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


