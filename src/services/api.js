/**
 * API Service for PoolDesk FastAPI Backend
 * Base URL: http://localhost:8000/api
 * Gracefully falls back to local mock data if the backend server is not running.
 */
import { mockPools, mockRegistrations } from './mockData';

const API_BASE = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errMessage = 'API request failed';
    try {
      const err = await response.json();
      errMessage = err.detail || err.message || errMessage;
    } catch {
      errMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errMessage);
  }

  return response.json();
}

export const api = {
  // Health & Database status
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {
      // Backend is currently offline
    }
    return { status: 'offline', database: { connected: false, configured: false } };
  },

  // Database diagnostic ping
  async testDbConnection() {
    return request('/db/test');
  },

  // Auth
  async login(username, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Pools
  async getPools() {
    try {
      return await request('/pools');
    } catch {
      return mockPools;
    }
  },

  async getOccupancy() {
    try {
      return await request('/pools/occupancy');
    } catch {
      return null; // AppContext will compute from local active registrations
    }
  },

  // Registrations
  async getRegistrations(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const path = query ? `/registrations?${query}` : '/registrations';
      return await request(path);
    } catch {
      return mockRegistrations;
    }
  },

  async createRegistration(data) {
    return request('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkout(id) {
    return request(`/registrations/${id}/checkout`, {
      method: 'PATCH',
    });
  },

  async extend(id, { type, paymentMethod }) {
    return request(`/registrations/${id}/extend`, {
      method: 'PATCH',
      body: JSON.stringify({ type, paymentMethod }),
    });
  },

  async cancel(id, reason) {
    return request(`/registrations/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async seed() {
    return request('/seed', { method: 'POST' });
  },
};
