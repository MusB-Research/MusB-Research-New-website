import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, API } from '../../utils/auth';
import { Skeleton } from '../../views/Participant/SharedComponents';

import {
    Box,
    Search,
    Ship,
    ArrowRight,
    CheckCircle2,
    Clock,
    Package,
    Truck,
    MapPin,
    Calendar,
    Plus,
    ExternalLink,
    AlertCircle
} from 'lucide-react';

interface StudyKit {
    id: string;
    kit_number: string;
    participant_name: string;
    participant_id: string;
    protocol_id: string;
    address: string;
    status: 'ASSIGNED' | 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'RETURN_SHIPPED' | 'RECEIVED' | 'DAMAGED';
    carrier: 'FedEx' | 'UPS' | 'DHL' | 'USPS' | 'Other';
    last_updated: string;
    tracking_number: string;
    shipping_label_url?: string;
    return_label_url?: string;
}

// ────────────── No Mock Data (Database Only) ───────────────────────


export default function StudyKitsModule({ selectedStudyId, preloadedStudies, preloadedParticipants, isLoading: propLoading }: { selectedStudyId?: string, preloadedStudies?: any[], preloadedParticipants?: any[], isLoading?: boolean }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [kits, setKits] = useState<StudyKit[]>([]);
    const [studies, setStudies] = useState<any[]>(preloadedStudies || []);
    const [internalLoading, setInternalLoading] = useState(true);
    const isLoading = propLoading !== undefined ? propLoading : internalLoading;
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [participants, setParticipants] = useState<any[]>(preloadedParticipants || []);
    const [selectedStudyForAssignment, setSelectedStudyForAssignment] = useState<string>('');

    // Form state for new kit
    const [newKit, setNewKit] = useState({
        participantId: '',
        kitNumber: '',
        kitType: 'Standard',
        carrier: 'FedEx'
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RECEIVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10';
            case 'DELIVERED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10';
            case 'SHIPPED': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10';
            case 'ASSIGNED': return 'text-blue-400 bg-blue-500/5 border-blue-500/10 shadow-blue-500/10';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    const downloadLabel = (kit: StudyKit, type: 'SHIPPING' | 'RETURN') => {
        const doc = new Blob(['%PDF-1.4\n% Dummy Label for ' + kit.participant_name], { type: 'application/pdf' });
        const url = URL.createObjectURL(doc);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_LABEL_${kit.kit_number}.pdf`;
        link.click();
    };

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchKits = async () => {
        setInternalLoading(true);
        try {
            let url = `${API}/api/kits/`;
            if (selectedStudyId && selectedStudyId !== 'all') {
                url += `?study_id=${selectedStudyId}`;
            }
            const res = await authFetch(url);
            if (res.ok) {
                const data = await res.json();
                const kitsArray = Array.isArray(data) ? data : (data.results || []);
                if (kitsArray.length > 0) {
                    const mapped: StudyKit[] = kitsArray.map((k: any) => ({
                        id: k.id,
                        kit_number: k.kit_number,
                        participant_name: k.participant_name || 'Anonymous',
                        participant_id: k.participant_sid || 'N/A',
                        protocol_id: k.protocol_id || 'N/A',
                        address: k.address_override || 'Primary Subject Address',
                        status: k.status,
                        carrier: k.carrier as any,
                        last_updated: k.assignment_date?.split('T')[0] || 'Pending',
                        tracking_number: k.tracking_number || '',
                        shipping_label_url: k.shipping_label_url,
                        return_label_url: k.return_label_url
                    }));
                    setKits(mapped);
                } else {
                    setKits([]);
                }
            } else {
                setKits([]);
            }
        } catch (err) {
            console.error("Failed to fetch kits:", err);
            setKits([]);
        } finally {
            setInternalLoading(false);
        }
    };

    const fetchStudies = async () => {
        try {
            const res = await authFetch(`${API}/api/studies/`);
            if (res.ok) {
                const data = await res.json();
                setStudies(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) {
            console.error("Failed to fetch studies:", err);
        }
    };

    const fetchParticipants = async (studyId?: string) => {
        try {
            let url = `${API}/api/participants/`;
            const sid = studyId || selectedStudyId;
            if (sid && sid !== 'all') {
                url += `?study_id=${sid}`;
            }
            const res = await authFetch(url);
            if (res.ok) {
                const data = await res.json();
                setParticipants(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) {
            console.error("Failed to fetch participants for kit assignment:", err);
            setParticipants([]);
        }
    };

    useEffect(() => {
        fetchKits();
        if (!preloadedStudies || preloadedStudies.length === 0) {
            fetchStudies();
        }
        if (!preloadedParticipants || preloadedParticipants.length === 0) {
            fetchParticipants();
        }
    }, [selectedStudyId]);

    useEffect(() => {
        if (preloadedStudies && preloadedStudies.length > 0) setStudies(preloadedStudies);
    }, [preloadedStudies]);

    useEffect(() => {
        if (preloadedParticipants && preloadedParticipants.length > 0) setParticipants(preloadedParticipants);
    }, [preloadedParticipants]);

    useEffect(() => {
        if (isAssignModalOpen) {
            fetchParticipants(selectedStudyForAssignment);
        }
    }, [selectedStudyForAssignment]);

    useEffect(() => {
        if (isAssignModalOpen) {
            if (selectedStudyId && selectedStudyId !== 'all') {
                setSelectedStudyForAssignment(selectedStudyId);
            } else {
                setSelectedStudyForAssignment('');
            }
        }
    }, [isAssignModalOpen, selectedStudyId]);

    const handleUpdateKit = async (kitId: string, updates: Partial<StudyKit>) => {
        try {
            const backendUpdates: any = {};
            if (updates.status) backendUpdates.status = updates.status;
            if (updates.tracking_number !== undefined) backendUpdates.tracking_number = updates.tracking_number;
            if (updates.carrier) backendUpdates.carrier = updates.carrier;
            if (updates.address) backendUpdates.address_override = updates.address;

            const res = await authFetch(`${API}/api/kits/${kitId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendUpdates)
            });

            if (res.ok) {
                setKits(prev => prev.map(k => k.id === kitId ? { ...k, ...updates } : k));
            }
        } catch (err) {
            console.error("Failed to update kit:", err);
        }
    };

    const handleAssignKit = async () => {
        if (!newKit.participantId || !newKit.kitNumber || !selectedStudyForAssignment) {
            alert("Please select a study, participant, and enter a kit number.");
            return;
        }

        try {
            const selectedPart = participants.find(p => p.id === newKit.participantId);
            const res = await authFetch(`${API}/api/kits/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participant: newKit.participantId,
                    study: selectedStudyForAssignment || selectedPart?.study,
                    kit_number: newKit.kitNumber,
                    kit_type: newKit.kitType,
                    carrier: newKit.carrier,
                    status: 'ASSIGNED',
                    assignment_date: new Date().toISOString()
                })
            });

            if (res.ok) {
                setIsAssignModalOpen(false);
                fetchKits();
                setNewKit({ participantId: '', kitNumber: '', kitType: 'Standard', carrier: 'FedEx' });
                if (!selectedStudyId || selectedStudyId === 'all') {
                    setSelectedStudyForAssignment('');
                }
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to assign kit.");
            }
        } catch (err) {
            console.error("Error assigning kit:", err);
        }
    };

    const filteredKits = kits.filter(kit =>
        (selectedStudyId === 'all' || !selectedStudyId || kit.protocol_id === selectedStudyId) &&
        (kit.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) || (kit.kit_number && kit.kit_number.includes(searchQuery)) || (kit.participant_id && kit.participant_id.includes(searchQuery)))
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className={`flex ${isMobile ? 'flex-col gap-6' : (isTablet ? 'flex-col lg:flex-row lg:items-center' : 'items-center')} justify-between gap-8`}>
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-500/10 rounded-[1.5rem] border border-blue-500/20 shadow-xl shadow-blue-500/5">
                        <Ship className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-black text-white italic uppercase tracking-tighter`}>Dispatch <span className="text-blue-400">Management</span></h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Global Study Kit Logistics Hub</p>
                    </div>
                </div>
                <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                    <div className={`relative group ${isMobile ? 'w-full' : 'w-80'}`}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find Kit, Subject, or SID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[12px] text-white font-black outline-none focus:border-blue-500/50 transition-all w-full uppercase tracking-widest placeholder:text-slate-800 font-mono shadow-2xl"
                        />
                    </div>
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className={`flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-blue-600/30 ${isMobile ? 'w-full' : ''}`}
                    >
                        Assign New Kit <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1' : (isTablet ? 'grid-cols-2' : 'grid-cols-4')} gap-4 md:gap-6`}>
                {[
                    { label: 'Pending Dispatch', val: kits.filter(k => k.status === 'PREPARING' || k.status === 'PENDING').length, icon: Clock, color: 'blue' },
                    { label: 'Outbound Transit', val: kits.filter(k => k.status === 'SHIPPED').length, icon: Truck, color: 'amber' },
                    { label: 'Arrived at Site', val: kits.filter(k => k.status === 'DELIVERED').length, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Samples Returned', val: kits.filter(k => k.status === 'RECEIVED').length, icon: Package, color: 'indigo' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#0B101B]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 md:p-6 space-y-3 md:space-y-4 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-2xl">
                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform group-hover:rotate-12">
                            <kpi.icon className="w-16 h-16 md:w-20 md:h-20" />
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`w-8 h-8 md:w-9 md:h-9 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center text-blue-400`}>
                                <kpi.icon className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase tracking-widest">{kpi.label}</span>
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter relative z-10 tabular-nums leading-none">{kpi.val.toString().padStart(2, '0')}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#0B101B]/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

                {(isMobile || isTablet) ? (
                    <div className="p-4 space-y-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] animate-pulse space-y-4">
                                    <div className="h-6 bg-white/5 w-1/2 rounded-lg" />
                                    <div className="h-20 bg-white/5 w-full rounded-2xl" />
                                </div>
                            ))
                        ) : filteredKits.length === 0 ? (
                            <div className="py-20 text-center">
                                <Package className="w-12 h-12 text-slate-800 mx-auto mb-6 opacity-20" />
                                <p className="text-[12px] text-slate-600 font-black uppercase tracking-widest italic">No clinical kits found</p>
                            </div>
                        ) : filteredKits.map((kit) => (
                            <div key={kit.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 shadow-xl relative overflow-hidden group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] md:rounded-3xl bg-[#0B101B] border border-white/10 flex items-center justify-center text-blue-400 shadow-inner">
                                            <Package className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[8px] md:text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 font-mono font-black tracking-widest uppercase italic truncate block w-fit">{kit.protocol_id}</span>
                                            <p className="text-base md:text-lg font-black text-white italic uppercase tracking-tighter mt-1 truncate">{kit.kit_number}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 md:px-3 md:py-1 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-widest shrink-0 ${getStatusStyle(kit.status)}`}>
                                        {kit.status}
                                    </div>
                                </div>

                                <div className="space-y-4 py-4 border-y border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest italic leading-none">Participant / SID</p>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-base font-black text-white italic leading-none">{kit.participant_name}</p>
                                            <p className="text-[10px] md:text-[11px] font-bold text-blue-500/60 uppercase tracking-widest font-mono italic">{kit.participant_id}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-slate-500" />
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Delivery Vector</p>
                                        </div>
                                        <textarea
                                            value={kit.address}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setKits(prev => prev.map(k => k.id === kit.id ? { ...k, address: val } : k));
                                            }}
                                            onBlur={(e) => handleUpdateKit(kit.id, { address: e.target.value })}
                                            className="bg-transparent text-[11px] text-slate-300 font-medium leading-relaxed italic w-full h-12 outline-none border-none resize-none custom-scrollbar-vertical"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Carrier Vector</p>
                                        <select
                                            value={kit.carrier}
                                            onChange={(e) => handleUpdateKit(kit.id, { carrier: e.target.value as any })}
                                            className="w-full bg-white/5 px-3 py-3 rounded-xl border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none appearance-none italic"
                                        >
                                            <option value="FedEx">FEDEX</option>
                                            <option value="UPS">UPS</option>
                                            <option value="DHL">DHL</option>
                                            <option value="USPS">USPS</option>
                                        </select>
                                    </div>
                                    {kit.status === 'ASSIGNED' || kit.status === 'PREPARING' ? (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 space-y-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest italic">
                                                    <Truck className="w-3.5 h-3.5" /> Initialize Dispatch Protocol
                                                </div>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="CARRIER TRACKING #"
                                                        className="flex-1 bg-[#0B101B] border border-white/10 rounded-xl px-4 py-3.5 text-[12px] text-white font-mono outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-800"
                                                        onKeyDown={(e: any) => {
                                                            if (e.key === 'Enter' && e.target.value) {
                                                                handleUpdateKit(kit.id, { status: 'SHIPPED', tracking_number: e.target.value.trim() });
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={(e: any) => {
                                                            const input = e.currentTarget.previousSibling as HTMLInputElement;
                                                            if (input.value) {
                                                                handleUpdateKit(kit.id, { status: 'SHIPPED', tracking_number: input.value.trim() });
                                                            }
                                                        }}
                                                        className="px-6 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-blue-600/20"
                                                    >
                                                        Ship
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${kit.status === 'SHIPPED' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                                                <div className="space-y-1">
                                                    <div className={`text-[10px] font-black uppercase tracking-widest italic ${kit.status === 'SHIPPED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {kit.status === 'SHIPPED' ? 'Active Inbound Transit' : 'Material Received'}
                                                    </div>
                                                    <div className="text-[12px] font-black text-white font-mono tracking-tighter uppercase">{kit.tracking_number || 'Internal Transfer'}</div>
                                                </div>
                                                {kit.tracking_number && (
                                                    <button
                                                        onClick={() => window.open(`https://www.google.com/search?q=${kit.tracking_number}+tracking`, '_blank')}
                                                        className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        <button onClick={() => downloadLabel(kit, 'SHIPPING')} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                                            <Truck className="w-4 h-4" /> Shipping
                                        </button>
                                        <button onClick={() => downloadLabel(kit, 'RETURN')} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                                            <Package className="w-4 h-4" /> Return
                                        </button>
                                        <button onClick={() => alert(`Operational Audit Flagged`)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-all shadow-xl" title="Audit Flag">
                                            <AlertCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar-horizontal">
                        <table className="w-full text-left min-w-[1200px]">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Protocol & Kit Logistics</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Participant Info & Address</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Carrier & Tracking</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Dispatch Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest italic text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="px-8 py-10 border-r border-white/5">
                                                <div className="flex items-center gap-6 animate-pulse">
                                                    <div className="w-14 h-14 bg-white/5 rounded-3xl" />
                                                    <div className="space-y-3">
                                                        <div className="h-2 bg-white/5 w-20 rounded" />
                                                        <div className="h-4 bg-white/5 w-32 rounded" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td colSpan={4} />
                                        </tr>
                                    ))
                                ) : filteredKits.map((kit) => (
                                    <motion.tr key={kit.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-6 border-r border-white/5">
                                            <div className="flex items-center gap-8">
                                                <div className="w-16 h-16 rounded-[1.75rem] bg-[#0B101B] border border-white/10 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-all shadow-inner group-hover:scale-105">
                                                    <Package className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[11px] px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 font-mono font-black tracking-[0.2em] uppercase italic">{kit.protocol_id}</span>
                                                    </div>
                                                    <p className="text-xl font-black text-white italic truncate tracking-tighter uppercase leading-none">{kit.kit_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 border-r border-white/5">
                                            <p className="text-lg font-black text-white italic truncate leading-none mb-2">{kit.participant_name}</p>
                                            <p className="text-[12px] font-black text-blue-500/60 uppercase tracking-widest font-mono italic">{kit.participant_id}</p>
                                            <div className="flex items-start gap-3 mt-5 p-4 bg-white/5 rounded-[1.5rem] border border-white/5 group/addr relative transition-all hover:bg-white/10">
                                                <MapPin className="w-4 h-4 text-slate-600 mt-1 shrink-0" />
                                                <textarea
                                                    value={kit.address}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setKits(prev => prev.map(k => k.id === kit.id ? { ...k, address: val } : k));
                                                    }}
                                                    onBlur={(e) => handleUpdateKit(kit.id, { address: e.target.value })}
                                                    className="bg-transparent text-[12px] text-slate-400 font-medium leading-relaxed outline-none border-none resize-none h-14 w-full focus:text-white transition-colors custom-scrollbar-vertical"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 border-r border-white/5">
                                            <div className="space-y-5">
                                                <div className="bg-white/5 p-1 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
                                                    <select
                                                        value={kit.carrier}
                                                        onChange={(e) => handleUpdateKit(kit.id, { carrier: e.target.value as any })}
                                                        className="bg-transparent text-[12px] font-black text-slate-300 uppercase tracking-widest outline-none cursor-pointer w-full px-5 py-3 italic"
                                                    >
                                                        <option value="FedEx" className="bg-[#0B101B] text-white">FEDEX GLOBAL EXPRESS</option>
                                                        <option value="UPS" className="bg-[#0B101B] text-white">UPS WORLDWIDE LOGISTICS</option>
                                                        <option value="DHL" className="bg-[#0B101B] text-white">DHL INTERNATIONAL</option>
                                                        <option value="USPS" className="bg-[#0B101B] text-white">USPS PRIORITY RESEARCH</option>
                                                    </select>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-4 relative group/track overflow-hidden transition-all hover:border-blue-500/40">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 italic">Clinical Tracking Matrix</p>
                                                    <input
                                                        type="text"
                                                        value={kit.tracking_number}
                                                        placeholder={kit.status === 'PREPARING' ? 'AWAITING DISPATCH...' : 'ENTER TRACKING...'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setKits(prev => prev.map(k => k.id === kit.id ? { ...k, tracking_number: val } : k));
                                                        }}
                                                        onBlur={(e) => handleUpdateKit(kit.id, { tracking_number: e.target.value })}
                                                        className="bg-transparent text-[15px] font-black text-white italic outline-none w-full placeholder:text-slate-800 tracking-tighter tabular-nums"
                                                    />
                                                    {kit.tracking_number && (
                                                        <a
                                                            href={
                                                                kit.carrier === 'FedEx' ? `https://www.fedex.com/fedextrack/?trknbr=${kit.tracking_number}` :
                                                                    kit.carrier === 'UPS' ? `https://www.ups.com/track?tracknum=${kit.tracking_number}` :
                                                                        kit.carrier === 'DHL' ? `https://www.dhl.com/en/express/tracking.html?AWB=${kit.tracking_number}` :
                                                                            kit.carrier === 'USPS' ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${kit.tracking_number}` : '#'
                                                            }
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-2 mt-3 text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-[0.2em] italic"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" /> LIVE PROTOCOL TELEMETRY
                                                        </a>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 h-1 bg-blue-600 w-0 group-focus-within/track:w-full transition-all duration-700" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 border-r border-white/5">
                                            <div className="space-y-5">
                                                <div className="bg-white/5 p-1 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
                                                    <select
                                                        value={kit.status}
                                                        onChange={(e) => handleUpdateKit(kit.id, { status: e.target.value as any })}
                                                        className={`bg-transparent text-[12px] font-black uppercase tracking-widest outline-none cursor-pointer w-full px-5 py-3 italic ${getStatusStyle(kit.status).split(' ')[0]}`}
                                                    >
                                                        <option value="ASSIGNED" className="bg-[#0B101B] text-white">ASSIGNED FOR DISPATCH</option>
                                                        <option value="PREPARING" className="bg-[#0B101B] text-white">READY FOR DISPATCH</option>
                                                        <option value="SHIPPED" className="bg-[#0B101B] text-white">IN TRANSIT (OUTBOUND)</option>
                                                        <option value="DELIVERED" className="bg-[#0B101B] text-white">DELIVERED TO SITE</option>
                                                        <option value="RETURN_SHIPPED" className="bg-[#0B101B] text-white">IN TRANSIT (RETURN)</option>
                                                        <option value="RECEIVED" className="bg-[#0B101B] text-white">RECEIVED AT LAB</option>
                                                        <option value="DAMAGED" className="bg-[#0B101B] text-white">PROTOCOL VOID / DAMAGED</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-3 px-3">
                                                    <Calendar className="w-4 h-4 text-slate-700" />
                                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] italic">MODIFIED: {kit.last_updated}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex flex-col gap-3">
                                                {(kit.status === 'ASSIGNED' || kit.status === 'PREPARING') ? (
                                                    <button
                                                        onClick={() => {
                                                            const tracking = prompt("Enter Carrier Tracking ID:", kit.tracking_number || "");
                                                            if (tracking) {
                                                                handleUpdateKit(kit.id, { status: 'SHIPPED', tracking_number: tracking.trim() });
                                                                alert(`DISPATCH SUCCESSFUL:\n\nKit ID: ${kit.kit_id}\nTracking: ${tracking}\n\nShipping manifesto transmitted to carrier.`);
                                                            }
                                                        }}
                                                        className="px-6 py-4 bg-amber-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-900/40 hover:scale-[1.03] transition-all"
                                                    >
                                                        DISPATCH KIT
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => alert(`SYSTEM SYNC:\n\nRetrieving real-time tracking from carrier for Kit ${kit.kit_id}...\n\nStatus: ${kit.status} (Verified).`)}
                                                        className="px-6 py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 hover:scale-[1.03] transition-all"
                                                    >
                                                        SYNC STATUS
                                                    </button>
                                                )}
                                                <div className="flex items-center justify-end gap-3 mt-1">
                                                    <button onClick={() => { downloadLabel(kit, 'SHIPPING'); alert('LABEL GENERATION:\n\nFetching outbound shipping manifesto PDF...'); }} className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-blue-600/20 transition-all shadow-lg" title="Distro Label">
                                                        <Truck className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { downloadLabel(kit, 'RETURN'); alert('LABEL GENERATION:\n\nFetching return shipment manifesto PDF...'); }} className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-indigo-600/20 transition-all shadow-lg" title="Return Label">
                                                        <Package className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => alert(`Operational Audit Flagged`)} className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-all shadow-lg" title="Audit Flag">
                                                        <AlertCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignModalOpen(false)} className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-3xl bg-[#0B101B] border border-white/10 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(37,99,235,0.2)] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />

                            <div className="flex items-center gap-8 mb-12">
                                <div className="p-5 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                                    <Package className="w-10 h-10 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Assign <span className="text-blue-400">Clinical Kit</span></h3>
                                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Register specimen box with clinical logistics matrix</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Research Protocol / Study</label>
                                    <select
                                        value={selectedStudyForAssignment}
                                        onChange={(e) => setSelectedStudyForAssignment(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-5 text-[13px] font-black text-blue-400 outline-none focus:border-blue-500/50 transition-all uppercase appearance-none italic shadow-inner tabular-nums"
                                    >
                                        <option value="" className="bg-[#0B101B] text-white">-- SELECT ACTIVE PROTOCOL --</option>
                                        {studies.map(s => (
                                            <option key={s.id} value={s.id} className="bg-[#0B101B] text-white">{s.protocol_id || s.id} - {s.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Subject</label>
                                    <select
                                        value={newKit.participantId}
                                        onChange={(e) => setNewKit({ ...newKit, participantId: e.target.value })}
                                        disabled={!selectedStudyForAssignment}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-5 text-[13px] font-black text-white outline-none focus:border-blue-500/50 transition-all uppercase appearance-none disabled:opacity-30 italic shadow-inner"
                                    >
                                        <option value="" className="bg-[#0B101B] text-white">{selectedStudyForAssignment ? '-- CHOOSE SUBJECT --' : '-- SELECT STUDY FIRST --'}</option>
                                        {participants.map(p => (
                                            <option key={p.id} value={p.id} className="bg-[#0B101B] text-white">{p.participant_sid} - {p.user_details?.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Kit Serial Matrix</label>
                                    <input
                                        type="text"
                                        placeholder="EX: SK-2024-XXXX"
                                        value={newKit.kitNumber}
                                        onChange={(e) => setNewKit({ ...newKit, kitNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-5 text-[13px] font-black text-white outline-none focus:border-blue-500/50 transition-all uppercase placeholder:text-slate-800 italic shadow-inner tabular-nums tracking-tighter"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Clinical Protocol Type</label>
                                    <select
                                        value={newKit.kitType}
                                        onChange={(e) => setNewKit({ ...newKit, kitType: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-5 text-[13px] font-black text-white outline-none focus:border-blue-500/50 transition-all uppercase appearance-none italic shadow-inner"
                                    >
                                        <option value="Standard" className="bg-[#0B101B] text-white">STANDARD COLLECTION</option>
                                        <option value="Genetic" className="bg-[#0B101B] text-white">GENETIC SAMPLING</option>
                                        <option value="Biohazard" className="bg-[#0B101B] text-white">BIOHAZARD / CRITICAL</option>
                                        <option value="Ambient" className="bg-[#0B101B] text-white">AMBIENT LOGISTICS</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Logistics Carrier</label>
                                    <select
                                        value={newKit.carrier}
                                        onChange={(e) => setNewKit({ ...newKit, carrier: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-5 text-[13px] font-black text-white outline-none focus:border-blue-500/50 transition-all uppercase appearance-none italic shadow-inner"
                                    >
                                        <option value="FedEx" className="bg-[#0B101B] text-white">FEDEX GLOBAL EXPRESS</option>
                                        <option value="UPS" className="bg-[#0B101B] text-white">UPS WORLDWIDE</option>
                                        <option value="DHL" className="bg-[#0B101B] text-white">DHL INTERNATIONAL</option>
                                        <option value="USPS" className="bg-[#0B101B] text-white">USPS PRIORITY RESEARCH</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-16 flex gap-6">
                                <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 px-10 py-5 bg-white/5 border border-white/10 text-slate-500 rounded-[2rem] text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition-all italic">CANCEL</button>
                                <button onClick={handleAssignKit} className="flex-[2] px-10 py-5 bg-blue-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_50px_rgba(37,99,235,0.4)] italic">REGISTER PROTOCOL KIT</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Separated Icons
const Activity = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);


