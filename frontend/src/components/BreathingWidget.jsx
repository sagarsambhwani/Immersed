import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function BreathingWidget({ isOpen, onClose }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isOpen) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((prev) => (prev + 1) % 12);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Visual text and state transitions synced to our 12-second CSS animation cycle
  const getBreathingState = () => {
    if (seconds < 4) {
      return { 
        text: 'Inhale...', 
        sub: 'Breathe in slowly through your nose 🌬️', 
        color: 'var(--accent-purple)' 
      };
    } else if (seconds < 8) {
      return { 
        text: 'Hold...', 
        sub: 'Keep your lungs filled and stay relaxed 🤫', 
        color: 'var(--accent-pink)' 
      };
    } else {
      return { 
        text: 'Exhale...', 
        sub: 'Breathe out slowly through your mouth 😌', 
        color: 'var(--accent-cyan)' 
      };
    }
  };

  const current = getBreathingState();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderColor: 'transparent' }}>
          <h3>Mindful Break</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="breath-bubble-container">
          <div className="breath-cloud-circle">
            🧘
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="breath-cloud-instruction" style={{ color: current.color }}>
              {current.text}
            </div>
            <div className="breath-cloud-timing">
              {current.sub}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ border: 'none', justifyContent: 'center', paddingBottom: '24px' }}>
          <button 
            className="settings-save-btn" 
            style={{ background: 'var(--text-secondary)', boxShadow: 'none' }}
            onClick={onClose}
          >
            I'm Ready to Resume
          </button>
        </div>
      </div>
    </div>
  );
}
