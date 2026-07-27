import React, { useState } from 'react';
import { 
  Home, 
  Folder, 
  MessageSquare, 
  BookOpen, 
  Target, 
  CheckSquare, 
  Calendar, 
  BarChart2, 
  FileText, 
  Layers, 
  Play, 
  Pause,
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Settings, 
  Wind,
  Volume2,
  VolumeX,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  onOpenBreathing,
  isFocusMode,
  onToggleFocusMode,
  isCalmSounds,
  setIsCalmSounds
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25:00
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  React.useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startEditing = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveRename = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'focus', label: 'Focus', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: BarChart2 },
  ];

  const secondaryNavItems = [
    { id: 'resources', label: 'Resources', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Layers },
  ];

  return (
    <aside className="sidebar">
      {/* 1. BRAND HEADER */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-logo-cube">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-name">Immersa</h1>
            <p className="brand-tagline">Clarity. Focus. Progress.</p>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY NAV LINKS */}
      <div className="nav-section">
        <div className="nav-group">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="nav-divider"></div>

        {/* 3. SECONDARY NAV LINKS */}
        <div className="nav-group">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT SESSION QUICK LIST IF ON CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="sidebar-chat-sessions-container">
          <div className="sessions-header-row">
            <span>Conversations</span>
            <button className="add-session-btn" onClick={onCreateSession} title="New Chat">
              <Plus size={14} />
            </button>
          </div>
          <div className="sessions-scroll-list">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingId;
              return (
                <div
                  key={session.id}
                  className={`session-item ${isActive ? 'active' : ''}`}
                  onClick={() => !isEditing && onSelectSession(session.id)}
                >
                  <MessageSquare size={14} className="session-icon" />
                  {isEditing ? (
                    <input
                      type="text"
                      className="session-edit-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(e, session.id)}
                      autoFocus
                    />
                  ) : (
                    <span className="session-title-text">{session.title}</span>
                  )}
                  <div className="session-item-actions">
                    <button className="icon-btn-xs" onClick={(e) => startEditing(e, session)}>
                      <Edit2 size={11} />
                    </button>
                    <button className="icon-btn-xs delete" onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. FOCUS MODE SIDEBAR WIDGET */}
      <div className="sidebar-bottom-widget">
        <div className="focus-mode-widget-card">
          <div className="widget-header">
            <div className="widget-title-group">
              <Settings size={14} className="widget-icon" onClick={onOpenSettings} />
              <span className="widget-label">Focus Mode</span>
            </div>
            <span className={`focus-status-dot ${isFocusMode ? 'on' : 'off'}`}>
              • {isFocusMode ? 'On' : 'Off'}
            </span>
          </div>

          <div className="deep-work-timer-row">
            <div className="timer-info">
              <span className="timer-sub">Deep Work</span>
              <span className="timer-digits">{formatTimer(timerSeconds)}</span>
            </div>
            <button 
              className="timer-play-btn"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
            >
              {isTimerRunning ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" style={{ marginLeft: 2 }} />}
            </button>
          </div>

          <div className="ambient-selector-row" onClick={() => setIsCalmSounds(!isCalmSounds)}>
            <div className="ambient-left">
              {isCalmSounds ? <Volume2 size={15} className="icon-purple" /> : <VolumeX size={15} />}
              <div className="ambient-text">
                <span className="ambient-label">Ambient</span>
                <span className="ambient-val">Lo-fi Beats</span>
              </div>
            </div>
            {isCalmSounds && (
              <div className="sound-spectrum-bars">
                <span className="bar b1"></span>
                <span className="bar b2"></span>
                <span className="bar b3"></span>
              </div>
            )}
          </div>
        </div>

        {/* USER PROFILE CARD */}
        <div className="user-profile-footer-card">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Alex"
            className="user-avatar-sm"
          />
          <div className="user-info-text">
            <span className="user-name">Alex</span>
            <span className="user-badge">Premium Plan</span>
          </div>
          <ChevronDown size={14} className="chevron-icon" />
        </div>
      </div>
    </aside>
  );
}
