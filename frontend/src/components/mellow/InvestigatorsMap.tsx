import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Building2, User, ExternalLink, Linkedin, X } from 'lucide-react';
import ConsortiumForm from './ConsortiumForm';
import { API } from '../../utils/auth';

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
    linkedin?: string;
    website?: string;
}

const MOCK_SITES: Site[] = [];

export default function InvestigatorsMap() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [selectedInvestigator, setSelectedInvestigator] = useState<Investigator | null>(null);
    const [isGatedFormOpen, setIsGatedFormOpen] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
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

        // Load world GeoJSON into the map layer
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
        }).catch(err => {
            console.error("Error loading map data:", err);
        });

        // Fetch investigator data
        const fetchSites = async () => {
            try {
                const res = await fetch(`${API}/api/auth/mellow/investigators/?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setSites(data);
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
                    <button onClick={() => { setSelectedSite(null); setSelectedInstitution(null); setSelectedInvestigator(null); }} className="text-slate-500 hover:text-white transition-colors">World</button>
                    {selectedSite && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-700" />
                            <button onClick={() => { setSelectedInstitution(null); setSelectedInvestigator(null); }} className="text-cyan-400">{selectedSite.country}</button>
                        </>
                    )}
                    {selectedInstitution && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-700" />
                            <button onClick={() => setSelectedInvestigator(null)} className="text-cyan-400">{selectedInstitution.name}</button>
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
                            className="absolute inset-y-8 right-8 w-80 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl z-20 overflow-y-auto"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">{selectedSite.country}</div>
                                        <h3 className="text-xl font-serif text-white">{selectedSite.name}</h3>
                                    </div>
                                    <button onClick={() => setSelectedSite(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
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
                            className="absolute inset-y-8 right-8 w-80 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl z-20 overflow-y-auto"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">{selectedInstitution.name}</div>
                                        <h3 className="text-xl font-serif text-white">Investigators</h3>
                                    </div>
                                    <button onClick={() => setSelectedInstitution(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute inset-x-8 bottom-8 top-auto md:top-8 md:bottom-auto md:right-8 md:left-auto md:w-[450px] bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl z-30 overflow-y-auto"
                        >
                            <div className="space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Investigator Profile</div>
                                        <h3 className="text-3xl font-serif text-white">{selectedInvestigator.name}</h3>
                                    </div>
                                    <button onClick={() => setSelectedInvestigator(null)} className="text-slate-500 hover:text-white p-2"><X className="w-6 h-6" /></button>
                                </div>
                                
                                <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 text-slate-300 text-base leading-relaxed font-medium">
                                    {selectedInvestigator.bio}
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    {selectedInvestigator.linkedin && (
                                        <a href={selectedInvestigator.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 hover:bg-[#0077b5] hover:text-white transition-all text-sm font-bold">
                                            <Linkedin className="w-4 h-4" /> LinkedIn
                                        </a>
                                    )}
                                    {selectedInvestigator.website && (
                                        <a href={selectedInvestigator.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white hover:text-slate-950 transition-all text-sm font-bold">
                                            <ExternalLink className="w-4 h-4" /> Institute Profile
                                        </a>
                                    )}
                                </div>
                            </div>
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
