import React, { useState } from 'react';
import ProjectCard from './ProjectCard';

export default function ProjectsView({ onStartChatPrompt }) {
  const [projectsList, setProjectsList] = useState([
    {
      id: 'p1',
      title: 'System Design Interview Prep',
      progress: 75,
      lastActivity: 'Yesterday'
    },
    {
      id: 'p2',
      title: 'Data Structures & Algorithms',
      progress: 40,
      lastActivity: '3 days ago'
    },
    {
      id: 'p3',
      title: 'Frontend Mastery & React Patterns',
      progress: 90,
      lastActivity: '1 week ago'
    }
  ]);

  const handleAddProject = () => {
    const title = prompt('Enter project name:');
    if (title && title.trim()) {
      const newProj = {
        id: `p-${Date.now()}`,
        title: title.trim(),
        progress: 0,
        lastActivity: 'Just now'
      };
      setProjectsList([newProj, ...projectsList]);
    }
  };

  return (
    <div className="view-page-container">
      <div className="page-header-clean">
        <h2 className="page-title">Projects</h2>
        <p className="page-subtitle">Minimal pathways focused on active learning targets.</p>
      </div>

      <div className="projects-minimal-grid">
        {projectsList.map((proj) => (
          <ProjectCard
            key={proj.id}
            title={proj.title}
            progress={proj.progress}
            lastActivity={proj.lastActivity}
            onSelect={() => onStartChatPrompt(`Let's work on project: ${proj.title}`)}
          />
        ))}

        <ProjectCard
          isAddCard={true}
          onAdd={handleAddProject}
        />
      </div>
    </div>
  );
}
