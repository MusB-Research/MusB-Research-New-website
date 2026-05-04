import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface TokenInfo {
  email: string;
  role: string;
  organization: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pwErrors, setPwErrors] = useState<string[]>([]);

  // Validate token by looking up the invitation details
  useEffect(() => {
    if (!token) {
      setTokenError('No invitation token found in the link. Please check your email.');
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/invitations/verify/?token=${token}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        setTokenInfo({
          email: data.email,
          role: data.role,
          organization: data.organization
        });
        setLoading(false);
      })
      .catch(err => {
        setTokenError('This invitation link is invalid or has already been used.');
        setLoading(false);
      });
  }, [token]);

  const validatePassword = (pw: string) => {
    const errors: string[] = [];
    if (pw.length < 10) errors.push('At least 10 characters');
    if (!/[A-Z]/.test(pw)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pw)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pw)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('One special character');
    setPwErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!validatePassword(password)) return setError('Password does not meet requirements.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/setup-credentials/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password, full_name: fullName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to set up your account. The link may have expired.');
        setSubmitting(false);
        return;
      }

      // Account created — now auto-login
      // We don't have temp credentials here, redirect to sign-in with a success message
      navigate('/signin?invited=1', { replace: true });
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={{ color: '#f87171', marginBottom: 8 }}>Invalid Link</h2>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>{tokenError}</p>
          <button style={styles.btnPrimary} onClick={() => navigate('/signin')}>Back to Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <img src="/logo.jpg" alt="MusB Research" style={{ height: 50, objectFit: 'contain', margin: '0 auto 12px', display: 'block', borderRadius: 8 }} />
          <div style={styles.logo}>MusB Research</div>
          <div style={styles.tagline}>Clinical Operations Program</div>
        </div>

        <div style={{ padding: '32px 36px 36px' }}>
          <h1 style={styles.title}>Accept Your Invitation</h1>
          <p style={styles.subtitle}>
            You've been invited to join{' '}
            <strong style={{ color: '#10b981' }}>
              {tokenInfo?.organization || 'MusB Research'}
            </strong>
            {tokenInfo?.role ? ` as a ${tokenInfo.role}` : ''}.
            <br />Set your password below to activate your account.
          </p>

          {tokenInfo?.email && (
            <div style={styles.emailBadge}>
              <span style={{ opacity: 0.6, fontSize: 12 }}>Registering as</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{tokenInfo.email}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            {/* Full Name */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
                style={styles.input}
              />
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Create Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); validatePassword(e.target.value); }}
                  placeholder="Min 10 chars, with symbols"
                  required
                  style={{ ...styles.input, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength hints */}
              {password.length > 0 && (
                <div style={styles.pwHints}>
                  {['At least 10 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'].map(rule => (
                    <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: pwErrors.includes(rule) ? '#f87171' : '#10b981', fontSize: 13 }}>
                        {pwErrors.includes(rule) ? '✗' : '✓'}
                      </span>
                      <span style={{ fontSize: 12, color: pwErrors.includes(rule) ? '#f87171' : '#10b981' }}>
                        {rule}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                style={{
                  ...styles.input,
                  borderColor: confirmPassword && confirmPassword !== password ? '#f87171' : undefined
                }}
              />
            </div>

            {error && (
              <div style={styles.errorBanner}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ ...styles.btnPrimary, width: '100%', marginTop: 8 }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={styles.smallSpinner} />
                  Activating Account…
                </span>
              ) : (
                '✓ Activate My Account'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#64748b' }}>
            Already have an account?{' '}
            <span
              onClick={() => navigate('/signin')}
              style={{ color: '#10b981', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#060c1a',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: '-20%',
    left: '-10%',
    width: 500,
    height: 500,
    background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: 400,
    height: 400,
    background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  card: {
    background: '#0b1120',
    border: '1px solid #1e2d45',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    padding: '28px 36px 24px',
    textAlign: 'center',
  },
  logo: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#10b981',
  },
  tagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: '#ffffff',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 1.7,
    margin: 0,
  },
  emailBadge: {
    marginTop: 16,
    background: '#111827',
    border: '1px solid #1e2d45',
    borderRadius: 10,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    background: '#111827',
    border: '1px solid #1e2d45',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    color: '#e2e8f0',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
  },
  pwHints: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: '#0d1525',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #1e2d45',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#f87171',
    fontSize: 13,
    marginBottom: 12,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '13px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'opacity 0.2s',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: 'block',
    textAlign: 'center',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #1e2d45',
    borderTop: '3px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  smallSpinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
