import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Save, Layout, FileText, List, Calendar,
    X, AlertCircle, ChevronDown, Layers, MousePointer2,
    CheckSquare, GripVertical, Settings2, Trash2, Upload, Eye, FileUp
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
}

interface Template {
    id: string;
    name: string;
    pdf_file: string | null;
    json_structure: { questions?: Question[] };
    created_at: string;
}

export default function QuestionnaireBuilder() {
    const [viewMode, setViewMode] = useState<'BUILDER' | 'LIBRARY'>('LIBRARY');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Builder State
    const [name, setName] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('pdf_file', file);
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

    const saveStructured = async () => {
        if (!name) return alert("Enter a name");
        setIsSaving(true);
        try {
            const res = await authFetch(`${API}/api/questionnaire-templates/`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    json_structure: { questions }
                })
            });
            if (res.ok) {
                setViewMode('LIBRARY');
                fetchTemplates();
                setName('');
                setQuestions([]);
            }
        } catch (err) { } finally { setIsSaving(false); }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Clinical Instrument Library
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 font-medium opacity-70">
                        {viewMode === 'LIBRARY' ? "Manage clinical assesssment templates and PDF protocols." : "Design structured electronic case report forms."}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setViewMode(viewMode === 'LIBRARY' ? 'BUILDER' : 'LIBRARY')}
                        className="px-6 py-3 rounded-xl border border-white/10 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                        {viewMode === 'LIBRARY' ? 'Open Form Designer' : 'Back to Library'}
                    </button>
                    {viewMode === 'LIBRARY' && (
                        <>
                            <input type="file" hidden ref={fileInputRef} onChange={handlePdfUpload} accept=".pdf" />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-3 px-8 py-3 bg-indigo-600 rounded-xl text-[12px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                            >
                                <Upload className="w-4 h-4" />
                                {isUploading ? 'Uploading...' : 'Quick PDF Ingest'}
                            </button>
                        </>
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
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(t.created_at).toLocaleDateString()}</div>
                            </div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight truncate">{t.name}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                                {t.pdf_file ? 'Source: Legal PDF Protocol' : `Source: Structured Form (${t.json_structure?.questions?.length || 0} fields)`}
                            </p>

                            <div className="flex items-center gap-3 mt-6">
                                {t.pdf_file && (
                                    <button
                                        onClick={() => window.open(`${API}${t.pdf_file}`, '_blank')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all"
                                    >
                                        <Eye className="w-3 h-3" /> Preview
                                    </button>
                                )}
                                <button className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">Details</button>
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
                        <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Create Structured Template</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="bg-[#0f172a] border border-white/5 rounded-[2rem] p-8">
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter Questionnaire Name..."
                                className="w-full bg-transparent text-4xl font-black text-white uppercase italic outline-none mb-8 border-b border-white/5 pb-4 focus:border-indigo-500/50"
                            />

                            <div className="space-y-4">
                                {questions.map((q, i) => (
                                    <div key={q.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center gap-6">
                                            <span className="text-xl font-black text-slate-700">0{i + 1}</span>
                                            <input
                                                value={q.label}
                                                onChange={e => setQuestions(questions.map(item => item.id === q.id ? { ...item, label: e.target.value } : item))}
                                                className="bg-transparent text-lg font-bold text-white outline-none"
                                            />
                                        </div>
                                        <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="p-2 opacity-0 group-hover:opacity-100 text-rose-500"><X /></button>
                                    </div>
                                ))}
                                <button onClick={() => addQuestion('short_text')} className="w-full py-6 border-2 border-dashed border-white/5 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:border-indigo-500/30 transition-all">+ Add New Clinical Field</button>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Template Actions</h3>
                            <button
                                onClick={saveStructured}
                                disabled={isSaving || !name}
                                className="w-full py-4 bg-indigo-600 rounded-xl text-[12px] font-black text-white uppercase opacity-90 hover:opacity-100 transition-all flex items-center justify-center gap-3"
                            >
                                <Save className="w-4 h-4" /> {isSaving ? 'Synchronizing...' : 'Save Template to Library'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
