import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Globe, Calendar, Mail, Phone, MapPin, ArrowRight, ExternalLink, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConsortiumNavBar from '../components/mellow/ConsortiumNavBar';
import { fetchStudies } from '../data/studies';
import AboutMellow from '../components/mellow/AboutMellow';
import InvestigatorsMap from '../components/mellow/InvestigatorsMap';

export default function MellowConsortium() {
    const [activeTab, setActiveTab] = useState('about');

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveTab(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sections = ['about', 'trial', 'investigators', 'events', 'contacts'];
        
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen font-sans text-slate-100 relative bg-[#020617]">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            <main className="relative z-10 pb-24">
                {/* Secondary Navigation */}
                <ConsortiumNavBar activeTab={activeTab} />

                <div className="max-w-[1700px] mx-auto px-6 mt-20 space-y-32">
                    <section id="about" className="scroll-mt-32">
                        <AboutMellow />
                    </section>

                    <section id="trial" className="scroll-mt-32">
                        <TrialSection />
                    </section>

                    <section id="investigators" className="scroll-mt-32">
                        <InvestigatorsMap />
                    </section>

                    <section id="events" className="scroll-mt-32">
                        <EventsSection />
                    </section>

                    <section id="contacts" className="scroll-mt-32">
                        <ContactsSection />
                    </section>
                </div>
            </main>
        </div>
    );
}

function TrialSection() {
    const [trials, setTrials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTrials = async () => {
            try {
                const data = await fetchStudies();
                // Filter for Recruiting studies and take the top ones
                const recruiting = data
                    .filter((s: any) => s.status === 'Recruiting')
                    .map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        description: s.description || s.condition,
                        link: `/trials?id=${s.id}#current-studies`
                    }));
                setTrials(recruiting);
            } catch (error) {
                console.error("Error fetching mellow trials:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTrials();
    }, []);

    return (
        <div className="space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h2 className="text-4xl font-serif text-white">Clinical Trials</h2>
                <p className="text-slate-400">Pioneering multi-continental clinical evidence for longevity and lifestyle interventions.</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            ) : trials.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-8">
                    {trials.map(trial => (
                        <Link 
                            key={trial.id} 
                            to={trial.link}
                            className="group relative p-12 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl hover:border-cyan-500/30 transition-all overflow-hidden flex flex-col justify-between"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-all" />
                            <div className="relative z-10 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                                    Active Study
                                </div>
                                <h3 className="text-3xl font-serif text-white group-hover:text-cyan-400 transition-colors">{trial.title}</h3>
                                <p className="text-slate-400 text-lg leading-relaxed line-clamp-3">{trial.description}</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-3 text-cyan-400 font-bold uppercase text-xs tracking-widest pt-8">
                                View Study Details <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center space-y-6 bg-white/5 rounded-[3rem] border border-white/5">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-white/10 flex items-center justify-center mx-auto text-slate-500 mb-2">
                        <Globe className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-serif text-white">No active recruiting studies</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">We are constantly launching new research. Check back soon or contact us for upcoming opportunities.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function EventsSection() {
    const events = [
        {
            title: 'Longevity Summit 2026',
            date: 'Oct 15-17, 2026',
            location: 'Miami, Florida',
            discount: '20% Off for Members'
        },
        {
            title: 'International Microbiome Conference',
            date: 'Nov 12, 2026',
            location: 'London, UK',
            discount: 'Early Bird Support Available'
        }
    ];

    return (
        <div className="space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h2 className="text-4xl font-serif text-white">Longevity Events</h2>
                <p className="text-slate-400">Join world-leading experts and innovators in the longevity space. MELLOW members enjoy exclusive discounts.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {events.map((event, i) => (
                    <div key={i} className="p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                <Calendar className="w-4 h-4 text-cyan-400" /> {event.date}
                            </div>
                            <h3 className="text-2xl font-serif text-white">{event.title}</h3>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <MapPin className="w-4 h-4" /> {event.location}
                            </div>
                        </div>
                        <div className="text-right space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest">
                                <Ticket className="w-4 h-4" /> {event.discount}
                            </div>
                            <button className="block w-full text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                                Register Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ContactsSection() {
    return (
        <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-serif text-white">Contact Us</h2>
                <p className="text-slate-400">Have questions about the MELLOW Consortium? Reach out to our global coordination team.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="flex items-center gap-6 group">
                        <div className="w-16 h-16 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                            <Mail className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email Support</div>
                            <div className="text-xl text-white font-medium">info@musbresearch.com</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 group">
                        <div className="w-16 h-16 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                            <Phone className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Call Center</div>
                            <div className="text-xl text-white font-medium">+1 (813) 419-0781</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 group">
                        <div className="w-16 h-16 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                            <MapPin className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Headquarters</div>
                            <div className="text-xl text-white font-medium italic">Florida, USA</div>
                        </div>
                    </div>
                </div>

                <div className="p-10 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-xl space-y-6">
                    <h3 className="text-2xl font-serif text-white">General Enquiries</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        For any other questions regarding membership, research collaborations, or event sponsorships.
                    </p>
                    <Link 
                        to="/contact" 
                        className="w-full bg-white text-slate-950 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                    >
                        Go to Contact Form <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

