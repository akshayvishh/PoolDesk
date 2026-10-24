import React from 'react';

/**
 * Badge — status chip
 * variant: 'active' | 'expired' | 'warning' | 'neutral' | 'success' | 'cancelled' | 'checkout'
 */
export default function Badge({ variant = 'neutral', children, dot = false }) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 2 }} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, expiryTime }) {
  if (status === 'cancelled') return <Badge variant="cancelled">Cancelled</Badge>;
  if (status === 'completed') return <Badge variant="checkout">Checked Out</Badge>;
  if (status === 'active') {
    const now = new Date();
    const expiry = new Date(expiryTime);
    if (expiry <= now) return <Badge variant="expired">Expired</Badge>;
    const minLeft = (expiry - now) / 60000;
    if (minLeft <= 10) return <Badge variant="warning">Expiring Soon</Badge>;
    return <Badge variant="active">Active</Badge>;
  }
  return <Badge variant="neutral">{status}</Badge>;
}

export function PassTypeBadge({ passType }) {
  if (passType === 'hourly')  return <Badge variant="neutral">Hourly</Badge>;
  if (passType === 'fullday') return <Badge variant="active">Full-Day</Badge>;
  return <Badge variant="neutral">{passType}</Badge>;
}

export function PaymentBadge({ method }) {
  if (method === 'cash')   return <Badge variant="success">Cash</Badge>;
  if (method === 'online') return <Badge variant="active">UPI / Online</Badge>;
  return <Badge variant="neutral">{method}</Badge>;
}
