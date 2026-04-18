import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

// ──────────────── DESIGN SYSTEM TOKENS ────────────────
// Headings: #1A2B49
// Body: #5F6F89 
// Secondary: #6B7A99 
// Disabled: #9EABB3
// Primary Blue: #1E88E5
// CTA Orange: #FFF3E0 / #E65100

// ──────────────── UI COMPONENTS ────────────────
export const Card = ({ children, className = '', ...props }: any) => (
    <div 
        className={`bg-[#FFFFFF] border border-[#E3ECF5] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] ${className}`} 
        {...props}
    >
        {children}
    </div>
);

export const Badge = ({ children, color = 'blue', className = '', ...props }: any) => {
    const colors: Record<string, string> = {
        blue: 'bg-[#E3F2FD] text-[#1E88E5] border-[#BBDEFB]',
        green: 'bg-[#E9F7EF] text-[#1E7F4F] border-[#C8E6C9]',
        orange: 'bg-[#FFF4E5] text-[#B76E00] border-[#FFE0B2]',
        red: 'bg-[#FDECEA] text-[#D32F2F] border-[#FFCDD2]',
        slate: 'bg-[#F8FBFF] text-[#5F6F89] border-[#E3ECF5]',
    };
    
    // Fallback for legacy color names
    const colorMap: Record<string, string> = {
        amber: 'orange',
        emerald: 'green',
        indigo: 'blue'
    };
    
    const selectedColor = colors[colorMap[color] || color] || colors.blue;

    return (
        <span 
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight border leading-none ${selectedColor} ${className}`} 
            {...props}
        >
            {children}
        </span>
    );
};

export const ProgressBar = ({ percent, className = '', height = 6, ...props }: any) => (
    <div className={`w-full overflow-hidden bg-[#F0F6FF] rounded-full ${className}`} style={{ height: `${height}px` }} {...props}>
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-[#1E88E5]"
        />
    </div>
);

export const SegmentedProgressBar = ({ segments }: { segments: { count: number; color: string; label: string }[] }) => {
    const total = segments.reduce((acc, s) => acc + s.count, 0);
    
    // Map tailwind colors to our new palette if needed, though most use explicit classes in segmented bars
    const colorMap: Record<string, string> = {
        'bg-emerald-500': 'bg-[#1E7F4F]',
        'bg-amber-500': 'bg-[#B76E00]',
        'bg-red-500': 'bg-[#D32F2F]',
        'bg-blue-500': 'bg-[#1E88E5]',
        'bg-slate-500': 'bg-[#5F6F89]'
    };

    return (
        <div className="w-full h-3 flex rounded-full overflow-hidden bg-[#F8FBFF] border border-[#E3ECF5] p-0.5">
            {segments.map((seg, i) => (
                <motion.div
                    key={i}
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (seg.count / total) * 100 : 0}%` }}
                    className={`h-full ${colorMap[seg.color] || seg.color} first:rounded-l-full last:rounded-r-full transition-all duration-1000 relative group`}
                    style={{ minWidth: seg.count > 0 ? '4px' : '0' }}
                >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[11px] font-bold uppercase tracking-tight text-[#1A2B49] px-2 py-1 rounded border border-[#E3ECF5] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
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
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} border border-black/5`} />
                <span className="text-[14px] font-medium text-[#5F6F89] tracking-tight">{item.label}</span>
            </div>
        ))}
    </div>
);

export const FilterChip = ({ label, active, onClick, count }: any) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all whitespace-nowrap border ${
            active
                ? 'bg-[#E3F2FD] text-[#1E88E5] border-[#1E88E5] shadow-sm'
                : 'bg-[#FFFFFF] text-[#5F6F89] border-[#E3ECF5] hover:border-[#1E88E5]/40 hover:bg-[#F0F6FF]'
        }`}
    >
        {label}{count !== undefined && <span className={`ml-1.5 text-[10px] ${active ? 'text-[#1E88E5]/70' : 'text-[#8A99B3]'}`}>({count})</span>}
    </button>
);

export const CircularProgress = ({ value, size = 100, strokeWidth = 8, ...props }: any) => {
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
                    stroke="#F0F6FF"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1E88E5"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

export const LineChart = ({ data, color = "#1E88E5" }: { data: number[]; color?: string }) => {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');

    return (
        <div className="w-full h-32 relative mt-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.polyline
                    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
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
        <div className="w-full h-32 flex items-end gap-1.5 mt-4">
            {data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / max) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className="w-full bg-[#E3F2FD] group-hover:bg-[#BBDEFB] border-t-2 border-[#1E88E5] transition-colors relative rounded-t-sm"
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1A2B49] opacity-0 group-hover:opacity-100 transition-opacity">
                            {v}
                        </div>
                    </motion.div>
                    <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-tight">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
};

export const StepIndicator = ({ steps, currentStep }: { steps: string[]; currentStep: number }) => (
    <div className="flex items-center justify-between w-full mb-12 relative px-4">
        <div className="absolute top-[20px] left-0 right-0 h-0.5 bg-[#E3ECF5] -z-10" />
        {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    i <= currentStep ? 'bg-[#1E88E5] border-[#1E88E5] text-white shadow-sm' : 'bg-white border-[#E3ECF5] text-[#B0BCCF]'
                }`}>
                    {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <span className={`text-[12px] font-bold uppercase tracking-tight ${i <= currentStep ? 'text-[#1E88E5]' : 'text-[#5F6F89]'} text-center max-w-[80px]`}>{step}</span>
            </div>
        ))}
    </div>
);

