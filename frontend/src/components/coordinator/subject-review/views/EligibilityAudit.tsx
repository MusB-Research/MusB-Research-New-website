import React from 'react';
import { CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';

interface EligibilityAuditProps {
    participant: any;
    screeningNotes: string;
    setScreeningNotes: (val: string) => void;
    logAction: (action: string, detail: string) => void;
}

export const EligibilityAudit: React.FC<EligibilityAuditProps> = ({ 
    participant, screeningNotes, setScreeningNotes, logAction 
}) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={S.card}>
                <label style={S.label}>Inclusion Criteria Registry</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    {participant.inclusions.map((inc: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            {inc.met ? <CheckCircle2 size={16} color={COLORS.success} /> : <X size={16} color={COLORS.danger} />}
                            <span style={{ fontSize: '14px', color: inc.met ? 'white' : COLORS.text }}>{inc.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={S.card}>
                <label style={S.label}>Exclusion Criteria Registry</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    {participant.exclusions.map((exc: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: exc.present ? `${COLORS.danger}10` : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: exc.present ? `1px solid ${COLORS.danger}30` : 'none' }}>
                            {exc.present ? <AlertTriangle size={16} color={COLORS.danger} /> : <CheckCircle2 size={16} color={COLORS.success} />}
                            <span style={{ fontSize: '14px', color: exc.present ? COLORS.danger : 'white' }}>{exc.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ gridColumn: '1 / -1', ...S.card }}>
                <label style={S.label}>Screening Methodology Notes</label>
                <textarea 
                    style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: 'white', padding: '1.5rem', fontSize: '14px', outline: 'none', minHeight: '120px' }}
                    placeholder="Enter proprietary clinical observations..."
                    value={screeningNotes}
                    onBlur={() => logAction('Note Saved', 'PI updated screening methodology notes.')}
                    onChange={e => setScreeningNotes(e.target.value)}
                />
            </div>
        </div>
    );
};
