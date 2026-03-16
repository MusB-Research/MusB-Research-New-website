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
                    </div>

                    {/* Right Column: CTA Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-40">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 space-y-8 flex flex-col items-center text-center shadow-2xl overflow-hidden relative"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
                            
                            <div className="space-y-3 relative z-10">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Ready to participate?</h3>
                                <div className="text-2xl font-black text-white italic uppercase tracking-tight">
                                    Check your eligibility
                                </div>
                            </div>

                            <Link 
                                to={`/studies/${study.id}/screener`}
                                className="inline-flex items-center justify-center px-10 py-4 bg-cyan-500 text-slate-950 rounded-full font-black text-[13px] uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:-translate-y-0.5 transition-all duration-300 relative z-10"
                            >
                                See If You Qualify
                            </Link>

                            <div className="flex items-center justify-center gap-6 pt-6 border-t border-white/5 w-full relative z-10">
                                <div className="flex flex-col items-center gap-1">
                                    <Clock className="w-4 h-4 text-cyan-400/60" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{study.duration.split('(')[0].trim()}</span>
                                </div>
                                <div className="w-[1px] h-6 bg-white/5"></div>
                                <div className="flex flex-col items-center gap-1">
                                    <Lock className="w-4 h-4 text-emerald-400/60" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Privacy Protected</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
