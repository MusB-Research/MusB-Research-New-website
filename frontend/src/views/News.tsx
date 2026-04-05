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
    GraduationCap
} from 'lucide-react';
import { NewsItem, NewsType } from '@/types';
import { authFetch , API } from '../utils/auth';
import { Link } from 'react-router-dom';

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

export default function News() {
    const [activeCategory, setActiveCategory] = useState<NewsType | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
                    combined = [...combined, ...newsData.map((n: any) => ({
                        ...n,
                        type: n.is_success_story ? 'Success Story' : 'News',
                        title: n.title || 'Untitled News',
                        excerpt: n.excerpt || n.content?.substring(0, 150) || 'No excerpt available.',
                        date: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        image: n.image_url || n.image // Use real-time absolute URL from backend
                    }))];
                }

                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    combined = [...combined, ...eventsData.map((e: any) => ({
                        ...e,
                        type: 'Event',
                        title: e.title || e.name || 'Untitled Event',
                        excerpt: e.description || e.excerpt || 'No description available.',
                        date: new Date(e.date || e.event_date || e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        image: e.image_url || e.image // Use real-time absolute URL from backend
                    }))];
                }

                if (partnersRes.ok) {
                    const partnersData = await partnersRes.json();
                    combined = [...combined, ...partnersData.map((p: any) => ({
                        ...p,
                        type: 'Partnership',
                        title: p.name || p.partner_name || p.title || 'New Partnership',
                        excerpt: p.description || p.collaboration_details || 'Partnership details not provided.',
                        date: new Date(p.announcement_date || p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }))];
                }

                if (pubsRes.ok) {
                    const pubsData = await pubsRes.json();
                    combined = [...combined, ...pubsData.map((p: any) => ({
                        ...p,
                        type: 'Publication',
                        title: p.title || 'Untitled Publication',
                        excerpt: p.abstract || p.summary || 'No abstract available.',
                        date: new Date(p.publication_date || p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }))];
                }

                if (eduRes.ok) {
                    const eduData = await eduRes.json();
                    combined = [...combined, ...eduData.map((e: any) => ({
                        ...e,
                        type: 'Educational Material',
                        title: e.title || 'Untitled Material',
                        excerpt: e.content || e.description || e.summary || 'No description available.',
                        date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }))];
                }

                // If we got real data, use it; otherwise fallback to hardcoded
                if (combined.length > 0) {
                    // Sort descending by date
                    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setNewsItems(combined);
                } else {
                    setNewsItems(HARDCODED_NEWS);
                }
            } catch (e) {
                console.error("Failed to fetch news", e);
                setNewsItems(HARDCODED_NEWS);
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
    }, [activeCategory, searchQuery, newsItems]);

    const featuredItem = useMemo(() => {
        return newsItems.find(item => item.isFeatured);
    }, [newsItems]);

    const getTypeIcon = (type: NewsType) => {
        switch (type) {
            case 'News': return Newspaper;
            case 'Event': return Calendar;
            case 'Partnership': return Users;
            case 'Publication': return BookOpen;
            case 'Educational Material': return GraduationCap;
            default: return Newspaper;
        }
    };

    const getAccentColor = (type: NewsType) => {
        switch (type) {
            case 'News': return 'cyan';
            case 'Event': return 'indigo';
            case 'Partnership': return 'purple';
            case 'Publication': return 'emerald';
            case 'Educational Material': return 'amber';
            default: return 'cyan';
        }
    };

    // Group items by type for section-based layout
    const groupedItems = useMemo(() => {
        const groups: Record<string, NewsItem[]> = {};
        filteredItems.forEach(item => {
            if (item.id === featuredItem?.id && activeCategory === 'All' && !searchQuery) return;
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        });
        return groups;
    }, [filteredItems, featuredItem, activeCategory, searchQuery]);

    const accentClasses: Record<string, { badge: string; border: string; heading: string }> = {
        cyan: {
            badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            border: 'hover:border-cyan-400/30',
            heading: 'text-cyan-400',
        },
        indigo: {
            badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            border: 'hover:border-indigo-400/30',
            heading: 'text-indigo-400',
        },
        purple: {
            badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            border: 'hover:border-purple-400/30',
            heading: 'text-purple-400',
        },
        emerald: {
            badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            border: 'hover:border-emerald-400/30',
            heading: 'text-emerald-400',
        },
        amber: {
            badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            border: 'hover:border-amber-400/30',
            heading: 'text-amber-400',
        },
    };

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
            {/* Atmospheric Background Layers */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
            </div>

            {/* SECTION 1: PAGE HEADER (Hero) */}
            <section className="relative pt-40 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]"></div>
                <div className="max-w-[1700px] mx-auto px-4 md:px-12 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
                        News & <span className="text-cyan-400">Events</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        Stay updated on MusB™ Research's latest scientific advances, publications, partnerships, and educational resources.
                    </p>
                </div>
            </section>

            {/* SECTION 2: FILTER & SEARCH BAR */}
            {newsItems.length > 0 ? (
                <>
                    <section className="sticky top-20 z-40 bg-slate-950/80 backdrop-blur-md border-y border-white/5 py-6">
                        <div className="max-w-[1700px] mx-auto px-4 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Filter Chips */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${activeCategory === cat
                                            ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Search & Toggle */}
                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                <div className="relative flex-grow lg:flex-grow-0 lg:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search news & events..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-cyan-500/50 transition-all text-white placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                        title="Grid View"
                                    >
                                        <Grid className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('calendar')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                        title="Calendar View"
                                    >
                                        <Calendar className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <main className="max-w-[1700px] mx-auto px-4 md:px-12 py-16">
                {viewMode === 'grid' ? (
                    <div className="space-y-20">
                        {/* SECTION 3: FEATURED STORY */}
                        {featuredItem && activeCategory === 'All' && !searchQuery && (
                            <section className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden grid lg:grid-cols-2 shadow-2xl">
                                    <div className="aspect-[16/9] lg:aspect-auto overflow-hidden bg-slate-900 border-r border-slate-800">
                                        <div className="w-full h-[400px] bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:scale-105 transition-transform duration-1000"></div>
                                    </div>
                                    <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-black uppercase tracking-widest border border-cyan-500/20">
                                                Featured: {featuredItem.type}
                                            </span>
                                            <span className="text-slate-500 text-sm font-bold">{featuredItem.date}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                            {featuredItem.title}
                                        </h2>
                                        <p className="text-xl text-slate-400 leading-relaxed font-medium">
                                            {featuredItem.excerpt}
                                        </p>
                                        <Link
                                            to={`/news/${featuredItem.id}`}
                                            className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-500 transition-all self-start"
                                        >
                                            Read More <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* SECTION 4: SEPARATE ROWS PER CATEGORY */}
                        {sectionDefinitions
                            .filter(sec => activeCategory === 'All' || activeCategory === sec.type)
                            .map(sec => {
                                const items = groupedItems[sec.type];
                                if (!items || items.length === 0) return null;
                                const accent = accentClasses[sec.accent] || accentClasses.cyan;
                                const SectionIcon = getTypeIcon(sec.type);

                                return (
                                    <section key={sec.type} className="space-y-8">
                                        {/* Section Header */}
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accent.badge} border`}>
                                                <SectionIcon className="w-6 h-6" />
                                            </div>
                                            <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${accent.heading}`}>
                                                {sec.label}
                                            </h2>
                                            <div className="flex-grow h-px bg-white/10"></div>
                                            <span className="text-slate-500 text-sm font-bold">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                                        </div>

                                        {/* Section Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {items.map(item => {
                                                const Icon = getTypeIcon(item.type);
                                                return (
                                                    <div key={item.id} className={`group bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col hover:bg-white/10 hover:border-white/10 ${accent.border} transition-all duration-300 shadow-xl`}>
                                                        <div className="aspect-[16/10] overflow-hidden relative">
                                                            {item.image ? (
                                                                <img 
                                                                    src={item.image} 
                                                                    alt={item.title} 
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 group-hover:scale-110 transition-transform duration-700"></div>
                                                            )}
                                                            <div className="absolute top-4 left-4">
                                                                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/10 ${accent.badge}`}>
                                                                    <Icon className="w-3 h-3" />
                                                                    {item.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-8 flex flex-col flex-grow space-y-4">
                                                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">{item.date}</div>
                                                            <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                                                                {item.title}
                                                            </h3>
                                                            <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-2">
                                                                {item.excerpt}
                                                            </p>
                                                            <Link
                                                                to={`/news/${item.id}`}
                                                                className="inline-flex items-center gap-2 text-white font-black text-[11px] uppercase tracking-[0.2em] pt-4 group-hover:text-cyan-400 transition-colors mt-auto"
                                                            >
                                                                Read More <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                );
                            })}

                        {/* No results state */}
                        {Object.keys(groupedItems).length === 0 && (searchQuery || activeCategory !== 'All') && (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                                    <SearchX className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white">No results found</h3>
                                    <p className="text-slate-500 font-medium">Try adjusting your filters or search keywords.</p>
                                </div>
                                <button
                                    onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                                    className="text-cyan-400 font-black uppercase tracking-widest text-xs border-b-2 border-cyan-400 pb-1 hover:text-white hover:border-white transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* SECTION 5: EVENTS CALENDAR VIEW */
                    <div className="max-w-4xl mx-auto space-y-6">
                        {(filteredItems as NewsItem[]).filter(item => item.type === 'Event').length > 0 ? (
                            (filteredItems as NewsItem[]).filter(item => item.type === 'Event').map(event => (
                                <div key={event.id} className="group bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/10 transition-all flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-full md:w-32 h-32 rounded-2xl bg-slate-900 border border-white/10 flex flex-col items-center justify-center text-center p-4">
                                        <div className="text-cyan-400 font-black text-2xl leading-none">{event.date.split(' ')[0]}</div>
                                        <div className="text-white text-sm font-bold uppercase tracking-widest mt-1">{event.date.split(' ')[1]?.replace(',', '')}</div>
                                    </div>
                                    <div className="flex-grow space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20">{event.type}</span>
                                            {event.locationType && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <MapPin className="w-3 h-3" /> {event.locationType}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase italic">{event.title}</h3>
                                        <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-400">
                                            {event.startTime && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-600" />
                                                    {event.startTime} - {event.endTime}
                                                </div>
                                            )}
                                            {event.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-600" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        to={event.registrationLink || '#'}
                                        className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest text-xs hover:bg-cyan-500 transition-all text-center"
                                    >
                                        Register
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                                    <Calendar className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white">No upcoming events</h3>
                                    <p className="text-slate-500 font-medium">Check back later or view all news updates.</p>
                                </div>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className="text-cyan-400 font-black uppercase tracking-widest text-xs border-b-2 border-cyan-400 pb-1 hover:text-white hover:border-white transition-colors"
                                >
                                    Return to Feed
                                </button>
                            </div>
                        )}
                    </div>
                        )}
                    </main>
                </>
            ) : (
                <main className="max-w-[1700px] mx-auto px-4 md:px-12 py-32 min-h-[40vh] flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-8">
                        <Clock className="w-12 h-12" />
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-widest uppercase italic">
                        COMING SOON
                    </h2>
                    <p className="text-xl text-slate-400 font-medium mt-6">
                        We are preparing exciting news and events. Stay tuned!
                    </p>
                </main>
            )}

            {/* SECTION 6: CALL TO ACTION (Contextual) */}
            <section className="max-w-[1700px] mx-auto px-4 md:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* For Sponsors / Partners */}
                    <div className="p-8 md:p-10 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 flex flex-col items-start space-y-6 group">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                            <Users className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl font-black text-white leading-tight">Interested in collaborating or staying informed?</h3>
                        <Link to="/contact?type=general" className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-white border-b-2 border-cyan-500 pb-2 group-hover:gap-5 transition-all">
                            Contact Our Team <ArrowRight className="w-5 h-5 text-cyan-400" />
                        </Link>
                    </div>

                    {/* For Participants */}
                    <div className="p-8 md:p-10 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 flex flex-col items-start space-y-6 group">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Lightbulb className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl font-black text-white leading-tight">Looking for ongoing or upcoming clinical studies?</h3>
                        <Link to="/trials" className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-white border-b-2 border-indigo-400 pb-2 group-hover:gap-5 transition-all">
                            Find a clinical study <ArrowRight className="w-5 h-5 text-indigo-400" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* SECTION 7: NEWSLETTER SIGN-UP */}
            <section className="max-w-[1700px] mx-auto px-4 md:px-12 pb-20 pt-16">
                <div className="relative p-8 md:p-24 rounded-[4.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl text-white overflow-hidden text-center space-y-12">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 blur-3xl rounded-full"></div>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase italic">Research Digests<br />Weekly Update</h2>
                        <p className="text-lg font-bold text-slate-400">Get MusB™ Research updates delivered to your inbox.</p>
                    </div>

                    <form className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto relative z-10" onSubmit={handleSubscribe}>
                        <div className="flex-grow flex flex-col md:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="Your Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-grow bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-white placeholder:text-slate-600"
                                required
                            />
                            {/* Role selection is visual only for now as backend only accepts email */}
                            <div className="flex bg-slate-950/50 rounded-2xl p-1 border border-white/10">
                                <label className="flex-1 px-4 py-3 cursor-pointer has-[:checked]:bg-cyan-500 has-[:checked]:text-slate-950 has-[:checked]:shadow-sm rounded-xl transition-all">
                                    <input type="radio" name="describe" value="business" className="sr-only" defaultChecked />
                                    <span className="text-xs font-black uppercase tracking-widest block text-center">Business</span>
                                </label>
                                <label className="flex-1 px-4 py-3 cursor-pointer has-[:checked]:bg-cyan-500 has-[:checked]:text-slate-950 has-[:checked]:shadow-sm rounded-xl transition-all">
                                    <input type="radio" name="describe" value="researcher" className="sr-only" />
                                    <span className="text-xs font-black uppercase tracking-widest block text-center">Researcher</span>
                                </label>
                                <label className="flex-1 px-4 py-3 cursor-pointer has-[:checked]:bg-cyan-500 has-[:checked]:text-slate-950 has-[:checked]:shadow-sm rounded-xl transition-all">
                                    <input type="radio" name="describe" value="participant" className="sr-only" />
                                    <span className="text-xs font-black uppercase tracking-widest block text-center">Individual</span>
                                </label>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || subscribeStatus === 'success'}
                            className={`bg-cyan-500 text-slate-950 px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {submitting ? 'Sending...' : subscribeStatus === 'success' ? 'Subscribed!' : 'Subscribe'}
                            {!submitting && subscribeStatus !== 'success' && <Send className="w-4 h-4" />}
                        </button>
                    </form>
                    {subscribeStatus === 'error' && (
                        <p className="text-red-400 font-bold">Failed to subscribe. Please try again.</p>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Join 2,500+ leaders in musculoskeletal research.</p>
                </div>
            </section>
        </div>
    );
}
