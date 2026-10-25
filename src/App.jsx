import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import ActiveSwimmers from './pages/ActiveSwimmers';
import ExpiringSoon from './pages/ExpiringSoon';
import Records from './pages/Records';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login route for Pool Owner */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes wrapped in AppLayout */}
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/active-swimmers" element={<ActiveSwimmers />} />
            <Route path="/expiring-soon" element={<ExpiringSoon />} />
            <Route path="/records" element={<Records />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
