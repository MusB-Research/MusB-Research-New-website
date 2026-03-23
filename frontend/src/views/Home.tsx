import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Brain, FlaskConical, Activity, TestTube, Microscope, Leaf, Flower, Flower2, ShieldCheck, Zap, Beaker, BarChart, FileText, Stethoscope, Database, Smartphone, Box, CheckCircle2, Building2, Globe, HeartPulse, X } from 'lucide-react';
import StudyFilterSection from '@/components/StudyFilterSection';

const slides = [
    {
        id: 1,
        headline: "Your Trusted Partner in R&D Excellence",
        subtext: [
            "Comprehensive solutions from early screening to clinical studies",
            "Led by world-class scientists and experienced industry professionals",
            "Community-based clinical trials and translational research under one umbrella"
        ],
        primaryCTA: "Find a Clinical Study",
        secondaryCTA: "Work With Us (Sponsors & Partners)",
        image: "/hero-1.png"
    },
    {
        id: 2,
        headline: "Advancing Global Health Through Innovation",
        subtext: [
            "Pioneering breakthrough discoveries in musculoskeletal biology",
            "Accelerating translational research with world-class integrity",
            "Bridging the gap between clinical excellence and commercial success"
        ],
        primaryCTA: "Our Research",
        secondaryCTA: "Partner With Us",
        image: "/hero-2.png"
    }
];






const LeakyGutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Intestine squiggle path */}
        <path d="M12 2v2c-3 0-4 1-4 3s1 3 4 3 4 1 4 3-1 3-4 3-4 1-4 3 1 3 4 3v2" />
        {/* Badge circle */}
        <circle cx="18" cy="7" r="4.5" fill="currentColor" fillOpacity="0.2" stroke="none" />
        {/* Checkmark */}
        <path d="M16 7l1.5 1.5 3-3" strokeWidth="1.5" />
    </svg>
);

const InflammationIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Hand */}
        <path d="M18 11V6a2 2 0 0 0-4 0v5" />
        <path d="M14 10V4a2 2 0 0 0-4 0v6" />
        <path d="M10 10V5a2 2 0 0 0-4 0v7" />
        <path d="M6 12v-1a2 2 0 0 0-4 0v7a5 5 0 0 0 5 5h7a5 5 0 0 0 5-5v-6" />
        {/* Bandage */}
        <rect x="2" y="14" width="20" height="4" rx="1" transform="rotate(-15 12 16)" fill="currentColor" fillOpacity="0.1" />
        <path d="M3 17l18-5" strokeWidth="1.5" opacity="0.5" />
        <path d="M4 19l18-5" strokeWidth="1.5" opacity="0.5" />
    </svg>
);

const MicrobiomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* DNA Helix */}
        <path d="M3 12c0 2 1.5 4 4 4s4-2 4-4-1.5-4-4-4-4 2-4 4z" opacity="0.2" fill="currentColor" />
        <path d="M3 12c0 3 3 6 6 6" />
        <path d="M3 12c0-3 3-6 6-6" />
        <path d="M7 6.5l2 11" opacity="0.5" />
        <path d="M3.5 10l5 4" opacity="0.5" />
        <path d="M3.5 14l5-4" opacity="0.5" />
        
        {/* Hexagons (Microbes/Probiotics) */}
        <path d="M15 5l3-1.5 3 1.5v3.5l-3 1.5-3-1.5z" fill="currentColor" fillOpacity="0.2" />
        <path d="M15 5l3-1.5 3 1.5v3.5l-3 1.5-3-1.5z" />
        <circle cx="18" cy="3.5" r="1" fill="currentColor" />
        <circle cx="21" cy="5" r="1" fill="currentColor" />
        <circle cx="15" cy="5" r="1" fill="currentColor" />

        <path d="M18 15l2.5-1.25 2.5 1.25v2.5l-2.5 1.25L18 17.5z" fill="currentColor" fillOpacity="0.1" />
        <path d="M18 15l2.5-1.25 2.5 1.25v2.5l-2.5 1.25L18 17.5z" />
        <circle cx="20.5" cy="13.75" r="0.75" fill="currentColor" />
        
        {/* Arrows/Connections */}
        <path d="M16 11l-1.5 1.5M17.5 12.5l-1.5 1.5" strokeWidth="1" />
        <path d="M14 13l2 2" strokeWidth="1" />
    </svg>
);

const BioticsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Test Tube */}
        <path d="M9 3h6M10 3v14a2 2 0 0 0 4 0V3m-4 5h4" />
        <rect x="10" y="10" width="4" height="7" rx="1" fill="currentColor" fillOpacity="0.2" stroke="none" />
        
        {/* Magnifying Glass */}
        <circle cx="17" cy="11" r="4" fill="white" fillOpacity="0.1" />
        <circle cx="17" cy="11" r="4" />
        <path d="M20 14l2 2" />
        
        {/* Drop inside Glass */}
        <path d="M17 9.5a1.5 1.5 0 0 1 1.5 1.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5 1-2.5 1.5-3z" fill="currentColor" stroke="none" />
    </svg>
);

const AgingIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Background Adults (Lighter/Atmospheric) */}
        <g opacity="0.4">
            <circle cx="6.5" cy="6" r="2.5" />
            <path d="M3 21v-6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v6" />
            
            <circle cx="17.5" cy="6" r="2.5" />
            <path d="M14 21v-6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v6" />
        </g>

        {/* Featured Child/Youth - Represents Longevity & Future Generations */}
        <g className="text-cyan-400">
            <circle cx="12" cy="11" r="2" fill="currentColor" fillOpacity="0.2" />
            {/* V-Arms for energy/growth */}
            <path d="M8.5 11.5l3.5 3 3.5-3" strokeWidth="2.2" />
            {/* Stable Torso & Legs */}
            <path d="M12 14.5v6.5" strokeWidth="2.2" />
            <path d="M10 21h4" strokeWidth="2" />
        </g>
    </svg>
);

const NeurodegenerationIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Central Molecular Node */}
        <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.3" />
        
        {/* Connection Arms & Smaller Nodes */}
        {/* Right branch */}
        <path d="M14.5 12h2.5" />
        <circle cx="19" cy="12" r="1.5" />
        <path d="M20.5 12h1.5" />
        <circle cx="22.5" cy="12" r="0.5" />
        
        {/* Top branch */}
        <path d="M12 9.5V7" />
        <circle cx="12" cy="5.5" r="1.5" />
        <path d="M10.5 4.5l-1.5-1" />
        <circle cx="8.5" cy="3" r="0.5" />
        <path d="M13.5 4.5l1.5-1" />
        <circle cx="15.5" cy="3" r="0.5" />

        {/* Bottom Left branch */}
        <path d="M10.2 13.8l-1.7 1.7" />
        <circle cx="7" cy="17" r="1.5" strokeWidth="1.2" />
        <circle cx="7" cy="17" r="0.8" fill="currentColor" />
        
        {/* Top Left branch */}
        <path d="M10.2 10.2l-1.7-1.7" />
        <circle cx="7" cy="7" r="1.5" />
        <path d="M5.5 7h-1.5" />
        <circle cx="3.5" cy="7" r="0.5" />

        {/* Bottom Right branch */}
        <path d="M13.8 13.8l1.7 1.7" />
        <circle cx="17" cy="17" r="1.5" />
        <path d="M17 18.5v1.5" />
        <circle cx="17" cy="20.5" r="0.5" />
    </svg>
);

const MuscleHealthIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Battery/Container */}
        <rect x="4" y="6" width="8" height="12" rx="1.5" strokeWidth="2" />
        <path d="M6 6V4.5a0.5 0 0 1 0.5-0.5h3a0.5 0 0 1 0.5 0.5V6" strokeWidth="2" />
        <rect x="5.5" y="7.5" width="5" height="9" rx="0.5" fill="currentColor" fillOpacity="0.1" stroke="none" />
        
        {/* Lightning Bolt */}
        <path d="M8 9l-1 3h2l-1 3" strokeWidth="1.8" fill="white" fillOpacity="0.1" />
        
        {/* Muscular Arm */}
        <path 
            d="M13 13c1-1 2.5-1.5 4-1 .5-1.5 1.5-2.5 3-2 .5.1.8.5.7 1-.1.5-.5.8-1 .7-1-.2-1.8.5-2.1 1.5-.5.2-1 .5-1.5 1-.5.5-.8 1.1-1 1.8 0 .5-.3 1-.7 1.4-.4.4-.9.6-1.4.6h-1" 
            fill="currentColor" 
            fillOpacity="0.2" 
        />
        <path d="M13 13c1-1 2.5-1.5 4-1 .5-1.5 1.5-2.5 3-2" strokeWidth="2" />
        <path d="M20 10.7c.3.5.2 1.2-.3 1.5-.5.3-1.2.2-1.5-.3" strokeWidth="1.5" />
        <path d="M17 12c-.5 1-1.5 2.5-3.5 2.5h-1.5" strokeWidth="2" />
        <path d="M15.5 13.5c.5.5.8 1.2.8 2s-.3 1.5-.8 2" opacity="0.4" />
    </svg>
);

const GutHealthIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Intestinal Structures (Top) */}
        <path d="M14 2c0 .5-.4 1-1 1H9c-.6 0-1 .4-1 1s.4 1 1 1h4c1.1 0 2 .9 2 2" strokeOpacity="0.6" />
        <path d="M10 2v1c0 .6.4 1 1 1h2" strokeOpacity="0.4" />

        {/* Circular Badge with Checkmark (Middle) */}
        <circle cx="16" cy="9" r="4.5" fill="currentColor" fillOpacity="0.2" strokeWidth="1.5" />
        <circle cx="16" cy="9" r="4.5" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M14.5 9l1 1 2-2" strokeWidth="2" />

        {/* Supporting Hand (Bottom) */}
        <path 
            d="M5 16l-2 1v3.5a1 1 0 0 0 1 1h16l2-2.5v-1l-3-1.5H13l-4 3-4-3z" 
            fill="currentColor" 
            fillOpacity="0.1" 
            stroke="none"
        />
        <path d="M6 15l-3 1.5v4a1 1 0 0 0 1 1h15l3-3.5v-1" />
        <path d="M3 16.5l2 2" strokeWidth="1" />
        <path d="M13 15.5H19" strokeWidth="1.5" />
        <path d="M8.5 18l3.5-3" />
    </svg>
);

const DiabetesObesityIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Glucometer Body */}
        <rect x="5" y="3" width="14" height="15" rx="3" strokeWidth="2" />
        <rect x="5" y="3" width="14" height="15" rx="3" fill="currentColor" fillOpacity="0.05" stroke="none" />
        
        {/* Screen */}
        <rect x="7.5" y="5.5" width="9" height="7" rx="1" fill="currentColor" fillOpacity="0.1" />
        
        {/* Drop Symbol on Screen */}
        <path 
            d="M12 7.5c-0.8 1.2-1.5 2-1.5 2.8s0.7 1.2 1.5 1.2 1.5-0.5 1.5-1.2-0.7-1.6-1.5-2.8z" 
            fill="currentColor" 
            stroke="none" 
        />
        
        {/* Test Strip Slot & Strip */}
        <path d="M9 18v4h6v-4" strokeWidth="2" />
        <line x1="12" y1="20" x2="12" y2="21" strokeWidth="2" stroke="currentColor" />
        <circle cx="12" cy="20.5" r="0.5" fill="red" stroke="none" />
    </svg>
);

const SkinHealthIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Hair Bun */}
        <path d="M12 5c-1.5 0-3-.5-3-2s1.5-1 3-1 3 .5 3 2-1.5 2-3 2z" fill="currentColor" fillOpacity="0.1" />
        <path d="M9 3c0 1.5 1.5 2 3 2s3-.5 3-2" />

        {/* Head/Face Shape */}
        <path d="M12 5c-4 0-6 3-6 7 0 4 2.5 7 6 7s6-3 6-7c0-4-2-7-6-7z" fill="currentColor" fillOpacity="0.2" />
        <path d="M6 12c0 4 2.5 7 6 7s6-3 6-7c0-4-2-7-6-7s-6 3-6 7z" />
        
        {/* Ears */}
        <path d="M6 11c-1 0-1.5 1-1.5 2s.5 2 1.5 2" />
        <path d="M18 11c1 0 1.5 1 1.5 2s-.5 2-1.5 2" />

        {/* Face Features */}
        <path d="M9 12c.5 .5 1.5 .5 2 0" />
        <path d="M13 12c.5 .5 1.5 .5 2 0" />
        <path d="M11 15c.5 .5 1.5 .5 2 0" />
        
        {/* Skin Markers/Dots */}
        <circle cx="9" cy="10" r="0.4" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="0.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="11" r="0.3" fill="currentColor" stroke="none" />
        <circle cx="10" cy="14" r="0.3" fill="currentColor" stroke="none" />
        <circle cx="14" cy="14" r="0.3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="17" r="0.3" fill="currentColor" stroke="none" />
        <circle cx="8" cy="13" r="0.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="13" r="0.2" fill="currentColor" stroke="none" />
    </svg>
);

const BrainHealthIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Head Profile */}
        <path 
            d="M9 21v-2c0-2 0-3-1-4-2-2-4-4-4-7s3-7 8-7 8 4 8 7-2 6-2 9v4" 
            strokeWidth="2"
        />
        <path d="M4 11c0-2 .5-3.5 1.5-4.5" strokeWidth="1.5" opacity="0.5" />
        
        {/* Brain Shape */}
        <g className="text-blue-400">
            <path 
                d="M12 6c-2 0-3.5 1-3.5 2.5s1 2.5 3.5 2.5 3.5-1 3.5-2.5S14 6 12 6z" 
                fill="currentColor" 
                fillOpacity="0.1" 
            />
            <path d="M12 6c-1.5 0-2.5 .5-2.5 1.5s.5 1.5 1.5 1.5l1-1h2l1 1c1 0 1.5-.5 1.5-1.5s-1-1.5-2.5-1.5" />
            <path d="M9.5 9c-.5 1-.5 2 0 3 .5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5 0-2-.5-3" />
            <path d="M12 11v2.5" strokeWidth="1.2" />
        </g>
    </svg>
);

const VascularHealthIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Anatomical Heart Body */}
        <path 
            d="M12 21.5c-1-1-6-5-6-9.5 0-2.5 1.5-4 4-4 .5 0 1 0 1.5.2.2-.5.5-1 1-1.2.2-.1.5-.2.8-.2.2 0 .5.1.7.2.5.2.8.7 1 1.2.5-.2 1-.2 1.5-.2 2.5 0 4 1.5 4 4 0 4.5-5 8.5-6 9.5z" 
            fill="currentColor" 
            fillOpacity="0.1" 
        />
        <path d="M12 21.5c-1-1-6-5-6-9.5 0-2.5 1.5-4 4-4 .5 0 1 0 1.5.2" />
        <path d="M12.5 8c.5-.2 1-.2 1.5-.2 2.5 0 4 1.5 4 4 0 4.5-5 8.5-6 9.5" />
        
        {/* Main Vessels (Aorta/Pulmonary) */}
        <path d="M12 8c.2-1.5.5-3 1-4.5" strokeWidth="2" />
        <path d="M12.5 3.5c1.5 0 2 .5 2 1.5" strokeWidth="1.5" />
        <path d="M10.5 8.5c-.2-1-.5-2-1-3" strokeWidth="2" />
        <path d="M9.5 5.5c-1.5 0-2 .5-2 1.5" strokeWidth="1.5" />
        
        {/* Branching Vessels */}
        <g strokeWidth="1.2" opacity="0.6">
            <path d="M17.5 11l2-1" />
            <path d="M19.5 10l1.5-1.5" />
            <path d="M19.5 10l1 2" />
            
            <path d="M6.5 11l-2-1" />
            <path d="M4.5 10l-1.5-1.5" />
            <path d="M4.5 10l-1 2" />
            
            <path d="M6.5 15l-1.5 1" />
            <path d="M5 16l-.5 2" />
            
            <path d="M17.5 15l1.5 1" />
            <path d="M19 16l.5 2" />
        </g>
        
        {/* Detail on heart surface */}
        <path d="M12 11c-1 1-2 2.5-1.5 4s2 2.5 2 2.5" strokeWidth="1" opacity="0.4" />
        <path d="M13 12c1 1 2 2.5 1.5 4" strokeWidth="1" opacity="0.4" />
    </svg>
);

const ToxicologyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Scientist Profile (Left) */}
        <g opacity="0.8">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M8 5c1 0 1.5-.5 1.5-1.5s-.5-1.5-1.5-1.5l-1 1h2l1 1" opacity="0.4" fill="currentColor" />
            
            <path d="M2 18v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <path d="M6 12l2 3 2-3" strokeWidth="1.2" />
            
            {/* Hair/Bun Detail */}
            <path d="M11 4c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5" />
            <path d="M11 6c1.5 0 2-1 2-2s-.5-2-2-2" />
        </g>

        {/* Flask (Right) */}
        <g className="text-indigo-400">
            <path 
                d="M17 12c-2.5 0-4.5 1.8-4.5 4s2 4 4.5 4 4.5-1.8 4.5-4-2-4-4.5-4z" 
                fill="currentColor" 
                fillOpacity="0.1" 
            />
            <path d="M17 12c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
            <path d="M17 12V9.5h-2V12" strokeWidth="2" />
            <path d="M14 9.5h4" strokeWidth="2" />
            <rect x="15" y="7.5" width="2" height="2" rx="0.5" fill="currentColor" stroke="none" />
            
            {/* Bone Symbol inside Flask */}
            <path 
                d="M15.5 15.5 c-.3-.3-.8-.3-1.1 0s-.3.8 0 1.1l2.5 2.5 c.3.3.8.3 1.1 0s.3-.8 0-1.1 l-2.5-2.5" 
                strokeWidth="1.2" 
            />
            <circle cx="14.2" cy="15.8" r="0.6" fill="currentColor" />
            <circle cx="14.8" cy="15.2" r="0.6" fill="currentColor" />
            <circle cx="17.2" cy="18.8" r="0.6" fill="currentColor" />
            <circle cx="17.8" cy="18.2" r="0.6" fill="currentColor" />
        </g>
    </svg>
);

const BioavailabilityIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Central Hexagon */}
        <g className="text-blue-400">
            <path 
                d="M12 9l3.5 2v4L12 17l-3.5-2v-4z" 
                fill="currentColor" 
                fillOpacity="0.1" 
                strokeWidth="2"
            />
            <path d="M12 9l3.5 2v4L12 17l-3.5-2v-4L12 9z" strokeWidth="2" />
            
            {/* Checkmark inside */}
            <path d="M10.5 13l1 1 2-2" strokeWidth="2" />
            
            {/* Nodes on central hexagon */}
            <circle cx="12" cy="9" r="0.5" fill="currentColor" />
            <circle cx="15.5" cy="11" r="0.5" fill="currentColor" />
            <circle cx="15.5" cy="15" r="0.5" fill="currentColor" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            <circle cx="8.5" cy="15" r="0.5" fill="currentColor" />
            <circle cx="8.5" cy="11" r="0.5" fill="currentColor" />
        </g>

        {/* Small Hexagons and Connections */}
        <g opacity="0.8">
            {/* Top Right */}
            <line x1="13.5" y1="9.5" x2="15" y2="7.5" strokeWidth="1.5" />
            <path d="M15 4l1.5 1v2L15 8l-1.5-1V5z" fill="currentColor" fillOpacity="0.05" />
            <path d="M15 4l1.5 1v2L15 8l-1.5-1V5L15 4z" />
            <path d="M14.5 5.5l.5 .5 1-1" strokeWidth="1" opacity="0.6" />

            {/* Left */}
            <line x1="8.5" y1="13" x2="6.5" y2="12" strokeWidth="1.5" />
            <path d="M5 8l1.5 1v2L5 12l-1.5-1V9z" fill="currentColor" fillOpacity="0.05" />
            <path d="M5 8l1.5 1v2L5 12l-1.5-1V9L5 8z" />
            <path d="M4.5 9.5l.5 .5 1-1" strokeWidth="1" opacity="0.6" />

            {/* Bottom Left */}
            <line x1="10.5" y1="16.5" x2="9" y2="18.5" strokeWidth="1.5" />
            <path d="M8 17l1.5 1v2L8 21l-1.5-1v-2z" fill="currentColor" fillOpacity="0.05" />
            <path d="M8 17l1.5 1v2L8 21l-1.5-1v-2L8 17z" />
            <path d="M7.5 18.5l.5 .5 1-1" strokeWidth="1" opacity="0.6" />
        </g>
    </svg>
);

