import React from 'react';
import { Folder, Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function ProjectsView({ onStartChatPrompt }) {
  const projects = [
    {
      id: 'p1',
      title: 'System Design Interview Prep',
      category: 'Computer Science & Software Architecture',
      progress: 75,
      completedTopics: 12,
      totalTopics: 16,
      lastActive: 'Yesterday',
      status: 'Active'
    },
    {
      id: 'p2',
      title: 'Data Structures & Algorithms',
      category: 'LeetCode & Problem Solving',
      progress: 40,
      completedTopics: 8,
      totalTopics: 20,
      lastActive: '3 days ago',
      status: 'In Progress'
    },
    {
      id: 'p3',
      title: 'Frontend Mastery & React Patterns',
      category: 'Web Development',
      progress: 90,
      completedTopics: 18,
      totalTopics: 20,
      lastActive: '1 week ago',
      status: 'Near Completion'
    }
  ];

  return (
    <div className="tab-view-container">
      <div className="view-header-row">
        <div>
          <h2 className="view-title">Projects</h2>
          <p className="view-subtitle">Organize and focus on your active learning pathways.</p>
        </div>
        <button className="btn-primary-purple">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.map((proj) => (
          <div key={proj.id} className="project-card">
            <div className="project-card-header">
              <div className="project-icon-badge">
                <Folder size={20} />
              </div>
              <span className="project-status-pill">{proj.status}</span>
            </div>

            <h3 className="project-title">{proj.title}</h3>
            <p className="project-category">{proj.category}</p>

            <div className="project-progress-bar-wrapper">
              <div className="progress-label-row">
                <span>Progress</span>
                <span>{proj.progress}%</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${proj.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="project-stats-row">
              <div className="stat-item">
                <CheckCircle2 size={15} className="stat-icon icon-green" />
                <span>{proj.completedTopics}/{proj.totalTopics} Topics</span>
              </div>
              <div className="stat-item">
                <Clock size={15} className="stat-icon" />
                <span>{proj.lastActive}</span>
              </div>
            </div>

            <button 
              className="project-action-btn"
              onClick={() => onStartChatPrompt(`Let's work on project: ${proj.title}`)}
            >
              Continue Project <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
