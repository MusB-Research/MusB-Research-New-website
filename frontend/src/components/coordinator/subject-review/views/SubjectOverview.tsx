import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';

interface SubjectOverviewProps {
    participant: any;
    alerts: any[];
    setParticipant: React.Dispatch<React.SetStateAction<any>>;
    addToast: (msg: string, type?: string) => void;
    logAction: (action: string, detail: string) => void;
}

export const SubjectOverview: React.FC<SubjectOverviewProps> = ({ 
    participant, alerts, setParticipant, addToast, logAction 
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {alerts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {alerts.map(a => (
                        <div key={a.id} style={{ padding: '0.6rem 1rem', borderRadius: '4px', backgroundColor: `${a.color}15`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertCircle size={14} color={a.color} />
                            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: a.color }}>{a.text}</span>
                            <X size={12} color={a.color} style={{ cursor: 'pointer' }} />
                        </div>
                    ))}
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {[
                    { l: 'Participant Age', v: participant.age },
                    { l: 'Biological Sex', v: participant.sex },
                    { l: 'Assigned Study Arm', v: participant.arm },
                    { l: 'Enrollment Date', v: participant.enrollmentDate },
                    { l: 'Study Node', v: participant.site },
                    { l: 'Assigned Coordinator', v: participant.coordinator }
                ].map((item, i) => (
                    <div key={i} style={S.card}>
                        <label style={S.label}>{item.l}</label>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.v}</div>
                    </div>
                ))}
            </div>
            <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${COLORS.accent}30` }}>
                <div>
                    <label style={S.label}>Enrollment Readiness</label>
                    <div style={{ fontSize: '24px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{participant.eligibility} Verification</div>
                </div>
                <button style={S.btnPrimary} onClick={() => {
                    setParticipant((p: any) => ({ ...p, eligibility: 'Approved' }));
                    addToast('Participant Eligibility Approved');
                    logAction('Eligibility Approved', 'PI manually verified and approved participant entry.');
                }}>Approve Eligibility</button>
            </div>
        </div>
    );
};
