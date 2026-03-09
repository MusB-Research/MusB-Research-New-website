import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Microscope, Brain, GraduationCap, Database, Workflow, HeartPulse,
    FlaskConical, Beaker, ShieldCheck, Zap, Target, Users, RefreshCcw, Lightbulb,
    Globe, Award, BookOpen, Layers, CheckCircle2, Sparkles, Eye, Heart
} from 'lucide-react';

// Icon lookup map for dynamic rendering from backend data
const iconMap: Record<string, React.ElementType> = {
    brain: Brain, microscope: Microscope, 'graduation-cap': GraduationCap,
    database: Database, workflow: Workflow, 'heart-pulse': HeartPulse,
    'flask-conical': FlaskConical, beaker: Beaker, 'shield-check': ShieldCheck,
    zap: Zap, target: Target, users: Users, 'refresh-ccw': RefreshCcw,
    lightbulb: Lightbulb, globe: Globe, award: Award, 'book-open': BookOpen,
    layers: Layers, sparkles: Sparkles, eye: Eye, heart: Heart,
};

const getIcon = (name: string) => iconMap[name] || Globe;

// Default trust indicators (used when backend doesn't provide them)
const defaultTrustIndicators = [
    { icon: 'brain', title: "Multidisciplinary Expertise", description: "Clinical and preclinical research expertise across diverse therapeutic areas." },
    { icon: 'graduation-cap', title: "Academia-Affiliated", description: "Led by academia-affiliated scientists and board-certified clinicians." },
    { icon: 'database', title: "Integrated Services", description: "Integrated research, lab, and biorepository services for seamless project execution." },
    { icon: 'workflow', title: "End-to-End Support", description: "Comprehensive research support from discovery to validation." },
    { icon: 'heart-pulse', title: "Ethical & Community-Focused", description: "Commitment to community-focused, transparent, and ethical research practices." }
];

// Default three ways cards
const defaultThreeWays = [
    {
        icon: 'flask-conical', title: 'Research & Innovation', color: 'cyan',
        tagline: 'From ideas to evidence.',
        description: 'We design and execute rigorous preclinical and clinical research programs to scientifically substantiate your products. Our expertise spans discovery, mechanistic validation, efficacy, safety, and translational studies.',
        deliverables: ['In vitro and in vivo research', 'Human clinical trials', 'Microbiome, biotics, aging, and metabolic health research', 'Biomarkers, functional outcomes, and data interpretation'],
        cta_text: 'Discuss a Research Project', cta_link: '/contact'
    },
    {
        icon: 'microscope', title: 'Central Laboratory Services', color: 'indigo',
        tagline: 'Data you can trust.',
        description: 'Our central laboratory services deliver accurate, reproducible, and compliant testing to support research, clinical studies, and product validation.',
        deliverables: ['ELISA, proteomics, and real-time PCR', 'Microbiome and molecular analysis', 'SOP-driven workflows and sponsor-ready reporting'],
        cta_text: 'Request Laboratory Support', cta_link: '/contact'
    },
    {
        icon: 'database', title: 'Biorepository', color: 'blue',
        tagline: 'Protecting the long-term value of your samples.',
        description: 'We provide secure biospecimen processing, tracking, and storage to support longitudinal research, multi-omics analysis, and future regulatory needs.',
        deliverables: ['Sample processing and standardized storage', 'Chain-of-custody and retrieval', 'Support for multi-site and long-term studies'],
        cta_text: 'Explore Biorepository Services', cta_link: '/contact'
    }
];

// Default core values
const defaultCoreValues = [
    { icon: 'star', name: 'Excellence', description: 'We pursue the highest standards to ensure exceptional quality and reliability.' },
    { icon: 'shield-check', name: 'Integrity', description: 'We uphold ethical research practices built on transparency and trust.' },
    { icon: 'zap', name: 'Innovation', description: 'We embrace cutting-edge technologies and forward-thinking approaches.' },
    { icon: 'users', name: 'Collaboration', description: 'We work closely with our partners to drive shared success.' },
    { icon: 'heart', name: 'Commitment', description: 'We are dedicated to advancing public health through rigorous science.' },
    { icon: 'target', name: 'Client Focus', description: 'We deliver personalized, tailored solutions aligned with your goals.' },
    { icon: 'refresh-cw', name: 'Continuous Improvement', description: 'We constantly refine our methods through learning and evaluation.' },
    { icon: 'globe', name: 'Responsibility', description: 'We ensure our research contributes positively to society and global health.' },
    { icon: 'flame', name: 'Passion', description: 'We are driven by a deep passion for science and innovation.' },
    { icon: 'check-circle', name: 'Quality', description: 'We ensure excellence through meticulous attention to detail and quality control.' }
];

