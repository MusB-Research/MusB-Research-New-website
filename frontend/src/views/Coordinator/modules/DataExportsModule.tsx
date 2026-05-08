import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Table as TableIcon, Filter, Search, ChevronDown, Database, ExternalLink } from 'lucide-react';
import { authFetch, API } from '../../../utils/auth';

interface AggregationRow {
    id: string;
    participant_id: string;
    participant_name?: string;
    study_protocol: string;
    template_id?: string;
    template_name?: string;
    questions?: Array<{ id: string; label: string; type: string; options?: any[] }>;
    date: string;
    answers: Record<string, any>;
    scores: {
        somatic: number;
        psych: number;
        urogen: number;
        total: number;
    };
    pdf_url: string | null;
}

interface DataExportsModuleProps {
    selectedStudyId?: string;
    allStudies: any[];
}

export const DataExportsModule: React.FC<DataExportsModuleProps> = ({ selectedStudyId, allStudies }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
    const [data, setData] = useState<AggregationRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStudyId, setActiveStudyId] = useState(selectedStudyId || 'all');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (activeStudyId && activeStudyId !== 'all') {
            fetchData(activeStudyId);
        }
    }, [activeStudyId]);

    const fetchData = async (studyId: string) => {
        setLoading(true);
        try {
            const res = await authFetch(`${API}/api/studies/${studyId}/aggregation_data/`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error("Failed to fetch aggregation data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = (url: string) => {
        window.open(url, '_blank');
    };

    const handleExportXLSX = () => {
        if (templateFilteredData.length === 0) return;

        // 1. Define Headers
        const baseHeaders = ["Subject ID", "Name", "Study", "Completion Date"];
        const questionHeaders = dynamicQuestions.map(q => q.label || q.id);
        const scoreHeaders = hasScores ? ["Somatic", "Psych", "Urogen", "Total"] : [];
        const headers = [...baseHeaders, ...questionHeaders, ...scoreHeaders];

        // 2. Prepare Data Rows
        const csvRows = templateFilteredData.map(row => {
            const baseData = [
                row.participant_id,
                row.participant_name || 'N/A',
                row.study_protocol,
                row.date
            ];
            
            const questionData = dynamicQuestions.map(q => {
                const val = row.answers[q.id];
                if (val === undefined || val === null) return "";
                return `"${String(val).replace(/"/g, '""')}"`;
            });

            const scoreData = hasScores ? [
                row.scores?.somatic || 0,
                row.scores?.psych || 0,
                row.scores?.urogen || 0,
                row.scores?.total || 0
            ] : [];

            return [...baseData, ...questionData, ...scoreData].join(",");
        });

        // 3. Create Blob and Download
        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `MUSB_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkPDFExport = async () => {
        const idsToExport = selectedIds.length > 0 ? selectedIds : templateFilteredData.map(r => r.id);
        
        if (idsToExport.length === 0) {
            alert("No assessments found for the current selection.");
            return;
        }

        if (!confirm(`Generate a ZIP archive for ${idsToExport.length} assessments? This will run in the background.`)) {
            return;
        }

        setIsExporting(true);
        try {
            // Use the active study ID, or the study ID from the first record if 'all' is selected
            const studyId = activeStudyId !== 'all' ? activeStudyId : templateFilteredData[0]?.study_protocol;
            
            const res = await authFetch(`${API}/api/studies/${studyId}/bulk_export_pdfs/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instance_ids: idsToExport })
            });

            if (res.ok) {
                const json = await res.json();
                alert(json.message);
                setSelectedIds([]);
            } else {
                const err = await res.json();
                alert(`Export failed: ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Bulk export error:", err);
            alert("An error occurred while initiating the bulk export.");
        } finally {
            setIsExporting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === templateFilteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(templateFilteredData.map(r => r.id));
        }
    };

    const toggleSelectRow = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleScoreSummaryExport = () => {
        if (templateFilteredData.length === 0) return;

        const headers = ["Participant ID", "Study", "Somatic", "Psych", "Urogen", "Total Score"];
        const csvRows = templateFilteredData.map(row => [
            row.participant_id,
            row.study_protocol,
            row.scores?.somatic || 0,
            row.scores?.psych || 0,
            row.scores?.urogen || 0,
            row.scores?.total || 0
        ].join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Clinical_Score_Summary_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const filteredData = data.filter(row => 
        row.participant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.participant_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Extract unique templates/instruments present in the aggregated dataset
    const templates = useMemo(() => {
        const uniqueTemplates: Record<string, string> = {};
        data.forEach(row => {
            if (row.template_id) {
                uniqueTemplates[row.template_id] = row.template_name || 'Questionnaire';
            }
        });
        return Object.entries(uniqueTemplates).map(([id, name]) => ({ id, name }));
    }, [data]);

    // Automatically select the first template when study/templates change
    useEffect(() => {
        if (templates.length > 0) {
            setSelectedTemplateId(templates[0].id);
        } else {
            setSelectedTemplateId('all');
        }
    }, [templates]);

    // Filter aggregated data based on both search query and active template filter
    const templateFilteredData = useMemo(() => {
        return filteredData.filter(row => 
            selectedTemplateId === 'all' || row.template_id === selectedTemplateId
        );
    }, [filteredData, selectedTemplateId]);

    // Retrieve dynamic questions list for the selected template
    const dynamicQuestions = useMemo(() => {
        if (selectedTemplateId === 'all') {
            const firstRowWithQuestions = filteredData.find(row => row.questions && row.questions.length > 0);
            return firstRowWithQuestions?.questions || [];
        }
        const match = filteredData.find(row => row.template_id === selectedTemplateId);
        return match?.questions || [];
    }, [filteredData, selectedTemplateId]);

    // Determine if we should display Somatic, Psych, Urogen, and Total score columns
    const hasScores = useMemo(() => {
        return templateFilteredData.some(row => 
            row.scores && (row.scores.somatic > 0 || row.scores.psych > 0 || row.scores.urogen > 0 || row.scores.total > 0)
        );
    }, [templateFilteredData]);

    // Custom high-fidelity cell rendering for premium question types
    const renderCellAnswer = (q: any, val: any, isMobileCard: boolean = false) => {
        if (val === undefined || val === null || val === '') {
            return <span className="text-slate-600 font-bold">-</span>;
        }
        
        const type = String(q.type).toLowerCase();
        
        // Emoji & Face scales
        if (type === 'emoji' || type === 'faces' || type === 'likert') {
            return (
                <span className={`inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-full text-[13px] font-black text-amber-400 ${isMobileCard ? 'px-4 py-1.5' : 'px-2.5 py-1'}`}>
                    {val}
                </span>
            );
        }
        
        // Yes / No or Boolean
        if (type === 'yesno' || val === 'Yes' || val === 'No' || val === true || val === false) {
            const isYes = val === 'Yes' || val === true || String(val).toLowerCase() === 'yes';
            return (
                <span className={`inline-flex items-center rounded-full text-[10px] font-black uppercase tracking-wider ${isMobileCard ? 'px-4 py-2' : 'px-2.5 py-1'} ${isYes ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                    {isYes ? 'Yes' : 'No'}
                </span>
            );
        }
        
        // Selection & Choices
        if (type === 'choice' || type === 'select') {
            const options = q.options || [];
            const answerIndex = options.findIndex((opt: any) => 
                (typeof opt === 'string' ? opt : opt.label) === val
            );
            
            // If we found an index, show the number, otherwise show the val (or first char)
            const displayVal = answerIndex !== -1 ? answerIndex : String(val).charAt(0).toUpperCase();
            const isNone = String(val).toLowerCase() === 'none' || displayVal === -1;

            return (
                <span 
                    title={String(val)}
                    className={`inline-flex items-center justify-center rounded-[8px] text-[10px] font-black ${isMobileCard ? 'w-10 h-10' : 'w-7 h-7'} ${isNone ? 'bg-slate-500/10 border border-slate-500/20 text-slate-500' : 'bg-blue-500/10 border border-blue-400/40 text-blue-400'} cursor-help transition-all group-hover:scale-110`}
                >
                    {displayVal}
                </span>
            );
        }
        
        // Range & Slider numeric representations
        if (type === 'number' || type === 'range' || type === 'slider') {
            return (
                <div className={`flex flex-col items-center gap-1 ${isMobileCard ? 'min-w-[80px]' : 'min-w-[50px]'}`}>
                    <span className="font-mono text-xs font-bold text-white">{val}</span>
                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 animate-pulse" 
                            style={{ width: `${Math.min(100, (Number(val) / 10) * 100)}%` }}
                        />
                    </div>
                </div>
            );
        }
        
        // Standard Text representation
        return (
            <span className={`font-bold text-slate-300 text-xs truncate ${isMobileCard ? 'max-w-none text-right' : 'max-w-[150px]'}`} title={String(val)}>
                {String(val)}
            </span>
        );
    };

    const activeStudy = allStudies.find(s => s.protocol_id === activeStudyId || s.id === activeStudyId);

    return (
        <div className={`space-y-2 ${isMobile ? 'p-1.5' : 'p-2'}`}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h2 className="text-base md:text-lg font-black text-white italic uppercase tracking-tighter shrink-0 flex items-center flex-wrap gap-2 leading-none">
                        Data <span className="text-blue-400">& Exports</span>
                        <div className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                            <span className="text-[7.5px] font-black text-blue-400 uppercase tracking-widest italic">Aggregation Engine</span>
                        </div>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportXLSX}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[8.5px] font-black uppercase tracking-widest italic shadow-lg"
                    >
                        <Download className="w-3 h-3" />
                        Export Master XLSX
                    </button>
                </div>
            </div>

            {/* Study Selector & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 bg-[#0B101B]/50 p-1.5 rounded-lg border border-white/5 shadow-xl">
                <div className="lg:col-span-4 flex items-center gap-1.5 px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <Database className="w-2.5 h-2.5 text-blue-400" />
                    <select 
                        value={activeStudyId}
                        onChange={(e) => setActiveStudyId(e.target.value)}
                        className="bg-transparent text-white text-[8.5px] font-black uppercase tracking-widest outline-none flex-1 appearance-none cursor-pointer"
                    >
                        <option value="all">All Active Studies</option>
                        {allStudies.map(s => (
                            <option key={s.id} value={s.protocol_id || s.id}>{s.protocol_id} - {s.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                </div>

                {templates.length > 0 && (
                    <div className="lg:col-span-4 flex items-center gap-1.5 px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
                        <FileText className="w-2.5 h-2.5 text-emerald-400" />
                        <select 
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="bg-transparent text-white text-[8.5px] font-black uppercase tracking-widest outline-none flex-1 appearance-none cursor-pointer"
                        >
                            <option value="all">All Instruments</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                    </div>
                )}

                <div className="lg:col-span-4 flex items-center gap-1.5 px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
                    <Search className="w-2.5 h-2.5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="SEARCH NAME OR ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-white text-[8.5px] font-black uppercase tracking-widest outline-none flex-1"
                    />
                </div>
            </div>

            {/* Main Aggregation Sheet */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <h3 className="text-[9px] md:text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase italic">
                            Aggregation Sheet — {activeStudy?.protocol_id || 'Global View'}
                        </h3>
                    </div>
                    {!isMobile && (
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">
                            {templateFilteredData.length} Records found
                        </span>
                    )}
                </div>

                {isMobile ? (
                    /* Mobile Card View */
                    <div className="space-y-4">
                        {loading ? (
                            <div className="p-12 text-center bg-[#0B101B] border border-white/5 rounded-[1.5rem]">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Analyzing Clinical Data...</p>
                                </div>
                            </div>
                        ) : templateFilteredData.length === 0 ? (
                            <div className="p-12 text-center bg-[#0B101B] border border-white/5 rounded-[1.5rem]">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No responses found for this study</p>
                            </div>
                        ) : (
                            templateFilteredData.map((row) => (
                                <motion.div 
                                    key={row.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#0B101B] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-xl p-5 space-y-4"
                                >
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div>
                                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest italic mb-0.5">{row.participant_id}</p>
                                            <h4 className="text-[11px] font-black text-white italic uppercase leading-tight">{row.participant_name || 'N/A'}</h4>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{row.study_protocol}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic mb-0.5">Visit Date</p>
                                            <p className="text-[10px] font-bold text-slate-300">{row.date}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {dynamicQuestions.map((q, idx) => (
                                            <div key={q.id} className="flex items-start justify-between gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-blue-500 font-black italic">Q{idx + 1}</span>
                                                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest italic leading-tight max-w-[150px]">{q.label}</span>
                                                </div>
                                                <div className="flex-1 flex justify-end">
                                                    {renderCellAnswer(q, row.answers[q.id], true)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {hasScores && (
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                                <p className="text-[7px] text-emerald-500/60 font-black uppercase tracking-widest mb-0.5">Somatic</p>
                                                <p className="text-xs font-black text-emerald-400">{row.scores?.somatic ?? 0}</p>
                                            </div>
                                            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                                                <p className="text-[7px] text-blue-500/60 font-black uppercase tracking-widest mb-0.5">Psych</p>
                                                <p className="text-xs font-black text-blue-400">{row.scores?.psych ?? 0}</p>
                                            </div>
                                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
                                                <p className="text-[7px] text-rose-500/60 font-black uppercase tracking-widest mb-0.5">Urogen</p>
                                                <p className="text-xs font-black text-rose-400">{row.scores?.urogen ?? 0}</p>
                                            </div>
                                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                                                <p className="text-[7px] text-amber-500/60 font-black uppercase tracking-widest mb-0.5">Total Score</p>
                                                <p className="text-xs font-black text-amber-400">{row.scores?.total ?? 0}</p>
                                            </div>
                                        </div>
                                    )}

                                    {row.pdf_url && (
                                        <button 
                                            onClick={() => handleDownloadPDF(row.pdf_url!)}
                                            className="w-full flex items-center justify-center gap-2.5 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest italic"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            View Source Instrument
                                        </button>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                ) : (
                    /* Tablet & Laptop Table View */
                    <div className="bg-[#0B101B] border border-white/5 rounded-xl overflow-hidden shadow-xl relative">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table 
                                className="w-full text-left border-collapse table-fixed"
                                style={{ minWidth: `${Math.max(1000, 320 + dynamicQuestions.length * 50)}px` }}
                            >
                                <thead>
                                    <tr className="text-[8px] font-black uppercase tracking-widest italic">
                                        <th className="sticky left-0 z-20 px-3 py-2.5 bg-[#e6fcf5] text-[#087f5b] border-r border-[#c3fae8] w-[40px] text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={templateFilteredData.length > 0 && selectedIds.length === templateFilteredData.length}
                                                onChange={toggleSelectAll}
                                                className="w-3 h-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-white/10"
                                            />
                                        </th>
                                        <th className="sticky left-[40px] z-10 px-3 py-2.5 bg-[#e6fcf5] text-[#087f5b] border-r border-[#c3fae8] w-[140px]">Participant ID</th>
                                        <th className="px-3 py-2.5 bg-[#e6fcf5] text-[#087f5b] border-r border-[#c3fae8] w-[100px]">Study</th>
                                        <th className="px-3 py-2.5 bg-[#e6fcf5] text-[#087f5b] border-r border-[#c3fae8] w-[110px]">Completion Date</th>
                                        {dynamicQuestions.map((q, idx) => (
                                            <th key={q.id} className="px-1 py-2.5 bg-[#e6fcf5] text-[#087f5b] border-r border-[#c3fae8] text-center w-[45px] truncate" title={q.label}>
                                                Q{idx + 1}
                                            </th>
                                        ))}
                                        {hasScores && (
                                            <>
                                                <th className="px-3 py-2.5 border-r border-white/10 bg-[#065f46] text-white text-center w-[60px] text-[7px] tracking-tighter">Somatic</th>
                                                <th className="px-3 py-2.5 border-r border-white/10 bg-[#1e40af] text-white text-center w-[60px] text-[7px] tracking-tighter">Psych</th>
                                                <th className="px-3 py-2.5 border-r border-white/10 bg-[#9a3412] text-white text-center w-[60px] text-[7px] tracking-tighter">Urogen</th>
                                                <th className="px-3 py-2.5 border-r border-white/10 bg-[#1e293b] text-white text-center w-[65px] text-[7px] tracking-tighter">Total</th>
                                            </>
                                        )}
                                        <th className="px-3 py-2.5 bg-[#e6fcf5] text-[#087f5b] text-right w-[60px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={20} className="px-5 py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Assembling Clinical Data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : templateFilteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={20} className="px-5 py-24 text-center">
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No matching records detected in clinical repository</p>
                                            </td>
                                        </tr>
                                    ) :                                         templateFilteredData.map((row) => (
                                            <tr key={row.id} className={`border-b border-white/5 hover:bg-white/[0.015] transition-colors group ${selectedIds.includes(row.id) ? 'bg-blue-500/5' : ''}`}>
                                                <td className="sticky left-0 z-20 px-3 py-2 border-r border-white/5 bg-[#0B101B]/95 group-hover:bg-[#161C27] text-center shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedIds.includes(row.id)}
                                                        onChange={() => toggleSelectRow(row.id)}
                                                        className="w-3 h-3 rounded border-white/10 text-blue-500 focus:ring-blue-500 bg-white/5"
                                                    />
                                                </td>
                                                <td className="sticky left-[40px] z-10 px-3 py-2 border-r border-white/5 bg-[#0B101B]/95 group-hover:bg-[#161C27] transition-all">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-blue-400 text-[10px] leading-tight">{row.participant_id}</span>
                                                        <span className="font-bold text-slate-500 text-[8px] uppercase tracking-wider truncate max-w-[120px]">{row.participant_name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-white/5 font-black text-white uppercase text-[9px] text-center">{row.study_protocol}</td>
                                                <td className="px-3 py-2 border-r border-white/5 text-slate-400 text-[9px] font-bold italic text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white font-black">{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        <span className="text-[7px] text-slate-600 uppercase tracking-tighter">Validated Clinical Record</span>
                                                    </div>
                                                </td>
                                                
                                                {dynamicQuestions.map((q) => (
                                                    <td key={q.id} className="px-1 py-2 border-r border-white/5 text-center text-[9px] font-black text-white">
                                                        {renderCellAnswer(q, row.answers[q.id])}
                                                    </td>
                                                ))}
 
                                                {hasScores && (
                                                    <>
                                                        <td className="px-3 py-2 border-r border-white/5 bg-[#065f46]/10 text-center font-black text-white text-[11px]">{row.scores?.somatic ?? 0}</td>
                                                        <td className="px-3 py-2 border-r border-white/5 bg-[#1e40af]/10 text-center font-black text-white text-[11px]">{row.scores?.psych ?? 0}</td>
                                                        <td className="px-3 py-2 border-r border-white/5 bg-[#9a3412]/10 text-center font-black text-white text-[11px]">{row.scores?.urogen ?? 0}</td>
                                                        <td className="px-3 py-2 border-r border-white/5 bg-white/5 text-center font-black text-white text-[11px]">{row.scores?.total ?? 0}</td>
                                                    </>
                                                )}
                                                
                                                <td className="px-3 py-2 text-right">
                                                    {row.pdf_url && (
                                                        <button 
                                                            onClick={() => handleDownloadPDF(row.pdf_url!)}
                                                            className="p-1.5 bg-white/5 border border-white/10 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-all shadow-md active:scale-90"
                                                            title="Download Signed PDF"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Cross-Study Aggregation Footer */}
            <div className="space-y-3 pt-4 border-t border-white/5 mt-4">
                <div className="space-y-0.5">
                    <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase italic">CROSS-STUDY AGGREGATION</h3>
                    <p className="text-[9px] text-slate-500 font-bold italic">All studies using MRS — combined sheet</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {allStudies.slice(0, 3).map((s, i) => (
                        <div key={s.id} className={`px-3 py-1.5 rounded-full border flex items-center gap-2 transition-all ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : i === 1 ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-white/5 border-white/10 text-slate-500 opacity-60'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest italic">
                                {s.protocol_id} — {s.enrollment_count || 0} participants {i === 1 ? '(upcoming)' : i === 2 ? '— MRS not used' : ''}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button 
                        onClick={handleExportXLSX}
                        className="px-6 py-2.5 bg-[#1a1f2e] border border-white/10 rounded-xl text-white hover:bg-[#252b3d] hover:border-white/20 transition-all text-[11px] font-black flex items-center gap-3 shadow-xl"
                    >
                        Export Excel <ExternalLink className="w-4 h-4 text-slate-400" />
                    </button>
                    <button 
                        onClick={handleScoreSummaryExport}
                        className="px-6 py-2.5 bg-[#1a1f2e] border border-white/10 rounded-xl text-white hover:bg-[#252b3d] hover:border-white/20 transition-all text-[11px] font-black flex items-center gap-3 shadow-xl"
                    >
                        Score summary <ExternalLink className="w-4 h-4 text-slate-400" />
                    </button>
                    <button 
                        onClick={handleBulkPDFExport}
                        disabled={isExporting}
                        className={`px-6 py-2.5 bg-[#1a1f2e] border border-white/10 rounded-xl text-white hover:bg-[#252b3d] hover:border-white/20 transition-all text-[11px] font-black flex items-center gap-3 shadow-xl ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isExporting ? 'Preparing ZIP...' : 'Download PDFs (ZIP)'} <ExternalLink className={`w-4 h-4 text-slate-400 ${isExporting ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};
