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

// ── Dummy/demo kits shown when the API returns no data ───────────────────────
const MOCK_KITS: StudyKit[] = [
    {
        id: 'mock-1',
        kit_number: 'SK-2025-0041',
        participant_name: 'Bijesh Kumar',
        participant_id: 'BTB-001',
        protocol_id: 'MUSB-BTB-1001',
        address: '4820 Bloom Ave, Tampa, FL 33612',
        status: 'SHIPPED',
        carrier: 'FedEx',
        last_updated: '2025-04-10',
        tracking_number: '7489234701289034',
    },
    {
        id: 'mock-2',
        kit_number: 'SK-2025-0042',
        participant_name: 'Sarah Mitchell',
        participant_id: 'BTB-002',
        protocol_id: 'MUSB-BTB-1001',
        address: '112 Oak Creek Blvd, Orlando, FL 32801',
        status: 'DELIVERED',
        carrier: 'UPS',
        last_updated: '2025-04-08',
        tracking_number: '1Z999AA10123456784',
    },
    {
        id: 'mock-3',
        kit_number: 'SK-2025-0043',
        participant_name: 'James Okafor',
        participant_id: 'BTB-003',
        protocol_id: 'MUSB-BTB-1001',
        address: '77 Research Pkwy, Miami, FL 33101',
        status: 'PREPARING',
        carrier: 'DHL',
        last_updated: '2025-04-12',
        tracking_number: '',
    },
    {
        id: 'mock-4',
        kit_number: 'SK-2025-0044',
        participant_name: 'Linda Reyes',
        participant_id: 'MS-011',
        protocol_id: 'MUSB-MS-2002',
        address: '305 Clinical Dr, Jacksonville, FL 32202',
        status: 'RETURN_SHIPPED',
        carrier: 'FedEx',
        last_updated: '2025-04-11',
        tracking_number: '7489234701389055',
    },
    {
        id: 'mock-5',
        kit_number: 'SK-2025-0045',
        participant_name: 'Carlos Hernandez',
        participant_id: 'MS-012',
        protocol_id: 'MUSB-MS-2002',
        address: '918 Wellness Ln, Gainesville, FL 32601',
        status: 'ASSIGNED',
        carrier: 'USPS',
        last_updated: '2025-04-13',
        tracking_number: '',
    },
];

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
                    // No records in DB yet — show demo data
                    setKits(MOCK_KITS);
                }
            } else {
                setKits(MOCK_KITS);
            }
        } catch (err) {
            console.error("Failed to fetch kits:", err);
            // On network error also fall back to mock data
            setKits(MOCK_KITS);
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

    // Sync state if props change
    useEffect(() => {
        if (preloadedStudies && preloadedStudies.length > 0) setStudies(preloadedStudies);
    }, [preloadedStudies]);

    useEffect(() => {
        if (preloadedParticipants && preloadedParticipants.length > 0) setParticipants(preloadedParticipants);
    }, [preloadedParticipants]);

    // Update participants when study selection in modal changes
    useEffect(() => {
        if (isAssignModalOpen) {
            fetchParticipants(selectedStudyForAssignment);
        }
    }, [selectedStudyForAssignment]);

    // Handle modal open/close
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
            // Map frontend fields back to backend naming if necessary
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
                // Reset study selection if we were in "all" view
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'SHIPPED': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'RETURN_SHIPPED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'RECEIVED': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'PREPARING': return 'text-slate-400 bg-white/5 border-white/10';
            case 'ASSIGNED': return 'text-red-400 bg-red-500/5 border-red-500/10';
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

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                        <Ship className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Dispatch <span className="text-blue-400">Management</span></h2>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1 italic">Global Study Kit Logistics & Multi-Carrier Hub</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find Kit, Subject, or SID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[12px] text-white font-bold outline-none focus:border-blue-500/50 transition-all w-80 uppercase tracking-widest placeholder:text-slate-700 font-mono shadow-2xl"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-blue-600/30"
                    >
                        Assign New Kit <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Pending Dispatch', val: kits.filter(k => k.status === 'PREPARING' || k.status === 'PENDING').length, icon: Clock, color: 'blue' },
                    { label: 'Outbound Transit', val: kits.filter(k => k.status === 'SHIPPED').length, icon: Truck, color: 'amber' },
                    { label: 'Arrived at Site', val: kits.filter(k => k.status === 'DELIVERED').length, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Samples Returned', val: kits.filter(k => k.status === 'RECEIVED').length, icon: Package, color: 'indigo' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#0B101B]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 space-y-2 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-xl">
                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform group-hover:rotate-12">
                            <kpi.icon className="w-16 h-16" />
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                            <div className={`p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400`}>
                                <kpi.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-black text-white italic tracking-tighter relative z-10 tabular-nums">{kpi.val.toString().padStart(2, '0')}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#0B101B]/40 backdrop-blur-2xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Protocol & Kit Logistics</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Participant Info & Address</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Carrier & Tracking</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Dispatch Status</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-white/5">
                                    <td className="px-6 py-8 border-r border-white/5">
                                        <div className="flex items-center gap-4">
                                            <Skeleton variant="circle" size="w-10 h-10" dark={true} />
                                            <div className="space-y-2">
                                                <Skeleton variant="text" className="w-24 h-2" dark={true} />
                                                <Skeleton variant="text" className="w-32 h-3" dark={true} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8 border-r border-white/5">
                                        <div className="space-y-2">
                                            <Skeleton variant="text" className="w-48 h-3" dark={true} />
                                            <Skeleton variant="text" className="w-32 h-2 opacity-50" dark={true} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-8 border-r border-white/5">
                                        <Skeleton variant="text" className="w-24 h-2 opacity-30" dark={true} />
                                    </td>
                                    <td className="px-6 py-8 border-r border-white/5">
                                        <Skeleton variant="text" className="w-20 h-6 rounded-full" dark={true} />
                                    </td>
                                    <td className="px-6 py-8 text-right">
                                        <Skeleton variant="text" className="inline-block w-8 h-8 rounded-lg" dark={true} />
                                    </td>
                                </tr>
                            ))
                        ) : filteredKits.map((kit) => (
                            <motion.tr key={kit.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4 border-r border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-3xl bg-[#0B101B] border border-white/10 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 transition-all shadow-inner group-hover:scale-110">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 font-mono font-black tracking-widest uppercase italic">{kit.protocol_id}</span>
                                            </div>
                                            <p className="text-lg font-black text-white italic truncate tracking-tighter uppercase">{kit.kit_number}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-r border-white/5">
                                    <p className="text-base font-black text-white italic truncate">{kit.participant_name}</p>
                                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">{kit.participant_id}</p>
                                    <div className="flex items-start gap-2 mt-3 p-3 bg-white/5 rounded-2xl border border-white/5 group/addr relative">
                                        <MapPin className="w-4 h-4 text-slate-600 mt-1 shrink-0" />
                                        <textarea 
                                            value={kit.address}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setKits(prev => prev.map(k => k.id === kit.id ? { ...k, address: val } : k));
                                            }}
                                            onBlur={(e) => handleUpdateKit(kit.id, { address: e.target.value })}
                                            className="bg-transparent text-[11px] text-slate-400 font-medium leading-relaxed outline-none border-none resize-none h-16 w-full focus:text-white transition-colors"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-r border-white/5">
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors">
                                            <select 
                                                value={kit.carrier}
                                                onChange={(e) => {
                                                    const val = e.target.value as any;
                                                    handleUpdateKit(kit.id, { carrier: val });
                                                }}
                                                className="bg-transparent text-[12px] font-black text-slate-400 uppercase tracking-widest outline-none cursor-pointer w-full px-4 py-2"
                                            >
                                                <option value="FedEx" className="bg-[#0B101B]">FEDEX GLOBAL</option>
                                                <option value="UPS" className="bg-[#0B101B]">UPS WORLDWIDE</option>
                                                <option value="DHL" className="bg-[#0B101B]">DHL EXPRESS</option>
                                                <option value="USPS" className="bg-[#0B101B]">USPS PRIORITY</option>
                                            </select>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 relative group/track overflow-hidden">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Master Tracking ID</p>
                                            <input 
                                                type="text" 
                                                value={kit.tracking_number}
                                                placeholder={kit.status === 'PREPARING' ? 'AWAITING DISPATCH...' : 'ENTER TRACKING...'}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setKits(prev => prev.map(k => k.id === kit.id ? { ...k, tracking_number: val } : k));
                                                }}
                                                onBlur={(e) => handleUpdateKit(kit.id, { tracking_number: e.target.value })}
                                                className="bg-transparent text-sm font-black text-white italic outline-none w-full placeholder:text-slate-800 tracking-tighter"
                                            />
                                            {!kit.tracking_number && (
                                                <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mt-1">NO ID ASSIGNED</p>
                                            )}
                                            {kit.tracking_number ? (
                                                <a 
                                                    href={
                                                        kit.carrier === 'FedEx' ? `https://www.fedex.com/fedextrack/?trknbr=${kit.tracking_number}` :
                                                        kit.carrier === 'UPS' ? `https://www.ups.com/track?tracknum=${kit.tracking_number}` :
                                                        kit.carrier === 'DHL' ? `https://www.dhl.com/en/express/tracking.html?AWB=${kit.tracking_number}` :
                                                        kit.carrier === 'USPS' ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${kit.tracking_number}` : '#'
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 mt-2 text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-widest italic"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Live Protocol Track
                                                </a>
                                            ) : (
                                                <a 
                                                    href={
                                                        kit.carrier === 'FedEx' ? `https://www.fedex.com/en-us/tracking.html` :
                                                        kit.carrier === 'UPS' ? `https://www.ups.com/track` :
                                                        kit.carrier === 'DHL' ? `https://www.dhl.com/en/express/tracking.html` :
                                                        kit.carrier === 'USPS' ? `https://tools.usps.com/go/TrackConfirmAction` : '#'
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 mt-2 text-[10px] font-black text-slate-600 hover:text-blue-400 transition-colors uppercase tracking-widest italic"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Open Carrier Portal
                                                </a>
                                            )}
                                            <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-0 group-focus-within/track:w-full transition-all duration-500" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-r border-white/5">
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-1 rounded-2xl border border-white/10">
                                            <select 
                                                value={kit.status}
                                                onChange={(e) => {
                                                    const val = e.target.value as any;
                                                    handleUpdateKit(kit.id, { status: val });
                                                }}
                                                className={`bg-transparent text-[12px] font-black uppercase tracking-widest outline-none cursor-pointer w-full px-4 py-2 ${getStatusStyle(kit.status).split(' ')[0]}`}
                                            >
                                                <option value="ASSIGNED" className="bg-[#0B101B]">ASSIGNED FOR DISPATCH</option>
                                                <option value="PREPARING" className="bg-[#0B101B]">READY FOR DISPATCH</option>
                                                <option value="SHIPPED" className="bg-[#0B101B]">IN TRANSIT (OUT)</option>
                                                <option value="DELIVERED" className="bg-[#0B101B]">DELIVERED TO SITE</option>
                                                <option value="RETURN_SHIPPED" className="bg-[#0B101B]">IN TRANSIT (RETURN)</option>
                                                <option value="RECEIVED" className="bg-[#0B101B]">RECEIVED AT LAB</option>
                                                <option value="DAMAGED" className="bg-[#0B101B]">PROTOCOL VOID / DAMAGED</option>
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic px-2">Modified: {kit.last_updated}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => alert(`Kit ${kit.kit_number} flagged for operational audit.`)}
                                            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-all flex items-center justify-between group/flag"
                                        >
                                            Flag for Review <AlertCircle className="w-3 h-3 opacity-0 group-hover/flag:opacity-100 transition-opacity" />
                                        </button>
                                        <button 
                                            onClick={() => downloadLabel(kit, 'SHIPPING')}
                                            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all flex items-center justify-between"
                                        >
                                            Distro Label <ArrowRight className="w-3 h-3 opacity-40" />
                                        </button>
                                        <button 
                                            onClick={() => downloadLabel(kit, 'RETURN')}
                                            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all flex items-center justify-between"
                                        >
                                            Return Label <ArrowRight className="w-3 h-3 opacity-40" />
                                        </button>
                                        {(kit.status === 'ASSIGNED' || kit.status === 'PREPARING') ? (
                                            <button 
                                                onClick={() => {
                                                    const tracking = prompt("CRITICAL: Enter Carrier Tracking Number to finalize dispatch [SHIPMENT PROTOCOL]:", kit.tracking_number || "");
                                                    if (tracking && tracking.trim() !== "") {
                                                        handleUpdateKit(kit.id, { status: 'SHIPPED', tracking_number: tracking.trim() });
                                                        alert(`✅ SYSTEM SYNC COMPLETE: Kit dispatched with Tracking ID [${tracking.trim()}]. Participant notified.`);
                                                    } else {
                                                        alert("🚨 PROTOCOL BLOCKED: A valid tracking number is mandatory for clinical dispatch synchronization.");
                                                    }
                                                }}
                                                className="px-5 py-3 bg-amber-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-900/40 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                                            >
                                                Begin Dispatch
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    alert(`Synchronizing Kit ${kit.kit_number} telemetry with clinical network...`);
                                                }}
                                                className="px-5 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-900/40 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                                            >
                                                Push Updates
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filteredKits.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-10 py-32 text-center">
                                    <Package className="w-12 h-12 text-slate-800 mx-auto mb-6 opacity-20" />
                                    <p className="text-[14px] text-slate-600 font-black uppercase tracking-[0.4em] italic leading-relaxed">No matching clinical kits found <br/> within the logistics matrix</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Assign New Kit Modal */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAssignModalOpen(false)}
                            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0B101B] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                            
                            <div className="flex items-center gap-6 mb-10">
                                <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                                    <Package className="w-8 h-8 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Assign New <span className="text-blue-400">Clinical Kit</span></h3>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Register specimen box with clinical logistics network</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Protocol / Study</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedStudyForAssignment}
                                            onChange={(e) => setSelectedStudyForAssignment(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-bold text-blue-400 outline-none focus:border-blue-500/50 transition-all uppercase appearance-none font-mono"
                                        >
                                            <option value="">Select Study...</option>
                                            {studies.map(s => (
                                                <option key={s.id} value={s.id} className="bg-[#0B101B]">
                                                    {s.protocol_id || s.id} - {s.title}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Box className="w-4 h-4 text-slate-500" />
                                        </div>
                                    </div>
                                    {selectedStudyForAssignment && (
                                        <motion.p 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 ml-1"
                                        >
                                            {participants.length} Active Participants enrolled in this protocol
                                        </motion.p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Participant</label>
                                    <div className="relative">
                                        <select 
                                            value={newKit.participantId}
                                            onChange={(e) => setNewKit({ ...newKit, participantId: e.target.value })}
                                            disabled={!selectedStudyForAssignment}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-bold text-white outline-none focus:border-blue-500/50 transition-all uppercase appearance-none disabled:opacity-50"
                                        >
                                            <option value="">{selectedStudyForAssignment ? 'Choose Subject...' : 'Please Select Study First'}</option>
                                            {participants.map(p => (
                                                <option key={p.id} value={p.id} className="bg-[#0B101B]">{p.participant_sid} - {p.user_details?.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kit Serial Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="EX: SK-2024-XXXX"
                                        value={newKit.kitNumber}
                                        onChange={(e) => setNewKit({ ...newKit, kitNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-bold text-white outline-none focus:border-blue-500/50 transition-all uppercase placeholder:text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kit Protocol Type</label>
                                    <select 
                                        value={newKit.kitType}
                                        onChange={(e) => setNewKit({ ...newKit, kitType: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-bold text-white outline-none focus:border-blue-500/50 transition-all uppercase appearance-none"
                                    >
                                        <option value="Standard" className="bg-[#0B101B]">Standard Collection</option>
                                        <option value="Genetic" className="bg-[#0B101B]">Genetic Sampling</option>
                                        <option value="Biohazard" className="bg-[#0B101B]">Biohazard / High Risk</option>
                                        <option value="Ambient" className="bg-[#0B101B]">Ambient Storage</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Carrier</label>
                                    <select 
                                        value={newKit.carrier}
                                        onChange={(e) => setNewKit({ ...newKit, carrier: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[12px] font-bold text-white outline-none focus:border-blue-500/50 transition-all uppercase appearance-none"
                                    >
                                        <option value="FedEx" className="bg-[#0B101B]">FedEx Express</option>
                                        <option value="UPS" className="bg-[#0B101B]">UPS Worldwide</option>
                                        <option value="DHL" className="bg-[#0B101B]">DHL Global</option>
                                        <option value="USPS" className="bg-[#0B101B]">USPS Priority</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-12 flex gap-4">
                                <button 
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="flex-1 px-8 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAssignKit}
                                    className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-900/40"
                                >
                                    Register Protocol Kit
                                </button>
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


