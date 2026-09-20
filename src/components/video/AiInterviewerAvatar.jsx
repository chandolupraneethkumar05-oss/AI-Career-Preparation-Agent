import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Subtitles,
  Bot,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import Badge from '../Badge';
import { getInterviewerPersona } from '../../data/interviewerPersonas';

/**
 * AiInterviewerAvatar Component
 * Renders a high-definition, interactive AI Interviewer video feed
 * with dynamic speech-synchronized lip animation, natural eye blinking,
 * attentive listening states, and live closed-caption subtitles.
 */
export default function AiInterviewerAvatar({
  personaId = 'julian',
  isSpeaking = false,
  isListening = false,
  isEvaluating = false,
  currentQuestionText = '',
  onReplayQuestion,
  isMuted = false,
  onToggleMute,
  className = ''
}) {
  const persona = getInterviewerPersona(personaId);
  const [showCaptions, setShowCaptions] = useState(true);
  const [mouthOpenness, setMouthOpenness] = useState(0); // 0 to 1
  const [isBlinking, setIsBlinking] = useState(false);
  const animFrameRef = useRef(null);

  // Lip-sync / mouth movement animation while speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpenness(0);
      return;
    }

    let startTime = performance.now();
    const animateMouth = (now) => {
      const elapsed = (now - startTime) / 1000;
      // Multi-frequency harmonic wave to simulate organic speech articulation
      const wave = Math.sin(elapsed * 12) * 0.4 + Math.sin(elapsed * 23) * 0.3 + Math.sin(elapsed * 7) * 0.3;
      const openness = Math.max(0.1, Math.min(1.0, (wave + 0.6) * 0.85));
      setMouthOpenness(openness);
      animFrameRef.current = requestAnimationFrame(animateMouth);
    };

    animFrameRef.current = requestAnimationFrame(animateMouth);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking]);

  // Periodic natural eye blink cycle (every 3.5 to 6 seconds)
  useEffect(() => {
    let blinkTimeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
      const nextDelay = 3500 + Math.random() * 2500;
      blinkTimeout = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  const style = persona.avatarStyle || {};

  return (
    <div className={`relative aspect-video w-full rounded-md overflow-hidden bg-[#12161F] border border-[#E5E0D5] shadow-xs flex flex-col justify-between select-none ${className}`}>
      {/* Background Architectural Studio Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-[#1B2A4A]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-[#8C6E54]/20 rounded-full blur-3xl" />
        {/* Subtle executive bookshelf / studio grid lines */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#FAF8F3_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Top Header Overlay: Persona Identity & Live Operational Status */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-white/10 border border-white/20 backdrop-blur-xs flex items-center justify-center text-white text-xs font-serif font-bold shadow-xs">
            {persona.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-xs sm:text-sm font-bold text-white tracking-wide leading-none">
                {persona.name}
              </h4>
              <Badge variant="navy" size="xs" className="hidden sm:inline-flex text-[9px] bg-white/10 text-white/90 border-white/20">
                {persona.title}
              </Badge>
            </div>
            <p className="text-[10px] text-white/60 mt-0.5 font-mono">
              {persona.organization}
            </p>
          </div>
        </div>

        {/* Live Operational State Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-xs border border-white/15 text-[11px] font-medium text-white shadow-xs">
          {isSpeaking ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-ping" />
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] absolute" />
              <span className="text-[#93C5FD] font-semibold text-[10px] ml-1">Asking Question...</span>
            </>
          ) : isEvaluating ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse" />
              <span className="text-[#FDE047] font-semibold text-[10px]">Synthesizing Rubrics...</span>
            </>
          ) : isListening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#6EE7B7] font-semibold text-[10px]">Attentive • Listening</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-white/40" />
              <span className="text-white/60 text-[10px]">Session Active</span>
            </>
          )}
        </div>
      </div>

      {/* Main Center Video Area: High-Fidelity Animated Vector Persona */}
      <div className="relative z-0 flex-1 flex items-center justify-center">
        <div
          className={`w-44 h-44 sm:w-56 sm:h-56 transition-transform duration-700 ease-out flex items-center justify-center ${
            isSpeaking ? 'scale-102' : 'scale-100'
          }`}
          style={{
            transform: isSpeaking ? 'translateY(-2px)' : 'translateY(0px)'
          }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full filter drop-shadow-2xl overflow-visible"
            aria-label={`${persona.name} AI Interviewer visual feed`}
          >
            <defs>
              <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={style.suitColor || '#1B2A4A'} />
                <stop offset="100%" stopColor="#0B132B" />
              </linearGradient>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={style.skinTone || '#EAC8A9'} />
                <stop offset="100%" stopColor="#D8A987" />
              </linearGradient>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Torso & Suit Jacket */}
            <path
              d="M 40 200 C 40 152 70 142 100 142 C 130 142 160 152 160 200 Z"
              fill="url(#suitGrad)"
            />
            {/* White Dress Shirt Collar */}
            <polygon points="85,142 100,166 115,142" fill="#FAF8F3" />
            <polygon points="92,142 100,160 85,142" fill="#E5E0D5" />
            <polygon points="108,142 100,160 115,142" fill="#E5E0D5" />
            {/* Silk Tie */}
            <polygon
              points="97,156 103,156 105,195 95,195"
              fill={style.tieColor || '#8C6E54'}
            />

            {/* Neck */}
            <rect x="87" y="112" width="26" height="34" rx="4" fill="url(#skinGrad)" />

            {/* Head Silhouette */}
            <ellipse cx="100" cy="92" rx="38" ry="46" fill="url(#skinGrad)" />

            {/* Hair */}
            <path
              d="M 62 82 C 60 48 76 34 100 34 C 124 34 140 48 138 82 C 131 72 122 68 100 68 C 78 68 69 72 62 82 Z"
              fill={style.hairColor || '#4A4036'}
            />

            {/* Ears */}
            <ellipse cx="61" cy="94" rx="6" ry="10" fill={style.skinTone || '#EAC8A9'} />
            <ellipse cx="139" cy="94" rx="6" ry="10" fill={style.skinTone || '#EAC8A9'} />

            {/* Eyebrows */}
            <path
              d={isSpeaking ? "M 76 74 Q 85 71 94 74" : "M 76 75 Q 85 73 94 75"}
              stroke="#2B2520"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={isSpeaking ? "M 106 74 Q 115 71 124 74" : "M 106 75 Q 115 73 124 75"}
              stroke="#2B2520"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Eyes & Blinking Animation */}
            {isBlinking ? (
              <>
                <line x1="77" y1="83" x2="93" y2="83" stroke="#2B2520" strokeWidth="2" strokeLinecap="round" />
                <line x1="107" y1="83" x2="123" y2="83" stroke="#2B2520" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="85" cy="83" rx="7" ry="5.5" fill="#FAF8F3" />
                <circle cx={isListening ? "86" : "85"} cy="83" r="3.2" fill="#1B2A4A" />
                <circle cx="84" cy="81.5" r="1" fill="#FFFFFF" />

                <ellipse cx="115" cy="83" rx="7" ry="5.5" fill="#FAF8F3" />
                <circle cx={isListening ? "116" : "115"} cy="83" r="3.2" fill="#1B2A4A" />
                <circle cx="114" cy="81.5" r="1" fill="#FFFFFF" />
              </>
            )}

            {/* Optional Glasses */}
            {style.glasses && (
              <g stroke="#8C6E54" strokeWidth="1.8" fill="none">
                <rect x="74" y="75" width="22" height="15" rx="3" stroke="#B8977E" fill="rgba(255,255,255,0.08)" />
                <rect x="104" y="75" width="22" height="15" rx="3" stroke="#B8977E" fill="rgba(255,255,255,0.08)" />
                <line x1="96" y1="82" x2="104" y2="82" stroke="#B8977E" />
                <line x1="74" y1="81" x2="62" y2="78" stroke="#B8977E" />
                <line x1="126" y1="81" x2="138" y2="78" stroke="#B8977E" />
              </g>
            )}

            {/* Nose */}
            <path d="M 100 84 L 98 97 L 104 97" stroke="#C49B7A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Mouth with Dynamic Viseme / Articulation */}
            {isSpeaking ? (
              <path
                d={`M 88 108 Q 100 ${108 + mouthOpenness * 12} 112 108 Q 100 ${108 - mouthOpenness * 4} 88 108`}
                fill="#592018"
                stroke="#8A362D"
                strokeWidth="1.5"
              />
            ) : (
              <path
                d="M 89 110 Q 100 114 111 110"
                stroke="#8A362D"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Live Closed-Caption Subtitle Overlay */}
      {showCaptions && currentQuestionText && (
        <div className="relative z-10 px-4 pb-2">
          <div className="p-2.5 sm:p-3 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-sans text-center shadow-lg leading-relaxed animate-in fade-in duration-200">
            <span className="text-[#EAC8A9] font-serif font-bold mr-1.5">{persona.name}:</span>
            <span className="text-white/95">"{currentQuestionText}"</span>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar: Audio Waves, Subtitles Toggle, Replay Voice */}
      <div className="relative z-10 p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Audio Waveform Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 h-3.5 px-2 py-1 rounded bg-black/40 border border-white/10">
            {[30, 75, 45, 90, 60, 85, 40].map((val, idx) => (
              <div
                key={idx}
                className={`w-0.5 rounded-full transition-all duration-100 ${
                  isSpeaking ? 'bg-[#60A5FA]' : 'bg-white/30'
                }`}
                style={{
                  height: isSpeaking ? `${Math.max(25, (val * (mouthOpenness + 0.3)))}%` : '30%'
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-white/60 font-mono hidden sm:inline">
            {isSpeaking ? 'Speech Active' : 'Channel Clear'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Captions Toggle Button */}
          <button
            type="button"
            onClick={() => setShowCaptions(prev => !prev)}
            title={showCaptions ? 'Hide Live Captions' : 'Show Live Captions'}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCaptions
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-black/40 text-white/60 border border-white/10 hover:text-white'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">CC</span>
          </button>

          {/* Replay Question Audio */}
          {onReplayQuestion && (
            <button
              type="button"
              onClick={onReplayQuestion}
              title="Repeat Interviewer Question"
              className="px-2.5 py-1.5 rounded-md bg-black/40 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Repeat</span>
            </button>
          )}

          {/* Mute/Unmute Audio Output */}
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Interviewer Voice' : 'Mute Interviewer Voice'}
              className="p-1.5 rounded-md bg-black/40 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs transition-all cursor-pointer shadow-xs"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#EF4444]" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
