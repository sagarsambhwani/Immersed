import React, { useState } from 'react';
import { Sparkles, Search, MessageSquare, BookOpen, Clock, Lightbulb, Zap, ArrowRight } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import ConversationRow from './ConversationRow';
import InsightCard from './InsightCard';

export default function DashboardView({ onNavigateTab, onStartChatPrompt, userProfile = { name: 'Aryan' } }) {
  const [heroPromptText, setHeroPromptText] = useState('');

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    if (heroPromptText.trim()) {
      onStartChatPrompt(heroPromptText);
      setHeroPromptText('');
    }
  };

  const sampleRecentConversations = [
    {
      id: 'c1',
      title: 'Database Indexing & B-Trees',
      preview: 'You analyzed query execution plans and index scan trade-offs.',
      time: '10m ago',
      prompt: 'Continue Database Indexing and B-Tree discussion'
    },
    {
      id: 'c2',
      title: 'System Architecture & Sharding',
      preview: 'Evaluated horizontal partitioning strategies for microservices.',
      time: 'Yesterday',
      prompt: 'Resume System Architecture and Sharding topic'
    },
    {
      id: 'c3',
      title: 'React State Management Patterns',
      preview: 'Discussed context API, Zustand, and atomic state models.',
      time: '2 days ago',
      prompt: 'Review React State Management Patterns'
    }
  ];

  return (
    <div className="dashboard-mentor-container">
      {/* 1. HERO SECTION CENTERPIECE */}
      <section className="mentor-hero-section">
        <div className="mentor-greeting-header">
          <h1 className="greeting-title">
            Good morning, {userProfile.name} <span className="wave-emoji">👋</span>
          </h1>
          <p className="greeting-subtitle">
            What would you like to work through today?
          </p>
        </div>

        {/* PRIMARY CTA: LARGE AI SEARCH/CHAT INPUT */}
        <form onSubmit={handleHeroSubmit} className="hero-ai-search-form">
          <div className="hero-search-wrapper">
            <Sparkles size={20} className="hero-search-sparkle" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="Ask anything... or describe what you're trying to achieve today."
              value={heroPromptText}
              onChange={(e) => setHeroPromptText(e.target.value)}
            />
            <button type="submit" className="hero-submit-btn">
              <span>Ask AI</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>

      {/* 2. AI RECOMMENDATION CARD */}
      <section className="dashboard-section">
        <RecommendationCard
          title="Continue System Design?"
          reasons={[
            "You completed 3/4 topics yesterday",
            "You're close to finishing this chapter",
            "Estimated time: 25 minutes",
            "Your focus is usually strongest in the morning"
          ]}
          onContinue={() => onNavigateTab('chat', 'Continue System Design Interview Prep: Database Indexing (Chapter 4)')}
          onNotToday={() => onNavigateTab('projects')}
        />
      </section>

      {/* 3. RECENT CONVERSATIONS */}
      <section className="dashboard-section">
        <div className="section-title-row">
          <h3 className="section-heading">Recent Conversations</h3>
          <button className="section-link-btn" onClick={() => onNavigateTab('chat')}>
            View all
          </button>
        </div>

        <div className="recent-conversations-list">
          {sampleRecentConversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              title={conv.title}
              preview={conv.preview}
              time={conv.time}
              icon={MessageSquare}
              onClick={() => onStartChatPrompt(conv.prompt)}
            />
          ))}
        </div>
      </section>

      {/* 4. PERSONAL AI OBSERVATIONS & INSIGHTS */}
      <section className="dashboard-section">
        <div className="section-title-row">
          <h3 className="section-heading">AI Observations & Learning Patterns</h3>
          <button className="section-link-btn" onClick={() => onNavigateTab('insights')}>
            Full insights
          </button>
        </div>

        <div className="insights-grid-row">
          <InsightCard
            title="I'm noticing..."
            content="You understand concepts faster when real-world code examples come first."
            subtext="AI mentor has adapted explanations to lead with working code snippets."
            icon={Lightbulb}
          />

          <InsightCard
            title="Your most productive time"
            content="9:00 – 11:00 AM"
            subtext="Your retention score is 45% higher during morning focus blocks."
            icon={Clock}
          />

          <InsightCard
            title="Session pacing tip"
            content="You switch topics after about 20 minutes. Would you like shorter micro-sessions?"
            actionText="Adjust focus session length"
            onAction={() => onNavigateTab('focus')}
            icon={Zap}
          />
        </div>
      </section>
    </div>
  );
}
