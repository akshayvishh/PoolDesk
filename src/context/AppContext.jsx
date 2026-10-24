import React, { createContext, useContext, useState, useCallback } from 'react';
import { mockRegistrations, mockPools } from '../services/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('pd_auth') === 'true'
  );
  const [user] = useState({ name: 'Rajesh Kumar', role: 'Owner / Admin', station: 'Station 01' });
  const [registrations, setRegistrations] = useState(mockRegistrations);
  const [pools] = useState(mockPools);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => removeToast(id), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const login = useCallback((username, password) => {
    // Demo auth — not production secure
    if (
      (username === 'admin' || username === 'admin@aquatics.gov' || username === 'owner@pooldesk.local') &&
      password.length >= 4
    ) {
      sessionStorage.setItem('pd_auth', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('pd_auth');
    setIsAuthenticated(false);
  }, []);

  // Add registration
  const addRegistration = useCallback((reg) => {
    setRegistrations(prev => [reg, ...prev]);
  }, []);

  // Update registration
  const updateRegistration = useCallback((id, updates) => {
    setRegistrations(prev =>
      prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
    );
  }, []);

  // Checkout
  const checkoutRegistration = useCallback((id) => {
    setRegistrations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'completed', checkoutTime: new Date().toISOString(), updatedAt: new Date().toISOString() } : r)
    );
  }, []);

  // Cancel
  const cancelRegistration = useCallback((id, reason) => {
    setRegistrations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'cancelled', cancelReason: reason, cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : r)
    );
  }, []);

  // Computed data helpers
  const getActiveRegistrations = useCallback(() => {
    const now = new Date();
    return registrations.filter(r => r.status === 'active' && new Date(r.expiryTime) > now);
  }, [registrations]);

  const getExpiringSoon = useCallback(() => {
    const now = new Date();
    const tenMins = new Date(now.getTime() + 10 * 60 * 1000);
    return registrations.filter(r =>
      r.status === 'active' &&
      new Date(r.expiryTime) > now &&
      new Date(r.expiryTime) <= tenMins
    );
  }, [registrations]);

  const getPoolOccupancy = useCallback(() => {
    const active = getActiveRegistrations();
    return pools.map(pool => {
      const count = active.filter(r => r.pool === pool.name).length;
      return { ...pool, active: count, available: pool.capacity - count };
    });
  }, [pools, getActiveRegistrations]);

  const getTodayRevenue = useCallback(() => {
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    return registrations
      .filter(r => {
        const regDate = new Date(r.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        return regDate === today && r.status !== 'cancelled';
      })
      .reduce((sum, r) => sum + r.amount, 0);
  }, [registrations]);

  return (
    <AppContext.Provider value={{
      isAuthenticated, user, login, logout,
      registrations, addRegistration, updateRegistration, checkoutRegistration, cancelRegistration,
      pools, getActiveRegistrations, getExpiringSoon, getPoolOccupancy, getTodayRevenue,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
