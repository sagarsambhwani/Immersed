import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function TaskPlanner() {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  // 1. Initial load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('focusbuddy_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks(getDefaultTasks());
      }
    } else {
      setTasks(getDefaultTasks());
    }
  }, []);

  // Helper to return initial suggestions to help direct the user
  const getDefaultTasks = () => [
    { id: '1', text: 'Break down a photosynthesis query', completed: true },
    { id: '2', text: 'Take a 2-minute breathing break', completed: false },
    { id: '3', text: 'Complete a concept review quiz', completed: false },
  ];

  // 2. Persist updates to localStorage
  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    localStorage.setItem('focusbuddy_tasks', JSON.stringify(updatedTasks));
  };

  const handleAddTask = (e) => {
    e?.preventDefault();
    if (newTaskText.trim()) {
      const newTask = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
      };
      saveTasks([...tasks, newTask]);
      setNewTaskText('');
    }
  };

  const handleToggleTask = (id) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updated);
  };

  const handleDeleteTask = (id) => {
    const updated = tasks.filter((task) => task.id !== id);
    saveTasks(updated);
  };

  return (
    <div className="widget-card">
      <span className="widget-title" style={{ marginBottom: '6px' }}>Today's Plan</span>
      
      <div className="task-list">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={`task-item ${task.completed ? 'completed' : ''}`}
          >
            <input 
              type="checkbox" 
              className="task-checkbox" 
              checked={task.completed}
              onChange={() => handleToggleTask(task.id)}
            />
            <span className="task-text">{task.text}</span>
            <button 
              className="task-delete-btn" 
              onClick={() => handleDeleteTask(task.id)}
              title="Delete task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddTask} className="task-add-row">
        <input 
          type="text" 
          className="task-add-input" 
          placeholder="Add a learning task..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
        />
        <button type="submit" className="task-add-btn" title="Add Task">
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
