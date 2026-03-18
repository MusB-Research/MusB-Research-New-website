import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, GripVertical, Settings, Trash2, Eye, Save } from 'lucide-react';
import { authFetch } from '../../utils/auth';

interface FormField {
  id: string;
  type: 'text' | 'choice' | 'yesno' | 'dropdown' | 'date' | 'file';
  label: string;
  required: boolean;
  options?: string[];
}

export default function ScreenerBuilder() {
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', type: 'text', label: 'Full Legal Name', required: true },
    { id: '2', type: 'date', label: 'Date of Birth', required: true },
    { id: '3', type: 'yesno', label: 'Have you participated in a clinical trial in the last 30 days?', required: true },
  ]);

  const [studyContext, setStudyContext] = useState('');
  const [studies, setStudies] = useState<any[]>([]);
  const [formId, setFormId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await authFetch(`${apiUrl}/api/studies/`);
        if (res.ok) {
          const data = await res.json();
          setStudies(data);
          if (data.length > 0 && !studyContext) {
            setStudyContext(data[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch studies:', error);
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    const fetchExistingForm = async () => {
      if (!studyContext) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await authFetch(`${apiUrl}/api/forms/?study_id=${studyContext}`);
        if (res.ok) {
          const data = await res.json();
          // Find the newest screener form (in case duplicates exist)
          const screener = data
            .filter((f: any) => f.title === 'Screener Form')
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          if (screener && screener.schema) {
            setFields(typeof screener.schema === 'string' ? JSON.parse(screener.schema) : screener.schema);
            setFormId(screener.id);
          } else {
            setFormId(null);
            setFields([
              { id: '1', type: 'text', label: 'Full Legal Name', required: true },
              { id: '2', type: 'date', label: 'Date of Birth', required: true },
              { id: '3', type: 'yesno', label: 'Have you participated in a clinical trial in the last 30 days?', required: true },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch existing screener:', error);
      }
    };
    fetchExistingForm();
  }, [studyContext]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!studyContext) {
      alert("Please select a study context first");
      return;
    }

    setIsSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const payload = {
        study: studyContext,
        title: 'Screener Form',
        description: 'Dynamic study screener generated via builder',
        schema: fields,
        is_published: true
      };

      const res = await authFetch(
        formId ? `${apiUrl}/api/forms/${formId}/` : `${apiUrl}/api/forms/`, 
        {
          method: formId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        const savedForm = await res.json();
        setFormId(savedForm.id);
        setFields(savedForm.schema);
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
    setFields([...fields, { 
      id: Math.random().toString(36).substr(2, 9), 
      type, 
      label: 'New Question', 
      required: false,
      options: type === 'choice' || type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined
    }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'down' && index < newFields.length - 1) {
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
    }
    setFields(newFields);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter leading-tight">Screener <span className="text-[#ec4899]">Builder</span></h1>
          <p className="text-sm sm:text-base text-[#8b8fa8] uppercase tracking-[0.2em] font-black mt-4">Design custom qualification forms for specific studies</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          <select value={studyContext} onChange={e => setStudyContext(e.target.value)} className="bg-[#0f1133] border border-white/10 rounded-2xl px-8 py-5 text-sm text-white font-black outline-none uppercase tracking-widest focus:border-pink-500/50 transition-all max-w-sm truncate">
            {studies.length === 0 && <option value="">No studies available</option>}
            {studies.map(study => (
              <option key={study.id} value={study.id.toString()}>{study.title}</option>
            ))}
          </select>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-5 bg-[#ec4899] text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-pink-500/30 hover:bg-pink-500 hover:scale-105 transition-all disabled:opacity-50"
          >
            <Save className="w-6 h-6" /> {isSaving ? 'Synchronizing...' : 'Save Form'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#0f1133] border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
            <h3 className="text-base font-black text-white uppercase italic tracking-[0.2em] mb-10 border-b border-white/5 pb-6">Field Syntax Nodes</h3>
            <div className="space-y-5">
              {[
                { type: 'text', label: 'Short/Long Text' },
                { type: 'choice', label: 'Multiple Choice' },
                { type: 'dropdown', label: 'Select Dropdown' },
                { type: 'yesno', label: 'Yes/No Boolean' },
                { type: 'date', label: 'Date/Time Picker' },
                { type: 'file', label: 'File/Image Upload' }
              ].map(ft => (
                <button 
                  key={ft.type} 
                  onClick={() => addField(ft.type as any)}
                  className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-[1.2rem] hover:bg-pink-500/10 hover:border-pink-500/30 transition-all group"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-pink-400 transition-colors">{ft.label}</span>
                  <Plus className="w-4 h-4 text-slate-600 group-hover:text-pink-400 transform group-hover:rotate-90 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-[#0f1133] border border-white/5 rounded-[3rem] p-12 min-h-[60vh] shadow-2xl">
            <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-[0.2em]">Form Architecture</h3>
              <button className="text-sm font-black uppercase text-pink-500 tracking-[0.2em] flex items-center gap-4 hover:text-white transition-all transform hover:scale-105 active:scale-95">
                <Eye className="w-6 h-6" /> Preview Mode
              </button>
            </div>
            
            <div className="space-y-8">
              {fields.map((field, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={field.id} 
                  className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row gap-8 md:gap-10 group hover:border-white/10 transition-all overflow-hidden relative"
                >
                  <div className="flex flex-row md:flex-col gap-5 items-center justify-center text-slate-600 md:border-r border-white/5 md:pr-8 md:min-w-[60px] shrink-0">
                    <button onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="hover:text-pink-500 disabled:opacity-10 text-xs transition-all p-2 bg-white/5 rounded-lg">▲</button>
                    <div className="p-2 opacity-30 group-hover:opacity-100 transition-opacity rotate-90 md:rotate-0">
                      <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
                    </div>
                    <button onClick={() => moveField(idx, 'down')} disabled={idx === fields.length - 1} className="hover:text-pink-500 disabled:opacity-10 text-xs transition-all p-2 bg-white/5 rounded-lg">▼</button>
                  </div>
                  
                  <div className="flex-1 space-y-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-end w-full">
                      <div className="flex-1 w-full space-y-2 min-w-0">
                        <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] ml-2">Question Prompt</label>
                        <input 
                          type="text" 
                          value={field.label}
                          onChange={(e) => {
                            const nf = [...fields];
                            nf[idx].label = e.target.value;
                            setFields(nf);
                          }}
                          className="w-full bg-transparent border-b border-dashed border-white/10 text-white font-black text-xl outline-none focus:border-pink-500 py-3 placeholder:text-slate-800 transition-all truncate"
                          placeholder="Enter your question prompt here..."
                        />
                      </div>
                      <div className="flex items-center gap-4 bg-pink-500/5 px-5 py-3 rounded-2xl border border-pink-500/20 shadow-inner mb-1 shrink-0">
                        <label className="text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] flex items-center gap-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            checked={field.required} 
                            onChange={(e) => {
                              const nf = [...fields];
                              nf[idx].required = e.target.checked;
                              setFields(nf);
                            }}
                            className="w-4 h-4 accent-pink-500 rounded-md cursor-pointer" 
                          /> Mandatory
                        </label>
                      </div>
                    </div>

                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-sm text-slate-500 italic font-medium leading-relaxed shadow-inner">
                      {field.type === 'text' && "Visual Output: Single or multi-line cryptographic text input field."}
                      {field.type === 'yesno' && "Visual Output: Dual-state Boolean selection radios."}
                      {field.type === 'date' && "Visual Output: Temporal synchronization calendar interface."}
                      {field.type === 'file' && "Visual Output: Encrypted multi-format document upload portal."}
                      {(field.type === 'choice' || field.type === 'dropdown') && (
                        <div className="not-italic space-y-6">
                          <p className="text-xs uppercase tracking-[0.3em] font-black text-[#ec4899] mb-6">Response Logic Array:</p>
                          {field.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex gap-6 items-center group/opt">
                              <span className="w-5 h-5 rounded-md border-2 border-white/10 group-hover/opt:border-pink-500/50 transition-colors shrink-0"></span>
                              <input 
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const nf = [...fields];
                                  if(nf[idx].options) {
                                    nf[idx].options![oIdx] = e.target.value;
                                  }
                                  setFields(nf);
                                }}
                                className="bg-transparent border-b border-white/5 text-slate-200 outline-none focus:border-pink-500 flex-1 min-w-0 py-3 text-lg font-bold transition-all placeholder:text-slate-800"
                                placeholder={`Option ${oIdx + 1}`}
                              />
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const nf = [...fields];
                              const currentOptions = nf[idx].options || [];
                              nf[idx] = {
                                ...nf[idx],
                                options: [...currentOptions, `Option ${currentOptions.length + 1}`]
                              };
                              setFields(nf);
                            }}
                            className="text-xs font-black text-pink-500 uppercase tracking-[0.3em] mt-6 hover:text-white flex items-center gap-3 transition-colors"
                          >
                            <Plus className="w-5 h-5" /> Append Response Option
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-6 md:border-l border-white/5 md:pl-10 justify-center shrink-0">
                    <button className="p-4 text-slate-600 hover:text-white bg-white/5 rounded-2xl transition-all hover:scale-110 shadow-lg group-hover:border-white/10 border border-transparent"><Settings className="w-5 h-5" /></button>
                    <button onClick={() => removeField(field.id)} className="p-4 text-slate-600 hover:text-red-500 bg-white/5 rounded-2xl transition-all hover:scale-110 shadow-lg group-hover:border-white/10 border border-transparent"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </motion.div>
              ))}
              
              {fields.length === 0 && (
                <div className="py-32 text-center text-slate-500 uppercase tracking-[0.4em] font-black text-sm sm:text-base border-4 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                  Inject or click field nodes to begin form synthesis
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
