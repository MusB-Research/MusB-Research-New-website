import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, Calendar, Clock, Lock, CheckCircle2, AlertCircle, Search, Filter, Shield, User, HelpCircle, ArrowRight, FileText, Activity, Download, Bell } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

interface ParticipantTask {
    id: string;
    participant_name: string;
    protocol_id: string;
    title: string;
    due_date: string;
    status: string;
    task_type?: string;
    participant_id?: string;
    grace_period: number;
    delay_allowed: number;
}

export default function ParticipantTaskManagement({ primaryColor = 'indigo', selectedStudyId = 'all' }: { primaryColor?: string; selectedStudyId?: string }) {
    const [tasks, setTasks] = useState<ParticipantTask[]>([]);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [studies, setStudies] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        dueDate: '',
        studyId: '',
        participantId: '',
        delayAllowed: 2,
        gracePeriod: 5
    });


    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchTasks = async () => {
        try {
            const url = selectedStudyId && selectedStudyId !== 'all' 
                ? `${API}/api/participant-tasks/?study=${selectedStudyId}`
                : `${API}/api/participant-tasks/`;
            const res = await authFetch(url);
            if (res.ok) {
                const data = await res.json();
                const results = data.results !== undefined ? data.results : data;
                setTasks(Array.isArray(results) ? results : []);
            }
        } catch (err) {
            console.error("Task sync failure:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [studyRes, partRes] = await Promise.all([
                authFetch(`${API}/api/studies/`),
                authFetch(`${API}/api/participants/?limit=1000`)
            ]);
            if (studyRes.ok) {
                const sData = await studyRes.json();
                setStudies(Array.isArray(sData) ? sData : (sData.results || []));
            }
            if (partRes.ok) {
                const pData = await partRes.json();
                setParticipants(Array.isArray(pData) ? pData : (pData.results || []));
            }
        } catch (err) {
            console.error("Failed to load modal data:", err);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchInitialData();
    }, [selectedStudyId]);

    const activeParticipants = formData.studyId 
        ? participants.filter(p => {
            const sId = p.study?.id || p.study || '';
            return String(sId) === String(formData.studyId);
        })
        : participants;

    const handleSaveTask = async () => {
        if (!formData.participantId || !formData.title || !formData.dueDate) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const res = await authFetch(`${API}/api/participant-tasks/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participant: formData.participantId,
                    title: formData.title,
                    due_date: formData.dueDate,
                    delay_allowed: formData.delayAllowed,
                    grace_period: formData.gracePeriod,
                    status: 'PENDING'
                })
            });

            if (res.ok) {
                setShowNewTaskModal(false);
                fetchTasks();
                setFormData({
                    title: '',
                    dueDate: '',
                    studyId: '',
                    participantId: '',
                    delayAllowed: 2,
                    gracePeriod: 5
                });
            } else {
                const err = await res.json();
                alert(`Error: ${JSON.stringify(err)}`);
            }
        } catch (err) {
            console.error("Save task failed:", err);
        }
    };


    useEffect(() => {
        if (selectedStudyId && selectedStudyId !== 'all') {
            setFormData(prev => ({ ...prev, studyId: selectedStudyId }));
        }
    }, [selectedStudyId, showNewTaskModal]);

    const getStatusStyle = (status: string) => {

        switch (status?.toUpperCase()) {
            case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'OVERDUE': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'LOCKED': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        }
    };

    const colorHex = primaryColor === 'blue' ? '#3b82f6' : (primaryColor === 'teal' ? '#14b8a6' : '#6366f1');

    const handleSendReminder = async (taskId: string) => {
        try {
            const res = await authFetch(`${API}/api/questionnaire-schedules/${taskId}/send_reminder/`, {
                method: 'POST'
            });
            if (res.ok) {
                alert("Reminder sent successfully!");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to send reminder.");
            }
        } catch (err) {
            console.error(err);
            alert("Error sending reminder.");
        }
    };

    const filteredTasks = tasks.filter(t => 
        t.participant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.protocol_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const studyWiseStats = React.useMemo(() => {
        const groups: Record<string, { protocol: string; title: string; completed: number; pending: number; total: number }> = {};
        tasks.forEach(t => {
            const key = `${t.protocol_id || 'GENERAL'}-${t.title}`;
            if (!groups[key]) {
                groups[key] = {
                    protocol: t.protocol_id || 'GENERAL',
                    title: t.title,
                    completed: 0,
                    pending: 0,
                    total: 0
                };
            }
            groups[key].total += 1;
            if (t.status === 'COMPLETED') {
                groups[key].completed += 1;
            } else {
                groups[key].pending += 1;
            }
        });
        return Object.values(groups);
    }, [tasks]);

    return (
        <div className="space-y-6">
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
                <div>
                    <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black text-white italic uppercase tracking-tighter`}>
                        Participant <span style={{ color: colorHex }}>Tasks</span>
                    </h2>
                </div>
                <button 
                    onClick={() => setShowNewTaskModal(true)}
                    className={`flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl ${isMobile ? 'w-full' : ''}`}
                >
                    <Plus className="w-4 h-4" /> New Task
                </button>
            </div>

            {isLoading ? (
                <div className="py-20 text-center animate-pulse">
                    <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[12px]">Loading tasks...</p>
                </div>
            ) : (
                <>
                    <div className={`grid ${isMobile ? 'grid-cols-1' : (isTablet ? 'grid-cols-2' : 'grid-cols-4')} gap-6`}>
                         {[
                            { label: 'In Progress', count: tasks.filter(t => t.status !== 'COMPLETED').length, icon: List, color: 'cyan' },
                            { label: 'Late', count: tasks.filter(t => t.status === 'OVERDUE').length, icon: AlertCircle, color: 'red' },
                            { label: 'Completed & Locked', count: tasks.filter(t => t.status === 'COMPLETED' || t.status === 'LOCKED').length, icon: Lock, color: 'amber' },
                            { label: 'Submission Rate', count: `${Math.round((tasks.filter(t => t.status === 'COMPLETED').length / (tasks.length || 1)) * 100)}%`, icon: CheckCircle2, color: 'emerald' }
                         ].map((stat, i) => (
                            <div key={i} className="bg-[#0B1222]/60 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all shadow-lg group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                                        <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                                    </div>
                                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <div className="text-4xl font-black text-white italic tracking-tighter leading-none group-hover:scale-105 transition-transform">{stat.count}</div>
                            </div>
                         ))}
                    </div>

                    {/* Study-Wise Progress Summary */}
                    <div className="bg-[#0B1222]/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Study-Wise Task Progress</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studyWiseStats.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No task submissions recorded yet.</p>
                            ) : (
                                studyWiseStats.map((stat, i) => {
                                    const percent = Math.round((stat.completed / stat.total) * 100);
                                    return (
                                        <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-white/10 transition-all">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">{stat.protocol}</span>
                                                    <h4 className="text-sm font-black text-white uppercase mt-0.5">{stat.title}</h4>
                                                </div>
                                                <span className="text-xs font-black text-emerald-400">{percent}% Done</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                                <span>Completed: <strong className="text-white">{stat.completed}</strong></span>
                                                <span>Pending: <strong className="text-white">{stat.pending}</strong></span>
                                                <span>Total Patients: <strong className="text-white">{stat.total}</strong></span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-[#0a101f]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <div className={`flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-[1.5rem] group focus-within:border-${primaryColor === 'blue' ? 'blue' : 'cyan'}-500/50 transition-all ${isMobile ? 'w-full' : 'max-w-md'}`}>
                                <Search className={`w-4 h-4 text-slate-500 group-focus-within:text-${primaryColor === 'blue' ? 'blue' : 'cyan'}-400`} />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH BY PARTICIPANT OR PROTOCOL ID..." 
                                    className="bg-transparent border-none outline-none text-white text-[11px] font-black tracking-widest uppercase w-full placeholder:text-slate-700"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {(isMobile || isTablet) ? (
                            <div className="p-4 space-y-4">
                                {filteredTasks.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[11px]">No tasks found.</p>
                                    </div>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <div key={task.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-5 shadow-xl">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10 italic font-black text-white text-lg">
                                                        {task.participant_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase tracking-tight leading-none">{task.participant_name || 'Anonymous Subject'}</p>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">{task.protocol_id || 'GENERAL'}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                                                    (task.status === 'LOCKED' && task.title?.toUpperCase().includes('DAILY MEDICINE LOG'))
                                                        ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                                        : getStatusStyle(task.status)
                                                }`}>
                                                    {(task.status === 'LOCKED' && task.title?.toUpperCase().includes('DAILY MEDICINE LOG')) ? 'OVERDUE' : task.status}
                                                </div>
                                            </div>

                                            <div className="py-4 border-y border-white/5">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${primaryColor === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'} animate-pulse`} />
                                                    <span className="text-sm font-black text-white uppercase tracking-tight italic">{task.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-4">
                                                    <Calendar className="w-4 h-4 text-slate-600" />
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DUE: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'NO DEADLINE'}</span>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase italic tracking-widest">
                                                        Rules: {task.delay_allowed}d Delay | {task.grace_period}d Grace
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500" style={{ width: '85%' }} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-blue-400">85%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {task.title?.toUpperCase().includes('DAILY MEDICINE LOG') && (
                                                    <button 
                                                        onClick={() => alert(`Opening Log Entry Terminal for ${task.participant_name}`)}
                                                        className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <FileText className="w-4 h-4" /> Log
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => alert(`Granting extension for ${task.title}.`)}
                                                    className={`flex-1 py-3.5 ${primaryColor === 'blue' ? 'bg-blue-600' : 'bg-cyan-600'} text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg`}
                                                >
                                                    Extend
                                                </button>
                                                <button 
                                                    onClick={() => alert(`Reviewing clinical compliance...`)}
                                                    className="p-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar-horizontal">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Participant / Study</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Tactical Task</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Due Date</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Compliance Status</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest italic text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-10 py-24 text-center">
                                                    <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm italic">No active research tasks found.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((task) => (
                                                <tr key={task.id} className="group hover:bg-white/[0.02] transition-all">
                                                    <td className="px-8 py-6 border-r border-white/5">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center italic font-black text-white text-lg group-hover:border-white/20 transition-all shadow-inner">
                                                                {task.participant_name?.charAt(0) || 'S'}
                                                            </div>
                                                            <div>
                                                                <div className="text-base font-black text-white uppercase tracking-tight italic leading-none">{task.participant_name || 'Anonymous Subject'}</div>
                                                                <div className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mt-2 leading-none">{task.protocol_id || 'GENERAL'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 border-r border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${primaryColor === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'} animate-pulse shadow-[0_0_10px_currentColor]`} />
                                                            <span className="text-[15px] font-black text-white uppercase tracking-tight italic">{task.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 border-r border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="w-4 h-4 text-slate-600" />
                                                            <span className="text-[12px] font-black text-slate-300 uppercase tracking-widest">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'NO DEADLINE'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 border-r border-white/5">
                                                        <div className="flex flex-col gap-3">
                                                            <div className={`px-5 py-2 rounded-xl border text-[11px] font-black uppercase tracking-[0.2em] w-fit shadow-lg ${
                                                                (task.status === 'LOCKED' && task.title?.toUpperCase().includes('DAILY MEDICINE LOG'))
                                                                    ? 'text-red-400 bg-red-500/10 border-red-500/20 shadow-red-900/20'
                                                                    : getStatusStyle(task.status)
                                                            }`}>
                                                                {(task.status === 'LOCKED' && task.title?.toUpperCase().includes('DAILY MEDICINE LOG')) ? 'OVERDUE' : task.status}
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest">
                                                                Rules: {task.delay_allowed}d Delay | {task.grace_period}d Grace
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                         <div className="flex items-center justify-end gap-3">
                                                            {task.status === 'COMPLETED' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => window.open(`${API}/api/questionnaire-schedules/${task.id}/export_data/?format=pdf`, '_blank')}
                                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                                                                    >
                                                                        <Download className="w-3.5 h-3.5" /> PDF
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => window.open(`${API}/api/questionnaire-schedules/${task.id}/export_data/?format=csv`, '_blank')}
                                                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                                                                    >
                                                                        <Download className="w-3.5 h-3.5" /> CSV
                                                                    </button>
                                                                </>
                                                            )}
                                                            {task.status === 'PENDING' && (
                                                                <button 
                                                                    onClick={() => handleSendReminder(task.id)}
                                                                    className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                                >
                                                                    <Bell className="w-3.5 h-3.5" /> Remind
                                                                </button>
                                                            )}
                                                            {task.title?.toUpperCase().includes('DAILY MEDICINE LOG') && (
                                                                <button 
                                                                    onClick={() => alert(`Opening Log Entry Terminal for ${task.participant_name}`)}
                                                                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 hover:scale-[1.03]"
                                                                >
                                                                    <FileText className="w-4 h-4" /> Clinical Data
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => alert(`Reviewing compliance metrics...`)}
                                                                className="p-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-[1.25rem] transition-all shadow-lg hover:bg-white/10"
                                                            >
                                                                <Shield className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* NEW TASK MODAL */}
            <AnimatePresence>
                {showNewTaskModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowNewTaskModal(false)}
                            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 50 }} 
                            className="relative w-full max-w-2xl bg-[#0B101B] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="p-10 space-y-10">
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">New <span className="text-cyan-400">Task</span></h3>
                                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Set task title, due date and participant.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Study</label>
                                        <select 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all appearance-none"
                                            value={formData.studyId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, studyId: e.target.value, participantId: '' }))}
                                        >
                                            <option value="" className="bg-[#0B101B]">-- CHOOSE STUDY --</option>
                                            {(studies || []).map(s => (
                                                <option key={s.id} value={s.id} className="bg-[#0B101B]">{s.protocol_id} - {s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Task Title</label>
                                        <input 
                                            type="text" 
                                            placeholder="E.G. FASTING GLUCOSE LOG" 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Deadline Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all" 
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign to Participant</label>
                                        <select 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all appearance-none"
                                            value={formData.participantId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, participantId: e.target.value }))}
                                            disabled={!formData.studyId}
                                        >
                                            <option value="" className="bg-[#0B101B]">{!formData.studyId ? 'SELECT STUDY FIRST' : '-- CHOOSE PARTICIPANT --'}</option>
                                            {(activeParticipants || []).map(p => (
                                                <option key={p.id} value={p.id} className="bg-[#0B101B]">{p.decrypted_name || p.full_name || p.participant_sid} ({p.status})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Delay Allowed (Days)</label>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between">
                                            <span className="text-white font-black text-sm">{formData.delayAllowed}</span>
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => setFormData(p => ({ ...p, delayAllowed: p.delayAllowed + 1 }))} className="text-cyan-400 hover:text-white transition-colors">▲</button>
                                                <button onClick={() => setFormData(p => ({ ...p, delayAllowed: Math.max(0, p.delayAllowed - 1) }))} className="text-cyan-400 hover:text-white transition-colors">▼</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest ml-1">Grace Period (Days)</label>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between">
                                            <span className="text-white font-black text-sm">{formData.gracePeriod}</span>
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => setFormData(p => ({ ...p, gracePeriod: p.gracePeriod + 1 }))} className="text-cyan-400 hover:text-white transition-colors">▲</button>
                                                <button onClick={() => setFormData(p => ({ ...p, gracePeriod: Math.max(0, p.gracePeriod - 1) }))} className="text-cyan-400 hover:text-white transition-colors">▼</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        onClick={() => setShowNewTaskModal(false)}
                                        className="flex-1 bg-white/5 border border-white/10 text-slate-400 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.25em] italic hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveTask}
                                        className={`flex-1 ${primaryColor === 'blue' ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.3)]' : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_50px_rgba(8,145,178,0.3)]'} text-white py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.25em] italic transition-all`}
                                    >
                                        Save Task
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


