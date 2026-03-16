import { useState, useEffect } from 'react';
import {
    Search,
    ArrowRight,
    Clock,
    MapPin,
    ChevronDown,
    CheckCircle2,
    Users,
    CheckSquare,
    ShieldCheck,
    Smartphone,
    Home,
    Zap,
    MessageSquare,
    Gift,
    FileText,
    HeartPulse,
    SearchCheck,
    CalendarCheck,
    Stethoscope,
    AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../utils/auth';

import { fetchStudies } from '../data/studies';

export default function Trials() {
    const [selectedCondition, setSelectedCondition] = useState('All');
    const [selectedType, setSelectedType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [studies, setStudies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        ageRange: '',
        interests: [] as string[],
        participation: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    useEffect(() => {
        const fetchStudies = async () => {
            try {
                const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/studies/`);
                if (!response.ok) throw new Error('Failed to fetch studies');
                const data = await response.json();

                // Map API data to UI structure if needed, or use directly
                const mappedStudies = data.map((s: any) => ({
                    id: s.protocol_id || s.id,
                    title: s.title,
                    description: s.primary_indication || "Standard research protocol",
                    condition: s.primary_indication || "Other",
                    type: s.study_type === 'VIRTUAL' ? 'Virtual' : (s.study_type === 'IN_PERSON' ? 'On-site' : 'Hybrid'),
                    status: s.status === 'RECRUITING' ? 'Recruiting' : 'Closed',
                    benefit: s.trial_model === 'RCT' ? 'Placebo-Controlled' : 'Standard Product',
                    duration: "4-12 Weeks", // Simulated field
                    tags: [s.trial_model, s.study_type]
                }));

                setStudies(mappedStudies);
            } catch (err) {
                console.error("Error fetching studies:", err);
                setStudies([]); // Fallback to empty on error
            } finally {
                setLoading(false);
            }
        }

        fetchStudies();
    }, []);

    const conditions = ["All", "Gut Health", "Metabolic Health", "Aging", "Women’s Health", "Brain Health", "Skin", "Other"];
    const types = ["All", "Virtual", "On-site", "Hybrid"];

    const filteredStudies = studies.filter((study: any) => {
        const matchesCondition = selectedCondition === 'All' || study.condition === selectedCondition;
        const matchesType = selectedType === 'All' || study.type === selectedType;
        const matchesSearch = (study.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (study.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCondition && matchesType && matchesSearch;
    });

    const faqs = [
        {
            q: "Can I join a MusB™ Research study from home?",
            a: "Yes. Many studies are 100% virtual. Please contact our team to enquire about this option. If eligible, we ship the product to your home. You share information through online surveys. Your information is kept confidential."
        },
        {
            q: "How do I sign up to participate?",
            a: "Click 'Check Eligibility,' complete a short form, and our team will contact you if you qualify."
        },
        {
            q: "How long do studies last?",
            a: "Many studies run about 4-8 weeks, though some may be shorter or longer depending on the protocol."
        },
        {
            q: "What do I get for participating?",
            a: "Eligible volunteers may receive a no-cost product supply and a personalized health report upon completion."
        },
        {
            q: "Can I discuss the study with my healthcare provider?",
            a: "Yes. You are encouraged to discuss participation with your healthcare provider."
        },
        {
            q: "How are MusB™ studies different?",
            a: "Our studies focus on scientific rigor, participant convenience, and real-world relevance— using both onsite and virtual participation and validated products."
        }
    ];
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');

        const message = `
            Study Matching Request:
            Name: ${formData.name}
            Phone: ${formData.phone}
            Age Range: ${formData.ageRange}
            Interests: ${formData.interests.join(', ')}
            Preferred Participation: ${formData.participation}
        `;

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            console.log('Study Matching Form Submitted', {
                name: formData.name,
                email: formData.email,
                subject: 'Study Matching Request',
                message: message
            });
            setFormStatus('success');
            setFormData({
                name: '',
                email: '',
                phone: '',
                ageRange: '',
                interests: [],
                participation: ''
            });
        } catch (error) {
            console.error('Submission failed:', error);
            setFormStatus('error');
        }
    };

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden bg-transparent">

            <div className="relative z-10 pb-24 animate-in fade-in duration-1000">
                {/* HERO SECTION */}
                <section className="relative pt-40 pb-24 max-w-[1700px] mx-auto px-4 md:px-12 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none"></div>
                    <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold text-xs tracking-widest uppercase">
                                <HeartPulse className="w-4 h-4" /> Active Clinical Trials
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.85] uppercase italic">
                                Join a Study. Help Advance <span className="text-cyan-400 italic font-black">Natural</span> Health Science.
                            </h1>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4 text-lg md:text-xl text-slate-300 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2.5"></div>
                                    Be part of large research studies on supplements and natural health products
                                </li>
                                <li className="flex items-start gap-4 text-lg md:text-xl text-slate-300 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2.5"></div>
                                    Receive a 2-6-week supply of a study product at no cost (when eligible)
                                </li>
                            </ul>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    to="#current-studies"
                                    className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2"
                                >
                                    Check Eligibility
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <div className="flex items-center gap-8 pt-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400" /> Confidential and secure
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <Zap className="w-4 h-4 text-cyan-400" /> Lab-tested products
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-[4rem] blur-3xl"></div>
                            <div className="relative grid grid-cols-2 gap-4">
                                <div className="space-y-4 pt-12">
                                    <div className="rounded-[3rem] w-full h-[300px] shadow-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20"></div>
                                    <div className="rounded-[3rem] w-full h-[200px] shadow-2xl border border-white/10 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-[3rem] w-full h-[200px] shadow-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20"></div>
                                    <div className="rounded-[3rem] w-full h-[300px] shadow-2xl border border-white/10 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PROOF BAR */}
                <section className="bg-white/5 border-y border-white/5 py-24" >
                    <div className="max-w-[1400px] mx-auto px-4 md:px-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center text-center">
                            <div className="space-y-2">
                                <div className="text-4xl font-black text-cyan-400">20+</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Products Studied</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-black text-indigo-400">5,000+</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volunteers</div>
                            </div>
                            <div className="col-span-2 flex items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden lg:block">As Featured In:</div>
                                <div className="flex gap-8 items-center">
                                    <div className="h-4 w-24 bg-white/20 rounded"></div>
                                    <div className="h-4 w-32 bg-white/20 rounded"></div>
                                    <div className="h-4 w-20 bg-white/20 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section >

                {/* VALUE CARDS */}
                <section className="py-24 max-w-[1400px] mx-auto px-4 md:px-12" >
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="group bg-slate-900/40 backdrop-blur-3xl p-8 md:p-12 rounded-[4rem] border border-white/5 hover:border-cyan-500/30 transition-all shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                                <Gift className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">No-Cost Study Product</h3>
                            <p className="text-slate-400 font-medium leading-relaxed mb-8">Receive a 2-6-week supply when eligible and participate in groundbreaking health research.</p>
                            <Link to="#current-studies" className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest inline-block hover:bg-white transition-colors">Check Eligibility</Link>
                        </div>
                        <div className="group bg-slate-900/40 backdrop-blur-3xl p-8 md:p-12 rounded-[4rem] border border-white/5 hover:border-indigo-500/30 transition-all shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform">
                                <HeartPulse className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">Contribute to Science</h3>
                            <p className="text-slate-400 font-medium leading-relaxed mb-8">Help validate natural health products for real people and shape the future of medicine.</p>
                            <Link to="#current-studies" className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest inline-block hover:bg-white hover:text-slate-900 transition-all">Check Eligibility</Link>
                        </div>
                    </div>
                </section >

                {/* HOW THE STUDY WORKS */}
                <section id="how-it-works" className="bg-slate-950/40 backdrop-blur-2xl py-24 border-y border-white/5" >
                    <div className="max-w-[1400px] mx-auto px-4 md:px-12">
                        <div className="text-center space-y-6 max-w-3xl mx-auto mb-12 md:mb-24">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">How the <span className="text-cyan-400">Study Works</span></h2>
                            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">Simple. Safe. Science-Driven.</p>
                        </div>

                        <div className="p-8 md:p-16 rounded-[2.5rem] md:rounded-[4.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl relative overflow-hidden group/container">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                                {[
                                    {
                                        step: "Step 1",
                                        title: "Quick Eligibility Check",
                                        icon: SearchCheck,
                                        desc: "Answer a few short questions to see if you qualify. It only takes a minute and your information stays confidential."
                                    },
                                    {
                                        step: "Step 2",
                                        title: "Enroll & Receive Your Study Product",
                                        icon: CalendarCheck,
                                        desc: "If eligible, our research team will contact you and schedule your visit at one of our MusB™ Research facilities."
                                    },
                                    {
                                        step: "Step 3",
                                        title: "Participate & Share Your Experience",
                                        icon: Stethoscope,
                                        desc: "Continue your normal routine while using the study product. We will check in with you through simple follow-ups."
                                    },
                                    {
                                        step: "Step 4",
                                        title: "Complete the Study & Receive Feedback",
                                        icon: HeartPulse,
                                        desc: "Finish the study activities and receive a personalized health report as a thank-you for contributing to important research."
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="relative z-10 space-y-6">
                                            <div className="w-16 h-16 rounded-2xl bg-cyan-400 flex items-center justify-center text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform duration-500">
                                                <item.icon className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="inline-block px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-cyan-500/60 transition-colors uppercase italic">{item.step}</div>
                                                <h4 className="text-xl font-black text-white uppercase group-hover:text-cyan-400 transition-colors">{item.title}</h4>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section >

                {/* CURRENT STUDIES */}
                <section id="current-studies" className="pt-24 pb-8 relative z-10 overflow-hidden max-w-[1400px] mx-auto px-4 md:px-12" >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase">Currently Recruiting Studies</h2>
                            <p className="text-lg md:text-xl text-slate-400 font-medium">Explore open studies. Spots can fill quickly.</p>
                        </div>
                        <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search studies..."
                                    className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-cyan-500 transition-all text-sm font-bold text-white placeholder:text-slate-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-12">
                        {conditions.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedCondition(c)}
                                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${selectedCondition === c ? 'bg-cyan-500 text-slate-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="relative bg-slate-950/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:pt-16 md:pb-8 md:px-16 overflow-hidden group/container">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                            {filteredStudies.map((study) => (
                                <div key={study.id} className="group border border-white/5 rounded-[3rem] p-6 md:p-10 bg-slate-900/40 hover:bg-slate-900 hover:border-cyan-500/30 transition-all flex flex-col relative overflow-hidden shadow-2xl">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="space-y-4">
                                            <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${study.status === 'Recruiting' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-500/10 text-slate-400 opacity-50'}`}>
                                                {study.status}
                                            </div>
                                            <h3 className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase">{study.title}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                                            {(study.tags || []).map((tag: string) => (
                                                <span key={tag} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-widest">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-slate-400 font-medium mb-10 flex-grow leading-relaxed">{study.description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                        <div className="bg-white/2 rounded-2xl p-4 border border-white/5">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Benefit</div>
                                            <div className="text-sm font-bold text-white">{study.benefit}</div>
                                        </div>
                                        <div className="bg-white/2 rounded-2xl p-4 border border-white/5">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Duration</div>
                                            <div className="text-sm font-bold text-white">{study.duration}</div>
                                        </div>
                                    </div>
                                    {study.status === 'Recruiting' ? (
                                        <Link
                                            to={`/studies/${study.id}`}
                                            className="block w-full text-center py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all bg-cyan-500 text-slate-900 hover:bg-white"
                                        >
                                            Join Study
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all bg-white/5 text-slate-600 cursor-not-allowed"
                                        >
                                            Study Full
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section >



                {/* VOLUNTEER FAQ */}
                <section id="faq" className="pt-8 pb-24 max-w-[1000px] mx-auto px-4 md:px-12" >
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tight">Study Volunteer FAQs</h2>
                        <div className="h-1 w-24 bg-cyan-500 mx-auto rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-8 py-6 flex items-center justify-between text-left group"
                                >
                                    <span className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-cyan-400' : ''}`} />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                                        <p className="text-slate-400 font-medium leading-relaxed">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-16 text-center">
                        <Link to="#current-studies" className="text-cyan-400 font-black text-sm uppercase tracking-[0.2em] border-b-2 border-cyan-400/30 pb-2 hover:border-cyan-400 hover:text-white transition-all">Check Eligibility</Link>
                    </div>
                </section >

                {/* FINAL CTA + CONTACT FORM */}
                <section id="contact" className="py-24 max-w-[1400px] mx-auto px-4 md:px-12" >
                    <div className="grid lg:grid-cols-2 gap-16">
                        <div className="space-y-8 lg:pt-12">
                            <h2 className="text-5xl font-black text-white leading-tight uppercase">Get Matched to a Clinical Study</h2>
                            <p className="text-xl text-slate-400 font-medium max-w-lg">Not sure which study fits you? We will match you based on your interests and eligibility.</p>
                            <div className="space-y-6 pt-8">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white">Confidential. Secure.</span>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <HeartPulse className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white">Participant-first approach.</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-3xl p-10 md:p-12 rounded-[4rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
                            <form className="space-y-6" onSubmit={handleFormSubmit}>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Age Range</label>
                                        <select
                                            value={formData.ageRange}
                                            onChange={e => setFormData({ ...formData, ageRange: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select age range</option>
                                            <option>18-24</option>
                                            <option>25-34</option>
                                            <option>35-44</option>
                                            <option>45-54</option>
                                            <option>55-64</option>
                                            <option>65+</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Health Interests (Check all that apply)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-slate-950/30 rounded-3xl border border-white/5">
                                        {["Gut Health", "Aging", "Metabolic", "Cognition", "Women's Health", "Skin"].map(interest => (
                                            <label key={interest} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.interests.includes(interest)}
                                                    onChange={e => {
                                                        const newInterests = e.target.checked
                                                            ? [...formData.interests, interest]
                                                            : formData.interests.filter(i => i !== interest);
                                                        setFormData({ ...formData, interests: newInterests });
                                                    }}
                                                    className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-cyan-500 transition-all cursor-pointer"
                                                />
                                                <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{interest}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Preferred Participation</label>
                                    <div className="flex gap-4">
                                        {["Virtual", "On-site", "Either"].map(mode => (
                                            <label key={mode} className="flex-1">
                                                <input
                                                    type="radio"
                                                    name="participation"
                                                    value={mode}
                                                    checked={formData.participation === mode}
                                                    onChange={e => setFormData({ ...formData, participation: e.target.value })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-full text-center py-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 peer-checked:bg-cyan-500 peer-checked:text-slate-950 peer-checked:border-cyan-500 cursor-pointer transition-all hover:bg-white/10">{mode}</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={formStatus === 'submitting'}
                                    className={`w-full py-5 bg-cyan-500 text-slate-900 rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 active:translate-y-0 mt-8 ${formStatus === 'submitting' ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {formStatus === 'submitting' ? 'Submitting...' : 'Get Matched'}
                                </button>
                                {formStatus === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-8 p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4 text-emerald-400 text-xs font-black uppercase tracking-widest"
                                    >
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                        Successfully submitted! We will be in touch shortly.
                                    </motion.div>
                                )}
                                {formStatus === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-8 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500 text-xs font-black uppercase tracking-widest animate-pulse"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        Failed to submit. Please try again or contact support.
                                    </motion.div>
                                )}
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
