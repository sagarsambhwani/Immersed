import React, { useState, useEffect } from 'react';
import { getProjectWorkflow, resumeWorkflowStep, evolveWorkflowStep } from '../services/api';

export default function AdaptiveWorkflow({ projectId, onClose, onRefreshProject }) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoNotice, setInfoNotice] = useState('');

  // Active Interaction Form State
  const [choiceSelection, setChoiceSelection] = useState('');
  const [freeformText, setFreeformText] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [reflectionText, setReflectionText] = useState('');
  const [validationValid, setValidationValid] = useState(true);
  const [validationEvidence, setValidationEvidence] = useState('');
  const [approvalApproved, setApprovalApproved] = useState(true);
  const [approvalFeedback, setApprovalFeedback] = useState('');

  // Change Direction / Evolve Modal State
  const [showEvolveModal, setShowEvolveModal] = useState(false);
  const [changeDirectionText, setChangeDirectionText] = useState('');
  const [changeRationaleText, setChangeRationaleText] = useState('');
  const [evolving, setEvolving] = useState(false);

  // Collapsible Phases State
  const [collapsedPhases, setCollapsedPhases] = useState({});

  useEffect(() => {
    if (projectId) {
      loadWorkflowState();
    }
  }, [projectId]);

  const loadWorkflowState = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProjectWorkflow(projectId);
      setWorkflow(data);
      initInteractionForm(data.active_interaction);
    } catch (err) {
      setError(err.message || 'Failed to load workflow state');
    } finally {
      setLoading(false);
    }
  };

  const initInteractionForm = (activeInter) => {
    if (!activeInter) return;
    if (activeInter.options && activeInter.options.length > 0) {
      setChoiceSelection(activeInter.options[0]);
    } else {
      setChoiceSelection('');
    }
    setFreeformText('');
    setQuestionAnswers({});
    setReflectionText('');
    setValidationValid(true);
    setValidationEvidence('');
    setApprovalApproved(true);
    setApprovalFeedback('');
  };

  const handleResolveStep = async (e) => {
    e.preventDefault();
    if (!workflow || !workflow.active_interaction) return;

    setSubmitting(true);
    setError('');
    setInfoNotice('');

    const activeInter = workflow.active_interaction;
    let resumeData = {};

    if (activeInter.type === 'choice') {
      resumeData = { selected_option: choiceSelection, custom_note: freeformText || undefined };
    } else if (activeInter.type === 'question') {
      resumeData = { answers: questionAnswers };
    } else if (activeInter.type === 'reflection') {
      resumeData = { reflection_text: reflectionText || freeformText };
    } else if (activeInter.type === 'validation') {
      resumeData = { is_valid: validationValid, evidence_notes: validationEvidence || undefined };
    } else if (activeInter.type === 'approval') {
      resumeData = { approved: approvalApproved, revision_request: approvalFeedback || undefined };
    } else if (activeInter.type === 'action') {
      resumeData = { completed: true, action_notes: freeformText || undefined };
    } else {
      resumeData = { text: freeformText };
    }

    try {
      const payload = {
        checkpoint_id: activeInter.interaction_id,
        expected_version: workflow.workflow_version,
        idempotency_key: `idemp_${projectId}_v${workflow.workflow_version}_${Date.now()}`,
        resume_data: resumeData
      };

      const res = await resumeWorkflowStep(projectId, payload);
      setWorkflow(res.workflow);
      initInteractionForm(res.workflow.active_interaction);
      if (onRefreshProject) onRefreshProject();
    } catch (err) {
      if (err.message && err.message.includes('409')) {
        setInfoNotice('This step was updated elsewhere. We have re-synced the latest state for you.');
        await loadWorkflowState();
      } else {
        setError(err.message || 'Failed to submit response');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvolveSubmit = async (e) => {
    e.preventDefault();
    if (!changeDirectionText.trim()) return;

    setEvolving(true);
    setError('');
    try {
      const payload = {
        expected_version: workflow.workflow_version,
        idempotency_key: `evolve_${projectId}_v${workflow.workflow_version}`,
        change_direction_statement: changeDirectionText.trim(),
        user_rationale: changeRationaleText.trim() || 'User updated goals'
      };
      const res = await evolveWorkflowStep(projectId, payload);
      setWorkflow(res.workflow);
      initInteractionForm(res.workflow.active_interaction);
      setShowEvolveModal(false);
      setChangeDirectionText('');
      setChangeRationaleText('');
      if (onRefreshProject) onRefreshProject();
    } catch (err) {
      if (err.message && err.message.includes('409')) {
        setInfoNotice('Workflow was modified in another session. Synchronizing latest state.');
        await loadWorkflowState();
      } else {
        setError(err.message || 'Failed to evolve workflow');
      }
    } finally {
      setEvolving(false);
    }
  };

  const togglePhaseCollapse = (phaseId) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  if (loading) {
    return (
      <div className="adaptive-modal-overlay" onClick={onClose}>
        <div className="adaptive-modal-card loading-card" onClick={(e) => e.stopPropagation()}>
          <div className="adaptive-spinner"></div>
          <h4>Externalizing & structuring intention...</h4>
        </div>
      </div>
    );
  }

  if (!workflow) return null;

  const activeInter = workflow.active_interaction;
  const isCompleted = workflow.status === 'completed';

  return (
    <div className="adaptive-modal-overlay" onClick={onClose}>
      <div className="adaptive-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Header & Intention */}
        <div className="adaptive-header">
          <div className="adaptive-title-row">
            <span className="adaptive-sparkle">🧠</span>
            <div>
              <div className="adaptive-tag-row">
                <span className="badge badge-domain">📌 {workflow.domain}</span>
                <span className="badge badge-plan">v{workflow.plan_version}</span>
              </div>
              <h3 className="adaptive-intention-title">{workflow.intention}</h3>
            </div>
          </div>
          <div className="adaptive-header-actions">
            <button className="btn-change-direction" onClick={() => setShowEvolveModal(true)}>
              🔄 Change direction
            </button>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Phase Breadcrumb Timeline */}
        <div className="phase-breadcrumb-bar">
          {workflow.phases.map((ph, idx) => {
            const isPhaseActive = ph.phase_id === workflow.active_phase_id;
            const isPhaseCompleted = ph.tasks.length > 0 && ph.tasks.every((t) => t.status === 'completed');
            return (
              <div key={ph.phase_id} className={`phase-crumb ${isPhaseActive ? 'active' : ''} ${isPhaseCompleted ? 'completed' : ''}`}>
                <div className="crumb-dot">{isPhaseCompleted ? '✓' : idx + 1}</div>
                <span className="crumb-title">{ph.title.split('·')[1] || ph.title}</span>
              </div>
            );
          })}
        </div>

        {error && <div className="adaptive-error-banner">{error}</div>}
        {infoNotice && <div className="adaptive-info-banner">{infoNotice}</div>}

        {/* Main Content Area */}
        <div className="adaptive-content-layout">
          {/* LEFT: Dominant Active Step Card */}
          <div className="active-step-column">
            {isCompleted ? (
              <div className="completion-celebration-card">
                <div className="celebration-icon">🎉</div>
                <h3>Intention Accomplished!</h3>
                <p>You have systematically completed all phases and tasks for this goal.</p>
                <div className="completion-stats">
                  <span>✓ {workflow.total_tasks_completed} Tasks completed</span>
                  <span>✨ {workflow.plan_version} Evolving iterations</span>
                </div>
                <button className="btn-primary" onClick={onClose}>View Summary & Close</button>
              </div>
            ) : activeInter ? (
              <div className="active-step-card">
                <div className="step-badge-row">
                  <span className="active-step-pill">⚡ NEXT STEP</span>
                  <span className="step-type-pill">{activeInter.type.toUpperCase()}</span>
                </div>

                <h4 className="active-step-title">{activeInter.title}</h4>
                <p className="active-step-prompt">{activeInter.prompt_message}</p>

                {/* Form Elements Based on Interaction Type */}
                <form onSubmit={handleResolveStep} className="interaction-form-body">
                  {activeInter.type === 'choice' && activeInter.options && (
                    <div className="options-selection-grid">
                      {activeInter.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`choice-card-btn ${choiceSelection === opt ? 'selected' : ''}`}
                          onClick={() => setChoiceSelection(opt)}
                        >
                          <span className="choice-radio">{choiceSelection === opt ? '●' : '○'}</span>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {activeInter.type === 'question' && activeInter.options && (
                    <div className="question-answers-list">
                      {activeInter.options.map((qText, i) => (
                        <div key={i} className="form-group">
                          <label className="wizard-label">{qText}</label>
                          <input
                            type="text"
                            className="wizard-input"
                            placeholder="Your answer..."
                            onChange={(e) => setQuestionAnswers({ ...questionAnswers, [`q_${i}`]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {(activeInter.type === 'reflection' || activeInter.type === 'freeform' || activeInter.type === 'action') && (
                    <div className="form-group">
                      <textarea
                        className="wizard-textarea"
                        rows="4"
                        placeholder="Type your response, thoughts, or notes..."
                        value={freeformText}
                        onChange={(e) => setFreeformText(e.target.value)}
                        required={activeInter.type !== 'action'}
                      />
                    </div>
                  )}

                  {activeInter.type === 'approval' && (
                    <div className="approval-toggle-group">
                      <label className="wizard-label">Do you approve this step?</label>
                      <div className="toggle-row">
                        <button
                          type="button"
                          className={`choice-card-btn ${approvalApproved ? 'selected' : ''}`}
                          onClick={() => setApprovalApproved(true)}
                        >
                          ✓ Approve & Proceed
                        </button>
                        <button
                          type="button"
                          className={`choice-card-btn ${!approvalApproved ? 'selected' : ''}`}
                          onClick={() => setApprovalApproved(false)}
                        >
                          ✕ Request Revision
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Why & What Happens Next Callout */}
                  <div className="step-context-box">
                    <div className="context-item">
                      <strong>Why we're asking:</strong>
                      <p>{activeInter.why_relevant}</p>
                    </div>
                    <div className="context-item">
                      <strong>What happens next:</strong>
                      <p>{activeInter.what_unlocks}</p>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary btn-step-submit" disabled={submitting}>
                    {submitting ? 'Saving Progress & Adapting...' : 'Continue →'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="active-step-card">
                <h4>No active step awaiting input.</h4>
              </div>
            )}
          </div>

          {/* RIGHT: Hierarchical Map (List of lists of doable things) */}
          <div className="workflow-tree-column">
            <h4 className="tree-heading">Workflow Map</h4>
            <div className="phases-tree-container">
              {workflow.phases.map((phase) => {
                const isCollapsed = collapsedPhases[phase.phase_id];
                return (
                  <div key={phase.phase_id} className="phase-tree-card">
                    <div className="phase-tree-header" onClick={() => togglePhaseCollapse(phase.phase_id)}>
                      <span className="accordion-toggle-icon">{isCollapsed ? '▶' : '▼'}</span>
                      <h5>{phase.title}</h5>
                    </div>

                    {!isCollapsed && (
                      <div className="phase-tasks-list">
                        {phase.tasks.map((task) => {
                          const isTaskActive = task.status === 'active' || task.status === 'waiting_for_input';
                          const isTaskCompleted = task.status === 'completed';
                          const isTaskSuperseded = task.status === 'superseded';

                          return (
                            <div
                              key={task.task_id}
                              className={`task-tree-item ${isTaskActive ? 'active' : ''} ${isTaskCompleted ? 'completed' : ''} ${isTaskSuperseded ? 'superseded' : ''}`}
                            >
                              <div className="task-status-indicator">
                                {isTaskCompleted ? '✓' : isTaskActive ? '⚡' : isTaskSuperseded ? '↻' : '🔒'}
                              </div>
                              <div className="task-content-info">
                                <span className="task-item-title">{task.title}</span>
                                {isTaskCompleted && task.user_response_summary && (
                                  <span className="task-completed-note">"{task.user_response_summary}"</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Change Direction Modal */}
        {showEvolveModal && (
          <div className="modal-overlay inner-overlay" onClick={() => setShowEvolveModal(false)}>
            <div className="evolve-dialog-card" onClick={(e) => e.stopPropagation()}>
              <h4>🔄 Change Direction</h4>
              <p className="evolve-dialog-desc">
                Your completed work will be permanently preserved. The AI will adapt your remaining steps based on your new direction or updated assumptions.
              </p>

              <div className="form-group">
                <label className="wizard-label">New Direction or Updated Assumption:</label>
                <textarea
                  className="wizard-textarea"
                  rows="3"
                  placeholder="e.g. Actually, I want to make an online exhibition instead of a physical space..."
                  value={changeDirectionText}
                  onChange={(e) => setChangeDirectionText(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="wizard-label">Why are you changing direction? (optional):</label>
                <input
                  type="text"
                  className="wizard-input"
                  placeholder="e.g. Broader audience reach and faster launch..."
                  value={changeRationaleText}
                  onChange={(e) => setChangeRationaleText(e.target.value)}
                />
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEvolveModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleEvolveSubmit}
                  disabled={evolving}
                >
                  {evolving ? 'Adapting remaining path...' : 'Update my workflow ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
