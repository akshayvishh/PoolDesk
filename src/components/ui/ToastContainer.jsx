import React from 'react';
import { useApp } from '../../context/AppContext';

const ICONS = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} role="alert">
          <div className={`toast-icon ${t.type}`}>
            <span className="material-symbols-outlined">{ICONS[t.type] || 'info'}</span>
          </div>
          <div style={{ flex: 1, fontSize: 13 }}>{t.message}</div>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