const EXPERTISE_DATA = [
    {
        label: 'Leaky Gut',
        icon: LeakyGutIcon,
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        description: 'Investigating intestinal permeability and its impact on systemic inflammation and chronic disease markers.',
        content: [
            { type: 'paragraph', text: "Leaky gut syndrome is prevalent in various conditions, including antibiotic use, chemotherapy, inflammatory bowel diseases, aging, obesity, diabetes, and poor diet. It is a significant source of inflammation, exacerbating numerous diseases such as cognitive decline, Alzheimer's, cardiovascular disorders, and cancer." },
            { type: 'question', text: "Is your product the answer to reducing leaky gut and its related issues?" },
            { type: 'paragraph', text: "At MusB Research, we offer advanced research services to help you develop evidence that your products or ingredients can reduce leaky gut. We conduct transwell, preclinical and clinical studies, that allow to:" },
            {
                type: 'list', items: [
                    "Assess Gut Epithelial Function: Determine the impact of your ingredients on gut epithelial integrity and function.",
                    "Evaluate Leaky Gut: Test various doses and treatment times to see if your product reduces gut permeability.",
                    "Microbiome Interactions: Examine how your product interacts with the microbiome and its effects on leaky gut.",
                    "Preclinical and Clinical assessments: Determine whether your product(s) have safety and efficacy in reducing leaky gut in animals and humans."
                ]
            },
            { type: 'closing', text: "Our comprehensive approach ensures that we provide you with detailed insights into how your product can help manage and improve gut health." },
            { type: 'cta', text: "Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Inflammation',
        icon: InflammationIcon,
        color: 'text-indigo-400',
        glow: 'shadow-[0_0_15px_rgba(129,140,248,0.4)]',
        description: 'Studying acute and chronic inflammatory responses through advanced biomarker analysis and cytokine profiling.',
        content: [
            { type: 'title', text: "Anti- and Pro-Inflammatory Testing Services" },
            { type: 'paragraph', text: "Chronic inflammation is linked to numerous health conditions, including autoimmune diseases, cardiovascular disorders, and cancer. Understanding how your product influences inflammation is crucial for its success and efficacy." },
            { type: 'question', text: "Is your product the key to managing inflammation and promoting better health?" },
            { type: 'paragraph', text: "At MusB Research, we offer advanced testing services to help you generate evidence on the anti- and/or pro-inflammatory effects of your products. Our state-of-the-art facilities and experienced team provide comprehensive analysis through various methods:" },
            {
                type: 'list', items: [
                    "Inflammatory Marker Analysis: Evaluate the impact of your product on key inflammatory markers, such as cytokines and chemokines, to determine its anti-inflammatory potential.",
                    "Cell Culture Systems: Utilize primary cells and cell lines to assess the pro-inflammatory or anti-inflammatory effects of your product at different concentrations and exposure times.",
                    "Ex-Vivo Models: Test your product in human or animal primary cells like PBMCs to gain insights into its effects on inflammation and overall health.",
                    "Preclinical and Clinical assessments: Determine whether your product(s) have safety and efficacy in reducing acute and/or chronic inflammation in animals and humans."
                ]
            },
            { type: 'closing', text: "Our holistic approach ensures that you receive detailed and reliable data on how your product can help manage inflammation and improve health outcomes." },
            { type: 'cta', text: "Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Microbiome',
        icon: MicrobiomeIcon,
        color: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(96,165,250,0.4)]',
        description: 'Exploring the complex ecosystem of gut flora and its profound influence on metabolic and immune health.',
        content: [
            { type: 'title', text: "Unlock the Potential of Microbiome Research" },
            { type: 'paragraph', text: "Are you seeking evidence on how your products, ingredients, and technologies influence the microbiome? Look no further! At MusB Research, we offer comprehensive microbiome culture services to provide you with the insights you need." },
            { type: 'paragraph', text: "Our established ex-vivo system allows us to culture microbiomes from a wide range of sources, including:" },
            {
                type: 'list', items: [
                    "Human Gut Microbiome", "Dog Gut Microbiome", "Cat Gut Microbiome", "Cattle Gut Microbiome",
                    "Equine Gut Microbiome", "Mice, Hamsters, Rats, Rabbits", "Goat Gut Microbiome",
                    "Pig Gut Microbiome", "Chicken Gut Microbiome"
                ]
            },
            { type: 'title', text: "Our Services Include:" },
            {
                type: 'list', items: [
                    "Microbiome Analysis: Determine how your products or ingredients affect various microbiomes and their metabolites.",
                    "Biological Effects Assessment: Evaluate the impact of your products on leaky gut, inflammation, cognitive health, metabolic health, and more.",
                    "Human and Animal Health: Assess the effects of your products on both human and animal health.",
                    "Ecosystem Impact: Understand how your innovations influence different ecosystems."
                ]
            },
            { type: 'title', text: "Why Choose MusB Research?" },
            {
                type: 'list', items: [
                    "Advanced Ex-Vivo System: Our cutting-edge ex-vivo system ensures accurate and reliable microbiome cultures.",
                    "Diverse Sources: We culture microbiomes from a variety of species, providing comprehensive insights.",
                    "Expert Analysis: Our team of experts delivers detailed analysis and interpretation of your product’s effects."
                ]
            },
            { type: 'paragraph', text: "We can help you in developing your products/ingredients for microbiome modulation in pets, large animals as well as human clinical trials." },
            { type: 'cta', text: "Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Biotics',
        icon: BioticsIcon,
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        description: 'Scientific validation of prebiotics, probiotics, and postbiotics in enhancing host-microbe interactions.',
        content: [
            { type: 'title', text: "Develop and Innovate with Our Probiotics Expertise" },
            { type: 'paragraph', text: "Are you interested in developing your own probiotics or selecting from a vast, well-curated collection? Look no further! At MusB Research, we offer comprehensive solutions for all your probiotic development needs." },
            { type: 'paragraph', text: "With over 20 years of experience, we specialize in creating novel probiotics sourced from humans (covering six sites: eyes, ears, nasal, oral, skin, and gut), animals, foods, soil, and water. Our extensive Probiotics Consortium offers a wide variety of strains for you to choose from, or we can help you develop a custom probiotic tailored to your specific requirements." },
            { type: 'title', text: "Why Choose MusB Research for Probiotics Development?" },
            {
                type: 'list', items: [
                    "Extensive Experience: Benefit from our two decades of expertise in developing innovative probiotics.",
                    "Diverse Sources: Access probiotics from a wide range of sources, ensuring the best possible strain for your needs.",
                    "Comprehensive Consortium: Choose from our large collection of probiotics in our Probiotics Consortium Contact us.",
                    "Probiotics produces: We also have established relationships with large probiotics manufacturers who can scale-up, produce, pack and label your products."
                ]
            },
            { type: 'title', text: "Our Key Assays Include:" },
            {
                type: 'columns',
                columns: [
                    {
                        items: [
                            "Bile Tolerance", "Acid Tolerance", "Protoplast Regeneration", "Adherence",
                            "Antibiotics Sensitivity", "Pathogenic Genes", "Competition with Pathogens",
                            "Bile Salt Hydrolase Activity", "Short Chain Fatty Acid Production", "Drug Interactions"
                        ]
                    },
                    {
                        items: [
                            "Gram Staining", "Genomic Characterization", "Compatibility with Delivery Systems",
                            "Biological Efficacies", "Bacteriocin Production", "Anti-Microbial Effects",
                            "Anti-Aging Potential", "Anti-Obesity Potential", "Postbiotic Abilities"
                        ]
                    }
                ]
            },
            { type: 'paragraph', text: "Whether you need to select a probiotic strain from our consortium or develop and substantiate your unique probiotic, MusB Research has you covered. Our state-of-the-art facilities and expert team are ready to help you every step of the way." },
            { type: 'cta', text: "Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Aging',
        icon: AgingIcon,
        color: 'text-indigo-400',
        glow: 'shadow-[0_0_15px_rgba(129,140,248,0.4)]',
        description: 'Researching cellular senescence and longevity markers to promote healthy biological aging and cellular rejuvenation.',
        content: [
            { type: 'paragraph', text: "Anti-aging screening of your compounds using robust models like C. elegans and versatile models of senescent cell culture can unlock the market potential of your ingredients in the longevity market by providing scientifically validated evidence. This rigorous testing will build consumer trust and position your products as credible and effective solutions in the competitive anti-aging market." },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "SENESCENCE USING CELL CULTURE SYSTEM",
                        text: "Establish the Potential of Your Products for Anti-Aging Effects",
                        content: "As we age, our bodies accumulate senescent or \"zombie\" cells that can negatively impact various organs. Individuals with higher levels of these cells often experience the early onset and increased severity of aging-related diseases. Our cell culture system for senescence measures can determine how your products or ingredients impact senescence in distinct cell types, in faster and more economical ways before testing them in large animals and humans. These can help you gain valuable evidence of your compounds' ability to reduce senescence, potentially mitigating aging-related issues such as aging itself, cancer, and weakened immune function.",
                        question: "Curious if your product or ingredient can mitigate senescence?",
                        bullets: [
                            "Large Scale Screening: Our cell assays can determine how your products or ingredients affect the senescence process. We can use distinct cell lines from humans and look for effects on the overall body as well as organ-specific effects. This data can be crucial for developing indications related to aging biology and health.",
                            "Dose, Time Scales, and Toxicity Profiles: Our assays test various doses, treatment times, and other measures, including toxicity profiles, to better understand the effects of your compounds.",
                            "Detailed Reporting: Obtain comprehensive reports on the protective effects of your products on senescence and aging, substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "ANTI-AGING SCREENING USING C. ELEGANS",
                        text: "Unlock the Potential of Your Products' Anti-Aging Activities:",
                        content: "Aging is a natural process that leads to various health conditions in humans and animals. While aging itself is not a disease, studies have shown that certain products and ingredients can exhibit anti-aging effects.",
                        question: "Curious if your product or ingredient has anti-aging properties?",
                        bullets: [
                            "C. elegans Screening: Utilize our optimized system to screen a wide range of ingredients and compounds, including probiotics, prebiotics, synbiotics, postbiotics, and more, for their potential anti-aging effects.",
                            "Automated and Robust System: Benefit from our automated and robust screening system, capable of efficiently handling large numbers of samples.",
                            "Detailed Reporting: Obtain comprehensive reports on the anti-aging health effects of your products, aiding in substantiating your claims with robust scientific data."
                        ],
                        closing: "Unlock the market potential of your products with our scientifically validated evidence"
                    },
                    {
                        heading: "ANTI-AGING EFFECTS IN SMALL ANIMALS, PETS AND LIVESTOCK CLINICAL TRIALS",
                        content: "Aging in pets and livestock, much like in humans, can lead to various health challenges. Although aging is a natural process, certain products and ingredients may offer anti-aging benefits that enhance the health and longevity of animals.",
                        bullets: [
                            "Targeted Anti-Aging Markers: : Utilize our specialized aging biology markers to assess a wide range of ingredients, including probiotics, prebiotics, synbiotics, postbiotics, herbals, nutraceuticals, pharmacological, and non-pharmacological compounds, for their potential anti-aging effects in pets and livestock.",
                            "Efficient and Comprehensive Testing: Leverage our well-established and optimized assays designed to efficiently handle large sample volumes, delivering reliable data on your products' impact on animal aging.",
                            "In-Depth Reporting: Access detailed reports that clearly document the anti-aging health benefits of your products, helping you substantiate your claims with robust scientific evidence."
                        ],
                        closing: "Unlock new market opportunities by validating the anti-aging potential of your products for pets and livestock through our expert clinical trials.",
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "ANTI-AGING EFFECTS IN HUMAN CLINICAL TRIALS",
                        content: "Aging in humans is a natural process, but it often leads to a range of health challenges. While aging cannot be prevented, certain products and ingredients may offer anti-aging benefits that promote health and longevity.",
                        bullets: [
                            "Unique Aging Biology Markers: Leverage our specialized aging biology markers to assess a wide range of ingredients, including probiotics, prebiotics, synbiotics, postbiotics, herbals, nutraceuticals, pharmacological, and non-pharmacological compounds, for their potential anti-aging effects in humans.",
                            "Reliable and Comprehensive Testing: Utilize our well-established and optimized assays, designed to efficiently handle large sample volumes, providing you with reliable data on your products' impact on human aging.",
                            "In-Depth Reporting: Access detailed reports that clearly document the anti-aging health benefits of your products, helping you substantiate your claims with robust scientific evidence."
                        ],
                        closing: "Unlock new market opportunities by validating the anti-aging potential of your products through our expert human clinical trials.",
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            },
            { type: 'paragraph', text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your anti-aging product claims. Let us help you drive innovation and success in the longevity market. Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Cognitive Health',
        icon: Brain,
        color: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(96,165,250,0.4)]',
        description: 'Assessing memory, focus, and neurological performance through clinical and functional assessments.',
        content: [
            { type: 'paragraph', text: "Cognitive health is crucial, especially with rising cases of neurodegenerative diseases. Caenorhabditis elegans (C. elegans), with its sensory, learning, and memory behavior, is an ideal model for large-scale screening to assess the cognitive effects of your components." },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "SCREEN COGNITIVE BENEFITS USING C. ELEGANS",
                        text: "Is your product the next breakthrough in cognitive health?",
                        bullets: [
                            "C. elegans Muscle Screening: Utilize our established assays to evaluate the impact of your products on muscle functions such as proliferation, muscle wasting, and insulin sensitivity in C. elegans.",
                            "Cell Culture Analysis: Assess your components' effects on muscle cells, providing detailed insights into muscle proliferation, differentiation, and function.",
                            "High-Throughput Screening: Benefit from our efficient platform for rapid, large-scale assessment of your product's impact on muscle health, including various doses and treatment times. Comprehensive Muscle Function Testing: Evaluate key aspects of muscle health, including insulin sensitivity, muscle wasting prevention, and overall muscle function, to support your product's efficacy.",
                            "Detailed Reporting: Obtain comprehensive reports on the muscle health effects of your products, aiding in substantiating your claims with robust scientific data."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "COGNITIVE BENEFICIAL EFFECTS IN HUMAN CLINICAL TRIALS",
                        content: "Cognitive health is critical for overall well-being, and innovative products have the potential to make significant impacts. Determining the cognitive benefits of your ingredients could position your product as the next breakthrough in cognitive health.",
                        bullets: [
                            "In-Depth Behavioral Analysis: Examine detailed behavioral changes related to sensory, learning, and memory functions in response to your components, providing valuable insights into the cognitive benefits of your products.",
                            "Specialized Cognitive Health Markers: Leverage our advanced cognitive health markers to assess a wide range of ingredients, including probiotics, prebiotics, synbiotics, postbiotics, herbals, nutraceuticals, pharmacological, and non-pharmacological compounds, for their potential cognitive benefits in humans.",
                            "Comprehensive Reporting: Access thorough reports that clearly document the cognitive health benefits of your products, helping you substantiate your claims with solid scientific evidence."
                        ],
                        closing: "Unlock new market opportunities by validating the cognitive health potential of your products through our expert human clinical trials.",
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            },
            { type: 'paragraph', text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your cognitive health product claims. Let us help you drive innovation and success in the cognitive health market. Contact us today to get started on your project and elevate your products to the next level!" }
        ]
    },
    {
        label: 'Neurodegeneration',
        icon: NeurodegenerationIcon,
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        description: 'In-depth studies on neuroprotective pathways and strategies to mitigate age-related cognitive decline.',
        content: [
            { type: 'title', text: "Establish the Potential of Your Products for Neuroprotective and Neuromodulator Effects in Mammalian Cells" },
            { type: 'paragraph', text: "Neurodegenerative diseases such as Alzheimer’s, Parkinson’s, ALS, and others significantly impact human health. Understanding how your products or ingredients can prevent, or slow neurodegeneration is vital for developing effective treatments." },
            { type: 'question', text: "Want to know if your products or ingredients impact Neurodegeneration and Neuromodulation?" },
            {
                type: 'list', items: [
                    "Our Testing Services - Large Scale Screening: Our neuronal cell assays can determine how your products or ingredients affect neurodegeneration process. This data can be crucial for developing indications related to brain health related Alzheimer’s disease, Parkinson, ALS and other neurodegenerative conditions.",
                    "Dose, Time Scales, and Toxicity Profiles: Our assays test various doses, treatment times, and other measures, including toxicity profiles, to better understand the effects of your compounds.",
                    "Neurotransmitter Production: Determine whether your products influence neurotransmitter production, which is essential for brain function and health.",
                    "Detailed Reporting: Obtain comprehensive reports on the protective effects of your products on neurodegeneration, substantiating your claims with robust scientific data.",
                    "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                ]
            },
            { type: 'cta', text: "Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Muscle Health',
        icon: MuscleHealthIcon,
        color: 'text-indigo-400',
        glow: 'shadow-[0_0_15px_rgba(129,140,248,0.4)]',
        description: 'Evaluating protein synthesis, muscle mass maintenance, and musculoskeletal integrity across life stages.',
        content: [
            { type: 'paragraph', text: "Muscle health is vital for metabolic and physical well-being, playing a key role in joint function, glucose management, body weight control, and overall stamina. Using cell culture and Caenorhabditis elegans (C. elegans), we offer large-scale screening to assess the effects of your components on muscle health." },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "SCREEN COGNITIVE BENEFITS USING C. ELEGANS",
                        text: "Is your product the next breakthrough in cognitive health?",
                        bullets: [
                            "C. elegans Muscle Screening: Utilize our established assays to evaluate the impact of your products on muscle functions such as proliferation, muscle wasting, and insulin sensitivity in C. elegans.",
                            "Cell Culture Analysis: Assess your components' effects on muscle cells, providing detailed insights into muscle proliferation, differentiation, and function.",
                            "High-Throughput Screening: Benefit from our efficient platform for rapid, large-scale assessment of your product's impact on muscle health, including various doses and treatment times.",
                            "Comprehensive Muscle Function Testing: Evaluate key aspects of muscle health, including insulin sensitivity, muscle wasting prevention, and overall muscle function, to support your product's efficacy.",
                            "Detailed Reporting: Obtain comprehensive reports on the muscle health effects of your products, aiding in substantiating your claims with robust scientific data."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "GROWING, BETTER, AND FASTER MUSCLES IN PETS AND LIVESTOCK TRIALS",
                        text: "Enhance Muscle Health and Growth in Pets and Livestock with Expert Clinical Trials",
                        content: "Muscle health is crucial not only for the overall well-being and performance of pets and livestock, such as horses, but also for the meat industry, where enhancing muscle mass and promoting faster growth in meat-producing animals is essential. Whether you are focused on improving the quality of life for pets and livestock or boosting muscle development in meat-producing animals, your products can make a significant impact.",
                        bullets: [
                            "Explore Muscle-Promoting and Preserving Effects: Aging in pets and livestock, like in humans, can lead to muscle deterioration and other health challenges. However, certain products and ingredients may help preserve muscle health and promote muscle growth, supporting both animal longevity and performance.",
                            "Targeted Muscle Health Markers: Utilize our specialized muscle biology markers to assess a wide range of ingredients, including probiotics, prebiotics, synbiotics, postbiotics, herbals, nutraceuticals, pharmacological, and non-pharmacological compounds, for their potential to promote muscle growth and preserve muscle health in pets and livestock.",
                            "Efficient and Comprehensive Testing: Leverage our well-established and optimized assays for exercise tolerance and muscle health evaluation, designed to efficiently handle both small and large animals. We provide reliable data on your products' impact on muscle health and development in various species.",
                            "In-Depth Reporting: Access detailed reports that clearly document the muscle health benefits of your products, helping you substantiate your claims with robust scientific evidence."
                        ],
                        closing: "Unlock new market opportunities by validating the muscle-promoting potential of your products for pets, horses, and meat-producing livestock through our expert clinical trials.",
                        cta: "Contact us today to get started on your project"
                    },
                    {
                        heading: "MUSCLE HEALTH PROMOTING AND PRESERVING IN HUMAN CLINICAL TRIALS",
                        text: "Preserve and Promote Muscle Health in Humans with Advanced Human Clinical Testing",
                        content: "Muscle loss is a significant concern during aging and weight loss, affecting overall health, mobility, and quality of life. Position your products as market leaders by ensuring they not only promote muscle growth but also preserve muscle mass during these critical periods.",
                        bullets: [
                            "Explore Muscle-Preserving and Promoting Effects: Muscle health is essential for maintaining overall well-being, particularly as we age or undergo weight loss. Test whether your products and ingredients can play a role in preserving muscle mass while simultaneously promoting muscle growth, enhancing physical performance and longevity.",
                            "Targeted Muscle Health Markers: We utilize our specialized muscle biology markers to evaluate a diverse range of ingredients—probiotics, prebiotics, synbiotics, postbiotics, herbals, nutraceuticals, pharmacological, and non-pharmacological compounds. We provide precise assessments of their potential to maintain and enhance muscle health during aging and weight loss.",
                            "Efficient and Comprehensive Testing: Our well-established and optimized assays are designed for accurate muscle health evaluations, delivering reliable data on your products' impact on muscle preservation and growth. Our methodologies ensure consistent and reproducible results, making them ideal for clinical trials.",
                            "In-Depth Reporting: We provide detailed reports that clearly outline the muscle health benefits of your products. These scientifically backed reports help substantiate your claims, providing robust support for your marketing strategies and regulatory submissions."
                        ],
                        closing: "Validate the muscle-preserving and promoting potential of your products in humans through our expert clinical trials.",
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            }
        ]
    },
    {
        label: 'Gut Health',
        icon: GutHealthIcon,
        color: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(96,165,250,0.4)]',
        description: 'Comprehensive analysis of digestive function, nutrient absorption, and gastrointestinal wellness.',
        content: [
            {
                type: 'paragraph',
                text: "Are you looking to develop new probiotics or postbiotics, or test your products for their impact on microbiome, leaky gut, and other gut health symptoms? MusB Research can help. With our expertise in probiotics development, microbiome analyses, and state-of-the-art culture systems, we can unlock the market potential of your ingredients in human, pet, and agricultural markets. Our advanced leaky gut assays provide scientifically validated evidence to elevate your products, ingredients, or technology to the next level."
            },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "Leaky Gut",
                        content: "Leaky gut syndrome is prevalent in various conditions, including antibiotic use, chemotherapy, inflammatory bowel diseases, aging, obesity, diabetes, and poor diet. It is a significant source of inflammation, exacerbating numerous diseases such as cognitive decline, Alzheimer's, cardiovascular disorders, and cancer.",
                        text: "Is your product the answer to reducing leaky gut and its related issues?",
                        question: "At MusB Research, we offer advanced research services to help you develop evidence that your products or ingredients can reduce leaky gut. We conduct transwell, preclinical and clinical studies, that allow to:",
                        bullets: [
                            "Assess Gut Epithelial Function: Determine the impact of your ingredients on gut epithelial integrity and function.",
                            "Evaluate Leaky Gut: Test various doses and treatment times to see if your product reduces gut permeability.",
                            "Microbiome Interactions: Examine how your product interacts with the microbiome and its effects on leaky gut.",
                            "Preclinical and Clinical assessments: Determine whether your product(s) have safety and efficacy in reducing leaky gut in animals and humans."
                        ],
                        closing: "Our comprehensive approach ensures that we provide you with detailed insights into how your product can help manage and improve gut health."
                    },
                    {
                        heading: "Probiotic Development",
                        text: "Develop and Innovate with Our Probiotics Expertise",
                        content: "Are you interested in developing your own probiotics or selecting from a vast, well-curated collection? Look no further! At MusB Research, we offer comprehensive solutions for all your probiotic development needs.\n\nWith over 20 years of experience, we specialize in creating novel probiotics sourced from humans (covering six sites: eyes, ears, nasal, oral, skin, and gut), animals, foods, soil, and water. Our extensive Probiotics Consortium offers a wide variety of strains for you to choose from, or we can help you develop a custom probiotic tailored to your specific requirements.",
                        sections: [
                            { type: 'question', text: "Why Choose MusB Research for Probiotics Development?" },
                            {
                                type: 'list', items: [
                                    "Extensive Experience: Benefit from our two decades of expertise in developing innovative probiotics.",
                                    "Diverse Sources: Access probiotics from a wide range of sources, ensuring the best possible strain for your needs.",
                                    "Comprehensive Consortium: Choose from our large collection of probiotics in our Probiotics Consortium Contact us.",
                                    "Probiotics produces: We also have established relationships with large probiotics manufacturers who can scale-up, produce, pack and label your products."
                                ]
                            },
                            { type: 'title', text: "Our Key Assays Include:" },
                            {
                                type: 'columns',
                                columns: [
                                    {
                                        items: [
                                            "Bile Tolerance", "Acid Tolerance", "Protoplast Regeneration", "Adherence",
                                            "Antibiotics Sensitivity", "Pathogenic Genes", "Competition with Pathogens",
                                            "Bile Salt Hydrolase Activity", "Short Chain Fatty Acid Production", "Drug Interactions"
                                        ]
                                    },
                                    {
                                        items: [
                                            "Gram Staining", "Genomic Characterization", "Compatibility with Delivery Systems",
                                            "Biological Efficacies", "Bacteriocin Production", "Anti-Microbial Effects",
                                            "Anti-Aging Potential", "Anti-Obesity Potential", "Postbiotic Abilities"
                                        ]
                                    }
                                ]
                            },
                            { type: 'paragraph', text: "Whether you need to select a probiotic strain from our consortium or develop and substantiate your unique probiotic, MusB Research has you covered. Our state-of-the-art facilities and expert team are ready to help you every step of the way." }
                        ]
                    },
                    {
                        heading: "Microbiome",
                        text: "Unlock the Potential of Microbiome Research",
                        content: "Are you seeking evidence on how your products, ingredients, and technologies influence the microbiome? Look no further! At MusB Research, we offer comprehensive microbiome culture services to provide you with the insights you need.\n\nOur established ex-vivo system allows us to culture microbiomes from a wide range of sources, including:",
                        sections: [
                            {
                                type: 'list', items: [
                                    "Human Gut Microbiome", "Dog Gut Microbiome", "Cat Gut Microbiome", "Cattle Gut Microbiome",
                                    "Equine Gut Microbiome", "Mice, Hamsters, Rats, Rabbits", "Goat Gut Microbiome",
                                    "Pig Gut Microbiome", "Chicken Gut Microbiome"
                                ]
                            },
                            { type: 'title', text: "Our Services Include:" },
                            {
                                type: 'list', items: [
                                    "Microbiome Analysis: Determine how your products or ingredients affect various microbiomes and their metabolites.",
                                    "Biological Effects Assessment: Evaluate the impact of your products on leaky gut, inflammation, cognitive health, metabolic health, and more.",
                                    "Human and Animal Health: Assess the effects of your products on both human and animal health.",
                                    "Ecosystem Impact: Understand how your innovations influence different ecosystems."
                                ]
                            },
                            { type: 'title', text: "Why Choose MusB Research?" },
                            {
                                type: 'list', items: [
                                    "Advanced Ex-Vivo System: Our cutting-edge ex-vivo system ensures accurate and reliable microbiome cultures.",
                                    "Diverse Sources: We culture microbiomes from a variety of species, providing comprehensive insights.",
                                    "Expert Analysis: Our team of experts delivers detailed analysis and interpretation of your product’s effects."
                                ]
                            },
                            { type: 'paragraph', text: "We can help you in developing your products/ingredients for microbiome modulation in pets, large animals as well as human clinical trials." }
                        ]
                    }
                ]
            },
            {
                type: 'paragraph',
                text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your gut health product claims. Let us help you drive innovation and success in the gut health market. Contact us today to get started on your project and elevate your products to the next level!"
            }
        ]
    },
    {
        label: 'Diabetes & Obesity',
        icon: DiabetesObesityIcon,
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        description: 'Translational research on glycemic control, insulin sensitivity, and weight management interventions.',
        content: [
            { type: 'paragraph', text: "At MusB Research, we offer cutting-edge research services to help you substantiate your products' claims in the fight against obesity and diabetes. Our advanced assays and expertise provide you with the insights needed to develop evidence-based products." },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "SCREENING FOR GLP-I PRODUCTION",
                        text: "Unlock the Potential of Your Products with GLP-1 Promoting Properties",
                        content: "Glucagon-like protein-1 (GLP-1) is a crucial gut hormone that regulates hunger, satiety, weight, glucose levels, and more. It's currently one of the hottest targets for weight loss, diabetes management, cognitive decline reduction, and cardioprotection",
                        question: "Want to know if your product or ingredient has GLP-1-promoting properties?",
                        bullets: [
                            "Large Scale Screening: Utilize our optimized system to screen a wide range of ingredients and compounds, including drugs, natural compounds, probiotics, prebiotics, synbiotics, postbiotics, and more, for their potential GLP-1 promoting effects.",
                            "Detailed Reporting: Obtain comprehensive reports on the GLP-1 promoting effects of your products, aiding in substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "FAT ACCUMULATION IN ADIPOCYTES IN CELL CULTURE",
                        text: "Unlock the Potential of Your Products for Reducing Fat Accumulation",
                        content: "Our body accumulates fat in adipose tissues, leading to obesity, which drives many health conditions, including diabetes. White adipocytes are the primary cells responsible for fat storage in the body. In contrast, brown adipocytes burn fat and produce heat, offering a unique approach to weight management.",
                        question: "Want to know if your product or ingredient impacts adipocyte properties?",
                        bullets: [
                            "Large Scale Screening: Our optimized adipocyte differentiation assay measures your product's ability to suppress fat accumulation in adipocytes. We assess multiple doses, treatment times, and stages of adipocyte differentiation.",
                            "Comprehensive Analysis: We determine if your products suppress white adipocytes from accumulating fat or promote brown adipocytes to burn fat. Additionally, we evaluate their effects on fat accumulation, glucose uptake, and adipokine secretions.",
                            "Detailed Reporting: Obtain comprehensive reports on the fat-reducing effects of your products, substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "INSULIN SECRETION IN CELL CULTURE",
                        text: "Unlock the Potential of Your Products for Improving Diabetes Management",
                        content: "Insulin is the key hormone regulating blood glucose levels. Reduced insulin production from pancreatic beta cells or decreased action on its target cells to dispose of glucose are the key hallmarks of diabetes.",
                        question: "Want to know if your products or ingredients impact insulin secretion or action?",
                        bullets: [
                            "Large Scale Screening: Our cell culture assays evaluate whether your compounds, products, or ingredients enhance insulin secretion from pancreatic cells. We also test if your compounds promote insulin action to increase glucose disposal for better diabetes management.",
                            "Dose, Time Scales, and Toxicity Profiles: Our assays test various doses, treatment times, and other measures, including toxicity profiles, to better understand the effects of your compounds.",
                            "Detailed Reporting: Obtain comprehensive reports on the anti-diabetic effects of your products, substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "MUSCLE HEALTH SOLUTIONS",
                        content: "Muscle health is vital for metabolic and physical well-being, playing a key role in joint function, glucose management, body weight control, and overall stamina. Using cell culture and Caenorhabditis elegans (C. elegans), we offer large-scale screening to assess the effects of your components on muscle health.",
                        question: "Is your product the next innovation in muscle health?",
                        bullets: [
                            "C. elegans Muscle Screening: Utilize our established assays to evaluate the impact of your products on muscle functions such as proliferation, muscle wasting, and insulin sensitivity in C. elegans.",
                            "Cell Culture Analysis: Assess your components' effects on muscle cells, providing detailed insights into muscle proliferation, differentiation, and function.",
                            "High-Throughput Screening: Benefit from our efficient platform for rapid, large-scale assessment of your product's impact on muscle health, including various doses and treatment times.",
                            "Comprehensive Muscle Function Testing: Evaluate key aspects of muscle health, including insulin sensitivity, muscle wasting prevention, and overall muscle function, to support your product's efficacy.",
                            "Detailed Reporting: Obtain comprehensive reports on the muscle health effects of your products, aiding in substantiating your claims with robust scientific data."
                        ]
                    },
                    {
                        heading: "LIPID ACCUMULATION SCREENING IN C. ELEGANS",
                        text: "Unlock Insights into Fat Accumulation",
                        content: "Obesity, characterized by excessive lipid accumulation, presents significant health challenges worldwide. Caenorhabditis elegans (C. elegans) offers a valuable model for studying lipid accumulation, facilitating the exploration of compounds and genetic factors involved in lipid metabolism regulation.",
                        question: "Curious about the protective effects of your products/ingredients against fat accumulation or obesity?",
                        bullets: [
                            "C. elegans Screening: Utilize our optimized protocols to assess the protective effects of your products against fat accumulation and obesity development.",
                            "Visualization and Quantification: Leverage C. elegans' transparent body for visualization and quantification of lipid droplets, enabling accurate screening of compounds."
                        ]
                    },
                    {
                        heading: "TESTING METABOLIC BENEFITS IN SMALL ANIMALS, PETS AND LIVESTOCK TRIALS",
                        text: "Mitigate Fat Accumulation to Enhance Health in Pets and Livestock",
                        content: "Excessive fat accumulation poses significant health risks, including an increased likelihood of developing type 2 diabetes, cardiovascular diseases, and other conditions in pets and animals, leading to higher medical care costs. In livestock, increased fat accumulation can suppress muscle formation, which, while beneficial for meat production, is detrimental to overall health. Therefore, it is crucial to focus on products that effectively suppress fat accumulation in both adipose tissue and the liver, preventing issues such as hepatic steatosis.",
                        question: "Targeted Solutions for Fat Management:",
                        bullets: [
                            "Address Health Risks: Excessive fat accumulation can lead to severe health complications. Determine whether your products/ingredients are designed to mitigate fat accumulation and address associated risks, including type 2 diabetes and cardiovascular diseases.",
                            "Enhance Livestock Efficiency: Managing fat accumulation in livestock is essential for optimizing muscle formation and improving overall health. Test whether your products/ ingredients effectively suppress fat accumulation and can enhance the quality and performance of meat-producing animals.",
                            "Innovative Testing for Fat Management: We utilize specialized assays to assess the effectiveness of your products in reducing fat accumulation. Our comprehensive testing platforms provide insights into how different ingredients, such as probiotics, prebiotics, and nutraceuticals, affect fat levels in both adipose tissue and the liver.",
                            "Detailed Reporting for Validation: We prepare thorough reports documenting the efficacy of your products in controlling fat accumulation. These reports offer robust scientific evidence to support your product claims."
                        ],
                        closing: "Unlock new opportunities by validating your products’ potential to manage fat accumulation in pets and livestock through our expert clinical trials.",
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "TEST METABOLIC BENEFITS IN HUMAN CLINICAL TRIALS",
                        text: "Establish Metabolic Benefits of Your Products in Human Clinical Trials",
                        content: "Showcase your products as market leaders in metabolic health. Whether your goal is weight loss, muscle preservation, GLP-1 or insulin secretion, or improving blood glucose control, we help you prove their efficacy. Our clinical trials ensure your products excel in weight management, diabetes control, cardiovascular risk reduction, and overall quality of life.",
                        bullets: [
                            "Test Weight Loss and Metabolic Effects: Discover if your products promote weight loss, support muscle preservation, and enhance GLP-1 activity to reduce hunger.",
                            "Evaluate Diabetes and Weight Management: Assess if your ingredients improve blood glucose control, prevent weight regain, and promote insulin secretion.",
                            "Utilize Targeted Metabolic Markers: Leverage our specialized assays to evaluate a range of ingredients, including probiotics, prebiotics, and nutraceuticals, for their impact on metabolic health.",
                            "Receive Detailed Reporting: Get comprehensive reports detailing the metabolic benefits of your products, providing strong support for your marketing and regulatory needs."
                        ],
                        closing: "Validate your products' metabolic benefits through our expert clinical trials",
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            },
            { type: 'paragraph', text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your product claims. Let us help you drive innovation and success in obesity and diabetes management. Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Skin Health',
        icon: SkinHealthIcon,
        color: 'text-pink-400',
        glow: 'shadow-[0_0_15px_rgba(244,114,182,0.4)]',
        description: 'Clinical evaluation of dermatological health, including barrier function, hydration, and anti-aging efficacy.',
        content: [
            { type: 'paragraph', text: "At MusB Research, we provide cutting-edge research services to validate your products' claims in skin health, whether addressing aging, wound healing, radiation injury, or other conditions. Our advanced assays and expertise offer the insights necessary to develop evidence-based, effective products." },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "SCREEN SKIN HEALTH BENEFITS USING CELL CULTURE SYSTEM",
                        sections: [
                            { type: 'title', text: "Wound Healing" },
                            { type: 'paragraph', text: "Skin wounds can arise from various sources, and the rate of healing and potential scarring are crucial factors in skin health." },
                            { type: 'question', text: "Interested in accelerating wound healing and reducing scar formation with your product or ingredient?" },
                            {
                                type: 'list', items: [
                                    "Advanced Wound Healing Assays: Our well-established wound healing assays using skin cells can assess the speed at which your products or ingredients promote wound closure.",
                                    "Collagen Formation Analysis: Measure collagen formation, a major component of scar tissue, to evaluate scar reduction potential."
                                ]
                            },
                            { type: 'title', text: "UV Exposure" },
                            { type: 'paragraph', text: "UV exposure can lead to significant skin damage, including photoaging, hyperpigmentation, scarring, skin cancer, chronic wounds, and infections." },
                            { type: 'question', text: "Curious if your product or ingredient can protect against UV-induced skin damage?" },
                            {
                                type: 'list', items: [
                                    "Cutting-Edge Technology: Our validated cell culture systems allow us to assess the protective effects of your products against UV-induced skin cell damage.",
                                    "Dose and Treatment Effects: Determine the optimal dosing and treatment time effects for maximum protection against UV exposure."
                                ]
                            },
                            { type: 'cta', text: "Contact us today to get started on your project!" }
                        ]
                    },
                    {
                        heading: "TEST PRODUCTS FOR SKIN HEALTH BENEFITS IN HUMAN CLINICAL TRIALS",
                        text: "Establish Skin Health Benefits of Your Products in Human Clinical Trials",
                        content: "Position your products as leaders in skin health, whether it is related to aging or any other skin damage. Whether your goal is to enhance skin hydration, reduce wrinkles, improve elasticity, or promote overall skin radiance, we provide the evidence you need. Our clinical trials demonstrate your products' efficacy in delivering visible and measurable skin benefits.",
                        bullets: [
                            "Test Skin Health Benefits: Evaluate if your products enhance skin hydration, reduce fine lines and wrinkles, and improve skin elasticity and radiance.",
                            "Assess Anti-Aging and Skin Repair: Determine if your ingredients support skin repair, protect against environmental damage, and combat signs of aging.",
                            "Utilize Specialized Skin Health Markers: Employ our targeted assays to assess a variety of ingredients, including nutraceuticals, botanicals, and peptides, for their impact on skin health.",
                            "Receive Comprehensive Reporting: Obtain detailed reports outlining the skin health benefits of your products, providing robust support for your marketing and regulatory requirements. Validate your products' skin health benefits through our expert clinical trials."
                        ],
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            },
            { type: 'paragraph', text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your product claims for brain health. Let us help you drive innovation and success in the competitive market. Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Brain Health',
        icon: BrainHealthIcon,
        color: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(96,165,250,0.4)]',
        description: 'Holistic assessment of neurological wellness, mental clarity, and neurotransmitter balance.',
        content: [
            { type: 'paragraph', text: "Maintaining brain health is crucial for overall well-being, and innovative solutions are essential to combat neurodegenerative diseases and cognitive decline. At MusB Research, we offer cutting-edge research services to substantiate your products' claims in improving brain health. Our advanced models and assays provide the insights needed to develop evidence-based products and achieve market dominance." },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "LEAKY BLOOD BRAIN BARRIERS",
                        text: "Establish the Potential of Your Products for Impacting Permeability to BBB",
                        content: "The blood-brain barrier (BBB) is essential for protecting the brain from harmful substances, but a leaky BBB can increase the risk of many brain-related diseases. Conversely, temporarily increasing BBB permeability can be beneficial for drug delivery to the brain, enabling treatments that would otherwise not cross the BBB.",
                        question: "Want to know if your products or ingredients impact BBB permeability?",
                        bullets: [
                            "Large Scale Screening: Our BBB endothelial cell assays can determine how your products or ingredients affect BBB permeability. This data is crucial for developing indications related to brain health and drug delivery systems.",
                            "Dose, Time Scales, and Toxicity Profiles: Our assays test various doses, treatment times, and other measures, including toxicity profiles, to better understand the effects of your compounds.",
                            "Detailed Reporting: Obtain comprehensive reports on the effects of your products on BBB permeability, substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "NEURODEGENERATION USING CELL CULTURE SYSTEM",
                        text: "Establish the Potential of Your Products for Neuroprotective and Neuromodulator Effects in Mammalian Cells",
                        content: "Neurodegenerative diseases such as Alzheimer’s, Parkinson’s, ALS, and others significantly impact human health. Understanding how your products or ingredients can prevent, or slow neurodegeneration is vital for developing effective treatments.",
                        question: "Want to know if your products or ingredients impact Neurodegeneration and Neuromodulation?",
                        bullets: [
                            "Large Scale Screening: Our neuronal cell assays can determine how your products or ingredients affect neurodegeneration process. This data can be crucial for developing indications related to brain health related Alzheimer’s disease, Parkinson, ALS and other neurodegenerative conditions.",
                            "Dose, Time Scales, and Toxicity Profiles: Our assays test various doses, treatment times, and other measures, including toxicity profiles, to better understand the effects of your compounds.",
                            "Neurotransmitter Production: Determine whether your products influence neurotransmitter production, which is essential for brain function and health.",
                            "Detailed Reporting: Obtain comprehensive reports on the protective effects of your products on neurodegeneration, substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "NEURODEGENERATION USING CELL CULTURE SYSTEM",
                        text: "Unlock the Potential of Your Compounds in Neuroprotection and Neuromodulation Using C. elegans",
                        content: "C. elegans is an excellent model for studying neurodegenerative diseases such as Alzheimer’s, Parkinson’s, ALS, and other neuronal health conditions. Understanding how your products or ingredients can prevent or slow neurodegeneration and modulate neuronal health, including neurotransmitter secretion and behavioral changes, is vital for developing effective treatments. C. elegans offers an economical and efficient way to conduct these studies.",
                        question: "Curious if your product impacts Neurodegeneration, Neuromodulation and Neuronal Behaviors?",
                        bullets: [
                            "Large Scale Screening: Our established C. elegans assays can evaluate how your products or ingredients affect neurodegeneration. This data is crucial for developing indications related to Alzheimer’s disease, Parkinson’s, ALS, and other neurodegenerative conditions.",
                            "Dose, Time Scales, and Toxicity Profiles: We test various doses, treatment times, and toxicity profiles to understand the full effects of your compounds.",
                            "Neurotransmitter Production: Assess whether your products influence neurotransmitter production, essential for brain function and health.",
                            "Behavioral Analyses: Determine how your products impact neuronal behaviors, including learning, memory, movement, smelling, and feeding.",
                            "Detailed Reporting: Receive comprehensive reports on the protective effects of your products on neurodegeneration, neuromodulation, and behavioral phenotypes, substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "TEST PRODUCTS FOR SKIN HEALTH BENEFITS IN HUMAN CLINICAL TRIALS",
                        text: "Establish Brain Health Benefits of Your Products in Human Clinical Trials",
                        content: "Position your products as leaders in brain health. Whether your focus is on neurotransmitter support, neural hormone regulation, stress reduction, anxiety management, or combating neurodegenerative disorders, we provide the scientific evidence you need. Our clinical trials demonstrate your products' efficacy in enhancing cognitive function, emotional well-being, and overall mental health.",
                        bullets: [
                            "Test Brain Health Benefits: Evaluate if your products support neurotransmitter levels, regulate neural hormones, and improve cognitive function.",
                            "Assess Stress and Anxiety Management: Determine if your ingredients help reduce stress, manage anxiety, and enhance emotional resilience.",
                            "Explore Neurodegenerative Disorder Support: Investigate if your products offer protective benefits against neurodegenerative disorders such as Alzheimer’s and Parkinson’s.",
                            "Utilize Specialized Brain Health Markers: Use our targeted assays to assess a range of ingredients, including nutraceuticals, botanicals, and neuropeptides, for their impact on brain health.",
                            "Receive Comprehensive Reporting: Obtain detailed reports outlining the cognitive and emotional benefits of your products, providing robust support for your marketing and regulatory needs. Validate your products' brain health benefits through our expert clinical trials."
                        ],
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            },
            { type: 'paragraph', text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your product claims for brain health. Let us help you drive innovation and success in the competitive market. Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Vascular Health',
        icon: VascularHealthIcon,
        color: 'text-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        description: 'Studying endothelial function, blood flow dynamics, and cardiovascular wellness markers.',
        content: [
            { type: 'paragraph', text: "At MusB Research, we offer state-of-the-art research services to validate your products' claims in improving vascular health, whether addressing leaky blood vessels, hypertension, high cholesterol, triglycerides, or the risk of cardiac dysfunctions. Our advanced assays and expertise provide the critical insights needed to develop scientifically-backed, effective solutions." },
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "TEST BENEFITS FOR LEAKY AND INFLAMMED VASCULAR",
                        text: "Unlock the Potential of Your Compounds In Impacting Vascular Health",
                        content: "Leaky blood vessels, caused by inflammation, infections, trauma, chronic diseases, cancer, medications, and nutritional deficiencies, can lead to a range of serious health issues including edema, tissue hypoxia, increased infection risk, organ dysfunction, systemic inflammation, poor wound healing, and fluid accumulation in body cavities. Maintaining vascular integrity is crucial to preventing these complications.Are you interested in discovering how your products can impact blood vessel permeability and, consequently, vascular health, including cardiovascular and brain functions?",
                        question: "Want to establish if your products benefit vascular health?",
                        bullets: [
                            "Large Scale Screening: Utilizing our sophisticated transwell assays with endothelial cell systems, we can determine how your products affect vascular permeability. This will provide valuable evidence on the impact of your products for cardiovascular health, stroke prevention, and various vasculature-related diseases.",
                            "Dose, Time Scales, and Toxicity Profiles: We test various doses, treatment times, and toxicity profiles to understand the full effects of your compounds.",
                            "Detailed Reporting: Receive comprehensive reports on the protective effects of your products on neurodegeneration, neuromodulation, and behavioral phenotypes, substantiating your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "CARDIOVASCULAR BENEFITS IN HUMAN CLINICAL TRIALS",
                        text: "Test Vascular Health Benefits of Your Products in Human Clinical Trials",
                        content: "Position your products as leaders in vascular health. Whether your focus is on managing cholesterol levels, lowering triglycerides, or improving overall vascular function, we provide the scientific evidence you need. Our clinical trials demonstrate your products' efficacy in promoting cardiovascular wellness and supporting healthy blood vessels.",
                        question: "Want to know if your products or ingredients impact Neurodegeneration and Neuromodulation?",
                        bullets: [
                            "Test Vascular Health Benefits: Evaluate if your products effectively manage cholesterol levels, reduce triglycerides, and enhance overall vascular health.",
                            "Assess Cardiovascular Support: Determine if your ingredients improve blood vessel function, support healthy circulation, and contribute to overall cardiovascular well-being.",
                            "Utilize Specialized Vascular Health Markers: Employ our targeted assays to assess a range of ingredients, including nutraceuticals and botanicals, for their impact on vascular health.",
                            "Receive Comprehensive Reporting: Obtain detailed reports outlining the vascular health benefits of your products, providing robust support for your marketing and regulatory needs. Validate your products' vascular health benefits through our expert clinical trials."
                        ],
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            },
            { type: 'paragraph', text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your product claims for brain health. Let us help you drive innovation and success in the competitive market. Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Toxicology',
        icon: ToxicologyIcon,
        color: 'text-indigo-400',
        glow: 'shadow-[0_0_15px_rgba(129,140,248,0.4)]',
        description: 'Rigorous safety assessments and toxicity profiling of ingredients and final formulations.',
        content: [
            { type: 'paragraph', text: "Develop Toxicological Profiles of Your Compounds to Support Regulatory, Safety and Efficacy" },
            { type: 'paragraph', text: "Toxicological studies are crucial for ensuring the safety of pharmacological and non-pharmacological products, including natural and dietary ingredients. At MusB, we provide comprehensive toxicological and safety assessments using simple, cost-effective, and rapid models such as cell culture and C. elegans. Our expertise helps you develop accurate doses, time points, and efficacy data to support your product claims." },
            { type: 'title', text: "Our Testing Services:" },
            { type: 'question', text: "Toxicology Screening Using Cell Culture" },
            {
                type: 'list', items: [
                    "Mammalian Cell Assays: Utilize our advanced cell culture systems with mammalian cells from various organs to evaluate the cellular toxicity of your products.",
                    "Assess Dose-Response Relationships: Determine the optimal dose for beneficial effects while minimizing cellular toxicity.",
                    "Organ-Specific Toxicity: Gain insights into how your products affect different organ cells, ensuring comprehensive safety evaluation."
                ]
            },
            { type: 'question', text: "Toxicology Screening Using C. elegans" },
            {
                type: 'list', items: [
                    "Whole-Organism Analysis: Benefit from using C. elegans as a model organism to evaluate the systemic toxicity of your products.",
                    "High-Throughput Screening: Rapidly assess the toxicity of various doses and treatment times in a whole-organism context.",
                    "Behavioral and Physiological Assessments: Evaluate the effects on behavior and physiology to understand the broader implications of toxicity.",
                    "Comprehensive Reporting: Obtain detailed reports on the toxicological effects of your products, aiding in substantiating your safety claims with robust scientific data.",
                    "Detailed Reporting: Receive comprehensive reports on the protective effects of your products on toxicity and efficacy doses and time points, substantiating your claims with robust scientific data.",
                    "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                ]
            },
            { type: 'cta', text: "Contact us today to get started on your project!" }
        ]
    },
    {
        label: 'Bioavailability',
        icon: BioavailabilityIcon,
        color: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(96,165,250,0.4)]',
        description: 'Measuring nutrient absorption, pharmacokinetics, and delivery efficiency of bioactive compounds.',
        content: [
            {
                type: 'dropdown',
                items: [
                    {
                        heading: "TEST BIOAVAILABILITY OF FUNCTIONAL MOLECULES IN YOUR PRODUCTS/ INGREDIENTS",
                        text: "Determine the Bioavailability of The Functional Molecule(s)",
                        content: "Understanding the bioavailability of functional molecules is key to ensuring their effectiveness. Using our state-of-the-art transwell cell culture assays, we offer comprehensive services to assess the permeability of your products from the gut to the bloodstream.",
                        question: "Curious about how your product's functional molecules are absorbed?",
                        bullets: [
                            "Large Scale Screening: Assess the permeability of your functional molecules across gut epithelial cells to understand absorption rates and potential bioavailability.",
                            "Evaluate Doses and Timelines: Gain insights into the optimal doses and treatment timelines for maximum absorption and effectiveness.",
                            "Toxicity Profiles: Ensure safety by evaluating the toxicity profiles of your functional molecules during permeability testing.",
                            "Comprehensive Analysis and Reporting: Obtain detailed reports on the bioavailability, dosing, timelines, and safety of your products, supporting your claims with robust scientific data.",
                            "Future Recommendations and Consulting: Get expert advice on further studies in animal models and humans to maximize your product’s market potential."
                        ],
                        cta: "Contact us today to get started on your project!"
                    },
                    {
                        heading: "TEST BENEFITS OF BOOSTING NUTRIENT ABSORPTION IN HUMAN CLINICAL TRIALS",
                        text: "Test Nutrient Absorption Benefits of Your Products in Human Clinical Trials",
                        content: "Position your products as leaders in improving nutrient absorption and overall health. Whether your goal is to enhance nutrient uptake from the gut, reduce deficiencies, or support general wellness, we provide the scientific validation you need. Our clinical trials demonstrate your products' efficacy in optimizing nutrient absorption and promoting comprehensive health.",
                        bullets: [
                            "Evaluate Nutrient Absorption: Test if your products enhance nutrient uptake from the gut, reducing deficiencies and supporting better overall health.",
                            "Assess Health Improvements: Determine if your ingredients contribute to improved digestion, better absorption of essential vitamins and minerals, and overall enhanced well-being.",
                            "Utilize Specialized Nutrient Absorption Markers: Use our targeted assays to evaluate a range of ingredients, including probiotics, prebiotics, and functional foods, for their impact on nutrient absorption.",
                            "Receive Detailed Reporting: Obtain comprehensive reports detailing the benefits of your products in improving nutrient absorption, providing robust support for your marketing and regulatory needs."
                        ],
                        closing: "Validate your products' benefits in nutrient absorption through our expert clinical trials.",
                        cta: "Contact us today to get started on your project!"
                    }
                ]
            },
            {
                type: 'paragraph',
                text: "At MusB Research, we are dedicated to providing you with the scientific evidence needed to substantiate your product claims for brain health. Let us help you drive innovation and success in the competitive market. Contact us today to get started on your project!"
            }
        ]
    },
];

const FACILITIES_DATA = [
    { id: 1, name: 'Multidisciplinary Clinical Research Site', description: 'State-of-the-art facility equipped for diverse therapeutic studies.', features: ['Consultation Rooms', 'Locked Storage', 'Reception Area'] },
    { id: 2, name: 'Participant-Friendly Clinics', description: 'Designed for comfort and efficiency during research visits.', features: ['Private Bays', 'Waiting Lounge', 'Accessible Facilities'] },
    { id: 3, name: 'Central Laboratory & Biorepository', description: 'Secure on-site storage and advanced sample processing capabilities.', features: ['-80°C Freezers', 'Centrifuges', 'Cryogenic Storage'] },
    { id: 4, name: 'Sample Processing & Secure IT Systems', description: 'HIPAA-compliant, high-security infrastructure for data management.', features: ['Encrypted Servers', '24/7 Monitoring', 'Redundant Backups'] },
    { id: 5, name: 'Mobile Clinic & Phlebotomy Services', description: 'Bringing research to the community with mobile phlebotomy units.', features: ['On-site Collection', 'Remote Monitoring', 'Outreach Kits'] },
    { id: 6, name: 'Anaerobic Chambers', description: 'Precision measurement of energy expenditure and metabolic rates.', features: ['Gas Analysis', 'Controlled Environment', 'Real-time Tracking'] }
];

const CERTIFICATIONS_DATA = [
    { id: 1, label: 'IRB-approved studies' },
    { id: 2, label: 'GCP-trained staff' },
    { id: 3, label: 'HIPAA-compliant systems' },
    { id: 4, label: 'CLIA & COLA APPROVED LABORATORY' },
    { id: 5, label: 'SOP-driven operations' },
    { id: 6, label: 'ISO Certification' },
    { id: 7, label: 'GLP Certification' }
];

const PARTNERS_ROW_1 = [
    { id: 1, name: 'UNILEVER' },
    { id: 2, name: 'SYNBIOTIC HEALTH' },
    { id: 3, name: 'VIDYA HERBS' },
    { id: 4, name: 'BIOVA' },
    { id: 5, name: 'INDIA GLYCOL LTD' },
    { id: 6, name: 'APT TESTING AND RESEARCH PVT. LTD.' }
];

const PARTNERS_ROW_2 = [
    { id: 7, name: 'CROISSANCE CLINICAL RESEARCH' },
    { id: 8, name: 'CLINTEK' },
    { id: 9, name: 'ZEDA AI' },
    { id: 10, name: 'EXCEL IMAGING CENER' },
    { id: 11, name: 'Bay Area Gastroenterology Associates LLC' }
];

const ServiceCard = ({ icon: Icon, title, whoItsFor, whatWeDeliver, footerText, linkTo, linkText, accentColor }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`group relative bg-white/5 backdrop-blur-xl rounded-[4rem] p-8 md:p-12 border border-white/5 hover:bg-white/10 hover:border-${accentColor}-500/30 transition-all duration-700 flex flex-col`}>
            <div className={`w-20 h-20 mb-10 rounded-3xl bg-${accentColor}-500/10 flex items-center justify-center text-${accentColor}-400 group-hover:bg-${accentColor}-500 group-hover:text-slate-900 transition-all duration-500 shadow-xl`}>
                <Icon className="w-10 h-10" />
            </div>
            <h3 className={`text-3xl font-black text-white mb-8 group-hover:text-${accentColor}-400 transition-colors uppercase tracking-tight min-h-[80px]`}>{title}</h3>

            <div className="space-y-6 flex-grow">
                <div className="min-h-[100px]">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Who it's for:</h4>
                    <p className="text-slate-300 font-bold leading-relaxed">{whoItsFor}</p>
                </div>

                <div className={`transition-all duration-700 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">What we deliver:</h4>
                            <ul className="space-y-4">
                                {whatWeDeliver.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${accentColor}-400 mt-2 shadow-[0_0_8px_rgba(34,211,238,0.6)]`}></div>
                                        <span className="text-slate-400 text-base font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={`p-6 rounded-2xl bg-${accentColor}-400/5 border border-${accentColor}-400/10`}>
                            <p className={`text-sm text-${accentColor}-200/80 leading-relaxed italic`}>
                                {footerText}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`mt-4 text-${accentColor}-400 hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors`}
                >
                    {isExpanded ? 'View Less' : 'View More'}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <Link to={linkTo} className={`mt-12 w-full bg-${accentColor}-500 text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 group/btn`}>
                {linkText}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
};


export default function Home() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedExpertise, setSelectedExpertise] = useState<any>(null);
    const [activeAccordionIndex, setActiveAccordionIndex] = useState<number | null>(0);

    const activeSlides = slides;



    // Defensive: reset index if slides count changes or if it goes out of bounds
    useEffect(() => {
        if (currentSlide >= activeSlides.length) {
            setCurrentSlide(0);
        }
    }, [activeSlides.length, currentSlide]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 8000);
        return () => clearInterval(timer);
    }, [activeSlides.length]); // Reset timer if slides count changes

    return (
        <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden bg-transparent">

            {/* Slider Container */}
            <div className="relative h-auto md:h-[95vh] min-h-[600px] md:min-h-[800px] w-full flex items-center overflow-hidden bg-transparent z-10">

                {/* Global Background Effect */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]"></div>

                    {/* Slides Layer */}
                    <div className="relative w-full h-full flex items-center">
                        {activeSlides.map((slide: any, index: number) => {
                            const isActive = index === currentSlide;
                            return (
                                <div
                                    key={slide.id}
                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                        }`}
                                >
                                    {/* Background Image with Overlay */}
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src={slide.image}
                                            alt=""
                                            loading="lazy"
                                            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}
                                        />
                                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80"></div>
                                    </div>

                                    <div className={`relative z-10 h-full max-w-[1800px] mx-auto px-6 md:px-12 w-full flex flex-col items-center justify-start lg:justify-center pt-36 pb-32 md:pt-32 md:pb-12 transform transition-all duration-1000 ${isActive ? 'scale-100 -translate-y-8 md:-translate-y-12' : 'scale-95 translate-y-12'}`}>



                                        {/* Content (Centered) */}
                                        <div className="space-y-12 flex flex-col items-center text-center">
                                            <div className="space-y-6 md:space-y-8 max-w-5xl relative">
                                                <div className="animate-fade-in-up">
                                                    <span className="text-[11px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.6em] text-white whitespace-normal md:whitespace-nowrap block md:inline-block px-4 md:px-0">
                                                        Bench to Bedside. Discovery to Validation.
                                                    </span>

                                                </div>
                                                <h1 className="text-2xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.2] md:leading-[1.05] tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-fade-in-up whitespace-pre-line px-4 break-words">

                                                    {slide.headline}
                                                </h1>
                                                <div className="flex justify-center w-full px-6">
                                                    <ul className="list-none m-0 p-0 text-left animate-fade-in-up stagger-1 space-y-4">
                                                        {slide.subtext.map((line: string, i: number) => (
                                                            <li key={i} className="flex items-start justify-start gap-4 group">
                                                                <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 group-hover:scale-150 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,1)] mt-2"></div>
                                                                <p className="text-slate-100 text-[13px] md:text-base lg:text-lg font-medium leading-relaxed max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:text-white transition-colors">
                                                                    {line}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 md:gap-6 animate-fade-in-up stagger-2 w-full px-6">
                                                <Link
                                                    to="/trials"
                                                    className="w-full sm:w-auto bg-cyan-500 text-slate-900 px-6 md:px-8 py-4 md:py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-2 transition-all shadow-[0_20px_50px_-10px_rgba(6,182,212,0.6)] flex items-center justify-center gap-3 group"
                                                >
                                                    {slide.primaryCTA}
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                                </Link>
                                                <Link
                                                    to="/contact"
                                                    className="w-full sm:w-auto bg-white/5 border-2 border-white/20 text-white px-6 md:px-8 py-4 md:py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 hover:-translate-y-2 transition-all backdrop-blur-xl group overflow-hidden relative flex items-center justify-center"
                                                >
                                                    <span className="relative z-10">{slide.secondaryCTA}</span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                                </Link>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Slider Navigation */}
                    {/* Slider Navigation */}
                    <button onClick={prevSlide} className="hidden md:flex absolute left-8 top-[60%] -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-cyan-500 hover:text-slate-900 transition-all shadow-2xl group"><ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" /></button>
                    <button onClick={nextSlide} className="hidden md:flex absolute right-8 top-[60%] -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-cyan-500 hover:text-slate-900 transition-all shadow-2xl group"><ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" /></button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-6">
                        <div className="flex gap-4 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                            {activeSlides.map((_: any, i: number) => (
                                <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-8 bg-cyan-400' : 'w-2 bg-white/20 hover:bg-white/40'}`} />
                            ))}
                        </div>

                        {/* Scroll Down Indicator */}
                        <div className="flex flex-col items-center gap-2 opacity-40 animate-float">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Scroll</span>
                            <div className="w-0.5 h-8 md:h-12 bg-gradient-to-b from-cyan-400 to-transparent"></div>
                        </div>


                    </div>
                </div>
            </div>

            {/* Find a Clinical Study Section */}
            <StudyFilterSection />

            {/* Section 3: Three Ways We Support You */}
            {
                (
                    <div className="py-12 relative z-10" id="services">
                        <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                            <div className="text-center space-y-8 mb-24 max-w-7xl mx-auto">
                                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                                    Three Ways MusB™ Research Supports Your Program
                                </h2>
                                <p className="text-lg md:text-xl lg:text-2xl text-slate-400 font-medium leading-relaxed">
                                    Whether you need discovery research, laboratory testing, <br className="hidden md:block" />
                                    or long-term biospecimen management, MusB™ Research offers flexible, integrated support tailored to your goals.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                                {/* 1. Research & Innovation */}
                                <ServiceCard
                                    icon={FlaskConical}
                                    title="Research & Innovation"
                                    whoItsFor="Biotech, nutrition, pharma, ingredient, and wellness companies seeking scientific validation."
                                    whatWeDeliver={[
                                        'Preclinical screening and mechanistic studies',
                                        'In vitro, C. elegans, and animal models',
                                        'Human clinical trials and translational research',
                                        'Biomarkers, microbiome, and functional outcomes'
                                    ]}
                                    footerText="We turn scientific concepts into credible evidence that informs product development, claims, and commercialization."
                                    linkTo="/contact?type=research"
                                    linkText="Discuss a Research Project"
                                    accentColor="cyan"
                                />

                                {/* 2. Central Laboratory Services */}
                                <ServiceCard
                                    icon={Microscope}
                                    title="Central Laboratory Services"
                                    whoItsFor="Sponsors needing reliable, compliant testing to support research and clinical studies."
                                    whatWeDeliver={[
                                        'Clinical and research biomarker testing',
                                        'ELISA, proteomics, real-time PCR',
                                        'Microbiome and molecular analysis',
                                        'SOP-driven workflows with sponsor-ready reporting'
                                    ]}
                                    footerText="Our central lab services ensure accuracy, reproducibility, and data integrity across preclinical and clinical programs."
                                    linkTo="/contact?type=lab"
                                    linkText="Request Laboratory Services"
                                    accentColor="indigo"
                                />

                                {/* 3. Biorepository */}
                                <ServiceCard
                                    icon={Database}
                                    title="Biorepository"
                                    whoItsFor="Organizations managing biological samples across studies, sites, or timepoints."
                                    whatWeDeliver={[
                                        'Sample processing, labeling, and tracking',
                                        'Secure, long-term storage under controlled conditions',
                                        'Support for longitudinal and multi-omics studies',
                                        'Retrieval and chain-of-custody documentation'
                                    ]}
                                    footerText="Our biorepository protects the long-term value of your samples and supports future discovery and regulatory needs."
                                    linkTo="/contact?type=biorepository"
                                    linkText="Explore Biorepository Support"
                                    accentColor="blue"
                                />
                            </div>
                        </div>
                    </div>
                )}

            {/* Why Choose MusB™ Research Section */}
            {
                (
                    <div className="pt-20 pb-8 relative z-10 overflow-hidden" id="why-choose-us">
                        {/* Background Glows */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full"></div>
                            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full" style={{ animationDelay: '-2s' }}></div>
                        </div>

                        <div className="max-w-[1700px] mx-auto px-6 md:px-12 relative z-10">
                            <div className="grid lg:grid-cols-2 gap-16 items-center">
                                <div className="space-y-8 animate-fade-in-up">
                                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold text-xs tracking-widest uppercase">
                                        <Microscope className="w-4 h-4" /> Scientist-Led Growth
                                    </div>
                                    <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] uppercase">
                                        WHY CHOOSE <span className="text-cyan-400">MUSB™ RESEARCH</span>
                                    </h2>
                                    <div className="space-y-6 pt-4">
                                        {[
                                            'Multidisciplinary clinical and preclinical expertise',
                                            'Academia-affiliated scientists and clinicians',
                                            'Integrated research, lab, and biorepository services',
                                            'End-to-end support from discovery to validation',
                                            'Ethical, community-focused research practices'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-300">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                                <span className="text-lg text-slate-200 font-bold group-hover:text-white transition-colors">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 pt-4">
                                        <Link
                                            to="/contact"
                                            className="bg-cyan-500 text-slate-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wide hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-cyan-500/20 inline-flex items-center justify-center gap-2"
                                        >
                                            Start the Conversation
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                        <Link
                                            to="/capabilities"
                                            className="bg-white/5 text-white border border-white/10 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white/10 hover:-translate-y-1 transition-all inline-flex items-center justify-center gap-2"
                                        >
                                            Explore Our Capabilities
                                        </Link>
                                    </div>
                                </div>
                                <div className="relative animate-fade-in-up stagger-1">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 rounded-[4rem] blur-[80px]"></div>
                                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[4rem] p-4 overflow-hidden shadow-2xl group">
                                        <div className="w-full h-[500px] rounded-[3.5rem] bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:scale-105 transition-transform duration-700"></div>
                                        <div className="absolute inset-x-8 bottom-8 p-10 rounded-3xl bg-slate-950/80 backdrop-blur-md border border-white/10 space-y-3">
                                            <h4 className="text-white font-black text-xl uppercase tracking-wider">Mission-Driven Innovation</h4>
                                            <p className="text-slate-400 text-lg font-medium">Empowering brands with credible scientific substantiation.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                )}

            {/* Section 04: Expertise Snapshot */}
            {(
                <div className="pt-8 pb-4 relative z-10" id="expertise">
                    <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                        <div className="text-center space-y-8 mb-20 max-w-5xl mx-auto">
                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-black text-sm md:text-base uppercase tracking-[0.3em] animate-fade-in-up mb-4">
                                <Microscope className="w-5 h-5 md:w-6 md:h-6" />
                                Science Credibility
                            </div>
                            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight uppercase animate-fade-in-up stagger-1">
                                Our Expertise Lies In
                            </h2>
                            <p className="text-lg md:text-2xl text-slate-400 font-medium leading-relaxed animate-fade-in-up stagger-2">
                                Our team includes leading experts across multiple health disciplines to deliver rigorous, innovative, and decision-driving research.
                            </p>
                        </div>

                        {/* Enhanced Grid Container */}
                        <div className="relative group/container">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8 relative z-10">
                                {EXPERTISE_DATA.map((item: any, idx: number) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSelectedExpertise(item);
                                                setActiveAccordionIndex(0);
                                            }}
                                            className={`group p-6 md:p-8 rounded-[2rem] bg-slate-950/40 border border-white/5 hover:bg-white/10 hover:border-${item.color.split('-')[1]}-500/30 transition-all duration-500 flex flex-col items-center text-center gap-6 animate-fade-in-up stagger-${(idx % 5) + 1} hover:-translate-y-2 cursor-pointer relative overflow-hidden`}
                                        >
                                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Zap className="w-3 h-3 text-cyan-400" />
                                            </div>
                                            <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-500 ${item.glow}`}>
                                                <IconComponent className="w-8 h-8" />
                                            </div>
                                            <span className="text-sm md:text-base font-black text-slate-200 group-hover:text-white transition-colors uppercase tracking-wider leading-tight">
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center mt-20 animate-fade-in-up stagger-3">
                                <Link
                                    to="/contact"
                                    className="px-6 py-3 md:px-8 md:py-4 bg-cyan-500 text-slate-900 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-white hover:-translate-y-2 transition-all shadow-[0_20px_50px_-10px_rgba(6,182,212,0.5)] inline-flex items-center justify-center gap-3 group"
                                >
                                    Start the Conversation
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section 05: Facilities & Infrastructure */}
            {(
                <div className="pt-4 pb-16 relative z-10" id="facilities">
                    <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                        <div className="grid lg:grid-cols-2 gap-32 items-center">
                            <div className="space-y-16">
                                <div className="space-y-8">
                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">Facilities & Infrastructure</h2>
                                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                        Purpose-built facilities designed to support high-quality research, testing, and participant engagement.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {FACILITIES_DATA.map((fac: any, idx: number) => (
                                        <div key={fac.id} className={`flex gap-5 group animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                                            <div className="w-10 h-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-300">
                                                {fac.name.includes('Site') ? <Building2 className="w-5 h-5" /> :
                                                    fac.name.includes('Clinics') ? <Stethoscope className="w-5 h-5" /> :
                                                        fac.name.includes('Biorepository') ? <Database className="w-5 h-5" /> :
                                                            fac.name.includes('Sample') ? <FlaskConical className="w-5 h-5" /> :
                                                                fac.name.includes('Data') ? <ShieldCheck className="w-5 h-5" /> :
                                                                    fac.name.includes('Mobile') ? <Smartphone className="w-5 h-5" /> :
                                                                        <Activity className="w-5 h-5" />}
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-white font-black group-hover:text-cyan-400 transition-colors uppercase text-lg md:text-xl tracking-tight leading-tight">{fac.name}</h4>
                                                <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">{fac.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Link to="/facilities" className="bg-white/5 text-white px-8 py-5 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">View Our Facilities</Link>
                                    <Link to="/contact" className="bg-cyan-400 text-slate-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wide hover:bg-white transition-all">Start the Conversation</Link>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-3xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                <div className="relative aspect-square rounded-[4rem] bg-indigo-500/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 group-hover:scale-110 transition-transform duration-1000"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                                    <div className="absolute bottom-12 left-12 right-12 p-8 glass-dark rounded-3xl border border-white/10 backdrop-blur-md">
                                        <p className="text-slate-300 italic text-sm">"Our facility is more than just a lab; it's a hub of clinical innovation designed with participant care at its core."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Section 06: Certifications & Compliance */}
            {(
                <div className="py-24 relative z-10 bg-slate-900/40 border-y border-white/5 overflow-hidden" id="certifications">
                    <div className="max-w-[1700px] mx-auto px-6 md:px-12 mb-20">
                        <div className="text-center space-y-6 animate-fade-in-up">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Certifications & <span className="text-cyan-400">Compliance</span></h2>
                            <div className="h-1.5 w-24 bg-cyan-500 mx-auto rounded-full"></div>
                            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
                                IRB-approved studies • GCP-trained staff • HIPAA-compliant systems <br />
                                CLIA & COLA APPROVED LABORATORY • SOP-driven operations <br />
                                ISO and GLP-aligned practices
                            </p>
                        </div>
                    </div>

                    {/* Left to Right Scrolling Marquee (Reverse of Partners) */}
                    <div className="relative flex overflow-x-hidden mask-fade-edges py-12">
                        <div className="animate-marquee-reverse whitespace-nowrap flex items-center gap-24 pr-24">
                            {[...CERTIFICATIONS_DATA, ...CERTIFICATIONS_DATA].map((cert: any, idx: number) => (
                                <div key={`${cert.id}-${idx}`} className="flex flex-col items-center gap-4 group min-w-[200px]">
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-500 shadow-xl">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors text-center px-2 leading-tight">{cert.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="absolute top-0 py-12 animate-marquee2-reverse whitespace-nowrap flex items-center gap-24 pr-24">
                            {[...CERTIFICATIONS_DATA, ...CERTIFICATIONS_DATA].map((cert: any, idx: number) => (
                                <div key={`${cert.id}-repeat-${idx}`} className="flex flex-col items-center gap-4 group min-w-[200px]">
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-500 shadow-xl">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors text-center px-2 leading-tight">{cert.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
            }

            {/* Section 07: Collaborations & Partners */}
            {(
                <div className="py-24 relative z-10 overflow-hidden" id="partners">
                    <div className="max-w-[1700px] mx-auto px-6 md:px-12 mb-20">
                        <div className="text-center space-y-4 animate-fade-in-up">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight uppercase">Collaborations & Partners</h2>
                            <div className="h-1 w-32 bg-indigo-500 mx-auto rounded-full"></div>
                        </div>
                    </div>

                    {/* First Line: Right to Left */}
                    <div className="relative flex overflow-x-hidden mask-fade-edges py-4">
                        <div className="animate-marquee whitespace-nowrap flex items-center gap-32 pr-32">
                            {[...PARTNERS_ROW_1, ...PARTNERS_ROW_1].map((partner: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700 cursor-default group scale-90 hover:scale-100">
                                    <span className="text-xl md:text-3xl font-black text-white tracking-widest uppercase italic">{partner.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="absolute top-0 py-4 animate-marquee2 whitespace-nowrap flex items-center gap-32 pr-32">
                            {[...PARTNERS_ROW_1, ...PARTNERS_ROW_1].map((partner: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700 cursor-default group scale-90 hover:scale-100">
                                    <span className="text-xl md:text-3xl font-black text-white tracking-widest uppercase italic">{partner.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Second Line: Left to Right */}
                    <div className="relative flex overflow-x-hidden mask-fade-edges py-4">
                        <div className="animate-marquee-reverse whitespace-nowrap flex items-center gap-32 pr-32">
                            {[...PARTNERS_ROW_2, ...PARTNERS_ROW_2].map((partner: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700 cursor-default group scale-90 hover:scale-100">
                                    <span className="text-xl md:text-3xl font-black text-white tracking-widest uppercase italic">{partner.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="absolute top-0 py-4 animate-marquee2-reverse whitespace-nowrap flex items-center gap-32 pr-32">
                            {[...PARTNERS_ROW_2, ...PARTNERS_ROW_2].map((partner: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700 cursor-default group scale-90 hover:scale-100">
                                    <span className="text-xl md:text-3xl font-black text-white tracking-widest uppercase italic">{partner.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
            }

            {/* Section 08: Dual Call to Action */}
            {(
                <div className="py-12 relative z-10">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 md:p-14 rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-transparent border border-white/5 backdrop-blur-3xl space-y-8 group hover:border-cyan-500/30 transition-all duration-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full group-hover:bg-cyan-500/10 transition-colors"></div>
                                <span className="text-cyan-400 font-black text-sm uppercase tracking-[0.6em] block animate-fade-in-up">Participants</span>
                                <div className="space-y-4 animate-fade-in-up stagger-1">
                                    <h3 className="text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tighter">Interested in a study?</h3>
                                    <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">Get paid. Get tested. <br />Contribute to science.</p>
                                </div>
                                <div className="flex flex-wrap gap-4 pt-4 animate-fade-in-up stagger-2">
                                    <Link to="/trials" className="bg-cyan-500 text-slate-900 px-14 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-white hover:-translate-y-2 transition-all shadow-xl">Join Research</Link>
                                </div>
                            </div>

                            <div className="p-8 md:p-14 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-transparent border border-white/5 backdrop-blur-3xl space-y-8 group hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
                                <span className="text-indigo-400 font-black text-sm uppercase tracking-[0.6em] block animate-fade-in-up">Sponsors</span>
                                <div className="space-y-4 animate-fade-in-up stagger-1">
                                    <h3 className="text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tighter">Need high-quality research, <br />testing, or biorepository support?</h3>
                                </div>
                                <div className="pt-6 animate-fade-in-up stagger-2">
                                    <Link to="/contact" className="bg-white text-slate-900 px-14 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-cyan-500 hover:-translate-y-2 transition-all shadow-xl inline-block">Start a Project</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Section 09: Closing Statement */}
            <div className="pt-20 pb-10 relative z-10 overflow-hidden" id="closing">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-cyan-500/5 blur-[180px] rounded-full pointer-events-none"></div>
                <div className="max-w-[1400px] mx-auto px-6 text-center space-y-16 relative">
                    <div className="space-y-8 animate-fade-in-up">
                        <p className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter">
                            Choosing MusB™ Research means partnering with a leader <br />
                            in scientific innovation, flexibility, and <span className="text-cyan-400">execution excellence.</span>
                        </p>
                        <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
                            We deliver tailored, responsive, and cost-effective solutions—without compromising scientific rigor.
                        </p>
                    </div>

                    <div className="h-px w-48 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto animate-fade-in-up stagger-1"></div>

                    <div className="space-y-8 animate-fade-in-up stagger-2">
                        <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                            Join MusB™ Research and be part <br />of the future of health science.
                        </h3>
                        <p className="text-2xl md:text-3xl font-black text-cyan-400 uppercase tracking-[0.5em]">
                            Together, we can make a difference.
                        </p>
                    </div>
                </div>
            </div>


            {/* Expertise Detail Modal */}
            {selectedExpertise && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => {
                            setSelectedExpertise(null);
                            setActiveAccordionIndex(null);
                        }}
                    ></div>
                    <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header Decoration */}
                        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-${selectedExpertise.color.split('-')[1]}-500 to-transparent opacity-50 z-20`}></div>

                        {/* Modal Header */}
                        <div className="p-8 md:p-12 pb-4 md:pb-6 flex-shrink-0 relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 flex items-center justify-center ${selectedExpertise.color} ${selectedExpertise.glow}`}>
                                        <selectedExpertise.icon className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
                                            {selectedExpertise.label}
                                        </h3>
                                        <div className="h-1 w-16 md:w-20 bg-cyan-500 rounded-full"></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedExpertise(null);
                                        setActiveAccordionIndex(null);
                                    }}
                                    className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-2 space-y-8 custom-scrollbar">
                            {selectedExpertise.content ? (
                                <div className="space-y-6">
                                    {selectedExpertise.content.map((item: any, i: number) => {
                                        const renderContentItem = (item: any, i: number) => {
                                            switch (item.type) {
                                                case 'title':
                                                    return (
                                                        <h4 key={i} className="text-white font-black text-2xl md:text-3xl border-b border-white/10 pb-4 mt-8 first:mt-0">
                                                            {item.text}
                                                        </h4>
                                                    );
                                                case 'paragraph':
                                                    return (
                                                        <p key={i} className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                                                            {item.text}
                                                        </p>
                                                    );
                                                case 'question':
                                                    return (
                                                        <p key={i} className="text-lg md:text-xl text-white font-black leading-relaxed">
                                                            {item.text}
                                                        </p>
                                                    );
                                                case 'list':
                                                    return (
                                                        <ul key={i} className="grid grid-cols-1 gap-4 pt-2">
                                                            {item.items.map((bullet: string, j: number) => {
                                                                const hasColon = bullet.includes(':');
                                                                const [title, ...rest] = bullet.split(':');
                                                                const text = rest.join(':');
                                                                return (
                                                                    <li key={j} className="flex items-start gap-3">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 shadow-[0_0_8px_rgba(34,211,238,0.6)] flex-shrink-0"></div>
                                                                        <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed">
                                                                            {hasColon ? (
                                                                                <>
                                                                                    <span className="text-white font-bold">{title}:</span>{text}
                                                                                </>
                                                                            ) : bullet}
                                                                        </p>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    );
                                                case 'dropdown':
                                                    return (
                                                        <div key={i} className="space-y-4 pt-2">
                                                            {item.items.map((dropItem: any, idx: number) => (
                                                                <div key={idx} className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/2">
                                                                    <button
                                                                        onClick={() => setActiveAccordionIndex(activeAccordionIndex === idx ? null : idx)}
                                                                        className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-white/5 transition-all text-left"
                                                                    >
                                                                        <span className="text-white font-black text-lg md:text-xl uppercase tracking-tight">{dropItem.heading}</span>
                                                                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-transform duration-500 ${activeAccordionIndex === idx ? 'rotate-180 bg-cyan-500/20 text-cyan-400' : 'text-slate-500'}`}>
                                                                            <ChevronDown className="w-5 h-5" />
                                                                        </div>
                                                                    </button>
                                                                    <div className={`transition-all duration-500 ease-in-out ${activeAccordionIndex === idx ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                                                        <div className="p-8 md:p-10 pt-0 space-y-6 border-t border-white/5 bg-slate-900/40">
                                                                            {dropItem.text && (
                                                                                <p className="text-white font-black text-xl md:text-2xl leading-tight">
                                                                                    {dropItem.text}
                                                                                </p>
                                                                            )}
                                                                            {dropItem.content && (
                                                                                <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
                                                                                    {dropItem.content}
                                                                                </p>
                                                                            )}
                                                                            {dropItem.question && (
                                                                                <p className="text-white font-black text-lg md:text-xl leading-relaxed">
                                                                                    {dropItem.question}
                                                                                </p>
                                                                            )}
                                                                            {dropItem.bullets && (
                                                                                <ul key="bullets" className="grid grid-cols-1 gap-4 pt-2">
                                                                                    {dropItem.bullets.map((bullet: string, j: number) => {
                                                                                        const hasColon = bullet.includes(':');
                                                                                        const [title, ...rest] = bullet.split(':');
                                                                                        const text = rest.join(':');
                                                                                        return (
                                                                                            <li key={j} className="flex items-start gap-4">
                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 shadow-[0_0_8px_rgba(34,211,238,0.6)] flex-shrink-0"></div>
                                                                                                <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed">
                                                                                                    {hasColon ? (
                                                                                                        <>
                                                                                                            <span className="text-white font-bold">{title}:</span>{text}
                                                                                                        </>
                                                                                                    ) : bullet}
                                                                                                </p>
                                                                                            </li>
                                                                                        );
                                                                                    })}
                                                                                </ul>
                                                                            )}
                                                                            {dropItem.sections && dropItem.sections.map((section: any, sIdx: number) => (
                                                                                <div key={sIdx} className="space-y-4">
                                                                                    {renderContentItem(section, sIdx)}
                                                                                </div>
                                                                            ))}
                                                                            {dropItem.closing && (
                                                                                <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 italic">
                                                                                    <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                                                                                        {dropItem.closing}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                            {dropItem.cta && (
                                                                                <p className="text-lg md:text-xl text-cyan-400 font-black leading-relaxed">
                                                                                    {dropItem.cta}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                case 'columns':
                                                    return (
                                                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                                            {item.columns.map((column: any, colIdx: number) => (
                                                                <ul key={colIdx} className="space-y-4">
                                                                    {column.items.map((bullet: string, j: number) => (
                                                                        <li key={j} className="flex items-start gap-3">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 shadow-[0_0_8px_rgba(34,211,238,0.6)] flex-shrink-0"></div>
                                                                            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed">
                                                                                {bullet}
                                                                            </p>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ))}
                                                        </div>
                                                    );
                                                case 'closing':
                                                    return (
                                                        <div key={i} className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 italic">
                                                            <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                                                                {item.text}
                                                            </p>
                                                        </div>
                                                    );
                                                case 'cta':
                                                    return (
                                                        <p key={i} className="text-lg md:text-xl text-cyan-400 font-black leading-relaxed">
                                                            {item.text}
                                                        </p>
                                                    );
                                                default:
                                                    return null;
                                            }
                                        };
                                        return renderContentItem(item, i);
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                                        {selectedExpertise.description}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Focus Area</div>
                                            <div className="text-white font-bold">Clinical & Translational Research</div>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Methodology</div>
                                            <div className="text-white font-bold">Evidence-Based Validation</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Buttons */}
                        <div className="p-8 md:p-12 pt-4 md:pt-6 flex-shrink-0 relative z-10 border-t border-white/5 bg-slate-900">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/contact?type=research"
                                    onClick={() => setSelectedExpertise(null)}
                                    className="flex-1 bg-cyan-500 text-slate-900 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all text-center shadow-lg shadow-cyan-500/20"
                                >
                                    Discuss Research
                                </Link>
                                <button
                                    onClick={() => setSelectedExpertise(null)}
                                    className="flex-1 bg-white/5 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
