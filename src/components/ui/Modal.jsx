import React from 'react';

/**
 * Modal — generic modal wrapper
 * Props: open, onClose, title, size ('sm'|'md'|'lg'), children, footer
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  if (!open) return null;

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h2 id="modal-title" className="text-headline-sm">{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
