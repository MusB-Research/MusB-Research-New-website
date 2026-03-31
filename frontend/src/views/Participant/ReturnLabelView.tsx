import React from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, Download, Printer, 
    Truck, CheckCircle2, Info, Package,
    Ship, Droplets, MapPin, QrCode, ArrowRight, Zap
} from 'lucide-react';


import { Card, Badge } from './SharedComponents';

const ReturnLabelView = ({ onBack }: { onBack: () => void }) => {
    const handlePrint = () => {
        console.log("Printing Return Label...");
        window.print();
    };

    return (

        <div className="flex flex-col gap-8 max-w-[1000px] mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center p-1 shadow-lg shadow-indigo-500/20">
                        <img src="/logo.jpg" alt="MusB Research" className="w-full h-full object-contain rounded-full" />
                    </div>
                </div>



                
                <div className="flex gap-3">
                    <button 
                        type="button"
                        onClick={handlePrint}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-indigo-400 transition-all border border-white/5 cursor-pointer relative z-50"
                        title="Print Label"
                    >
                        <Printer className="w-4 h-4 pointer-events-none" />
                    </button>

                    <a 
                         href="/booklets/alcoprotect_booklet.pdf"
                         download="Return_Label_MUSB.pdf"
                         className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </a>


                </div>

            </div>

            {/* SHIPPING LABEL DISPLAY */}
            <Card className="p-1 px-1 bg-white border-white overflow-hidden shadow-[0_0_80px_rgba(255,255,255,0.05)] rounded-2xl">
                <div className="p-12 text-slate-900 flex flex-col items-center">
                    
                    {/* CARRIER HEADER */}
                    <div className="w-full flex items-center justify-between pb-8 border-b-4 border-slate-900 mb-8">
                         <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                 <Truck className="w-10 h-10" />
                             </div>
                             <div>
                                 <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">FEDEX EXPRESS</h2>
                                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Overnight Priority</span>
                             </div>
                         </div>
                         <div className="text-right">
                             <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">P1 - S1</h3>
                             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Secure Node 002</span>
                         </div>
                    </div>

                    {/* ADDRESS GRID */}
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-16 w-full mb-12">
                         <div className="space-y-4">
                             <div className="flex items-center gap-2 text-slate-400">
                                 <Badge color="gray" className="text-[8px] bg-slate-100 text-slate-900 border-none font-bold">FROM</Badge>
                                 <span className="text-[9px] font-black uppercase tracking-widest leading-none">Specimen Source</span>
                             </div>
                             <div className="space-y-1">
                                 <p className="text-lg font-black uppercase leading-tight italic">MUSB NODE RESEARCHER</p>
                                 <p className="text-[14px] font-bold uppercase leading-tight text-slate-800">123 Research Lane, Clinical Plaza</p>
                                 <p className="text-[14px] font-bold uppercase leading-tight text-slate-800">Boston, MA 02108</p>
                                 <p className="text-[14px] font-black uppercase leading-tight text-slate-950 mt-2">ID: MUSB-4920-KIP</p>
                             </div>
                         </div>

                         <div className="space-y-4">
                             <div className="flex items-center gap-2 text-slate-400">
                                 <Badge color="gray" className="text-[8px] bg-slate-100 text-slate-900 border-none font-bold">SHIP TO</Badge>
                                 <span className="text-[9px] font-black uppercase tracking-widest leading-none">Central Processing Lab</span>
                             </div>
                             <div className="space-y-1">
                                 <p className="text-2xl font-black uppercase leading-tight italic">CENTRAL BIO-SYNC LAB</p>
                                 <p className="text-lg font-bold uppercase leading-tight text-slate-800">Research Tower A-44</p>
                                 <p className="text-lg font-bold uppercase leading-tight text-slate-800">900 Innovation Way</p>
                                 <p className="text-lg font-black uppercase leading-tight text-slate-950">CAMBRIDGE, MA 02139</p>
                             </div>
                         </div>
                    </div>

                    {/* BARCODE SECTION */}
                    <div className="w-full flex-1 flex flex-col items-center justify-center py-10 border-t-2 border-b-2 border-slate-900 space-y-6">
                         {/* FAKE BARCODE BLOCKS */}
                         <div className="flex gap-1 h-32 w-full justify-center">
                            {[2,4,1,3,2,6,1,8,4,2,3,1,5,2,4,1,8,2,1,4,2,6,1,3,2,4,8,1,2,6,1,3,2,4,2,1,8,4,2,3,1].map((w, i) => (
                                <div key={i} className="h-full bg-slate-900" style={{ width: `${w * 2}px` }} />
                            ))}
                         </div>
                         <div className="flex flex-col items-center gap-1">
                            <p className="text-2xl font-black tracking-[0.5em] text-slate-900 uppercase">MUSB 7729 4820 1934 0001</p>
                            <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 italic">Tracking ID • Node Site-B Sequence</p>
                         </div>
                    </div>

                    {/* QR CODE & FINAL SCAN */}
                    <div className="w-full flex justify-between items-end pt-12">
                         <div className="flex gap-4">
                             <div className="w-32 h-32 bg-slate-100 border-[8px] border-slate-900 flex items-center justify-center p-2">
                                 <QrCode className="w-full h-full text-slate-900" strokeWidth={3} />
                             </div>
                             <div className="flex flex-col justify-end space-y-2">
                                 <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-black italic">R</div>
                                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">SCAN FOR SYNC</span>
                             </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-3 translate-y-4">
                              <Badge color="gray" className="bg-slate-100 text-slate-900 border-none font-bold text-[8px] py-1 px-3">PACKAGE CONTAINS BIOMARKERS</Badge>
                              <div className="flex items-center gap-2 text-slate-400">
                                  <Info className="w-4 h-4" />
                                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">Clinical Sample Node</span>
                              </div>
                         </div>
                    </div>
                </div>
            </Card>

            {/* INSTRUCTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h5 className="text-[11px] font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-3 h-3 text-cyan-400" /> Secure Seal 
                    </h5>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed italic">Ensure the bio-capsule is double-sealed before inserting into the padded mailer.</p>
                </div>
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h5 className="text-[11px] font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-indigo-400" /> Drop-off Point
                    </h5>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed italic">Drop off at any FedEx Priority hub. Do not use local drop boxes for biological samples.</p>
                </div>
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h5 className="text-[11px] font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <Ship className="w-3 h-3 text-amber-400" /> Tracking Log
                    </h5>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed italic">Once scanned, the dashboard will update to 'SHIPPED_PENDING' within 10 minutes.</p>
                </div>
            </div>
            
            {/* FOOTER INFO */}
            <div className="flex flex-col items-center gap-6 py-12 opacity-30 mt-12 grayscale mb-20 px-1 border-t border-white/5">
                <div className="flex flex-wrap justify-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                    <span>SECURE LOGISTICS V2</span>
                    <span>CENTRAL NODE ROUTING</span>
                    <span>AES-256 SYNCED LABEL</span>
                </div>
            </div>
        </div>
    );
};

export default ReturnLabelView;
