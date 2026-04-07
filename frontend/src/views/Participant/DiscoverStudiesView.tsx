import React, { useState, useEffect } from 'react';
import { Search, Loader2, Network, ClipboardCheck, AlertCircle, CheckCircle2, ArrowRight, Globe } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function DiscoverStudiesView() {
    const navigate = useNavigate();
    const [publicStudies, setPublicStudies] = useState<any[]>([]);
    const [activeEnrollment, setActiveEnrollment] = useState<any>(null);
    const [enrolledStudyId, setEnrolledStudyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = API || 'http://localhost:8000';

                // Fetch Participant records for the current user
                const pRes = await authFetch(`${apiUrl}/api/participants/`);
                if (pRes.ok) {
                    // 2. Prioritize truly ENROLLED/ACTIVE studies for the primary "Active Enrollment" banner
                    const pData = await pRes.json();

                    // Sort so that ENROLLED/ACTIVE/etc statuses come first
                    const priorityStatuses = ['ENROLLED', 'CONSENTED', 'RANDOMIZED', 'ACTIVE'];
                    const sortedPData = [...pData].sort((a: any, b: any) => {
                        const sA = (a.status || '').toUpperCase();
                        const sB = (b.status || '').toUpperCase();
                        const indexA = priorityStatuses.indexOf(sA);
                        const indexB = priorityStatuses.indexOf(sB);
                        // If one is in priority list and other isn't, priority wins
                        if (indexA !== -1 && indexB === -1) return -1;
                        if (indexA === -1 && indexB !== -1) return 1;
                        return 0;
                    });

                    const active = sortedPData.find(
                        (p: any) => !['DROPPED', 'INELIGIBLE', 'COMPLETED'].includes((p.status || '').toUpperCase())
                    );
                    if (active) {
                        setActiveEnrollment(active);
                        setEnrolledStudyId(active.study);
                    }
                }

                // Fetch Public Studies
                const res = await authFetch(`${apiUrl}/api/public-studies/`);
                if (res.ok) {
                    const data = await res.json();
                    const sorted = data.sort((a: any, b: any) =>
                        (a.title || '').localeCompare(b.title || '')
                    );
                    setPublicStudies(sorted);
                }
            } catch (error) {
                console.error('Error fetching studies data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isCurrentStudy = (study: any) =>
        enrolledStudyId &&
        (study.id === enrolledStudyId || study.protocol_id === enrolledStudyId);

    const hasActiveEnrollment = !!activeEnrollment;

    const getStatusColor = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'RECRUITING') return 'text-green-400 bg-green-500/10 border-green-500/20';
        if (s === 'ACTIVE') return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        if (s === 'PAUSED') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    };

    const getEnrollmentLabel = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'SCREENING') return 'Under Review';
        if (s === 'CONSENTED') return 'Consented';
        if (s === 'ACTIVE') return 'Active';
        if (s === 'RANDOMIZED') return 'Randomized';
        return s;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center pt-20">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">


            {publicStudies.length === 0 ? (
                <div className="p-12 border border-white/5 bg-[#0a0f1d] rounded-2xl text-center shadow-lg">
                    <Search className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 text-[12px] italic tracking-widest uppercase font-bold">
                        No active studies currently recruiting.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {publicStudies.map(study => {
                        const isMine = isCurrentStudy(study);
                        // Use protocol_id as the URL slug — matches how StudyDetail looks up studies
                        const studySlug = study.protocol_id || study.id;

                        return (
                            <div
                                key={`${study.protocol_id}-${study.title}`}
                                className={`bg-[#0a0e1a] border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between transition-all ${isMine ? 'border-cyan-500/40' : 'border-white/10 hover:border-cyan-500/30'}`}
                            >
                                {/* Accent bar */}
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isMine ? 'from-cyan-400 to-emerald-500' : 'from-cyan-500 to-blue-500'}`} />

                                <div className="space-y-3 mb-5">
                                    {/* Status badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[12px] px-2 py-1 rounded-sm uppercase tracking-widest font-black inline-block border ${getStatusColor(study.status)}`}>
                                            {study.status}
                                        </span>
                                        {isMine && (
                                            <span className={`text-[12px] px-2 py-1 rounded-sm uppercase tracking-widest font-black inline-flex items-center gap-1.5 border text-cyan-400 bg-cyan-500/10 border-cyan-500/20`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                {getEnrollmentLabel(activeEnrollment?.status)}
                                            </span>
                                        )}
                                        {study.remote_participation && (
                                            <span className="flex items-center gap-1 text-[12px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-sm uppercase tracking-widest">
                                                <Globe className="w-2.5 h-2.5" /> Remote
                                            </span>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <h3 className="text-[16px] font-black text-white italic uppercase leading-tight">{study.title}</h3>
                                        <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Protocol: {study.protocol_id}</p>
                                    </div>

                                    {/* Short description */}
                                    <p className="text-[13px] text-slate-400 line-clamp-2 leading-relaxed">
                                        {study.description || study.full_title || 'No description available.'}
                                    </p>

                                    {/* Quick meta row */}
                                    <div className="flex flex-wrap gap-3 text-[12px] font-bold text-slate-600 uppercase tracking-wider pt-1">
                                        {study.duration && <span>⏱ {study.duration}</span>}
                                        {study.location && <span>📍 {study.location}</span>}
                                        {study.compensation && <span className="text-green-500">💰 Compensated</span>}
                                    </div>
                                </div>

                                {/* Action */}
                                {isMine ? (
                                    <div className="w-full mt-auto bg-white/5 border border-cyan-500/20 text-cyan-400 px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 cursor-default">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Your Current Study
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {hasActiveEnrollment && (
                                            <p className="text-[12px] text-amber-500/80 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                PI/CC approval required to join
                                            </p>
                                        )}
                                        <button
                                            onClick={() => navigate(`/studies/${studySlug}`)}
                                            className="w-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 hover:text-cyan-200 px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <ClipboardCheck className="w-4 h-4" />
                                            Check Eligibility
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


