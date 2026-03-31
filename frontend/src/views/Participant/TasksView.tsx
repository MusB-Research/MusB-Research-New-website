import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Calendar, CheckCircle2, AlertCircle, Lock, 
    ChevronRight, Zap, Trophy, Play, FileText, 
    ClipboardList, Filter, LayoutGrid, List as ListIcon,
    Download, ExternalLink, HelpCircle, Eye
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
    estimated_time: string;
    task_type: string;
    is_locked?: boolean;
    task_details?: {
        task_type: string;
        description: string;
    };
}

const TasksView = ({ tasks = [], onAction, study, userName }: { tasks: any[]; onAction: (t: string, task?: any) => void; study?: any; userName?: string }) => {
    const [filter, setFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

    // Stats Calculation
    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const overdue = tasks.filter(t => t.status === 'OVERDUE' || (new Date(t.due_date) < new Date() && t.status === 'PENDING')).length;
        const locked = tasks.filter(t => t.is_locked || t.status === 'LOCKED').length;
        const pending = total - completed - inProgress - overdue - locked;

        return {
            total, completed, inProgress, overdue, locked, pending,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }, [tasks]);

    // Grouping Logic
    const groupedTasks = useMemo(() => {
        let filtered = tasks;
        if (filter !== 'All') {
            if (filter === 'Today') {
                const today = new Date().toISOString().split('T')[0];
                filtered = tasks.filter(t => t.due_date.startsWith(today));
            } else if (filter === 'Upcoming') {
                filtered = tasks.filter(t => new Date(t.due_date) > new Date() && t.status !== 'COMPLETED');
            } else {
                filtered = tasks.filter(t => {
                    const s = t.status === 'PENDING' && new Date(t.due_date) < new Date() ? 'OVERDUE' : t.status;
                    return s.toUpperCase() === filter.toUpperCase();
                });
            }
        }

        const visits: Record<string, any> = {};
        filtered.forEach(task => {
            const vName = task.visit_name || 'Unassigned Visit';
            if (!visits[vName]) {
                visits[vName] = {
                    name: vName,
                    tasks: [],
                    completed: 0,
                    total: 0,
                    timeline: {}
                };
            }
            visits[vName].tasks.push(task);
            visits[vName].total++;
            if (task.status === 'COMPLETED') visits[vName].completed++;

            const tGroup = task.timeline_group || 'Scheduled';
            if (!visits[vName].timeline[tGroup]) {
                visits[vName].timeline[tGroup] = [];
            }
            visits[vName].timeline[tGroup].push(task);
        });

        return Object.values(visits).sort((a, b) => a.name.localeCompare(b.name));
    }, [tasks, filter]);

    const getStatusColor = (status: string, dueDate?: string) => {
        if (status === 'COMPLETED') return 'green';
        if (status === 'IN_PROGRESS') return 'indigo';
        if (status === 'LOCKED') return 'amber';
        if (dueDate && new Date(dueDate) < new Date() && status !== 'COMPLETED') return 'red';
        if (status === 'PENDING') return 'cyan';
        return 'slate';
    };

    const getStatusLabel = (status: string, dueDate?: string) => {
        if (status === 'COMPLETED') return 'Submitted';
        if (status === 'IN_PROGRESS') return 'In Progress';
        if (status === 'LOCKED') return 'Locked';
        if (dueDate && new Date(dueDate) < new Date() && status !== 'COMPLETED') return 'Overdue';
        if (status === 'PENDING') return 'Not Started';
        return status;
    };

    const handleDownloadDummy = (task?: any) => {
        const pdf = new jsPDF();
        
        // --- Add MusB Branding ---
        pdf.setFillColor(13, 20, 36);
        pdf.rect(0, 0, 210, 40, 'F');
        
        pdf.setTextColor(34, 211, 238);
        pdf.setFontSize(26);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MUSB RESEARCH PVT. LTD.', 105, 20, { align: 'center' });

        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('MUSB-PROTOCOL-SYNC | HEALTH AND LIFESTYLE SURVEY', 105, 30, { align: 'center' });

        // --- Survey Content ---
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text("STUDY TITLE: HEALTH AND LIFESTYLE SURVEY", 20, 60);
        
        pdf.setDrawColor(34, 211, 238);
        pdf.line(20, 65, 190, 65);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text("PURPOSE:", 20, 75);
        pdf.setFont('helvetica', 'normal');
        pdf.text("This study is being conducted to understand general health and lifestyle patterns.", 20, 82);

        pdf.setFont('helvetica', 'bold');
        pdf.text("PARTICIPATION:", 20, 92);
        pdf.setFont('helvetica', 'normal');
        pdf.text("- Your participation is voluntary and you can stop at any time.", 20, 99);

        pdf.setFont('helvetica', 'bold');
        pdf.text("WHAT YOU WILL DO:", 20, 109);
        pdf.setFont('helvetica', 'normal');
        pdf.text("- Answer simple questions and share habits (10-15 min requirement).", 20, 116);

        pdf.setFont('helvetica', 'bold');
        pdf.text("PRIVACY & CONFIDENTIALITY:", 20, 126);
        pdf.setFont('helvetica', 'normal');
        pdf.text("- Your data is encrypted and de-identified per MusB protocols.", 20, 133);

        pdf.setFont('helvetica', 'bold');
        pdf.text("CONSENT TERMS:", 20, 145);
        const termsText = [
            "1. Participation is 100% voluntary and revocable at any clinical node point.",
            "2. Biometric sync requires daily logging of health metrics (Habits, Sleep, etc).",
            "3. Data is encrypted via AES-256 and de-identified for MUSB Research analysis.",

            "4. No major risks involved; participants may skip personal habits questions.",
            "5. Direct benefit for survey participation includes study credits and node access."
        ];
        pdf.setFont('helvetica', 'normal');
        pdf.text(termsText, 25, 153);

        // --- Participant Box ---
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(20, 195, 170, 50);
        pdf.setFont('helvetica', 'bold');
        pdf.text("PARTICIPANT ATTESTATION", 25, 205);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`NAME: ${userName?.toUpperCase() || study?.participant_name || 'PARTICIPANT'}`, 30, 215);
        pdf.text(`DATE: ${new Date().toLocaleDateString()}`, 30, 222);
        pdf.text(`TIME: ${new Date().toLocaleTimeString()}`, 30, 229);
        
        if (task?.status === 'COMPLETED') {
            pdf.setTextColor(34, 197, 94); // Green
            pdf.setFontSize(22);
            pdf.setFont('helvetica', 'bold');
            pdf.text("VERIFIED & SIGNED", 115, 225, { angle: 10 });
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
        } else {
            pdf.setFont('courier', 'italic');
            pdf.setFontSize(14);
            pdf.text("X ____________________", 30, 238);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text("(Electronic Signature Node Verification Pending)", 90, 238);
        }

        // Footer
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Document uniquely hashed for ${userName || 'Participant'}. Protocol ABC-HLS-2026. Data Node: MUSB-V-SYNC`, 105, 285, { align: 'center' });

        pdf.save(`ABC_Consent_${userName?.replace(/\s+/g, '_') || 'Study'}.pdf`);
    };

    const handleViewProtocol = (task?: any) => {
        const pdf = new jsPDF();
        
        // branding
        pdf.setFillColor(13, 20, 36);
        pdf.rect(0, 0, 210, 40, 'F');
        pdf.setTextColor(34, 211, 238);
        pdf.setFontSize(26);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MUSB RESEARCH PVT. LTD.', 105, 20, { align: 'center' });

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(`SECURE PREVIEW | STATUS: ${task?.status || 'PENDING'}`, 105, 30, { align: 'center' });

        // details
        pdf.setTextColor(0,0,0);
        pdf.setFontSize(16);
        pdf.text("HEALTH AND LIFESTYLE SURVEY: CONSENT PROTOCOL", 20, 60);
        pdf.setDrawColor(34, 211, 238);
        pdf.line(20, 65, 190, 65);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const previewText = "You are reviewing the Informed Consent Form for study protocol ABC-HLS-2026. This study analyzes the correlation between habit synchronization and physiological stability. All data is managed within the secure MusB clinical cloud.";
        pdf.text(pdf.splitTextToSize(previewText, 170), 20, 75);

        // Content Sections
        const sections = [
            { t: "1. PURPOSE", c: "To map health patterns via digital habit tracking." },
            { t: "2. PARTICIPATION", c: "Voluntary participation. One may withdraw at any node cycle." },
            { t: "3. RISKS & BENEFITS", c: "Zero physiological risk. Enhanced health awareness through data." },
            { t: "4. PRIVACY", c: "AES-256 End-to-End Encryption with biometric hashing." }
        ];

        let cursorY = 95;
        sections.forEach(s => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(s.t, 20, cursorY);
            pdf.setFont('helvetica', 'normal');
            pdf.text(s.c, 30, cursorY + 7);
            cursorY += 18;
        });

        // participant field box
        const isComplete = task?.status === 'COMPLETED';
        pdf.setDrawColor(isComplete ? 34 : 150, isComplete ? 197 : 150, isComplete ? 94 : 150);
        pdf.setLineDashPattern([2, 1], 0);
        pdf.rect(20, 180, 170, 50);
        pdf.setFont('helvetica', 'bold');
        pdf.text("SECURE ATTESTATION NODE", 25, 190);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`PARTICIPANT: ${userName?.toUpperCase() || 'B.K. LPUINSTA'}`, 30, 205);
        pdf.text(`SYNC DATE: ${new Date().toLocaleDateString()}`, 30, 215);
        
        if (isComplete) {
            pdf.setTextColor(34, 197, 94);
            pdf.setFontSize(18);
            pdf.text("VERIFIED & SIGNED", 110, 212);
            pdf.setFontSize(8);
            pdf.text("ID: " + Math.random().toString(36).substring(7).toUpperCase(), 110, 218);
        } else {
            pdf.text("STATUS: AWAITING SIGNATURE", 90, 215);
        }

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
    };

    return (
        <div className="space-y-12 pb-20">
            {/* ──────────────── HEADER ──────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase italic mb-2">My Tasks</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">View your study schedule, complete tasks on time, and track your progress.</p>
                </div>
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                    <button 
                        onClick={() => setViewMode('timeline')}
                        className={`p-3 rounded-xl transition-all ${viewMode === 'timeline' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ──────────────── STUDY PROGRESS ──────────────── */}
            <Card className="p-8 border-l-4 border-l-cyan-500">
                <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                    <div>
                        <h4 className="text-lg font-black text-white italic uppercase mb-1">Study Progress</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-cyan-400 italic leading-none">{stats.completed}</span>
                            <span className="text-slate-500 font-bold uppercase text-sm">of {stats.total} tasks completed</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-4xl font-black text-white italic leading-none">{stats.percent}%</span>
                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mt-1">TOTAL MISSION PROGRESS</p>
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

                <Legend 
                    items={[
                        { label: 'Not Started', color: 'bg-white/20' },
                        { label: 'In Progress', color: 'bg-indigo-500' },
                        { label: 'Locked', color: 'bg-amber-500' },
                        { label: 'Overdue', color: 'bg-red-500' },
                        { label: 'Submitted', color: 'bg-[#00e676]' }
                    ]} 
                />
            </Card>

            {/* ──────────────── FILTER BAR ──────────────── */}
            <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar relative z-50">
                <button 
                    onClick={() => setFilter('All')}
                    className={`flex items-center gap-2 mr-4 px-4 py-2 rounded-xl border transition-all cursor-pointer ${filter === 'All' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                >
                    <Filter className="w-4 h-4" />
                    <span className="text-[12px] font-black uppercase tracking-widest">Filter</span>
                </button>

                {['All', 'Today', 'Upcoming', 'Completed', 'Overdue', 'Locked'].map((f) => (
                    <FilterChip 
                        key={f} 
                        label={f} 
                        active={filter === f} 
                        onClick={() => setFilter(f)} 
                        count={f === 'All' ? stats.total : undefined}
                    />
                ))}
            </div>

            {/* ──────────────── TASK SECTIONS ──────────────── */}
            <div className="space-y-16">
                {groupedTasks.length === 0 ? (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 group">
                            <CheckCircle2 className="w-10 h-10 text-slate-700 group-hover:text-cyan-500 transition-colors" strokeWidth={1} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">You're All Caught Up!</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px] mt-2">Zero active sync items in your current queue.</p>
                        </div>
                    </div>
                ) : (
                    groupedTasks.map((visit, idx) => (
                        <div key={idx} className="space-y-8">
                            {/* Visit Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.05] pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 text-cyan-400 font-black italic">
                                        V{idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{visit.name}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                                {visit.completed} of {visit.total} tasks completed
                                            </span>
                                            <div className="w-32">
                                                <ProgressBar percent={Math.round((visit.completed / visit.total) * 100)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Badge color={visit.completed === visit.total ? 'green' : 'cyan'}>
                                    {visit.completed === visit.total ? 'VISIT COMPLETE' : 'IN PROGRESS'}
                                </Badge>
                            </div>

                            {/* Timeline Groups */}
                            <div className="space-y-12 pl-4 md:pl-8 border-l border-white/[0.05]">
                                {Object.entries(visit.timeline).map(([group, tks]: [string, any], gIdx) => (
                                    <div key={gIdx} className="relative">
                                        {/* Timeline Anchor */}
                                        <div className="absolute -left-[1.25rem] md:-left-[2.25rem] top-0 w-2 h-2 rounded-full bg-white/20 border border-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                                        
                                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6 inline-block bg-slate-900 pr-4">
                                            {group}
                                        </h4>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {tks.map((task: any, tIdx: number) => {
                                                const statusColor = getStatusColor(task.status, task.due_date);
                                                const statusLabel = getStatusLabel(task.status, task.due_date);
                                                const isOverdue = statusLabel === 'Overdue';

                                                return (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: (idx * 0.1) + (gIdx * 0.05) + (tIdx * 0.03) }}
                                                    >
                                                        <Card className={`group relative overflow-hidden transition-all duration-300 hover:border-white/20 hover:translate-y-[-4px] ${task.status === 'IN_PROGRESS' ? 'border-indigo-500/30 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10' : ''}`}>
                                                            {isOverdue && (
                                                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_#ef4444]" />
                                                            )}
                                                            
                                                            <div className="p-6 space-y-6">
                                                                {/* Card Top */}
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                                                                            {task.task_details?.task_type || 'RESEARCH TASK'} | {task.estimated_time || '15 min'}
                                                                        </span>
                                                                        <h5 className="text-lg font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                                                                            {task.title}
                                                                        </h5>
                                                                    </div>
                                                                    <Badge color={statusColor} className={isOverdue ? 'animate-pulse' : ''}>
                                                                        {statusLabel}
                                                                    </Badge>
                                                                </div>

                                                                {/* Card Mid */}
                                                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/[0.05]">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-4 h-4 text-slate-500" />
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-slate-600 uppercase">Window</span>
                                                                            <span className="text-[12px] font-bold text-slate-400">
                                                                                {new Date(task.due_date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="w-4 h-4 text-slate-500" />
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-slate-600 uppercase">Exp. Time</span>
                                                                            <span className="text-[12px] font-bold text-slate-400">{task.estimated_time || '15 min'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Card Actions */}
                                                                <div className="flex flex-col md:flex-row gap-3 pt-2">
                                                                    {task.status === 'LOCKED' ? (
                                                                        <button className="flex-1 bg-white/5 text-slate-500 py-3 rounded-xl border border-white/5 cursor-not-allowed flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest">
                                                                            <Lock className="w-4 h-4" />
                                                                            Locked Mission
                                                                        </button>
                                                                    ) : task.status === 'COMPLETED' ? (
                                                                        <button 
                                                                            onClick={() => onAction('VIEW_SUBMISSION', task)}
                                                                            className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-widest"
                                                                        >
                                                                            <FileText className="w-4 h-4 text-green-400" />
                                                                            Review Data
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => onAction(task.status === 'IN_PROGRESS' ? 'RESUME_MISSION' : 'START_MISSION', task)}
                                                                            className={`flex-1 ${isOverdue ? 'bg-red-500 hover:bg-red-400' : 'bg-cyan-500 hover:bg-cyan-400'} text-slate-950 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95`}
                                                                        >
                                                                            {task.status === 'IN_PROGRESS' ? <Zap className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                                                                            {task.status === 'IN_PROGRESS' ? 'Resume Mission' : isOverdue ? 'Complete Now' : task.task_details?.task_type === 'CONSENT' ? 'Initialize Signing' : 'Initialize Mission'}
                                                                        </button>
                                                                    )}
                                                                    
                                                                    <div className="flex gap-2">
                                                                        {task.task_details?.task_type === 'CONSENT' && (
                                                                            <button 
                                                                                onClick={() => handleViewProtocol(task)}
                                                                                title="Preview Protocol"
                                                                                className="p-3 bg-white/5 border border-white/5 text-cyan-400 hover:text-white hover:border-cyan-500/30 rounded-xl transition-all"
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                        <button 
                                                                            onClick={() => handleDownloadDummy(task)}
                                                                            title="Download Protocol"
                                                                            className="p-3 bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:border-white/10 rounded-xl transition-all"
                                                                        >
                                                                            <Download className="w-4 h-4" />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => onAction('GET_HELP', task)}
                                                                            title="Contact Coordinator"
                                                                            className="p-3 bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:border-white/10 rounded-xl transition-all"
                                                                        >
                                                                            <HelpCircle className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Status Effect */}
                                                            {task.status === 'IN_PROGRESS' && (
                                                                <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-[2rem] pointer-events-none animate-pulse" />
                                                            )}
                                                        </Card>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TasksView;
