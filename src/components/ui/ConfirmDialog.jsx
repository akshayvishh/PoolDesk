import React from 'react';

/**
 * ConfirmDialog — danger/warning confirmation modal
 * Props: open, onClose, onConfirm, title, message, confirmLabel, variant ('danger'|'warning')
 */
export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal modal-sm">
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: 'var(--space-xl)' }}>
          <div className={`confirm-icon-wrap ${variant}`}>
            <span className="material-symbols-outlined">
              {variant === 'danger' ? 'delete_forever' : 'warning'}
            </span>
          </div>
          <h2 id="confirm-title" className="text-headline-sm" style={{ marginBottom: 8 }}>{title}</h2>
          {message && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>{message}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-md" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn btn-${variant === 'danger' ? 'danger' : 'warning'} btn-md`}
            onClick={onConfirm}
            disabled={loading}
            id="confirm-action-btn"
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />{confirmLabel}</>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
