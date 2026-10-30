import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * XpRewardPopup Component
 * 
 * Renders a floating, spring-animated celebratory badge (+N XP)
 * that floats upwards and dissolves into the header.
 */
export default function XpRewardPopup({
  amount = 40,
  onComplete,
  className = ''
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1700);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className={`pointer-events-none fixed z-50 animate-xp-rise flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-mono font-bold text-xs sm:text-sm shadow-lg border border-amber-300/40 ${className}`}>
      <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
      <span>+{amount} XP</span>
    </div>
  );
}
