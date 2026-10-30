import React from 'react';

/**
 * SegmentedControl Component
 * 
 * A high-density, accessible, keyboard-navigable segmented radio control
 * replacing bulky card grids for 2-5 option selections.
 * 
 * Supports theme tokens, custom icons, optional badges, and dynamic 1-line hint captions.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  dynamicHint,
  size = 'md',
  fullWidth = true,
  ariaLabel = 'Select option',
  className = ''
}) {
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { id: opt, label: opt };
    }
    return {
      id: opt.id ?? opt.value,
      label: opt.label ?? opt.name ?? opt.id,
      icon: opt.icon,
      badge: opt.badge,
      description: opt.description ?? opt.desc
    };
  });

  const handleKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % normalizedOptions.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + normalizedOptions.length) % normalizedOptions.length;
    }

    if (nextIndex !== null) {
      const nextOption = normalizedOptions[nextIndex];
      if (nextOption && onChange) {
        onChange(nextOption.id);
      }
    }
  };

  const sizeClasses = {
    sm: 'py-1 px-2.5 text-xs gap-1.5',
    md: 'py-1.5 px-3.5 text-xs sm:text-sm gap-2',
    lg: 'py-2 px-4 text-sm gap-2.5'
  }[size] || 'py-1.5 px-3.5 text-xs sm:text-sm gap-2';

  // Resolve dynamic caption underneath the control
  const activeOption = normalizedOptions.find(o => o.id === value) || normalizedOptions[0];
  let hintText = null;
  if (typeof dynamicHint === 'function') {
    hintText = dynamicHint(value, activeOption);
  } else if (typeof dynamicHint === 'string') {
    hintText = dynamicHint;
  } else if (dynamicHint && typeof dynamicHint === 'object') {
    hintText = dynamicHint[value];
  } else if (activeOption?.description) {
    hintText = activeOption.description;
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Outer Pill Track */}
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={`inline-flex p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs ${
          fullWidth ? 'w-full flex' : 'w-auto'
        }`}
      >
        {normalizedOptions.map((opt, idx) => {
          const isSelected = opt.id === value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange && onChange(opt.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`
                relative flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer select-none
                ${fullWidth ? 'flex-1' : ''}
                ${sizeClasses}
                ${isSelected
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 font-semibold shadow-xs border border-slate-200/80 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }
              `}
            >
              {Icon && (
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
              )}
              <span className="truncate">{opt.label}</span>
              {opt.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold uppercase tracking-wider ${
                  isSelected
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic 1-Line Helper Caption (Preserves calibration without bloating UI) */}
      {hintText && (
        <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500 dark:text-slate-400 font-sans transition-all animate-in fade-in duration-150">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="leading-tight">{hintText}</span>
        </div>
      )}
    </div>
  );
}
