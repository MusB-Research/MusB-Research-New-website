import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Search, Filter, ShieldCheck, Loader2, Megaphone, Calendar, Briefcase, Eye, AlertCircle } from 'lucide-react';
import { authFetch } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function WorkflowModerationPanel() {
    const [activeTab, setActiveTab] = useState<'news' | 'events' | 'studies'>('news');
    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPendingContent = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/${activeTab}/`);
            if (res.ok) {
                const data = await res.json();
                // backend returns status or approval_status
                setContent(data.filter((item: any) => 
                    item.status?.toLowerCase() === 'pending' || 
                    item.approval_status?.toLowerCase() === 'pending' ||
                    item.is_active === false // Some models might use is_active
                ));
            }
        } catch (error) {
            console.error('Error fetching pending content:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingContent();
    }, [activeTab]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            const res = await authFetch(`${API_URL}/api/${activeTab}/${id}/${action}/`, {
                method: 'POST'
            });
            if (res.ok) {
                fetchPendingContent(); // refresh
            } else {
                const err = await res.json();
                alert(`Action failed: ${err.detail || 'Insufficient permissions'}`);
            }
        } catch (error) {
            console.error(error);
            alert('A terminal error occurred during sequence execution.');
        } finally {
            setProcessingId(null);
        }
    };

    const getTabIcon = (tab: string) => {
        switch(tab) {
            case 'news': return <Megaphone className="w-4 h-4" />;
            case 'events': return <Calendar className="w-4 h-4" />;
            case 'studies': return <Briefcase className="w-4 h-4" />;
            default: return <ShieldCheck className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_#6366f1]"></div>
                     <span className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] italic leading-none">Global Control</span>
                   </div>
                   <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Content <span className="text-[#7c3aed]">Moderation</span> Queue</h1>
                   <p className="text-xs sm:text-base text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">Reviewing pending protocol submissions and community transmissions</p>
                </div>
                
                <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6 shadow-2xl backdrop-blur-xl">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-[#555a7a] uppercase tracking-[0.3em]">Pending Tasks</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter mt-1">{content.length.toString().padStart(2, '0')}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed]">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl bg-gradient-to-br from-[#0f1133] to-[#0a0b1a]">
                {/* Tab Navigation */}
                <div className="p-2 border-b border-white/5 bg-white/[0.02] flex flex-wrap gap-2">
                    {['news', 'events', 'studies'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
                                activeTab === tab 
                                ? 'text-white' 
                                : 'text-[#555a7a] hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTabGlow"
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"
                                />
                            )}
                            <span className={`relative z-10 transition-transform group-hover:scale-110 ${activeTab === tab ? 'text-indigo-400' : ''}`}>
                                {getTabIcon(tab)}
                            </span>
                            <span className="relative z-10">{tab}</span>
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="tabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="min-h-[500px] relative">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                            >
                                <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />
                                <p className="text-[10px] font-black text-[#555a7a] uppercase tracking-[0.4em] italic">Synchronizing Buffer...</p>
                            </motion.div>
                        ) : content.length === 0 ? (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-20 flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mb-8 shadow-2xl shadow-emerald-500/10">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Queue <span className="text-emerald-500">Cleared</span></h3>
                                <p className="text-[#555a7a] font-black uppercase tracking-[0.3em] text-[10px] mt-4 max-w-sm leading-relaxed">No pending transmissions for this sector. All protocol entries have been finalized.</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="divide-y divide-white/5"
                            >
                                {content.map((item, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.id} 
                                        className="p-10 hover:bg-white/[0.02] transition-all flex flex-col lg:flex-row items-center justify-between gap-10 group"
                                    >
                                        <div className="flex-1 w-full space-y-6">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">Verification Required</span>
                                                </div>
                                                {item.is_success_story && (
                                                    <div className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest italic">Success Story</span>
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-[#555a7a] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5" /> 
                                                    {new Date(item.created_at || item.updated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                </span>
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                                                <p className="text-sm text-[#8b8fa8] font-medium leading-relaxed mt-4 line-clamp-2 max-w-2xl selection:bg-indigo-500/30 selection:text-white">
                                                    {item.content || item.description || 'No detailed data packets accompanying this transmission.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-6 pt-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black text-white italic">
                                                        {item.author_name?.[0] || 'A'}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BY {item.author_name || 'Anonymous Entity'}</span>
                                                </div>
                                                <div className="h-4 w-px bg-white/5"></div>
                                                <button className="flex items-center gap-2 text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-widest transition-all italic">
                                                    <Eye className="w-3 h-3" /> View Source Node
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-48">
                                            <button 
                                                onClick={() => handleAction(item.protocol_id || item.id, 'approve')}
                                                disabled={processingId === item.id}
                                                className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 hover:scale-105 transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Authorize
                                            </button>
                                            <button 
                                                onClick={() => handleAction(item.protocol_id || item.id, 'reject')}
                                                disabled={processingId === item.id}
                                                className="flex-1 py-4 bg-white/5 border border-white/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all disabled:opacity-50 active:scale-95"
                                            >
                                                <XCircle className="w-4 h-4" /> Terminate
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Security Level', value: 'Level 4 Alpha', color: 'text-indigo-400', icon: ShieldCheck },
                    { label: 'Latency', value: '14ms', color: 'text-emerald-400', icon: Clock },
                    { label: 'System Check', value: 'Nominal', color: 'text-[#7c3aed]', icon: ShieldCheck },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:border-white/10 transition-all">
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest">{stat.label}</p>
                            <p className={`text-xl font-black italic mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
