import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, GripVertical, Settings, 
  Save, Layout, Eye, History, 
  Clock, FileText, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { authFetch } from '../../utils/auth';

interface FormField {
  id: string;
  type: 'text' | 'choice' | 'dropdown' | 'date';
  label: string;
  required: boolean;
  options?: string[];
}

export default function ScreenerBuilder() {
  const [studies, setStudies] = useState<any[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<string>('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/studies/`);
      if (res.ok) setStudies(await res.json());
    } catch (error) {
      console.error('Fetch studies error:', error);
    }
  };

  useEffect(() => {
    if (selectedStudy) {
      fetchExistingForm();
    }
  }, [selectedStudy]);

  const fetchExistingForm = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/forms/?study_id=${selectedStudy}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setFormId(data[0].id);
          setFields(data[0].schema);
        } else {
          setFormId(null);
          setFields([]);
        }
      }
    } catch (error) {
      console.error('Fetch form error:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedStudy) return alert("Select a protocol context.");
    setIsSaving(true);

    const payload = {
      study: selectedStudy,
      title: `${selectedStudy} Recruitment Screener`,
      schema: fields
    };

    try {
      const res = await authFetch(
        formId ? `${apiUrl}/api/forms/${formId}/` : `${apiUrl}/api/forms/`, 
        {
          method: formId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        const savedForm = await res.json();
        setFormId(savedForm.id);
        alert("✅ SCREENER ARCHITECTURE SYNCHRONIZED\nForm has been persisted to the study context.");
      } else {
        const err = await res.json();
        alert(`❌ SAVE FAILED: ${JSON.stringify(err)}`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert("❌ CRITICAL ERROR IN SAVE PIPELINE");
    } finally {
      setIsSaving(false);
    }
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = { 
      id: Date.now().toString(), 
      type, 
      label: '', 
      required: false,
      options: type === 'choice' || type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
    }
    setFields(newFields);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20">
              <Layout className="w-6 h-6 text-pink-500" />
            </div>
            <span className="text-[11px] font-black text-pink-500 uppercase tracking-[0.4em] italic font-black">Architecture: Protocol Design</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Screener Builder</h1>
          <p className="text-slate-500 font-bold mt-3 max-w-xl text-lg leading-relaxed">Design logical recruitment funnels with dynamic branching and integrated validation triggers.</p>
        </div>
        
        <div className="flex items-center gap-6">
           <select 
            value={selectedStudy}
            onChange={(e) => setSelectedStudy(e.target.value)}
            className="bg-slate-950/50 border border-white/10 rounded-2xl px-8 py-5 text-white font-black text-xs uppercase tracking-widest outline-none focus:border-pink-500/50 transition-all shadow-2xl"
          >
            <option value="">Select Context Protocol</option>
            {studies.map(s => <option key={s.id} value={s.id} className="bg-[#0a0b1a]">{s.protocol_id} - {s.title}</option>)}
          </select>
          <button 
            onClick={handleSave}
            disabled={isSaving || !selectedStudy}
            className="px-10 py-5 bg-[#ec4899] text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-pink-500/30 hover:bg-pink-500 hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 italic"
          >
            <Save className="w-6 h-6" /> {isSaving ? 'Synchronizing...' : 'Save Form'}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10">
        {/* Toolbox */}
        <aside className="w-full xl:w-96 space-y-8">
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 flex flex-col gap-10 group hover:border-white/10 transition-all">
            <div className="space-y-2">
              <h3 className="text-white font-black text-lg italic uppercase tracking-widest">Question Toolbox</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">Tap component to append to architecture</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {[
                { type: 'text', label: 'Short Response', icon: FileText },
                { type: 'choice', label: 'Single/Multi Choice', icon: CheckCircle2 },
                { type: 'dropdown', label: 'Dropdown List', icon: Layout },
                { type: 'date', label: 'Date Selection', icon: Clock }
              ].map((ft) => (
                <button 
                  key={ft.type}
                  onClick={() => addField(ft.type as any)}
                  className="w-full flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[1.5rem] hover:bg-pink-500/10 hover:border-pink-500/30 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-pink-400 group-hover:scale-110 transition-all">
                      <ft.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] group-hover:text-pink-400 transition-colors">{ft.label}</span>
                  </div>
                  <Plus className="w-5 h-5 text-slate-600 group-hover:text-pink-400 transform group-hover:rotate-90 transition-all" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-8 bg-black/40 rounded-3xl border border-white/5 text-base sm:text-lg text-slate-500 italic font-medium leading-relaxed shadow-inner">
             <AlertCircle className="w-6 h-6 text-pink-500 mb-4" />
             Protocols must be approved before screeners can be globally activated.
          </div>
        </aside>

        {/* Builder Area */}
        <div className="flex-1 space-y-8">
          {fields.length === 0 ? (
            <div className="h-[600px] border-4 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-center gap-10 bg-white/[0.01]">
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-700 animate-pulse">
                <Layout className="w-12 h-12" />
              </div>
              <div className="space-y-4">
                <h3 className="text-slate-400 font-black text-3xl uppercase tracking-tighter italic">VIRTUAL CANVAS EMPTY</h3>
                <p className="text-slate-700 font-black uppercase text-xs tracking-[0.4em]">DEPLOY COMPONENTS FROM THE TOOLBOX</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {fields.map((field, idx) => (
                <motion.div 
                  layout
                  key={field.id} 
                  className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 flex gap-10 group hover:border-white/10 transition-all"
                >
                   <div className="flex flex-col gap-6 items-center justify-center text-slate-600">
                    <button onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="hover:text-white disabled:opacity-20 text-2xl transition-all">▲</button>
                    <GripVertical className="w-8 h-8 opacity-40 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity" />
                    <button onClick={() => moveField(idx, 'down')} disabled={idx === fields.length - 1} className="hover:text-white disabled:opacity-20 text-2xl transition-all">▼</button>
                  </div>

                  <div className="flex-1 space-y-10">
                    <div className="flex flex-col xl:flex-row gap-8">
                      <input 
                        type="text" 
                        value={field.label}
                        onChange={(e) => {
                          const nf = [...fields];
                          nf[idx].label = e.target.value;
                          setFields(nf);
                        }}
                        className="flex-1 bg-transparent border-b-2 border-dashed border-white/10 text-white font-black text-2xl outline-none focus:border-pink-500 px-4 py-3 placeholder:text-slate-800 transition-all"
                        placeholder="Enter your question prompt here..."
                      />
                      <div className="flex items-center gap-6 bg-[#0a0b1a] px-8 py-4 rounded-2xl border border-white/5 self-start shadow-inner">
                        <label className="text-sm font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-4 cursor-pointer hover:text-white transition-colors">
                          <input 
                            type="checkbox" 
                            checked={field.required}
                            onChange={(e) => {
                              const nf = [...fields];
                              nf[idx].required = e.target.checked;
                              setFields(nf);
                            }}
                            className="w-5 h-5 accent-pink-500 rounded-md" 
                          />
                          Mandatory
                        </label>
                      </div>
                    </div>

                    {(field.type === 'choice' || field.type === 'dropdown') && field.options && (
                      <div className="pl-10 space-y-6 border-l-2 border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em]">Configure Options</p>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {field.options.map((option, oIdx) => (
                            <div key={oIdx} className="flex gap-6 items-center group/opt">
                              <span className="w-6 h-6 rounded-lg border-2 border-white/10 group-hover:border-pink-500/30 transition-colors"></span>
                              <input 
                                type="text" 
                                value={option}
                                onChange={(e) => {
                                  const nf = [...fields];
                                  const opts = [...(nf[idx].options || [])];
                                  opts[oIdx] = e.target.value;
                                  nf[idx].options = opts;
                                  setFields(nf);
                                }}
                                className="bg-transparent border-b border-white/10 text-slate-200 outline-none focus:border-pink-500 w-full xl:w-[600px] px-4 py-3 text-lg font-bold transition-all"
                              />
                              <button 
                                onClick={() => {
                                  const nf = [...fields];
                                  nf[idx].options = nf[idx].options?.filter((_, i) => i !== oIdx);
                                  setFields(nf);
                                }}
                                className="opacity-0 group-hover/opt:opacity-100 p-2 text-slate-700 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const nf = [...fields];
                              nf[idx].options?.push(`Option ${nf[idx].options?.length + 1}`);
                              setFields(nf);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-pink-500 transition-colors flex items-center gap-3 bg-white/5 self-start px-6 py-3 rounded-xl border border-dashed border-white/10"
                          >
                            <Plus className="w-4 h-4" /> Append Configuration
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-6 border-l border-white/5 pl-10 justify-center">
                    <button className="p-4 text-slate-600 hover:text-white bg-white/5 rounded-2xl transition-all hover:scale-110 shadow-lg"><Settings className="w-6 h-6" /></button>
                    <button onClick={() => removeField(field.id)} className="p-4 text-slate-600 hover:text-red-500 bg-white/5 rounded-2xl transition-all hover:scale-110 shadow-lg"><Trash2 className="w-6 h-6" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
