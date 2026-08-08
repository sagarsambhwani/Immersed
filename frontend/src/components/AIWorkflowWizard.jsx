import React, { useState } from 'react';
import { evaluateWorkflow, generateBlueprint } from '../services/api';

export default function AIWorkflowWizard({ isOpen, onClose, onProjectCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 Form Inputs
  const [goalStatement, setGoalStatement] = useState('');
  const [backgroundNotes, setBackgroundNotes] = useState('');
  const [domainPreference, setDomainPreference] = useState('');

  // Step 2 Evaluation Results
  const [evalResult, setEvalResult] = useState(null);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({});

  // Step 3 Blueprint Output
  const [generatedBlueprint, setGeneratedBlueprint] = useState(null);

  if (!isOpen) return null;

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!goalStatement.trim()) {
      setError('Please state your project idea or learning goal.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await evaluateWorkflow({
        goal_statement: goalStatement.trim(),
        background_notes: backgroundNotes.trim() || undefined,
        domain_preference: domainPreference.trim() || undefined,
      });
      setEvalResult(res);
      // Pre-fill default diagnostic answers with recommendations
      const initialAnswers = {};
      res.diagnostic_questions.forEach((q) => {
        initialAnswers[q.id] = q.recommendation || q.options[0];
      });
      setDiagnosticAnswers(initialAnswers);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to evaluate project idea.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBlueprint = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: `${evalResult.domain} - ${evalResult.archetype} Blueprint`,
        goal_statement: goalStatement,
        domain: evalResult.domain,
        archetype: evalResult.archetype,
        scaffolding_level: evalResult.scaffolding_level,
        diagnostic_answers: diagnosticAnswers,
      };
      const blueprint = await generateBlueprint(payload);
      setGeneratedBlueprint(blueprint);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to generate project blueprint.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onProjectCreated && generatedBlueprint) {
      onProjectCreated(generatedBlueprint);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wizard-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <div className="wizard-title-group">
            <span className="wizard-sparkle-icon">✨</span>
            <div>
              <h3 className="wizard-title">Agentic AI Project Designer</h3>
              <p className="wizard-subtitle">
                {step === 1 && 'Step 1: Goal Statement & Knowledge Probe'}
                {step === 2 && 'Step 2: Archetype Classification & Diagnostic Q&A'}
                {step === 3 && 'Step 3: Interactive Master Blueprint'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="wizard-error-banner">{error}</div>}

        {/* STEP 1: Discovery & Probe */}
        {step === 1 && (
          <form onSubmit={handleEvaluate} className="wizard-step-body">
            <div className="form-group">
              <label className="wizard-label">What project or subject do you want to master?</label>
              <textarea
                className="wizard-textarea"
                rows="3"
                placeholder="e.g. Build an automated RAG vector search engine while mastering transformer embeddings..."
                value={goalStatement}
                onChange={(e) => setGoalStatement(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="wizard-label">Your current background & familiarity level (optional):</label>
              <input
                type="text"
                className="wizard-input"
                placeholder="e.g. Intermediate Python, familiar with FastAPI, fresh to Vector DBs..."
                value={backgroundNotes}
                onChange={(e) => setBackgroundNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="wizard-label">Target Domain Tag (optional):</label>
              <input
                type="text"
                className="wizard-input"
                placeholder="e.g. AI & Machine Learning, System Architecture, Web Scraping..."
                value={domainPreference}
                onChange={(e) => setDomainPreference(e.target.value)}
              />
            </div>

            <div className="wizard-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Evaluating Knowledge Graph...' : 'Analyze & Classify Intent →'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Classification & Diagnostic Questions */}
        {step === 2 && evalResult && (
          <div className="wizard-step-body">
            <div className="wizard-classification-card">
              <div className="badge-row">
                <span className="badge badge-domain">📌 Domain: {evalResult.domain}</span>
                <span className="badge badge-archetype">⚡ Archetype: {evalResult.archetype}</span>
                <span className="badge badge-scaffold">🧠 Level: {evalResult.scaffolding_level}</span>
              </div>
              <p className="wizard-summary-text">{evalResult.knowledge_baseline_summary}</p>
            </div>

            <h4 className="wizard-section-heading">Diagnostic Alignment Suite (MCP)</h4>
            <div className="questions-list">
              {evalResult.diagnostic_questions.map((q) => (
                <div key={q.id} className="question-item-card">
                  <label className="question-title">{q.question}</label>
                  <div className="options-grid">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`option-chip ${diagnosticAnswers[q.id] === opt ? 'active' : ''}`}
                        onClick={() => setDiagnosticAnswers({ ...diagnosticAnswers, [q.id]: opt })}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="wizard-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="btn-primary" onClick={handleGenerateBlueprint} disabled={loading}>
                {loading ? 'Synthesizing Master Blueprint...' : 'Generate Master Blueprint 🚀'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Interactive Blueprint Output */}
        {step === 3 && generatedBlueprint && (
          <div className="wizard-step-body">
            <div className="blueprint-header-banner">
              <h4>🎯 {generatedBlueprint.title}</h4>
              <p>{generatedBlueprint.summary}</p>
            </div>

            <div className="phases-preview-container">
              {generatedBlueprint.phases.map((phase) => (
                <div key={phase.phase_number} className="phase-card-mini">
                  <div className="phase-badge">Phase {phase.phase_number} ({phase.duration_estimate})</div>
                  <h5>{phase.title}</h5>
                  <ul className="checkpoints-mini-list">
                    {phase.checkpoints.map((chk) => (
                      <li key={chk.id} className={`chk-type-${chk.type}`}>
                        <span className="chk-icon">{chk.type === 'conceptual' ? '💡' : '⚡'}</span>
                        <span>{chk.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="wizard-actions">
              <button type="button" className="btn-primary" onClick={handleFinish}>
                Save Project & Launch Roadmap ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
