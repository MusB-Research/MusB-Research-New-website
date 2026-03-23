import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, Zap, TrendingUp, FlaskConical, Shield, ArrowRight, Target, FileText, BookOpen, Newspaper, Paperclip, Mail, X, Stethoscope, Microscope, Pill, ChevronLeft, ChevronRight, Verified } from 'lucide-react';
import { submitBookletDownload } from '../api';

const defaultTechnologies = [
    {
        name: "IncreLac™",
        tagline: "GLP-1 Promoting Probiotics",
        positioning: "A next-generation probiotic platform designed to support endogenous GLP-1 stimulation for metabolic health and weight management.",
        focusAreas: ["Metabolic health", "GLP-1 signaling pathways", "Gut–endocrine axis"],
        includes: [
            { icon: FileText, text: "Scientific data & summaries" },
            { icon: BookOpen, text: "Publications & abstracts" },
            { icon: Newspaper, text: "News & updates" },
            { icon: Paperclip, text: "Flyers / one-pagers" },
            { icon: Mail, text: "Partnership inquiries" }
        ],
        icon: TrendingUp,
        gradient: "from-emerald-500 to-teal-500",
        details: {
            overview: "IncreLac™ is a proprietary, human-origin probiotic and postbiotic platform designed to support endogenous GLP-1 pathways and metabolic balance. Fully purified, genome sequenced, ATCC deposited, and scaling under GMP conditions.",
            applications: [
                "Metabolic health supplements",
                "Weight management formulations",
                "Blood glucose support products",
                "Gut–endocrine axis platforms"
            ],
            formats: [
                "Probiotic capsules",
                "Synbiotic blends",
                "Postbiotic-enhanced formulas",
                "Functional nutrition products"
            ],
            science: [
                "GLP-1 stimulation demonstrated in human intestinal cell models",
                "Comprehensive genomic safety profiling",
                "GRAS preparation underway",
                "Clinical trials in planning"
            ]
        }
    },
    {
        name: "Movix™",
        tagline: "Gut Health Promoting Cocktail",
        positioning: "A multi-component gut health formulation designed to improve digestive function, tolerance, and microbiome balance.",
        focusAreas: ["Gut barrier integrity", "Digestive comfort", "Microbiome modulation"],
        includes: [
            { icon: FileText, text: "Research data" },
            { icon: BookOpen, text: "Publications" },
            { icon: Newspaper, text: "Product news" },
            { icon: Paperclip, text: "Marketing and scientific assets" }
        ],
        icon: FlaskConical,
        gradient: "from-blue-500 to-indigo-500",
        details: {
            overview: "Movix™ is a proprietary, scientifically formulated blend designed to support bowel regularity, digestion, hydration, and metabolic resilience. Manufactured under rigorous quality control standards with clinical studies in preparation.",
            applications: [
                "Digestive health supplements",
                "Detox and bowel support formulations",
                "Metabolic wellness platforms",
                "Functional hydration products"
            ],
            formats: [
                "Powder sachets",
                "Capsules",
                "Functional drink mixes",
                "Daily digestive support blends"
            ],
            science: [
                "Mechanistically designed digestive-metabolic formulation",
                "High-purity, certified ingredients",
                "Stability validated",
                "Randomized clinical trials in planning"
            ]
        }
    },
    {
        name: "PlastiSheild™",
        tagline: "Microplastic-Reducing Probiotics",
        positioning: "An innovative probiotic technology aimed at binding, reducing, or mitigating microplastic burden through gut-based mechanisms.",
        focusAreas: ["Environmental health", "Gut detoxification", "Emerging exposome science"],
        includes: [
            { icon: FileText, text: "Mechanistic data" },
            { icon: BookOpen, text: "Scientific rationale" },
            { icon: Newspaper, text: "Ongoing research updates" },
            { icon: Paperclip, text: "Partner materials" }
        ],
        icon: Shield,
        gradient: "from-blue-500 to-indigo-500",
        details: {
            overview: "PlastiSheild™ is a proprietary, human-origin probiotic and postbiotic platform designed to support intestinal resilience against microplastic exposure. Fully purified, genome sequenced, ATCC deposited, and scaling under GMP conditions.",
            applications: [
                "Environmental health supplements",
                "Gut barrier support products",
                "Exposome wellness formulations",
                "Preventive metabolic health platforms"
            ],
            formats: [
                "Capsules",
                "Synbiotic blends",
                "Postbiotic formulations",
                "Functional beverages"
            ],
            science: [
                "Mechanistic validation in intestinal cell models",
                "Genomic safety profiling completed",
                "GRAS preparation underway",
                "Clinical trials in planning"
            ]
        }
    },
    {
        name: "AlcoProtect",
        tagline: "Advanced Alcohol Recovery & Liver Support",
        positioning: "A scientifically formulated blend designed to support liver health, efficient alcohol metabolism, and recovery from oxidative stress.",
        focusAreas: ["Liver health", "Alcohol metabolism", "Recovery"],
        includes: [
            { icon: FileText, text: "Scientific data & summaries" },
            { icon: BookOpen, text: "Publications & abstracts" },
            { icon: Newspaper, text: "News & updates" },
            { icon: Paperclip, text: "Flyers / one-pagers" },
            { icon: Mail, text: "Partnership inquiries" }
        ],
        icon: Verified,
        gradient: "from-purple-500 to-pink-500",
        details: {
            overview: "AlcoProtect is a specialized formulation targeting the metabolic byproducts of alcohol consumption. It supports liver enzyme function and helps mitigate oxidative stress for faster recovery.",
            applications: [
                "Hangover relief supplements",
                "Liver support formulations",
                "Post-party recovery drinks",
                "Daily metabolic support"
            ],
            formats: [
                "Ready-to-drink beverages",
                "Effervescent tablets",
                "Capsules",
                "Powder sticks"
            ],
            science: [
                "Validates markers of alcohol metabolism",
                "Antioxidant efficacy shown in vitro",
                "Liver enzyme support demonstrated",
                "Human recovery study planned"
            ]
        }
    }
];

