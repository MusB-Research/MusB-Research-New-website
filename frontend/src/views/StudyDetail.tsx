import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Clock, 
    Calendar, 
    ShieldCheck, 
    Info, 
    CheckCircle2, 
    Microscope, 
    Box, 
    Lock,
    Search,
    Stethoscope
} from 'lucide-react';
import { HARDCODED_STUDIES, Study } from '../data/studies';
import { motion } from 'framer-motion';
import { authFetch } from '../utils/auth';

export default function StudyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [study, setStudy] = useState<Study | null>(null);

    useEffect(() => {
        const fetchStudy = async () => {
            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/studies/${id}/`);
                if (!response.ok) throw new Error('Failed to fetch study');
                const s = await response.json();
                
                // Map API data to UI structure
                setStudy({
                    id: s.protocol_id || s.id,
                    title: s.title,
                    description: s.primary_indication || "Standard research protocol",
                    condition: s.primary_indication || "Health Research",
                    trialFormat: s.study_type === 'VIRTUAL' ? 'Virtual' : (s.study_type === 'IN_PERSON' ? 'On-site' : 'Hybrid'),
                    status: s.status,
                    trialModel: s.trial_model,
                    benefit: s.trial_model === 'RCT' ? 'Placebo-Controlled' : 'Standard Product',
                    duration: "4-12 Weeks", 
                    overview: `This ${s.trial_model} protocol (${s.protocol_id}) investigates ${s.primary_indication || 'clinically relevant biomarkers'}. Designed as a ${s.study_type} trial with ${s.consent_mode} oversight.`,
                    privacyStandards: ["HIPAA", "GDPR"],
                    compensation: "$150-$500 depending on milestones",
                    safetyInfo: "All natural ingredients. Product is manufactured in GMP-certified facilities and has been safety-validated in clinical lab settings.",
                    timeline: [
                        { step: "Screening", label: "Eligibility Inquiry" },
                        { step: "Consent", label: "Protocol Enrollment" },
                        { step: "Active", label: "Duration Observation" },
                        { step: "Completion", label: "Final Report Delivery" }
                    ]
                } as any);
            } catch (err) {
                console.error("Error fetching study:", err);
                const foundStudy = HARDCODED_STUDIES.find(st => st.id === id);
                if (foundStudy) setStudy(foundStudy);
                else navigate('/trials');
            }
        };

        fetchStudy();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    if (!study) return null;

    return (
        <div className="min-h-screen pt-40 pb-24 px-4 md:px-12 bg-transparent text-slate-200">
            <div className="max-w-7xl mx-auto space-y-16">
                
                {/* Header Nav */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <Link to="/trials" className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.4em] text-slate-500 hover:text-cyan-400 transition-all group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        BACK TO ALL STUDIES
                    </Link>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left Column: Content */}
                    <div className="lg:col-span-8 space-y-12">
                        
                        {/* Title Section */}
                        <div className="space-y-8">
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-3"
                            >
                                <span className="px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-cyan-500/30 backdrop-blur-md">
                                    {study.status || 'RECRUITING'}
                                </span>
                                <span className="px-4 py-1.5 bg-slate-900/50 text-slate-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/5 backdrop-blur-md">
                                    {study.condition}
                                </span>
                                <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-indigo-500/30 backdrop-blur-md">
                                    {study.trialFormat}
                                </span>
                                {study.privacyStandards.map(std => (
                                    <span key={std} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-emerald-500/30 backdrop-blur-md">
                                        {std}
                                    </span>
                                ))}
                            </motion.div>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-4"
                            >
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none mb-3">
                                    {study.title}
                                </h1>
                                <p className="text-lg md:text-xl text-slate-400 font-bold leading-snug max-w-2xl">
                                    {study.description}
                                </p>
                            </motion.div>
                        </div>

                        {/* Overview Card */}
                        <motion.section 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#0f172a]/40 backdrop-blur-[40px] rounded-[3.5rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                            
                            <div className="relative z-10 space-y-8">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                        <Info className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    Overview
                                </h2>
                                <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                    {study.overview}
                                </p>
                            </div>
                        </motion.section>

                        {/* Participation Timeline */}
                        <motion.section 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-12 pl-4"
                        >
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                                <Calendar className="w-8 h-8 text-cyan-400" />
                                Participation Timeline
                            </h2>
                            
                            <div className="space-y-10 relative">
                                <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-500/50 via-white/5 to-transparent"></div>
                                
                                {study.timeline.map((step, idx) => (
                                    <div key={idx} className="flex gap-10 items-start group">
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-cyan-400 font-black text-sm group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-500 transition-all duration-500 shadow-xl">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-500 mb-2">{step.step}</div>
                                            <div className="text-2xl font-black text-white uppercase italic">{step.label}</div>
                                            <div className="text-slate-500 text-base mt-2 max-w-md font-bold">Estimated duration: {idx === 0 ? '1-2 Days' : 'Weekly check-ins'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                    </div>

                    {/* Right Column: CTA Sidebar */}
                    <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-40">
                        
                        {/* Compensation Card */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-cyan-400 rounded-[3.5rem] p-12 text-slate-950 space-y-12 shadow-[0_40px_80px_-20px_rgba(34,211,238,0.3)] relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                            
                            <div className="space-y-4 text-center relative z-10">
                                <div className="text-xs font-black uppercase tracking-[0.4em] opacity-60">Study Compensation</div>
                                <div className="text-4xl lg:text-5xl font-black uppercase tracking-tighter italic leading-none">
                                    {study.compensation.split('for')[0]}
                                    <span className="block text-3xl mt-2 opacity-80 non-italic font-black">FOR TRAVEL AND TIME</span>
                                </div>
                            </div>
                            
                            <Link 
                                to={`/studies/${study.id}/screener`}
                                className="block w-full py-6 bg-slate-950 text-cyan-400 rounded-3xl font-black text-sm uppercase tracking-[0.3em] hover:bg-white hover:text-slate-950 hover:-translate-y-1 transition-all shadow-2xl relative z-10 text-center"
                            >
                                See If You Qualify
                            </Link>

                            <div className="space-y-6 pt-6 border-t border-slate-950/10 relative z-10">
                                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                                    <Clock className="w-5 h-5" /> {study.duration.split('(')[0].trim()}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                                    <Lock className="w-5 h-5 text-slate-950/60" /> Privacy Protected
                                </div>
                            </div>
                        </motion.div>

                        {/* Safety & Compliance Card */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 space-y-8"
                        >
                            <h3 className="text-sm font-black text-white uppercase italic tracking-[0.2em] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                                </div>
                                Safety & Privacy
                            </h3>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed">
                                {study.safetyInfo || "All natural ingredients. Product is manufactured in GMP-certified facilities and has been safety-validated in clinical lab settings. Your privacy is protected under HIPAA guidelines."}
                            </p>
                            <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">HIPAA Compliant</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
