import React from 'react';

/**
 * Editorial Progress Bar — Alexandria Style
 * Track: #E5E0D5 (Subtle hairline track)
 * Fill: Academic Navy (#1A365D) or semantic variant
 * Height: 4px–6px restrained bar
 * Label: Secondary Ink (#3B352E), Value: Primary Ink (#1F1B16)
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  label = '',
  displayValue = '',
  variant = 'navy', // 'navy' | 'bronze' | 'green' | 'warning'
  height = 'h-1.5',
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantFills = {
    navy: 'bg-[#1A365D]',
    bronze: 'bg-[#8C6E54]',
    green: 'bg-[#235E3B]',
    warning: 'bg-[#9A421A]',
    // Backward compatibility mappings
    'purple-cyan': 'bg-[#1A365D]',
    'purple-pink': 'bg-[#1A365D]',
    cyan: 'bg-[#8C6E54]',
    amber: 'bg-[#8C6E54]'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || displayValue) && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-[#3B352E]">{label}</span>
          <span className="text-[#1F1B16] font-semibold font-mono">{displayValue || `${Math.round(percentage)}%`}</span>
        </div>
      )}
      <div className={`w-full bg-[#E5E0D5] rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} ${variantFills[variant] || 'bg-[#1A365D]'} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
