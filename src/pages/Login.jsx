import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin@aquatics.gov');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Please enter your operator username or email.'); return; }
    if (!password) { setError('Password cannot be blank.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate auth
    const ok = login(username.trim(), password);
    setLoading(false);
    if (ok) {
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid credentials. Use: admin@aquatics.gov / any 4+ char password');
    }
  }

  return (
    <div className="login-shell">
      {/* Top bar */}
      <div className="login-topbar">
        <div className="login-topbar-left">
          <div className="sidebar-dots">
            <span className="sidebar-dot red" /><span className="sidebar-dot yellow" /><span className="sidebar-dot green" />
          </div>
          <span style={{ width: 1, height: 16, background: 'var(--color-outline-variant)', marginLeft: 8 }} />
          <span className="text-label-xs" style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 8 }}>PoolDesk v2.4</span>
        </div>
        <div className="login-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-secondary)' }}>lock</span>
          <span className="text-label-xs" style={{ color: 'var(--color-text-secondary)' }}>PoolDesk v2.4 — Authorized Access</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'block' }} />
            <span className="text-label-xs" style={{ color: 'var(--color-on-surface)' }}>Offline / Ready</span>
          </div>
        </div>
      </div>

      {/* Main body: 7/5 split */}
      <div className="login-body">
        {/* Left: brand + visual */}
        <div className="login-brand">
          {/* Logo row */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-on-primary)' }}>waves</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="text-headline-lg" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>PoolDesk</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--color-surface-container)', fontSize: 11, fontWeight: 600, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Facility Desktop Client • v2.4
                </span>
              </div>
              <div className="login-tagline">Municipal & Private Aquatics Infrastructure Suite</div>
            </div>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-headline-xl" style={{ color: 'var(--color-text-primary)', maxWidth: 480, lineHeight: 1.2 }}>
              Your pool. Your operations.{' '}
              <span style={{ color: 'var(--color-secondary)' }}>One place.</span>
            </h1>
            <p className="text-body-lg" style={{ color: 'var(--color-text-secondary)', marginTop: 12, maxWidth: 440, lineHeight: 1.6 }}>
              Manage admissions, swimming passes, pool occupancy, and daily collections with ease.
            </p>
          </div>

          {/* Lane visualizer */}
          <div className="login-visualizer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-secondary)', display: 'block' }} />
                Live Lane Infrastructure
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-secondary)', background: 'var(--color-surface-container)', padding: '2px 8px', borderRadius: 4 }}>6 of 8 Lanes Available</span>
            </div>
            <div style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 8, height: 96, padding: 8, overflow: 'hidden' }}>
              <svg width="100%" height="100%" viewBox="0 0 500 80" fill="none" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="500" y2="20" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4"/>
                <line x1="0" y1="40" x2="500" y2="40" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4"/>
                <line x1="0" y1="60" x2="500" y2="60" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4"/>
                <path d="M0 25 C120 15, 180 35, 300 25 C400 15, 450 30, 500 25" stroke="#93C5FD" strokeWidth="2" opacity="0.6"/>
                <path d="M0 45 C100 55, 220 35, 340 45 C420 55, 470 40, 500 45" stroke="#3B82F6" strokeWidth="2.5" opacity="0.8"/>
                <path d="M0 65 C80 58, 200 72, 310 62 C410 55, 460 68, 500 65" stroke="#CBD5E1" strokeWidth="1.5" opacity="0.7"/>
              </svg>
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'block' }} />Main Basin: 28°C
              </span>
              <span>Turnstile Sync: Real-time</span>
              <span>Water Treatment: Optimal</span>
            </div>
          </div>

          {/* Feature pills */}
          <div className="login-pills">
            <div className="login-pill"><span className="material-symbols-outlined">pool</span>Lane & Pass Tracking</div>
            <div className="login-pill"><span className="material-symbols-outlined">print</span>Instant Receipt Printing</div>
            <div className="login-pill"><span className="material-symbols-outlined">analytics</span>Revenue Reports</div>
          </div>

          {/* Terminal info */}
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', gap: 16 }}>
            <span>Terminal ID: POS-CENTRAL-01</span>
            <span>•</span>
            <span>Database: Embedded (Demo)</span>
            <span>•</span>
            <span>Station Mode: Primary Kiosk</span>
          </div>
        </div>

        {/* Right: Login card */}
        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-card-title">Welcome back</div>
              <div className="login-card-sub">Sign in to access your owner dashboard.</div>
            </div>

            {/* Error alert */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate id="login-form">
              {/* Username */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="username-input">Operator Username or Email</label>
                <div className="form-input-icon">
                  <span className="material-symbols-outlined icon-left">badge</span>
                  <input
                    id="username-input"
                    type="text"
                    className="form-input"
                    placeholder="owner@pooldesk.local or username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="password-input">Master Password</label>
                <div className="form-input-icon" style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined icon-left">lock</span>
                  <input
                    id="password-input"
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingLeft: 36, paddingRight: 40, fontFamily: showPwd ? 'inherit' : 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: 2 }}
                    aria-label="Toggle password visibility"
                    id="toggle-password-btn"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{showPwd ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Remember + reset */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)', width: 14, height: 14 }} />
                  Remember terminal session
                </label>
                <button type="button" style={{ fontSize: 12, color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Terminal Reset Help
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
                id="sign-in-btn"
                style={{ width: '100%', height: 42, borderRadius: 8 }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Signing In…</>
                ) : (
                  <><span>Sign In</span><span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span></>
                )}
              </button>
            </form>

            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 16 }}>
              Authorized personnel only • Strictly for facility operators and receptionists
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
