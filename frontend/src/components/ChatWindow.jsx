import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, MessageSquare, BookOpen, Layers, 
  HelpCircle, Image, FileText, Plus, Paperclip, Globe, Mic, Sparkles 
} from 'lucide-react';
import MessageItem from './MessageItem';
import Loader from './Loader';

// ADHD Quick Action shortcuts
const QUICK_ACTIONS = [
  { 
    id: 'explain',
    title: 'Explain a concept', 
    desc: 'Step-by-step', 
    prefix: 'Can you explain ', 
    icon: <BookOpen size={16} />, 
    bg: '#ecfdf5', 
    color: '#059669' 
  },
  { 
    id: 'breakdown',
    title: 'Break it down', 
    desc: 'Simplify any topic', 
    prefix: 'Can you break down ', 
    icon: <Layers size={16} />, 
    bg: '#fef3c7', 
    color: '#d97706' 
  },
  { 
    id: 'quiz',
    title: 'Quiz me', 
    desc: 'Test your knowledge', 
    prefix: 'Can you quiz me on ', 
    icon: <HelpCircle size={16} />, 
    bg: '#fdf2f8', 
    color: '#db2777' 
  },
  { 
    id: 'visual',
    title: 'Make a visual', 
    desc: 'Diagrams & charts', 
    prefix: 'Can you make a diagram of ', 
    icon: <Image size={16} />, 
    bg: '#f5f0ff', 
    color: '#7c3aed' 
  },
  { 
    id: 'summarize',
    title: 'Summarize', 
    desc: 'Short & clear', 
    prefix: 'Can you summarize ', 
    icon: <FileText size={16} />, 
    bg: '#ecfeff', 
    color: '#0891b2' 
  }
];

// Contextual follow-up suggestions for ADHD learning loop
const FOLLOW_UP_PILLS = [
  'Break it down more',
  'Give real-world example',
  'Quiz me on this',
  'Explain step-by-step',
];

export default function ChatWindow({
  activeSession,
  messages,
  streamingContent,
  isGenerating,
  onSendMessage,
  isFocusMode,
  onToggleFocusMode
}) {
  const [inputText, setInputText] = useState('');
  const feedRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (inputText.trim() && !isGenerating) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (prefix) => {
    setInputText(prefix);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handlePillClick = (pillText) => {
    if (!isGenerating) {
      onSendMessage(pillText);
    }
  };

  if (!activeSession) {
    return (
      <div className="chat-container">
        <div className="empty-chat-buddy">
          <Bot className="empty-icon" style={{ width: '64px', height: '64px', strokeWidth: 1.2, color: 'var(--accent-purple)' }} />
          <h2>Welcome to FocusBuddy</h2>
          <p>Your friendly ADHD-friendly teaching assistant. Create a chat session to start learning one small step at a time.</p>
        </div>
      </div>
    );
  }

  // Determine the last assistant message index
  const lastAssistantIndex = [...messages].reverse().findIndex(msg => msg.role === 'assistant');
  const lastAssistantId = lastAssistantIndex !== -1 ? messages[messages.length - 1 - lastAssistantIndex].id : null;

  return (
    <div className="chat-container">
      {/* 1. Chat Header */}
      <header className="chat-header">
        <div>
          <div className="greeting-text">Hey Alex! 👋</div>
          <div className="greeting-subtext">Let's learn, one small step at a time.</div>
        </div>

        <div className="chat-header-actions">
          <button 
            className={`focus-toggle-btn ${isFocusMode ? 'active' : ''}`}
            onClick={onToggleFocusMode}
            title="Focus Mode collapses sidebars to minimize distractions"
          >
            <Sparkles size={14} />
            <span>{isFocusMode ? 'Focus Mode Active' : 'Focus Mode'}</span>
          </button>
        </div>
      </header>

      {/* 2. Message Feed */}
      <div ref={feedRef} className="message-feed">
        {messages.length === 0 && !streamingContent && (
          <div className="empty-chat-buddy">
            <Bot className="empty-icon" style={{ width: '60px', height: '60px', strokeWidth: 1.2, color: 'var(--accent-purple)' }} />
            <h2>Conversational Feed Empty</h2>
            <p>Select one of the learning tools below or type a custom question to begin.</p>
            
            <div className="quick-actions-row">
              {QUICK_ACTIONS.map((action) => (
                <div 
                  key={action.id} 
                  className="quick-action-card"
                  onClick={() => handleQuickAction(action.prefix)}
                >
                  <div className="quick-action-icon" style={{ background: action.bg, color: action.color }}>
                    {action.icon}
                  </div>
                  <div className="quick-action-title">{action.title}</div>
                  <div className="quick-action-desc">{action.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Items List */}
        {messages.map((msg) => {
          const showPills = msg.id === lastAssistantId && !isGenerating && !streamingContent;
          return (
            <React.Fragment key={msg.id}>
              <MessageItem message={msg} />
              
              {/* Contextual Suggestions for last assistant bubble */}
              {showPills && (
                <div className="pills-container">
                  {FOLLOW_UP_PILLS.map((pill, pIdx) => (
                    <button 
                      key={pIdx} 
                      className="suggestion-pill"
                      onClick={() => handlePillClick(pill)}
                    >
                      <Sparkles size={10} style={{ color: 'var(--accent-purple)' }} />
                      <span>{pill}</span>
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Streaming completion content */}
        {streamingContent && (
          <MessageItem message={{ role: 'assistant', content: streamingContent }} />
        )}
        
        {/* Loading bubble */}
        {isGenerating && !streamingContent && (
          <div className="message-wrapper assistant">
            <div className="message-avatar" style={{ background: 'var(--accent-cyan-light)', color: 'var(--accent-cyan)' }}>
              <Bot size={20} />
            </div>
            <div className="message-bubble" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(124, 58, 237, 0.05)', borderLeft: '3px solid var(--accent-cyan)' }}>
              <Loader />
            </div>
          </div>
        )}

      </div>

      {/* 3. Input Textbox container */}
      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          {/* Action icon fillers matching mock design */}
          <button type="button" className="chat-input-icon-btn" title="Add shortcut"><Plus size={18} /></button>
          <button type="button" className="chat-input-icon-btn" title="Attach file"><Paperclip size={18} /></button>
          <button type="button" className="chat-input-icon-btn" title="Web search"><Globe size={18} /></button>
          
          <textarea
            ref={inputRef}
            className="chat-textarea"
            placeholder={isGenerating ? "Focusing..." : "Ask FocusBuddy anything..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          
          <button type="button" className="chat-input-icon-btn" title="Voice dictation"><Mic size={18} /></button>
          
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!inputText.trim() || isGenerating}
          >
            <Send size={15} />
          </button>
        </form>
        
        <div className="chat-footer-tip">
          <span>💡 Tip: Take breaks. You learn better when your brain feels good!</span>
        </div>
      </div>
    </div>
  );
}
