import React, { useState, useMemo } from 'react';
import {
    Users,
    Target,
    Zap,
    ShieldCheck,
    Star,
    RefreshCcw,
    Briefcase,
    MapPin,
    Clock,
    GraduationCap,
    CheckCircle2,
    FileText,
    MessagesSquare,
    Microscope,
    Activity,
    TestTube,
    BarChart,
    ChevronRight,
    SearchX
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { JobOpening, CareerCategory } from '@/types';


const hiringProcess = [
    {
        id: '1',
        title: 'Apply Online',
        desc: 'Submit your application through our careers portal.',
        icon: FileText
    },
    {
        id: '2',
        title: 'Interview & Discussion',
        desc: 'Meet with our team to discuss skills, experience, and fit.',
        icon: MessagesSquare
    },
    {
        id: '3',
        title: 'Join the Team',
        desc: 'Successful candidates receive an offer and onboarding support.',
        icon: Users
    }
];

const cultureValues = [
    { name: 'Excellence', icon: Star },
    { name: 'Integrity', icon: ShieldCheck },
    { name: 'Innovation', icon: Zap },
    { name: 'Collaboration', icon: Users },
    { name: 'Responsibility', icon: Target },
    { name: 'Continuous Improvement', icon: RefreshCcw }
];

const benefitPoints = [
    'Mission-driven, science-first culture',
    'Work with renowned scientists and clinicians',
    'Exposure to cutting-edge research and clinical trials',
    'Collaborative, inclusive environment',
    'Opportunities for growth and learning',
    'Real-world impact on public health'
];


const HARDCODED_CATEGORIES: CareerCategory[] = [
    { id: '1', name: 'Research & Innovation', description: 'Scientists, postdocs, research associates.', icon: 'microscope' },
    { id: '2', name: 'Clinical Research', description: 'Coordinators, nurses, and trial managers.', icon: 'activity' },
    { id: '3', name: 'Laboratory & Diagnostics', description: 'Lab technicians, analysts, QA/QC professionals.', icon: 'test-tube' },
    { id: '4', name: 'Data & Biostatistics', description: 'Data scientists and statisticians.', icon: 'bar-chart' },
    { id: '5', name: 'Operations & Administration', description: 'HR, finance, and compliance professionals.', icon: 'briefcase' },
    { id: '6', name: 'Students & Internships', description: 'Interns, trainees, and fellows.', icon: 'graduation-cap' }
];

const HARDCODED_JOBS: JobOpening[] = [
    {
        id: '1', title: 'Senior Clinical Research Coordinator', department: 'Clinical Research',
        location: 'Tampa, FL (On-site)', type: 'Full-time', experienceLevel: 'Senior',
        summary: 'Lead the management of complex clinical trials in microbiome and metabolic health.',
        description: '',
        isFeatured: true,
        status: 'Live'
    },
    {
        id: '2', title: 'Research Associate - Biotics & Omics', department: 'Research & Innovation',
        location: 'Tampa, FL (Hybrid)', type: 'Full-time', experienceLevel: 'Mid-level',
        summary: 'Support bench-top research in our multi-omics laboratory.',
        description: '',
        isFeatured: false,
        status: 'Live'
    },
    {
        id: '3', title: 'Laboratory Technician', department: 'Laboratory & Diagnostics',
        location: 'Tampa, FL (On-site)', type: 'Full-time', experienceLevel: 'Entry-level',
        summary: 'Execute standard laboratory protocols for clinical sample processing.',
        description: '',
        isFeatured: false,
        status: 'Live'
    },
    {
        id: '4', title: 'Clinical Data Analyst', department: 'Data & Biostatistics',
        location: 'Remote / Tampa, FL', type: 'Contract', experienceLevel: 'Mid-level',
        summary: 'Perform statistical cleaning and analysis of microbiome-based clinical data.',
        description: '',
        isFeatured: false,
        status: 'Live'
    }
];

export default function Careers() {
    const [activeDept, setActiveDept] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const jobOpenings = HARDCODED_JOBS; const careerCategories = HARDCODED_CATEGORIES;



    const departments = useMemo(() => {
        const depts = new Set(jobOpenings.map(job => job.department));
        return ['All', ...Array.from(depts)];
    }, [jobOpenings]);

    const filteredJobs = useMemo(() => {
        return jobOpenings.filter(job => {
            const matchesDept = activeDept === 'All' || job.department === activeDept;
            const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.summary.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDept && matchesSearch;
        });
    }, [activeDept, searchQuery, jobOpenings]);

    const getCategoryIcon = (iconName: string) => {
        switch (iconName) {
            case 'microscope': return Microscope;
            case 'activity': return Activity;
            case 'test-tube': return TestTube;
            case 'bar-chart': return BarChart;
            case 'briefcase': return Briefcase;
            case 'graduation-cap': return GraduationCap;
            default: return Briefcase;
        }
    };

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* SECTION 1: HERO */}
            <section className="relative pt-40 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]"></div>
                <div className="max-w-[1700px] mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <span className="text-cyan-400 font-black text-xs uppercase tracking-[0.4em]">Join Our Mission</span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.9] uppercase italic">
                            Build the <span className="text-cyan-400 italic">Future</span> of Health Science
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-medium max-w-xl">
                            Join a mission-driven research organization advancing microbiome, aging, metabolic, and clinical science.
                            Work alongside world-class scientists in an environment built on integrity, innovation, and collaboration.
                        </p>
                        <div className="flex flex-col gap-4 pt-4 w-full sm:w-max">
                            <a href="#open-positions" className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-cyan-500 hover:scale-105 transition-all shadow-xl shadow-cyan-500/10 text-center whitespace-nowrap">
                                View Open Positions
                            </a>
                            <a href="#why-musb" className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-white/10 transition-all text-center">
                                Why MusB™ Research
                            </a>
                        </div>
                    </div >

                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 rounded-[4rem] blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative rounded-[4rem] overflow-hidden border border-white/10 aspect-[4/3] shadow-2xl">
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:scale-105 transition-transform duration-1000"></div>
                            <div className="absolute bottom-8 left-8 right-8 bg-slate-950/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-white font-black text-lg uppercase tracking-widest">Science. Integrity. Impact.</div>
                                    <div className="text-slate-400 text-xs font-bold">Leading clinical breakthroughs in Tampa Bay.</div>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                                    <Star className="w-6 h-6 fill-current" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </section >

            {/* SECTION 2: WHY WORK AT MUSB RESEARCH */}
            < section id="why-musb" className="max-w-[1700px] mx-auto px-6 md:px-12 py-20 border-t border-white/5" >
                <div className="grid lg:grid-cols-3 gap-16 items-start">
                    <div className="space-y-8 lg:sticky lg:top-32">
                        <span className="text-cyan-400 font-black text-xs uppercase tracking-[0.4em]">Excellence & Growth</span>
                        <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] uppercase">Why Work at <span className="text-slate-500">MusB™</span></h2>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed">
                            Discover a career that combines scientific rigor with meaningful human impact.
                        </p>
                    </div>
                    <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                        {benefitPoints.map((point, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] flex items-start gap-6 hover:bg-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div className="text-xl font-black text-white/90 leading-tight uppercase group-hover:text-cyan-400 transition-colors pt-2">{point}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            {/* SECTION 3: OUR CULTURE & VALUES */}
            < section className="bg-slate-900/30 py-20" >
                <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[4.5rem] p-8 md:p-24 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/5 blur-[120px] rounded-full"></div>
                        <div className="grid lg:grid-cols-2 gap-20 relative z-10">
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <h2 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter">Our Culture</h2>
                                    <p className="text-2xl text-slate-400 leading-relaxed font-medium">
                                        At MusB™ Research, we believe great science is built by empowered people. We foster a collaborative, ethical, and inclusive culture where curiosity, accountability, and innovation thrive.
                                    </p>
                                </div>
                                <div className="flex gap-12 text-center border-t border-white/10 pt-10">
                                    <div>
                                        <div className="text-4xl font-black text-white">100%</div>
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-500 mt-2">Data Integrity</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-black text-white">15+</div>
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-500 mt-2">Yrs Experience</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-black text-white">FL-TN</div>
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-500 mt-2">Regional Reach</div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {cultureValues.map((val) => (
                                    <div key={val.name} className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 hover:border-cyan-500 transition-all group">
                                        <val.icon className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-all" />
                                        <div className="text-sm font-black uppercase tracking-widest text-white">{val.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* SECTION 4: CAREER PATHS */}
            < section className="max-w-[1700px] mx-auto px-6 md:px-12 py-20" >
                <div className="text-center space-y-6 mb-16">
                    <span className="text-cyan-400 font-black text-xs uppercase tracking-[0.4em]">Diverse Opportunities</span>
                    <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">Career Paths</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {careerCategories.map((cat: CareerCategory) => {
                        const Icon = getCategoryIcon(cat.icon);
                        return (
                            <div key={cat.id} className="group bg-white/5 border border-white/5 p-8 md:p-12 rounded-[3.5rem] hover:bg-slate-900 transition-all duration-500 shadow-xl overflow-hidden relative">
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-400/5 blur-3xl group-hover:bg-cyan-400/10 transition-colors"></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-lg group-hover:bg-cyan-500 group-hover:text-slate-950">
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white leading-tight uppercase group-hover:text-cyan-400 transition-colors italic">{cat.name}</h3>
                                    <p className="text-lg text-slate-400 leading-relaxed font-medium">{cat.description}</p>
                                    <a href="#open-positions" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white border-b-2 border-cyan-500 pb-1 hover:gap-3 transition-all pt-2 group-hover:text-cyan-400">
                                        See Open Roles <ChevronRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section >

            {/* SECTION 5: OPEN POSITIONS */}
            < section id="open-positions" className="bg-slate-900/50 py-20 scroll-mt-24" >
                <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                        <div className="space-y-6">
                            <span className="text-cyan-400 font-black text-xs uppercase tracking-[0.4em]">Current Vacancies</span>
                            <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">Open Positions</h2>
                        </div>
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 flex-wrap">
                            {departments.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setActiveDept(dept)}
                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeDept === dept ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'
                                        }`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((job: JobOpening) => (
                                <div key={job.id} className="group bg-white/5 border border-white/5 rounded-[2.5rem] p-6 md:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-10 hover:bg-white/10 hover:border-cyan-500/30 transition-all shadow-xl">
                                    <div className="flex-grow space-y-4">
                                        <div className="flex flex-wrap gap-4 items-center">
                                            {job.isFeatured && (
                                                <span className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-widest">Featured</span>
                                            )}
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">{job.department}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white uppercase group-hover:text-cyan-400 transition-colors italic">{job.title}</h3>
                                        <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400" /> {job.location}</div>
                                            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> {job.type}</div>
                                            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-400" /> {job.experienceLevel}</div>
                                        </div>
                                        <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">{job.summary}</p>
                                    </div>
                                    <Link
                                        to={`/careers/${job.id}`}
                                        className="w-full lg:w-auto px-10 py-5 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest text-sm hover:bg-cyan-500 transition-all text-center shadow-xl shadow-white/5 whitespace-nowrap"
                                    >
                                        Details & Apply
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 flex flex-col items-center text-center space-y-8">
                                <SearchX className="w-20 h-20 text-slate-700" />
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-white italic uppercase">No openings right now</h3>
                                    <p className="text-xl text-slate-500 font-medium max-w-lg">We don’t have any openings in this category, but we’re always interested in meeting talented people.</p>
                                </div>
                                <a 
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSenHSuSVQaIxKA40tsub0PwR91haXYBorPcmH2RZp0hsf6LyA/viewform?usp=publish-editor"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-cyan-500 text-slate-950 px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-cyan-500/20 whitespace-nowrap"
                                >
                                    Submit Your Resume
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </section >

            {/* SECTION 6: HOW TO APPLY */}
            < section className="max-w-[1700px] mx-auto px-6 md:px-12 py-20" >
                <div className="text-center mb-24">
                    <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">Our Hiring Process</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-16 relative">
                    <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2"></div>
                    {hiringProcess.map((step, i) => (
                        <div key={step.id} className="relative z-10 flex flex-col items-center text-center space-y-8 group">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 shadow-2xl group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-500">
                                <step.icon className="w-10 h-10" />
                                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-slate-950 border-2 border-cyan-500 flex items-center justify-center text-[10px] font-black text-white group-hover:bg-white group-hover:text-slate-950 transition-colors">{i + 1}</div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{step.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed max-w-[250px]">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section >

            {/* SECTION 7: STUDENTS & INTERNSHIPS */}
            < section className="max-w-[1700px] mx-auto px-6 md:px-12 py-16" >
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-950 rounded-[4rem] p-8 md:p-20 border border-indigo-500/20 text-center flex flex-col items-center space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <GraduationCap className="w-10 h-10" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">Students & Internships</h2>
                        <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                            MusB™ Research actively supports students, trainees, and early-career scientists through internships and mentorship opportunities.
                        </p>
                    </div>
                    <button 
                        onClick={() => document.getElementById('open-positions')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-indigo-500 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 relative z-10 inline-block"
                    >
                        Explore Opportunities
                    </button>
                </div>
            </section >

            {/* SECTION 8: EQUAL OPPORTUNITY */}
            <section className="max-w-4xl mx-auto px-6 py-10 text-center">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-300 leading-relaxed">
                    MusB™ Research is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.
                </p>
            </section>

            <section className="max-w-[1700px] mx-auto px-6 md:px-12 pb-32">
                <div className="relative p-8 md:p-24 rounded-[4.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.1)_0%,transparent_50%)]"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="text-center lg:text-left space-y-4">
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none italic uppercase">Ready to make an impact?</h2>
                            <p className="text-xl font-bold text-slate-400">Your journey in clinical breakthroughs starts here.</p>
                        </div>
                        <div className="flex flex-col gap-4 w-full lg:w-auto">
                            <button 
                                onClick={() => document.getElementById('open-positions')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full px-16 py-8 rounded-2xl bg-cyan-500 text-slate-950 font-black uppercase tracking-wider hover:bg-white transition-all shadow-xl shadow-cyan-500/10 text-center block whitespace-nowrap"
                            >
                                View Open Positions
                            </button>

                        </div>
                    </div>
                </div>
            </section>
            

        </div >
    );
}
