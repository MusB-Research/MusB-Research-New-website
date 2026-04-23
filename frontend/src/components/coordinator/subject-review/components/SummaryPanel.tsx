import React from 'react';
import { COLORS, S } from '../SubRevConstants';
import { ChevronRight } from 'lucide-react';

interface SummaryPanelProps {
    participant: any;
    setActiveTab: (tab: string) => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ participant, setActiveTab }) => {
    return (
        <div className="flex-1 p-6 md:p-8 flex flex-col gap-8 md:gap-10 overflow-y-auto animate-in slide-in-from-right duration-500">
            {/* Triage Section */}
            <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic mb-6 block">Clinical Triage</label>
                <div className="flex flex-col gap-5 mt-4">
                    <div className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab('Eligibility')}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Triage Status</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${participant.status === 'ENROLLED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                            {participant.status || 'PENDING'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab('Consent')}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Consent</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${participant.consent?.status === 'Signed' || participant.consent?.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                            {participant.consent?.status || 'AWAITING'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance</span>
                        <span className="text-[10px] font-black text-white italic">
                            {participant.compliance || 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Compliance Section */}
            <div className="pt-2 border-t border-white/5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic mb-4 block">Compliance Vector</label>
                <div className="h-1 w-full bg-[#111827] rounded-full overflow-hidden mt-2">
                    <div 
                        style={{ width: `${participant.compliance || 0}%` }} 
                        className="h-full bg-indigo-500 transition-all duration-1000" 
                    />
                </div>
                <p className="text-[10px] text-slate-600 mt-4 font-black uppercase tracking-widest italic opacity-50">Velocity: Stable</p>
            </div>

            {/* Safety Section */}
            <div className="pt-2 border-t border-white/5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic mb-4 block">Safety Status</label>
                <div className="flex items-center gap-3 mt-4">
                    <div className={`w-2 h-2 rounded-full ${participant.adverseEvents?.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest italic ${participant.adverseEvents?.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {participant.adverseEvents?.length > 0 ? `${participant.adverseEvents.length} AE REPORTED` : '0 ALERTS'}
                    </span>
                </div>
            </div>

            {/* Navigation Shortcuts */}
            <div className="mt-auto pt-10 border-t border-white/5 flex flex-col gap-2">
                {['Overview', 'Eligibility', 'Safety'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="flex justify-between items-center w-full px-5 py-3 bg-white/5 hover:bg-white/10 hover:border-[#1F2937] border border-transparent rounded-xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em] group italic"
                    >
                        {tab} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                ))}
            </div>
        </div>
    );
};