// Default partner features
const defaultPartnerFeatures = [
    { icon: 'layers', title: 'Flexible engagement models', description: 'Tailored partnerships that align with your specific research objectives and budget.' },
    { icon: 'users', title: 'Scalable support', description: 'Infrastructure and expertise that grows alongside your startups or global enterprise.' },
    { icon: 'zap', title: 'Transparent collaboration', description: 'Clear communication and seamless integration with your internal research teams.' },
    { icon: 'shield-check', title: 'Science-first execution', description: 'Marketing-aware research that maintains the highest levels of scientific integrity.' }
];

export default function WhyChooseUs() {

    // Use backend data if available, otherwise defaults
    const trustIndicators = defaultTrustIndicators;
    const threeWays = defaultThreeWays;
    const coreValues = defaultCoreValues;
    const partnerFeatures = defaultPartnerFeatures;
    const heroTagline = 'Scientist-Led Growth';
    const heroTitle = 'Your Science Partner for <span class="text-cyan-400">Evidence-Driven</span> Growth';
    const heroDesc = "At MusB™ Research, we don't just run studies—we help you understand your product's strengths, limitations, and real-world impact so you can make the best scientific, business, and health decisions.";
    const threeWaysTitle = 'Three Integrated Ways We Support Your Innovation';
    const threeWaysSubtext = 'MusB Research offers flexible, end-to-end support—whether you need discovery research, laboratory testing, or secure sample management.';
    const storyTitle = 'Our Story';
    const storyContent = "MusB Research was founded by highly experienced scientists with a shared mission: to elevate the scientific integrity of products reaching the market.\n\nLed by world-renowned experts including Dr. Hariom Yadav and Dr. Shalini Jain, MusB Research was created to support innovators who value evidence, transparency, and responsible growth.\n\nWe believe every product in the market should be scientifically understood—not just for its benefits, but also for its limitations. This clarity empowers better business decisions, better healthcare choices, and greater public trust.\n\nWe do not differentiate between large and small partners. We treat every collaboration with the same scientific rigor, commitment, and respect.";
    const partnerTitle = 'An Extension of Your R&D Team';
    const partnerContent = 'MusB Research functions as an extension of your internal R&D—providing facilities, expertise, and resources that scale with your needs.\n\nWhether you are an early-stage innovator or an established global brand, we integrate seamlessly with your team to deliver credible, actionable science.';
    const missionTitle = 'Our Mission';
    const missionContent = 'MusB Research is committed to being your growth partner by providing robust, reliable scientific evidence for your products. We are passionate about supporting your success through meticulous research, innovative approaches, and uncompromising scientific integrity.';
    const visionTitle = 'Our Vision';
    const visionContent = 'We envision becoming a global leader in healthcare research—driving groundbreaking innovations that enhance public health and well-being for all.';

    const colorMap: Record<string, { accent: string; bg: string; glow: string; dot: string }> = {
        cyan: { accent: 'text-cyan-400', bg: 'bg-cyan-500/10', glow: 'shadow-[0_0_8px_rgba(34,211,238,0.6)]', dot: 'bg-cyan-400' },
        indigo: { accent: 'text-indigo-400', bg: 'bg-indigo-500/10', glow: 'shadow-[0_0_8px_rgba(129,140,248,0.6)]', dot: 'bg-indigo-400' },
        blue: { accent: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_8px_rgba(96,165,250,0.6)]', dot: 'bg-blue-400' },
    };

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            <div className="relative z-10 space-y-0 pt-40 pb-24 animate-in fade-in duration-1000">

                {/* ============================================================ */}
                {/* SECTION 1: Hero */}
                {/* ============================================================ */}
                <section className="max-w-[1700px] mx-auto px-4 md:px-12 mb-12">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold text-xs tracking-widest uppercase">
                                <Microscope className="w-4 h-4" /> {heroTagline}
                            </div>
                            <h1
                                className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] uppercase"
                                dangerouslySetInnerHTML={{ __html: heroTitle }}
                            />
                            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl">
                                {heroDesc}
                            </p>
                            <div className="flex flex-wrap gap-6 pt-4">
                                <Link to="/contact" className="grow-0 bg-cyan-500 text-slate-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2">
                                    Start the Conversation <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/capabilities" className="grow-0 bg-white/5 text-white border border-white/10 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 hover:-translate-y-1 transition-all flex items-center gap-2">
                                    Explore Our Capabilities
                                </Link>
                            </div>
                        </div>
                        <div className="relative animate-fade-in-up stagger-1">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 rounded-[4rem] blur-[80px]"></div>
                            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[4rem] p-4 overflow-hidden shadow-2xl group">
                                <img
                                    src="/mission_innovation.png"
                                    alt="Clinical Research"
                                    className="w-full h-[500px] object-cover rounded-[3.5rem] brightness-90 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-x-8 bottom-8 p-10 rounded-3xl bg-slate-950/80 backdrop-blur-md border border-white/10 space-y-3">
                                    <h4 className="text-white font-black text-xl uppercase tracking-wider">Mission-Driven Innovation</h4>
                                    <p className="text-slate-400 text-lg font-medium">Empowering brands with credible scientific substantiation.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================ */}
                {/* SECTION 2: Three Ways We Support Your Program */}
                {/* ============================================================ */}
                {true && (
                    <section className="py-16 relative z-10 mb-16">
                        <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                            <div className="text-center space-y-8 mb-24 max-w-7xl mx-auto">
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                                    {threeWaysTitle}
                                </h2>
                                <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                                    {threeWaysSubtext}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                {threeWays.map((card: any, idx: number) => {
                                    const colors = colorMap[card.color] || colorMap.cyan;
                                    const IconComp = getIcon(card.icon);
                                    return (
                                        <div key={idx} className="group relative bg-white/5 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-700 flex flex-col">
                                            <div className={`w-20 h-20 mb-10 rounded-3xl ${colors.bg} flex items-center justify-center ${colors.accent} group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500 shadow-xl`}>
                                                <IconComp className="w-10 h-10" />
                                            </div>
                                            <h3 className={`text-3xl font-black text-white mb-8 group-hover:${colors.accent} transition-colors uppercase`}>{card.title}</h3>
                                            <div className="space-y-8 flex-grow">
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/60 transition-colors mb-3">{card.tagline}</h4>
                                                    <p className="text-slate-300 font-bold leading-relaxed">{card.description}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Includes:</h4>
                                                    <ul className="space-y-4">
                                                        {card.deliverables?.map((item: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-3">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} mt-2 ${colors.glow}`}></div>
                                                                <span className="text-slate-400 text-sm font-medium">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            <Link to={card.cta_link || '/contact'} className={`mt-12 w-full ${card.color === 'indigo' ? 'bg-indigo-500' : card.color === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'} text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn`}>
                                                {card.cta_text || 'Learn More'}
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================================ */}
                {/* SECTION 3: Our Story */}
                {/* ============================================================ */}
                {true && (
                    <section className="py-32 relative z-10">
                        <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                            <div className="grid lg:grid-cols-2 gap-20 items-center">
                                <div className="space-y-8 animate-fade-in-up">
                                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-400/10 border border-indigo-400/20 text-indigo-400 font-bold text-xs tracking-widest uppercase">
                                        <BookOpen className="w-4 h-4" /> About MusB™
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase">
                                        {storyTitle}
                                    </h2>
                                    {storyContent.split('\n\n').map((para: string, i: number) => (
                                        <p key={i} className="text-lg text-slate-400 font-medium leading-relaxed">
                                            {para}
                                        </p>
                                    ))}
                                </div>
                                <div className="relative animate-fade-in-up stagger-1">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 blur-3xl opacity-50 rounded-[4rem]"></div>
                                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[4rem] p-6 overflow-hidden shadow-2xl group">
                                        <div className="aspect-[4/3] rounded-[3rem] bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center relative overflow-hidden">
                                            <img
                                                src="/images/our-story.webp"
                                                alt="Our Story - MusB Research Laboratory"
                                                className="absolute inset-0 w-full h-full object-cover brightness-75 group-hover:scale-110 group-hover:brightness-90 transition-all duration-1000"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
                                            <div className="absolute bottom-8 left-8 right-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                                                        <Award className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-black text-sm uppercase tracking-wider">20,000+ sq. ft.</p>
                                                        <p className="text-slate-400 text-xs">Research Complex</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================================ */}
                {/* SECTION 4: Extended R&D Partner */}
                {/* ============================================================ */}
                {true && (
                    <section className="py-24 relative z-10 bg-slate-900/30 border-y border-white/5">
                        <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                            <div className="text-center space-y-6 mb-20">
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
                                    {partnerTitle}
                                </h2>
                                <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto">
                                    {partnerContent}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {partnerFeatures.map((feature: any, idx: number) => {
                                    const IconComp = getIcon(feature.icon);
                                    return (
                                        <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-950/50 border border-white/5 hover:bg-slate-900 hover:border-cyan-500/30 transition-all duration-500 group flex flex-col items-center text-center gap-5 shadow-2xl">
                                            <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500">
                                                <IconComp className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-black text-white uppercase group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed">{feature.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================================ */}
                {/* SECTION 5: Mission & Vision */}
                {/* ============================================================ */}
                {true && (
                    <section className="py-32 relative z-10">
                        <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                            <div className="grid md:grid-cols-2 gap-12">
                                {/* Mission */}
                                <div className="p-8 md:p-16 rounded-[4rem] bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-transparent border border-white/5 backdrop-blur-3xl space-y-8 group hover:border-cyan-500/30 transition-all duration-700 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full group-hover:bg-cyan-500/10 transition-colors"></div>
                                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500">
                                        <Target className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">{missionTitle}</h3>
                                    <p className="text-lg text-slate-400 font-medium leading-relaxed">{missionContent}</p>
                                </div>
                                {/* Vision */}
                                <div className="p-8 md:p-16 rounded-[4rem] bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-transparent border border-white/5 backdrop-blur-3xl space-y-8 group hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-900 transition-all duration-500">
                                        <Eye className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">{visionTitle}</h3>
                                    <p className="text-lg text-slate-400 font-medium leading-relaxed">{visionContent}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================================ */}
                {/* SECTION 6: Core Values */}
                {/* ============================================================ */}
                {true && (
                    <section className="py-24 relative z-10">
                        <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                            <div className="text-center space-y-6 mb-20">
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Our Core Values</h2>
                                <div className="h-1.5 w-24 bg-cyan-500 mx-auto rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {coreValues.map((value: any, idx: number) => {
                                    const IconComp = getIcon(value.icon);
                                    return (
                                        <div key={idx} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-500 group flex flex-col gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500">
                                                <IconComp className="w-7 h-7" />
                                            </div>
                                            <h3 className="text-xl font-black text-white uppercase group-hover:text-cyan-400 transition-colors">{value.name}</h3>
                                            <p className="text-slate-400 text-sm font-medium leading-relaxed">{value.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================================ */}
                {/* SECTION 7: Trust Indicators / Why Partner With Us */}
                {/* ============================================================ */}
                {true && (
                    <section className="py-24 relative z-10 bg-slate-900/40 backdrop-blur-3xl border-y border-white/5">
                        <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                            <div className="text-center space-y-6 mb-20">
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                                    {'Why Partner With Us'}
                                </h2>
                                <div className="h-1.5 w-24 bg-cyan-500 mx-auto rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                                {trustIndicators.map((item: any, idx: number) => {
                                    const IconComponent = getIcon(item.icon);
                                    return (
                                        <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-950/50 border border-white/5 hover:bg-slate-900 hover:border-cyan-500/30 transition-all duration-500 group flex flex-col items-center text-center gap-5 shadow-2xl">
                                            <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500">
                                                <IconComponent className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-black text-white uppercase group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ============================================================ */}
                {/* SECTION 8: Final Call to Action */}
                {/* ============================================================ */}
                {true && (
                    <section className="max-w-[1700px] mx-auto px-4 md:px-12 text-center space-y-12 py-32">
                        <div className="space-y-6">
                            <p className="text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tighter">
                                Choosing MusB™ Research means partnering with a leader in <span className="text-cyan-400">scientific innovation</span>, flexibility, and execution excellence.
                            </p>
                            <p className="text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
                                We deliver tailored, responsive, and cost-effective solutions—without compromising scientific rigor.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-6 justify-center pt-4">
                            <Link to="/contact" className="bg-cyan-500 text-slate-900 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2">
                                Get In Touch <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/trials" className="bg-white/5 text-white border border-white/10 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 hover:-translate-y-1 transition-all flex items-center gap-2">
                                Join a Study
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
