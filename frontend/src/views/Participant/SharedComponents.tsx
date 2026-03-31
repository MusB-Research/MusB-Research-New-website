import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

// ──────────────── UI COMPONENTS ────────────────
export const Card = ({ children, className = '', ...props }: any) => (
    <div className={`bg-[#0a0e1a]/80 backdrop-blur-xl border border-white/[0.05] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${className}`} {...props}>
        {children}
    </div>
);

export const Badge = ({ children, color = 'cyan', className = '', ...props }: any) => {
    const colors: Record<string, string> = {
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        green: 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    return (
        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[13px] font-black uppercase tracking-widest border leading-none ${colors[color] || colors.cyan} ${className}`} {...props}>
            {children}
        </span>
    );
};

export const ProgressBar = ({ percent, className = '', height = 6, ...props }: any) => (
    <div className={`w-full overflow-hidden bg-white/5 rounded-full ${className}`} style={{ height: `${height}px` }} {...props}>
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
        />
    </div>
);

export const SegmentedProgressBar = ({ segments }: { segments: { count: number; color: string; label: string }[] }) => {
    const total = segments.reduce((acc, s) => acc + s.count, 0);
    return (
        <div className="w-full h-3 flex rounded-full overflow-hidden bg-white/5 border border-white/10 p-0.5 backdrop-blur-sm">
            {segments.map((seg, i) => (
                <motion.div
                    key={i}
                    initial={{ width: 0 }}
                    animate={{ width: `${(seg.count / total) * 100}%` }}
                    className={`h-full ${seg.color} first:rounded-l-full last:rounded-r-full transition-all duration-1000 relative group`}
                    style={{ minWidth: seg.count > 0 ? '4px' : '0' }}
                >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[12px] font-black uppercase tracking-widest text-white px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {seg.label}: {seg.count}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export const Legend = ({ items }: { items: { label: string; color: string }[] }) => (
    <div className="flex flex-wrap gap-4 mt-4">
        {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_5px_currentColor]`} />
                <span className="text-[14px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
            </div>
        ))}
    </div>
);

export const FilterChip = ({ label, active, onClick, count }: any) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
            active 
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105' 
                : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:bg-white/10'
        }`}
    >
        {label} {count !== undefined && <span className={`ml-2 ${active ? 'text-slate-900/60' : 'text-slate-500'}`}>[{count}]</span>}
    </button>
);

export const CircularProgress = ({ value, size = 120, strokeWidth = 8, ...props }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} {...props}>
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-white/5"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

export const LineChart = ({ data, color = "#06b6d4" }: { data: number[]; color?: string }) => {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');
    
    return (
        <div className="w-full h-32 relative mt-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.polyline
                    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
                    style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                />
                <motion.polyline
                    fill="url(#lineGrad)" stroke="none" points={`0,100 ${points} 100,100`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
                />
            </svg>
        </div>
    );
};

export const BarChart = ({ data, labels }: { data: number[]; labels: string[] }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="w-full h-32 flex items-end gap-1 mt-4">
            {data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / max) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className="w-full bg-cyan-500/20 group-hover:bg-cyan-500/40 border-t-2 border-cyan-500 transition-colors relative"
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[12px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {v}
                        </div>
                    </motion.div>
                    <span className="text-[12px] font-black text-slate-600 uppercase tracking-tighter">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
};

export const StepIndicator = ({ steps, currentStep }: { steps: string[]; currentStep: number }) => (
    <div className="flex items-center justify-between w-full mb-12 relative px-4">
        <div className="absolute top-[21px] left-0 right-0 h-0.5 bg-white/5 -z-10" />
        {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    i <= currentStep ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-slate-900 border-white/10 text-slate-500'
                }`}>
                    {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-black italic">{i + 1}</span>}
                </div>
                <span className={`text-[13px] font-black uppercase tracking-widest ${i <= currentStep ? 'text-cyan-400' : 'text-slate-600'} text-center max-w-[80px]`}>{step}</span>
            </div>
        ))}
    </div>
);

export const Checklist = ({ items, checkedItems, onToggle }: { items: string[]; checkedItems: string[]; onToggle: (item: string) => void }) => (
    <div className="space-y-4">
        {items.map((item, i) => (
            <div key={i} onClick={() => onToggle(item)} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                checkedItems.includes(item) ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-[#141e35] border-white/5 hover:border-white/10'
            }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    checkedItems.includes(item) ? 'bg-cyan-500 border-cyan-400' : 'bg-white/5 border-white/10'
                }`}>
                    {checkedItems.includes(item) && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                </div>
                <span className={`text-[15px] font-black uppercase tracking-widest transition-colors ${checkedItems.includes(item) ? 'text-white' : 'text-slate-500'}`}>{item}</span>
            </div>
        ))}
    </div>
);

// ──────────────── MODALS ────────────────
export const ActionModal = ({ isOpen, title, desc, action, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0e1a]/95 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative w-full max-w-lg bg-[#0d1424] border border-white/10 rounded-[3rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-indigo-500" />
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-cyan-500/10 text-cyan-400 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
                        <AlertCircle className="w-10 h-10" strokeWidth={1} />
                    </div>
                </div>
                <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase text-center mb-4">{title}</h3>
                <p className="text-center text-base font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-10 px-4">{desc}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-[0.98]">{action}</button>
                    <button onClick={onClose} className="w-full py-5 text-slate-500 hover:text-white font-black text-[13px] uppercase tracking-[0.2em] transition-colors">CANCEL MISSION</button>
                </div>
            </motion.div>
        </div>
    );
};

export const EditModal = ({ isOpen, title, value, field, onClose, onSave }: any) => {
    const [val, setVal] = React.useState(value);
    React.useEffect(() => setVal(value), [value, isOpen]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0a0e1a]/95 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md bg-[#0d1424] border border-white/10 rounded-3xl p-10">
                <h3 className="text-3xl font-black text-white italic uppercase mb-8">{title}</h3>
                <input
                    type="text" value={val} onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-[#141e35] border border-white/10 rounded-xl p-5 text-white text-lg font-bold outline-none focus:border-cyan-500 italic mb-10"
                />
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl text-sm font-black uppercase tracking-widest italic">CANCEL</button>
                    <button onClick={() => onSave(field, val)} className="flex-1 py-4 bg-cyan-500 text-slate-950 rounded-xl text-sm font-black uppercase tracking-widest italic shadow-lg">SAVE CHANGES</button>
                </div>
            </motion.div>
        </div>
    );
};

export const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0a0e1a]/98 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-4xl font-black text-white italic uppercase mb-4">Secure Sign Out?</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-10 leading-relaxed">You are about to terminate your active encrypted session. All unsaved syncs may be lost.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} className="w-full bg-red-500 hover:bg-red-400 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all">TERMINATE SESSION</button>
                    <button onClick={onClose} className="w-full py-4 text-slate-500 hover:text-white font-black text-[13px] uppercase tracking-widest transition-colors">CANCEL</button>
                </div>
            </motion.div>
        </div>
    );
};
