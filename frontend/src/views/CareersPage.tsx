import React, { useState, useEffect } from 'react';
import {
  Briefcase, MapPin, Clock, Calendar,
  CheckCircle2, Mail, FileText, ChevronRight,
  ArrowLeft, Star, Users, Shield, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';

interface JobPosting {
  id: string;
  title: string;
  category: string;
  is_featured: boolean;
  location: string;
  job_type: string;
  experience_level: string;
  role_summary: string;
  requirements: string[];
  status: string;
  publish_date: string;
}

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CareersPage() {
  const { id } = useParams();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_ROOT}/api/careers/public/active/`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
          if (id) {
            const found = data.find((j: JobPosting) => j.id === id);
            if (found) {
              setSelectedJob(found);
            } else {
              // Try fetching from the single job endpoint if not in active list (optional)
              const detailRes = await fetch(`${API_ROOT}/api/careers/public/job/${id}/`);
              if (detailRes.ok) setSelectedJob(await detailRes.json());
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Listing View
  if (!id || !selectedJob) {
    return (
      <div className="min-h-screen bg-transparent pt-32 pb-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full"
            >
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Join MusB Research</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter"
            >
              Build The <span className="text-cyan-400">Future</span> of Research
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto text-slate-500 font-bold uppercase tracking-widest text-xs"
            >
              Explore open positions at MusB Health and contribute to groundbreaking clinical studies across the globe.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={`/careers/${job.id}`}
                  className="block group bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 hover:border-cyan-500/30 transition-all hover:-translate-y-2 relative overflow-hidden"
                >
                  {job.is_featured && (
                    <div className="absolute top-0 right-0 px-6 py-2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg">
                      Featured
                    </div>
                  )}
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{job.category}</p>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                        <Clock className="w-4 h-4" /> {job.job_type}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          {jobs.length === 0 && (
            <div className="text-center py-40 bg-slate-900/20 rounded-[3rem] border border-dashed border-white/5">
              <Briefcase className="w-16 h-16 text-slate-800 mx-auto mb-6" />
              <h4 className="text-2xl font-black text-slate-600 uppercase italic">No Active Openings</h4>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest mt-4 leading-relaxed">System synchronization detected no pending vacancies. <br /> Please check back later for updates.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detail View (The "As per Image" request)
  return (
    <div className="min-h-screen bg-transparent pt-32 pb-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <Link to="/careers" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all mb-12 font-black uppercase text-[10px] tracking-widest group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Opportunities
        </Link>

        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-12">
            {/* Header Section */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">{selectedJob.category}</span>
                {selectedJob.is_featured && (
                  <span className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-2">
                    <Star className="w-3 h-3 fill-amber-500" /> Featured Position
                  </span>
                )}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                {selectedJob.title}
              </h1>

              {/* Meta Icons */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Location</p>
                    <p className="text-sm font-black text-white uppercase italic tracking-tight">{selectedJob.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Job Type</p>
                    <p className="text-sm font-black text-white uppercase italic tracking-tight">{selectedJob.job_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Experience</p>
                    <p className="text-sm font-black text-white uppercase italic tracking-tight">{selectedJob.experience_level}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body Sections */}
            <div className="grid grid-cols-1 gap-12 pt-12 border-t border-white/5">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-[0.3em] font-mono">The Role</h3>
                <div className="text-slate-400 font-bold leading-relaxed space-y-4 max-w-4xl italic">
                  {selectedJob.role_summary.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-[0.3em] font-mono">What You'll Bring</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedJob.requirements.map((req, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 p-6 bg-slate-900/50 rounded-3xl border border-white/5"
                    >
                      <div className="mt-1 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
                        <CheckCircle2 className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <p className="text-sm font-black text-white uppercase italic tracking-tight leading-snug">{req}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Side Card */}
          <div className="lg:w-96">
            <div className="sticky top-40 bg-gradient-to-br from-slate-900 to-[#020617] border border-white/10 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Briefcase className="w-48 h-48 text-white" />
              </div>

              <div className="space-y-4 relative z-10">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Apply For <span className="text-cyan-400">This Position</span></h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] leading-relaxed">Immediate node authorization available for qualified clinical personnel.</p>
              </div>

              <div className="flex flex-col gap-4 relative z-10">
                <button className="w-full flex items-center justify-center gap-3 py-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-cyan-900/20 active:scale-95 transition-all">
                  <FileText className="w-4 h-4" /> Submit Your Resume
                </button>
                <a
                  href={`mailto:careers@musbresearch.com?subject=Application for ${selectedJob.title}`}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all"
                >
                  <Mail className="w-4 h-4 text-cyan-500" /> Email Application
                </a>
              </div>

              <div className="pt-10 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-3 opacity-40">
                  <Shield className="w-4 h-4 text-cyan-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">EEO Compliance Policy Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}