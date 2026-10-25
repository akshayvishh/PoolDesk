import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PassTypeBadge, PaymentBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Receipt from '../components/ui/Receipt';
import { formatTime, formatRemaining, formatINR, calculateExpiry } from '../utils/formatters';
import { PASS_TYPES, PAYMENT_METHODS } from '../services/mockData';

function Countdown({ expiryTime }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const now = new Date();
  const exp = new Date(expiryTime);
  const minLeft = (exp - now) / 60000;
  const remaining = formatRemaining(expiryTime);
  const isUrgent = minLeft <= 5;
  return (
    <span className={`timer-text${isUrgent ? ' timer-urgent' : ' timer-warning'}`}>
      {remaining}
    </span>
  );
}

export default function ExpiringSoon() {
  const { registrations, checkoutRegistration, updateRegistration, addToast } = useApp();
  const [, forceUpdate] = useState(0);
  const [extendOpen, setExtendOpen] = useState(null);
  const [extendType, setExtendType] = useState('hourly');
  const [extendPayment, setExtendPayment] = useState('cash');
  const [checkoutConfirm, setCheckoutConfirm] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => {
      forceUpdate(n => n + 1);
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const tenMins = new Date(now.getTime() + 10 * 60 * 1000);
  const expiring = registrations.filter(r =>
    r.status === 'active' &&
    new Date(r.expiryTime) > now &&
    new Date(r.expiryTime) <= tenMins
  ).sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));

  function handleCheckout(reg) {
    checkoutRegistration(reg.id);
    setCheckoutConfirm(null);
    addToast(`${reg.name} checked out from ${reg.pool}`, 'success');
  }

  function handleExtend(reg) {
    const newExpiry = calculateExpiry(new Date().toISOString(), extendType);
    updateRegistration(reg.id, {
      expiryTime: newExpiry,
      extensionHistory: [...(reg.extensionHistory || []), {
        type: extendType === 'hourly' ? 'Hourly Extension' : 'Full-Day Upgrade',
        time: new Date().toISOString(),
        amount: PASS_TYPES[extendType].price,
        paymentMethod: extendPayment,
      }],
    });
    setExtendOpen(null);
    addToast(`Pass extended for ${reg.name}`, 'success');
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>home</span>
            <span>›</span>
            <span>Expiring Soon</span>
          </div>
          <h1 className="page-title">Expiring Soon</h1>
          <div className="page-subtitle">Passes with 10 minutes or less remaining</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="header-chip">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
            <span>Last refreshed: {formatTime(lastRefresh.toISOString())}</span>
          </div>
          <button className="btn btn-secondary btn-md" onClick={() => { forceUpdate(n => n + 1); setLastRefresh(new Date()); }} id="refresh-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Alert banner if any expiring */}
      {expiring.length > 0 && (
        <div className="alert alert-error">
          <span className="material-symbols-outlined">notification_important</span>
          <span><strong>{expiring.length} pass{expiring.length !== 1 ? 'es' : ''}</strong> expiring within 10 minutes. Please notify the swimmers.</span>
        </div>
      )}

      {/* Cards or empty state */}
      {expiring.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="material-symbols-outlined" style={{ color: '#22c55e' }}>check_circle</span>
            <div className="empty-state-title">All clear!</div>
            <div className="empty-state-sub">No passes expiring within the next 10 minutes. Page auto-refreshes every 30 seconds.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
          {expiring.map(r => {
            const exp = new Date(r.expiryTime);
            const minLeft = (exp - now) / 60000;
            const isUrgent = minLeft <= 5;
            return (
              <div
                key={r.id}
                className="card card-sm"
                style={{
                  borderColor: isUrgent ? 'var(--color-error)' : '#fde68a',
                  borderLeftWidth: 4,
                  background: isUrgent ? '#fff7f7' : '#fefce8',
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{r.phone} • {r.pool}</div>
                  </div>
                  <Countdown expiryTime={r.expiryTime} />
                </div>

                {/* Details row */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <PassTypeBadge passType={r.passType} />
                  <PaymentBadge method={r.paymentMethod} />
                </div>

                {/* Info */}
                <div className="info-list" style={{ marginBottom: 14 }}>
                  <div className="info-row" style={{ fontSize: 12 }}>
                    <span className="label">Pass ID</span>
                    <span className="value monospace" style={{ fontFeatureSettings: '"tnum"', fontSize: 11 }}>{r.passId}</span>
                  </div>
                  <div className="info-row" style={{ fontSize: 12 }}>
                    <span className="label">Expires At</span>
                    <span className="value">{formatTime(r.expiryTime)}</span>
                  </div>
                  <div className="info-row" style={{ fontSize: 12 }}>
                    <span className="label">Amount Paid</span>
                    <span className="value amount">{formatINR(r.amount)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-accent btn-sm" onClick={() => { setExtendOpen(r); setExtendType('hourly'); setExtendPayment('cash'); }} style={{ flex: 1 }} id={`extend-btn-${r.id}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>more_time</span>
                    Extend
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setCheckoutConfirm(r)} style={{ flex: 1 }} id={`checkout-btn-${r.id}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>logout</span>
                    Checkout
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setReceiptOpen(r)} title="Print Receipt">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>print</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extend Modal */}
      <Modal open={!!extendOpen} onClose={() => setExtendOpen(null)} title="Extend / Upgrade Pass" size="sm">
        {extendOpen && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Extending pass for <strong>{extendOpen.name}</strong>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Extension Type</label>
              <div className="radio-group">
                {Object.entries(PASS_TYPES).map(([key, pt]) => (
                  <label key={key} className={`radio-option${extendType === key ? ' selected' : ''}`} style={{ flex: 1 }}>
                    <input type="radio" name="extendType" value={key} checked={extendType === key} onChange={() => setExtendType(key)} style={{ display: 'none' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{pt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{pt.description}</div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>{formatINR(pt.price)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Payment Method</label>
              <div className="radio-group">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.value} className={`radio-option${extendPayment === pm.value ? ' selected' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                    <input type="radio" name="extendPay" value={pm.value} checked={extendPayment === pm.value} onChange={() => setExtendPayment(pm.value)} style={{ display: 'none' }} />
                    <span>{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-md" onClick={() => setExtendOpen(null)}>Cancel</button>
              <button className="btn btn-accent btn-md" onClick={() => handleExtend(extendOpen)} id="confirm-extend-expiring-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_time</span>
                Extend — {formatINR(PASS_TYPES[extendType].price)}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout confirm */}
      <ConfirmDialog
        open={!!checkoutConfirm}
        onClose={() => setCheckoutConfirm(null)}
        onConfirm={() => handleCheckout(checkoutConfirm)}
        title="Confirm Checkout"
        message={`Check out ${checkoutConfirm?.name} from ${checkoutConfirm?.pool}?`}
        confirmLabel="Checkout"
        variant="warning"
      />

      {/* Receipt */}
      <Modal open={!!receiptOpen} onClose={() => setReceiptOpen(null)} title="Pass Receipt" size="sm">
        <Receipt registration={receiptOpen} onClose={() => setReceiptOpen(null)} />
      </Modal>
    </>
  );
}
