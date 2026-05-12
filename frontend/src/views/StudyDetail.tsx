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
    Stethoscope,
    Users,
    MapPin
} from 'lucide-react';
import { fetchStudies, Study } from '../data/studies';
import { MarkdownText } from '../components/shared/MarkdownText';
import { motion } from 'framer-motion';
import { authFetch, getRole, API } from '../utils/auth';
import { Skeleton } from './Participant/SharedComponents';
import SEO from '@/components/SEO';

const customStudyContent: Record<string, any> = {
    'beat the bloat': {
        title: 'Beat the Bloat Study',
        description: 'A paid gut health clinical study enrolling adults now',
        overviewBullets: [
            'Beat the Bloat is a preclinical-to-clinical gut health research study investigates the effects of a natural botanical product on common digestive symptoms including bloating, gas, and general gut discomfort.',
            'Participants will be carefully monitored throughout the study duration by trained clinical staff. All procedures follow rigorous scientific and ethical standards. The natural product being studied has been selected based on its promising phytochemical profile and preclinical safety data.'
        ],
        benefitsBullets: [
            'No cost to you — All study materials and monitoring provided free of charge',
            'Clinically monitored — Your health is tracked by experienced research professionals',
            '100% natural product — Botanical ingredient with a strong safety profile',
            'Get paid $150 — Compensation for your time and contribution',
            'Beyond compensation, your participation directly advances gut health science — contributing to research that may help millions of people living with chronic digestive discomfort.'
        ],
        ctaText: 'Bloating and gut discomfort affect millions of adults — yet too few effective, natural solutions have been rigorously studied. You can change that.\n\nBy joining Beat the Bloat, you\'re not just a participant — you\'re a Research Hero. Your contribution helps build the scientific evidence that supports safe, natural gut health solutions for your community and beyond. This is real science, conducted by real researchers at USF, with your wellbeing at the center.\n\nMusB Research is enrolling adults now. Spots are limited — and your involvement makes a difference.'
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
    'sam': {
        title: 'SAM Study (Supporting Active Menopause)',
        description: 'Evaluating the effectiveness of Ayurvedic herbs in reducing menopausal symptoms.',
        overviewBullets: [
            'Randomized, double-blind, placebo-controlled clinical trial evaluating Ashoka Bark and Shatavari.',
            'Participants receive either a 100 mg daily oral capsule or a placebo for 12 weeks.',
            'Assesses natural, non-hormonal alternatives to Hormone Replacement Therapy (HRT).',
            'Includes three clinical visits (baseline, week 6, and week 12) for symptom evaluation and hormone testing.',
            'Optional vaginal microbiome sampling for additional health insights.'
        ],
        benefitsBullets: [
            'Potential improvement in menopausal symptoms (hot flashes, night sweats, sleep).',
            'Comprehensive hormonal health insights (FSH and estradiol testing).',
            'Access to research-based, plant-based menopause interventions.',
            'Close monitoring by a specialized clinical research team.',
            'Compensation of $300 upon completion of the study.'
        ],
        ctaText: "Menopause is a natural phase of life, yet many women experience symptoms that significantly impact daily well-being, productivity, and quality of life. Safe and effective non-hormonal options remain limited.\n\nBy participating in this study, you are contributing to important research that aims to expand evidence-based, natural treatment options for women’s health. Your involvement helps generate meaningful data that can guide future care, improve quality of life for women globally, and support the development of accessible alternatives to hormone-based therapies.\n\nYour participation is not only a personal health opportunity — it is a contribution to advancing women’s health research for future generations."
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Scroll immediately — before data loads — to prevent footer flash
        setLoading(true);
        fetchStudies().then((studies) => {
            const foundStudy = studies.find(s => s.id === id);
            if (foundStudy) {
                setStudy(foundStudy);
            } else {
                navigate('/trials');
            }
            setLoading(false);
        });
    }, [id, navigate]);

    if (loading || !study) {
        return (
            <div className="min-h-screen pt-40 pb-24 px-4 md:px-12">
                <div className="max-w-7xl mx-auto space-y-10">
                    {/* Back link skeleton */}
                    <Skeleton className="h-4 w-36 rounded-full" />
                    <div className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="flex gap-3">
                                <Skeleton className="h-7 w-24 rounded-full" />
                                <Skeleton className="h-7 w-20 rounded-full" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-16 w-3/4 rounded-2xl" />
                                <Skeleton className="h-8 w-1/2 rounded-xl" />
                            </div>
                            <Skeleton className="h-64 w-full rounded-[3rem]" />
                        </div>
                        <div className="lg:col-span-4">
                            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const studyTitleNormalized = (study.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const studyKey = Object.keys(customStudyContent).find(key => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedKey === studyTitleNormalized || studyTitleNormalized.includes(normalizedKey) || normalizedKey.includes(studyTitleNormalized);
    });
    const customContent = studyKey ? customStudyContent[studyKey] : null;

    // Prioritize DB content over hardcoded content
    const displayTitle = (study.title || '').trim() || (customContent ? customContent.title : '');
    const displayDescription = (study.description || '').trim() || (customContent ? customContent.description : '');
    const displayParticipationMsg = (study.participation_message || '').trim() || (customContent ? customContent.ctaText : '');

    return (
        <div className="min-h-screen pt-40 pb-24 px-4 md:px-12 bg-transparent text-slate-200">
            <SEO 
                title={`${displayTitle} | MusB Research Study`}
                description={displayDescription}
                canonical={`https://www.musbhealth.com/studies/${id}`}
            />
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Header Nav */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <Link to="/trials" className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.4em] text-slate-500 hover:text-[#00ADEF] transition-all group">
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
                                <span className="px-4 py-1.5 bg-[#00ADEF]/10 text-[#00ADEF] rounded-full text-sm font-black uppercase tracking-[0.2em] border border-[#00ADEF]/30 backdrop-blur-md">
                                    {study.status || 'RECRUITING'}
                                </span>
                                <span className="px-4 py-1.5 bg-slate-900/50 text-slate-400 rounded-full text-sm font-black uppercase tracking-[0.2em] border border-white/5 backdrop-blur-md">
                                    {study.condition}
                                </span>
                                <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-black uppercase tracking-[0.2em] border border-indigo-500/30 backdrop-blur-md">
                                    {study.trialFormat}
                                </span>
                                {study.privacyStandards.map(std => (
                                    <span key={std} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-black uppercase tracking-[0.2em] border border-emerald-500/30 backdrop-blur-md">
                                        {std}
                                    </span>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    {study.full_title && (
                                        <div className="flex flex-col gap-1 mb-6">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Official Full Title</span>
                                            <p className="text-sm font-bold text-slate-400 leading-relaxed border-l border-white/10 pl-4">
                                                {study.full_title}
                                            </p>
                                        </div>
                                    )}
                                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight leading-none">
                                        {displayTitle}
                                    </h1>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                                    <span className="text-[10px] font-black text-[#00ADEF] uppercase tracking-[0.3em] mb-2 block">Brief Summary</span>
                                    <div className="text-xl md:text-2xl text-slate-300 font-bold leading-snug">
                                        <MarkdownText text={displayDescription} />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        {/* Detailed Study Sections */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Study Overview */}
                            {((study as any).overview || customContent?.overviewBullets) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-10 bg-slate-900/30 rounded-[3rem] border border-white/5 space-y-6"
                                >
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                                        <Info className="w-5 h-5 text-[#00ADEF]" />
                                        Study Overview
                                    </h3>
                                    <ul className="space-y-4">
                                        {(study as any).overview ? (
                                            (study as any).overview.split('\n').filter(Boolean).map((line: string, idx: number) => (
                                                <li key={idx} className="flex gap-4 text-slate-300 leading-relaxed font-medium">
                                                    <span className="text-[#00ADEF] font-bold shrink-0">•</span>
                                                    <MarkdownText text={line.replace(/^[•\-\*]\s*/, '')} />
                                                </li>
                                            ))
                                        ) : (
                                            customContent?.overviewBullets.map((bullet: string, idx: number) => (
                                                <li key={idx} className="flex gap-4 text-slate-300 leading-relaxed font-medium">
                                                    <span className="text-[#00ADEF] font-bold shrink-0">•</span>
                                                    {bullet}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </motion.div>
                            )}

                            {/* Benefits */}
                            {((study as any).benefit || customContent?.benefitsBullets) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-10 bg-[#00ADEF]/5 rounded-[3rem] border border-[#00ADEF]/10 space-y-6"
                                >
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        Benefits for Participants
                                    </h3>
                                    <ul className="space-y-4">
                                        {(study as any).benefit ? (
                                            (study as any).benefit.split('\n').filter(Boolean).map((line: string, idx: number) => (
                                                <li key={idx} className="flex gap-4 text-slate-300 leading-relaxed font-medium">
                                                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                                                    <MarkdownText text={line.replace(/^[•\-\*]\s*/, '').trim()} />
                                                </li>
                                            ))
                                        ) : (
                                            customContent?.benefitsBullets.map((bullet: string, idx: number) => (
                                                <li key={idx} className="flex gap-4 text-slate-300 leading-relaxed font-medium">
                                                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                                                    {bullet}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </motion.div>
                            )}
                        </div>


                        {/* Investigator Section */}
                        {study.pi_details && (
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-[#0f172a]/40 backdrop-blur-[40px] rounded-[3.5rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ADEF]/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                                <div className="relative z-10 space-y-8">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#00ADEF]/10 flex items-center justify-center border border-[#00ADEF]/20">
                                            <Stethoscope className="w-5 h-5 text-[#00ADEF]" />
                                        </div>
                                        Principal Investigator
                                    </h2>
                                    <div className="flex flex-col md:flex-row items-center gap-10 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 group/pi hover:bg-white/[0.04] transition-all">
                                        <div className="w-40 h-40 rounded-[2.5rem] bg-slate-950 border border-white/10 overflow-hidden shrink-0 shadow-2xl relative group-hover/pi:scale-105 transition-transform duration-500">
                                            {study.pi_details.profile_picture ? (
                                                <img 
                                                    src={study.pi_details.profile_picture} 
                                                    alt={study.pi_details.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-800">
                                                    <Users className="w-16 h-16" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4 text-center md:text-left flex-1">
                                            <div className="space-y-1">
                                                <h4 className="text-3xl font-black text-white uppercase italic tracking-tight">{study.pi_details.name}</h4>
                                                <div className="text-[#00ADEF] text-[12px] font-black uppercase tracking-[0.2em]">{study.pi_details.qualifications}</div>
                                            </div>
                                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                                                {study.pi_details.bio}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {/* Community Impact / CTA Section */}
                        {(customContent || study.participation_message) && (
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-[#0f172a]/40 backdrop-blur-[40px] rounded-[3.5rem] p-10 md:p-14 border border-white/10 shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ADEF]/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                                <div className="relative z-10 space-y-8">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#00ADEF]/10 flex items-center justify-center border border-[#00ADEF]/20">
                                            <Microscope className="w-5 h-5 text-[#00ADEF]" />
                                        </div>
                                        Community Participation Message
                                    </h2>
                                    <div className="text-slate-300 text-xl leading-relaxed font-medium">
                                        <MarkdownText text={displayParticipationMsg} />
                                    </div>
                                </div>
                            </motion.section>
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
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00ADEF]/10 blur-3xl rounded-full"></div>

                            <div className="space-y-3 relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Ready to participate?</h3>
                                <div className="text-3xl font-black text-white italic uppercase tracking-tight">
                                    Check your eligibility
                                </div>
                            </div>

                            {getRole() && getRole() !== 'PARTICIPANT' ? (
                                <div className="space-y-4 w-full">
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-500 text-left">
                                        <Lock className="w-5 h-5 shrink-0" />
                                        <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                                            You are logged in as a {getRole().replace('_', ' ')}. This form is for participants only.
                                        </p>
                                    </div>
                                    <button 
                                        disabled
                                        className="w-full py-5 bg-white/5 border border-white/10 text-white/30 rounded-full font-black text-[14px] uppercase tracking-[0.2em] cursor-not-allowed"
                                    >
                                        Access Restricted
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to={`/studies/${study.id}/screener`}
                                    className="inline-flex items-center justify-center px-10 py-5 bg-[#00ADEF] text-white rounded-full font-black text-[16px] uppercase tracking-[0.2em] hover:bg-white hover:text-[#00ADEF] hover:shadow-[0_0_30px_rgba(0,173,239,0.4)] hover:-translate-y-0.5 transition-all duration-300 relative z-10"
                                >
                                    See If You Qualify
                                </Link>
                            )}

                            <div className="flex items-center justify-center gap-6 pt-6 border-t border-white/5 w-full relative z-10">
                                <div className="flex flex-col items-center gap-1 group/item">
                                    <Clock className="w-4 h-4 text-[#00ADEF]/60 group-hover/item:text-[#00ADEF] transition-colors" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover/item:text-slate-300 transition-colors">{study.duration.split('(')[0].trim()}</span>
                                </div>
                                <div className="w-[1px] h-6 bg-white/5"></div>
                                <div className="flex flex-col items-center gap-1 group/item">
                                    <MapPin className="w-4 h-4 text-amber-500/60 group-hover/item:text-amber-500 transition-colors" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover/item:text-slate-300 transition-colors">
                                        {study.countries && study.countries.length > 0 
                                            ? (study.countries.length === 1 
                                                ? (study.countries[0] || '').replace(/[\[\]"]/g, '').trim() 
                                                : `${study.countries.length} Countries`)
                                            : 'Global'}
                                    </span>
                                </div>
                                <div className="w-[1px] h-6 bg-white/5"></div>
                                <div className="flex flex-col items-center gap-1 group/item">
                                    <Lock className="w-4 h-4 text-emerald-400/60 group-hover/item:text-emerald-400 transition-colors" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover/item:text-slate-300 transition-colors">Privacy Protected</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}


