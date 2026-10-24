import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, PassTypeBadge, PaymentBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Receipt from '../components/ui/Receipt';
import { formatTime, formatRemaining, formatINR, formatDateTime, calculateExpiry } from '../utils/formatters';
import { PASS_TYPES, PAYMENT_METHODS } from '../services/mockData';

function CountdownCell({ expiryTime }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = formatRemaining(expiryTime);
  const now = new Date();
  const exp = new Date(expiryTime);
  const minLeft = (exp - now) / 60000;
  const isExpired = exp <= now;
  const isUrgent = !isExpired && minLeft <= 5;
  const isWarning = !isExpired && minLeft <= 10;
  return (
    <span className={`timer-text${isExpired ? ' text-error' : isUrgent ? ' timer-urgent' : isWarning ? ' timer-warning' : ''}`}>
      {remaining}
    </span>
  );
}

export default function ActiveSwimmers() {
  const { registrations, checkoutRegistration, cancelRegistration, updateRegistration, addToast } = useApp();
  const [, forceUpdate] = useState(0);
  const [poolFilter, setPoolFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutConfirm, setCheckoutConfirm] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [extendOpen, setExtendOpen] = useState(null);
  const [extendType, setExtendType] = useState('hourly');
  const [extendPayment, setExtendPayment] = useState('cash');
  const [receiptOpen, setReceiptOpen] = useState(null);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  // All registrations with status 'active' (includes expired-awaiting-checkout)
  const activeRegs = registrations.filter(r => r.status === 'active');

  // Filter
  const pools = ['All', 'Pool A', 'Pool B', 'Pool C'];
  const filtered = activeRegs.filter(r => {
    if (poolFilter !== 'All' && r.pool !== poolFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.passId.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort: expiring soonest first
  const sorted = [...filtered].sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));

  function handleCheckout(reg) {
    checkoutRegistration(reg.id);
    setCheckoutConfirm(null);
    addToast(`${reg.name} checked out from ${reg.pool}`, 'success');
    setDetailOpen(false);
  }

  function handleCancel(reg) {
    if (!cancelReason.trim()) { addToast('Please provide a cancellation reason.', 'error'); return; }
    cancelRegistration(reg.id, cancelReason);
    setCancelConfirm(null);
    setCancelReason('');
    addToast(`Pass cancelled for ${reg.name}`, 'info');
    setDetailOpen(false);
  }

  function handleExtend(reg) {
    const newExpiry = calculateExpiry(new Date().toISOString(), extendType);
    const addAmount = PASS_TYPES[extendType].price;
    updateRegistration(reg.id, {
      expiryTime: newExpiry,
      extensionHistory: [...(reg.extensionHistory || []), {
        type: extendType === 'hourly' ? 'Hourly Extension' : 'Full-Day Upgrade',
        time: new Date().toISOString(),
        amount: addAmount,
        paymentMethod: extendPayment,
      }],
    });
    setExtendOpen(null);
    addToast(`Pass extended for ${reg.name} — ${PASS_TYPES[extendType].label}`, 'success');
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>home</span>
            <span>›</span>
            <span>All Active Swimmers</span>
          </div>
          <h1 className="page-title">All Active Swimmers</h1>
          <div className="page-subtitle">{activeRegs.length} swimmer{activeRegs.length !== 1 ? 's' : ''} currently in pools</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="header-chip">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
            <span>Auto-refresh: 30s</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: '1 1 260px', maxWidth: 360 }}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search by name, phone, or pass ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="active-search"
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          )}
        </div>
        <div className="filter-tabs">
          {pools.map(p => (
            <button key={p} className={`filter-tab${poolFilter === p ? ' active' : ''}`} onClick={() => setPoolFilter(p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="material-symbols-outlined">pool</span>
            <div className="empty-state-title">No active swimmers found</div>
            <div className="empty-state-sub">{search || poolFilter !== 'All' ? 'Try adjusting your search or filter.' : 'No swimmers are currently in the pool.'}</div>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Pass ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Pool</th>
                <th>Pass Type</th>
                <th>Entry Time</th>
                <th>Expires At</th>
                <th>Time Remaining</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
                const exp = new Date(r.expiryTime);
                const isExpiredAwait = exp <= now;
                return (
                  <tr key={r.id} style={isExpiredAwait ? { background: '#fff7f7' } : {}}>
                    <td className="monospace" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.passId}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ fontSize: 13 }}>{r.phone}</td>
                    <td>{r.pool}</td>
                    <td><PassTypeBadge passType={r.passType} /></td>
                    <td className="monospace">{formatTime(r.entryTime)}</td>
                    <td className="monospace">{formatTime(r.expiryTime)}</td>
                    <td><CountdownCell expiryTime={r.expiryTime} /></td>
                    <td><StatusBadge status={r.status} expiryTime={r.expiryTime} /></td>
                    <td><PaymentBadge method={r.paymentMethod} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(r); setDetailOpen(true); }} title="View Details">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                        </button>
                        {!isExpiredAwait && (
                          <button className="btn btn-accent btn-sm" onClick={() => setExtendOpen(r)} title="Extend Pass">
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>more_time</span>
                          </button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => setCheckoutConfirm(r)} title="Checkout" id={`checkout-btn-${r.id}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>logout</span>
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setCancelConfirm(r); setCancelReason(''); }} title="Cancel Pass">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Pass Details" size="sm">
        {selected && (
          <div>
            <div className="info-list">
              <div className="info-row"><span className="label">Pass ID</span><span className="value monospace" style={{ fontFeatureSettings: '"tnum"' }}>{selected.passId}</span></div>
              <div className="info-row"><span className="label">Name</span><span className="value">{selected.name}</span></div>
              <div className="info-row"><span className="label">Phone</span><span className="value">{selected.phone}</span></div>
              <div className="info-row"><span className="label">Pool</span><span className="value">{selected.pool}</span></div>
              <div className="info-row"><span className="label">Pass Type</span><span className="value"><PassTypeBadge passType={selected.passType} /></span></div>
              <div className="info-row"><span className="label">Status</span><span className="value"><StatusBadge status={selected.status} expiryTime={selected.expiryTime} /></span></div>
              <div className="info-row"><span className="label">Entry</span><span className="value">{formatDateTime(selected.entryTime)}</span></div>
              <div className="info-row"><span className="label">Expires</span><span className="value">{formatDateTime(selected.expiryTime)}</span></div>
              <div className="info-row"><span className="label">Time Left</span><span className="value"><CountdownCell expiryTime={selected.expiryTime} /></span></div>
              <div className="info-row"><span className="label">Amount</span><span className="value amount">{formatINR(selected.amount)}</span></div>
              <div className="info-row"><span className="label">Payment</span><span className="value"><PaymentBadge method={selected.paymentMethod} /></span></div>
            </div>
            {selected.extensionHistory?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Extension History</div>
                {selected.extensionHistory.map((ext, i) => (
                  <div key={i} className="info-row" style={{ fontSize: 12 }}>
                    <span className="label">{ext.type} · {formatTime(ext.time)}</span>
                    <span className="value">{formatINR(ext.amount)} · {ext.paymentMethod}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-md" onClick={() => { setReceiptOpen(selected); setDetailOpen(false); }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>Print Receipt
              </button>
              <button className="btn btn-primary btn-md" onClick={() => { setCheckoutConfirm(selected); setDetailOpen(false); }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>Checkout
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Extend Modal */}
      <Modal open={!!extendOpen} onClose={() => setExtendOpen(null)} title="Extend / Upgrade Pass" size="sm">
        {extendOpen && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Extending pass for <strong>{extendOpen.name}</strong> — {extendOpen.pool}
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
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Payment Method</label>
              <div className="radio-group">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.value} className={`radio-option${extendPayment === pm.value ? ' selected' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                    <input type="radio" name="extendPayment" value={pm.value} checked={extendPayment === pm.value} onChange={() => setExtendPayment(pm.value)} style={{ display: 'none' }} />
                    <span>{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="info-row" style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
              <span>Additional Charge</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatINR(PASS_TYPES[extendType].price)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-md" onClick={() => setExtendOpen(null)}>Cancel</button>
              <button className="btn btn-accent btn-md" onClick={() => handleExtend(extendOpen)} id="confirm-extend-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_time</span>
                Extend Pass
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
        message={`Check out ${checkoutConfirm?.name} from ${checkoutConfirm?.pool}? This will release their pool capacity.`}
        confirmLabel="Checkout"
        variant="warning"
      />

      {/* Cancel confirm */}
      <Modal open={!!cancelConfirm} onClose={() => { setCancelConfirm(null); setCancelReason(''); }} title="Cancel Pass" size="sm">
        {cancelConfirm && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Cancelling pass for <strong>{cancelConfirm.name}</strong> — {cancelConfirm.passId}
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="cancel-reason">Cancellation Reason *</label>
              <textarea id="cancel-reason" className="form-textarea" placeholder="Enter reason for cancellation…" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            </div>
            <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
              <span>The billing record will be retained for audit. This is a soft cancellation.</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-md" onClick={() => { setCancelConfirm(null); setCancelReason(''); }}>Back</button>
              <button className="btn btn-danger btn-md" onClick={() => handleCancel(cancelConfirm)} id="confirm-cancel-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                Cancel Pass
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt modal */}
      <Modal open={!!receiptOpen} onClose={() => setReceiptOpen(null)} title="Pass Receipt" size="sm">
        <Receipt registration={receiptOpen} onClose={() => setReceiptOpen(null)} />
      </Modal>
    </>
  );
}
