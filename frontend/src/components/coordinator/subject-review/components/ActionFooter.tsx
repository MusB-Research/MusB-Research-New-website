import React from 'react';
import { COLORS, S } from '../SubRevConstants';
import { Save, AlertTriangle } from 'lucide-react';

interface ActionFooterProps {
    addToast: (msg: string) => void;
    logAction: (action: string, detail: string) => void;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({ addToast, logAction }) => {
    return (
        <footer style={S.stickyBottom}>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => { addToast('Notes synchronized'); logAction('Data Save', 'Coordinator globally saved all session notes.'); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20"
                >
                    <Save size={16} /> Save Session Notes
                </button>
                <button 
                    onClick={() => logAction('Deviation Observed', 'Coordinator marked a protocol deviation in the clinical log.')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                    <AlertTriangle size={16} /> Mark Protocol Deviation
                </button>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 opacity-60 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Protocol Node Alpha
                </div>
                <div className="w-px h-3 bg-white/10" />
                <span>Regulatory Status: Synchronized</span>
            </div>
        </footer>
    );
};
