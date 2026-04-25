import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Calendar,
    Grid,
    ArrowRight,
    Newspaper,
    Users,
    Lightbulb,
    ChevronRight,
    SearchX,
    Clock,
    MapPin,
    ExternalLink,
    Send,
    BookOpen,
    GraduationCap,
    Loader2
} from 'lucide-react';
import { NewsItem, NewsType } from '@/types';
import { authFetch , API } from '../utils/auth';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { SkeletonLoader } from '../components/shared/SkeletonLoader';
import { getMediaUrl, handleImageError } from '../utils/media';

const categories: (NewsType | 'All')[] = [
    'All',
    'News',
    'Event',
    'Partnership',
    'Publication',
    'Educational Material'
];

// Section definitions for grouped row display
const sectionDefinitions: { type: NewsType; label: string; accent: string }[] = [
    { type: 'News', label: 'Latest News', accent: 'cyan' },
    { type: 'Event', label: 'Events', accent: 'indigo' },
    { type: 'Partnership', label: 'Partnerships', accent: 'purple' },
    { type: 'Publication', label: 'Publications', accent: 'emerald' },
    { type: 'Educational Material', label: 'Educational Materials', accent: 'amber' },
];


const HARDCODED_NEWS: NewsItem[] = [];

/** Strip HTML tags, comments, and decode entities — for plain-text card previews */
const stripToPlainText = (raw: string, maxLen = 180): string => {
    if (!raw) return '';
    // 1. Remove HTML comments (e.g. <!--StartFragment-->)
    let text = raw.replace(/<!--[\s\S]*?-->/g, '');
    // 2. Replace block-level tags with a space so words don't run together
    text = text.replace(/<\/(p|div|li|br|h[1-6]|blockquote)[^>]*>/gi, ' ');
    // 3. Strip all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // 4. Decode HTML entities via textarea trick
    try {
        const txt = document.createElement('textarea');
        txt.innerHTML = text;
        text = txt.value;
    } catch {}
    // 5. Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // 6. Truncate
    return text.length > maxLen ? text.substring(0, maxLen).trimEnd() + '…' : text;
};

/** Decode HTML entities only (for titles that are already plain text but may have &amp; etc.) */
const decodeEntities = (str: string): string => {
    if (!str) return '';
    try {
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        return txt.value;
    } catch {
        return str;
    }
};

