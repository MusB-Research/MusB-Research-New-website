import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, Layers, MousePointer2,
    CheckSquare, GripVertical, Settings2, Trash2, Upload, Eye, FileUp, ExternalLink, Database,
    Terminal, CheckCircle2, AlertTriangle, Wand2, DraftingCompass, ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../api';
import { authFetch, API } from '../../utils/auth';

interface Question {
    id: string;
    type: 'short_text' | 'choice' | 'dropdown' | 'date' | 'yesno';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
    allow_multiple?: boolean;
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
    // Supporting LaunchStudyForm props
    selectedIds?: string[];
    onChange?: (ids: string[], selectedTemplates?: Template[]) => void;
}

const getFullUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // In Django, media files are usually /media/...
    // If the path doesn't start with /media/ but it's a relative path, we might need to prepend it
    let cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If it doesn't already have /media/ and doesn't look like an absolute API path
    if (!cleanPath.startsWith('/media/')) {
        cleanPath = `/media${cleanPath}`;
    }

    return `${API}${cleanPath}`;
};

export default function QuestionnaireBuilder({ 
    initialTemplate, 
    initialTab, 
    onSelectTemplate, 
    selectedTemplates,
    selectedIds,
    onChange 
}: QuestionnaireBuilderProps) {
    const effectiveSelectedIds = selectedIds || selectedTemplates || [];
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
            setEditingPdfUrl(getFullUrl(initialTemplate.pdf_file));
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
                    const isSectionHeader = /^(PART|SECTION|BLOCK)\s+\d+/i.test(trimmed) || 
                        (trimmed.toUpperCase() === trimmed && trimmed.length < 50 && trimmed.length > 5) ||
                        /^(OVERVIEW|INTRODUCTION|NOTES|INSTRUCTIONS|BACKGROUND|NOTE):?/i.test(trimmed);

                    if ((isNewQuestion || isSectionHeader) && currentBlock) {
                        blocks.push(currentBlock.trim());
                        currentBlock = trimmed;
                    } else {
                        currentBlock += (currentBlock ? " " : "") + trimmed;
                    }
                }
                if (currentBlock) blocks.push(currentBlock.trim());

                // 2. Extract Title and Instructions
                let extractedTitle = "";
                let introText = "";
                let startIndex = 0;

                if (blocks.length > 0) {
                    const first = blocks[0];
                    if (!/^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])/.test(first) && first.length < 100) {
                        extractedTitle = first;
                        setName(extractedTitle);
                        startIndex = 1;
                    }
                }

                for (let i = startIndex; i < blocks.length; i++) {
                    const block = blocks[i];
                    const isIntroBlock = /^(OVERVIEW|INTRODUCTION|NOTES|INSTRUCTIONS|BACKGROUND|NOTE)/i.test(block) ||
                        (!/^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])/.test(block));
                    
                    if (isIntroBlock) {
                        introText += (introText ? "\n\n" : "") + block;
                        startIndex = i + 1;
                    } else {
                        break;
                    }
                }

                if (introText.length > 0) {
                    setInstructions(introText);
                } else {
                    setInstructions('');
                }

                // 3. Identify Global Scoring Scale (e.g., 0=None, 1=Mild...)
                let globalScale: string[] = [];
                const scaleDetectPattern = /(\d)\s*[=\-:]\s*([A-Z][A-Z\s]+?)(?=\s+\d|\s*$)/g;

                for (const b of blocks.slice(startIndex, startIndex + 5)) {
                    let match;
                    while ((match = scaleDetectPattern.exec(b)) !== null) {
                        globalScale.push(`${match[1]} ${match[2].trim()}`);
                    }
                    if (globalScale.length > 0) break;
                }

                // 4. Transform remaining blocks into Questions
                const suggested: Question[] = [];

                for (let i = startIndex; i < blocks.length; i++) {
                    const block = blocks[i];
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
                        placeholder: options.length > 0 ? 'Select an option...' : 'Enter your response...',
                        required: true,
                        options: options.length > 0 ? options : [],
                        allow_multiple: /select all that apply/i.test(cleanLabel)
                    });
                }

                const final = suggested.filter(q => q.label.length > 3);
                setQuestions(final);

                const msg = final.length > 0
                    ? `Clinical Logic Restored: ${final.length} instruments synchronized with automated scale mapping.`
                    : "Extraction completed, but no clear questions found. Please check PDF quality.";
                alert(msg);;
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
        setStatusMessage({ text: `Uploading and analyzing ${file.name}...`, type: 'success' });
        
        try {
            let templateId = editingId;
            let currentName = name || file.name.split('.')[0] || 'Untitled PDF Protocol';

            const formData = new FormData();
            formData.append('pdf_file', file);
            formData.append('name', currentName);
            formData.append('mode', 'PDF');

            const url = templateId
                ? `${API}/api/questionnaire-templates/${templateId}/`
                : `${API}/api/questionnaire-templates/`;

            const method = templateId ? 'PATCH' : 'POST';

            const uploadRes = await authFetch(url, {
                method,
                body: formData
            });

            if (uploadRes.ok) {
                const uploadedData = await uploadRes.json();
                templateId = uploadedData.id;
                setEditingId(templateId);
                setName(uploadedData.name);
                setEditingPdfUrl(uploadedData.pdf_file);
                setEditingPdfName(uploadedData.pdf_file ? uploadedData.pdf_file.split('/').pop() : 'Protocol.pdf');

                const extractRes = await authFetch(`${API}/api/questionnaire-templates/${templateId}/extract_text/`);
                if (extractRes.ok) {
                    const data = await extractRes.json();
                    const rawLines: string[] = data.lines || [];
                    
                    const blocks: string[] = [];
                    let currentBlock = "";
                    for (const line of rawLines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('©') || /page\s+\d+/i.test(trimmed)) continue;
                        const isNewQuestion = /^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])\s+/.test(trimmed);
                        const isSectionHeader = /^(PART|SECTION|BLOCK)\s+\d+/i.test(trimmed) || (trimmed.toUpperCase() === trimmed && trimmed.length < 50 && trimmed.length > 5);

                        if ((isNewQuestion || isSectionHeader) && currentBlock) {
                            blocks.push(currentBlock.trim());
                            currentBlock = trimmed;
                        } else {
                            currentBlock += (currentBlock ? " " : "") + trimmed;
                        }
                    }
                    if (currentBlock) blocks.push(currentBlock.trim());

                    const suggested: Question[] = [];
                    for (let block of blocks) {
                        if (suggested.length === 0 && !/^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])/.test(block)) {
                            continue;
                        }
                        let options: string[] = [];
                        let label = block;
                        if (/\(0 for NO, 1 for YES\)/i.test(block)) {
                            label = block.replace(/\(0 for NO, 1 for YES\)/i, '').trim();
                            options = ["0 - NO", "1 - YES"];
                        }
                        let cleanLabel = label.replace(/^\d+[\.\)]\s+/, '').replace(/^[A-G][\.\)]\s+/, '').trim();
                        if (cleanLabel.length < 3) continue;

                        suggested.push({
                            id: `q_ai_${Math.random().toString(36).substr(2, 9)}`,
                            type: options.length > 0 ? 'choice' : 'short_text',
                            label: cleanLabel,
                            placeholder: '',
                            required: true,
                            options: options.length > 0 ? options : undefined,
                        });
                    }

                    if (suggested.length > 0) {
                        setQuestions([...questions, ...suggested]);
                        setStatusMessage({ text: `Successfully extracted ${suggested.length} questions.`, type: 'success' });
                    } else {
                        setStatusMessage({ text: "Text extracted, but no clear questions found. You can add them below.", type: 'success' });
                    }
                    fetchTemplates();
                } else {
                    alert("Could not automatically extract text from this file.");
                }
            } else {
                alert("File upload failed.");
            }
        } catch (err) {
            console.error("Neural upload error", err);
        } finally {
            setIsExtracting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => setStatusMessage(null), 4000);
        }
    };;

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

    const handleDeleteTemplate = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
        
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/${id}/`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                fetchTemplates();
                // If it was selected, remove it from selection
                if (effectiveSelectedIds.includes(id)) {
                    const next = effectiveSelectedIds.filter(sid => sid !== id);
                    if (onChange) {
                        const nextTemplates = templates.filter(template => next.includes(template.id) && template.id !== id);
                        onChange(next, nextTemplates);
                    }
                }
            } else {
                alert("Failed to delete template. It might be in use.");
            }
        } catch (err) {
            console.error("Delete Error:", err);
            alert("An error occurred while deleting.");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-[1px] bg-blue-500/50" />
                        <span className="text-[10px] font-black text-blue-400 tracking-[0.4em] uppercase">Clinical Protocol Engine</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">
                        Instrument <span className="text-blue-500">Library</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 font-medium opacity-70 leading-relaxed max-w-xl">
                        {viewMode === 'LIBRARY' 
                            ? "Manage mission-critical clinical assessment templates, diagnostic protocols, and PDF source documentation." 
                            : "Design structured electronic case report forms with real-time validation and neural extraction logic."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 self-end lg:self-center">
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
                        className="px-8 py-4 rounded-2xl border border-white/10 text-[11px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/5 hover:border-blue-500/30 transition-all whitespace-nowrap bg-[#0B101B]/40 backdrop-blur-md"
                    >
                        {viewMode === 'LIBRARY' ? (
                            <div className="flex items-center gap-2">
                                <DraftingCompass size={14} className="text-blue-400" />
                                Launch Designer
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Database size={14} className="text-slate-500" />
                                Return to Library
                            </div>
                        )}
                    </button>
                    {viewMode === 'LIBRARY' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <input type="file" hidden ref={fileInputRef} onChange={handlePdfUpload} accept=".pdf" />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 rounded-2xl text-[12px] font-black text-white uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/30 whitespace-nowrap group"
                            >
                                <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                                {isUploading ? 'SYNCHRONIZING...' : 'INGEST PROTOCOL'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === 'LIBRARY' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group flex flex-col h-full shadow-lg">
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.pdf_file ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                                    {t.pdf_file ? <FileText className="w-6 h-6 text-blue-400" /> : <Layout className="w-6 h-6 text-purple-400" />}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                        {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTemplate(t.id, t.name);
                                        }}
                                        className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        title="Delete Template"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors leading-tight break-words">{t.name}</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                                    {t.pdf_file ? 'PDF PROTOCOL' : `EDC TEMPLATE (${t.json_structure?.questions?.length || 0} FIELDS)`}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Repository</span>
                                    </div>

                                    {t.used_in_studies && t.used_in_studies.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {t.used_in_studies.slice(0, 2).map(s => (
                                                <span key={s.id} className="px-2 py-1 bg-blue-500/5 text-blue-400/60 rounded text-[9px] font-bold border border-blue-500/10 uppercase">
                                                    {s.protocol_id || 'ACTIVE'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    {(onSelectTemplate || onChange) && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onSelectTemplate) onSelectTemplate(t.id, t.name);
                                                if (onChange) {
                                                    const current = effectiveSelectedIds;
                                                    const next = current.includes(t.id)
                                                        ? current.filter(id => id !== t.id)
                                                        : [...current, t.id];
                                                    const nextTemplates = templates.filter(template => next.includes(template.id));
                                                    onChange(next, nextTemplates);
                                                }
                                            }}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                effectiveSelectedIds.includes(t.id)
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {effectiveSelectedIds.includes(t.id) ? 'Selected' : 'Select Form'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (t.pdf_file) setPreviewPdf(getFullUrl(t.pdf_file));
                                            else setPreviewData(t);
                                        }}
                                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <Eye size={14} /> Preview
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingId(t.id);
                                        setEditingPdfUrl(getFullUrl(t.pdf_file));
                                        setEditingPdfName(t.pdf_file ? (t.pdf_file.split('/').pop() || 'Protocol.pdf') : 'Protocol.pdf');
                                        setName(t.name);
                                        const js = t.json_structure || {};
                                        setInstructions(js.instructions || '');
                                        setQuestions(js.questions || (Array.isArray(js) ? js : []));
                                        setViewMode('BUILDER');
                                    }}
                                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-blue-400 hover:border-blue-500/30 transition-all"
                                >
                                    Edit Specifications
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <button
                        onClick={() => setViewMode('BUILDER')}
                        className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500/30 transition-all group cursor-pointer min-h-[320px]"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-300 border border-white/5">
                            <Plus className="w-8 h-8 text-slate-500 group-hover:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-bold text-white block">Create New Protocol</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">Launch Designer</span>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <div className="bg-[#0B101B]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-blue-400 tracking-[0.4em] uppercase">Design Specification</span>
                            </div>

                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="ENTER FORM TITLE..."
                                className="w-full bg-transparent text-3xl font-black text-white uppercase italic outline-none mb-4 border-b border-white/10 pb-3 focus:border-blue-500 transition-colors placeholder:text-white/5"
                            />

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Global Instructions & Logic Overview</label>
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">Markdown Supported</div>
                                </div>
                                <textarea
                                    ref={instructionsRef}
                                    value={instructions}
                                    onChange={e => {
                                        setInstructions(e.target.value);
                                        autoExpand(e.target);
                                    }}
                                    placeholder="Enter instructions for the participant (e.g. Please read this first...)"
                                    className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-slate-300 font-bold outline-none focus:border-indigo-500/30 transition-all min-h-[80px] overflow-hidden leading-relaxed"
                                />
                            </div>

                            {editingPdfUrl && (
                                <div className="mb-10 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center justify-between group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                            <FileText className="w-7 h-7 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-white italic uppercase tracking-tight">{editingPdfName}</div>
                                            <div className="text-[10px] font-black text-indigo-500/60 uppercase tracking-[0.2em] mt-1">Source Protocol Sync Active</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setPreviewPdf(editingPdfUrl)} className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest rounded-xl transition-all border border-indigo-500/20">
                                            Preview
                                        </button>
                                        <button onClick={() => setEditingPdfUrl(null)} className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] ml-1">Field Architecture</h4>
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">Total: {questions.length} Items</div>
                                </div>
                                
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.05] transition-all group relative">
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <GripVertical size={16} className="text-slate-700 cursor-grab active:cursor-grabbing" />
                                        </div>
                                        
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                                            <div className="flex-1 flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-[12px] border border-indigo-500/20 shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <input
                                                    value={q.label}
                                                    onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, label: e.target.value } : item))}
                                                    placeholder="Enter Field Question/Label..."
                                                    className="flex-1 min-w-0 bg-transparent text-base font-black text-white italic uppercase tracking-tight outline-none placeholder:text-white/5"
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <div className="relative group/select">
                                                    <select
                                                        value={q.type}
                                                        onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, type: e.target.value as any } : item))}
                                                        className="appearance-none bg-black/40 border border-white/10 rounded-xl px-3 py-2 pr-8 text-[10px] font-black text-indigo-400 uppercase tracking-widest outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                                                    >
                                                        <option value="short_text">One Line Text</option>
                                                        <option value="choice">Choice (Radio)</option>
                                                        <option value="dropdown">Selection Menu</option>
                                                        <option value="date">Date Field</option>
                                                        <option value="yesno">Yes / No</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400/50 pointer-events-none" size={12} />
                                                </div>

                                                {(q.type === 'choice' || q.type === 'dropdown') && (
                                                    <button
                                                        onClick={() => setQuestions(questions.map(item => item.id === q.id ? { ...item, allow_multiple: !item.allow_multiple } : item))}
                                                        className={`text-[9px] font-black px-3 py-2 rounded-xl border transition-all uppercase tracking-widest ${q.allow_multiple ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/10 text-slate-500 hover:border-emerald-500/30'}`}
                                                    >
                                                        {q.allow_multiple ? 'Multi Select' : 'Single Select'}
                                                    </button>
                                                )}
                                                
                                                <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="p-2 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {(q.type === 'choice' || q.type === 'dropdown') && (
                                            <div className="mt-10 pl-16 pr-4">
                                                <div className="p-10 bg-black/30 border border-white/5 rounded-[2rem]">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                                                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Response Levels & Scales</h5>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const opts = q.options || [];
                                                                setQuestions(questions.map(item => item.id === q.id ? { ...item, options: [...opts, `Level ${opts.length + 1}`] } : item));
                                                            }}
                                                            className="px-5 py-2.5 bg-indigo-500/10 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20"
                                                        >
                                                            + Add Scale Item
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {(q.options || []).map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl pl-5 pr-2 py-4 hover:border-indigo-500/30 transition-all group/opt min-w-0">
                                                                <input
                                                                    value={opt}
                                                                    onChange={e => {
                                                                        const newOpts = [...(q.options || [])];
                                                                        newOpts[optIdx] = e.target.value;
                                                                        setQuestions(questions.map(item => item.id === q.id ? { ...item, options: newOpts } : item));
                                                                    }}
                                                                    className="bg-transparent text-[13px] font-bold text-slate-300 outline-none w-full placeholder:text-slate-800 min-w-0"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newOpts = (q.options || []).filter((_, idx) => idx !== optIdx);
                                                                        setQuestions(questions.map(item => item.id === q.id ? { ...item, options: newOpts } : item));
                                                                    }}
                                                                    className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-all shrink-0"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-6">
                                    {[
                                        { type: 'short_text', icon: FileText, label: 'One Line Text', color: 'indigo' },
                                        { type: 'choice', icon: List, label: 'Choice Selection', color: 'indigo' },
                                        { type: 'dropdown', icon: ChevronDown, label: 'Menu List', color: 'indigo' },
                                        { type: 'date', icon: Calendar, label: 'Date Pick', color: 'indigo' },
                                        { type: 'yesno', icon: AlertCircle, label: 'Yes / No', color: 'indigo' }
                                    ].map((btn) => (
                                        <button
                                            key={btn.type}
                                            onClick={() => addQuestion(btn.type as any)}
                                            className="p-4 bg-[#0B101B]/40 border border-white/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group active:scale-95"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all border border-white/5">
                                                <btn.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-all text-center">
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
                                                    <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500/20 transition-all border border-pink-500/10">
                                                <Terminal className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest group-hover:text-white transition-all text-center">
                                                Neural Upload
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        <div className="bg-[#0B101B]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 sticky top-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-[1px] bg-indigo-500/50" />
                                <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Protocol Actions</span>
                            </div>
                            
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={saveStructured}
                                    disabled={isSaving}
                                    className={`w-full py-5 rounded-2xl text-[12px] font-black text-white uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl ${isSaving ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30 active:scale-[0.98]'}`}
                                >
                                    <Save className="w-5 h-5" /> {isSaving ? 'SYNCHRONIZING...' : 'COMMIT TO LIBRARY'}
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={runAIExtraction}
                                        disabled={isSaving || !editingId}
                                        className="py-4 bg-[#f43f5e] hover:bg-[#e11d48] border border-pink-500/20 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all flex flex-col items-center gap-2 group active:scale-[0.98] shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Terminal className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                        <span>AI Extract</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSourceText(true)}
                                        className="py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex flex-col items-center gap-2 group"
                                    >
                                        <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span>Source Node</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPreviewData({ name, json_structure: { instructions, questions } } as any)}
                                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                    <Eye className="w-4 h-4" /> Live Interface Preview
                                </button>
                                
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="px-6 py-5 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Protocol Integrity</div>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-white uppercase italic">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            Validated for Production
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed px-2">
                                        Once committed, this clinical instrument will be available for global deployment across all authorized study protocols.
                                    </p>
                                </div>
                            </div>
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
                            <div className="px-10 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Encrypted Data Stream Active</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <a
                                        href={previewPdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-8 py-3 bg-white/5 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all flex items-center gap-3 border border-white/10 hover:bg-white/10"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Export to Viewport
                                    </a>
                                    <button onClick={closePreview} className="px-10 py-3 bg-indigo-600 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/20 active:scale-95">
                                        Terminate Preview
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Structured Preview Modal */}
            <AnimatePresence>
                {previewData && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setPreviewData(null)}
                            className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-[301] p-4 md:p-8 pointer-events-none"
                        >                             <div className="bg-[#0B101B]/90 backdrop-blur-2xl w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative pointer-events-auto">
                                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                            <Wand2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-semibold text-white leading-none">Preview Questionnaire</h4>
                                            <p className="text-xs text-slate-400 font-medium mt-1">
                                                This is how the questions will appear to the participant
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPreviewData(null)} className="p-3 text-slate-600 hover:text-white transition-all hover:bg-white/5 rounded-xl">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                                    <div className="max-w-3xl">
                                        <h2 className="text-3xl font-semibold text-white leading-tight mb-4">{previewData.name}</h2>
                                        {previewData.json_structure?.instructions && (
                                            <div className="p-6 bg-white/[0.02] border-l-2 border-indigo-500 rounded-r-2xl">
                                                <p className="text-slate-300 font-normal text-base leading-relaxed">{previewData.json_structure.instructions}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-10">
                                        {(previewData.json_structure?.questions || []).map((q, idx) => (
                                            <div key={q.id} className="space-y-4 group/field">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-xs font-semibold text-slate-400 bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5">{idx + 1}</div>
                                                    <label className="text-lg font-medium text-white transition-colors">{q.label}</label>
                                                </div>
                                                
                                                <div className="pl-12">
                                                    {q.type === 'short_text' && (
                                                        <div className="w-full bg-black/20 border border-white/10 rounded-xl px-6 py-4 text-slate-500 text-sm">
                                                            Your answer here
                                                        </div>
                                                    )}
                                                    {q.type === 'yesno' && (
                                                        <div className="flex gap-4">
                                                            {['Yes', 'No'].map(opt => (
                                                                <div key={opt} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-400">
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {(q.type === 'choice' || q.type === 'dropdown') && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {(q.options || []).map(opt => (
                                                                <div key={opt} className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-300 flex items-center gap-4">
                                                                    <div className="w-3 h-3 rounded-full border border-white/30" />
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {q.type === 'date' && (
                                                        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-slate-400 flex items-center justify-between">
                                                            <span className="text-sm">Select date</span>
                                                            <Calendar className="w-5 h-5 opacity-60" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-[#0B101B]/80 border-t border-white/5 flex items-center justify-end">
                                    <button onClick={() => setPreviewData(null)} className="px-8 py-3 bg-indigo-600 rounded-xl text-sm font-medium text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                                        Close Preview
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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250]"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-[550px] bg-[#0B101B]/95 backdrop-blur-3xl border-l border-white/10 z-[251] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col"
                        >
                            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <Database className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Field Ingestion</h4>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5">Source Component Mapping</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSourceText(false)} className="p-3 text-slate-600 hover:text-white transition-all hover:bg-white/5 rounded-xl">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                <div className="px-4 py-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl mb-4 text-center">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-relaxed">
                                        Select components below to inject them into the clinical designer.
                                    </p>
                                </div>
                                {sourceLines.map((line, idx) => (
                                    <div key={idx} className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] pointer-events-none" />
                                        <p className="text-[14px] font-bold text-slate-300 group-hover:text-white mb-8 leading-relaxed italic border-l-2 border-indigo-500/30 pl-6">{line}</p>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => {
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
                                                className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                <Plus className="w-4 h-4" /> Inject New
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
                                                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                            >
                                                <Layers className="w-4 h-4" /> Map Scales
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
                        initial={{ opacity: 0, y: 40, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 40, scale: 0.9 }} 
                        className={`fixed bottom-12 right-12 px-8 py-5 rounded-[2rem] border-2 shadow-2xl flex items-center gap-5 z-[1000] backdrop-blur-3xl ${
                            statusMessage.type === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/10'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            statusMessage.type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                        }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">System Notification</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-80">{statusMessage.text}</span>
                        </div>
                        <button onClick={() => setStatusMessage(null)} className="ml-4 p-2 hover:bg-white/5 rounded-xl transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

