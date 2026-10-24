import React from 'react';
import { formatDate, formatTime, formatINR } from '../../utils/formatters';
import { PASS_TYPES } from '../../services/mockData';

/**
 * Receipt — printable pass receipt
 */
export default function Receipt({ registration, onClose, onPrint }) {
  const pt = PASS_TYPES[registration?.passType] || {};

  function handlePrint() {
    window.print();
    onPrint?.();
  }

  if (!registration) return null;

  return (
    <div>
      {/* Screen version */}
      <div style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px dashed var(--color-border)', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: 'var(--color-primary-container)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-on-primary)' }}>waves</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>PoolDesk</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Swimming Pass Receipt</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {formatDate(registration.createdAt)}, {formatTime(registration.createdAt)}
          </div>
        </div>

        {/* Pass ID */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pass ID</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', fontFeatureSettings: '"tnum"', letterSpacing: '0.05em' }}>
            {registration.passId}
          </div>
        </div>

        {/* Details */}
        <div className="info-list" style={{ marginBottom: 16, padding: '12px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="info-row"><span className="label">Customer Name</span><span className="value">{registration.name}</span></div>
          <div className="info-row"><span className="label">Phone</span><span className="value">{registration.phone}</span></div>
          <div className="info-row"><span className="label">Pool</span><span className="value">{registration.pool}</span></div>
          <div className="info-row"><span className="label">Pass Type</span><span className="value">{pt.label}</span></div>
          <div className="info-row"><span className="label">Entry Time</span><span className="value">{formatTime(registration.entryTime)}</span></div>
          <div className="info-row"><span className="label">Valid Until</span><span className="value" style={{ fontWeight: 700 }}>{formatTime(registration.expiryTime)}</span></div>
          <div className="info-row"><span className="label">Payment</span><span className="value">{registration.paymentMethod === 'cash' ? 'Cash' : 'UPI / Online'}</span></div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Amount Paid</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', fontFeatureSettings: '"tnum"' }}>
            {formatINR(registration.amount)}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          <div>Thank you for visiting!</div>
          <div>Please retain this receipt for verification.</div>
          <div style={{ marginTop: 8, fontWeight: 600 }}>Authorized personnel only • PoolDesk v2.4</div>
        </div>

        {/* Extension history */}
        {registration.extensionHistory?.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Extension History</div>
            {registration.extensionHistory.map((ext, i) => (
              <div key={i} className="info-row" style={{ fontSize: 12 }}>
                <span className="label">{ext.type} — {formatTime(ext.time)}</span>
                <span className="value">{formatINR(ext.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }} className="no-print">
        <button className="btn btn-secondary btn-md" onClick={onClose}>Close</button>
        <button className="btn btn-primary btn-md" onClick={handlePrint} id="print-receipt-btn">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
          Print Receipt
        </button>
      </div>
    </div>
  );
}
