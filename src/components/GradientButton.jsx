import React from 'react';

/**
 * Academic Button — Alexandria Style
 * Primary: Academic Navy (#1B2A4A, text #FFFFFF, hover #142038)
 * Secondary: Subdued Surface (#F2EFE9, text #1F1B16, border #E5E0D5)
 * Restrained Radius: 6px (rounded-md)
 */
export default function GradientButton({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  icon: Icon = null,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-md gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-md gap-2',
    lg: 'px-6 py-2.5 text-sm sm:text-base font-semibold rounded-md gap-2.5'
  };

  const variantClasses = {
    primary: 'bg-[#1B2A4A] text-white academic-btn-primary text-white-keep border border-[#1B2A4A] hover:bg-[#142038] shadow-[0_1px_2px_rgba(31,27,22,0.06)]',
    pink: 'bg-[#1B2A4A] text-white academic-btn-primary text-white-keep border border-[#1B2A4A] hover:bg-[#142038] shadow-[0_1px_2px_rgba(31,27,22,0.06)]',
    secondary: 'bg-[#F2EFE9] border border-[#E5E0D5] text-[#1F1B16] hover:bg-[#EAE6DD]',
    outline: 'border border-[#E5E0D5] text-[#1A365D] hover:bg-[#F2EFE9]',
    ghost: 'text-[#70685E] hover:text-[#1F1B16] hover:bg-[#F2EFE9]',
    danger: 'bg-[#FDF2E9] text-[#9A421A] border border-[#F5D6C6] hover:bg-[#F9E4D8]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex 
        items-center 
        justify-center 
        cursor-pointer 
        transition-colors 
        duration-150 
        select-none
        font-sans
        disabled:opacity-50 
        disabled:cursor-not-allowed 
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
