export const COLORS = {
    bg: '#0B101B',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    text: '#94a3b8',
    label: '#475569',
    glass: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
};

export const S = {
    panel: {
        display: 'flex', flexDirection: 'column' as const, height: '100vh', width: '100%',
        backgroundColor: COLORS.bg, color: 'white', overflow: 'hidden', position: 'relative' as const
    },
    header: {
        padding: '1.5rem 3rem', backgroundColor: 'rgba(7, 10, 19, 0.8)',
        backdropFilter: 'blur(40px)', borderBottom: `1px solid ${COLORS.accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100
    },
    tabBar: {
        display: 'flex', gap: '0.5rem', padding: '0.75rem 3rem',
        backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${COLORS.border}`,
        overflowX: 'auto' as const, scrollbarWidth: 'none' as const
    },
    tab: (active: boolean) => ({
        padding: '0.6rem 1.25rem', borderRadius: '100px', fontSize: '11px', fontWeight: 900,
        textTransform: 'uppercase' as const, letterSpacing: '0.15em', cursor: 'pointer',
        transition: 'all 0.2s', backgroundColor: active ? COLORS.accent : 'transparent',
        color: active ? 'white' : COLORS.text, border: `1px solid ${active ? COLORS.accent : 'transparent'}`
    }),
    card: {
        backgroundColor: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)',
        border: `1px solid ${COLORS.border}`, borderRadius: '1rem', padding: '1.5rem'
    },
    label: {
        fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const,
        letterSpacing: '0.15em', color: COLORS.label, marginBottom: '0.5rem', display: 'block'
    },
    name: { fontSize: '18px', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' as const, color: 'white' },
    body: { fontSize: '13px', color: COLORS.text, lineHeight: '1.6' },
    btnPrimary: {
        backgroundColor: COLORS.accent, color: 'white', border: 'none',
        padding: '0.8rem 1.5rem', borderRadius: '6px', fontSize: '12px', fontWeight: 900,
        textTransform: 'uppercase' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
    },
    btnGhost: {
        backgroundColor: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.border}`,
        padding: '0.8rem 1.5rem', borderRadius: '6px', fontSize: '12px', fontWeight: 900,
        textTransform: 'uppercase' as const, cursor: 'pointer'
    },
    stickyBottom: {
        position: 'fixed' as const, bottom: 0, left: '320px', right: '240px',
        padding: '1rem 3rem', backgroundColor: 'rgba(7, 10, 19, 0.9)',
        backdropFilter: 'blur(40px)', borderTop: `1px solid ${COLORS.border}`,
        display: 'flex', gap: '1rem', zIndex: 10
    },
    rightSummary: {
        width: '240px', borderLeft: `1px solid ${COLORS.border}`,
        padding: '2rem 1.5rem', backgroundColor: 'rgba(255,255,255,0.01)',
        display: 'flex', flexDirection: 'column' as const, gap: '2rem', flexShrink: 0,
        overflowY: 'auto' as const
    },
    title: { fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '1rem' },
    badge: (color: string) => ({
        padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '10px', fontWeight: 900 as const,
        backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40`, textTransform: 'uppercase' as const
    })
} as Record<string, any>;
