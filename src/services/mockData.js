/**
 * mockData.js — Centralized demo data
 * Replace fetch calls here when Python API is ready.
 * All times in ISO 8601. All amounts in INR (paise not needed).
 */
import { generatePassId, calculateExpiry } from '../utils/formatters';

// ─── POOLS ───────────────────────────────────────────────
export const mockPools = [
  { id: 'pool-a', name: 'Pool A', capacity: 20, description: 'Main Olympic Pool' },
  { id: 'pool-b', name: 'Pool B', capacity: 15, description: 'Children\'s Pool' },
  { id: 'pool-c', name: 'Pool C', capacity: 10, description: 'Warm-up Pool' },
];

// ─── HELPER: build a registration entry ──────────────────
function makeReg({
  name, phone, pool, passType, amount, paymentMethod,
  hoursAgo = 0, status = 'active', extra = {},
}) {
  const entry = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
  const expiry = calculateExpiry(entry, passType);
  return {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    passId: generatePassId(),
    name, phone, pool, passType, amount, paymentMethod,
    entryTime: entry,
    expiryTime: expiry,
    status,
    createdAt: entry,
    updatedAt: entry,
    checkoutTime: null,
    cancelReason: null,
    cancelledAt: null,
    extensionHistory: [],
    ...extra,
  };
}

