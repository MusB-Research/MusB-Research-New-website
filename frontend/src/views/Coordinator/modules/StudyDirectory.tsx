import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight } from 'lucide-react';

interface Study {
    id: string;
    protocol_id: string;
    title: string;
    study_type: string;
    sponsor_name?: string;
    status: string;
}

interface StudyDirectoryProps {
    studies: Study[];
    onAdd: () => void;
    onEdit: (s: Study) => void;
}

export const StudyDirectory: React.FC<StudyDirectoryProps> = ({ 
    studies, 
    onAdd, 
    onEdit 
}) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight leading-none">Study <span className="text-[#14b8a6]">Directory</span></h2>
                    <p className="text-[11px] text-slate-500 uppercase tracking-[0.4em] font-black mt-3 md:mt-4 italic">Managing {studies.length} active research protocols</p>
                </div>
                <button onClick={onAdd} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl"><Plus className="w-4 h-4" /> Setup Protocol</button>
            </div>
            <div className="overflow-x-auto custom-scrollbar-horizontal">
                <table className="w-full text-left table-fixed min-w-[1000px] border-t border-white/5">
                    <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[40%]" />
                        <col className="w-[15%]" />
                        <col className="w-[15%]" />
                        <col className="w-[15%]" />
                    </colgroup>
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-[12px] font-black text-white/80 uppercase tracking-widest italic">
                            <th className="px-10 py-8 border-r border-white/5">Protocol ID</th>
                            <th className="px-10 py-8 border-r border-white/5">Research Objective</th>
                            <th className="px-10 py-8 border-r border-white/5">Clinical Sponsor</th>
                            <th className="px-10 py-8 border-r border-white/5">Lifecycle</th>
                            <th className="px-10 py-8 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {studies.map((s) => (
                            <tr key={s.id} className="hover:bg-white/[0.02] cursor-pointer group transition-colors" onClick={() => onEdit(s)}>
                                <td className="px-10 py-10 text-base font-black text-[#14b8a6] italic border-r border-white/5">{s.protocol_id}</td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <p className="text-base font-black text-white italic uppercase tracking-tight leading-none truncate">{s.title}</p>
                                    <p className="text-[12px] text-white/30 font-bold uppercase tracking-widest mt-1.5">{s.study_type}</p>
                                </td>
                                <td className="px-10 py-10 text-[12px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">{s.sponsor_name || 'Internal Hub'}</td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <span className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border shadow-lg ${
                                        s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                        'bg-white/5 text-slate-500 border-white/10'
                                    }`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-10 py-10 text-right">
                                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 group-hover:text-white group-hover:bg-[#14b8a6]/20 transition-all shadow-lg">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
