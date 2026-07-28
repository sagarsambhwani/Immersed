import React, { useState } from 'react';
import { HelpCircle, Sparkles, Heart, Brain, Clock, Target } from 'lucide-react';

export default function RightSidebar({ onNavigateTab }) {
  const [selectedMood, setSelectedMood] = useState('Calm');

  const moods = [
    { label: 'Calm', emoji: '😌' },
    { label: 'Focused', emoji: '🎯' },
    { label: 'Tired', emoji: '🥱' },
    { label: 'Overwhelmed', emoji: '😵' },
    { label: 'Scattered', emoji: '😵‍💫' },
    { label: 'Curious', emoji: '💡' }
  ];

  return (
    <aside className="right-sidebar">
      {/* 1. WHY THIS RECOMMENDATION? */}
      <div className="right-card recommendation-reason-card">
        <div className="card-header-row">
          <div className="card-header-title">
            <HelpCircle size={16} className="card-header-icon" />
            <h3>Why this recommendation?</h3>
          </div>
        </div>

        <div className="recommendation-list">
          <div className="rec-item">
            <div className="rec-icon icon-purple">
              <Sparkles size={15} />
            </div>
            <div className="rec-text">
              <h4>Yesterday's Momentum</h4>
              <p>You completed 3/4 topics in Database Indexing.</p>
            </div>
          </div>

          <div className="rec-item">
            <div className="rec-icon icon-green">
              <Target size={15} />
            </div>
            <div className="rec-text">
              <h4>Milestone Completion</h4>
              <p>Finishing 1 more topic completes Chapter 4.</p>
            </div>
          </div>

          <div className="rec-item">
            <div className="rec-icon icon-orange">
              <Clock size={15} />
            </div>
            <div className="rec-text">
              <h4>Peak Cognitive Hours</h4>
              <p>Your focus and retention peak between 9–11 AM.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIND CHECK-IN */}
      <div className="right-card mind-checkin-card">
        <div className="card-header-row">
          <div className="card-header-title">
            <Brain size={16} className="card-header-icon" />
            <h3>Mind Check-in</h3>
          </div>
        </div>
        <p className="card-sub-desc">How are you feeling right now?</p>

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

      {/* 3. CALM AI REFLECTION */}
      <div className="mindful-quote-card">
        <div className="quote-icon-top">
          <Heart size={16} className="icon-purple" />
        </div>
        <p className="quote-body">
          "The AI is here to reduce decision fatigue and guide your next step gently."
        </p>
        <span className="quote-footer">Immersa AI Mentor</span>
      </div>
    </aside>
  );
}
