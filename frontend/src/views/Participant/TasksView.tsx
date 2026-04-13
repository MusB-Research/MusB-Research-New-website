import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Calendar, CheckCircle2, AlertCircle, Lock,
    ChevronRight, ChevronDown, Zap, Trophy, Play, FileText,
    ClipboardList, Filter, LayoutGrid, List as ListIcon,
    Download, ExternalLink, HelpCircle, Eye, ArrowRight, Ship, XCircle
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
            { name: 'Today', tasks: categorized['Today'], color: 'amber' },
            { name: 'Upcoming', tasks: categorized['Upcoming'], color: 'amber' },
            { name: 'Completed', tasks: categorized['Completed'], color: 'green' },
            { name: 'Locked', tasks: categorized['Locked'], color: 'amber' }
        ].filter(g => g.tasks.length > 0 || (filter === g.name && g.name !== 'Locked'));

        if (filter !== 'All') {
            return allGroups.filter(g => g.name === filter);
        }

        return allGroups;
    }, [tasks, filter]);

    if (isLoading) {
        return (
            <div className="space-y-12 animate-pulse">
                <div className="flex flex-col lg:flex-row items-stretch gap-6 flex-1 w-full">
                    {[1, 2].map(i => (
                        <div key={i} className="flex-1 h-32 bg-white/5 border border-white/5 rounded-[2.5rem]" />
                    ))}
                    <div className="w-24 h-12 bg-white/5 rounded-2xl self-center" />
                </div>
                <div className="space-y-12">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-8">
                            <div className="h-8 w-48 bg-white/10 rounded-xl" />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[1, 2].map(j => (
                                    <div key={j} className="h-64 bg-white/5 border border-white/5 rounded-[3rem]" />
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
        pdf.setFillColor(10, 15, 29); // Command Center Dark
        pdf.rect(0, 0, 210, 45, 'F');
        pdf.setTextColor(245, 158, 11); // Amber
        pdf.setFontSize(26);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MusB RESEARCH PORTAL', 105, 25, { align: 'center' });
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('OFFICIAL RECORD | SECURE ASSET', 105, 35, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text(`${task?.title || 'ACTIVITY RECORD'}`, 20, 70);
        pdf.save('Protocol.pdf');
    };

    return (
        <div className="space-y-12 pb-20 text-left">
            <div className="flex flex-col lg:flex-row items-stretch gap-6 relative z-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
                    <Card className="p-7 border-l-4 border-l-amber-500 bg-[#0a101f]/50 backdrop-blur-sm flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-widest italic">Total Progress</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-white italic">{stats.percent}%</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-7 border-l-4 border-l-amber-500 bg-[#0a101f]/50 backdrop-blur-sm flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-amber-500" />
                                <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-widest italic">Current Assets</h4>
                            </div>
                            <div className="text-right font-black text-white text-4xl italic text-amber-500">
                                {stats.today} <span className="text-xs uppercase tracking-tighter not-italic text-slate-600">Tasks</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex bg-[#0a0f1d] p-1.5 rounded-2xl border border-white/5 shadow-2xl h-fit self-center relative">
                    <motion.div 
                        className="absolute bg-amber-500 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)]"
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
                        className={`relative z-10 p-2.5 rounded-xl transition-colors duration-300 ${viewMode === 'timeline' ? 'text-slate-950' : 'text-slate-600 hover:text-slate-400'} cursor-pointer`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`relative z-10 p-2.5 rounded-xl transition-colors duration-300 ${viewMode === 'list' ? 'text-slate-950' : 'text-slate-600 hover:text-slate-400'} cursor-pointer`}
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
                        className="flex items-center justify-between w-full px-6 py-4.5 bg-[#0a0f1d] border border-white/10 rounded-2xl text-slate-300 shadow-xl"
                    >
                        <div className="flex items-center gap-3">
                            <Filter className="w-5 h-5 text-amber-500" />
                            <span className="text-[15px] font-bold tracking-tight uppercase italic">{filter}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-3 bg-[#0d1424] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2">
                                {['Overdue', 'Today', 'Upcoming', 'Completed', 'Locked', 'All'].map((f) => (
                                    <button key={f} onClick={() => { setFilter(f); setIsFilterMenuOpen(false); }} className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all ${filter === f ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:bg-white/5 font-bold'}`}>
                                        <span className="uppercase tracking-tight italic">{f}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop Filter Bar */}
                <div className="hidden lg:flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/5 bg-white/[0.02] text-slate-500">
                        <Filter className="w-4 h-4" /><span className="text-[12px] font-black uppercase tracking-widest italic">Filter Logs</span>
                    </div>
                    {['Overdue', 'Today', 'Upcoming', 'Completed', 'Locked', 'All'].map((f) => {
                        const count = f === 'All' ? stats.total : stats[f.toLowerCase() as keyof typeof stats] || 0;
                        return <FilterChip key={f} label={f.toUpperCase()} active={filter === f} onClick={() => setFilter(f)} count={count as number} />;
                    })}
                </div>
            </div>

            <div className="space-y-16">
                {groupedTasks.length === 0 ? (
                    <div className="py-24 text-center">
                        <CheckCircle2 className="w-16 h-16 text-white/10 mx-auto mb-6" strokeWidth={1} />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Queue Clear</h3>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs mt-2 italic">All clinical actions in this stack are complete.</p>
                    </div>
                ) : (
                    groupedTasks.map((section, idx) => (
                        <div key={idx} className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-white/[0.05] pb-5">
                                <div className={`w-2.5 h-2.5 rounded-full ${section.name === 'Overdue' ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-amber-500 shadow-[0_0_15px_#f59e0b]'}`} />
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{section.name} <span className="text-slate-600 ml-2 font-bold tracking-normal italic">[{section.tasks.length}]</span></h3>
                            </div>
                            <div className={viewMode === 'timeline' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
                                {section.tasks.map((task: any, tIdx: number) => {
                                    const sLabel = getTaskStatus(task).toUpperCase();
                                    const windowOpen = task.q_data?.window_open_at ? new Date(task.q_data.window_open_at) : null;
                                    const isDailyLog = task.task_type === 'DAILY_LOG' || task.task_details?.task_type === 'DAILY_LOG' || task.task_type === 'LOG';

                                    const sColor =
                                        sLabel === 'COMPLETED' ? 'green' :
                                            sLabel === 'LOCKED' ? 'amber' :
                                                sLabel === 'OVERDUE' ? 'red' :
                                                    sLabel === 'TODAY' ? 'amber' :
                                                        sLabel === 'UPCOMING' ? 'amber' : 'amber';

                                    return (
                                        <motion.div key={task.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: tIdx * 0.05 }}>
                                            <Card className={`group relative transition-all hover:border-amber-500/20 rounded-[2.5rem] bg-[#0a101f]/80 ${viewMode === 'timeline' ? 'p-8 space-y-6' : 'p-5'}`}>
                                                {sLabel === 'OVERDUE' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-t-[2.5rem]" />}

                                                <div className={`flex ${viewMode === 'timeline' ? 'flex-col' : 'flex-row items-center justify-between gap-6'}`}>
                                                    <div className={`flex flex-1 justify-between items-start ${viewMode === 'list' ? 'items-center' : ''}`}>
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-12 h-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all`}>
                                                                {sLabel === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6" /> :
                                                                    task.task_details?.task_type === 'FORM_SIGNATURE' ? <FileText className="w-6 h-6 text-amber-500 group-hover:text-slate-950" /> :
                                                                        <Clock className="w-6 h-6 text-slate-500 group-hover:text-slate-950" />}
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block italic">{task.task_details?.task_type || 'Clinical Asset'}</span>
                                                                <h5 className={`${viewMode === 'timeline' ? 'text-[18px]' : 'text-[19px]'} font-black text-white italic uppercase tracking-tighter group-hover:text-amber-500 transition-colors`}>{task.title}</h5>
                                                            </div>
                                                        </div>
                                                        <Badge color={sColor}>{sLabel}</Badge>
                                                    </div>

                                                    {viewMode === 'timeline' && (
                                                        <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/[0.03]">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Status Date</p>
                                                                <p className="text-sm font-black text-slate-300 uppercase italic tracking-tighter">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Active Now'}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Classification</p>
                                                                <p className="text-sm font-black text-slate-300 uppercase italic tracking-tighter">{isDailyLog ? 'Protocol Log' : 'Secure Form'}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={`flex gap-3 ${viewMode === 'timeline' ? 'pt-4' : 'w-72'}`}>
                                                        {sLabel === 'LOCKED' ? (
                                                            <button className="flex-1 bg-white/5 text-slate-600 py-4 rounded-2xl border border-white/5 cursor-not-allowed flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest italic">
                                                                <Lock className="w-4 h-4" /> SECURE LOCK
                                                            </button>
                                                        ) : sLabel === 'COMPLETED' ? (
                                                            <div className="flex gap-2 flex-1">
                                                                <button onClick={() => onAction('VIEW_SUBMISSION', task)} className="flex-1 bg-white/5 border border-white/5 text-slate-400 py-4 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-amber-500/10 hover:text-amber-500 italic">
                                                                    <Eye className="w-4 h-4" /> PREVIEW
                                                                </button>
                                                                <button onClick={() => onAction('DOWNLOAD_PDF', task)} className="px-5 bg-white/5 border border-white/5 text-slate-400 py-4 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10 hover:text-white">
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
                                                                className={`flex-1 ${sLabel === 'OVERDUE' ? 'bg-red-500 text-white shadow-[0_10px_20px_rgba(239,68,68,0.2)]' : 'bg-amber-500 text-slate-950 shadow-[0_10px_20px_rgba(245,158,11,0.2)]'} py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-xl`}
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




