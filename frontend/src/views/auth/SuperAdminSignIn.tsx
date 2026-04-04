import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff, Mail, Globe } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { saveToken, saveUser, API } from '../../utils/auth';

const ParticlesBackground = () => {
    useEffect(() => {
        const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: any[] = [];
        const colors = ['#00ffff', '#7c3aed', '#4f46e5'];
        const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 80;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 1,
                dx: (Math.random() - 0.5) * 0.5,
                dy: (Math.random() - 0.5) * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        let animationFrameId: number;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;

                if (p.x < 0 || p.x > width) p.dx *= -1;
                if (p.y < 0 || p.y > height) p.dy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                
                // Glowing effect for dots
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;
                ctx.fill();
                
                // Reset shadow for lines
                ctx.shadowBlur = 0;
            });

            // Draw connecting lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        const opacity = 0.15 - (dist / 1000);
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(124, 58, 237, ${opacity})`; 
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas id="particles-canvas" className="absolute inset-0 z-0 pointer-events-none opacity-80"></canvas>;
};

export default function SuperAdminSignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const navigate = useNavigate();

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const response = await fetch(`${API}/api/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, timezone: detectedTimezone }),
                credentials: 'include'
            });
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("Non-JSON response received:", text);
                throw new Error(`Server returned an invalid response format (HTTP ${response.status}). The backend might be down or misconfigured.`);
            }

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Identity verification failed');
            
            const userRole = (data.user.role || '').toUpperCase();
            
            if (userRole !== 'SUPER_ADMIN') {
                throw new Error('UNAUTHORIZED_ACCESS: Restricted to Super Admin personnel.');
            }

            if (data.user.must_reset) {
                navigate('/auth/reset-forced');
                return;
            }

            saveToken(data.access, userRole, undefined, data.refresh);
            saveUser(data.user);
            
            navigate('/dashboard/super-admin');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050614] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Constellation / Grid Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
                
                {/* Advanced Canvas Constellation */}
                <ParticlesBackground />
            </div>

            {/* Top Badge */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 z-10"
            >
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-md">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Super Administrator Access</span>
                </div>
            </motion.div>

            {/* Main Portal Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-[500px] w-full bg-[#0B0D1B]/80 backdrop-blur-2xl border border-white/10 p-10 lg:p-14 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden group"
            >
                {/* Branding */}
                <div className="text-center space-y-8 mb-12">
                    <Link to="/" target="_blank" rel="noopener noreferrer" className="flex justify-center transition-transform hover:scale-105 active:scale-95">
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-white/20">
                            <img src="/logo.jpg" alt="MusB Research" className="h-14 md:h-16 w-auto object-contain" />
                        </div>
                    </Link>
                    
                    <div className="space-y-4">

                        <h1 className="text-3xl font-black text-white tracking-tight">Super Admin Portal</h1>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                            Highest-privilege system access. All actions are logged.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Email or User ID</label>
                        <div className="relative group/input">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                required
                                placeholder="Email or User ID"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-[#050614] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white placeholder:text-slate-800 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm tracking-tight"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Password</label>
                        <div className="relative group/input">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="••••••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[#050614] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white placeholder:text-slate-800 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm tracking-tight"
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

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-400 uppercase tracking-widest text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-[#7c3aed] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-[#050614] transition-all shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-3 group/btn disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : 'Access Super Admin Portal'}
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-12 text-center space-y-6">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                        All access attempts are encrypted, logged, and monitored 24/7.
                    </p>
                </div>
            </motion.div>

            {/* Footer Link */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 z-10"
            >
                <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                    Looking for the Admin Console? 
                    <Link to="/signin" className="text-indigo-400 hover:text-white transition-colors">Admin Login &rarr;</Link>
                </p>
            </motion.div>
        </div>
    );
}

