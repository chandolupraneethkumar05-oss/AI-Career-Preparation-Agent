import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * SelectDropdown Component
 * 
 * Features:
 * - Natural, attractive color palette (Forest Emerald / Crisp Slate, zero irritating violet/black)
 * - Sleek trigger button with high-contrast text, clear active state, and smooth 180° chevron
 * - Floating popover with backdrop blur, subtle shadow, and clean borders
 * - LeetCode-style color-coded difficulty badges (Easy: emerald, Medium: amber, Hard: rose)
 * - Built-in quick search filter for option sets of 6 or more
 * - Radio-check highlight on currently selected item
 * - Outside-click and Escape key auto-dismiss
 * - Backward compatibility with Custom inline expansion ("+ Other / Custom...")
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options array
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
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
  }, [options]);

  // Find currently selected option
  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(q) ||
      (opt.badge && opt.badge.toLowerCase().includes(q)) ||
      (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key to dismiss dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (onChange) onChange(optValue);
    setIsOpen(false);
  };

  // Determine badge styling with natural, professional colors
  const getBadgeStyle = (text = '', label = '') => {
    const combined = `${text} ${label}`.toLowerCase();
    if (combined.includes('easy') || combined.includes('beginner') || combined.includes('campus ready') || combined.includes('junior')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (combined.includes('medium') || combined.includes('intermediate') || combined.includes('1-3 yoe') || combined.includes('2-4')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (combined.includes('hard') || combined.includes('advanced') || combined.includes('senior') || combined.includes('staff') || combined.includes('4+')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Dropdown Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`
            w-full py-2.5 px-3.5 rounded-xl border text-left
            flex items-center justify-between gap-2.5
            transition-all duration-150 cursor-pointer shadow-2xs
            ${isOpen
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-white text-slate-900'
              : 'border-slate-300 hover:border-slate-400 bg-white text-slate-900'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
          `}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {Icon && (
              <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="truncate flex-1 flex items-center gap-2">
              {selectedOption ? (
                <>
                  <span className="text-xs sm:text-sm font-semibold truncate text-slate-800">
                    {selectedOption.label}
                  </span>
                  {selectedOption.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono shrink-0 ${getBadgeStyle(selectedOption.badge, selectedOption.label)}`}>
                      {selectedOption.badge}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs sm:text-sm text-slate-400 truncate">
                  {placeholder}
                </span>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </button>

        {/* Floating Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="listbox"
          >
            {/* Quick Search Filter (for 6+ options) */}
            {normalizedOptions.length >= 6 && (
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type to filter..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No matching options found.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full px-3 py-2 rounded-lg text-left text-xs sm:text-sm transition-colors cursor-pointer
                        flex items-center justify-between gap-2.5
                        ${isSelected
                          ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-100'
                          : 'text-slate-700 hover:bg-slate-50 font-normal'
                        }
                      `}
                    >
                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Radio style dot */}
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                          </div>
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono shrink-0 ${getBadgeStyle(opt.badge, opt.label)}`}>
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 pl-5.5">
                            {opt.description}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inline Custom Input when "+ Other / Custom..." is selected */}
      {isCustom && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value)}
            placeholder={customPlaceholder}
            className="w-full py-2 px-3 rounded-lg border border-emerald-400 bg-emerald-50/30 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-500 leading-normal">
          {helperText}
        </p>
      )}
    </div>
  );
}
