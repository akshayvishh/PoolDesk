import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getCurrentTimeIST } from '../../utils/formatters';

export default function Header() {
  const { user } = useApp();
  const [time, setTime] = useState(getCurrentTimeIST());

  useEffect(() => {
    const t = setInterval(() => setTime(getCurrentTimeIST()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-chip">
          <span className="material-symbols-outlined">wifi</span>
          <span>Network: Ready</span>
        </div>
        <div className="header-chip">
          <span className="material-symbols-outlined">schedule</span>
          <span className="font-tabular">{time} IST</span>
        </div>
      </div>

      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="header-icon-btn" title="Help">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button className="header-icon-btn" title="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
        <div className="header-divider" />
        <div className="header-user">
          <div className="header-avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="header-user-text">
            <span className="header-user-name">{user.name}</span>
            <span className="header-user-role">{user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
