import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Activity, FileText, ChevronRight } from 'lucide-react';
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
                setTasks(data);
            }
        } catch (err) {
            console.error("Failed to fetch staff tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        const timer = setInterval(fetchTasks, 30000); // Real-time polling
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

    const colorStyle = primaryColor === 'teal' ? 'text-[#14b8a6] border-[#14b8a6]/30 bg-[#14b8a6]/10' : 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10';
    const btnColor = primaryColor === 'teal' ? 'bg-[#14b8a6] hover:bg-teal-400' : 'bg-indigo-600 hover:bg-indigo-500';

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">My <span className={primaryColor === 'teal' ? 'text-[#14b8a6]' : 'text-indigo-400'}>Tasks</span></h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Outstanding Actions & Signatures</p>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse">
                    <Activity className={`w-12 h-12 ${primaryColor === 'teal' ? 'text-[#14b8a6]/50' : 'text-indigo-500/50'} mx-auto mb-4`} />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading Tasks...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pending Tasks */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${primaryColor === 'teal' ? 'text-[#14b8a6]' : 'text-indigo-400'}`} /> Pending Actions
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${colorStyle}`}>{pendingTasks.length}</span>
                        </div>
                        
                        <AnimatePresence>
                            {pendingTasks.length === 0 ? (
                                <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl">
                                    <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                    <p className="text-xs text-slate-500 font-bold uppercase">No pending tasks</p>
                                </div>
                            ) : (
                                pendingTasks.map(task => (
                                    <motion.div 
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-[#0B101B]/80 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all shadow-xl space-y-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5`}>
                                                    <FileText className="w-5 h-5 text-white/70" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{task.title}</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(task.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{task.description}</p>
                                        <div className="flex justify-end pt-4">
                                            <button 
                                                onClick={() => markComplete(task.id)}
                                                className={`px-5 py-2.5 ${btnColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg max-w-max`}
                                            >
                                                MARK COMPLETE <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Completed Tasks */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-slate-500" /> Completed
                            </h3>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black text-slate-400 bg-white/5 border border-white/10">{completedTasks.length}</span>
                        </div>
                        
                        <div className="space-y-4 opacity-70">
                            {completedTasks.length === 0 ? (
                                <div className="p-8 text-center text-slate-600 text-[11px] font-black uppercase tracking-widest">
                                    No recently completed tasks
                                </div>
                            ) : (
                                completedTasks.map(task => (
                                    <div key={task.id} className="bg-transparent border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500/50" />
                                            <div>
                                                <h4 className="text-xs font-black text-slate-300 line-through uppercase tracking-wide">{task.title}</h4>
                                                <p className="text-[10px] text-slate-600 uppercase mt-1">{task.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
