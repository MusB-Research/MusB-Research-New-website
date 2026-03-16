import React, { useState } from 'react';
import {
    ArrowRight,
    X,
    FlaskConical,
    Microscope,
    Database,
    Lightbulb,
    Flame,
    Droplets,
    Leaf,
    Hourglass,
    Brain,
    ShieldAlert,
    Activity,
    Scale,
    Sparkles,
    Heart,
    Zap,
    BrainCircuit,
    Dna,
    Pill,
    HeartPulse,
    Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M12 4c-3.5 0-6 2-6 4.5S9 13 12 13s6-2 6-4.5S15.5 4 12 4z" />
        <path d="M5 8.5C3 9.5 2 11 2 13.5s3 5.5 10 5.5s10-3 10-5.5s-1-4-3-5" />
        <path d="M12 16.5v4" />
        <path d="M9 20c0 1 1.5 2 3 2s3-1 3-2" />
    </svg>
);

const LeakyGutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M18 20V8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v12" />
        <path d="M11 20V8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12" />
        <path d="M12 2v4" />
        <path d="M12 10v2" />
        <path d="M12 16v.01" />
    </svg>
);

const IntestineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Large Intestine Framework */}
        <path d="M7 4c-1.5 0-2.5 1-3 2.5S3 9 3 11s0 4 1 5.5 2.5 2.5 4 2.5c1 0 1.5.5 1.5 1.5S9 22 10 22h4c1 0 1.5-.5 1.5-1.5s.5-1.5 1.5-1.5c1.5 0 2.5-1 3-2.5S21 15 21 13s0-4-1-5.5S17.5 4 16 4h-9z" />
        {/* Small Intestine Coils */}
        <path d="M8 10c0-1 1-2 2-2h4c1 0 2 1 2 2" />
        <path d="M8 14c0 1 1 2 2 2h4c1 0 2-1 2-2" />
        <path d="M10 12h4" />
    </svg>
);

