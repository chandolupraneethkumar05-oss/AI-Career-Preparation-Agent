import React from 'react';

/**
 * Editorial Card — Academic Curator & Alexandria Style
 * Surfaces: Porcelain Cream (#FFFDF9)
 * Hairline Border: #E5E0D5 (1px)
 * Restrained Radius: 8px (rounded-lg)
 * Subtle Elevation: 0 1px 2px rgba(31, 27, 22, 0.04)
 */
export default function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  glow = 'none',
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[var(--theme-surface,#FFFDF9)] 
        border border-[var(--theme-border,#E5E0D5)] 
        rounded-lg 
        p-5 sm:p-6 
        transition-colors 
        duration-150
        shadow-[0_1px_2px_rgba(31,27,22,0.04)]
        ${hoverEffect ? 'hover:border-[var(--theme-border-strong,#D5CFBF)] hover:bg-[var(--theme-surface-hover,#F2EFE9)] cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
