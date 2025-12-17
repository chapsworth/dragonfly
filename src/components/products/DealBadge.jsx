import React from 'react';
import { cn } from '@/lib/utils';

const dealStyles = {
  weekly: {
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    text: 'Weekly Deal',
    icon: '🔥',
    animation: 'animate-pulse'
  },
  smoking: {
    gradient: 'from-purple-500 via-indigo-500 to-blue-500',
    text: 'Smoking Deal',
    icon: '💨',
    animation: 'animate-bounce'
  },
  clearance: {
    gradient: 'from-red-600 via-orange-600 to-yellow-500',
    text: 'Clearance',
    icon: '🏷️',
    animation: ''
  },
  christmas: {
    gradient: 'from-red-600 via-green-600 to-red-600',
    text: 'Christmas',
    icon: '🎄',
    animation: 'animate-pulse'
  },
  halloween: {
    gradient: 'from-orange-600 via-purple-600 to-black',
    text: 'Halloween',
    icon: '🎃',
    animation: ''
  },
  valentines: {
    gradient: 'from-pink-500 via-red-500 to-rose-500',
    text: "Valentine's",
    icon: '💝',
    animation: 'animate-pulse'
  },
  july4th: {
    gradient: 'from-blue-600 via-white to-red-600',
    text: 'July 4th',
    icon: '🎆',
    animation: ''
  },
  thanksgiving: {
    gradient: 'from-orange-600 via-amber-600 to-yellow-600',
    text: 'Thanksgiving',
    icon: '🦃',
    animation: ''
  },
  newyear: {
    gradient: 'from-yellow-400 via-purple-500 to-pink-500',
    text: 'New Year',
    icon: '🎊',
    animation: 'animate-bounce'
  },
  stpatricks: {
    gradient: 'from-green-600 via-emerald-500 to-lime-500',
    text: "St. Patrick's",
    icon: '🍀',
    animation: ''
  },
  easter: {
    gradient: 'from-pink-400 via-purple-400 to-blue-400',
    text: 'Easter',
    icon: '🐰',
    animation: ''
  }
};

export default function DealBadge({ dealType = 'weekly', size = 'md', className }) {
  const style = dealStyles[dealType] || dealStyles.weekly;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold text-white shadow-lg',
        `bg-gradient-to-r ${style.gradient}`,
        sizeClasses[size],
        style.animation,
        className
      )}
    >
      <span>{style.icon}</span>
      <span>{style.text}</span>
    </div>
  );
}