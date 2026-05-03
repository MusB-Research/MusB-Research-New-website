import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, Layers, MousePointer2,
    CheckSquare, GripVertical, Settings2, Trash2, Upload, Eye, FileUp, ExternalLink, Database,
    Terminal, CheckCircle2, AlertTriangle, Wand2, DraftingCompass, ShieldCheck, Sparkles
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
    return getMediaUrl(path);
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
                                                        <option value="short_text">Text Field</option>
                                                        <option value="choice">Multi-Choice</option>
                                                        <option value="yesno">Yes / No</option>
                                                        <option value="date">Date Picker</option>
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none transition-transform group-hover/select:translate-y-[-40%]" />
                                                </div>

                                                <button
                                                    onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}
                                                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {q.type === 'choice' && (
                                            <div className="mt-4 pl-11 space-y-2">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                    <span>Configuration Options</span>
                                                    <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={q.allow_multiple}
                                                            onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, allow_multiple: e.target.checked } : item))}
                                                            className="w-3 h-3 rounded border-white/10 bg-white/5"
                                                        />
                                                        Allow Multiple Selections
                                                    </label>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(q.options || []).map((opt, optIdx) => (
                                                        <div key={optIdx} className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-3 py-1.5 group/opt">
                                                            <input
                                                                value={opt}
                                                                onChange={e => {
                                                                    const nextOpts = [...(q.options || [])];
                                                                    nextOpts[optIdx] = e.target.value;
                                                                    setQuestions(questions.map(item => item.id === q.id ? { ...item, options: nextOpts } : item));
                                                                }}
                                                                className="bg-transparent text-[11px] font-bold text-indigo-300 outline-none w-24"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const nextOpts = (q.options || []).filter((_, i) => i !== optIdx);
                                                                    setQuestions(questions.map(item => item.id === q.id ? { ...item, options: nextOpts } : item));
                                                                }}
                                                                className="text-slate-600 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const nextOpts = [...(q.options || []), 'New Option'];
                                                            setQuestions(questions.map(item => item.id === q.id ? { ...item, options: nextOpts } : item));
                                                        }}
                                                        className="px-3 py-1.5 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 transition-all flex items-center gap-2"
                                                    >
                                                        <Plus size={12} /> Add Option
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/5">
                                    <button onClick={() => addQuestion('short_text')} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group flex flex-col items-center gap-2">
                                        <FileText size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Text Field</span>
                                    </button>
                                    <button onClick={() => addQuestion('choice')} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group flex flex-col items-center gap-2">
                                        <List size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Multi-Choice</span>
                                    </button>
                                    <button onClick={() => addQuestion('yesno')} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group flex flex-col items-center gap-2">
                                        <CheckSquare size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Yes / No</span>
                                    </button>
                                    <button onClick={() => addQuestion('date')} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group flex flex-col items-center gap-2">
                                        <Calendar size={18} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Date Picker</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button
                                onClick={saveStructured}
                                disabled={isSaving}
                                className="flex-1 py-5 bg-blue-600 rounded-[2rem] text-[13px] font-black text-white uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                <Save className="w-5 h-5" />
                                {isSaving ? 'Synching Matrix...' : 'Commit Specification'}
                            </button>
                            <button
                                onClick={() => setViewMode('LIBRARY')}
                                className="px-10 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-[#0B101B]/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Protocol AI</h3>
                                <div className="px-3 py-1 bg-blue-500/10 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/20">Neural V2</div>
                            </div>
                            
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-6 opacity-70 italic">
                                Use our neural engine to extract structured data fields directly from your clinical protocol PDF.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={runAIExtraction}
                                    disabled={isSaving || !editingId}
                                    className="w-full py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[11px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    {isSaving ? 'Extracting...' : 'Neural Extraction'}
                                </button>
                                
                                <button
                                    onClick={fetchSourceLines}
                                    disabled={!editingId}
                                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                    <Terminal className="w-4 h-4" />
                                    Manual Source Map
                                </button>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> System Diagnostics
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-slate-500">Status</span>
                                        <span className="text-emerald-500 uppercase">Operational</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-slate-500">Neural Sync</span>
                                        <span className="text-slate-400 uppercase">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {previewPdf && (
                    <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 md:p-10 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0F172A] border border-white/10 rounded-[2.5rem] w-full h-full overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <FileText className="text-blue-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">Protocol Preview</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Source Documentation Reference</p>
                                    </div>
                                </div>
                                <button onClick={closePreview} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                                    <X size={32} />
                                </button>
                            </div>
                            <div className="flex-1 bg-black/40">
                                <iframe src={`${previewPdf}#toolbar=0`} className="w-full h-full border-none" />
                            </div>
                        </motion.div>
                    </div>
                )}

                {previewData && (
                    <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 md:p-10 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0F172A] border border-white/10 rounded-[2.5rem] w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <Layout className="text-purple-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">{previewData.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">EDC Template Definition</p>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewData(null)} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                                    <X size={32} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0B101B]/40">
                                {previewData.json_structure?.instructions && (
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Global Instructions</div>
                                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{previewData.json_structure.instructions}</p>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Field Specification ({previewData.json_structure?.questions?.length || 0} Items)</div>
                                    {previewData.json_structure?.questions?.map((q, i) => (
                                        <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-black text-indigo-400">{i + 1}.</span>
                                                <h4 className="text-sm font-bold text-white uppercase tracking-tight italic">{q.label}</h4>
                                            </div>
                                            <div className="pl-6">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{q.type.replace('_', ' ')}</span>
                                                {q.options && q.options.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {q.options.map((opt, oi) => (
                                                            <span key={oi} className="px-3 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-full text-[10px] font-bold text-indigo-300">
                                                                {opt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
