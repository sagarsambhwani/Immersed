import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function FocusTimer() {
  const [mode, setMode] = useState('focus'); // 'focus', 'short', 'long'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  const timerRef = useRef(null);
  
  // Base durations in seconds
  const durations = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  const totalDuration = durations[mode];
  const percentage = (timeLeft / totalDuration) * 100;
  
  // Circumference for SVG circular progress (r=60, C=2*pi*r ≈ 377)
  const strokeDashoffset = 377 - (377 * percentage) / 100;

  useEffect(() => {
    // Reset timer when mode changes
    setTimeLeft(durations[mode]);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            // Play a soft notification chime if supported
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.start();
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
              osc.stop(audioCtx.currentTime + 0.6);
            } catch (e) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  // Plant evolution stages based on progress (rewards ADHD users)
  const getPlantEmoji = () => {
    if (percentage > 80) return '🌱'; // Seedling
    if (percentage > 55) return '🌿'; // Growing herb
    if (percentage > 30) return '🪴'; // Plant in pot
    if (percentage > 5) return '🌳'; // Full tree
    return '🌸'; // Flower bloomed!
  };

  // Helper to format remaining duration as MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="widget-card">
      <div className="widget-title-row">
        <span className="widget-title">Focus Timer</span>
        <select 
          className="settings-select" 
          style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--accent-purple-light)', color: 'var(--accent-purple)', fontWeight: '600' }}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="focus">Focus (25m)</option>
          <option value="short">Short Break (5m)</option>
          <option value="long">Long Break (15m)</option>
        </select>
      </div>

      <div className="pomodoro-gauge-container">
        <svg className="pomodoro-gauge-svg">
          <circle cx="70" cy="70" r="60" className="pomodoro-gauge-track" />
          <circle 
            cx="70" 
            cy="70" 
            r="60" 
            className="pomodoro-gauge-progress"
            strokeDasharray="377"
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        
        <div className="pomodoro-gauge-center">
          <span className="pomodoro-plant-icon">{getPlantEmoji()}</span>
          <span className="pomodoro-time-text">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="timer-controls-row">
        <button className="timer-start-btn" onClick={toggleTimer}>
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>
        <button className="timer-config-btn" onClick={resetTimer} title="Reset Timer">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
