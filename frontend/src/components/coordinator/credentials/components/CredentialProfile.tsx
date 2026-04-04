import React from 'react';
import { User, ShieldCheck, FileText, Bell, CheckCircle2 } from 'lucide-react';

export const CredentialProfile: React.FC = () => {
    return (
        <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="flex items-center gap-8">
                <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <User className="w-12 h-12" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-full border-4 border-[#0B101B]">
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Dr. Michael Chen</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">NPI: 1289304122 • MD, PhD</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-black uppercase tracking-widest">Compliant</span>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Credentials', val: '12', icon: FileText, color: 'indigo' },
                    { label: 'Expiring Soon', val: '01', icon: Bell, color: 'amber' },
                    { label: 'Verified Exports', val: '24', icon: CheckCircle2, color: 'emerald' }
                ].map((s, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color === 'amber' ? 'text-amber-400' : s.color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400'} italic`}>{s.val}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
