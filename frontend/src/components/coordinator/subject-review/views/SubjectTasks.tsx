import React, { useState } from 'react';
import { 
    ClipboardList, CheckCircle2, Clock, AlertCircle, 
    User, UserCheck, FileText, Lock, Unlock, Eye, Edit3,
    ArrowRight, Filter, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../SubRevConstants';
import { authFetch, API, getRole } from '../../../../utils/auth';

interface SubjectTasksProps {
    participant: any;
    addToast: (msg: string, type?: string) => void;
    logAction: (action: string, detail: string) => void;
    refreshData: () => void;
}

export const SubjectTasks: React.FC<SubjectTasksProps> = ({ 
    participant, addToast, logAction, refreshData 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [editMode, setEditMode] = useState<Record<string, boolean>>({});

    const role = (getRole() || '').toUpperCase();
    const isStaff = ['COORDINATOR', 'PI', 'ADMIN', 'SUPER_ADMIN'].includes(role);

    // Combine all task-like objects
    const allTasks = [
        ...(participant.scheduled_questionnaires || []).map((q: any) => ({
            ...q,
            type: 'INSTRUMENT',
            title: q.questionnaire_details?.template_details?.name || 'Clinical Instrument',
            date: q.scheduled_date,
            id: q.id
        })),
        ...(participant.assigned_forms || []).map((f: any) => ({
            ...f,
            type: 'FORM',
            title: f.form_details?.title || 'Assigned Form',
            date: f.due_date ? new Date(f.due_date).toLocaleDateString() : f.created_at,
            id: f.id
        })),
        ...(participant.tasks || []).map((t: any) => ({
            ...t,
            type: 'TASK',
            title: t.task_details?.title || 'General Task',
            date: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A',
            id: t.id
        }))
    ];

    const filteredTasks = allTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle2 size={14} /> };
            case 'IN_PROGRESS':
                return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: <Clock size={14} /> };
            case 'LATE':
            case 'MISSED':
            case 'EXPIRED':
                return { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: <AlertCircle size={14} /> };
            default:
                return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', icon: <Clock size={14} /> };
        }
    };

    const toggleEditMode = (taskId: string) => {
        setEditMode(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const handleAction = (task: any) => {
        if (task.type === 'INSTRUMENT') {
            window.dispatchEvent(new CustomEvent('open-instrument-modal', { 
                detail: { 
                    instanceId: task.id, 
                    readonly: !editMode[task.id] 
                } 
            }));
        } else if (task.type === 'FORM') {
            window.dispatchEvent(new CustomEvent('open-form-modal', { 
                detail: { 
                    formId: task.form, 
                    assignedFormId: task.id,
                    readonly: !editMode[task.id] 
                } 
            }));
        }
    };

    return (
        <div className="space-y-8">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/50 p-6 rounded-2xl border border-[#1F2937]">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text"
                            placeholder="Search tasks or assessments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0F172A] border border-[#1F2937] text-white pl-12 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1F2937] p-1 rounded-xl">
                        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center gap-6 px-6 py-2 border-l border-[#1F2937] hidden md:flex">
                    <div className="text-center">
                        <div className="text-xl font-black text-white">{allTasks.filter(t => t.status === 'COMPLETED').length}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Completed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-black text-blue-400">{allTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pending</div>
                    </div>
                </div>
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task, idx) => {
                        const styles = getStatusStyles(task.status);
                        const isCompletedByCoordinator = task.completed_by === 'COORDINATOR';
                        const isCompletedByParticipant = task.completed_by === 'PARTICIPANT';

                        return (
                            <motion.div 
                                key={task.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-[#111827] border border-[#1F2937] hover:border-blue-500/30 rounded-2xl p-5 transition-all relative overflow-hidden"
                            >
                                {/* Decorative gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all" />

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${task.type === 'INSTRUMENT' ? 'bg-indigo-500/10 text-indigo-400' : task.type === 'FORM' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                            {task.type === 'INSTRUMENT' ? <ClipboardList size={20} /> : task.type === 'FORM' ? <FileText size={20} /> : <CheckCircle2 size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-white font-bold tracking-tight">{task.title}</h3>
                                                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${styles.bg} ${styles.border} ${styles.text}`}>
                                                    {styles.icon}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{task.status}</span>
                                                </div>
                                            </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded">
                                                        <Clock size={10} className="text-blue-400" />
                                                        <span>Due: {task.date}</span>
                                                    </div>
                                                    
                                                    {task.clinical_score !== undefined && task.clinical_score !== null && (
                                                        <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                                                            <ClipboardList size={10} />
                                                            <span>Score: {task.clinical_score}</span>
                                                        </div>
                                                    )}

                                                    {task.type !== 'TASK' && (
                                                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded">
                                                            <User size={10} className="text-emerald-400" />
                                                            <span>
                                                                {isCompletedByCoordinator ? 'Coordinator Entry' : 
                                                                 isCompletedByParticipant ? 'Participant Entry' : 
                                                                 'Pending Submission'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Edit/View Toggle for Staff */}
                                        {isStaff && task.status === 'COMPLETED' && (
                                            <button 
                                                onClick={() => toggleEditMode(task.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editMode[task.id] ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}
                                            >
                                                {editMode[task.id] ? <Edit3 size={14} /> : <Eye size={14} />}
                                                {editMode[task.id] ? 'Edit Mode' : 'View Only'}
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => handleAction(task)}
                                            className="px-6 py-2.5 bg-[#1F2937] hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group/btn flex items-center gap-2"
                                        >
                                            {task.status === 'COMPLETED' ? (editMode[task.id] ? 'Modify Data' : 'Review Response') : 'Launch Task'}
                                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#111827]/30 rounded-3xl border border-dashed border-[#1F2937]">
                        <AlertCircle size={48} className="text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">No tasks found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
