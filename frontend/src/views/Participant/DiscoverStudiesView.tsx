import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Loader2, Network } from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

export default function DiscoverStudiesView({ onEnrollSubmit }: { onEnrollSubmit?: (studyId: string) => void }) {
    const [publicStudies, setPublicStudies] = useState<any[]>([]);
    const [enrolledStudyIds, setEnrolledStudyIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = API || 'http://localhost:8000';
                
                // 1. Fetch Participant Enrollments
                const pRes = await authFetch(`${apiUrl}/api/participants/`);
                if (pRes.ok) {
                    const pData = await pRes.json();
                    setEnrolledStudyIds(pData.map((p: any) => p.study));
                }

                // 2. Fetch Public Studies
                const res = await authFetch(`${apiUrl}/api/public-studies/`);
                if (res.ok) {
                    const data = await res.json();
                    // Sort: Alphabetical by Title (A-Z)
                    const sorted = data.sort((a: any, b: any) => 
                        (a.title || "").localeCompare(b.title || "")
                    );
                    setPublicStudies(sorted);
                }
            } catch (error) {
                console.error("Error fetching studies data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleEnroll = async (studyId: string) => {
        if (enrolledStudyIds.includes(studyId)) return;
        
        setEnrollingId(studyId);
        try {
            const apiUrl = API || 'http://localhost:8000';
            const res = await authFetch(`${apiUrl}/api/public-studies/${studyId}/enroll/`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Successfully enrolled in ${data.study_title || studyId}! Protocol node sync initiated.`);
                // Update local state instead of full redirect if desired, but user preferred dashboard refresh before
                window.location.reload(); 
            } else {
                alert(`Error: ${data.message || 'Error occurred during enrollment.'}`);
            }
        } catch (error) {
            console.error("Enroll error", error);
            alert("Error confirming connection. Node offline.");
        } finally {
            setEnrollingId(null);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    <Network className="w-8 h-8 text-cyan-400" /> Discover Studies
                </h2>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest font-black mt-2">Available protocols securely broadcasting for participants</p>
            </div>

            {publicStudies.length === 0 ? (
                <div className="p-12 border border-white/5 bg-[#0a0f1d] rounded-2xl text-center shadow-lg">
                    <Search className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 text-xs italic tracking-widest uppercase font-bold">No active protocols currently recruiting.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {publicStudies.map(study => (
                        <div key={`${study.protocol_id}-${study.title}`} className="bg-[#0a0e1a] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all flex flex-col justify-between">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                            <div className="space-y-4 mb-6">
                                <div>
                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded-sm uppercase tracking-widest font-black inline-block mb-3 border border-green-500/20">{study.status}</span>
                                    <h3 className="text-[17px] font-black text-white italic uppercase lg:truncate">{study.title}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {study.protocol_id}</p>
                                </div>
                                <p className="text-[13px] text-slate-400 line-clamp-3 leading-relaxed">{study.description || study.full_title}</p>
                            </div>
                            {enrolledStudyIds.includes(study.protocol_id) || enrolledStudyIds.includes(study.id) ? (
                                <div className="w-full mt-auto bg-white/5 border border-white/10 text-cyan-400 px-4 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-default">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                    Active Enrollment
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleEnroll(study.protocol_id || study.id)}
                                    disabled={enrollingId !== null}
                                    className="w-full mt-auto bg-cyan-500 flex-shrink-0 text-slate-900 border border-cyan-400 hover:bg-cyan-400 px-4 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {enrollingId !== null && (enrollingId === study.protocol_id || enrollingId === study.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                                    ) : (
                                        <>
                                            <ChevronRight className="w-4 h-4" /> 
                                            Initialize Enrollment
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
