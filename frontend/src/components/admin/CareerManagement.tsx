import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Briefcase, Calendar, MapPin, 
  Trash2, Edit2, Archive, CheckCircle, 
  Clock, Star, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../../utils/auth';

interface JobPosting {
  id: string;
  title: string;
  category: string;
  is_featured: boolean;
  location: string;
  job_type: 'Full-time' | 'Part-time' | 'Contract';
  experience_level: string;
  role_summary: string;
  requirements: string[];
  status: 'Active' | 'Archived';
  publish_date: string;
  expiry_date: string;
}

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CareerManagement() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<JobPosting>>({
    title: '',
    category: 'Clinical Research',
    is_featured: false,
    location: '',
    job_type: 'Full-time',
    experience_level: '',
    role_summary: '',
    requirements: [''],
    status: 'Active',
    publish_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
  });

  const fetchJobs = async () => {
    try {
      const res = await authFetch(`${API_ROOT}/api/careers/admin/job-postings/`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingJob 
      ? `${API_ROOT}/api/careers/admin/job-postings/${editingJob.id}/` 
      : `${API_ROOT}/api/careers/admin/job-postings/`;
    
    const method = editingJob ? 'PATCH' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingJob(null);
        fetchJobs();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this posting?')) return;
    try {
      const res = await authFetch(`${API_ROOT}/api/careers/admin/job-postings/${id}/`, {
        method: 'DELETE',
      });
      if (res.ok) fetchJobs();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const toggleStatus = async (job: JobPosting) => {
    const newStatus = job.status === 'Active' ? 'Archived' : 'Active';
    try {
      const res = await authFetch(`${API_ROOT}/api/careers/admin/job-postings/${job.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchJobs();
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({ ...prev, requirements: [...(prev.requirements || []), ''] }));
  };

  const updateRequirement = (index: number, val: string) => {
    const newReqs = [...(formData.requirements || [])];
    newReqs[index] = val;
    setFormData(prev => ({ ...prev, requirements: newReqs }));
  };

  const removeRequirement = (index: number) => {
    const newReqs = formData.requirements?.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, requirements: newReqs }));
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Career <span className="text-cyan-400">Management</span></h1>
          <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-widest">Post and manage clinical trial opportunities</p>
        </div>
        <button 
          onClick={() => {
            setEditingJob(null);
            setFormData({
              title: '',
              category: 'Clinical Research',
              is_featured: false,
              location: '',
              job_type: 'Full-time',
              experience_level: '',
              role_summary: '',
              requirements: [''],
              status: 'Active',
              publish_date: new Date().toISOString().split('T')[0],
              expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Post New Opening
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-[#0f172a] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-cyan-500/30 transition-all group">
              <div className="flex items-center gap-6 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${job.status === 'Active' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic group-hover:text-cyan-400 transition-colors">{job.title}</h3>
                    {job.is_featured && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500" /> Featured
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${job.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest"><Clock className="w-3 h-3" /> {job.job_type}</span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest"><Calendar className="w-3 h-3" /> Expires: {job.expiry_date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleStatus(job)}
                  className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-white/10"
                  title={job.status === 'Active' ? 'Archive' : 'Restore'}
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setEditingJob(job);
                    setFormData(job);
                    setShowForm(true);
                  }}
                  className="p-3 bg-white/5 text-slate-400 hover:text-cyan-400 rounded-xl transition-all border border-transparent hover:border-white/10"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(job.id)}
                  className="p-3 bg-white/5 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-white/10"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="bg-[#0f172a]/50 border-2 border-dashed border-white/5 rounded-3xl py-20 text-center">
              <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">No job postings found</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-3xl p-10 overflow-y-auto max-h-[90vh] shadow-2xl custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                  {editingJob ? 'Update' : 'Create'} <span className="text-cyan-400">Job Posting</span>
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Senior Clinical Research Coordinator"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g. Clinical Research"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Tampa, FL (On-site)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Type</label>
                    <select 
                      value={formData.job_type}
                      onChange={e => setFormData({...formData, job_type: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Experience Level</label>
                    <input 
                      type="text" 
                      value={formData.experience_level}
                      onChange={e => setFormData({...formData, experience_level: e.target.value})}
                      placeholder="e.g. Senior"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Featured?</label>
                    <div className="flex items-center gap-4 py-3">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}
                        className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${formData.is_featured ? 'bg-cyan-500' : 'bg-slate-700'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.is_featured ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pin to top of list</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Publish Date</label>
                    <input 
                      type="date" 
                      value={formData.publish_date}
                      onChange={e => setFormData({...formData, publish_date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Date (Auto-Archive)</label>
                    <input 
                      type="date" 
                      value={formData.expiry_date}
                      onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role Summary</label>
                  <textarea 
                    value={formData.role_summary}
                    onChange={e => setFormData({...formData, role_summary: e.target.value})}
                    placeholder="Describe the role and responsibilities..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-cyan-500/50 transition-all outline-none min-h-[150px]"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Requirements (Bullet Points)</label>
                    <button 
                      type="button" 
                      onClick={addRequirement}
                      className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Point
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.requirements?.map((req, idx) => (
                      <div key={idx} className="flex gap-3">
                        <input 
                          type="text" 
                          value={req}
                          onChange={e => updateRequirement(idx, e.target.value)}
                          placeholder={`Requirement ${idx + 1}`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 transition-all outline-none"
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => removeRequirement(idx)}
                          className="p-3 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                  >
                    {editingJob ? 'Update Job Posting' : 'Publish Job Opening'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 bg-white/5 text-slate-500 font-black hover:text-white transition-all rounded-xl text-xs uppercase tracking-widest border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
