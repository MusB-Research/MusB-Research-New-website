import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Sparkles, Megaphone, Calendar, Briefcase, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authFetch } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SubmitContentForms({ userRole }: { userRole: string }) {
    const [submitting, setSubmitting] = useState(false);
    const [activeForm, setActiveForm] = useState<'study' | 'news' | 'event'>('news');
    const [formData, setFormData] = useState({
        title: '',
        description: '', // or content
        image: '',
        is_success_story: false,
        event_date: '',
        sponsor_name: '',
        protocol_id: ''
    });

    const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const payload: any = {
                title: formData.title,
                status: isSuperAdmin ? 'approved' : 'pending'
            };

            if (activeForm === 'study') {
                payload.description = formData.description;
                payload.sponsor_name = formData.sponsor_name;
                payload.protocol_id = formData.protocol_id;
            } else if (activeForm === 'news') {
                payload.content = formData.description;
                payload.image = formData.image;
                payload.is_success_story = formData.is_success_story;
            } else if (activeForm === 'event') {
                payload.description = formData.description;
                payload.event_date = new Date(formData.event_date).toISOString();
            }

            const endpointMap: Record<string, string> = {
                'study': 'studies',
                'news': 'news',
                'event': 'events'
            };

            const res = await authFetch(`${API_URL}/api/${endpointMap[activeForm]}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`System synchronized! ${isSuperAdmin ? 'Content is now live in global clusters.' : 'Submission buffered for moderator review.'}`);
                setFormData({
                    title: '', description: '', image: '', is_success_story: false, event_date: '', sponsor_name: '', protocol_id: ''
                });
            } else {
                const error = await res.json();
                alert(`Sequence Error: ${error.detail || 'Access Denied'}`);
            }
        } catch (error) {
            console.error('Submission failed', error);
            alert('A critical failure occurred during data packet transmission.');
        } finally {
            setSubmitting(false);
        }
    };

    const getFormIcon = (type: string) => {
        switch(type) {
            case 'news': return <Megaphone className="w-4 h-4" />;
            case 'event': return <Calendar className="w-4 h-4" />;
            case 'study': return <Briefcase className="w-4 h-4" />;
            default: return <Sparkles className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_15px_#a855f7]"></div>
                     <span className="text-sm font-black text-purple-400 uppercase tracking-[0.4em] italic leading-none">Transmission Control</span>
                   </div>
                   <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Content <span className="text-[#a855f7]">Creation</span> Node</h1>
                   <p className="text-xs sm:text-base text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">
                     {isSuperAdmin 
                        ? 'Master node authorized for direct global publication' 
                        : 'Submit protocol data packets and community updates for verification'}
                   </p>
                </div>
                
                <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6 shadow-2xl backdrop-blur-xl group hover:border-[#a855f7]/30 transition-all">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-[#555a7a] uppercase tracking-[0.3em]">{isSuperAdmin ? 'Direct Access' : 'Buffer Status'}</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter mt-1">{isSuperAdmin ? 'SYNCED' : 'WAITING'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/20 border border-[#a855f7]/30 flex items-center justify-center text-[#a855f7]">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Form Area */}
            <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl bg-gradient-to-br from-[#0f1133] to-[#0a0b1a]">
                {/* Form Tabs */}
                <div className="p-2 border-b border-white/5 bg-white/[0.02] flex flex-wrap gap-2">
                    {['news', 'event', 'study'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setActiveForm(type as any)}
                            className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
                                activeForm === type 
                                ? 'text-white' 
                                : 'text-[#555a7a] hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {activeForm === type && (
                                <motion.div 
                                    layoutId="formTabGlow"
                                    className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"
                                />
                            )}
                            <span className={`relative z-10 transition-transform group-hover:scale-110 ${activeForm === type ? 'text-purple-400' : ''}`}>
                                {getFormIcon(type)}
                            </span>
                            <span className="relative z-10">{type}</span>
                            {activeForm === type && (
                                <motion.div 
                                    layoutId="formTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-10 lg:p-16">
                    <form onSubmit={handleSubmit} className="space-y-12 max-w-4xl">
                        <div className="space-y-8">
                            {/* Title Field */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Essential Identification
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black italic uppercase tracking-tight outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-800"
                                    placeholder={`Enter ${activeForm} title...`}
                                />
                            </div>

                            {/* Dynamic Fields Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {activeForm === 'study' && (
                                    <>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic">Protocol Registry ID</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.protocol_id}
                                                onChange={(e) => setFormData({ ...formData, protocol_id: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-purple-500/50"
                                                placeholder="MB-2026-XP"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic">Sponsor Node Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.sponsor_name}
                                                onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black uppercase tracking-widest outline-none focus:border-purple-500/50"
                                                placeholder="Global Health Org"
                                            />
                                        </div>
                                    </>
                                )}

                                {activeForm === 'event' && (
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-amber-400">Temporal Coordinates</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={formData.event_date}
                                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-mono outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                )}

                                {activeForm === 'news' && (
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic text-indigo-400">Visual Meta Tag (URL)</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                            <input
                                                type="url"
                                                value={formData.image}
                                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                className="w-full pl-16 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white font-medium outline-none focus:border-indigo-500/50"
                                                placeholder="https://cloud.musbresearch.com/static/hero.png"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description / Content Textarea */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> 
                                    {activeForm === 'news' ? 'Article Intelligence' : 'Technical Specifications'}
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-8 text-base text-slate-300 font-medium leading-relaxed outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-800"
                                    placeholder={`Enter detailed information packet for the ${activeForm}...`}
                                />
                            </div>

                            {/* News Specific Toggles */}
                            {activeForm === 'news' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-6 p-8 bg-purple-500/5 border border-white/5 rounded-[2rem]"
                                >
                                    <input
                                        type="checkbox"
                                        id="success_story_toggle"
                                        checked={formData.is_success_story}
                                        onChange={(e) => setFormData({ ...formData, is_success_story: e.target.checked })}
                                        className="w-6 h-6 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500/50 accent-purple-500 cursor-pointer"
                                    />
                                    <div>
                                        <label htmlFor="success_story_toggle" className="text-sm font-black text-white uppercase italic tracking-[0.2em] cursor-pointer">
                                            Featured Success Narrative
                                        </label>
                                        <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-widest mt-1">This will prioritize the article in global high-impact streams.</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Submission Buttons */}
                        <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-end items-center gap-6">
                           <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest">Integrity Check</p>
                              <p className="text-xs font-black text-emerald-500 uppercase italic mt-1">Ready for Transmission</p>
                           </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-16 py-6 bg-purple-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] italic flex items-center justify-center gap-4 shadow-2xl shadow-purple-900/40 hover:bg-purple-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Streaming Data...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" /> 
                                        Authorize Sequence
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Platform Health Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Cluster Connectivity', value: '100%', color: 'text-emerald-500' },
                    { label: 'Uptime', value: '99.9F', color: 'text-purple-400' },
                    { label: 'Encryption', value: 'AES-GCM', color: 'text-indigo-400' },
                    { label: 'Node Status', value: 'OPTIMAL', color: 'text-emerald-500' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center">
                        <p className="text-[9px] font-black text-[#555a7a] uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={`text-base font-black italic ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
