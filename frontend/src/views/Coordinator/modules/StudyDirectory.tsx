import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

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
    onUpdateStatus?: (id: string, status: string) => void;
}

const STATUS_MAPPING: Record<string, string> = {
    "DRAFT": "Draft",
    "PROPOSAL_SUBMITTED": "Proposal Submitted",
    "PROPOSAL_UNDER_NEGOTIATION": "Proposal Under Negotiation",
    "AGREEMENT_SIGNED": "Agreement Signed",
    "IRB_PROTOCOL_INITIATED": "IRB Protocol Initiated",
    "UNDER_IRB_SUBMISSION": "Under IRB Submission / Dev",
    "IRB_APPROVED": "IRB Approved",
    "PREPARING_TO_LAUNCH": "Preparing to Launch",
    "ACTIVE": "Active",
    "RECRUITING": "Recruiting",
    "RECRUITMENT_COMPLETED": "Recruitment Completed",
    "ANALYSIS_UNDERWAY": "Analysis Underway",
    "PROGRESS_REPORT_DRAFT": "Progress Report Draft",
    "FINAL_REPORT_SENT": "Final Report Sent",
    "COMPLETED": "Completed",
    "PAUSED": "Paused",
    "CLOSED_ARCHIVED": "Closed / Archived"
};

export const StudyDirectory: React.FC<StudyDirectoryProps> = ({
    studies,
    onAdd,
    onEdit,
    onUpdateStatus
}) => {
    return (
        <div className="space-y-10 pt-4">
            {/* Minimal Header */}
            <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Study Directory</h1>
                    <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-80">Managing {studies.length} active research protocols</p>
                </div>
                <button 
                    onClick={onAdd} 
                    className="px-6 py-2.5 bg-white text-black rounded-xl font-black text-xs flex items-center gap-2 hover:bg-slate-100 transition-all active:scale-95 shadow-lg shadow-white/10 uppercase tracking-widest"
                >
                    <Plus className="w-4 h-4" /> New study
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead>
                        <tr className="border-b border-white/5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <th className="px-6 py-4 pb-2">Study ID</th>
                            <th className="px-6 py-4 pb-2">Study Research</th>
                            <th className="px-6 py-4 pb-2">Sponsors</th>
                            <th className="px-6 py-4 pb-2">Status</th>
                            <th className="px-6 py-4 pb-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {studies.map((s) => (
                            <tr key={s.id} className="hover:bg-white/[0.02] cursor-pointer group transition-colors" onClick={() => onEdit(s)}>
                                <td className="px-6 py-8">
                                    <span className="text-sm font-black text-slate-300 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.protocol_id}</span>
                                </td>
                                <td className="px-6 py-8 max-w-md">
                                    <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-none">{s.title}</p>
                                    <p className="text-[11px] text-slate-500 mt-3 font-bold uppercase tracking-widest opacity-60">{s.study_type.replace('_', ' ')}</p>
                                </td>
                                <td className="px-6 py-8">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-80">{s.sponsor_name || 'Internal research'}</p>
                                </td>
                                <td className="px-6 py-8">
                                    <div className="relative group/select" onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={s.status}
                                            onChange={(e) => onUpdateStatus?.(s.id, e.target.value)}
                                            className={`appearance-none px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border cursor-pointer outline-none transition-all shadow-md ${
                                                s.status === 'ACTIVE' || s.status === 'RECRUITING' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-white/5 text-slate-400 border-white/10'
                                            }`}
                                        >
                                            {Object.entries(STATUS_MAPPING).map(([value, label]) => (
                                                <option key={value} value={value} className="bg-[#0f172a] text-slate-300">
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                            <ChevronRight className={`w-3 h-3 transition-transform rotate-90 ${
                                                s.status === 'ACTIVE' || s.status === 'RECRUITING' ? 'text-emerald-400' : 'text-slate-500'
                                            }`} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 text-right">
                                    <button className="p-2 bg-white/5 border border-white/5 rounded-lg text-slate-600 group-hover:text-white group-hover:bg-blue-600/20 group-hover:border-blue-500/30 transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
