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

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const login = useCallback((username, password) => {
    // Demo auth for pool owner — strictly authenticated
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

  // Checkout (releases pool capacity)
  const checkoutRegistration = useCallback((id) => {
    setRegistrations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'completed', checkoutTime: new Date().toISOString(), updatedAt: new Date().toISOString() } : r)
    );
  }, []);

  // Cancel (soft delete, retains financial record)
  const cancelRegistration = useCallback((id, reason) => {
    setRegistrations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'cancelled', cancelReason: reason, cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : r)
    );
  }, []);

  // All active swimmers in facility (capacity is held until checkout)
  const getActiveRegistrations = useCallback(() => {
    return registrations.filter(r => r.status === 'active');
  }, [registrations]);

  // Unexpired passes with <= 10 minutes remaining
  const getExpiringSoon = useCallback(() => {
    const now = new Date();
    const tenMins = new Date(now.getTime() + 10 * 60 * 1000);
    return registrations.filter(r =>
      r.status === 'active' &&
      new Date(r.expiryTime) > now &&
      new Date(r.expiryTime) <= tenMins
    );
  }, [registrations]);

  // Capacity tracking per pool
  const getPoolOccupancy = useCallback(() => {
    const active = getActiveRegistrations();
    return pools.map(pool => {
      const count = active.filter(r => r.pool === pool.name).length;
      return { ...pool, active: count, available: Math.max(0, pool.capacity - count) };
    });
  }, [pools, getActiveRegistrations]);

  // Daily revenue including extensions
  const getTodayRevenue = useCallback(() => {
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    return registrations
      .filter(r => {
        const regDate = new Date(r.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        return regDate === today && r.status !== 'cancelled';
      })
      .reduce((sum, r) => {
        const extSum = (r.extensionHistory || []).reduce((es, e) => es + (e.amount || 0), 0);
        return sum + r.amount + extSum;
      }, 0);
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
