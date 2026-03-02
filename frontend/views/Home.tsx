import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Brain, FlaskConical, Activity, TestTube, Microscope, Leaf, Flower, ShieldCheck, Zap, Beaker, BarChart, FileText, Stethoscope, Database, Smartphone, Box, CheckCircle2, Building2, Globe, HeartPulse } from 'lucide-react';
import StudyFilterSection from '@/components/StudyFilterSection';

const slides = [
    {
        id: 1,
        headline: "Your Trusted Partner in R&D Excellence",
        subtext: [
            "Comprehensive solutions from early screening to clinical studies",
            "Led by world-class scientists and experienced industry professionals",
            "Community-based clinical trials and translational research under one umbrella"
        ],
        primaryCTA: "Find a Clinical Study",
        secondaryCTA: "Work With Us (Sponsors & Partners)",
        image: "/hero-1.png"
    },
    {
        id: 2,
        headline: "Advancing Global Health Through Innovation",
        subtext: [
            "Pioneering breakthrough discoveries in musculoskeletal biology",
            "Accelerating translational research with world-class integrity",
            "Bridging the gap between clinical excellence and commercial success"
        ],
        primaryCTA: "Our Research",
        secondaryCTA: "Partner With Us",
        image: "/hero-2.png"
    }
];






const CAPABILITIES_DATA = [
    {id: 1, title: 'Clinical Trials', description: 'Phase I–IV trials, including natural products and medical devices.', icon: 'activity'},
    {id: 2, title: 'Preclinical Research', description: 'In-depth in vitro and animal models for translational research.', icon: 'test-tube'},
    {id: 3, title: 'Microbiome, Biotics & Omics', description: 'Advanced analysis of microbial ecosystems and multi-omics data.', icon: 'microscope'},
    {id: 4, title: 'Nutrition & Natural Products', description: 'Efficacy and safety studies for dietary supplements and functional foods.', icon: 'leaf'},
    {id: 5, title: 'Aging, Metabolic & Brain Health', description: 'Focusing on musculoskeletal aging, brain health, and metabolic disorders.', icon: 'brain'},
    {id: 6, title: 'Leaky Gut, Inflammation, Skin & Women\'s Health', description: 'Specialized research in skin health, inflammation, and women-specific conditions.', icon: 'flower'},
    {id: 7, title: 'Immunomodulatory Research', description: 'Studying immune system responses and therapeutic interventions.', icon: 'shield-check'},
    {id: 8, title: 'Muscle, Gut, Skin & Vascular Health', description: 'Analysis of cardiovascular fitness and skeletal muscle performance.', icon: 'zap'},
    {id: 9, title: 'Toxicology & Bioavailability', description: 'Safety profiling and assessment of compound absorption rates.', icon: 'beaker'},
    {id: 10, title: 'Biostatistics & Data Science', description: 'Complex data analysis and robust statistical modeling workflows.', icon: 'bar-chart'},
    {id: 11, title: 'Regulatory Compliance Support', description: 'End-to-end guidance for FDA, FTC, and international compliance.', icon: 'file-text'}
];

const FACILITIES_DATA = [
    {id: 1, name: 'Multidisciplinary Clinical Research Site', description: 'State-of-the-art facility equipped for diverse therapeutic studies.', features: ['Consultation Rooms', 'Locked Storage', 'Reception Area']},
    {id: 2, name: 'Participant-Friendly Clinics', description: 'Designed for comfort and efficiency during research visits.', features: ['Private Bays', 'Waiting Lounge', 'Accessible Facilities']},
    {id: 3, name: 'Central Laboratory & Biorepository', description: 'Secure on-site storage and advanced sample processing capabilities.', features: ['-80°C Freezers', 'Centrifuges', 'Cryogenic Storage']},
    {id: 4, name: 'Sample Processing & Secure IT Systems', description: 'HIPAA-compliant, high-security infrastructure for data management.', features: ['Encrypted Servers', '24/7 Monitoring', 'Redundant Backups']},
    {id: 5, name: 'Mobile Clinic & Phlebotomy Services', description: 'Bringing research to the community with mobile phlebotomy units.', features: ['On-site Collection', 'Remote Monitoring', 'Outreach Kits']},
    {id: 6, name: 'Metabolic Chambers', description: 'Precision measurement of energy expenditure and metabolic rates.', features: ['Gas Analysis', 'Controlled Environment', 'Real-time Tracking']}
];

