import React from 'react';
import { Search, Sun, Moon, Bell } from 'lucide-react';

export default function Header({ isDarkMode, onToggleDarkMode, userProfile = { name: 'Alex', plan: 'Premium Plan' } }) {
  return (
    <header className="main-header">
      <div className="header-left">
        <h1 className="header-greeting">
          Good morning, {userProfile.name}! <span className="wave-emoji">👋</span>
        </h1>
        <p className="header-subtitle">
          Let's make today clear and meaningful.
        </p>
      </div>

      <div className="header-center">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search anything..."
            className="search-input"
          />
          <kbd className="search-shortcut">⌘K</kbd>
        </div>
      </div>

      <div className="header-right">
        <button 
          className="header-icon-btn" 
          onClick={onToggleDarkMode}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button className="header-icon-btn notification-btn" title="Notifications">
          <Bell size={19} />
          <span className="notification-badge"></span>
        </button>

        <div className="user-profile-avatar-wrapper">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt={userProfile.name}
            className="user-avatar"
          />
        </div>
      </div>
    </header>
  );
}
