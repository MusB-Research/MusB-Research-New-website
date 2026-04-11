import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Activity, ChevronRight, Check } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface StaffTask {
    id: string;
    study: string;
    title: string;
    description: string;
    task_type: string;
    is_completed: boolean;
    created_at: string;
}

interface StaffTasksModuleProps {
    primaryColor?: string; // e.g., 'indigo' for PI, 'teal' for Coordinator
}

export default function StaffTasksModule({ primaryColor = 'indigo' }: StaffTasksModuleProps) {
    const [tasks, setTasks] = useState<StaffTask[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await authFetch(`${API}/api/staff-tasks/`);
            if (res.ok) {
                const data = await res.json();
                const results = data.results !== undefined ? data.results : data;
                setTasks(Array.isArray(results) ? results : []);
            }
        } catch (err) {
            console.error("Failed to fetch staff tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        const timer = setInterval(fetchTasks, 30000); // Polling
        return () => clearInterval(timer);
    }, []);

    const markComplete = async (taskId: string) => {
        try {
            const res = await authFetch(`${API}/api/staff-tasks/${taskId}/complete/`, {
                method: 'POST'
            });
            if (res.ok) {
                setTasks(prev => prev.map(t => 
                    t.id === taskId ? { ...t, is_completed: true } : t
                ));
            }
        } catch (err) {
            console.error("Failed to complete task:", err);
        }
    };

    const pendingTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    if (loading) {
        return (
            <div className="py-24 text-center">
                <Activity className="w-10 h-10 text-slate-700 mx-auto mb-4 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Loading your tasks...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pt-4">
            {/* Header */}
            <div className="pb-6 border-b border-white/5">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">My tasks</h2>
                <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-80">Outstanding actions and signatures</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Pending Tasks Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
                            Pending tasks
                            <span className="text-xs font-black text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{pendingTasks.length.toString().padStart(2, '0')}</span>
                        </h3>
                    </div>
                    
                    <div className="space-y-4">
                        {pendingTasks.length === 0 ? (
                            <div className="py-12 text-center">
                                <CheckCircle2 className="w-7 h-7 text-slate-700 mx-auto mb-4 opacity-40" />
                                <p className="text-sm text-slate-500 font-black uppercase tracking-widest opacity-60">No pending tasks</p>
                            </div>
                        ) : (
                            pendingTasks.map(task => (
                                <motion.div 
                                    key={task.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-white mb-2 uppercase tracking-tight">{task.title}</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed font-bold opacity-80">{task.description}</p>
                                            <p className="text-[10px] text-slate-600 mt-4 font-black uppercase tracking-widest">{new Intl.DateTimeFormat('en-US').format(new Date(task.created_at))}</p>
                                        </div>
                                        <button 
                                            onClick={() => markComplete(task.id)}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-all active:scale-95 shadow-lg shadow-blue-900/20 uppercase tracking-widest"
                                        >
                                            Complete <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Completed Tasks Column */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-500 flex items-center gap-3 uppercase tracking-tighter italic">
                            Completed
                            <span className="text-xs font-black text-slate-600 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{completedTasks.length.toString().padStart(2, '0')}</span>
                        </h3>
                    </div>
                    
                    <div className="space-y-3">
                        {completedTasks.length === 0 ? (
                            <div className="py-8 text-center text-slate-600 text-sm font-bold uppercase tracking-widest opacity-40">
                                No recently completed tasks
                            </div>
                        ) : (
                            completedTasks.map(task => (
                                <div key={task.id} className="p-4 bg-transparent border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                            <Check className="w-3 h-3 text-emerald-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-slate-400 line-through opacity-40 leading-tight uppercase tracking-tight">{task.title}</h4>
                                            <p className="text-xs text-slate-500 mt-2 font-bold opacity-60 line-clamp-1 group-hover:line-clamp-none transition-all">{task.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