const CERTIFICATIONS_DATA = [
    {id: 1, label: 'IRB-approved studies'},
    {id: 2, label: 'GCP-trained staff'},
    {id: 3, label: 'HIPAA-compliant systems'},
    {id: 4, label: 'CLIA/COLA partner laboratory'},
    {id: 5, label: 'SOP-driven operations'},
    {id: 6, label: 'ISO Certification'},
    {id: 7, label: 'GLP Certification'}
];

const PARTNERS_DATA = [
    {id: 1, name: 'University of South Florida', category: 'Academic'},
    {id: 2, name: 'Tampa General Hospital', category: 'Academic'},
    {id: 3, name: 'Global Pharma Solutions', category: 'Industry'},
    {id: 4, name: 'BioTech Innovations Inc.', category: 'Industry'},
    {id: 5, name: 'Clinical Research Alliance', category: 'CRO'},
    {id: 6, name: 'MedTrials Network', category: 'CRO'},
    {id: 7, name: 'Tampa Bay Health Foundation', category: 'Community'}
];

export default function Home() {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const activeSlides = slides;



    // Defensive: reset index if slides count changes or if it goes out of bounds
    useEffect(() => {
        if (currentSlide >= activeSlides.length) {
            setCurrentSlide(0);
        }
    }, [activeSlides.length, currentSlide]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 8000);
        return () => clearInterval(timer);
    }, [activeSlides.length]); // Reset timer if slides count changes

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* Slider Container */}
            <div className="relative h-auto md:h-[95vh] min-h-[600px] md:min-h-[800px] w-full flex items-center overflow-hidden bg-transparent z-10">
                {/* Global Background Effect */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]"></div>

                    {/* Slides Layer */}
                    <div className="relative w-full h-full flex items-center">
                        {activeSlides.map((slide: any, index: number) => {
                            const isActive = index === currentSlide;
                            return (
                                <div
                                    key={slide.id}
                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                        }`}
                                >
                                    {/* Background Image with Overlay */}
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src={slide.image}
                                            alt=""
                                            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}
                                        />
                                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80"></div>
                                    </div>

                                    <div className={`relative z-10 h-full max-w-[1800px] mx-auto px-6 md:px-12 w-full flex flex-col items-center justify-center pt-24 md:pt-32 transform transition-all duration-1000 ${isActive ? 'scale-100 translate-y-0' : 'scale-95 translate-y-12'}`}>
                                        {/* Content (Centered) */}
                                        <div className="space-y-12 flex flex-col items-center text-center">
                                            <div className="space-y-8 max-w-5xl relative">
                                                <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-fade-in-up whitespace-pre-line px-4">
                                                    {slide.headline}
                                                </h1>
                                                <div className="flex justify-center w-full px-4">
                                                    <ul className="list-none m-0 p-0 text-left animate-fade-in-up stagger-1">
                                                        {slide.subtext.map((line: string, i: number) => (
                                                            <li key={i} className="flex items-start justify-start gap-4 group mb-3 last:mb-0">
                                                                <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 group-hover:scale-150 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,1)] mt-2"></div>
                                                                <p className="text-slate-100 text-sm md:text-base lg:text-lg font-medium leading-tight max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:text-white transition-colors m-0">
                                                                    {line}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 animate-fade-in-up stagger-2 w-full px-6">
                                                <Link
                                                    to="/trials"
                                                    className="w-full sm:w-auto bg-cyan-500 text-slate-900 px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-2 transition-all shadow-[0_20px_50px_-10px_rgba(6,182,212,0.6)] flex items-center justify-center gap-3 group"
                                                >
                                                    {slide.primaryCTA}
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                                </Link>
                                                <Link
                                                    to="/contact"
                                                    className="w-full sm:w-auto bg-white/10 border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-white/20 hover:-translate-y-2 transition-all backdrop-blur-xl group overflow-hidden relative flex items-center justify-center"
                                                >
                                                    <span className="relative z-10">{slide.secondaryCTA}</span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                                </Link>
                                            </div>
                                        </div>
                                        {/* Bench to Bedside Overlay - Moved further right per request */}
                                        <div className="hidden lg:block absolute top-[55%] right-1 -translate-y-1/2 origin-center rotate-90">
                                            <span className="text-[13px] font-black uppercase tracking-[0.6em] text-red-700 whitespace-nowrap">
                                                Bench to Bedside. Discovery to Validation.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Slider Navigation */}
                    {/* Slider Navigation */}
                    <button onClick={prevSlide} className="hidden md:flex absolute left-8 top-[60%] -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-cyan-500 hover:text-slate-900 transition-all shadow-2xl group"><ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" /></button>
                    <button onClick={nextSlide} className="hidden md:flex absolute right-8 top-[60%] -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-cyan-500 hover:text-slate-900 transition-all shadow-2xl group"><ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" /></button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-6">
                        <div className="flex gap-4 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                            {activeSlides.map((_: any, i: number) => (
                                <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-8 bg-cyan-400' : 'w-2 bg-white/20 hover:bg-white/40'}`} />
                            ))}
                        </div>

                        {/* Scroll Down Indicator */}
                        <div className="flex flex-col items-center gap-2 opacity-40 animate-float">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Scroll</span>
                            <div className="w-0.5 h-12 bg-gradient-to-b from-cyan-400 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Find a Clinical Study Section */}
            <StudyFilterSection />

            {/* Section 3: Three Ways We Support You */}
            {
                (
<div className="py-12 relative z-10" id="services">
                    <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                        <div className="text-center space-y-8 mb-24 max-w-7xl mx-auto">
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                                Three Ways MusB™ Research Supports Your Program
                            </h2>
                            <p className="text-lg md:text-xl lg:text-2xl text-slate-400 font-medium leading-relaxed">
                                Whether you need discovery research, laboratory testing, <br className="hidden md:block" />
                                or long-term biospecimen management, MusB™ Research offers flexible, integrated support tailored to your goals.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                            {/* 1. Research & Innovation */}
                            <div className="group relative bg-white/5 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-700 flex flex-col">
                                <div className="w-20 h-20 mb-10 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500 shadow-xl">
                                    <FlaskConical className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-8 group-hover:text-cyan-400 transition-colors">Research & Innovation</h3>
                                <div className="space-y-8 flex-grow">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Who it's for:</h4>
                                        <p className="text-slate-300 font-bold leading-relaxed">Biotech, nutrition, pharma, ingredient, and wellness companies seeking scientific validation.</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">What we deliver:</h4>
                                        <ul className="space-y-4">
                                            {[
                                                'Preclinical screening and mechanistic studies',
                                                'In vitro, C. elegans, and animal models',
                                                'Human clinical trials and translational research',
                                                'Biomarkers, microbiome, and functional outcomes'
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
                                                    <span className="text-slate-400 text-sm font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-cyan-400/5 border border-cyan-400/10">
                                        <p className="text-xs text-cyan-200/80 leading-relaxed italic">
                                            We turn scientific concepts into credible evidence that informs product development, claims, and commercialization.
                                        </p>
                                    </div>
                                </div>
                                <Link to="/contact" className="mt-12 w-full bg-cyan-500 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn">
                                    Discuss a Research Project
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* 2. Central Laboratory Services */}
                            <div className="group relative bg-white/5 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-700 flex flex-col">
                                <div className="w-20 h-20 mb-10 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-900 transition-all duration-500 shadow-xl">
                                    <Microscope className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-8 group-hover:text-indigo-400 transition-colors">Central Laboratory Services</h3>
                                <div className="space-y-8 flex-grow">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Who it's for:</h4>
                                        <p className="text-slate-300 font-bold leading-relaxed">Sponsors needing reliable, compliant testing to support research and clinical studies.</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">What we deliver:</h4>
                                        <ul className="space-y-4">
                                            {[
                                                'Clinical and research biomarker testing',
                                                'ELISA, proteomics, real-time PCR',
                                                'Microbiome and molecular analysis',
                                                'SOP-driven workflows with sponsor-ready reporting'
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shadow-[0_0_8px_rgba(129,140,248,0.6)]"></div>
                                                    <span className="text-slate-400 text-sm font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-indigo-400/5 border border-indigo-400/10">
                                        <p className="text-xs text-indigo-200/80 leading-relaxed italic">
                                            Our central lab services ensure accuracy, reproducibility, and data integrity across preclinical and clinical programs.
                                        </p>
                                    </div>
                                </div>
                                <Link to="/contact" className="mt-12 w-full bg-indigo-500 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn">
                                    Request Laboratory Services
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* 3. Biorepository */}
                            <div className="group relative bg-white/5 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-700 flex flex-col">
                                <div className="w-20 h-20 mb-10 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-900 transition-all duration-500 shadow-xl">
                                    <Database className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-8 group-hover:text-blue-400 transition-colors">Biorepository</h3>
                                <div className="space-y-8 flex-grow">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Who it's for:</h4>
                                        <p className="text-slate-300 font-bold leading-relaxed">Organizations managing biological samples across studies, sites, or timepoints.</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">What we deliver:</h4>
                                        <ul className="space-y-4">
                                            {[
                                                'Sample processing, labeling, and tracking',
                                                'Secure, long-term storage under controlled conditions',
                                                'Support for longitudinal and multi-omics studies',
                                                'Retrieval and chain-of-custody documentation'
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                                                    <span className="text-slate-400 text-sm font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-blue-400/5 border border-blue-400/10">
                                        <p className="text-xs text-blue-200/80 leading-relaxed italic">
                                            Our biorepository protects the long-term value of your samples and supports future discovery and regulatory needs.
                                        </p>
                                    </div>
                                </div>
                                <Link to="/contact" className="mt-12 w-full bg-blue-500 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn">
                                    Explore Biorepository Support
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Why Choose MusB™ Research Section */}
            {
                (
<div className="pt-20 pb-8 relative z-10 overflow-hidden" id="why-choose-us">
                    {/* Background Glows */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full"></div>
                        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full" style={{ animationDelay: '-2s' }}></div>
                    </div>

                    <div className="max-w-[1700px] mx-auto px-6 md:px-12 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold text-xs tracking-widest uppercase">
                                    <Microscope className="w-4 h-4" /> Scientist-Led Growth
                                </div>
                                <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] uppercase">
                                    WHY CHOOSE <span className="text-cyan-400">MUSB™ RESEARCH</span>
                                </h2>
                                <div className="space-y-6 pt-4">
                                    {[
                                        'Multidisciplinary clinical and preclinical expertise',
                                        'Academia-affiliated scientists and clinicians',
                                        'Integrated research, lab, and biorepository services',
                                        'End-to-end support from discovery to validation',
                                        'Ethical, community-focused research practices'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-300">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <span className="text-lg text-slate-200 font-bold group-hover:text-white transition-colors">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 pt-4">
                                    <Link
                                        to="/contact"
                                        className="w-full sm:w-auto bg-cyan-500 text-slate-900 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
                                    >
                                        Start the Conversation
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        to="/capabilities"
                                        className="w-full sm:w-auto bg-white/5 text-white border border-white/10 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white/10 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                    >
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
                    </div>
                </div>

            )}

            {/* Section 04: Capabilities Snapshot */}
            { (
                    <div className="pt-8 pb-4 relative z-10" id="capabilities">
                        <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-10">
                                <div className="space-y-6 max-w-3xl">
                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">Our Capabilities</h2>
                                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                        Comprehensive research solutions spanning clinical trials, preclinical models, and specialized therapeutic focus areas.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Link to="/capabilities" className="bg-white/5 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">Explore Our Capabilities</Link>
                                    <Link to="/contact" className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg">Start the Conversation</Link>
                                </div>
                            </div>

                            {/* Enhanced Grid Container with Section Outline */}
                            <div className="p-6 md:p-16 rounded-[4.5rem] bg-transparent border-none relative overflow-hidden group/container">
                                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>

                                <div className="flex flex-wrap justify-center gap-6 relative z-10">
                                    {CAPABILITIES_DATA.map((cap: any, idx: number) => {
                                        const IconComponent = {
                                            activity: Activity,
                                            'test-tube': TestTube,
                                            microscope: Microscope,
                                            leaf: Leaf,
                                            brain: Brain,
                                            flower: Flower,
                                            'shield-check': ShieldCheck,
                                            zap: Zap,
                                            beaker: Beaker,
                                            'heart-pulse': HeartPulse,
                                            'bar-chart': BarChart,
                                            'file-text': FileText
                                        }[cap.icon as string] || Globe;

                                        return (
                                            <div
                                                key={cap.id}
                                                className={`p-6 md:p-10 rounded-[2.5rem] bg-slate-950/50 border border-white/5 hover:bg-slate-900 hover:border-cyan-500/30 transition-all duration-500 group animate-fade-in-up flex flex-col items-start gap-6 shadow-2xl relative overflow-hidden w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(25%-1.5rem)]`}
                                            >
                                                <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="w-14 h-14 rounded-2xl bg-cyan-400 flex items-center justify-center text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform duration-500 relative z-10">
                                                    <IconComponent className="w-7 h-7" />
                                                </div>
                                                <div className="space-y-3 relative z-10">
                                                    <h3 className="text-xl font-black text-white uppercase group-hover:text-cyan-400 transition-colors leading-tight">{cap.title}</h3>
                                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{cap.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Section 05: Facilities & Infrastructure */}
            { (
                    <div className="pt-4 pb-16 relative z-10" id="facilities">
                        <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                            <div className="grid lg:grid-cols-2 gap-32 items-center">
                                <div className="space-y-16">
                                    <div className="space-y-8">
                                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">Facilities & Infrastructure</h2>
                                        <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                            Purpose-built facilities designed to support high-quality research, testing, and participant engagement.
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {FACILITIES_DATA.map((fac: any, idx: number) => (
                                            <div key={fac.id} className={`flex gap-5 group animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                                                <div className="w-10 h-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-300">
                                                    {fac.name.includes('Site') ? <Building2 className="w-5 h-5" /> :
                                                        fac.name.includes('Clinics') ? <Stethoscope className="w-5 h-5" /> :
                                                            fac.name.includes('Biorepository') ? <Database className="w-5 h-5" /> :
                                                                fac.name.includes('Sample') ? <FlaskConical className="w-5 h-5" /> :
                                                                    fac.name.includes('Data') ? <ShieldCheck className="w-5 h-5" /> :
                                                                        fac.name.includes('Mobile') ? <Smartphone className="w-5 h-5" /> :
                                                                            <Activity className="w-5 h-5" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-white font-bold group-hover:text-cyan-400 transition-colors uppercase text-sm tracking-wide">{fac.name}</h4>
                                                    <p className="text-slate-400 text-xs leading-relaxed font-medium">{fac.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Link to="/facilities" className="bg-white/5 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">View Our Facilities</Link>
                                        <Link to="/contact" className="bg-cyan-400 text-slate-900 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all">Start the Conversation</Link>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-3xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <div className="relative aspect-square rounded-[4rem] bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                        <Building2 className="w-32 h-32 text-slate-700 group-hover:scale-110 group-hover:text-cyan-400/30 transition-all duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                                        <div className="absolute bottom-12 left-12 right-12 p-8 glass-dark rounded-3xl border border-white/10">
                                            <p className="text-slate-300 italic text-sm">"Our facility is more than just a lab; it's a hub of clinical innovation designed with participant care at its core."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Section 06: Certifications & Compliance */}
            { (
                    <div className="py-24 relative z-10 bg-slate-900/40 border-y border-white/5 overflow-hidden" id="certifications">
                        <div className="max-w-[1700px] mx-auto px-6 md:px-12 mb-20">
                            <div className="text-center space-y-6 animate-fade-in-up">
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Certifications & <span className="text-cyan-400">Compliance</span></h2>
                                <div className="h-1.5 w-24 bg-cyan-500 mx-auto rounded-full"></div>
                                <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                    IRB-approved studies • GCP-trained staff • HIPAA-compliant systems <br />
                                    CLIA/COLA laboratory partnerships • SOP-driven operations <br />
                                    ISO and GLP-aligned practices
                                </p>
                            </div>
                        </div>

                        {/* Left to Right Scrolling Marquee (Reverse of Partners) */}
                        <div className="relative flex overflow-x-hidden mask-fade-edges py-12">
                            <div className="animate-marquee-reverse whitespace-nowrap flex items-center gap-24 pr-24">
                                {[...CERTIFICATIONS_DATA, ...CERTIFICATIONS_DATA].map((cert: any, idx: number) => (
                                    <div key={`${cert.id}-${idx}`} className="flex flex-col items-center gap-4 group min-w-[200px]">
                                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-500 shadow-xl">
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors text-center px-2 leading-tight">{cert.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="absolute top-0 py-12 animate-marquee2-reverse whitespace-nowrap flex items-center gap-24 pr-24">
                                {[...CERTIFICATIONS_DATA, ...CERTIFICATIONS_DATA].map((cert: any, idx: number) => (
                                    <div key={`${cert.id}-repeat-${idx}`} className="flex flex-col items-center gap-4 group min-w-[200px]">
                                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-500 shadow-xl">
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors text-center px-2 leading-tight">{cert.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Section 07: Collaborations & Partners */}
            { (
                    <div className="py-24 relative z-10 overflow-hidden" id="partners">
                        <div className="max-w-[1700px] mx-auto px-6 md:px-12 mb-20">
                            <div className="text-center space-y-4 animate-fade-in-up">
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight uppercase">Collaborations & Partners</h2>
                                <div className="h-1 w-32 bg-indigo-500 mx-auto rounded-full"></div>
                            </div>
                        </div>

                        {/* Right to Left Scrolling Marquee */}
                        <div className="relative flex overflow-x-hidden mask-fade-edges py-12">
                            <div className="animate-marquee whitespace-nowrap flex items-center gap-32 pr-32">
                                {[...PARTNERS_DATA, ...PARTNERS_DATA].map((partner: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 opacity-30 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700 cursor-default group scale-90 hover:scale-100">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-400/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-400 group-hover:text-slate-900 transition-all duration-500">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <span className="text-3xl md:text-4xl font-black text-white tracking-widest uppercase italic">{partner.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="absolute top-0 py-12 animate-marquee2 whitespace-nowrap flex items-center gap-32 pr-32">
                                {[...PARTNERS_DATA, ...PARTNERS_DATA].map((partner: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 opacity-30 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700 cursor-default group scale-90 hover:scale-100">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-400/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-400 group-hover:text-slate-900 transition-all duration-500">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <span className="text-3xl md:text-4xl font-black text-white tracking-widest uppercase italic">{partner.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Section 08: Dual Call to Action */}
            { (
                    <div className="py-12 relative z-10">
                        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-8 md:p-14 rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-transparent border border-white/5 backdrop-blur-3xl space-y-8 group hover:border-cyan-500/30 transition-all duration-700 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full group-hover:bg-cyan-500/10 transition-colors"></div>
                                    <span className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.5em] block animate-fade-in-up">Participants</span>
                                    <div className="space-y-4 animate-fade-in-up stagger-1">
                                        <h3 className="text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tighter">Interested in <br />a study?</h3>
                                        <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">Get paid. Get tested. <br />Contribute to science.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-4 animate-fade-in-up stagger-2">
                                        <Link to="/trials" className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-2 transition-all shadow-xl">Join Research</Link>
                                    </div>
                                </div>

                                <div className="p-8 md:p-14 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-transparent border border-white/5 backdrop-blur-3xl space-y-8 group hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
                                    <span className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.5em] block animate-fade-in-up">Sponsors</span>
                                    <div className="space-y-4 animate-fade-in-up stagger-1">
                                        <h3 className="text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tighter">Need high-quality research, <br />testing, or biorepository support?</h3>
                                    </div>
                                    <div className="pt-6 animate-fade-in-up stagger-2">
                                        <Link to="/contact" className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-cyan-500 hover:-translate-y-2 transition-all shadow-xl inline-block">Start a Project</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Section 09: Closing Statement */}
            <div className="py-24 relative z-10 overflow-hidden" id="closing">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-cyan-500/5 blur-[180px] rounded-full pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 text-center space-y-16 relative">
                    <div className="space-y-8 animate-fade-in-up">
                        <p className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter">
                            Choosing MusB™ Research means partnering with a leader <br />
                            in scientific innovation, flexibility, and <span className="text-cyan-400">execution excellence.</span>
                        </p>
                        <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
                            We deliver tailored, responsive, and cost-effective solutions—without compromising scientific rigor.
                        </p>
                    </div>

                    <div className="h-px w-48 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto animate-fade-in-up stagger-1"></div>

                    <div className="space-y-8 animate-fade-in-up stagger-2">
                        <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                            Join MusB™ Research and be part <br />of the future of health science.
                        </h3>
                        <p className="text-2xl md:text-3xl font-black text-cyan-400 uppercase tracking-[0.5em]">
                            Together, we can make a difference.
                        </p>
                    </div>
                </div>
            </div>


        </div >
    );
}
