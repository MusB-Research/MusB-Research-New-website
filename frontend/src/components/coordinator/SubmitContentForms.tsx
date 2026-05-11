import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Send, Image as ImageIcon, Sparkles, Megaphone, Calendar, Briefcase,
    Loader2, ShieldCheck, CheckCircle2, FileText, Link as LinkIcon,
    Bold, Italic, Underline, ExternalLink, X,
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';
import { getMediaUrl } from '../../utils/media';

const API_URL = API || 'http://localhost:8003';

// ── WebP converter ──────────────────────────────────────────────────────────
async function convertToWebP(file: File): Promise<File> {
    if (file.type === 'image/webp') return file;
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d')!.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            canvas.toBlob((blob) => {
                if (!blob) { resolve(file); return; }
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
            }, 'image/webp', 0.92);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

// ── Rich text toolbar ───────────────────────────────────────────────────────
function RichTextEditor({
    value, onChange, placeholder,
}: { value: string; onChange: (html: string) => void; placeholder: string }) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const savedRange = useRef<Range | null>(null);

    // Sync incoming value once on mount
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, []); // eslint-disable-line

    const exec = (cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        onChange(editorRef.current?.innerHTML ?? '');
    };

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
    };

    const restoreSelection = () => {
        const sel = window.getSelection();
        if (sel && savedRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
    };

    const insertLink = () => {
        restoreSelection();
        const sel = window.getSelection();
        const fullUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;

        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            // Text is selected, wrap it in a link
            exec('createLink', fullUrl);
        } else if (linkUrl) {
            // No selection, insert the URL as the link text
            exec('insertHTML', `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`);
        }
        setShowLinkInput(false);
        setLinkUrl('');
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        // Preserve bold/italic/links, strip everything else (colors, fonts, etc.)
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        if (html) {
            const clean = sanitizePastedHtml(html);
            document.execCommand('insertHTML', false, clean);
        } else {
            document.execCommand('insertText', false, text);
        }
        onChange(editorRef.current?.innerHTML ?? '');
    };

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-white/5 border border-white/10 rounded-xl">
                <ToolBtn title="Bold" onClick={() => exec('bold')} icon={<Bold className="w-4 h-4" />} />
                <ToolBtn title="Italic" onClick={() => exec('italic')} icon={<Italic className="w-4 h-4" />} />
                <ToolBtn title="Underline" onClick={() => exec('underline')} icon={<Underline className="w-4 h-4" />} />
                <div className="w-px h-5 bg-white/10 mx-1" />
                <ToolBtn
                    title="Insert Link"
                    icon={<LinkIcon className="w-4 h-4" />}
                    onClick={() => { saveSelection(); setShowLinkInput(v => !v); }}
                />
                <ToolBtn title="Remove Link" onClick={() => exec('unlink')} icon={<X className="w-3.5 h-3.5" />} />
            </div>

            {/* Link input row */}
            {showLinkInput && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2">
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && insertLink()}
                        placeholder="https://example.com"
                        className="flex-1 bg-white/5 border border-cyan-500/40 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        autoFocus
                    />
                    <button type="button" onClick={insertLink}
                        className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-xl font-bold hover:bg-cyan-500">
                        Insert
                    </button>
                    <button type="button" onClick={() => setShowLinkInput(false)}
                        className="px-3 py-2 text-slate-400 hover:text-white text-sm rounded-xl">
                        Cancel
                    </button>
                </motion.div>
            )}

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                className={`
                    w-full min-h-[200px] bg-white/5 border border-white/10 rounded-[1.5rem]
                    px-8 py-6 text-base text-slate-200 font-normal leading-relaxed
                    outline-none focus:border-purple-500/50 transition-all
                    [&_b]:font-bold [&_strong]:font-bold [&_strong]:text-white [&_b]:text-white
                    [&_i]:italic [&_em]:italic
                    [&_u]:underline
                    [&_a]:text-cyan-400 [&_a]:underline [&_a]:cursor-pointer
                    empty:before:content-[attr(data-placeholder)]
                    empty:before:text-slate-700 empty:before:pointer-events-none
                `}
                spellCheck="false"
                data-gramm="false"
                data-quillbot-element="true"
            />
        </div>
    );
}

function ToolBtn({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
            {icon}
        </button>
    );
}

