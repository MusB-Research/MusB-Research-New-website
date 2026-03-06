import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Microscope, Users, Search } from 'lucide-react';

export default function About() {
    const aboutOptions = [
        {
            title: 'Why Choose MusB Research',
            description: 'Discover what sets us apart in healthcare research and clinical excellence.',
            icon: Building2,
            path: '/why-choose-us',
            color: 'purple'
        },
        {
            title: 'Facilities',
            description: 'Explore our state-of-the-art research facilities and infrastructure.',
            icon: Microscope,
            path: '/facilities',
            color: 'indigo'
        },
        {
            title: 'Our Team',
            description: 'Meet the world-class scientists and experts leading our research.',
            icon: Users,
            path: '/team',
            color: 'violet'
        },
        {
            title: 'Find a Study',
            description: 'Join a clinical research study and contribute to advancing health science.',
            icon: Search,
            path: '/trials',
            color: 'purple'
        }
    ];

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03)_0%,transparent_100%)]"></div>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center py-20 px-6">
                <div className="max-w-6xl mx-auto w-full">
                    {/* Header */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 font-bold text-xs tracking-widest uppercase mb-8">
                            <Building2 className="w-4 h-4" /> About MusB™ Research
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
                            Learn More <span className="text-purple-400">About Us</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 font-medium max-w-3xl mx-auto">
                            Explore our research capabilities, facilities, team, and opportunities to participate in clinical studies.
                        </p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {aboutOptions.map((option, index) => {
                            const Icon = option.icon;
                            return (
                                <Link
                                    key={index}
                                    to={option.path}
                                    className="group relative p-8 md:p-12 rounded-[3rem] bg-white/5 border-2 border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-500 overflow-hidden"
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    <div className="relative space-y-6">
                                        {/* Icon */}
                                        <div className="w-20 h-20 rounded-2xl bg-purple-400/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-400 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-500">
                                            <Icon className="w-10 h-10" />
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-3">
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors">
                                                {option.title}
                                            </h3>
                                            <p className="text-slate-400 font-medium leading-relaxed text-lg">
                                                {option.description}
                                            </p>
                                        </div>

                                        {/* Arrow indicator */}
                                        <div className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-widest">
                                            <span>Learn More</span>
                                            <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
