import React, { useState } from 'react';
import { X, Upload, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

interface CandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CandidateModal({ isOpen, onClose }: CandidateModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && status !== 'LOADING') {
            onClose();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResumeFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!resumeFile) {
            setErrorMessage("Please upload your resume.");
            return;
        }

        setStatus('LOADING');
        setErrorMessage('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('password', formData.password);
        data.append('resume', resumeFile);

        try {
            // Note: Use standard API_URL locally or in production
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/apply/`, {
                method: 'POST',
                body: data,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to submit application");
            }

            setStatus('SUCCESS');
        } catch (error: any) {
            console.error('Submission error:', error);
            setStatus('ERROR');
            setErrorMessage(error.message || "An unexpected error occurred.");
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Submit Your Resume</h2>
                    <button 
                        onClick={onClose}
                        disabled={status === 'LOADING'}
                        className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    {status === 'SUCCESS' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase italic">Application Submitted!</h3>
                                <p className="text-slate-400 font-medium">Thank you for your interest in MusB™ Research. Our team will review your application soon.</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="mt-8 bg-white text-slate-950 px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-cyan-500 transition-all shadow-lg"
                            >
                                Back to Careers
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errorMessage && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
                                    {errorMessage}
                                </div>
                            )}
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Create Password (For Account)</label>
                                    <input 
                                        type="password" 
                                        required
                                        minLength={8}
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="Min 8 characters"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Resume / CV (PDF or DOCX)</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        required
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors flex flex-col items-center gap-3
                                        ${resumeFile ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-slate-500 bg-slate-950'}
                                    `}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                                            ${resumeFile ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-400'}
                                        `}>
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-white">
                                                {resumeFile ? resumeFile.name : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-xs text-slate-500">PDF, DOCX up to 10MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={status === 'LOADING'}
                                className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {status === 'LOADING' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Uploading Profile...
                                    </>
                                ) : (
                                    <>
                                        Submit Application <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
