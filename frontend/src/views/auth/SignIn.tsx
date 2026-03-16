import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, ShieldCheck, ArrowRight, Lock, Key, CheckCircle2, AlertCircle, ChevronLeft, LogIn } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Link, useNavigate } from 'react-router-dom';
import { saveToken } from '../../utils/auth';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT';
type AuthStep = 'INFO' | 'OTP' | 'PASSWORD' | 'SUCCESS';

declare global {
    interface Window {
        google: any;
    }
}

export default function SignIn() {
    const [mode, setMode] = useState<AuthMode>('LOGIN'); // Default to Login based on new request
    const [step, setStep] = useState<AuthStep>('INFO');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });
    const [isAttemptingSubmit, setIsAttemptingSubmit] = useState(false);
    const googleInitRef = useRef(false);

    const navigate = useNavigate();
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const validatePasswordComplexity = (pass: string) => {
        const checks = {
            length: pass.length >= 10 && pass.length <= 32,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
        };
        
        const score = Object.values(checks).filter(Boolean).length;
        let label = 'Weak';
        let color = 'bg-red-500';
        
        if (score === 5) { label = 'Very Strong'; color = 'bg-cyan-500'; }
        else if (score >= 4) { label = 'Strong'; color = 'bg-indigo-500'; }
        else if (score >= 2) { label = 'Fair'; color = 'bg-yellow-500'; }
        
        setPasswordStrength({ score, label, color });
        return checks;
    };

    // Handlers for Registration
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAttemptingSubmit(true);
        if (!name || !email || !captchaToken) {
            setError(captchaToken ? 'Please fill in all fields' : 'Please verify you are human');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, captcha: captchaToken })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
            setStep('OTP');
            setIsAttemptingSubmit(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp.join('') })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Invalid code');
            setStep('PASSWORD');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAttemptingSubmit(true);
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        const checks = validatePasswordComplexity(password);
        if (!Object.values(checks).every(Boolean)) {
            setError('Password does not meet all requirements');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Senior Dev Pro-tip: Automatically detect timezone for global support
            const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    full_name: name, 
                    password,
                    timezone: detectedTimezone,
                    // Optionally extract country from timezone if needed, or leave for IP-based backend logic
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(Array.isArray(data.error) ? data.error[0] : data.error);
            setStep('SUCCESS');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Unified handle for Google Credential
    const handleCredentialResponse = async (response: any) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("Google response received, verifying with backend...");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Google login failed');
            
            if (data.user.role === 'SUPER_ADMIN') {
                throw new Error('ACCESS_DENIED: Please use the Administrative Terminal at /super/gate');
            }

            saveToken(data.access, data.user.role);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            const role = data.user.role;
            switch (role) {
                case 'ADMIN':
                case 'COORDINATOR':
                    navigate('/dashboard/admin');
                    break;
                case 'SPONSOR':
                    navigate('/dashboard/sponsor');
                    break;
                case 'PI':
                    navigate('/dashboard/pi');
                    break;
                case 'PARTICIPANT':
                default:
                    navigate('/dashboard/participant');
                    break;
            }
        } catch (err: any) {
            console.error("Google Auth Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize Google on mount
    useEffect(() => {
        const initGoogle = () => {
            if (window.google) {
                const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                if (!client_id) {
                    console.error("VITE_GOOGLE_CLIENT_ID is missing in .env");
                    return;
                }
                
                if (googleInitRef.current) return;

                window.google.accounts.id.initialize({
                    client_id: client_id,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: false,
                    use_fedcm: true,
                });
                googleInitRef.current = true;
                console.log("Google GSI Client Initialized");
            } else {
                // Retry if script not loaded yet
                setTimeout(initGoogle, 500);
            }
        };
        initGoogle();
    }, []);

    const handleGoogleLogin = () => {
        if (!window.google) {
            setError('Google Security Service is still loading. Please wait 2 seconds.');
            return;
        }
        
        // Show the prompt
        window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
                console.warn("One Tap not displayed:", notification.getNotDisplayedReason());
                setError(`Google prompt blocked: ${notification.getNotDisplayedReason()}. Please check if you are logged into Google or disabled popups.`);
            }
        });
    };

    const handleGoogleBtnClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setError(null);
        handleGoogleLogin();
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send reset link');
            setStep('SUCCESS');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAttemptingSubmit(true);
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');
            
            // RBAC Redirection Logic
            const userRole = data.user.role;

            if (userRole === 'SUPER_ADMIN') {
                throw new Error('ACCESS_DENIED: Super Admin accounts must use the Administrative Terminal at /super/gate');
            }

            saveToken(data.access, userRole);
            localStorage.setItem('user', JSON.stringify(data.user)); // Persist user info

            switch (userRole) {
                case 'ADMIN':
                case 'COORDINATOR':
                    navigate('/dashboard/admin');
                    break;
                case 'SPONSOR':
                    navigate('/dashboard/sponsor');
                    break;
                case 'PI':
                    navigate('/dashboard/pi');
                    break;
                case 'PARTICIPANT':
                default:
                    navigate('/dashboard/participant');
                    break;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) value = value[0];
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const isFieldMissing = (field: string) => {
        if (!isAttemptingSubmit) return false;
        if (mode === 'LOGIN') {
            if (field === 'email') return !email;
            if (field === 'password') return !password;
        } else {
            if (step === 'INFO') {
                if (field === 'name') return !name;
                if (field === 'email') return !email;
                if (field === 'captcha') return !captchaToken;
            }
            if (step === 'PASSWORD') {
                if (field === 'password') return !password;
                if (field === 'confirmPassword') return !confirmPassword;
            }
        }
        return false;
    };

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen pt-40 pb-24 px-4 relative overflow-hidden flex items-center justify-center font-sans tracking-tight bg-transparent">

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-xl"
            >
                {/* Main Auth Card */}
                <div className="bg-[#0f172a]/40 backdrop-blur-[40px] rounded-[4rem] border border-white/10 p-10 md:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                    {/* Interior Glow Effect */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-1000"></div>
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                    {/* Branding Section */}
                    <div className="flex flex-col items-center mb-12 relative z-10">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="bg-white rounded-3xl shadow-2xl border border-white/20 mb-8 flex items-center justify-center overflow-hidden h-16 md:h-20"
                        >
                            <img src="/logo.jpg" alt="MusB™ Research" className="h-full w-auto object-contain" />
                        </motion.div>
                        
                        <div className="text-center space-y-2">
                            <AnimatePresence mode="wait">
                                <motion.h1 
                                    key={mode}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none"
                                >
                                    {mode === 'LOGIN' ? 'Welcome ' : 'Start '}<span className="text-cyan-400">{mode === 'LOGIN' ? 'Back' : 'Journey'}</span>
                                </motion.h1>
                            </AnimatePresence>
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center justify-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-cyan-500/50"></span>
                                {mode === 'LOGIN' ? 'Enter your credentials to continue' : 'Participant Enrollment'}
                                <span className="w-1 h-1 rounded-full bg-cyan-500/50"></span>
                            </p>
                        </div>
                    </div>

                    {/* Step Progress Bar (Only for Register flow) */}
                    <AnimatePresence>
                        {mode === 'REGISTER' && step !== 'SUCCESS' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between mb-16 px-4 relative z-10 overflow-hidden"
                            >
                                {[
                                    { id: 'INFO', label: 'VERIFY EMAIL' },
                                    { id: 'OTP', label: 'ENTER CODE' },
                                    { id: 'PASSWORD', label: 'SET PASSWORD' }
                                ].map((s, idx) => {
                                    const isActive = step === s.id;
                                    const isCompleted = (step === 'OTP' && idx < 1) || (step === 'PASSWORD' && idx < 2);
                                    
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 relative">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 z-20 ${
                                                isActive ? 'bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 
                                                isCompleted ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 
                                                'bg-slate-900/50 border border-white/5 text-slate-600'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>
                                                    {s.label.split(' ')[0]}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-700'}`}>
                                                    {s.label.split(' ')[1]}
                                                </span>
                                            </div>
                                            
                                            {idx < 2 && (
                                                <div className="absolute top-4 left-32 w-12 h-[1px] bg-slate-800 z-10 hidden md:block">
                                                    <motion.div 
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: isCompleted ? "100%" : "0%" }}
                                                        className="h-full bg-cyan-500/30"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-8 overflow-hidden"
                            >
                                <div className="p-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Unified Card Content Area */}
                    <div className="relative z-10 min-h-[340px] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                             {mode === 'FORGOT' ? (
                                <motion.form 
                                    key="forgot"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleForgotPassword} 
                                    className="space-y-8"
                                >
                                    {step === 'SUCCESS' ? (
                                        <div className="text-center space-y-6">
                                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-400">
                                                <CheckCircle2 className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Email <span className="text-cyan-400">Sent</span></h3>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 px-8">We've sent a magic reset link to your inbox. Please check your email.</p>
                                            </div>
                                            <button 
                                                onClick={() => setMode('LOGIN')}
                                                className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors"
                                            >
                                                Back to Login
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 text-center">
                                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Recover <span className="text-cyan-400">Account</span></h3>
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Enter your email and we'll send you a magic link to reset your password</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="name@example.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] pl-16 pr-6 py-5 text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {isLoading ? 'Sending...' : 'Send Magic Link'}
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                            <div className="text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => setMode('LOGIN')}
                                                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                                                >
                                                    Cancel and return
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.form>
                            ) : mode === 'LOGIN' ? (
                                <motion.form 
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleLogin} 
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className={`w-full bg-slate-950/50 border rounded-[1.5rem] pl-16 pr-6 py-5 text-white placeholder:text-slate-700 outline-none transition-all font-bold text-sm ${isFieldMissing('email') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className={`w-full bg-slate-950/50 border rounded-[1.5rem] pl-16 pr-6 py-5 text-white placeholder:text-slate-800 outline-none transition-all font-bold text-sm tracking-widest ${isFieldMissing('password') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pr-4">
                                        <button 
                                            type="button" 
                                            onClick={() => { setMode('FORGOT'); setStep('INFO'); setError(null); }}
                                            className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] active:translate-y-0 flex items-center justify-center gap-3 group disabled:opacity-50"
                                    >
                                        {isLoading ? 'Processing...' : 'Sign In'}
                                        <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.form>
                            ) : (
                                <div key="register_flow">
                                    {step === 'INFO' && (
                                        <motion.form 
                                            key="info"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleSendOTP} 
                                            className="space-y-6"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Enter full name"
                                                        value={name}
                                                        onChange={e => setName(e.target.value)}
                                                        className={`w-full bg-slate-950/50 border rounded-[1.5rem] pl-16 pr-6 py-5 text-white placeholder:text-slate-700 outline-none transition-all font-bold text-sm ${isFieldMissing('name') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400" />
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="name@example.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] pl-16 pr-6 py-5 text-white placeholder:text-slate-700 outline-none focus:border-cyan-500/50 transition-all font-bold text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 ml-6">
                                                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Human Verification</label>
                                                </div>
                                                <div className={`py-4 md:py-6 rounded-[2.5rem] bg-slate-950/40 border border-white/5 flex items-center justify-center shadow-inner transition-all overflow-hidden ${isFieldMissing('captcha') ? 'border-red-500/50 animate-error-pulse' : ''}`}>
                                                    <div className="flex items-center justify-center transform scale-[0.85] md:scale-100 origin-center">
                                                        <ReCAPTCHA
                                                            ref={recaptchaRef}
                                                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                                            onChange={token => { setCaptchaToken(token); if(token) setError(null); }}
                                                            theme="dark"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] active:translate-y-0 flex items-center justify-center gap-3 group disabled:opacity-50"
                                            >
                                                {isLoading ? 'Processing...' : 'Send Verification Code'}
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.form>
                                    )}

                                    {step === 'OTP' && (
                                        <motion.form 
                                            key="otp"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            onSubmit={handleVerifyOTP} 
                                            className="space-y-10"
                                        >
                                            <div className="text-center space-y-3">
                                                <p className="text-slate-400 text-sm font-medium">Verify your email address</p>
                                                <p className="text-white font-black text-lg bg-white/5 py-2 px-6 rounded-full inline-block border border-white/5">{email}</p>
                                            </div>

                                            <div className="grid grid-cols-6 gap-3">
                                                {otp.map((digit, idx) => (
                                                    <input
                                                        key={idx}
                                                        id={`otp-${idx}`}
                                                        type="text"
                                                        maxLength={1}
                                                        value={digit}
                                                        onKeyDown={e => handleKeyDown(idx, e)}
                                                        onChange={e => handleOtpChange(idx, e.target.value)}
                                                        className="w-full aspect-square bg-slate-950/50 border border-white/10 rounded-2xl text-center text-2xl font-black text-white focus:border-cyan-500 transition-all font-bold"
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isLoading || otp.some(d => !d)}
                                                className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3"
                                            >
                                                {isLoading ? 'Verifying...' : 'Verify Identity'}
                                                <Key className="w-5 h-5" />
                                            </button>
                                        </motion.form>
                                    )}

                                    {step === 'PASSWORD' && (
                                        <motion.form 
                                            key="password"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onSubmit={handleSetPassword} 
                                            className="space-y-8"
                                        >
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Secure Password</label>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400" />
                                                        <input
                                                            type="password"
                                                            required
                                                            placeholder="••••••••••••"
                                                            value={password}
                                                            onChange={e => {
                                                                setPassword(e.target.value);
                                                                validatePasswordComplexity(e.target.value);
                                                            }}
                                                            className={`w-full bg-slate-950/50 border rounded-[1.5rem] pl-16 pr-6 py-5 text-white placeholder:text-slate-800 outline-none transition-all font-bold tracking-widest text-sm ${isFieldMissing('password') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                        />
                                                    </div>
                                                    
                                                    {/* Strength Indicator */}
                                                    {password && (
                                                        <div className="px-6 space-y-2">
                                                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                                                <span className="text-slate-500">Security Strength</span>
                                                                <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.label}</span>
                                                            </div>
                                                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                                                    className={`h-full ${passwordStrength.color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                                                                />
                                                            </div>
                                                            
                                                            {/* Requirements List */}
                                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                                {[
                                                                    { label: '10-32 Characters', met: password.length >= 10 && password.length <= 32 },
                                                                    { label: 'Uppercase (A-Z)', met: /[A-Z]/.test(password) },
                                                                    { label: 'Lowercase (a-z)', met: /[a-z]/.test(password) },
                                                                    { label: 'Number (0-9)', met: /[0-9]/.test(password) },
                                                                    { label: 'Special Char', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
                                                                ].map((req, i) => (
                                                                    <div key={i} className="flex items-center gap-2">
                                                                        <div className={`w-1 h-1 rounded-full ${req.met ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                                                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${req.met ? 'text-slate-300' : 'text-slate-600'}`}>{req.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Confirm Password</label>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400" />
                                                        <input
                                                            type="password"
                                                            required
                                                            placeholder="••••••••••••"
                                                            value={confirmPassword}
                                                            onChange={e => setConfirmPassword(e.target.value)}
                                                            className={`w-full bg-slate-950/50 border rounded-[1.5rem] pl-16 pr-6 py-5 text-white placeholder:text-slate-800 outline-none transition-all font-bold tracking-widest text-sm ${isFieldMissing('confirmPassword') ? 'border-red-500/50 animate-error-pulse' : 'border-white/10 focus:border-cyan-500/50'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3"
                                            >
                                                {isLoading ? 'Finishing...' : 'Complete Registration'}
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                        </motion.form>
                                    )}

                                    {step === 'SUCCESS' && (
                                        <motion.div 
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center space-y-10"
                                        >
                                            <div className="relative inline-block">
                                                <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 animate-pulse"></div>
                                                <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30 relative z-10">
                                                    <CheckCircle2 className="w-12 h-12 text-cyan-400" />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Welcome Aboard</h2>
                                                <p className="text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto text-sm">Your research profile has been successfully generated.</p>
                                            </div>

                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full py-6 bg-white text-slate-950 rounded-[3rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-cyan-500 transition-all shadow-2xl"
                                            >
                                                Enter Dashboard
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Social Auth Section */}
                    {((mode === 'LOGIN') || (mode === 'REGISTER' && step === 'INFO')) && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-12 relative z-10"
                        >
                            <div className="relative flex items-center justify-center mb-10">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <span className="relative px-6 bg-[#0a0f1e] text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
                                    Or Continue With
                                </span>
                            </div>

                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGoogleBtnClick}
                                className="w-full py-5 bg-slate-950/50 border border-white/10 rounded-[1.5rem] flex items-center justify-center gap-4 hover:bg-white/5 hover:border-white/20 transition-all group overflow-hidden relative"
                            >
                                <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 5.04c1.88 0 3.33.72 4.05 1.4L19.1 3.4C17.16 1.63 14.77 1 12 1 7.27 1 3.23 4.1 1.6 8.4l3.18 2.47C5.55 7.6 8.5 5.04 12 5.04z" />
                                    <path fill="#34A853" d="M23.5 12.25c0-.82-.07-1.61-.2-2.38H12v4.5h6.43c-.28 1.44-1.1 2.66-2.33 3.48l3.6 2.8c2.1-1.95 3.3-4.8 3.3-8.4z" />
                                    <path fill="#4285F4" d="M5.6 14.86a6.83 6.83 0 0 1 0-4.32L2.42 8.07a11.96 11.96 0 0 0 0 10.86l3.18-3.07z" />
                                    <path fill="#FBBC05" d="M12 23c3.24 0 5.96-1.07 7.93-2.9l-3.6-2.8c-1.1.75-2.5 1.2-4.33 1.2-3.5 0-6.45-2.56-7.52-6.03l-3.18 3.07C3.23 19.9 7.27 23 12 23z" />
                                </svg>
                                <span className="text-[10px] font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] relative z-10">Continue with Google</span>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Mode Toggle */}
                    <div className="mt-12 text-center relative z-10">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                            {mode === 'LOGIN' ? (
                                <>Don't have an account? <button onClick={() => { setMode('REGISTER'); setStep('INFO'); }} className="text-cyan-400 hover:text-white transition-all border-b border-cyan-400/30 hover:border-white font-black">Register Now</button></>
                            ) : (
                                <>Already connected? <button onClick={() => setMode('LOGIN')} className="text-cyan-400 hover:text-white transition-all border-b border-cyan-400/30 hover:border-white font-black">Log In Instead</button></>
                            )}
                        </p>
                    </div>
                </div>

                {/* Footer Legal Links */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-10 flex justify-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-700"
                >
                    <Link to="#" className="hover:text-cyan-600 transition-colors">Privacy Policy</Link>
                    <Link to="#" className="hover:text-cyan-600 transition-colors">Terms of Service</Link>
                    <Link to="#" className="hover:text-cyan-600 transition-colors">Support Center</Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
