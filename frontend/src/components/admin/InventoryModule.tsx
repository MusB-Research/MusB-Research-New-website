import React from 'react';
import { motion } from 'framer-motion';
import { 
    Box, 
    Truck, 
    AlertTriangle, 
    ClipboardList,
    Barcode,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Download
} from 'lucide-react';

export default function InventoryModule() {
    const stockItems = [
        { sku: 'KIT-A92', name: 'Metabolic Phase II Kit', stock: 124, status: 'Healthy', location: 'Main Hub' },
        { sku: 'KIT-V01', name: 'VITAL-Age Blood Tube', stock: 42, status: 'Low Stock', location: 'London Site' },
        { sku: 'L-GLOVE', name: 'Latex Gloves (L)', stock: 2100, status: 'Restocking', location: 'Satellite B' },
        { sku: 'SWAB-02', name: 'Nasal Swabs (Bulk)', stock: 540, status: 'Healthy', location: 'Main Hub' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        Logistics <span className="text-cyan-400">& Inventory</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 italic">
                        Supply Chain Management & Kit Distribution
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2 italic">
                         <Download className="w-4 h-4" /> Export Report
                    </button>
                    <button className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <Box className="w-4 h-4" /> Provision New Batch
                    </button>
                </div>
            </div>

            {/* Logistics Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Outbound Kits', val: '142', growth: '+12', icon: ArrowUpRight, color: 'text-emerald-400' },
                    { label: 'Pending Returns', val: '28', growth: '-4', icon: ArrowDownRight, color: 'text-red-400' },
                    { label: 'Total Value on Site', val: '$84,200', growth: 'Safe', icon: Box, color: 'text-cyan-400' },
                ].map(stat => (
                    <div key={stat.label} className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-white/10 transition-all">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{stat.val}</p>
                            <p className={`text-[9px] font-bold uppercase ${stat.color} flex items-center gap-1`}>
                                <stat.icon className="w-3 h-3" /> {stat.growth} this week
                            </p>
                        </div>
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                            <stat.icon className="w-6 h-6 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Inventory Table */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10">
                        <div className="flex items-center justify-between mb-8">
                             <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <ClipboardList className="w-5 h-5 text-cyan-400" />
                                Stock <span className="text-cyan-400">Levels</span>
                             </h3>
                             <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                <input type="text" placeholder="Search SKU..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[10px] text-white outline-none focus:border-cyan-500/50 transition-all w-48 font-bold uppercase tracking-widest"/>
                             </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">SKU / Item</th>
                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Location</th>
                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Quantity</th>
                                        <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stockItems.map((item, i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-all">
                                            <td className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                        <Barcode className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase italic tracking-tight">{item.name}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{item.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{item.location}</span>
                                            </td>
                                            <td className="py-6">
                                                <span className="text-sm font-black text-white italic tracking-tighter">{item.stock}</span>
                                            </td>
                                            <td className="py-6 text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 ${
                                                    item.status === 'Low Stock' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                                    item.status === 'Restocking' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Shipment Tracker */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0B101B]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 space-y-6 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <Truck className="w-5 h-5 text-cyan-400" />
                                Active <span className="text-cyan-400">Shipments</span>
                            </h4>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            {[
                                { id: 'MB-TRK-9901', to: 'Site 01 (CA)', status: 'In Transit', progress: 75 },
                                { id: 'MB-TRK-8842', to: 'London Hub (UK)', status: 'Clearing Customs', progress: 40 },
                                { id: 'MB-TRK-7712', to: 'Tokyo Lab (JP)', status: 'Delayed', progress: 15 },
                            ].map((ship, i) => (
                                <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] space-y-4 group hover:border-cyan-500/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-white italic uppercase tracking-tight">{ship.id}</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dest: {ship.to}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${ship.status === 'Delayed' ? 'text-red-400' : 'text-cyan-400'}`}>{ship.status}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                            <span>Progress</span>
                                            <span>{ship.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                                            <div className={`h-full rounded-full ${ship.status === 'Delayed' ? 'bg-red-500/50' : 'bg-cyan-500'}`} style={{ width: `${ship.progress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all italic">Launch Global Tracker</button>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8 flex items-center gap-6">
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-red-400 font-black text-[11px] uppercase italic tracking-tighter">04 Items Near Expiry</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Require immediate rotation</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
