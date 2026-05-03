import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, CheckCircle, FileText, Download, Terminal, Shield, Database, X, 
    AlertTriangle, CheckCircle2, Bold, Italic, Underline, Link, Sparkles,
    Search, Activity, Clock, Briefcase, Bookmark, ChevronRight, MoreHorizontal,
    FileUp, Archive, Users, ShieldCheck, Globe, History, LayoutDashboard,
    AlertCircle, Target, ArrowRight
} from 'lucide-react';

interface InformedConsentWorkflowProps {
    participant: any;
    initialRole?: 'Participant' | 'Coordinator' | 'PI' | 'Super admin';
}

const COLORS = {
    bg: '#0A0F1A',
    card: '#121826',
    border: 'rgba(255, 255, 255, 0.05)',
    emerald: '#10B981',
    amber: '#F59E0B',
    blue: '#3B82F6',
    rose: '#F43F5E',
    slate: '#94A3B8',
    indigo: '#6366F1'
};

export default function InformedConsentWorkflow({ participant, initialRole = 'Coordinator' }: InformedConsentWorkflowProps) {
    const [activeRole, setActiveRole] = useState<'Participant' | 'Coordinator' | 'PI' | 'Super admin'>(initialRole);
    const [coordinatorSubTab, setCoordinatorSubTab] = useState<'Pending co-sign' | 'Paper consent upload' | 'Consent archive' | 'AI Builder'>('Pending co-sign');
    const [participantSubTab, setParticipantSubTab] = useState<'E-consent flow' | 'Minor / LAR flow' | 'After signing'>('E-consent flow');
    
    // AI Builder States
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [showSmartImportModal, setShowSmartImportModal] = useState(false);
    const [smartImportText, setSmartImportText] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const studyName = participant.study_name || 'Beat the Bloat Study';
    const participantName = participant.display_name || 'Maria Johnson';
    const participantInitials = participantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'MJ';

    // ──────────────── PROGRESS TRACKER (Matches Screenshots) ────────────────
    const renderProgressTracker = () => {
        const steps = [
            { id: 1, label: 'Eligibility confirmed', status: 'done' },
            { id: 2, label: 'Consent sent', status: 'active' },
            { id: 3, label: 'Participant signs', status: 'pending' },
            { id: 4, label: 'Coordinator co-signs', status: 'pending' },
            { id: 5, label: 'Archived & enrolled', status: 'pending' }
        ];

        return (
            <div className="flex items-center justify-between max-w-4xl mx-auto mb-12 relative px-4">
                {/* Connecting Line */}
                <div className="absolute top-4 left-[10%] right-[10%] h-[1px] bg-white/10 z-0"></div>
                
                {steps.map((step, idx) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500 ${
                            step.status === 'done' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' :
                            step.status === 'active' ? 'bg-emerald-500 text-black ring-8 ring-emerald-500/10' :
                            'bg-[#0D121F] text-slate-600 border border-white/5'
                        }`}>
                            {step.id}
                        </div>
                        <div className={`text-[9px] font-black text-center uppercase tracking-[0.15em] leading-tight max-w-[80px] transition-colors duration-500 ${
                            step.status === 'pending' ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                            {step.label}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ──────────────── ROLE SELECTOR (Matches Screenshots) ────────────────
    const renderRoleSelector = () => (
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1 mb-8 max-w-4xl mx-auto">
            {['Participant', 'Coordinator', 'PI', 'Super admin'].map((role) => (
                <button
                    key={role}
                    onClick={() => setActiveRole(role as any)}
                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        activeRole === role 
                        ? 'bg-emerald-500 text-black shadow-xl' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                >
                    {role}
                </button>
            ))}
        </div>
    );

    // ──────────────── COORDINATOR VIEWS (Images 3, 4, 5) ────────────────
    const renderCoordinatorView = () => (
        <div className="space-y-6">
            <div className="flex gap-2 mb-8">
                {['Pending co-sign', 'Paper consent upload', 'Consent archive', 'AI Builder'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setCoordinatorSubTab(tab as any)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                            coordinatorSubTab === tab 
                            ? 'bg-white/10 text-emerald-400 border border-white/5 shadow-2xl' 
                            : 'bg-white/2 text-slate-500 hover:bg-white/5'
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
                    {coordinatorSubTab === 'Pending co-sign' && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6 italic">Awaiting Coordinator Co-Signature</h4>
                            <div className="flex items-center justify-between p-8 bg-white/2 border border-white/5 rounded-[40px] hover:bg-white/4 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xl shadow-2xl">
                                        {participantInitials}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-1">{participantName} — e-consent signed Apr 24, 2026</h4>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{studyName} · ICF-BTB-2026-MJ-001</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Review form</button>
                                    <button className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10">Co-sign now</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {coordinatorSubTab === 'Paper consent upload' && (
                        <div className="max-w-3xl mx-auto">
                             <div className="p-10 bg-white/2 border border-white/5 rounded-[40px] space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2 italic">Upload Signed Paper Consent Form</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">For in-person studies where the participant signed a physical consent form on-site.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Participant</label>
                                        <select className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none">
                                            <option>{participantName}</option>
                                        </select>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date signed</label>
                                            <input type="date" defaultValue="2026-04-24" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Witnessed by</label>
                                            <input type="text" placeholder="Name of coordinator or PI present" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <div className="border-2 border-dashed border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/2 hover:border-emerald-500/30 transition-all">
                                            <FileUp className="w-8 h-8 text-slate-500 mb-4 group-hover:text-emerald-400 group-hover:-translate-y-1 transition-all" />
                                            <p className="text-sm font-bold text-white uppercase tracking-tight italic">Upload scanned consent form (PDF or image)</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 tracking-[0.2em]">Max 20 MB · PDF, JPG, PNG</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-white/2 rounded-2xl border border-white/5">
                                        <input type="checkbox" className="mt-1 w-4 h-4 bg-black border-white/10 rounded accent-emerald-500" />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">I confirm this is a complete, signed, and unaltered copy of the original paper consent form.</p>
                                    </div>

                                    <button className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/10 active:scale-[0.98]">
                                        Upload & archive
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}

                    {coordinatorSubTab === 'Consent archive' && (
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6 italic">Consent Document Archive — {studyName.toUpperCase()}</h4>
                            <div className="space-y-4">
                                {[
                                    { initials: 'MJ', name: 'Maria Johnson', desc: 'ICF-BTB-2026-MJ-001 - E-consent - Signed Apr 24, 2026', status: 'Complete', type: 'success' },
                                    { initials: 'TK', name: 'Thomas Kim', desc: 'ICF-BTB-2026-TK-002 - E-consent - Signed Apr 20, 2026', status: 'Complete', type: 'success' },
                                    { initials: 'AP', name: 'Anika Patel (Minor — parent signed)', desc: 'ICF-BTB-2026-AP-003 - LAR consent - Apr 22, 2026', status: 'Complete', type: 'success' },
                                    { initials: 'RW', name: 'Robert Walsh', desc: 'ICF-BTB-2026-RW-004 - Paper upload - Awaiting scan', status: 'Pending upload', type: 'warning' }
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-3xl group hover:bg-white/4 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-sm uppercase">
                                                {doc.initials}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-base mb-1">{doc.name}</h4>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{doc.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                doc.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                {doc.status}
                                            </div>
                                            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                                                {doc.type === 'success' ? 'View' : 'Upload'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4 pt-8">
                                <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Export all</button>
                                <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Download audit log</button>
                            </div>
                        </div>
                    )}

                    {coordinatorSubTab === 'AI Builder' && renderCoordinatorAIBuilder()}
                </motion.div>
            </AnimatePresence>
        </div>
    );

    // ──────────────── PI VIEW (Image 2) ────────────────
    const renderPIView = () => (
        <div className="space-y-8 animate-in fade-in duration-700">
             <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Consented', value: '38', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                    { label: 'Awaiting co-sign', value: '3', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
                    { label: 'Paper pending', value: '1', color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/10' },
                    { label: 'LAR consent', value: '2', color: 'text-white', bg: 'bg-white/5 border-white/10' }
                ].map((stat, i) => (
                    <div key={i} className={`p-8 rounded-[32px] border ${stat.bg} shadow-2xl`}>
                        <div className={`text-5xl font-black mb-3 ${stat.color} italic tracking-tighter`}>{stat.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6 italic">Consent Requiring PI Attention</h4>
                <div className="space-y-4">
                    <div className="p-8 bg-white/2 border border-white/5 rounded-[40px] flex items-center justify-between group hover:bg-white/4 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xl shadow-2xl">
                                MJ
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-1">Maria Johnson — participant has signed</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Awaiting coordinator co-signature · ICF-BTB-2026-MJ-001</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10">Co-sign as PI</button>
                            <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Return to coordinator</button>
                        </div>
                    </div>

                    <div className="p-8 bg-white/2 border border-white/5 rounded-[40px] flex items-center justify-between group hover:bg-white/4 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-2xl">
                                AP
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-1">Anika Patel — LAR consent (parent)</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Coordinator co-signed · Awaiting PI acknowledgment</p>
                            </div>
                        </div>
                        <button className="px-10 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Acknowledge</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="p-10 bg-white/2 border border-white/5 rounded-[40px] space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 italic">Consent Amendment Log</h4>
                        <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Initiate re-consent</button>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">No amendments to the consent form have been issued for this study. If a protocol change requires re-consent, PI can initiate re-consent from this panel.</p>
                </div>

                <div className="p-10 bg-white/2 border border-white/5 rounded-[40px] space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 italic">Audit Trail</h4>
                    <div className="space-y-6 relative">
                        {[
                            { t: 'Maria Johnson signed e-consent', d: 'Apr 24, 2026 - 10:42 AM · IP 68.184.xx.xx · Verified', s: 'done' },
                            { t: 'Consent form sent to Maria Johnson', d: 'Apr 24, 2026 - 9:15 AM · Sent by Jamie Lopez', s: 'done' },
                            { t: 'Thomas Kim — e-consent completed (both signatures)', d: 'Apr 20, 2026 · Archived as ICF-BTB-2026-TK-002', s: 'done' },
                            { t: 'Robert Walsh — paper consent upload pending', d: 'Apr 22, 2026 · Flagged for coordinator action', s: 'pending' }
                        ].map((item, i, arr) => (
                            <div key={i} className="flex gap-4 relative">
                                {i !== arr.length - 1 && <div className="absolute top-2 left-1.5 w-[1px] h-full bg-white/5" />}
                                <div className={`w-3 h-3 rounded-full mt-1.5 z-10 ${item.s === 'done' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                                <div className="space-y-1">
                                    <h5 className="text-sm font-bold text-white uppercase tracking-tight italic">{item.t}</h5>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // ──────────────── SUPER ADMIN VIEW (Image 1) ────────────────
    const renderSuperAdminView = () => (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="p-10 bg-white/2 border border-white/5 rounded-[40px] space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6 italic">All Studies — Consent Overview</h4>
                <div className="space-y-4">
                    {[
                        { n: 'Beat the Bloat Study', s: '38 of 42 enrolled · All consent forms on file · 1 paper pending', status: 'Compliant' },
                        { n: 'CardioWatch Study', s: '22 of 22 enrolled · All consent forms complete', status: 'Compliant' }
                    ].map((st, i) => (
                        <div key={i} className="flex items-center justify-between p-8 bg-white/2 border border-white/5 rounded-3xl group hover:bg-white/4 transition-all">
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">{st.n}</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{st.s}</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                    {st.status}
                                </div>
                                <button className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">Report</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-10 bg-white/2 border border-white/5 rounded-[40px] space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6 italic">System-wide Consent Archive Controls</h4>
                <div className="grid grid-cols-2 gap-6">
                    {[
                        { t: 'Retention policy', d: 'All signed consent documents retained permanently · HIPAA-compliant storage', s: 'Configured', icon: Archive },
                        { t: 'Encryption', d: 'AES-256 at rest · TLS 1.3 in transit · Access logged', s: 'Active', icon: ShieldCheck, type: 'success' },
                        { t: 'Audit log export', d: 'Full timestamp, IP, and user record for every consent action', icon: History },
                        { t: 'Consent template management', d: 'Upload, version, and assign consent templates per study', icon: FileUp }
                    ].map((ctrl, i) => (
                        <div key={i} className="p-8 bg-white/2 border border-white/5 rounded-[32px] space-y-6 group hover:bg-white/4 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                                    <ctrl.icon size={24} />
                                </div>
                                {ctrl.s && (
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                        ctrl.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                        {ctrl.s}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-2">{ctrl.t}</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose">{ctrl.d}</p>
                            </div>
                            <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                                {ctrl.t.includes('log') || ctrl.t.includes('Retention') ? 'Export' : 'Manage'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ──────────────── PARTICIPANT VIEWS (Images 6, 7) ────────────────
    const renderParticipantView = () => (
        <div className="space-y-6">
            <div className="flex bg-white/2 rounded-2xl p-1 gap-1 mb-8 max-w-2xl mx-auto">
                {['E-consent flow', 'Minor / LAR flow', 'After signing'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setParticipantSubTab(tab as any)}
                        className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                            participantSubTab === tab 
                            ? 'bg-emerald-500 text-black shadow-lg' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={participantSubTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    {participantSubTab === 'E-consent flow' && (
                        <div className="max-w-4xl mx-auto p-12 bg-white/2 border border-white/5 rounded-[40px] text-center space-y-8">
                            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400 mb-6">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-3xl font-bold text-white italic uppercase tracking-tighter">Review Study Consent</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest max-w-lg mx-auto">Please review the protocol documentation and legal disclosures before providing your electronic signature.</p>
                            <button className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1">
                                Start Digital Signature
                            </button>
                        </div>
                    )}

                    {participantSubTab === 'Minor / LAR flow' && (
                        <div className="max-w-3xl mx-auto p-10 bg-white/2 border border-white/5 rounded-[40px] space-y-10">
                            <div>
                                <h3 className="text-2xl font-bold text-white italic uppercase tracking-tighter mb-4">Consent on behalf of a participant</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">For minors, individuals with cognitive impairments, or those unable to consent independently, a Legally Authorized Representative (LAR) must complete this form.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 italic">Participant Information</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Participant's full name</label>
                                            <input placeholder="Full legal name" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date of birth</label>
                                            <input type="date" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason LAR consent is required</label>
                                        <select className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none appearance-none">
                                            <option>Participant is a minor (under 18)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-8 border-t border-white/5">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 italic">LAR Signature</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">LAR full name</label>
                                            <input placeholder="Legal name of representative" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Relationship to participant</label>
                                            <input placeholder="Type relationship here" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signature (type full name)</label>
                                            <input placeholder="Type signature here" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</label>
                                            <input type="date" defaultValue="2026-04-24" className="w-full bg-[#0D121F] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-white/2 rounded-2xl border border-white/5">
                                    <input type="checkbox" className="mt-1 w-4 h-4 bg-black border-white/10 rounded accent-emerald-500" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">I confirm I am the legally authorized representative for the above participant, and I consent on their behalf to participate in this study.</p>
                                </div>

                                <button className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all text-white active:scale-[0.98]">
                                    Submit LAR consent
                                </button>
                            </div>
                        </div>
                    )}

                    {participantSubTab === 'After signing' && (
                        <div className="max-w-xl mx-auto p-12 bg-white/2 border border-white/5 rounded-[40px] text-center space-y-10 shadow-2xl">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                <CheckCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-bold text-white italic uppercase tracking-tighter">Consent signed</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose">Your consent form has been submitted. The coordinator will co-sign and you will receive a copy by email.</p>
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 space-y-6 text-left">
                                {[
                                    { l: 'Signed by', v: 'Maria A. Johnson' },
                                    { l: 'Date', v: 'Apr 24, 2026' },
                                    { l: 'Co-sign status', v: 'Awaiting coordinator', c: 'text-amber-500' },
                                    { l: 'Document', v: 'Download PDF', c: 'text-blue-500 cursor-pointer hover:text-blue-400' }
                                ].map((row, i, arr) => (
                                    <div key={i} className={`flex justify-between items-center ${i !== arr.length - 1 ? 'pb-4 border-b border-white/5' : ''}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{row.l}</span>
                                        <span className={`text-xs font-bold uppercase tracking-tight ${row.c || 'text-white'}`}>{row.v}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.25em]">
                                Document reference: <span className="text-slate-400 italic">ICF-BTB-2026-MJ-001</span> · Archived securely in MusB Research systems
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );

    const renderCoordinatorAIBuilder = () => (
        <div className="space-y-8">
            <div className="bg-white/2 border border-white/5 rounded-[3rem] p-12">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">AI Consent Builder</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Convert physical documents into digital e-consent workflows.</p>
                    </div>
                    <button
                        onClick={() => setShowSmartImportModal(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-indigo-500/10"
                    >
                        <Terminal className="w-4 h-4" /> AI Extract
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-10">
                    <div className="col-span-4">
                        <input type="file" ref={fileInputRef} onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (!file) return;
                             setIsExtracting(true);
                             setTimeout(() => {
                                 setExtractedText(`EXTRACTED PROTOCOL CONTENT: ${file.name}\n\nSTUDY TITLE: BEAT THE BLOAT STUDY\nPRINCIPAL INVESTIGATOR: DR. MARIA LARSSON\n\n1. PURPOSE OF RESEARCH\nYou are invited to participate in a research study...`);
                                 setIsExtracting(false);
                             }, 2500);
                        }} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                            className="w-full h-full min-h-[350px] flex flex-col items-center justify-center p-10 bg-indigo-500/5 border-2 border-dashed border-indigo-500/10 rounded-[3rem] hover:border-indigo-500/40 transition-all group relative overflow-hidden"
                        >
                            {isExtracting && (
                                <div className="absolute inset-0 bg-[#0B1221]/90 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Deep OCR Analysis...</span>
                                </div>
                            )}
                            <FileUp className="w-12 h-12 text-indigo-500 mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500" />
                            <span className="text-xl font-black text-white uppercase italic tracking-tighter">Upload Protocol</span>
                            <span className="text-[9px] text-indigo-500/60 font-black uppercase mt-4 tracking-[0.3em] px-4 py-1.5 bg-indigo-500/10 rounded-full">Neural Extraction Engine</span>
                        </button>
                    </div>

                    <div className="col-span-8">
                        <div className="bg-black/30 border border-white/5 rounded-[3rem] p-8 h-full min-h-[450px] relative shadow-2xl">
                            {!extractedText && !isExtracting ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20">
                                    <Database size={64} className="text-slate-400" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">AI-driven text extraction pending...</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">
                                            {isExtracting ? 'Synthesizing Protocol Structure...' : 'Refined Extraction & Token Mapping'}
                                        </h4>
                                        {!isExtracting && (
                                            <button onClick={() => setExtractedText('')} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><X size={18} /></button>
                                        )}
                                    </div>
                                    
                                    {isExtracting ? (
                                        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                                            <div className="relative">
                                                <div className="w-24 h-24 border-2 border-indigo-500/10 rounded-full animate-ping absolute" />
                                                <div className="w-24 h-24 border-t-2 border-indigo-500 rounded-full animate-spin shadow-2xl" />
                                            </div>
                                            <div className="space-y-2 text-center">
                                                <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse italic">Scanning Legal Clauses</p>
                                                <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em]">Mapping Dynamic Participant Tokens</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <textarea
                                                value={extractedText}
                                                onChange={(e) => setExtractedText(e.target.value)}
                                                className="flex-1 w-full bg-transparent text-slate-300 text-sm leading-relaxed outline-none border-none resize-none overflow-y-auto mb-8 p-6 bg-white/[0.02] rounded-[2rem] custom-scrollbar"
                                            />
                                            
                                            <div className="grid grid-cols-2 gap-4 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] mb-8">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic">Identity Token</span>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    </div>
                                                    <p className="text-xs font-bold text-white uppercase">{"{{PARTICIPANT_NAME}}"}</p>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} className="h-full bg-emerald-500" />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic">Signature Block</span>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    </div>
                                                    <p className="text-xs font-bold text-white uppercase">{"{{ESIGN_BLOCK_01}}"}</p>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: '95%' }} className="h-full bg-emerald-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-4">
                                                <button onClick={() => setExtractedText('')} className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all">Discard</button>
                                                <button className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-900/40 flex items-center gap-3">
                                                    <Sparkles className="w-4 h-4" /> Finalize e-Consent
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* ──────────────── PROGRESS TRACKER ──────────────── */}
            {renderProgressTracker()}

            {/* ──────────────── ROLE SELECTOR ──────────────── */}
            {renderRoleSelector()}

            {/* ──────────────── MAIN CONTENT AREA ──────────────── */}
            <main className="min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeRole}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeRole === 'Coordinator' && renderCoordinatorView()}
                        {activeRole === 'Participant' && renderParticipantView()}
                        {activeRole === 'PI' && renderPIView()}
                        {activeRole === 'Super admin' && renderSuperAdminView()}
                    </motion.div>
                </AnimatePresence>
            </main>

                {/* ──────────────── SMART IMPORT MODAL ──────────────── */}
                <AnimatePresence>
                    {showSmartImportModal && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSmartImportModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-[#0D121F] border border-white/5 rounded-[3rem] p-12 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="text-indigo-400" size={24} />
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">AI Extraction Engine</h3>
                                    </div>
                                    <button onClick={() => setShowSmartImportModal(false)} className="text-slate-600 hover:text-white transition-all"><X /></button>
                                </div>
                                <textarea
                                    value={smartImportText}
                                    onChange={(e) => setSmartImportText(e.target.value)}
                                    placeholder="Paste raw protocol text or legal clauses here for neural analysis..."
                                    className="w-full h-72 bg-black/40 border border-white/10 rounded-[2rem] p-8 text-sm text-slate-300 outline-none focus:border-indigo-500/50 mb-8 resize-none custom-scrollbar"
                                />
                                <div className="flex justify-end gap-4">
                                    <button onClick={() => setShowSmartImportModal(false)} className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white">Cancel</button>
                                    <button 
                                        onClick={() => {
                                            setExtractedText(smartImportText);
                                            setShowSmartImportModal(false);
                                        }} 
                                        className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20"
                                    >
                                        Execute AI Analysis
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
