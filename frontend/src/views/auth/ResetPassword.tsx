import { API } from '../../utils/auth';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Lock, Eye, EyeOff, ShieldCheck, 
    AlertCircle, CheckCircle2, ArrowLeft, 
    ShieldAlert, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

    // === SECURITY: CHECK TOKEN VALIDITY ON MOUNT ===
    useEffect(() => {
        if (!token) {
            setError('CRITICAL: Reset token is missing or corrupted.');
            setStatus('ERROR');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Security token missing. Aborting operation.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Encryption mismatch: Passwords do not match.');
            return;
        }

        if (password.length < 10) {
            setError('Security Policy: Password must be at least 10 characters.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API}/api/auth/reset-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Identity verification failed.');

            setStatus('SUCCESS');
            // Auto-redirect after 3 seconds
            setTimeout(() => navigate('/signin'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-40 pb-24 px-4 relative overflow-hidden flex items-center justify-center font-sans tracking-tight">
            {/* Dynamic Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-xl"
            >
                {/* Header Section */}
                <div className="text-center mb-12">
                   <Link to="/" className="inline-block mb-10 group bg-white p-2 rounded-2xl shadow-xl transition-transform hover:scale-105">
                        <img src="/logo.jpg" alt="MusB Research" className="h-14 w-auto object-contain" />
                   </Link>
                   <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                        Reset <span className="text-cyan-400">Credentials</span>
                   </h1>
                   <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        <ShieldCheck className="w-3 h-3 text-cyan-500" />
                        SECURE IDENTITY RECOVERY NODE
                        <ShieldCheck className="w-3 h-3 text-cyan-500" />
                   </div>
                </div>

                {/* Main Card */}
                <div className="bg-[#0f172a]/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-12 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {status === 'SUCCESS' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-8 py-10"
                            >
                                <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-400">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Identity <span className="text-emerald-500">Secured</span></h2>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Your password has been successfully updated in our persistence layers.</p>
                                </div>
                                <div className="pt-8 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#555a7a]">
                                        <Zap className="w-3 h-3 text-[#7c3aed] animate-pulse" />
                                        Redirecting to Sign-In Interface
                                    </div>
                                    <button 
                                        onClick={() => navigate('/signin')}
                                        className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7c3aed] hover:text-white transition-colors"
                                    >
                                        Skip Wait Time
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onSubmit={handleSubmit}
                                className="space-y-8"
                            >
                                {error && (
                                    <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500 text-[11px] font-black uppercase tracking-widest animate-pulse italic">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-6 italic">Define New Key</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] pl-16 pr-14 py-5 text-white placeholder:text-slate-800 outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors p-1"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-600 ml-6 tracking-widest uppercase font-black">Min. 10 characters + alphanumeric complexity</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-6 italic">Confirm New Key</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] pl-16 pr-14 py-5 text-white placeholder:text-slate-800 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors p-1"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-6">
                                    <button
                                        type="submit"
                                        disabled={isLoading || !token}
                                        className="w-full py-5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] italic shadow-2xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        {isLoading ? 'Encrypting Key...' : 'Secure & Initialize Account'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/signin')}
                                        className="w-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#555a7a] hover:text-white transition-all group"
                                    >
                                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        Return to Access Terminal
                                    </button>
                                </div>

                                <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] flex items-start gap-4">
                                    <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                        Security Warning: Password resets invalidate all active sessions across all devices for your protection.
                                    </p>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Copy */}
                <div className="text-center mt-12 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">
                    © MMXXVI MusB GLOBAL • SECURE DATA PROTOCOL
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
