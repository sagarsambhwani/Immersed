import React from 'react';
import { Sparkles, Clock, Zap, ArrowUpRight } from 'lucide-react';

export default function InsightCard({
  type = 'observation',
  icon: CustomIcon,
  title = "I'm noticing...",
  content,
  subtext,
  actionText,
  onAction
}) {
  const Icon = CustomIcon || Sparkles;

  return (
    <div className="insight-card-item">
      <div className="insight-card-header">
        <div className="insight-icon-badge">
          <Icon size={16} />
        </div>
        <span className="insight-type-label">{title}</span>
      </div>

      <p className="insight-content-text">{content}</p>

      {subtext && <p className="insight-subtext">{subtext}</p>}

      {actionText && (
        <button className="insight-action-btn" onClick={onAction}>
          <span>{actionText}</span>
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
