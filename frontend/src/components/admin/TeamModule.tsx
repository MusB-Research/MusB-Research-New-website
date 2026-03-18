import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    ShieldCheck, 
    Mail, 
    MoreHorizontal, 
    Plus, 
    Search,
    Shield,
    Clock,
    UserPlus,
    CheckCircle2,
    Lock
} from 'lucide-react';

interface TeamMember {
    name: string;
    role: string;
    email: string;
    status: string;
    lastLogin: string;
}

interface TeamModuleProps {
    team?: any[];
    onRefresh?: () => void;
}

export default function TeamModule({ team = [], onRefresh }: TeamModuleProps) {
    const displayTeam: TeamMember[] = team.length > 0 ? team.map(u => ({
        name: u.full_name || u.name || 'Personnel Instance',
        role: u.role || 'Staff',
        email: u.email,
        status: u.is_active === false ? 'INACTIVE' : 'ACTIVE',
        lastLogin: u.last_login_formatted || 'Recently'
    })) : [
        { name: 'Dr. Emily Vance', role: 'Super Admin', email: 'e.vance@musbresearch.com', status: 'ACTIVE', lastLogin: '12m ago' },
        { name: 'Sarah Zhang', role: 'Study Coordinator', email: 's.zhang@clinical.org', status: 'ACTIVE', lastLogin: '2h ago' },
        { name: 'Mike Ross', role: 'CRA', email: 'm.ross@sponsor.com', status: 'INACTIVE', lastLogin: '3 days ago' },
        { name: 'James Wilson', role: 'Principal Investigator', email: 'j.wilson@site01.edu', status: 'ACTIVE', lastLogin: '5m ago' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Team <span className="text-cyan-400">& RBAC</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Access Control & Clinical Personnel Management
                    </p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={onRefresh}
                        className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic"
                    >
                         <Clock className="w-4 h-4" /> Refresh Sync
                    </button>
                    <button className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <UserPlus className="w-4 h-4" /> Provision Access
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Team Directory */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10">
                        <div className="flex items-center justify-between mb-10">
                             <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <Users className="w-5 h-5 text-cyan-400" />
                                Personnel <span className="text-cyan-400">Directory</span>
                             </h3>
                             <div className="relative">
                                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                 <input type="text" placeholder="Search team..." className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-[10px] text-white outline-none focus:border-cyan-500/50 transition-all w-64 font-bold uppercase tracking-widest"/>
                             </div>
                        </div>

                        <div className="divide-y divide-white/5">
                            {displayTeam.map((user, i) => (
                                <div key={i} className="flex items-center justify-between py-8 px-6 hover:bg-white/5 transition-all rounded-[2.5rem] group cursor-pointer -mx-4 group border border-transparent hover:border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{user.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <Mail className="w-3 h-3 text-slate-700" />
                                                <span className="text-[10px] font-bold text-slate-500 lowercase tracking-widest">{user.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="hidden md:block">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 ${
                                                user.role?.includes('Admin') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-500'
                                            }`}>
                                                <Shield className="w-3 h-3" /> {user.role}
                                            </span>
                                        </div>
                                        <div className="hidden md:block text-right">
                                            <p className="text-[11px] font-black text-slate-300 uppercase italic tracking-tighter flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> {user.lastLogin}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Last Active</p>
                                        </div>
                                        <div className={`px-5 py-2 rounded-full border transition-all ${
                                            user.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                        </div>
                                        <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-700 hover:text-white transition-all">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Role Definitions */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-indigo-400" />
                            Role <span className="text-indigo-400">Governance</span>
                        </h4>
                        <div className="space-y-4">
                            {[
                                { name: 'Admin', users: team.filter(u => u.role?.includes('ADMIN')).length || 1, icon: Shield },
                                { name: 'Coordinator', users: team.filter(u => u.role === 'COORDINATOR').length || 0, icon: Users },
                                { name: 'Sponsor', users: team.filter(u => u.role === 'SPONSOR').length || 0, icon: Mail },
                            ].map((role, i) => (
                                <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] group hover:border-indigo-500/30 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between mb-4">
                                        <role.icon className="w-6 h-6 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{role.users} Active</span>
                                    </div>
                                    <p className="text-sm font-black text-white italic uppercase tracking-tight">{role.name}</p>
                                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">Full System Read/Write</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all italic">Role Schema Editor</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
