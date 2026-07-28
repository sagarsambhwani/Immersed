import React from 'react';
import { Sparkles, Clock, Zap, Lightbulb, Heart, Compass } from 'lucide-react';
import InsightCard from './InsightCard';

export default function InsightsView() {
  return (
    <div className="view-page-container">
      <div className="page-header-clean">
        <h2 className="page-title">Personal AI Insights</h2>
        <p className="page-subtitle">Reflections and observations derived from your natural working rhythm.</p>
      </div>

      <div className="insights-personal-list">
        <InsightCard
          title="I'm noticing..."
          content="You understand complex architectural concepts much faster when practical code examples come first before formal definitions."
          subtext="Immersa AI automatically structures new topic breakdowns with code-first illustrations."
          icon={Lightbulb}
        />

        <InsightCard
          title="Your most productive time"
          content="9:00 AM – 11:00 AM"
          subtext="Your focus retention score and response depth peak consistently during these morning hours."
          icon={Clock}
        />

        <InsightCard
          title="Learning pattern observation"
          content="You switch topics after about 20 minutes of deep study."
          subtext="Would you like to auto-trigger 20-minute micro-focus sessions?"
          actionText="Enable 20-min micro sessions"
          onAction={() => alert("20-minute focus micro-sessions enabled!")}
          icon={Zap}
        />

        <InsightCard
          title="Cognitive balance"
          content="You perform best when breaking system design problems into 3 smaller micro-components."
          subtext="AI suggestions will naturally chunk large chapters into 3 steps."
          icon={Compass}
        />
      </div>
    </div>
  );
}
