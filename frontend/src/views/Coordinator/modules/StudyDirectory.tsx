import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, CheckCircle2, Clock, PlayCircle, Activity, Building, Layout, ExternalLink, Trash2, AlertTriangle, Globe, Users, Download, FileText } from 'lucide-react';
import { SkeletonLoader } from '../../../components/shared/SkeletonLoader';

interface Study {
    id: string;
    protocol_id: string;
    title: string;
    study_type: string;
    sponsor_name?: string;
    status: string;
    countries?: string[];
    enrollment_count?: number;
    compliance_rate?: number;
}

interface StudyDirectoryProps {
    studies: Study[];
    onAdd: () => void;
    onEdit: (s: Study) => void;
    onExport?: (s: Study, format: 'csv' | 'pdf') => void;
    onDelete?: (s: Study) => Promise<void> | void;
    onUpdateStatus?: (id: string, status: string) => void;
    isLoading?: boolean;
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
    onExport,
    onDelete,
    onUpdateStatus,
    isLoading = false
}) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const [confirmDelete, setConfirmDelete] = useState<Study | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = async () => {
        if (!confirmDelete || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(confirmDelete);
        } finally {
            setIsDeleting(false);
            setConfirmDelete(null);
        }
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
            case 'RECRUITING':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10';
            case 'COMPLETED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'PAUSED':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'DRAFT':
                return 'bg-slate-500/10 text-slate-400 border-white/5 italic';
            default:
                return 'bg-white/5 text-slate-400 border-white/10';
        }
    };

    return (
        <div className="space-y-4 pt-2">
            {/* Minimal Header */}
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'} pb-4 border-b border-white/5`}>
                <div>
                    <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black text-white tracking-tighter uppercase italic leading-none`}>Study <span className="text-blue-400">Directory</span></h1>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-[0.3em] opacity-80">Managing {studies.length} active research protocols</p>
                </div>
                <button 
                    onClick={onAdd} 
                    className={`${isMobile ? 'w-full' : ''} px-6 py-3 bg-white text-black rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/5 uppercase tracking-widest`}
                >
                    <Plus className="w-4 h-4" /> New Protocol
                </button>
            </div>

            <div className="relative">
                {isLoading ? (
                   <div className="space-y-4">
                       {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] animate-pulse">
                               <div className="h-6 bg-white/5 w-1/3 rounded-lg mb-4" />
                               <div className="h-4 bg-white/5 w-2/3 rounded-lg" />
                           </div>
                       ))}
                   </div>
                ) : studies.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                        <div className="w-24 h-24 bg-blue-500/5 rounded-full flex items-center justify-center mb-8 border border-blue-500/10">
                            <Activity className="w-10 h-10 text-blue-400 opacity-30" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">No Active Protocols</h3>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.4em] mt-3 italic text-center px-6">Initialize your first research study to begin coordination.</p>
                        <button 
                            onClick={onAdd}
                            className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-600/20"
                        >
                            Create Launch Plan
                        </button>
                    </div>
                ) : (
                    <div className={(isMobile || isTablet) ? "space-y-4" : ""}>
                        {(isMobile || isTablet) ? (
                            studies.map((s) => (
                                <motion.div 
                                    key={s.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#0B101B]/60 backdrop-blur-xl border border-white/5 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] space-y-4 relative overflow-hidden group active:scale-[0.98] transition-all"
                                    onClick={() => onEdit(s)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-2 min-w-0">
                                            <span className="text-[10px] font-black text-blue-500/60 font-mono tracking-widest uppercase italic">{s.protocol_id}</span>
                                            <h4 className="text-base md:text-lg font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-blue-400 transition-colors truncate">{s.title}</h4>
                                        </div>
                                        <div className={`px-3 md:px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap flex-shrink-0 ${getStatusStyle(s.status)}`}>
                                            {STATUS_MAPPING[s.status] || s.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 md:gap-6 py-4 border-y border-white/5">
                                        <div className="space-y-2 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Building className="w-3 h-3 text-slate-500" />
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Sponsor</p>
                                            </div>
                                            <p className="text-[10px] md:text-[11px] font-bold text-slate-300 uppercase truncate">{s.sponsor_name || 'Internal Research'}</p>
                                        </div>
                                        <div className="space-y-2 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-3 h-3 text-slate-500" />
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Metrics</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[10px] md:text-[11px] font-bold text-white uppercase">{s.enrollment_count || 0} ENROLLED</p>
                                                <p className="text-[10px] md:text-[11px] font-bold text-emerald-400 uppercase">{s.compliance_rate || 0}% COMPLIANCE</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                                        <div className="flex-1">
                                            <select
                                                value={s.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => onUpdateStatus?.(s.id, e.target.value)}
                                                className="w-full sm:w-auto bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none focus:border-blue-500/50"
                                            >
                                                {Object.entries(STATUS_MAPPING).map(([value, label]) => (
                                                    <option key={value} value={value} className="bg-[#0B101B] text-slate-300">{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(s); }}
                                                    className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 font-black text-[10px] uppercase tracking-widest italic">
                                                {s.status === 'DRAFT' ? 'Edit' : 'Audit'}
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar-horizontal">
                                <table className="w-full text-left min-w-[1000px]">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic bg-white/[0.02]">
                                            <th className="px-6 py-4 border-r border-white/5">Protocol ID</th>
                                            <th className="px-6 py-4 border-r border-white/5">Research Objective & Metadata</th>
                                            <th className="px-6 py-4 border-r border-white/5">Enrollment & Compliance</th>
                                            <th className="px-6 py-4 border-r border-white/5">Operational Status</th>
                                            <th className="sticky right-0 px-6 py-4 text-right bg-[#0B101B] z-10 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.5)] border-l border-white/5">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {studies.map((s) => (
                                            <tr key={s.id} className="hover:bg-white/[0.02] cursor-pointer group transition-colors" onClick={() => onEdit(s)}>
                                                <td className="px-6 py-5 border-r border-white/5">
                                                    <span className="text-[13px] font-mono font-black text-blue-500/60 group-hover:text-blue-400 transition-colors uppercase italic tracking-widest">{s.protocol_id}</span>
                                                </td>
                                                <td className="px-6 py-5 max-w-md border-r border-white/5">
                                                    <p className="text-base font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter leading-none">{s.title}</p>
                                                    <div className="flex items-center gap-3 mt-4">
                                                        <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-slate-500 font-black uppercase tracking-widest italic">{s.study_type.replace('_', ' ')}</span>
                                                        {s.countries && s.countries.length > 0 && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 font-black uppercase tracking-widest italic">
                                                                <Globe className="w-2.5 h-2.5 inline-block mr-1 -mt-0.5" />
                                                                {s.countries.length === 1 ? s.countries[0] : `${s.countries.length} Countries`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 border-r border-white/5">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Enrolled</span>
                                                            <span className="text-[12px] font-black text-white">{s.enrollment_count || 0}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                                                            <div 
                                                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                                                                style={{ width: `${Math.min((s.enrollment_count || 0) / 100 * 100, 100)}%` }} 
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Compliance</span>
                                                            <span className={`text-[12px] font-black ${Number(s.compliance_rate || 0) > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                {s.compliance_rate || 0}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 border-r border-white/5">
                                                    <div className="relative group/select w-fit" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={s.status}
                                                            onChange={(e) => onUpdateStatus?.(s.id, e.target.value)}
                                                            className={`appearance-none px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border cursor-pointer outline-none transition-all italic ${getStatusStyle(s.status)}`}
                                                        >
                                                            {Object.entries(STATUS_MAPPING).map(([value, label]) => (
                                                                <option key={value} value={value} className="bg-[#0B101B] text-slate-300">
                                                                    {label.toUpperCase()}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                                            <ChevronRight className="w-3.5 h-3.5 transition-transform rotate-90 text-current opacity-40" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="sticky right-0 px-6 py-5 text-right bg-[#0B101B] group-hover:bg-[#0E131E] z-10 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.5)] border-l border-white/5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {onExport && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onExport(s, 'csv'); }}
                                                                    className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                                                                    title="Export CSV"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onExport(s, 'pdf'); }}
                                                                    className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                                                                    title="Export PDF"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {onDelete && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(s); }}
                                                                className="p-3.5 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                                                                title="Delete study"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-500 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-all shadow-xl font-black text-[11px] uppercase tracking-widest italic">
                                                            {s.status === 'DRAFT' ? 'Edit Plan' : 'Audit & Edit'}
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>


        {/* Delete Confirmation Modal */}
        <AnimatePresence>
            {confirmDelete && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={() => !isDeleting && setConfirmDelete(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0F172A] border border-red-500/20 rounded-2xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg uppercase italic tracking-tight">Delete Study?</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">This action cannot be undone</p>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                            <p className="text-[11px] font-black text-blue-400 font-mono tracking-widest uppercase">{confirmDelete.protocol_id}</p>
                            <p className="text-white font-bold italic uppercase tracking-tight mt-1">{confirmDelete.title}</p>
                        </div>
                        <p className="text-slate-400 text-sm mb-8">Are you sure you want to permanently delete this study and all its associated data?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 rounded-xl font-black text-[11px] tracking-widest uppercase bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="flex-1 py-3.5 rounded-xl font-black text-[11px] tracking-widest uppercase bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 disabled:opacity-60"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Study'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </div>
    );
};
