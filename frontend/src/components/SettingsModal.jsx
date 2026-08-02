import React, { useState, useEffect } from 'react';
import { X, Key } from 'lucide-react';
import { getModels, getSavedKeys, saveKeys } from '../services/api';

export default function SettingsModal({ isOpen, onClose, activeSession, onSave }) {
  const [providersList, setProvidersList] = useState([]);
  const [showAllKeys, setShowAllKeys] = useState(false);
  
  // Active session parameters
  const [provider, setProvider] = useState('mock');
  const [model, setModel] = useState('mock-gpt');
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [modelDescription, setModelDescription] = useState('');

  // Local storage API keys states
  const [apiKeyOpenAI, setApiKeyOpenAI] = useState('');
  const [apiKeyOpenRouter, setApiKeyOpenRouter] = useState('');
  const [apiKeyGroq, setApiKeyGroq] = useState('');
  const [apiKeyAnthropic, setApiKeyAnthropic] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // 1. Fetch available models from backend
    getModels()
      .then((data) => {
        setProvidersList(data);
      })
      .catch((err) => console.error('Failed to load supported LLM models', err));

    // 2. Fetch local storage keys
    const keys = getSavedKeys();
    setApiKeyOpenAI(keys.openai || '');
    setApiKeyOpenRouter(keys.openrouter || '');
    setApiKeyGroq(keys.groq || '');
    setApiKeyAnthropic(keys.anthropic || '');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (activeSession) {
      setProvider(activeSession.provider || 'mock');
      setModel(activeSession.model || 'mock-gpt');
      setTemperature(activeSession.temperature !== undefined ? activeSession.temperature : 0.7);
      setSystemPrompt(activeSession.system_prompt || 'You are a helpful assistant.');
    } else {
      // Fallback to saved default settings or initial defaults
      const defProvider = localStorage.getItem('default_provider') || 'mock';
      const defModel = localStorage.getItem('default_model') || 'mock-gpt';
      const defTemp = localStorage.getItem('default_temperature');
      const defPrompt = localStorage.getItem('default_system_prompt');

      setProvider(defProvider);
      setModel(defModel);
      setTemperature(defTemp !== null ? parseFloat(defTemp) : 0.7);
      setSystemPrompt(defPrompt || 'You are a helpful assistant.');
    }
  }, [activeSession, isOpen]);

  // Filter models for the currently selected provider
  const activeProviderData = providersList.find(
    (p) => p.provider.toLowerCase() === provider.toLowerCase()
  );
  const isServerConfigured = activeProviderData ? activeProviderData.is_configured : false;
  const modelsForProvider = activeProviderData ? activeProviderData.models : [];

  // Handle setting model metadata descriptions dynamically
  useEffect(() => {
    if (activeProviderData && model) {
      const selectedModelInfo = activeProviderData.models.find(m => m.id === model);
      setModelDescription(selectedModelInfo ? (selectedModelInfo.description || '') : '');
    } else {
      setModelDescription('');
    }
  }, [model, provider, activeProviderData]);

  if (!isOpen) return null;

  const handleProviderChange = (e) => {
    const selectedProvider = e.target.value;
    setProvider(selectedProvider);
    
    // Automatically select the first model of the new provider
    const provData = providersList.find(
      (p) => p.provider.toLowerCase() === selectedProvider.toLowerCase()
    );
    if (provData && provData.models && provData.models.length > 0) {
      setModel(provData.models[0].id);
    } else {
      setModel('');
    }
  };

  const handleSave = () => {
    // 1. Save keys to localStorage
    saveKeys({
      openai: apiKeyOpenAI,
      openrouter: apiKeyOpenRouter,
      groq: apiKeyGroq,
      anthropic: apiKeyAnthropic,
    });

    // 2. Trigger session updates
    onSave({
      provider,
      model,
      temperature: parseFloat(temperature),
      system_prompt: systemPrompt,
    });

    onClose();
  };

  const currentProviderLower = provider.toLowerCase();
  const showOpenAI = showAllKeys || currentProviderLower === 'openai';
  const showOpenRouter = showAllKeys || currentProviderLower === 'openrouter';
  const showGroq = showAllKeys || currentProviderLower === 'groq';
  const showAnthropic = showAllKeys || currentProviderLower === 'anthropic';

  const checkConfigured = (pName) => {
    const pData = providersList.find((p) => p.provider.toLowerCase() === pName);
    return pData ? pData.is_configured : false;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chat Configuration</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 1. Provider Select */}
          <div className="settings-group">
            <label className="settings-label">LLM Provider</label>
            <select 
              className="settings-select" 
              value={provider} 
              onChange={handleProviderChange}
            >
              {providersList.map((p) => (
                <option key={p.provider} value={p.provider}>
                  {p.provider.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Model Select */}
          <div className="settings-group">
            <label className="settings-label">Model Selection</label>
            <select 
              className="settings-select" 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              disabled={modelsForProvider.length === 0}
            >
              {modelsForProvider.length === 0 && (
                <option value="">No models available</option>
              )}
              {modelsForProvider.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {modelDescription && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic', lineHeight: '1.4' }}>
                {modelDescription}
              </p>
            )}
          </div>

          {/* 3. Creative Temperature */}
          <div className="settings-group">
            <label className="settings-label">Temperature (Creativity)</label>
            <div className="settings-slider-wrapper">
              <input 
                type="range" 
                className="settings-slider" 
                min="0.0" 
                max="2.0" 
                step="0.1" 
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <span className="settings-slider-val">{temperature}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>Precise / Codegen</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          {/* 4. System Prompt */}
          <div className="settings-group">
            <label className="settings-label">System Instructions (Prompt)</label>
            <textarea 
              className="settings-textarea" 
              value={systemPrompt} 
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Provide system instructions for the LLM..."
            />
          </div>

          <hr style={{ borderColor: 'var(--border-glass)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Key size={14} /> Local API Key Overrides
            </h4>
            <button 
              type="button"
              onClick={() => setShowAllKeys(!showAllKeys)} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {showAllKeys ? 'Hide Other Provider Keys' : 'Show All Provider Keys'}
            </button>
          </div>

          {/* OpenAI Key */}
          {showOpenAI && (
            <div className="settings-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="settings-label" style={{ fontSize: '0.75rem' }}>OpenAI API Key</label>
                {checkConfigured('openai') && <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>✓ Configured on Server</span>}
              </div>
              <input 
                type="password" 
                className="settings-input" 
                value={apiKeyOpenAI}
                onChange={(e) => setApiKeyOpenAI(e.target.value)}
                placeholder={checkConfigured('openai') ? "Using server key (override optional)" : "sk-proj-..."}
              />
            </div>
          )}

          {/* OpenRouter Key */}
          {showOpenRouter && (
            <div className="settings-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="settings-label" style={{ fontSize: '0.75rem' }}>OpenRouter API Key</label>
                {checkConfigured('openrouter') && <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>✓ Configured on Server</span>}
              </div>
              <input 
                type="password" 
                className="settings-input" 
                value={apiKeyOpenRouter}
                onChange={(e) => setApiKeyOpenRouter(e.target.value)}
                placeholder={checkConfigured('openrouter') ? "Using server key (override optional)" : "sk-or-v1-..."}
              />
            </div>
          )}

          {/* Groq Key */}
          {showGroq && (
            <div className="settings-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="settings-label" style={{ fontSize: '0.75rem' }}>Groq API Key</label>
                {checkConfigured('groq') && <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>✓ Configured on Server</span>}
              </div>
              <input 
                type="password" 
                className="settings-input" 
                value={apiKeyGroq}
                onChange={(e) => setApiKeyGroq(e.target.value)}
                placeholder={checkConfigured('groq') ? "Using server key (override optional)" : "gsk_..."}
              />
            </div>
          )}

          {/* Anthropic Key */}
          {showAnthropic && (
            <div className="settings-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="settings-label" style={{ fontSize: '0.75rem' }}>Anthropic API Key</label>
                {checkConfigured('anthropic') && <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>✓ Configured on Server</span>}
              </div>
              <input 
                type="password" 
                className="settings-input" 
                value={apiKeyAnthropic}
                onChange={(e) => setApiKeyAnthropic(e.target.value)}
                placeholder={checkConfigured('anthropic') ? "Using server key (override optional)" : "sk-ant-..."}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="settings-save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
