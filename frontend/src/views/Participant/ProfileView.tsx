import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, Edit2, User, Mail, Phone, MapPin, Clock, Globe, 
    Bell, ShieldCheck, Lock, Shield, Zap, Sparkles, AlertCircle, ChevronRight
} from 'lucide-react';
import { Card, Badge, Skeleton } from './SharedComponents';

const ProfileView = ({ 
    userName, userEmail, userPicture, initials, userPhone, 
    userLocation, userTimezone, notificationSettings = {}, 
    toggleNotification, onAction,
    participantSid, studyId,
    isLoading = false
}: any) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-10 animate-pulse">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <Skeleton className="lg:col-span-4 h-[600px] rounded-[32px]" />
                    <div className="lg:col-span-8 space-y-8">
                        <Skeleton className="h-96 rounded-[32px]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                     <div className="flex items-center gap-2 text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest mb-3">
                        <span>Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#1E88E5]">Account Identity</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Personal Profile</h2>
                    <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Manage encrypted credentials and contact protocols</p>
                </div>
                <div className="flex bg-white shadow-sm border border-[#E3ECF5] px-6 py-3.5 rounded-2xl items-center gap-4">
                    <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center text-[#1E88E5]">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#1A2B49] uppercase tracking-tight leading-none">Identity Guard</span>
                        <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1.5 leading-none">Active Protection</span>
                    </div>
                </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* 1. IDENTITY CARD */}
                <Card className="lg:col-span-4 p-0 bg-white border-[#E3ECF5] shadow-xl relative overflow-hidden group">
                    <div className="h-40 bg-gradient-to-br from-[#1E88E5] to-[#1565C0]" />
                    <div className="px-10 pb-10 relative -mt-20">
                        <div className="relative inline-block group/photo">
                            <div className="w-40 h-40 rounded-[40px] bg-[#F5F9FF] border-[8px] border-white flex items-center justify-center text-[#1E88E5] font-bold text-5xl overflow-hidden shadow-2xl">
                                {userPicture ? <img src={userPicture} alt="profile" className="w-full h-full object-cover" /> : initials}
                            </div>
                            <button
                                onClick={() => onAction('Change Photo')}
                                className="absolute bottom-2 right-2 p-3.5 bg-[#1E88E5] hover:bg-[#1565C0] text-white rounded-2xl shadow-xl transform transition-all active:scale-95 group-hover/photo:translate-y-0 translate-y-2 opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-[#1A2B49] tracking-tight uppercase mb-1">{userName}</h3>
                                <div className="flex items-center gap-2">
                                     <Badge color="blue">VERIFIED PARTICIPANT</Badge>
                                </div>
                            </div>
                            <button onClick={() => onAction('Edit Profile')} className="p-3 bg-[#F8FBFF] hover:bg-[#E3F2FD] rounded-xl text-[#5F6F89] hover:text-[#1E88E5] border border-[#E3ECF5] transition-all"><Edit2 className="w-4.5 h-4.5" /></button>
                        </div>

                        <div className="space-y-6 mt-12">
                            <div className="p-6 bg-[#F8FBFF] rounded-[28px] border border-[#E3ECF5] space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-[#E3ECF5] flex items-center justify-center text-[#5F6F89]"><Mail className="w-4.5 h-4.5" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest mb-0.5">Primary Email</p>
                                        <p className="text-[13px] font-bold text-[#1A2B49] truncate">{userEmail || 'UNLINKED'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-[#E3ECF5] flex items-center justify-center text-[#5F6F89]"><Phone className="w-4.5 h-4.5" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest mb-0.5">Mobile Contact</p>
                                        <p className="text-[13px] font-bold text-[#1A2B49] truncate">{userPhone || 'NOT PROVIDED'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-[#E3ECF5] flex items-center justify-center text-[#5F6F89]"><MapPin className="w-4.5 h-4.5" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-widest mb-0.5">Assigned Facility</p>
                                        <p className="text-[13px] font-bold text-[#1A2B49] truncate">{userLocation || 'Distributed Site'}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-[#E3ECF5] to-transparent my-2" />
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#F0F6FF] rounded-xl shadow-sm border border-[#E3F2FD] flex items-center justify-center text-[#1E88E5] font-bold text-[10px]">PID</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest mb-0.5">Clinical ID</p>
                                        <p className="text-[13px] font-black text-[#1A2B49] truncate">{participantSid || 'PENDING'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#FFF3E0] rounded-xl shadow-sm border border-[#FFE0B2] flex items-center justify-center text-[#E65100] font-bold text-[10px]">SID</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-[#E65100] uppercase tracking-widest mb-0.5">Study ID</p>
                                        <p className="text-[13px] font-black text-[#1A2B49] truncate">{studyId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. PREFERENCES & SECURITY */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Notifications */}
                    <Card className="p-10 bg-white border-[#E3ECF5] shadow-xl">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#F8FBFF]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#F0F6FF] rounded-xl flex items-center justify-center text-[#1E88E5]"><Bell className="w-5 h-5" /></div>
                                <h3 className="text-[15px] font-bold text-[#1A2B49] uppercase tracking-tight">Communication Flow</h3>
                            </div>
                            <Badge color="blue">Active Protocols</Badge>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: 'push', label: 'Clinical Dashboard Alerts', desc: 'Real-time protocol updates and urgent visit pings.', icon: Bell },
                                { key: 'email', label: 'Electronic Correspondence', desc: 'Lab report summaries and study announcements.', icon: Mail },
                                { key: 'sms', label: 'Secure Mobile Relay', desc: 'Two-factor authentication and scheduled check-ins.', icon: Phone },
                            ].map((topic: any) => (
                                <div key={topic.key} className="flex items-center justify-between p-6 bg-[#F8FBFF] hover:bg-white transition-all rounded-[24px] border border-[#E3ECF5] group shadow-inner-sm hover:shadow-md">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#5F6F89] group-hover:text-[#1E88E5] shadow-sm transition-all border border-[#E3ECF5]">
                                            <topic.icon className="w-5.5 h-5.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight mb-1">{topic.label}</h4>
                                            <p className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">{topic.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification(topic.key)}
                                        className={`w-14 h-8 rounded-full transition-all relative p-1.5 focus:outline-none ${notificationSettings[topic.key] ? 'bg-[#1E88E5] shadow-lg shadow-blue-500/20' : 'bg-[#E3ECF5]'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${notificationSettings[topic.key] ? 'translate-x-[1.375rem]' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Security */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <Card className="p-10 bg-white border-[#E3ECF5] hover:border-[#1E88E5]/30 transition-all shadow-lg group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-[#F0F6FF] text-[#1E88E5] rounded-2xl flex items-center justify-center border border-[#E3F2FD]"><Lock className="w-6 h-6" /></div>
                                <h3 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-widest">Authentication</h3>
                            </div>
                            <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mb-10 leading-relaxed italic pr-4">Reset encrypted access credentials securely.</p>
                            <button onClick={() => onAction('Update Credentials')} className="w-full py-4.5 bg-[#1E88E5] text-white font-bold text-[12px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10 hover:bg-[#1565C0] active:scale-95">Change Password</button>
                        </Card>
                         <Card className="p-10 bg-white border-[#E3ECF5] hover:border-[#D32F2F]/30 transition-all shadow-lg group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-[#FDECEA] text-[#D32F2F] rounded-2xl flex items-center justify-center border border-[#FFCDD2]"><Shield className="w-6 h-6" /></div>
                                <h3 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-widest">Study Closure</h3>
                            </div>
                            <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mb-10 leading-relaxed italic pr-4">Withdraw participation and scrub biometric profiles.</p>
                            <button onClick={() => onAction('Withdraw from Study')} className="w-full py-4.5 bg-white border-2 border-[#D32F2F]/20 text-[#D32F2F] font-bold text-[12px] uppercase tracking-widest rounded-xl transition-all hover:bg-[#D32F2F] hover:text-white active:scale-95">Withdraw Protocol</button>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-center gap-6 mt-12 opacity-50">
                <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#E3ECF5] to-transparent" />
                <div className="flex items-center gap-8 text-[#5F6F89]">
                    <ShieldCheck className="w-6 h-6" />
                    <Lock className="w-6 h-6" />
                    <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-[0.4em]">Clinical Identity Guard Service</p>
            </div>
        </div>
    );
};

export default ProfileView;
