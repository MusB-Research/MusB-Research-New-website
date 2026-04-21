import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Send, Image as ImageIcon, Sparkles, Megaphone, Calendar, Briefcase,
    Loader2, ShieldCheck, CheckCircle2, FileText, Link as LinkIcon,
    Bold, Italic, Underline, ExternalLink, X,
} from 'lucide-react';
import { authFetch, API } from '../../utils/auth';

const API_URL = API || 'http://localhost:8000';

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
        if (linkUrl) exec('createLink', linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`);
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
    label, value, onChange, accentClass = 'border-indigo-500/50',
}: { label: string; value: File | null; onChange: (f: File) => void; accentClass?: string }) {
    const [preview, setPreview] = useState<string | null>(null);
    const [converting, setConverting] = useState(false);

    const handle = async (file: File) => {
        setConverting(true);
        const webp = await convertToWebP(file);
        setConverting(false);
        onChange(webp);
        setPreview(URL.createObjectURL(webp));
    };

    return (
        <div className="space-y-2">
            <label className={`text-[12px] font-black text-indigo-400 uppercase tracking-widest italic`}>{label}</label>
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
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors text-center px-2">
                        {converting ? 'Converting to WebP…' : value ? `✓ ${value.name}` : 'Click to upload · Auto-converted to WebP'}
                    </p>
                </div>
                <input type="file" className="hidden" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
            </label>
        </div>
    );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function SubmitContentForms({ userRole }: { userRole: string }) {
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
            } else if (activeForm === 'event') {
                body.append('title', formData.title);
                body.append('description', formData.description);
                body.append('event_date', new Date(formData.event_date).toISOString());
                if (formData.link) body.append('link', formData.link);
            } else if (activeForm === 'partnership') {
                body.append('name', formData.title || formData.name);
                body.append('description', formData.description);
                if (formData.link) body.append('link', formData.link);
                if (formData.image) body.append('logo', formData.image);
            } else if (activeForm === 'publication') {
                body.append('title', formData.title);
                body.append('authors', formData.authors);
                body.append('journal', formData.journal);
                body.append('publication_date', formData.publication_date);
                if (formData.link) body.append('link', formData.link);
                if (formData.abstract) body.append('abstract', formData.abstract);
            } else if (activeForm === 'education') {
                body.append('title', formData.title);
                body.append('content', formData.description);
                body.append('category', formData.category);
                if (formData.file) body.append('file', formData.file);
                if (formData.link) body.append('link', formData.link);
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
                    category: '', file: null,
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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_15px_#a855f7]" />
                        <span className="text-sm font-black text-purple-400 uppercase tracking-[0.4em] italic">Transmission Control</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">
                        Content <span className="text-[#a855f7]">Creation</span> Center
                    </h1>
                    <p className="text-[12px] sm:text-base text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-3">
                        {isSuperAdmin ? 'Master node authorized for direct global publication' : 'Submit protocol data packets and community updates for verification'}
                    </p>
                </div>
                <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6 shadow-2xl backdrop-blur-xl">
                    <div className="text-right">
                        <p className="text-[12px] font-black text-[#555a7a] uppercase tracking-[0.3em]">{isSuperAdmin ? 'Direct Access' : 'Buffer Status'}</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter mt-1">{isSuperAdmin ? 'SYNCED' : 'WAITING'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/20 border border-[#a855f7]/30 flex items-center justify-center text-[#a855f7]">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Form Area */}
            <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl bg-gradient-to-br from-[#0f1133] to-[#0a0b1a]">
                {/* Tabs */}
                <div className="p-2 border-b border-white/5 bg-white/[0.02] flex flex-wrap gap-2">
                    {(['news', 'event', 'partnership', 'publication', 'education'] as const).map((type) => (
                        <button key={type} type="button" onClick={() => setActiveForm(type)}
                            className={`flex items-center gap-4 px-10 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${activeForm === type ? 'text-white' : 'text-[#555a7a] hover:text-white hover:bg-white/5'}`}>
                            {activeForm === type && (
                                <motion.div layoutId="formTabGlow"
                                    className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20" />
                            )}
                            <span className={`relative z-10 transition-transform group-hover:scale-110 ${activeForm === type ? 'text-purple-400' : ''}`}>
                                {getFormIcon(type)}
                            </span>
                            <span className="relative z-10">{type}</span>
                            {activeForm === type && (
                                <motion.div layoutId="formTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-10 lg:p-16">
                    <form onSubmit={handleSubmit} className="space-y-10 max-w-4xl">

                        {/* Title */}
                        <div className="space-y-4">
                            <label className="text-sm font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic mb-2">
                                <Sparkles className="w-5 h-5 text-purple-400" /> Essential Identification
                            </label>
                            <input
                                required type="text" value={formData.title}
                                onChange={e => set({ title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-8 text-2xl text-white font-black italic uppercase tracking-tight outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-800"
                                placeholder={`Enter ${activeForm} title…`}
                            />
                        </div>

                        {/* Dynamic Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {activeForm === 'event' && (
                                <div className="col-span-1 space-y-4">
                                    <label className="text-[12px] font-black text-amber-400 uppercase tracking-widest italic">Date & Time</label>
                                    <input required type="datetime-local" value={formData.event_date}
                                        onChange={e => set({ event_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-amber-500/50" />
                                </div>
                            )}

                            {(activeForm === 'news' || activeForm === 'partnership') && (
                                <div className="col-span-1">
                                    <ImageUploader
                                        label={activeForm === 'partnership' ? 'Corporate Logo / Asset' : 'Visual Media Asset'}
                                        value={formData.image}
                                        onChange={f => set({ image: f })}
                                    />
                                </div>
                            )}

                            {activeForm === 'publication' && (
                                <>
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-[12px] font-black text-emerald-400 uppercase tracking-widest italic">Primary Authors</label>
                                        <input required type="text" value={formData.authors}
                                            onChange={e => set({ authors: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-emerald-500/50"
                                            placeholder="e.g., Dr. Smith, J. Doe" />
                                    </div>
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-[12px] font-black text-emerald-400 uppercase tracking-widest italic">Scientific Journal / Outlet</label>
                                        <input required type="text" value={formData.journal}
                                            onChange={e => set({ journal: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-emerald-500/50"
                                            placeholder="e.g., Nature Medicine" />
                                    </div>
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-[12px] font-black text-emerald-400 uppercase tracking-widest italic">Publication Date</label>
                                        <input required type="date" value={formData.publication_date}
                                            onChange={e => set({ publication_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-emerald-500/50" />
                                    </div>
                                </>
                            )}

                            {activeForm === 'education' && (
                                <>
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-[12px] font-black text-purple-400 uppercase tracking-widest italic">Resource Category</label>
                                        <input required type="text" value={formData.category}
                                            onChange={e => set({ category: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-lg text-white font-black outline-none focus:border-purple-500/50"
                                            placeholder="e.g., Patient Guide, Methodology" />
                                    </div>
                                    <div className="col-span-1 space-y-4">
                                        <label className="text-[12px] font-black text-purple-400 uppercase tracking-widest italic">Digital Asset (PDF / Doc)</label>
                                        <label className="relative flex flex-col items-center justify-center w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-purple-500/50 transition-all group">
                                            <FileText className="w-10 h-10 mb-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
                                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white">
                                                {formData.file ? `✓ ${formData.file.name}` : 'Click to upload'}
                                            </p>
                                            <input type="file" className="hidden"
                                                onChange={e => { const f = e.target.files?.[0]; if (f) set({ file: f }); }} />
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ── Link Field (ALL forms) ── */}
                        <div className="space-y-3">
                            <label className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 italic">
                                <LinkIcon className="w-4 h-4" />
                                {activeForm === 'publication' ? 'DOI / Article Link' : activeForm === 'partnership' ? 'Partner Website' : 'Reference / External Link'}
                                <span className="text-slate-600 text-[11px] normal-case not-italic tracking-normal font-normal">(optional)</span>
                            </label>
                            <input
                                type="url"
                                value={formData.link}
                                onChange={e => set({ link: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-base text-white font-medium outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                                placeholder="https://example.com"
                            />
                            {/* Live clickable preview */}
                            <LinkPreview url={formData.link} />
                        </div>

                        {/* ── Rich Text Content ── */}
                        <div className="space-y-4">
                            <label className="text-sm font-black text-[#555a7a] uppercase tracking-widest flex items-center gap-2 italic">
                                <ShieldCheck className="w-5 h-5 text-purple-400" />
                                {activeForm === 'news' ? 'Article Content' : 'Description / Narrative'}
                                <span className="text-slate-600 text-[11px] normal-case not-italic tracking-normal font-normal ml-2">
                                    Bold, Italic, Links supported — formatting preserved on paste
                                </span>
                            </label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={html => set({ description: html })}
                                placeholder={`Enter detailed content for the ${activeForm}…`}
                            />
                        </div>

                        {/* News: Success Story Toggle */}
                        {activeForm === 'news' && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-6 p-8 bg-purple-500/5 border border-white/5 rounded-[2rem]">
                                <input
                                    type="checkbox" id="success_story_toggle"
                                    checked={formData.is_success_story}
                                    onChange={e => set({ is_success_story: e.target.checked })}
                                    className="w-6 h-6 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500/50 accent-purple-500 cursor-pointer"
                                />
                                <div>
                                    <label htmlFor="success_story_toggle"
                                        className="text-sm font-black text-white uppercase italic tracking-[0.2em] cursor-pointer">
                                        Featured Success Narrative
                                    </label>
                                    <p className="text-[12px] text-[#555a7a] font-black uppercase tracking-widest mt-1">
                                        This will prioritize the article in global high-impact streams.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Submit */}
                        <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-end items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest">Integrity Check</p>
                                <p className="text-[12px] font-black text-emerald-500 uppercase italic mt-1">Ready for Transmission</p>
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full sm:w-auto px-16 py-6 bg-purple-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] italic flex items-center justify-center gap-4 shadow-2xl shadow-purple-900/40 hover:bg-purple-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                {submitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Streaming Data…</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Authorize Sequence</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Platform Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Cluster Connectivity', value: '100%', color: 'text-emerald-500' },
                    { label: 'Uptime', value: '99.9%', color: 'text-purple-400' },
                    { label: 'Encryption', value: 'AES-GCM', color: 'text-indigo-400' },
                    { label: 'Image Format', value: 'WebP', color: 'text-cyan-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center">
                        <p className="text-[12px] font-black text-[#555a7a] uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={`text-base font-black italic ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
