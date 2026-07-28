import React from 'react';
import { Search, Sun, Moon, Bell, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Header({ 
  isDarkMode, 
  onToggleDarkMode, 
  hideLeftSidebar,
  onToggleLeftSidebar,
  hideRightSidebar,
  onToggleRightSidebar,
  userProfile = { name: 'Aryan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' } 
}) {
  return (
    <header className="main-header">
      <div className="header-left-section">
        <button 
          className={`hover-retract-btn ${hideLeftSidebar ? 'collapsed' : ''}`}
          onClick={onToggleLeftSidebar}
          title={hideLeftSidebar ? "Expand Left Sidebar" : "Retract Left Sidebar"}
          aria-label="Toggle Left Sidebar"
        >
          {hideLeftSidebar ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="header-search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search anything... (⌘K)"
            className="header-search-input"
          />
        </div>
      </div>

      <div className="header-right-actions">
        <button 
          className="header-icon-btn" 
          onClick={onToggleDarkMode}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="header-icon-btn notification-btn" title="Notifications" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        <div className="user-avatar-container" title={userProfile.name}>
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            className="user-avatar-img"
          />
        </div>

        <button 
          className={`hover-retract-btn ${hideRightSidebar ? 'collapsed' : ''}`}
          onClick={onToggleRightSidebar}
          title={hideRightSidebar ? "Expand Right Panel" : "Retract Right Panel"}
          aria-label="Toggle Right Sidebar"
        >
          {hideRightSidebar ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </header>
  );
}
