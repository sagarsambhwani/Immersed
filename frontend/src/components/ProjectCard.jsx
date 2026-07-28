import React from 'react';
import { Folder, Plus, ArrowRight } from 'lucide-react';

export default function ProjectCard({
  isAddCard = false,
  title,
  progress = 0,
  lastActivity,
  onSelect,
  onAdd
}) {
  if (isAddCard) {
    return (
      <div className="project-card add-project-card" onClick={onAdd}>
        <div className="add-icon-wrapper">
          <Plus size={24} />
        </div>
        <h4 className="add-card-title">Add Project</h4>
        <p className="add-card-sub">Start a new learning pathway</p>
      </div>
    );
  }

  return (
    <div className="project-card minimal-project-card" onClick={onSelect}>
      <div className="project-card-header-minimal">
        <div className="project-icon-badge">
          <Folder size={18} />
        </div>
        <span className="project-activity-time">{lastActivity}</span>
      </div>

      <h3 className="project-name-minimal">{title}</h3>

      <div className="project-progress-container">
        <div className="progress-info-row">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{progress}%</span>
        </div>
        <div className="progress-track-bg">
          <div 
            className="progress-fill-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="project-hover-footer">
        <span>Continue Project</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}
