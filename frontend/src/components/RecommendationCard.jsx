import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Info } from 'lucide-react';

export default function RecommendationCard({
  title = "Continue System Design?",
  reasons = [
    "You completed 3/4 topics yesterday",
    "You're close to finishing this chapter",
    "Estimated time: 25 minutes",
    "Your focus is usually strongest in the morning"
  ],
  onContinue,
  onNotToday
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="recommendation-card-container">
      <div className="suggested-badge">
        <Sparkles size={14} className="badge-sparkle" />
        <span>Suggested for today</span>
      </div>

      <h2 className="recommendation-title">{title}</h2>

      <div className="recommendation-why-section">
        <h4 className="why-header">Why?</h4>
        <ul className="why-bullet-list">
          {reasons.map((reason, index) => (
            <li key={index} className="why-bullet-item">
              <span className="bullet-dot">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="recommendation-actions">
        <button 
          className="btn-primary-purple"
          onClick={onContinue}
        >
          Continue <ArrowRight size={16} />
        </button>

        <button 
          className="btn-outline-soft"
          onClick={onNotToday}
        >
          Not Today
        </button>

        <button 
          className="btn-ghost-sm"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <Info size={14} /> Tell me why
        </button>
      </div>

      {showExplanation && (
        <div className="explanation-drawer">
          <div className="explanation-header">
            <div className="explanation-title-row">
              <Sparkles size={16} className="icon-purple" />
              <span>AI Recommendation Logic</span>
            </div>
            <button className="close-explanation-btn" onClick={() => setShowExplanation(false)}>
              <X size={14} />
            </button>
          </div>
          <p className="explanation-body">
            Immersa analyzed your peak cognitive retention window (9:00 AM – 11:00 AM) and past project continuity. Continuing today prevents context decay and leverages momentum built from yesterday's 3 completed topics.
          </p>
        </div>
      )}
    </div>
  );
}
