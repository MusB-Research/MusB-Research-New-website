import React from 'react';
import { ShieldCheck, Globe, ArrowRight, Activity, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BecomePartnerModal from '../components/BecomePartnerModal';

export default function MellowConsortium() {
    const [isPartnerModalOpen, setIsPartnerModalOpen] = React.useState(false);

    return (
        <div className="min-h-screen font-sans text-slate-100 relative bg-[#020617]">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            <main className="relative z-10 pt-40 pb-12">
                {/* Hero Section */}
                <div className="max-w-[1700px] mx-auto px-6 mb-32 relative">
                    {/* Background Grid Lines (Subtle) */}
                    <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[length:80px_80px]"></div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Column: Content */}
                        <div className="space-y-8 text-left animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-[9px] tracking-[0.2em] uppercase">
                                <Activity className="w-3.5 h-3.5" /> GLOBAL CLINICAL RESEARCH PLATFORM
                            </div>
                            
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white tracking-tight leading-[1.2]">
                                    Advancing <br />
                                    <span className="italic font-normal">Science</span> for <br />
                                    <span className="text-cyan-400">Longer, Better Lives</span>
                                </h1>
                                <p className="text-[10px] md:text-xs text-slate-500 font-bold tracking-widest uppercase">
                                    (Multi-continental Evidence of Longevity & Lifestyle for Optimal Wellness)
                                </p>
                            </div>

                            <p className="text-base md:text-lg text-slate-400 font-medium max-w-xl leading-relaxed">
                                <strong className="text-white">MELLOW</strong> is a global consortium of researchers, clinical sites, and industry partners generating rigorous science for longevity, lifestyle, and wellness innovations — led by MusB Research.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5">
                                <button 
                                    onClick={() => setIsPartnerModalOpen(true)}
                                    className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-2xl shadow-cyan-500/20 flex items-center justify-center gap-2"
                                >
                                    Become a Partner
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <a href="#about" className="px-8 py-4 rounded-xl border border-slate-800 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center">
                                    Learn More
                                </a>
                            </div>
                        </div>

                        {/* Right Column: Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 animate-fade-in-up stagger-1">
                            {[
                                { val: '6+', label: 'Global Regions' },
                                { val: '50+', label: 'Clinical Sites' },
                                { val: '$610B', label: 'Longevity Market by 2028' },
                                { val: '200+', label: 'Scientific Publications' }
                            ].map((stat, i) => (
                                <div key={i} className="p-6 md:p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:border-cyan-500/30 transition-all group overflow-hidden relative">
                                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-all"></div>
                                    <div className="text-3xl md:text-4xl font-black text-cyan-400 mb-1">{stat.val}</div>
                                    <div className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Founder Bar */}
                    <div className="mt-16 p-6 md:p-8 rounded-[2rem] bg-cyan-500/5 border border-cyan-500/10 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-6">
                            <div className="h-10 w-px bg-cyan-500/30 hidden md:block"></div>
                            <div className="text-xl md:text-2xl font-serif text-cyan-400">
                                Dr. Jain <span className="text-slate-500 mx-2">&</span> Dr. Yadav
                            </div>
                        </div>
                        <div className="text-slate-400 font-medium text-base border-l-0 md:border-l border-white/10 md:pl-6 text-center md:text-left">
                            World-leading scientists in longevity, microbiome & translational research
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors">
                                <Globe className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Get Involved Section */}
                <div id="about" className="max-w-[1700px] mx-auto px-6 mb-12 relative scroll-mt-32">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        {/* Right Side: Contact & Description */}
                        <div className="space-y-12 order-2 lg:order-1">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-[9px] tracking-[0.3em] uppercase">
                                    Get Involved
                                </div>
                                <h2 className="text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight">
                                    Join the <span className="text-cyan-400">MELLOW</span> Consortium
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed font-medium max-w-2xl">
                                    Whether you are a dietary supplement company, functional food brand, biopharma innovator, or academic investigator — reach out to explore how MELLOW can serve your goals.
                                </p>
                            </div>

                            {/* Contact Grid */}
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Website</div>
                                        <div className="text-slate-200 font-bold">www.musbresearch.com</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</div>
                                        <div className="text-slate-200 font-bold">info@musbresearch.com</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</div>
                                        <div className="text-slate-200 font-bold">+1 (813) 419-0781</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</div>
                                        <div className="text-slate-200 font-bold italic">MusB Research · Florida, USA</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Benefits Panel */}
                        <div className="relative order-1 lg:order-2">
                            <div className="absolute inset-0 bg-cyan-500/10 blur-[100px] rounded-full"></div>
                            <div className="relative p-10 md:p-14 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl space-y-8 overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
                                
                                <div className="space-y-6">
                                    {[
                                        "Multi-continental clinical evidence for your product",
                                        "Stronger scientific credibility and regulatory positioning",
                                        "Cost-efficient shared infrastructure — 30–50% savings",
                                        "Access to global populations and new international markets",
                                        "Co-publications with world-leading longevity scientists",
                                        "Grant co-funding support — NIH, EU Horizon, foundations"
                                    ].map((benefit, bIdx) => (
                                        <div key={bIdx} className="flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: `${bIdx * 100}ms` }}>
                                            <div className="mt-1 w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <span className="text-slate-300 font-medium leading-relaxed">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                <BecomePartnerModal 
                    isOpen={isPartnerModalOpen} 
                    onClose={() => setIsPartnerModalOpen(false)} 
                />
            </main>
        </div>
    );
}