export default function News() {
    const [activeCategory, setActiveCategory] = useState<NewsType | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isLoading, setIsLoading] = useState(true);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubscribeStatus('idle');
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            setSubscribeStatus('success');
            setEmail('');
        } catch (error) {
            console.error('Subscription failed:', error);
            setSubscribeStatus('error');
        } finally {
            setSubmitting(false);
        }
    };
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const apiUrl = API || 'http://localhost:8000';
                
                // Fetch All Content Types from our API
                const [newsRes, eventsRes, partnersRes, pubsRes, eduRes] = await Promise.all([
                    authFetch(`${apiUrl}/api/news/`),
                    authFetch(`${apiUrl}/api/events/`),
                    authFetch(`${apiUrl}/api/partnerships/`),
                    authFetch(`${apiUrl}/api/publications/`),
                    authFetch(`${apiUrl}/api/education/`)
                ]);

                let combined: any[] = [];
                
                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    const newsArray = Array.isArray(newsData) ? newsData : (newsData.results || []);
                    combined = [...combined, ...newsArray.map((n: any) => ({
                        ...n,
                        type: n.is_success_story ? 'Success Story' : 'News',
                        title: decodeEntities(n.title || 'Untitled News'),
                        excerpt: stripToPlainText(n.excerpt || n.content || 'No excerpt available.'),
                        date: new Date(n.published_at || n.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        imageUrl: getMediaUrl(n.image_url || n.image)
                    }))];
                }

                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    const eventsArray = Array.isArray(eventsData) ? eventsData : (eventsData.results || []);
                    combined = [...combined, ...eventsArray.map((e: any) => ({
                        ...e,
                        type: 'Event',
                        title: decodeEntities(e.title || e.name || 'Untitled Event'),
                        excerpt: stripToPlainText(e.description || e.excerpt || 'No description available.'),
                        date: new Date(e.date || e.event_date || e.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        imageUrl: getMediaUrl(e.image_url || e.image)
                    }))];
                }

                if (partnersRes.ok) {
                    const partnersData = await partnersRes.json();
                    const partnersArray = Array.isArray(partnersData) ? partnersData : (partnersData.results || []);
                    combined = [...combined, ...partnersArray.map((p: any) => ({
                        ...p,
                        type: 'Partnership',
                        title: decodeEntities(p.name || p.partner_name || p.title || 'New Partnership'),
                        excerpt: stripToPlainText(p.description || p.collaboration_details || 'Partnership details not provided.'),
                        date: new Date(p.announcement_date || p.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        imageUrl: getMediaUrl(p.logo_url || p.logo)
                    }))];
                }

                if (pubsRes.ok) {
                    const pubsData = await pubsRes.json();
                    const pubsArray = Array.isArray(pubsData) ? pubsData : (pubsData.results || []);
                    combined = [...combined, ...pubsArray.map((p: any) => ({
                        ...p,
                        type: 'Publication',
                        title: decodeEntities(p.title || 'Untitled Publication'),
                        excerpt: stripToPlainText(p.abstract || p.summary || 'No abstract available.'),
                        date: new Date(p.publication_date || p.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        imageUrl: getMediaUrl(p.image_url || p.image)
                    }))];
                }

                if (eduRes.ok) {
                    const eduData = await eduRes.json();
                    const eduArray = Array.isArray(eduData) ? eduData : (eduData.results || []);
                    combined = [...combined, ...eduArray.map((e: any) => ({
                        ...e,
                        type: 'Educational Material',
                        title: decodeEntities(e.title || 'Untitled Material'),
                        excerpt: stripToPlainText(e.content || e.description || e.summary || 'No description available.'),
                        date: new Date(e.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        imageUrl: getMediaUrl(e.file_url || e.file || e.attachment)
                    }))];
                }

                // Sort all by date descending
                combined.sort((a, b) => new Date(b.published_at || b.date || b.created_at).getTime() - new Date(a.published_at || a.date || a.created_at).getTime());
                setNewsItems(combined);
            } catch (error) {
                console.error('Failed to fetch news feed:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredItems = useMemo(() => {
        return newsItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [newsItems, activeCategory, searchQuery]);

    // Group items by category for the grid/section view
    const itemsByCategory = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        newsItems.forEach(item => {
            if (!grouped[item.type]) grouped[item.type] = [];
            grouped[item.type].push(item);
        });
        return grouped;
    }, [newsItems]);

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20">
            <SEO 
                title="News & Insights" 
                description="Stay updated with the latest clinical research news, upcoming events, and breakthroughs at MusB Research."
            />
            
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                        Insights & Updates
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Exploring the frontiers of clinical research and bringing the latest medical advancements to our community.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search news, events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        />
                    </div>

                    {/* View Switch */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Grid className="w-4 h-4" />
                            <span className="text-sm font-medium">Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Calendar</span>
                        </button>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-3 mb-16">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all border ${
                                activeCategory === cat
                                    ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <SkeletonLoader key={i} className="h-[450px] rounded-2xl" />
                        ))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItems.map((item, idx) => (
                            <NewsCard key={idx} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <SearchX className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No results found</h3>
                        <p className="text-gray-500">Try adjusting your search or category filter</p>
                    </div>
                )}

                {/* Newsletter Section */}
                <div className="mt-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 blur-[100px] -z-10" />
                    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 md:p-16 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay at the Forefront</h2>
                        <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
                            Join our newsletter to receive the latest research updates, upcoming clinical trials, and medical insights delivered to your inbox.
                        </p>
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                            <input
                                type="email"
                                required
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            />
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 group"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Subscribe
                                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                        {subscribeStatus === 'success' && (
                            <p className="text-cyan-400 mt-4 animate-fade-in">Thank you! You've been subscribed successfully.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NewsCard({ item }: { item: any }) {
    const isEvent = item.type === 'Event';
    
    return (
        <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.08] transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10">
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={item.imageUrl}
                    alt={item.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                        isEvent ? 'bg-indigo-500/80 border-indigo-400 text-white' : 'bg-cyan-500/80 border-cyan-400 text-white'
                    }`}>
                        {item.type}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.date}
                    </div>
                    {item.location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.location}
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {item.title}
                </h3>

                <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                </p>

                <div className="flex items-center justify-between">
                    <Link
                        to={`/news/${item.id}`}
                        className="flex items-center gap-2 text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors group/link"
                    >
                        Read More
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                    
                    {isEvent && (
                        <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors">
                            <Calendar className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
