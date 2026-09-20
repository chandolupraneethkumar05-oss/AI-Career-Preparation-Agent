import React from 'react';

/**
 * Editorial Circular Score Gauge — Alexandria Style
 * Indicator: Academic Navy (#1A365D)
 * Track: Hairline Border (#E5E0D5)
 * Score Text: Primary Ink (#1F1B16)
 * Label: Tertiary Ink (#70685E)
 */
export default function CircularScore({
  score = 0,
  max = 100,
  size = 100,
  strokeWidth = 6,
  label = 'Proficiency',
  color = '#1A365D',
  showPercentage = true,
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = color;
  if (color === 'auto') {
    if (percentage >= 80) strokeColor = '#235E3B'; // Success Green
    else if (percentage >= 65) strokeColor = '#1A365D'; // Academic Navy
    else if (percentage >= 50) strokeColor = '#8C6E54'; // Aged Bronze
    else strokeColor = '#9A421A'; // Warning Rust
  }

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E0D5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress indicator circle */}
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
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight text-[#1F1B16] font-mono">
          {score}
          {showPercentage && <span className="text-xs text-[#70685E] font-normal">%</span>}
        </span>
        {label && (
          <span className="text-[9px] uppercase font-semibold tracking-widest text-[#70685E] mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
