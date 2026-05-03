import React from 'react';
import { X, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BiologicalAgeFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BiologicalAgeForm({ isOpen, onClose }: BiologicalAgeFormProps) {
    const [step, setStep] = React.useState(1);
    const [hasReport, setHasReport] = React.useState<boolean | null>(null);
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        values: {
            albumin: '',
            creatinine: '',
            glucose: '',
            crp: '',
            lymphocyte: '',
            mcv: '',
            rdw: '',
            alp: '',
            wbc: '',
            age: ''
        }
    });

    const medicalFields = [
        { id: 'albumin', label: 'Albumin (g/dL)', placeholder: '3.5 - 5.0' },
        { id: 'creatinine', label: 'Creatinine (mg/dL)', placeholder: '0.7 - 1.3' },
        { id: 'glucose', label: 'Glucose (mg/dL)', placeholder: '70 - 99' },
        { id: 'crp', label: 'C-reactive Protein (mg/L)', placeholder: '< 1.0' },
        { id: 'lymphocyte', label: 'Lymphocyte (%)', placeholder: '20 - 40' },
        { id: 'mcv', label: 'Mean Cell Volume (fL)', placeholder: '80 - 100' },
        { id: 'rdw', label: 'Red Cell Dist Width (%)', placeholder: '11.5 - 14.5' },
        { id: 'alp', label: 'Alkaline Phosphatase (U/L)', placeholder: '44 - 147' },
        { id: 'wbc', label: 'White Blood Cells (10^3/mL)', placeholder: '4.5 - 11.0' },
        { id: 'age', label: 'Age (years)', placeholder: 'Your current age' },
    ];

    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
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
                    message: "Request for Biological Age Analysis / Testing Contact",
                    metadata: {
                        source: 'BIOLOGICAL_AGE_INQUIRY',
                        hasReport: hasReport,
                        biomarkers: formData.values,
                        company: formData.companyName,
                        timestamp: new Date().toISOString()
                    }
                }),
            });

            if (!response.ok) throw new Error('Failed to submit inquiry');

            setIsSubmitting(false);
            alert("Success! Your information has been sent to our lab consortium. A specialist will contact you soon.");
            onClose();
        } catch (error) {
            console.error('Submission error:', error);
            setIsSubmitting(false);
            alert("We encountered an error. Please try again or email us at info@musbresearch.com.");
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
                        className="relative w-full max-w-2xl bg-[#0a1120] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        {/* Background Aesthetics */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />
                        
                        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white z-20">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="space-y-10 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-serif text-white tracking-tight">Biological Age Analysis</h2>
                                <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase opacity-80">Step {step} of 3</p>
                            </div>

                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">First Name *</label>
                                            <input 
                                                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700"
                                                placeholder="First"
                                                value={formData.firstName}
                                                onChange={e => setFormData({...formData, firstName: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Last Name *</label>
                                            <input 
                                                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700"
                                                placeholder="Last"
                                                value={formData.lastName}
                                                onChange={e => setFormData({...formData, lastName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Email Address *</label>
                                        <input 
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Phone Number *</label>
                                        <input 
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700"
                                            placeholder="+1 (555) 000-0000"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">Company / Institution</label>
                                        <input 
                                            className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-700"
                                            placeholder="Organization name (if applicable)"
                                            value={formData.companyName}
                                            onChange={e => setFormData({...formData, companyName: e.target.value})}
                                        />
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={handleNext} 
                                            disabled={!formData.email || !formData.firstName}
                                            className="bg-cyan-500 text-slate-900 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            Next Step <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8">
                                    <p className="text-xl text-white font-serif leading-relaxed">Do you have your recent medical testing report ready for analysis?</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <button 
                                            onClick={() => { setHasReport(true); handleNext(); }}
                                            className="p-8 rounded-[2rem] border border-white/10 bg-white/5 hover:border-cyan-500/50 transition-all text-center group"
                                        >
                                            <div className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400">Yes</div>
                                            <div className="text-xs text-slate-500 font-medium uppercase tracking-widest">I have the results</div>
                                        </button>
                                        <button 
                                            onClick={() => { setHasReport(false); handleNext(); }}
                                            className="p-8 rounded-[2rem] border border-white/10 bg-white/5 hover:border-cyan-500/50 transition-all text-center group"
                                        >
                                            <div className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400">No</div>
                                            <div className="text-xs text-slate-500 font-medium uppercase tracking-widest">I need testing</div>
                                        </button>
                                    </div>
                                    <button onClick={handleBack} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <ChevronLeft className="w-4 h-4" /> Back to details
                                    </button>
                                </div>
                            )}

                            {step === 3 && hasReport && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <p className="text-white font-medium text-lg">Please enter the clinical markers from your report:</p>
                                        <div className="grid grid-cols-2 gap-6">
                                            {medicalFields.map(field => (
                                                <div key={field.id} className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">{field.label}</label>
                                                    <input 
                                                        className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500/50 outline-none transition-all"
                                                        placeholder={field.placeholder}
                                                        value={(formData.values as any)[field.id]}
                                                        onChange={e => setFormData({
                                                            ...formData, 
                                                            values: { ...formData.values, [field.id]: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-6 border-top border-white/5">
                                        <button onClick={handleBack} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                            <ChevronLeft className="w-4 h-4" /> Back
                                        </button>
                                        <button 
                                            onClick={() => handleSubmit()} 
                                            disabled={isSubmitting}
                                            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:from-blue-500 hover:to-blue-400 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
                                        >
                                            {isSubmitting ? 'Analyzing...' : 'Submit for Analysis'}
                                            {!isSubmitting && <Send className="w-4 h-4" /> }
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && !hasReport && (
                                <div className="space-y-10 text-center py-6">
                                    <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <Activity className="w-12 h-12 text-cyan-400" />
                                    </div>
                                    <div className="space-y-6 max-w-md mx-auto">
                                        <p className="text-2xl text-white font-serif leading-tight">Would you like our consortium lab to contact you to schedule testing?</p>
                                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                                            <button 
                                                onClick={() => handleSubmit()} 
                                                disabled={isSubmitting}
                                                className="bg-cyan-500 text-slate-900 px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-cyan-500/20"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Yes, please contact me'}
                                            </button>
                                            <button 
                                                onClick={() => onClose()} 
                                                className="border border-white/10 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                                            >
                                                Maybe later
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={handleBack} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 justify-center w-full">
                                        <ChevronLeft className="w-4 h-4" /> Change selection
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