export default function Innovations() {
    const [technologies, setTechnologies] = useState<any[]>(defaultTechnologies);
    const [activeTech, setActiveTech] = useState<any>(null);
    const [showBookletForm, setShowBookletForm] = useState(false);
    const [bookletTechName, setBookletTechName] = useState('');
    const [bookletForm, setBookletForm] = useState({
        first_name: '', last_name: '', company: '', designation: '',
        email: '', phone: '', nda_agreed: false
    });
    const [bookletSubmitting, setBookletSubmitting] = useState(false);
    const [bookletError, setBookletError] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const showcaseRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (activeTech || showBookletForm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [activeTech, showBookletForm]);

    const handleBookletOpen = (techName: string) => {
        setBookletTechName(techName);
        setBookletForm({ first_name: '', last_name: '', company: '', designation: '', email: '', phone: '', nda_agreed: false });
        setBookletError('');
        setShowBookletForm(true);
    };

    const handleBookletSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookletForm.nda_agreed) {
            setBookletError('You must agree to the NDA terms before downloading.');
            return;
        }
        setBookletSubmitting(true);
        setBookletError('');
        try {
            await submitBookletDownload({
                ...bookletForm,
                technology_name: bookletTechName,
            });
            console.log('Booklet form submitted', bookletForm);
            setShowBookletForm(false);
            // Trigger download
            const link = document.createElement('a');
            link.href = `/booklets/${bookletTechName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_booklet.pdf`;
            link.download = `${bookletTechName}_Technical_Booklet.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            setBookletError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setBookletSubmitting(false);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 640; // Card width (600px) + gap (32px) + buffer
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const scrollToAlcoProtect = () => {
        if (scrollContainerRef.current) {
            // Find AlcoProtect index (should be 3rd index, i.e., 4th item)
            // Note: The displayed array is 'technologies', so we find index there.
            const index = technologies.findIndex(t => t.name.toLowerCase().includes("alcoprotect"));
            if (index !== -1) {
                const cards = scrollContainerRef.current.children;
                if (cards[index]) {
                    (cards[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        }
    };


    const scrollToShowcase = () => {
        if (showcaseRef.current) {
            showcaseRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers - PRESERVED */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            <div className="relative z-10 space-y-20 pt-40 pb-24 animate-in fade-in duration-1000">
                {/* SECTION 1: HERO – INNOVATION WITH PURPOSE */}
                <section className="max-w-[1700px] mx-auto px-4 md:px-12">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Text Left */}
                        <div className="space-y-10">
                            <div className="space-y-6 md:space-y-8">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] uppercase">
                                    <span className="block text-white">Where Innovation</span>
                                    <span className="block text-cyan-400">Meets Scientific Proof</span>
                                </h1>
                                <div className="space-y-4 text-lg text-slate-300 font-medium leading-relaxed">
                                    <p className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                                        <span>Partner with MusB™ Research to design and execute rigorous research</span>
                                    </p>
                                    <p className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                                        <span>Transform ideas into scientifically validated products</span>
                                    </p>
                                    <p className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                                        <span>Access proprietary, clinically informed microbiome technologies</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                <Link to="/contact" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs md:text-base uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30 hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105 flex items-center justify-center text-center">
                                    Start an Innovation Discussion
                                </Link>
                                <button
                                    onClick={scrollToShowcase}
                                    className="w-full sm:w-auto border-2 border-cyan-400/40 bg-cyan-400/10 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs md:text-base uppercase tracking-widest hover:bg-cyan-400/20 hover:border-cyan-400/60 transition-all duration-300"
                                >
                                    Explore Our Technologies
                                </button>
                            </div>
                        </div>

                        {/* Visual Right */}
                        <div className="relative">
                            <div className="bg-[#111827]/40 backdrop-blur-xl p-8 md:p-16 rounded-[4rem] border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative z-10 space-y-8">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl">
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white uppercase">Science-First Innovation Engine</h3>
                                    <p className="text-lg text-slate-300 leading-relaxed">
                                        Where industry sponsors run credible studies, early concepts become validated products, and brands license scientifically proven technologies.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: INNOVATE WITH US – INDUSTRY-SPONSORED RESEARCH */}
                <section className="max-w-[1700px] mx-auto px-4 md:px-12">
                    <div className="bg-[#0A0F1C]/60 backdrop-blur-2xl rounded-[5rem] p-8 md:p-24 border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full"></div>

                        <div className="relative z-10 space-y-16">
                            <div className="text-center space-y-4 md:space-y-6 max-w-4xl mx-auto">
                                <span className="text-cyan-400 font-black text-[10px] md:text-sm uppercase tracking-[0.4em]">INNOVATE WITH US – INDUSTRY-SPONSORED RESEARCH</span>
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                                    Bring Your Product. <span className="text-cyan-400">We Bring the Science.</span>
                                </h2>
                                <p className="text-xl text-slate-300 font-medium leading-relaxed">
                                    MusB Research invites industry sponsors, biotech companies, ingredient manufacturers, and brands to conduct high-quality preclinical and clinical research under one integrated ecosystem.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12">
                                {/* We Support */}
                                <div className="bg-[#111827]/40 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/5">
                                    <h3 className="text-2xl font-black text-white uppercase mb-8">We support:</h3>
                                    <div className="space-y-4">
                                        {[
                                            "Proof-of-concept studies",
                                            "Mechanistic validation",
                                            "Human clinical trials",
                                            "Biomarkers, microbiome, and translational endpoints"
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                                                <span className="text-slate-300 font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-slate-400 mt-6 text-sm leading-relaxed">
                                        All studies are designed to be regulatory-aligned, publication-ready, and decision-driven.
                                    </p>
                                </div>

                                {/* What Makes This Different */}
                                <div className="bg-[#111827]/40 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/5">
                                    <h3 className="text-2xl font-black text-white uppercase mb-8">What Makes This Different</h3>
                                    <div className="space-y-4">
                                        {[
                                            "Scientist-led study design",
                                            "Integrated research, central lab, and biorepository",
                                            "No bias toward company size—startups and global brands treated equally",
                                            "Clear timelines, transparent data, and actionable outcomes"
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                                                <span className="text-slate-300 font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <Link to="/contact" className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30 hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105">
                                    Run a Study With MusB Research
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: FROM CONCEPT TO PRODUCT – SCIENCE-DRIVEN DEVELOPMENT */}
                <section className="max-w-[1700px] mx-auto px-4 md:px-12">
                    <div className="bg-[#0A0F1C]/60 backdrop-blur-2xl rounded-[5rem] p-8 md:p-24 border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full"></div>

                        <div className="relative z-10 space-y-16">
                            <div className="text-center space-y-4 md:space-y-6 max-w-4xl mx-auto">
                                <span className="text-cyan-400 font-black text-[10px] md:text-sm uppercase tracking-[0.4em]">FROM CONCEPT TO PRODUCT – SCIENCE-DRIVEN DEVELOPMENT</span>
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                                    You Bring the Idea. <br />
                                    <span className="text-cyan-400">We Build the Evidence.</span>
                                </h2>
                                <p className="text-xl text-slate-300 font-medium leading-relaxed">
                                    Have an innovative concept but need scientific validation? <br />
                                    MusB Research specializes in converting early-stage ideas into market-ready, scientifically substantiated products. We work as your extended R&D partner, supporting every step from discovery to validation.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-3xl font-black text-white uppercase text-center">Our Concept-to-Product Pathway</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                    {[
                                        { step: 1, title: "Scientific feasibility & mechanism mapping" },
                                        { step: 2, title: "In vitro and in vivo validation" },
                                        { step: 3, title: "Biomarker and functional outcome identification" },
                                        { step: 4, title: "Human clinical evaluation" },
                                        { step: 5, title: "Data interpretation for claims, positioning, and go-to-market decisions" }
                                    ].map((item) => (
                                        <div key={item.step} className="bg-[#111827]/40 backdrop-blur-xl p-8 rounded-3xl border border-white/5 text-center space-y-4 hover:bg-white/10 transition-all duration-300 group">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl group-hover:scale-110 transition-transform">
                                                {item.step}
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium leading-snug">{item.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#111827]/40 backdrop-blur-xl p-10 rounded-3xl border border-white/5">
                                <h3 className="text-2xl font-black text-white uppercase mb-6 text-center">Ideal For</h3>
                                <div className="flex flex-wrap justify-center gap-4">
                                    {[
                                        "New ingredients or formulations",
                                        "Next-generation probiotics / postbiotics",
                                        "Gut, metabolic, brain, aging, women's health innovations"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 px-6 py-3 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-bold uppercase tracking-wider border border-cyan-500/20">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <Link to="/contact" className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30 hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105">
                                    Submit Your Concept
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 4: SCIENCE YOU CAN BUILD ON */}
                <section className="max-w-[1700px] mx-auto px-4 md:px-12">
                    <div className="bg-[#0A0F1C]/60 backdrop-blur-2xl rounded-[5rem] p-8 md:p-24 border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden text-center">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[180px] rounded-full"></div>

                        <div className="relative z-10 space-y-10 max-w-4xl mx-auto">
                            <div className="space-y-4 md:space-y-6">
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                                    Science <span className="text-cyan-400">You Can Build On.</span>
                                </h2>
                                <div className="space-y-6">
                                    <p className="text-2xl text-slate-300 font-medium leading-relaxed">
                                        MusB Research develops proprietary, scientifically proven technologies and invites brands and partners to collaborate, license, or co-develop products backed by rigorous research.
                                    </p>
                                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                        Each technology page includes open, transparent access to supporting data and updates.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 5: TECHNOLOGY SHOWCASE */}
                <section ref={showcaseRef} className="max-w-[1700px] mx-auto px-4 md:px-12 space-y-16 scroll-mt-32">
                    <div className="text-center space-y-4">
                        <span className="text-cyan-400 font-black text-sm uppercase tracking-[0.4em]">OUR INNOVATION PIPELINE</span>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Technology Showcase</h2>
                    </div>



                    <div className="relative group">
                        {/* Floating Left Arrow */}
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-slate-900/50 text-white backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                            aria-label="Scroll Left"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        {/* Floating Right Arrow */}
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-slate-900/50 text-white backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                            aria-label="Scroll Right"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        <div
                            ref={scrollContainerRef}
                            className="flex gap-8 overflow-x-auto pb-12 px-4 snap-x snap-mandatory scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {technologies.map((tech, idx) => (
                                <div key={idx} className="min-w-[280px] sm:min-w-[400px] md:min-w-[600px] bg-[#0D121F]/60 backdrop-blur-2xl p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] hover:shadow-[0_50px_100px_-20px_rgba(6,182,212,0.15)] transition-all duration-700 group relative overflow-hidden flex flex-col snap-center">
                                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${tech.gradient} opacity-5 blur-3xl group-hover:opacity-10 transition-all`}></div>

                                    <div className="relative z-10 space-y-8 flex-grow">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tech.gradient} flex items-center justify-center shadow-xl`}>
                                            <tech.icon className="w-8 h-8 text-white" />
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-2xl md:text-4xl font-black text-white uppercase group-hover:text-cyan-400 transition-colors leading-tight">{tech.name}</h3>
                                            <p className="text-sm text-cyan-400 font-bold uppercase tracking-wider">{tech.tagline}</p>
                                            <p className="text-base text-slate-300 leading-relaxed font-medium">
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Positioning Line</span>
                                                {tech.positioning}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <Target className="w-4 h-4 text-cyan-400" />
                                                Focus Areas
                                            </h4>
                                            <div className="space-y-2">
                                                {tech.focusAreas.map((area: string, fIdx: number) => (
                                                    <div key={fIdx} className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                                        <span className="text-sm text-slate-400 font-medium">{area}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 space-y-4">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Technology Page Includes</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {tech.includes.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="flex items-center gap-3 text-xs text-slate-400 font-medium group/item hover:text-white transition-colors">
                                                        <item.icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                                        <span>{item.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setActiveTech(tech)}
                                        className="w-full mt-8 pt-8 border-t border-white/10 flex items-center justify-between group/btn hover:bg-white/5 p-4 -mx-4 rounded-xl transition-all"
                                    >
                                        <span className="text-sm font-black uppercase tracking-widest text-slate-300 group-hover/btn:text-white transition-colors">Explore {tech.name}</span>
                                        <ArrowRight className="w-5 h-5 text-cyan-400 group-hover/btn:translate-x-2 transition-all" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TECHNOLOGY DETAIL MODAL OVERLAY */}
                {
                    activeTech && createPortal(
                        <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 py-20 md:py-32 overflow-y-auto">
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
                                onClick={() => setActiveTech(null)}
                            ></div>


                            {/* Centered Modal Panel */}
                            <div className="relative w-full max-w-4xl bg-[#0B101B] shadow-2xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 overflow-hidden flex flex-col animate-envelope-reveal">


                                {/* Close Button */}
                                <button
                                    onClick={() => setActiveTech(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all z-50 backdrop-blur-sm"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                {/* Scrollable Content Container removed overflow because parent has it */}
                                <div className="">
                                    {/* Header Image/Gradient */}
                                    <div className={`relative h-40 md:h-56 bg-gradient-to-br ${activeTech.gradient} flex items-end p-6 md:p-10`}>
                                        <div className="absolute inset-0 bg-slate-950/20"></div>
                                        <div className="relative z-10 w-full">
                                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-4 md:mb-6 border border-white/20 shadow-xl">
                                                <activeTech.icon className="w-6 h-6 md:w-8 md:h-8" />
                                            </div>
                                            <h2 className="text-2xl md:text-5xl font-black text-white uppercase leading-none">{activeTech.name}</h2>
                                            <p className="text-white/90 font-bold uppercase tracking-wider mt-3 text-lg">{activeTech.tagline}</p>
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-6 md:p-8 space-y-8 bg-[#0B101B]">
                                        {activeTech.details ? (
                                            <>
                                                {/* Overview */}
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4" /> Overview
                                                    </h3>
                                                    <p className="text-slate-300 leading-relaxed text-lg">
                                                        {activeTech.details.overview}
                                                    </p>
                                                </div>

                                                {/* Applications & Formats Grid */}
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Target className="w-4 h-4" /> Applications
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {activeTech.details.applications?.map((app: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5"></div>
                                                                    {app}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Pill className="w-4 h-4" /> Product Formats
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {activeTech.details.formats?.map((fmt: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                                                                    {fmt}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {/* Scientific Strength */}
                                                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 space-y-4">
                                                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Microscope className="w-4 h-4" /> Scientific Strength
                                                    </h3>
                                                    <div className="grid gap-3">
                                                        {activeTech.details.science?.map((sci: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                                <span className="text-slate-300 font-medium text-sm">{sci}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Call to Action Buttons */}
                                                <div className="pt-8 border-t border-slate-800 space-y-6">
                                                    <h4 className="text-white font-bold uppercase tracking-wide text-center">Interested in this technology?</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => handleBookletOpen(activeTech.name)}
                                                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                                                        >
                                                            <FileText className="w-5 h-5" /> Download Technical Booklet
                                                        </button>
                                                        <Link to="/contact" className="w-full border border-slate-700 hover:border-cyan-500/50 text-cyan-400 font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:bg-cyan-500/10 flex items-center justify-center gap-2">
                                                            <Mail className="w-5 h-5" /> Start Co-Development
                                                        </Link>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-slate-500 py-12">
                                                <p>Detailed information for this technology is coming soon.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                }

                {/* BOOKLET DOWNLOAD FORM MODAL */}
                {
                    showBookletForm && createPortal(
                        <div className="fixed inset-0 z-[1100] flex items-start justify-center p-4 py-20 md:py-32 overflow-y-auto">
                            <div
                                className="fixed inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
                                onClick={() => setShowBookletForm(false)}
                            ></div>

                            <div className="relative w-full max-w-md animated-border-wrapper animate-booklet-card">
                                <div className="booklet-card-inner flex flex-col">
                                    <button
                                        onClick={() => setShowBookletForm(false)}
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all z-50 backdrop-blur-sm cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="px-5 py-4 space-y-3">
                                        {/* Header */}
                                        <div className="space-y-1 text-center animate-field-reveal field-delay-1">
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                                Download Technical Booklet
                                            </h3>
                                            <p className="text-cyan-400 font-bold text-xs uppercase tracking-wider">{bookletTechName}</p>
                                            <p className="text-slate-300 text-xs mt-1">
                                                Please fill following information before downloading this booklet.
                                            </p>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={handleBookletSubmit} className="space-y-2.5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-field-reveal field-delay-2">
                                                <div className="space-y-0.5">
                                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">First Name *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={bookletForm.first_name}
                                                        onChange={e => setBookletForm({ ...bookletForm, first_name: e.target.value })}
                                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                                                        placeholder="John"
                                                    />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Last Name *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={bookletForm.last_name}
                                                        onChange={e => setBookletForm({ ...bookletForm, last_name: e.target.value })}
                                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                                                        placeholder="Doe"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-0.5 animate-field-reveal field-delay-3">
                                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Company *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={bookletForm.company}
                                                    onChange={e => setBookletForm({ ...bookletForm, company: e.target.value })}
                                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                                                    placeholder="Your company name"
                                                />
                                            </div>

                                            <div className="space-y-0.5 animate-field-reveal field-delay-4">
                                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Designation *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={bookletForm.designation}
                                                    onChange={e => setBookletForm({ ...bookletForm, designation: e.target.value })}
                                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                                                    placeholder="e.g. Director of R&D"
                                                />
                                            </div>

                                            <div className="space-y-0.5 animate-field-reveal field-delay-5">
                                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={bookletForm.email}
                                                    onChange={e => setBookletForm({ ...bookletForm, email: e.target.value })}
                                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                                                    placeholder="john@company.com"
                                                />
                                            </div>

                                            <div className="space-y-0.5 animate-field-reveal field-delay-6">
                                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Phone *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={bookletForm.phone}
                                                    onChange={e => setBookletForm({ ...bookletForm, phone: e.target.value })}
                                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                                                    placeholder="+1 (555) 123-4567"
                                                />
                                            </div>

                                            {/* NDA Checkbox */}
                                            <div className="flex items-start gap-2 pt-0.5 animate-field-reveal field-delay-7">
                                                <input
                                                    type="checkbox"
                                                    id="nda-agree"
                                                    checked={bookletForm.nda_agreed}
                                                    onChange={e => setBookletForm({ ...bookletForm, nda_agreed: e.target.checked })}
                                                    className="mt-0.5 w-4 h-4 accent-cyan-500 cursor-pointer"
                                                />
                                                <label htmlFor="nda-agree" className="text-xs text-slate-300 leading-snug cursor-pointer">
                                                    By clicking here, you agree not to share this information with anyone without NDA.
                                                </label>
                                            </div>

                                            {/* Error Message */}
                                            {bookletError && (
                                                <p className="text-red-400 text-xs font-medium text-center">{bookletError}</p>
                                            )}

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                disabled={bookletSubmitting}
                                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer animate-field-reveal field-delay-7"
                                            >
                                                {bookletSubmitting ? 'Submitting...' : 'Submit'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                }
                {/* SECTION 6: WHY INNOVATE WITH MUSB RESEARCH */}
                <section className="max-w-[1700px] mx-auto px-4 md:px-12">
                    <div className="bg-[#0A0F1C]/60 backdrop-blur-2xl rounded-[5rem] p-8 md:p-24 border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full"></div>

                        <div className="relative z-10 space-y-16">
                            <div className="text-center space-y-4">
                                <span className="text-cyan-400 font-black text-sm uppercase tracking-[0.4em]">WHY INNOVATE WITH MUSB RESEARCH</span>
                                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight">Trust & Scientific Excellence</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                                {[
                                    { title: "Scientist-founded and led", icon: Sparkles },
                                    { title: "Integrated research, lab, and biorepository", icon: FlaskConical },
                                    { title: "Regulatory-aligned execution", icon: Shield },
                                    { title: "Transparent, ethical, publication-ready science", icon: CheckCircle2 },
                                    { title: "Flexible partnerships and co-development models", icon: Zap }
                                ].map((point, idx) => (
                                    <div key={idx} className="bg-[#111827]/40 backdrop-blur-xl p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-6 hover:bg-white/10 transition-all duration-300 group">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                                            <point.icon className="w-8 h-8" />
                                        </div>
                                        <p className="text-base text-slate-300 font-black uppercase tracking-tight leading-tight">{point.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                {/* FINAL CALL TO ACTION */}
                <section className="max-w-[1700px] mx-auto px-4 md:px-12 pb-20">
                    <div className="bg-gradient-to-br from-[#0D121F]/80 to-[#070B14]/80 backdrop-blur-3xl rounded-[5rem] p-8 md:p-32 border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] relative overflow-hidden text-center group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>

                        <div className="relative z-10 space-y-12 max-w-5xl mx-auto">
                            <div className="space-y-6">
                                <span className="text-cyan-400 font-black text-[10px] md:text-sm uppercase tracking-[0.4em]">Final Call to Action</span>
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] uppercase">
                                    Innovation <span className="text-cyan-400">Without Evidence</span> is Speculation.
                                </h2>
                                <p className="text-2xl text-slate-300 font-medium leading-relaxed">
                                    At MusB Research, innovation is built on data, integrity, and scientific rigor.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <p className="text-lg text-white font-black uppercase tracking-widest">Whether you want to:</p>
                                <div className="flex flex-wrap justify-center gap-6">
                                    {["Run a study", "Validate a concept", "Partner on a proven technology"].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 px-8 py-4 bg-[#111827]/40 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                                            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                                            <span className="text-slate-200 font-bold uppercase tracking-wide text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-10">
                                <p className="text-3xl font-black text-white uppercase tracking-tight">We are ready to collaborate.</p>
                                <div className="flex flex-wrap justify-center gap-6">
                                    <Link to="/contact" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30 hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105 active:scale-95">
                                        Start an Innovation Discussion
                                    </Link>
                                    <Link to="/contact" className="border-2 border-cyan-400/40 bg-cyan-400/10 text-white px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-cyan-400/20 hover:border-cyan-400/60 transition-all duration-300">
                                        Contact Our Innovation Team
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div >
        </div >
    );
}
