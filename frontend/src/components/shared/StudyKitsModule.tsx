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
    Plus
} from 'lucide-react';

interface StudyKit {
    id: string;
    kit_number: string;
    participant_name: string;
    protocol_id: string;
    status: 'In Preparation' | 'Shipped from Center' | 'Received by Participant' | 'Shipped from Participant' | 'Received by Center';
    carrier?: 'FedEx' | 'UPS' | 'DHL' | 'Other';
    last_updated: string;
    tracking_number?: string;
}

export default function StudyKitsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [kits, setKits] = useState<StudyKit[]>([
        { id: 'KIT-001', kit_number: 'SK-8291-A', participant_name: 'Alice Johnson', protocol_id: 'STUDY-2024-01', status: 'In Preparation', last_updated: '2026-03-20', carrier: 'FedEx' },
        { id: 'KIT-002', kit_number: 'SK-8291-B', participant_name: 'Bob Smith', protocol_id: 'STUDY-2024-01', status: 'Received by Participant', last_updated: '2026-03-21', tracking_number: '1Z999AA10123456785', carrier: 'UPS' },
        { id: 'KIT-003', kit_number: 'SK-8291-C', participant_name: 'Charlie Davis', protocol_id: 'STUDY-2024-02', status: 'Shipped from Center', last_updated: '2026-03-22', tracking_number: '1Z999AA10123456786', carrier: 'DHL' },
        { id: 'KIT-004', kit_number: 'SK-9000-X', participant_name: 'Diana Prince', protocol_id: 'STUDY-2024-02', status: 'Shipped from Participant', last_updated: '2026-03-23', carrier: 'FedEx' },
    ]);

    const filteredKits = kits.filter(kit => 
        (selectedStudyId === 'all' || !selectedStudyId || kit.protocol_id === selectedStudyId) &&
        (kit.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) || kit.kit_number.includes(searchQuery))
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Received by Participant': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Shipped from Center': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Shipped from Participant': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            case 'Received by Center': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case 'In Preparation': return 'text-slate-400 bg-white/5 border-white/10';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Study <span className="text-cyan-400">Kit Management</span></h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Clinical Logistics & Specimen Collection Gear</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Kit ID / Participant..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-white font-bold outline-none focus:border-cyan-500/50 transition-all w-72 uppercase tracking-widest placeholder:text-slate-700 font-mono"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3.5 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-cyan-600/20">
                        Assign New Kit <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Assigned', val: '248', icon: Box, color: 'cyan' },
                    { label: 'In Transit', val: '14', icon: Truck, color: 'amber' },
                    { label: 'Actively In-Use', val: '182', icon: Activity, color: 'emerald' },
                    { label: 'Returned Samples', val: '52', icon: Package, color: 'indigo' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#0B101B]/40 border border-white/5 rounded-[2.5rem] p-8 space-y-4 hover:border-cyan-500/20 transition-all group overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-125 transition-transform">
                            <kpi.icon className="w-16 h-16" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400`}>
                                <kpi.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{kpi.label}</span>
                        </div>
                        <p className="text-3xl font-black text-white italic tracking-tighter">{kpi.val}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#0B101B]/40 border border-white/5 rounded-[3rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Kit Details</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Assigned To</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Operational Status</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Last Update</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest italic text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredKits.map((kit) => (
                            <motion.tr key={kit.id} layout className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white italic truncate tracking-tight">{kit.kit_number}</p>
                                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{kit.protocol_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <p className="text-sm font-black text-white italic">{kit.participant_name}</p>
                                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
                                        <MapPin className="w-3 h-3" /> Household Location
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                                            <select 
                                                value={kit.carrier}
                                                onChange={(e) => {
                                                    const updated = kits.map(k => k.id === kit.id ? { ...k, carrier: e.target.value as any } : k);
                                                    setKits(updated);
                                                }}
                                                className="bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none cursor-pointer w-full px-2"
                                            >
                                                <option value="FedEx" className="bg-[#0B101B]">FEDEX</option>
                                                <option value="UPS" className="bg-[#0B101B]">UPS</option>
                                                <option value="DHL" className="bg-[#0B101B]">DHL</option>
                                                <option value="Other" className="bg-[#0B101B]">OTHER</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                                            <select 
                                                value={kit.status}
                                                onChange={(e) => {
                                                    const updated = kits.map(k => k.id === kit.id ? { ...k, status: e.target.value as any } : k);
                                                    setKits(updated);
                                                }}
                                                className={`bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer w-full px-2 ${getStatusStyle(kit.status).split(' ')[0]}`}
                                            >
                                                <option value="In Preparation" className="bg-[#0B101B]">IN PREPARATION</option>
                                                <option value="Shipped from Center" className="bg-[#0B101B]">SHIPPED FROM CENTER</option>
                                                <option value="Received by Participant" className="bg-[#0B101B]">RECEIVED BY PARTICIPANT</option>
                                                <option value="Shipped from Participant" className="bg-[#0B101B]">SHIPPED FROM PARTICIPANT</option>
                                                <option value="Received by Center" className="bg-[#0B101B]">RECEIVED BY CENTER</option>
                                            </select>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-slate-400 font-bold uppercase text-[10px]">
                                    {kit.last_updated}
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-6 py-2.5 bg-cyan-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.03] transition-all">Push Updates <Ship className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filteredKits.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-10 py-20 text-center text-slate-500 font-black uppercase tracking-widest text-xs italic">
                                    No kits found matching your parameters
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

// Separate icon from lucide-react for the module
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
