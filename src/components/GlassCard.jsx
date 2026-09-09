import React from 'react';

export default function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  glow = 'purple', // 'purple' | 'cyan' | 'none'
  onClick,
  ...props
}) {
  const glowClasses = {
    purple: 'hover:border-purple-500/50 hover:shadow-[0_0_25px_-5px_rgba(124,58,237,0.3)]',
    cyan: 'hover:border-cyan-500/50 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.3)]',
    none: ''
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-[#191A3A]/80 
        backdrop-blur-md 
        border border-purple-500/20 
        rounded-2xl 
        p-6 
        transition-all 
        duration-300
        ${hoverEffect ? 'hover:-translate-y-1 ' + glowClasses[glow] : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
