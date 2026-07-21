import React, { useState } from 'react';
import { 
  MessageSquare, Trash2, Edit2, Check, X, Settings, Plus, Bot, 
  Home, BookOpen, BarChart2, Target, Wind 
} from 'lucide-react';

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  onOpenBreathing,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

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

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveRename(e, id);
    } else if (e.key === 'Escape') {
      cancelEditing(e);
    }
  };

  return (
    <aside className="sidebar">
      {/* 1. Brand Header */}
      <div className="sidebar-header">
        <div className="app-title-wrapper">
          <div className="app-logo-bg">
            <Bot size={22} className="app-logo" style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div>
            <h1 className="app-title">FocusBuddy✨</h1>
            <div className="app-subtitle">AI Teaching Assistant</div>
          </div>
        </div>
      </div>

      {/* 2. Static Nav List (ADHD Organization) */}
      <div className="nav-links">
        <div className="nav-link"><Home size={16} /><span>Home</span></div>
        <div className="nav-link active"><MessageSquare size={16} /><span>Chats</span></div>
        <div className="nav-link"><BookOpen size={16} /><span>Courses</span></div>
        <div className="nav-link"><BarChart2 size={16} /><span>Progress</span></div>
        <div className="nav-link"><Target size={16} /><span>Goals</span></div>
      </div>

      {/* 3. New Chat Button */}
      <button className="new-chat-btn" onClick={onCreateSession}>
        <Plus size={16} />
        New Chat
      </button>

      {/* 4. Session History List */}
      <div className="session-list-header">My Chats</div>
      <div className="session-list">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isEditing = session.id === editingId;

          return (
            <div
              key={session.id}
              className={`session-item ${isActive ? 'active' : ''}`}
              onClick={() => !isEditing && onSelectSession(session.id)}
            >
              <div className="session-info">
                <MessageSquare 
                  size={15} 
                  style={{ 
                    color: isActive ? 'var(--accent-purple)' : 'var(--text-secondary)', 
                    flexShrink: 0 
                  }} 
                />
                
                {isEditing ? (
                  <input
                    type="text"
                    className="settings-input"
                    style={{ padding: '2px 6px', fontSize: '0.8rem', width: '100%', height: '24px' }}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, session.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div style={{ overflow: 'hidden' }}>
                    <div className="session-title">{session.title}</div>
                    <div className="session-meta">
                      {(session.provider || 'mock').toUpperCase()} · {(session.model || 'mock-gpt').split('/').pop()}
                    </div>
                  </div>
                )}
              </div>

              {/* Rename/Delete Controls */}
              <div className="session-actions">
                {isEditing ? (
                  <>
                    <button className="session-btn" onClick={(e) => saveRename(e, session.id)}>
                      <Check size={13} style={{ color: 'var(--accent-cyan)' }} />
                    </button>
                    <button className="session-btn" onClick={cancelEditing}>
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="session-btn" onClick={(e) => startEditing(e, session)}>
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="session-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Mindful break card & settings footer */}
      <footer className="sidebar-footer">
        <div className="mindful-break-card">
          <span className="mindful-break-title">Take a mindful break</span>
          <p className="mindful-break-desc">It's okay to pause and breathe. You learn better when your brain feels good!</p>
          <button className="mindful-break-btn" onClick={onOpenBreathing}>
            <Wind size={14} />
            <span>Start 2 min Breathing</span>
          </button>
        </div>

        <button className="sidebar-settings-btn" onClick={onOpenSettings}>
          <Settings size={15} />
          <span>Settings Config</span>
        </button>
      </footer>
    </aside>
  );
}
