import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, Download, Search, Filter, Clock, ShieldCheck, 
    Eye, MoreVertical, AlertCircle, Trash2, Lock, PlusCircle,
    ChevronRight, FolderOpen, User, Calendar, CheckCircle2,
    FileCode, FileImage, FileStack, LayoutGrid, List, Upload,
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

const DocumentsView = ({ handleExportPDF, study }: { handleExportPDF: any; study?: any }) => {
    // --- State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [filterOption, setFilterOption] = useState('All');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    // --- Mock Data ---
    const documents: Document[] = [
        { id: '1', name: 'Signed Consent Form – Version 2.1', category: 'Signed Consent', uploadedBy: 'Study Team', date: '03/01/2026', status: 'Signed', size: '1.2 MB', type: 'pdf' },
        { id: '2', name: 'Study Participation Instructions', category: 'Instructions', uploadedBy: 'Study Team', date: '03/01/2026', status: 'Important', size: '0.8 MB', type: 'pdf' },
        { id: '3', name: 'Data Privacy Policy 2026', category: 'Privacy Policy', uploadedBy: 'Study Team', date: '03/01/2026', status: 'Verified', size: '0.5 MB', type: 'pdf' },
        { id: '4', name: 'Travel Reimbursement - March', category: 'Receipts', uploadedBy: 'Participant', date: '03/15/2026', status: 'Uploaded', size: '2.1 MB', type: 'image' },
        { id: '5', name: 'Lab Report - Blood Panel', category: 'Lab Reports', subcategory: 'Blood', uploadedBy: 'Study Team', date: '03/20/2026', status: 'Verified', size: '3.4 MB', type: 'pdf' },
        { id: '6', name: 'Microbiome Analysis Summary', category: 'Lab Reports', subcategory: 'Microbiome', uploadedBy: 'Study Team', date: '03/22/2026', status: 'Verified', size: '4.2 MB', type: 'pdf' },
        { id: '7', name: 'Study Recruitment Flyer', category: 'Study Flyers', uploadedBy: 'Study Team', date: '02/15/2026', status: 'Verified', size: '1.5 MB', type: 'pdf' },
        { id: '8', name: 'Previous Lab Results.pdf', category: 'Uploaded Files', uploadedBy: 'Participant', date: '03/10/2026', status: 'Uploaded', size: '2.8 MB', type: 'pdf' },
    ];

    const categories = [
        { name: 'Signed Consent', count: 1, icon: <Lock className="w-4 h-4" /> },
        { name: 'Instructions', count: 1, icon: <Info className="w-4 h-4" /> },
        { name: 'Privacy Policy', count: 1, icon: <ShieldCheck className="w-4 h-4" /> },
        { name: 'Receipts', count: 1, icon: <FileStack className="w-4 h-4" /> },
        { name: 'Uploaded Files', count: 1, icon: <Upload className="w-4 h-4" /> },
        { name: 'Lab Reports', count: 2, icon: <FileText className="w-4 h-4" />, subcategories: ['Blood', 'Urine', 'Microbiome'] },
        { name: 'Study Flyers', count: 1, icon: <FileImage className="w-4 h-4" /> },
        { name: 'Others', count: 0, icon: <FolderOpen className="w-4 h-4" /> },
    ];

    // --- Derived Data ---
    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesCategory = activeCategory === 'All' || doc.category === activeCategory || doc.subcategory === activeCategory;
            const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesFilter = true;
            if (filterOption === 'Recent') {
                const docDate = new Date(doc.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                matchesFilter = docDate >= weekAgo;
            } else if (filterOption === 'Uploaded by Me') {
                matchesFilter = doc.uploadedBy === 'Participant';
            } else if (filterOption === 'Study Provided') {
                matchesFilter = doc.uploadedBy === 'Study Team';
            } else if (filterOption === 'Requires Action') {
                matchesFilter = doc.status === 'Pending';
            }

            return matchesCategory && matchesSearch && matchesFilter;
        });
    }, [activeCategory, searchQuery, filterOption, documents]);

    // --- Renderers ---
    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="text-red-400" />;
            case 'image': return <FileImage className="text-blue-400" />;
            case 'csv': return <FileSpreadsheet className="text-green-400" />;
            default: return <FileCode className="text-slate-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Signed': return <Badge color="indigo" className="italic font-black">SIGNED</Badge>;
            case 'Verified': return <Badge color="green" className="italic font-black">VERIFIED</Badge>;
            case 'Important': return <Badge color="amber" className="italic font-black">IMPORTANT</Badge>;
            case 'Pending': return <Badge color="red" className="italic font-black">PENDING</Badge>;
            case 'Uploaded': return <Badge color="cyan" className="italic font-black">UPLOADED</Badge>;
            default: return <Badge color="cyan">{status}</Badge>;
        }
    };

    const handleAction = (doc: Document, action: 'VIEW' | 'DOWNLOAD') => {
        const pdf = new jsPDF();
        
        // --- Add MusB Branding ---
        pdf.setFillColor(13, 20, 36);
        pdf.rect(0, 0, 210, 40, 'F');
        
        pdf.setTextColor(34, 211, 238);
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MusB RESEARCH NODE', 105, 20, { align: 'center' });
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('MUSB-PROTOCOL-SYNC-2026 | SECURE DOCUMENT CLOUD', 105, 30, { align: 'center' });

        // --- Document Details ---
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text(doc.name.toUpperCase(), 20, 60);
        
        pdf.setDrawColor(34, 211, 238);
        pdf.line(20, 65, 190, 65);
        
        pdf.setFontSize(12);
        pdf.text(`CATEGORY: ${doc.category.toUpperCase()}`, 20, 75);
        pdf.text(`UPLOADED BY: ${doc.uploadedBy.toUpperCase()}`, 20, 85);
        pdf.text(`DATE SYNCED: ${doc.date}`, 20, 95);
        pdf.text(`DOCUMENT SIZE: ${doc.size}`, 20, 105);

        // --- Dummy Content ---
        pdf.setFontSize(10);
        const dummyText = pdf.splitTextToSize("This is a study-authorized document generated by the MusB Research Node. All clinical data presented herein is encrypted (AES-256) and verified by the decentralised protocol repository. This document serves as an official record for participant synchronization and study compliance.", 170);
        pdf.text(dummyText, 20, 120);

        // --- Footer ---
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(8);
        pdf.text("AUTHENTICATION ID: MUSB-" + Math.random().toString(36).substring(7).toUpperCase(), 105, 280, { align: 'center' });

        if (action === 'DOWNLOAD') {
            pdf.save(`${doc.name}.pdf`);
        } else {
            const string = pdf.output('datauristring');
            const iframe = `<iframe width='100%' height='100%' src='${string}'></iframe>`;
            const x = window.open();
            x?.document.open();
            x?.document.write(iframe);
            x?.document.close();
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] min-h-screen">
            {/* Top Utility Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-cyan-400">Documents</span>
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                        DOCUMENTS
                        <div className="w-8 h-px bg-gradient-to-r from-cyan-400 to-transparent" />
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Access, download, and upload study-related documents securely
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH DOCUMENTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0a101f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black text-white italic outline-none focus:border-cyan-500/30 transition-all w-[240px] tracking-widest uppercase"
                        />
                    </div>
                    
                    <div className="flex bg-[#0a101f] border border-white/5 p-1 rounded-xl">
                        {['All', 'Recent', 'Uploaded by Me', 'Study Provided', 'Requires Action'].slice(0, 3).map(opt => (
                            <button
                                key={opt}
                                onClick={() => setFilterOption(opt)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterOption === opt ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {opt}
                            </button>
                        ))}
                        <div className="relative px-2 flex items-center border-l border-white/5 ml-2 cursor-pointer group">
                             <Filter className="w-3.5 h-3.5 text-slate-500" />
                             <div className="absolute right-0 top-full mt-2 w-48 bg-[#0d1424] border border-white/10 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                                 {['Recent', 'Uploaded by Me', 'Study Provided', 'Requires Action'].map(opt => (
                                     <button 
                                        key={opt}
                                        onClick={() => setFilterOption(opt)}
                                        className="w-full text-left px-4 py-3 text-[9px] font-black text-slate-500 hover:text-cyan-400 hover:bg-white/5 uppercase tracking-widest transition-colors"
                                     >
                                         {opt}
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-cyan-500 text-slate-950 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400 flex items-center gap-2 group italic"
                    >
                        <PlusCircle className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        UPLOAD DOCUMENT
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left Panel: Categories */}
                <Card className="w-full lg:w-[280px] p-6 shrink-0 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <FolderOpen className="w-24 h-24 text-white" />
                    </div>
                    
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.25em] mb-6 italic border-b border-white/5 pb-4">Categories</h3>
                    
                    <nav className="space-y-1 relative z-10">
                        <button
                            onClick={() => setActiveCategory('All')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeCategory === 'All' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutGrid className="w-4 h-4" />
                                <span className="text-[12px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">All Documents</span>
                            </div>
                            <span className="text-[11px] font-bold opacity-40">[{documents.length}]</span>
                        </button>
                        
                        {categories.map((cat) => (
                            <div key={cat.name} className="space-y-1">
                                <button
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeCategory === cat.name ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5' : 'text-slate-400 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {cat.icon}
                                        <span className="text-[12px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">{cat.name}</span>
                                    </div>
                                    <span className="text-[11px] font-bold opacity-40">[{cat.count}]</span>
                                </button>
                                
                                {cat.subcategories && activeCategory === cat.name && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        className="pl-8 space-y-1"
                                    >
                                        {cat.subcategories.map(sub => (
                                            <button 
                                                key={sub}
                                                onClick={() => setActiveCategory(sub)}
                                                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                                            >
                                                <div className="w-1 h-px bg-white/10" />
                                                {sub}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </nav>

                    <div className="mt-10 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                                <History className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black text-white italic uppercase tracking-widest">Recent Activity</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1 border-l border-white/5 pl-4 ml-1">
                                <span className="text-[10px] font-black text-cyan-400 uppercase italic">Lab Report Upload</span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">2 hours ago</span>
                            </div>
                            <div className="flex flex-col gap-1 border-l border-white/5 pl-4 ml-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">Consent Signed</span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Yesterday</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right Panel: Document List */}
                <div className="flex-1 w-full space-y-6">
                    {/* List Header */}
                    <div className="flex items-center justify-between bg-[#0a101f]/40 backdrop-blur-sm border border-white/5 p-4 rounded-2xl">
                        <div className="flex flex-col px-2">
                             <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{activeCategory === 'All' ? 'Everything' : activeCategory} Documents</h4>
                             <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total: {filteredDocs.length} Documents</span>
                                 <div className="w-1 h-1 bg-white/20 rounded-full" />
                                 <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">Last updated: 03/24/2026</span>
                             </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    {filteredDocs.length > 0 ? (
                        <div className="relative">
                            {viewMode === 'table' ? (
                                /* Table View */
                                <div className="bg-[#0a101f]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Document Name</th>
                                                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Category</th>
                                                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Uploaded By</th>
                                                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Date</th>
                                                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Status</th>
                                                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {filteredDocs.map((doc, idx) => (
                                                <motion.tr 
                                                    key={doc.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                    onClick={() => setSelectedDoc(doc)}
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-all">
                                                                {getFileIcon(doc.type)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors">{doc.name}</span>
                                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{doc.size}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{doc.category}</span>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-3 h-3 text-slate-500" />
                                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{doc.uploadedBy}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3 h-3 text-slate-500" />
                                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{doc.date}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        {getStatusBadge(doc.status)}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleAction(doc, 'VIEW'); }}
                                                                className="p-2.5 rounded-lg bg-white/5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleAction(doc, 'DOWNLOAD'); }}
                                                                className="p-2.5 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button className="p-2.5 rounded-lg bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Card View */
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    <AnimatePresence>
                                        {filteredDocs.map((doc, i) => (
                                            <motion.div
                                                layout
                                                key={doc.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <Card className="p-6 h-full flex flex-col justify-between group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden bg-[#0d1424]">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                                        <FileText className="w-64 h-64 text-white" />
                                                    </div>

                                                    <div className="relative z-10">
                                                        <div className="flex items-start justify-between mb-6">
                                                            <div className="p-3 rounded-xl bg-white/5 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                                                                {getFileIcon(doc.type)}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                {getStatusBadge(doc.status)}
                                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{doc.size}</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <h4 className="text-lg font-black text-white uppercase italic tracking-tighter group-hover:text-cyan-400 transition-colors leading-tight">
                                                                {doc.name}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">
                                                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {doc.date}</span>
                                                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                                <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {doc.uploadedBy}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="relative z-10 flex items-center gap-2 pt-6 mt-6 border-t border-white/[0.05]">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAction(doc, 'VIEW'); }}
                                                            className="flex-1 bg-white/5 hover:bg-cyan-500 hover:text-slate-950 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 italic"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> VIEW
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAction(doc, 'DOWNLOAD'); }}
                                                            className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] border border-white/5 bg-[#0a101f]/40">
                             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 grayscale">
                                 <Search className="w-10 h-10 text-slate-500" />
                             </div>
                             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">No documents available</h3>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-10 italic">There are no documents in this category yet</p>
                             <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-cyan-500 shadow-xl"
                             >
                                 UPLOAD DOCUMENT
                             </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Modals --- */}
            
            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0a0e1a]/95 backdrop-blur-xl" 
                            onClick={() => setIsUploadModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, rotateX: 20 }} 
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-[#0d1424] border border-white/10 rounded-[3rem] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-400" />
                            
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">UPLOAD DOCUMENT</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Select category and upload your file securely.</p>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-3 text-slate-500 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-left">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Document Category *</label>
                                        <div className="relative group">
                                            <select className="w-full bg-[#141e35] border border-white/5 rounded-2xl p-5 text-white text-[11px] font-black uppercase tracking-widest italic outline-none focus:border-cyan-500/30 transition-all appearance-none cursor-pointer">
                                                <option>Select Category</option>
                                                {categories.map(c => <option key={c.name}>{c.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Document Name *</label>
                                        <input
                                            type="text"
                                            placeholder="E.G. BLOOD_PANEL_REPORT_MARCH"
                                            className="w-full bg-[#141e35] border border-white/5 rounded-2xl p-5 text-white text-[11px] font-black uppercase tracking-widest italic outline-none focus:border-cyan-500/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Upload File *</label>
                                    <div className="h-full min-h-[160px] border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] hover:bg-cyan-500/[0.02] hover:border-cyan-500/30 transition-all flex flex-col items-center justify-center p-8 text-center group cursor-pointer relative overflow-hidden">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all mb-4">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">DRAG & DROP OR CLICK</span>
                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter mt-1">PDF, JPG, PNG, DOCX (MAX 20MB)</span>
                                        
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-[0_10px_30px_rgba(6,182,212,0.3)] active:scale-[0.98] italic"
                                    onClick={() => setIsUploadModalOpen(false)}
                                >
                                    ENCRYPT & UPLOAD
                                </button>
                                <button 
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-10 py-5 bg-white/5 text-slate-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-colors"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Viewer Modal */}
            <AnimatePresence>
                {selectedDoc && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#060a12]/98 backdrop-blur-2xl" 
                            onClick={() => setSelectedDoc(null)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-6xl h-[85vh] bg-[#0d1424] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
                        >
                            {/* Viewer Header */}
                            <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-white/[0.02] shrink-0 text-left">
                                <div className="flex items-center gap-6">
                                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                        {getFileIcon(selectedDoc.type)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">{selectedDoc.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{selectedDoc.category}</span>
                                            <div className="w-1 h-1 bg-white/20 rounded-full" />
                                            <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">{selectedDoc.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic">
                                        <Download className="w-3.5 h-3.5" /> DOWNLOAD
                                    </button>
                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic">
                                        <Printer className="w-3.5 h-3.5" /> PRINT
                                    </button>
                                    <button 
                                        onClick={() => setSelectedDoc(null)}
                                        className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 rounded-xl hover:text-white transition-all ml-4"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Viewer Body */}
                            <div className="flex-1 bg-[#060a12] p-10 overflow-auto flex items-center justify-center relative">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                                    <ShieldCheck className="w-[40rem] h-[40rem] text-cyan-400" />
                                </div>
                                
                                {/* Placeholder for Document Content */}
                                <div className="w-full max-w-4xl min-h-full bg-white/5 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center p-20 gap-8 shadow-2xl relative z-10 backdrop-blur-sm">
                                     <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center animate-pulse">
                                         <Lock className="w-10 h-10 text-cyan-400" />
                                     </div>
                                     <div className="text-center">
                                         <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 italic">SECURE RENDER IN PROGRESS</h4>
                                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed italic">
                                             HIPAA-COMPLIANT RENDERING ENGINE IS DECRYPTING YOUR DATA...
                                         </p>
                                     </div>
                                     
                                     <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                         <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                                         />
                                     </div>
                                </div>
                            </div>

                            {/* Viewer Footer */}
                            <div className="px-10 py-5 border-t border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3 text-[8px] font-black text-slate-600 uppercase tracking-widest italic">
                                    <ShieldCheck className="w-3 h-3" />
                                    ENCRYPTED END-TO-END (AES-256)
                                </div>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">
                                    VIEWER SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentsView;
