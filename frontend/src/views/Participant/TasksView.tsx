import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Calendar, CheckCircle2, AlertCircle, Lock,
    ChevronDown, Zap, Trophy, Play, FileText,
    ClipboardList, Filter, LayoutGrid, List as ListIcon,
    Download, Eye, ArrowRight
} from 'lucide-react';
import { Card, Badge, FilterChip, ProgressBar, Skeleton } from './SharedComponents';
import { jsPDF } from 'jspdf';

const TasksView = ({
    tasks = [],
    onAction,
    study,
    userName,
    defaultFilter = 'Overdue',
    isLoading = false
}: {
    tasks: any[];
    onAction: (t: string, task?: any) => void;
    study?: any;
    userName?: string;
    defaultFilter?: string;
    isLoading?: boolean;
}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const safeArray = (data: any) => Array.isArray(data) ? data : [];

    useEffect(() => {
        if (defaultFilter) setFilter(defaultFilter);
    }, [defaultFilter]);

    const getTaskStatus = (task: any) => {
        const rawStatus = (task.status || '').toUpperCase();
        if (rawStatus === 'COMPLETED' || rawStatus === 'VIEW_SUBMISSION') return 'Completed';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!task.due_date) return 'Today';
        const dueDate = new Date(task.due_date);
        if (isNaN(dueDate.getTime())) return 'Today';
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const gracePeriod = task.grace_period_days || 5;
        const isDailyLog = ['DAILY_LOG', 'LOG'].includes(task.task_type) || ['DAILY_LOG', 'LOG'].includes(task.task_details?.task_type);

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

    // Groups to show: always show the currently selected group (even if empty); show all if 'All'
    const sections = useMemo(() => {
        const data = safeArray(tasks);
        const groups = [
            { name: 'Overdue', color: 'red', dot: '#D32F2F' },
            { name: 'Today', color: 'orange', dot: '#E65100' },
            { name: 'Upcoming', color: 'blue', dot: '#1E88E5' },
            { name: 'Completed', color: 'green', dot: '#1E7F4F' },
            { name: 'Locked', color: 'slate', dot: '#8A99B3' },
        ];

        return groups.map(g => ({
            ...g,
            tasks: data.filter(t => getTaskStatus(t) === g.name)
        })).filter(g => {
            if (filter === 'All') return g.tasks.length > 0;
            return g.name === filter;
        });
    }, [tasks, filter]);

    // Download stub
    const handleDownloadDummy = (task?: any) => {
        const pdf = new jsPDF();
        pdf.setFillColor(26, 43, 73);
        pdf.rect(0, 0, 210, 45, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MusB Research Portal', 105, 25, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text('Study Record | Secure Clinical Asset', 105, 36, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.text(`Study ID: ${study?.protocol_id || 'N/A'}`, 20, 70);
        pdf.save(`${task?.title?.replace(/\s+/g, '_') || 'Task'}_Record.pdf`);
    };

    const FILTERS = ['Overdue', 'Today', 'Upcoming', 'Completed', 'Locked', 'All'];

    if (isLoading) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-[20px]" />)}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-9 w-28 rounded-xl" />)}
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-[18px]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-16 text-left">

            {/* ── STAT CARDS ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Global Progress */}
                <Card className="p-5 border-l-4 border-l-[#1E88E5] flex flex-col justify-center shadow-sm">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-2.5 bg-[#E3F2FD] rounded-xl text-[#1E88E5] shrink-0">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest leading-none">Global Protocol Progress</p>
                            <p className="text-xl font-bold text-[#1A2B49] leading-tight mt-0.5">{stats.percent}% Complete</p>
                        </div>
                    </div>
                    <ProgressBar percent={stats.percent} height={6} />
                </Card>

                {/* Outstanding Actions */}
                <Card className="p-5 border-l-4 border-l-[#E65100] flex flex-col justify-center shadow-sm">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-2.5 bg-[#FFF3E0] rounded-xl text-[#E65100] shrink-0">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest leading-none">Outstanding Actions</p>
                            <p className="text-xl font-bold text-[#1A2B49] leading-tight mt-0.5">
                                {stats.today} <span className="text-sm font-medium text-[#5F6F89]">Tasks for today</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-[#FFF3E0] border border-[#FFE0B2] text-[#E65100] text-[10px] font-bold rounded-full uppercase tracking-widest">
                            {stats.overdue} Overdue
                        </span>
                        <span className="px-3 py-1 bg-[#E3F2FD] border border-[#BBDEFB] text-[#1E88E5] text-[10px] font-bold rounded-full uppercase tracking-widest">
                            {stats.upcoming} Upcoming
                        </span>
                    </div>
                </Card>
            </div>

            {/* ── FILTER BAR + VIEW TOGGLE ──────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile dropdown */}
                <div className="lg:hidden relative flex-1">
                    <button
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-[#E3ECF5] rounded-xl text-[#1A2B49] shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-[#1E88E5]" />
                            <span className="text-[12px] font-bold uppercase tracking-widest">{filter}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E3ECF5] rounded-xl shadow-xl z-50 p-1.5"
                            >
                                {FILTERS.map(f => (
                                    <button key={f} onClick={() => { setFilter(f); setIsFilterMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-[#1E88E5] text-white' : 'text-[#5F6F89] hover:bg-[#F8FBFF]'}`}>
                                        {f}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop filter chips */}
                <div className="hidden lg:flex items-center gap-2 flex-wrap flex-1">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E3ECF5] bg-white text-[#5F6F89] shrink-0">
                        <Filter className="w-3.5 h-3.5 text-[#1E88E5]" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Filter Tasks</span>
                    </div>
                    {FILTERS.map(f => {
                        const count = f === 'All' ? stats.total : (stats[f.toLowerCase() as keyof typeof stats] as number) || 0;
                        return (
                            <FilterChip
                                key={f}
                                label={f.toUpperCase()}
                                active={filter === f}
                                onClick={() => setFilter(f)}
                                count={count}
                            />
                        );
                    })}
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-white p-1 rounded-xl border border-[#E3ECF5] shadow-sm h-fit shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#1E88E5] text-white shadow-sm' : 'text-[#7A8CA5] hover:text-[#5F6F89]'}`}
                        title="Grid view"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#1E88E5] text-white shadow-sm' : 'text-[#7A8CA5] hover:text-[#5F6F89]'}`}
                        title="List view"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── TASK SECTIONS ─────────────────────────────── */}
            <div className="flex flex-col gap-6">
                {sections.length === 0 ? (
                    <div className="py-16 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight">All Clear</h3>
                        <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">No tasks in this category.</p>
                    </div>
                ) : (
                    sections.map((section, idx) => (
                        <div key={idx} className="flex flex-col gap-3">

                            {/* Section header */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: section.dot }} />
                                <h3 className="text-base font-bold text-[#1A2B49] uppercase tracking-tight">
                                    {section.name}
                                    <span className="text-[#5F6F89] font-medium ml-2 text-sm">[{section.tasks.length}]</span>
                                </h3>
                            </div>

                            {/* Empty state for this section */}
                            {section.tasks.length === 0 ? (
                                <div className="py-8 px-6 text-center bg-[#F8FBFF] rounded-2xl border border-dashed border-[#E3ECF5]">
                                    <p className="text-[11px] font-bold text-[#B0BCCF] uppercase tracking-widest">No {section.name.toLowerCase()} tasks</p>
                                </div>
                            ) : (
                                <div className={viewMode === 'grid'
                                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
                                    : 'flex flex-col gap-2'
                                }>
                                    {section.tasks.map((task: any, tIdx: number) => {
                                        const sLabel = getTaskStatus(task).toUpperCase();
                                        const isDailyLog = ['DAILY_LOG', 'LOG'].includes(task.task_type) || ['DAILY_LOG', 'LOG'].includes(task.task_details?.task_type);
                                        const sColor = sLabel === 'COMPLETED' ? 'green' : sLabel === 'LOCKED' ? 'slate' : sLabel === 'OVERDUE' ? 'red' : sLabel === 'TODAY' ? 'orange' : 'blue';
                                        const isFormSig = task.task_details?.task_type === 'FORM_SIGNATURE';

                                        return (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: tIdx * 0.04 }}
                                            >
                                                {viewMode === 'grid' ? (
                                                    /* Grid card */
                                                    <Card className="group p-4 hover:border-[#1E88E5]/40 transition-all hover:shadow-md flex flex-col justify-between gap-3 h-full">
                                                        {/* Top */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-9 h-9 rounded-xl bg-[#F0F6FF] border border-[#E3ECF5] flex items-center justify-center shrink-0 group-hover:bg-[#E3F2FD] transition-colors">
                                                                    {sLabel === 'COMPLETED'
                                                                        ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                                                                        : isFormSig
                                                                            ? <FileText className="w-4.5 h-4.5 text-[#1E88E5]" />
                                                                            : <ClipboardList className="w-4.5 h-4.5 text-[#5F6F89] group-hover:text-[#1E88E5]" />
                                                                    }
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[9px] font-bold text-[#8A99B3] uppercase tracking-widest leading-none truncate">
                                                                        {task.task_details?.task_type?.replace(/_/g, ' ') || 'Clinical Task'}
                                                                    </p>
                                                                    <h5 className="text-[13px] font-bold text-[#1A2B49] uppercase leading-tight mt-0.5 truncate group-hover:text-[#1E88E5] transition-colors">
                                                                        {task.title}
                                                                    </h5>
                                                                </div>
                                                            </div>
                                                            <Badge color={sColor} className="text-[9px] shrink-0">{sLabel}</Badge>
                                                        </div>

                                                        {/* Meta row */}
                                                        <div className="flex items-center gap-3 text-[10px] font-bold text-[#8A99B3] uppercase tracking-wide">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {task.due_date
                                                                    ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                                                                    : 'Active Now'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {task.visit_name || 'Protocol Visit'}
                                                            </span>
                                                        </div>

                                                        {/* Action */}
                                                        <div className="flex gap-2">
                                                            {sLabel === 'LOCKED' ? (
                                                                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E3ECF5] bg-[#F8FBFF] text-[#B0BCCF] text-[11px] font-bold uppercase tracking-widest cursor-not-allowed">
                                                                    <Lock className="w-3.5 h-3.5" /> Locked
                                                                </button>
                                                            ) : sLabel === 'COMPLETED' ? (
                                                                <>
                                                                    <button onClick={() => onAction('VIEW_SUBMISSION', task)}
                                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E3ECF5] bg-[#F8FBFF] hover:bg-[#E3F2FD] text-[#1E88E5] text-[11px] font-bold uppercase tracking-widest transition-all">
                                                                        <Eye className="w-3.5 h-3.5" /> Preview
                                                                    </button>
                                                                    <button onClick={() => handleDownloadDummy(task)}
                                                                        className="px-3 flex items-center justify-center py-2.5 rounded-xl border border-[#E3ECF5] bg-white hover:bg-[#F8FBFF] text-[#5F6F89] transition-all">
                                                                        <Download className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => onAction(isFormSig ? 'SIGN_FORM' : ((task.status || '').toUpperCase() === 'IN_PROGRESS' ? 'RESUME_TASK' : 'START_TASK'), task)}
                                                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-sm text-white
                                                                        ${sLabel === 'OVERDUE' ? 'bg-[#D32F2F] hover:bg-[#B71C1C]' : 'bg-[#1E88E5] hover:bg-[#1565C0]'}`}>
                                                                    {isFormSig ? <FileText className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                                    {isFormSig ? 'Authorize' : task.status === 'IN_PROGRESS' ? 'Resume' : 'Execute'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </Card>
                                                ) : (
                                                    /* List row */
                                                    <Card className="group px-4 py-3 hover:border-[#1E88E5]/40 transition-all hover:shadow-md flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-xl bg-[#F0F6FF] border border-[#E3ECF5] flex items-center justify-center shrink-0 group-hover:bg-[#E3F2FD] transition-colors">
                                                            {sLabel === 'COMPLETED'
                                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                : isFormSig
                                                                    ? <FileText className="w-4 h-4 text-[#1E88E5]" />
                                                                    : <ClipboardList className="w-4 h-4 text-[#5F6F89] group-hover:text-[#1E88E5]" />
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-[13px] font-bold text-[#1A2B49] uppercase truncate group-hover:text-[#1E88E5] transition-colors">{task.title}</h5>
                                                            <p className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest truncate">
                                                                {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Active'} · {task.visit_name || 'Protocol Visit'}
                                                            </p>
                                                        </div>
                                                        <Badge color={sColor} className="text-[9px] shrink-0">{sLabel}</Badge>
                                                        <div className="shrink-0">
                                                            {sLabel === 'LOCKED' ? (
                                                                <button className="p-2 rounded-lg border border-[#E3ECF5] text-[#B0BCCF] cursor-not-allowed"><Lock className="w-3.5 h-3.5" /></button>
                                                            ) : sLabel === 'COMPLETED' ? (
                                                                <button onClick={() => onAction('VIEW_SUBMISSION', task)} className="p-2 rounded-lg border border-[#E3ECF5] hover:border-[#1E88E5] text-[#1E88E5] transition-all"><Eye className="w-3.5 h-3.5" /></button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => onAction(isFormSig ? 'SIGN_FORM' : ((task.status || '').toUpperCase() === 'IN_PROGRESS' ? 'RESUME_TASK' : 'START_TASK'), task)}
                                                                    className={`p-2 rounded-lg text-white transition-all active:scale-95 shadow-sm ${sLabel === 'OVERDUE' ? 'bg-[#D32F2F] hover:bg-[#B71C1C]' : 'bg-[#1E88E5] hover:bg-[#1565C0]'}`}>
                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </Card>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default React.memo(TasksView);
