import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  label = '',
  displayValue = '',
  gradient = 'purple-cyan', // 'purple-cyan' | 'purple-pink' | 'cyan' | 'green'
  height = 'h-2.5',
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const gradientStyles = {
    'purple-cyan': 'bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#06B6D4]',
    'purple-pink': 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899]',
    'cyan': 'bg-gradient-to-r from-[#0284C7] to-[#06B6D4]',
    'green': 'bg-gradient-to-r from-[#16A34A] to-[#22C55E]',
    'amber': 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || displayValue) && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-[#A5B4FC]">{label}</span>
          <span className="text-[#F8FAFC] font-semibold">{displayValue || `${Math.round(percentage)}%`}</span>
        </div>
      )}
      <div className={`w-full bg-[#0F1026] rounded-full overflow-hidden border border-purple-500/20 ${height}`}>
        <div
          className={`${height} ${gradientStyles[gradient] || gradientStyles['purple-cyan']} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
