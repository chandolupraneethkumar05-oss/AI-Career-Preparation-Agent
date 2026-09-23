import React from 'react';
import { Sparkles, Target, Brain, Award, ShieldCheck, Zap } from 'lucide-react';

const DEFAULT_ITEMS = {
  dashboard: (role = 'Engineering Candidate') => [
    { icon: Target, text: `Active Career Target: ${role}`, tag: 'TARGET ROLE' },
    { icon: Sparkles, text: 'Autonomous AI Multi-Turn Interview Evaluation', tag: 'AI EVAL' },
    { icon: Brain, text: 'STAR Behavioral Framework & Technical Edge Case Scoring', tag: 'RUBRIC' },
    { icon: Zap, text: 'Live Adaptive Difficulty Scaling Based on Verbal Answers', tag: 'ADAPTIVE' },
    { icon: Award, text: 'Continuous Readiness Index Calibrated Against Industry Bars', tag: 'ANALYTICS' },
    { icon: ShieldCheck, text: 'Isolated Candidate State & Multi-Tenant Data Privacy', tag: 'PRIVACY' }
  ],
  interview: (role = 'Engineering Candidate') => [
    { icon: Target, text: `Calibrated for ${role} Interviews`, tag: 'ROLE CALIBRATION' },
    { icon: Brain, text: 'STAR Method: Situation, Task, Action, and Measurable Result', tag: 'STAR METHOD' },
    { icon: Zap, text: 'Quantify Trade-offs, Edge Cases & Big-O Computational Complexity', tag: 'PRECISION' },
    { icon: Sparkles, text: 'Verbal Delivery & Decisiveness Under Adaptive Time Constraints', tag: 'DELIVERY' },
    { icon: Award, text: 'Multi-Question Rounds (5 to 10 Questions) Full Diagnostic Loop', tag: 'FULL LOOP' },
    { icon: ShieldCheck, text: 'AI Autonomous Grading Across Clarity, Relevance & Accuracy', tag: 'RUBRIC' }
  ],
  skillgap: (role = 'Engineering Candidate') => [
    { icon: Target, text: `Industry Skill Competency Matrix: ${role}`, tag: 'ROLE BENCHMARK' },
    { icon: Brain, text: '60% Interview Demonstration • 25% Daily Drills • 15% Résumé Alignment', tag: 'FUSION' },
    { icon: Zap, text: 'Dynamic Priority Remediation Path Tailored to Weakest Skills', tag: 'PREPARATION PATH' },
    { icon: Sparkles, text: 'Zero Pre-seeded Mock Data — Calibrated Strictly from Evidence', tag: 'VERIFIED EVIDENCE' },
    { icon: Award, text: 'Target Competency Benchmark: 80%+ Offer Readiness', tag: 'HIRING BAR' }
  ]
};

export default function MarqueeBanner({
  variant = 'dashboard',
  role = 'Engineering Candidate',
  items = null,
  badgeText = null,
  className = ''
}) {
  const activeItems = items || (DEFAULT_ITEMS[variant] ? DEFAULT_ITEMS[variant](role) : DEFAULT_ITEMS.dashboard(role));
  const activeBadge = badgeText || (variant === 'interview' ? 'INTERVIEW RADAR' : variant === 'skillgap' ? 'SKILL BENCHMARK' : 'LIVE HIGHLIGHTS');

  // Double items for seamless infinite scroll
  const displayItems = [...activeItems, ...activeItems];

  return (
    <div className={`w-full overflow-hidden rounded-md border border-[var(--theme-border,#E5E0D5)] bg-[var(--theme-surface-low,#FAF8F3)] py-2 px-3 flex items-center shadow-xs ${className}`}>
      {/* Static Badge Label */}
      <div className="shrink-0 flex items-center gap-1.5 pr-3 mr-3 border-r border-[var(--theme-border,#E5E0D5)] z-10 bg-[var(--theme-surface-low,#FAF8F3)]">
        <span className="w-2 h-2 rounded-full bg-[var(--theme-primary,#1A365D)] animate-pulse" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-primary,#1A365D)]">
          {activeBadge}
        </span>
      </div>

      {/* Scrolling Ticker Track */}
      <div className="overflow-hidden flex-1 relative">
        <div className="animate-marquee items-center gap-6 whitespace-nowrap">
          {displayItems.map((item, idx) => {
            const Icon = item.icon || Sparkles;
            return (
              <div key={idx} className="inline-flex items-center gap-2 text-xs text-[var(--theme-text-secondary,#3B352E)]">
                {item.tag && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-[var(--theme-surface-subtle,#F2EFE9)] border border-[var(--theme-border,#E5E0D5)] text-[var(--theme-bronze,#8C6E54)]">
                    {item.tag}
                  </span>
                )}
                <Icon className="w-3.5 h-3.5 text-[var(--theme-primary,#1A365D)] shrink-0" />
                <span className="font-medium">{item.text}</span>
                <span className="text-[var(--theme-border-strong,#D5CFBF)] mx-1">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
