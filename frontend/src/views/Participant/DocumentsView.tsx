import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Download, Search, Filter, ShieldCheck,
    Eye, Lock, PlusCircle,
    ChevronRight, FolderOpen, User, Calendar,
    FileImage, FileStack, LayoutGrid, List, Upload,
    ChevronDown, Printer, X, Info, FileSpreadsheet, History
} from 'lucide-react';
import { Card, Badge, Skeleton } from './SharedComponents';
import { jsPDF } from 'jspdf';

// --- Types ---
interface Document {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    uploadedBy: 'Study Team' | 'Participant';
    date: string;
    status: 'Signed' | 'Pending' | 'Verified' | 'Uploaded' | 'Important';
    size: string;
    type: 'pdf' | 'image' | 'doc' | 'csv';
}

interface DocumentsViewProps {
    study?: any;
    signatures?: any[];
    assignedForms?: any[];
}

const DocumentsView = ({ study, signatures = [], assignedForms = [], isLoading = false }: DocumentsViewProps & { isLoading?: boolean }) => {
    // --- State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null);

    // --- Decryption Effect ---
    useEffect(() => {
        if (selectedDoc) {
            setIsDecrypting(true);
            setDecryptedContent(null);
            const timer = setTimeout(async () => {
                const content = await getDocumentContent(selectedDoc);
                setDecryptedContent(content);
                setIsDecrypting(false);
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [selectedDoc]);

    const getDocumentContent = async (doc: Document) => {
        const pdf = new jsPDF();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(30, 136, 229); // Blue
        pdf.text('MusB RESEARCH PORTAL', 45, 25);
        pdf.setFontSize(14);
        pdf.text('DOCUMENT DETAILS', 15, 65);
        pdf.setFontSize(10);
        pdf.text("Name: " + doc.name, 15, 80);
        pdf.text("Classification: " + doc.category, 15, 90);
        pdf.text("Source: " + doc.uploadedBy, 15, 100);
        return pdf.output('datauristring');
    };

    // --- Mock Data ---
    const documents: Document[] = [
        { id: '1', name: 'Signed Consent Form – Version 2.1', category: 'Signed Consent', uploadedBy: 'Study Team', date: '03/01/2026', status: 'Signed', size: '1.2 MB', type: 'pdf' },
        { id: '2', name: 'Study Participation Instructions', category: 'Instructions', uploadedBy: 'Study Team', date: '03/01/2026', status: 'Important', size: '0.8 MB', type: 'pdf' },
        { id: '3', name: 'Data Privacy Policy 2026', category: 'Privacy Policy', uploadedBy: 'Study Team', date: '03/01/2026', status: 'Verified', size: '0.5 MB', type: 'pdf' },
        { id: '4', name: 'Travel Reimbursement - March', category: 'Receipts', uploadedBy: 'Participant', date: '03/15/2026', status: 'Uploaded', size: '2.1 MB', type: 'image' },
        { id: '5', name: 'Lab Report - Blood Panel', category: 'Lab Reports', uploadedBy: 'Study Team', date: '03/20/2026', status: 'Verified', size: '3.4 MB', type: 'pdf' },
        { id: '6', name: 'Microbiome Analysis Summary', category: 'Lab Reports', uploadedBy: 'Study Team', date: '03/22/2026', status: 'Verified', size: '4.2 MB', type: 'pdf' },
        { id: '7', name: 'Study Recruitment Flyer', category: 'Study Flyers', uploadedBy: 'Study Team', date: '02/15/2026', status: 'Verified', size: '1.5 MB', type: 'pdf' },
    ];

    const categories = [
        { name: 'Signed Consent', count: 1, icon: <Lock className="w-4 h-4" /> },
        { name: 'Instructions', count: 1, icon: <Info className="w-4 h-4" /> },
        { name: 'Privacy Policy', count: 1, icon: <ShieldCheck className="w-4 h-4" /> },
        { name: 'Receipts', count: 1, icon: <FileStack className="w-4 h-4" /> },
        { name: 'Uploaded Files', count: 1, icon: <Upload className="w-4 h-4" /> },
        { name: 'Lab Reports', count: 2, icon: <FileText className="w-4 h-4" /> },
        { name: 'Study Flyers', count: 1, icon: <FileImage className="w-4 h-4" /> },
    ];

    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesCategory = activeCategory === 'All' || doc.category === activeCategory;
            const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return FileText;
            case 'image': return FileImage;
            case 'csv': return FileSpreadsheet;
            default: return FileText;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Signed': return <Badge color="green">SIGNED</Badge>;
            case 'Verified': return <Badge color="green">VERIFIED</Badge>;
            case 'Important': return <Badge color="orange">IMPORTANT</Badge>;
            case 'Uploaded': return <Badge color="blue">UPLOADED</Badge>;
            default: return <Badge color="blue">{status}</Badge>;
        }
    };

    const handleAction = async (doc: Document, action: 'VIEW' | 'DOWNLOAD') => {
        const pdf = new jsPDF();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(30, 136, 229);
        pdf.text('MusB RESEARCH PORTAL', 45, 25);
        if (action === 'DOWNLOAD') {
            pdf.save(`${doc.name.replace(/\s+/g, '_')}.pdf`);
        } else {
            const string = pdf.output('datauristring');
            window.open(string);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 max-w-[1400px] animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-64" />
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <Skeleton className="w-full lg:w-[280px] h-96 rounded-2xl" />
                    <div className="flex-1 space-y-6">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-[500px] rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest mb-1">
                        <span>Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#1E88E5]">Clinical Documents</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight">Resource Center</h2>
                    <p className="text-[13px] font-bold text-[#5F6F89] uppercase tracking-widest">Secure access to study protocols and records</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6F89]" />
                        <input
                            type="text"
                            placeholder="Find an asset..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-[#E3ECF5] rounded-xl pl-12 pr-6 py-3 text-[13px] font-bold text-[#1A2B49] outline-none focus:border-[#1E88E5] transition-all w-[280px] shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-[#1E88E5] text-white px-8 py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 hover:bg-[#1565C0] flex items-center gap-3 active:scale-95"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Upload Document
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Categories Bar */}
                <Card className="w-full lg:w-[300px] p-6 shrink-0 bg-white">
                    <h3 className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-[0.2em] mb-6 pb-4 border-b border-[#F8FBFF]">Repository Groups</h3>
                    <nav className="space-y-1.5">
                        <button
                            onClick={() => setActiveCategory('All')}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${activeCategory === 'All' ? 'bg-[#E3F2FD] text-[#1E88E5]' : 'text-[#5F6F89] hover:bg-[#F8FBFF]'}`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutGrid className="w-4.5 h-4.5" />
                                <span className="text-[12px] font-bold uppercase tracking-widest">All Assets</span>
                            </div>
                            <span className="text-[11px] font-bold opacity-80">({documents.length})</span>
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${activeCategory === cat.name ? 'bg-[#E3F2FD] text-[#1E88E5]' : 'text-[#5F6F89] hover:bg-[#F8FBFF]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {cat.icon}
                                    <span className="text-[12px] font-bold uppercase tracking-widest">{cat.name}</span>
                                </div>
                                <span className="text-[11px] font-bold opacity-80">({cat.count})</span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-10 p-5 rounded-xl bg-[#F8FBFF] border border-[#E3ECF5]">
                        <div className="flex items-center gap-3 mb-4">
                            <History className="w-4 h-4 text-[#1E88E5]" />
                            <span className="text-[12px] font-bold text-[#1A2B49] uppercase tracking-widest">Recent Activity</span>
                        </div>
                        <div className="space-y-3">
                            <div className="border-l-2 border-[#1E88E5] pl-4 py-1">
                                <p className="text-[11px] font-bold text-[#1A2B49] uppercase tracking-tight">Profile Verified</p>
                                <span className="text-[10px] text-[#5F6F89] uppercase font-medium">Synced Today</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Content Area */}
                <div className="flex-1 w-full space-y-6">
                    <div className="flex items-center justify-between bg-white border border-[#E3ECF5] p-5 rounded-2xl shadow-sm">
                        <div className="flex flex-col">
                            <h4 className="text-lg font-bold text-[#1A2B49] uppercase tracking-tight">{activeCategory === 'All' ? 'Clinical Archive' : activeCategory}</h4>
                            <span className="text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">{filteredDocs.length} Official Records Found</span>
                        </div>
                        <div className="flex bg-[#F8FBFF] border border-[#E3ECF5] p-1.5 rounded-xl relative">
                            <motion.div 
                                className="absolute bg-[#1E88E5] rounded-lg shadow-md"
                                initial={false}
                                animate={{ x: viewMode === 'table' ? 0 : 44, width: 38, height: 38 }}
                                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                            />
                            <button onClick={() => setViewMode('table')} className={`relative z-10 p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'text-white' : 'text-[#5F6F89] hover:text-[#5F6F89]'}`}><List className="w-5 h-5" /></button>
                            <button onClick={() => setViewMode('card')} className={`relative z-10 p-2 rounded-lg transition-colors ${viewMode === 'card' ? 'text-white' : 'text-[#5F6F89] hover:text-[#5F6F89]'}`}><LayoutGrid className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {viewMode === 'table' ? (
                                <motion.div 
                                    key="table-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="bg-white border border-[#E3ECF5] rounded-2xl overflow-hidden shadow-sm"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#F8FBFF] border-b border-[#E3ECF5]">
                                                <th className="px-8 py-6 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Clinical Asset</th>
                                                <th className="px-6 py-6 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest">Source</th>
                                                <th className="px-6 py-6 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest text-center">Status</th>
                                                <th className="px-8 py-6 text-[12px] font-bold text-[#5F6F89] uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F8FBFF]">
                                            {filteredDocs.map((doc) => (
                                                <tr key={doc.id} className="group hover:bg-[#F0F6FF]/30 transition-colors cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                                                    <td className="px-8 py-7">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-[#F8FBFF] flex items-center justify-center text-[#B0BCCF] border border-[#E3ECF5] group-hover:bg-white group-hover:text-[#1E88E5] group-hover:border-[#1E88E5]/30 transition-all">
                                                                {React.createElement(getFileIcon(doc.type), { className: "w-5 h-5" })}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-bold text-[#1A2B49] uppercase tracking-tight group-hover:text-[#1E88E5] transition-colors">{doc.name}</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                     <span className="text-[11px] font-bold text-[#5F6F89] uppercase">{doc.size}</span>
                                                                     <span className="w-1 h-1 rounded-full bg-[#E3ECF5]" />
                                                                     <span className="text-[11px] font-bold text-[#5F6F89] uppercase">{doc.date}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-7 font-bold text-[12px] text-[#5F6F89] uppercase tracking-widest">{doc.uploadedBy}</td>
                                                    <td className="px-6 py-7 text-center">{getStatusBadge(doc.status)}</td>
                                                    <td className="px-8 py-7 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(doc, 'VIEW'); }} className="p-3 rounded-xl bg-[#F8FBFF] text-[#5F6F89] hover:text-[#1E88E5] hover:bg-[#E3F2FD] border border-[#E3ECF5] transition-all"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(doc, 'DOWNLOAD'); }} className="p-3 rounded-xl bg-[#F8FBFF] text-[#5F6F89] hover:text-[#1A2B49] hover:bg-white border border-[#E3ECF5] transition-all"><Download className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="grid-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {filteredDocs.map((doc, idx) => (
                                        <Card key={doc.id} className="group p-8 hover:border-[#1E88E5]/30 bg-white transition-all cursor-pointer flex flex-col h-full" onClick={() => setSelectedDoc(doc)}>
                                           <div className="flex items-start justify-between mb-8">
                                                <div className="w-16 h-16 rounded-2xl bg-[#F8FBFF] flex items-center justify-center text-[#B0BCCF] border border-[#E3ECF5] group-hover:bg-[#E3F2FD] group-hover:text-[#1E88E5] group-hover:border-[#1E88E5]/20 group-hover:scale-105 transition-all shadow-inner">
                                                    {React.createElement(getFileIcon(doc.type), { className: "w-8 h-8" })}
                                                </div>
                                                {getStatusBadge(doc.status)}
                                           </div>
                                           <div className="flex-1 space-y-3">
                                                <span className="text-[10px] font-bold text-[#1E88E5] uppercase tracking-widest">{doc.category}</span>
                                                <h5 className="text-[16px] font-bold text-[#1A2B49] uppercase tracking-tight leading-tight group-hover:text-[#1E88E5] transition-all line-clamp-2">{doc.name}</h5>
                                                <p className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest pt-2">{doc.size} • {doc.date}</p>
                                           </div>
                                           <div className="pt-6 mt-8 border-t border-[#F8FBFF] flex items-center justify-between">
                                               <div className="flex items-center gap-3">
                                                   <div className="w-8 h-8 rounded-full bg-[#F8FBFF] border border-[#E3ECF5] flex items-center justify-center text-[#5F6F89]"><User className="w-4 h-4" /></div>
                                                   <span className="text-[11px] font-bold text-[#5F6F89] uppercase tracking-widest">{doc.uploadedBy}</span>
                                               </div>
                                               <ChevronRight className="w-5 h-5 text-[#E3ECF5] group-hover:text-[#1E88E5] group-hover:translate-x-1 transition-all" />
                                           </div>
                                        </Card>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Modals handled via Portal for global layering above sidebar */}
            {createPortal(
                <AnimatePresence>
                    {selectedDoc && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                            
                            {/* BACKDROP */}
                            <div
                                className="absolute inset-0 bg-[#1A2B49]/50 backdrop-blur-sm"
                                onClick={() => setSelectedDoc(null)}
                            />

                            {/* MODAL CONTAINER */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-[1200px] h-[calc(100vh-80px)] bg-white border border-[#E3ECF5] rounded-[24px] overflow-hidden flex flex-col shadow-2xl"
                            >

                                {/* HEADER */}
                                <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-[#E3ECF5] bg-white flex items-center justify-between shrink-0">
                                    
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="p-3 bg-[#E3F2FD] text-[#1E88E5] rounded-xl">
                                            <FileText className="w-5 h-5" />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-lg sm:text-xl font-bold text-[#1A2B49] truncate">
                                                {selectedDoc.name}
                                            </h3>

                                            <div className="flex items-center gap-3 mt-1 text-[11px] font-bold uppercase">
                                                <span className="text-[#1E88E5]">{selectedDoc.size}</span>
                                                <span className="w-1 h-1 rounded-full bg-[#B0BCCF]" />
                                                <span className="text-[#8A99B3]">
                                                    Asset: {selectedDoc.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleAction(selectedDoc, 'DOWNLOAD')}
                                            className="px-5 py-2.5 bg-[#1E88E5] text-white rounded-lg text-[12px] font-bold uppercase hover:bg-[#1565C0] transition-all"
                                        >
                                            Download
                                        </button>

                                        <button
                                            onClick={() => setSelectedDoc(null)}
                                            className="p-2.5 bg-[#FDECEA] text-[#D32F2F] rounded-lg hover:bg-[#D32F2F] hover:text-white transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* PDF VIEWER */}
                                <div className="flex-1 overflow-hidden bg-[#F8FBFF] p-3 sm:p-4">
                                    
                                    {isDecrypting ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-16 h-16 border-4 border-[#1E88E5]/20 border-t-[#1E88E5] rounded-full animate-spin" />
                                                <span className="text-[13px] font-bold text-[#1A2B49] uppercase tracking-widest">
                                                    Loading Document...
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <iframe
                                            src={decryptedContent || ''}
                                            className="w-full h-full rounded-xl border border-[#E3ECF5] bg-white"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-[#1A2B49]/30 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-xl bg-white border border-[#E3ECF5] rounded-[28px] p-12 overflow-hidden shadow-2xl text-left">
                            <h3 className="text-2xl font-bold text-[#1A2B49] uppercase tracking-tight mb-8">Upload Document</h3>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[12px] font-bold text-[#8A99B3] uppercase tracking-widest">Document Category</label>
                                    <select className="w-full bg-[#F8FBFF] border border-[#E3ECF5] rounded-xl p-4 text-[#1A2B49] font-bold outline-none cursor-pointer focus:border-[#1E88E5]">
                                        <option>Receipts & Expenses</option>
                                        <option>Identity Documents</option>
                                        <option>Medical Records</option>
                                    </select>
                                </div>
                                <div className="border-2 border-dashed border-[#E3ECF5] rounded-3xl p-12 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[#F0F6FF] hover:border-[#1E88E5]/30 transition-all">
                                    <div className="w-16 h-16 bg-[#F8FBFF] rounded-2xl flex items-center justify-center text-[#B0BCCF] group-hover:text-[#1E88E5] transition-all mb-4"><Upload className="w-8 h-8" /></div>
                                    <p className="text-[14px] font-bold text-[#5F6F89] uppercase tracking-widest capitalize">Select clinical file to transmit</p>
                                    <span className="text-[10px] text-[#B0BCCF] uppercase font-bold mt-2">Max Size: 25MB • PDF, JPG, PNG</span>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-12">
                                <button className="flex-1 bg-[#1E88E5] text-white py-4.5 rounded-xl font-bold text-[13px] uppercase tracking-widest hover:bg-[#1565C0] shadow-md transition-all active:scale-95" onClick={() => setIsUploadModalOpen(false)}>Complete Upload</button>
                                <button className="px-8 py-4.5 bg-[#F8FBFF] text-[#5F6F89] rounded-xl text-[12px] font-bold uppercase hover:bg-[#E3ECF5] transition-colors" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentsView;
