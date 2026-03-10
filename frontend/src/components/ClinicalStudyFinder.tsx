import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Check, ChevronDown, ArrowRight, Clock } from 'lucide-react';
import { Condition } from '@/types';

const conditions: Condition[] = ['Gut Health', 'Brain Health', 'Metabolic Health', 'Aging', 'Women’s Health', 'Cancer Support'];


const HARDCODED_STUDIES = [
    {
        id: '1',
        title: 'Gut Microbiome & Metabolic Health',
        condition: 'Gut',
        type: 'Hybrid',
        status: 'Recruiting',
        description: 'Evaluating the impact of a novel synbiotic formulation on gut microbiome diversity and metabolic markers over a 12-week period.',
        benefit: 'Free 12-week supply of study product & comprehensive microbiome analysis.',
        duration: '12 Weeks',
        tags: ['Microbiome', 'Metabolism', 'Supplement'],
        compensation: '$250',
        location: 'Tampa, FL & Virtual',
        timeCommitment: '4 clinic visits, weekly surveys',
        is_paid: true,
        is_free_testing: true
    },
    {
        id: '2',
        title: 'Cognitive Performance & Omega-3s',
        condition: 'Brain',
        type: 'Virtual',
        status: 'Recruiting',
        description: 'A fully virtual study assessing the effects of a high-DHA omega-3 supplement on memory, focus, and overall cognitive performance in adults aged 50-75.',
        benefit: 'Free 8-week supply of high-DHA omega-3 & individualized cognitive assessment report.',
        duration: '8 Weeks',
        tags: ['Cognition', 'Omega-3', 'Aging'],
        compensation: '$150',
        location: 'Virtual',
        timeCommitment: 'Online cognitive tests bi-weekly',
        is_paid: true,
        is_free_testing: false
    },
    {
        id: '3',
        title: 'Skin Hydration & Collagen Peptides',
        condition: 'Aging',
        type: 'On-site',
        status: 'Recruiting',
        description: 'Investigating the efficacy of a bio-active collagen peptide blend on skin hydration, elasticity, and wrinkle reduction using advanced dermal imaging.',
        benefit: 'Free 8-week supply of collagen supplement & professional skin health analysis.',
        duration: '8 Weeks',
        tags: ['Dermatology', 'Collagen', 'Aesthetics'],
        compensation: '$300',
        location: 'Tampa, FL',
        timeCommitment: '3 clinic visits for dermal imaging',
        is_paid: true,
        is_free_testing: true
    },
    {
        id: '4',
        title: 'Women\'s Health & Hormonal Balance',
        condition: 'Women\'s Health',
        type: 'Virtual',
        status: 'Recruiting',
        description: 'Studying a botanical blend for the support of hormonal balance and reduction of peri-menopausal symptoms in women aged 40-60.',
        benefit: 'Free 12-week supply of botanical supplement & hormone health tracking app access.',
        duration: '12 Weeks',
        tags: ['Women\'s Health', 'Botanicals', 'Hormones'],
        compensation: '$200',
        location: 'Virtual',
        timeCommitment: 'Daily app tracking, weekly surveys',
        is_paid: true,
        is_free_testing: false
    }
];
export default function ClinicalStudyFinder() {
    const [selectedCondition, setSelectedCondition] = useState<Condition | ''>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [studies, setStudies] = useState<any[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setStudies(HARDCODED_STUDIES);
    }, []);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredStudies = studies.filter(study => {
        if (selectedCondition && study.condition !== selectedCondition) return false;
        return true;
    }).slice(0, 4); // Limit to 3-4 active trials

    return (
        <section className="relative z-20 mt-0 mb-0 font-sans">
            <div className="w-full bg-transparent border-y border-transparent py-24 px-4 md:px-8 lg:px-10">
                <div className="w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-8 mb-12">
                        <div className="shrink-0 max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">
                                Ongoing Clinical Study
                            </h2>
                            <p className="text-slate-600 text-lg">
                                Participate in groundbreaking research and access advanced health insights.
                            </p>
                        </div>

                        {/* Centered Dropdown */}
                        <div className="mx-auto">
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 px-5 py-3 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 font-semibold hover:border-cyan-500 hover:text-cyan-600 transition-colors w-64 justify-between"
                                >
                                    <span className="truncate">{selectedCondition || "Select Condition"}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                                        <button
                                            onClick={() => { setSelectedCondition(''); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-5 py-2.5 hover:bg-slate-50 transition-colors font-medium ${selectedCondition === '' ? 'text-cyan-600 bg-slate-50' : 'text-slate-600'}`}
                                        >
                                            All Conditions
                                        </button>
                                        {conditions.map(condition => (
                                            <button
                                                key={condition}
                                                onClick={() => { setSelectedCondition(condition); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-5 py-2.5 hover:bg-slate-50 transition-colors font-medium ${selectedCondition === condition ? 'text-cyan-600 bg-slate-50' : 'text-slate-600'}`}
                                            >
                                                {condition}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right-aligned Group */}
                        <div className="flex items-center gap-6 shrink-0">
                            {/* Toggles removed for compensation */}
                        </div>
                    </div>

                    {/* Trial Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredStudies.length > 0 ? (
                            filteredStudies.map(study => (
                                <div key={study.id} className="group relative bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col h-full">
                                    <div className="mb-4">
                                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-full mb-3 group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">
                                            {study.condition}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-cyan-700 transition-colors">
                                            {study.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-3 mb-6 flex-grow">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                                                <Clock className="w-4 h-4 text-cyan-600" />
                                            </div>
                                            <span className="font-medium text-sm">{study.duration}</span>
                                        </div>
                                    </div>

                                    <Link to={`/trials?id=${study.id}#current-studies`} className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm uppercase tracking-wider hover:bg-cyan-600 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group-hover:shadow-cyan-200/50">
                                        Check Eligibility
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-medium">No studies found matching your criteria.</p>
                                <button
                                    onClick={() => { setSelectedCondition(''); }}
                                    className="text-cyan-600 font-bold mt-2 hover:underline"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 text-center">
                        <Link to="/trials" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-cyan-600 transition-colors group">
                            View All Clinical Trials
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
