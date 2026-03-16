import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, GripVertical, Settings, Trash2, Eye, Save } from 'lucide-react';

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

  const [studyContext, setStudyContext] = useState('beat-the-bloat');

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Screener <span className="text-[#ec4899]">Builder</span></h1>
          <p className="text-[10px] sm:text-xs text-[#8b8fa8] uppercase tracking-widest mt-2">Design custom qualification forms for specific studies</p>
        </div>
        <div className="flex gap-4">
          <select value={studyContext} onChange={e => setStudyContext(e.target.value)} className="bg-[#0f1133] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none uppercase tracking-widest">
            <option value="beat-the-bloat">Beat The Bloat Study</option>
            <option value="vital-age">VITAL-Age Study</option>
            <option value="new-study">Unassigned Draft</option>
          </select>
          <button className="px-6 py-3 bg-[#ec4899] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:bg-pink-500 transition-all">
            <Save className="w-4 h-4" /> Save Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0f1133] border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-6 border-b border-white/5 pb-4">Field Types</h3>
            <div className="space-y-3">
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
                  className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-pink-500/10 hover:border-pink-500/30 transition-all group"
                >
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest group-hover:text-pink-400">{ft.label}</span>
                  <Plus className="w-4 h-4 text-slate-600 group-hover:text-pink-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#0f1133] border border-white/5 rounded-3xl p-8 min-h-[60vh]">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <h3 className="text-lg font-black text-white uppercase italic tracking-widest">Form Structure</h3>
              <button className="text-[10px] font-black uppercase text-pink-500 tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                <Eye className="w-4 h-4" /> Preview View
              </button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={field.id} 
                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex gap-6 group hover:border-white/10 transition-colors"
                >
                  <div className="flex flex-col gap-2 items-center justify-center text-slate-600">
                    <button onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="hover:text-white disabled:opacity-20">▲</button>
                    <GripVertical className="w-5 h-5 opacity-40 group-hover:opacity-100 cursor-grab" />
                    <button onClick={() => moveField(idx, 'down')} disabled={idx === fields.length - 1} className="hover:text-white disabled:opacity-20">▼</button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={field.label}
                        onChange={(e) => {
                          const nf = [...fields];
                          nf[idx].label = e.target.value;
                          setFields(nf);
                        }}
                        className="flex-1 bg-transparent border-b border-dashed border-white/20 text-white font-bold text-lg outline-none focus:border-pink-500 px-2 py-1 placeholder:text-slate-700"
                        placeholder="Enter your question prompt here..."
                      />
                      <div className="flex items-center gap-4 bg-[#0a0b1a] px-4 py-2 rounded-xl border border-white/5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={field.required} 
                            onChange={(e) => {
                              const nf = [...fields];
                              nf[idx].required = e.target.checked;
                              setFields(nf);
                            }}
                            className="accent-pink-500" 
                          /> Required
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-sm text-slate-500 italic">
                      {field.type === 'text' && "User will see a text input field here."}
                      {field.type === 'yesno' && "User will select Yes or No radios."}
                      {field.type === 'date' && "User will select a date from a calendar interface."}
                      {field.type === 'file' && "User will be prompted to upload a document or image."}
                      {(field.type === 'choice' || field.type === 'dropdown') && (
                        <div className="not-italic space-y-2">
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-3">Response Options:</p>
                          {field.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex gap-2 items-center">
                              <span className="w-4 h-4 rounded-full border border-white/20"></span>
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
                                className="bg-transparent border-b border-white/10 text-slate-300 outline-none focus:border-pink-500 w-64 px-2 py-1 text-sm font-medium"
                              />
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const nf = [...fields];
                              nf[idx].options?.push(`Option ${nf[idx].options?.length + 1}`);
                              setFields(nf);
                            }}
                            className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mt-2 hover:text-white"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-l border-white/5 pl-6">
                    <button className="p-2 text-slate-600 hover:text-white bg-white/5 rounded-lg transition-colors"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => removeField(field.id)} className="p-2 text-slate-600 hover:text-red-500 bg-white/5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
              
              {fields.length === 0 && (
                <div className="py-20 text-center text-slate-500 uppercase tracking-widest font-black text-xs border-2 border-dashed border-white/10 rounded-2xl">
                  Drag or click field types to begin building the screener
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
