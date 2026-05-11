import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Clock,
    Calendar,
    ArrowRight,
    Search,
    Stethoscope,
    ShieldCheck,
    Mail,
    Phone,
    Plus,
    Loader2,
    X,
    ChevronDown,
    MapPin,
    User,
    ArrowUpRight,
    Lock,
    Check
} from 'lucide-react';
import MeshBackground from '../components/MeshBackground';
import AnimatedBackground from '../components/AnimatedBackground';
import { fetchStudies, Study } from '../data/studies';
import { authFetch, API, getAccessToken, getUser, saveToken, saveUser } from '../utils/auth';
import { Skeleton } from './Participant/SharedComponents';

const ELIGIBILITY_CRITERIA = [
    "I am between 18 and 65 years old",
    "I often experience bloating or gas",
    "I am not currently pregnant",
    "I am able to attend 2–3 study visits",
    "I have not been diagnosed with GERD, IBD, or celiac disease",
    "I have not taken probiotics or digestive enzymes in the past 2 weeks",
    "I have not taken antibiotics in the past month",
    "I do not have major chronic illnesses requiring regular prescription medication",
    "I am open to trying a natural gut health product as part of a study"
];

export default function StudyScreener() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [study, setStudy] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    // ── Form State ──────────────────────────────────────────────────────
    const [formData, setFormData] = useState({
        trialsInLast30Days: '',
        zipCode: '',
        city: '',
        state: '',
        country: 'United States',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bestTime: '',
        cvConsent: false
    });

    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
    const [isLocating, setIsLocating] = useState(false);

    const user = getUser();

    // ── Initialization ──────────────────────────────────────────────────
    useLayoutEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${API}/api/public-studies/${id}/`);
                if (res.ok) {
                    const data = await res.json();
                    setStudy(data);

                    let initialFormData = {
                        trialsInLast30Days: '',
                        zipCode: '',
                        city: '',
                        state: '',
                        country: 'United States',
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        bestTime: '',
                        cvConsent: false
                    };

                    // Pre-fill from User Session
                    if (user) {
                        initialFormData = {
                            ...initialFormData,
                            firstName: user.first_name || user.firstName || user.full_name?.split(' ')[0] || '',
                            lastName: user.last_name || user.lastName || user.full_name?.split(' ').slice(1).join(' ') || '',
                            email: user.email || '',
                            phone: user.decrypted_phone || user.phone_number || user.phone || '',
                            zipCode: user.zip_code || user.zipCode || '',
                            city: user.city || '',
                            state: user.state || '',
                            country: user.country || 'United States'
                        };
                        setFormData(initialFormData);
                    }

                    // Dynamic Eligibility Criteria Initialization
                    const dynamicQuestions = data.screener_config?.questions || 
                                           data.screener_config?.steps?.find((s: any) => s.type === 'user_input')?.questions;
                    
                    const initialAnswers: Record<string, any> = {};
                    const filledFields = new Set<string>();

                    if (Array.isArray(dynamicQuestions) && dynamicQuestions.length > 0) {
                        dynamicQuestions.forEach((q: any, i: number) => {
                            const qId = q.id || q.key || String(i);
                            
                            // Initialize default value
                            if (q.type === 'choice' && q.allow_multiple) {
                                initialAnswers[qId] = [];
                            } else {
                                initialAnswers[qId] = null;
                            }

                            // Auto-fill from Profile if logged in
                            if (user) {
                                const label = (typeof q === 'string' ? q : (q.label || q.placeholder || '')).toLowerCase();
                                
                                if (label.includes('age')) {
                                    if (user.age) {
                                        initialAnswers[qId] = user.age;
                                        filledFields.add(qId);
                                    }
                                } else if (label.includes('gender') || label.includes('sex')) {
                                    const genderVal = user.gender;
                                    if (genderVal) {
                                        // Try to match with options if it's a choice question
                                        if (q.options) {
                                            const match = q.options.find((opt: string) => 
                                                opt.toLowerCase() === genderVal.toLowerCase() || 
                                                (genderVal.toLowerCase() === 'male' && opt.toLowerCase() === 'man') ||
                                                (genderVal.toLowerCase() === 'female' && opt.toLowerCase() === 'woman')
                                            );
                                            if (match) {
                                                initialAnswers[qId] = match;
                                                filledFields.add(qId);
                                            }
                                        } else {
                                            initialAnswers[qId] = genderVal;
                                            filledFields.add(qId);
                                        }
                                    }
                                } else if (label.includes('country')) {
                                    initialAnswers[qId] = user.country || 'United States';
                                    filledFields.add(qId);
                                } else if (label.includes('reside') || label.includes('location')) {
                                    if (user.country || user.city) {
                                        initialAnswers[qId] = user.country || user.city;
                                        filledFields.add(qId);
                                    }
                                }
                            }
                        });
                        setAnswers(initialAnswers);
                        setAutoFilledFields(filledFields);
                    } else {
                        ELIGIBILITY_CRITERIA.forEach((_, i) => { initialAnswers[String(i)] = false; });
                        setAnswers(initialAnswers);
                    }
                } else {
                    navigate('/trials');
                }
            } catch (err) {
                console.error(err);
                navigate('/trials');
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, [id]);

    const handleAnswerChange = (qId: string, value: any, isMultiple = false) => {
        setAutoFilledFields(prev => {
            const next = new Set(prev);
            next.delete(qId); // Remove from auto-filled if user manually changes it
            return next;
        });
        setAnswers(prev => {
            if (isMultiple) {
                const current = Array.isArray(prev[qId]) ? prev[qId] : [];
                if (current.includes(value)) {
                    return { ...prev, [qId]: current.filter((v: any) => v !== value) };
                }
                return { ...prev, [qId]: [...current, value] };
            }
            return { ...prev, [qId]: value };
        });
    };

    const handleZipChange = async (val: string) => {
        setFormData(prev => ({ ...prev, zipCode: val }));
        if (val.length >= 5) {
            setIsLocating(true);
            try {
                // Use backend proxy to avoid CSP issues
                const response = await authFetch(`${API}/api/zip-lookup/us/${val}/`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.places?.[0]) {
                        const p = data.places[0];
                        setFormData(prev => ({ 
                            ...prev, 
                            city: p['place name'] || '', 
                            state: p['state'] || '',
                            country: 'United States'
                        }));
                    }
                }
            } catch (e) { } finally { setIsLocating(false); }
        }
    };

    // ── Google Auth ──────────────────────────────────────────────────────
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const handleCredentialResponse = async (response: any) => {
        if (!response.credential) return;
        setIsLoading(true);
        setError(null);
        try {
            const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await fetch(`${API}/api/auth/google-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credential: response.credential,
                    timezone: detectedTimezone
                }),
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Google login failed');

            saveToken(data.access, data.user.role, undefined, data.refresh);
            saveUser(data.user);
            window.location.reload();
        } catch (err: any) {
            console.error("Google Auth Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user || step !== 2) return;

        const initGoogle = () => {
            if (window.google?.accounts?.id) {
                const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                if (!client_id) return;

                try {
                    window.google.accounts.id.initialize({
                        client_id: client_id,
                        callback: handleCredentialResponse,
                        auto_select: false,
                        use_fedcm: false
                    });
                    
                    if (googleButtonRef.current) {
                        window.google.accounts.id.renderButton(googleButtonRef.current, {
                            theme: 'filled_black', 
                            size: 'large', 
                            width: 320, 
                            shape: 'rectangular', 
                            text: 'continue_with'
                        });
                    }
                } catch (err) {}
            }
        };

        const timer = setTimeout(initGoogle, 1000);
        return () => clearTimeout(timer);
    }, [user, step]);

    const handleSubmit = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.cvConsent) {
            setError('Please complete all contact details and consent.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const dynamicQuestions = study.screener_config?.questions || 
                                           study.screener_config?.steps?.find((s: any) => s.type === 'user_input')?.questions || 
                                           ELIGIBILITY_CRITERIA;

            const allAnswered = Object.values(answers).every(v => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== ''));
            const outcome = allAnswered ? 'ELIGIBLE' : 'MAYBE';
            
            // Map index-based checklist results for backward compatibility if needed
            const checklistResults = Array.isArray(dynamicQuestions) ? dynamicQuestions.map((c: any, i: number) => {
                const qId = c.id || c.key || String(i);
                return {
                    text: typeof c === 'string' ? c : (c?.label || 'Untitled Question'),
                    value: answers[qId]
                };
            }) : [];

            await authFetch(`${API}/api/contact/submit/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    phone: formData.phone,
                    study_id: study.id,
                    inquiry_type_slug: 'screening',
                    metadata: {
                        outcome,
                        answers, // Flat object with question IDs as keys
                        formData: {
                            ...formData,
                            checklist_results: checklistResults
                        }
                    }
                })
            });

            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setError(err.message || 'Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !study) {
        return (
            <div className="min-h-screen bg-transparent pt-40 pb-24 px-6 flex flex-col items-center">
                <div className="w-full max-w-2xl space-y-6">
                    <Skeleton className="h-[200px] w-full rounded-3xl bg-white/5" />
                    <Skeleton className="h-[300px] w-full rounded-3xl bg-white/5" />
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl"
                 >
                    <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto text-cyan-400">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Form Submitted</h2>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium">
                            Thank you for your interest in the <span className="text-white">{study.title}</span>. 
                            Our team will review your information and reach out to you shortly.
                        </p>
                    </div>
                    <div className="pt-8 flex flex-col gap-6">
                        {user ? (
                            <div className="space-y-6">
                                <p className="text-slate-400 text-sm font-medium">
                                    Since you're already logged in, you can track your application status directly in your portal.
                                </p>
                                <Link 
                                    to="/dashboard/participant" 
                                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl group"
                                >
                                    Go to My Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                    <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Next Step: Account Creation</h4>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed text-left">
                                        To view your results and track your application progress for this study, please create an account or sign in to your existing one.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link 
                                        to="/signin" 
                                        state={{ initialMode: 'REGISTER' }}
                                        className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl group"
                                    >
                                        Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link 
                                        to="/signin" 
                                        state={{ initialMode: 'LOGIN' }}
                                        className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#262626] text-white border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                        )}
                        
                        <Link 
                            to="/trials" 
                            className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all mt-4"
                        >
                            &larr; Back to all Clinical Trials
                        </Link>
                    </div>
                 </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pt-32 pb-24 px-6 font-sans text-white relative overflow-hidden">
             {/* Background Components for Branding Unity */}
             <MeshBackground />
             <AnimatedBackground />
             
             <div className="max-w-2xl mx-auto space-y-10 relative z-10">
                
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-10"
                        >
                            {/* Header Section from Screenshot */}
                            <div className="space-y-4">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">MusB Research</p>
                                <h1 className="text-4xl font-black text-white tracking-tight">Eligibility screening</h1>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Complete the form below to check your eligibility for our current study. It takes about 2 minutes.
                                </p>
                            </div>

                            {/* Card: Location */}
                            <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-8 space-y-6 shadow-xl">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Your Location</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">ZIP code</label>
                                        <input 
                                            type="text"
                                            value={formData.zipCode}
                                            onChange={(e) => handleZipChange(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="e.g. 33601"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">City</label>
                                        <input 
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">State</label>
                                        <input 
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="State"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">Country</label>
                                        <input 
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    Location is pre-filled based on your profile. <button onClick={() => setIsLocating(!isLocating)} className="text-blue-400 hover:underline">Update</button>
                                </p>
                            </div>

                            {/* Card: Trial Participation */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6 shadow-xl">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Recent Trial Participation</h3>
                                <p className="text-base font-bold text-white">Have you participated in a clinical trial in the past 30 days?</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setFormData({...formData, trialsInLast30Days: 'Yes'})}
                                        className={`py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${formData.trialsInLast30Days === 'Yes' ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-white hover:bg-white/5'}`}
                                    >
                                        Yes
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setFormData({...formData, trialsInLast30Days: 'No'});
                                            setTimeout(() => setStep(2), 300);
                                        }}
                                        className={`py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${formData.trialsInLast30Days === 'No' ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-white hover:bg-white/5'}`}
                                    >
                                        No
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {formData.trialsInLast30Days === 'Yes' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-[#4A3A10] border border-[#FFB800]/30 rounded-xl"
                                        >
                                            <p className="text-[13px] font-medium text-[#FFB800] leading-relaxed">
                                                Your current trial participation may affect your eligibility for this study. You are still welcome to review the criteria below — once your ongoing trial concludes, you may qualify to participate.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Card: Contact Information (Added to Bottom of Step 1) */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8 shadow-xl">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Your Contact Information</h3>
                                
                                {!user && (
                                    <>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            <div ref={googleButtonRef} className="flex-1" />
                                            <div className="hidden sm:flex flex-col items-center gap-2 px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-center">
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Already enrolled?</p>
                                                <Link to="/signin" className="text-xs font-black text-white hover:text-cyan-400 transition-all">Sign in</Link>
                                            </div>
                                        </div>

                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                                            <span className="relative bg-slate-900/40 px-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] backdrop-blur-sm rounded-lg">or fill in manually</span>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400">First name</label>
                                            <input 
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                                placeholder="Jane"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400">Last name</label>
                                            <input 
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                                placeholder="Smith"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">Email address</label>
                                        <input 
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="jane@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">Phone number</label>
                                        <input 
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        onClick={() => setStep(2)}
                                        className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Continue to Criteria <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <>
                                <button 
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all mb-4"
                                >
                                <ChevronLeft className="w-4 h-4" /> Back to Location
                            </button>

                            {/* Card: Study & Checklist */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8 shadow-xl">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                                        Now enrolling
                                    </div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">{study.title}</h2>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Check all that apply to you:</p>
                                    <div className="space-y-6">
                                        {(study.screener_config?.questions || study.screener_config?.steps?.find((s: any) => s.type === 'user_input')?.questions || ELIGIBILITY_CRITERIA).map((q: any, i: number) => {
                                            const qId = q.id || q.key || String(i);
                                            const isAnswered = Boolean(answers[qId] !== null && answers[qId] !== undefined && (Array.isArray(answers[qId]) ? answers[qId].length > 0 : answers[qId] !== ''));
                                            const isAutoFilled = Boolean(autoFilledFields?.has?.(qId));
                                            
                                            if (typeof q === 'string') {
                                                return (
                                                    <div 
                                                        key={i}
                                                        onClick={() => handleAnswerChange(qId, !answers[qId])}
                                                        className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${answers[qId] ? 'bg-white border-white shadow-lg shadow-white/5' : 'bg-transparent border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`text-sm font-bold ${answers[qId] ? 'text-black' : 'text-slate-400 group-hover:text-white'}`}>{q}</span>
                                                            {isAutoFilled && (
                                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                                                    <ShieldCheck className="w-2.5 h-2.5" /> Pre-filled from profile
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${answers[qId] ? 'bg-black border-black' : 'bg-transparent border-white/20'}`}>
                                                            {answers[qId] && <Check className="w-4 h-4 text-white" />}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={qId} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6 shadow-xl">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col gap-2">
                                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{q.label || 'Question'}</h3>
                                                            {isAutoFilled && (
                                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                    <ShieldCheck className="w-3 h-3" /> Auto-filled from profile
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isAnswered && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                                                    </div>
                                                    
                                                    <p className="text-lg font-black text-white leading-tight">{q.placeholder || q.label}</p>

                                                    {(q.type === 'yesno' || q.type === 'boolean') && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button 
                                                                onClick={() => handleAnswerChange(qId, 'Yes')}
                                                                className={`py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${answers[qId] === 'Yes' ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent border-white/10 text-white hover:bg-white/5'}`}
                                                            >
                                                                Yes
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAnswerChange(qId, 'No')}
                                                                className={`py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${answers[qId] === 'No' ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent border-white/10 text-white hover:bg-white/5'}`}
                                                            >
                                                                No
                                                            </button>
                                                        </div>
                                                    )}

                                                    {(q.type === 'choice' || q.type === 'select' || q.type === 'multiple_choice' || q.type === 'dropdown') && (
                                                        <div className="flex flex-col gap-3">
                                                            {(q.options || []).map((opt: string) => {
                                                                const isSelected = Array.isArray(answers[qId]) ? answers[qId].includes(opt) : answers[qId] === opt;
                                                                return (
                                                                    <button 
                                                                        key={opt}
                                                                        onClick={() => handleAnswerChange(qId, opt, q.allow_multiple)}
                                                                        className={`w-full py-4 px-6 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between group ${isSelected ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent border-white/10 text-white hover:bg-white/5'}`}
                                                                    >
                                                                        <span>{typeof opt === 'string' ? opt : JSON.stringify(opt)}</span>
                                                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-black border-black' : 'bg-white/5 border-white/10 group-hover:border-white/30'}`}>
                                                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Card: Contact Information (Restored to Step 2) */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8 shadow-xl">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Your Contact Information</h3>
                                
                                {!user && (
                                    <>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            <div ref={googleButtonRef} className="flex-1" />
                                            <div className="hidden sm:flex flex-col items-center gap-2 px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-center">
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Already enrolled?</p>
                                                <Link to="/signin" className="text-xs font-black text-white hover:text-cyan-400 transition-all">Sign in</Link>
                                            </div>
                                        </div>

                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                                            <span className="relative bg-slate-900/40 px-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] backdrop-blur-sm rounded-lg">or fill in manually</span>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400">First name</label>
                                            <input 
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                                placeholder="Jane"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400">Last name</label>
                                            <input 
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                                placeholder="Smith"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">Email address</label>
                                        <input 
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="jane@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">Phone number</label>
                                        <input 
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400">Best time to reach you</label>
                                        <select 
                                            value={formData.bestTime}
                                            onChange={(e) => setFormData({...formData, bestTime: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select a preference</option>
                                            <option value="MORNING">Morning (8am - 12pm)</option>
                                            <option value="AFTERNOON">Afternoon (12pm - 5pm)</option>
                                            <option value="EVENING">Evening (5pm - 8pm)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${formData.cvConsent ? 'bg-white border-white text-black' : 'border-white/20 group-hover:border-white/40'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.cvConsent}
                                                onChange={(e) => setFormData({...formData, cvConsent: e.target.checked})}
                                                className="hidden"
                                            />
                                            {formData.cvConsent && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            By checking this box, I agree that the research team may contact me via email or phone regarding my eligibility and potential participation in this study.
                                        </p>
                                    </label>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full bg-cyan-500 text-slate-900 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit my information"}
                                </button>
                            </div>
                        </>
                    </motion.div>
                    )}
                </AnimatePresence>

                {/* Badges */}
                <div className="flex justify-center gap-8 pt-8 opacity-30">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Secure & Private</span>
                    </div>
                </div>

             </div>
        </div>
    );
}
