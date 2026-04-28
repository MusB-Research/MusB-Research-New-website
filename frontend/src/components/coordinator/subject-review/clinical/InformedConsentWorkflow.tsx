import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, FileText, Download, Terminal, Shield, Database, X, AlertTriangle, CheckCircle2, Bold, Italic, Underline, Link } from 'lucide-react';

interface InformedConsentWorkflowProps {
    participant: any;
}

export default function InformedConsentWorkflow({ participant }: InformedConsentWorkflowProps) {
    const [activeRole, setActiveRole] = useState<'Participant' | 'Coordinator' | 'PI' | 'Super admin'>('Coordinator');
    const [coordinatorSubTab, setCoordinatorSubTab] = useState<'Pending co-sign' | 'Paper consent upload' | 'Consent archive' | 'AI Consent Builder'>('AI Consent Builder');
    const [participantSubTab, setParticipantSubTab] = useState<'E-consent flow' | 'Minor / LAR flow' | 'After signing'>('Minor / LAR flow');
    
    const studyName = participant.study_name || 'Beat the Bloat Study';
    const participantName = participant.display_name || 'Subject';
    const participantInitials = participantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S';

    const renderProgressTracker = () => {
        const steps = [
            { id: 1, label: 'Eligibility\nconfirmed', status: 'done' },
            { id: 2, label: 'Consent\nsent', status: 'active' },
            { id: 3, label: 'Participant\nsigns', status: 'pending' },
            { id: 4, label: 'Coordinator\nco-signs', status: 'pending' },
            { id: 5, label: 'Archived\n& enrolled', status: 'pending' }
        ];

        return (
            <div className="flex items-center justify-between max-w-3xl mb-8 relative">
                <div className="absolute top-4 left-[5%] right-[5%] h-[1px] bg-white/10 z-0"></div>
                {steps.map((step) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            step.status === 'done' ? 'bg-[#00BFA5] text-white' :
                            step.status === 'active' ? 'bg-[#00BFA5] text-white ring-4 ring-[#00BFA5]/20' :
                            'bg-[#121212] text-slate-500 border border-white/10'
                        }`}>
                            {step.id}
                        </div>
                        <div className="text-[10px] font-bold text-center uppercase tracking-widest text-slate-400 whitespace-pre-line leading-tight">
                            {step.label}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderCoordinatorPending = () => (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Awaiting Coordinator Co-Signature</h4>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-lg">
                        {participantInitials}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">{participantName} — e-consent signed Apr 24, 2026</h4>
                        <p className="text-sm text-slate-400">{studyName} - ICF-BTB-2026-MJ-001</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                        Review form
                    </button>
                    <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all">
                        Co-sign now
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCoordinatorPaper = () => (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Upload Signed Paper Consent Form</h4>
            <p className="text-sm text-slate-400 mb-8">For in-person studies where the participant signed a physical consent form on-site.</p>
            
            <div className="space-y-6 max-w-2xl">
                <div>
                    <label className="block text-xs font-bold text-white mb-2">Participant</label>
                    <select className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30 appearance-none">
                        <option>{participantName}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2">Date consent was signed (in person)</label>
                    <input type="date" defaultValue="2026-04-24" className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-white mb-2">Witnessed by</label>
                    <input type="text" placeholder="Name of coordinator or PI present" className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                </div>
                
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/20 transition-all bg-[#121212]/50">
                    <Upload className="w-6 h-6 text-slate-400 mb-3" />
                    <p className="text-sm font-bold text-white">Upload scanned consent form (PDF or image)</p>
                    <p className="text-xs text-slate-500 mt-1">Max 20 MB · PDF, JPG, PNG</p>
                </div>
                
                <div className="flex items-start gap-3 mt-4">
                    <input type="checkbox" className="mt-1 bg-[#121212] border-white/20 rounded" />
                    <p className="text-sm text-slate-300">I confirm this is a complete, signed, and unaltered copy of the original paper consent form.</p>
                </div>
                
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all w-max mt-4">
                    Upload & archive
                </button>
            </div>
        </div>
    );

    const renderCoordinatorArchive = () => (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Consent Document Archive — {studyName.toUpperCase()}</h4>
            
            <div className="space-y-4">
                {[
                    { initials: participantInitials, name: participantName, desc: 'ICF-BTB-2026-MJ-001 - E-consent - Signed Apr 24, 2026', status: 'Complete', btn: 'View' },
                    { initials: 'TK', name: 'Thomas Kim', desc: 'ICF-BTB-2026-TK-002 - E-consent - Signed Apr 20, 2026', status: 'Complete', btn: 'View' },
                    { initials: 'AP', name: 'Anika Patel (Minor — parent signed)', desc: 'ICF-BTB-2026-AP-003 - LAR consent - Apr 22, 2026', status: 'Complete', btn: 'View', color: 'bg-[#FFE082]/10 text-[#FFE082]' },
                    { initials: 'RW', name: 'Robert Walsh', desc: 'ICF-BTB-2026-RW-004 - Paper upload - Awaiting scan', status: 'Pending upload', btn: 'Upload', color: 'bg-rose-500/10 text-rose-300' },
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.color || 'bg-[#00BFA5]/20 text-[#00BFA5]'}`}>
                                {item.initials}
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{item.name}</h4>
                                <p className="text-xs text-slate-400">{item.desc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Complete' ? 'bg-[#00BFA5]/10 text-[#00BFA5] border border-[#00BFA5]/20' : 'bg-[#FFE082]/10 text-[#FFE082] border border-[#FFE082]/20'}`}>
                                {item.status}
                            </div>
                            <button className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all">
                                {item.btn}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="flex gap-3 mt-8 pt-8 border-t border-white/5">
                <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                    Export all
                </button>
                <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                    Download audit log
                </button>
            </div>
        </div>
    );

    const renderCoordinatorAIBuilder = () => (
        <div className="space-y-8">
            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1 uppercase italic tracking-tighter">AI Consent Builder</h3>
                        <p className="text-sm text-slate-400">Convert physical documents into digital e-consent workflows.</p>
                    </div>
                    <button
                        onClick={() => setShowSmartImportModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-pink-500/10 border border-pink-500/20 rounded-xl text-xs font-bold text-pink-500 uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all"
                    >
                        <Terminal className="w-4 h-4" /> AI Extract
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                            className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-pink-500/5 border-2 border-dashed border-pink-500/20 rounded-[2rem] hover:border-pink-500/50 transition-all group relative overflow-hidden"
                        >
                            {isExtracting && (
                                <div className="absolute inset-0 bg-[#0B101B]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Analyzing Doc...</span>
                                </div>
                            )}
                            <Upload className="w-10 h-10 text-pink-500 mb-6 group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-black text-white uppercase italic tracking-tighter">Upload Doc</span>
                            <span className="text-[10px] text-pink-500/60 font-bold uppercase mt-3 tracking-widest">AI Extraction Engine</span>
                        </button>
                    </div>

                    <div className="col-span-8">
                        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 h-full min-h-[300px] relative">
                            {!extractedText ? (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                                    <FileText className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Extracted text will appear here</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Extracted Content Preview</h4>
                                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                                            <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Bold className="w-3.5 h-3.5" /></button>
                                            <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Italic className="w-3.5 h-3.5" /></button>
                                            <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Underline className="w-3.5 h-3.5" /></button>
                                            <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                            <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Link className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => setExtractedText('')} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={extractedText}
                                        onChange={(e) => setExtractedText(e.target.value)}
                                        className="flex-1 w-full bg-transparent text-slate-300 text-sm leading-relaxed outline-none border-none resize-none overflow-y-auto"
                                    />
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button 
                                            onClick={() => setExtractedText('')}
                                            className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                                        >
                                            Reset
                                        </button>
                                        <button className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
                                            Send to Participant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-8">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Extraction Settings</h4>
                <div className="flex gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">PII Masking</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Database className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">NLP Verification</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">98.4% Confidence</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderParticipantLAR = () => (
        <div className="flex justify-center">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-8 max-w-2xl w-full">
                <h3 className="text-xl font-bold text-white mb-2">Consent on behalf of a participant</h3>
                <p className="text-sm text-slate-400 mb-8">For minors, individuals with cognitive impairments, or those unable to consent independently. A legally authorized representative (LAR) must complete this form.</p>
                
                <div className="space-y-6">
                    <div className="p-6 border border-white/10 rounded-xl bg-[#121212]/50">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Participant Information</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-white mb-2">Participant's full name</label>
                                <input type="text" placeholder="Full legal name" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white mb-2">Date of birth</label>
                                <input type="date" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-slate-400 focus:outline-none focus:border-white/30" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white mb-2">Reason LAR consent is required</label>
                            <select className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30 appearance-none">
                                <option>Participant is a minor (under 18)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="p-6 border border-white/10 rounded-xl bg-[#121212]/50">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">LAR Signature</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-white mb-2">LAR full name</label>
                                <input type="text" placeholder="Legal name of repres" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white mb-2">Relationship to participant</label>
                                <input type="text" placeholder="e.g. Parent, Legal guar" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-white mb-2">Signature (type full name)</label>
                            <input type="text" placeholder="Type signature name here" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white mb-2">Date</label>
                                <input type="date" defaultValue="2026-04-24" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white mb-2">City / location</label>
                                <input type="text" placeholder="Tampa, FL" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1 bg-[#121212] border-white/20 rounded" />
                        <p className="text-xs text-slate-300">I confirm I am the legally authorized representative for the above participant, and I consent on their behalf to participate in this study.</p>
                    </div>
                    
                    <button className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all">
                        Submit LAR consent
                    </button>
                </div>
            </div>
        </div>
    );

    const renderParticipantAfter = () => (
        <div className="flex justify-center">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-10 max-w-xl w-full text-center">
                <div className="w-16 h-16 bg-[#00BFA5]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-[#00BFA5]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Consent signed</h3>
                <p className="text-sm text-slate-400 mb-8">Your consent form has been submitted. The coordinator will co-sign and you will receive a copy by email.</p>
                
                <div className="bg-[#121212] border border-white/10 rounded-xl p-6 text-left space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-sm font-bold text-slate-400">Signed by</span>
                        <span className="text-sm font-bold text-white">{participantName}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-sm font-bold text-slate-400">Date</span>
                        <span className="text-sm font-bold text-white">Apr 24, 2026</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-sm font-bold text-slate-400">Co-sign status</span>
                        <span className="text-sm font-bold text-[#F59E0B]">Awaiting coordinator</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400">Document</span>
                        <span className="text-sm font-bold text-blue-400 hover:text-blue-300 cursor-pointer">Download PDF</span>
                    </div>
                </div>
                
                <p className="text-[10px] text-slate-500 mt-6 max-w-sm mx-auto">
                    Document reference: ICF-BTB-2026-MJ-001 - Archived securely in MusB Research systems
                </p>
            </div>
        </div>
    );

    const renderPIView = () => (
        <div className="space-y-8">
            <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Consent Status — All Participants</h4>
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Consented', value: '38', color: 'text-[#00BFA5]' },
                        { label: 'Awaiting co-sign', value: '3', color: 'text-[#FFE082]' },
                        { label: 'Paper pending', value: '1', color: 'text-rose-400' },
                        { label: 'LAR consent', value: '2', color: 'text-white' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                            <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Consent Requiring PI Attention</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-lg">MJ</div>
                            <div>
                                <h4 className="font-bold text-white text-lg">{participantName} — participant has signed</h4>
                                <p className="text-sm text-slate-400">Awaiting coordinator co-signature - ICF-BTB-2026-MJ-001</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all">
                                Co-sign as PI
                            </button>
                            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                                Return to coordinator
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#FFE082]/10 text-[#FFE082] flex items-center justify-center font-bold text-lg">AP</div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Anika Patel — LAR consent (parent)</h4>
                                <p className="text-sm text-slate-400">Coordinator co-signed · Awaiting PI acknowledgment</p>
                            </div>
                        </div>
                        <button className="px-10 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                            Acknowledge
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Consent Amendment Log</h4>
                    <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                        Initiate re-consent
                    </button>
                </div>
                <p className="text-sm text-slate-400 max-w-xl">No amendments to the consent form have been issued for this study. If a protocol change requires re-consent, PI can initiate re-consent from this panel.</p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">Audit Trail</h4>
                <div className="space-y-6">
                    {[
                        { title: `${participantName} signed e-consent`, time: 'Apr 24, 2026 - 10:42 AM · IP 68.184.xx.xx - Verified', color: 'bg-[#00BFA5]' },
                        { title: `Consent form sent to ${participantName}`, time: 'Apr 24, 2026 - 9:15 AM · Sent by Jamie Lopez', color: 'bg-[#00BFA5]' },
                        { title: 'Thomas Kim — e-consent complete (both signatures)', time: 'Apr 20, 2026 - Archived as ICF-BTB-2026-TK-002', color: 'bg-[#00BFA5]' },
                        { title: 'Robert Walsh — paper consent upload pending', time: 'Apr 22, 2026 - Flagged for coordinator action', color: 'bg-[#F59E0B]' }
                    ].map((entry, i) => (
                        <div key={i} className="flex gap-4 relative">
                            {i !== 3 && <div className="absolute top-6 left-1.5 bottom-[-24px] w-[1px] bg-white/10" />}
                            <div className={`w-3 h-3 rounded-full mt-1.5 ${entry.color}`} />
                            <div>
                                <h5 className="text-sm font-bold text-white mb-1">{entry.title}</h5>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose">{entry.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSuperAdminView = () => (
        <div className="space-y-8">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">All Studies — Consent Overview</h4>
                <div className="space-y-6">
                    {[
                        { name: 'Beat the Bloat Study', stats: '38 of 42 enrolled - All consent forms on file - 1 paper pending' },
                        { name: 'CardioWatch Study', stats: '22 of 22 enrolled - All consent forms complete' }
                    ].map((study, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-6 last:border-0 last:pb-0">
                            <div>
                                <h5 className="text-lg font-bold text-white mb-1">{study.name}</h5>
                                <p className="text-sm text-slate-400">{study.stats}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-[#00BFA5]/10 text-[#00BFA5] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#00BFA5]/20">Compliant</div>
                                <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">Report</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-8">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">System-wide Consent Archive Controls</h4>
                <div className="space-y-6">
                    {[
                        { title: 'Retention policy', desc: 'All signed consent documents retained permanently · HIPAA-compliant storage', badge: 'Configured', btn: 'Report' },
                        { title: 'Encryption', desc: 'AES-256 at rest · TLS 1.3 in transit · Access logged', badge: 'Active', btn: 'Export', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                        { title: 'Audit log export', desc: 'Full timestamp, IP, and user record for every consent action', btn: 'Export' },
                        { title: 'Consent template management', desc: 'Upload, version, and assign consent templates per study', btn: 'Manage' }
                    ].map((control, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-6 last:border-0 last:pb-0">
                            <div>
                                <h5 className="text-lg font-bold text-white mb-1">{control.title}</h5>
                                <p className="text-sm text-slate-400">{control.desc}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {control.badge && (
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${control.badgeColor || 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {control.badge}
                                    </div>
                                )}
                                <button className="px-8 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">{control.btn}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-[#1A1C23] min-h-screen p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Informed consent</h1>
                        <p className="text-slate-400">{studyName} - {participantName} - Step 2 of enrollment</p>
                    </div>
                    <div className="bg-[#FFE082]/10 text-[#FFE082] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border border-[#FFE082]/20">
                        Awaiting consent
                    </div>
                </div>

                {renderProgressTracker()}

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {['Participant', 'Coordinator', 'PI', 'Super admin'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role as any)}
                            className={`py-3 rounded-t-xl text-xs font-bold text-center border-b-2 transition-all ${
                                activeRole === role 
                                ? 'bg-[#00BFA5] text-white border-[#00BFA5]' 
                                : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                <div className="bg-[#121212] rounded-b-xl border border-white/5 p-8 min-h-[500px]">
                    {activeRole === 'Coordinator' && (
                        <>
                            <div className="flex gap-2 mb-8">
                                {['AI Consent Builder', 'Pending co-sign', 'Paper consent upload', 'Consent archive'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setCoordinatorSubTab(tab as any)}
                                        className={`flex-1 py-3 text-xs font-bold text-center transition-all ${
                                            coordinatorSubTab === tab 
                                            ? 'bg-pink-500/10 text-pink-500 border-b-2 border-pink-500' 
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={coordinatorSubTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {coordinatorSubTab === 'AI Consent Builder' && renderCoordinatorAIBuilder()}
                                    {coordinatorSubTab === 'Pending co-sign' && renderCoordinatorPending()}
                                    {coordinatorSubTab === 'Paper consent upload' && renderCoordinatorPaper()}
                                    {coordinatorSubTab === 'Consent archive' && renderCoordinatorArchive()}
                                </motion.div>
                            </AnimatePresence>
                        </>
                    )}

                    {activeRole === 'Participant' && (
                        <>
                            <div className="flex gap-2 mb-8">
                                {['E-consent flow', 'Minor / LAR flow', 'After signing'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setParticipantSubTab(tab as any)}
                                        className={`flex-1 py-3 text-xs font-bold text-center transition-all ${
                                            participantSubTab === tab 
                                            ? 'bg-[#E6FFFA] text-[#00BFA5]' 
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={participantSubTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {participantSubTab === 'E-consent flow' && (
                                        <div className="flex justify-center text-slate-400 p-10">E-consent workflow interface...</div>
                                    )}
                                    {participantSubTab === 'Minor / LAR flow' && renderParticipantLAR()}
                                    {participantSubTab === 'After signing' && renderParticipantAfter()}
                                </motion.div>
                            </AnimatePresence>
                        </>
                    )}
                    
                    {activeRole === 'PI' && renderPIView()}
                    {activeRole === 'Super admin' && renderSuperAdminView()}
                </div>
            </div>

            <AnimatePresence>
                {showSmartImportModal && (
                    <React.Fragment>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSmartImportModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000]" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto w-full max-w-2xl h-fit bg-[#0f172a] border border-white/10 rounded-[2rem] p-10 z-[1001] shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-white italic uppercase">AI Extract Consent Text</h3>
                                <button onClick={() => setShowSmartImportModal(false)} className="text-slate-500 hover:text-white"><X /></button>
                            </div>
                            <textarea
                                value={smartImportText}
                                onChange={(e) => setSmartImportText(e.target.value)}
                                placeholder="Paste consent document text here..."
                                className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-slate-300 outline-none focus:border-pink-500/50 mb-6 resize-none"
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowSmartImportModal(false)} className="px-6 py-2 text-xs font-bold text-slate-400">Cancel</button>
                                <button onClick={handleSmartImport} className="px-8 py-2 bg-pink-600 text-white rounded-lg text-xs font-black uppercase">Extract & Import</button>
                            </div>
                        </motion.div>
                    </React.Fragment>
                )}
            </AnimatePresence>
        </div>
    );
}
