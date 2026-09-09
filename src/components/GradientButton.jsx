import React from 'react';

export default function GradientButton({
  children,
  onClick,
  variant = 'primary', // 'primary' (purple->cyan) | 'secondary' (glass) | 'pink' (purple->pink) | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  icon: Icon = null,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base font-bold rounded-xl gap-2.5'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#06B6D4] text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-600/40 hover:brightness-110 active:scale-[0.98]',
    pink: 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-pink-900/30 hover:shadow-pink-600/40 hover:brightness-110 active:scale-[0.98]',
    secondary: 'bg-[#191A3A] border border-purple-500/30 text-[#A5B4FC] hover:text-white hover:border-cyan-400/50 hover:bg-[#20224A] active:scale-[0.98]',
    outline: 'border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10 active:scale-[0.98]',
    ghost: 'text-[#A5B4FC] hover:text-white hover:bg-white/5 active:scale-[0.98]'
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
        transition-all 
        duration-200 
        select-none
        disabled:opacity-50 
        disabled:cursor-not-allowed 
        disabled:transform-none
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
