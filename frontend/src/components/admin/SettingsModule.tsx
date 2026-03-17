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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-4xl sm:text-6xl font-black text-white italic uppercase tracking-tighter">
                        Global <span className="text-cyan-400">Settings</span>
                    </h2>
                    <p className="text-xs sm:text-base text-slate-500 font-black uppercase tracking-[0.3em] mt-4 italic">
                        System Configuration & Integration Architecture
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Main Settings Areas */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Search Settings */}
                    <div className="relative">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                        <input type="text" placeholder="Search system variables..." className="w-full bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] pl-20 pr-10 py-8 text-sm text-white outline-none focus:border-cyan-500/50 transition-all font-black uppercase tracking-[0.2em] placeholder:text-slate-700 shadow-xl"/>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { title: 'Platform Branding', desc: 'Logo, Colors, Typography', icon: Palette, color: 'text-pink-500' },
                            { title: 'Notification Engine', desc: 'Email, SMS, Dash Alerts', icon: Bell, color: 'text-orange-500' },
                            { title: 'Regional Standards', desc: 'Timezones, Units, Regulatory', icon: Globe, color: 'text-cyan-500' },
                            { title: 'Privacy & Security', desc: '2FA, Cookies, Audit Trail', icon: Shield, color: 'text-emerald-500' },
                            { title: 'User Management', desc: 'Profile Secrets, Keys', icon: UserCircle, color: 'text-indigo-500' },
                            { title: 'Advanced Engine', desc: 'Worker Queues, Cache', icon: Cpu, color: 'text-slate-500' },
                        ].map((s, i) => (
                            <div key={i} className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 group hover:border-white/10 transition-all cursor-pointer shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`p-5 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors`}>
                                        <s.icon className={`w-8 h-8 ${s.color}`} />
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-slate-800 group-hover:text-white transition-colors" />
                                </div>
                                <h4 className="text-base font-black text-white italic uppercase tracking-tight">{s.title}</h4>
                                <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mt-2 italic transform group-hover:translate-x-1 transition-transform">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integration Sidebar */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-12 space-y-10 shadow-2xl">
                        <h4 className="text-base font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                            <LinkIcon className="w-6 h-6 text-indigo-400" />
                            Active <span className="text-indigo-400">Pipes</span>
                        </h4>
                        
                        <div className="space-y-8">
                            {[
                                { name: 'Google Cloud Platform', status: 'Connected', icon: Database },
                                { name: 'Resend Email API', status: 'Connected', icon: Mail },
                                { name: 'MongoDB Altas', status: 'Healthy', icon: RefreshCcw },
                            ].map((pipe, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <pipe.icon className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase italic tracking-wider">{pipe.name}</p>
                                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mt-2 leading-none">Version 2.4.x</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-[0_0_10px_#10b981]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] space-y-6 shadow-inner">
                            <p className="text-xs font-black text-indigo-400 uppercase italic tracking-tight">API Infrastructure Core</p>
                            <p className="text-xs text-slate-500 leading-relaxed font-black uppercase tracking-[0.2em] italic">All systems are currently routing through the primary AWS-managed gateway.</p>
                            <button className="w-full py-5 bg-white/5 border border-white/10 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:text-white hover:bg-white/10 transition-all italic shadow-xl">Regenerate Master Key</button>
                        </div>
                    </div>

                    <button className="w-full py-8 bg-white/10 border border-white/10 text-white rounded-[4rem] font-black text-xs sm:text-sm uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all italic shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
                        Purge Application Cache
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
