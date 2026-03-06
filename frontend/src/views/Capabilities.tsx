import React from 'react';
import {
  Activity,
  TestTube,
  Microscope,
  Leaf,
  Brain,
  Flower,
  ShieldCheck,
  Zap,
  Beaker,
  BarChart,
  FileText,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';


const CAPABILITIES_DATA = [
  { id: 1, title: 'Clinical Trials', description: 'Phase I–IV trials, including natural products and medical devices.', icon: 'activity' },
  { id: 2, title: 'Preclinical Research', description: 'In-depth in vitro and animal models for translational research.', icon: 'test-tube' },
  { id: 3, title: 'Microbiome, Biotics & Omics', description: 'Advanced analysis of microbial ecosystems and multi-omics data.', icon: 'microscope' },
  { id: 4, title: 'Nutrition & Natural Products', description: 'Efficacy and safety studies for dietary supplements and functional foods.', icon: 'leaf' },
  { id: 5, title: 'Aging, Metabolic & Brain Health', description: 'Focusing on musculoskeletal aging, brain health, and metabolic disorders.', icon: 'brain' },
  { id: 6, title: 'Leaky Gut, Inflammation, Skin & Women\'s Health', description: 'Specialized research in skin health, inflammation, and women-specific conditions.', icon: 'flower' },
  { id: 7, title: 'Immunomodulatory Research', description: 'Studying immune system responses and therapeutic interventions.', icon: 'shield-check' },
  { id: 8, title: 'Muscle, Gut, Skin & Vascular Health', description: 'Analysis of cardiovascular fitness and skeletal muscle performance.', icon: 'zap' },
  { id: 9, title: 'Toxicology & Bioavailability', description: 'Safety profiling and assessment of compound absorption rates.', icon: 'beaker' },
  { id: 10, title: 'Biostatistics & Data Science', description: 'Complex data analysis and robust statistical modeling workflows.', icon: 'bar-chart' },
  { id: 11, title: 'Regulatory Compliance Support', description: 'End-to-end guidance for FDA, FTC, and international compliance.', icon: 'file-text' }
];

const Capabilities: React.FC = () => {
  const capabilities = CAPABILITIES_DATA;
  return (
    <div className="min-h-screen font-sans text-slate-200 relative overflow-x-hidden">
      {/* Atmospheric Background Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 space-y-32 pt-40 pb-24 animate-in fade-in duration-1000">
        {/* Header */}
        <section className="relative text-center max-w-4xl mx-auto space-y-8 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none"></div>
          <div className="relative z-10">
            <span className="text-cyan-400 font-black text-xs uppercase tracking-[0.4em]">Expert Expertise</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.9] uppercase italic">
              Our <span className="text-cyan-400">Capabilities</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
              From preclinical modeling to high-complexity Phase IV human trials, MusB™ Research provides the expertise and infrastructure to accelerate your project.
            </p>
          </div>
        </section>

        {/* Grid Section with Outline */}
        <section className="max-w-[1700px] mx-auto px-6 md:px-12">
          <div className="p-6 md:p-16 rounded-[4.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl relative overflow-hidden group/container">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {capabilities.map((cap: any) => {
                const IconMap: Record<string, any> = {
                  activity: Activity,
                  'test-tube': TestTube,
                  microscope: Microscope,
                  leaf: Leaf,
                  brain: Brain,
                  flower: Flower,
                  'shield-check': ShieldCheck,
                  zap: Zap,
                  beaker: Beaker,
                  'bar-chart': BarChart,
                  'file-text': FileText
                };
                const IconComponent = IconMap[cap.icon as string] || Globe;
                return (
                  <div key={cap.id} className="bg-slate-950/50 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-white/5 hover:bg-slate-900 hover:border-cyan-500/30 transition-all duration-500 group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] hover:shadow-[0_50px_100px_-20px_rgba(6,182,212,0.15)] flex flex-col items-start gap-8 relative overflow-hidden">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 rounded-2xl bg-cyan-400 flex items-center justify-center text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform duration-500 relative z-10">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="space-y-4 relative z-10">
                      <h3 className="text-xl font-black text-white uppercase group-hover:text-cyan-400 transition-colors leading-tight">{cap.title}</h3>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed">{cap.description}</p>
                    </div>
                    <div className="mt-auto pt-6 border-t border-white/5 w-full flex items-center text-cyan-400 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 relative z-10">
                      Learn More
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[4rem] p-8 md:p-32 text-center space-y-12 border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500"></div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight">Ready to start your research journey?</h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">Our team is standing by to provide a custom project proposal tailored to your specific scientific and regulatory needs.</p>
            <Link to="/contact" className="inline-block px-12 py-6 bg-cyan-500 text-slate-900 font-black uppercase tracking-widest text-lg rounded-3xl shadow-xl shadow-cyan-500/20 hover:bg-white hover:scale-105 transition-all">
              Request a Consultation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Capabilities;
