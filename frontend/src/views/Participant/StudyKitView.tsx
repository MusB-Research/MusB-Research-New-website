import React, { useState, useEffect, useMemo } from 'react';
import { authFetch, API } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Truck, CheckCircle2, AlertCircle, Download,
    ExternalLink, Play, FileText, ChevronRight,
    Clock, Calendar, Camera, Info, X, Zap, Ship, FileText as FileIcon
} from 'lucide-react';
import { Card, Badge, StepIndicator, Checklist, ProgressBar, Skeleton } from './SharedComponents';
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
    const [internalLoading, setInternalLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const dummyKits: any[] = [];

    useEffect(() => {
        if (initialKits && initialKits.length > 0) {
            setKits(initialKits);
            setInternalLoading(false);
        } else if (!isLoading) {
            // Only fetch if parent isn't already loading its summary
            fetchKits();
        }
    }, [initialKits, isLoading]);

    const fetchKits = async () => {
        setInternalLoading(true);
        try {
            const apiUrl = API || 'http://localhost:8003';
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
            setInternalLoading(false);
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
            const apiUrl = API || 'http://localhost:8003';
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

    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        if (s.includes('RECEIVED')) return <Badge color="green">{status.replace(/_/g, ' ')}</Badge>;
        if (s.includes('SHIPPED')) return <Badge color="blue">{status.replace(/_/g, ' ')}</Badge>;
        if (s === 'DAMAGED' || s === 'MISSING') return <Badge color="red">{status.replace(/_/g, ' ')}</Badge>;
        return <Badge color="blue">{status.replace(/_/g, ' ')}</Badge>;
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

    if (subView === 'GUIDE') return (
        <div className="p-20 text-center bg-white rounded-[40px] border border-[#E3ECF5] shadow-sm">
            <FileIcon className="w-16 h-16 text-[#E3ECF5] mx-auto mb-6" />
            <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Supply Collection Manual</h3>
            <p className="text-[#8A99B3] font-bold uppercase tracking-widest text-[12px] mt-4 max-w-sm mx-auto leading-relaxed">The clinical collection manual is currently being synchronized with the latest protocol amendment. Please contact your coordinator for immediate guidance.</p>
            <button onClick={() => setSubView('LIST')} className="mt-10 px-10 py-3.5 bg-[#1E88E5] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/10">Back to Component List</button>
        </div>
    );
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

    if (isLoading || internalLoading) {
        return (
            <div className="space-y-12">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2].map(i => <Skeleton key={i} className="h-96 rounded-[32px]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                     <div className="flex items-center gap-2 text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest mb-3">
                        <span>Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#1E88E5]">Asset Logistics</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Kits & Clinical Supply</h2>
                    <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest mt-1">Managed distribution and collection of research material</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-[#E3ECF5] shadow-sm">
                    <button
                        onClick={() => setActiveTab('outbound')}
                        className={`px-8 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all ${activeTab === 'outbound' ? 'bg-[#1E88E5] text-white shadow-md' : 'text-[#8A99B3] hover:text-[#5F6F89]'}`}
                    >
                        Active Shipments
                    </button>
                    <button
                        onClick={() => setActiveTab('return')}
                        className={`px-8 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all ${activeTab === 'return' ? 'bg-[#1E88E5] text-white shadow-md' : 'text-[#8A99B3] hover:text-[#5F6F89]'}`}
                    >
                        Return History
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {filteredKits.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-white border border-[#E3ECF5] rounded-[40px] shadow-sm flex flex-col items-center">
                        <Package className="w-16 h-16 text-[#E3ECF5] mb-6" />
                        <p className="text-[#8A99B3] font-bold uppercase tracking-widest text-[12px]">No kits identified in this stage of the protocol</p>
                    </div>
                ) : filteredKits.map((kit, idx) => (
                    <motion.div key={kit.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                        <Card className="group overflow-hidden relative bg-white border border-[#E3ECF5] shadow-lg">
                            <div className="p-8 space-y-8">
                                {/* Header Row */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-[#F8FBFF] rounded-[24px] flex items-center justify-center border border-[#E3ECF5] text-[#1E88E5] transition-all group-hover:bg-[#E3F2FD]">
                                            <Package className="w-8 h-8" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h4 className="text-[20px] font-bold text-[#1A2B49] uppercase tracking-tight">{kit.kit_type}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">SEQ:</span>
                                                <span className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-tight font-mono">{kit.kit_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(kit.status)}
                                </div>

                                {/* Tracking Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#F8FBFF] border border-[#E3ECF5] rounded-3xl relative overflow-hidden shadow-inner-sm">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                        <Truck className="w-24 h-24 -rotate-12" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest">Logistics Unit</span>
                                        <p className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight">{kit.carrier || 'Pending'}</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <span className="text-[10px] font-bold text-[#8A99B3] uppercase tracking-widest">Asset Tracking ID</span>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[15px] font-bold text-[#1E88E5] font-mono tracking-tighter">
                                                {kit.tracking_number || "AWAITING SYNC"}
                                            </p>
                                            {kit.tracking_number && (
                                                <button
                                                    onClick={() => window.open('https://www.fedex.com', '_blank')}
                                                    className="p-1 px-3 bg-white text-[10px] font-bold text-[#1E88E5] border border-[#E3ECF5] rounded-lg hover:bg-blue-50 transition-all uppercase"
                                                >
                                                    Track
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-[#8A99B3]">Chain of Custody</span>
                                        <span className="text-[#1A2B49]">Stage {getStatusStep(kit.status)}/5</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${s <= getStatusStep(kit.status) ? 'bg-[#1E88E5]' : 'bg-[#E3ECF5]'}`} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-[#5F6F89]">
                                        <Clock className="w-4 h-4 text-[#8A99B3]" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest">
                                            {kit.expected_delivery ? `Est. Completion: ${new Date(kit.expected_delivery).toLocaleDateString()}` : "ETA: ESTIMATING FLOW"}
                                        </span>
                                    </div>
                                </div>

                                {/* Materials */}
                                <div className="space-y-4 pt-4 border-t border-[#F8FBFF]">
                                    <h5 className="text-[11px] font-bold text-[#8A99B3] uppercase tracking-widest">Clinical Protocol Documentation</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                downloadDummyPdf('Clinical Collection Guide');
                                                setSubView('GUIDE');
                                            }}
                                            className="flex items-center gap-4 p-5 bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl hover:bg-white transition-all text-left shadow-sm group/btn"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E3ECF5] flex items-center justify-center text-[#B0BCCF] group-hover/btn:text-[#1E88E5] shadow-sm transition-all">
                                                <FileIcon className="w-5.5 h-5.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight">Collection Protocol</span>
                                                <span className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest mt-0.5">VIEW GUIDE</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                downloadDummyPdf('Digital Return Label');
                                                setSubView('LABEL');
                                            }}
                                            className="flex items-center gap-4 p-5 bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl hover:bg-white transition-all text-left shadow-sm group/btn"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E3ECF5] flex items-center justify-center text-[#B0BCCF] group-hover/btn:text-[#1E88E5] shadow-sm transition-all">
                                                <Download className="w-5.5 h-5.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-tight">Return Logistics</span>
                                                <span className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest mt-0.5">TRANSIT LABEL</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-[#F8FBFF]">
                                    {kit.status === 'PREPARING' || kit.status === 'ASSIGNED' ? (
                                        <button className="flex-1 bg-[#F8FBFF] text-[#B0BCCF] py-5 rounded-2xl border border-[#E3ECF5] font-bold text-[12px] uppercase tracking-widest cursor-not-allowed">
                                            Awaiting Distribution
                                        </button>
                                    ) : (window.location.protocol === 'kit.status' ? '' : (
                                        <div className="flex-1 flex flex-col md:flex-row gap-3">
                                            {(kit.status === 'SHIPPED' || kit.status === 'SHIPPED FROM CENTER') && (
                                                <button
                                                    onClick={() => handleKitAction(kit.id, 'confirm_receipt')}
                                                    className="flex-1 bg-[#1E88E5] hover:bg-[#1565C0] text-white py-5 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Confirm Delivery
                                                </button>
                                            )}
                                            {(kit.status === 'DELIVERED' || kit.status === 'RECEIVED BY PARTICIPANT' || kit.status === 'IN COLLECTION') && (
                                               <button
                                                    onClick={() => {
                                                        setSelectedKit(kit);
                                                        setIsCollectionModalOpen(true);
                                                    }}
                                                    className={`flex-1 ${kit.status === 'IN COLLECTION' ? 'bg-[#4CAF50] hover:bg-[#388E3C]' : 'bg-[#1E88E5] hover:bg-[#1565C0]'} text-white py-5 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2`}
                                                >
                                                    {kit.status === 'IN COLLECTION' ? <Zap className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                    {kit.status === 'IN COLLECTION' ? 'Resume Protocol' : 'Execute Collection'}
                                                </button>
                                            )}
                                            {(kit.status === 'SHIPPED FROM PARTICIPANT') && (
                                                 <button className="flex-1 bg-[#F8FBFF] text-[#1E88E5] py-5 rounded-2xl border border-[#E3ECF5] font-bold text-[12px] uppercase tracking-widest cursor-not-allowed">
                                                    Asset In Transit
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsReportModalOpen(true)}
                                        className="px-8 py-5 bg-white text-[#5F6F89] hover:bg-[#FDECEA] hover:text-[#D32F2F] hover:border-[#D32F2F]/20 rounded-2xl border border-[#E3ECF5] font-bold text-[12px] uppercase tracking-widest transition-all"
                                    >
                                        Log Issue
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Modal: Report Issue */}
            <AnimatePresence>
                {isReportModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1A2B49]/40 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="relative w-full max-w-lg bg-white rounded-[32px] p-10 shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-4 mb-10">
                                <div className="w-14 h-14 bg-[#FDECEA] rounded-2xl flex items-center justify-center text-[#D32F2F] border border-[#FFCDD2]">
                                    <AlertCircle className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Report Logistics Anomaly</h3>
                                <p className="text-[12px] text-[#8A99B3] font-bold uppercase tracking-widest">Immediate clinical coordination required</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest px-1">Detailed Description of Incident</label>
                                    <textarea 
                                        className="w-full h-32 bg-[#F8FBFF] border border-[#E3ECF5] rounded-2xl p-6 text-[#1A2B49] font-bold outline-none focus:border-[#D32F2F]/30 resize-none transition-all"
                                        placeholder="Identify damaged components, missing protocol items, or carrier issues..."
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsReportModalOpen(false)}
                                        className="flex-1 py-4.5 bg-[#F8FBFF] text-[#8A99B3] hover:text-[#5F6F89] rounded-xl font-bold uppercase tracking-widest text-[12px] transition-all"
                                    >Cancel</button>
                                    <button 
                                        onClick={() => {
                                            handleKitAction(kits[0]?.id || '', 'report_issue', { reason: 'Reported via Modal' });
                                            setIsReportModalOpen(false);
                                        }}
                                        className="flex-1 py-4.5 bg-[#D32F2F] text-white rounded-xl font-bold uppercase tracking-widest text-[12px] transition-all shadow-lg shadow-red-500/20"
                                    >Submit Report</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Collection Flow */}
            <AnimatePresence>
                {isCollectionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1A2B49]/60 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 30 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 30 }} 
                            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scroll border border-[#E3ECF5]"
                        >
                            <div className="absolute top-8 right-8 z-[210]">
                                <button onClick={() => setIsCollectionModalOpen(false)} className="w-10 h-10 bg-[#F8FBFF] border border-[#E3ECF5] rounded-full flex items-center justify-center text-[#8A99B3] hover:text-[#1A2B49] transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-12">
                                <div className="space-y-2 mb-10">
                                    <h3 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Active Clinical Collection</h3>
                                    <div className="flex items-center gap-2">
                                         <Badge color="blue">PROTOCOL ID: BIO-202X</Badge>
                                         <span className="text-[11px] font-bold text-[#B0BCCF] uppercase tracking-widest">Encrypted Session</span>
                                    </div>
                                </div>

                                <StepIndicator steps={collectionSteps} currentStep={collectionStep} />

                                <div className="min-h-[350px] py-10">
                                    {collectionStep === 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <div className="space-y-8">
                                                <div className="p-6 bg-[#F0F6FF] border border-[#E3F2FD] rounded-3xl space-y-3">
                                                    <div className="flex items-center gap-3 text-[#1E88E5]">
                                                        <Info className="w-5 h-5" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest">Safety Compliance</span>
                                                    </div>
                                                    <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed">System state verification: Hand sanitization and workspace preparation mandatory.</p>
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
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 text-center py-6">
                                            <div className="w-24 h-24 bg-[#F0F6FF] rounded-[32px] flex items-center justify-center mx-auto border border-[#E3F2FD] text-[#1E88E5] shadow-sm">
                                                <Play className="w-10 h-10 fill-current ml-1" />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-xl font-bold text-[#1A2B49] uppercase tracking-tight">Audio-Visual Protocol</h4>
                                                <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed max-w-sm mx-auto">Follow the clinical directive. Timestamps are logged on execution.</p>
                                            </div>
                                            <button className="flex items-center gap-3 mx-auto px-10 py-5 bg-[#1E88E5] text-white rounded-2xl transition-all font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-blue-500/10 hover:bg-[#1565C0]">
                                                Launch Protocol Video
                                            </button>
                                        </motion.div>
                                    )}

                                    {collectionStep === 2 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                            <div className="p-6 bg-[#F0F6FF] border border-[#E3F2FD] rounded-3xl space-y-3">
                                                <div className="flex items-center gap-3 text-[#1E88E5]">
                                                    <Package className="w-5 h-5" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest">Containment Directive</span>
                                                </div>
                                                <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed">Seal all specimens in secondary containment biohazard assets.</p>
                                            </div>
                                            <Checklist
                                                items={stepItems[2]}
                                                checkedItems={checkedItems}
                                                onToggle={toggleCheckItem}
                                            />
                                        </motion.div>
                                    )}

                                    {collectionStep === 3 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                            <div className="p-6 bg-[#E8F5E9] border border-[#C8E6C9] rounded-3xl space-y-3">
                                                <div className="flex items-center gap-3 text-[#2E7D32]">
                                                    <Ship className="w-5 h-5" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest">Return Logistics</span>
                                                </div>
                                                <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest leading-relaxed">Affix encrypted return label and transfer to logistics provider.</p>
                                            </div>
                                            <Checklist
                                                items={stepItems[3]}
                                                checkedItems={checkedItems}
                                                onToggle={toggleCheckItem}
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-10 border-t border-[#F8FBFF]">
                                    <button
                                        disabled={collectionStep === 0}
                                        onClick={() => setCollectionStep(s => Math.max(0, s - 1))}
                                        className="flex-1 py-5 bg-[#F8FBFF] text-[#8A99B3] rounded-2xl font-bold uppercase tracking-widest text-[12px] hover:text-[#1A2B49] transition-all disabled:opacity-30 border border-[#E3ECF5]"
                                    >
                                        Go Back
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
                                        className={`flex-1 py-5 rounded-2xl font-bold uppercase tracking-widest text-[12px] transition-all shadow-lg ${!isStepValid ? 'bg-[#E3ECF5] text-[#B0BCCF] cursor-not-allowed' : 'bg-[#1E88E5] text-white hover:bg-[#1565C0]'}`}
                                    >
                                        {collectionStep === collectionSteps.length - 1 ? 'Submit Submission' : 'Next Step'}
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
