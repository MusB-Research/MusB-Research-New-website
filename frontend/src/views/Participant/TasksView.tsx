import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Calendar, CheckCircle2, AlertCircle, Lock,
    ChevronRight, ChevronDown, Zap, Trophy, Play, FileText,
    ClipboardList, Filter, LayoutGrid, List as ListIcon,
    Download, ExternalLink, HelpCircle, Eye, ArrowRight, Ship, XCircle
} from 'lucide-react';
import { Card, Badge, SegmentedProgressBar, Legend, FilterChip, ProgressBar, Skeleton } from './SharedComponents';
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

const TasksView = ({ tasks = [], onAction, study, userName, defaultFilter = 'Overdue', isLoading = false }: { tasks: any[]; onAction: (t: string, task?: any) => void; study?: any; userName?: string; defaultFilter?: string; isLoading?: boolean }) => {
    const [filter, setFilter] = useState(defaultFilter);
    const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const safeArray = (data: any) => Array.isArray(data) ? data : [];

    // Reset filter if defaultFilter changes
    useEffect(() => {
        if (defaultFilter) setFilter(defaultFilter);
    }, [defaultFilter]);

    // Central Status Derivation Engine
    const getTaskStatus = (task: any) => {
        const rawStatus = (task.status || '').toUpperCase();
        if (rawStatus === 'COMPLETED' || rawStatus === 'VIEW_SUBMISSION') return 'Completed';

        // Locking Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!task.due_date) return 'Today';
        const dueDate = new Date(task.due_date);
        if (isNaN(dueDate.getTime())) return 'Today';
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Rule: Tasks lock after grace period
        const isDailyLog = task.task_type === 'DAILY_LOG' || task.task_details?.task_type === 'DAILY_LOG' || task.task_type === 'LOG';
        const gracePeriod = task.grace_period_days || 5;

        if (rawStatus === 'LOCKED' || (diffDays > gracePeriod && !isDailyLog)) return 'Locked';

        if (diffDays > 0) return 'Overdue';
        if (diffDays < 0) return 'Upcoming';
        return 'Today';
    };

    const stats = useMemo(() => {
        const data = safeArray(tasks);
        const total = data.length;

        const overdue = data.filter(t => getTaskStatus(t) === 'Overdue').length;
        const today = data.filter(t => getTaskStatus(t) === 'Today').length;
        const upcoming = data.filter(t => getTaskStatus(t) === 'Upcoming').length;
        const completed = data.filter(t => getTaskStatus(t) === 'Completed').length;
        const locked = data.filter(t => getTaskStatus(t) === 'Locked').length;

        return {
            total, overdue, today, upcoming, completed, locked,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }, [tasks]);

    const groupedTasks = useMemo(() => {
        const data = safeArray(tasks);
        const categorized: Record<string, any[]> = {
            'Overdue': [],
            'Today': [],
            'Upcoming': [],
            'Completed': [],
            'Locked': []
        };

        data.forEach(task => {
            const cat = getTaskStatus(task);
            if (categorized[cat]) categorized[cat].push(task);
        });

        const allGroups = [
            { name: 'Overdue', tasks: categorized['Overdue'], color: 'red' },
            { name: 'Today', tasks: categorized['Today'], color: 'blue' },
            { name: 'Upcoming', tasks: categorized['Upcoming'], color: 'blue' },
            { name: 'Completed', tasks: categorized['Completed'], color: 'green' },
            { name: 'Locked', tasks: categorized['Locked'], color: 'slate' }
        ].filter(g => g.tasks.length > 0 || (filter === g.name && g.name !== 'Locked'));

        if (filter !== 'All') {
            return allGroups.filter(g => g.name === filter);
        }

        return allGroups;
    }, [tasks, filter]);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="flex flex-col lg:flex-row items-stretch gap-6 flex-1 w-full">
                    {[1, 2].map(i => (
                        <Skeleton key={i} className="flex-1 h-32 rounded-[24px]" />
                    ))}
                    <Skeleton className="w-24 h-12 rounded-xl self-center" />
                </div>
                <div className="space-y-8">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-8">
                            <Skeleton className="h-8 w-48 rounded-lg" />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[1, 2].map(j => (
                                    <Skeleton key={j} className="h-64 rounded-[24px]" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const handleDownloadDummy = (task?: any) => {
        const pdf = new jsPDF();
        pdf.setFillColor(26, 43, 73); // #1A2B49
        pdf.rect(0, 0, 210, 45, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(26);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MusB RESEARCH PORTAL', 105, 25, { align: 'center' });
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('OFFICIAL RECORD | SECURE CLINICAL ASSET', 105, 35, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text(`Study ID: ${study?.protocol_id || 'MUSB-PROTOCOL-SYNC'}`, 20, 75);
        pdf.save(`${task?.title?.replace(/\s+/g, '_') || 'Activity'}_Registry.pdf`);
    };

    return (
        <div className="space-y-8 pb-20 text-left">
            {/* STAT CARDS */}
            <div className="flex flex-col lg:flex-row items-stretch gap-6 relative z-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
                    <Card className="p-6 border-l-4 border-l-[#1E88E5] flex flex-col justify-center shadow-md">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-[#E3F2FD] rounded-xl text-[#1E88E5]">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Global Protocol Progress</h4>
                                    <p className="text-[28px] font-bold text-[#1A2B49] mt-0.5 leading-none">{stats.percent}% Complete</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5">
                            <ProgressBar percent={stats.percent} height={8} />
                        </div>
                    </Card>

                    <Card className="p-6 border-l-4 border-l-[#E65100] flex flex-col justify-center shadow-md">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-[#FFF3E0] rounded-xl text-[#E65100]">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Outstanding Actions</h4>
                                    <p className="text-[28px] font-bold text-[#1A2B49] mt-0.5 leading-none">{stats.today} <span className="text-[14px] font-medium text-[#5F6F89]">Tasks for today</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 flex gap-2">
                            <Badge color="orange" className="px-4 py-1.5 text-[11px]">{stats.overdue} Overdue</Badge>
                            <Badge color="blue" className="px-4 py-1.5 text-[11px]">{stats.upcoming} Upcoming</Badge>
                        </div>
                    </Card>
                </div>

                <div className="flex bg-white p-2 rounded-2xl border border-[#E3ECF5] shadow-lg h-fit self-center relative">
                    <motion.div
                        className="absolute bg-[#1E88E5] rounded-xl"
                        initial={false}
                        animate={{
                            x: viewMode === 'timeline' ? 0 : 44,
                            width: 38,
                            height: 38
                        }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    />
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'timeline' ? 'text-white' : 'text-[#7A8CA5] hover:text-[#5F6F89]'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'text-white' : 'text-[#7A8CA5] hover:text-[#5F6F89]'}`}
                    >
                        <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="relative z-[60]">
                {/* Mobile Selector */}
                <div className="lg:hidden relative">
                    <button
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className="flex items-center justify-between w-full px-6 py-4.5 bg-white border border-[#E3ECF5] rounded-2xl text-[#1A2B49] shadow-xl"
                    >
                        <div className="flex items-center gap-3">
                            <Filter className="w-5 h-5 text-[#1E88E5]" />
                            <span className="text-[15px] font-bold tracking-tight uppercase">{filter}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-3 bg-white border border-[#E3ECF5] rounded-2xl shadow-2xl overflow-hidden z-50 p-2">
                                {['Overdue', 'Today', 'Upcoming', 'Completed', 'Locked', 'All'].map((f) => (
                                    <button key={f} onClick={() => { setFilter(f); setIsFilterMenuOpen(false); }} className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all ${filter === f ? 'bg-[#1E88E5] text-white font-bold' : 'text-[#5F6F89] hover:bg-[#F8FBFF] font-bold'}`}>
                                        <span className="uppercase tracking-tight">{f}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop Filter Bar */}
                <div className="hidden lg:flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-[#E3ECF5] bg-white text-[#5F6F89]">
                        <Filter className="w-4 h-4 text-[#1E88E5]" /><span className="text-[12px] font-bold uppercase tracking-widest">Filter Tasks</span>
                    </div>
                    {['Overdue', 'Today', 'Upcoming', 'Completed', 'Locked', 'All'].map((f) => {
                        const count = f === 'All' ? stats.total : stats[f.toLowerCase() as keyof typeof stats] || 0;
                        return <FilterChip key={f} label={f.toUpperCase()} active={filter === f} onClick={() => setFilter(f)} count={count as number} />;
                    })}
                </div>
            </div>

            {/* TASK QUEUE */}
            <div className="space-y-16">
                {groupedTasks.length === 0 ? (
                    <div className="py-24 text-center">
                        <CheckCircle2 className="w-16 h-16 text-[#B9F6CA] mx-auto mb-6" strokeWidth={1} />
                        <h3 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Queue Clear</h3>
                        <p className="text-[#5F6F89] font-bold uppercase tracking-widest text-[12px] mt-2">All scheduled clinical actions are complete.</p>
                    </div>
                ) : (
                    groupedTasks.map((section, idx) => (
                        <div key={idx} className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-[#E3ECF5] pb-6">
                                <div className={`w-3 h-3 rounded-full ${section.name === 'Overdue' ? 'bg-[#D32F2F]' : (section.name === 'Completed' ? 'bg-[#1E7F4F]' : 'bg-[#1E88E5]')}`} />
                                <h3 className="text-2xl font-bold text-[#1A2B49] tracking-tight uppercase">{section.name} <span className="text-[#5F6F89] ml-2 font-medium tracking-normal text-lg">[{section.tasks.length}]</span></h3>
                            </div>
                            <div className={viewMode === 'timeline' ? "grid-system" : "space-y-4"}>
                                {section.tasks.map((task: any, tIdx: number) => {
                                    const sLabel = getTaskStatus(task).toUpperCase();
                                    const isDailyLog = task.task_type === 'DAILY_LOG' || task.task_details?.task_type === 'DAILY_LOG' || task.task_type === 'LOG';

                                    const sColor =
                                        sLabel === 'COMPLETED' ? 'green' :
                                            sLabel === 'LOCKED' ? 'slate' :
                                                sLabel === 'OVERDUE' ? 'red' :
                                                    sLabel === 'TODAY' ? 'orange' :
                                                        sLabel === 'UPCOMING' ? 'blue' : 'blue';

                                    return (
                                        <motion.div key={task.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: tIdx * 0.05 }}>
                                            <Card className={`group relative transition-all hover:border-[#1E88E5]/40 rounded-[24px] bg-white shadow-sm hover:shadow-lg equal-height-card ${viewMode === 'timeline' ? 'p-8' : 'p-6'}`}>
                                                <div className={`flex flex-1 ${viewMode === 'timeline' ? 'flex-col' : 'flex-row items-center justify-between gap-6'}`}>
                                                    <div className={`flex flex-1 justify-between items-start ${viewMode === 'list' ? 'items-center' : ''}`}>
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-14 h-14 rounded-2xl bg-[#F8FBFF] flex items-center justify-center shrink-0 border border-[#E3ECF5] group-hover:bg-[#E3F2FD] group-hover:text-[#1E88E5] transition-all`}>
                                                                {sLabel === 'COMPLETED' ? <CheckCircle2 className="w-7 h-7 text-[#1E7F4F]" /> :
                                                                    task.task_details?.task_type === 'FORM_SIGNATURE' ? <FileText className="w-7 h-7 text-[#1E88E5]" /> :
                                                                        <ClipboardList className="w-7 h-7 text-[#5F6F89] group-hover:text-[#1E88E5]" />}
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-[0.2em] mb-1 block">{task.task_details?.task_type?.replace(/_/g, ' ') || 'Clinical Asset'}</span>
                                                                <h5 className={`${viewMode === 'timeline' ? 'text-base' : 'text-lg'} font-bold text-[#1A2B49] tracking-tight group-hover:text-[#1E88E5] transition-colors uppercase`}>{task.title}</h5>
                                                            </div>
                                                        </div>
                                                        <Badge color={sColor}>{sLabel}</Badge>
                                                    </div>

                                                    {viewMode === 'timeline' && (
                                                        <div className="grid grid-cols-2 gap-6 py-6 border-y border-[#F8FBFF]">
                                                            <div className="space-y-1">
                                                                <p className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest leading-none mb-1">Due Date</p>
                                                                <p className="text-sm font-bold text-[#5F6F89] uppercase tracking-tight">{task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Active Now'}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest leading-none mb-1">Classification</p>
                                                                <p className="text-sm font-bold text-[#5F6F89] uppercase tracking-tight">{isDailyLog ? 'Protocol Log' : 'Clinical Form'}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={`card-action-bottom flex gap-3 ${viewMode === 'timeline' ? '' : 'w-72'}`}>
                                                        {sLabel === 'LOCKED' ? (
                                                            <button className="flex-1 bg-[#F8FBFF] text-[#B0BCCF] py-4 rounded-xl border border-[#E3ECF5] cursor-not-allowed flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-widest">
                                                                <Lock className="w-4 h-4" /> SECURE LOCK
                                                            </button>
                                                        ) : sLabel === 'COMPLETED' ? (
                                                            <div className="flex gap-2 flex-1">
                                                                <button onClick={() => onAction('VIEW_SUBMISSION', task)} className="flex-1 bg-[#F8FBFF] border border-[#E3ECF5] text-[#1E88E5] py-4 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-[#E3F2FD] shadow-sm">
                                                                    <Eye className="w-4 h-4" /> Preview
                                                                </button>
                                                                <button onClick={() => handleDownloadDummy(task)} className="px-5 bg-white border border-[#E3ECF5] text-[#5F6F89] py-4 rounded-xl flex items-center justify-center transition-all hover:bg-[#F8FBFF] hover:text-[#1A2B49] shadow-sm">
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => onAction(
                                                                    task.task_details?.task_type === 'FORM_SIGNATURE' ? 'SIGN_FORM' :
                                                                        ((task.status || '').toUpperCase() === 'IN_PROGRESS' ? 'RESUME_TASK' : 'START_TASK'),
                                                                    task
                                                                )}
                                                                className={`flex-1 ${sLabel === 'OVERDUE' ? 'bg-[#D32F2F] hover:bg-[#B71C1C]' : 'bg-[#1E88E5] hover:bg-[#1565C0]'} text-white py-4 rounded-xl font-bold text-[13px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md`}
                                                            >
                                                                {task.task_details?.task_type === 'FORM_SIGNATURE' ? <FileText className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                                                                {task.task_details?.task_type === 'FORM_SIGNATURE' ? 'AUTHORIZE LOG' : (task.status === 'IN_PROGRESS' ? 'RESUME' : 'EXECUTE')}
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

export default React.memo(TasksView);
