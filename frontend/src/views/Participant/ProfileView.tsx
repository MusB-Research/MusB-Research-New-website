import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, Edit2, User, Mail, Phone, MapPin, Clock, Globe, 
    Bell, ShieldCheck, Lock, Shield, Zap, Sparkles, AlertCircle 
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';

const ProfileView = ({ 
    userName, userEmail, userPicture, initials, userPhone, 
    userLocation, userTimezone, notificationSettings, 
    toggleNotification, onAction 
}: any) => {
    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase italic">Clinical Identity Hub</h2>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Securely manage your participant profile and communication conduits.
                    </p>
                </div>
                <div className="flex bg-[#0a101f] border border-[#00e676]/20 px-6 py-4 rounded-2xl items-center gap-4 group cursor-help transition-all hover:bg-[#00e676]/5">
                    <ShieldCheck className="w-5 h-5 text-[#00e676]" />
                    <div className="flex flex-col">
                        <span className="text-[12px] font-black text-[#00e676] uppercase tracking-widest italic">Identity Protected</span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1 italic">AES-256 Encrypted Profile Node</span>
                    </div>
                </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* 1. IDENTITY CARD (COL-SPAN 4) */}
                <Card className="lg:col-span-4 p-0 bg-[#0a101f] border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="h-40 bg-gradient-to-br from-cyan-600 via-indigo-600 to-indigo-900 group-hover:scale-105 transition-transform duration-700" />
                    <div className="px-10 pb-10 relative -mt-20">
                        <div className="relative inline-block group/photo">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-[#0d1424] border-[10px] border-[#0a101f] flex items-center justify-center text-white font-black text-5xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                {userPicture ? <img src={userPicture} alt="profile" className="w-full h-full object-cover transition-transform group-hover/photo:scale-110" /> : initials}
                            </div>
                            <button
                                onClick={() => onAction('Change Photo')}
                                className="absolute bottom-4 right-4 p-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl shadow-xl transform hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/photo:opacity-100"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">{userName}</h3>
                                <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest italic flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Study Participant
                                </p>
                            </div>
                            <button onClick={() => onAction('Edit Profile')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-6 mt-12 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 hover:border-cyan-500/20 transition-all">
                            <div className="flex items-center gap-4">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Clinical Email Address</p>
                                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{userEmail || 'UNLINKED'}</p>
                                </div>
                                <button onClick={() => onAction('Edit Email')} className="text-[12px] font-black text-cyan-400 hover:text-white transition-colors">EDIT</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <Phone className="w-4 h-4 text-slate-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Secure Phone Tether</p>
                                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{userPhone || 'NOT PROVIDED'}</p>
                                </div>
                                <button onClick={() => onAction('Edit Phone')} className="text-[12px] font-black text-cyan-400 hover:text-white transition-colors">EDIT</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Registered Site Location</p>
                                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{userLocation || 'REMOTE ENROLLMENT'}</p>
                                </div>
                                <button onClick={() => onAction('Edit Location')} className="text-[12px] font-black text-cyan-400 hover:text-white transition-colors">EDIT</button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. REGIONAL & PREFERENCES (COL-SPAN 8) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Timezone & Core Config */}
                    <Card className="p-10 bg-[#0a101f] border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] italic">Localization Matrix</h3>
                            <Badge color="cyan">Active Session</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:bg-white/[0.05]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                                    <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">Research Timezone</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-black text-white italic uppercase tracking-tighter">{userTimezone || 'UTC'}</span>
                                    <button onClick={() => onAction('Edit Timezone')} className="text-sm font-bold text-cyan-400 group-hover:text-white transition-colors">SYNC</button>
                                </div>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:bg-white/[0.05]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-cyan-700/10 text-cyan-400 rounded-xl flex items-center justify-center"><Globe className="w-5 h-5" /></div>
                                    <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Region</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-black text-white italic uppercase tracking-tighter">North America Core</span>
                                    <span className="text-[12px] font-black bg-[#00e676]/10 text-[#00e676] px-2 py-0.5 rounded border border-[#00e676]/20 italic">OPTIMAL</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Notification Control Panel */}
                    <Card className="p-10 bg-[#0a101f] border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <Bell className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.25em] italic">Communication Conduits</h3>
                            </div>
                            <p className="text-[11px] font-black text-[#00e676] uppercase tracking-[0.2em] italic underline underline-offset-8 decoration-emerald-500/30 shadow-glow">Active Delivery Channels (5/5)</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: 'push', label: 'Push Hub Notifications', desc: 'Clinical protocol alerts and visit reminders.', icon: Bell },
                                { key: 'email', label: 'Email Clinical Relay', desc: 'Lab report summaries and study announcements.', icon: Mail },
                                { key: 'sms', label: 'SMS Response Unit', desc: 'Two-factor secure authentication and urgent pings.', icon: Phone },
                            ].map((topic: any) => (
                                <div key={topic.key} className="flex items-center justify-between p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-3xl border border-white/[0.03] group hover:border-cyan-500/20">
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 h-12 rounded-2xl bg-[#0d1424] flex items-center justify-center text-slate-600 transition-all group-hover:text-cyan-400 border border-white/5">
                                            <topic.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter mb-1">{topic.label}</h4>
                                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest italic">{topic.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification(topic.key)}
                                        className={`w-14 h-8 rounded-full transition-all relative p-1.5 focus:outline-none ${notificationSettings[topic.key] ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-800'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-lg ${notificationSettings[topic.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Security & Access Management */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <Card className="p-10 bg-[#0a101f] border-white/5 group hover:border-cyan-500/30 transition-all">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-cyan-700/10 text-cyan-400 rounded-xl"><Lock className="w-5 h-5" /></div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Access Protocol</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10 leading-relaxed italic pr-6 italic">Securely rotate your clinical credentials and reset password nodes.</p>
                            <button className="w-full py-4 bg-white/5 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-black text-[12px] uppercase tracking-widest rounded-xl transition-all italic border border-white/10 group-hover:bg-cyan-500 shadow-xl shadow-transparent group-hover:shadow-cyan-500/20 active:scale-95">UPDATE CREDENTIALS</button>
                        </Card>
                         <Card className="p-10 bg-red-500/5 border-red-500/20 group hover:border-red-500/40 transition-all">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Shield className="w-5 h-5" /></div>
                                <h3 className="text-sm font-black text-red-400 uppercase tracking-widest italic">Safety Withdrawal</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10 leading-relaxed italic pr-6">Initiate immediate study withdrawal and clinical data removal protocol.</p>
                            <button onClick={() => onAction('Withdraw from Study')} className="w-full py-4 bg-transparent border-2 border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 font-black text-[12px] uppercase tracking-widest rounded-xl transition-all">WITHDRAW PROTOCOL</button>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer Aesthetic Note */}
            <div className="flex justify-center flex-col items-center gap-10 mt-10 opacity-30 cursor-default group pb-10">
                <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center gap-6">
                    <Zap className="w-6 h-6 text-cyan-400 transition-transform group-hover:rotate-12" />
                    <Sparkles className="w-6 h-6 text-[#00e676] transition-transform group-hover:scale-125" />
                    <AlertCircle className="w-6 h-6 text-indigo-400 transition-transform group-hover:-rotate-12" />
                </div>
                <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Institutional Cryptographic Core Verified</p>
            </div>
        </div>
    );
};

export default ProfileView;
