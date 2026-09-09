import React from 'react';

export default function Badge({
  children,
  variant = 'purple', // 'purple' | 'cyan' | 'pink' | 'green' | 'amber' | 'neutral'
  size = 'md',
  className = ''
}) {
  const variantStyles = {
    purple: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    pink: 'bg-pink-950/60 text-pink-300 border-pink-500/30',
    green: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    neutral: 'bg-slate-800/60 text-slate-300 border-slate-700/50'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
    lg: 'text-sm px-3 py-1.5 rounded-xl font-bold'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 border font-mono tracking-wide
        ${variantStyles[variant] || variantStyles.purple}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
