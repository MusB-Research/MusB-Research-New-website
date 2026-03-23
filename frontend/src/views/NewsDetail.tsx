import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Calendar } from 'lucide-react';
import { fetchNewsDetail, fetchEventDetail } from '../api';
import { motion } from 'framer-motion';

export default function NewsDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDetail = async () => {
            if (!id) return;
            try {
                // Try fetching as news first
                const newsData = await fetchNewsDetail(id);
                setItem({
                    ...newsData,
                    isEvent: false,
                    content: newsData.content || '',
                    date: new Date(newsData.published_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                });
            } catch (err) {
                // If 404, try event
                try {
                    const eventData = await fetchEventDetail(id);
                    setItem({
                        ...eventData,
                        isEvent: true,
                        type: 'Event',
                        content: eventData.description || '',
                        date: new Date(eventData.date || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    });
                } catch (eventErr) {
                    console.error("Failed to fetch detail", eventErr);
                    navigate('/news');
                }
            } finally {
                setLoading(false);
            }
        };
        loadDetail();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen pt-40 pb-20 flex flex-col items-center justify-center text-cyan-400">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="mt-4 font-bold uppercase tracking-widest text-sm">Loading</p>
            </div>
        );
    }

    if (!item) return null;

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden pt-40 pb-24 px-4 md:px-12">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
            </div>

            <main className="max-w-4xl mx-auto space-y-12 relative z-10">
                <Link to="/news" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-cyan-400 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to News & Events
                </Link>

                <motion.article 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-10 relative"
                >
                    <div className="prose prose-invert prose-cyan max-w-none prose-lg relative z-10">
                        {item.content?.split('\n').map((paragraph: string, i: number) => (
                            paragraph.trim() ? (
                                <p key={i} className="leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">
                                    {paragraph}
                                </p>
                            ) : <br key={i} />
                        ))}
                    </div>
                </motion.article>
            </main>
        </div>
    );
}
