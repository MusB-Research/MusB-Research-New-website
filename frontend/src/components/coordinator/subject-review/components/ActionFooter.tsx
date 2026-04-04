import React from 'react';
import { COLORS, S } from '../SubRevConstants';

interface ActionFooterProps {
    addToast: (msg: string) => void;
    logAction: (action: string, detail: string) => void;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({ addToast, logAction }) => {
    return (
        <footer style={S.stickyBottom}>
            <button style={S.btnPrimary} onClick={() => { addToast('Notes synchronized'); logAction('Data Save', 'PI globally saved all session notes.'); }}>Save Session Notes</button>
            <button style={S.btnGhost} onClick={() => logAction('Deviation Observed', 'PI marked a protocol deviation in the clinical log.')}>Mark Protocol Deviation</button>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: '11px', color: COLORS.label, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                Clinical Node: Miller Clinic Alpha • Status: Synchronized
            </div>
        </footer>
    );
};
