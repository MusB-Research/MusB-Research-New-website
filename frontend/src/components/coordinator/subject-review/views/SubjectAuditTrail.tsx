import React from 'react';
import { COLORS, S } from '../SubRevConstants';

interface SubjectAuditTrailProps {
    auditLog: any[];
}

export const SubjectAuditTrail: React.FC<SubjectAuditTrailProps> = ({ auditLog }) => {
    return (
        <div style={S.card}>
            <label style={S.label}>Node Transaction Log</label>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}`, textAlign: 'left' }}>
                        {['Timestamp', 'Entity', 'Operation', 'Trace Details'].map(h => (
                            <th key={h} style={{ padding: '1rem', ...S.label }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {auditLog.map((e, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: '12px' }}>
                            <td style={{ padding: '1rem', color: COLORS.label }}>{e.timestamp}</td>
                            <td style={{ padding: '1rem', fontWeight: 900, color: COLORS.accent }}>{e.user} [{e.role}]</td>
                            <td style={{ padding: '1rem', color: 'white' }}>{e.action}</td>
                            <td style={{ padding: '1rem', color: COLORS.text }}>{e.details}</td>
                        </tr>
                    ))}
                    {auditLog.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: COLORS.label, fontStyle: 'italic' }}>No audit transactions recorded for this session.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
