import React, { useState } from 'react';
import { X, Check, Send, Loader2, ChevronDown } from 'lucide-react';
import { submitSponsorInquiry } from '../api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function BecomePartnerModal({ isOpen, onClose }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        orgType: '',
        interest: '',
        message: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent double submission
        
        setIsSubmitting(true);
        try {
            await submitSponsorInquiry({
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                company: formData.company,
                message: `Organization Type: ${formData.orgType}\nInterest: ${formData.interest}\n\n${formData.message}`
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting partnership form:', error);
            alert('Failed to submit. Please try again or contact us at info@musbresearch.com');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl bg-[#0c1221]/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 fade-in duration-500 translate-y-24 my-12">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full"></div>

                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors text-slate-500 hover:text-white z-10"
                >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <div className="pt-8 px-6 pb-6 md:pt-10 md:px-12 md:pb-10">
                    {submitted ? (
                        <div className="text-center space-y-4 py-8 animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <Check className="w-8 h-8 stroke-[3]" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white">Interest Received</h2>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                                Thank you for your interest in partnering with MELLOW. Our team will reach out to you within 2 business days.
                            </p>
                            <button 
                                onClick={onClose}
                                className="bg-white text-slate-950 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all shadow-lg"
                            >
                                Close Window
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-0.5">
                                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight tracking-tight">Express Your Interest</h2>
                                <p className="text-slate-400 text-sm font-medium">MusB™ Research Partnership Inquiry</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="group space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 ml-1 group-focus-within:text-cyan-400 transition-colors">First name *</label>
                                        <input 
                                            required 
                                            type="text" 
                                            placeholder="First"
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all font-medium placeholder:text-slate-700"
                                            value={formData.firstName}
                                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                                        />
                                    </div>
                                    <div className="group space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 ml-1 group-focus-within:text-cyan-400 transition-colors">Last name *</label>
                                        <input 
                                            required 
                                            type="text" 
                                            placeholder="Last"
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all font-medium placeholder:text-slate-700"
                                            value={formData.lastName}
                                            onChange={e => setFormData({...formData, lastName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="group space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 ml-1 group-focus-within:text-cyan-400 transition-colors">Company / Institution *</label>
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="Organization name"
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all font-medium placeholder:text-slate-700"
                                        value={formData.company}
                                        onChange={e => setFormData({...formData, company: e.target.value})}
                                    />
                                </div>

                                <div className="group space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 ml-1 group-focus-within:text-cyan-400 transition-colors">Email address *</label>
                                    <input 
                                        required 
                                        type="email" 
                                        placeholder="you@company.com"
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all font-medium placeholder:text-slate-700"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="group space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 ml-1 group-focus-within:text-cyan-400 transition-colors">Organization type *</label>
                                        <div className="relative">
                                            <select 
                                                required
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all font-medium appearance-none relative z-10"
                                                value={formData.orgType}
                                                onChange={e => setFormData({...formData, orgType: e.target.value})}
                                            >
                                                <option value="" disabled className="bg-slate-900 text-slate-500">Select type...</option>
                                                <option value="Dietary Supplement Company" className="bg-slate-900">Dietary Supplement Company</option>
                                                <option value="Functional Food / Beverage Company" className="bg-slate-900">Functional Food / Beverage Company</option>
                                                <option value="Nutraceutical / Ingredient Supplier" className="bg-slate-900">Nutraceutical / Ingredient Supplier</option>
                                                <option value="Pharmaceutical Company" className="bg-slate-900">Pharmaceutical Company</option>
                                                <option value="Biotech / Life Sciences Company" className="bg-slate-900">Biotech / Life Sciences Company</option>
                                                <option value="Academic / Research Institution" className="bg-slate-900">Academic / Research Institution</option>
                                                <option value="Investor / Venture Capital" className="bg-slate-900">Investor / Venture Capital</option>
                                                <option value="Other" className="bg-slate-900">Other</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20 text-slate-600">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="group space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 ml-1 group-focus-within:text-cyan-400 transition-colors">Partnership interest *</label>
                                        <div className="relative">
                                            <select 
                                                required
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all font-medium appearance-none relative z-10"
                                                value={formData.interest}
                                                onChange={e => setFormData({...formData, interest: e.target.value})}
                                            >
                                                <option value="" disabled className="bg-slate-900 text-slate-500">Select interest...</option>
                                                <option value="Single Product Clinical Trial" className="bg-slate-900">Single Product Clinical Trial</option>
                                                <option value="Multi-Product Annual Program" className="bg-slate-900">Multi-Product Annual Program</option>
                                                <option value="Founding Sponsor Tier" className="bg-slate-900">Founding Sponsor Tier</option>
                                                <option value="Discovery Collaboration" className="bg-slate-900">Discovery Collaboration</option>
                                                <option value="Investigator / Grant Collaboration" className="bg-slate-900">Investigator / Grant Collaboration</option>
                                                <option value="Not sure — want to discuss options" className="bg-slate-900">Not sure — want to discuss options</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20 text-slate-600">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="group space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 ml-1 group-focus-within:text-cyan-400 transition-colors">Message / questions</label>
                                    <textarea 
                                        rows={2} 
                                        placeholder="How can we help?"
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all font-medium resize-none placeholder:text-slate-800"
                                        value={formData.message}
                                        onChange={e => setFormData({...formData, message: e.target.value})}
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.25em] transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-3 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-600"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Discovery Call'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
