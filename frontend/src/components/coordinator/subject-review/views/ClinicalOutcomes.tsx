import React from 'react';
import { COLORS, S } from '../SubRevConstants';

interface ClinicalOutcomesProps {
    participant: any;
}

export const ClinicalOutcomes: React.FC<ClinicalOutcomesProps> = ({ participant }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Trend Graph - Raw SVG */}
            <div style={{ ...S.card, height: '300px', display: 'flex', flexDirection: 'column' }}>
                <label style={S.label}>Aggregate Symptom Velocity</label>
                <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                    {/* Gridlines */}
                    {[0, 50, 100, 150].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
                    {/* Baseline Line */}
                    <path d="M 0 160 L 500 160 L 1000 160" fill="none" stroke="rgba(255,255,255,0.1)" strokeLinecap="round" strokeDasharray="5,5" />
                    {/* Actual Trend Line */}
                    <path 
                        d="M 50 160 L 500 120 L 950 80" 
                        fill="none" stroke={COLORS.accent} strokeWidth="3" strokeLinejoin="round" />
                    {/* Data Points */}
                    <circle cx="50" cy="160" r="6" fill={COLORS.accent} />
                    <circle cx="500" cy="120" r="6" fill={COLORS.accent} />
                    <circle cx="950" cy="80" r="6" fill={COLORS.accent} />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', color: COLORS.label, fontSize: '10px', fontWeight: 900 }}>
                    <span>BASELINE</span>
                    <span>WEEK 2</span>
                    <span>WEEK 4</span>
                </div>
            </div>

            <div style={S.card}>
                <label style={S.label}>Individual Symptom Matrics</label>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}`, textAlign: 'left' }}>
                            {['Metric', 'Baseline', 'Week 2', 'Week 4', 'Improvement', 'Trend'].map(h => (
                                <th key={h} style={{ padding: '1rem', ...S.label }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {participant.symptoms.map((s: any, i: number) => {
                            const improvement = ((s.baseline - s.week4) / s.baseline * 100).toFixed(0);
                            return (
                                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.name}</td>
                                    <td style={{ padding: '1rem' }}>{s.baseline}</td>
                                    <td style={{ padding: '1rem' }}>{s.week2}</td>
                                    <td style={{ padding: '1rem' }}>{s.week4}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ color: COLORS.success, fontWeight: 900 }}>-{improvement}%</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <svg width="60" height="20">
                                            <path 
                                                d={`M 0 20 L 30 ${20 - (s.baseline - s.week2)*2} L 60 ${20 - (s.baseline - s.week4)*2}`} 
                                                fill="none" stroke={COLORS.success} strokeWidth="2" />
                                        </svg>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
