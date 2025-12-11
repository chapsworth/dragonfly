import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AppIcon({ icon: Icon, label, page, color, badge, onClick }) {
  const content = (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div className="relative">
        <div 
          className={`w-[60px] h-[60px] rounded-[13px] shadow-lg flex items-center justify-center ${color}`}
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)'
          }}
        >
          <Icon className="w-8 h-8 text-white" strokeWidth={2} />
        </div>
        {badge && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center border-2 border-white">
            {badge}
          </div>
        )}
      </div>
      <span 
        className="text-white text-[11px] font-medium text-center leading-tight max-w-[70px] truncate"
        style={{
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif'
        }}
      >
        {label}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex flex-col items-center">
        {content}
      </button>
    );
  }

  return (
    <Link to={page ? createPageUrl(page) : '#'} className="flex flex-col items-center">
      {content}
    </Link>
  );
}