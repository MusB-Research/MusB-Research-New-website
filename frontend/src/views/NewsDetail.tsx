import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, ExternalLink } from 'lucide-react';
import { fetchNewsDetail, fetchEventDetail } from '../api';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';

/** Decode HTML entities that may have been stored by older sanitizer */
function decodeEntities(str: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

/**
 * Render rich content:
 * - If it contains HTML tags → render as HTML (dangerouslySetInnerHTML)
 *   but ensure links open in new tab.
 * - Otherwise → render as paragraphs split on newlines.
 */
function ContentRenderer({ html }: { html: string }) {
    const decoded = decodeEntities(html);
    const hasHtml = /<[a-z][\s\S]*>/i.test(decoded);

    if (hasHtml) {
        // Inject target="_blank" on all <a> tags for safety
        const safe = decoded.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
        return (
            <div
                className="news-content prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: safe }}
            />
        );
    }

    // Plain text — split on newlines and render paragraphs
    return (
        <div className="space-y-4">
            {decoded.split('\n').map((line, i) =>
                line.trim() ? (
                    <p key={i} className="text-slate-300 leading-relaxed text-base">
                        {line}
                    </p>
                ) : (
                    <div key={i} className="h-2" />
                )
            )}
        </div>
    );
}

export default function NewsDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const d = await fetchNewsDetail(id);
                setItem({
                    ...d,
                    isEvent: false,
                    content: d.content || d.description || '',
                    date: new Date(d.published_at || d.created_at || Date.now()).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    }),
                });
            } catch {
                try {
                    const e = await fetchEventDetail(id);
                    setItem({
                        ...e,
                        isEvent: true,
                        type: 'Event',
                        content: e.description || '',
                        date: new Date(e.date || Date.now()).toLocaleDateString('en-US', {
                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                        }),
                    });
                } catch {
                    navigate('/news');
                }
            } finally {
                setLoading(false);
            }
        };
        load();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen pt-40 pb-20 flex flex-col items-center justify-center text-cyan-400">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <p className="mt-4 font-bold uppercase tracking-widest text-sm">Loading</p>
            </div>
        );
    }

    if (!item) return null;

    const title = decodeEntities(item.title || '');

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden pt-36 pb-28 px-4 md:px-8">
            <SEO
                title={`${title} | MusB Research`}
                description={item.excerpt || (item.content || '').replace(/<[^>]+>/g, '').substring(0, 160)}
                canonical={`https://www.musbresearch.com/news/${id}`}
            />

            {/* Atmospheric blobs */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full" />
            </div>

            <main className="max-w-3xl mx-auto relative z-10 space-y-10">

                {/* Back nav */}
                <Link
                    to="/news"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-cyan-400 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to News &amp; Events
                </Link>

                <motion.article
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="space-y-8"
                >
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {item.type && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-widest">
                                <Tag className="w-3 h-3" />
                                {item.type}
                            </span>
                        )}
                        {item.is_success_story && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                                ★ Success Story
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.date}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                        {title}
                    </h1>

                    {/* Cover image */}
                    {item.image_url && (
                        <div className="rounded-2xl overflow-hidden border border-white/10">
                            <img
                                src={item.image_url}
                                alt={title}
                                className="w-full h-64 md:h-96 object-cover"
                            />
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-white/10" />

                    {/* Article content — HTML-aware renderer */}
                    <div className="news-article-body">
                        <ContentRenderer html={item.content} />
                    </div>

                    {/* Link button if present */}
                    {item.link && (
                        <div className="pt-4">
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-900/30"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Read Full Article
                            </a>
                        </div>
                    )}
                </motion.article>
            </main>

            {/* Scoped article styles */}
            <style>{`
                .news-article-body .news-content h1,
                .news-article-body .news-content h2,
                .news-article-body .news-content h3 {
                    color: #fff;
                    font-weight: 800;
                    margin-top: 1.75rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.25;
                }
                .news-article-body .news-content h1 { font-size: 1.75rem; }
                .news-article-body .news-content h2 { font-size: 1.35rem; }
                .news-article-body .news-content h3 { font-size: 1.125rem; }
                .news-article-body .news-content p {
                    color: #cbd5e1;
                    line-height: 1.8;
                    margin-bottom: 1rem;
                    font-size: 1rem;
                }
                .news-article-body .news-content a {
                    color: #38bdf8;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    word-break: break-word;
                }
                .news-article-body .news-content a:hover { color: #7dd3fc; }
                .news-article-body .news-content strong,
                .news-article-body .news-content b {
                    color: #fff;
                    font-weight: 700;
                }
                .news-article-body .news-content ul,
                .news-article-body .news-content ol {
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                    color: #cbd5e1;
                    line-height: 1.8;
                }
                .news-article-body .news-content li { margin-bottom: 0.35rem; }
                .news-article-body .news-content blockquote {
                    border-left: 3px solid #0ea5e9;
                    padding-left: 1rem;
                    color: #94a3b8;
                    font-style: italic;
                    margin: 1.5rem 0;
                }
                .news-article-body .news-content br { line-height: 0.5; }
            `}</style>
        </div>
    );
}
