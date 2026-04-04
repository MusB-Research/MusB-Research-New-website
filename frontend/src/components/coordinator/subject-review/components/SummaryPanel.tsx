import React from 'react';
import { COLORS, S } from '../SubRevConstants';

interface SummaryPanelProps {
    participant: any;
    setActiveTab: (tab: string) => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ participant, setActiveTab }) => {
    return (
        <aside style={S.rightSummary}>
            <div>
                <label style={S.label}>Clinical Triage</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: COLORS.label }}>Eligibility</span>
                        <span style={{ color: participant.eligibility === 'Approved' ? COLORS.success : COLORS.warning, fontWeight: 'bold' }}>{participant.eligibility}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: COLORS.label }}>Consent</span>
                        <span style={{ color: COLORS.success, fontWeight: 'bold' }}>{participant.consent.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: COLORS.label }}>Compliance</span>
                        <span style={{ color: COLORS.accent, fontWeight: 'bold' }}>{participant.compliance}%</span>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '2rem' }}>
                <label style={S.label}>Compliance Vector</label>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${participant.compliance}%`, height: '100%', backgroundColor: COLORS.accent, boxShadow: `0 0 10px ${COLORS.accent}40` }} />
                </div>
                <p style={{ fontSize: '11px', color: COLORS.label, marginTop: '0.8rem', fontStyle: 'italic' }}>Visit completion velocity stable.</p>
            </div>

            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '2rem' }}>
                <label style={S.label}>Safety Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: participant.adverseEvents.length > 0 ? COLORS.danger : COLORS.success }} />
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: participant.adverseEvents.length > 0 ? COLORS.danger : COLORS.success }}>
                        {participant.adverseEvents.length > 0 ? `${participant.adverseEvents.length} AE Reported` : 'No Issues'}
                    </span>
                </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '10px' }} onClick={() => setActiveTab('Overview')}>&gt; Overview</button>
                <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '10px' }} onClick={() => setActiveTab('Eligibility')}>&gt; Eligibility</button>
                <button style={{ ...S.btnGhost, textAlign: 'left', fontSize: '10px' }} onClick={() => setActiveTab('Safety')}>&gt; Safety</button>
            </div>
        </aside>
    );
};
