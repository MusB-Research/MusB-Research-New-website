import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Clock, User, Mail, ShieldCheck, History, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch , API } from '../../utils/auth';

export default function ApprovalModule() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const apiUrl = API || 'http://localhost:8000';

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${apiUrl}/api/auth/admin/approvals/?status=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Fetch approvals error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        try {
            const res = await authFetch(`${apiUrl}/api/auth/admin/approvals/${requestId}/${action}/`, {
                method: 'POST'
            });
            if (res.ok) {
                // If we are in pending tab, remove from view
                if (activeTab === 'pending') {
                    setRequests(requests.filter(r => r.id !== requestId));
                } else {
                    fetchRequests();
                }
            }
        } catch (error) {
            console.error('Approval action error:', error);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Team <span className="text-emerald-500 underline decoration-emerald-500/30">Approvals</span>
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px] italic">
                        Security Clearance & Credential Verification Sector
                    </p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
                    {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                                : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-40 gap-6">
                    <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin shadow-2xl shadow-emerald-500/20" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse">Synchronizing Security Nodes...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-32 text-center backdrop-blur-3xl shadow-2xl">
                    <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Shield className="w-10 h-10 text-slate-800 opacity-20" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] italic">
                        Sector Clear — No {activeTab} transmissions detected
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode="popLayout">
                        {requests.map((req, idx) => (
                            <motion.div
                                key={req.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 backdrop-blur-2xl hover:border-emerald-500/20 transition-all flex flex-col lg:flex-row items-center justify-between gap-10 group"
                            >
                                <div className="flex items-center gap-10 w-full">
                                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center font-black text-2xl text-white shadow-2xl overflow-hidden relative group-hover:scale-105 transition-transform">
                                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {req.target_name?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-4 mb-3">
                                            <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight italic group-hover:text-emerald-400 transition-colors">
                                                {req.target_name}
                                            </h3>
                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                                                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                            }`}>
                                                {req.status === 'pending' ? 'Security Clearance Required' : req.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                                            <div className="flex items-center gap-3 text-slate-500 group/item">
                                                <Mail className="w-3.5 h-3.5 text-slate-700 group-hover/item:text-emerald-500 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{req.target_email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500 group/item">
                                                <User className="w-3.5 h-3.5 text-slate-700 group-hover/item:text-emerald-500 transition-colors" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest italic text-slate-500">
                                                    Source: PI <span className="text-slate-300 font-black">{req.requested_by}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500 group/item">
                                                <Clock className="w-3.5 h-3.5 text-slate-700 group-hover/item:text-emerald-500 transition-colors" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest italic text-slate-400">
                                                    Transmitted: {new Date(req.created_at).toLocaleDateString()} @ {new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-500 group/item">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-900 group-hover/item:text-emerald-500 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic text-emerald-500/70">
                                                    Node Assignment: {req.studies?.join(', ') || 'No protocol assigned'}
                                                </span>
                                            </div>
                                        </div>

                                        {req.reviewed_by && (
                                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-4">
                                                <History className="w-3 h-3 text-slate-700" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">
                                                    Processed by {req.reviewed_by} on {new Date(req.reviewed_at).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeTab === 'pending' && (
                                    <div className="flex items-center gap-4 w-full lg:w-auto">
                                        <button 
                                            onClick={() => handleAction(req.id, 'reject')}
                                            className="flex-1 lg:flex-none p-7 bg-white/5 text-slate-500 border border-white/10 rounded-3xl hover:bg-red-500 hover:text-white hover:border-red-500/50 transition-all group/btn shadow-xl active:scale-95"
                                            title="Reject Clearace"
                                        >
                                            <X className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                                        </button>
                                        <button 
                                            onClick={() => handleAction(req.id, 'approve')}
                                            className="flex-1 lg:flex-none px-12 py-7 bg-emerald-500 text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 italic"
                                        >
                                            <Check className="w-5 h-5" /> Grant Access
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
