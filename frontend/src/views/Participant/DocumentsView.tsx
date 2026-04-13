import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Download, Search, Filter, ShieldCheck,
    Eye, Lock, PlusCircle,
    ChevronRight, FolderOpen, User, Calendar,
    FileImage, FileStack, LayoutGrid, List, Upload,
    ChevronDown, Printer, X, Info, FileSpreadsheet, History
} from 'lucide-react';
import { Card, Badge } from './SharedComponents';
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
    const [filterOption, setFilterOption] = useState('All');
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
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [selectedDoc]);

    const getDocumentContent = async (doc: Document) => {
        const pdf = new jsPDF();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(245, 158, 11); // Amber
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
            case 'Signed': return <Badge color="amber" className="italic font-black border border-amber-500/20">SIGNED</Badge>;
            case 'Verified': return <Badge color="green" className="italic font-black">VERIFIED</Badge>;
            case 'Important': return <Badge color="amber" className="italic font-black">IMPORTANT</Badge>;
            case 'Uploaded': return <Badge color="amber" className="italic font-black border border-amber-500/20 shadow-lg shadow-amber-500/10">UPLOADED</Badge>;
            default: return <Badge color="amber">{status}</Badge>;
        }
    };

    const handleAction = async (doc: Document, action: 'VIEW' | 'DOWNLOAD') => {
        const pdf = new jsPDF();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(245, 158, 11); // Amber
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
            <div className="flex flex-col gap-8 max-w-[1600px] animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-white/5 rounded-full" />
                        <div className="h-10 w-64 bg-white/10 rounded-xl" />
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-[280px] h-96 bg-white/5 rounded-[2.5rem]" />
                    <div className="flex-1 space-y-6">
                        <div className="h-20 bg-white/5 rounded-2xl" />
                        <div className="h-[500px] bg-white/5 rounded-[2rem]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] min-h-screen text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic text-left">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-amber-500">Documents</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                        DOCUMENTS
                        <div className="w-8 h-px bg-gradient-to-r from-amber-500 to-transparent" />
                    </h2>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest text-left">
                        Access and manage study files securely
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group text-left">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH DOCUMENTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0a101f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-white italic outline-none focus:border-amber-500/30 transition-all w-[240px] tracking-widest uppercase"
                        />
                    </div>

                    <div className="flex bg-[#0a101f] border border-white/5 p-1 rounded-xl">
                        {['All', 'Recent', 'My Files'].map(opt => (
                            <button
                                key={opt}
                                className={`px-4 py-2 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all ${opt === 'All' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-amber-500 text-slate-950 px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-400 flex items-center gap-2 group italic"
                    >
                        <PlusCircle className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        UPLOAD DOCUMENT
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <Card className="w-full lg:w-[280px] p-6 shrink-0 relative overflow-hidden group">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.25em] mb-6 italic border-b border-white/5 pb-4 text-left">Categories</h3>
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveCategory('All')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeCategory === 'All' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3 text-left">
                                <LayoutGrid className="w-4 h-4" />
                                <span className="text-[12px] font-black uppercase tracking-widest">All Documents</span>
                            </div>
                            <span className="text-[12px] font-bold opacity-40">[{documents.length}]</span>
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeCategory === cat.name ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3 text-left">
                                    {cat.icon}
                                    <span className="text-[12px] font-black uppercase tracking-widest">{cat.name}</span>
                                </div>
                                <span className="text-[12px] font-bold opacity-40">[{cat.count}]</span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <History className="w-4 h-4 text-amber-500" />
                            <span className="text-[12px] font-black text-white italic uppercase tracking-widest">Activity Log</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1 border-l border-white/5 pl-4 ml-1 text-left">
                                <span className="text-[12px] font-black text-amber-500 uppercase italic">File Shared</span>
                                <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight">Today</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex-1 w-full space-y-6 text-left">
                    <div className="flex items-center justify-between bg-[#0a101f]/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex flex-col px-2">
                            <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{activeCategory === 'All' ? 'Everything' : activeCategory} Documents</h4>
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Total: {filteredDocs.length} Assets</span>
                        </div>
                        <div className="flex bg-[#0a101f] border border-white/10 p-1.5 rounded-2xl relative">
                            <motion.div 
                                className="absolute bg-amber-500 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                initial={false}
                                animate={{ 
                                    x: viewMode === 'table' ? 0 : 44,
                                    width: 38,
                                    height: 38
                                }}
                                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                            />
                            <button 
                                onClick={() => setViewMode('table')} 
                                className={`relative z-10 p-2.5 rounded-xl transition-colors duration-300 ${viewMode === 'table' ? 'text-slate-950' : 'text-slate-600 hover:text-white'} cursor-pointer`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('card')} 
                                className={`relative z-10 p-2.5 rounded-xl transition-colors duration-300 ${viewMode === 'card' ? 'text-slate-950' : 'text-slate-600 hover:text-white'} cursor-pointer`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {viewMode === 'table' ? (
                                <motion.div 
                                    key="table-view"
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                    className="bg-[#0a101f]/80 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md"
                                >
                                    <table className="w-full text-left">
                                        <thead className="bg-white/[0.02] border-b border-white/5">
                                            <tr>
                                                <th className="px-8 py-6 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Document</th>
                                                <th className="px-6 py-6 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Source</th>
                                                <th className="px-6 py-6 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Identity</th>
                                                <th className="px-8 py-6 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {filteredDocs.map((doc) => (
                                                <tr key={doc.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                                                    <td className="px-8 py-7">
                                                        <div className="flex items-center gap-5 text-left">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all border border-white/5 group-hover:border-amber-500/20">
                                                                {React.createElement(getFileIcon(doc.type), { className: "w-5 h-5" })}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-black text-white uppercase italic group-hover:text-amber-500 transition-colors tracking-tight">{doc.name}</span>
                                                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{doc.size}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-7 font-black text-[11px] text-slate-500 uppercase tracking-widest text-left">{doc.uploadedBy}</td>
                                                    <td className="px-6 py-7 text-center">{getStatusBadge(doc.status)}</td>
                                                    <td className="px-8 py-7 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(doc, 'VIEW'); }} className="p-3 rounded-xl bg-white/5 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-white/5 hover:border-amber-500/20"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(doc, 'DOWNLOAD'); }} className="p-3 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all border border-white/5 hover:border-white/20"><Download className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="grid-view"
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {filteredDocs.map((doc, idx) => (
                                        <motion.div
                                            key={doc.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card 
                                                className="group p-8 hover:border-amber-500/30 transition-all cursor-pointer bg-[#0a101f]/60 backdrop-blur-sm relative overflow-hidden rounded-[2.5rem] border border-white/5 h-full flex flex-col"
                                                onClick={() => setSelectedDoc(doc)}
                                            >
                                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                                    {getStatusBadge(doc.status)}
                                                </div>
                                                
                                                <div className="flex flex-col h-full space-y-8">
                                                    <div className="flex items-start justify-between">
                                                        <div className="w-16 h-16 rounded-[1.75rem] bg-white/5 flex items-center justify-center group-hover:bg-amber-500 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] border border-white/5 group-hover:border-amber-400 group-hover:scale-110">
                                                            {React.createElement(getFileIcon(doc.type), { className: "w-8 h-8 transition-colors group-hover:text-slate-950" })}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleAction(doc, 'VIEW'); }} 
                                                                className="p-3.5 rounded-[1.25rem] bg-white/5 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-white/5 hover:border-amber-500/20 shadow-lg"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleAction(doc, 'DOWNLOAD'); }} 
                                                                className="p-3.5 rounded-[1.25rem] bg-white/5 text-slate-500 hover:text-white transition-all border border-white/5 hover:border-white/20 shadow-lg"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] italic opacity-60">{doc.category}</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/20" />
                                                        </div>
                                                        <h5 className="text-[17px] font-black text-white italic uppercase tracking-tighter group-hover:text-amber-500 transition-colors line-clamp-2 leading-tight">
                                                            {doc.name}
                                                        </h5>
                                                        <div className="flex items-center gap-3 mt-4">
                                                            <Badge color="slate" className="bg-white/5 text-[10px] py-1 px-3 border-none">{doc.size}</Badge>
                                                            <Badge color="slate" className="bg-white/5 text-[10px] py-1 px-3 border-none capitalize">{doc.type}</Badge>
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                                <User className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">OWNER</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{doc.uploadedBy}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">ACCESSED</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{doc.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#0a0e1a]/95 backdrop-blur-xl" onClick={() => setIsUploadModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-[#0d1424] border border-white/10 rounded-[3rem] p-12 overflow-hidden shadow-2xl text-left">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-6">UPLOAD DOCUMENT</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-4">
                                    <label className="text-[12px] font-black text-slate-500 uppercase italic">Classification</label>
                                    <select className="w-full bg-[#141e35] border border-white/5 rounded-2xl p-5 text-white text-[12px] font-black uppercase outline-none focus:border-amber-500/30 transition-all appearance-none cursor-pointer"><option>Select Group</option></select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[12px] font-black text-slate-500 uppercase italic">Secure File Path</label>
                                    <div className="h-full min-h-[140px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-slate-500 hover:border-amber-500/30 transition-all cursor-pointer bg-white/[0.01]">
                                        <Upload className="w-6 h-6 mb-2" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">ATTACH ASSET</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button className="flex-1 bg-amber-500 text-slate-950 py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] italic shadow-lg hover:bg-amber-400" onClick={() => setIsUploadModalOpen(false)}>CONFIRM UPLOAD</button>
                                <button className="px-10 py-5 bg-white/5 text-slate-500 rounded-2xl text-[12px] font-black uppercase hover:text-white" onClick={() => setIsUploadModalOpen(false)}>CLOSE</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedDoc && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#060a12]/98 backdrop-blur-2xl" onClick={() => setSelectedDoc(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-6xl h-[85vh] bg-[#0d1424] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                            <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-left">
                                <div className="flex items-center gap-6">
                                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20"><FileText className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">{selectedDoc.name}</h3>
                                        <span className="text-[12px] font-black text-amber-500 uppercase tracking-widest">{selectedDoc.size} • SECURE ACCESS</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => handleAction(selectedDoc, 'DOWNLOAD')} className="px-6 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-[12px] font-black uppercase italic shadow-lg transition-all hover:bg-amber-400">DOWNLOAD ASSET</button>
                                    <button onClick={() => setSelectedDoc(null)} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all ml-4"><X className="w-6 h-6" /></button>
                                </div>
                            </div>
                            <div className="flex-1 bg-[#060a12] flex items-center justify-center p-8">
                                <AnimatePresence mode="wait">
                                    {isDecrypting ? (
                                        <motion.div key="loader" className="flex flex-col items-center gap-8">
                                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse"><Lock className="w-10 h-10 text-amber-500" /></div>
                                            <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} className="h-full bg-gradient-to-r from-amber-500 to-orange-500" />
                                            </div>
                                            <span className="text-[12px] font-black text-white italic uppercase tracking-[0.3em] animate-pulse">AUTHORIZING DECRYPTION...</span>
                                        </motion.div>
                                    ) : (
                                        <iframe src={decryptedContent || ''} className="w-full h-full rounded-[2rem] border-none bg-white shadow-2xl" />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentsView;
;



