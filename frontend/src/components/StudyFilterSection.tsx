import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ArrowRight, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { fetchStudies, Study } from '../data/studies';
import { Condition } from '../types';

const conditions: Condition[] = ['Gut Health', 'Brain Health', 'Metabolic Health', 'Aging', 'Women’s Health', 'Cancer Support'];

export default function StudyFilterSection() {
    const [selectedCondition, setSelectedCondition] = useState<Condition | 'All'>('All');
    const [selectedType, setSelectedType] = useState<'All' | 'Paid Studies' | 'Free Testing'>('All');
    const [studies, setStudies] = useState<Study[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        setIsLoading(true);
        fetchStudies().then((data) => {
            let filtered: any[] = data;
            if (selectedCondition !== 'All') {
                const normalizeCondition = (c: string) => (c || '').toLowerCase().replace(/['’]/g, '');
                filtered = filtered.filter(s => normalizeCondition(s.condition) === normalizeCondition(selectedCondition));
            }
            if (selectedType === 'Paid Studies') {
                filtered = filtered.filter(s => s.is_paid);
            } else if (selectedType === 'Free Testing') {
                filtered = filtered.filter(s => s.is_free_testing);
            }
            setStudies(filtered as any[]);
            setIsLoading(false);
        });
    }, [selectedCondition, selectedType]);


    const displayedStudies = studies.slice(0, 3); // Display 3 trials as requested

    return (
        <section className="pt-12 pb-12 bg-transparent relative z-10 overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 via-transparent to-transparent pointer-events-none"></div>

            <div className="max-w-[1700px] mx-auto px-4 md:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                            Ongoing Clinical Study
                        </h2>
                        <p className="text-xl text-slate-400 font-medium">
                            Explore ongoing clinical research studies and see if you qualify to participate.
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-6 p-4 bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10">
                        <div className="relative group">
                            <select
                                value={selectedCondition}
                                onChange={(e) => setSelectedCondition(e.target.value as any)}
                                className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 pr-12 text-slate-200 font-bold focus:ring-2 focus:ring-cyan-500 cursor-pointer outline-none transition-all w-full md:w-64"
                            >
                                <option value="All" className="bg-slate-900 text-white">All Conditions</option>
                                {conditions.map(c => (
                                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none group-hover:text-cyan-400 transition-colors" />
                        </div>

                        <div className="relative group">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as any)}
                                className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 pr-12 text-slate-200 font-bold focus:ring-2 focus:ring-cyan-500 cursor-pointer outline-none transition-all w-full md:w-64"
                            >
                                <option value="All" className="bg-slate-900 text-white">All Study Types</option>
                                <option value="Paid Studies" className="bg-slate-900 text-white">Paid Studies</option>
                                <option value="Free Testing" className="bg-slate-900 text-white">Free Testing</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none group-hover:text-cyan-400 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Study Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mb-16 min-h-[400px]">

                    {isLoading ? (
                        <div className="col-span-1 sm:col-span-2 xl:col-span-3 flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                        </div>

                    ) : displayedStudies.length > 0 ? (
                        displayedStudies.map((study) => (
                            <div key={study.id} className="group relative bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] hover:shadow-[0_50px_100px_-20px_rgba(6,182,212,0.25)] hover:bg-white/10 border border-white/5 transition-all duration-500 flex flex-col items-start gap-8">
                                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${study.condition === 'Gut Health' ? 'bg-green-500/10 text-green-400' :
                                    study.condition === 'Brain Health' ? 'bg-purple-500/10 text-purple-400' :
                                        study.condition === 'Metabolic Health' ? 'bg-orange-500/10 text-orange-400' :
                                            study.condition === 'Aging' ? 'bg-blue-500/10 text-blue-400' :
                                                study.condition === 'Women’s Health' ? 'bg-pink-500/10 text-pink-400' :
                                                    'bg-cyan-500/10 text-cyan-400'
                                    }`}>
                                    {study.condition}
                                </div>

                                <h3 className="text-2xl font-black text-white leading-tight group-hover:text-cyan-400 transition-colors">
                                    {study.title}
                                </h3>

                                <div className="space-y-6 w-full">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-slate-500">Duration</div>
                                                <div className="font-bold text-slate-200">{study.duration}</div>
                                            </div>
                                        </div>
                                        {study.compensation_range && (
                                            <div className="flex items-center gap-4 text-slate-400">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Compensation</div>
                                                    <div className="font-bold text-slate-200">{study.compensation_range}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Link
                                    to={`/trials?id=${study.id}#current-studies`}
                                    className="mt-4 w-full bg-cyan-500 text-slate-900 text-center py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-3 overflow-hidden transition-all group/btn shadow-cyan-500/20"
                                >
                                    <span>Check Eligibility</span>
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-1 sm:col-span-2 xl:col-span-3 py-20 text-center space-y-4">

                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500 mb-4 border border-white/5">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-white">No matching studies found</h3>
                            <p className="text-slate-500 font-medium">Try adjusting your filters to see more results.</p>
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <Link
                        to="/trials"
                        className="bg-white/5 border border-white/10 text-white px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 hover:-translate-y-1 transition-all inline-flex items-center gap-3 shadow-lg"
                    >
                        View All Clinical Trials
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
