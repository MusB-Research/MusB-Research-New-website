import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Sparkles, Megaphone, Calendar, Briefcase, Loader2, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { authFetch , API } from '../../utils/auth';

const API_URL = API || 'http://localhost:8000';

export default function SubmitContentForms({ userRole }: { userRole: string }) {
    const [submitting, setSubmitting] = useState(false);
    const [activeForm, setActiveForm] = useState<'news' | 'event' | 'partnership' | 'publication' | 'education'>('news');
    const [formData, setFormData] = useState({
        title: '',
        description: '', // or content
        image: null as File | null,
        is_success_story: false,
        event_date: '',
        // New fields
        name: '',
        link: '',
        authors: '',
        journal: '',
        publication_date: '',
        abstract: '',
        category: '',
        file: null as File | null,
    });

    const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const body = new FormData();
            body.append('status', isSuperAdmin ? 'approved' : 'pending');

            if (activeForm === 'news') {
                body.append('title', formData.title);
                body.append('content', formData.description);
                if (formData.image) body.append('image', formData.image);
                body.append('is_success_story', String(formData.is_success_story));
            } else if (activeForm === 'event') {
                body.append('title', formData.title);
                body.append('description', formData.description);
                body.append('event_date', new Date(formData.event_date).toISOString());
            } else if (activeForm === 'partnership') {
                body.append('name', formData.title || formData.name);
                body.append('description', formData.description);
                if (formData.link) body.append('link', formData.link);
                if (formData.image) body.append('logo', formData.image);
            } else if (activeForm === 'publication') {
                body.append('title', formData.title);
                body.append('authors', formData.authors);
                body.append('journal', formData.journal);
                body.append('publication_date', formData.publication_date);
                if (formData.link) body.append('link', formData.link);
                if (formData.abstract) body.append('abstract', formData.abstract);
            } else if (activeForm === 'education') {
                body.append('title', formData.title);
                body.append('content', formData.description);
                body.append('category', formData.category);
                if (formData.file) body.append('file', formData.file);
            }

            const endpointMap: Record<string, string> = {
                'news': 'news',
                'event': 'events',
                'partnership': 'partnerships',
                'publication': 'publications',
                'education': 'education'
            };

            const res = await authFetch(`${API_URL}/api/${endpointMap[activeForm]}/`, {
                method: 'POST',
                body: body
            });

            if (res.ok) {
                alert(`System synchronized! ${isSuperAdmin ? 'Content is now live in global clusters.' : 'Submission buffered for moderator review.'}`);
                setFormData({
                    title: '', description: '', image: null, is_success_story: false, event_date: '',
                    name: '', link: '', authors: '', journal: '', publication_date: '', abstract: '',
                    category: '', file: null
                });
            } else {
                let errMsg = `Server returned status ${res.status}`;
                try {
                    const errJson = await res.json();
                    errMsg = JSON.stringify(errJson);
                } catch {
                    const errText = await res.text().catch(() => '');
                    errMsg = errText.slice(0, 300) || errMsg;
                }
                alert(`Sequence Error: ${errMsg}`);
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
            case 'partnership': return <Briefcase className="w-4 h-4" />;
            case 'publication': return <FileText className="w-4 h-4" />;
            case 'education': return <Sparkles className="w-4 h-4" />;
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
                    {['news', 'event', 'partnership', 'publication', 'education'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setActiveForm(type as any)}
                            className={`flex items-center gap-4 px-10 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
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
                                <label className="text-sm font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic mb-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" /> Essential Identification
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-8 text-2xl text-white font-black italic uppercase tracking-tight outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-800"
                                    placeholder={`Enter ${activeForm} title...`}
                                />
                            </div>

                            {/* Dynamic Fields Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {activeForm === 'event' && (
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-xs font-black text-amber-400 uppercase tracking-widest italic">Temporal Coordinates</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={formData.event_date}
                                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                )}

                                {(activeForm === 'news' || activeForm === 'partnership') && (
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-xs font-black text-indigo-400 uppercase tracking-widest italic">{activeForm === 'partnership' ? 'Corporate Logo / Asset' : 'Visual Media Asset (Upload)'}</label>
                                        <label className="relative flex flex-col items-center justify-center w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <ImageIcon className="w-10 h-10 mb-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">
                                                    {formData.image ? formData.image.name : 'Click to upload from local storage'}
                                                </p>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setFormData({ ...formData, image: file });
                                                }}
                                            />
                                        </label>
                                    </div>
                                )}

                                {activeForm === 'partnership' && (
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-xs font-black text-cyan-400 uppercase tracking-widest italic">External Link (Optional)</label>
                                        <input
                                            type="url"
                                            value={formData.link}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-cyan-500/50"
                                            placeholder="https://partner-website.com"
                                        />
                                    </div>
                                )}

                                {activeForm === 'publication' && (
                                    <>
                                        <div className="col-span-1 space-y-4">
                                            <label className="text-xs font-black text-emerald-400 uppercase tracking-widest italic">Primary Authors</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.authors}
                                                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-emerald-500/50"
                                                placeholder="e.g., Dr. Smith, J. Doe"
                                            />
                                        </div>
                                        <div className="col-span-1 space-y-4">
                                            <label className="text-xs font-black text-emerald-400 uppercase tracking-widest italic">Scientific Journal/Outlet</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.journal}
                                                onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-emerald-500/50"
                                                placeholder="e.g., Nature Medicine"
                                            />
                                        </div>
                                        <div className="col-span-1 space-y-4">
                                            <label className="text-xs font-black text-emerald-400 uppercase tracking-widest italic">Publication Date</label>
                                            <input
                                                required
                                                type="date"
                                                value={formData.publication_date}
                                                onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                        <div className="col-span-1 space-y-4">
                                            <label className="text-xs font-black text-emerald-400 uppercase tracking-widest italic">DOI / Article Link</label>
                                            <input
                                                type="url"
                                                value={formData.link}
                                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-emerald-500/50"
                                                placeholder="https://doi.org/..."
                                            />
                                        </div>
                                    </>
                                )}

                                {activeForm === 'education' && (
                                    <>
                                        <div className="col-span-1 space-y-4">
                                            <label className="text-xs font-black text-purple-400 uppercase tracking-widest italic">Resource Category</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-purple-500/50"
                                                placeholder="e.g., Patient Guide, Methodology"
                                            />
                                        </div>
                                        <div className="col-span-1 space-y-4">
                                            <label className="text-xs font-black text-purple-400 uppercase tracking-widest italic">Digital Asset (PDF/Doc)</label>
                                            <label className="relative flex flex-col items-center justify-center w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-purple-500/50 transition-all group">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <FileText className="w-10 h-10 mb-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">
                                                        {formData.file ? formData.file.name : 'Click to upload from local storage'}
                                                    </p>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) setFormData({ ...formData, file: file });
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Description / Content Textarea */}
                            <div className="space-y-4">
                                <label className="text-sm font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                                    <ShieldCheck className="w-5 h-5 text-purple-400" /> 
                                    {activeForm === 'news' ? 'Article Intelligence' : 'Event Narrative Specification'}
                                </label>
                                <textarea
                                    required
                                    rows={8}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-8 text-xl text-slate-300 font-bold leading-relaxed outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-800"
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