export const Checklist = ({ items, checkedItems, onToggle }: { items: string[]; checkedItems: string[]; onToggle: (item: string) => void }) => (
    <div className="space-y-3">
        {items.map((item, i) => (
            <div 
                key={i} 
                onClick={() => onToggle(item)} 
                className={`flex items-center gap-4 p-4 rounded-[12px] border transition-all cursor-pointer ${
                    checkedItems.includes(item) ? 'bg-[#E9F7EF] text-[#1E7F4F] border-[#C8E6C9]' : 'bg-white border-[#E3ECF5] hover:border-[#BBDEFB]'
                }`}
            >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    checkedItems.includes(item) ? 'bg-[#1E7F4F] border-[#1E7F4F]' : 'bg-[#F8FBFF] border-[#E3ECF5]'
                }`}>
                    {checkedItems.includes(item) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[14px] font-bold tracking-tight transition-colors ${checkedItems.includes(item) ? 'text-[#1A2B49]' : 'text-[#5F6F89]'}`}>{item}</span>
            </div>
        ))}
    </div>
);

// ──────────────── MODALS ────────────────
export const ActionModal = ({ isOpen, title, desc, action, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1A2B49]/20 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative w-full max-w-lg bg-white border border-[#E3ECF5] rounded-[24px] p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1E88E5]" />
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-[#E3F2FD] text-[#1E88E5] rounded-2xl flex items-center justify-center border border-[#BBDEFB]">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-[#1A2B49] tracking-tight text-center mb-3">{title}</h3>
                <p className="text-center text-[15px] font-medium text-[#5F6F89] tracking-tight leading-relaxed mb-8 px-4">{desc}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} className="w-full bg-[#1E88E5] hover:bg-[#1565C0] text-white py-4 rounded-[12px] font-bold text-base tracking-tight transition-all shadow-md active:scale-[0.98]">{action}</button>
                    <button onClick={onClose} className="w-full py-3 text-[#5F6F89] hover:text-[#1A2B49] font-bold text-[14px] tracking-tight transition-colors">Cancel</button>
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
            <div className="absolute inset-0 bg-[#1A2B49]/20 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md bg-white border border-[#E3ECF5] rounded-[24px] p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-[#1A2B49] tracking-tight mb-6">{title}</h3>
                <input
                    type="text" value={val} onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-white border border-[#E3ECF5] rounded-[12px] p-4 text-[#1A2B49] text-base font-medium outline-none focus:border-[#1E88E5] transition-all mb-8 shadow-sm"
                    autoFocus
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-[#F8FBFF] text-[#5F6F89] rounded-[12px] text-sm font-bold tracking-tight hover:bg-[#F0F6FF] border border-[#E3ECF5] transition-colors">Cancel</button>
                    <button onClick={() => onSave(field, val)} className="flex-1 py-3.5 bg-[#1E88E5] text-white rounded-[12px] text-sm font-bold tracking-tight shadow-md hover:bg-[#1565C0] transition-colors">Save Changes</button>
                </div>
            </motion.div>
        </div>
    );
};

export const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1A2B49]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm text-center bg-white border border-[#E3ECF5] rounded-[24px] p-8 shadow-2xl">
                <div className="w-16 h-16 bg-[#FDECEA] text-[#D32F2F] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FFCDD2]">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#1A2B49] mb-2">Confirm Sign Out?</h3>
                <p className="text-[#5F6F89] font-medium text-[14px] mb-8 leading-relaxed">You are about to terminate your active study session. Unsaved changes may be lost.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-4 rounded-[12px] font-bold text-sm tracking-tight transition-all shadow-md">Sign Out</button>
                    <button onClick={onClose} className="w-full py-3 text-[#8A99B3] hover:text-[#5F6F89] font-bold text-[14px] transition-colors">Cancel</button>
                </div>
            </motion.div>
        </div>
    );
};

export const Skeleton = ({ className = '', variant = 'card', dark = false, ...props }: any) => {
    const variants: Record<string, string> = {
        card: dark ? 'bg-white/5 border border-white/5 rounded-[16px]' : 'bg-white border border-[#E3ECF5] rounded-[16px]',
        item: dark ? 'bg-white/[0.03] border border-white/5 rounded-[12px]' : 'bg-[#F8FBFF] border border-[#E3ECF5] rounded-[12px]',
        text: dark ? 'bg-white/10 rounded-lg' : 'bg-[#F0F6FF] rounded-lg',
        circle: dark ? 'bg-white/10 rounded-full' : 'bg-[#F0F6FF] rounded-full'
    };
    return (
        <div className={`relative overflow-hidden ${variants[variant] || variants.card} ${className} animate-pulse`} {...props}>
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${dark ? 'via-white/5' : 'via-white/40'} to-transparent`} />
        </div>
    );
};



export const SkeletonText = ({ className = '', width = 'w-full', height = 'h-4' }: any) => (
    <Skeleton variant="text" className={`${width} ${height} ${className}`} />
);

export const SkeletonCircle = ({ size = 'w-12 h-12', className = '' }: any) => (
    <Skeleton variant="circle" className={`${size} ${className}`} />
);
