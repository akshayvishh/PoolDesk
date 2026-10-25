import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 'var(--space-xl)' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--color-text-secondary)' }}>search_off</span>
      </div>
      <h1 className="text-headline-lg" style={{ color: 'var(--color-text-primary)', marginBottom: 8 }}>
        404 — Page Not Found
      </h1>
      <p className="text-body-md" style={{ color: 'var(--color-text-secondary)', maxWidth: 440, marginBottom: 24, lineHeight: 1.5 }}>
        The route you requested does not exist or has been relocated within PoolDesk Aquatics Core.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Go Back
        </button>
        <button className="btn btn-primary btn-md" onClick={() => navigate('/dashboard')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>space_dashboard</span>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
