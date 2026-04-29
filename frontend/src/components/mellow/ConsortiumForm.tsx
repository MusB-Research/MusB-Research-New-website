import React from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConsortiumFormProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    onSubmitSuccess?: () => void;
    showCompany?: boolean;
    showPurpose?: boolean;
}

export default function ConsortiumForm({ 
    isOpen, 
    onClose, 
    title, 
    subtitle, 
    onSubmitSuccess,
    showCompany = true,
    showPurpose = true
}: ConsortiumFormProps) {
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        organizationType: '',
        partnershipInterest: '',
        purpose: ''
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/contact/submit/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    message: formData.purpose,
                    metadata: {
                        source: 'MELLOW_CONSORTIUM_INQUIRY',
                        company: formData.companyName,
                        organizationType: formData.organizationType,
                        partnershipInterest: formData.partnershipInterest,
                        timestamp: new Date().toISOString()
                    }
                }),
            });

            if (!response.ok) throw new Error('Failed to submit inquiry');

            setIsSubmitting(false);
            onSubmitSuccess?.();
            onClose();
            alert("Thank you! Your inquiry has been sent to the MELLOW Consortium team. We will reach out to you shortly.");
        } catch (error) {
            console.error('Submission error:', error);
            setIsSubmitting(false);
            alert("We encountered an error. Please try again or email us directly at info@musbresearch.com.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" 
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0a1120] border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl overflow-hidden"
                    >
                        {/* Background Aesthetics */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-20"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-6 relative z-10">
                            <div className="space-y-1">
                                <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">{title}</h2>
                                {subtitle && <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase opacity-80">{subtitle}</p>}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">First Name *</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700 text-sm"
                                            placeholder="First"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Last Name *</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700 text-sm"
                                            placeholder="Last"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Company / Institution *</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                        className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700 text-sm"
                                        placeholder="Organization name"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Email Address *</label>
                                        <input 
                                            required
                                            type="email" 
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700 text-sm"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Phone Number *</label>
                                        <input 
                                            required
                                            type="tel" 
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700 text-sm"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Organization Type *</label>
                                        <select 
                                            required
                                            value={formData.organizationType}
                                            onChange={(e) => setFormData({...formData, organizationType: e.target.value})}
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all appearance-none cursor-pointer text-sm"
                                        >
                                            <option value="" disabled className="bg-[#0a1120]">Select type...</option>
                                            <option value="CRO" className="bg-[#0a1120]">CRO / Research Org</option>
                                            <option value="Sponsor" className="bg-[#0a1120]">Biotech / Pharma Sponsor</option>
                                            <option value="Academic" className="bg-[#0a1120]">Academic Institution</option>
                                            <option value="Other" className="bg-[#0a1120]">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Partnership Interest *</label>
                                        <select 
                                            required
                                            value={formData.partnershipInterest}
                                            onChange={(e) => setFormData({...formData, partnershipInterest: e.target.value})}
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all appearance-none cursor-pointer text-sm"
                                        >
                                            <option value="" disabled className="bg-[#0a1120]">Select interest...</option>
                                            <option value="Clinical" className="bg-[#0a1120]">Clinical Trial Collaboration</option>
                                            <option value="R&D" className="bg-[#0a1120]">R&D / Innovation Partner</option>
                                            <option value="Sponsorship" className="bg-[#0a1120]">Consortium Sponsorship</option>
                                            <option value="Other" className="bg-[#0a1120]">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Message / Questions</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                                        className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all resize-none placeholder:text-slate-700 text-sm"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <button 
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-[0.25em] py-4 rounded-xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group mt-2"
                                >
                                    {isSubmitting ? 'Processing...' : 'Request Discovery Call'}
                                    {!isSubmitting && <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