const Support: React.FC = () => {
    const [showRouter, setShowRouter] = useState(false);

    const routerOptions = [
        { label: "Research & Innovation", icon: FlaskConical, desc: "Scientific validation and clinical evidence" },
        { label: "Central Lab Services", icon: Microscope, desc: "Testing and biomarker analysis" },
        { label: "Biorepository", icon: Database, desc: "Sample storage and management" },
        { label: "Not sure (help me choose)", icon: Lightbulb, desc: "Speak with a strategist" }
    ];

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* Inquiry Router Modal */}
            {showRouter && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowRouter(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white/5 border border-white/10 rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowRouter(false)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors">
                            <X className="w-8 h-8" />
                        </button>
                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">What do you need?</h2>
                            <p className="text-slate-400 font-medium">Select an area of interest to help us route your request.</p>
                        </div>
                        <div className="grid gap-4">
                            {routerOptions.map((opt, i) => (
                                <Link
                                    key={i}
                                    to={`/contact?type=${i === 0 ? 'research' : i === 1 ? 'lab' : i === 2 ? 'biorepository' : 'general'}`}
                                    className="group flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                                        <opt.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{opt.label}</div>
                                        <div className="text-slate-400 font-medium text-sm">{opt.desc}</div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 pt-24 pb-24 animate-in fade-in duration-1000">
                {/* Section 1: Hero */}
                <section className="relative overflow-hidden min-h-[80vh] flex items-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]"></div>
                    <div className="max-w-[1700px] mx-auto px-4 md:px-12 relative z-10 w-full">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Left Content */}
                            <div className="space-y-10 animate-fade-in-up text-left">
                                <div className="space-y-6">
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.9] uppercase italic">
                                        Your Trusted Partner in <span className="text-cyan-400">R&D Excellence</span>
                                    </h1>
                                    <div className="space-y-4">
                                        {[
                                            "Comprehensive solutions from early screening to clinical studies",
                                            "Deep expertise in microbiome, biotics, aging, and metabolic health",
                                            "Led by world-class scientists and industry experts for top-tier results"
                                        ].map((text, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2.5 shadow-[0_0_10px_rgba(6,182,212,0.8)] shrink-0"></div>
                                                <p className="text-lg md:text-xl text-slate-300 font-medium leading-tight m-0">{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-start gap-8 pt-6">
                                    <Link
                                        to="/facilities#lead-capture"
                                        className="w-full sm:w-auto bg-cyan-500 text-slate-900 px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-2xl shadow-cyan-500/30 flex items-center justify-center gap-4 group"
                                    >
                                        Start the Conversation
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link to="/capabilities" className="text-white hover:text-cyan-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors group">
                                        Explore Our Capabilities <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            {/* Right Visual */}
                            <div className="relative group hidden lg:block">
                                <div className="relative z-10 rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transform transition-transform duration-700">
                                    <div className="w-full aspect-[4/5] bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 transition-all duration-700"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                                    <div className="absolute bottom-12 left-12 right-12 space-y-2">
                                        <p className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.4em]">Integrated Research</p>
                                        <h3 className="text-white text-3xl font-black uppercase tracking-tight leading-none italic">
                                            Bench to Bedside.<br />
                                            <span className="text-slate-400">Discovery to Validation.</span>
                                        </h3>
                                    </div>
                                </div>
                                {/* Decorative Elements */}
                                <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full animate-pulse"></div>
                                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full delay-700 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Section 2: 3 Ways We Support */}
                <section className="pt-24 pb-8 relative z-10" id="pillars">
                    <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                        <div className="text-center space-y-8 mb-24 max-w-6xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase italic">
                                Three Ways MusB™ Research Supports Your Program
                            </h2>
                            <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                                Choose the support you need—innovation, testing, or sample storage. We can also combine all three into one integrated workflow.
                            </p>
                        </div>

                        {/* Enhanced Grid Container with Section Outline */}
                        <div className="p-6 md:p-16 rounded-[4.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl relative overflow-hidden group/container">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                                <div className="group relative bg-slate-950/50 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-slate-900 hover:border-cyan-500/30 transition-all duration-700 flex flex-col shadow-2xl overflow-hidden">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-20 h-20 mb-10 rounded-3xl bg-cyan-400 flex items-center justify-center text-slate-900 transition-all duration-500 shadow-xl relative z-10">
                                        <FlaskConical className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 group-hover:text-cyan-400 transition-colors uppercase relative z-10 text-left">Research & Innovation</h3>
                                    <p className="text-slate-300 font-bold leading-relaxed mb-8 relative z-10 text-left">From concept to evidence—preclinical and clinical research that moves products forward.</p>
                                    <div className="space-y-6 flex-grow relative z-10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/60 text-left">Highlights:</h4>
                                        <ul className="space-y-4">
                                            {[
                                                "In vitro screening and mechanistic validation",
                                                "Preclinical efficacy and safety studies",
                                                "Human clinical trials and outcomes research",
                                                "Biomarkers, microbiome endpoints, and data interpretation"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                                                    <span className="text-slate-400 text-sm font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <Link to="/contact?type=research" className="mt-12 w-full bg-cyan-500 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn relative z-10">
                                        Discuss a Research Project
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>

                                {/* Card 2: Central Laboratory Services */}
                                <div className="group relative bg-slate-950/50 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-slate-900 hover:border-cyan-500/30 transition-all duration-700 flex flex-col shadow-2xl overflow-hidden relative z-10">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-20 h-20 mb-10 rounded-3xl bg-cyan-400 flex items-center justify-center text-slate-900 transition-all duration-500 shadow-xl relative z-10">
                                        <Microscope className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 group-hover:text-cyan-400 transition-colors uppercase relative z-10">Central Lab Services</h3>
                                    <p className="text-slate-300 font-bold leading-relaxed mb-8 relative z-10">Reliable, scalable testing to support studies, product validation, and regulatory-ready reporting.</p>
                                    <div className="space-y-6 flex-grow relative z-10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/60">Highlights:</h4>
                                        <ul className="space-y-4">
                                            {[
                                                "Clinical and research biomarker testing",
                                                "ELISA, proteomics, real-time PCR",
                                                "Microbiome workflows and analytics support",
                                                "SOP-driven quality control and documentation"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                                                    <span className="text-slate-400 text-sm font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <Link to="/contact?type=lab" className="mt-12 w-full bg-cyan-500 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn relative z-10">
                                        Inquire About Lab Services
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>

                                {/* Card 3: Biorepository */}
                                <div className="group relative bg-slate-950/50 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-slate-900 hover:border-cyan-500/30 transition-all duration-700 flex flex-col shadow-2xl overflow-hidden relative z-10">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-20 h-20 mb-10 rounded-3xl bg-cyan-400 flex items-center justify-center text-slate-900 transition-all duration-500 shadow-xl relative z-10">
                                        <Database className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 group-hover:text-cyan-400 transition-colors uppercase relative z-10">Biorepository</h3>
                                    <p className="text-slate-300 font-bold leading-relaxed mb-8 relative z-10">Secure biospecimen processing, tracking, and storage for longitudinal research.</p>
                                    <div className="space-y-6 flex-grow relative z-10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/60">Highlights:</h4>
                                        <ul className="space-y-4">
                                            {[
                                                "Sample processing and standardized aliquoting",
                                                "Long-term storage with chain-of-custody",
                                                "Study-ready labeling, tracking, and retrieval",
                                                "Built for multi-site and longitudinal programs"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                                                    <span className="text-slate-400 text-sm font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <Link to="/contact?type=biorepository" className="mt-12 w-full bg-cyan-500 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn relative z-10">
                                        Request Biorepository Support
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Section 4: Success Stories */}
                <section className="py-24 relative z-10 bg-slate-900/20">
                    <div className="max-w-[1700px] mx-auto px-4 md:px-12">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
                            <div className="space-y-6 max-w-3xl">
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">Success Stories</h2>
                                <p className="text-xl text-slate-400 font-medium">
                                    See how partners have leveraged MusB™ Research to accelerate innovation and generate high-quality evidence.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Link to="/news" className="bg-white/5 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">See All Success Stories</Link>
                                <Link to="/facilities#lead-capture" className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg">Start the Conversation</Link>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Micronutrient Efficacy Validation",
                                    tag: "Clinical",
                                    desc: "Demonstrated 30% improved bioavailability through our preclinical-to-clinical workflow.",
                                    img: "/story_micronutrient.png"
                                },
                                {
                                    title: "Microbiome Signature Discovery",
                                    tag: "Research",
                                    desc: "Identified novel biomarkers for a biotech startup's lead ingredient validation.",
                                    img: "/story_microbiome.png"
                                },
                                {
                                    title: "Multi-Year Biospecimen Security",
                                    tag: "Biorepository",
                                    desc: "Managed 50,000+ aliquots with 100% chain-of-custody integrity for aging studies.",
                                    img: "/story_biorepository.png"
                                }
                            ].map((story, i) => (
                                <div key={i} className="group relative bg-white/5 backdrop-blur-xl rounded-[3rem] overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all duration-500 flex flex-col">
                                    <div className="aspect-video bg-slate-800/50 overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 group-hover:scale-110 transition-transform duration-700"></div>
                                    </div>
                                    <div className="p-6 md:p-10 space-y-6 flex-grow">
                                        <span className="px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest">{story.tag}</span>
                                        <h3 className="text-2xl font-black text-white leading-tight">{story.title}</h3>
                                        <p className="text-slate-400 font-medium leading-relaxed">{story.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 5: Our Approach */}
                <section className="py-24 relative z-10">
                    <div className="max-w-[1700px] mx-auto px-4 md:px-12 text-center">
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-24">Our Approach</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16 mb-24 text-left">
                            {[
                                { title: "Collaborative Partnerships", desc: "Transparent communication and aligned milestones" },
                                { title: "Expert Research Execution", desc: "Rigorous design and operational excellence" },
                                { title: "Comprehensive Consultation", desc: "Strategic input from discovery through commercialization" },
                                { title: "Rigorous Quality Control", desc: "SOP-driven, reproducible processes" },
                                { title: "Ethical Standards", desc: "IRB, GCP, and regulatory-aligned conduct" },
                                { title: "End-to-End Support", desc: "Bench → preclinical → clinical → interpretation" }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-8 group">
                                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500">
                                        <Database className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{step.title}</h4>
                                        <p className="text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/facilities#lead-capture" className="bg-cyan-500 text-slate-900 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-2xl flex items-center justify-center gap-4 mx-auto group">
                            Start the Conversation
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </section>

                {/* Section 6: Integrated Workflow */}
                <section className="py-24 relative z-10 bg-slate-900/40 backdrop-blur-3xl border-y border-white/5">
                    <div className="max-w-[1700px] mx-auto px-4 md:px-12 text-center">
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-24">
                            An Integrated Path from Discovery to Validation
                        </h2>
                        <div className="grid lg:grid-cols-3 gap-12 items-center relative mb-24">
                            <div className="hidden lg:block absolute top-1/2 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent -translate-y-1/2"></div>
                            <div className="space-y-6">
                                <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                    <FlaskConical className="w-10 h-10" />
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">1. Research & Innovation</h4>
                                <p className="text-slate-400 font-medium">generate signal and mechanism</p>
                            </div>
                            <div className="space-y-6">
                                <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-8 shadow-[0_0_30px_rgba(129,140,248,0.2)]">
                                    <Microscope className="w-10 h-10" />
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">2. Central Lab Services</h4>
                                <p className="text-slate-400 font-medium">measure outcomes and biomarkers</p>
                            </div>
                            <div className="space-y-6">
                                <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <Database className="w-10 h-10" />
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">3. Biorepository</h4>
                                <p className="text-slate-400 font-medium">preserve samples for future discovery</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                            <button onClick={() => setShowRouter(true)} className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Discuss Research</button>
                            <button onClick={() => setShowRouter(true)} className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Request Testing</button>
                            <button onClick={() => setShowRouter(true)} className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Biorepository Support</button>
                        </div>
                    </div>
                </section>

                {/* Section 7: Strategic Closing */}
                <section className="py-24 relative z-10 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/5 blur-[180px] rounded-full pointer-events-none"></div>
                    <div className="max-w-7xl mx-auto px-4 md:px-12 text-center space-y-16">
                        <div className="space-y-8 animate-fade-in-up">
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter">
                                Choosing MusB™ Research means partnering with a leader <br className="hidden md:block" />
                                in scientific innovation, flexibility, and <span className="text-cyan-400">execution excellence.</span>
                            </h2>
                            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
                                We help you achieve your research objectives through tailored, responsive, and cost-effective solutions—without compromising scientific rigor.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-6">
                            <Link to="/contact" className="bg-cyan-500 text-slate-900 px-12 py-6 rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl">
                                Request a Consultation
                            </Link>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                Typical response time: 1–2 business days. <br />Confidential discussions welcomed.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Support;