/** Strip colors/fonts/spans but keep bold, italic, underline, and links */
function sanitizePastedHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;

    const walk = (el: Element) => {
        Array.from(el.children).forEach(child => {
            walk(child);
            const tag = child.tagName.toLowerCase();
            // Keep structural tags
            const keep = ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'ul', 'ol', 'li'];
            if (!keep.includes(tag)) {
                // Replace non-keep elements with their children
                const inner = document.createDocumentFragment();
                while (child.firstChild) inner.appendChild(child.firstChild);
                child.replaceWith(inner);
            } else {
                // Strip all attributes except href on <a>
                Array.from(child.attributes).forEach(attr => {
                    if (!(tag === 'a' && attr.name === 'href')) child.removeAttribute(attr.name);
                });
                // Ensure links open in new tab
                if (tag === 'a') {
                    (child as HTMLAnchorElement).target = '_blank';
                    (child as HTMLAnchorElement).rel = 'noopener noreferrer';
                }
            }
        });
    };
    walk(div);
    return div.innerHTML;
}

// ── Link preview ────────────────────────────────────────────────────────────
function LinkPreview({ url }: { url: string }) {
    if (!url) return null;
    const isValid = /^https?:\/\/.+/.test(url) || url.includes('.');
    const href = url.startsWith('http') ? url : `https://${url}`;
    return (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <ExternalLink className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            {isValid ? (
                <a href={href} target="_blank" rel="noopener noreferrer"
                    className="text-cyan-400 underline text-sm font-medium truncate hover:text-cyan-300">
                    {url}
                </a>
            ) : (
                <span className="text-slate-500 text-sm truncate">{url}</span>
            )}
        </motion.div>
    );
}

