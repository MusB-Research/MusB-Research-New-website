import React from 'react';
import { FileText, ArrowUpRight } from 'lucide-react';
import { COLORS, S } from '../SubRevConstants';

interface DocumentRegistryProps {
    participant: any;
}

export const DocumentRegistry: React.FC<DocumentRegistryProps> = ({ participant }) => {
    const documents = [
        ...(participant.consent_records || []).map((c: any) => ({
            n: `Signed Consent - ${c.template_details?.title || 'eConsent'}`,
            d: c.signed_at?.split('T')[0] || 'Unknown Date',
            v: c.template_details?.version || '1.0',
            t: 'PDF',
            url: c.file_url
        })),
        ...(participant.lab_results || []).map((l: any) => ({
            n: `Lab Report - ${l.report_type || 'Diagnostic'}`,
            d: l.collected_at?.split('T')[0] || 'Unknown Date',
            v: '1.0',
            t: 'PDF',
            url: l.file_url
        })),
        ...(participant.documents || []).map((d: any) => ({
            n: d.title || 'Participant Document',
            d: d.uploaded_at?.split('T')[0] || 'Uploaded',
            v: d.version || '1.0',
            t: d.file ? d.file.split('.').pop().toUpperCase() : 'DOC',
            url: d.file_url
        }))
    ];

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div>
                <h3 style={S.title}>Participant Document Repository</h3>
                <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {documents.length > 0 ? documents.map((doc, i) => (
                        <div key={i} style={S.card} className="group">
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={20} color={COLORS.accent} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{doc.n}</div>
                                    <div style={{ fontSize: '12px', color: COLORS.label }}>v{doc.v} • {doc.d}</div>
                                </div>
                                {doc.url && (
                                    <a 
                                        href={doc.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ ...S.btnGhost, padding: '0.5rem', opacity: 0.5 }} 
                                        className="group-hover:opacity-100 transition-opacity"
                                    >
                                        <Eye size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                            <FileText size={48} className="mx-auto text-slate-800 mb-4" />
                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">No clinical artifacts archived for this subject</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


