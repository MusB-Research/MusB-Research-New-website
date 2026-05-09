import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Building2, User, ExternalLink, Linkedin, X, Mail, Phone, FileText } from 'lucide-react';
import ConsortiumForm from './ConsortiumForm';
import { API } from '../../utils/auth';
import { getMediaUrl } from '../../utils/media';

interface Site {
    id: string;
    name: string;
    country: string;
    lat: number;
    lng: number;
    institutions: Institution[];
}

interface Institution {
    id: string;
    name: string;
    investigators: Investigator[];
}

interface Investigator {
    id: string;
    name: string;
    bio: string;
    email?: string;
    phone?: string;
    pronouns?: string;
    linkedin?: string;
    website?: string;
    cv_url?: string;
    profile_picture?: string;
    qualifications?: string;
}

const MOCK_SITES: Site[] = [];

export default function InvestigatorsMap() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [selectedInvestigator, setSelectedInvestigator] = useState<Investigator | null>(null);
    const [isGatedFormOpen, setIsGatedFormOpen] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [sites, setSites] = useState<Site[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Shared projection — defined once, used by both map and pins
    const width = 1000;
    const height = 500;
    const projectionRef = useRef(
        d3.geoMercator().scale(150).translate([width / 2, height / 1.5])
    );

    // MOUNT: Set up the fixed SVG layer structure and load data
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        svg.selectAll('*').remove();

        const projection = projectionRef.current;
        const path = d3.geoPath().projection(projection);

        // ── LAYER 1: SVG Defs (filters, gradients) ──
        const defs = svg.append('defs');
        const glowFilter = defs.append('filter')
            .attr('id', 'pin-glow')
            .attr('x', '-50%').attr('y', '-50%')
            .attr('width', '200%').attr('height', '200%');
        glowFilter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'blur');
        glowFilter.append('feMerge')
            .selectAll('feMergeNode')
            .data(['blur', 'SourceGraphic'])
            .enter()
            .append('feMergeNode')
            .attr('in', (d: string) => d);

        const pulseGrad = defs.append('radialGradient')
            .attr('id', 'pin-pulse-gradient');
        pulseGrad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee').attr('stop-opacity', '0.6');
        pulseGrad.append('stop').attr('offset', '100%').attr('stop-color', '#22d3ee').attr('stop-opacity', '0');

        // ── LAYER 2: Map countries (drawn FIRST = bottom layer) ──
        const mapLayer = svg.append('g').attr('class', 'map-layer');

        // ── LAYER 3: Pins (appended LAST = always on top) ──
        svg.append('g').attr('class', 'pins-layer');

        // Load world GeoJSON into the map layer (HOSTED LOCALLY for production reliability)
        d3.json<any>('/data/world.geojson').then((data) => {
            if (!data || !data.features) {
                console.error("Map data loaded but features missing");
                return;
            }
            mapLayer.selectAll('path')
                .data(data.features)
                .enter()
                .append('path')
                .attr('d', (d: any) => path(d) || '')
                .attr('fill', '#1e293b')
                .attr('stroke', '#334155')
                .attr('stroke-width', 0.5);
        }).catch(err => {
            console.error("Error loading local map data:", err);
            // Fallback to CDN if local fails (extra safety)
            d3.json<any>('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson').then((data) => {
                if (!data || !data.features) return;
                mapLayer.selectAll('path')
                    .data(data.features)
                    .enter()
                    .append('path')
                    .attr('d', (d: any) => path(d) || '')
                    .attr('fill', '#1e293b')
                    .attr('stroke', '#334155')
                    .attr('stroke-width', 0.5);
            });
        });

        // Fetch investigator data
        const fetchSites = async () => {
            try {
                const res = await fetch(`${API}/api/auth/mellow/investigators/?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter out sites with invalid/empty coordinates [0,0] to prevent "mystery dots"
                    const validSites = (data || []).filter((s: Site) => 
                        s.lat !== 0 || s.lng !== 0
                    );
                    setSites(validSites);
                }
            } catch (err) {
                console.error("Error fetching consortium investigators:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSites();
    }, []);

    // PINS: Render into the pre-existing pins-layer (always on top of map)
    useEffect(() => {
        if (!svgRef.current || sites.length === 0) return;

        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        const projection = projectionRef.current;

        // Get the pre-created pins layer (always the last child = on top)
        const pinsLayer = svg.select<SVGGElement>('.pins-layer');
        if (pinsLayer.empty()) return;

        // Clear old pins
        pinsLayer.selectAll('*').remove();

        // Draw one pin group per site
        const pins = pinsLayer.selectAll('.pin-container')
            .data(sites)
            .enter()
            .append('g')
            .attr('class', 'pin-container')
            .style('cursor', 'pointer')
            .on('click', (_event: any, d: Site) => {
                setSelectedSite(d);
                setSelectedInstitution(null);
                setSelectedInvestigator(null);
                setIsBioExpanded(false);
            });

        // Outer pulse halo
        pins.append('circle')
            .attr('cx', (d: Site) => projection([d.lng, d.lat])?.[0] || 0)
            .attr('cy', (d: Site) => projection([d.lng, d.lat])?.[1] || 0)
            .attr('r', 12)
            .attr('fill', 'url(#pin-pulse-gradient)')
            .attr('pointer-events', 'none');

        // Main solid pin
        pins.append('circle')
            .attr('cx', (d: Site) => projection([d.lng, d.lat])?.[0] || 0)
            .attr('cy', (d: Site) => projection([d.lng, d.lat])?.[1] || 0)
            .attr('r', 4)
            .attr('fill', '#22d3ee')
            .attr('filter', 'url(#pin-glow)')
            .attr('stroke', 'white')
            .attr('stroke-width', 1);
            
    }, [sites]);

    const handleInvestigatorClick = (inv: Investigator) => {
        if (!isUnlocked) {
            setIsGatedFormOpen(true);
            setSelectedInvestigator(inv);
        } else {
            setSelectedInvestigator(inv);
        }
        setIsBioExpanded(false);
    };

    return (
        <div className="space-y-12">
            <div className="space-y-4 text-center max-w-3xl mx-auto">
                <h2 className="text-4xl font-serif text-white">Global Research Network</h2>
                <p className="text-slate-400">Explore our multi-continental network of world-leading institutions and investigators.</p>
            </div>

            <div className="relative aspect-[2/1] w-full bg-slate-900/50 rounded-[3rem] border border-white/10 overflow-hidden group">
                <svg ref={svgRef} viewBox="0 0 1000 500" className="w-full h-full" />
                
                {/* Breadcrumbs */}
                <div className="absolute top-8 left-8 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 text-xs font-bold uppercase tracking-widest">
                    <button onClick={() => { setSelectedSite(null); setSelectedInstitution(null); setSelectedInvestigator(null); setIsBioExpanded(false); }} className="text-slate-500 hover:text-white transition-colors">World</button>
                    {selectedSite && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-700" />
                            <button onClick={() => { setSelectedInstitution(null); setSelectedInvestigator(null); setIsBioExpanded(false); }} className="text-cyan-400">{selectedSite.country}</button>
                        </>
                    )}
                    {selectedInstitution && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-700" />
                            <button onClick={() => { setSelectedInvestigator(null); setIsBioExpanded(false); }} className="text-cyan-400">{selectedInstitution.name}</button>
                        </>
                    )}
                </div>

                {/* Drill-down Overlays */}
                <AnimatePresence>
                    {selectedSite && !selectedInstitution && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-8 right-8 w-80 h-fit max-h-[calc(100%-4rem)] bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl z-20 overflow-y-auto"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">{selectedSite.country}</div>
                                        <h3 className="text-xl font-serif text-white">{selectedSite.name}</h3>
                                    </div>
                                    <button onClick={() => { setSelectedSite(null); setIsBioExpanded(false); }} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Institutions</p>
                                    {selectedSite.institutions.map(inst => (
                                        <button 
                                            key={inst.id}
                                            onClick={() => setSelectedInstitution(inst)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-4 h-4 text-cyan-400" />
                                                <span className="text-sm text-slate-200 font-medium">{inst.name}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedInstitution && !selectedInvestigator && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-8 right-8 w-80 h-fit max-h-[calc(100%-4rem)] bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl z-20 overflow-y-auto"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">{selectedInstitution.name}</div>
                                        <h3 className="text-xl font-serif text-white">Investigators</h3>
                                    </div>
                                    <button onClick={() => { setSelectedInstitution(null); setIsBioExpanded(false); }} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-3">
                                    {selectedInstitution.investigators.map(inv => (
                                        <button 
                                            key={inv.id}
                                            onClick={() => handleInvestigatorClick(inv)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <User className="w-4 h-4 text-cyan-400" />
                                                <span className="text-sm text-slate-200 font-medium">{inv.name}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedInvestigator && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="absolute inset-x-4 bottom-4 md:inset-x-auto md:bottom-auto md:top-8 md:right-8 md:w-[560px] max-h-[calc(100%-4rem)] bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.5)] z-30 overflow-y-auto custom-scrollbar"
                        >
                            {/* Premium Header Accent */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-t-[2.5rem]" />

                            <div className="p-8 md:p-10 space-y-10">
                                <button 
                                    onClick={() => setSelectedInvestigator(null)} 
                                    className="text-slate-500 hover:text-white p-2 absolute top-8 right-8 transition-colors bg-white/5 rounded-full backdrop-blur-md z-40"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col md:flex-row gap-10 items-start">
                                    {/* Circular Headshot with Dynamic Glow */}
                                    <div className="relative group shrink-0">
                                        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full group-hover:bg-cyan-500/40 transition-all duration-500" />
                                        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 shadow-2xl">
                                            <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden border-2 border-slate-950">
                                                {selectedInvestigator.profile_picture ? (
                                                    <img 
                                                        src={getMediaUrl(selectedInvestigator.profile_picture)} 
                                                        alt={selectedInvestigator.name} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                        <User className="w-12 h-12 text-slate-600" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <span className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.2em]">Verified Profile</span>
                                        </div>
                                    </div>

                                    <div className="space-y-5 flex-1 min-w-0">
                                        <div className="space-y-3 pr-12">
                                            <h3 className="text-3xl md:text-4xl font-serif text-white tracking-tight leading-tight break-words">
                                                {(() => {
                                                    const prefix = selectedInvestigator.pronouns || 'Dr.';
                                                    const name = selectedInvestigator.name;
                                                    // Avoid double prefix if name already starts with the pronoun
                                                    if (name.startsWith(prefix)) return name;
                                                    if (name.startsWith('Dr.') || name.startsWith('Prof.') || name.startsWith('Mr.') || name.startsWith('Mrs.') || name.startsWith('Ms.')) return name;
                                                    return `${prefix} ${name}`;
                                                })()}
                                            </h3>
                                            
                                            {/* Specialty Badges */}
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedInvestigator.qualifications || "Internal Medicine, Endocrinology, Geriatrics").split(',').map((spec, idx) => (
                                                    <span 
                                                        key={idx}
                                                        className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-cyan-400 border border-white/10 backdrop-blur-md"
                                                    >
                                                        {spec.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Contact Row */}
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm font-medium pt-6 border-t border-white/5">
                                            <a href={`mailto:${selectedInvestigator.email || 'abc@georgetown.edu'}`} className="flex items-center gap-3 text-slate-400 hover:text-cyan-400 transition-colors group">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <span>{selectedInvestigator.email || 'abc@georgetown.edu'}</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* About Section — Summary + Specializations */}
                                <div className="pt-10 border-t border-white/5 space-y-6">
                                    <div className="flex items-center gap-6">
                                        <h4 className="text-xl font-serif text-white whitespace-nowrap">About Dr. {selectedInvestigator.name.split(' ').pop()}</h4>
                                        <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>

                                    {/* Short Summary — first two sentences */}
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {selectedInvestigator.bio.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')}
                                    </p>

                                    {/* Extracted Specializations as bullet points */}
                                    {(() => {
                                        const bioText = selectedInvestigator.bio.toLowerCase();
                                        const keywords = [
                                            'internal medicine', 'endocrinology', 'geriatrics', 'diabetes',
                                            'metabolism', 'rehabilitation', 'cardiology', 'oncology',
                                            'neurology', 'psychiatry', 'surgery', 'pediatrics',
                                            'immunology', 'rheumatology', 'nephrology', 'pulmonology',
                                            'clinical research', 'multi-center research', 'pharmacology',
                                            'growth hormone', 'aging', 'hormone replacement', 'clinical trials',
                                            'biomarkers', 'genomics', 'epidemiology', 'public health',
                                            'rehabilitation medicine', 'preventive medicine'
                                        ];
                                        const found = keywords.filter(k => bioText.includes(k));
                                        const specializations = found.length > 0 
                                            ? found.slice(0, 5).map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
                                            : (selectedInvestigator.qualifications || 'Internal Medicine, Endocrinology, Geriatrics').split(',').map(s => s.trim());
                                        
                                        return specializations.length > 0 ? (
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Key Specializations</span>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {specializations.map((spec, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 group">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-shadow" />
                                                            <span className="text-slate-300 text-sm font-medium">{spec}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}

                                    {/* Expandable Full Bio */}
                                    <div className="relative">
                                        <div className={`text-slate-500 text-sm leading-relaxed ${!isBioExpanded ? 'hidden' : ''} transition-all duration-700`}>
                                            {selectedInvestigator.bio}
                                        </div>
                                        
                                        <button 
                                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                                            className="mt-2 flex items-center gap-2 text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-[0.2em] group"
                                        >
                                            {isBioExpanded ? 'Minimize Profile' : 'Expand Full Bio'} 
                                            <motion.div
                                                animate={{ rotate: isBioExpanded ? 180 : 0, x: isBioExpanded ? 0 : 4 }}
                                                className="shrink-0"
                                            >
                                                <ChevronRight className="w-4 h-4 rotate-90 text-cyan-500" />
                                            </motion.div>
                                        </button>
                                    </div>
                                </div>

                                {/* Links Section — LinkedIn, Website, CV */}
                                <div className="pt-10 border-t border-white/5 space-y-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Connect & Resources</span>
                                    
                                    <div className="flex flex-col gap-3">
                                        <motion.a 
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            href={selectedInvestigator.linkedin || '#'} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="relative flex items-center gap-4 px-5 py-4 rounded-[1.25rem] bg-white/[0.03] border border-white/10 hover:border-cyan-500/50 hover:bg-white/[0.07] transition-all duration-300 group overflow-hidden shadow-lg backdrop-blur-md"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 group-hover:border-cyan-500/30 transition-all shadow-inner shrink-0">
                                                <Linkedin className="w-5 h-5 text-[#0077b5]" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em] mb-0.5">Professional</span>
                                                <span className="text-white text-sm font-bold truncate">LinkedIn Profile</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                        </motion.a>
                                        
                                        <motion.a 
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            href={selectedInvestigator.website || '#'} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="relative flex items-center gap-4 px-5 py-4 rounded-[1.25rem] bg-white/[0.03] border border-white/10 hover:border-cyan-500/50 hover:bg-white/[0.07] transition-all duration-300 group overflow-hidden shadow-lg backdrop-blur-md"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 group-hover:border-cyan-500/30 transition-all shadow-inner shrink-0">
                                                <ExternalLink className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em] mb-0.5">Research</span>
                                                <span className="text-white text-sm font-bold truncate">Official Webpage</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                        </motion.a>

                                        {selectedInvestigator.cv_url ? (
                                            <motion.a 
                                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
                                                whileTap={{ scale: 0.99 }}
                                                href={getMediaUrl(selectedInvestigator.cv_url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-4 px-5 py-4 rounded-[1.25rem] bg-amber-500/5 text-amber-200 border border-amber-500/20 border-dashed hover:border-amber-500/50 transition-all text-xs font-bold w-full group backdrop-blur-md"
                                            >
                                                <div className="w-11 h-11 rounded-full bg-amber-500/10 flex items-center justify-center shadow-lg group-hover:bg-amber-500/20 transition-colors shrink-0">
                                                    <FileText className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="text-amber-500/50 font-black text-[9px] uppercase tracking-[0.15em] mb-0.5">Documentation</span>
                                                    <span className="text-sm">View Curriculum Vitae (CV)</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 ml-auto text-amber-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                                            </motion.a>
                                        ) : (
                                            <div className="flex items-center gap-4 px-5 py-4 rounded-[1.25rem] bg-white/[0.02] text-slate-600 border border-white/5 text-xs font-bold w-full cursor-not-allowed">
                                                <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-slate-700" />
                                                </div>
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="text-slate-700 font-black text-[9px] uppercase tracking-[0.15em] mb-0.5">Documentation</span>
                                                    <span className="text-sm">No CV Uploaded</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Bottom Accent */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ConsortiumForm 
                isOpen={isGatedFormOpen}
                onClose={() => setIsGatedFormOpen(false)}
                onSubmitSuccess={() => setIsUnlocked(true)}
                title="Express Your Interest"
                subtitle="Please provide your details to unlock full investigator profiles."
            />
        </div>
    );
}
