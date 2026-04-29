import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ConsortiumNavBarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function ConsortiumNavBar({ activeTab, setActiveTab }: ConsortiumNavBarProps) {
    const tabs = [
        { id: 'about', label: 'About' },
        { id: 'trial', label: 'Trial' },
        { id: 'investigators', label: 'Investigators' },
        { id: 'events', label: 'Events' },
        { id: 'contacts', label: 'Contacts' }
    ];

    return (
        <nav className="sticky top-0 z-40 w-full bg-[#020617] border-b border-white/5 py-4">
            <div className="max-w-[1700px] mx-auto px-6 flex items-center justify-between">
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="h-12 bg-black rounded-xl overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-all">
                        <img src="/logo.jpg" alt="MusB" className="h-full w-auto object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">MusB™ Research</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500 group-hover:text-cyan-400 transition-colors">MELLOW Consortium</span>
                    </div>
                </Link>

                {/* Tabs */}
                <div className="flex items-center gap-2 md:gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Placeholder for balance on desktop */}
                <div className="w-40 hidden lg:block"></div>
            </div>
        </nav>
    );
}
