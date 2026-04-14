import React from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, Download, Printer, 
    Truck, CheckCircle2, Info, Package,
    Ship, Droplets, MapPin, QrCode, ArrowRight, Zap, Activity
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';

const ReturnLabelView = ({ onBack }: { onBack: () => void }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col gap-10 max-w-[1000px] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2.5 text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest hover:text-[#1E88E5] transition-colors group px-4 py-2 bg-white rounded-xl border border-[#E3ECF5] shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Kits
                    </button>
                    <div className="h-8 w-px bg-[#E3ECF5] mx-1" />
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-[#F0F6FF] flex items-center justify-center text-[#1E88E5] border border-[#E3F2FD]">
                            <Ship className="w-5.5 h-5.5" />
                        </div>
                        <h2 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Return Logistics</h2>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={handlePrint}
                        className="p-3.5 bg-white hover:bg-[#F8FBFF] rounded-xl text-[#8A99B3] hover:text-[#1E88E5] transition-all border border-[#E3ECF5] shadow-sm"
                        title="Print Label"
                    >
                        <Printer className="w-5 h-5" />
                    </button>

                    <a 
                         href="/booklets/alcoprotect_booklet.pdf"
                         download="Return_Label_MUSB.pdf"
                         className="flex items-center gap-3 px-8 py-3.5 bg-[#1E88E5] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-[#1565C0] transition-all shadow-lg shadow-blue-500/10"
                    >
                        <Download className="w-4.5 h-4.5" />
                        Download Asset
                    </a>
                </div>
            </div>

            {/* SHIPPING LABEL DISPLAY */}
            <div className="p-1 bg-[#F5F9FF] border border-[#E3ECF5] rounded-[40px] shadow-2xl overflow-hidden">
                <div className="p-12 bg-white rounded-[38px] text-slate-900 flex flex-col items-center">
                    {/* CARRIER HEADER */}
                    <div className="w-full flex items-center justify-between pb-10 border-b-8 border-slate-900 mb-10">
                         <div className="flex items-center gap-6">
                             <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center text-white">
                                 <Truck className="w-12 h-12" />
                             </div>
                             <div>
                                 <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">FEDEX EXPRESS</h2>
                                 <span className="text-[13px] font-bold uppercase tracking-[0.4em] text-slate-500 mt-1">Overnight Clinical Priority</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-none">P1 - S1</h3>
                             <span className="text-[13px] font-bold uppercase tracking-[0.4em] text-slate-500">Facility Code: 002</span>
                         </div>
                    </div>

                    {/* ADDRESS GRID */}
                    <div className="grid grid-cols-2 gap-20 w-full mb-16">
                         <div className="space-y-6">
                             <div className="flex items-center gap-3">
                                 <div className="px-3 py-1 bg-slate-100 text-[11px] font-bold text-slate-900 rounded-md uppercase">FROM</div>
                                 <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Specimen Source</span>
                             </div>
                             <div className="space-y-1.5 pl-1">
                                 <p className="text-xl font-bold uppercase tracking-tight text-slate-950">MUSB RESEARCHER</p>
                                 <p className="text-[15px] font-bold uppercase text-slate-600">123 Research Lane, Unit 4B</p>
                                 <p className="text-[15px] font-bold uppercase text-slate-600">Boston, MA 02108</p>
                                 <div className="mt-4 pt-4 border-t border-slate-100">
                                     <p className="text-[12px] font-bold uppercase text-slate-950">PROTOCOL ID: MUSB-4920-KIP</p>
                                 </div>
                             </div>
                         </div>

                         <div className="space-y-6">
                             <div className="flex items-center gap-3">
                                 <div className="px-3 py-1 bg-slate-100 text-[11px] font-bold text-slate-900 rounded-md uppercase">SHIP TO</div>
                                 <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Central Processing Lab</span>
                             </div>
                             <div className="space-y-1.5 pl-1">
                                 <p className="text-2xl font-black uppercase tracking-tighter text-slate-950">CENTRAL BIO-SYNC LAB</p>
                                 <p className="text-[17px] font-bold uppercase text-slate-700">Research Tower A-44</p>
                                 <p className="text-[17px] font-bold uppercase text-slate-700">900 Innovation Way</p>
                                 <p className="text-[17px] font-black uppercase text-slate-950">CAMBRIDGE, MA 02139</p>
                             </div>
                         </div>
                    </div>

                    {/* BARCODE SECTION */}
                    <div className="w-full flex flex-col items-center justify-center py-12 border-t-4 border-b-4 border-slate-900 space-y-8 mb-16">
                         {/* FAKE BARCODE BLOCKS */}
                         <div className="flex gap-1.5 h-32 w-full justify-center">
                            {[2,4,1,3,2,6,1,8,4,2,3,1,5,2,4,1,8,2,1,4,2,6,1,3,2,4,8,1,2,6,1,3,2,4,2,1,8,4,2,3,1].map((w, i) => (
                                <div key={i} className="h-full bg-slate-900" style={{ width: `${w * 2.5}px` }} />
                            ))}
                         </div>
                         <div className="flex flex-col items-center gap-2">
                            <p className="text-3xl font-black tracking-[0.4em] text-slate-900 uppercase font-mono">MUSB 7729 4820 1934 0001</p>
                            <p className="text-[12px] font-bold tracking-[0.3em] uppercase text-slate-400">Encrypted Transition Key • CRC-Validated</p>
                         </div>
                    </div>

                    {/* QR CODE & FINAL SCAN */}
                    <div className="w-full flex justify-between items-end">
                         <div className="flex gap-8">
                             <div className="w-40 h-40 bg-white border-[12px] border-slate-900 flex items-center justify-center p-3">
                                 <QrCode className="w-full h-full text-slate-900" strokeWidth={3} />
                             </div>
                             <div className="flex flex-col justify-end space-y-3 pb-2">
                                 <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-3xl font-black italic">R</div>
                                 <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-slate-900">Scan for Sync</span>
                             </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-5">
                              <div className="bg-slate-100 text-slate-900 border-2 border-slate-900 font-bold text-[13px] py-2 px-6 rounded-lg uppercase italic">
                                  Package Contains Biomarkers
                              </div>
                              <div className="flex items-center gap-3 text-slate-400">
                                  <Info className="w-5 h-5 text-slate-300" />
                                  <span className="text-[12px] font-bold uppercase tracking-widest leading-none">Handle with Clinical Care Directive</span>
                              </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* INSTRUCTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
                <Card className="p-8 bg-white border-[#E3ECF5] shadow-lg space-y-4">
                    <div className="w-12 h-12 bg-[#F0F6FF] rounded-2xl flex items-center justify-center text-[#1E88E5] border border-[#E3F2FD]">
                         <Package className="w-6 h-6" />
                    </div>
                    <h5 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight">Double-Containment</h5>
                    <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed opacity-80">Ensure specimens are sealed in secondary bio-bags before kit closure.</p>
                </Card>
                <Card className="p-8 bg-white border-[#E3ECF5] shadow-lg space-y-4">
                    <div className="w-12 h-12 bg-[#F0F6FF] rounded-2xl flex items-center justify-center text-[#1E88E5] border border-[#E3F2FD]">
                         <MapPin className="w-6 h-6" />
                    </div>
                    <h5 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight">Designated Hubs</h5>
                    <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed opacity-80">Transfer assets only at authorized clinical logistics drop-off points.</p>
                </Card>
                <Card className="p-8 bg-white border-[#E3ECF5] shadow-lg space-y-4">
                    <div className="w-12 h-12 bg-[#F0F6FF] rounded-2xl flex items-center justify-center text-[#1E88E5] border border-[#E3F2FD]">
                         <Activity className="w-6 h-6" />
                    </div>
                    <h5 className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight">Real-Time Transit</h5>
                    <p className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed opacity-80">Dashboard state will synchronize within 15 minutes of logistics scan.</p>
                </Card>
            </div>
        </div>
    );
};

export default ReturnLabelView;
