import React, { useState, useEffect, useMemo } from 'react';
import { authFetch, API } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Truck, CheckCircle2, AlertCircle, Download,
    ExternalLink, Play, FileText, ChevronRight,
    Clock, Calendar, Camera, Info, X, Zap, Ship, FileText as FileIcon
} from 'lucide-react';
import { Card, Badge, StepIndicator, Checklist, ProgressBar } from './SharedComponents';
import CollectionGuideView from './CollectionGuideView';
import ReturnLabelView from './ReturnLabelView';


interface Kit {
    id: string;
    kit_type: string;
    status: string;
    carrier: string;
    tracking_number: string;
    expected_delivery: string;
    kit_number: string;
}

const StudyKitView = ({ onAction, study, kits: initialKits = [], isLoading = false }: { onAction: (t: string, data?: any) => void; study?: any; kits?: any[]; isLoading?: boolean }) => {
    const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound');
    const [subView, setSubView] = useState<'LIST' | 'GUIDE' | 'LABEL'>('LIST');
    const [selectedKit, setSelectedKit] = useState<any>(null);
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [collectionStep, setCollectionStep] = useState(0);
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    const stepItems: Record<number, string[]> = {
        0: ["Sanitize hands and workspace", "Verify Kit Number matches app", "Read full collection instructions", "Confirm fasting (if applicable)"],
        2: ["Place sample in biohazard bag", "Ensure seal is airtight", "Place bag inside the insulated box", "Apply tamper-evident security seal"],
        3: ["Attach return shipping label to box", "Ensure all old labels are covered", "Locate nearest drop-off point", "Confirm package handed to carrier"]
    };

    const isStepValid = useMemo(() => {
        if (collectionStep === 1) return true; // Video step is always valid for now
        const required = stepItems[collectionStep] || [];
        return required.every(item => checkedItems.includes(item));
    }, [collectionStep, checkedItems]);

    const downloadDummyPdf = (title: string) => {
        const dummyPdfContent = `%PDF-1.4\n1 0 obj\n<< /Title (${title}) /Creator (MusB Research) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (${title}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000078 00000 n\n0000000127 00000 n\n0000000188 00000 n\n0000000302 00000 n\ntrailer\n<< /Size 6 /Root 2 0 R >>\nstartxref\n397\n%%EOF`;
        const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '_')}_MusB_Research.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
 
    const [kits, setKits] = useState<any[]>(initialKits);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const dummyKits: any[] = [];

    useEffect(() => {
        if (initialKits && initialKits.length > 0) {
            setKits(initialKits);
            setLoading(false);
        } else {
            fetchKits();
        }
    }, [initialKits]);

    const fetchKits = async () => {
        setLoading(true);
        try {
            const apiUrl = API || 'http://localhost:8000';
            const resp = await authFetch(`${apiUrl}/api/kits/`);
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.length > 0) {
                    setKits(data);
                } else {
                    setKits(dummyKits);
                }
            } else {
                setKits(dummyKits);
            }
        } catch (e) {
            console.error("Failed to load kit data:", e);
            setKits(dummyKits);
        } finally {
            setLoading(false);
        }
    };

    const handleKitAction = async (kitId: string, actionName: string, extraData = {}) => {
        if (kitId.startsWith('DEMO-')) {
            setKits(prev => prev.map(k => {
                if (k.id === kitId) {
                    let nextStatus = k.status;
                    if (actionName === 'initialize_collection') nextStatus = 'IN COLLECTION';
                    if (actionName === 'confirm_receipt') nextStatus = 'RECEIVED BY PARTICIPANT';
                    if (actionName === 'complete_collection') nextStatus = 'SHIPPED FROM PARTICIPANT';
                    if (actionName === 'ship_return') nextStatus = 'SHIPPED FROM PARTICIPANT';
                    if (actionName === 'report_issue') nextStatus = 'DAMAGED';
                    return { ...k, status: nextStatus };
                }
                return k;
            }));

            if (actionName === 'initialize_collection') {
                setIsCollectionModalOpen(true);
            }
            if (actionName === 'report_issue') {
                alert("⚠️ SAFETY NOTICE: Problem reported to your clinical team. A coordinator will contact you shortly to resolve this issue.");
            }
            return;
        }

        try {
            const apiUrl = API || 'http://localhost:8000';
            const resp = await authFetch(`${apiUrl}/api/kits/${kitId}/${actionName}/`, {
                method: 'POST',
                body: JSON.stringify(extraData)
            });
            if (resp.ok) {
                await fetchKits();
                if (actionName === 'initialize_collection') {
                    setIsCollectionModalOpen(true);
                }
                if (actionName === 'report_issue') {
                    alert("⚠️ SAFETY NOTICE: Problem reported to your clinical team. A coordinator will contact you shortly to resolve this issue.");
                } else {
                    alert("Protocol synchronization successful. Device state updated.");
                }
            }
        } catch (e) {
            console.error("Action synchronization failed:", e);
        }
    };

    const collectionSteps = [
        "Preparation",
        "Sample Collection",
        "Packaging",
        "Shipping"
    ];

    const getStatusColor = (status: string) => {
        const s = status.toUpperCase();
        if (s.includes('RECEIVED')) return 'green';
        if (s.includes('SHIPPED')) return 'indigo';
        if (s === 'IN PREPARATION' || s === 'PREPARING') return 'amber';
        if (s === 'DAMAGED' || s === 'MISSING') return 'red';
        return 'cyan';
    };

    const getStatusStep = (status: string) => {
        const s = status.toUpperCase();
        if (s === 'SHIPPED FROM CENTER') return 2;
        if (s === 'RECEIVED BY PARTICIPANT' || s === 'IN COLLECTION') return 3;
        if (s === 'SHIPPED FROM PARTICIPANT') return 4;
        if (s === 'RECEIVED BY CENTER') return 5;
        return 1;
    };

    const toggleCheckItem = (item: string) => {
        setCheckedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    if (subView === 'GUIDE') return <CollectionGuideView onBack={() => setSubView('LIST')} />;
    if (subView === 'LABEL') return <ReturnLabelView onBack={() => setSubView('LIST')} />;

    const filteredKits = useMemo(() => {
        return kits.filter(kit => {
            const s = kit.status.toUpperCase();
            if (activeTab === 'outbound') {
                return ['SHIPPED FROM CENTER', 'RECEIVED BY PARTICIPANT', 'IN PREPARATION', 'IN COLLECTION'].includes(s);
            } else {
                return ['SHIPPED FROM PARTICIPANT', 'RECEIVED BY CENTER'].includes(s);
            }
        });
    }, [kits, activeTab]);

    return (
        <div className="space-y-12 pb-20">
            {/* ──────────────── HEADER ──────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
                <div />
            </div>

            {/* ──────────────── TABS ──────────────── */}
            <div className="flex p-2 bg-white/5 rounded-3xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('outbound')}
                    className={`px-10 py-5 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'outbound' ? 'bg-cyan-500 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >
                    Outbound Shipments
                </button>
                <button
                    onClick={() => setActiveTab('return')}
                    className={`px-10 py-5 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'return' ? 'bg-cyan-500 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >
                    Return Shipments
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {isLoading ? (
                    [1, 2, 3, 4].map(sh => (
                        <div key={sh} className="bg-[#0a1525] border border-white/[0.03] rounded-[3rem] p-8 h-80 relative overflow-hidden animate-pulse">
                            <div className="shimmer-effect" />
                            <div className="space-y-8">
                                <div className="flex justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl" />
                                        <div className="space-y-2">
                                            <div className="h-6 w-48 bg-white/5 rounded-lg" />
                                            <div className="h-3 w-32 bg-white/5 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="h-8 w-24 bg-white/5 rounded-full" />
                                </div>
                                <div className="h-24 w-full bg-white/5 rounded-3xl" />
                                <div className="flex gap-4">
                                    <div className="h-14 flex-1 bg-white/5 rounded-xl" />
                                    <div className="h-14 w-32 bg-white/5 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredKits.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/[0.02] border border-white/5 rounded-[3rem]">
                        <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" strokeWidth={1} />
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[14px] font-bold italic">No kits currently in {activeTab === 'outbound' ? 'outbound' : 'return'} stage.</p>
                    </div>
                ) : filteredKits.map((kit, idx) => (

                    <motion.div key={kit.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                        <Card className="group overflow-hidden border-l-4 border-l-cyan-500">
                            <div className="p-8 space-y-8">
                                {/* Top Row */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                                            <Package className={`w-8 h-8 ${activeTab === 'outbound' ? 'text-cyan-400' : 'text-indigo-400'}`} strokeWidth={1} />
                                        </div>
                                        <div>
                                            <h4 className="text-[20px] font-black text-white italic uppercase tracking-tight">{kit.kit_type}</h4>
                                            <span className="text-[14px] font-black text-slate-600 uppercase tracking-widest mt-1 block">KIT IDENTIFIER: {kit.kit_number}</span>
                                        </div>
                                    </div>
                                    <Badge color={getStatusColor(kit.status)} className="text-[13px] py-1.5 px-4 font-black">{kit.status.replace(/_/g, ' ')}</Badge>
                                </div>

                                {/* Tracking Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Truck className="w-20 h-20 -rotate-12" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[13px] font-black text-slate-600 uppercase tracking-[0.2em]">CARRIER</span>
                                        <p className="text-base font-black text-white italic uppercase tracking-tight">{kit.carrier}</p>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <span className="text-[13px] font-black text-slate-600 uppercase tracking-[0.2em]">TRACKING NUMBER</span>
                                        <div className="flex items-center gap-4">
                                            <p 
                                                onClick={() => {
                                                    const carrier = (kit.carrier || '').toUpperCase();
                                                    let url = 'https://www.fedex.com/en-us/tracking.html';
                                                    if (carrier.includes('UPS')) url = 'https://www.ups.com/track';
                                                    if (carrier.includes('DHL')) url = 'https://www.dhl.com/en/express/tracking.html';
                                                    if (carrier.includes('USPS')) url = 'https://tools.usps.com/go/TrackConfirmAction_input';
                                                    window.open(url, '_blank');
                                                }}
                                                className="text-base font-black text-cyan-400 font-mono tracking-tighter cursor-pointer hover:underline underline-offset-4"
                                            >
                                                {kit.tracking_number || "NO ID"}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    const carrier = (kit.carrier || '').toUpperCase();
                                                    let url = 'https://www.fedex.com/en-us/tracking.html';
                                                    if (carrier.includes('UPS')) url = 'https://www.ups.com/track';
                                                    if (carrier.includes('DHL')) url = 'https://www.dhl.com/en/express/tracking.html';
                                                    if (carrier.includes('USPS')) url = 'https://tools.usps.com/go/TrackConfirmAction_input';
                                                    window.open(url, '_blank');
                                                }}
                                                className="text-[13px] font-black text-white bg-white/10 px-4 py-1.5 rounded-full border border-white/10 hover:bg-cyan-500 hover:text-slate-950 transition-all font-bold italic"
                                            >
                                                TRACK SHIPMENT →
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Steps */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[13px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Status History</span>
                                        <span className="text-white italic">Current: {kit.status.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <div key={s} className={`h-2 flex-1 rounded-full ${s <= getStatusStep(kit.status) ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white/5'}`} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock className="w-5 h-5" />
                                        <span className="text-[13px] font-black uppercase tracking-widest italic">
                                            {kit.expected_delivery ? `Exp. Arrival: ${new Date(kit.expected_delivery).toLocaleDateString()}` : "ETA: PENDING DISPATCH"}
                                        </span>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                                    <h5 className="text-[14px] font-black text-slate-500 uppercase tracking-widest">Protocol Materials</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                downloadDummyPdf('Clinical Collection Guide');
                                                setSubView('GUIDE');
                                            }}
                                            className={`flex items-center gap-3 p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all text-left shadow-lg hover:shadow-cyan-500/5 group/btn`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover/btn:bg-cyan-500 group-hover/btn:text-slate-950 transition-all">
                                                <FileIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-black text-white italic uppercase tracking-tighter">Collection Guide</span>
                                                <span className="text-[12px] font-black text-slate-600 uppercase">DOWNLOAD PDF</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                downloadDummyPdf('Digital Return Label');
                                                setSubView('LABEL');
                                            }}
                                            className="flex items-center gap-3 p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-all text-left shadow-lg hover:shadow-indigo-500/5 group/btn"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/btn:bg-indigo-500 group-hover/btn:text-white transition-all">
                                                <Download className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-black text-white italic uppercase tracking-tighter">Return Label</span>
                                                <span className="text-[12px] font-black text-slate-600 uppercase">DOWNLOAD PDF</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col md:flex-row gap-3">
                                    {kit.status === 'PREPARING' || kit.status === 'ASSIGNED' ? (
                                        <button className="flex-1 bg-white/5 text-slate-500 py-5 rounded-2xl border border-white/10 font-black text-[13px] uppercase tracking-[0.2em] cursor-not-allowed">
                                            AWAITING DISPATCH
                                        </button>
                                    ) : kit.status === 'SHIPPED' || kit.status === 'SHIPPED FROM CENTER' ? (
                                        <div className="flex-1 flex flex-col gap-2">
                                            <button 
                                                onClick={() => window.open(kit.tracking_url || 'https://www.fedex.com', '_blank')}
                                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                                            >
                                                <Truck className="w-4 h-4" />
                                                Track Shipment
                                            </button>
                                            <button
                                                onClick={() => handleKitAction(kit.id, 'confirm_receipt')}
                                                className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-5 rounded-2xl border border-emerald-500/20 font-black text-[14px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Confirm Receipt
                                            </button>
                                        </div>
                                    ) : kit.status === 'DELIVERED' || kit.status === 'RECEIVED BY PARTICIPANT' ? (
                                        <button
                                            onClick={() => {
                                                setSelectedKit(kit);
                                                handleKitAction(kit.id, 'initialize_collection');
                                            }}
                                            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                                        >
                                            <Play className="w-4 h-4 fill-current" />
                                            Start Collection
                                        </button>
                                    ) : kit.status === 'COLLECTING' || kit.status === 'AWAITING' || kit.status === 'IN COLLECTION' ? (
                                        <button
                                            onClick={() => {
                                                setSelectedKit(kit);
                                                setIsCollectionModalOpen(true);
                                            }}
                                            className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white py-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all shadow-[0_0_300px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Resume Collection
                                        </button>
                                    ) : kit.status === 'RETURN_SHIPPED' || kit.status === 'SHIPPED FROM PARTICIPANT' ? (
                                        <button className="flex-1 bg-white/5 text-slate-500 py-5 rounded-2xl border border-white/10 font-black text-[13px] uppercase tracking-[0.2em] cursor-not-allowed">
                                            RETURN IN TRANSIT
                                        </button>
                                    ) : (
                                        <button className="flex-1 bg-white/5 text-slate-500 py-5 rounded-2xl border border-white/10 font-black text-[13px] uppercase tracking-[0.2em] cursor-not-allowed">
                                            {kit.status.replace(/_/g, ' ')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsReportModalOpen(true)}
                                        className="px-8 py-5 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/5 hover:border-white/10 font-black text-[14px] uppercase tracking-widest transition-colors"
                                    >
                                        Report Issue
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* ──────────────── REPORT ISSUE MODAL ──────────────── */}
            <AnimatePresence>
                {isReportModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setIsReportModalOpen(false)} />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 30 }} 
                            className="relative w-full max-w-lg bg-[#0d1424] border border-white/10 rounded-[3rem] p-12 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-3 mb-10">
                                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Report <span className="text-red-500">Logistics Issue</span></h3>
                                <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest">Immediate coordination required</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest px-1">Describe the problem</label>
                                    <textarea 
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-white font-bold outline-none focus:border-red-500/50 resize-none italic"
                                        placeholder="e.g., Box damaged upon arrival, missing swabs, label unreadable..."
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsReportModalOpen(false)}
                                        className="flex-1 py-5 bg-white/5 text-slate-500 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all italic"
                                    >Cancel</button>
                                    <button 
                                        onClick={() => {
                                            handleKitAction(kits[0]?.id || '', 'report_issue', { reason: 'Reported via Modal' });
                                            setIsReportModalOpen(false);
                                        }}
                                        className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/40 italic"
                                    >Submit Report</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ──────────────── COLLECTION MODAL ──────────────── */}
            <AnimatePresence>
                {isCollectionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0e1a]/98 backdrop-blur-2xl" />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 30 }} 
                            className="relative w-full max-w-2xl bg-[#0d1424] border border-white/10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[85vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scroll"
                        >
                            <div className="absolute top-0 right-0 p-8 z-[210]">
                                <button onClick={() => setIsCollectionModalOpen(false)} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-12">

                                <div className="space-y-1.5 mb-12">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Sample Collection</h3>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[13px]">STUDY ID: MusB-BIO-2030 | Secure Assessment</p>
                                </div>

                                <StepIndicator steps={collectionSteps} currentStep={collectionStep} />

                                <div className="min-h-[300px] py-8">
                                    {collectionStep === 0 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                            <div className="space-y-8">
                                                <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl space-y-4">
                                                    <div className="flex items-center gap-3 text-cyan-400">
                                                        <Info className="w-5 h-5" />
                                                        <span className="text-sm font-black uppercase tracking-widest">Requirements</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-300 leading-relaxed italic">"Ensure all materials are sanitized and at baseline temperature. System clock sync required for accurate timestamp logging."</p>
                                                </div>
                                                <Checklist
                                                    items={stepItems[0]}
                                                    checkedItems={checkedItems}
                                                    onToggle={toggleCheckItem}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                    {collectionStep === 1 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-center">
                                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 text-cyan-400 animate-pulse">
                                                <Zap className="w-10 h-10" />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">Active Collection</h4>
                                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest leading-relaxed">Follow the video instructions carefully. Real-time logging will begin once marked as active.</p>
                                            </div>
                                            <button className="flex items-center gap-3 mx-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[14px]">
                                                <Play className="w-4 h-4 fill-current" />
                                                WATCH PROTOCOL VIDEO
                                            </button>
                                        </motion.div>
                                    )}

                                    {collectionStep === 2 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl space-y-4">
                                                <div className="flex items-center gap-3 text-indigo-400">
                                                    <Package className="w-5 h-5" />
                                                    <span className="text-sm font-black uppercase tracking-widest">Packaging Requirements</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-300 leading-relaxed italic">"Ensure all samples are securely sealed in the provided biohazard bags before placing them in the kit box."</p>
                                            </div>
                                            <Checklist
                                                items={stepItems[2]}
                                                checkedItems={checkedItems}
                                                onToggle={toggleCheckItem}
                                            />
                                        </motion.div>
                                    )}

                                    {collectionStep === 3 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-3xl space-y-4">
                                                <div className="flex items-center gap-3 text-green-400">
                                                    <Ship className="w-5 h-5" />
                                                    <span className="text-sm font-black uppercase tracking-widest">Shipping Instructions</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-300 leading-relaxed italic">"Affix the digital return label to the exterior of the box and drop it off at any authorized carrier location."</p>
                                            </div>
                                            <Checklist
                                                items={stepItems[3]}
                                                checkedItems={checkedItems}
                                                onToggle={toggleCheckItem}
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-12 border-t border-white/[0.05]">
                                    <button
                                        disabled={collectionStep === 0}
                                        onClick={() => setCollectionStep(s => Math.max(0, s - 1))}
                                        className="flex-1 py-6 bg-white/5 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[14px] hover:text-white transition-colors disabled:opacity-30"
                                    >
                                        GO BACK
                                    </button>
                                    <button
                                        disabled={!isStepValid}
                                        onClick={() => {
                                            if (collectionStep === collectionSteps.length - 1) {
                                                setIsCollectionModalOpen(false);
                                                handleKitAction(selectedKit.id, 'complete_collection');
                                            } else {
                                                setCollectionStep(s => s + 1);
                                            }
                                        }}
                                        className={`flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-[14px] transition-all shadow-[0_0_30px_rgba(6,182,212,0.2)] ${!isStepValid ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'}`}
                                    >
                                        {collectionStep === collectionSteps.length - 1 ? 'SUBMIT COLLECTION' : 'NEXT'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudyKitView;


