import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Key, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/auth';

export default function ResetForced() {
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/auth/reset-forced/`, {
                method: 'POST',
                body: JSON.stringify({
                    old_password: oldPassword,
                    password: password
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || (Array.isArray(data.detail) ? data.detail[0] : data.detail) || 'Reset failed');

            setSuccess(true);
            // After 2 seconds redirect to dashboard
            setTimeout(() => {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                // Update local storage flag
                user.must_reset = false;
                localStorage.setItem('user', JSON.stringify(user));
                
                if (user.profile_incomplete) {
                    navigate('/auth/profile-setup');
                } else {
                    const role = user.role;
                    switch (role) {
                        case 'SUPER_ADMIN': navigate('/dashboard/super-admin'); break;
                        case 'ADMIN':
                        case 'COORDINATOR': navigate('/dashboard/admin'); break;
                        case 'PI': navigate('/dashboard/pi'); break;
                        case 'SPONSOR': navigate('/dashboard/sponsor'); break;
                        default: navigate('/dashboard/participant');
                    }
                }
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07091e] flex items-center justify-center p-6 relative overflow-hidden">
             {/* Background Elements */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
             <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />

             <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-xl bg-[#0f1133]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 shadow-2xl relative z-10"
             >
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-[2rem] flex items-center justify-center text-[#7c3aed] mb-8">
                        <Lock className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Secure Your <span className="text-[#7c3aed]">Identity</span></h1>
                    <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-[0.3em]">Mandatory first-login security protocol</p>
                </div>

                {success ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8 py-8"
                    >
                        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Security Handshake <span className="text-emerald-500">Verified</span></h3>
                            <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-widest">Re-initializing environment...</p>
                        </div>
                    </motion.div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-8">
                        {error && (
                            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-500 text-xs font-black uppercase tracking-widest">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-3 px-4">
                                <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic flex items-center gap-2">
                                   <Key className="w-3 h-3" /> System Security Key (Temporary Password)
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showOld ? "text" : "password"}
                                        required
                                        placeholder="••••••••••••"
                                        value={oldPassword}
                                        onChange={e => setOldPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 pr-16 py-5 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-mono text-lg tracking-[0.3em]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOld(!showOld)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-purple-400 transition-colors"
                                    >
                                        {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3 px-4">
                                    <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic">New Security Key</label>
                                    <div className="relative group">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            required
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 pr-16 py-5 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-purple-400 transition-colors"
                                        >
                                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3 px-4">
                                    <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest italic">Confirm Key</label>
                                    <div className="relative group">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            required
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 pr-16 py-5 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-purple-400 transition-colors"
                                        >
                                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[#0a0b1a] border border-white/5 rounded-[2rem] flex items-center gap-6">
                            <ShieldCheck className="w-10 h-10 text-purple-500 opacity-40" />
                            <div>
                                <p className="text-[10px] text-white font-black uppercase tracking-widest mb-1 italic">Protocol Requirement:</p>
                                <p className="text-[9px] text-[#555a7a] font-medium leading-relaxed">Password must be at least 8 characters, containing uppercase, lowercase, and a symbol.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-6 bg-[#7c3aed] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] italic shadow-xl shadow-purple-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {isLoading ? 'Synchronizing...' : 'Update & Proceed'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                )}
             </motion.div>
        </div>
    );
}
