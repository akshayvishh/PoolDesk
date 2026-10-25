import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge, PassTypeBadge, PaymentBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Receipt from '../components/ui/Receipt';
import { formatTime, formatDateTime, formatINR, formatPhone, calculateExpiry } from '../utils/formatters';
import { PASS_TYPES, PAYMENT_METHODS } from '../services/mockData';

export default function Records() {
  const { registrations, checkoutRegistration, cancelRegistration, updateRegistration, addToast } = useApp();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [poolFilter, setPoolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [passTypeFilter, setPassTypeFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Modals
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [receiptRecord, setReceiptRecord] = useState(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendType, setExtendType] = useState('hourly');
  const [extendPayment, setExtendPayment] = useState('cash');

  // Filtered registrations
  const now = new Date();
  const filtered = registrations.filter(r => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q);
      const matchPhone = r.phone.includes(q);
      const matchPass = r.passId.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchPass) return false;
    }

    // Pool
    if (poolFilter !== 'All' && r.pool !== poolFilter) return false;

    // Pass Type
    if (passTypeFilter !== 'All' && r.passType !== passTypeFilter) return false;

    // Payment Method
    if (paymentFilter !== 'All' && r.paymentMethod !== paymentFilter) return false;

    // Status filter
    if (statusFilter !== 'All') {
      const exp = new Date(r.expiryTime);
      const isExpired = exp <= now;
      const minLeft = (exp - now) / 60000;

      if (statusFilter === 'active') {
        if (r.status !== 'active' || isExpired) return false;
      } else if (statusFilter === 'expiring_soon') {
        if (r.status !== 'active' || isExpired || minLeft > 10) return false;
      } else if (statusFilter === 'expired_awaiting_checkout') {
        if (r.status !== 'active' || !isExpired) return false;
      } else if (statusFilter === 'completed') {
        if (r.status !== 'completed') return false;
      } else if (statusFilter === 'cancelled') {
        if (r.status !== 'cancelled') return false;
      }
    }

    return true;
  });

  // Summary Metrics
  const totalCount = registrations.length;
  const activeInWater = registrations.filter(r => r.status === 'active').length;
  const checkedOutCount = registrations.filter(r => r.status === 'completed').length;
  const cancelledCount = registrations.filter(r => r.status === 'cancelled').length;

  function resetFilters() {
    setSearch('');
    setPoolFilter('All');
    setStatusFilter('All');
    setPassTypeFilter('All');
    setPaymentFilter('All');
  }

  function handleCheckout(reg) {
    checkoutRegistration(reg.id);
    setCheckoutConfirm(null);
    if (selectedRecord?.id === reg.id) {
      setSelectedRecord(prev => prev ? { ...prev, status: 'completed', checkoutTime: new Date().toISOString() } : null);
    }
    addToast(`${reg.name} checked out from ${reg.pool}`, 'success');
  }

  function handleCancelSubmit() {
    if (!cancelReason.trim()) {
      addToast('Please provide a reason for cancellation.', 'error');
      return;
    }
    cancelRegistration(cancelTarget.id, cancelReason.trim());
    addToast(`Pass cancelled for ${cancelTarget.name}`, 'info');
    if (selectedRecord?.id === cancelTarget.id) {
      setSelectedRecord(prev => prev ? { ...prev, status: 'cancelled', cancelReason: cancelReason.trim(), cancelledAt: new Date().toISOString() } : null);
    }
    setCancelTarget(null);
    setCancelReason('');
  }

  function handleExtendSubmit() {
    const newExpiry = calculateExpiry(new Date().toISOString(), extendType);
    const addedAmount = PASS_TYPES[extendType].price;
    const historyItem = {
      type: extendType === 'hourly' ? 'Hourly Extension' : 'Full-Day Upgrade',
      time: new Date().toISOString(),
      amount: addedAmount,
      paymentMethod: extendPayment,
    };

    updateRegistration(extendTarget.id, {
      expiryTime: newExpiry,
      extensionHistory: [...(extendTarget.extensionHistory || []), historyItem],
    });

    if (selectedRecord?.id === extendTarget.id) {
      setSelectedRecord(prev => prev ? {
        ...prev,
        expiryTime: newExpiry,
        extensionHistory: [...(prev.extensionHistory || []), historyItem],
      } : null);
    }

    setExtendTarget(null);
    addToast(`Pass extended for ${extendTarget.name} (${PASS_TYPES[extendType].label})`, 'success');
  }

  function exportCSV() {
    if (filtered.length === 0) {
      addToast('No records to export.', 'warning');
      return;
    }

    const headers = ['Pass ID', 'Customer Name', 'Phone', 'Pool', 'Pass Type', 'Amount (INR)', 'Payment Mode', 'Status', 'Entry Time', 'Expiry Time', 'Checkout Time', 'Cancel Reason'];
    const rows = filtered.map(r => [
      `"${r.passId}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${r.pool}"`,
      `"${r.passType === 'hourly' ? 'Hourly' : 'Full-Day'}"`,
      r.amount,
      `"${r.paymentMethod}"`,
      `"${r.status}"`,
      `"${formatDateTime(r.entryTime)}"`,
      `"${formatDateTime(r.expiryTime)}"`,
      `"${r.checkoutTime ? formatDateTime(r.checkoutTime) : '—'}"`,
      `"${(r.cancelReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PoolDesk_Records_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filtered.length} records to CSV`, 'success');
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>home</span>
            <span>›</span>
            <span>Manage Records</span>
          </div>
          <h1 className="page-title">Manage Records</h1>
          <div className="page-subtitle">Master ledger of swimmer entries, audit logs, and transaction receipts</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={exportCSV} id="export-csv-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="metric-card">
          <div className="metric-label">Total Registrations</div>
          <div className="metric-value">{totalCount}</div>
          <div className="metric-sub">All-time recorded ledger entries</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active in Water</div>
          <div className="metric-value" style={{ color: 'var(--color-secondary)' }}>{activeInWater}</div>
          <div className="metric-sub">Currently occupying pool slots</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Checked Out</div>
          <div className="metric-value" style={{ color: 'var(--color-checkout-text)' }}>{checkedOutCount}</div>
          <div className="metric-sub">Completed sessions released</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cancelled Passes</div>
          <div className="metric-value" style={{ color: 'var(--color-error)' }}>{cancelledCount}</div>
          <div className="metric-sub">Soft-cancelled with audit reason</div>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
          {/* Search Input */}
          <div className="form-input-icon">
            <span className="material-symbols-outlined icon-left">search</span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, phone (+91), or Pass ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="records-search"
            />
          </div>

          {/* Pool filter */}
          <select
            className="form-select"
            value={poolFilter}
            onChange={e => setPoolFilter(e.target.value)}
            id="records-pool-filter"
          >
            <option value="All">All Pools</option>
            <option value="Pool A">Pool A (Olympic)</option>
            <option value="Pool B">Pool B (Children's)</option>
            <option value="Pool C">Pool C (Warm-up)</option>
          </select>

          {/* Status filter */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            id="records-status-filter"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active (Valid)</option>
            <option value="expiring_soon">Expiring Soon (&lt;10m)</option>
            <option value="expired_awaiting_checkout">Expired (In Pool)</option>
            <option value="completed">Completed / Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Pass Type filter */}
          <select
            className="form-select"
            value={passTypeFilter}
            onChange={e => setPassTypeFilter(e.target.value)}
            id="records-type-filter"
          >
            <option value="All">All Pass Types</option>
            <option value="hourly">Hourly Pass (₹150)</option>
            <option value="fullday">Full-Day Pass (₹300)</option>
          </select>

          {/* Payment filter */}
          <select
            className="form-select"
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            id="records-payment-filter"
          >
            <option value="All">All Payments</option>
            <option value="cash">Cash Tender</option>
            <option value="online">Online / UPI</option>
          </select>

          {/* Clear button */}
          <button
            className="btn btn-secondary btn-md"
            onClick={resetFilters}
            title="Reset all filters"
            id="records-clear-filters"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_alt_off</span>
            Reset
          </button>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Showing {filtered.length} of {totalCount} records
          </div>
          <span className="badge badge-neutral">Auto-sync: Active</span>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Pass ID</th>
                <th>Customer</th>
                <th>Pool</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Entry</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8, color: 'var(--color-outline-variant)' }}>folder_open</span>
                    No records matched the selected criteria
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id}>
                    <td className="monospace" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                      {r.passId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{formatPhone(r.phone)}</div>
                    </td>
                    <td>{r.pool}</td>
                    <td><PassTypeBadge passType={r.passType} /></td>
                    <td className="monospace" style={{ fontWeight: 600 }}>{formatINR(r.amount)}</td>
                    <td><PaymentBadge method={r.paymentMethod} /></td>
                    <td className="monospace">{formatTime(r.entryTime)}</td>
                    <td className="monospace">{formatTime(r.expiryTime)}</td>
                    <td><StatusBadge status={r.status} expiryTime={r.expiryTime} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedRecord(r)}
                          title="Inspect Details"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                          Inspect
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReceiptRecord(r)}
                          title="Reprint Receipt"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>receipt</span>
                        </button>
                        {r.status === 'active' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setCheckoutConfirm(r)}
                            title="Checkout Swimmer"
                          >
                            Checkout
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspection / Details Modal */}
      {selectedRecord && (
        <Modal
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Pass Audit: ${selectedRecord.passId}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Status Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface-container-low)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</div>
                <div style={{ marginTop: 4 }}>
                  <StatusBadge status={selectedRecord.status} expiryTime={selectedRecord.expiryTime} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued Amount</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatINR(selectedRecord.amount)}
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="info-list" style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
              <div className="info-row"><span className="label">Customer Full Name</span><span className="value" style={{ fontWeight: 600 }}>{selectedRecord.name}</span></div>
              <div className="info-row"><span className="label">Mobile Number</span><span className="value">{formatPhone(selectedRecord.phone)}</span></div>
              <div className="info-row"><span className="label">Assigned Basin / Pool</span><span className="value">{selectedRecord.pool}</span></div>
              <div className="info-row"><span className="label">Pass Category</span><span className="value">{selectedRecord.passType === 'hourly' ? '1-Hour Standard' : 'Full-Day Unlimited'}</span></div>
              <div className="info-row"><span className="label">Payment Mode</span><span className="value">{selectedRecord.paymentMethod === 'cash' ? 'Cash Tendered' : 'UPI Online Transfer'}</span></div>
              <div className="info-row"><span className="label">Entry Timestamp</span><span className="value monospace">{formatDateTime(selectedRecord.entryTime)}</span></div>
              <div className="info-row"><span className="label">Pass Expiry Time</span><span className="value monospace">{formatDateTime(selectedRecord.expiryTime)}</span></div>
              {selectedRecord.checkoutTime && (
                <div className="info-row"><span className="label">Checkout Timestamp</span><span className="value monospace">{formatDateTime(selectedRecord.checkoutTime)}</span></div>
              )}
              {selectedRecord.cancelReason && (
                <div className="info-row"><span className="label" style={{ color: 'var(--color-error)' }}>Cancellation Reason</span><span className="value" style={{ color: 'var(--color-error)' }}>{selectedRecord.cancelReason}</span></div>
              )}
            </div>

            {/* Extension History (if any) */}
            {selectedRecord.extensionHistory?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Pass Extension & Upgrade Audit
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedRecord.extensionHistory.map((ext, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface-container-low)', borderRadius: 6, fontSize: 13 }}>
                      <span>{ext.type} • {formatDateTime(ext.time)}</span>
                      <span className="monospace" style={{ fontWeight: 600 }}>+{formatINR(ext.amount)} ({ext.paymentMethod})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar inside Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button
                className="btn btn-secondary btn-md"
                onClick={() => {
                  const target = selectedRecord;
                  setReceiptRecord(target);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt</span>
                View Printable Receipt
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedRecord.status === 'active' && (
                  <>
                    <button
                      className="btn btn-warning btn-md"
                      onClick={() => setExtendTarget(selectedRecord)}
                    >
                      Extend Pass
                    </button>
                    <button
                      className="btn btn-danger btn-md"
                      onClick={() => setCancelTarget(selectedRecord)}
                    >
                      Cancel Pass
                    </button>
                    <button
                      className="btn btn-primary btn-md"
                      onClick={() => handleCheckout(selectedRecord)}
                    >
                      Checkout Swimmer
                    </button>
                  </>
                )}
                <button className="btn btn-secondary btn-md" onClick={() => setSelectedRecord(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Pass Extension Modal */}
      {extendTarget && (
        <Modal
          open={!!extendTarget}
          onClose={() => setExtendTarget(null)}
          title={`Extend Pass: ${extendTarget.name}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Select an extension duration or full-day upgrade for pass <strong>{extendTarget.passId}</strong>.
            </p>

            <div className="form-group">
              <label className="form-label">Extension Type</label>
              <div className="radio-group" style={{ flexDirection: 'column' }}>
                <label className={`radio-option${extendType === 'hourly' ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="recordsExtendType"
                    value="hourly"
                    checked={extendType === 'hourly'}
                    onChange={() => setExtendType('hourly')}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Hourly Extension (+1 Hour)</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>₹150 additional charge</div>
                  </div>
                </label>
                <label className={`radio-option${extendType === 'fullday' ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="recordsExtendType"
                    value="fullday"
                    checked={extendType === 'fullday'}
                    onChange={() => setExtendType('fullday')}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Full-Day Upgrade (Until Closing)</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>₹300 additional charge</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div className="radio-group">
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} className={`radio-option${extendPayment === m.value ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="recordsExtendPayment"
                      value={m.value}
                      checked={extendPayment === m.value}
                      onChange={() => setExtendPayment(m.value)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary btn-md" onClick={() => setExtendTarget(null)}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleExtendSubmit}>Apply Extension</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancelTarget && (
        <Modal
          open={!!cancelTarget}
          onClose={() => { setCancelTarget(null); setCancelReason(''); }}
          title={`Cancel Pass: ${cancelTarget.passId}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="alert alert-warning">
              <span className="material-symbols-outlined">warning</span>
              <span>
                Cancelling this pass will release swimmer capacity while permanently retaining the billing record for financial audit.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cancel-reason-input">Reason for Cancellation *</label>
              <textarea
                id="cancel-reason-input"
                className="form-textarea"
                placeholder="e.g. Swimmer requested immediate refund, medical emergency, lightning alert..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary btn-md" onClick={() => { setCancelTarget(null); setCancelReason(''); }}>
                Abort
              </button>
              <button className="btn btn-danger btn-md" onClick={handleCancelSubmit}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Checkout Confirm Dialog */}
      <ConfirmDialog
        open={!!checkoutConfirm}
        onClose={() => setCheckoutConfirm(null)}
        onConfirm={() => handleCheckout(checkoutConfirm)}
        title={`Check out ${checkoutConfirm?.name}?`}
        message={`This will record checkout time for pass ${checkoutConfirm?.passId} and immediately release capacity in ${checkoutConfirm?.pool}.`}
        confirmLabel="Confirm Checkout"
        variant="warning"
      />

      {/* Receipt Modal */}
      {receiptRecord && (
        <Modal
          open={!!receiptRecord}
          onClose={() => setReceiptRecord(null)}
          title="Swimmer Pass Receipt"
          size="sm"
        >
          <Receipt
            registration={receiptRecord}
            onClose={() => setReceiptRecord(null)}
          />
        </Modal>
      )}
    </>
  );
}
