import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import KnowledgeView from './components/KnowledgeView';
import InsightsView from './components/InsightsView';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import BreathingWidget from './components/BreathingWidget';
import TaskPlanner from './components/TaskPlanner';
import FocusTimer from './components/FocusTimer';
import { ambientNoise } from './services/AmbientNoise';
import {
  getSessions,
  createSession,
  deleteSession,
  updateSession,
  getSessionMessages,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Sessions & Chat States
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // Modals & Sound States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [hideLeftSidebar, setHideLeftSidebar] = useState(false);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const [isCalmSounds, setIsCalmSounds] = useState(false);
  const [isDndMode, setIsDndMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Load sessions at startup
  useEffect(() => {
    loadSessions();
  }, []);

  // Dark Mode class toggle on body element
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Sync message histories when active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
    setStreamingContent('');
    setIsGenerating(false);
  }, [activeSessionId]);

  // Audio hook watching calm sounds toggle state
  useEffect(() => {
    if (isCalmSounds) {
      ambientNoise.start();
    } else {
      ambientNoise.stop();
    }
    return () => {
      ambientNoise.stop();
    };
  }, [isCalmSounds]);

  // DND Mode auto-collapses left sidebar
  useEffect(() => {
    if (isDndMode) {
      setHideLeftSidebar(true);
    } else {
      setHideLeftSidebar(false);
    }
  }, [isDndMode]);

  const loadSessions = async (selectNewId = null) => {
    try {
      const data = await getSessions();
      setSessions(data);
      if (data.length > 0) {
        if (selectNewId) {
          setActiveSessionId(selectNewId);
        } else if (!activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      } else {
        setActiveSessionId(null);
      }
    } catch (err) {
      console.error('Failed to load sessions list', err);
    }
  };

  const loadMessages = async (id) => {
    try {
      const history = await getSessionMessages(id);
      setMessages(history);
    } catch (err) {
      console.error('Failed to load message history', err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const defaultProvider = localStorage.getItem('default_provider');
      const defaultModel = localStorage.getItem('default_model');
      const defaultTemp = localStorage.getItem('default_temperature');
      const defaultSystemPrompt = localStorage.getItem('default_system_prompt');

      const payload = {};
      if (defaultProvider) payload.provider = defaultProvider;
      if (defaultModel) payload.model = defaultModel;
      if (defaultTemp !== null && defaultTemp !== undefined) payload.temperature = parseFloat(defaultTemp);
      if (defaultSystemPrompt) payload.system_prompt = defaultSystemPrompt;

      const newSession = await createSession(payload);
      await loadSessions(newSession.id);
      return newSession.id;
    } catch (err) {
      console.error('Failed to create new chat session', err);
      return null;
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteSession(id);
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat session', err);
    }
  };

  const handleRenameSession = async (id, newTitle) => {
    try {
      await updateSession(id, { title: newTitle });
      setSessions(
        sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
      );
    } catch (err) {
      console.error('Failed to rename session title', err);
    }
  };

  const handleSaveSettings = async (updatedSettings) => {
    // Save to localStorage as default settings for future sessions
    if (updatedSettings.provider) localStorage.setItem('default_provider', updatedSettings.provider);
    if (updatedSettings.model) localStorage.setItem('default_model', updatedSettings.model);
    if (updatedSettings.temperature !== undefined) localStorage.setItem('default_temperature', updatedSettings.temperature.toString());
    if (updatedSettings.system_prompt) localStorage.setItem('default_system_prompt', updatedSettings.system_prompt);

    if (!activeSessionId) return;
    try {
      const updated = await updateSession(activeSessionId, updatedSettings);
      setSessions(
        sessions.map((s) => (s.id === activeSessionId ? updated : s))
      );
    } catch (err) {
      console.error('Failed to update session settings', err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleSendMessage = async (text, customSessionId = null) => {
    const targetSessionId = customSessionId || activeSessionId;
    if (!targetSessionId || isGenerating) return;

    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      session_id: targetSessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsGenerating(true);
    setStreamingContent('');

    const { sendMessageStream } = await import('./services/api');
    let currentAccumulated = '';

    await sendMessageStream(
      targetSessionId,
      text,
      (chunk) => {
        currentAccumulated += chunk;
        setStreamingContent(currentAccumulated);
      },
      (error) => {
        console.error('Streaming failure', error);
        setIsGenerating(false);
        setStreamingContent('');
        
        const errorMsg = {
          id: `temp-error-${Date.now()}`,
          session_id: targetSessionId,
          role: 'assistant',
          content: `⚠️ Error generating response: ${error.message}. Please verify backend status.`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      },
      async () => {
        setIsGenerating(false);
        setStreamingContent('');
        await loadMessages(targetSessionId);
      }
    );
  };

  // Start chat session directly from Dashboard prompt or pills
  const handleStartChatPrompt = async (promptText) => {
    setActiveTab('chat');
    let targetId = activeSessionId;

    if (!targetId) {
      targetId = await handleCreateSession();
    }

    if (targetId) {
      setActiveSessionId(targetId);
      setTimeout(() => {
        handleSendMessage(promptText, targetId);
      }, 200);
    }
  };

  const handleNavigateTab = (tabId, optionalPrompt = null) => {
    setActiveTab(tabId);
    if (optionalPrompt && tabId === 'chat') {
      handleStartChatPrompt(optionalPrompt);
    }
  };

  const handleToggleFocusMode = () => {
    const nextVal = !isFocusMode;
    setIsFocusMode(nextVal);
    setHideLeftSidebar(nextVal);
    setHideRightSidebar(nextVal);
  };

  const containerClass = `app-container ${hideLeftSidebar ? 'hide-left' : ''} ${hideRightSidebar ? 'hide-right' : ''}`;

  return (
    <div className={containerClass}>
      {/* 1. LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBreathing={() => setIsBreathingOpen(true)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={handleToggleFocusMode}
        onToggleLeftSidebar={() => setHideLeftSidebar(!hideLeftSidebar)}
        isCalmSounds={isCalmSounds}
        setIsCalmSounds={setIsCalmSounds}
      />

      {/* 2. CENTER CONTENT WRAPPER */}
      <div className="main-content-area">
        <Header 
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          hideLeftSidebar={hideLeftSidebar}
          onToggleLeftSidebar={() => setHideLeftSidebar(!hideLeftSidebar)}
          hideRightSidebar={hideRightSidebar}
          onToggleRightSidebar={() => setHideRightSidebar(!hideRightSidebar)}
        />

        <main className="tab-view-content">
          {activeTab === 'home' && (
            <DashboardView
              onNavigateTab={handleNavigateTab}
              onStartChatPrompt={handleStartChatPrompt}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView onStartChatPrompt={handleStartChatPrompt} />
          )}

          {activeTab === 'chat' && (
            <ChatWindow
              activeSession={activeSession}
              messages={messages}
              streamingContent={streamingContent}
              isGenerating={isGenerating}
              onSendMessage={handleSendMessage}
              isFocusMode={isFocusMode}
              onToggleFocusMode={handleToggleFocusMode}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeView onStartChatPrompt={handleStartChatPrompt} />
          )}

          {activeTab === 'focus' && (
            <div className="tab-view-container">
              <h2 className="view-title">Focus & Deep Work</h2>
              <p className="view-subtitle">Gamified pomodoro timer and session planning.</p>
              <div style={{ marginTop: '20px', maxWidth: '400px' }}>
                <FocusTimer />
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="tab-view-container">
              <h2 className="view-title">Tasks & Checklist</h2>
              <p className="view-subtitle">Chunk down large study targets into actionable micro-goals.</p>
              <div style={{ marginTop: '20px', maxWidth: '500px' }}>
                <TaskPlanner />
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="tab-view-container">
              <h2 className="view-title">Study Calendar</h2>
              <p className="view-subtitle">Plan upcoming chapters and focus milestones.</p>
              <div className="calendar-placeholder-card">
                <h3>📅 July 2026 Focus Schedule</h3>
                <p>Peak performance window locked for <strong>9:00 AM – 11:00 AM daily</strong>.</p>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <InsightsView />
          )}

          {(activeTab === 'resources' || activeTab === 'templates') && (
            <KnowledgeView onStartChatPrompt={handleStartChatPrompt} />
          )}
        </main>
      </div>

      {/* 3. RIGHT SIDEBAR */}
      <RightSidebar 
        onNavigateTab={handleNavigateTab} 
        onToggleRightSidebar={() => setHideRightSidebar(!hideRightSidebar)}
      />

      {/* 4. MODALS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeSession={activeSession}
        onSave={handleSaveSettings}
      />

      <BreathingWidget
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />
    </div>
  );
}
