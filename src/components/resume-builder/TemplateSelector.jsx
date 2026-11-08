import React from 'react';
import { Check } from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'modern_professional',
    name: 'Modern Professional',
    description: 'Clean sans-serif, left-aligned header, modern accent line. Best for tech, engineering, and corporate roles.',
    badge: 'Popular',
  },
  {
    id: 'classic_academic',
    name: 'Classic Academic',
    description: 'Traditional serif typography, centered header, elegant dividers. Best for academia, research, and legal.',
    badge: 'Academic',
  },
  {
    id: 'executive_minimal',
    name: 'Executive Minimal',
    description: 'Understated high-contrast typography, generous whitespace, metric-focused. Best for leadership and product.',
    badge: 'Executive',
  },
];

const PRESET_COLORS = [
  { label: 'Forest Green', hex: '#245A45' },
  { label: 'Slate Blue', hex: '#334155' },
  { label: 'Charcoal', hex: '#1E293B' },
  { label: 'Deep Burgundy', hex: '#831843' },
  { label: 'Navy Blue', hex: '#1E3A8A' },
  { label: 'Dark Teal', hex: '#0F766E' },
];

export default function TemplateSelector({
  templateId = 'modern_professional',
  accentColor = '#245A45',
  onSelectTemplate,
  onSelectAccentColor,
}) {
  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Choose Resume Template
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_TEMPLATES.map(tpl => {
            const isSelected = templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl.id)}
                className={`relative text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-slate-900">{tpl.name}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-3 leading-snug">
                    {tpl.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-2.5 flex items-center text-[11px] font-semibold text-emerald-800">
                    <Check size={13} className="mr-1 stroke-[3]" /> Active Template
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color Palette */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Accent Color
          </label>
          <span className="font-mono text-xs text-slate-500 uppercase">{accentColor}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {PRESET_COLORS.map(c => {
            const isSelected = accentColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => onSelectAccentColor(c.hex)}
                title={c.label}
                style={{ backgroundColor: c.hex }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                  isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm' : 'hover:scale-105'
                }`}
              >
                {isSelected && <Check size={14} className="text-white stroke-[3]" />}
              </button>
            );
          })}

          {/* Custom Hex Input */}
          <div className="flex items-center ml-2 space-x-1.5">
            <input
              type="color"
              value={accentColor.startsWith('#') ? accentColor : '#245A45'}
              onChange={e => onSelectAccentColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0.5"
              title="Custom Accent Color"
            />
            <span className="text-[11px] text-slate-500">Custom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
