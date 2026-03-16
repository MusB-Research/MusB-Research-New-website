import React from 'react';
import { motion } from 'framer-motion';
import { 
    Settings, 
    Globe, 
    Bell, 
    Shield, 
    Link as LinkIcon, 
    Palette, 
    Database, 
    Mail, 
    CheckCircle2, 
    ChevronRight,
    Search,
    UserCircle,
    Cpu,
    RefreshCcw
} from 'lucide-react';

export default function SettingsModule() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Global <span className="text-cyan-400">Settings</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        System Configuration & Integration Architecture
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Main Settings Areas */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Search Settings */}
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input type="text" placeholder="Search system variables..." className="w-full bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 text-xs text-white outline-none focus:border-cyan-500/50 transition-all font-bold uppercase tracking-widest placeholder:text-slate-700"/>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: 'Platform Branding', desc: 'Logo, Colors, Typography', icon: Palette, color: 'text-pink-500' },
                            { title: 'Notification Engine', desc: 'Email, SMS, Dash Alerts', icon: Bell, color: 'text-orange-500' },
                            { title: 'Regional Standards', desc: 'Timezones, Units, Regulatory', icon: Globe, color: 'text-cyan-500' },
                            { title: 'Privacy & Security', desc: '2FA, Cookies, Audit Trail', icon: Shield, color: 'text-emerald-500' },
                            { title: 'User Management', desc: 'Profile Secrets, Keys', icon: UserCircle, color: 'text-indigo-500' },
                            { title: 'Advanced Engine', desc: 'Worker Queues, Cache', icon: Cpu, color: 'text-slate-500' },
                        ].map((s, i) => (
                            <div key={i} className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 group hover:border-white/10 transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-4 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors`}>
                                        <s.icon className={`w-6 h-6 ${s.color}`} />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-800" />
                                </div>
                                <h4 className="text-sm font-black text-white italic uppercase tracking-tight">{s.title}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integration Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <LinkIcon className="w-5 h-5 text-indigo-400" />
                            Active <span className="text-indigo-400">Pipes</span>
                        </h4>
                        
                        <div className="space-y-6">
                            {[
                                { name: 'Google Cloud Platform', status: 'Connected', icon: Database },
                                { name: 'Resend Email API', status: 'Connected', icon: Mail },
                                { name: 'MongoDB Altas', status: 'Healthy', icon: RefreshCcw },
                            ].map((pipe, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            <pipe.icon className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase italic">{pipe.name}</p>
                                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">Version 2.4.x</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-4">
                            <p className="text-[10px] font-black text-indigo-400 uppercase italic tracking-tight">API Infrastructure</p>
                            <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest italic">All systems are currently routing through the primary AWS-managed gateway.</p>
                            <button className="w-full py-4 bg-white/5 border border-white/10 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Regenerate Master Key</button>
                        </div>
                    </div>

                    <button className="w-full py-6 bg-white/10 border border-white/10 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all italic shadow-xl shadow-black/20">
                        Purge Application Cache
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
