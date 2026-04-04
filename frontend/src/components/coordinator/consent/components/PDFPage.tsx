import React from 'react';
import { COLORS } from '../ConsentConstants';

interface PDFPageProps {
    pageNumber: number;
    placedFields: any[];
    width?: string | number;
    isThumbnail?: boolean;
    signedFields?: string[];
    participantId?: string;
}

const S = {
    badge: (c: string) => ({ 
        backgroundColor: `${c}15`, 
        color: c, 
        border: `1px solid ${c}30`, 
        padding: '0.4rem 1rem', 
        borderRadius: '4px', 
        fontSize: '11px', 
        fontWeight: 900, 
        textTransform: 'uppercase' as const, 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px' 
    })
};

export const PDFPage: React.FC<PDFPageProps> = ({ 
    pageNumber, 
    placedFields, 
    width = '100%', 
    isThumbnail = false, 
    signedFields = [],
    participantId
}) => (
    <div style={{ 
        backgroundColor: '#0F172A', 
        width, 
        aspectRatio: '1/1.414', 
        position: 'relative', 
        padding: isThumbnail ? '1rem' : '5rem', 
        border: '1px solid rgba(255,255,255,0.05)', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', 
        cursor: isThumbnail ? 'pointer' : 'default', 
        overflow: 'hidden' 
    }}>
        <div style={{ 
            position: 'absolute', 
            top: isThumbnail ? '0.5rem' : '1.5rem', 
            right: isThumbnail ? '0.5rem' : '2.5rem', 
            ...S.badge(COLORS.accent), 
            color: 'white', 
            backgroundColor: 'rgba(99,102,241,0.2)', 
            border: 'none', 
            fontSize: '13px' 
        }}>PAGE {pageNumber}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '0.5rem' : '1.5rem' }}>
            <div style={{ height: isThumbnail ? '4px' : '20px', backgroundColor: 'rgba(99,102,241,0.2)', width: '60%', borderRadius: '4px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '2px' : '0.75rem' }}>
                {[80, 95, 88, 70, 40].map((w, i) => (
                    <div key={i} style={{ height: isThumbnail ? '2px' : '10px', backgroundColor: 'rgba(255,255,255,0.03)', width: `${w}%`, borderRadius: '2px' }} />
                ))}
            </div>
            <div style={{ height: isThumbnail ? '4px' : '16px', backgroundColor: 'rgba(99,102,241,0.1)', width: '40%', borderRadius: '4px', marginTop: isThumbnail ? '4px' : '2rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: isThumbnail ? '2px' : '0.75rem' }}>
                {[90, 85, 95, 60].map((w, i) => (
                    <div key={i} style={{ height: isThumbnail ? '2px' : '10px', backgroundColor: 'rgba(255,255,255,0.03)', width: `${w}%`, borderRadius: '2px' }} />
                ))}
            </div>
        </div>

        {!isThumbnail && placedFields.filter((f: any) => f.page === pageNumber).map((f: any) => {
            const colorMap: any = { 
                'Participant Signature': COLORS.success, 
                'Participant Date': COLORS.info, 
                'Participant Initials': COLORS.warning, 
                'CC Signature': COLORS.accent, 
                'Witness Signature': '#a855f7', 
                'PI Verification': '#f43f5e' 
            };
            const isSigned = signedFields.includes(f.type);
            return (
                <div 
                    key={f.id} 
                    style={{ 
                        position: 'absolute', top: `${f.y}%`, left: `${f.x}%`, transform: 'translate(-50%, -50%)',
                        border: `2px ${isSigned ? 'solid' : 'dashed'} ${colorMap[f.type] || COLORS.label}`,
                        backgroundColor: isSigned ? `${colorMap[f.type]}15` : 'transparent',
                        padding: '0.6rem 1.2rem', borderRadius: '4px', color: colorMap[f.type] || COLORS.label, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'
                    }}
                >
                    {isSigned ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontFamily: 'cursive', fontSize: '18px', marginBottom: '4px' }}>{participantId || 'Signed'}</div>
                            <div style={{ fontSize: '8px', opacity: 0.7 }}>{new Date().toLocaleDateString()}</div>
                        </div>
                    ) : `[${f.type}]`}
                </div>
            );
        })}
    </div>
);
