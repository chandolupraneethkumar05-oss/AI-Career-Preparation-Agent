import React from 'react';

/**
 * VoiceWaveformIndicator Component
 * 
 * Renders an organic 5-bar harmonic speech visualizer for live voice/audio modes.
 * Smoothly scales when speaking, falls back to subtle resting state when idle.
 */
export default function VoiceWaveformIndicator({
  isActive = false,
  label = '',
  className = ''
}) {
  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 shadow-xs ${className}`}>
      {/* 5 Organic Harmonic Frequency Bars */}
      <div className="flex items-center gap-1 h-5 px-1">
        <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${isActive ? 'wave-bar-1' : 'h-1.5 opacity-40'}`} />
        <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${isActive ? 'wave-bar-2' : 'h-2 opacity-50'}`} />
        <span className={`w-1 bg-indigo-500 rounded-full transition-all duration-300 ${isActive ? 'wave-bar-3' : 'h-2.5 opacity-60'}`} />
        <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${isActive ? 'wave-bar-4' : 'h-2 opacity-50'}`} />
        <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${isActive ? 'wave-bar-5' : 'h-1.5 opacity-40'}`} />
      </div>

      {label && (
        <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
          isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
        }`}>
          {label}
        </span>
      )}
    </div>
  );
}
