import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, clearToken, authFetch, getRole } from '../utils/auth';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal'; // Added import
import AnimatedBackground from '../components/AnimatedBackground';
import {
    LayoutDashboard, ClipboardList, Box, Activity, MessageSquare, FileText,
    User, Bell, LogOut, TrendingUp, Trophy, Target, ListTodo, ArrowRight,
    Zap, PlusCircle, Calendar, Clock, Download, PlayCircle, Send, Upload,
    AlertTriangle, CheckCircle2, Smile, Frown, Truck, Camera, Check, PhoneCall,
    MessageCircle, FileCheck, Lock, HelpCircle, Package, Link2, Paperclip, ClipboardCheck, X, ShieldCheck, Eye, Edit, Mail, Phone, MapPin, Globe, Menu
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────────────────── */
const Card = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div className={`bg-[#0d1525]/60 border border-white/[0.06] rounded-[2rem] p-6 shadow-2xl relative overflow-hidden ${className}`} onClick={onClick}>
        {children}
    </div>
);

const Badge = ({ children, color = "cyan" }: { children: React.ReactNode; color?: "cyan" | "green" | "red" | "amber" }) => {
    const colors = {
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        green: "bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return (
        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${colors[color]}`}>
            {children}
        </span>
    );
};

const ActionModal = ({ isOpen, title, desc, action, onClose }: any) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0e1a]/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    className="bg-[#0f172a] border border-white/[0.1] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-[13px] text-slate-400 mb-8 leading-relaxed">{desc}</p>
                    <button
                        onClick={() => {
                            onClose();
                            // Here you'd trigger actual route changes or API calls
                        }}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    >
                        {action}
                    </button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

/* ─────────────────────────────────────────────────────────────────
   DASHBOARD COMPONENTS (FROM V1)
───────────────────────────────────────────────────────────────── */
interface StatCardProps {
    icon: React.ReactNode;
    value: string;
    label: string;
    iconBg: string;
}
const StatCard = ({ icon, value, label, iconBg }: StatCardProps) => (
    <div className="flex items-center gap-4 bg-[#0d1525]/60 border border-white/[0.06] rounded-2xl p-4 sm:p-5 hover:border-cyan-500/20 transition-all group w-full">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform shadow-lg`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <div className="text-xl sm:text-3xl font-black text-white leading-none tracking-tight truncate">{value}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mt-1 truncate group-hover:text-cyan-400 transition-colors">{label}</div>
        </div>
    </div>
);

interface TaskItemProps {
    title: string;
    duration: string;
    isLast?: boolean;
}
const TaskItem = ({ title, duration, isLast }: TaskItemProps) => (
    <div className="relative flex items-stretch gap-3 sm:gap-5 group cursor-pointer hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex flex-col items-center flex-shrink-0 pt-1">
            <div className="w-3 h-3 rounded-full bg-[#1a2540] border-2 border-cyan-500 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all flex-shrink-0" />
            {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-cyan-500/50 to-slate-700/50 mt-1 mb-1" />}
        </div>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1525]/50 border border-white/[0.05] rounded-2xl p-4 sm:px-6 sm:py-5 flex-1 ${!isLast ? 'mb-4' : ''} group-hover:border-cyan-500/40 transition-all`}>
            <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate group-hover:text-cyan-400 transition-colors">{title}</h4>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                    NAD+ LONGEVITY TRIAL | {duration}
                </p>
            </div>
            <button className="bg-[#00c9e0] hover:bg-[#00b8ce] text-slate-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] flex-shrink-0 self-start sm:self-auto w-full sm:w-auto text-center">
                Start Task
            </button>
        </div>
    </div>
);

interface SupplementItemProps {
    name: string;
    time: string;
    isActive: boolean;
}
const SupplementItem = ({ name, time, isActive }: SupplementItemProps) => (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
        <div>
            <p className="text-sm font-bold text-white">{name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{time}</p>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#00e676] border-[#00e676]' : 'border-slate-600 bg-transparent'}`}>
            {isActive && <Check className="w-4 h-4 text-slate-900 font-black" />}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────────
   VIEWS
───────────────────────────────────────────────────────────────── */

import { CheckSquare as CheckSquareIcon } from 'lucide-react';

// 1. HOME VIEW
const DashboardView = ({ firstName, today, onAction, tasks, study }: any) => (
    <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.25em]">{today}</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic text-white mt-1 tracking-tight leading-[1.1]">
                    Welcome back, <span className="text-white">{firstName}</span>
                </h1>
                {study && (
                    <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mt-1">
                        Active in: <span className="text-white">{study.title}</span>
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 mt-1 bg-[#0d1525]/80 border border-[#00e676]/20 rounded-full px-5 py-2.5 shadow-[0_0_15px_rgba(0,230,118,0.1)] flex-shrink-0 cursor-pointer hover:bg-[#00e676]/10 transition-colors" onClick={() => onAction('Study Details')}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676] animate-pulse" />
                <span className="text-xs font-black text-[#00e676] uppercase tracking-widest">Live Study Status</span>
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatCard icon={<TrendingUp className="w-5 h-5 text-[#00e676]" />} value="94%" label="Medication Adherence" iconBg="bg-[#00e676]/10" />
            <StatCard icon={<Trophy className="w-5 h-5 text-amber-500" />} value="$120" label="Protocol Earnings" iconBg="bg-amber-500/10" />
            <StatCard icon={<Target className="w-5 h-5 text-indigo-400" />} value="18" label="Days in Study" iconBg="bg-indigo-500/10" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-cyan-400" />} value="3" label="Pending Tasks" iconBg="bg-cyan-500/10" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Today's Tasks</h3>
                </div>

                <div className="pl-2">
                    {tasks && tasks.length > 0 ? (
                        tasks.slice(0, 3).map((task: any, idx: number) => (
                            <div key={task.id} onClick={() => onAction(task.task_details.title)} className="cursor-pointer">
                                <TaskItem
                                    title={task.task_details.title}
                                    duration={task.task_details.frequency}
                                    isLast={idx === (tasks.length > 3 ? 2 : tasks.length - 1)}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-slate-500 uppercase font-black italic tracking-widest py-4">No tasks scheduled for today.</p>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Box className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Supplements</h3>
                    </div>
                    <div>
                        <SupplementItem name="NAD+ Supplement (Capsule)" time="08:00 AM" isActive={true} />
                        <SupplementItem name="Multivitamin" time="08:00 AM" isActive={true} />
                        <SupplementItem name="NAD+ Supplement (Capsule)" time="02:00 PM" isActive={false} />
                        <SupplementItem name="Omega-3 (Fish Oil)" time="08:00 PM" isActive={false} />
                    </div>
                </Card>

                <Card className="p-6 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Study Insights</h3>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                        <div className="text-6xl font-black text-white italic tracking-tighter">84<span className="text-3xl">%</span></div>
                        <div className="text-xs font-bold text-[#00e676] uppercase tracking-widest mb-2">Compliance</div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-[#00e676] w-[84%] rounded-full relative">
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
);

// 2. TASKS VIEW
const TasksView = ({ onAction, tasks }: any) => (
    <div className="flex flex-col h-full space-y-4">
        <div>
            <h2 className="text-2xl font-black text-white italic tracking-tight">My Task Timeline</h2>
            <p className="text-[12px] text-slate-400 mt-1">All scheduled tasks for your active study will appear here.</p>
        </div>

        <div className="flex-1 space-y-4 mt-6">
            {tasks && tasks.length > 0 ? (
                tasks.map((task: any) => (
                    <Card key={task.id} className="p-6 hover:border-cyan-500/30 transition-all cursor-pointer group" onClick={() => onAction(task.task_details.title)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                    {task.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase italic tracking-tight">{task.task_details.title}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{task.task_details.frequency} Protocol</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-500'}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DUE BY</p>
                                <p className="text-[11px] font-bold text-white mt-1">{new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </Card>
                ))
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-32 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 shadow-lg relative backdrop-blur-sm">
                        <Lock className="w-6 h-6 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 text-center">No Tasks Assigned</h3>
                    <p className="text-[12px] text-slate-400 text-center max-w-sm leading-relaxed">
                        Once you are enrolled in a clinical study, your timeline will activate automatically.
                    </p>
                </div>
            )}
        </div>
    </div>
);

// 3. STUDY KIT VIEW
const StudyKitView = ({ onAction }: { onAction: (t: string) => void }) => (
    <div className="space-y-8 flex flex-col h-full">
        <div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">Study Kit Status</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 w-full">
            {/* Outbound Shipment */}
            <Card className="flex flex-col bg-[#0a101f] border-white/[0.05] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Outbound Shipment</h3>
                        <p className="text-[12px] text-slate-400 mt-0.5">Kit #SK-8291</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-4">
                        <span className="text-[12px] text-slate-400 font-bold">Status</span>
                        <div className="bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20 px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wide">
                            Delivered
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-4">
                        <span className="text-[12px] text-slate-400 font-bold">Date</span>
                        <span className="text-[13px] text-white font-bold">Jan 15, 2026</span>
                    </div>

                    <button onClick={() => onAction('Track Outbound Shipment')} className="w-full mt-2 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/[0.08] py-4 rounded-xl flex justify-center items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all">
                        <Link2 className="w-4 h-4 text-slate-400" /> TRACK SHIPMENT
                    </button>
                </div>
            </Card>

            {/* Return Shipment */}
            <Card className="flex flex-col bg-[#0a101f] border-white/[0.05] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Return Shipment</h3>
                        <p className="text-[12px] text-slate-400 mt-0.5">Due by Mar 10, 2026</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1424]/80 border border-white/[0.02] rounded-2xl p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                    <p className="text-[13px] text-slate-400 mb-6 relative z-10">You have not shipped the kit back yet.</p>
                    <button onClick={() => onAction('Generate Return Label')} className="bg-[#4d3a1f] hover:bg-[#5e4726] text-amber-500 px-6 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg relative z-10 flex items-center gap-2">
                        GENERATE RETURN LABEL
                    </button>
                </div>
            </Card>
        </div>

        {/* Actions Required Bottom Section */}
        <div className="pt-4 relative z-10 w-full mb-8">
            <div className="flex items-center gap-2 mb-6">
                <CheckSquareIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-black text-white px-1">Actions Required</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Action 1 */}
                <div onClick={() => onAction('Confirm Kit Receipt')} className="bg-[#0a101f] border border-white/[0.05] rounded-2xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 mb-6 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">Confirm Receipt</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Let us know you received the kit safely.</p>
                </div>

                {/* Action 2 */}
                <div onClick={() => onAction('Upload Condition Photo')} className="bg-[#0a101f] border border-white/[0.05] rounded-2xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 mb-6 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                        <Camera className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">Upload Photo</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Optional proof of shipment condition.</p>
                </div>

                {/* Action 3 */}
                <div onClick={() => onAction('View Kit Instructions')} className="bg-[#0a101f] border border-white/[0.05] rounded-2xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 mb-6 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">Instructions</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">View PDF manual or watch video guides.</p>
                </div>
            </div>
        </div>
    </div>
);

// 4. LOGS VIEW
const LogsView = ({ onAction }: { onAction: (t: string) => void }) => (
    <div className="space-y-6 max-w-5xl">
        <h2 className="text-3xl font-black text-white italic tracking-tight mb-8">Daily Logs & Reporting</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplement Log */}
            <Card className="bg-[#0a101f] border-white/[0.05] p-6 !pt-8 shadow-xl flex flex-col group hover:border-cyan-500/30 transition-all cursor-pointer"
                onClick={() => onAction('Supplement Log')}>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 flex-shrink-0 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                    <Box className="w-6 h-6" />
                </div>
                <h3 className="text-[19px] font-black text-white tracking-tight mb-2">Supplement Log</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed mb-8 flex-1">Record dose amounts, exact time taken, or report skipped doses.</p>
                <button className="w-full py-4 bg-white/[0.03] border border-white/[0.08] group-hover:bg-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all pointer-events-none">
                    OPEN LOG MENU
                </button>
            </Card>

            {/* Daily Wellness */}
            <Card className="bg-[#0a101f] border-white/[0.05] p-6 !pt-8 shadow-xl flex flex-col group hover:border-[#00e676]/30 transition-all cursor-pointer"
                onClick={() => onAction('Daily Wellness Logging')}>
                <div className="w-12 h-12 bg-[#00e676]/10 rounded-2xl flex items-center justify-center text-[#00e676] mb-6 flex-shrink-0 border border-[#00e676]/20 group-hover:bg-[#00e676]/20 transition-all">
                    <Smile className="w-6 h-6" />
                </div>
                <h3 className="text-[19px] font-black text-white tracking-tight mb-2">Daily Wellness</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed mb-8 flex-1">Quick rating scale for mood, energy levels, and sleep quality.</p>
                <button className="w-full py-4 bg-white/[0.03] border border-white/[0.08] group-hover:bg-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all pointer-events-none">
                    RECORD STATUS
                </button>
            </Card>

            {/* Adverse Event */}
            <Card className="bg-[#0a101f] border-white/[0.05] p-6 !pt-8 shadow-xl flex flex-col group hover:border-red-500/30 transition-all cursor-pointer"
                onClick={() => onAction('Adverse Event Reporting')}>
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 flex-shrink-0 border border-red-500/20 group-hover:bg-red-500/20 transition-all">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-[19px] font-black text-white tracking-tight mb-2">Adverse Event (AE)</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed mb-8 flex-1">Report any negative symptoms, severity, and onset date to the clinical team.</p>
                <button className="w-full py-4 bg-red-500/5 group-hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 transition-all pointer-events-none tracking-[0.1em]">
                    REPORT ISSUE
                </button>
            </Card>
        </div>

        <Card className="mt-8 bg-white/[0.02]">
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Recent Entries</h3>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/10 text-[9px] uppercase tracking-widest text-slate-500">
                        <th className="pb-3 font-bold">Date</th>
                        <th className="pb-3 font-bold">Log Type</th>
                        <th className="pb-3 font-bold">Details</th>
                        <th className="pb-3 font-bold">Status</th>
                    </tr>
                </thead>
                <tbody className="text-xs text-white">
                    <tr className="border-b border-white/[0.04]">
                        <td className="py-4 text-slate-300">Today, 08:15 AM</td>
                        <td className="py-4"><span className="flex items-center gap-2"><Box className="w-3.5 h-3.5 text-cyan-400" /> Supplement Log</span></td>
                        <td className="py-4 text-slate-400">NAD+, Multivitamin (Taken)</td>
                        <td className="py-4"><Badge color="green">Recorded</Badge></td>
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                        <td className="py-4 text-slate-300">Yesterday, 09:00 PM</td>
                        <td className="py-4"><span className="flex items-center gap-2"><Smile className="w-3.5 h-3.5 text-green-400" /> Wellness Scale</span></td>
                        <td className="py-4 text-slate-400">Energy: 4/5, Mood: 5/5</td>
                        <td className="py-4"><Badge color="green">Recorded</Badge></td>
                    </tr>
                </tbody>
            </table>
        </Card>
    </div>
);

// 5. MESSAGES VIEW
const MessagesView = () => (
    <div className="flex flex-col h-full space-y-6 max-w-[1400px]">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Communications Hub</h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-1">
                    End-to-End Encrypted Medical Channel
                </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#00e676]/30 bg-[#00e676]/5 text-[#00e676] text-[10px] font-black uppercase tracking-widest shrink-0 shadow-[0_0_15px_rgba(0,230,118,0.1)]">
                <ShieldCheck className="w-3.5 h-3.5" /> HIPAA COMPLIANT
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-6">
            {/* Left Sidebar */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
                <Card className="p-6 bg-[#0a101f] border-white/[0.05] shadow-xl h-full flex flex-col">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-cyan-400" /> STUDY ALERTS
                    </h3>

                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 relative">
                        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Direct From Sponsor</p>
                        <h4 className="font-bold text-white text-sm mb-2">New Protocol Update</h4>
                        <p className="text-[12px] text-slate-400 leading-relaxed">
                            Please review the updated consent form in your documents area.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Main Chat Panel */}
            <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-[#0d1424] border-white/[0.05] shadow-xl relative z-10 w-full min-h-[400px]">
                {/* Chat Header */}
                <div className="h-20 border-b border-white/[0.05] flex items-center justify-between px-6 lg:px-8 bg-[#0a0e1a]/80 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-slate-900 font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] border-2 border-[#0a0e1a]">
                            C
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Study Coordinator</h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#00e676] uppercase tracking-widest mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" /> Secure Link Active
                            </div>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Protocol</p>
                        <p className="text-[12px] font-bold text-cyan-400">Unassigned</p>
                    </div>
                </div>

                {/* Chat Body */}
                <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-transparent to-[#0a0e1a]/50 p-8">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center opacity-10 mb-6 relative">
                        <MessageSquare className="w-12 h-12 text-white absolute" strokeWidth={1.5} />
                    </div>
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.15em] z-10">Secure Channel Initialized</p>
                </div>

                {/* Chat Footer */}
                <div className="p-6 shrink-0 bg-[#0a0e1a]/50 border-t border-white/[0.02]">
                    <div className="w-full bg-[#2a1118]/80 hover:bg-[#34151e] border border-red-500/20 text-[#ff6b6b] text-[11px] font-black uppercase tracking-[0.1em] py-4 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/5 transition-colors cursor-not-allowed text-center px-4">
                        Awaiting Coordinator Assignment
                    </div>
                </div>
            </Card>
        </div>
    </div>
);

// 6. DOCUMENTS VIEW
const DocumentsView = () => (
    <div className="space-y-6 max-w-[1400px]">
        <h2 className="text-4xl font-black italic mt-1 tracking-tight text-white mb-8">My Documents</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
                { title: "Informed Consent Form", date: "Jan 10, 2026", type: "LEGAL" },
                { title: "Study Protocol Summary", date: "Jan 10, 2026", type: "INFORMATION" },
                { title: "Privacy Policy & Data Use", date: "Jan 10, 2026", type: "LEGAL" },
                { title: "Baseline Lab Report", date: "Feb 15, 2026", type: "MEDICAL" }
            ].map((doc, i) => (
                <Card key={i} className="bg-[#0a101f] border border-white/[0.05] p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded-lg">
                                {doc.type}
                            </span>
                        </div>
                        <h3 className="text-[15px] font-bold text-white mb-2 leading-snug">{doc.title}</h3>
                        <p className="text-[12px] text-slate-500 mb-6">Uploaded on {doc.date}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex-1 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-300 flex justify-center items-center gap-2">
                            <Eye className="w-3.5 h-3.5" /> VIEW
                        </button>
                        <button className="flex-1 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-300 flex justify-center items-center gap-2">
                            <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                    </div>
                </Card>
            ))}
        </div>

        <div className="mt-8 bg-[#0d1424]/60 border border-white/[0.05] rounded-[2rem] p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 border border-[#00e676]/20 flex items-center justify-center text-[#00e676] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <h4 className="text-[14px] font-bold text-white mb-1">Secure Document Storage</h4>
                <p className="text-[12px] text-slate-500 leading-relaxed max-w-2xl">
                    All your documents are encrypted and stored securely according to HIPAA and GDPR standards. Only authorized study personnel and you have access to these files.
                </p>
            </div>
            <div className="text-slate-600 hidden sm:block">
                <Lock className="w-5 h-5" />
            </div>
        </div>
    </div>
);

// 7. REPORTS VIEW
const ReportsView = ({ userName }: { userName: string }) => {
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-4xl font-black italic mt-1 tracking-tight text-white mb-2">Participant Report</h2>
                    <p className="text-[13px] text-slate-500 font-medium">
                        Personalized summary of your study contribution and data.
                    </p>
                </div>
                <button className="bg-[#00c9e0] hover:bg-[#00b8ce] text-slate-900 px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center gap-2">
                    <Download className="w-4 h-4 text-slate-900" /> EXPORT PDF
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-2 bg-[#0a101f] border border-white/[0.05] p-8 shadow-xl">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" /> STUDY PROGRESS
                    </h3>
                    <div className="flex items-center gap-6 mb-10">
                        <div className="text-7xl font-black italic text-white tracking-tighter leading-none">0%</div>
                        <div>
                            <div className="text-[14px] font-bold text-[#00e676]">Excellent Compliance</div>
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">YOUR SCORE</div>
                        </div>
                    </div>

                    <div className="w-full h-3 bg-white/[0.03] rounded-full overflow-hidden mb-4 border border-white/[0.02]">
                        <div className="h-full bg-[#00e676] rounded-full w-0" />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <span>0% STARTED</span>
                        <span>TARGET: 90%+</span>
                        <span>100% COMPLETED</span>
                    </div>
                </Card>

                <Card className="bg-[#0a101f] border border-white/[0.05] p-8 shadow-xl flex flex-col justify-center">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-8">
                        ACTIVITY SUMMARY
                    </h3>
                    <div className="space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676] flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-white leading-none mb-1">0</div>
                                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">TASKS COMPLETED</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-white leading-none mb-1">0</div>
                                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">REMAINING TASKS</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="bg-[#0a101f] border border-white/[0.05] p-0 shadow-xl relative overflow-hidden flex flex-col pt-8 space-y-8">
                <div className="relative z-10 px-8 pb-4 w-full lg:w-2/3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-black uppercase tracking-widest mb-8 shadow-sm">
                        <ShieldCheck className="w-4 h-4" /> VERIFIED MULTI-CENTER STUDY
                    </div>

                    <h3 className="text-3xl font-black text-white mb-4">Not Enrolled</h3>
                    <p className="text-[14px] text-slate-500 italic mb-10 pb-8 border-b border-white/[0.05]">
                        "Thank you for your valuable contribution to clinical research."
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-12 sm:gap-40">
                        <div>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">GENERATED FOR</p>
                            <p className="text-[14px] font-bold text-white">{userName}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">DATE</p>
                            <p className="text-[14px] font-bold text-white">{dateStr}</p>
                        </div>
                    </div>
                </div>

                <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-[0.03] pointer-events-none hidden md:block">
                    <FileText className="w-80 h-80" />
                </div>

                <div className="mt-8 mx-8 mb-8 relative z-10 px-0">
                    <div className="bg-[#0d1424]/60 border border-white/[0.04] rounded-2xl p-6 text-center shadow-inner">
                        <p className="text-[12px] text-slate-500 leading-relaxed max-w-4xl mx-auto">
                            This report is for your personal use and reflects your activity within the platform. It is not a medical diagnosis. Please consult your study coordinator or physician for clinical results.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
// 8. PROFILE VIEW
const ProfileView = ({ userName, userEmail, userPicture, initials, userPhone, userLocation, userTimezone }: any) => {
    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="mb-6">
                <h2 className="text-4xl font-black italic mt-1 tracking-tight text-white mb-2">Profile &amp; Preferences</h2>
                <p className="text-[13px] text-slate-500 font-medium">Manage your personal information and notification settings.</p>
            </div>

            {/* Top Profile Card */}
            <Card className="bg-[#0a101f] border border-white/[0.05] p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                    <div className="w-24 h-24 rounded-full border border-cyan-500/50 p-[3px] flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.2)] shrink-0 overflow-hidden">
                        <div className="w-full h-full rounded-full bg-[#141e35] flex items-center justify-center text-white font-black text-2xl overflow-hidden shadow-inner">
                            {userPicture ? <img src={userPicture} alt={userName} className="w-full h-full object-cover" /> : initials}
                        </div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{userName}</h3>
                        <p className="text-[13px] text-slate-400 mb-4">{userEmail}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest leading-none">
                                <ShieldCheck className="w-3.5 h-3.5" /> PARTICIPANT
                            </span>
                            <span className="inline-flex items-center px-5 py-2 rounded-full bg-white/[0.05] text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">
                                JOINED MARCH 2026
                            </span>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-[11px] uppercase tracking-widest border border-white/5 transition-all shrink-0">
                        <Edit className="w-3.5 h-3.5 text-slate-400" /> EDIT PROFILE
                    </button>
                </div>
            </Card>

            {/* Contact Info */}
            <Card className="bg-[#0a101f] border border-white/[0.05] p-8 shadow-xl">
                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2 mb-8">
                    <User className="w-4 h-4 text-cyan-400" /> CONTACT INFORMATION
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0d1424] border border-white/[0.05] rounded-2xl p-5 flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">EMAIL ADDRESS</p>
                            <p className="text-[13px] font-bold text-slate-300 truncate">{userEmail}</p>
                        </div>
                    </div>
                    <div className="bg-[#0d1424] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">PHONE NUMBER</p>
                                <p className="text-[13px] font-bold text-white">{userPhone || 'Not set'}</p>
                            </div>
                        </div>
                        <button className="text-[11px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300">EDIT</button>
                    </div>
                    <div className="bg-[#0d1424] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">LOCATION</p>
                                <p className="text-[13px] font-bold text-white">{userLocation || 'Not set'}</p>
                            </div>
                        </div>
                        <button className="text-[11px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300">EDIT</button>
                    </div>
                    <div className="bg-[#0d1424] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">TIMEZONE</p>
                                <p className="text-[13px] font-bold text-white">{userTimezone}</p>
                            </div>
                        </div>
                        <button className="text-[11px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300">EDIT</button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notifications */}
                <Card className="bg-[#0a101f] border border-white/[0.05] p-8 shadow-xl">
                    <h3 className="text-[12px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2 mb-8">
                        <Bell className="w-4 h-4 text-cyan-400" /> NOTIFICATIONS
                    </h3>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-[14px] font-bold text-white mb-1 mt-1">Email Notifications</h4>
                                <p className="text-[12px] text-slate-500">Task reminders & updates</p>
                            </div>
                            <div className="w-12 h-6 bg-cyan-400 rounded-full flex items-center p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-[14px] font-bold text-white mb-1 mt-1">SMS Alerts</h4>
                                <p className="text-[12px] text-slate-500">Urgent study messages</p>
                            </div>
                            <div className="w-12 h-6 bg-white/[0.1] rounded-full flex items-center p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-slate-400 rounded-full shadow-sm" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-[14px] font-bold text-white mb-1 mt-1">In-App Reminders</h4>
                                <p className="text-[12px] text-slate-500">Dashboard alerts</p>
                            </div>
                            <div className="w-12 h-6 bg-cyan-400 rounded-full flex items-center p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Privacy & Security */}
                <Card className="bg-[#0a101f] border border-white/[0.05] p-8 shadow-xl">
                    <h3 className="text-[12px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2 mb-8">
                        <Lock className="w-4 h-4 text-cyan-400" /> PRIVACY & SECURITY
                    </h3>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between py-4 border-b border-white/[0.05]">
                            <span className="text-[13px] font-bold text-slate-300 mt-1">Change Password</span>
                            <button className="text-[10px] font-black text-slate-400 hover:text-white transition-colors tracking-widest uppercase flex items-center gap-1">UPDATE &rarr;</button>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-white/[0.05]">
                            <span className="text-[13px] font-bold text-slate-300 mt-1">Two-Factor Authentication</span>
                            <span className="px-2.5 py-1 bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                                <Check className="w-3 h-3" strokeWidth={3} /> ENABLED
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-white/[0.05]">
                            <button className="text-[13px] font-bold text-slate-400 hover:text-slate-300 transition-colors mt-1">Manage Connections</button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// 7. PRIVACY & DATA VIEW (GDPR/HIPAA Controls)
const PrivacyDataView = ({ onAction }: { onAction: (t: string) => void }) => (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">GDPR & HIPAA COMPLIANCE</p>
                <h1 className="text-4xl font-black italic text-white mt-1 tracking-tight">Your Data Rights</h1>
                <p className="text-[13px] text-slate-400 mt-2 max-w-xl">
                    Manage your consent, review your tracked footprints, and control your data.
                </p>
            </div>
        </div>

        <Card className="bg-[#0a101f] border border-white/[0.05] p-8 mt-8 shadow-xl">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                <Lock className="w-4 h-4 text-cyan-400" /> PRIVACY CONTROLS
            </h3>

            <div className="space-y-2">
                <div className="flex items-center justify-between py-6 border-b border-white/[0.05]">
                    <div>
                        <span className="block text-[14px] font-bold text-slate-200">Withdraw from Study</span>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-md">Immediately suspends your participation. No further data will be collected, and your clinical team will be notified.</p>
                    </div>
                    <button onClick={() => onAction('Withdraw from Study')} className="text-[11px] font-black text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest px-4 py-2 border border-amber-500/30 rounded-lg hover:bg-amber-500/10">Withdraw</button>
                </div>

                <div className="flex items-center justify-between py-6 border-b border-white/[0.05]">
                    <div>
                        <span className="block text-[14px] font-bold text-slate-200">Request My Data (GDPR)</span>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-md">Generate a portable JSON/PDF file of all personal data held by the platform.</p>
                    </div>
                    <button onClick={() => onAction('Request My Data')} className="text-[11px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest px-4 py-2 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 flex items-center gap-2">
                        <Download className="w-3 h-3" /> REQUEST
                    </button>
                </div>

                <div className="flex items-center justify-between py-6">
                    <div>
                        <span className="block text-[14px] font-bold text-red-500">Delete Account & Personal Data</span>
                        <p className="text-[11px] text-red-500/60 mt-1 max-w-md">Permanently scrubbing your identity from our active servers. This action is irreversible.</p>
                    </div>
                    <button onClick={() => onAction('Account Deletion')} className="text-[11px] font-black text-slate-900 bg-red-500 hover:bg-red-400 transition-colors uppercase tracking-widest px-4 py-2 rounded-lg">Delete</button>
                </div>
            </div>
        </Card>

        <Card className="bg-[#0a101f] border border-white/[0.05] p-8 shadow-xl mt-6">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> ACTIVE CONSENT RECORDS
            </h3>
            <div className="bg-[#0d1525] border border-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-white">Informed Consent Form</span>
                    <Badge color="green">Active</Badge>
                </div>
                <p className="text-xs text-slate-500 mb-6">Digitally signed securely online via your identity profile.</p>
                <button className="text-xs font-black text-cyan-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 bg-cyan-500/10 px-4 py-2 rounded-xl">
                    <Eye className="w-4 h-4" /> View Document
                </button>
            </div>
        </Card>
    </div>
);

export default function ParticipantDashboard() {
    const navigate = useNavigate();
    const [activeNav, setActiveNav] = useState('Dashboard');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, desc: string, primaryAction: string } | null>(null);

    // New Engagement Data State
    const [tasks, setTasks] = useState<any[]>([]);
    const [activeStudy, setActiveStudy] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

                // 1. Fetch Participant's Study
                const pRes = await authFetch(`${apiUrl}/api/participants/`);
                const pData = await pRes.json();
                if (pData.length > 0) {
                    const participant = pData[0];
                    // Fetch Study details
                    const sRes = await authFetch(`${apiUrl}/api/studies/${participant.study}/`);
                    setActiveStudy(await sRes.json());
                }

                // 2. Fetch Tasks
                const tRes = await authFetch(`${apiUrl}/api/participant-tasks/`);
                if (tRes.ok) {
                    setTasks(await tRes.json());
                }
            } catch (err) {
                console.error("Dashboard Data Fetch Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const openActionModal = (title: string) => {
        setModalConfig({
            isOpen: true,
            title: title,
            desc: `You are initiating the ${title} workflow. This module securely connects your input directly to your dedicated clinical coordinator. Please proceed with the form in the encrypted popup.`,
            primaryAction: "CONTINUE TO FORM"
        });
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Role Enforcement: If not PARTICIPANT, bounce them back to their respective dashboards
    useEffect(() => {
        const role = getRole();
        if (role && role !== 'PARTICIPANT') {
            const dashboardLink =
                role === 'SUPER_ADMIN' ? '/dashboard/super-admin'
                    : role === 'ADMIN' ? '/dashboard/admin'
                        : role === 'PI' ? '/dashboard/pi'
                            : role === 'SPONSOR' ? '/dashboard/sponsor'
                                : '/';
            navigate(dashboardLink, { replace: true });
        }
    }, [navigate]);

    // Read user from localStorage
    interface UserData {
        userName: string;
        userEmail: string;
        userPicture: string;
        firstName: string;
        userPhone: string;
        userLocation: string;
        userTimezone: string;
    }

    const getUserData = (): UserData => {
        const defaultData: UserData = { 
            userName: 'Participant', 
            userEmail: '', 
            userPicture: '', 
            firstName: 'there', 
            userPhone: '', 
            userLocation: '', 
            userTimezone: 'UTC' 
        };
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return defaultData;
            const u = JSON.parse(userStr);
            const rawName = u.full_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.name || ''));
            const fName = u.first_name || (rawName.split(' ')[0]) || 'there';
            const rawEmail = u.email || '';
            const isEncrypted = (s: string) => s && s.startsWith('gAAAA') && s.length > 40;
            const userName = isEncrypted(rawName)
                ? (rawEmail ? rawEmail.split('@')[0] : 'Participant')
                : (rawName || 'Participant');
            return {
                userName,
                userEmail: rawEmail,
                userPicture: u.picture || u.avatar || '',
                firstName: fName,
                userPhone: u.mobile_number || u.phone_number || '',
                userLocation: u.full_address ? `${u.full_address}, ${u.city || ''}, ${u.state || ''} ${u.zip_code || ''}, ${u.country || ''}`.replace(/,\s*,/g, ',').replace(/(^,\s*)|(\s*,\s*$)/g, '') : '',
                userTimezone: u.timezone || 'UTC'
            };
        } catch { 
            return defaultData; 
        }
    };

    const { userName, userEmail, userPicture, firstName, userPhone, userLocation, userTimezone } = getUserData();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

    const handleSignOut = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmSignOut = () => {
        clearToken();
        navigate('/');
    };

    // Updated Nav Items per Request
    const navItems = [
        { label: 'Main Website', icon: Globe },
        { label: 'Dashboard', icon: LayoutDashboard },
        { label: 'Tasks', icon: ClipboardList },
        { label: 'Study Kit', icon: Box },
        { label: 'Logs', icon: Activity },
        { label: 'Messages', icon: MessageSquare },
        { label: 'Documents', icon: FileText },
        { label: 'Reports', icon: TrendingUp },
        { label: 'Profile', icon: User },
        { label: 'Privacy & Data', icon: ShieldCheck },
    ];

    const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="min-h-screen flex overflow-hidden font-sans relative" style={{ background: '#0a0e1a' }}>
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
            </div>

            {/* ──────────────── SIDEBAR ──────────────── */}
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`w-[260px] flex-shrink-0 flex flex-col border-r border-white/[0.05] relative z-40 transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 bg-[#0d1525] translate-x-0' : 'fixed lg:relative inset-y-0 left-0 bg-[#0d1525] -translate-x-full'}`} style={{ background: '#0d1525' }}>
                <div className="px-6 pt-8 pb-6 flex justify-between items-center lg:justify-center">
                    <Link to="/">
                        <div className="inline-flex items-center bg-white rounded-full px-5 py-2.5 shadow-lg">
                            <img src="/logo.jpg" alt="MusB" className="h-6 w-auto object-contain" style={{ filter: 'contrast(1.2)' }} />
                        </div>
                    </Link>
                    <button className="lg:hidden text-white hover:text-cyan-400" onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mx-5 mt-2 mb-6 bg-[#141e35]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-lg border-2 border-[#141e35]">
                        {userPicture ? <img src={userPicture} alt={userName} className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <p className="text-base font-black text-white uppercase tracking-tight leading-tight truncate">{userName}</p>
                        <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mt-1">Participant</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = activeNav === item.label;
                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (item.label === 'Main Website') navigate('/home');
                                    else setActiveNav(item.label);
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left group ${isActive ? 'bg-[#0a1525] text-cyan-400 border border-cyan-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                <span className="text-base font-bold">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="px-4 pb-6 pt-4 border-t border-white/[0.05] mt-2">
                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all group">
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-bold">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ──────────────── MAIN AREA ──────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
                <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.04] flex-shrink-0" style={{ background: '#0a0e1a' }}>
                    <div className="flex items-center gap-2 lg:gap-4 text-slate-200">
                        <button
                            className="p-1 lg:hidden text-slate-300 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="h-4 w-px bg-white/10 hidden sm:block lg:hidden"></div>
                        <Zap className="w-5 h-5 text-cyan-400 hidden sm:block" />
                        <span className="text-base font-semibold">{activeNav}</span>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-4">
                        <button className="relative p-1.5 text-slate-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00e676] rounded-full shadow-[0_0_5px_#00e676]" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <div
                                className="flex items-center gap-2 lg:gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-sm font-bold text-white max-w-[150px] truncate">{userName}</span>
                                    {userEmail && <span className="text-xs uppercase tracking-wider text-slate-500 max-w-[150px] truncate">{userEmail}</span>}
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-white/10 overflow-hidden shadow-lg">
                                    {userPicture ? <img src={userPicture} alt={userName} className="w-full h-full object-cover" /> : initials}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-3 w-56 bg-[#0a0e1a] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-2"
                                    >
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => { setActiveNav('Profile'); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left"
                                            >
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold uppercase tracking-widest">My Account</span>
                                            </button>
                                            <button
                                                onClick={() => { setActiveNav('Messages'); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left"
                                            >
                                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold uppercase tracking-widest">Messages</span>
                                            </button>

                                            <div className="h-px bg-white/10 my-1 mx-2"></div>

                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left"
                                            >
                                                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold uppercase tracking-widest">Main Website</span>
                                            </button>

                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-left group"
                                            >
                                                <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-400" />
                                                <span className="text-sm font-bold uppercase tracking-widest text-red-500 group-hover:text-red-400">Sign Out</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2a42 transparent' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeNav}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeNav === 'Dashboard' && (
                                <DashboardView
                                    firstName={firstName}
                                    today={today}
                                    onAction={openActionModal}
                                    tasks={tasks}
                                    study={activeStudy}
                                />
                            )}
                            {activeNav === 'Tasks' && <TasksView onAction={openActionModal} tasks={tasks} />}
                            {activeNav === 'Study Kit' && <StudyKitView onAction={openActionModal} />}
                            {activeNav === 'Logs' && <LogsView onAction={openActionModal} />}
                            {activeNav === 'Messages' && <MessagesView />}
                            {activeNav === 'Documents' && <DocumentsView />}
                            {activeNav === 'Reports' && <ReportsView userName={userName} />}
                            {activeNav === 'Profile' && <ProfileView userName={userName} userEmail={userEmail} userPicture={userPicture} initials={initials} userPhone={userPhone} userLocation={userLocation} userTimezone={userTimezone} />}
                            {activeNav === 'Privacy & Data' && <PrivacyDataView onAction={openActionModal} />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            {/* Added the Action Modal to the highest overlay layer */}
            <ActionModal
                isOpen={modalConfig?.isOpen}
                title={modalConfig?.title}
                desc={modalConfig?.desc}
                action={modalConfig?.primaryAction}
                onClose={() => setModalConfig(null)}
            />
            <LogoutConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmSignOut}
            />
        </div>
    );
}
