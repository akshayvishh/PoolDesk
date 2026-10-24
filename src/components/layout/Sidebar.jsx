import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const navItems = [
  { path: '/dashboard',       label: 'Dashboard',         icon: 'space_dashboard' },
  { path: '/registration',    label: 'New Registration',   icon: 'person_add' },
  { path: '/active-swimmers', label: 'All Active Swimmers',icon: 'pool' },
  { path: '/expiring-soon',   label: 'Expiring Soon',      icon: 'notification_important' },
  { path: '/records',         label: 'Manage Records',     icon: 'badge' },
  { path: '/reports',         label: 'Reports',            icon: 'insert_chart' },
];

export default function Sidebar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      {/* macOS-style titlebar dots */}
      <div className="sidebar-top-bar">
        <div className="sidebar-dots">
          <span className="sidebar-dot red" />
          <span className="sidebar-dot yellow" />
          <span className="sidebar-dot green" />
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 8 }}>
          PoolDesk OS
        </span>
      </div>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-inner">
          <div className="sidebar-icon">
            <span className="material-symbols-outlined">waves</span>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">PoolDesk</span>
            <span className="sidebar-brand-sub">Aquatics Core</span>
          </div>
        </div>
        <span className="sidebar-version">v2.4</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-row">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">
                <span className="material-symbols-outlined">admin_panel_settings</span>
              </div>
              <div>
                <div className="sidebar-user-name">{user.name.split(' ')[0]} {user.name.split(' ')[1]?.[0]}.</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </div>
            <div className="sidebar-status-dot" title="Online" />
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
