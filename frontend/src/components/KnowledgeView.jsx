import React from 'react';
import { BookOpen, FileText, Search, Bookmark, Tag } from 'lucide-react';

export default function KnowledgeView({ onStartChatPrompt }) {
  const notes = [
    {
      id: 'k1',
      title: 'Database Indexing (B-Trees vs Hash Indexes)',
      topic: 'System Design Interview Prep',
      date: 'Yesterday, 8:40 PM',
      summary: 'B-Trees allow range queries with O(log N) lookup time. Hash indexes offer O(1) exact match lookup but do not support range scans.',
      tags: ['Database', 'Indexing', 'B-Tree']
    },
    {
      id: 'k2',
      title: 'Database Sharding vs Table Partitioning',
      topic: 'System Design Interview Prep',
      date: 'Yesterday, 7:15 PM',
      summary: 'Sharding distributes data horizontally across separate database instances. Partitioning splits large tables within a single database instance.',
      tags: ['Sharding', 'Partitioning', 'Scale']
    },
    {
      id: 'k3',
      title: 'Load Balancing Strategies: Round Robin vs Least Connections',
      topic: 'AI Chat',
      date: 'Yesterday, 5:30 PM',
      summary: 'Round Robin assigns incoming requests sequentially. Least Connections routes traffic to the server with the fewest active sessions.',
      tags: ['Load Balancer', 'Networking']
    }
  ];

  return (
    <div className="tab-view-container">
      <div className="view-header-row">
        <div>
          <h2 className="view-title">Knowledge Base</h2>
          <p className="view-subtitle">Saved summaries, conceptual breakdowns, and notes from your sessions.</p>
        </div>
        <div className="search-bar knowledge-search">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Filter notes or concepts..." className="search-input" />
        </div>
      </div>

      <div className="knowledge-list">
        {notes.map((note) => (
          <div key={note.id} className="knowledge-card">
            <div className="knowledge-card-header">
              <div className="knowledge-title-group">
                <div className="knowledge-icon-bg">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="knowledge-card-title">{note.title}</h3>
                  <span className="knowledge-topic">{note.topic} • {note.date}</span>
                </div>
              </div>
              <button className="bookmark-btn" title="Bookmark">
                <Bookmark size={18} />
              </button>
            </div>

            <p className="knowledge-summary">{note.summary}</p>

            <div className="knowledge-footer">
              <div className="tags-row">
                {note.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
              <button 
                className="btn-outline-sm"
                onClick={() => onStartChatPrompt(`Explain in deeper detail: ${note.title}`)}
              >
                Quiz me on this
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
