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
import { fetchStudies, Study } from '../data/studies';
import { motion } from 'framer-motion';

export default function StudyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [study, setStudy] = useState<Study | null>(null);

    useEffect(() => {
        fetchStudies().then((studies) => {
            const foundStudy = studies.find(s => s.id === id);
            if (foundStudy) {
                setStudy(foundStudy);
            } else {
                navigate('/trials');
            }
        });
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
                    <Link to="/trials" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-cyan-400 transition-all group">
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
                                <span className="px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-cyan-500/30 backdrop-blur-md">
                                    {study.status || 'RECRUITING'}
                                </span>
                                <span className="px-4 py-1.5 bg-slate-900/50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/5 backdrop-blur-md">
                                    {study.condition}
                                </span>
                                <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-500/30 backdrop-blur-md">
                                    {study.trialFormat}
                                </span>
                                {study.privacyStandards.map(std => (
                                    <span key={std} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/30 backdrop-blur-md">
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
                                <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.85]">
                                    {study.title}
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-400 font-bold leading-tight max-w-2xl">
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
                                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-2">{step.step}</div>
                                            <div className="text-2xl font-black text-white uppercase italic">{step.label}</div>
                                            <div className="text-slate-500 text-sm mt-1 max-w-md">Estimated duration: {idx === 0 ? '1-2 Days' : 'Weekly check-ins'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Detailed Grid */}
                        <div className="grid md:grid-cols-2 gap-8 pr-12">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-slate-900/30 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/5 space-y-6"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Box className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">At-Home Kits</h3>
                                <p className="text-slate-400 leading-relaxed font-medium">
                                    {study.kitsInfo}
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="bg-slate-900/30 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/5 space-y-6"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Microscope className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Lab Assessments</h3>
                                <p className="text-slate-400 leading-relaxed font-medium">
                                    Requires {study.timeCommitment} at our {study.location} facility for specialized clinical assessments.
                                </p>
                            </motion.div>
                        </div>
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
                                <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Study Compensation</div>
                                <div className="text-4xl lg:text-5xl font-black uppercase tracking-tighter italic leading-none">
                                    {study.compensation.split('for')[0]}
                                    <span className="block text-2xl mt-2 opacity-80 non-italic font-black">FOR TRAVEL AND TIME</span>
                                </div>
                            </div>
                            
                            <Link 
                                to={`/studies/${study.id}/screener`}
                                className="block w-full py-6 bg-slate-950 text-cyan-400 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-slate-950 hover:-translate-y-1 transition-all shadow-2xl relative z-10 text-center"
                            >
                                See If You Qualify
                            </Link>

                            <div className="space-y-6 pt-6 border-t border-slate-950/10 relative z-10">
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <Clock className="w-5 h-5" /> {study.duration} (2-3 VISITS)
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
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
                            <p className="text-xs text-slate-400 font-bold leading-relaxed">
                                {study.safetyInfo || "All natural ingredients. Product is manufactured in GMP-certified facilities and has been safety-validated in clinical lab settings. Your privacy is protected under HIPAA guidelines."}
                            </p>
                            <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">HIPAA Compliant</span>
                            </div>
                        </motion.div>

                        <div className="flex justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">
                             <div className="flex items-center gap-2 italic hover:text-cyan-600 transition-colors cursor-pointer">
                                <Search className="w-3 h-3" /> Search ID: {study.id}
                             </div>
                             <div className="flex items-center gap-2 italic hover:text-cyan-600 transition-colors cursor-pointer">
                                <Stethoscope className="w-3 h-3" /> IRB Validated
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
