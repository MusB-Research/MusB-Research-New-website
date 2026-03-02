import React, { useState, useEffect } from 'react';
import { Linkedin, ChevronDown, ChevronUp, Building2, Users, Stethoscope, Briefcase, Handshake, Activity, FileText } from 'lucide-react';
import { fetchTeamMembers, fetchAdvisors, fetchCollaborators, fetchStaffMembers, fetchPartners } from '@/api';

const TeamMemberCard = ({ member }: { member: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group bg-white/5 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/10 overflow-hidden hover:border-cyan-400/50 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left flex-1 min-h-[460px]">
                {/* Headshot */}
                <div className="flex-shrink-0 relative">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        {member.image ? (
                            <img
                                src={member.image}
                                alt={member.name}
                                className={`w-full h-full object-cover ${member.name.includes('Shalini') ? 'object-[50%_35%]' : member.name.includes('Hariom') ? 'object-[50%_25%]' : ''}`}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
                                <Users className="w-12 h-12 text-slate-700 mb-2" />
                                <span className="text-slate-400 font-black text-4xl">{member.name.charAt(0)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="w-full space-y-4">
                    <div className="space-y-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h3 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">{member.name}</h3>
                            {member.linkedin_url && (
                                <a
                                    href={member.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/5 rounded-lg border border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all self-center md:self-auto"
                                    aria-label="LinkedIn Profile"
                                >
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                        <p className="text-cyan-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> {member.role}
                        </p>
                    </div>

                    <p className="text-slate-400 text-base leading-relaxed line-clamp-3">{member.bio}</p>

                    {/* Expertise Tags */}
                    {member.expertise_tags && (
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {member.expertise_tags.slice(0, 4).map((tag: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-2.5 py-1 text-[10px] font-black bg-cyan-400/10 text-cyan-400 rounded-lg border border-cyan-400/20 uppercase tracking-tighter"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Accordion Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 transition-colors border-t border-white/10 group cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/5 text-slate-500 group-hover:text-cyan-400'}`}>
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">
                        {isOpen ? 'Close Full Bio' : 'View Full Bio & Publications'}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-cyan-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                )}
            </button>

            {/* Expanded Content */}
            {isOpen && (
                <div className="p-8 md:p-10 bg-black/20 border-t border-white/5 space-y-10 animate-in slide-in-from-top-2 duration-300">
                    {/* Expanded Bio Text */}
                    {member.expanded_bio && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400/50">Professional Background</h4>
                            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm lg:text-base">
                                <p className="whitespace-pre-line">{member.expanded_bio}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-10">
                        {/* Areas of Expertise */}
                        {member.areas_of_expertise && member.areas_of_expertise.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                                    <Activity className="w-4 h-4" /> Expertise
                                </h4>
                                <ul className="space-y-2.5">
                                    {member.areas_of_expertise.map((area: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-400 text-xs lg:text-sm font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 mt-1.5 flex-shrink-0"></div>
                                            {area}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Affiliations */}
                        {member.affiliations && member.affiliations.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                                    <Building2 className="w-4 h-4" /> Affiliations
                                </h4>
                                <ul className="space-y-2.5">
                                    {member.affiliations.map((aff: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-400 text-xs lg:text-sm font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 mt-1.5 flex-shrink-0"></div>
                                            {aff}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Publications */}
                    {member.publications && member.publications.length > 0 && (
                        <div className="space-y-6 pt-8 border-t border-white/10">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                                <FileText className="w-4 h-4" /> Key Publications
                            </h4>
                            <div className="grid gap-4">
                                {member.publications.map((pub: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <span className="text-cyan-500/30 font-black text-xl leading-none">0{idx + 1}</span>
                                        <p className="text-slate-400 text-xs lg:text-sm italic leading-relaxed">{pub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AdvisorCard = ({ advisor }: { advisor: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group bg-white/5 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/10 overflow-hidden hover:border-indigo-400/50 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col h-full">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start flex-1">
                {/* Left Side: Portrait Image */}
                <div className="flex-shrink-0 relative">
                    <div className="w-40 h-52 md:w-44 md:h-56 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        {advisor.image ? (
                            <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
                                <Users className="w-10 h-10 text-slate-700 mb-2" />
                                <span className="text-slate-400 font-black text-3xl">{advisor.name.charAt(0)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="w-full space-y-4 text-center md:text-left">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white leading-tight tracking-tight uppercase whitespace-pre-line">{advisor.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 leading-tight">
                            {advisor.advisory_role}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5 text-left">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Expertise</span>
                            <span className="px-3 py-1 text-[10px] font-black bg-indigo-400/10 text-indigo-400 rounded-lg border border-indigo-400/20 uppercase tracking-tight inline-block">
                                {advisor.expertise_area}
                            </span>
                        </div>

                        {advisor.organization && (
                            <div className="space-y-1.5 text-left">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Organization</span>
                                <p className="text-sm text-slate-300 font-bold tracking-tight">{advisor.organization}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Accordion Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 transition-colors border-t border-white/10 group cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-400/20 text-indigo-400' : 'bg-white/5 text-slate-500 group-hover:text-indigo-400'}`}>
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors text-sm">
                        {isOpen ? 'Close Bio' : 'View Profile & Bio'}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-indigo-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                )}
            </button>

            {/* Expanded Content */}
            {isOpen && (
                <div className="p-8 bg-black/20 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm">
                        <p className="whitespace-pre-line">{advisor.bio}</p>
                    </div>

                    {advisor.linkedin_url && (
                        <div className="pt-2 flex justify-start">
                            <a
                                href={advisor.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                                <Linkedin className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-widest">LinkedIn Profile</span>
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function Team() {
    // Removed expandedBios, expandedAdvisors state - now handled internally in cards
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [advisors, setAdvisors] = useState<any[]>([]);
    const [clinicalCollaborators, setClinicalCollaborators] = useState<any[]>([]);
    const [staffMembers, setStaffMembers] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);

    // Fetch all team data from backend
    useEffect(() => {
        fetchTeamMembers().then((data: any[]) => { if (data.length) setTeamMembers(data as any); }).catch(() => { });
        fetchAdvisors().then((data: any[]) => { if (data.length) setAdvisors(data as any); }).catch(() => { });
        fetchCollaborators().then((data: any[]) => { if (data.length) setClinicalCollaborators(data as any); }).catch(() => { });
        fetchStaffMembers().then((data: any[]) => { if (data.length) setStaffMembers(data as any); }).catch(() => { });
        fetchPartners().then((data: any[]) => { if (data.length) setPartners(data as any); }).catch(() => { });
    }, []);

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* ... Background & Hero ... */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Title + Intro */}
                        <div className="space-y-8 text-left max-w-2xl">
                            <div className="space-y-4">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-bold tracking-wider uppercase">
                                    Scientific Leadership
                                </span>
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[0.9]">
                                    Our <span className="text-cyan-400">Team</span>
                                </h1>
                            </div>

                            <div className="space-y-6 text-xl md:text-2xl text-slate-300 font-medium leading-relaxed">
                                <p>A multidisciplinary team of scientists, clinicians, and professionals dedicated to advancing translational and clinical research.</p>
                                <p className="text-slate-400 border-l-4 border-cyan-400/30 pl-6 italic">Built on academic rigor, regulatory excellence, and community engagement.</p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm font-bold text-slate-400">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                    Multidisciplinary
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm font-bold text-slate-400">
                                    <Activity className="w-4 h-4 text-cyan-400" />
                                    Evidence-Driven
                                </div>
                            </div>
                        </div>

                        {/* Right: Subtle visual element */}
                        <div className="relative hidden lg:block">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-[3rem] blur-3xl opacity-50 animate-pulse"></div>
                            <div className="relative aspect-square rounded-[3rem] border-2 border-white/10 overflow-hidden shadow-2xl group">
                                <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors duration-700"></div>
                                <img
                                    src="/api/placeholder/800/800"
                                    alt="Scientific Team Visual"
                                    className="w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-40 h-40 border border-cyan-400/20 rounded-full flex items-center justify-center animate-spin-slow">
                                        <div className="w-32 h-32 border border-indigo-400/20 rounded-full flex items-center justify-center animate-reverse-spin">
                                            <div className="w-24 h-24 border border-purple-400/20 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 p-6 backdrop-blur-md bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-400/20 flex items-center justify-center text-cyan-400">
                                            <Stethoscope className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">Expert-Led</p>
                                            <p className="text-slate-400 text-sm">Regulatory Excellence</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 1: Leadership & Scientific Team */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                Leadership <span className="text-cyan-400">&</span> Scientific Team
                            </h2>
                            <p className="text-slate-400 text-xl max-w-2xl font-medium">
                                Expert authority established through decades of clinical rigor and scientific innovation. Ideal for sponsors, CROs, and regulators.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-xs h-fit bg-white/5 px-6 py-3 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                            Featured Profiles
                        </div>
                    </div>

                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {teamMembers.map((member, index) => (
                            <TeamMemberCard key={index} member={member} />
                        ))}
                        {teamMembers.length < 2 && [1, 2].slice(teamMembers.length).map((_, idx) => (
                            <TeamMemberCard
                                key={`placeholder-${idx}`}
                                member={{
                                    name: "Next Team Member",
                                    role: "Scientific Leadership Role",
                                    bio: "This is a placeholder for a professional bio. Once content is provided, this card will reflect the expertise and background of your team leader.",
                                    expertise_tags: ["Expertise A", "Expertise B", "Expertise C"],
                                    areas_of_expertise: ["Area 1", "Area 2"],
                                    affiliations: ["Affiliation 1"],
                                    publications: ["Sample Publication Title"]
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 2: Advisors */}
            <section className="relative z-10 py-20 px-6 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                Advisory <span className="text-indigo-400">Board</span>
                            </h2>
                            <p className="text-slate-400 text-xl max-w-2xl font-medium">
                                Industry leaders and domain experts providing strategic guidance for global research excellence.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-xs h-fit bg-white/5 px-6 py-3 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                            Strategic Counsel
                        </div>
                    </div>

                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                        {advisors.length > 0 ? (
                            advisors.map((advisor, index) => (
                                <AdvisorCard key={index} advisor={advisor} />
                            ))
                        ) : (
                            [
                                { name: "Dr. Paolo Binetti", org: "VitaDAO / LongGame" },
                                { name: "Douglas Lynch", org: "MarketWell Nutrition" },
                                { name: "NAGENDRA\nRANGAVAJLA Ph.D., FACN", org: "Expert Consultant" },
                                { name: "Sean M. Garvey, Ph.D", org: "Strategic Advisor" },
                                { name: "Strategic Advisor", org: "Pending Content" }
                            ].map((place, idx) => (
                                <AdvisorCard
                                    key={idx}
                                    advisor={{
                                        name: place.name,
                                        advisory_role: "Business Development Advisory Board Member",
                                        expertise_area: "Business Development & Strategy",
                                        organization: place.org,
                                        bio: "This is a placeholder for a professional advisor bio. Once content is provided, this card will reflect the strategic guidance and industry expertise of our board members."
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* SECTION 3: Clinical Collaborators */}
            <section className="relative z-10 py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            Clinical Collaborators
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6">
                        {clinicalCollaborators.map((collaborator) => (
                            <div
                                key={collaborator.id}
                                className="group bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border-2 border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] text-center"
                            >
                                {/* Logo Placeholder */}
                                <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                    {collaborator.logo ? (
                                        <img src={collaborator.logo} alt={collaborator.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-purple-400" />
                                    )}
                                </div>

                                {/* Name & Specialty */}
                                <h3 className="text-lg font-black text-white leading-tight mb-2">{collaborator.name}</h3>
                                <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">{collaborator.specialty}</p>
                                {collaborator.location && (
                                    <p className="text-xs text-slate-400 font-medium">{collaborator.location}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 4: Staff */}
            <section className="relative z-10 py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            Staff
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {staffMembers.map((staff, index) => (
                            <div
                                key={staff.id}
                                className={`group bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border-2 border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ${index === 8 ? 'lg:col-start-2' : ''}`}
                            >


                                {/* Name & Role */}
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-black text-white leading-tight">{staff.name}</h3>
                                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">{staff.role}</p>
                                    <p className="text-xs text-slate-500 font-semibold">{staff.department}</p>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed pt-2">{staff.role_description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 5: Sponsors */}
            <section className="relative z-10 py-8 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">

                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            Sponsors
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {partners.map((partner) => (
                            <div
                                key={partner.id}
                                className="group bg-white/5 backdrop-blur-xl rounded-[1.5rem] p-6 border-2 border-white/10 hover:border-indigo-400/50 hover:bg-white/10 transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center"
                            >
                                {/* Logo Placeholder */}
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                    {partner.logo ? (
                                        <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Handshake className="w-8 h-8 text-indigo-400" />
                                    )}
                                </div>

                                {/* Partner Name */}
                                <h3 className="text-sm font-bold text-white leading-tight mb-2">{partner.name}</h3>

                                {/* Category Tag */}
                                {partner.category && (
                                    <span className="px-2 py-1 text-xs font-bold bg-indigo-400/10 text-indigo-400 rounded-full border border-indigo-400/20">
                                        {partner.category}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
