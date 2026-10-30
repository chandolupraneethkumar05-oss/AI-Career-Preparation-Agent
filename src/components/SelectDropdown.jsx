import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * SelectDropdown Component
 * 
 * A clean, accessible, theme-styled select dropdown designed for larger option sets
 * (e.g., Target Roles, Company Playbooks, Timezones).
 * 
 * Supports inline Custom input expansion when "+ Other / Custom..." is selected.
 */
export default function SelectDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  icon: Icon,
  helperText,
  isCustom = false,
  customValue = '',
  onCustomChange,
  customPlaceholder = 'Enter custom value...',
  disabled = false,
  className = ''
}) {
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return {
      value: opt.value ?? opt.id,
      label: opt.label ?? opt.name ?? opt.value,
      badge: opt.badge,
      description: opt.description
    };
  });

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full py-2.5 px-3.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
            text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 appearance-none
            focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400
            transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-9' : ''}
          `}
        >
          {placeholder && !value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="py-1">
              {opt.label} {opt.badge ? `(${opt.badge})` : ''}
            </option>
          ))}
        </select>

        {/* Custom Chevron Indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Conditionally rendered inline custom input expansion */}
      {isCustom && (
        <div className="pt-1.5 animate-in fade-in duration-200 space-y-1">
          <input
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value)}
            placeholder={customPlaceholder}
            className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-900 border border-indigo-500 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none ring-1 ring-indigo-500 shadow-2xs"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Our AI dynamically synthesizes questions and evaluation rubrics tailored to this discipline.
          </p>
        </div>
      )}

      {helperText && !isCustom && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
