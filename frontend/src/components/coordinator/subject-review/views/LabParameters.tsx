import React from 'react';
import { COLORS, S } from '../SubRevConstants';

interface LabParametersProps {
    participant: any;
}

export const LabParameters: React.FC<LabParametersProps> = ({ participant }) => {
    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div>
                <h3 style={S.title}>Longitudinal Clinical Parameters</h3>
                <div style={{ marginTop: '2rem', ...S.card, padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${COLORS.border}` }}>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Parameter</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Screening</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Visit 1</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Visit 2</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', ...S.label }}>Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { p: 'Hemoglobin (g/dL)', v1: '14.2', v2: '13.8', v3: '14.0', ref: '12.0 - 16.0' },
                                { p: 'Glucose (mg/dL)', v1: '92', v2: '105', v3: '98', ref: '70 - 110', alert: true },
                                { p: 'AST (U/L)', v1: '22', v2: '25', v3: '24', ref: '10 - 40' },
                                { p: 'ALT (U/L)', v1: '28', v2: '30', v3: '29', ref: '7 - 56' }
                            ].map((r, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', fontWeight: 'bold' }}>{r.p}</td>
                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px' }}>{r.v1}</td>
                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px', color: r.alert ? COLORS.warning : 'white' }}>{r.v2}</td>
                                    <td style={{ padding: '1.25rem 2rem', fontSize: '13px' }}>{r.v3}</td>
                                    <td style={{ padding: '1.25rem 2rem', fontSize: '11px', color: COLORS.label }}>{r.ref}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