// ── Image upload with WebP conversion ──────────────────────────────────────
function ImageUploader({
    label, value, onChange, accentClass = 'border-indigo-500/50', existingImageUrl
}: { label: string; value: File | null; onChange: (f: File) => void; accentClass?: string; existingImageUrl?: string }) {
    const [preview, setPreview] = useState<string | null>(null);
    const [converting, setConverting] = useState(false);

    // Sync preview with existingImageUrl if no new file is selected
    useEffect(() => {
        if (!value && existingImageUrl) {
            setPreview(getMediaUrl(existingImageUrl));
        }
    }, [value, existingImageUrl]);

    const handle = async (file: File) => {
        setConverting(true);
        const webp = await convertToWebP(file);
        setConverting(false);
        onChange(webp);
        setPreview(URL.createObjectURL(webp));
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{label}</label>
            <label className={`relative flex flex-col items-center justify-center w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:${accentClass} transition-all group overflow-hidden`}>
                {preview ? (
                    <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                ) : null}
                <div className="relative z-10 flex flex-col items-center justify-center pt-5 pb-6">
                    {converting ? (
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    ) : (
                        <ImageIcon className="w-10 h-10 mb-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    )}
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-white transition-colors text-center px-2">
                        {converting ? 'Converting…' : value ? `✓ ${value.name}` : 'Upload Image'}
                    </p>
                </div>
                <input type="file" className="hidden" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
            </label>
        </div>
    );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function SubmitContentForms({ userRole, editData }: { userRole: string; editData?: any }) {
    const [submitting, setSubmitting] = useState(false);
    const [activeForm, setActiveForm] = useState<'news' | 'event' | 'partnership' | 'publication' | 'education'>('news');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: null as File | null,
        is_success_story: false,
        event_date: '',
        name: '',
        link: '',
        authors: '',
        journal: '',
        publication_date: '',
        abstract: '',
        category: '',
        file: null as File | null,
        youtube_url: '',
        sequence: 0,
    });

    const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
    const set = (patch: Partial<typeof formData>) => setFormData(p => ({ ...p, ...patch }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const body = new FormData();
            body.append('status', isSuperAdmin ? 'approved' : 'pending');

            if (activeForm === 'news') {
                body.append('title', formData.title);
                body.append('content', formData.description);
                if (formData.image) body.append('image', formData.image);
                body.append('is_success_story', String(formData.is_success_story));
                if (formData.link) body.append('link', formData.link);
                body.append('sequence', String(formData.sequence));
            } else if (activeForm === 'event') {
                body.append('title', formData.title);
                body.append('description', formData.description);
                body.append('date', new Date(formData.event_date).toISOString());
                if (formData.image) body.append('image', formData.image);
                if (formData.link) body.append('link', formData.link);
                body.append('sequence', String(formData.sequence));
            } else if (activeForm === 'partnership') {
                body.append('name', formData.title || formData.name);
                body.append('description', formData.description);
                if (formData.link) body.append('link', formData.link);
                if (formData.image) body.append('logo', formData.image);
                body.append('sequence', String(formData.sequence));
            } else if (activeForm === 'publication') {
                body.append('title', formData.title);
                body.append('authors', formData.authors);
                body.append('journal', formData.journal);
                body.append('publication_date', formData.publication_date);
                if (formData.link) body.append('link', formData.link);
                if (formData.abstract) body.append('abstract', formData.abstract);
                body.append('sequence', String(formData.sequence));
            } else if (activeForm === 'education') {
                body.append('title', formData.title);
                body.append('content', formData.description || formData.title);
                body.append('category', formData.category);
                if (formData.image) body.append('file', formData.image);
                if (formData.youtube_url) body.append('youtube_url', formData.youtube_url);
                body.append('sequence', String(formData.sequence));
            }

            const endpointMap: Record<string, string> = {
                news: 'news', event: 'events', partnership: 'partnerships',
                publication: 'publications', education: 'education',
            };
            const res = await authFetch(`${API_URL}/api/${endpointMap[activeForm]}/`, { method: 'POST', body });
            if (res.ok) {
                alert(isSuperAdmin ? 'Content is now live!' : 'Submitted for review.');
                setFormData({
                    title: '', description: '', image: null, is_success_story: false, event_date: '',
                    name: '', link: '', authors: '', journal: '', publication_date: '', abstract: '',
                    category: '', file: null, youtube_url: '', sequence: 0,
                });
            } else {
                const errJson = await res.json().catch(() => null);
                alert(`Error: ${errJson ? JSON.stringify(errJson) : res.status}`);
            }
        } catch (err) {
            console.error(err);
            alert('Submission failed. Check console for details.');
        } finally {
            setSubmitting(false);
        }
    };

    const getFormIcon = (type: string) => {
        const icons: Record<string, React.ReactNode> = {
            news: <Megaphone className="w-4 h-4" />,
            event: <Calendar className="w-4 h-4" />,
            partnership: <Briefcase className="w-4 h-4" />,
            publication: <FileText className="w-4 h-4" />,
            education: <Sparkles className="w-4 h-4" />,
        };
        return icons[type] ?? <Sparkles className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Content Manager</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
                        New <span className="text-[#a855f7]">Post</span>
                    </h1>
                    <p className="text-xs text-[#8b8fa8] uppercase tracking-wider font-bold mt-2">
                        {isSuperAdmin ? 'Ready to publish live' : 'Submit your content for review'}
                    </p>
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 shadow-xl backdrop-blur-xl">
                    <div className="text-right">
                        <p className="text-xs font-bold text-[#555a7a] uppercase tracking-wider">{isSuperAdmin ? 'Access' : 'Status'}</p>
                        <p className="text-lg font-bold text-white tracking-tight">{isSuperAdmin ? 'SYNCED' : 'WAITING'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#a855f7]/20 border border-[#a855f7]/30 flex items-center justify-center text-[#a855f7]">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Form Area */}
            <div className="bg-[#0f1133] border border-white/5 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#0f1133] to-[#0a0b1a]">
                {/* Tabs */}
                <div className="p-1 border-b border-white/5 bg-white/[0.02] flex flex-wrap gap-1">
                    {(['news', 'event', 'partnership', 'publication', 'education'] as const).map((type) => (
                        <button key={type} type="button" onClick={() => setActiveForm(type)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all relative overflow-hidden group ${activeForm === type ? 'text-white' : 'text-[#555a7a] hover:text-white hover:bg-white/5'}`}>
                            {activeForm === type && (
                                <motion.div layoutId="formTabGlow"
                                    className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20" />
                            )}
                            <span className={`relative z-10 transition-transform group-hover:scale-110 ${activeForm === type ? 'text-purple-400' : ''}`}>
                                {getFormIcon(type)}
                            </span>
                            <span className="relative z-10">{type}</span>
                        </button>
                    ))}
                </div>

                <div className="p-6 lg:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#555a7a] uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" /> Title
                            </label>
                            <input
                                required type="text" value={formData.title || ''}
                                onChange={e => set({ title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-lg text-white font-bold outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-800"
                                placeholder={`Enter ${activeForm} title…`}
                            />
                        </div>

                        {/* Dynamic Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {activeForm === 'event' && (
                                <div className="col-span-1 space-y-2">
                                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">Date & Time</label>
                                    <input required type="datetime-local" value={formData.event_date || ''}
                                        onChange={e => set({ event_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-bold outline-none focus:border-amber-500/50" />
                                </div>
                            )}

                            {(activeForm === 'news' || activeForm === 'event' || activeForm === 'partnership') && (
                                <div className="col-span-1">
                                    <ImageUploader
                                        label={activeForm === 'partnership' ? 'Corporate Logo / Asset' : 'Visual Media Asset'}
                                        value={formData.image}
                                        onChange={f => set({ image: f })}
                                        existingImageUrl={editData?.image_url || editData?.image || editData?.logo_url || editData?.logo}
                                    />
                                </div>
                            )}

                            <div className="col-span-1 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sequence (Order)</label>
                                <input type="number" value={formData.sequence ?? 0}
                                    onChange={e => set({ sequence: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-bold outline-none focus:border-white/20"
                                    placeholder="0 (Higher = Top)" />
                            </div>

                            {activeForm === 'publication' && (
                                <>
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Authors</label>
                                        <input required type="text" value={formData.authors || ''}
                                            onChange={e => set({ authors: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50"
                                            placeholder="e.g., Dr. Smith" />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Journal</label>
                                        <input required type="text" value={formData.journal || ''}
                                            onChange={e => set({ journal: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50"
                                            placeholder="e.g., Nature Medicine" />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Date</label>
                                        <input required type="date" value={formData.publication_date || ''}
                                            onChange={e => set({ publication_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-bold outline-none focus:border-emerald-500/50" />
                                    </div>
                                </>
                            )}

                            {activeForm === 'education' && (
                                <>
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-xs font-bold text-purple-400 uppercase tracking-wider">Category</label>
                                        <input required type="text" value={formData.category || ''}
                                            onChange={e => set({ category: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-bold outline-none focus:border-purple-500/50"
                                            placeholder="e.g., Patient Guide" />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-xs font-bold text-red-500 uppercase tracking-wider">YouTube Link</label>
                                        <input required type="url" value={formData.youtube_url || ''}
                                            onChange={e => set({ youtube_url: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-bold outline-none focus:border-red-500/50"
                                            placeholder="https://www.youtube.com/watch?v=..." />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ── Link Field (ALL forms except education) ── */}
                        {activeForm !== 'education' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" /> Link (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.link || ''}
                                    onChange={e => set({ link: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-base text-white font-medium outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                    placeholder="https://example.com"
                                />
                                {/* Live clickable preview */}
                                <LinkPreview url={formData.link} />
                            </div>
                        )}

                        {/* ── Rich Text Content ── */}
                        {activeForm !== 'education' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#555a7a] uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Content
                                </label>
                                <RichTextEditor
                                    value={formData.description}
                                    onChange={html => set({ description: html })}
                                    placeholder={`Enter detailed content for the ${activeForm}…`}
                                />
                            </div>
                        )}

                        {/* News: Success Story Toggle */}
                        {activeForm === 'news' && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-4 p-6 bg-purple-500/5 border border-white/5 rounded-2xl">
                                <input
                                    type="checkbox" id="success_story_toggle"
                                    checked={formData.is_success_story}
                                    onChange={e => set({ is_success_story: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500/50 accent-purple-500 cursor-pointer"
                                />
                                <div>
                                    <label htmlFor="success_story_toggle"
                                        className="text-xs font-bold text-white uppercase tracking-wider cursor-pointer">
                                        Send to Success Story
                                    </label>
                                    <p className="text-[10px] text-[#555a7a] font-bold uppercase tracking-wider mt-1">
                                        This news will be visible in the Success Stories section on the "For Business" page.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Submit */}
                        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-end items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Ready to publish</p>
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full sm:w-auto px-10 py-4 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-purple-500 transition-all disabled:opacity-50">
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Publish Post</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Platform Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Network', value: '100%', color: 'text-emerald-500' },
                    { label: 'Uptime', value: '99.9%', color: 'text-purple-400' },
                    { label: 'Security', value: 'AES-GCM', color: 'text-indigo-400' },
                    { label: 'Format', value: 'WebP', color: 'text-cyan-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-xs font-bold text-[#555a7a] uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
