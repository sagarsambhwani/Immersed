import React from 'react';
import { 
  Home, 
  Folder, 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  BarChart2, 
  FileText, 
  Target, 
  Settings,
  Plus,
  Trash2
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onOpenSettings,
  userProfile = { name: 'Aryan', email: 'aryan@immersa.ai' }
}) {
  const primaryNavItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: BarChart2 },
    { id: 'resources', label: 'Resources', icon: FileText },
  ];

  const secondaryNavItems = [
    { id: 'focus', label: 'Focus Mode', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings, isAction: true },
  ];

  const handleItemClick = (item) => {
    if (item.isAction && item.id === 'settings') {
      onOpenSettings();
    } else {
      onSelectTab(item.id);
    }
  };

  return (
    <aside className="sidebar">
      {/* BRAND */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="brand-title">Immersa</span>
      </div>

      {/* PRIMARY NAV */}
      <nav className="sidebar-nav">
        <div className="nav-group">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <React.Fragment key={item.id}>
                <button
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <Icon size={18} className="nav-item-icon" />
                  <span className="nav-item-label">{item.label}</span>
                  {item.id === 'chat' && (
                    <span 
                      className="create-session-plus-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTab('chat');
                        if (onCreateSession) onCreateSession();
                      }}
                      title="Create New Chat"
                      style={{ marginLeft: 'auto', padding: '2px', cursor: 'pointer' }}
                    >
                      <Plus size={14} />
                    </span>
                  )}
                </button>

                {/* Sub-list of Chat Sessions under AI Chat */}
                {item.id === 'chat' && activeTab === 'chat' && (
                  <div className="sidebar-sessions-sublist" style={{ paddingLeft: '12px', margin: '4px 0' }}>
                    <button
                      className="sidebar-nav-item sub-item new-chat-btn"
                      onClick={onCreateSession}
                      style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 600 }}
                    >
                      <Plus size={14} />
                      <span>+ New Session</span>
                    </button>
                    {Array.isArray(sessions) && sessions.map((sess) => (

                      <div
                        key={sess.id}
                        className={`sidebar-nav-item sub-item ${sess.id === activeSessionId ? 'active' : ''}`}
                        onClick={() => onSelectSession(sess.id)}
                        style={{ fontSize: '12px', justifyContent: 'space-between' }}
                      >
                        <span className="nav-item-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                          {sess.title || 'Untitled Chat'}
                        </span>
                        {onDeleteSession && (
                          <Trash2
                            size={12}
                            style={{ opacity: 0.5, cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(sess.id);
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="sidebar-divider"></div>

        {/* SECONDARY NAV */}
        <div className="nav-group">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <Icon size={18} className="nav-item-icon" />
                <span className="nav-item-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* USER PROFILE FOOTER */}
      <div className="sidebar-footer">
        <div className="sidebar-divider"></div>
        <div className="user-profile-row" onClick={onOpenSettings}>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt={userProfile.name}
            className="user-profile-avatar"
          />
          <div className="user-profile-info">
            <span className="user-profile-name">{userProfile.name}</span>
            <span className="user-profile-sub">AI Workspace</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

