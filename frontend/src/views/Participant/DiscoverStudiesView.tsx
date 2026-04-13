import React, { useState, useEffect } from 'react';
import { Search, Loader2, ClipboardCheck, ArrowRight, Clock, MapPin, DollarSign } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function DiscoverStudiesView({ loading: externalLoading }: { loading?: boolean }) {
    const navigate = useNavigate();
    const [publicStudies, setPublicStudies] = useState<any[]>([]);
    const [internalLoading, setInternalLoading] = useState(true);
    const loading = externalLoading !== undefined ? externalLoading : internalLoading;

    const [participantRecords, setParticipantRecords] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setInternalLoading(true);
            try {
                const apiUrl = API || 'http://localhost:8000';
                
                // Fetch studies and all participant records in parallel
                const [studiesRes, recordsRes] = await Promise.all([
                    authFetch(`${apiUrl}/api/public-studies/`),
                    authFetch(`${apiUrl}/api/participants/`)
                ]);

                if (studiesRes.ok) {
                    const data = await studiesRes.json();
                    setPublicStudies(Array.isArray(data) ? data : (data.results || []));
                }

                if (recordsRes.ok) {
                    const data = await recordsRes.json();
                    setParticipantRecords(Array.isArray(data) ? data : (data.results || []));
                }
            } catch (error) {
                console.error('Error fetching discovery data:', error);
            } finally {
                setInternalLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusStyles = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'RECRUITING' || s === 'OPEN') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (s === 'UPCOMING') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (s === 'CLOSED') return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    };

    const getEnrollmentStatus = (studyId: string) => {
        const records = Array.isArray(participantRecords) ? participantRecords : [];
        const record = records.find(p => String(p.study) === String(studyId));
        return record ? (record.status || 'REGISTERED').toUpperCase() : null;
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-[#0a1525]/80 border border-white/[0.03] rounded-3xl p-6 h-[420px] relative overflow-hidden">
                        <div className="shimmer-effect" />
                        <div className="space-y-6">
                            <div className="flex justify-between">
                                <div className="h-8 w-24 bg-white/5 rounded-lg" />
                                <div className="h-4 w-32 bg-white/5 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-12 w-full bg-white/5 rounded-xl" />
                                <div className="h-4 w-3/4 bg-white/5 rounded-full" />
                            </div>
                            <div className="flex gap-4">
                                <div className="h-4 w-20 bg-white/5 rounded-full" />
                                <div className="h-4 w-20 bg-white/5 rounded-full" />
                            </div>
                            <div className="mt-auto border-t border-white/5 pt-8">
                                <div className="h-14 w-full bg-white/5 rounded-xl" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {publicStudies.length === 0 ? (
                <div className="p-20 border border-white/5 bg-[#0a0f1d]/50 rounded-3xl text-center">
                    <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">No studies available at the moment</h3>
                    <p className="text-slate-600 text-sm mt-2 uppercase tracking-tight">Check back later or update your profile</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {publicStudies.map(study => {
                        const enrollmentStatus = getEnrollmentStatus(study.id);
                        const isEnrolled = !!enrollmentStatus;

                        return (
                            <div
                                key={study.id}
                                onClick={() => navigate(`/studies/${study.protocol_id || study.id}`)}
                                className="bg-[#0a1525]/80 backdrop-blur-xl border border-white/[0.03] rounded-3xl p-6 flex flex-col justify-between transition-all duration-500 hover:bg-[#0c1a33] hover:border-amber-500/30 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_30px_rgba(251,191,36,0.03)] group relative overflow-hidden cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-2">
                                            <span className={`px-3 py-1.5 rounded-md text-[12px] font-black uppercase tracking-[0.1em] border ${getStatusStyles(study.status)}`}>
                                                {study.status || 'RECRUITING'}
                                            </span>
                                            {isEnrolled && (
                                                <span className="px-3 py-1.5 rounded-md text-[12px] font-black uppercase tracking-[0.1em] bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
                                                    {enrollmentStatus}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                                            STUDY ID: {study.protocol_id || study.id}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white uppercase group-hover:text-amber-400 transition-colors tracking-tight line-clamp-2 min-h-[3.5rem]">
                                            {study.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm line-clamp-2 font-medium leading-relaxed min-h-[2.5rem]">
                                            {study.description || 'Join our clinical research to help advance medical science.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                                        {study.duration && (
                                            <div className="flex items-center gap-2 text-[12px] font-black text-slate-400 uppercase tracking-wider">
                                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                {study.duration}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[12px] font-black text-slate-400 uppercase tracking-wider">
                                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                            {study.visits || 'Multiple'} Visits
                                        </div>
                                        {study.compensation && (
                                            <div className="flex items-center gap-2 text-[12px] font-black text-amber-500 uppercase tracking-wider">
                                                <DollarSign className="w-3.5 h-3.5" />
                                                YOU WILL BE COMPENSATED
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/studies/${study.protocol_id || study.id}/screener`);
                                        }}
                                        className={`w-full flex items-center justify-center gap-3 border font-black uppercase tracking-[0.2em] text-[12px] py-4 rounded-xl transition-all duration-500 active:scale-[0.98] shadow-lg ${
                                            isEnrolled && enrollmentStatus !== 'PENDING'
                                            ? 'bg-white/5 border-white/10 text-slate-600'
                                            : 'bg-amber-400/5 hover:bg-amber-400 border-amber-400/40 hover:border-amber-400 text-amber-500 hover:text-black shadow-amber-500/5'
                                        }`}
                                    >
                                        <ClipboardCheck className="w-4 h-4 transition-transform group-hover:scale-110" />
                                        {isEnrolled ? (enrollmentStatus === 'PENDING' ? 'Check Again' : 'Already Enrolled') : 'Check Eligibility'}
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
}
        </div>
    );
}


