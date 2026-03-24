import React, { useState, useEffect } from 'react';
import {
    Microscope, Beaker, Archive, ArrowRight, ShieldCheck, Star,
    FileText, Activity, Layers, Database,
    ClipboardCheck, Users, Lock, Zap, Handshake
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { submitFacilityInquiry } from '../api';

const HARDCODED_DATA = {
    settings: {
        hero_title: "Purpose-Built for Innovation",
        hero_subtext_1: "State-of-the-art infrastructure for clinical trials, and laboratory analysis.",
        hero_subtext_2: "Designed for regulatory compliance, participant comfort, and scientific rigor.",
        hero_image: "",
        research_pillar_title: "Research & Innovation",
        research_pillar_desc: "Comprehensive facilities supporting Phase I-IV trials and translational research models.",
        lab_pillar_title: "Central Laboratory Services",
        lab_pillar_desc: "Advanced testing capabilities with robust SOPs and quality control.",
        bio_pillar_title: "Biorepository",
        bio_pillar_desc: "Secure, temperature-monitored storage for critical biological samples."
    },
    modules: [
        {
            id: 1, pillar: 'Research', layout: 'ImageRight', badge_label: 'Clinical', title: 'Multidisciplinary Clinical Research Site',
            one_line_summary: 'Fully equipped for diverse therapeutic studies.',
            description: 'Our clinical research site is designed to handle complex study protocols while ensuring participant safety and data integrity.',
            micro_bullets: ['Phase I-IV capabilities', 'Dedicated monitoring spaces', 'Advanced diagnostic tools', 'Comfortable participant lounges'],
            image: ''
        },
        {
            id: 2, pillar: 'Lab', layout: 'ImageLeft', badge_label: 'Testing', title: 'Central Laboratory',
            one_line_summary: 'High-throughput processing and biomarker analysis.',
            description: 'Our central laboratory enables rapid turnaround times and high-precision testing for clinical and translational endpoints.',
            micro_bullets: ['Biochemistry & Hematology', 'Molecular diagnostics', 'Microbiome sequencing prep', 'Strict QA/QC protocols'],
            image: ''
        },
        {
            id: 3, pillar: 'Biorepository', layout: 'ImageRight', badge_label: 'Storage', title: 'Secure Biospecimen Storage',
            one_line_summary: 'Long-term preservation of valuable samples.',
            description: 'Our biorepository features continuous temperature monitoring and redundant backup systems to protect the integrity of your biological samples.',
            micro_bullets: ['-80°C and -20°C freezers', 'Liquid nitrogen storage', '24/7 remote monitoring', 'Barcoded inventory management'],
            image: ''
        }
    ],
    trust_badges: [
        { icon: 'ShieldCheck', label: 'Compliance First' },
        { icon: 'Lock', label: 'Data Security' },
        { icon: 'ClipboardCheck', label: 'SOP Driven' }
    ],
    success_signals: [
        { icon: 'Microscope', title: 'Scientific Rigor', description: 'Our facilities are built to support the highest standards of scientific investigation.' },
        { icon: 'Users', title: 'Participant Centric', description: 'Designed for comfort and accessibility to improve recruitment and retention rates.' },
        { icon: 'Zap', title: 'Rapid Execution', description: 'Streamlined workflows from sample collection to data reporting.' }
    ],
    pillars: []
};

export default function Facilities() {
    const data = HARDCODED_DATA;
    const [loading, setLoading] = useState(true);

    // Form State
    const [formState, setFormState] = useState({
        name: '', email: '', company: '', role: '',
        interest: 'Research', stage: 'Concept', concept: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const stageParam = searchParams.get('stage');
        
        if (stageParam === 'run_study') {
            setFormState(prev => ({ ...prev, stage: 'Run a study' }));
            setTimeout(() => {
                const el = document.getElementById('lead-capture');
                if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
            }, 100);
        }
        
        setLoading(false);
    }, [location.search]);


    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');
        try {
            await submitFacilityInquiry(formState);
            setFormStatus('success');
            setFormState({ name: '', email: '', company: '', role: '', interest: 'Research', stage: 'Concept', concept: '' });
        } catch (err) {
            setFormStatus('error');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500">Loading Infrastructure...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-500">Failed to load content.</div>;

    const { settings, pillars, modules, trust_badges, success_signals } = data;

    // Helper to get icon component
    const getIcon = (name: string) => {
        const icons: any = {
            Microscope, Beaker, Archive, ArrowRight, ShieldCheck, Star,
            FileText, Activity, Layers, Database, ClipboardCheck, Users,
            Lock, Zap, Handshake
        };
        return icons[name] || Activity;
    };

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden selection:bg-cyan-500/30">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* 1) PAGE HEADER + HERO (Above Fold) */}
            <header className="relative pt-24 pb-16 px-6">

                <div className="max-w-[90rem] mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-8 animate-in slide-in-from-left duration-700">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                            {settings.hero_title}
                        </h1>
                        <div className="space-y-4 text-lg md:text-xl text-slate-400 font-medium">
                            <p className="border-l-4 border-cyan-500 pl-4">{settings.hero_subtext_1}</p>
                            <p>{settings.hero_subtext_2}</p>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/contact" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-8 py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-cyan-500/20">
                                Start a Project
                            </Link>
                            <a href="/booklets/capabilities_deck.pdf" download="Capabilities_Deck.pdf" className="flex items-center gap-2 px-8 py-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all font-bold text-cyan-400 uppercase tracking-wide">
                                <FileText className="w-5 h-5" /> Download Capabilities Deck (PDF)
                            </a>
                        </div>
                    </div>

                    {/* Hero Image / Visual */}
                    <div className="relative animate-in slide-in-from-right duration-700 delay-200">
                        <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 relative group">
                            {settings.hero_image ? (
                                <img src={settings.hero_image} alt="Facilities" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                                    <Microscope className="w-20 h-20 opacity-20" />
                                </div>
                            )}
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                        </div>
                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 sm:-left-6 bg-slate-900/90 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-4 z-20 w-[90%] sm:w-auto">
                            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance</div>
                                <div className="text-white font-bold">GLP & GCP Ready</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* "Choose Your Support" Lead Router */}
            <section className="relative z-20 mt-12 lg:-mt-10 px-6 pb-16">
                <div className="max-w-[90rem] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <Link to="#research" onClick={(e) => { e.preventDefault(); const el = document.getElementById('research'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }} className="group bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 p-8 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-900/20">
                        <div className="w-14 h-14 bg-cyan-900/30 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-colors">
                            <Microscope className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Research & Innovation</h3>
                        <p className="text-slate-400 mb-6">Discovery through clinical trials.</p>
                        <div className="flex items-center text-cyan-400 font-bold uppercase text-sm tracking-wider group-hover:text-cyan-300">
                            Discuss Research <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    {/* Card 2 */}
                    <Link to="#lab" onClick={(e) => { e.preventDefault(); const el = document.getElementById('lab'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }} className="group bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-indigo-500/50 p-8 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-900/20">
                        <div className="w-14 h-14 bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <Beaker className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Central Lab Services</h3>
                        <p className="text-slate-400 mb-6">Biomarker & molecular testing.</p>
                        <div className="flex items-center text-indigo-400 font-bold uppercase text-sm tracking-wider group-hover:text-indigo-300">
                            Request Lab Services <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    {/* Card 3 */}
                    <Link to="#bio" onClick={(e) => { e.preventDefault(); const el = document.getElementById('bio'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }} className="group bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-purple-500/50 p-8 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20">
                        <div className="w-14 h-14 bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Archive className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Biorepository</h3>
                        <p className="text-slate-400 mb-6">Secure sample storage & tracking.</p>
                        <div className="flex items-center text-purple-400 font-bold uppercase text-sm tracking-wider group-hover:text-purple-300">
                            Explore Biorepository <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>
            </section>

            {/* 2) PILLAR SECTION A: RESEARCH & INNOVATION */}
            <section id="research" className="py-12 md:py-16 px-6 relative border-t border-slate-900">
                <div className="max-w-[90rem] mx-auto space-y-12">
                    {/* Header */}
                    <div className="text-center max-w-6xl mx-auto space-y-6">

                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white">{settings.research_pillar_title || 'Research & Innovation'}</h2>
                        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">{settings.research_pillar_desc}</p>
                    </div>

                    {/* Modules (Accordion + Split) */}
                    <div className="space-y-16">
                        {modules.filter((m: any) => m.pillar === 'Research').map((module: any, idx: number) => (
                            <div key={module.id} className={`flex flex-col lg:flex-row gap-12 items-center ${module.layout === 'ImageLeft' ? 'lg:flex-row-reverse' : ''}`}>
                                {/* Text Content */}
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                                                {/* Fallback Icon logic could be enhanced if icon_name was in model */}
                                                <Microscope className="w-5 h-5" />
                                            </div>
                                            {module.badge_label && <span className="text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-800 px-2 py-1 rounded">{module.badge_label}</span>}
                                        </div>
                                        <h3 className="text-3xl font-bold text-white">{module.title}</h3>
                                        <p className="text-xl text-slate-400">{module.one_line_summary}</p>
                                    </div>

                                    {/* Details */}
                                    <div className="border border-slate-800 rounded-2xl bg-slate-900/50 p-6 space-y-4">
                                        <p className="text-slate-400 leading-relaxed">{module.description}</p>
                                        <ul className="grid sm:grid-cols-2 gap-2">
                                            {module.micro_bullets.map((bullet: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => { const el = document.getElementById('lead-capture'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }}
                                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 mt-2"
                                        >
                                            Discuss a Research Plan <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Image */}
                                <div className="flex-1 w-full">
                                    <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-slate-800 relative group">
                                        {module.image ? (
                                            <img src={module.image} alt={module.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700">
                                                <Activity className="w-20 h-20" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pillar CTA Strip */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-slate-900/50 mt-12">
                        <Link to="/contact?type=general" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-8 py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-cyan-500/20">
                            Start a Research Project
                        </Link>
                        <Link to="#lead-capture" onClick={(e) => { e.preventDefault(); const el = document.getElementById('lead-capture'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }} className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all font-bold text-cyan-400 uppercase tracking-wide">
                            Request a Feasibility Call
                        </Link>
                    </div>
                </div>
            </section>

            {/* 3) PILLAR SECTION B: CENTRAL LAB */}
            <section id="lab" className="py-12 md:py-16 px-6 relative bg-slate-900/30 border-t border-slate-800">
                <div className="max-w-[90rem] mx-auto space-y-12">
                    <div className="text-center max-w-6xl mx-auto space-y-6">

                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white">{settings.lab_pillar_title || 'Central Laboratory Services'}</h2>
                        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">{settings.lab_pillar_desc}</p>
                    </div>

                    <div className="space-y-16">
                        {modules.filter((m: any) => m.pillar === 'Lab').map((module: any) => (
                            <div key={module.id} className={`flex flex-col lg:flex-row gap-12 items-center ${module.layout === 'ImageLeft' ? 'lg:flex-row-reverse' : ''}`}>
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0">
                                                    <Beaker className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-3xl font-bold text-white">{module.title}</h3>
                                            </div>
                                            {module.badge_label && <span className="text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-800 px-3 py-1.5 rounded-full shrink-0 hidden sm:inline-block">{module.badge_label}</span>}
                                        </div>
                                        <p className="text-xl text-slate-400">{module.one_line_summary}</p>
                                        {module.badge_label && <span className="text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-800 px-3 py-1.5 rounded-full inline-block sm:hidden">{module.badge_label}</span>}
                                    </div>
                                    <div className="border border-slate-800 rounded-2xl bg-slate-900/50 p-6 space-y-4">
                                        <p className="text-slate-400 leading-relaxed">{module.description}</p>
                                        <ul className="grid sm:grid-cols-2 gap-2">
                                            {module.micro_bullets.map((bullet: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => { const el = document.getElementById('lead-capture'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 mt-2"
                                        >
                                            Request a Lab Service <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-slate-800 bg-slate-900">
                                        {module.image ? <img src={module.image} className="w-full h-full object-cover" /> : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pillar CTA Strip */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-slate-900/50 mt-12">
                        <Link to="/contact?type=general" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-indigo-500/20">
                            Get a Testing Quote
                        </Link>
                        <Link to="#lead-capture" onClick={(e) => { e.preventDefault(); const el = document.getElementById('lead-capture'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }} className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all font-bold text-indigo-400 uppercase tracking-wide">
                            Speak With Lab Director
                        </Link>
                    </div>
                </div>
            </section>

            {/* 4) PILLAR SECTION C: BIOREPOSITORY */}
            <section id="bio" className="py-12 md:py-16 px-6 relative border-t border-slate-800">
                <div className="max-w-[90rem] mx-auto space-y-12">
                    <div className="text-center max-w-6xl mx-auto space-y-6">

                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white">{settings.bio_pillar_title || 'Biorepository'}</h2>
                        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">{settings.bio_pillar_desc}</p>
                    </div>

                    <div className="space-y-16">
                        {modules.filter((m: any) => m.pillar === 'Biorepository').map((module: any) => (
                            <div key={module.id} className={`flex flex-col lg:flex-row gap-12 items-center ${module.layout === 'ImageLeft' ? 'lg:flex-row-reverse' : ''}`}>
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                                <Archive className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-3xl font-bold text-white">{module.title}</h3>
                                        </div>
                                        <p className="text-xl text-slate-400">{module.one_line_summary}</p>
                                    </div>
                                    <div className="border border-slate-800 rounded-2xl bg-slate-900/50 p-6 space-y-4">
                                        <p className="text-slate-400 leading-relaxed">{module.description}</p>
                                        <ul className="grid sm:grid-cols-2 gap-2">
                                            {module.micro_bullets.map((bullet: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => { const el = document.getElementById('lead-capture'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }}
                                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 mt-2"
                                        >
                                            Explore Repository Support <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-slate-800 bg-slate-900">
                                        {module.image ? <img src={module.image} className="w-full h-full object-cover" /> : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pillar CTA Strip */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 border-t border-slate-900/50 mt-12">
                        <Link to="/contact?type=general" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-purple-500/20">
                            Schedule a Storage Consult
                        </Link>
                    </div>
                </div>
            </section >

            {/* 5) CROSS-PILLAR TRUST STRIP */}
            < section className="py-12 md:py-16 border-y border-slate-800 bg-slate-900/50" >
                <div className="max-w-[90rem] mx-auto flex flex-col items-center gap-12 px-6">
                    <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                        {trust_badges.map((badge: any, i: number) => {
                            const Icon = getIcon(badge.icon);
                            return (
                                <div key={i} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                    <Icon className="w-6 h-6 text-cyan-500" />
                                    <span className="font-bold text-lg text-slate-300 uppercase tracking-wide">{badge.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div>
                        <Link to="#lead-capture" onClick={(e) => { e.preventDefault(); const el = document.getElementById('lead-capture'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }} className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-widest text-slate-900 uppercase transition-all bg-cyan-400 rounded-xl hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                            Talk to a Scientist
                        </Link>
                    </div>
                </div>
            </section >

            {/* 6) SUCCESS SIGNALS */}
            < section className="py-12 md:py-16 px-6 max-w-[90rem] mx-auto" >
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">Why Sponsors Choose MusB</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {success_signals.map((signal: any, i: number) => {
                        const Icon = getIcon(signal.icon);
                        return (
                            <div key={i} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-cyan-500/30 transition-all">
                                <Icon className="w-12 h-12 text-cyan-400 mb-6" />
                                <h3 className="text-xl font-bold text-white mb-4">{signal.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{signal.description}</p>
                            </div>
                        )
                    })}
                </div>
                <div className="text-center mt-6">
                    <Link to="#lead-capture" onClick={(e) => { e.preventDefault(); const el = document.getElementById('lead-capture'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }} className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-sm font-bold tracking-wide text-white uppercase transition-all bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/25">
                        Start the Conversation
                    </Link>
                </div>
            </section >

            {/* 7) FINAL LEAD CAPTURE (Conversion Section) */}
            < section id="lead-capture" className="py-12 md:py-16 px-6 bg-gradient-to-br from-slate-900 to-slate-950 border-t border-slate-800" >
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">Ready to Move Faster With Better Evidence?</h2>
                        <p className="text-xl md:text-2xl text-slate-400 font-medium">We can support research, testing, and biospecimen management—individually or as an integrated program.</p>
                        <ul className="space-y-6 pt-6">
                            {['Integrated Preclinical & Clinical', 'Sponsor-Ready Reporting', 'Regulatory Compliance'].map(item => (
                                <li key={item} className="flex items-center gap-4 font-bold text-slate-300 text-lg">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full"></div>
                        <h3 className="text-2xl font-bold text-white mb-8 relative z-10">Start the Conversation</h3>

                        {formStatus === 'success' ? (
                            <div className="text-center py-12 space-y-4 animate-in fade-in">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">Inquiry Received</h4>
                                <p className="text-slate-400">Our team will review your project needs and contact you shortly.</p>
                                <button onClick={() => setFormStatus('idle')} className="text-cyan-400 font-bold underline">Send another</button>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">I'm Interested In</label>
                                        <select
                                            value={formState.interest}
                                            onChange={e => setFormState({ ...formState, interest: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option>Research & Innovation</option>
                                            <option>Central Laboratory Services</option>
                                            <option>Biorepository</option>
                                            <option>Not sure (Help me choose)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Stage</label>
                                        <select
                                            value={formState.stage}
                                            onChange={e => setFormState({ ...formState, stage: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option>Concept</option>
                                            <option>Preclinical</option>
                                            <option>Clinical</option>
                                            <option>Post-Market / Commercial</option>
                                            <option>Run a study</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Name</label>
                                    <input
                                        type="text" required
                                        value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                                        placeholder="Dr. Jane Smith"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</label>
                                        <input
                                            type="email" required
                                            value={formState.email} onChange={e => setFormState({ ...formState, email: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                                            placeholder="jane@company.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Company</label>
                                        <input
                                            type="text"
                                            value={formState.company} onChange={e => setFormState({ ...formState, company: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                                            placeholder="BioTech Inc."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Concept Explanation (Optional)</label>
                                    <textarea
                                        value={formState.concept}
                                        onChange={e => setFormState({ ...formState, concept: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600 resize-none"
                                        placeholder="Briefly explain your concept..."
                                        rows={4}
                                        maxLength={5000}
                                    />
                                    <div className="text-right text-xs text-slate-500 font-medium">
                                        {formState.concept.length} / 5000 chars
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={formStatus === 'submitting'}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {formStatus === 'submitting' ? 'Sending...' : 'Submit Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section >
        </div >
    );
}
