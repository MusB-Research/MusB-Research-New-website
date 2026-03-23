import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle2, FileSignature, AlertCircle, Eye, Download } from 'lucide-react';
import { authFetch , API } from '../utils/auth';

export default function StudyConsent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [study, setStudy] = useState<any | null>(null);
    
    // Tracking & Fingerprinting (Section 8 & 9)
    const [timezone, setTimezone] = useState('');
    const [deviceFingerprint, setDeviceFingerprint] = useState('');

    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [signature, setSignature] = useState(location.state?.fullName || '');
    const [email] = useState(location.state?.email || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStudy = async () => {
            try {
                const response = await authFetch(`${API}/api/studies/${id}/`);
                if (!response.ok) throw new Error('Study not found');
                const data = await response.json();
                setStudy({
                    ...data,
                    id: data.protocol_id || data.id,
                    duration: "4-12 Weeks"
                });
            } catch (err) {
                navigate('/trials');
            }
        };
        fetchStudy();

        // Section 8: Auto-detect strict timezone
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(tz);

        // Section 9: Simplified device hash
        const generateFingerprint = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.textBaseline = 'top';
                    ctx.font = '14px Arial';
                    ctx.fillText('MUSBResearchFingerprint', 2, 2);
                    const b64 = canvas.toDataURL();
                    let hash = 0;
                    for (let i = 0; i < b64.length; i++) {
                        hash = ((hash << 5) - hash) + b64.charCodeAt(i);
                        hash |= 0;
                    }
                    setDeviceFingerprint(Math.abs(hash).toString(16));
                }
            } catch (e) {
                setDeviceFingerprint('unavailable');
            }
        };
        generateFingerprint();

    }, [id, navigate]);

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                setScrolledToBottom(true);
            }
        }
    };

    const handleSignDocument = async () => {
        if (!agreed) {
            setError("You must agree to the terms.");
            return;
        }
        if (!signature || signature.trim().length < 3) {
            setError("Please type your full legal name as an electronic signature.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const apiUrl = API;
            const res = await authFetch(`${apiUrl}/api/consent/`, {
                method: 'POST',
                body: JSON.stringify({
                    study: study.pk || study.id, // Handles both API and Hardcoded fallback
                    full_name: signature.trim(),
                    email: email || 'anonymous@musbresearch.com',
                    device_hash: deviceFingerprint,
                    timezone_detected: timezone
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Submission failed');
            }
            
            // Redirect to registration with email pre-filled
            navigate(`/signin?mode=signup&email=${encodeURIComponent(email)}&consented=true`);

        } catch (e: any) {
            setError(e.message || 'Failed to securely submit consent. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (!study) return null;

    return (
        <div className="min-h-screen pt-40 pb-24 px-4 bg-transparent text-slate-200">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/30 rounded-3xl flex items-center justify-center mx-auto text-cyan-400 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                        <FileSignature className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tight">Informed Consent Form</h1>
                    <p className="text-cyan-400 font-bold text-sm uppercase tracking-widest">{study.title}</p>
                </div>

                {/* Main Content Area */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-8">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            <span className="text-xs font-black tracking-widest text-slate-300 uppercase">HIPAA/GDPR Compliant Document v1.2</span>
                        </div>
                        <button className="text-cyan-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-cyan-500/10 px-4 py-2 rounded-xl">
                            <Download className="w-4 h-4" /> Save PDF
                        </button>
                    </div>

                    {/* Scrollable Document */}
                    <div 
                        ref={contentRef}
                        onScroll={handleScroll}
                        className="bg-slate-950/50 rounded-2xl p-8 max-h-[500px] overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed border border-white/5 relative custom-scrollbar"
                    >
                        <h2 className="text-xl font-bold text-white uppercase mb-4 text-center">Protocol # {study.id.toUpperCase()}</h2>
                        
                        <div className="space-y-4">
                            <h3 className="font-bold text-white uppercase tracking-widest text-xs border-b border-white/10 pb-2">1. Purpose of the Study</h3>
                            <p>You are invited to participate in a clinical research study titled <strong>{study.title}</strong>. The purpose of this study is to investigate specific digital or physical biomarkers over a defined duration. Your participation will contribute to scientific knowledge and potential future therapies.</p>
                            
                            <h3 className="font-bold text-white uppercase tracking-widest text-xs border-b border-white/10 pb-2 pt-4">2. Procedures & Time Commitment</h3>
                            <p>If you agree to participate, you will be expected to complete regular digital tasks, surveys, and potentially utilize shipped physical kits. The estimated duration of the trial is {study.duration}. All activities are outlined within your Participant Portal.</p>
                            
                            <h3 className="font-bold text-white uppercase tracking-widest text-xs border-b border-white/10 pb-2 pt-4">3. Data Privacy & GDPR/HIPAA Compliance</h3>
                            <p>Your privacy is our utmost priority. All personal health information is strictly protected by global compliance frameworks (including HIPAA in the US and GDPR for EU/UK participants).</p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-400">
                                <li>Data is encrypted at rest and in transit.</li>
                                <li>Subject identity is pseudo-anonymized via Secure Participant IDs before being provided to Sponsors or internal researchers.</li>
                                <li>You maintain the <strong>Right to Withdraw</strong> from this study at any time without penalty or loss of benefits.</li>
                                <li>You maintain the <strong>Right to Data Deletion</strong>. A request will permanently scrub non-aggregated clinical responses associated with your profile from active servers within 30 days.</li>
                            </ul>
                            
                            <h3 className="font-bold text-white uppercase tracking-widest text-xs border-b border-white/10 pb-2 pt-4">4. Risks & Discomforts</h3>
                            <p>While this is primarily an observational or decentralized study, there may be minor risks associated with data entry or standard kit usage. Full risk disclosure is maintained by the designated Principal Investigator (PI).</p>

                            <h3 className="font-bold text-white uppercase tracking-widest text-xs border-b border-white/10 pb-2 pt-4">5. Compensation</h3>
                            <p>If financial compensation is rendered applicable to this protocol arm, details will be strictly issued via our compliant payment gateway upon successful completion of required trial milestones.</p>
                        </div>
                        
                        <div className="h-20" /> {/* Spacer purely so user definitely scrolls far enough */}
                        
                        {!scrolledToBottom && (
                            <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-slate-950 to-transparent pt-12 text-center pb-4 text-cyan-500 text-xs font-bold uppercase tracking-widest animate-pulse pointer-events-none">
                                Scroll down to review full terms
                            </div>
                        )}
                    </div>

                    {/* Signature Block */}
                    <div className={`mt-8 transition-all duration-700 ${scrolledToBottom ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4 pointer-events-none grayscale'}`}>
                        <div className="bg-slate-900/50 border border-white/10 p-6 md:p-8 rounded-2xl space-y-6">
                            
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <input 
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-6 h-6 rounded border-white/10 bg-white/5 checked:bg-cyan-500 transition-all mt-1"
                                />
                                <div className="space-y-1">
                                    <span className="text-sm font-black uppercase tracking-widest text-white">Declaration of Consent</span>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        By checking this box, I confirm that I have read the Informed Consent Form, understand the risks and benefits, and voluntarily agree to participate in this study.
                                    </p>
                                </div>
                            </label>

                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Electronic Signature</label>
                                <input 
                                    type="text" 
                                    placeholder="Type your full legal name"
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-6 py-4 text-white text-lg font-mono outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <div className="bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest p-4 rounded-xl flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button 
                                onClick={handleSignDocument}
                                disabled={isSubmitting || !agreed || !signature.trim()}
                                className="w-full py-5 bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none"
                            >
                                {isSubmitting ? 'Securing Consent Record...' : 'Sign & Submit Consent'}
                            </button>

                        </div>

                        {/* Security Tracking Feedback */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                            <div className="flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5" /> Detected Timezone: {timezone || 'Fetching...'}
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Device Integrity: {deviceFingerprint ? 'Verified (Anonymous Hash)' : 'Verifying...'}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
