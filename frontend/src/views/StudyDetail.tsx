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
import { authFetch } from '../utils/auth';

const customStudyContent: Record<string, any> = {
    'beat the bloat': {
        title: 'Beat the Bloat Study',
        description: 'A simple, non-invasive study to improve everyday digestive comfort and reduce bloating.',
        overviewBullets: [
            'Evaluating a natural formulation targeting bloating, gas, and indigestion',
            'Focus on common gastrointestinal symptoms in everyday life',
            'Non-invasive testing using breath-based gas measurements',
            'No blood draw or complex procedures required',
            'Short-duration study with minimal time commitment'
        ],
        benefitsBullets: [
            'Receive $150 compensation upon completion',
            'Access to free digestive health assessment',
            'Try a natural formulation at no cost',
            'No invasive testing—simple and comfortable participation',
            'Contribute to improving gut health solutions'
        ],
        ctaText: 'Participate in innovative, community-driven clinical research and take an active role in advancing health science—while gaining valuable insights into your own health.'
    },
    'vital-age': {
        title: 'Vital-Age Study',
        description: 'Supporting healthy aging through microbiome-driven innovation.',
        overviewBullets: [
            'Evaluates a probiotic/postbiotic intervention for healthy aging and metabolic function',
            'Focus on improving energy, metabolism, and overall wellness',
            'Includes multiple assessments across a structured timeline',
            'Designed for adults seeking to maintain vitality with age',
            'Integrates microbiome and metabolic health insights'
        ],
        benefitsBullets: [
            'Receive $200 compensation upon completion',
            'Access to advanced health and metabolic testing',
            'Free study product designed for healthy aging',
            'Gain insights into your personal health markers',
            'Contribute to cutting-edge aging research'
        ],
        ctaText: 'Participate in innovative, community-driven clinical research and take an active role in advancing health science—while gaining valuable insights into your own health.'
    },
    'sam study': {
        title: 'SAM Study (Supporting Active Menopause)',
        description: 'Improving comfort and quality of life during menopause through natural interventions.',
        overviewBullets: [
            'Evaluates a herbal formulation for menopause-related symptoms',
            'Focus on hot flashes, mood changes, and overall well-being',
            'Includes hormone-related assessments and symptom tracking',
            'Designed for women aged 40–65 years',
            'Supports evidence-based solutions for women’s health'
        ],
        benefitsBullets: [
            'Receive $300 compensation upon completion',
            'Access to free hormone testing',
            'Try a natural menopause-support formulation',
            'Monitor improvements in symptoms and well-being',
            'Contribute to advancing women’s health research'
        ],
        ctaText: 'Participate in innovative, community-driven clinical research and take an active role in advancing health science—while gaining valuable insights into your own health.'
    },
    'renew study': {
        title: 'RENEW Study',
        description: 'A next-generation study focused on restoring health through targeted nutrition and microbiome support.',
        overviewBullets: [
            'Investigates the impact of a novel intervention on metabolic and overall health',
            'Focus on restoring balance in gut, metabolism, and systemic wellness',
            'Combines lifestyle, nutrition, and microbiome-based approaches',
            'Includes structured follow-up and health monitoring',
            'Designed to generate real-world evidence for wellness innovation'
        ],
        benefitsBullets: [
            'Receive compensation for participation',
            'Access to free health evaluations and testing',
            'Try innovative, science-backed interventions',
            'Gain personalized insights into your health',
            'Be part of next-generation clinical research'
        ],
        ctaText: 'Participate in innovative, community-driven clinical research and take an active role in advancing health science—while gaining valuable insights into your own health.'
    }
};

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

    const studyKey = Object.keys(customStudyContent).find(key => study.title.toLowerCase().includes(key));
    const customContent = studyKey ? customStudyContent[studyKey] : null;

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
                                    {customContent ? customContent.title : study.title}
                                </h1>
                                <p className="text-lg md:text-xl text-slate-400 font-bold leading-snug max-w-2xl">
                                    {customContent ? customContent.description : study.description}
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
                                {customContent ? (
                                    <ul className="space-y-3 text-slate-300 text-lg leading-relaxed font-medium list-disc pl-5">
                                        {customContent.overviewBullets.map((bullet: string, idx: number) => (
                                            <li key={idx}>{bullet}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                        {study.overview}
                                    </p>
                                )}
                            </div>
                        </motion.section>

                        {/* Additional info for custom studies */}
                        {customContent && (
                            <>
                                <motion.section 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-[#0f172a]/40 backdrop-blur-[40px] rounded-[3.5rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                                    <div className="relative z-10 space-y-8">
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            Benefits for Participants
                                        </h2>
                                        <ul className="space-y-3 text-slate-300 text-lg leading-relaxed font-medium list-disc pl-5">
                                            {customContent.benefitsBullets.map((bullet: string, idx: number) => (
                                                <li key={idx}>{bullet}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.section>

                                <motion.section 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-[#0f172a]/40 backdrop-blur-[40px] rounded-[3.5rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                                    <div className="relative z-10 space-y-8">
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                <Microscope className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            Join a MusB Research Study Today
                                        </h2>
                                        <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                            {customContent.ctaText}
                                        </p>
                                    </div>
                                </motion.section>
                            </>
                        )}
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
