import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, Layers, MousePointer2,
    CheckSquare, GripVertical, Settings2, Trash2, Upload, Eye, FileUp, ExternalLink, Database,
    Terminal, CheckCircle2, AlertTriangle, Wand2, DraftingCompass, ShieldCheck, Sparkles, Link as LinkIcon,
    Smile, Meh, Frown, FileSearch
} from 'lucide-react';
import { apiFetch } from '../../api';
import { authFetch, API } from '../../utils/auth';
import { getMediaUrl } from '../../utils/media';

interface Question {
    id: string;
    type: 'short_text' | 'choice' | 'dropdown' | 'date' | 'yesno' | 'faces' | 'scale' | 'likert' | 'matrix';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
    rows?: string[];
    allow_multiple?: boolean;
    scale_min?: number;
    scale_max?: number;
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
    const [showSmartPaste, setShowSmartPaste] = useState(false);
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

    const handleFormat = (type: 'bold' | 'italic' | 'underline' | 'link' | 'clear') => {
        if (!instructionsRef.current) return;
        const textarea = instructionsRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = instructions.substring(start, end);

        let formatted = '';
        if (type === 'bold') {
            formatted = `**${selectedText || 'bold text'}**`;
        } else if (type === 'italic') {
            formatted = `*${selectedText || 'italic text'}*`;
        } else if (type === 'underline') {
            formatted = `<u>${selectedText || 'underlined text'}</u>`;
        } else if (type === 'link') {
            formatted = `[${selectedText || 'link text'}](https://example.com)`;
        } else if (type === 'clear') {
            setInstructions('');
            return;
        }

        const newText = instructions.substring(0, start) + formatted + instructions.substring(end);
        setInstructions(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + formatted.length, start + formatted.length);
        }, 0);
    };

    useEffect(() => {
        if (viewMode === 'BUILDER') {
            autoExpand(instructionsRef.current);
        }
    }, [viewMode, instructions, autoExpand]);

    const fetchTemplates = async () => {
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/?category=INSTRUMENT`);
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

    // Auto-save logic
    useEffect(() => {
        if (viewMode !== 'BUILDER' || !name || questions.length === 0) return;

        const timer = setTimeout(() => {
            // Internal function for background saving
            const autoSave = async () => {
                try {
                    const url = editingId
                        ? `${API}/api/questionnaire-templates/${editingId}/`
                        : `${API}/api/questionnaire-templates/`;

                    const res = await authFetch(url, {
                        method: editingId ? 'PATCH' : 'POST',
                        body: JSON.stringify({
                            name,
                            category: 'INSTRUMENT',
                            json_structure: {
                                questions,
                                instructions,
                                sections: [{ label: 'Main Section', fields: questions }]
                            }
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (!editingId && data.id) {
                            setEditingId(data.id);
                        }
                        setStatusMessage({ text: "Progress Auto-saved", type: 'success' });
                        fetchTemplates();
                    }
                } catch (err) {
                    console.error("Auto-save failed", err);
                }
            };
            autoSave();
        }, 2000); // 2 second debounce

        return () => clearTimeout(timer);
    }, [name, instructions, questions, viewMode]);

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('pdf_file', file);
        formData.append('name', file.name.split('.')[0] || 'Untitled PDF Protocol');
        formData.append('category', 'INSTRUMENT');
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

    const addQuestion = (type: string) => {
        const isCheckbox = type === 'checkbox';
        const actualType: Question['type'] = isCheckbox ? 'choice' : type as any;

        const newQuestion: Question = {
            id: `q_${Date.now()}`,
            type: actualType,
            label: actualType === 'faces' ? 'How are you feeling today?' : 'New Question',
            placeholder: '...',
            required: true,
            options: (actualType === 'choice' || actualType === 'likert') ? ['Option 1', 'Option 2'] : (actualType === 'scale' ? ['Min Label', 'Max Label'] : undefined),
            allow_multiple: isCheckbox,
            scale_min: actualType === 'scale' ? 0 : undefined,
            scale_max: actualType === 'scale' ? 100 : undefined
        };
        setQuestions([...questions, newQuestion]);
    };

    const processExtractionResult = (data: any) => {
        const suggested: Question[] = [];
        const sections = data.sections || [];
        const docType: string = data.document_type || 'unknown';

        if (sections.length > 0) {
            for (const section of sections) {
                // Add section header as a visual separator
                if (section.title && section.title !== 'General') {
                    suggested.push({
                        id: `section_${Date.now()}_${Math.random()}`,
                        type: 'header' as any, // Using as any because type system might be strict
                        label: section.title,
                        placeholder: 'Section Header',
                        required: false,
                    });
                }

                for (const field of (section.fields || [])) {
                    const base = {
                        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                        required: field.required ?? true,
                        placeholder: field.placeholder || 'Enter response...',
                    };

                    // Map backend types to QuestionnaireBuilder types
                    let type: Question['type'] = 'short_text';
                    if (field.type === 'radio' || field.type === 'choice' || field.type === 'checkbox') type = 'choice';
                    else if (field.type === 'scale' || field.type === 'vas') type = 'scale';
                    else if (field.type === 'faces' || field.type === 'emoji_scale') type = 'faces';
                    else if (field.type === 'matrix' || field.type === 'likert') type = 'matrix';
                    else if (field.type === 'number') type = 'number';
                    else if (field.type === 'date') type = 'date';
                    else if (field.type === 'yesno') type = 'yesno';
                    else if (field.type === 'header') type = 'header' as any;
                    else if (field.type === 'instruction' || field.type === 'description') type = 'description' as any;

                    suggested.push({
                        ...base,
                        type,
                        label: field.label || field.text || 'Question',
                        options: field.options || field.columns || [],
                        rows: field.rows || [],
                        allow_multiple: field.type === 'checkbox' || !!field.allow_multiple,
                        scale_min: field.min ?? 0,
                        scale_max: field.max ?? 10
                    } as Question);
                }
            }
        } else {
            // Fallback to basic line parsing
            const rawLines: string[] = data.lines || [];
            let currentBlock = "";
            const blocks: string[] = [];
            for (const line of rawLines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('©') || /page\s+\d+/i.test(trimmed)) continue;
                if (/^(\d+[\.\)]|[A-G][\.\)]|[\u2022\u25cf\-\u25a1])\s+/.test(trimmed) && currentBlock) {
                    blocks.push(currentBlock.trim());
                    currentBlock = trimmed;
                } else {
                    currentBlock += (currentBlock ? " " : "") + trimmed;
                }
            }
            if (currentBlock) blocks.push(currentBlock.trim());

            for (const block of blocks) {
                let options: string[] = [];
                let label = block;
                if (/\(0 for NO, 1 for YES\)/i.test(block)) {
                    label = block.replace(/\(0 for NO, 1 for YES\)/i, '').trim();
                    options = ["0 - NO", "1 - YES"];
                }
                const cleanLabel = label.replace(/^\d+[\.\)]\s+/, '').replace(/^[A-G][\.\)]\s+/, '').trim();
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
        }

        const final = suggested.filter(q => q.label && q.label.trim().length > 2);
        if (final.length > 0) {
            setQuestions(final);
            setStatusMessage({ 
                text: `✅ Extracted ${final.length} fields. Type: ${docType.toUpperCase()}.`, 
                type: 'success' 
            });
        } else {
            setStatusMessage({ text: "⚠️ Extraction completed but no valid fields found.", type: 'error' });
        }
        setTimeout(() => setStatusMessage(null), 6000);
    };

    const runAIExtraction = async () => {
        if (!editingId) return alert("Upload / Select a PDF first.");
        setIsSaving(true);
        setStatusMessage({ text: 'Neural extraction engine running...', type: 'success' });
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/${editingId}/extract_text/`);
            if (res.ok) {
                const data = await res.json();
                processExtractionResult(data);
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Extraction failed');
            }
        } catch (err: any) {
            setStatusMessage({ text: `Extraction failed: ${err.message}`, type: 'error' });
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

    const handleSmartImport = async (text: string) => {
        setIsSaving(true);
        setStatusMessage({ text: 'AI engine analyzing text block...', type: 'success' });
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/smart-extract/`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
            if (res.ok) {
                const data = await res.json();
                processExtractionResult(data);
            } else {
                throw new Error("Smart extraction failed");
            }
        } catch (err) {
            setStatusMessage({ text: 'Neural text extraction failed.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        setStatusMessage({ text: `Uploading and analyzing ${file.name}...`, type: 'success' });
        
        try {
            const formData = new FormData();
            formData.append('pdf_file', file);
            formData.append('name', name || file.name.split('.')[0]);
            formData.append('category', 'INSTRUMENT');

            const url = editingId ? `${API}/api/questionnaire-templates/${editingId}/` : `${API}/api/questionnaire-templates/`;
            const uploadRes = await authFetch(url, {
                method: editingId ? 'PATCH' : 'POST',
                body: formData
            });

            if (uploadRes.ok) {
                const uploadedData = await uploadRes.json();
                setEditingId(uploadedData.id);
                setEditingPdfUrl(uploadedData.pdf_file);
                
                const extractRes = await authFetch(`${API}/api/questionnaire-templates/${uploadedData.id}/extract_text/`);
                if (extractRes.ok) {
                    const data = await extractRes.json();
                    processExtractionResult(data);
                    fetchTemplates();
                }
            }
        } catch (err) {
            setStatusMessage({ text: 'Extraction failed.', type: 'error' });
        } finally {
            setIsExtracting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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
                    category: 'INSTRUMENT',
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
        <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-[1px] bg-blue-500/50" />
                        <span className="text-[12px] font-bold text-blue-400 tracking-wider uppercase">Form Builder</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight mb-1">
                        Form <span className="text-blue-500">Templates</span>
                    </h1>
                    <p className="text-sm text-slate-400 font-medium opacity-75 max-w-xl">
                        {viewMode === 'LIBRARY' 
                            ? "Manage study forms, templates, and attached PDFs." 
                            : "Create and customize question sheets for participants."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-end lg:self-center">
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
                        className="px-4 py-2 rounded-xl border border-white/10 text-[13px] font-bold text-slate-300 uppercase tracking-wider hover:bg-white/5 hover:border-blue-500/30 transition-all whitespace-nowrap bg-[#0B101B]/40 backdrop-blur-md"
                    >
                        {viewMode === 'LIBRARY' ? (
                            <div className="flex items-center gap-2">
                                <DraftingCompass size={13} className="text-blue-400" />
                                Create Form
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Database size={13} className="text-slate-500" />
                                Back to Library
                            </div>
                        )}
                    </button>
                    {viewMode === 'LIBRARY' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <input type="file" hidden ref={fileInputRef} onChange={handlePdfUpload} accept=".pdf" />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-[13px] font-bold text-white uppercase tracking-wider hover:bg-blue-500 transition-all whitespace-nowrap group"
                            >
                                <Upload className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
                                {isUploading ? 'UPLOADING...' : 'UPLOAD PDF'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {viewMode === 'LIBRARY' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {templates.map(t => (
                        <div key={t.id} className="bg-[#111111] border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all group flex flex-col h-full shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.pdf_file ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                                    {t.pdf_file ? <FileText className="w-5 h-5 text-blue-400" /> : <Layout className="w-5 h-5 text-purple-400" />}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="px-2 py-0.5 bg-white/5 rounded-full border border-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTemplate(t.id, t.name);
                                        }}
                                        className="p-1 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                                        title="Delete Template"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors leading-tight break-words">{t.name}</h3>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    {t.pdf_file ? 'PDF FORM' : `FORM TEMPLATE (${t.json_structure?.questions?.length || 0} QUESTIONS)`}
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Studies</span>
                                    </div>

                                    {t.used_in_studies && t.used_in_studies.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {t.used_in_studies.slice(0, 2).map(s => (
                                                <span key={s.id} className="px-1.5 py-0.5 bg-blue-500/5 text-blue-400/60 rounded text-[11px] font-bold border border-blue-500/10 uppercase">
                                                    {s.protocol_id || 'ACTIVE'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
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
                                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
                                                effectiveSelectedIds.includes(t.id)
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
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
                                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Eye size={12} /> Preview
                                    </button>
                                </div>
                                <div className="flex gap-2">
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
                                        className="flex-1 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-blue-400 hover:border-blue-500/30 transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingId(null); // Clear ID to force new save
                                            setEditingPdfUrl(getFullUrl(t.pdf_file));
                                            setEditingPdfName(t.pdf_file ? (t.pdf_file.split('/').pop() || 'Protocol.pdf') : 'Protocol.pdf');
                                            setName(`${t.name} (Copy)`);
                                            const js = t.json_structure || {};
                                            setInstructions(js.instructions || '');
                                            setQuestions(js.questions || (Array.isArray(js) ? js : []));
                                            setViewMode('BUILDER');
                                            setStatusMessage({ text: "Cloned for new study", type: 'success' });
                                        }}
                                        className="flex-1 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                                    >
                                        Clone
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button
                        onClick={() => setViewMode('BUILDER')}
                        className="bg-white/[0.02] border border-dashed border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-blue-500/30 transition-all group cursor-pointer min-h-[200px]"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-500/10 transition-all duration-300 border border-white/5">
                            <Plus className="w-6 h-6 text-slate-500 group-hover:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-bold text-white block">Create New Form</span>
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Open Editor</span>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-8 space-y-4">
                        <div className="bg-[#0B101B]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">Form Settings</span>
                            </div>

                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter Form Title..."
                                className="w-full bg-transparent text-xl font-bold text-white outline-none mb-3 border-b border-white/10 pb-2 focus:border-blue-500 transition-colors placeholder:text-white/10"
                            />

                            <div className="mb-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Instructions</label>
                                    <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-lg self-start sm:self-center">
                                        <button 
                                            type="button"
                                            onClick={() => handleFormat('bold')} 
                                            className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                            title="Bold"
                                        >
                                            B
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleFormat('italic')} 
                                            className="w-7 h-7 rounded flex items-center justify-center text-sm italic font-serif text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                            title="Italic"
                                        >
                                            I
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleFormat('underline')} 
                                            className="w-7 h-7 rounded flex items-center justify-center text-sm underline text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                            title="Underline"
                                        >
                                            U
                                        </button>
                                        <div className="w-px h-3 bg-white/10 mx-1" />
                                        <button 
                                            type="button"
                                            onClick={() => handleFormat('link')} 
                                            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                            title="Insert Link"
                                        >
                                            <LinkIcon size={12} />
                                        </button>
                                        <div className="w-px h-3 bg-white/10 mx-1" />
                                        <button 
                                            type="button"
                                            onClick={() => handleFormat('clear')} 
                                            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                            title="Clear Text"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    ref={instructionsRef}
                                    value={instructions}
                                    onChange={e => {
                                        setInstructions(e.target.value);
                                        autoExpand(e.target);
                                    }}
                                    placeholder="Write instructions here for participants..."
                                    className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-slate-300 text-sm outline-none focus:border-indigo-500/30 transition-all min-h-[70px] leading-relaxed"
                                />
                            </div>
                        </div>

                        {editingPdfUrl && (
                            <div className="bg-[#0B101B]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <FileText className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold text-white tracking-tight">{editingPdfName}</div>
                                        <div className="text-xs font-bold text-indigo-500/60 uppercase tracking-wider mt-0.5">Attached PDF File</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPreviewPdf(editingPdfUrl)} className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-400 uppercase tracking-wider rounded-lg transition-all border border-indigo-500/20">
                                        Preview
                                    </button>
                                    <button onClick={() => setEditingPdfUrl(null)} className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-[#0B101B]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Questions</h4>
                                </div>
                                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">Total: {questions.length} Items</div>
                            </div>
                                
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3 hover:bg-white/[0.05] transition-all group relative">
                                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <GripVertical size={14} className="text-slate-700 cursor-grab active:cursor-grabbing" />
                                        </div>
                                        
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
                                            <div className="flex-1 flex items-center gap-2.5 min-w-0">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs border border-indigo-500/20 shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <input
                                                    value={q.label}
                                                    onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, label: e.target.value } : item))}
                                                    placeholder="Enter question..."
                                                    className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/10"
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <div className="relative group/select">
                                                    <select
                                                        value={q.type}
                                                        onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, type: e.target.value as any } : item))}
                                                        className="appearance-none bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 pr-7 text-xs font-bold text-indigo-400 uppercase tracking-wider outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                                                    >
                                                        <option value="short_text">Text Field</option>
                                                        <option value="choice">Multi-Choice</option>
                                                        <option value="yesno">Yes / No</option>
                                                        <option value="date">Date Picker</option>
                                                        <option value="faces">Emoji Scale</option>
                                                        <option value="scale">VAS Slider</option>
                                                        <option value="likert">Likert Scale</option>
                                                        <option value="matrix">Likert Grid / Matrix</option>
                                                    </select>
                                                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                                                </div>

                                                <button
                                                    onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}
                                                    className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {(q.type === 'choice' || q.type === 'likert') && (
                                            <div className="mt-2 pl-9 space-y-1.5">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                                                    <span>{q.type === 'likert' ? 'Columns' : 'Options'}</span>
                                                    {q.type === 'choice' && (
                                                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-400 transition-colors text-xs">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={q.allow_multiple}
                                                                onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, allow_multiple: e.target.checked } : item))}
                                                                className="w-3 h-3 rounded border-white/10 bg-white/5"
                                                            />
                                                            Allow multiple selections
                                                        </label>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(q.options || []).map((opt, optIdx) => (
                                                        <div key={optIdx} className="flex items-center gap-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg px-2 py-1 group/opt">
                                                            <input
                                                                value={opt}
                                                                onChange={e => {
                                                                    const nextOpts = [...(q.options || [])];
                                                                    nextOpts[optIdx] = e.target.value;
                                                                    setQuestions(questions.map(item => item.id === q.id ? { ...item, options: nextOpts } : item));
                                                                }}
                                                                className="bg-transparent text-sm font-medium text-indigo-300 outline-none w-20"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const nextOpts = (q.options || []).filter((_, i) => i !== optIdx);
                                                                    setQuestions(questions.map(item => item.id === q.id ? { ...item, options: nextOpts } : item));
                                                                }}
                                                                className="text-slate-600 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                                            >
                                                                <X size={9} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const nextOpts = [...(q.options || []), 'New Option'];
                                                            setQuestions(questions.map(item => item.id === q.id ? { ...item, options: nextOpts } : item));
                                                        }}
                                                        className="px-2 py-1 border border-dashed border-white/10 rounded-lg text-xs font-medium text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 transition-all flex items-center gap-1.5"
                                                    >
                                                        <Plus size={10} /> + Option
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {q.type === 'scale' && (
                                            <div className="mt-2 pl-9 flex flex-wrap gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min</label>
                                                    <input 
                                                        type="number"
                                                        value={q.scale_min ?? 0}
                                                        onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, scale_min: parseInt(e.target.value) } : item))}
                                                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-indigo-400 outline-none w-16"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Max</label>
                                                    <input 
                                                        type="number"
                                                        value={q.scale_max ?? 100}
                                                        onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, scale_max: parseInt(e.target.value) } : item))}
                                                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-indigo-400 outline-none w-16"
                                                    />
                                                </div>
                                                <div className="space-y-1 flex-1 min-w-[150px]">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Labels (Min | Max)</label>
                                                    <div className="flex gap-1.5">
                                                        <input 
                                                            placeholder="Min Label"
                                                            value={q.options?.[0] || ''}
                                                            onChange={e => {
                                                                const next = [...(q.options || ['', ''])];
                                                                next[0] = e.target.value;
                                                                setQuestions(questions.map(item => item.id === q.id ? { ...item, options: next } : item));
                                                            }}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none"
                                                        />
                                                        <input 
                                                            placeholder="Max Label"
                                                            value={q.options?.[1] || ''}
                                                            onChange={e => {
                                                                const next = [...(q.options || ['', ''])];
                                                                next[1] = e.target.value;
                                                                setQuestions(questions.map(item => item.id === q.id ? { ...item, options: next } : item));
                                                            }}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {q.type === 'faces' && (
                                            <div className="mt-2 pl-9 flex items-center gap-3">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Preview:</div>
                                                <div className="flex items-center gap-2.5">
                                                    <Smile className="w-4 h-4 text-emerald-500" />
                                                    <Smile className="w-4 h-4 text-emerald-400" />
                                                    <Meh className="w-4 h-4 text-slate-400" />
                                                    <Frown className="w-4 h-4 text-orange-400" />
                                                    <Frown className="w-4 h-4 text-rose-500" />
                                                </div>
                                                <div className="text-[10px] font-black text-indigo-500/40 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">Clinical 5-Point Scale</div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-white/5">
                                    <button onClick={() => addQuestion('short_text')} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group flex flex-col items-center gap-1">
                                        <FileText size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Text</span>
                                    </button>
                                    <button onClick={() => addQuestion('choice')} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group flex flex-col items-center gap-1">
                                        <List size={14} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Radio</span>
                                    </button>
                                    <button onClick={() => addQuestion('checkbox' as any)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-sky-500/30 hover:bg-sky-500/5 transition-all group flex flex-col items-center gap-1">
                                        <CheckSquare size={14} className="text-slate-500 group-hover:text-sky-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Checkboxes</span>
                                    </button>
                                    <button onClick={() => addQuestion('yesno')} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group flex flex-col items-center gap-1">
                                        <CheckSquare size={14} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Yes / No</span>
                                    </button>
                                    <button onClick={() => addQuestion('date')} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group flex flex-col items-center gap-1">
                                        <Calendar size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Date</span>
                                    </button>
                                    <button onClick={() => addQuestion('faces')} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group flex flex-col items-center gap-1">
                                        <Sparkles size={14} className="text-slate-500 group-hover:text-pink-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Emoji</span>
                                    </button>
                                    <button onClick={() => addQuestion('scale')} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group flex flex-col items-center gap-1">
                                        <MousePointer2 size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Slider</span>
                                    </button>
                                    <button onClick={() => addQuestion('likert')} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group flex flex-col items-center gap-1">
                                        <Layers size={14} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider text-center">Grid</span>
                                    </button>
                                </div>
                            </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={saveStructured}
                                disabled={isSaving}
                                className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white uppercase tracking-wider hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save Form'}
                            </button>
                            <button
                                onClick={() => setViewMode('LIBRARY')}
                                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-400 uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        <div className="bg-[#0B101B]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Tools</h3>
                                <div className="px-2 py-0.5 bg-blue-500/10 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-wider border border-blue-500/20">AI V2</div>
                            </div>
                            
                            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-4 opacity-70">
                                Automatically extract question fields directly from your uploaded PDF protocol.
                            </p>

                            <div className="space-y-2">
                                <button
                                    onClick={runAIExtraction}
                                    disabled={isSaving || !editingId}
                                    className="w-full py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm font-bold text-indigo-400 uppercase tracking-wider hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    {isSaving ? 'Extracting...' : 'AI Auto-Extract'}
                                </button>
                                
                                <button
                                    onClick={() => setShowSmartPaste(true)}
                                    className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-bold text-emerald-400 uppercase tracking-wider hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Terminal className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    Smart Paste
                                </button>

                                <button
                                    onClick={fetchSourceLines}
                                    disabled={!editingId}
                                    className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-400 uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <FileSearch className="w-3.5 h-3.5" />
                                    Source Mapping
                                </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" /> System Status
                                </h4>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span className="text-slate-500">Status</span>
                                        <span className="text-emerald-500 uppercase">Ready</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span className="text-slate-500">Sync</span>
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
                    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-md">
                        <motion.div 
                             initial={{ scale: 0.95, opacity: 0 }} 
                             animate={{ scale: 1, opacity: 1 }} 
                             exit={{ scale: 0.95, opacity: 0 }}
                             className="bg-[#0F172A] border border-white/10 rounded-2xl w-full h-full max-w-5xl overflow-hidden flex flex-col shadow-2xl"
                         >
                             <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                         <FileText className="text-blue-400" size={20} />
                                     </div>
                                     <div>
                                         <h3 className="text-base font-bold text-white">PDF Preview</h3>
                                         <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Protocol Document</p>
                                     </div>
                                 </div>
                                <button onClick={closePreview} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 bg-black/40">
                                <iframe src={`${previewPdf}#toolbar=0`} className="w-full h-full border-none" />
                            </div>
                        </motion.div>
                    </div>
                )}

                {previewData && (
                    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-md">
                        <motion.div 
                             initial={{ scale: 0.95, opacity: 0 }} 
                             animate={{ scale: 1, opacity: 1 }} 
                             exit={{ scale: 0.95, opacity: 0 }}
                             className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-3xl h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <Layout className="text-purple-400" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">{previewData.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Form Preview</p>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B101B]/40">
                                {previewData.json_structure?.instructions && (
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Instructions</div>
                                        <p className="text-xs text-slate-300 leading-relaxed font-medium">{previewData.json_structure.instructions}</p>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Questions ({previewData.json_structure?.questions?.length || 0})</div>
                                    {previewData.json_structure?.questions?.map((q, i) => (
                                        <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs font-bold text-indigo-400">{i + 1}.</span>
                                                <h4 className="text-xs font-bold text-white">{q.label}</h4>
                                            </div>
                                            <div className="pl-5">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{q.type.replace('_', ' ')}</span>
                                                {q.options && q.options.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {q.options.map((opt, oi) => (
                                                            <span key={oi} className="px-2.5 py-0.5 bg-indigo-500/5 border border-indigo-500/10 rounded-full text-[10px] font-bold text-indigo-300">
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
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h4 className="text-base font-bold text-white">Source Lines</h4>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Select questions or options from the protocol file</p>
                                </div>
                                <button onClick={() => setShowSourceText(false)} className="p-2 text-slate-500 hover:text-white transition-all"><X size={16} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {sourceLines.map((line, idx) => (
                                    <div key={idx} className="w-full bg-white/5 border border-white/5 rounded-xl p-3 hover:border-indigo-500/30 transition-all group">
                                        <p className="text-xs font-medium text-slate-300 group-hover:text-white mb-2">{line}</p>
                                        <div className="flex items-center gap-2">
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
                                                className="flex-1 py-2 bg-indigo-500/10 rounded-lg text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2"
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
                                                className="flex-1 py-2 bg-pink-500/10 rounded-lg text-xs font-bold text-pink-400 hover:bg-pink-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Layers className="w-3 h-3" /> + Options
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
                {showSmartPaste && (
                    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-md">
                        <motion.div 
                             initial={{ scale: 0.95, opacity: 0 }} 
                             animate={{ scale: 1, opacity: 1 }} 
                             exit={{ scale: 0.95, opacity: 0 }}
                             className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Terminal className="text-emerald-400" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">Smart AI Paste</h3>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Paste raw protocol text to extract fields</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSmartPaste(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <textarea
                                    id="smart-paste-input"
                                    placeholder="Paste eligibility criteria, PHQ-9 questions, or clinical notes here..."
                                    className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-emerald-500/30 transition-all font-mono leading-relaxed"
                                />
                                <button
                                    onClick={() => {
                                        const val = (document.getElementById('smart-paste-input') as HTMLTextAreaElement)?.value;
                                        if (val) {
                                            handleSmartImport(val);
                                            setShowSmartPaste(false);
                                        }
                                    }}
                                    className="w-full py-3 bg-emerald-600 rounded-xl text-sm font-bold text-white uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Run Neural Extraction
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {statusMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 20 }} 
                        className={`fixed bottom-8 right-8 px-5 py-3 rounded-xl border flex items-center gap-3 z-[1000] backdrop-blur-xl ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                    >
                        {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        <span className="text-xs font-semibold">{statusMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
