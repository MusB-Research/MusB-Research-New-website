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
    DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, API } from '../utils/auth';



import { usePolling } from '@/hooks/usePolling';
import { getCurrencySymbol } from '@/utils/format';

export default function Trials() {
    const [selectedCondition, setSelectedCondition] = useState('All');
    const [selectedType, setSelectedType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [studies, setStudies] = useState<any[]>([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
    const [currency, setCurrency] = useState('USD');

// Manual currencySigns removed in favor of Intl.NumberFormat utility

    const getStudies = async (showLoading: boolean = true) => {
        if (showLoading) setLoading(true);
        try {
            const apiUrl = API || '';
            // skipCache: !showLoading ensures background polls bypass the cache
            const response = await authFetch(`${apiUrl}/api/public-studies/`, { skipCache: !showLoading });
            if (!response.ok) throw new Error('Failed to fetch studies');

            const data = await response.json();
            // DRF returns results in a 'results' key when paginated
            const studyList = Array.isArray(data) ? data : (data.results || []);
            // ... (rest of mapping logic)
            const statusMap: Record<string, string> = {
                'RECRUITING': 'Recruiting',
                'UPCOMING': 'Upcoming',
                'PAUSED': 'Paused',
                'ACTIVE': 'Active',
                'RECRUITMENT_COMPLETED': 'Recruitment Completed',
                'ANALYSIS_UNDERWAY': 'Analysis Underway',
                'PROGRESS_REPORT_DRAFT': 'Progress Report Draft',
                'FINAL_REPORT_SENT': 'Final Report Sent',
                'COMPLETED': 'Completed',
                'CLOSED_ARCHIVED': 'Closed / Archived'
            };

            const mappedStudies = studyList.map((s: any) => {
                const mappedType = s.study_type === 'VIRTUAL' ? 'Virtual' : (s.study_type === 'IN_PERSON' ? 'On-site' : 'Hybrid');
                return {
                    id: s.protocol_id || s.id,
                    db_id: s.id, // Needed for chronological sort
                    title: s.title,
                    full_title: s.full_title || '',
                    description: s.description || '',
                    overview: s.overview || '',
                    benefit: s.benefit || '',
                    participation_message: s.participation_message || '',
                    condition: s.condition || s.primary_indication || "Other",
                    type: mappedType,
                    status: statusMap[s.status] || 'Paused',
                    duration: s.duration || s.time_commitment || "4-12 Weeks",
                    compensation: s.compensation || "Varies by study",
                    tags: [s.trial_model, mappedType].filter(Boolean),
                    pi_details: s.pi_details
                };
            });

            setStudies(mappedStudies);
        } catch (err) {
            console.error("Error loading studies:", err);
            setStudies([]);
        }
        finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        getStudies(true);
    }, []);

    // Removed background polling per user request to reduce redundant network requests.
    // usePolling(() => getStudies(false), 10000);
    
    const completedStatuses = ['Completed', 'Recruitment Completed', 'Analysis Underway', 'Progress Report Draft', 'Final Report Sent', 'Closed / Archived'];

    // Derive filter categories dynamically from actual published studies
    const conditions = ['All', ...Array.from(new Set(studies.map((s: any) => s.condition).filter(Boolean)))];
    const types = ["All", "Virtual", "On-site", "Hybrid"];

    const filteredStudies = studies.filter((study: any) => {
        const normalizeCondition = (c: string) => (c || '').toLowerCase().replace(/['’]/g, '');
        const matchesCondition = selectedCondition === 'All' || normalizeCondition(study.condition) === normalizeCondition(selectedCondition);
        const matchesType = selectedType === 'All' || study.type === selectedType;
        const matchesSearch = (study.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (study.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const isStudyCompleted = completedStatuses.includes(study.status);
        const matchesCompletion = showCompleted ? isStudyCompleted : !isStudyCompleted;
        
        return matchesCondition && matchesType && matchesSearch && matchesCompletion;
    });

    const renderDescription = (text: string) => {
        if (!text) return null;
        
        const lines = text.split('\n');
        let inList = false;
        
        return lines.map((line, idx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                inList = false;
                return <div key={idx} className="h-4" />;
            }
            
            // Bullet Point Detection
            if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                inList = true;
                return (
                    <div key={idx} className="flex gap-4 mb-3 ml-1 group/item">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        <span className="text-slate-400 font-medium leading-relaxed text-[13px]">{trimmedLine.substring(1).trim()}</span>
                    </div>
                );
            }
            
            // Heading Detection (All caps, more than 5 chars, doesn't start with bullet)
            const isHeading = trimmedLine.length > 5 && trimmedLine === trimmedLine.toUpperCase();
            if (isHeading) {
                inList = false;
                return (
                    <h4 key={idx} className={`text-white font-black uppercase text-[11px] tracking-[0.2em] mb-4 flex items-center gap-3 ${idx > 0 ? 'mt-8' : 'mt-2'}`}>
                        <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        <span className="border-b border-white/10 pb-1">{trimmedLine}</span>
                    </h4>
                );
            }

            inList = false;
            return (
                <p key={idx} className="text-slate-400 font-medium mb-4 leading-relaxed text-[13px]">
                    {trimmedLine}
                </p>
            );
        });
    };

    const faqs = [
        {
            q: "Can I join a MusB™ Research study from home?",
            a: "Yes. Many studies are 100% virtual. Please contact our team to enquire about this option. If eligible, study materials are distributed as per the protocol. You share information through online surveys. Your information is kept confidential."
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

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden bg-transparent">

            <div className="relative z-10 pb-24 animate-in fade-in duration-1000">
                {/* HERO SECTION */}
                <section className="relative pt-40 pb-24 max-w-[1700px] mx-auto px-4 md:px-12 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none"></div>
                    <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold text-[12px] tracking-widest uppercase">
                                <HeartPulse className="w-4 h-4" /> Upcoming & Recruiting Trials
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
                                <a
                                    href="#current-studies"
                                    className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2"
                                >
                                    Check Eligibility
                                    <ArrowRight className="w-5 h-5" />
                                </a>
                            </div>
                            <div className="flex items-center gap-8 pt-6">
                                <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-400">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400" /> Confidential and secure
                                </div>
                                <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-400">
                                    <Zap className="w-4 h-4 text-cyan-400" /> Lab-tested products
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-cyan-500/20 rounded-[4rem] blur-3xl"></div>
                            <div className="relative grid grid-cols-2 gap-4">
                                <div className="space-y-4 pt-12">
                                    <div className="rounded-[3rem] w-full h-[300px] shadow-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-cyan-500/20"></div>
                                    <div className="rounded-[3rem] w-full h-[200px] shadow-2xl border border-white/10 bg-gradient-to-tr from-cyan-500/20 to-cyan-500/20"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-[3rem] w-full h-[200px] shadow-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-cyan-500/20"></div>
                                    <div className="rounded-[3rem] w-full h-[300px] shadow-2xl border border-white/10 bg-gradient-to-tr from-cyan-500/20 to-cyan-500/20"></div>
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
                                <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">Products Studied</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-black text-cyan-400">5,000+</div>
                                <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">Volunteers</div>
                            </div>
                            <div className="col-span-2 flex items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                                <div className="text-[12px] font-black uppercase tracking-widest text-slate-400 hidden lg:block">As Featured In:</div>
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
                            <a href="#current-studies" className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest inline-block hover:bg-white transition-colors">Check Eligibility</a>
                        </div>
                        <div className="group bg-slate-900/40 backdrop-blur-3xl p-8 md:p-12 rounded-[4rem] border border-white/5 hover:border-cyan-500/30 transition-all shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-8 group-hover:scale-110 transition-transform">
                                <HeartPulse className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">Contribute to Science</h3>
                            <p className="text-slate-400 font-medium leading-relaxed mb-8">Help validate natural health products for real people and shape the future of medicine.</p>
                            <a href="#current-studies" className="bg-cyan-500 text-white px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest inline-block hover:bg-white hover:text-slate-900 transition-all">Check Eligibility</a>
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
                                                <div className="inline-block px-3 py-1 bg-white/5 rounded-lg text-[12px] font-black uppercase tracking-widest text-cyan-500/60 transition-colors uppercase italic">{item.step}</div>
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
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                                {showCompleted ? 'Completed Studies' : 'Currently Recruiting Studies'}
                            </h2>
                            <p className="text-lg md:text-xl text-slate-400 font-medium">
                                {showCompleted ? 'Explore our past research and findings.' : 'Explore open studies. Spots can fill quickly.'}
                            </p>
                        </div>
                        <div className="bg-slate-900/40 backdrop-blur-xl p-3 md:p-4 rounded-3xl border border-white/10 flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 min-w-[200px] md:min-w-[300px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search studies..."
                                    className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-cyan-500 transition-all text-sm font-bold text-white placeholder:text-slate-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

                            <label className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group shrink-0 ml-auto md:ml-0">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={showCompleted}
                                        onChange={(e) => setShowCompleted(e.target.checked)}
                                        className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded-md checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
                                    />
                                    <CheckCircle2 className="absolute w-3 h-3 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
                                    View Completed Studies
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                            {conditions.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCondition(c)}
                                    className={`px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all shadow-lg ${
                                        selectedCondition === c 
                                        ? 'bg-cyan-500 text-slate-900 shadow-cyan-500/20' 
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 bg-slate-900/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Currency</span>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="bg-transparent text-white text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer pr-4"
                            >
                                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'].map(c => (
                                    <option key={c} value={c} className="bg-slate-900">{c} ({getCurrencySymbol(c)})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedStudy ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="relative bg-slate-950/40 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 md:p-16 overflow-hidden"
                            >
                                <button 
                                    onClick={() => setSelectedStudy(null)}
                                    className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"
                                >
                                    &larr; Back to List
                                </button>

                                <div className="max-w-4xl mx-auto space-y-12">
                                    <div className="space-y-6">
                                        <div className={`inline-block px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400`}>
                                            {selectedStudy.status}
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedStudy.title}</h2>
                                        <div className="flex flex-wrap gap-4">
                                            {selectedStudy.tags.map((tag: string) => (
                                                <span key={tag} className="px-3 py-1 bg-white/5 rounded-lg text-[12px] font-bold text-slate-500 uppercase tracking-widest">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12 border-y border-white/5 py-12">
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4">Brief Summary</h3>
                                                <div className="prose prose-invert prose-sm">
                                                    {renderDescription(selectedStudy.description)}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4">Overview</h3>
                                                <div className="prose prose-invert prose-sm">
                                                    {renderDescription(selectedStudy.overview)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4">Benefits for Participants</h3>
                                                <div className="prose prose-invert prose-sm">
                                                    {renderDescription(selectedStudy.benefit)}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4">Participation Message</h3>
                                                <div className="prose prose-invert prose-sm">
                                                    {renderDescription(selectedStudy.participation_message)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="bg-white/2 rounded-2xl p-6 border border-white/5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Compensation</p>
                                            <p className="text-xl font-black text-white italic">{getCurrencySymbol(currency)}{selectedStudy.compensation.replace(/[^0-9.]/g, '') || selectedStudy.compensation}</p>
                                        </div>
                                        <div className="bg-white/2 rounded-2xl p-6 border border-white/5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Duration</p>
                                            <p className="text-xl font-black text-white italic">{selectedStudy.duration}</p>
                                        </div>
                                        <div className="bg-white/2 rounded-2xl p-6 border border-white/5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Condition</p>
                                            <p className="text-xl font-black text-white italic">{selectedStudy.condition}</p>
                                        </div>
                                        <div className="bg-white/2 rounded-2xl p-6 border border-white/5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Type</p>
                                            <p className="text-xl font-black text-white italic">{selectedStudy.type}</p>
                                        </div>
                                    </div>

                                    {/* Investigator Section */}
                                    {selectedStudy.pi_details && (
                                        <div className="pt-4 space-y-8">
                                            <h3 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em]">Principal Investigator</h3>
                                            <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 group/pi hover:bg-white/[0.04] transition-all">
                                                <div className="w-32 h-32 rounded-[2rem] bg-slate-950 border border-white/10 overflow-hidden shrink-0 shadow-2xl relative group-hover/pi:scale-105 transition-transform duration-500">
                                                    {selectedStudy.pi_details.profile_picture ? (
                                                        <img 
                                                            src={selectedStudy.pi_details.profile_picture} 
                                                            alt={selectedStudy.pi_details.name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-800">
                                                            <Users className="w-12 h-12" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-4 text-center md:text-left flex-1">
                                                    <div className="space-y-1">
                                                        <h4 className="text-2xl font-black text-white uppercase italic tracking-tight">{selectedStudy.pi_details.name}</h4>
                                                        <div className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedStudy.pi_details.qualifications}</div>
                                                    </div>
                                                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                                                        {selectedStudy.pi_details.bio}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-8 flex flex-col md:flex-row gap-6">
                                        <Link
                                            to={`/studies/${selectedStudy.id}`}
                                            className="flex-1 text-center py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all bg-cyan-500 text-slate-900 hover:bg-white shadow-2xl shadow-cyan-500/20"
                                        >
                                            Join Study Now
                                        </Link>
                                        <button
                                            onClick={() => setSelectedStudy(null)}
                                            className="px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all bg-white/5 text-white hover:bg-white/10 border border-white/10"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="relative bg-slate-950/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:pt-16 md:pb-8 md:px-16 overflow-hidden group/container"
                            >
                                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                                    {filteredStudies.map((study) => (
                                        <div key={study.id} className="group border border-white/5 rounded-[3rem] p-6 md:p-10 bg-slate-900/40 hover:bg-slate-900 hover:border-cyan-500/30 transition-all flex flex-col relative overflow-hidden shadow-2xl">
                                            <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="space-y-4">
                                                    <div className={`inline-block px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest ${study.status === 'Recruiting' ? 'bg-cyan-500/10 text-cyan-400' :
                                                            study.status === 'Upcoming' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                study.status === 'Paused' ? 'bg-amber-500/10 text-amber-400' :
                                                                    completedStatuses.includes(study.status) ? 'bg-slate-500/10 text-slate-400 opacity-60' :
                                                                        'bg-cyan-500/10 text-cyan-400'
                                                        }`}>
                                                        {study.status}
                                                    </div>
                                                    <h3 className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase">{study.title}</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                                                    {(study.tags || []).map((tag: string) => (
                                                        <span key={tag} className="px-2 py-1 bg-white/5 rounded-lg text-[12px] font-bold text-slate-500 uppercase tracking-widest">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mb-10 flex-grow scrollbar-hide max-h-[120px] overflow-hidden relative">
                                                <div className="text-slate-400 font-medium line-clamp-3 leading-relaxed">
                                                    {study.description}
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                                <div className="bg-white/2 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">
                                                        <DollarSign className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-black uppercase tracking-widest text-slate-600 mb-1">Compensation</div>
                                                        <div className="text-sm font-bold text-white">{getCurrencySymbol(currency)}{study.compensation.replace(/[^0-9.]/g, '') || study.compensation}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-white/2 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-black uppercase tracking-widest text-slate-600 mb-1">Duration</div>
                                                        <div className="text-sm font-bold text-white">{study.duration}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedStudy(study)}
                                                className="block w-full text-center py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all bg-white/5 text-white hover:bg-cyan-500 hover:text-slate-900 border border-white/10"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                        <a href="#current-studies" className="text-cyan-400 font-black text-sm uppercase tracking-[0.2em] border-b-2 border-cyan-400/30 pb-2 hover:border-cyan-400 hover:text-white transition-all">Check Eligibility</a>
                    </div>
                </section >

            </div>
        </div>
    );
}
