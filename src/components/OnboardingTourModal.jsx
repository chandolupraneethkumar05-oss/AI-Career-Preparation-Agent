import React, { useState } from 'react';
import {
  Sparkles,
  FileSearch,
  Mic,
  Code2,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Compass,
  Layers,
  BookOpen
} from 'lucide-react';
import GradientButton from './GradientButton';

const TOUR_SLIDES = [
  {
    icon: Compass,
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    tag: 'Platform Architecture',
    title: 'Welcome to Your AI Career Preparation Agent',
    description:
      'Unlike generic chatbots, this platform is an autonomous, closed-loop career accelerator. It diagnoses your skill gaps from your resume, generates adaptive mock interviews, and tracks your readiness on a verified competency radar.',
    bullets: [
      'Autonomous closed-loop progression (no random unconnected quizzes)',
      '5-Axis hiring committee rubrics (Technical Accuracy, Relevance, Communication, Completeness, Confidence)',
      'Strict Docker-isolated coding sandboxes and zero-hallucination RAG curriculum'
    ]
  },
  {
    icon: FileSearch,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    tag: 'Step 1: Perception & Diagnosis',
    title: 'Audit Your Resume Against ATS Systems',
    description:
      'Begin by uploading your resume. The ATS scanner parses your technical competencies, extracts your core programming languages, and flags missing keywords required for your target role.',
    bullets: [
      'Automatic language detection (Java, Python, C++, C, SQL, etc.)',
      'High-priority competency gap extraction',
      'Real-time compatibility score against enterprise job descriptions'
    ]
  },
  {
    icon: Mic,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    tag: 'Step 2: Targeted Practice',
    title: 'Role-Based & Technology-Focused Interviews',
    description:
      'Practice realistic multi-turn technical interviews. You can simulate full roles (e.g. Backend Engineer) or drill specifically on individual technologies (e.g., pure Java or C++).',
    bullets: [
      'Resume auto-grounding: questions adapt to the languages on your resume',
      'Technology track: select Java, Python, C++, SQL, etc. with strict negative constraints',
      'Voice, Video, or Text modes with adaptive follow-up probing'
    ]
  },
  {
    icon: Code2,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    tag: 'Step 3: Demonstrated Mastery',
    title: 'Skill Arena, JIT Primers & Closed-Loop Radar',
    description:
      'When you stumble on a brand-new skill, 3-minute Just-in-Time primers build your foundation before testing. Solve daily coding challenges and watch your Competency Radar climb.',
    bullets: [
      '3-Minute JIT Primers for zero-baseline skills (learn before you test)',
      'Docker-isolated coding sandbox with unit test validation',
      'Verified XP and competency score delta updates on your skill graph'
    ]
  }
];

export default function OnboardingTourModal({ isOpen, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slide = TOUR_SLIDES[currentSlide];
  const isLast = currentSlide === TOUR_SLIDES.length - 1;
  const IconComponent = slide.icon;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('has_seen_onboarding_tour', 'true');
      onClose();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    localStorage.setItem('has_seen_onboarding_tour', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header & Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              {slide.tag}
            </span>
            <span className="text-xs text-slate-400">
              Slide {currentSlide + 1} of {TOUR_SLIDES.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl border ${slide.iconBg} shrink-0`}>
              <IconComponent className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {slide.title}
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {slide.description}
              </p>
            </div>
          </div>

          {/* Key Bullets */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Core Architectural Highlights
            </div>
            {slide.bullets.map((b, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          {/* Stepper Dots */}
          <div className="flex justify-center gap-2 pt-2">
            {TOUR_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-8 bg-indigo-600'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <GradientButton
                variant="secondary"
                size="sm"
                onClick={handlePrev}
                icon={ArrowLeft}
              >
                Back
              </GradientButton>
            )}
            <GradientButton
              variant="primary"
              size="sm"
              onClick={handleNext}
              icon={isLast ? CheckCircle2 : ArrowRight}
            >
              {isLast ? 'Get Started' : 'Next'}
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
}
