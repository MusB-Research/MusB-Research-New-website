import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Download, ChevronRight } from 'lucide-react';
import { PersonalDoc } from '../CredentialConstants';

interface CredentialCardProps {
    doc: PersonalDoc;
    onSelect: (doc: PersonalDoc) => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({ doc, onSelect }) => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Valid': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Expiring Soon': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
            case 'Expired': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8 group hover:border-indigo-500/20 transition-all relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                        <Stethoscope className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest italic">{doc.type}</p>
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tight">{doc.name}</h4>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(doc.status)}`}>
                    {doc.status}
                </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex items-center gap-10">
                    <div>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Expiration</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${doc.status === 'Expiring Soon' ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>{doc.expiryDate}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Audit Track</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Verified 2026-01-01</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onSelect(doc)}
                        className="p-3 bg-white text-slate-950 rounded-xl hover:scale-105 transition-all outline-none active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
