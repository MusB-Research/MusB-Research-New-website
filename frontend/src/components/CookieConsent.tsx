import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ChevronRight, Lock, Settings, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('musb_cookie_consent');
        if (!consent) {
            // If no consent exists, show the banner
            setIsVisible(true);
        } else if (consent === 'rejected') {
            // The user rejected all, so we show it again on new session/visit
            // Actually, the user said "when he came again so again so them the pop"
            // If we use localStorage, it persists. If we use sessionStorage, it shows on every refresh.
            // But usually "came again" implies a new session.
            // Let's use a session-based check or just clear 'rejected' on load if we want it to reappear.
            setIsVisible(true);
            localStorage.removeItem('musb_cookie_consent'); 
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('musb_cookie_consent', 'accepted_all');
        setIsVisible(false);
    };

    const handleAcceptNecessary = () => {
        localStorage.setItem('musb_cookie_consent', 'accepted_necessary');
        setIsVisible(false);
    };

    const handleRejectAll = () => {
        // User wants it to reappear when they come again.
        // We set it to 'rejected' for this session-like behavior, 
        // but since they want it to show again on "coming again", 
        // we won't set a permanent "do not show" flag if rejected.
        localStorage.setItem('musb_cookie_consent', 'rejected');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-[480px] z-[200]"
            >
                <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-white font-black uppercase tracking-widest text-sm italic">Privacy Matters</h4>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Cookie & Data Policy</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                We use cookies to enhance your experience, analyze site traffic, and provide secure authentication. By clicking "Accept All", you consent to our use of cookies.
                            </p>

                            <button 
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-cyan-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                            >
                                <Settings className="w-3 h-3" />
                                {showDetails ? 'Hide Details' : 'Manage Preferences'}
                            </button>

                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-3 pt-2"
                                    >
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Necessary</span>
                                                <div className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase">Required</div>
                                            </div>
                                            <p className="text-slate-500 text-[11px] leading-snug">Essential for login, security, and core functionality. Cannot be turned off.</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 opacity-60">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Analytics</span>
                                                <div className="w-8 h-4 rounded-full bg-slate-800 relative">
                                                    <div className="absolute left-1 top-1 w-2 h-2 rounded-full bg-slate-600"></div>
                                                </div>
                                            </div>
                                            <p className="text-slate-500 text-[11px] leading-snug">Helps us understand how visitors interact with our research platform.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleAcceptAll}
                                className="w-full bg-cyan-500 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 group/btn"
                            >
                                Accept All Cookies
                                <Check className="w-4 h-4 group-hover/btn:scale-125 transition-transform" />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleAcceptNecessary}
                                    className="bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all text-center"
                                >
                                    Necessary Only
                                </button>
                                <button
                                    onClick={handleRejectAll}
                                    className="bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all text-center"
                                >
                                    Reject All
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-slate-600 text-[9px] font-medium uppercase tracking-widest pt-2">
                            Read our <Link to="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</Link> for more info.
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CookieConsent;