// ─── SEEDED REGISTRATIONS (ordered newest-first) ─────────
function buildMockData() {
  const now = Date.now();

  // Active entries
  const r1 = makeReg({ name: 'Priya Sharma', phone: '9876543210', pool: 'Pool A', passType: 'hourly', amount: 150, paymentMethod: 'cash', hoursAgo: 0.3 });
  const r2 = makeReg({ name: 'Arjun Nair',   phone: '9823456780', pool: 'Pool A', passType: 'fullday', amount: 300, paymentMethod: 'online', hoursAgo: 1.5 });
  const r3 = makeReg({ name: 'Kavya Menon',  phone: '9712345678', pool: 'Pool B', passType: 'hourly', amount: 150, paymentMethod: 'cash', hoursAgo: 0.9 });
  const r4 = makeReg({ name: 'Rohit Verma',  phone: '9654321098', pool: 'Pool A', passType: 'hourly', amount: 150, paymentMethod: 'online', hoursAgo: 0.15 });
  const r5 = makeReg({ name: 'Sunita Devi',  phone: '9567890123', pool: 'Pool C', passType: 'fullday', amount: 300, paymentMethod: 'cash', hoursAgo: 2 });
  const r6 = makeReg({ name: 'Mohammed Asif',phone: '9445678901', pool: 'Pool B', passType: 'hourly', amount: 150, paymentMethod: 'online', hoursAgo: 0.88 });

  // Expiring soon (within 10 min = set expiry to very soon)
  const expiringEntry = new Date(now - 51 * 60 * 1000).toISOString(); // entered 51 min ago
  const r7 = {
    id: `reg-expiring-1`,
    passId: generatePassId(),
    name: 'Deepika Rao', phone: '9334567890', pool: 'Pool A',
    passType: 'hourly', amount: 150, paymentMethod: 'cash',
    entryTime: expiringEntry,
    expiryTime: new Date(now + 9 * 60 * 1000).toISOString(), // 9 min from now
    status: 'active',
    createdAt: expiringEntry, updatedAt: expiringEntry,
    checkoutTime: null, cancelReason: null, cancelledAt: null, extensionHistory: [],
  };
  const expiringEntry2 = new Date(now - 57 * 60 * 1000).toISOString();
  const r8 = {
    id: `reg-expiring-2`,
    passId: generatePassId(),
    name: 'Anil Kumar', phone: '9223456789', pool: 'Pool B',
    passType: 'hourly', amount: 150, paymentMethod: 'online',
    entryTime: expiringEntry2,
    expiryTime: new Date(now + 3 * 60 * 1000).toISOString(), // 3 min from now
    status: 'active',
    createdAt: expiringEntry2, updatedAt: expiringEntry2,
    checkoutTime: null, cancelReason: null, cancelledAt: null, extensionHistory: [],
  };

  // Expired awaiting checkout
  const expiredEntry = new Date(now - 2 * 3600 * 1000).toISOString();
  const r9 = {
    id: `reg-expired-1`,
    passId: generatePassId(),
    name: 'Sanjay Gupta', phone: '9112345678', pool: 'Pool A',
    passType: 'hourly', amount: 150, paymentMethod: 'cash',
    entryTime: expiredEntry,
    expiryTime: new Date(now - 3600 * 1000).toISOString(), // expired 1 hr ago
    status: 'active', // active status but expired time = awaiting checkout
    createdAt: expiredEntry, updatedAt: expiredEntry,
    checkoutTime: null, cancelReason: null, cancelledAt: null, extensionHistory: [],
  };

  // Completed (checked out)
  const completedEntry = new Date(now - 3 * 3600 * 1000).toISOString();
  const r10 = {
    id: `reg-completed-1`,
    passId: generatePassId(),
    name: 'Lakshmi Iyer', phone: '9001234567', pool: 'Pool C',
    passType: 'fullday', amount: 300, paymentMethod: 'online',
    entryTime: completedEntry,
    expiryTime: new Date(now + 5 * 3600 * 1000).toISOString(),
    status: 'completed',
    checkoutTime: new Date(now - 1 * 3600 * 1000).toISOString(),
    createdAt: completedEntry, updatedAt: new Date(now - 1 * 3600 * 1000).toISOString(),
    cancelReason: null, cancelledAt: null, extensionHistory: [],
  };
  const r11 = {
    id: `reg-completed-2`,
    passId: generatePassId(),
    name: 'Ramesh Pillai', phone: '9876012345', pool: 'Pool A',
    passType: 'hourly', amount: 150, paymentMethod: 'cash',
    entryTime: new Date(now - 4 * 3600 * 1000).toISOString(),
    expiryTime: new Date(now - 3 * 3600 * 1000).toISOString(),
    status: 'completed',
    checkoutTime: new Date(now - 2.5 * 3600 * 1000).toISOString(),
    createdAt: new Date(now - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now - 2.5 * 3600 * 1000).toISOString(),
    cancelReason: null, cancelledAt: null, extensionHistory: [],
  };

  // Cancelled
  const cancelEntry = new Date(now - 5 * 3600 * 1000).toISOString();
  const r12 = {
    id: `reg-cancelled-1`,
    passId: generatePassId(),
    name: 'Geeta Singh', phone: '9765432109', pool: 'Pool B',
    passType: 'hourly', amount: 150, paymentMethod: 'cash',
    entryTime: cancelEntry,
    expiryTime: calculateExpiry(cancelEntry, 'hourly'),
    status: 'cancelled',
    cancelReason: 'Customer requested cancellation — medical emergency',
    cancelledAt: new Date(now - 4.5 * 3600 * 1000).toISOString(),
    createdAt: cancelEntry,
    updatedAt: new Date(now - 4.5 * 3600 * 1000).toISOString(),
    checkoutTime: null, extensionHistory: [],
  };

  return [r7, r8, r1, r2, r3, r4, r5, r6, r9, r10, r11, r12];
}

export const mockRegistrations = buildMockData();

// ─── PASS PRICING ─────────────────────────────────────────
export const PASS_TYPES = {
  hourly:  { label: 'Hourly Pass',   price: 150, duration: '1 Hour',    description: 'Valid for 1 hour from entry' },
  fullday: { label: 'Full-Day Pass', price: 300, duration: 'Full Day',  description: 'Valid until closing time (10:00 PM)' },
};

export const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash' },
  { value: 'online', label: 'Online / UPI' },
];

export const CLOSING_HOUR = 22; // 10 PM IST
