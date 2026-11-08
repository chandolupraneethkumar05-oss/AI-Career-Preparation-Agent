import React from 'react';

/**
 * RadioCard Component
 * 
 * Features:
 * - Natural, attractive corporate color palette (Forest Emerald / Crisp Slate)
 * - Authentic circular radio button indicator with crisp white center dot on selection
 * - Accessible keyboard navigation and clear hover/focus states
 * - Optional icon, badge, description, and footer metadata
 * - High readability and immediate visual identification
 */
export default function RadioCard({
  selected = false,
  onClick,
  title,
  description,
  badge,
  badgeColor = 'default',
  icon: Icon,
  meta,
  disabled = false,
  className = ''
}) {
  const getBadgeClass = () => {
    switch (badgeColor) {
      case 'emerald':
      case 'easy':
      case 'green':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'amber':
      case 'medium':
      case 'orange':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'rose':
      case 'hard':
      case 'red':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      case 'sky':
      case 'blue':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onClick && onClick()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onClick && onClick();
        }
      }}
      className={`
        relative p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer
        flex flex-col justify-between
        ${selected
          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/15 shadow-xs'
          : 'bg-white dark:bg-[var(--theme-surface-subtle)] border-slate-200 dark:border-[var(--theme-border)] hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-[var(--theme-surface-hover)] shadow-2xs'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Authentic Radio Button Indicator */}
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
              selected
                ? 'border-emerald-600 bg-emerald-600 ring-2 ring-emerald-100 dark:ring-emerald-900/40'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/80'
            }`}
          >
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>

          {Icon && (
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                selected
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="truncate min-w-0">
            <span
              className={`text-xs sm:text-sm font-semibold truncate block ${
                selected ? 'text-emerald-950 dark:text-emerald-300 font-bold' : 'text-slate-800 dark:text-white'
              }`}
            >
              {title}
            </span>
          </div>
        </div>

        {badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono shrink-0 ${getBadgeClass()}`}
          >
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-300 leading-relaxed pl-6.5">
          {description}
        </p>
      )}

      {meta && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[var(--theme-border)] flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pl-6.5">
          {meta}
        </div>
      )}
    </div>
  );
}
