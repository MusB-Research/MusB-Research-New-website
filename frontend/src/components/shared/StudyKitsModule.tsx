import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    status: 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'RETURN_SHIPPED' | 'RECEIVED' | 'DAMAGED';
    carrier: 'FedEx' | 'UPS' | 'DHL' | 'USPS' | 'Other';
    last_updated: string;
    tracking_number: string;
    shipping_label_url?: string;
    return_label_url?: string;
}

export default function StudyKitsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [kits, setKits] = useState<StudyKit[]>([
        { 
            id: 'KIT-001', 
            kit_number: 'SK-8291-A', 
            participant_name: 'Alice Johnson', 
            participant_id: 'BTB-021',
            protocol_id: 'STUDY-2024-01', 
            address: '123 Clinical Way, San Francisco, CA 94107',
            status: 'PREPARING', 
            last_updated: 'Pending', 
            carrier: 'FedEx',
            tracking_number: ''
        },
        { 
            id: 'KIT-002', 
            kit_number: 'SK-8291-B', 
            participant_name: 'Bob Smith', 
            participant_id: 'BTB-042',
            protocol_id: 'STUDY-2024-01', 
            address: '456 Research Blvd, Austin, TX 78701',
            status: 'PENDING', 
            last_updated: 'Pending', 
            tracking_number: '', 
            carrier: 'UPS' 
        },
        { 
            id: 'KIT-003', 
            kit_number: 'SK-8291-C', 
            participant_name: 'Charlie Davis', 
            participant_id: 'BTB-089',
            protocol_id: 'STUDY-2024-02', 
            address: '789 Biotech Lane, Boston, MA 02118',
            status: 'PREPARING', 
            last_updated: 'Pending', 
            tracking_number: '', 
            carrier: 'DHL' 
        },
    ]);

    const filteredKits = kits.filter(kit => 
        (selectedStudyId === 'all' || !selectedStudyId || kit.protocol_id === selectedStudyId) &&
        (kit.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) || kit.kit_number.includes(searchQuery) || kit.participant_id.includes(searchQuery))
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'SHIPPED': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'RETURN_SHIPPED': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            case 'RECEIVED': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'PREPARING': return 'text-slate-400 bg-white/5 border-white/10';
            case 'PENDING': return 'text-red-400 bg-red-500/5 border-red-500/10';
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-cyan-500/10 rounded-3xl border border-cyan-500/20">
                        <Ship className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Dispatch <span className="text-cyan-400">Management</span></h2>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Global Study Kit Logistics & Multi-Carrier Hub</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find Kit, Subject, or SID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[12px] text-white font-bold outline-none focus:border-cyan-500/50 transition-all w-80 uppercase tracking-widest placeholder:text-slate-700 font-mono shadow-2xl"
                        />
                    </div>
                    <button className="flex items-center gap-3 px-8 py-4 bg-cyan-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-cyan-600/30">
                        Assign New Kit <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Pending Dispatch', val: kits.filter(k => k.status === 'PREPARING' || k.status === 'PENDING').length, icon: Clock, color: 'cyan' },
                    { label: 'Outbound Transit', val: kits.filter(k => k.status === 'SHIPPED').length, icon: Truck, color: 'amber' },
                    { label: 'Arrived at Site', val: kits.filter(k => k.status === 'DELIVERED').length, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Samples Returned', val: kits.filter(k => k.status === 'RECEIVED').length, icon: Package, color: 'indigo' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#0B101B]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-4 hover:border-cyan-500/30 transition-all group relative overflow-hidden shadow-xl">
                        <div className="absolute -top-6 -right-6 p-12 opacity-5 group-hover:scale-110 transition-transform group-hover:rotate-12">
                            <kpi.icon className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400`}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[12px] text-slate-500 font-black uppercase tracking-widest">{kpi.label}</span>
                        </div>
                        <p className="text-4xl font-black text-white italic tracking-tighter relative z-10 tabular-nums">{kpi.val.toString().padStart(2, '0')}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#0B101B]/40 backdrop-blur-2xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-10 py-8 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Kit Logistics</th>
                            <th className="px-10 py-8 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Participant Info & Address</th>
                            <th className="px-10 py-8 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Carrier & Tracking</th>
                            <th className="px-10 py-8 text-[12px] font-black text-slate-500 uppercase tracking-widest italic border-r border-white/5">Dispatch Status</th>
                            <th className="px-10 py-8 text-[12px] font-black text-slate-500 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredKits.map((kit) => (
                            <motion.tr key={kit.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-10 border-r border-white/5">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-3xl bg-[#0B101B] border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 transition-all shadow-inner group-hover:scale-110">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white italic truncate tracking-tighter uppercase">{kit.kit_number}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-slate-500 font-mono font-bold tracking-widest uppercase">{kit.protocol_id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <p className="text-base font-black text-white italic truncate">{kit.participant_name}</p>
                                    <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mt-0.5">{kit.participant_id}</p>
                                    <div className="flex items-start gap-2 mt-3 p-3 bg-white/5 rounded-2xl border border-white/5 group/addr relative">
                                        <MapPin className="w-4 h-4 text-slate-600 mt-1 shrink-0" />
                                        <textarea 
                                            value={kit.address}
                                            onChange={(e) => {
                                                const updated = kits.map(k => k.id === kit.id ? { ...k, address: e.target.value } : k);
                                                setKits(updated);
                                            }}
                                            className="bg-transparent text-[11px] text-slate-400 font-medium leading-relaxed outline-none border-none resize-none h-16 w-full focus:text-white transition-colors"
                                        />
                                    </div>
                                </td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-colors">
                                            <select 
                                                value={kit.carrier}
                                                onChange={(e) => {
                                                    const updated = kits.map(k => k.id === kit.id ? { ...k, carrier: e.target.value as any } : k);
                                                    setKits(updated);
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
                                                    const updated = kits.map(k => k.id === kit.id ? { ...k, tracking_number: e.target.value } : k);
                                                    setKits(updated);
                                                }}
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
                                                    className="flex items-center gap-1.5 mt-2 text-[10px] font-black text-cyan-400 hover:text-white transition-colors uppercase tracking-widest italic"
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
                                                    className="flex items-center gap-1.5 mt-2 text-[10px] font-black text-slate-600 hover:text-cyan-400 transition-colors uppercase tracking-widest italic"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Open Carrier Portal
                                                </a>
                                            )}
                                            <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-600 w-0 group-focus-within/track:w-full transition-all duration-500" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-10 border-r border-white/5">
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-1 rounded-2xl border border-white/10">
                                            <select 
                                                value={kit.status}
                                                onChange={(e) => {
                                                    const updated = kits.map(k => k.id === kit.id ? { ...k, status: e.target.value as any, last_updated: new Date().toISOString().split('T')[0] } : k);
                                                    setKits(updated);
                                                }}
                                                className={`bg-transparent text-[12px] font-black uppercase tracking-widest outline-none cursor-pointer w-full px-4 py-2 ${getStatusStyle(kit.status).split(' ')[0]}`}
                                            >
                                                <option value="PENDING" className="bg-[#0B101B]">PENDING REVIEW</option>
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
                                <td className="px-10 py-10">
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => alert(`Kit ${kit.kit_number} flagged for operational audit.`)}
                                            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-all flex items-center justify-between group/flag"
                                        >
                                            Flag for Review <AlertCircle className="w-3 h-3 opacity-0 group-hover/flag:opacity-100 transition-opacity" />
                                        </button>
                                        <button 
                                            onClick={() => downloadLabel(kit, 'SHIPPING')}
                                            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-cyan-600 hover:border-cyan-500 transition-all flex items-center justify-between"
                                        >
                                            Distro Label <ArrowRight className="w-3 h-3 opacity-40" />
                                        </button>
                                        <button 
                                            onClick={() => downloadLabel(kit, 'RETURN')}
                                            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all flex items-center justify-between"
                                        >
                                            Return Label <ArrowRight className="w-3 h-3 opacity-40" />
                                        </button>
                                        {(kit.status === 'PENDING' || kit.status === 'PREPARING') ? (
                                            <button 
                                                onClick={() => {
                                                    const tracking = prompt("CRITICAL: Enter Carrier Tracking Number to finalize dispatch [SHIPMENT PROTOCOL]:", kit.tracking_number || "");
                                                    if (tracking && tracking.trim() !== "") {
                                                        setKits(prev => prev.map(k => k.id === kit.id ? { ...k, status: 'SHIPPED', tracking_number: tracking.trim(), last_updated: new Date().toISOString().split('T')[0] } : k));
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
                                                className="px-5 py-3 bg-cyan-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-900/40 hover:scale-[1.02] active:scale-95 transition-all mt-2"
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


