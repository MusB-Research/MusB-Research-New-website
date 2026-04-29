import React from 'react';
import { ShieldCheck, Globe, ArrowRight, Activity, Mail, Phone, MapPin, CheckCircle2, UserPlus, FlaskConical, Briefcase } from 'lucide-react';
import ConsortiumForm from './ConsortiumForm';
import BiologicalAgeForm from './BiologicalAgeForm';

export default function AboutMellow() {
    const [formType, setFormType] = React.useState<string | null>(null);

    const closeForm = () => setFormType(null);

    return (
        <div className="space-y-32">
            {/* Hero Section */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 animate-fade-in-up">
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
                            (Multicontinental Evidence of Longevity & Lifestyle for Optimal Wellness)
                        </p>
                    </div>

                    <p className="text-base md:text-lg text-slate-400 font-medium max-w-xl leading-relaxed">
                        <strong className="text-white">MELLOW</strong> is a global consortium of researchers, clinical sites, and industry partners generating rigorous science for longevity, lifestyle, and wellness innovations — led by MusB Research.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5">
                        <button 
                            onClick={() => setFormType('sponsor')}
                            className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                        >
                            Become a Partner
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setFormType('investigator')}
                            className="px-8 py-4 rounded-xl border border-slate-800 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"
                        >
                            Join as Investigator
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { val: '6+', label: 'Global Regions' },
                        { val: '50+', label: 'Clinical Sites' },
                        { val: '$610B', label: 'Longevity Market by 2028' },
                        { val: '200+', label: 'Scientific Publications' }
                    ].map((stat, i) => (
                        <div key={i} className="p-6 md:p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:border-cyan-500/30 transition-all group overflow-hidden relative">
                            <div className="text-3xl md:text-4xl font-black text-cyan-400 mb-1">{stat.val}</div>
                            <div className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interactive Cards Section */}
            <div className="grid md:grid-cols-3 gap-8">
                <div 
                    onClick={() => setFormType('sponsor')}
                    className="p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl space-y-6 hover:border-cyan-500/30 transition-all cursor-pointer group"
                >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                        <Briefcase className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-serif text-white">Become Sponsor</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Join the MELLOW Consortium to dominate in the longevity market and generate global evidence.
                    </p>
                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        Learn Benefits <ArrowRight className="w-4 h-4" />
                    </div>
                </div>

                <div 
                    onClick={() => setFormType('investigator')}
                    className="p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl space-y-6 hover:border-cyan-500/30 transition-all cursor-pointer group"
                >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                        <UserPlus className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-serif text-white">Become Clinical Investigator/KOL</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Boost your scientific credentials and become a thought leader in longevity research.
                    </p>
                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        View Advantages <ArrowRight className="w-4 h-4" />
                    </div>
                </div>

                <div 
                    onClick={() => setFormType('bioage')}
                    className="p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl space-y-6 hover:border-cyan-500/30 transition-all cursor-pointer group"
                >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                        <FlaskConical className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-serif text-white">Know your biological age</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Upload your medical reports and use our advanced markers to determine your biological age.
                    </p>
                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        Start Analysis <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Founder Bar */}
            <a href="/team" className="block p-8 rounded-[2rem] bg-cyan-500/5 border border-cyan-500/10 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-6">
                    <div className="h-10 w-px bg-cyan-500/30 hidden md:block"></div>
                    <div className="text-xl md:text-2xl font-serif text-cyan-400">
                        Dr. Jain <span className="text-slate-500 mx-2">&</span> Dr. Yadav
                    </div>
                </div>
                <div className="text-slate-400 font-medium text-base md:pl-6 text-center md:text-left border-white/10 md:border-l">
                    World-leading scientists in longevity, microbiome & translational research
                </div>
                <div className="flex gap-3 text-cyan-400 font-bold text-xs uppercase tracking-widest items-center">
                    About Founders <ArrowRight className="w-4 h-4" />
                </div>
            </a>

            {/* Forms */}
            <ConsortiumForm 
                isOpen={formType === 'sponsor'} 
                onClose={closeForm}
                title="Express Your Interest"
                subtitle="MusB™ Research Partnership Inquiry"
            />
            <ConsortiumForm 
                isOpen={formType === 'investigator'} 
                onClose={closeForm}
                title="Express Your Interest"
                subtitle="Join Our Network of Clinical Investigators"
            />
            <BiologicalAgeForm 
                isOpen={formType === 'bioage'}
                onClose={closeForm}
            />
        </div>
    );
}
