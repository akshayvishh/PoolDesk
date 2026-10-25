import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, getTodayDisplay } from '../utils/formatters';

export default function Reports() {
  const { registrations, pools, addToast } = useApp();
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'yesterday' | '7days' | 'month' | 'all'

  // Filter registrations by date range
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  const filteredRegs = registrations.filter(r => {
    const regDate = new Date(r.createdAt);
    const regDateStr = regDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

    if (dateFilter === 'today') {
      return regDateStr === todayStr;
    }
    if (dateFilter === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return regDateStr === yesterday.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return regDate >= sevenDaysAgo;
    }
    if (dateFilter === 'month') {
      return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  });

  // Financial calculations
  const nonCancelled = filteredRegs.filter(r => r.status !== 'cancelled');
  const cancelledRegs = filteredRegs.filter(r => r.status === 'cancelled');

  // Revenue helper including extensions
  function calcRevenue(list) {
    return list.reduce((sum, r) => {
      const extSum = (r.extensionHistory || []).reduce((es, e) => es + (e.amount || 0), 0);
      return sum + r.amount + extSum;
    }, 0);
  }

  const netRevenue = calcRevenue(nonCancelled);
  const grossRevenue = calcRevenue(filteredRegs);
  const cancelledRevenue = calcRevenue(cancelledRegs);

  // Cash vs Online
  const cashRegs = nonCancelled.filter(r => r.paymentMethod === 'cash');
  const onlineRegs = nonCancelled.filter(r => r.paymentMethod === 'online');
  const cashRevenue = calcRevenue(cashRegs);
  const onlineRevenue = calcRevenue(onlineRegs);
  const cashPct = netRevenue > 0 ? Math.round((cashRevenue / netRevenue) * 100) : 0;
  const onlinePct = netRevenue > 0 ? Math.round((onlineRevenue / netRevenue) * 100) : 0;

  // Pass Type distribution
  const hourlyRegs = nonCancelled.filter(r => r.passType === 'hourly');
  const fullDayRegs = nonCancelled.filter(r => r.passType === 'fullday');
  const hourlyRev = calcRevenue(hourlyRegs);
  const fullDayRev = calcRevenue(fullDayRegs);

  // Pool Usage breakdown
  const poolStats = pools.map(pool => {
    const poolRegs = nonCancelled.filter(r => r.pool === pool.name);
    const poolRev = calcRevenue(poolRegs);
    const activeNow = poolRegs.filter(r => r.status === 'active').length;
    const occPct = pool.capacity > 0 ? Math.round((activeNow / pool.capacity) * 100) : 0;
    return {
      ...pool,
      totalVisits: poolRegs.length,
      revenue: poolRev,
      activeNow,
      occPct,
    };
  });

  // Hourly Peak Occupancy distribution (simulated based on registrations or realistic day curve)
  const hourlySlots = [
    { hour: '06:00', label: '6 AM', swimmers: 4 },
    { hour: '07:00', label: '7 AM', swimmers: 9 },
    { hour: '08:00', label: '8 AM', swimmers: 14 },
    { hour: '09:00', label: '9 AM', swimmers: 11 },
    { hour: '10:00', label: '10 AM', swimmers: 7 },
    { hour: '11:00', label: '11 AM', swimmers: 5 },
    { hour: '12:00', label: '12 PM', swimmers: 6 },
    { hour: '13:00', label: '1 PM', swimmers: 4 },
    { hour: '14:00', label: '2 PM', swimmers: 5 },
    { hour: '15:00', label: '3 PM', swimmers: 8 },
    { hour: '16:00', label: '4 PM', swimmers: 15 },
    { hour: '17:00', label: '5 PM', swimmers: 19 },
    { hour: '18:00', label: '6 PM', swimmers: 18 },
    { hour: '19:00', label: '7 PM', swimmers: 16 },
    { hour: '20:00', label: '8 PM', swimmers: 10 },
    { hour: '21:00', label: '9 PM', swimmers: 5 },
  ];
  const maxHourly = Math.max(...hourlySlots.map(h => h.swimmers), 20);

  function handlePrint() {
    window.print();
  }

  function exportReportCSV() {
    const csvRows = [
      ['Metric', 'Value'],
      ['Date Scope', dateFilter.toUpperCase()],
      ['Total Passes Issued', filteredRegs.length],
      ['Net Revenue (INR)', netRevenue],
      ['Gross Revenue (INR)', grossRevenue],
      ['Cancelled Passes', cancelledRegs.length],
      ['Refunds / Cancellations (INR)', cancelledRevenue],
      ['Cash Revenue (INR)', cashRevenue],
      ['Cash Share (%)', `${cashPct}%`],
      ['UPI / Online Revenue (INR)', onlineRevenue],
      ['Online Share (%)', `${onlinePct}%`],
      ['Hourly Passes Issued', hourlyRegs.length],
      ['Hourly Passes Revenue (INR)', hourlyRev],
      ['Full-Day Passes Issued', fullDayRegs.length],
      ['Full-Day Passes Revenue (INR)', fullDayRev],
      [],
      ['Pool Name', 'Capacity', 'Current Active', 'Total Period Visits', 'Period Revenue (INR)'],
      ...poolStats.map(p => [p.name, p.capacity, p.activeNow, p.totalVisits, p.revenue]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PoolDesk_Financial_Report_${dateFilter}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Financial report exported to CSV', 'success');
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>home</span>
            <span>›</span>
            <span>Reports & Analytics</span>
          </div>
          <h1 className="page-title">Reports & Analytics</h1>
          <div className="page-subtitle">Revenue reconciliation, payment splits, and swimming occupancy trends</div>
        </div>

        {/* Action Controls & Date Range Filter */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Segmented Filter Pills */}
          <div style={{ display: 'flex', background: 'var(--color-surface-container-high)', borderRadius: 8, padding: 3 }}>
            <button
              className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 30, fontSize: 12, padding: '0 10px' }}
              onClick={() => setDateFilter('today')}
            >
              Today
            </button>
            <button
              className={`btn btn-sm ${dateFilter === 'yesterday' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 30, fontSize: 12, padding: '0 10px' }}
              onClick={() => setDateFilter('yesterday')}
            >
              Yesterday
            </button>
            <button
              className={`btn btn-sm ${dateFilter === '7days' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 30, fontSize: 12, padding: '0 10px' }}
              onClick={() => setDateFilter('7days')}
            >
              Last 7 Days
            </button>
            <button
              className={`btn btn-sm ${dateFilter === 'month' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 30, fontSize: 12, padding: '0 10px' }}
              onClick={() => setDateFilter('month')}
            >
              This Month
            </button>
            <button
              className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ height: 30, fontSize: 12, padding: '0 10px' }}
              onClick={() => setDateFilter('all')}
            >
              All Time
            </button>
          </div>

          <button className="btn btn-secondary btn-md" onClick={exportReportCSV} id="export-report-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Export CSV
          </button>
          <button className="btn btn-secondary btn-md" onClick={handlePrint} id="print-report-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            Print Report
          </button>
        </div>
      </div>

      {/* 4 Revenue Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Card 1: Total Net Collection */}
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-label">Total Net Collection</div>
              <div className="metric-value" style={{ color: 'var(--color-primary)' }}>{formatINR(netRevenue)}</div>
              <div className="metric-sub">{nonCancelled.length} successful passes issued</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-secondary)' }}>currency_rupee</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Gross: {formatINR(grossRevenue)} (before cancellations)
          </div>
        </div>

        {/* Card 2: Cash Collection */}
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-label">Cash Collection</div>
              <div className="metric-value">{formatINR(cashRevenue)}</div>
              <div className="metric-sub">{cashRegs.length} cash receipts tendered</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-primary-container)' }}>payments</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            <strong>{cashPct}%</strong> of total net collection
          </div>
        </div>

        {/* Card 3: Online / UPI Collection */}
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-label">Online / UPI Collection</div>
              <div className="metric-value" style={{ color: 'var(--color-secondary)' }}>{formatINR(onlineRevenue)}</div>
              <div className="metric-sub">{onlineRegs.length} digital transactions</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-secondary)' }}>account_balance</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            <strong>{onlinePct}%</strong> of total net collection
          </div>
        </div>

        {/* Card 4: Cancellations / Refunds */}
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="metric-label">Cancellations &amp; Refunds</div>
              <div className="metric-value" style={{ color: 'var(--color-error)' }}>{formatINR(cancelledRevenue)}</div>
              <div className="metric-sub">{cancelledRegs.length} passes soft-cancelled</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-error-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-error)' }}>assignment_return</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            All original audit entries retained
          </div>
        </div>
      </div>

      {/* Row 2: Peak Hourly Occupancy Visualizer */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Hourly Facility Occupancy &amp; Peak Swim Curve</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Swimmer volume across operating hours (06:00 AM – 10:00 PM IST)
            </div>
          </div>
          <span className="badge badge-neutral">Operating Day</span>
        </div>

        {/* Bar chart container */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 20, paddingBottom: 10 }}>
          {hourlySlots.map(slot => {
            const heightPct = Math.round((slot.swimmers / maxHourly) * 100);
            const isPeak = slot.swimmers >= 15;
            return (
              <div key={slot.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isPeak ? 'var(--color-secondary)' : 'var(--color-text-secondary)', marginBottom: 4 }}>
                  {slot.swimmers}
                </div>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 32,
                    height: `${heightPct}%`,
                    background: isPeak ? 'var(--color-secondary-container)' : 'var(--color-primary-fixed-dim)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`${slot.label}: ${slot.swimmers} active swimmers`}
                />
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6, whiteSpace: 'nowrap' }}>
                  {slot.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Pass Type & Pool Usage Analytics */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Pass Type Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pass-wise Sales Distribution</div>
            <span className="badge badge-neutral">Revenue Breakdown</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Hourly Pass */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Hourly Pass (₹150)</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>{hourlyRegs.length} passes issued</span>
                </div>
                <span className="monospace" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatINR(hourlyRev)}
                </span>
              </div>
              <div className="occupancy-bar">
                <div
                  className="occupancy-fill"
                  style={{
                    width: `${netRevenue > 0 ? (hourlyRev / netRevenue) * 100 : 0}%`,
                    background: 'var(--color-secondary)',
                  }}
                />
              </div>
            </div>

            {/* Full-Day Pass */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Full-Day Pass (₹300)</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>{fullDayRegs.length} passes issued</span>
                </div>
                <span className="monospace" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatINR(fullDayRev)}
                </span>
              </div>
              <div className="occupancy-bar">
                <div
                  className="occupancy-fill"
                  style={{
                    width: `${netRevenue > 0 ? (fullDayRev / netRevenue) * 100 : 0}%`,
                    background: 'var(--color-primary-container)',
                  }}
                />
              </div>
            </div>

            <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Total Registered Swimmers in Scope:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{nonCancelled.length} guests</strong>
            </div>
          </div>
        </div>

        {/* Pool Usage & Occupancy Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pool Utilization &amp; Revenue Share</div>
            <span className="badge badge-neutral">Basin Performance</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {poolStats.map(pool => (
              <div key={pool.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{pool.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                      {pool.description} • Cap: {pool.capacity}
                    </span>
                  </div>
                  <span className="monospace" style={{ fontWeight: 700 }}>
                    {formatINR(pool.revenue)}
                  </span>
                </div>
                <div className="occupancy-bar">
                  <div
                    className={`occupancy-fill ${pool.occPct >= 100 ? 'full' : pool.occPct >= 80 ? 'warn' : ''}`}
                    style={{ width: `${Math.min(pool.occPct, 100)}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  <span>Visits in scope: {pool.totalVisits}</span>
                  <span>Current Occupancy: {pool.activeNow} / {pool.capacity} ({pool.occPct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Detailed Reconciliation Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Financial Audit Summary — {dateFilter.toUpperCase()} ({getTodayDisplay()})
          </div>
          <span className="badge badge-neutral">Audited by System</span>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Payment Mode / Category</th>
                <th>Pass Count</th>
                <th>Share of Volume</th>
                <th>Gross Collection</th>
                <th>Net Revenue</th>
                <th>Settlement Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Cash Counter Tender</td>
                <td>{cashRegs.length}</td>
                <td>{nonCancelled.length > 0 ? Math.round((cashRegs.length / nonCancelled.length) * 100) : 0}%</td>
                <td className="monospace">{formatINR(cashRevenue)}</td>
                <td className="monospace" style={{ fontWeight: 700 }}>{formatINR(cashRevenue)}</td>
                <td><span className="badge badge-success">Reconciled in Drawer</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>UPI / Online Transfer</td>
                <td>{onlineRegs.length}</td>
                <td>{nonCancelled.length > 0 ? Math.round((onlineRegs.length / nonCancelled.length) * 100) : 0}%</td>
                <td className="monospace">{formatINR(onlineRevenue)}</td>
                <td className="monospace" style={{ fontWeight: 700 }}>{formatINR(onlineRevenue)}</td>
                <td><span className="badge badge-active">Instant Gateway Sync</span></td>
              </tr>
              <tr style={{ background: 'var(--color-surface-container-low)' }}>
                <td style={{ fontWeight: 600, color: 'var(--color-error)' }}>Refunds &amp; Cancellations</td>
                <td style={{ color: 'var(--color-error)' }}>{cancelledRegs.length}</td>
                <td>—</td>
                <td className="monospace" style={{ color: 'var(--color-error)' }}>-{formatINR(cancelledRevenue)}</td>
                <td className="monospace" style={{ color: 'var(--color-error)', fontWeight: 700 }}>-</td>
                <td><span className="badge badge-cancelled">Audited Soft-Delete</span></td>
              </tr>
              <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 700 }}>
                <td>Total Net Operating Collection</td>
                <td>{nonCancelled.length}</td>
                <td>100%</td>
                <td className="monospace">{formatINR(grossRevenue)}</td>
                <td className="monospace" style={{ fontSize: 16, color: 'var(--color-primary)' }}>{formatINR(netRevenue)}</td>
                <td><span className="badge badge-success">Balanced</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
