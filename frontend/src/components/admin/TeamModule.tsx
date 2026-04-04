import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Shield, 
    Building2, 
    UserIcon, 
    Search, 
    Plus, 
    Loader2,
    Activity
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

import PIsManagement from './PIsManagement';
import CoordinatorsManagement from './CoordinatorsManagement';
import SponsorsManagement from './SponsorsManagement';
import ParticipantsManagement from './ParticipantsManagement';

type TeamTab = 'PI' | 'COORDINATOR' | 'SPONSOR' | 'PARTICIPANT';

export default function TeamModule() {
    const [activeTab, setActiveTab] = useState<TeamTab>('PI');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allStudies, setAllStudies] = useState<any[]>([]);
    const [allParticipants, setAllParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = API || 'http://localhost:8000';
            const [usersRes, studiesRes, participantsRes] = await Promise.all([
                authFetch(`${apiUrl}/api/users/`),
                authFetch(`${apiUrl}/api/studies/`),
                authFetch(`${apiUrl}/api/participants/`)
            ]);

            if (usersRes.ok) setAllUsers(await usersRes.json());
            if (studiesRes.ok) setAllStudies(await studiesRes.json());
            if (participantsRes.ok) setAllParticipants(await participantsRes.json());
        } catch (err) {
            console.error('Failed to fetch team data:', err);
            setError('Data synchronization failed. Terminal offline.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const tabs = [
        { id: 'PI', label: 'Principal Investigators', icon: Shield, color: 'text-indigo-400' },
        { id: 'COORDINATOR', label: 'Staff Coordinators', icon: Users, color: 'text-emerald-400' },
        { id: 'SPONSOR', label: 'Research Sponsors', icon: Building2, color: 'text-cyan-400' },
        { id: 'PARTICIPANT', label: 'Study Participants', icon: UserIcon, color: 'text-pink-400' },
    ];

    if (loading && allUsers.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Synchronizing Neural Personnel Registry...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Tab Navigation */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="bg-white/5 p-2 rounded-3xl border border-white/10 flex flex-wrap gap-2 backdrop-blur-2xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TeamTab)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-slate-950 shadow-2xl' 
                                : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-slate-950' : tab.color}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl relative overflow-hidden group">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic font-mono relative z-10">
                        {allUsers.length + allParticipants.length} Verified Nodes Online
                     </span>
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-6">
                    <Activity className="w-8 h-8 text-red-500" />
                    <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-widest leading-none">System Critical Interrupt</p>
                        <p className="text-[10px] text-red-500/60 font-black uppercase tracking-widest mt-2">{error}</p>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {activeTab === 'PI' && (
                    <PIsManagement 
                        allUsers={allUsers} 
                        allStudies={allStudies} 
                        onRefresh={fetchData} 
                        onViewUser={(u) => console.log('Viewing PI', u)} 
                        onRegister={() => console.log('Registering PI')}
                    />
                )}
                {activeTab === 'COORDINATOR' && (
                    <CoordinatorsManagement 
                        allUsers={allUsers} 
                        allStudies={allStudies} 
                        onRefresh={fetchData} 
                        onViewUser={(u) => console.log('Viewing Coordinator', u)} 
                        onRegister={() => console.log('Registering Coordinator')}
                    />
                )}
                {activeTab === 'SPONSOR' && (
                    <SponsorsManagement 
                        allUsers={allUsers} 
                        allStudies={allStudies} 
                        onRefresh={fetchData} 
                    />
                )}
                {activeTab === 'PARTICIPANT' && (
                    <ParticipantsManagement 
                        allParticipants={allParticipants} 
                        allStudies={allStudies} 
                        onRefresh={fetchData} 
                        onViewUser={(u) => console.log('Viewing Participant', u)} 
                        onRegister={() => console.log('Registering Participant')}
                    />
                )}
            </motion.div>
        </div>
    );
}
