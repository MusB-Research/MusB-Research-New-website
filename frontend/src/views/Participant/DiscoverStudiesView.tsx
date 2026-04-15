import React, { useState, useEffect } from 'react';
import { Search, Loader2, ClipboardCheck, ArrowRight, Clock, MapPin, DollarSign, ChevronRight, Activity, Filter, Info, LayoutGrid, List } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, Badge, Skeleton } from './SharedComponents';

export default function DiscoverStudiesView({ loading: externalLoading }: { loading?: boolean }) {
    const navigate = useNavigate();
    const [publicStudies, setPublicStudies] = useState<any[]>([]);
    const [internalLoading, setInternalLoading] = useState(true);
    const loading = externalLoading !== undefined ? externalLoading : internalLoading;

    const [participantRecords, setParticipantRecords] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchData = async () => {
            setInternalLoading(true);
            try {
                const apiUrl = API || 'http://localhost:8000';
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

    const getStatusStyle = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'RECRUITING' || s === 'OPEN') return 'green';
        if (s === 'UPCOMING') return 'blue';
        return 'slate';
    };

    const getEnrollmentStatus = (studyId: string) => {
        const records = Array.isArray(participantRecords) ? participantRecords : [];
        const record = records.find(p => String(p.study) === String(studyId));
        return record ? (record.status || 'REGISTERED').toUpperCase() : null;
    };

    if (loading) {
        return (
            <div className="grid-system">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white border border-[#E3ECF5] rounded-[24px] p-5 h-[380px] space-y-6 animate-pulse shadow-sm">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-20 rounded-lg" />
                            <Skeleton className="h-3 w-24 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-2xl" />
                        </div>
                        <div className="mt-auto pt-6 border-t border-[#F8FBFF]">
                            <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="hidden md:flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">
                            <span>Portal</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-[#00ADEF]">Opportunities</span>
                        </div>
                        <div className="inline-flex items-center px-3 py-1 bg-[#E3F2FD] text-[#00ADEF] rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] border border-[#BBDEFB] shadow-sm">
                            Active Protocols
                        </div>
                    </div>
                    <p className="text-[14px] font-black text-[#1A2B49] uppercase tracking-tight">Discover protocol opportunities and enrollment pathways</p>
                </div>
                <div className="flex bg-white border border-[#E3ECF5] p-1.5 rounded-[20px] shadow-sm shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-[#00ADEF] text-white shadow-lg shadow-[#00ADEF]/20 active:scale-95' : 'text-[#5F6F89] hover:bg-[#F8FBFF]'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-[#00ADEF] text-white shadow-lg shadow-[#00ADEF]/20 active:scale-95' : 'text-[#5F6F89] hover:bg-[#F8FBFF]'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {publicStudies.length === 0 ? (
                <div className="py-32 text-center bg-white border border-[#E3ECF5] rounded-[48px] shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 bg-[#F8FBFF] rounded-[32px] flex items-center justify-center text-[#5F6F89] mb-8 border border-[#E3ECF5]">
                        <Activity className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">No Active Protocols</h3>
                    <p className="text-[13px] text-[#5F6F89] font-bold uppercase tracking-[0.2em] mt-2 italic px-8">There are no studies matching your recruitment profile at this time</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid-system" : "flex flex-col gap-6"}>
                    {publicStudies.map(study => {
                        const enrollmentStatus = getEnrollmentStatus(study.id);
                        const isEnrolled = !!enrollmentStatus;

                        if (viewMode === 'list') {
                            return (
                                <motion.div
                                    key={study.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => navigate(`/studies/${study.protocol_id || study.id}`)}
                                    className="bg-white border border-[#E3ECF5] rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between transition-all duration-300 hover:shadow-xl hover:border-[#00ADEF]/30 group cursor-pointer"
                                >
                                    <div className="flex items-center gap-6 w-full">
                                        <div className="w-14 h-14 bg-[#F8FBFF] rounded-2xl flex items-center justify-center text-[#00ADEF] group-hover:bg-[#00ADEF] group-hover:text-white transition-all shadow-sm">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-base font-bold text-[#1A2B49] uppercase tracking-tight group-hover:text-[#00ADEF] transition-colors">
                                                    {study.title}
                                                </h3>
                                                <Badge color={getStatusStyle(study.status)}>
                                                    {study.status || 'RECRUITING'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-[#5F6F89] uppercase tracking-wide">
                                                    <Clock className="w-3.5 h-3.5 text-[#00ADEF]" />
                                                    {study.duration || 'Flexible'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-[#5F6F89] uppercase tracking-wide">
                                                    <MapPin className="w-3.5 h-3.5 text-[#00ADEF]" />
                                                    {study.visits || 'Hybrid'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-6 md:mt-0 w-full md:w-auto">
                                        {isEnrolled && (
                                            <Badge color="blue">
                                                <span className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ADEF] animate-pulse" />
                                                    {enrollmentStatus}
                                                </span>
                                            </Badge>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/studies/${study.protocol_id || study.id}/screener`);
                                            }}
                                            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center gap-3 ${isEnrolled && enrollmentStatus !== 'PENDING'
                                                    ? 'bg-slate-50 text-slate-400'
                                                    : 'bg-[#00ADEF] text-white hover:bg-[#1565C0] shadow-lg shadow-[#00ADEF]/10'
                                                }`}
                                        >
                                            <ClipboardCheck className="w-4 h-4" />
                                            Action Required
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={study.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => navigate(`/studies/${study.protocol_id || study.id}`)}
                                className="bg-white border border-[#E3ECF5] rounded-[24px] p-5 transition-all duration-300 hover:shadow-2xl hover:border-[#00ADEF]/30 group cursor-pointer relative overflow-hidden equal-height-card"
                            >
                                <div className="absolute top-0 right-0 p-5 opacity-[0.02] -rotate-12 group-hover:scale-110 transition-transform">
                                    <Activity className="w-32 h-32 text-[#00ADEF]" />
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge color={getStatusStyle(study.status)}>
                                                {study.status || 'RECRUITING'}
                                            </Badge>
                                            {isEnrolled && (
                                                <Badge color="blue">
                                                    <span className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ADEF] animate-pulse" />
                                                        {enrollmentStatus}
                                                    </span>
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-[#5F6F89] uppercase tracking-[0.2em]">
                                            ID: {study.protocol_id || 'LOCAL-01'}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h3 className="text-base font-bold text-[#1A2B49] uppercase group-hover:text-[#00ADEF] transition-colors tracking-tight line-clamp-1 min-h-[1.2rem] leading-snug">
                                            {study.title}
                                        </h3>
                                        <p className="text-[#5F6F89] text-[11px] font-bold uppercase tracking-widest line-clamp-2 min-h-[1.8rem] hidden md:block">
                                            {study.description || 'Clinical trial to advance de-identified biometric research paradigms.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-x-5 gap-y-3 pt-1">
                                        {study.duration && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#1A2B49] uppercase tracking-wide">
                                                <Clock className="w-3.5 h-3.5 text-[#00ADEF]" />
                                                {study.duration}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#1A2B49] uppercase tracking-wide">
                                            <MapPin className="w-3.5 h-3.5 text-[#00ADEF]" />
                                            {study.visits || 'Hybrid'} Protocol
                                        </div>
                                        {study.compensation && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#4CAF50] uppercase tracking-wide">
                                                <div className="p-0.5 bg-[#E8F5E9] rounded-md"><DollarSign className="w-3 h-3" /></div>
                                                Compensated
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card-action-bottom relative z-10 pt-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/studies/${study.protocol_id || study.id}/screener`);
                                        }}
                                        className={`w-full flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all shadow-sm ${isEnrolled && enrollmentStatus !== 'PENDING'
                                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                                : 'bg-[#00ADEF] text-white hover:bg-[#1565C0] shadow-blue-500/10'
                                            }`}
                                    >
                                        <ClipboardCheck className="w-3.5 h-3.5" />
                                        {isEnrolled ? (enrollmentStatus === 'PENDING' ? 'Retry Screening' : 'Enrolled') : 'Eligibility'}
                                        <ArrowRight className="w-2.5 h-2.5 ml-1 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Support Note */}
            <div className="mt-8 flex items-center justify-center gap-3 text-[#5F6F89]">
                <Info className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Privacy Notice: Screening interactions are fully encrypted and de-linked</p>
            </div>
        </div>
    );
}
