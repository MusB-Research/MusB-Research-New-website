import React from 'react';
import { ShieldAlert, Activity, FileText } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';

interface SafetySignalsProps {
    participant: any;
}

export const SafetySignals: React.FC<SafetySignalsProps> = ({ participant }) => {
    return (
        <div className="p-4 md:p-8 flex flex-col gap-8 md:gap-12">
            <div>
                <h3 style={S.title}>Adverse Event Registry</h3>
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {participant.adverseEvents.map((ae: any, i: number) => (
                        <div key={i} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '15px', fontWeight: 900, color: COLORS.danger }}>{ae.event.toUpperCase()}</span>
                                <span style={S.badge(COLORS.danger)}>SERIOUS AE (SAE)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
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
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {(participant.daily_logs || []).map((log: any, i: number) => {
                        const hasAE = log.noticed_side_effects;
                        return (
                            <div key={i} style={{...S.card, borderLeft: hasAE ? '4px solid #F59E0B' : `1px solid ${COLORS.border}`}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: hasAE ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Activity size={16} color={hasAE ? '#F59E0B' : COLORS.accent} />
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: hasAE ? '#F59E0B' : 'white' }}>DAILY LOG: {new Date(log.date).toLocaleDateString()}</span>
                                    </div>
                                    <span style={{...S.badge(hasAE ? '#F59E0B' : COLORS.success), color: 'white'}}>{log.is_draft ? 'DRAFT' : 'FINALIZED'}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <label style={S.label}>Medication</label>
                                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: log.took_medicine ? COLORS.success : COLORS.danger }}>
                                            {log.took_medicine ? 'TAKEN' : 'MISSED'}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={S.label}>Wellness</label>
                                        <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{log.overall_feeling || 'Not Rated'}</p>
                                    </div>
                                    <div>
                                        <label style={S.label}>Side Effects</label>
                                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: hasAE ? COLORS.danger : COLORS.success }}>
                                            {hasAE ? 'YES' : 'NO'}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={S.label}>Dose</label>
                                        <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{log.full_dose ? 'FULL' : 'PARTIAL'}</p>
                                    </div>
                                    
                                    {log.side_effect_description && (
                                        <div style={{ gridColumn: 'span 4', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <label style={S.label}>AE Description</label>
                                            <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.5 }}>{log.side_effect_description}</p>
                                        </div>
                                    )}

                                    {log.supporting_file && (
                                        <div style={{ gridColumn: 'span 4' }}>
                                            <label style={S.label}>Supporting Evidence / Photo</label>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <a 
                                                    href={log.supporting_file} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.5rem', 
                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                                                        color: '#60A5FA', 
                                                        padding: '0.75rem 1.25rem', 
                                                        borderRadius: '10px',
                                                        fontSize: '11px',
                                                        fontWeight: 900,
                                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                                        textDecoration: 'none',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}
                                                >
                                                    <FileText size={14} />
                                                    View Attached Document
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {!(participant.daily_logs || []).length && (
                        <div style={{ ...S.card, textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                            <p style={S.title}>No Health Logs Recorded</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};


