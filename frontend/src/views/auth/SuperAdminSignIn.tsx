import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Terminal, Lock, ArrowRight, Eye, EyeOff, Cpu, Globe, Database, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../../utils/auth';

export default function SuperAdminSignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    
    const navigate = useNavigate();

    useEffect(() => {
        const lines = [
            '> MUSB_SECURITY_SYSTEM: [BETA-92]',
            '> INITIALIZING_HANDSHAKE...',
            '> ENCRYPTION_LAYER: AES-256-GCM',
            '> STATUS: RESTRICTED_ACCESS',
            '> WARNING: AUTHORIZED_PERSONNEL_ONLY'
        ];
        
        lines.forEach((line, i) => {
            setTimeout(() => {
                setTerminalLines(prev => [...prev, line]);
            }, i * 400);
        });
    }, []);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Identity verification failed');
            
            if (data.user.role !== 'SUPER_ADMIN') {
                throw new Error('UNAUTHORIZED_ACCESS_DETECTED: This terminal is for Super Admins only.');
            }

            saveToken(data.access, data.user.role);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Success "Hack" effect
            setTerminalLines(prev => [...prev, '> VERIFICATION_SUCCESS', '> REDIRECTING_TO_CORE...']);
            setTimeout(() => navigate('/sys/core-oversight'), 800);
            
        } catch (err: any) {
            setError(err.message);
            setTerminalLines(prev => [...prev, `> ERROR: ${err.message.toUpperCase()}`]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#05080A] flex items-center justify-center p-6 relative overflow-hidden font-mono">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            {/* Animated Glows */}
            <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/10 blur-[120px] rounded-full"></div>

            <div className="max-w-[1200px] w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
                
                {/* Visual Side: Terminal & Identity */}
                <div className="space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <ShieldAlert className="w-4 h-4 text-indigo-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Classified Node: 0x92</span>
                        </div>
                        <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                            System <span className="text-indigo-400 block">Mainframe</span>
                        </h1>
                        <p className="text-slate-500 text-sm max-w-md uppercase tracking-widest leading-relaxed">
                            Universal oversight terminal for MusB Research global operations. Unauthorized entry is strictly prohibited.
                        </p>
                    </div>

                    <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 space-y-4 font-mono text-[10px] text-indigo-400 min-h-[160px]">
                        {terminalLines.map((line, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -5 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                key={i}
                            >
                                {line}
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-6 opacity-40">
                         {[
                             { icon: Globe, val: 'VA_NODE_01' },
                             { icon: Network, val: 'IP_WHITELIST' },
                             { icon: Database, val: 'AES_SYNC' }
                         ].map((item, i) => (
                             <div key={i} className="flex items-center gap-3">
                                 <item.icon className="w-4 h-4 text-indigo-500" />
                                 <span className="text-[9px] font-bold text-slate-400">{item.val}</span>
                             </div>
                         ))}
                    </div>
                </div>

                {/* Form Side: Restricted Gate */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#0A0F14] border border-white/10 p-12 lg:p-16 rounded-[3.5rem] shadow-2xl space-y-10 relative overflow-hidden group"
                >
                    {/* Scanner Effect */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500/50 -translate-y-full hover:animate-scanner pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
                            <Lock className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Identity <span className="text-indigo-400">Verification</span></h2>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 ml-6 italic">Personnel_Email</label>
                            <div className="relative group/input">
                                <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    placeholder="ADMIN_V92@MUSB.COM"
                                    value={email}
                                    onChange={e => setEmail(e.target.value.toUpperCase())}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-white placeholder:text-slate-800 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs tracking-widest"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 ml-6 italic">Security_Key</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-white placeholder:text-slate-800 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs tracking-widest"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-[#05080A] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group/btn disabled:opacity-50"
                        >
                            {isLoading ? 'VERIFYING...' : 'INITIATE LOGIN'}
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[9px] font-black text-red-400 uppercase tracking-widest italic flex items-center gap-4"
                            >
                                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] italic">
                        Secured by MusB Quantum Encryption Layer
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
