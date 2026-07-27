import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Lightbulb, 
  Sun, 
  ChevronRight, 
  FileText, 
  MessageSquare, 
  Mic, 
  Send,
  MoreHorizontal
} from 'lucide-react';

export default function DashboardView({ onNavigateTab, onStartChatPrompt }) {
  const [quickPromptText, setQuickPromptText] = useState('');

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (quickPromptText.trim()) {
      onStartChatPrompt(quickPromptText);
      setQuickPromptText('');
    }
  };

  const handlePillClick = (prompt) => {
    onStartChatPrompt(prompt);
  };

  return (
    <div className="dashboard-view">
      {/* 1. HERO SUGGESTED CARD */}
      <section className="suggested-hero-card">
        <div className="hero-content">
          <div className="suggested-badge">
            <Sparkles size={14} className="badge-sparkle" />
            <span>Suggested for today</span>
          </div>

          <h2 className="hero-title">
            Continue System Design Interview Prep?
          </h2>

          <p className="hero-subtitle">
            You were making strong progress yesterday and you're close to finishing this section.
          </p>

          <ul className="hero-checklist">
            <li>
              <span className="check-dot">✓</span>
              <span><strong>Stopped at:</strong> Database Indexing (Chapter 4)</span>
            </li>
            <li>
              <span className="check-dot">✓</span>
              <span><strong>Estimated time to complete:</strong> 25 min</span>
            </li>
            <li>
              <span className="check-dot">✓</span>
              <span>Continuing today builds real momentum</span>
            </li>
          </ul>

          <div className="hero-action-row">
            <button 
              className="btn-primary-purple"
              onClick={() => onNavigateTab('chat', 'Continue System Design Interview Prep: Database Indexing (Chapter 4)')}
            >
              Continue <ArrowRight size={16} />
            </button>
            <button className="btn-outline">Not today</button>
            <button className="btn-ghost">Tell me why</button>
          </div>
        </div>

        <div className="hero-illustration">
          <div className="card-graphic-3d">
            <div className="graphic-header">
              <span className="graphic-tag">Chapter 4</span>
            </div>
            <h4 className="graphic-title">Database Indexing</h4>
            <div className="graphic-flowchart-preview">
              <div className="flow-node node-1">B-Tree</div>
              <div className="flow-line"></div>
              <div className="flow-node node-2">Hash Index</div>
            </div>
          </div>
          <button className="hero-more-btn" title="Options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </section>

      {/* 2. OTHER OPTIONS GRID */}
      <section className="options-section">
        <h3 className="section-title">Other options for today</h3>
        <div className="options-grid">
          <div className="option-card" onClick={() => onNavigateTab('knowledge')}>
            <div className="option-icon-wrapper icon-blue">
              <BookOpen size={20} />
            </div>
            <div className="option-info">
              <h4>Review & Reinforce</h4>
              <p>Review yesterday's notes and strengthen retention.</p>
            </div>
            <div className="option-footer">
              <span className="option-time">15–20 min</span>
              <ChevronRight size={16} className="chevron-icon" />
            </div>
          </div>

          <div className="option-card" onClick={() => onNavigateTab('projects')}>
            <div className="option-icon-wrapper icon-green">
              <Lightbulb size={20} />
            </div>
            <div className="option-info">
              <h4>Switch Project</h4>
              <p>Work on something else that needs your attention.</p>
            </div>
            <div className="option-footer">
              <span className="option-time">Choose project</span>
              <ChevronRight size={16} className="chevron-icon" />
            </div>
          </div>

          <div className="option-card" onClick={() => onNavigateTab('focus')}>
            <div className="option-icon-wrapper icon-orange">
              <Sun size={20} />
            </div>
            <div className="option-info">
              <h4>Reset & Plan</h4>
              <p>Take a short reset and plan your next steps.</p>
            </div>
            <div className="option-footer">
              <span className="option-time">10 min</span>
              <ChevronRight size={16} className="chevron-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. RECENT ACTIVITY */}
      <section className="recent-activity-section">
        <div className="section-header-row">
          <h3>Recent Activity</h3>
          <button className="view-all-link" onClick={() => onNavigateTab('knowledge')}>View all</button>
        </div>

        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-left">
              <div className="activity-icon icon-purple">
                <BookOpen size={18} />
              </div>
              <div className="activity-details">
                <span className="activity-title">Database Indexing (Chapter 4)</span>
                <span className="activity-category">System Design Interview Prep</span>
              </div>
            </div>
            <div className="activity-right">
              <span className="activity-date">Yesterday</span>
              <span className="activity-time">8:40 PM</span>
              <span className="status-badge badge-in-progress">In progress</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-left">
              <div className="activity-icon icon-green">
                <FileText size={18} />
              </div>
              <div className="activity-details">
                <span className="activity-title">Sharding vs Partitioning</span>
                <span className="activity-category">System Design Interview Prep</span>
              </div>
            </div>
            <div className="activity-right">
              <span className="activity-date">Yesterday</span>
              <span className="activity-time">7:15 PM</span>
              <span className="status-badge badge-completed">Completed</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-left">
              <div className="activity-icon icon-orange">
                <MessageSquare size={18} />
              </div>
              <div className="activity-details">
                <span className="activity-title">Interview Q&A: Load Balancer</span>
                <span className="activity-category">AI Chat</span>
              </div>
            </div>
            <div className="activity-right">
              <span className="activity-date">Yesterday</span>
              <span className="activity-time">5:30 PM</span>
              <span className="status-badge badge-discussed">Discussed</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BOTTOM AI QUICK PROMPT BAR */}
      <section className="quick-prompt-section">
        <form onSubmit={handlePromptSubmit} className="prompt-input-container">
          <input
            type="text"
            placeholder="Ask me anything or type / for suggestions..."
            value={quickPromptText}
            onChange={(e) => setQuickPromptText(e.target.value)}
            className="prompt-input-field"
          />
          <div className="prompt-actions">
            <button type="button" className="prompt-icon-btn" title="Voice Input">
              <Mic size={18} />
            </button>
            <button type="submit" className="prompt-send-btn" title="Send">
              <Send size={16} />
            </button>
          </div>
        </form>

        <div className="prompt-pills-row">
          <button 
            type="button" 
            className="prompt-pill"
            onClick={() => handlePillClick('Explain a concept: Database Indexing')}
          >
            <Sparkles size={14} className="pill-icon icon-purple" />
            <span>Explain a concept</span>
          </button>

          <button 
            type="button" 
            className="prompt-pill"
            onClick={() => handlePillClick('Summarize my recent study notes')}
          >
            <FileText size={14} className="pill-icon icon-blue" />
            <span>Summarize this</span>
          </button>

          <button 
            type="button" 
            className="prompt-pill"
            onClick={() => handlePillClick('Break it into 5 actionable learning steps')}
          >
            <ZapIcon size={14} className="pill-icon icon-green" />
            <span>Break it into steps</span>
          </button>

          <button 
            type="button" 
            className="prompt-pill"
            onClick={() => handlePillClick('Help me focus and start a 25 minute session')}
          >
            <Sun size={14} className="pill-icon icon-orange" />
            <span>Help me focus</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function ZapIcon({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
