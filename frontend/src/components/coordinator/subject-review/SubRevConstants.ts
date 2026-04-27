export const COLORS = {
    bg: '#0F172A',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    text: '#94a3b8',
    label: '#64748b',
    border: '#1E293B',
    card: '#0B1221'
};

export const S = {
    panel: {
        display: 'flex', flexDirection: 'column' as const, minHeight: 'calc(100vh - 128px)', width: '100%',
        backgroundColor: COLORS.bg, color: 'white', position: 'relative' as const
    },
    header: {
        padding: '1.25rem 2rem', backgroundColor: '#0B1221',
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 40
    },
    tabBar: {
        display: 'flex', gap: '0.25rem', padding: '0.5rem 2rem',
        backgroundColor: '#0F172A', borderBottom: `1px solid ${COLORS.border}`,
        overflowX: 'auto' as const, scrollbarWidth: 'none' as const
    },
    tab: (active: boolean) => ({
        padding: '0.75rem 1.5rem', fontSize: '12px', fontWeight: 700,
        textTransform: 'uppercase' as const, letterSpacing: '0.05em', cursor: 'pointer',
        transition: 'all 0.2s', backgroundColor: 'transparent',
        color: active ? 'white' : COLORS.text, borderBottom: `2px solid ${active ? COLORS.accent : 'transparent'}`,
        borderLeft: 'none', borderRight: 'none', borderTop: 'none'
    }),
    card: {
        backgroundColor: COLORS.card,
        border: `1px solid ${COLORS.border}`, borderRadius: '0.75rem', padding: '1.25rem'
    },
    label: {
        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const,
        letterSpacing: '0.05em', color: COLORS.label, marginBottom: '0.5rem', display: 'block'
    },
    name: { fontSize: '20px', fontWeight: 700, color: 'white' },
    body: { fontSize: '13px', color: COLORS.text, lineHeight: '1.6' },
    btnPrimary: {
        backgroundColor: COLORS.accent, color: 'white', border: 'none',
        padding: '0.75rem 1.25rem', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
        textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
    },
    btnGhost: {
        backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`,
        padding: '0.75rem 1.25rem', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
        textTransform: 'uppercase' as const, cursor: 'pointer'
    },
    stickyBottom: {
        position: 'fixed' as const, bottom: 0, left: 0, right: 0,
        padding: '1rem 2rem', backgroundColor: '#0B1221',
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex', gap: '1rem', zIndex: 10
    },
    rightSummary: {
        width: '260px', borderLeft: `1px solid ${COLORS.border}`,
        padding: '1.5rem', backgroundColor: '#0B1221',
        display: 'flex', flexDirection: 'column' as const, gap: '2rem', flexShrink: 0,
        overflowY: 'auto' as const
    },
    title: { fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '1rem', color: COLORS.label },
    badge: (color: string) => ({
        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 as const,
        backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30`, textTransform: 'uppercase' as const
    })
} as Record<string, any>;
