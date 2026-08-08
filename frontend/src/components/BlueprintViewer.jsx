import React, { useState } from 'react';
import { evolveBlueprint } from '../services/api';

export default function BlueprintViewer({ project, onUpdateProject, onClose }) {
  const [blueprint, setBlueprint] = useState(() => {
    if (!project || !project.blueprint_data) return null;
    try {
      return typeof project.blueprint_data === 'string'
        ? JSON.parse(project.blueprint_data)
        : project.blueprint_data;
    } catch (err) {
      console.error('Failed to parse blueprint_data', err);
      return null;
    }
  });

  const [expandedPhases, setExpandedPhases] = useState({ 1: true });
  const [showEvolveModal, setShowEvolveModal] = useState(false);
  const [proposedChange, setProposedChange] = useState('');
  const [userRationale, setUserRationale] = useState('');
  const [evolving, setEvolving] = useState(false);
  const [error, setError] = useState('');

  if (!project) return null;

  const togglePhase = (phaseNum) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseNum]: !prev[phaseNum],
    }));
  };

  const handleEvolveSubmit = async (e) => {
    e.preventDefault();
    if (!proposedChange.trim() || !userRationale.trim()) {
      setError('Please provide both the proposed change and your rationale.');
      return;
    }
    setEvolving(true);
    setError('');
    try {
      const res = await evolveBlueprint({
        project_id: project.id,
        current_blueprint: blueprint,
        proposed_change: proposedChange.trim(),
        user_rationale: userRationale.trim(),
      });
      setBlueprint(res.updated_blueprint);
      setShowEvolveModal(false);
      setProposedChange('');
      setUserRationale('');
      if (onUpdateProject) {
        onUpdateProject({
          ...project,
          blueprint_data: JSON.stringify(res.updated_blueprint),
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to evolve blueprint.');
    } finally {
      setEvolving(false);
    }
  };

  return (
    <div className="blueprint-drawer-overlay" onClick={onClose}>
      <div className="blueprint-drawer-card" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="blueprint-drawer-header">
          <div>
            <div className="blueprint-title-row">
              <span className="blueprint-icon">🗺️</span>
              <h3>{project.title}</h3>
              <span className="version-pill">v{blueprint?.version || 1}</span>
            </div>
            <p className="blueprint-desc">{project.description || 'Agentic AI Master Blueprint'}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Badges & Meta */}
        <div className="blueprint-meta-bar">
          <span className="meta-tag tag-domain">📌 {project.domain || blueprint?.domain || 'General'}</span>
          <span className="meta-tag tag-type">⚡ {project.project_type || blueprint?.archetype || 'Mixed'}</span>
          <span className="meta-tag tag-level">🧠 Level: {blueprint?.scaffolding_level || 'intermediate'}</span>
          <button className="btn-evolve" onClick={() => setShowEvolveModal(true)}>
            🔄 Evolve Blueprint
          </button>
        </div>

        {/* Blueprint Content */}
        {!blueprint ? (
          <div className="empty-blueprint-notice">
            <p>No interactive blueprint data available for this project.</p>
          </div>
        ) : (
          <div className="blueprint-phases-scroll">
            {/* Change Log Notice if evolved */}
            {blueprint.change_log && blueprint.change_log.length > 0 && (
              <div className="changelog-banner">
                <h5>📜 Blueprint Evolution History ({blueprint.change_log.length})</h5>
                {blueprint.change_log.slice(0, 2).map((entry, idx) => (
                  <div key={idx} className="changelog-entry">
                    <strong>Change:</strong> {entry.proposed_change}<br />
                    <em>Rationale:</em> {entry.rationale}
                  </div>
                ))}
              </div>
            )}

            {/* Phases Accordion */}
            {blueprint.phases.map((phase) => {
              const isExpanded = expandedPhases[phase.phase_number];
              return (
                <div key={phase.phase_number} className="phase-accordion-card">
                  <div
                    className="phase-accordion-header"
                    onClick={() => togglePhase(phase.phase_number)}
                  >
                    <div className="phase-accordion-title">
                      <span className="accordion-arrow">{isExpanded ? '▼' : '▶'}</span>
                      <h4>{phase.title}</h4>
                    </div>
                    <span className="duration-chip">⏱️ {phase.duration_estimate}</span>
                  </div>

                  {isExpanded && (
                    <div className="phase-accordion-body">
                      {phase.objectives && phase.objectives.length > 0 && (
                        <div className="phase-objectives">
                          <strong>Key Objectives:</strong>
                          <ul>
                            {phase.objectives.map((obj, i) => (
                              <li key={i}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <h5 className="checkpoints-subheading">Checkpoints & Deliverables:</h5>
                      <div className="checkpoints-grid">
                        {phase.checkpoints.map((chk) => (
                          <div key={chk.id} className={`checkpoint-card type-${chk.type}`}>
                            <div className="checkpoint-type-badge">
                              {chk.type === 'conceptual' ? '💡 Concept Checkpoint' : '⚡ Task Deliverable'}
                            </div>
                            <h6 className="checkpoint-title">{chk.title}</h6>
                            <p className="checkpoint-desc">{chk.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Adaptability Hooks */}
            {blueprint.adaptability_hooks && (
              <div className="hooks-container">
                <h5>🪝 Adaptability & Steering Hooks</h5>
                <ul>
                  {blueprint.adaptability_hooks.map((hook, i) => (
                    <li key={i}>{hook}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Evolve Modal Popover */}
        {showEvolveModal && (
          <div className="modal-overlay inner-overlay" onClick={() => setShowEvolveModal(false)}>
            <div className="evolve-dialog-card" onClick={(e) => e.stopPropagation()}>
              <h4>🔄 User-Driven Blueprint Evolution</h4>
              <p className="evolve-dialog-desc">
                Propose a scope change, tech stack swap, or theory pivot. The AI reasoner will adapt your project graph while preserving prior progress.
              </p>

              {error && <div className="wizard-error-banner">{error}</div>}

              <div className="form-group">
                <label className="wizard-label">Proposed Modification / Pivot:</label>
                <input
                  type="text"
                  className="wizard-input"
                  placeholder="e.g. Switch vector database from Chroma to Qdrant Cloud"
                  value={proposedChange}
                  onChange={(e) => setProposedChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="wizard-label">Your Rationale / Reasoning:</label>
                <textarea
                  className="wizard-textarea"
                  rows="3"
                  placeholder="e.g. We need managed serverless scaling and fast cosine index filtering..."
                  value={userRationale}
                  onChange={(e) => setUserRationale(e.target.value)}
                />
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEvolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleEvolveSubmit}
                  disabled={evolving}
                >
                  {evolving ? 'Re-evaluating Blueprint Graph...' : 'Apply Evolution & Re-plan ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
