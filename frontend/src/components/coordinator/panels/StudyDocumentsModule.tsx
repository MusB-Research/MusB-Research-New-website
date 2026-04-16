import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, API } from '../../../utils/auth';
import { 
    FileText, 
    Search, 
    Filter, 
    Download, 
    History, 
    ChevronRight, 
    Layers, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    MoreHorizontal,
    Folder,
    BookOpen,
    Shield,
    FileCheck,
    Beaker
} from 'lucide-react';

interface StudyDoc {
    id: string;
    title: string;
    category: string;
    version: string;
    uploaded_at: string;
    file: string;
    is_archived: boolean;
    status?: string;
}

export default function StudyDocumentsModule({ selectedStudyId }: { selectedStudyId?: string }) {

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [documents, setDocuments] = useState<StudyDoc[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const url = selectedStudyId ? `${API}/api/documents/?study_id=${selectedStudyId}` : `${API}/api/documents/`;
            const res = await authFetch(url);
            if (res.ok) {
                const data = await res.json();
                setDocuments(Array.isArray(data) ? data : data.results || []);
            }
        } catch (err) {
            console.error("Failed to fetch documents:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [selectedStudyId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedStudyId || selectedStudyId === 'all') {
            if (!file) return;
            alert("Please select a specific study first to upload documents.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.split('.')[0]);
        formData.append('study', selectedStudyId);
        formData.append('visibility', JSON.stringify(['PI', 'COORDINATOR', 'SPONSOR']));

        try {
            const res = await authFetch(`${API}/api/documents/`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                fetchDocuments();
            } else {
                const err = await res.json();
                alert(`Upload failed: ${JSON.stringify(err)}`);
            }
        } catch (err) {
            alert("Connection error during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const getFullUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API}${path}`;
    };

    const filteredDocs = Array.isArray(documents) ? documents.filter(d => {
        const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    }) : [];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight">Documents</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                        className="px-6 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                    >
                        Download All
                    </button>
                    <div className="relative">
                        <input 
                            type="file" 
                            id="protocol-upload" 
                            className="hidden" 
                            onChange={handleUpload} 
                            disabled={isUploading}
                        />
                        <button 
                            disabled={isUploading || !selectedStudyId}
                            onClick={() => document.getElementById('protocol-upload')?.click()}
                            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] hover:shadow-indigo-500/40 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isUploading ? 'Uploading...' : 'Upload'} <Folder className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {[
                    { 
                        label: 'Core Protocol', 
                        count: documents.find(d => d.category === 'Protocol')?.version ? `v${documents.find(d => d.category === 'Protocol')?.version}` : 'N/A', 
                        icon: BookOpen, 
                        color: 'indigo', 
                        cat: 'Protocol' 
                    },
                    { 
                        label: 'IB Edits', 
                        count: documents.find(d => d.category === 'IB')?.version ? `v${documents.find(d => d.category === 'IB')?.version}` : 'N/A', 
                        icon: FileCheck, 
                        color: 'emerald', 
                        cat: 'IB' 
                    },
                    { 
                        label: 'Pharmacy', 
                        count: documents.filter(d => d.category === 'Pharmacy').length > 0 ? `${documents.filter(d => d.category === 'Pharmacy').length} Files` : 'N/A', 
                        icon: Beaker, 
                        color: 'blue', 
                        cat: 'Pharmacy' 
                    },
                    { 
                        label: 'Master Binder', 
                        count: `${documents.length} Files`, 
                        icon: Shield, 
                        color: 'indigo', 
                        cat: 'All' 
                    }
                ].map((q, i) => (
                    <div 
                        key={i} 
                        onClick={() => setActiveCategory(q.cat as any)}
                        className={`flex items-center gap-6 lg:gap-8 group cursor-pointer transition-all ${
                            activeCategory === q.cat ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'
                        }`}
                    >
                        <div className={`flex-shrink-0 w-16 h-16 bg-${q.color}-500/5 border border-${q.color}-500/10 rounded-2xl flex items-center justify-center text-${q.color}-400 group-hover:scale-110 transition-transform`}>
                            <q.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-[11px] text-white/40 font-black uppercase tracking-widest italic block mb-1">{q.label}</span>
                            <p className="text-xl font-black text-white italic tracking-tight leading-none truncate">{q.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-b border-white/5 py-4">
                <div className="flex flex-wrap gap-2">
                    {['All', 'Protocol', 'IB', 'Pharmacy', 'Regulatory'].map((cat: any) => (
                         <button
                             key={cat}
                             onClick={() => setActiveCategory(cat)}
                             className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                                 activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                             }`}
                         >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-[12px] text-white font-bold outline-none focus:border-indigo-500/50 transition-all w-72 uppercase tracking-widest font-mono shadow-2xl shadow-black/20"
                    />
                </div>
            </div>

            {/* Repository List */}
            <div className="divide-y divide-white/5">
                {filteredDocs.map((doc) => (
                    <motion.div key={doc.id} className="group flex items-center justify-between py-4 px-4 transition-colors">
                        <div className="flex items-center gap-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all shadow-lg shadow-black/20">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-4">
                                      <h4 className="text-xl font-black text-white italic uppercase tracking-tight leading-none">{doc.title}</h4>
                                      <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border shadow-lg ${
                                          !doc.is_archived ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 
                                          'text-slate-500 border-white/5 bg-white/5'
                                      }`}>
                                          {!doc.is_archived ? 'Active' : 'Archived'}
                                      </span>
                                 </div>
                                  <p className="text-[12px] text-slate-500 font-black tracking-widest uppercase mt-3 italic opacity-60">Version {doc.version} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()} • {doc.category || 'General'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 transition-all">
                             <button 
                                onClick={() => window.open(getFullUrl(doc.file), '_blank')}
                                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-900 shadow-xl active:scale-95 transition-all flex items-center gap-3"
                             >
                                 VIEW <BookOpen className="w-4 h-4" />
                             </button>
                             <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95 group/btn">
                                 <History className="w-4 h-4 group-hover/btn:rotate-180 transition-transform" />
                             </button>
                             <button 
                                 onClick={() => {
                                     const link = document.createElement('a');
                                     link.href = getFullUrl(doc.file);
                                     link.download = doc.title;
                                     document.body.appendChild(link);
                                     link.click();
                                     document.body.removeChild(link);
                                 }}
                                 className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-900 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-3"
                             >
                                DOWNLOAD <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}


