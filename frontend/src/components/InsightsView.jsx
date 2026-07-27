import React from 'react';
import { TrendingUp, Clock, Target, Zap, Award, Calendar } from 'lucide-react';

export default function InsightsView() {
  return (
    <div className="tab-view-container">
      <div className="view-header-row">
        <div>
          <h2 className="view-title">Learning & Focus Insights</h2>
          <p className="view-subtitle">Track your focus consistency, study retention, and ADHD distraction barriers.</p>
        </div>
        <div className="date-range-badge">
          <Calendar size={15} /> This Week (Jul 21 – Jul 27)
        </div>
      </div>

      <div className="insights-metrics-grid">
        <div className="insight-metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Focus Time</span>
            <div className="metric-icon icon-purple"><Clock size={18} /></div>
          </div>
          <div className="metric-value">4.5 hrs</div>
          <div className="metric-trend trend-up">↑ 18% from last week</div>
        </div>

        <div className="insight-metric-card">
          <div className="metric-header">
            <span className="metric-title">Completed Focus Blocks</span>
            <div className="metric-icon icon-green"><Target size={18} /></div>
          </div>
          <div className="metric-value">7 Sessions</div>
          <div className="metric-trend trend-up">↑ 2 sessions gain</div>
        </div>

        <div className="insight-metric-card">
          <div className="metric-header">
            <span className="metric-title">Peak Productivity Window</span>
            <div className="metric-icon icon-orange"><Zap size={18} /></div>
          </div>
          <div className="metric-value">9:00 – 11:00 AM</div>
          <div className="metric-subtext">Highest retention score</div>
        </div>

        <div className="insight-metric-card">
          <div className="metric-header">
            <span className="metric-title">Context Switches</span>
            <div className="metric-icon icon-blue"><Award size={18} /></div>
          </div>
          <div className="metric-value">5 Switches</div>
          <div className="metric-trend trend-down">↓ 2 less distractions</div>
        </div>
      </div>

      <div className="insights-detail-banner">
        <div className="banner-left">
          <TrendingUp size={24} className="icon-purple" />
          <div>
            <h4>Consistency Milestone Reached! 🎉</h4>
            <p>You're 60% more likely to finish topics when continuing the next morning in your 9-11 AM focus window.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
