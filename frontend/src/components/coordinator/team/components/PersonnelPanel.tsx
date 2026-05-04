import React from 'react';
import { X, Upload, ShieldCheck, FileText, Check } from 'lucide-react';
import { TeamMember, ROLE_DOCS, PROTOCOLS } from '../TeamConstants';

interface PersonnelPanelProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    editedMember: Partial<TeamMember>;
    setEditedMember: (member: Partial<TeamMember>) => void;
    allStudies?: any[];
    handleSave: () => void;
    handleActivate: () => void;
    triggerUpload: (docId: string) => void;
}

export const PersonnelPanel: React.FC<PersonnelPanelProps> = ({
    isOpen,
    onClose,
    mode,
    editedMember,
    setEditedMember,
    allStudies = [],
    handleSave,
    handleActivate,
    triggerUpload
}) => {
    // Ensure documents array exists
    const documents = editedMember.documents || [];
    const handleRemoveFile = (docId: string) => {
        setEditedMember({
            ...editedMember,
            documents: documents.map(doc => {
                if (doc.id === docId) {
                    return {
                        ...doc,
                        status: 'Missing',
                        uploadDate: undefined,
                        fileName: undefined
                    };
                }
                return doc;
            })
        });
    };
    const validDocsCount = documents.filter(d => d.status === 'Valid').length;

    return (
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className={`absolute right-0 top-0 w-full sm:max-w-2xl h-full bg-[#0F172A] border-l border-white/5 shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 sm:px-10 py-6 sm:py-8 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase italic leading-none">
                        {mode === 'add' ? 'Add member' : 'Edit member'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 sm:space-y-12 custom-scrollbar">
                    {/* Basic Info */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 mb-6 sm:mb-8">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Member details</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Full name</label>
                                <input
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all font-bold"
                                    value={editedMember.name || ''}
                                    onChange={e => setEditedMember({ ...editedMember, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Role</label>
                                <select
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer font-bold"
                                    value={editedMember.role || ''}
                                    onChange={e => {
                                        const role = e.target.value;
                                        setEditedMember({
                                            ...editedMember,
                                            role,
                                            documents: (ROLE_DOCS[role] || ['CV']).map(name => ({
                                                id: Math.random().toString(36).substr(2, 9),
                                                name,
                                                status: 'Missing' as const,
                                                isRequired: true
                                            }))
                                        });
                                    }}
                                >
                                    <option value="" className="bg-[#0f172a]">Select a role</option>
                                    {Object.keys(ROLE_DOCS).map(r => <option key={r} value={r} className="bg-[#0f172a]">{r}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Email address</label>
                                <input
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all font-bold"
                                    value={editedMember.email || ''}
                                    onChange={e => setEditedMember({ ...editedMember, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Phone number</label>
                                <input
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all font-bold"
                                    value={editedMember.phone || ''}
                                    onChange={e => setEditedMember({ ...editedMember, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Access & Studies */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 mb-6 sm:mb-8">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Access details</h4>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Assigned studies</label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {allStudies && allStudies.map(study => {
                                    const p = study.protocol_id || study.id;
                                    const selected = editedMember.assignedStudies?.includes(p);
                                    return (
                                        <button key={p}
                                            onClick={() => setEditedMember({
                                                ...editedMember,
                                                assignedStudies: selected
                                                    ? editedMember.assignedStudies?.filter(s => s !== p)
                                                    : [...(editedMember.assignedStudies || []), p]
                                            })}
                                            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all ${selected
                                                    ? 'bg-blue-600/10 border-blue-500/30 text-white'
                                                    : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                                                }`}
                                        >{p}</button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
                            <div className="space-y-2.5">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Access level</label>
                                <select
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all cursor-pointer font-bold"
                                    value={editedMember.permissionLevel || ''}
                                    onChange={e => setEditedMember({ ...editedMember, permissionLevel: e.target.value as any })}
                                >
                                    <option value="" className="bg-[#0f172a]">Select access level</option>
                                    <option value="Full" className="bg-[#0f172a]">Level 3: Full access</option>
                                    <option value="Limited" className="bg-[#0f172a]">Level 2: Write access</option>
                                    <option value="Read-only" className="bg-[#0f172a]">Level 1: Read only</option>
                                </select>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">Specialty</label>
                                <input
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all font-bold"
                                    value={editedMember.expertise || ''}
                                    onChange={e => setEditedMember({ ...editedMember, expertise: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Verification Documents */}
                    <section className="space-y-6 pb-8">
                        <div className="flex items-center gap-2 mb-6 sm:mb-8">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Required documents ({validDocsCount}/{documents.length})</h4>
                        </div>
                        <div className="space-y-3">
                            {documents.length > 0 ? (
                                documents.map(doc => (
                                    <div key={doc.id} className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-4 sm:p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${doc.status === 'Valid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-700'}`}>
                                                {doc.status === 'Valid' ? <Check size={16} /> : <FileText size={16} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-white leading-none uppercase tracking-tight truncate">{doc.name}</p>
                                                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-widest">
                                                    {doc.status === 'Valid' ? (doc.fileName ? `File: ${doc.fileName}` : `Uploaded: ${doc.uploadDate}`) : 'Pending upload'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full xs:w-auto">
                                            <button
                                                className={`flex-1 xs:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${doc.status === 'Valid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20'
                                                    }`}
                                                onClick={() => triggerUpload(doc.id)}
                                            >
                                                <Upload size={14} /> {doc.status === 'Valid' ? 'Replace' : 'Upload'}
                                            </button>
                                            {doc.status === 'Valid' && (
                                                <button
                                                    className="px-4 py-2.5 sm:py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all"
                                                    onClick={() => handleRemoveFile(doc.id)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-8">Choose a role to see required documents</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer Actions */}
                <div className="px-6 sm:px-10 py-6 sm:py-8 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                        className="order-2 sm:order-1 flex-1 px-8 py-4 sm:py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all"
                        onClick={onClose}
                    >
                        Discard
                    </button>
                    <button
                        className="order-1 sm:order-2 flex-[2] px-8 py-4 sm:py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                        onClick={handleSave}
                    >
                        <ShieldCheck size={18} /> Save
                    </button>
                </div>
            </div>
        </div>
    );
};