import React from 'react';
import { MessageSquare, ArrowUpRight } from 'lucide-react';

export default function ConversationRow({
  title,
  preview,
  time,
  icon: CustomIcon,
  isActive = false,
  onClick
}) {
  const Icon = CustomIcon || MessageSquare;

  return (
    <div 
      className={`conversation-row ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="conv-icon-col">
        <Icon size={16} className="conv-icon" />
      </div>

      <div className="conv-details-col">
        <h4 className="conv-title">{title}</h4>
        <p className="conv-preview">{preview}</p>
      </div>

      <div className="conv-meta-col">
        <span className="conv-time">{time}</span>
        <ArrowUpRight size={14} className="conv-hover-arrow" />
      </div>
    </div>
  );
}
