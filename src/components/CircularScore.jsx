import React from 'react';

export default function CircularScore({
  score = 0,
  max = 100,
  size = 110,
  strokeWidth = 8,
  label = 'Score',
  color = '#7C3AED',
  showPercentage = true,
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine accent color gradient if default
  let strokeColor = color;
  if (color === 'auto') {
    if (percentage >= 80) strokeColor = '#22C55E';
    else if (percentage >= 65) strokeColor = '#06B6D4';
    else if (percentage >= 50) strokeColor = '#A855F7';
    else strokeColor = '#F59E0B';
  }

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(124, 58, 237, 0.15)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black tracking-tight text-[#F8FAFC]">
          {score}
          {showPercentage && <span className="text-xs text-[#A5B4FC]/70 font-normal">%</span>}
        </span>
        {label && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#A5B4FC]/80 mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
