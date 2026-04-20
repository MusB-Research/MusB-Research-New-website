import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { PersonalDoc, INITIAL_DOCS, mapUserToDocs } from '../credentials/CredentialConstants';
import { CredentialCard } from '../credentials/components/CredentialCard';
import { CredentialProfile } from '../credentials/components/CredentialProfile';
import { ComplianceLensModal } from '../credentials/components/ComplianceLensModal';
import { authFetch, API } from '../../../utils/auth';

export default function MyDocumentsModule({ selectedStudyId }: { selectedStudyId?: string }) {
    const [docs, setDocs] = useState<PersonalDoc[]>(INITIAL_DOCS);
    const [user, setUser] = useState<any>(null);
    const [selectedDoc, setSelectedDoc] = useState<PersonalDoc | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await authFetch(`${API.AUTH}/me/`);
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                    setDocs(mapUserToDocs(data));
                }
            } catch (error) {
                console.error("Failed to fetch user credentials:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleBulkExport = () => {
        const blob = new Blob(['Simulated Credential Archive'], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Dr_Michael_Chen_Credential_Bundle.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            alert(`Uploading Credential: [${e.target.files[0].name}]... Initiating secure compliance ingest.`);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Credentials</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleBulkExport}
                        className="px-6 py-3.5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                    >
                        Download All
                    </button>
                    <div className="relative">
                        <input type="file" id="credential-upload" className="hidden" onChange={handleFileUpload} />
                        <button 
                            onClick={() => document.getElementById('credential-upload')?.click()}
                            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.03] hover:shadow-indigo-500/40 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3 active:scale-95"
                        >
                            Add <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <CredentialProfile user={user} />

            {/* Credential Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 flex flex-col items-center justify-center p-20 space-y-4">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-[12px] text-slate-500 font-black uppercase tracking-widest">Hydrating Clinical Credentials...</p>
                    </div>
                ) : (
                    docs.map((doc) => (
                        <CredentialCard key={doc.id} doc={doc} onSelect={setSelectedDoc} />
                    ))
                )}
            </div>

            {/* Regulatory Summary Banner */}
            <div className="p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] flex flex-col md:flex-row md:items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Regulatory Ready</h3>
                </div>
                <button 
                    onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                    className="px-8 py-4 bg-white text-slate-950 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none"
                >
                    Download All
                </button>
            </div>

            <ComplianceLensModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
        </motion.div>
    );
}


