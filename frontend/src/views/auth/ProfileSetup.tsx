import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Globe, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch, saveToken, saveUser, getUser , API } from '../../utils/auth';

export default function ProfileSetup() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        full_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        place_of_origin: '',
        mobile_number: ''
    });
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        medical_licence: null,
        insurance_certificate: null,
        cv_document: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        }
    };

    const user = getUser();
    const userRole = (user?.role || '').toUpperCase();
    const isProfessional = userRole === 'PI' || userRole === 'COORDINATOR';
    const totalSteps = isProfessional ? 4 : 3;

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const apiUrl = API || 'http://localhost:8000';
            const submissionData = new FormData();
            
            // Append all text fields
            Object.entries(formData).forEach(([key, value]) => {
                submissionData.append(key, value);
            });
            
            // Append files for professional roles
            if (isProfessional) {
                Object.entries(files).forEach(([key, value]) => {
                    if (value) submissionData.append(key, value);
                });
            }

            const res = await authFetch(`${apiUrl}/api/auth/complete-profile/`, {
                method: 'POST',
                body: submissionData,
                // Do NOT set Content-Type header when using FormData; the browser will set it with the boundary
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Setup failed');

            // Update local user info and token
            const storedUser = getUser() || {};
            const updatedUser = { ...storedUser, ...data.user, profile_incomplete: false };
            saveUser(updatedUser);
            
            if (data.access) {
                saveToken(data.access, updatedUser.role || 'PARTICIPANT');
                window.dispatchEvent(new Event('auth-token-changed'));
            }

            setStep(totalSteps); // Success step
            setTimeout(() => {
                const role = (updatedUser.role || 'participant').toLowerCase();
                if (role === 'super_admin') {
                    window.location.href = '/dashboard/super-admin';
                } else if (role === 'admin' || role === 'coordinator') {
                    window.location.href = '/dashboard/admin';
                } else if (role === 'pi') {
                    window.location.href = '/dashboard/pi';
                } else if (role === 'sponsor') {
                    window.location.href = '/dashboard/sponsor';
                } else {
                    window.location.href = '/dashboard/participant';
                }
            }, 1000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07091e] flex items-center justify-center p-6 relative overflow-hidden font-sans">
             <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full" />
             <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full" />

             <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-[#0f1133]/60 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 md:p-16 shadow-2xl relative z-10 overflow-hidden"
             >
                {/* Progress Header */}
                <div className="flex items-center justify-between mb-16 px-4">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                        <div key={s} className="flex items-center gap-4 group">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${step === s ? 'bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-110' : 
                                step > s ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30' : 'bg-white/5 text-slate-600 border border-white/5'}`}>
                                {s === totalSteps && step === totalSteps ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            <div className="hidden sm:block">
                                <p className={`text-[9px] font-black uppercase tracking-widest ${step >= s ? 'text-white' : 'text-slate-700'}`}>
                                    {s === 1 ? 'Identity' : s === 2 ? 'Locality' : s === 3 && isProfessional ? 'Credentials' : 'Ready'}
                                </p>
                            </div>
                            {s < totalSteps && <div className={`w-8 h-[1px] mx-2 ${step > s ? 'bg-cyan-500/30' : 'bg-white/5'}`} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Identity <span className="text-cyan-400">Handshake</span></h2>
                                <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-[0.3em]">Verify and finalize your legal identity metrics</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3 px-2">
                                    <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">First Name</label>
                                    <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-cyan-500/40 transition-all font-bold" />
                                </div>
                                <div className="space-y-3 px-2">
                                    <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Middle Name</label>
                                    <input name="middle_name" value={formData.middle_name} onChange={handleChange} placeholder="Optional" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-cyan-500/40 transition-all font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3 px-2">
                                    <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Last Name</label>
                                    <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-cyan-500/40 transition-all font-bold" />
                                </div>
                                <div className="space-y-3 px-2">
                                    <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Gender Identity</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-500/40 transition-all font-bold appearance-none">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <button onClick={handleNext} disabled={!formData.first_name || !formData.last_name || !formData.gender} className="w-full py-6 bg-cyan-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] italic hover:bg-white hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
                                Initialize Next Phase <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Locality <span className="text-purple-400">Metrics</span></h2>
                                <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-[0.3em]">Geospatial and demographic synchronization</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3 px-2">
                                    <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Full Residential Address</label>
                                    <input name="full_address" value={formData.full_address} onChange={handleChange} placeholder="123 Research Way, Lab 4" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-bold" />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3 px-2">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">City</label>
                                        <input name="city" value={formData.city} onChange={handleChange} placeholder="Metro" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-3 px-2">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">State / Province</label>
                                        <input name="state" value={formData.state} onChange={handleChange} placeholder="Zone A" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-bold" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3 px-2">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">ZIP / PIN Code</label>
                                        <input name="zip_code" value={formData.zip_code} onChange={handleChange} placeholder="12345" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-3 px-2">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Country</label>
                                        <input name="country" value={formData.country} onChange={handleChange} placeholder="USA" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-bold" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3 px-2">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Place of Origin / Birth</label>
                                        <div className="relative">
                                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                                            <input name="place_of_origin" value={formData.place_of_origin} onChange={handleChange} placeholder="City, Country" className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] pl-16 pr-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-3 px-2">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">Mobile Number</label>
                                        <input name="mobile_number" value={formData.mobile_number} onChange={handleChange} placeholder="+1 234 567 8900" className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-6 py-4 text-white placeholder:text-slate-800 outline-none focus:border-purple-500/40 transition-all font-bold" />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                    <Heart className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-6 bg-white/5 border border-white/5 text-[#555a7a] rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Finalize Setup
                                </button>
                                <button onClick={isProfessional ? handleNext : handleSubmit} disabled={isLoading || !formData.full_address || !formData.city || !formData.state || !formData.zip_code || !formData.country || !formData.place_of_origin || !formData.mobile_number} className="flex-[2] py-6 bg-purple-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] italic shadow-xl shadow-purple-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed">
                                    {isProfessional ? (
                                        <>Continue to Credentials <ArrowRight className="w-5 h-5" /></>
                                    ) : (
                                        <>{isLoading ? 'Synchronizing...' : 'Authorize Profile'} <ShieldCheck className="w-5 h-5" /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && isProfessional && (
                        <motion.div
                            key="step3-credentials"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Professional <span className="text-emerald-400">Credentials</span></h2>
                                <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-[0.3em]">Compliance and regulatory documentation</p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { id: 'medical_licence', label: 'Medical Licence', icon: ShieldCheck },
                                    { id: 'insurance_certificate', label: 'Insurance Certificate', icon: MapPin },
                                    { id: 'cv_document', label: 'Professional CV', icon: User }
                                ].map((doc) => (
                                    <div key={doc.id} className="space-y-3 px-2">
                                        <label className="text-[10px] font-black text-[#555a7a] uppercase tracking-widest px-4 italic">{doc.label} (PDF, JPEG, PNG)</label>
                                        <div className="relative group">
                                            <doc.icon className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${files[doc.id] ? 'text-emerald-400' : 'text-slate-700'}`} />
                                            <input 
                                                type="file" 
                                                name={doc.id} 
                                                onChange={handleFileChange}
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-16 pr-6 py-4 text-white file:hidden cursor-pointer hover:border-emerald-500/30 transition-all font-bold text-xs"
                                            />
                                            {!files[doc.id] && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">Click to Upload</span>}
                                            {files[doc.id] && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400 uppercase tracking-widest pointer-events-none flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Selected</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                    <Heart className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-6 bg-white/5 border border-white/5 text-[#555a7a] rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back to Localities
                                </button>
                                <button onClick={handleSubmit} disabled={isLoading || !files.medical_licence || !files.insurance_certificate || !files.cv_document} className="flex-[2] py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] italic shadow-xl shadow-emerald-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed">
                                    {isLoading ? 'Synchronizing Docs...' : 'Initialize Final Handshake'} <ShieldCheck className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === totalSteps && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 space-y-10"
                        >
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-cyan-500 blur-[80px] opacity-20 animate-pulse" />
                                <div className="w-32 h-32 bg-cyan-500/10 border border-cyan-500/20 rounded-[3rem] flex items-center justify-center mx-auto text-cyan-400 relative z-10">
                                    <CheckCircle2 className="w-16 h-16" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Onboarding <span className="text-cyan-400">Complete</span></h3>
                                <p className="text-[10px] text-[#555a7a] font-black uppercase tracking-[0.3em] leading-relaxed">
                                    Identity synchronized. Security clearance granted.<br />
                                    Redirecting to secure terminal...
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
             </motion.div>
        </div>
    );
}
