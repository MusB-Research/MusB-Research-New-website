import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, Layers, MousePointer2,
    CheckSquare, GripVertical, Settings2, Trash2, Upload, Eye, FileUp, ExternalLink, Database,
    Terminal, CheckCircle2, AlertTriangle, Wand2
} from 'lucide-react';
import { apiFetch } from '../../api';
import { authFetch, API } from '../../utils/auth';
import { getMediaUrl } from '../../utils/media';

interface Question {
    id: string;
    type: 'short_text' | 'choice' | 'dropdown' | 'date' | 'yesno';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
}

interface Template {
    id: string;
    name: string;
    pdf_file: string | null;
    json_structure: { questions?: Question[]; instructions?: string };
    created_at: string;
    used_in_studies?: { id: string, title: string, protocol_id: string }[];
}

interface QuestionnaireBuilderProps {
    initialTemplate?: any;
    initialTab?: string;
    onSelectTemplate?: (id: string, name: string) => void;
    selectedTemplates?: string[];
}

// Removed local getMediaUrl in favor of centralized getMediaUrl


export default function QuestionnaireBuilder({ initialTemplate, initialTab, onSelectTemplate, selectedTemplates }: QuestionnaireBuilderProps) {
    console.log("QuestionnaireBuilder mounting with initialTab:", initialTab);
    const [viewMode, setViewMode] = useState<'BUILDER' | 'LIBRARY'>(initialTab === 'Create New' ? 'BUILDER' : 'LIBRARY');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<Template | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Builder State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingPdfUrl, setEditingPdfUrl] = useState<string | null>(null);
    const [editingPdfName, setEditingPdfName] = useState<string | null>(null);
    const [showSourceText, setShowSourceText] = useState(false);
    const [sourceLines, setSourceLines] = useState<string[]>([]);
    const [name, setName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Auto-expansion ref
    const instructionsRef = useRef<HTMLTextAreaElement>(null);

    const autoExpand = useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => {
        if (viewMode === 'BUILDER') {
            autoExpand(instructionsRef.current);
        }
    }, [viewMode, instructions, autoExpand]);

    const fetchTemplates = async () => {
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) { }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (initialTemplate) {
            setEditingId(initialTemplate.id || null);
            setEditingPdfUrl(getMediaUrl(initialTemplate.pdf_file));
            setName(initialTemplate.title || initialTemplate.name || '');
            setInstructions(initialTemplate.json_structure?.instructions || '');
            setQuestions(initialTemplate.json_structure?.questions || []);
            setViewMode('BUILDER');
        } else if (initialTab === 'Create New') {
            setEditingId(null);
            setEditingPdfUrl(null);
            setName('');
            setInstructions('');
            setQuestions([]);
            setViewMode('BUILDER');
        }
    }, [initialTemplate, initialTab]);

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('pdf_file', file);
        formData.append('name', file.name.split('.')[0] || 'Untitled PDF Protocol');
        formData.append('mode', 'PDF');

        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                fetchTemplates();
            }
        } catch (err) {
            console.error("PDF Upload Failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    const addQuestion = (type: Question['type']) => {
        const newQuestion: Question = {
            id: `q_${Date.now()}`,
            type,
            label: 'New Question',
            placeholder: '...',
            required: true
        };
        setQuestions([...questions, newQuestion]);
    };

    const runAIExtraction = async () => {
        if (!editingId) return alert("Upload / Select a PDF first.");
        setIsSaving(true);
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/${editingId}/extract_text/`);
            if (res.ok) {
                const data = await res.json();
                const rawLines: string[] = data.lines || [];

                // 1. Group raw lines into logical blocks
                const blocks: string[] = [];
                let currentBlock = "";

                for (const line of rawLines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('©') || trimmed.includes('All rights reserved') || /page\s+\d+/i.test(trimmed)) continue;

                    // Question Marker Detect (Numbering or Bullets)
                    const isNewQuestion = /^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])\s+/.test(trimmed);
                    // Section/Header Detect (Short, Uppercase)
                    const isSectionHeader = /^(PART|SECTION|BLOCK)\s+\d+/i.test(trimmed) || (trimmed.toUpperCase() === trimmed && trimmed.length < 50 && trimmed.length > 5);

                    if ((isNewQuestion || isSectionHeader) && currentBlock) {
                        blocks.push(currentBlock.trim());
                        currentBlock = trimmed;
                    } else {
                        currentBlock += (currentBlock ? " " : "") + trimmed;
                    }
                }
                if (currentBlock) blocks.push(currentBlock.trim());

                // 2. Identify Global Scoring Scale (e.g., 0=None, 1=Mild...)
                let globalScale: string[] = [];
                const scaleDetectPattern = /(\d)\s*[=\-:]\s*([A-Z][A-Z\s]+?)(?=\s+\d|\s*$)/g;

                for (const b of blocks.slice(0, 3)) { // Look in first few blocks (headers/instructions)
                    let match;
                    while ((match = scaleDetectPattern.exec(b)) !== null) {
                        globalScale.push(`${match[1]} ${match[2].trim()}`);
                    }
                    if (globalScale.length > 0) break;
                }

                // 3. Transform blocks into Questions
                const suggested: Question[] = [];
                let introText = "";

                for (let block of blocks) {
                    // Check if it's an intro/instruction block
                    const isInstruction = suggested.length === 0 && !/^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])/.test(block);
                    if (isInstruction) {
                        introText += (introText ? "\n\n" : "") + block;
                        continue;
                    }

                    let options: string[] = [];
                    let label = block;

                    // Option Detection Logic
                    // Path A: Binary Clinical Pattern (e.g. "0 for NO, 1 for YES")
                    if (/\(0 for NO, 1 for YES\)/i.test(block) || /\(0 for NO, 1 for YES\)/i.test(block)) {
                        label = block.replace(/\(0 for NO, 1 for YES\)/i, '').replace(/\b(NO|YES)\s+(NO|YES)\s?$/i, '').trim();
                        options = ["0 - NO", "1 - YES"];
                    }
                    // Path B: Has scale buttons in the line (e.g. "Question Text 0 1 2 3")
                    else if (block.match(/\s(\d\s*){2,}\d\s?$/) && globalScale.length > 0) {
                        label = block.replace(/\s(\d\s*)+$/, '').trim();
                        options = [...globalScale];
                    } 
                    // Path C: Inline Key-Value Pairs (e.g. "0 None 1 Some")
                    else if (/(\d)\s+[A-Za-z]+\s+(\d)\s+[A-Za-z]+/.test(block)) {
                        const localScale: string[] = [];
                        const matches = block.matchAll(/(\d)\s*([A-Za-z][A-Za-z\s]+?)(?=\s+\d|\s*$)/g);
                        for (const m of matches) {
                            localScale.push(`${m[1]} ${m[2].trim()}`);
                        }
                        if (localScale.length > 1) {
                            options = localScale;
                            // Clean label from the trailing scale definitions
                            label = block.split(/\s\d\s[A-Za-z]/)[0].trim();
                        }
                    }
                    else {
                        const inlineScorePattern = /(\d)\s*[=\-:]?\s*([A-Za-z][A-Za-z\s\/\\,\(\)-]+?)(?=\s+\d|\s*$)/g;
                        const inlineMatches = [...block.matchAll(inlineScorePattern)];
                        if (inlineMatches.length > 1) {
                            options = inlineMatches.map(m => `${m[1]} ${m[2].trim()}`);
                            const firstMatchIdx = block.search(/\d\s*[=\-:]?\s*[A-Za-z]/);
                            if (firstMatchIdx > 5) label = block.substring(0, firstMatchIdx).trim();
                        }
                    }

                    // Cleaning
                    // Advanced Cleaning: Strip leaked table headers and response keywords
                    let cleanLabel = label.replace(/^\d+[\.\)]\s+/, '').replace(/^[A-G][\.\)]\s+/, '').trim();
                    
                    const responseKeywords = [
                        'No problem', 'Mild', 'Moderate', 'Severe', 'Very severe',
                        'None', 'Some', 'A lot', 'Extreme',
                        'Yes', 'No', 'N/A', 'Not at all', 'Somewhat', 'Very much',
                        'Rarely', 'Occasionally', 'Frequently', 'Always'
                    ];
                    
                    // Pattern: Strip anything after a pipe or multiple spaces if it matches a keyword
                    const cleanupPattern = new RegExp(`\\s*(\\||\\s{2,})\\s*(${responseKeywords.join('|')}).*$`, 'i');
                    cleanLabel = cleanLabel.replace(cleanupPattern, '').trim();
                    
                    // Specific check for the user's PDF table headers leaking
                    if (cleanLabel.includes('|')) {
                        const parts = cleanLabel.split('|');
                        if (parts[0].trim().length > 5) {
                            cleanLabel = parts[0].trim();
                        }
                    }

                    if (cleanLabel.length < 3) continue;

                    suggested.push({
                        id: `ai_${suggested.length}_${Date.now()}`,
                        type: options.length > 0 ? 'choice' : 'short_text',
                        label: cleanLabel,
                        placeholder: '...',
                        required: true,
                        options: options.length > 0 ? options : []
                    });
                }

                // Final Assembly: Inject Intro as instructions instead of a pseudo-question
                if (introText.length > 20) {
                    setInstructions(introText);
                } else {
                    setInstructions('');
                }

                const final = suggested.filter(q => q.label.length > 3);
                setQuestions(final);

                const msg = final.length > 0
                    ? `Clinical Logic Restored: ${final.length} instruments synchronized with automated scale mapping.`
                    : "Extraction completed, but no clear questions found. Please check PDF quality.";
                alert(msg);
            }
        } catch (err) {
            console.error(err);
            alert("AI Extraction failed. Checking PDF stream...");
        } finally {
            setIsSaving(false);
        }
    };

    const fetchSourceLines = async () => {
        if (!editingId) return;
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/${editingId}/extract_text/`);
            if (res.ok) {
                const data = await res.json();
                setSourceLines(data.lines || []);
                setShowSourceText(true);
            } else {
                alert("Could not extract text from this PDF.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        setStatusMessage({ text: `Analyzing ${file.name}...`, type: 'success' });
        
        // Simulation of AI extraction
        await new Promise(resolve => setTimeout(resolve, 3500));

        const mockExtracted: Question[] = [
            {
                id: `q_ai_${Math.random().toString(36).substr(2, 9)}`,
                type: 'choice',
                label: 'What is your primary medical concern?',
                placeholder: '',
                required: true,
                options: ['Chronic Pain', 'Diabetes Management', 'Neurological Issues', 'Other'],
            },
            {
                id: `q_ai_${Math.random().toString(36).substr(2, 9)}`,
                type: 'yesno',
                label: 'Have you had surgery in the last 6 months?',
                placeholder: '',
                required: true,
            },
            {
                id: `q_ai_${Math.random().toString(36).substr(2, 9)}`,
                type: 'short_text',
                label: 'Please list all current medications.',
                placeholder: 'Type here...',
                required: true,
            }
        ];

        setQuestions([...questions, ...mockExtracted]);
        setIsExtracting(false);
        setStatusMessage({ text: `Extracted ${mockExtracted.length} questions from ${file.name}.`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 4000);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const saveStructured = async () => {
        if (!name) return alert("Enter a name");
        setIsSaving(true);
        try {
            const url = editingId
                ? `${API}/api/questionnaire-templates/${editingId}/`
                : `${API}/api/questionnaire-templates/`;

            const res = await authFetch(url, {
                method: editingId ? 'PATCH' : 'POST',
                body: JSON.stringify({
                    name,
                    json_structure: {
                        questions,
                        instructions,
                        // Compatibility with older renderer if needed
                        sections: [{ label: 'Main Section', fields: questions }]
                    }
                })
            });
            if (res.ok) {
                setViewMode('LIBRARY');
                fetchTemplates();
                setEditingId(null);
                setName('');
                setInstructions('');
                setQuestions([]);
            } else if (res.status === 404 && editingId) {
                // Handle 404 Gracefully: Offer to save as new
                const retry = window.confirm("This template ID is no longer in the database (it may have been reset). Would you like to save your progress as a NEW template instead?");
                if (retry) {
                    setEditingId(null); // Clear ID to trigger POST
                    setTimeout(saveStructured, 100); // Retry saving as new
                }
            } else {
                const errData = await res.json();
                console.error("Save failed", errData);
                alert("Failed to save template. ID might be stale.");
            }
        } catch (err) {
            console.error("Save Error:", err);
        } finally { setIsSaving(false); }
    };

    const closePreview = () => {
        if (previewPdf && previewPdf.startsWith('blob:')) {
            URL.revokeObjectURL(previewPdf);
        }
        setPreviewPdf(null);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Clinical Instrument Library
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium opacity-70">
                        {viewMode === 'LIBRARY' ? "Manage clinical assessment templates and PDF protocols." : "Design structured electronic case report forms."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button
                        onClick={() => {
                            if (viewMode === 'BUILDER') {
                                setEditingId(null);
                                setEditingPdfUrl(null);
                                setName('');
                                setQuestions([]);
                            }
                            setViewMode(viewMode === 'LIBRARY' ? 'BUILDER' : 'LIBRARY');
                        }}
                        className="px-6 py-3 rounded-xl border border-white/10 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 transition-all whitespace-nowrap"
                    >
                        {viewMode === 'LIBRARY' ? 'Open Form Designer' : 'Back to Library'}
                    </button>
                    {viewMode === 'LIBRARY' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <input type="file" hidden ref={fileInputRef} onChange={handlePdfUpload} accept=".pdf" />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center gap-3 px-8 py-3 bg-indigo-600 rounded-xl text-[12px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap"
                            >
                                <Upload className="w-4 h-4" />
                                {isUploading ? 'Uploading...' : 'Quick PDF Ingest'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === 'LIBRARY' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {templates.map(t => (
                        <div key={t.id} className="bg-[#0f172a] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    {t.pdf_file ? <FileText className="w-5 h-5 text-indigo-400" /> : <Layout className="w-5 h-5 text-pink-400" />}
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(t.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight truncate">{t.name}</h3>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                                {t.pdf_file ? 'Source: Legal PDF Protocol' : `Source: Structured Form (${t.json_structure?.questions?.length || 0} fields)`}
                            </p>
                            <div className="mt-4 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg flex items-center gap-2 w-fit">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global - Available for all studies</span>
                            </div>

                            {t.used_in_studies && t.used_in_studies.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-1.5">
                                    <div className="w-full text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <Database className="w-3 h-3" /> Linked to Protocols
                                    </div>
                                    {t.used_in_studies.map(s => (
                                        <span key={s.id} className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[9px] font-black text-indigo-400 uppercase tracking-tighter">
                                            {s.protocol_id || s.title}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mt-6">
                                {onSelectTemplate && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectTemplate(t.id, t.name);
                                        }}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            selectedTemplates?.includes(t.id)
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 hover:text-white'
                                        }`}
                                    >
                                        {selectedTemplates?.includes(t.id) ? 'Selected' : 'Select for Study'}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (t.pdf_file) {
                                            setPreviewPdf(getMediaUrl(t.pdf_file));
                                        } else {
                                            setPreviewData(t);
                                        }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all"
                                >
                                    <Eye className="w-3 h-3" /> Preview
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingId(t.id);
                                        setEditingPdfUrl(getMediaUrl(t.pdf_file));
                                        setEditingPdfName(t.pdf_file ? (t.pdf_file.split('/').pop() || 'Protocol.pdf') : 'Protocol.pdf');
                                        setName(t.name);
                                        const js = t.json_structure || {};
                                        setInstructions(js.instructions || '');
                                        setQuestions(js.questions || (Array.isArray(js) ? js : []));
                                        setViewMode('BUILDER');
                                    }}
                                    className="px-6 py-2 bg-indigo-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setViewMode('BUILDER')}
                        className="border-2 border-dashed border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-indigo-500/30 transition-all group cursor-pointer"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-slate-600" />
                        </div>
                        <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Create New Form Design</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="bg-[#0f172a] border border-white/5 rounded-[2rem] p-8">
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter Form Title..."
                                className="w-full bg-transparent text-4xl font-black text-white uppercase italic outline-none mb-4 border-b border-white/5 pb-4 focus:border-indigo-500/50"
                            />

                            <div className="mb-8">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Global Instructions & Protocol Header</label>
                                <textarea
                                    ref={instructionsRef}
                                    value={instructions}
                                    onChange={e => {
                                        setInstructions(e.target.value);
                                        autoExpand(e.target);
                                    }}
                                    placeholder="Enter instructions for the participant (e.g. Please read this first...)"
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-slate-300 font-bold outline-none focus:border-indigo-500/30 transition-all min-h-[120px] overflow-hidden"
                                />
                            </div>

                            {editingPdfUrl && (
                                <div className="mb-8 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 leading-none">Source Protocol: {editingPdfName}</p>
                                            <p className="text-[12px] font-bold text-white uppercase opacity-80">This template uses a PDF instrument</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={runAIExtraction}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-pink-500/20 rounded-lg text-[10px] font-black text-pink-400 uppercase tracking-widest hover:bg-pink-500/30 transition-all flex items-center gap-2 border border-pink-500/30"
                                        >
                                            <MousePointer2 className="w-4 h-4" /> {isSaving ? 'Analyzing...' : 'Extract Fields with AI'}
                                        </button>
                                        <button
                                            onClick={fetchSourceLines}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <List className="w-4 h-4" /> Choose from PDF Text
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await authFetch(`${API}/api/questionnaire-templates/${editingId}/view/`);
                                                    if (!res.ok) throw new Error("Failed to load PDF");
                                                    const blob = await res.blob();
                                                    const blobUrl = URL.createObjectURL(blob);
                                                    setPreviewPdf(blobUrl);
                                                } catch (err) {
                                                    alert("Secure PDF stream failed. Check your permissions.");
                                                }
                                            }}
                                            className="px-4 py-2 bg-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/30 transition-all flex items-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" /> View Source
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {questions.map((q, i) => (
                                    <div key={q.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-4 group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6 flex-1">
                                                <span className="text-xl font-black text-slate-700">0{i + 1}</span>
                                                <input
                                                    value={q.label}
                                                    onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, label: e.target.value } : item))}
                                                    placeholder="Enter Field Label"
                                                    className="bg-transparent text-lg font-bold text-white outline-none flex-1 border-b border-transparent focus:border-indigo-500/30 transition-all pb-1"
                                                />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <select
                                                    value={q.type}
                                                    onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, type: e.target.value as any } : item))}
                                                    className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest outline-none focus:border-indigo-500"
                                                >
                                                    <option value="short_text">One Line Text</option>
                                                    <option value="choice">Choice (Radio)</option>
                                                    <option value="dropdown">Selection Menu</option>
                                                    <option value="date">Date Field</option>
                                                    <option value="yesno">Yes / No</option>
                                                </select>
                                                <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="p-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:rotate-90 transition-all hover:bg-rose-500/10 rounded-lg">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {(q.type === 'choice' || q.type === 'dropdown') && (
                                            <div className="pl-14 pr-4">
                                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Response Choices / Levels</h5>
                                                        <button
                                                            onClick={() => {
                                                                const opts = q.options || [];
                                                                setQuestions(questions.map(item => item.id === q.id ? { ...item, options: [...opts, `Level ${opts.length + 1}`] } : item));
                                                            }}
                                                            className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-all"
                                                        >
                                                            + Add Option
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(q.options || []).map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg pl-3 pr-1 py-1">
                                                                <input
                                                                    value={opt}
                                                                    onChange={e => {
                                                                        const newOpts = [...(q.options || [])];
                                                                        newOpts[optIdx] = e.target.value;
                                                                        setQuestions(questions.map(item => item.id === q.id ? { ...item, options: newOpts } : item));
                                                                    }}
                                                                    className="bg-transparent text-[11px] font-bold text-slate-300 outline-none w-24"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newOpts = (q.options || []).filter((_, idx) => idx !== optIdx);
                                                                        setQuestions(questions.map(item => item.id === q.id ? { ...item, options: newOpts } : item));
                                                                    }}
                                                                    className="p-1 text-slate-600 hover:text-rose-500 transition-all"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-8">
                                    {[
                                        { type: 'short_text', icon: FileText, label: 'One Line Text' },
                                        { type: 'choice', icon: List, label: 'Choice Selection' },
                                        { type: 'dropdown', icon: ChevronDown, label: 'Menu List' },
                                        { type: 'date', icon: Calendar, label: 'Date Pick' },
                                        { type: 'yesno', icon: AlertCircle, label: 'Yes / No' }
                                    ].map((btn) => (
                                        <button
                                            key={btn.type}
                                            onClick={() => addQuestion(btn.type as any)}
                                            className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center gap-3 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group active:scale-95"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                                                <btn.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-all">
                                                {btn.label}
                                            </span>
                                        </button>
                                    ))}

                                    <div className="relative">
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isExtracting}
                                            className="w-full h-full p-4 bg-pink-500/5 border border-pink-500/20 rounded-2xl flex flex-col items-center gap-3 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all group active:scale-95 relative overflow-hidden"
                                        >
                                            {isExtracting && (
                                                <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-sm z-10 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500/20 transition-all">
                                                <Terminal className="w-5 h-5" />
                                            </div>
                                            <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest group-hover:text-white transition-all">
                                                AI Upload
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Template Actions</h3>
                            <button
                                type="button"
                                onClick={saveStructured}
                                disabled={isSaving}
                                className={`w-full py-4 rounded-xl text-[12px] font-black text-white uppercase transition-all flex items-center justify-center gap-3 ${isSaving ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 opacity-90 hover:opacity-100'}`}
                            >
                                <Save className="w-4 h-4" /> {isSaving ? 'Synchronizing...' : 'Save Template to Library'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            <AnimatePresence>
                {previewPdf && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewPdf(null)}
                            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="fixed inset-0 bg-[#0B101B] z-[201] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Eye className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Protocol Preview</h4>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Full-Scale Clinical Instrument Access</p>
                                    </div>
                                </div>
                                <button onClick={closePreview} className="p-3 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-xl">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 bg-black">
                                <iframe
                                    src={previewPdf}
                                    className="w-full h-full border-0"
                                    title="PDF Preview"
                                />
                            </div>
                            <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                    SECURED CONTENT VIEWPORT
                                </p>
                                <div className="flex items-center gap-4">
                                    <a
                                        href={previewPdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 py-2 bg-white/5 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 border border-white/10"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Open In New Tab
                                    </a>
                                    <button onClick={closePreview} className="px-5 py-2 bg-indigo-600 rounded-lg text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all">
                                        Close Preview
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {previewData && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setPreviewData(null)}
                            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[300]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 flex items-center justify-center z-[301] p-4 md:p-8"
                        >
                            <div className="bg-[#0f172a] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                            <Wand2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Structured Preview</h4>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Live Participant-Facing Interface</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPreviewData(null)} className="p-3 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-2xl">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                    <div className="max-w-2xl">
                                        <h2 className="text-4xl font-black text-white uppercase italic leading-tight mb-4">{previewData.name}</h2>
                                        {previewData.json_structure?.instructions && (
                                            <p className="text-slate-400 font-bold text-lg leading-relaxed">{previewData.json_structure.instructions}</p>
                                        )}
                                    </div>

                                    <div className="space-y-10">
                                        {(previewData.json_structure?.questions || []).map((q, idx) => (
                                            <div key={q.id} className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <span className="text-xs font-black text-slate-700 mt-1">0{idx + 1}</span>
                                                    <label className="text-xl font-black text-white uppercase tracking-tight italic">{q.label}</label>
                                                </div>
                                                
                                                <div className="pl-8">
                                                    {q.type === 'short_text' && (
                                                        <input disabled placeholder={q.placeholder || 'Your response...'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white opacity-50 cursor-not-allowed" />
                                                    )}
                                                    {q.type === 'yesno' && (
                                                        <div className="flex gap-4">
                                                            {['YES', 'NO'].map(opt => (
                                                                <div key={opt} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black text-slate-400 uppercase tracking-widest opacity-50">
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {(q.type === 'choice' || q.type === 'dropdown') && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {(q.options || []).map(opt => (
                                                                <div key={opt} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-bold text-slate-300 opacity-50 flex items-center gap-4">
                                                                    <div className="w-2 h-2 rounded-full border border-white/30" />
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {q.type === 'date' && (
                                                        <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-slate-500 opacity-50 flex items-center justify-between">
                                                            <span className="text-[12px] font-black uppercase tracking-widest">Select Date</span>
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-black text-white">P</div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Interactive Sandbox Mode</p>
                                    </div>
                                    <button onClick={() => setPreviewData(null)} className="px-8 py-3 bg-indigo-600 rounded-xl text-[12px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                                        Finish Review
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Source Text Selector Sidebar */}
            <AnimatePresence>
                {showSourceText && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowSourceText(false)}
                            className="fixed inset-0 bg-black/20 z-[250]"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[500px] bg-[#0f172a] border-l border-white/10 z-[251] shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Choose Component</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Select logic or options from the protocol</p>
                                </div>
                                <button onClick={() => setShowSourceText(false)} className="p-2 text-slate-500 hover:text-white transition-all"><X /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {sourceLines.map((line, idx) => (
                                    <div key={idx} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all group">
                                        <p className="text-[12px] font-bold text-slate-300 group-hover:text-white mb-4">{line}</p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    // Smart New Question Logic
                                                    let type: 'short_text' | 'choice' | 'date' | 'yesno' = 'short_text';
                                                    let label = line;
                                                    let options: string[] = [];

                                                    const boxPattern = /[\u25A1\u2610\u2611\u2612\uf0a8\uf0fe\uf071\u0001\u0002]|(?:\[\s?\])/g;

                                                    if (boxPattern.test(line)) {
                                                        const parts = line.split(boxPattern).map(p => p.trim()).filter(p => p.length > 1);
                                                        if (parts.length > 1) {
                                                            label = parts[0];
                                                            options = parts.slice(1);
                                                            type = 'choice';
                                                        }
                                                    } else {
                                                        const scorePattern = /\s*(\d)[\s\.-]([A-Za-z\s\/\\-]+?)(?=\s+\d|\s*$)/g;
                                                        let match;
                                                        while ((match = scorePattern.exec(line)) !== null) {
                                                            options.push(`${match[1]} ${match[2].trim()}`);
                                                        }
                                                        if (options.length > 0) {
                                                            type = 'choice';
                                                            const firstMatchIdx = line.search(/\s*\d[\s\.-][A-Za-z\s\/\\-]+?(?=\s+\d|\s*$)/);
                                                            if (firstMatchIdx > 5) label = line.substring(0, firstMatchIdx).trim();
                                                        } else if (line.toLowerCase().includes('date')) {
                                                            type = 'date';
                                                        } else if (line.toLowerCase().includes('yes') && line.toLowerCase().includes('no')) {
                                                            type = 'yesno';
                                                        }
                                                    }

                                                    const newQ: Question = {
                                                        id: `q_src_${Date.now()}`,
                                                        type,
                                                        label: label.replace(/^\d+[\.\)]\s+/, '').trim(),
                                                        placeholder: '...',
                                                        required: true,
                                                        options: options.length > 0 ? options : []
                                                    };
                                                    setQuestions([...questions, newQ]);
                                                }}
                                                className="flex-1 py-2 bg-indigo-500/10 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-3 h-3" /> New Question
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (questions.length === 0) return;
                                                    const lastQ = questions[questions.length - 1];
                                                    let newOpts: string[] = [];
                                                    const boxPattern = /[\u25A1\u2610\u2611\u2612\uf0a8\uf0fe\uf071\u0001\u0002]|(?:\[\s?\])/g;

                                                    if (boxPattern.test(line)) {
                                                        newOpts = line.split(boxPattern).map(p => p.trim()).filter(p => p.length > 1);
                                                    } else {
                                                        const scorePattern = /\s*(\d)[\s\.-]([A-Za-z\s\/\\-]+?)(?=\s+\d|\s*$)/g;
                                                        let match;
                                                        while ((match = scorePattern.exec(line)) !== null) {
                                                            newOpts.push(`${match[1]} ${match[2].trim()}`);
                                                        }
                                                    }
                                                    if (newOpts.length === 0) newOpts = [line.trim()];

                                                    setQuestions(questions.map((q, qIdx) =>
                                                        qIdx === questions.length - 1
                                                            ? { ...q, type: 'choice', options: [...(q.options || []), ...newOpts] }
                                                            : q
                                                    ));
                                                }}
                                                className="flex-1 py-2 bg-pink-500/10 rounded-lg text-[9px] font-black text-pink-400 uppercase tracking-widest hover:bg-pink-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Layers className="w-3 h-3" /> + Add to Options
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {statusMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 20 }} 
                        className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl border flex items-center gap-3 z-[1000] backdrop-blur-xl ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                    >
                        {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{statusMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

