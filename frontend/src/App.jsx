import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import RightSidebar from './components/RightSidebar';
import BreathingWidget from './components/BreathingWidget';
import { ambientNoise } from './services/AmbientNoise';
import {
  getSessions,
  createSession,
  deleteSession,
  updateSession,
  getSessionMessages,
} from './services/api';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // Modals and sidebars visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [hideLeftSidebar, setHideLeftSidebar] = useState(false);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const [isCalmSounds, setIsCalmSounds] = useState(false);
  const [isDndMode, setIsDndMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Load all sessions at startup
  useEffect(() => {
    loadSessions();
  }, []);

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

  // DND Mode auto-collapses left sidebar to minimize distraction
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
      const newSession = await createSession();
      await loadSessions(newSession.id);
    } catch (err) {
      console.error('Failed to create new chat session', err);
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

  const handleSendMessage = async (text) => {
    if (!activeSessionId || isGenerating) return;

    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      session_id: activeSessionId,
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
      activeSessionId,
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
          session_id: activeSessionId,
          role: 'assistant',
          content: `⚠️ Error generating response: ${error.message}. Please check your model configuration and API keys.`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      },
      async () => {
        setIsGenerating(false);
        setStreamingContent('');
        await loadMessages(activeSessionId);
      }
    );
  };

  // Toggle full centered workspace by hiding both sidebars
  const handleToggleFocusMode = () => {
    const nextVal = !isFocusMode;
    setIsFocusMode(nextVal);
    setHideLeftSidebar(nextVal);
    setHideRightSidebar(nextVal);
  };

  const activeSession = Array.isArray(sessions) ? sessions.find((s) => s.id === activeSessionId) : undefined;
  const containerClass = `app-container ${hideLeftSidebar ? 'hide-left' : ''} ${hideRightSidebar ? 'hide-right' : ''}`;

  return (
    <div className={containerClass}>
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBreathing={() => setIsBreathingOpen(true)}
      />

      <ChatWindow
        activeSession={activeSession}
        messages={messages}
        streamingContent={streamingContent}
        isGenerating={isGenerating}
        onSendMessage={handleSendMessage}
        isFocusMode={isFocusMode}
        onToggleFocusMode={handleToggleFocusMode}
      />

      <RightSidebar
        hideLeftSidebar={hideLeftSidebar}
        setHideLeftSidebar={setHideLeftSidebar}
        isCalmSounds={isCalmSounds}
        setIsCalmSounds={setIsCalmSounds}
        isDndMode={isDndMode}
        setIsDndMode={setIsDndMode}
      />

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
