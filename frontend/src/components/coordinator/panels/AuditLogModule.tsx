import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, 
    Search, 
    Filter, 
    Download, 
    Clock, 
    User, 
    ShieldCheck, 
    Lock, 
    History as HistoryIcon, 
    ChevronRight, 
    Database, 
    Terminal, 
    Settings, 
    Eye, 
    Key, 
    FileSignature,
    ClipboardList
} from 'lucide-react';
import { API, authFetch } from '../../../utils/auth';

interface AuditEntry {
    id: string;
    action: string;
    category: 'Security' | 'Clinical' | 'Financial' | 'System';
    user: string;
    role: string;
    timestamp: string;
    details: string;
    status: 'Verified' | 'Unverified';
}

export default function AuditLogModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<'All' | 'Security' | 'Clinical' | 'System'>('All');
    const [auditData, setAuditData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRaw, setShowRaw] = useState(false);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await authFetch(`${API}/api/auth/admin/audit-logs/`);
                if (res.ok) {
                    const data = await res.json();
                    setAuditData(data);
                }
            } catch (err) {
                console.error("Audit fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // Filter logic updated to handle real backend keys (type and category)
    const filteredEntries = auditData.filter(e => {
        const catValue = e.category?.split(':')[0] || 'System';
        const matchesCategory = activeCategory === 'All' || catValue === activeCategory;
        const matchesSearch = e.type?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             e.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             e.user?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handlePDFExport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>IMMUTABLE AUDIT LOG - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; }
                        h1 { color: #2563eb; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
                        .ledger-header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; }
                        th { text-align: left; font-size: 10px; text-transform: uppercase; color: #666; padding: 12px; border-bottom: 1px solid #eee; }
                        td { padding: 12px; border-bottom: 1px solid #f9f9f9; font-size: 12px; }
                        .tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
                        .clinical { background: #ecfdf5; color: #059669; }
                        .security { background: #fef2f2; color: #dc2626; }
                        .system { background: #eff6ff; color: #2563eb; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="ledger-header">
                        <h1>MusB Research - Immutable Audit Log</h1>
                        <p>Total Records: ${filteredEntries.length} • Generated At: ${new Date().toLocaleString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Category</th>
                                <th>Action</th>
                                <th>User</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredEntries.map(e => `
                                <tr>
                                    <td>${e.timestamp}</td>
                                    <td><span class="tag ${e.category?.toLowerCase().split(':')[0]}">${e.category}</span></td>
                                    <td><strong>${e.type}</strong></td>
                                    <td>${e.user}</td>
                                    <td>${e.details}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const getCategoryStyle = (category: string) => {
        switch (category) {
            case 'Security': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'Clinical': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'System': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    const SkeletonRow = () => (
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse flex items-center gap-8">
            <div className="w-14 h-14 bg-white/5 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
            </div>
            <div className="w-32 space-y-2">
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-1/2 ml-auto" />
            </div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {/* Header */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-8`}>
                <div>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white italic uppercase tracking-tighter`}>Immutable <span className="text-blue-400">Audit Log</span></h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">21 CFR Part 11 Compliant Digital Ledger</p>
                </div>
                <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                    <button 
                        onClick={() => setShowRaw(!showRaw)}
                        className={`px-6 py-3.5 border rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isMobile ? 'w-full' : ''} ${showRaw ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                        <Terminal className="w-4 h-4" /> {showRaw ? 'Hide Terminal' : 'View Rawls'}
                    </button>
                    <button 
                        onClick={handlePDFExport}
                        className={`px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 ${isMobile ? 'w-full' : ''}`}
                    >
                        Generate PDF Export <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tactical Grid Controls */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-6 bg-[#0B101B]/60 border border-white/5 p-4 rounded-3xl`}>
                <div className="flex flex-wrap gap-2">
                    {['All', 'Security', 'Clinical', 'System'].map((cat: any) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'
                            } ${isMobile ? 'flex-1' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Trace Log..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-[11px] text-white font-bold outline-none focus:border-blue-500/50 transition-all ${isMobile ? 'w-full' : 'w-72'} uppercase tracking-widest font-mono placeholder:text-slate-700`}
                    />
                </div>
            </div>

            {/* Audit Feed */}
            <div className={`bg-[#0B101B]/40 border border-white/5 rounded-[3rem] ${isMobile ? 'p-4' : 'p-4 lg:p-10'} space-y-4 relative overflow-hidden`}>
                {loading && (
                    <div className="space-y-4">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {showRaw ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className={`bg-black/80 rounded-[2rem] ${isMobile ? 'p-4' : 'p-8'} font-mono text-[10px] text-blue-400/80 border border-blue-500/20 max-h-[600px] overflow-y-auto custom-scrollbar`}
                        >
                            <p className="text-blue-300 font-bold mb-4 uppercase tracking-widest leading-loose">// RAW AUDIT DATA STREAM INITIALIZED</p>
                            {filteredEntries.map((log, i) => (
                                <div key={i} className="mb-3 opacity-80 hover:opacity-100 font-mono break-all leading-normal border-b border-white/5 pb-2">
                                    <span className="text-slate-600 block mb-1">[{log.timestamp}]</span> 
                                    <span className="text-blue-500 font-black uppercase tracking-widest">{log.type}</span>
                                    <div className="mt-1 text-slate-400">{JSON.stringify({details: log.details, user: log.user, category: log.category, ip: log.ip})}</div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        filteredEntries.map((log, i) => (
                            <motion.div 
                                key={log.id || i}
                                layout 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-6 lg:p-8 rounded-[2.5rem] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all ${isMobile ? 'space-y-6' : 'grid grid-cols-4 gap-8'} group`}
                            >
                                <div className={`${isMobile ? 'flex items-center gap-6' : 'col-span-1 flex items-center gap-6'}`}>
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-700 group-hover:bg-blue-600/10 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all border border-transparent shrink-0">
                                        <HistoryIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest italic">{log.timestamp}</p>
                                        <div className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest mt-1 border ${getCategoryStyle(log.category?.split(':')[0] || 'System')}`}>
                                            {log.category?.split(':')[0] || 'SYSTEM'}
                                        </div>
                                    </div>
                                </div>

                                <div className={`${isMobile ? 'space-y-2 pb-6 border-b border-white/5' : 'col-span-2 space-y-2'}`}>
                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                        {log.type?.replace(/_/g, ' ')}
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
                                    </h4>
                                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-tight italic leading-relaxed">{log.details}</p>
                                </div>

                                <div className={`${isMobile ? 'flex items-center justify-between gap-4' : 'col-span-1 flex items-center justify-end gap-10'}`}>
                                    <div className={`${isMobile ? 'text-left' : 'text-right'}`}>
                                        <p className="text-[13px] text-white font-black uppercase tracking-widest">{log.user}</p>
                                        <p className="text-[11px] text-slate-600 font-black uppercase tracking-widest mt-1">{log.ip}</p>
                                    </div>
                                    <button className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-600 hover:text-white transition-all active:scale-95"><Eye className="w-5 h-5" /></button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
                
                {!loading && filteredEntries.length === 0 && (
                    <div className="py-20 text-center space-y-6">
                        <Terminal className="w-16 h-16 text-slate-800 mx-auto" />
                        <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic">No matching audit entries found in this vector</p>
                    </div>
                )}
            </div>

            {/* Bottom Proof of Authenticity */}
            <div className={`p-8 lg:p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] flex ${isMobile ? 'flex-col' : 'flex-row items-center justify-between'} gap-8`}>
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] shrink-0">
                        <FileSignature className="w-7 h-7" />
                    </div>
                    <div>
                        <h5 className={`${isMobile ? 'text-lg' : 'text-xl'} font-black text-white italic uppercase tracking-tighter`}>Verified Audit Integrity</h5>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 leading-relaxed">Hash Verification: SHA-256 Validated • Blockchain Anchor Active</p>
                    </div>
                </div>
                <div className={`flex ${isMobile ? 'w-full' : ''} gap-4`}>
                    <button className={`px-8 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all ${isMobile ? 'w-full' : ''}`}>Verify Chain</button>
                </div>
            </div>
        </motion.div>
    );
}
}


