import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, Edit2, User, Mail, Phone, MapPin, Clock, Globe, 
    Bell, ShieldCheck, Lock, Shield, Zap, Sparkles, AlertCircle 
} from 'lucide-react';
import { Card, Badge, Skeleton, SkeletonCircle, SkeletonText } from './SharedComponents';

const ProfileView = ({ 
    userName, userEmail, userPicture, initials, userPhone, 
    userLocation, userTimezone, notificationSettings, 
    toggleNotification, onAction,
    isLoading = false
}: any) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-10 max-w-[1500px]">
                <div className="flex justify-between items-end">
                    <div className="space-y-4">
                        <SkeletonText width="w-48" height="h-8" />
                        <SkeletonText width="w-72" height="h-4" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <Skeleton className="lg:col-span-4 h-[600px]" />
                    <div className="lg:col-span-8 space-y-8">
                        <Skeleton className="h-96" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Skeleton className="h-48" />
                            <Skeleton className="h-48" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 max-w-[1500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase italic">Your Profile</h2>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Manage your account information and contact preferences.
                    </p>
                </div>
                <div className="flex bg-[#0a101f] border border-amber-500/20 px-6 py-4 rounded-2xl items-center gap-4 group cursor-help transition-all hover:bg-amber-500/5">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <div className="flex flex-col">
                        <span className="text-[12px] font-black text-amber-500 uppercase tracking-widest italic leading-none">Private and Secure</span>
                        <span className="text-[12px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1.5 leading-none italic">Encrypted Session</span>
                    </div>
                </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* 1. IDENTITY CARD (COL-SPAN 4) */}
                <Card className="lg:col-span-4 p-0 bg-[#0a101f] border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="h-40 bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950 group-hover:scale-105 transition-transform duration-700" />
                    <div className="px-10 pb-10 relative -mt-20">
                        <div className="relative inline-block group/photo">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-[#0d1424] border-[10px] border-[#0a101f] flex items-center justify-center text-white font-black text-5xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                {userPicture ? <img src={userPicture} alt="profile" className="w-full h-full object-cover transition-transform group-hover/photo:scale-110" /> : initials}
                            </div>
                            <button
                                onClick={() => onAction('Change Photo')}
                                className="absolute bottom-4 right-4 p-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-xl transform hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/photo:opacity-100"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">{userName}</h3>
                                <p className="text-[12px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Verified Study Participant
                                </p>
                            </div>
                            <button onClick={() => onAction('Edit Profile')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-6 mt-12 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 hover:border-amber-500/20 transition-all">
                            <div className="flex items-center gap-4">
                                <Mail className="w-4 h-4 text-slate-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Email Address</p>
                                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{userEmail || 'UNLINKED'}</p>
                                </div>
                                <button onClick={() => onAction('Edit Email')} className="text-[12px] font-black text-amber-500 hover:text-white transition-colors">EDIT</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <Phone className="w-4 h-4 text-slate-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Phone Number</p>
                                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{userPhone || 'NOT PROVIDED'}</p>
                                </div>
                                <button onClick={() => onAction('Edit Phone')} className="text-[12px] font-black text-amber-500 hover:text-white transition-colors">EDIT</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <MapPin className="w-4 h-4 text-slate-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic mb-0.5">Clinical Site</p>
                                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{userLocation || 'REMOTE ENROLLMENT'}</p>
                                </div>
                                <button onClick={() => onAction('Edit Location')} className="text-[12px] font-black text-amber-500 hover:text-white transition-colors">EDIT</button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. REGIONAL & PREFERENCES (COL-SPAN 8) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Notification Control Panel */}
                    <Card className="p-10 bg-[#0a101f] border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <Bell className="w-5 h-5 text-amber-500" />
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.25em] italic">Notification Settings</h3>
                            </div>
                            <p className="text-[12px] font-black text-amber-500 uppercase tracking-[0.2em] italic underline underline-offset-8 decoration-amber-500/30">Active Delivery Channels</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: 'push', label: 'Push Hub Notifications', desc: 'Clinical protocol alerts and visit reminders.', icon: Bell },
                                { key: 'email', label: 'Email Clinical Relay', desc: 'Lab report summaries and study announcements.', icon: Mail },
                                { key: 'sms', label: 'SMS Response Unit', desc: 'Two-factor secure authentication and urgent pings.', icon: Phone },
                            ].map((topic: any) => (
                                <div key={topic.key} className="flex items-center justify-between p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-3xl border border-white/[0.03] group hover:border-amber-500/20">
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 h-12 rounded-2xl bg-[#0d1424] flex items-center justify-center text-slate-600 transition-all group-hover:text-amber-500 border border-white/5">
                                            <topic.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter mb-1">{topic.label}</h4>
                                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest italic">{topic.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification(topic.key)}
                                        className={`w-14 h-8 rounded-full transition-all relative p-1.5 focus:outline-none ${notificationSettings[topic.key] ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-lg ${notificationSettings[topic.key] ? 'translate-x-[1.375rem]' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Security & Access Management */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <Card className="p-10 bg-[#0a101f] border-white/5 group hover:border-amber-500/30 transition-all">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Lock className="w-5 h-5" /></div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Account Access</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10 leading-relaxed italic pr-6 italic">Safely change your password and login details.</p>
                            <button onClick={() => onAction('Update Credentials')} className="w-full py-4 bg-white/5 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-black text-[12px] uppercase tracking-widest rounded-xl transition-all italic border border-white/10 group-hover:bg-amber-500 shadow-xl shadow-transparent group-hover:shadow-amber-500/20 active:scale-95">CHANGE PASSWORD</button>
                        </Card>
                         <Card className="p-10 bg-red-500/5 border-red-500/20 group hover:border-red-500/40 transition-all">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Shield className="w-5 h-5" /></div>
                                <h3 className="text-sm font-black text-red-400 uppercase tracking-widest italic">Study Exit</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10 leading-relaxed italic pr-6">Leave the study and remove your personal information.</p>
                            <button onClick={() => onAction('Withdraw from Study')} className="w-full py-4 bg-transparent border-2 border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 font-black text-[12px] uppercase tracking-widest rounded-xl transition-all">LEAVE STUDY</button>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer Aesthetic Note */}
            <div className="flex justify-center flex-col items-center gap-10 mt-10 opacity-30 cursor-default group pb-10">
                <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center gap-6">
                    <Zap className="w-6 h-6 text-amber-500 transition-transform group-hover:rotate-12" />
                    <Sparkles className="w-6 h-6 text-amber-500 transition-transform group-hover:scale-125" />
                    <AlertCircle className="w-6 h-6 text-amber-500 transition-transform group-hover:-rotate-12" />
                </div>
                <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Secure Site Verified</p>
            </div>
        </div>
    );
};

export default ProfileView;



