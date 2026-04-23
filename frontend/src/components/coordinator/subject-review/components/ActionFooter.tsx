import React from 'react';
import { COLORS, S } from '../SubRevConstants';
import { Save, AlertTriangle } from 'lucide-react';

interface ActionFooterProps {
    addToast: (msg: string) => void;
    logAction: (action: string, detail: string) => void;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({ addToast, logAction }) => {
    return (
        <footer className="md:fixed bottom-0 left-0 right-0 p-6 md:px-8 md:py-4 bg-[#0B1221] border-t border-[#1F2937] flex flex-col md:flex-row md:items-center gap-6 z-10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button 
                    onClick={() => { addToast('Notes synchronized'); logAction('Data Save', 'Coordinator globally saved all session notes.'); }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20"
                >
                    <Save size={16} /> Save Session Notes
                </button>
                <button 
                    onClick={() => logAction('Deviation Observed', 'Coordinator marked a protocol deviation in the clinical log.')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <AlertTriangle size={16} /> Protocol Deviation
                </button>
            </div>
            
            <div className="hidden md:flex flex-1" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-[10px] font-black text-slate-500 opacity-60 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Protocol Node Alpha
                </div>
                <div className="hidden sm:block w-px h-3 bg-white/10" />
                <span className="italic">Regulatory Sync: Active</span>
            </div>
        </footer>
    );
};
