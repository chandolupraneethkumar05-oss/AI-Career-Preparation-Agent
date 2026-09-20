import React from 'react';

/**
 * Editorial Badge — Alexandria Style
 * Success: #EBF4EE / #235E3B
 * Warning: #FDF2E9 / #9A421A
 * Neutral: #EFECE6 / #4A453E
 * Navy: #EAEFF5 / #1A365D
 * Bronze: #F5EFEA / #8C6E54
 * Restrained Radius: 4px (rounded)
 */
export default function Badge({
  children,
  variant = 'neutral', // 'navy' | 'bronze' | 'green' | 'amber' | 'neutral' | 'pink' | 'purple' | 'cyan'
  size = 'md',
  className = ''
}) {
  const variantStyles = {
    // Academic Navy
    navy: 'bg-[#EAEFF5] text-[#1A365D] border-[#D0DBE7]',
    purple: 'bg-[#EAEFF5] text-[#1A365D] border-[#D0DBE7]',
    cyan: 'bg-[#EAEFF5] text-[#1A365D] border-[#D0DBE7]',

    // Aged Bronze
    bronze: 'bg-[#F5EFEA] text-[#8C6E54] border-[#E8DCD1]',
    amber: 'bg-[#F5EFEA] text-[#8C6E54] border-[#E8DCD1]',

    // Semantic Success
    green: 'bg-[#EBF4EE] text-[#235E3B] border-[#CDE3D5]',
    success: 'bg-[#EBF4EE] text-[#235E3B] border-[#CDE3D5]',

    // Semantic Warning / Action
    warning: 'bg-[#FDF2E9] text-[#9A421A] border-[#F7D7C4]',
    pink: 'bg-[#FDF2E9] text-[#9A421A] border-[#F7D7C4]',
    danger: 'bg-[#FDF2E9] text-[#9A421A] border-[#F7D7C4]',

    // Neutral / Verified
    neutral: 'bg-[#EFECE6] text-[#4A453E] border-[#E0DCD3]'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded font-medium',
    md: 'text-xs px-2.5 py-0.5 rounded font-semibold',
    lg: 'text-xs sm:text-sm px-3 py-1 rounded font-bold'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 border font-sans tracking-tight
        ${variantStyles[variant] || variantStyles.neutral}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
