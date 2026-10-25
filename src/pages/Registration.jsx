import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import Receipt from '../components/ui/Receipt';
import { formatINR, generatePassId, calculateExpiry } from '../utils/formatters';
import { PASS_TYPES, PAYMENT_METHODS } from '../services/mockData';

const INITIAL = { name: '', phone: '', pool: 'Pool A', passType: 'hourly', paymentMethod: 'cash' };

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Customer name is required.';
  if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit mobile number.';
  return errs;
}

export default function Registration() {
  const { addRegistration, getPoolOccupancy, addToast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const poolOcc = getPoolOccupancy();
  const selectedPool = poolOcc.find(p => p.name === form.pool);
  const poolFull = selectedPool && selectedPool.active >= selectedPool.capacity;
  const passInfo = PASS_TYPES[form.passType];

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (poolFull) { addToast(`${form.pool} is at full capacity. Please choose another pool.`, 'error'); return; }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));

    const now = new Date().toISOString();
    const reg = {
      id: `reg-${Date.now()}`,
      passId: generatePassId(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      pool: form.pool,
      passType: form.passType,
      amount: passInfo.price,
      paymentMethod: form.paymentMethod,
      entryTime: now,
      expiryTime: calculateExpiry(now, form.passType),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      checkoutTime: null,
      cancelReason: null,
      cancelledAt: null,
      extensionHistory: [],
    };

    addRegistration(reg);
    setSubmitting(false);
    setReceipt(reg);
    setReceiptOpen(true);
    setForm(INITIAL);
    setErrors({});
    addToast(`Pass registered for ${reg.name} — ${reg.passId}`, 'success');
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>home</span>
            <span>›</span>
            <span>New Registration</span>
          </div>
          <h1 className="page-title">New Registration</h1>
          <div className="page-subtitle">Register a swimmer and issue a pool pass</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} noValidate id="registration-form">
            {/* Customer details */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Customer Details</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">Full Name *</label>
                  <input
                    id="reg-name"
                    className={`form-input${errors.name ? ' error' : ''}`}
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    autoComplete="name"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">Mobile Number *</label>
                  <input
                    id="reg-phone"
                    className={`form-input${errors.phone ? ' error' : ''}`}
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={e => setField('phone', e.target.value)}
                    maxLength={12}
                    autoComplete="tel"
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>
            </div>

            <hr className="section-divider" style={{ marginBottom: 24 }} />

            {/* Pool selection */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Pool Selection</div>
              <div className="radio-group">
                {poolOcc.map(pool => {
                  const pct = pool.capacity > 0 ? (pool.active / pool.capacity) * 100 : 0;
                  const isFull = pool.active >= pool.capacity;
                  return (
                    <label
                      key={pool.id}
                      className={`radio-option${form.pool === pool.name ? ' selected' : ''}${isFull ? ' disabled' : ''}`}
                      style={{ flex: 1, minWidth: 120, opacity: isFull ? 0.5 : 1, cursor: isFull ? 'not-allowed' : 'pointer' }}
                    >
                      <input type="radio" name="pool" value={pool.name} checked={form.pool === pool.name} onChange={() => !isFull && setField('pool', pool.name)} disabled={isFull} style={{ display: 'none' }} />
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{pool.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{pool.description}</div>
                        <div style={{ marginTop: 6 }}>
                          <div className="occupancy-bar">
                            <div className={`occupancy-fill${pct >= 100 ? ' full' : pct >= 80 ? ' warn' : ''}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div style={{ fontSize: 11, color: isFull ? 'var(--color-error)' : 'var(--color-text-secondary)', marginTop: 3, fontFeatureSettings: '"tnum"' }}>
                            {isFull ? 'Full' : `${pool.active}/${pool.capacity} occupied`}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <hr className="section-divider" style={{ marginBottom: 24 }} />

            {/* Pass type */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Pass Type</div>
              <div className="radio-group">
                {Object.entries(PASS_TYPES).map(([key, pt]) => (
                  <label key={key} className={`radio-option${form.passType === key ? ' selected' : ''}`} style={{ flex: 1 }}>
                    <input type="radio" name="passType" value={key} checked={form.passType === key} onChange={() => setField('passType', key)} style={{ display: 'none' }} />
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{pt.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', fontFeatureSettings: '"tnum"' }}>{formatINR(pt.price)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{pt.description}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-secondary)', marginTop: 4 }}>{pt.duration}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <hr className="section-divider" style={{ marginBottom: 24 }} />

            {/* Payment method */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Payment Method</div>
              <div className="radio-group">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.value} className={`radio-option${form.paymentMethod === pm.value ? ' selected' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                    <input type="radio" name="paymentMethod" value={pm.value} checked={form.paymentMethod === pm.value} onChange={() => setField('paymentMethod', pm.value)} style={{ display: 'none' }} />
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{pm.value === 'cash' ? 'payments' : 'smartphone'}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button type="button" className="btn btn-secondary btn-md" onClick={() => { setForm(INITIAL); setErrors({}); }}>
                Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-md"
                disabled={submitting || poolFull}
                id="submit-registration-btn"
              >
                {submitting ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Processing…</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>Register & Issue Pass</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Summary sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card card-sm">
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>Summary</div>
            <div className="info-list">
              <div className="info-row"><span className="label">Customer</span><span className="value">{form.name || '—'}</span></div>
              <div className="info-row"><span className="label">Phone</span><span className="value">{form.phone || '—'}</span></div>
              <div className="info-row"><span className="label">Pool</span><span className="value">{form.pool}</span></div>
              <div className="info-row"><span className="label">Pass Type</span><span className="value">{passInfo.label}</span></div>
              <div className="info-row"><span className="label">Duration</span><span className="value">{passInfo.duration}</span></div>
              <div className="info-row"><span className="label">Payment</span><span className="value">{form.paymentMethod === 'cash' ? 'Cash' : 'UPI / Online'}</span></div>
              <hr className="section-divider" style={{ margin: '4px 0' }} />
              <div className="info-row"><span className="label" style={{ fontWeight: 600 }}>Total Amount</span><span className="value amount">{formatINR(passInfo.price)}</span></div>
            </div>
          </div>

          {poolFull && (
            <div className="alert alert-error">
              <span className="material-symbols-outlined">error</span>
              <span>{form.pool} is at full capacity. Please select another pool.</span>
            </div>
          )}

          <div className="card card-sm" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>Pass Rules</div>
            <div>• Hourly passes expire exactly 1 hour after entry</div>
            <div>• Full-day passes valid until 10:00 PM closing time</div>
            <div>• Checkout required to release pool capacity</div>
            <div>• Pass ID printed on receipt for verification</div>
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Pass Issued — Receipt" size="sm">
        <Receipt registration={receipt} onClose={() => setReceiptOpen(false)} />
        <div style={{ marginTop: 12, textAlign: 'center', borderTop: '1px dashed var(--color-border)', paddingTop: 12 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setReceiptOpen(false); navigate('/active-swimmers'); }}
            style={{ width: '100%' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pool</span>
            Go to All Active Swimmers
          </button>
        </div>
      </Modal>
    </>
  );
}
