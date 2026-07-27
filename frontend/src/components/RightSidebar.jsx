import React, { useState } from 'react';
import { 
  HelpCircle, 
  TrendingUp, 
  Target, 
  Clock, 
  Sparkles, 
  RotateCcw, 
  Heart,
  ChevronRight
} from 'lucide-react';

export default function RightSidebar({ onNavigateTab }) {
  const [selectedMood, setSelectedMood] = useState('Calm');

  const moods = [
    { label: 'Calm', emoji: '😌' },
    { label: 'Stressed', emoji: '😰' },
    { label: 'Overwhelmed', emoji: '😵' },
    { label: 'Tired', emoji: '🥱' },
    { label: 'Scattered', emoji: '😵‍💫' },
    { label: 'Other', emoji: '✏️' }
  ];

  return (
    <aside className="right-sidebar">
      {/* 1. WHY THIS RECOMMENDATION? */}
      <div className="right-card recommendation-card">
        <div className="card-header-row">
          <div className="card-header-title">
            <HelpCircle size={16} className="card-header-icon" />
            <h3>Why this recommendation?</h3>
          </div>
        </div>

        <div className="recommendation-list">
          <div className="rec-item">
            <div className="rec-icon icon-purple">
              <TrendingUp size={16} />
            </div>
            <div className="rec-text">
              <h4>You made good progress yesterday</h4>
              <p>You completed 3/4 topics in this chapter.</p>
            </div>
          </div>

          <div className="rec-item">
            <div className="rec-icon icon-green">
              <Target size={16} />
            </div>
            <div className="rec-text">
              <h4>You're close to a milestone</h4>
              <p>Finish this chapter to complete Database Design module.</p>
            </div>
          </div>

          <div className="rec-item">
            <div className="rec-icon icon-orange">
              <Clock size={16} />
            </div>
            <div className="rec-text">
              <h4>Your best focus time is now</h4>
              <p>You usually do your best work between 9–11 AM.</p>
            </div>
          </div>
        </div>

        <div className="rec-banner-insight">
          <div className="insight-text-col">
            <p>You're <strong>60% more likely</strong> to finish what you start when you continue the next day.</p>
          </div>
          <Sparkles size={20} className="insight-sparkle-icon" />
        </div>
      </div>

      {/* 2. YOUR PATTERNS (THIS WEEK) */}
      <div className="right-card patterns-card">
        <div className="card-header-row">
          <h3>Your patterns <span className="sub-tag">(This week)</span></h3>
          <button 
            className="view-all-link"
            onClick={() => onNavigateTab && onNavigateTab('insights')}
          >
            View all
          </button>
        </div>

        <div className="patterns-list">
          <div className="pattern-row">
            <div className="pattern-left">
              <Clock size={15} className="pattern-icon icon-purple" />
              <span>Most productive time</span>
            </div>
            <span className="pattern-val highlight-bold">9:00 – 11:00 AM</span>
          </div>

          <div className="pattern-row">
            <div className="pattern-left">
              <Target size={15} className="pattern-icon icon-green" />
              <span>Focus sessions</span>
            </div>
            <div className="pattern-val-group">
              <span className="pattern-val">7</span>
              <span className="trend-badge trend-up">↑ 2</span>
            </div>
          </div>

          <div className="pattern-row">
            <div className="pattern-left">
              <TrendingUp size={15} className="pattern-icon icon-orange" />
              <span>Topics explored</span>
            </div>
            <div className="pattern-val-group">
              <span className="pattern-val">4</span>
              <span className="trend-badge trend-up">↑ 1</span>
            </div>
          </div>

          <div className="pattern-row">
            <div className="pattern-left">
              <RotateCcw size={15} className="pattern-icon icon-blue" />
              <span>Context switches</span>
            </div>
            <div className="pattern-val-group">
              <span className="pattern-val">5</span>
              <span className="trend-badge trend-down">↓ 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MIND CHECK-IN */}
      <div className="right-card mind-checkin-card">
        <div className="card-header-row">
          <div>
            <h3>Mind check-in</h3>
            <p className="card-sub-desc">How are you feeling right now?</p>
          </div>
        </div>

        <div className="mood-pills-grid">
          {moods.map((mood) => {
            const isSelected = selectedMood === mood.label;
            return (
              <button
                key={mood.label}
                className={`mood-pill ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedMood(mood.label)}
              >
                <span className="mood-emoji">{mood.emoji}</span>
                <span className="mood-label">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MINDFUL QUOTE BANNER */}
      <div className="mindful-quote-card">
        <div className="quote-icon-top">
          <Heart size={16} fill="var(--accent-purple)" stroke="none" />
        </div>
        <p className="quote-body">
          Clarity comes from small decisions that move you forward.
        </p>
        <span className="quote-footer">One step at a time. ✨</span>
      </div>
    </aside>
  );
}
