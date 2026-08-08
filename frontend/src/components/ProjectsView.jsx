import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import AdaptiveWorkflow from './AdaptiveWorkflow';
import { getProjects, createProject, startProjectWorkflow } from '../services/api';

export default function ProjectsView({ onStartChatPrompt }) {
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkflowProjectId, setActiveWorkflowProjectId] = useState(null);
  const [showNewIntentionModal, setShowNewIntentionModal] = useState(false);
  const [newIntentionText, setNewIntentionText] = useState('');
  const [newContextNotes, setNewContextNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      if (Array.isArray(data) && data.length > 0) {
        setProjectsList(data);
      } else {
        setProjectsList([
          {
            id: 'p1',
            title: 'Understand Quantum Mechanics from scratch',
            domain: 'Conceptual Learning',
            project_type: 'Learning',
            progress: 30,
            lastActivity: 'Today'
          },
          {
            id: 'p2',
            title: 'Examine claim: Is social media always harmful?',
            domain: 'Belief & Inquiry Investigation',
            project_type: 'Inquiry',
            progress: 50,
            lastActivity: 'Yesterday'
          },
          {
            id: 'p3',
            title: 'Curate an online art exhibition',
            domain: 'Creative & Curatorial Project',
            project_type: 'Creative',
            progress: 80,
            lastActivity: '3 days ago'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load projects from server', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchIntention = async (e) => {
    e.preventDefault();
    if (!newIntentionText.trim()) return;

    setCreating(true);
    try {
      // 1. Create Project row
      const proj = await createProject({
        title: newIntentionText.trim(),
        description: newContextNotes.trim() || 'Adaptive Intent Workflow',
        domain: 'Adaptive Exploration',
        project_type: 'Adaptive'
      });

      // 2. Start Workflow State Machine
      await startProjectWorkflow(proj.id, {
        intention: newIntentionText.trim(),
        context_notes: newContextNotes.trim() || undefined
      });

      setShowNewIntentionModal(false);
      setNewIntentionText('');
      setNewContextNotes('');
      await fetchProjects();
      setActiveWorkflowProjectId(proj.id);
    } catch (err) {
      alert('Failed to decompose intention: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectProject = (proj) => {
    setActiveWorkflowProjectId(proj.id);
  };

  return (
    <div className="view-page-container">
      <div className="page-header-clean flex-between">
        <div>
          <h2 className="page-title">Adaptive Intent & Action Engine</h2>
          <p className="page-subtitle">
            Externalize complex intentions into an evolving, structured hierarchy—guiding you one doable step at a time.
          </p>
        </div>
        <button className="btn-wizard-launch" onClick={() => setShowNewIntentionModal(true)}>
          ✨ Start New Intention
        </button>
      </div>

      {loading ? (
        <div className="projects-loading-spinner">Loading your active pathways...</div>
      ) : (
        <div className="projects-minimal-grid">
          {projectsList.map((proj) => (
            <ProjectCard
              key={proj.id}
              title={proj.title}
              progress={proj.progress || 0}
              lastActivity={proj.lastActivity || 'Active'}
              onSelect={() => handleSelectProject(proj)}
            />
          ))}

          <ProjectCard
            isAddCard={true}
            onAdd={() => setShowNewIntentionModal(true)}
          />
        </div>
      )}

      {/* New Intention Decomposer Modal */}
      {showNewIntentionModal && (
        <div className="modal-overlay" onClick={() => setShowNewIntentionModal(false)}>
          <div className="wizard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="wizard-header">
              <div className="wizard-title-group">
                <span className="wizard-sparkle-icon">💡</span>
                <div>
                  <h3 className="wizard-title">What are you trying to accomplish or understand?</h3>
                  <p className="wizard-subtitle">Learning, challenging a belief, creative project, writing, or building.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowNewIntentionModal(false)}>✕</button>
            </div>

            <form onSubmit={handleLaunchIntention} className="wizard-step-body">
              <div className="form-group">
                <label className="wizard-label">Your Intention or Question:</label>
                <textarea
                  className="wizard-textarea"
                  rows="3"
                  placeholder="e.g. 'I want to understand quantum mechanics from scratch' or 'I believe social media is always harmful' or 'Curate an online art gallery'..."
                  value={newIntentionText}
                  onChange={(e) => setNewIntentionText(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="wizard-label">Context, prior background, or initial thoughts (optional):</label>
                <input
                  type="text"
                  className="wizard-input"
                  placeholder="e.g. Familiar with basic physics, target audience is designers, etc."
                  value={newContextNotes}
                  onChange={(e) => setNewContextNotes(e.target.value)}
                />
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowNewIntentionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Decomposing Goal & Mapping Steps...' : 'Decompose & Map Path →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Primary Adaptive Workflow Experience */}
      {activeWorkflowProjectId && (
        <AdaptiveWorkflow
          projectId={activeWorkflowProjectId}
          onClose={() => setActiveWorkflowProjectId(null)}
          onRefreshProject={fetchProjects}
        />
      )}
    </div>
  );
}
