import React from 'react';
import { User, ShieldCheck, FileText, Bell, CheckCircle2 } from 'lucide-react';

export const CredentialProfile: React.FC<{ user?: any }> = ({ user }) => {
    const displayName = user?.full_name || 'Dr. Michael Chen';
    const qualifications = user?.decrypted_qualifications || 'MD, PhD';
    const npi = user?.decrypted_npi || '1289304122';
    
    // Count actually uploaded documents
    const activeCount = [
        user?.medical_licence, user?.cv_document, user?.gcp_training, 
        user?.financial_disclosure, user?.insurance_certificate
    ].filter(Boolean).length;

    return (
        <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt={displayName} className="w-full h-full object-cover rounded-3xl" />
                        ) : (
                            <User className="w-12 h-12" />
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-full border-4 border-[#0B101B]">
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{displayName}</h3>
                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mt-1">NPI: {npi} • {qualifications}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[12px] font-black uppercase tracking-widest">
                            {user?.status === 'ACTIVE' ? 'Compliant' : 'Verification Pending'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active', val: activeCount.toString().padStart(2, '0'), icon: FileText, color: 'indigo' },
                    { label: 'Expiring', val: '00', icon: Bell, color: 'amber' },
                    { label: 'Exports', val: '01', icon: CheckCircle2, color: 'emerald' }
                ].map((s, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2">
                        <p className="text-[12px] text-slate-600 font-black uppercase tracking-widest">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color === 'amber' ? 'text-amber-400' : s.color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400'} italic`}>{s.val}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};



