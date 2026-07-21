import React from 'react';
import { EyeOff, Volume2, Moon } from 'lucide-react';
import FocusTimer from './FocusTimer';
import TaskPlanner from './TaskPlanner';

export default function RightSidebar({
  hideLeftSidebar,
  setHideLeftSidebar,
  isCalmSounds,
  setIsCalmSounds,
  isDndMode,
  setIsDndMode,
}) {
  return (
    <aside className="right-sidebar">
      {/* 1. Header */}
      <div className="right-sidebar-header">
        <h2 className="right-sidebar-title">Focus Tools</h2>
        <span className="right-sidebar-subtitle">Built for ADHD brains</span>
      </div>

      {/* 2. Pomodoro Timer */}
      <FocusTimer />

      {/* 3. Reduce Distractions Card */}
      <div className="widget-card">
        <span className="widget-title">Reduce Distractions</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          {/* Toggle Left Sidebar */}
          <div className="toggle-item">
            <div className="toggle-label-row">
              <EyeOff size={16} style={{ color: 'var(--accent-purple)' }} />
              <span>Hide Sidebar</span>
            </div>
            <label className="switch-control">
              <input 
                type="checkbox" 
                checked={hideLeftSidebar}
                onChange={() => setHideLeftSidebar(!hideLeftSidebar)}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* Toggle Ambient sounds */}
          <div className="toggle-item">
            <div className="toggle-label-row">
              <Volume2 size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>Calm Sounds</span>
            </div>
            <label className="switch-control">
              <input 
                type="checkbox" 
                checked={isCalmSounds}
                onChange={() => setIsCalmSounds(!isCalmSounds)}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* Toggle DND mode */}
          <div className="toggle-item">
            <div className="toggle-label-row">
              <Moon size={16} style={{ color: 'var(--accent-pink)' }} />
              <span>DND Mode</span>
            </div>
            <label className="switch-control">
              <input 
                type="checkbox" 
                checked={isDndMode}
                onChange={() => setIsDndMode(!isDndMode)}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Task Planner checklist */}
      <TaskPlanner />

      {/* 5. Motivation Streak Card */}
      <div className="motivation-card">
        <div className="streak-info-box">
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Learning Streak</span>
          <span className="streak-val-text">12 Days 🔥</span>
        </div>
        <span className="motivation-character" role="img" aria-label="brain mascot">🧠</span>
      </div>

      {/* 6. Inspirational quote box */}
      <div className="motivation-quote-card">
        <p>“Progress, not perfection. One step at a time.” 💜</p>
      </div>
    </aside>
  );
}
