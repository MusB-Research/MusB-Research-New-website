import React from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, FileText, Download, Printer, 
    CheckCircle2, Info, AlertCircle, Heart,
    Microscope, Droplets, Thermometer, ShieldCheck, Zap
} from 'lucide-react';

import { Card, Badge, StepIndicator } from './SharedComponents';

const CollectionGuideView = ({ onBack }: { onBack: () => void }) => {
    const handlePrint = () => {
        console.log("Printing Collection Guide...");
        window.print();
    };

    const steps = [

        { title: 'Sanitization', desc: 'Secure your environment and sanitize all contact surfaces.' },
        { title: 'Activation', desc: 'Sync your clinical node (Device-001) with the dashboard.' },
        { title: 'Collection', desc: 'Follow the specific biometric collection protocol.' },
        { title: 'Seal & Sync', desc: 'Ensure airtight seal and log the completion timestamp.' }
    ];

    return (
        <div className="flex flex-col gap-8 max-w-[1000px] mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center p-1 shadow-lg shadow-cyan-500/20">
                        <img src="/logo.jpg" alt="MusB Research" className="w-full h-full object-contain rounded-full" />
                    </div>
                </div>



                
                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={handlePrint}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-cyan-400 transition-all border border-white/5 cursor-pointer relative z-50"
                        title="Print Guide"
                    >
                        <Printer className="w-4 h-4 pointer-events-none" />
                    </button>

                    <a 
                        href="/booklets/movix_booklet.pdf"
                        download="Collection_Guide_MUSB.pdf"
                        className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </a>


                </div>

            </div>

            {/* DOCUMENT BODY */}
            <Card className="p-12 bg-[#0d1424] border-white/5 shadow-2xl relative overflow-hidden">
                {/* Watermark/Background Decor */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <FileText className="w-64 h-64 text-cyan-400" />
                </div>

                <div className="relative z-10 space-y-12">
                    {/* DOC TITLE */}
                    <div className="pb-8 border-b border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge color="cyan" className="text-[9px] py-1 px-3">PROTOCOL-V2.4</Badge>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Official Clinical Guide</span>
                        </div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Collection <span className="text-cyan-400">Guide</span> & Protocol
                        </h2>
                    </div>

                    {/* INTRO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Introduction</h3>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-wide">
                                This guide provides the standardized operating procedure for the collection of your clinical biomarkers. 
                                High data fidelity is critical for the success of the Beat the Bloat research study. 
                                Please ensure all steps are followed with clinical precision.
                            </p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                             <div className="flex items-center gap-2 text-amber-500 mb-3">
                                 <AlertCircle className="w-4 h-4" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Critical Alpha</span>
                             </div>
                             <p className="text-[11px] font-bold text-slate-500 leading-loose uppercase">
                                 Failure to sync within 2 hours of collection may lead to specimen degradation.
                             </p>
                        </div>
                    </div>

                    {/* STEPS */}
                    <div className="space-y-8">
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Standard Procedure</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {steps.map((step, i) => (
                                <div key={i} className="flex gap-6 p-6 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-cyan-500/20 transition-all">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-xl italic shrink-0 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                                        0{i + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-md font-black text-white uppercase italic tracking-tight">{step.title}</h4>
                                        <p className="text-[12px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TECHNICAL SPECS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/5">
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-indigo-400">
                                 <Thermometer className="w-4 h-4" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Temperature</span>
                             </div>
                             <span className="text-md font-black text-white italic">20°C - 25°C</span>
                        </div>
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-cyan-400">
                                 <Droplets className="w-4 h-4" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Stability</span>
                             </div>
                             <span className="text-md font-black text-white italic">99.2% RECOVERY</span>
                        </div>
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-green-400">
                                 <ShieldCheck className="w-4 h-4" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Confidential</span>
                             </div>
                             <span className="text-md font-black text-white italic">AES-256 SYNC</span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic mb-4">
                        PROPRIETARY DOCUMENT • MUS-B CLINICAL NODE SITE-B
                    </p>
                    <div className="flex items-center justify-center gap-6 opacity-20">
                         <Microscope className="w-5 h-5 text-indigo-400" />
                         <Heart className="w-5 h-5 text-red-500" />
                         <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CollectionGuideView;
