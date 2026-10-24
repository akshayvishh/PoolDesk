import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatINR, formatTime, formatRemaining, getTodayDisplay } from '../utils/formatters';

function MetricCard({ icon, label, value, sub, accent, onClick }) {
  return (
    <div
      className="metric-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(23,32,51,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="metric-label">{label}</div>
          <div className="metric-value" style={accent ? { color: accent } : {}}>{value}</div>
          {sub && <div className="metric-sub" style={{ marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-primary-container)' }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function PoolOccupancyCard({ pools: poolData }) {
  return (
    <div className="card card-sm">
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12 }}>Pool Occupancy</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {poolData.map(pool => {
          const pct = pool.capacity > 0 ? (pool.active / pool.capacity) * 100 : 0;
          const fillClass = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : '';
          return (
            <div key={pool.id} className="pool-row">
              <div className="pool-label">{pool.name}</div>
              <div className="pool-bar-wrap">
                <div className="occupancy-bar">
                  <div className={`occupancy-fill ${fillClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
              <div className="pool-counts">{pool.active}/{pool.capacity}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { getActiveRegistrations, getExpiringSoon, getPoolOccupancy, getTodayRevenue, registrations } = useApp();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  // Re-render every 30 seconds for live counters
  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const active = getActiveRegistrations();
  const expiring = getExpiringSoon();
  const poolOcc = getPoolOccupancy();
  const todayRev = getTodayRevenue();

  // Today's cash vs online split
  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const todayRegs = registrations.filter(r => {
    const d = new Date(r.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    return d === today && r.status !== 'cancelled';
  });
  const cashRev = todayRegs.filter(r => r.paymentMethod === 'cash').reduce((s, r) => s + r.amount, 0);
  const onlineRev = todayRegs.filter(r => r.paymentMethod === 'online').reduce((s, r) => s + r.amount, 0);

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>home</span>
            <span>›</span>
            <span>Dashboard</span>
          </div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">{getTodayDisplay()}</div>
        </div>
        <button
          className="btn btn-primary btn-md"
          onClick={() => navigate('/registration')}
          id="new-registration-btn"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          New Registration
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid-4">
        <MetricCard
          icon="pool"
          label="Active Swimmers"
          value={active.length}
          sub="Currently in pools"
          onClick={() => navigate('/active-swimmers')}
        />
        <MetricCard
          icon="notification_important"
          label="Expiring Soon"
          value={expiring.length}
          sub="Within 10 minutes"
          accent={expiring.length > 0 ? 'var(--color-error)' : undefined}
          onClick={() => navigate('/expiring-soon')}
        />
        <MetricCard
          icon="currency_rupee"
          label="Today's Collection"
          value={formatINR(todayRev)}
          sub={`${todayRegs.length} passes issued`}
        />
        <MetricCard
          icon="people"
          label="Total Passes Today"
          value={todayRegs.length}
          sub={`Cash: ${formatINR(cashRev)} • UPI: ${formatINR(onlineRev)}`}
        />
      </div>

      {/* Pool occupancy + Expiring soon panel */}
      <div className="grid-2">
        <PoolOccupancyCard pools={poolOcc} />

        {/* Expiring soon quick list */}
        <div className="card card-sm">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Expiring Soon</div>
            {expiring.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/expiring-soon')}>View All</button>
            )}
          </div>
          {expiring.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: 'var(--color-outline-variant)' }}>check_circle</span>
              No passes expiring within 10 minutes
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expiring.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--color-error-container)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.pool} • {r.passId}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-error)', fontFeatureSettings: '"tnum"' }}>
                    {formatRemaining(r.expiryTime)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent registrations */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Recent Registrations</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/records')}>View All Records</button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Pass ID</th>
                <th>Name</th>
                <th>Pool</th>
                <th>Pass Type</th>
                <th>Entry</th>
                <th>Valid Until</th>
                <th>Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {registrations.slice(0, 8).map(r => (
                <tr key={r.id}>
                  <td className="monospace" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.passId}</td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td>{r.pool}</td>
                  <td>{r.passType === 'hourly' ? 'Hourly' : 'Full-Day'}</td>
                  <td className="monospace">{formatTime(r.entryTime)}</td>
                  <td className="monospace">{formatTime(r.expiryTime)}</td>
                  <td className="monospace" style={{ fontWeight: 600 }}>{formatINR(r.amount)}</td>
                  <td>{r.paymentMethod === 'cash' ? 'Cash' : 'UPI'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
