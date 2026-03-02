import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    MapPin,
    Clock,
    Briefcase,
    ChevronLeft,
    Send,
    CheckCircle2,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { JobOpening } from '@/types';


const HARDCODED_JOBS: JobOpening[] = [
    {
        id: '1', title: 'Senior Clinical Research Coordinator', department: 'Clinical Research',
        location: 'Tampa, FL (On-site)', type: 'Full-time', experienceLevel: 'Senior',
        summary: 'Lead the management of complex clinical trials in microbiome and metabolic health.',
        description: 'As a Senior Clinical Research Coordinator at MusB™ Research, you will play a pivotal role in leading and managing high-impact clinical trials. You will oversee study protocols, ensure regulatory compliance, and coordinate with cross-functional teams to deliver high-quality data.',
        requirements: [
            'Bachelor\'s or Master\'s degree in a life science or nursing field.',
            'Minimum of 5 years of experience in clinical research coordination.',
            'In-depth knowledge of GCP, IRB protocols, and FDA regulations.',
            'Excellent communication and leadership skills.',
            'Ability to manage multiple complex trials simultaneously.'
        ],
        isFeatured: true,
        status: 'Live'
    },
    {
        id: '2', title: 'Research Associate - Biotics & Omics', department: 'Research & Innovation',
        location: 'Tampa, FL (Hybrid)', type: 'Full-time', experienceLevel: 'Mid-level',
        summary: 'Support bench-top research in our multi-omics laboratory.',
        description: 'We are seeking a dedicated Research Associate to join our Biotics & Omics team. You will be responsible for sample processing, DNA/RNA extraction, and supporting next-generation sequencing workflows.',
        requirements: [
            'Bachelor\'s or Master\'s degree in Biology, Biochemistry, or related field.',
            '2-3 years of wet-lab experience.',
            'Experience with sample processing (DNA/RNA extraction, PCR, NGS).',
            'Familiarity with data analysis software.',
            'Strong attention to detail.'
        ],
        isFeatured: false,
        status: 'Live'
    },
    {
        id: '3', title: 'Laboratory Technician', department: 'Laboratory & Diagnostics',
        location: 'Tampa, FL (On-site)', type: 'Full-time', experienceLevel: 'Entry-level',
        summary: 'Execute standard laboratory protocols for clinical sample processing.',
        description: 'MusB™ Research is looking for a Laboratory Technician to support operations. You will handle daily sample intake, maintain lab equipment, and ensure adherence to safety protocols.',
        requirements: [
            'Associate\'s or Bachelor\'s degree in laboratory science.',
            'Basic understanding of laboratory safety.',
            'Experience with pipetting and sample handling.',
            'Ability to work carefully under supervision.',
            'Excellent record-keeping skills.'
        ],
        isFeatured: false,
        status: 'Live'
    },
    {
        id: '4', title: 'Clinical Data Analyst', department: 'Data & Biostatistics',
        location: 'Remote / Tampa, FL', type: 'Contract', experienceLevel: 'Mid-level',
        summary: 'Perform statistical cleaning and analysis of microbiome-based clinical data.',
        description: 'As a Clinical Data Analyst, you will handle data from our clinical trials. Your focus will be on ensuring data integrity, performing exploratory analyses, and supporting the biostatistics team in reporting.',
        requirements: [
            'Master\'s degree in Biostatistics, Data Science, or related field.',
            'Proficiency in R or Python.',
            'Experience with clinical trial data and CDISC standards.',
            'Background in microbiome data analysis is a plus.',
            'Strong analytical thinking.'
        ],
        isFeatured: false,
        status: 'Live'
    }
];

export default function JobDetail() {
    const { id } = useParams<{ id: string }>();
    const jobOpenings = HARDCODED_JOBS;



    const job = jobOpenings.find(j => j.id === id);

    if (!job) {
        return (
            <div className="min-h-screen pt-40 pb-24 flex items-center justify-center text-center px-4 md:px-6 relative overflow-hidden">
                {/* Atmospheric Background Layers */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                    <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
                </div>
                <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-black text-white uppercase italic">Job Not Found</h2>
                    <p className="text-slate-400 max-w-md mx-auto">The position you are looking for might have been closed or moved.</p>
                    <Link to="/careers" className="inline-flex items-center gap-2 text-cyan-400 font-black uppercase tracking-widest hover:gap-3 transition-all">
                        <ChevronLeft className="w-5 h-5" /> Back to Careers
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* HERO SECTION */}
            <section className="relative pt-40 pb-16 overflow-hidden z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]"></div>
                <div className="max-w-[1200px] mx-auto px-4 md:px-12 relative z-10">
                    <Link to="/careers" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 font-black uppercase tracking-widest text-xs mb-12 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to Careers
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-4 items-center">
                                {job.isFeatured && (
                                    <span className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-widest">Featured</span>
                                )}
                                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">{job.department}</span>
                            </div>
                            <h1 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                                {job.title}
                            </h1>
                            <div className="flex flex-wrap gap-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-500" /> {job.location}</div>
                                <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-500" /> {job.type}</div>
                                <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-cyan-500" /> {job.experienceLevel}</div>
                                {job.deadline && (
                                    <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-cyan-500" /> Apply by {job.deadline}</div>
                                )}
                            </div>
                        </div>
                        <a
                            href="#apply-now"
                            className="bg-white text-slate-950 px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-500 hover:scale-105 transition-all shadow-xl shadow-cyan-500/10 text-center"
                        >
                            Apply Now
                        </a>
                    </div>
                </div>
            </section>

            {/* CONTENT SECTION */}
            <section className="max-w-[1200px] mx-auto px-4 md:px-12 py-16 grid lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-16">
                    {/* Description */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase italic border-l-4 border-cyan-500 pl-6">The Role</h2>
                        <p className="text-xl text-slate-400 leading-relaxed font-medium">
                            {job.description}
                        </p>
                    </div>

                    {/* Requirements */}
                    {job.requirements && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-black text-white uppercase italic border-l-4 border-cyan-500 pl-6">What You'll Bring</h2>
                            <div className="grid gap-6">
                                {job.requirements.map((req: string, index: number) => (
                                    <div key={index} className="flex gap-4 group">
                                        <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <p className="text-lg text-slate-400 font-medium group-hover:text-slate-200 transition-colors">{req}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team Info Placeholder */}
                    <div className="bg-white/5 border border-white/5 rounded-[3rem] p-8 md:p-16 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white uppercase italic">Work with the Best</h3>
                                <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl">
                                    Join a team of world-class scientists and clinical researchers dedicated to pushing the boundaries of health science. At MusB™ Research, your work directly contributes to improving lives.
                                </p>
                            </div>
                            <Link to="/about" className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-cyan-400 hover:gap-5 transition-all">
                                Learn about our mission <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR / CTA */}
                <div className="space-y-8">
                    <div id="apply-now" className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2.5rem] p-8 md:p-10 sticky top-32 shadow-2xl">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-white uppercase italic">Apply for this position</h3>
                            <p className="text-slate-400 font-medium text-sm">
                                Interested in joining our team? Send your resume and a brief cover letter to our recruitment team.
                            </p>

                            <div className="space-y-4 pt-4">
                                <a
                                    href="mailto:careers@musbresearch.com"
                                    className="flex items-center justify-center gap-3 w-full bg-cyan-500 text-slate-950 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                                >
                                    <Send className="w-5 h-5" /> Email Application
                                </a>
                                <div className="text-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Or apply via</span>
                                </div>
                                <button className="w-full bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                    LinkedIn
                                </button>
                            </div>

                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center pt-4">
                                MusB™ Research is an Equal Opportunity Employer
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
