import React from 'react';
import { ShieldCheck, Globe, ArrowRight, Activity, Mail, Phone, MapPin, CheckCircle2, UserPlus, FlaskConical, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConsortiumForm from './ConsortiumForm';
import BiologicalAgeForm from './BiologicalAgeForm';

export default function AboutMellow() {
    const [formType, setFormType] = React.useState<string | null>(null);
    const [isSponsorExpanded, setIsSponsorExpanded] = React.useState(false);
    const [isInvestigatorExpanded, setIsInvestigatorExpanded] = React.useState(false);

    const closeForm = () => setFormType(null);

    const sponsorBenefits = [
        { title: 'Multi-continental clinical evidence', desc: 'Generate global evidence for your product across diverse populations' },
        { title: 'Stronger scientific credibility', desc: 'Enhanced regulatory positioning backed by world-class investigators' },
        { title: 'Cost-efficient shared infrastructure', desc: '30–50% savings through shared resources across consortium sites' },
        { title: 'Access to global populations', desc: 'New international markets and diverse participant demographics' },
        { title: 'Co-publications with world-leading scientists', desc: 'Peer-reviewed publications with MELLOW\'s longevity research leaders' },
        { title: 'Grant co-funding support', desc: 'NIH, EU Horizon, and foundation grant opportunities' }
    ];

    const investigatorBenefits = [
        { title: 'Sub-Investigator Roles', desc: "Recruit participants for global clinical trials with MELLOW's infrastructure and regulatory support." },
        { title: 'Regional KOL Status', desc: 'Become the longevity authority for your region, advising regional and international companies.' },
        { title: 'Paid Contributions', desc: 'Receive competitive compensation for your time, expertise, and participant recruitment efforts.' },
        { title: 'Publication Authorship', desc: 'Appear in peer-reviewed journals alongside world-leading longevity scientists.' },
        { title: 'Media & Thought Leadership', desc: 'Feature in podcasts, webinars, and media as a recognized longevity thought leader.' },
        { title: 'Conference Access', desc: 'Priority speaker slots, discounts, and travel support for international longevity conferences.' }
    ];

    const membershipOptions = [
        'Founding Partner',
        'Strategic Member',
        'Research Affiliate',
        'Associate Partner'
    ];

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
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <motion.div 
                    layout
                    className={`p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl flex flex-col h-full hover:border-cyan-500/30 transition-all group ${isSponsorExpanded ? 'md:col-span-2' : ''}`}
                >
                    <div className="flex-grow space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                                <Briefcase className="w-7 h-7" />
                            </div>
                            {isSponsorExpanded && (
                                <button 
                                    onClick={() => setIsSponsorExpanded(false)}
                                    className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                                >
                                    Close Details
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-2xl font-serif text-white">Become Partner To <span className="text-cyan-400 italic">GROW</span> in Longevity Market</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                                Join the MELLOW Consortium, if you are looking to dominate in longevity market, reach out to explore how MELLOW can serve your goals.
                            </p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isSponsorExpanded ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="overflow-hidden space-y-12 pt-6"
                            >
                                {/* Benefits Grid */}
                                <div className="grid sm:grid-cols-2 gap-8">
                                    {sponsorBenefits.map((benefit, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex items-center gap-2 text-cyan-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <h4 className="text-sm font-bold uppercase tracking-wider">{benefit.title}</h4>
                                            </div>
                                            <p className="text-slate-500 text-xs leading-relaxed pl-6">{benefit.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Membership Options */}
                                <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 space-y-6">
                                    <h4 className="text-lg font-serif text-white">Membership Tiers</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {membershipOptions.map((option, i) => (
                                            <div key={i} className="px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-center">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{option}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic text-center">Reach out to our team for tailored membership structures and collaboration models.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <button 
                                        onClick={() => setFormType('sponsor')}
                                        className="bg-white text-slate-950 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        Inquire Now <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <button 
                                onClick={() => setIsSponsorExpanded(true)}
                                className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group/btn mt-auto pt-6"
                            >
                                Learn Benefits <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div 
                    layout
                    className={`p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl flex flex-col h-full hover:border-cyan-500/30 transition-all cursor-pointer group ${isInvestigatorExpanded ? 'lg:col-span-2' : ''}`}
                    onClick={() => !isInvestigatorExpanded && setIsInvestigatorExpanded(true)}
                >
                    <div className="flex-grow space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                                <UserPlus className="w-7 h-7" />
                            </div>
                            {isInvestigatorExpanded && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsInvestigatorExpanded(false);
                                    }}
                                    className="text-slate-500 hover:text-white"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-2xl font-serif text-white">Join as an Investigator or KOL</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                                Shape the future of longevity science while advancing your career on a global stage.
                            </p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isInvestigatorExpanded ? (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-8 pt-4 overflow-hidden"
                            >
                                <div className="grid md:grid-cols-2 gap-6">
                                    {investigatorBenefits.map((benefit, idx) => (
                                        <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                            <h4 className="text-emerald-400 font-bold text-sm tracking-tight">{benefit.title}</h4>
                                            <p className="text-slate-400 text-xs leading-relaxed">{benefit.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                
                                <p className="text-slate-500 text-[11px] font-medium italic border-t border-white/5 pt-6">
                                    ...and many more benefits including grant co-authorship, exclusive MELLOW research previews, and an international peer network.
                                </p>

                                <div className="pt-4 flex justify-start">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFormType('investigator');
                                        }}
                                        className="bg-white text-slate-950 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        Apply to Join <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <button 
                                onClick={() => setIsInvestigatorExpanded(true)}
                                className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group/btn mt-auto pt-6"
                            >
                                View Advantages <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div 
                    onClick={() => setFormType('bioage')}
                    className="p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl flex flex-col h-full hover:border-cyan-500/30 transition-all cursor-pointer group"
                >
                    <div className="flex-grow space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                            <FlaskConical className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-serif text-white">Know your biological age</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Upload your medical reports and use our advanced markers to determine your biological age.
                        </p>
                    </div>
                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mt-auto pt-6">
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
