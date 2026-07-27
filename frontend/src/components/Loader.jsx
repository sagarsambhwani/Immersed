import React from 'react';

export default function Loader() {
  return (
    <div className="loading-bubble" aria-label="Thinking">
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
}
