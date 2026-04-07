import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Calendar, CheckCircle2, AlertCircle, Lock, 
    ChevronRight, Zap, Trophy, Play, FileText, 
    ClipboardList, Filter, LayoutGrid, List as ListIcon,
    Download, ExternalLink, HelpCircle, Eye, ArrowRight, Ship
} from 'lucide-react';
import { Card, Badge, SegmentedProgressBar, Legend, FilterChip, ProgressBar } from './SharedComponents';
import { jsPDF } from 'jspdf';

interface Task {
    id: string;
    title: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'LOCKED' | 'OVERDUE';
    due_date: string;
    visit_name: string;
    timeline_group: string;
    task_type: string;
    is_locked?: boolean;
    task_details?: {
        task_type: string;
        description: string;
    };
}

const TasksView = ({ tasks = [], onAction, study, userName }: { tasks: any[]; onAction: (t: string, task?: any) => void; study?: any; userName?: string }) => {
    const [filter, setFilter] = useState('Overdue');
    const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

    // Stats Calculation
    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const overdue = tasks.filter(t => {
            if (t.status === 'COMPLETED') return false;
            const dueDate = new Date(t.due_date);
            dueDate.setHours(0,0,0,0);
            const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            return diff > 1 && diff <= 5; // 5 day locking window
        }).length;

        const locked = tasks.filter(t => {
            if (t.status === 'COMPLETED') return false;
            const dueDate = new Date(t.due_date);
            dueDate.setHours(0,0,0,0);
            const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            return diff > 5;
        }).length;

        const todayTasks = tasks.filter(t => {
            if (t.status === 'COMPLETED') return false;
            const dueDate = new Date(t.due_date);
            dueDate.setHours(0,0,0,0);
            return dueDate.getTime() === today.getTime();
        }).length;

        const upcoming = tasks.filter(t => {
            if (t.status === 'COMPLETED') return false;
            const dueDate = new Date(t.due_date);
            dueDate.setHours(0,0,0,0);
            return dueDate.getTime() > today.getTime();
        }).length;

        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const pending = total - completed - overdue - locked;

        return {
            total, completed, inProgress, overdue, locked, pending, today: todayTasks, upcoming,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }, [tasks]);

    // Grouping & Filtering Logic
    const groupedTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getTaskCategory = (task: any) => {
            if (task.status === 'COMPLETED') return 'Completed';
            
            const dueDate = new Date(task.due_date);
            dueDate.setHours(0,0,0,0);
            
            const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 5) return 'Locked';
            if (diffDays > 1) return 'Overdue';
            if (diffDays === 0) return 'Today';
            if (dueDate > today) return 'Upcoming';
            return 'Today'; 
        };

        const categorized: Record<string, any[]> = {
            'Overdue': [],
            'Today': [],
            'Upcoming': [],
            'Completed': [],
            'Locked': []
        };

        tasks.forEach(task => {
            const cat = getTaskCategory(task);
            if (categorized[cat]) categorized[cat].push(task);
        });

        const allGroups = [
            { name: 'Overdue', tasks: categorized['Overdue'], color: 'red' },
            { name: 'Today', tasks: categorized['Today'], color: 'green' },
            { name: 'Upcoming', tasks: categorized['Upcoming'], color: 'cyan' },
            { name: 'Completed', tasks: categorized['Completed'], color: 'indigo' },
            { name: 'Locked', tasks: categorized['Locked'], color: 'amber' }
        ].filter(g => g.tasks.length > 0);

        if (filter !== 'All') {
            return allGroups.filter(g => g.name === filter);
        }

        return allGroups;
    }, [tasks, filter]);

    const handleDownloadDummy = (task?: any) => {
        const pdf = new jsPDF();
        pdf.setFillColor(13, 20, 36);
        pdf.rect(0, 0, 210, 40, 'F');
        pdf.setTextColor(34, 211, 238);
        pdf.setFontSize(26);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MUSB RESEARCH PVT. LTD.', 105, 20, { align: 'center' });
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('MUSB RESEARCH | STUDY PROTOCOLS', 105, 30, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text(`${task?.title || 'STUDY PROTOCOL'}`, 20, 60);
        pdf.save('Protocol.pdf');
    };

    return (
        <div className="space-y-12 pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-1.5">Study Tasks</h2>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[14px]">Manage and complete your daily study activities.</p>
                </div>
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                    <button onClick={() => setViewMode('timeline')} className={`p-3 rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-cyan-500 text-slate-950' : 'text-slate-500'}`}><LayoutGrid className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-slate-950' : 'text-slate-500'}`}><ListIcon className="w-5 h-5" /></button>
                </div>
            </div>

            {/* SUMMARIES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-7 border-l-4 border-l-cyan-500 bg-[#0a101f]/50 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-cyan-400" />
                            <h4 className="text-[15px] font-black text-slate-400 italic uppercase tracking-[0.2em]">Overall Progress</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black text-white italic">{stats.percent}%</span>
                        </div>
                    </div>
                    <SegmentedProgressBar 
                        segments={[
                            { count: stats.completed, color: 'bg-[#00e676]', label: 'Submitted' },
                            { count: stats.inProgress, color: 'bg-indigo-500', label: 'In Progress' },
                            { count: stats.pending, color: 'bg-white/10', label: 'Not Started' },
                            { count: stats.locked, color: 'bg-amber-500', label: 'Locked' },
                            { count: stats.overdue, color: 'bg-red-500', label: 'Overdue' }
                        ]} 
                    />
                </Card>

                <Card className="p-7 border-l-4 border-l-[#00e676] bg-[#0a101f]/50 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-[#00e676]" />
                            <h4 className="text-[15px] font-black text-slate-400 italic uppercase tracking-[0.2em]">Current Visit Status</h4>
                        </div>
                        <div className="text-right font-black text-white text-4xl italic">
                            {tasks.filter(t => t.due_date.startsWith(new Date().toISOString().split('T')[0])).length} Tasks
                        </div>
                    </div>
                    <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest italic leading-relaxed">Maintain daily activities for research compliance.</p>
                </Card>
            </div>

            {/* FILTER BAR */}
            <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar relative z-50">
                <button onClick={() => setFilter('All')} className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl border transition-all ${filter === 'All' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                    <Filter className="w-5 h-5" /><span className="text-[15px] font-black uppercase tracking-widest">Filter</span>
                </button>
                {['Overdue', 'Today', 'Upcoming', 'Completed', 'Locked', 'All'].map((f) => {
                    const count = 
                        f === 'All' ? stats.total :
                        f === 'Overdue' ? stats.overdue :
                        f === 'Today' ? stats.today :
                        f === 'Upcoming' ? stats.upcoming :
                        f === 'Completed' ? stats.completed :
                        f === 'Locked' ? stats.locked : 0;
                    return <FilterChip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} count={count} />;
                })}
            </div>

            {/* TASK SECTIONS */}
            <div className="space-y-16">
                {groupedTasks.length === 0 ? (
                    <div className="py-20 text-center">
                        <CheckCircle2 className="w-16 h-16 text-slate-700 mx-auto mb-6" strokeWidth={1} />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">No active tasks</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[14px] mt-2">All tasks for this section are complete.</p>
                    </div>
                ) : (
                    groupedTasks.map((section, idx) => (
                        <div key={idx} className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-white/[0.05] pb-4">
                                <div className={`w-3 h-3 rounded-full bg-${section.color}-500 shadow-[0_0_10px_currentColor]`} />
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{section.name} <span className="text-slate-600 ml-2">[{section.tasks.length}]</span></h3>
                            </div>
                            <div className={viewMode === 'timeline' ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-3"}>
                                {section.tasks.map((task: any, tIdx: number) => {
                                    const today = new Date(); today.setHours(0,0,0,0);
                                    const dueDate = new Date(task.due_date); dueDate.setHours(0,0,0,0);
                                    const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                                    
                                    let sLabel = task.status === 'COMPLETED' ? 'Completed' : 'Pending';
                                    if (task.status !== 'COMPLETED') {
                                        if (diffDays > 5) sLabel = 'Locked';
                                        else if (diffDays > 1) sLabel = 'Overdue';
                                        else if (diffDays === 0) sLabel = 'Today';
                                        else if (dueDate > today) sLabel = 'Upcoming';
                                        else sLabel = 'Today';
                                    }

                                    const sColor = sLabel === 'Completed' ? 'green' : sLabel === 'Locked' ? 'amber' : sLabel === 'Overdue' ? 'red' : sLabel === 'Today' ? 'green' : 'cyan';

                                    return (
                                        <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: tIdx * 0.05 }}>
                                            <Card className={`group relative transition-all hover:border-white/20 ${task.status === 'IN_PROGRESS' ? 'border-indigo-500/30 bg-indigo-500/5' : ''} ${viewMode === 'timeline' ? 'p-6 space-y-6' : 'p-4'}`}>
                                                {sLabel === 'Overdue' && <div className={`absolute top-0 left-0 ${viewMode === 'timeline' ? 'w-full h-1' : 'w-1.5 h-full'} bg-red-500 shadow-[0_0_10px_#ef4444]`} />}
                                                <div className={`flex ${viewMode === 'timeline' ? 'flex-col gap-6' : 'flex-row items-center justify-between gap-4'}`}>
                                                    <div className={`flex flex-1 justify-between items-start ${viewMode === 'list' ? 'items-center' : ''}`}>
                                                        <div className={viewMode === 'list' ? 'flex items-center gap-6' : ''}>
                                                            {viewMode === 'list' && <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0`}>
                                                                {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : 
                                                                 task.task_details?.task_type === 'FORM_SIGNATURE' ? <FileText className="w-5 h-5 text-cyan-400" /> :
                                                                 <Clock className="w-5 h-5 text-slate-500" />}
                                                            </div>}
                                                            <div>
                                                                <span className="text-[15px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">{task.task_details?.task_type || 'STUDY ACTIVITY'}</span>
                                                                <h5 className={`${viewMode === 'timeline' ? 'text-[20px]' : 'text-[21px]'} font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors`}>{task.title}</h5>
                                                            </div>
                                                        </div>
                                                        <Badge color={sColor}>{sLabel}</Badge>
                                                    </div>

                                                    <div className={`${viewMode === 'timeline' ? 'flex flex-col gap-4 py-4 border-y border-white/[0.05]' : 'flex items-center gap-8 px-6 border-x border-white/[0.05]'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="w-5 h-5 text-slate-500 shrink-0" />
                                                            <div><p className="text-[14px] font-black text-slate-600 uppercase leading-none mb-2.5">Due Date</p><p className="text-[16px] font-bold text-slate-400 leading-none">{new Date(task.due_date).toLocaleDateString()}</p></div>
                                                        </div>
                                                    </div>

                                                    <div className={`flex gap-3 ${viewMode === 'timeline' ? 'pt-2' : 'w-64'}`}>
                                                        {sLabel === 'Locked' ? (
                                                            <button className="flex-1 bg-white/5 text-slate-500 py-4 rounded-xl border border-white/5 cursor-not-allowed flex items-center justify-center gap-2 text-[15px] font-black uppercase tracking-widest"><Lock className="w-5 h-5" />Task Locked</button>
                                                        ) : task.status === 'COMPLETED' ? (
                                                            <button onClick={() => onAction('VIEW_SUBMISSION', task)} className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl flex items-center justify-center gap-2 text-[15px] font-black uppercase tracking-widest group-hover:bg-white/10 transition-all"><FileText className="w-5 h-5 text-green-400" />Review Data</button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => onAction(
                                                                    task.task_details?.task_type === 'FORM_SIGNATURE' ? 'SIGN_FORM' : 
                                                                    (task.status === 'IN_PROGRESS' ? 'RESUME_TASK' : 'START_TASK'), 
                                                                    task
                                                                )} 
                                                                className={`flex-1 ${sLabel === 'Overdue' ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-cyan-500 shadow-lg shadow-cyan-500/20'} text-slate-950 py-4 rounded-xl font-black text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:scale-[1.02]`}
                                                            >
                                                                {task.task_details?.task_type === 'FORM_SIGNATURE' ? <FileText className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                                                {task.task_details?.task_type === 'FORM_SIGNATURE' ? 'Sign Form' : (task.status === 'IN_PROGRESS' ? 'Resume Task' : 'Start Task')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TasksView;


