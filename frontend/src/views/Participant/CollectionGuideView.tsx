import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Download, Printer, Truck, Info, Package, Ship, QrCode } from 'lucide-react';
import { Card, Badge } from './SharedComponents';

const ReturnLabelView = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="flex flex-col gap-10 max-w-[1000px] mx-auto pb-12">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest hover:text-[#1E88E5] transition-all px-4 py-2 bg-white rounded-xl border border-[#E3ECF5]">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="p-3.5 bg-white rounded-xl border border-[#E3ECF5] text-[#8A99B3] hover:text-[#1E88E5]"><Printer className="w-5 h-5" /></button>
                    <button className="flex items-center gap-3 px-8 py-3.5 bg-[#1E88E5] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-[#1565C0] transition-all shadow-lg shadow-blue-500/10">
                        <Download className="w-4.5 h-4.5" /> Download PDF
                    </button>
                </div>
            </div>

            <Card className="p-12 bg-white border-[#E3ECF5] shadow-2xl rounded-[40px]">
                <div className="w-full flex justify-between items-end pb-10 border-b-8 border-slate-900 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white"><Truck className="w-12 h-12" /></div>
                        <div><h2 className="text-4xl font-black italic tracking-tighter uppercase">FEDEX EXPRESS</h2><span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Clinical Priority</span></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-20 mb-16">
                    <div className="space-y-4">
                        <Badge color="blue">FROM</Badge>
                        <p className="font-bold uppercase text-slate-900">MUSB RESEARCHER</p>
                        <p className="text-slate-600 uppercase">123 Research Lane, Boston, MA</p>
                    </div>
                    <div className="space-y-4">
                        <Badge color="blue">SHIP TO</Badge>
                        <p className="font-bold uppercase text-slate-900">CENTRAL BIO-SYNC LAB</p>
                        <p className="text-slate-600 uppercase">900 Innovation Way, Cambridge, MA</p>
                    </div>
                </div>
                <div className="w-full h-32 bg-slate-900 flex gap-1 justify-center py-6 mb-10">
                    {[2,4,1,3,2,6,1,8,4,2,3,1,5,2,4,1,8,2,1].map((w, i) => <div key={i} className="h-full bg-white/20" style={{ width: `${w * 4}px` }} />)}
                </div>
                <div className="flex justify-between items-center">
                    <QrCode className="w-24 h-24 text-slate-900" />
                    <Badge color="blue">PACKAGE CONTAINS BIOMARKERS</Badge>
                </div>
            </Card>
        </div>
    );
};
export default ReturnLabelView;
