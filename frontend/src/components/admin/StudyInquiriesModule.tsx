import React, { useState } from 'react';
import { 
    Building, Mail, Globe, Trash2, Server, Globe as GlobeIcon, 
    MoreVertical, Eye, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyInquiriesModuleProps {
    studyInquiries: any[];
    studies: any[];
    authFetch: (url: string, options?: any) => Promise<Response>;
    API: string;
    fetchData: () => void;
    handlePageChange: (page: string) => void;
    userRole?: string;
}

const StudyInquiriesModule: React.FC<StudyInquiriesModuleProps> = ({ 
    studyInquiries, 
    studies, 
    authFetch, 
    API, 
    fetchData, 
    handlePageChange,
    userRole = 'ADMIN'
}) => {
    const [subTab, setSubTab] = useState<'study_queries' | 'authorizations'>('study_queries');
    const [isEngaging, setIsEngaging] = useState<string | null>(null);
    const [viewingInquiry, setViewingInquiry] = useState<any | null>(null);
    const pendingStudies = (studies || []).filter((s: any) => s.approval_status === 'pending');

    const handleRejectLead = async (iqId: string) => {
        if (!window.confirm("Are you sure you want to REJECT this inquiry?")) return;
        try {
            const res = await authFetch(`${API}/api/study-inquiries/${iqId}/reject/`, { method: 'POST' });
            if (res.ok) { 
                alert("❌ LEAD REJECTED"); 
                fetchData(); 
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Failed to reject lead: ${err.error || err.detail || res.statusText}`);
            }
        } catch (err) { 
            alert("System error. Injection failed."); 
        }
    };

    const handleDeleteLead = async (iqId: string) => {
        if (!window.confirm("CRITICAL: Permanent deletion requested. Proceed with record erasure?")) return;
        try {
            const res = await authFetch(`${API}/api/study-inquiries/${iqId}/`, { method: 'DELETE' });
            if (res.ok) { 
                alert("🗑️ RECORD ERASED FROM CORE"); 
                fetchData(); 
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`❌ Erasure failed: ${err.error || err.detail || res.statusText}`);
            }
        } catch (err) { 
            alert("Critical failure in deletion sub-routine."); 
        }
    };

    const handleEngageLead = async (iqId: string) => {
        setIsEngaging(iqId);
        try {
            const res = await authFetch(`${API}/api/study-inquiries/${iqId}/engage/`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                alert(`✅ LEAD ENGAGED & AUTHORIZED\n\nStudy ID: ${data.id || 'N/A'}\n\nThe study has been auto-created and assigned to the sponsor.`);
                fetchData();
            } else {
                let errorMsg = 'Failed to engage lead';
                try { 
                    const err = await res.json(); 
                    errorMsg = err.error || err.details || errorMsg; 
                } catch (e) { 
                    errorMsg = `Server error (${res.status})`; 
                }
                alert(`❌ PROTOCOL ERROR: ${errorMsg}`);
            }
        } catch (err) { 
            alert("❌ CRITICAL INTERFACE FAILURE: Connection refused."); 
        } finally { 
            setIsEngaging(null); 
        }
    };

    const DetailRow = ({ label, value, color = "text-white", multiline = false }: any) => (
        <div className={`flex ${multiline ? 'flex-col gap-2' : 'justify-between items-center'} py-1`}>
            <span className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest italic">{label}</span>
            <span className={`${multiline ? 'text-[13px] leading-relaxed' : 'text-sm'} font-black italic uppercase tracking-tight ${color}`}>{value}</span>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f472b6] shadow-[0_0_10px_#f472b6]" />
                        <span className="text-[12px] font-black text-[#f472b6] uppercase tracking-[0.3em]">Platform Terminal</span>
                    </div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Clinical <span className="text-[#f472b6]">Inquiries</span>
                    </h1>
                    <p className="text-sm text-[#555a7a] font-black uppercase tracking-[0.1em] mt-4 max-w-xl">
                        Central capture point for clinical study queries, protocol authorizations, and feasibility packets.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex bg-[#0a0b1a] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                        <button
                            onClick={() => setSubTab('study_queries')}
                            className={`px-8 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${subTab === 'study_queries' ? 'bg-[#f472b6] text-white shadow-lg' : 'text-[#555a7a] hover:text-white'}`}
                        >
                            Study Queries ({studyInquiries.length})
                        </button>
                        <button
                            onClick={() => setSubTab('authorizations')}
                            className={`px-8 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${subTab === 'authorizations' ? 'bg-[#f472b6] text-white shadow-lg' : 'text-[#555a7a] hover:text-white'}`}
                        >
                            Authorizations ({pendingStudies.length})
                        </button>
                    </div>
                    {userRole === 'SUPER_ADMIN' && subTab === 'study_queries' && studyInquiries.length > 0 && (
                        <button
                            onClick={async () => {
                                if (!window.confirm("CRITICAL WARNING: Are you sure you want to REJECT and DELETE ALL pending study inquiries?")) return;
                                try {
                                    const res = await authFetch(`${API}/api/study-inquiries/reject-all-delete/`, { method: 'POST' });
                                    if (res.ok) { 
                                        alert("🗑️ ALL RECORDS REJECTED AND ERASED FROM CORE"); 
                                        fetchData(); 
                                    } else { 
                                        const err = await res.json().catch(() => ({})); 
                                        alert(`Failed: ${err.error || err.detail || res.statusText}`); 
                                    }
                                } catch (err) { 
                                    alert("System error."); 
                                }
                            }}
                            className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Reject & Delete All
                        </button>
                    )}
                </div>
            </div>

            {subTab === 'study_queries' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {studyInquiries.length === 0 ? (
                        <div className="col-span-full py-20 bg-[#0f1133] rounded-[3rem] border border-white/5 text-center">
                            <Server className="w-12 h-12 text-[#555a7a] mx-auto mb-6 animate-pulse" />
                            <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-[0.3em]">No incoming study queries</p>
                        </div>
                    ) : (
                        studyInquiries.map((iq: any, i: number) => (
                            <div key={i} className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-12 hover:border-[#f472b6]/40 transition-all group overflow-hidden relative shadow-2xl">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                                    <Globe className="w-40 h-40 text-white" />
                                </div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#f472b6]/10 flex items-center justify-center text-[#f472b6] border border-[#f472b6]/20">
                                            <Mail className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-black text-[#f472b6] uppercase tracking-widest mb-1 italic">{iq.category} INQUIRY</p>
                                            <h4 className="text-xl font-black text-white italic uppercase tracking-tight">{iq.product_name}</h4>
                                            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[12px] font-black uppercase tracking-widest ${iq.nda_preference === 'YES' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {iq.nda_preference === 'YES' ? 'NDA Path' : 'Direct Path'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest mb-1">{new Date(iq.created_at).toLocaleDateString()}</p>
                                        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 rounded-lg text-[12px] font-black uppercase tracking-widest border border-cyan-500/10 italic">{iq.status}</span>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-10 relative z-10">
                                    <DetailRow label="Legal Entity" value={iq.legal_name || 'Anonymous Sponsor'} />
                                    <DetailRow label="Clinical Needs" value={(iq.needs || []).join(', ')} color="text-cyan-400" />
                                    <DetailRow label="Primary Focus" value={iq.primary_focus} />
                                    <DetailRow label="Description" value={iq.project_description} multiline />
                                </div>
                                <div className="flex gap-4 relative z-10">
                                    <button 
                                        onClick={() => handleEngageLead(iq.id)}
                                        disabled={isEngaging === iq.id}
                                        className="flex-1 py-4 bg-[#f472b6] text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-pink-900/20 hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                        {isEngaging === iq.id ? 'Processing...' : 'Engage Lead'}
                                    </button>
                                    <button 
                                        onClick={() => handleRejectLead(iq.id)}
                                        className="px-6 py-4 bg-white/5 border border-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                    >
                                        Reject
                                    </button>
                                    {userRole === 'SUPER_ADMIN' && (
                                        <button 
                                            onClick={() => handleDeleteLead(iq.id)}
                                            className="px-6 py-4 bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-10 py-6 text-[12px] font-black text-[#555a7a] uppercase tracking-[0.2em]">Study Protocol</th>
                                <th className="px-10 py-6 text-[12px] font-black text-[#555a7a] uppercase tracking-[0.2em]">Sponsor</th>
                                <th className="px-10 py-6 text-[12px] font-black text-[#555a7a] uppercase tracking-[0.2em]">Submission Date</th>
                                <th className="px-10 py-6 text-[12px] font-black text-[#555a7a] uppercase tracking-[0.2em]">Approval State</th>
                                <th className="px-10 py-6 text-[12px] font-black text-[#555a7a] uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {pendingStudies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center text-[12px] text-[#555a7a] font-black uppercase tracking-[0.3em]">No pending protocol authorizations</td>
                                </tr>
                            ) : (
                                pendingStudies.map((study: any) => (
                                    <tr key={study.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-10 py-6">
                                            <span className="text-sm font-black text-white italic uppercase tracking-widest">{study.protocol_id}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-sm font-black text-[#8b8fa8] uppercase tracking-tight">{study.sponsor_name}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest">{new Date(study.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[11px] font-black uppercase tracking-widest italic">Pending Review</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button 
                                                onClick={() => handlePageChange('STUDIES')}
                                                className="px-6 py-3 bg-white/5 hover:bg-white hover:text-black rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                            >
                                                View Studio
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudyInquiriesModule;
