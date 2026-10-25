/**
 * formatters.js — Indian localization utilities
 * All currency: INR (₹), locale: en-IN, timezone: Asia/Kolkata
 */

const LOCALE = 'en-IN';
const TIMEZONE = 'Asia/Kolkata';

/** Format amount as Indian Rupees */
export function formatINR(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format date in Indian format: DD MMM YYYY */
export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString));
}

/** Format time: HH:MM AM/PM IST */
export function formatTime(isoString) {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

/** Format date and time together */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

/** Format remaining time as "Xm Ys" or "Expired" */
export function formatRemaining(expiryIso) {
  if (!expiryIso) return '—';
  const now = Date.now();
  const exp = new Date(expiryIso).getTime();
  const diff = exp - now;
  if (diff <= 0) return 'Expired';
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Get remaining percentage (0-100) */
export function getRemainingPct(entryIso, expiryIso) {
  if (!entryIso || !expiryIso) return 0;
  const total = new Date(expiryIso) - new Date(entryIso);
  const remaining = new Date(expiryIso) - Date.now();
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

/** Format phone number in Indian style */
export function formatPhone(phone) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0,5)}-${digits.slice(5)}`;
  }
  return phone;
}

/** Generate unique Pass ID */
export function generatePassId() {
  const now = new Date();
  // Format: PD-YYYYMMDD-XXXX
  const dateFormatted = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `PD-${dateFormatted}-${suffix}`;
}

/** Get today's closing time ISO string (e.g., 10:00 PM IST) */
export function getTodayClosingTime(closingHour = 22) {
  const now = new Date();
  // Get today's date in IST
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  istDate.setHours(closingHour, 0, 0, 0);
  // Convert back to UTC
  const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(istDate.getTime() - offset + (istDate.getTimezoneOffset() * 60000)).toISOString();
}

/** Calculate expiry from entry time and pass type */
export function calculateExpiry(entryTimeIso, passType, closingHour = 22) {
  const entry = new Date(entryTimeIso);
  if (passType === 'hourly') {
    return new Date(entry.getTime() + 60 * 60 * 1000).toISOString();
  } else {
    // Full-day: valid until closing time same day
    const istEntry = new Date(entry.toLocaleString('en-US', { timeZone: TIMEZONE }));
    istEntry.setHours(closingHour, 0, 0, 0);
    // If closing time already passed (unusual), add 24h
    if (istEntry <= entry) {
      istEntry.setDate(istEntry.getDate() + 1);
    }
    return istEntry.toISOString();
  }
}

/** Format number with Indian number system */
export function formatNumber(n) {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat(LOCALE).format(n);
}

/** Get today's date string for display */
export function getTodayDisplay() {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/** Get current IST time string */
export function getCurrentTimeIST() {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());
}
