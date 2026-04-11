import React, { useState, useEffect } from 'react';
import { Search, Loader2, Network, ClipboardCheck, AlertCircle, CheckCircle2, ArrowRight, Globe, LayoutGrid, List } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function DiscoverStudiesView() {
    const navigate = useNavigate();
    const [publicStudies, setPublicStudies] = useState<any[]>([]);
    const [activeEnrollment, setActiveEnrollment] = useState<any>(null);
    const [enrolledStudyId, setEnrolledStudyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = API || 'http://localhost:8000';
                // Fetch Participant records and Public Studies in parallel
                const [pRes, res] = await Promise.all([
                    authFetch(`${apiUrl}/api/participants/`),
                    authFetch(`${apiUrl}/api/public-studies/`)
                ]);

                if (pRes.ok) {
                    const data = await pRes.json();
                    const pData = Array.isArray(data) ? data : (data.results || []);
                    // Senior Developer: Strict Priority Sorting to ensure "Current Study" matches ground-truth enrollment
                    const priority = ['ENROLLED', 'RANDOMIZED', 'ACTIVE', 'CONSENTED'];
                    const sortedPData = [...pData].sort((a: any, b: any) => {
                        const sA = (a.status || '').toUpperCase();
                        const sB = (b.status || '').toUpperCase();
                        const idxA = priority.indexOf(sA);
                        const idxB = priority.indexOf(sB);
                        
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
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

                if (res.ok) {
                    const data = await res.json();
                    const results = Array.isArray(data) ? data : (data.results || []);
                    // Primary Sort: created_at (Oldest First) to match backend standard
                    const sorted = [...results].sort((a: any, b: any) =>
                        (a.created_at || '').localeCompare(b.created_at || '')
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
        // Senior Developer: Mapping internal protocol states to user-centric labels
        if (['SCREENING', 'PENDING_REVIEW', 'APPLICATION'].includes(s)) return 'Under Review';
        if (['CONSENTED', 'ENROLLED', 'RANDOMIZED', 'ACTIVE'].includes(s)) return 'Enrolled';
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
                <div className="space-y-6">
                    {/* View Toggle */}
                    <div className="flex justify-end pt-2 relative z-50">
                        <div className="flex bg-[#0a0f1d] p-1 rounded-2xl border border-white/5 shadow-2xl relative z-50">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-600 hover:text-slate-400'} cursor-pointer`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-600 hover:text-slate-400'} cursor-pointer`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className={viewMode === 'grid' ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : "space-y-4"}>
                        {publicStudies.map(study => {
                            const isMine = isCurrentStudy(study);
                            const studySlug = study.protocol_id || study.id;

                            return (
                                <div
                                    key={`${study.protocol_id}-${study.title}`}
                                    className={`bg-[#0a0e1a] border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col transition-all ${isMine ? 'border-cyan-500/40' : 'border-white/10 hover:border-cyan-500/30'} ${viewMode === 'list' ? 'md:flex-row md:items-center md:justify-between gap-6' : 'justify-between'}`}
                                >
                                    {/* Accent bar */}
                                    <div className={`absolute ${viewMode === 'grid' ? 'top-0 left-0 w-full h-1' : 'top-0 left-0 w-1 h-full'} bg-gradient-to-r from-cyan-400 to-emerald-500`} />

                                    <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : 'mb-5'}`}>
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

                                        {/* Title & Info */}
                                        <div className={viewMode === 'list' ? 'flex flex-col md:flex-row md:items-baseline gap-4 md:gap-6' : ''}>
                                            <div>
                                                <h3 className="text-[16px] font-black text-white italic uppercase leading-tight">{study.title}</h3>
                                                <p className="text-[12px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">STUDY ID: {study.protocol_id}</p>
                                            </div>

                                            {viewMode === 'list' && (
                                                <div className="flex flex-wrap gap-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {study.duration && <span>⏱ {study.duration}</span>}
                                                    {study.location && <span>📍 {study.location}</span>}
                                                    {study.compensation && <span className="text-green-500 italic">💰 YOU WILL BE COMPENSATED</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Short description - only in grid or responsive list */}
                                        {viewMode === 'grid' && (
                                            <p className="text-[13px] text-slate-400 line-clamp-2 leading-relaxed">
                                                {study.description || study.full_title || 'No description available.'}
                                            </p>
                                        )}

                                        {/* Quick meta row - grid only */}
                                        {viewMode === 'grid' && (
                                            <div className="flex flex-wrap gap-3 text-[12px] font-bold text-slate-600 uppercase tracking-wider pt-1">
                                                {study.duration && <span>⏱ {study.duration}</span>}
                                                {study.location && <span>📍 {study.location}</span>}
                                                {study.compensation && <span className="text-green-500 font-black italic">💰 YOU WILL BE COMPENSATED</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Section */}
                                    <div className={`${viewMode === 'list' ? 'w-full md:w-64' : 'w-full'}`}>
                                        {isMine ? (
                                            <div className="w-full bg-white/5 border border-cyan-500/20 text-cyan-400 px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 cursor-default">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Current Study
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {hasActiveEnrollment && viewMode === 'grid' && (
                                                    <p className="text-[11px] text-amber-500/60 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Approval required
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/studies/${studySlug}`)}
                                                    className="w-full bg-gradient-to-r from-cyan-500/5 to-blue-500/5 hover:from-cyan-500/15 hover:to-blue-500/15 border border-cyan-500/20 hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 px-4 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
                                                >
                                                    <ClipboardCheck className="w-4 h-4" />
                                                    {viewMode === 'list' ? 'Enroll' : 'Check Eligibility'}
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}


