import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Mic,
  Brain,
  Code2,
  CheckCircle2,
  Target,
  Zap,
  ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/interview-setup');
    } else {
      navigate('/login?redirect=/interview-setup');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFC] dark:bg-[var(--theme-bg,#181818)] text-slate-900 dark:text-[var(--theme-text,#F5F5F5)] selection:bg-emerald-600 selection:text-white font-sans antialiased transition-colors duration-200">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION: INNOVATION CENTER ATRIUM + FLOATING CARD     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-14 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-[var(--theme-border,#2E2E2E)] shadow-xl min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-start p-6 sm:p-10 lg:p-16">
          
          {/* Real Innovation Center Atrium Landscape Photo */}
          <img
            src="/landing-hero-atrium.jpg"
            alt="Technology innovation center interior"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
          />

          {/* Ambient Lighting Gradient for High Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-transparent pointer-events-none" />

          {/* Floating Architectural Card */}
          <div className="relative z-10 max-w-xl bg-white/95 dark:bg-[var(--theme-surface,#212121)]/95 backdrop-blur-md border border-slate-200/90 dark:border-[var(--theme-border,#2E2E2E)] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl space-y-5 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time AI Interview Calibration</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15] font-sans">
              Simulating Real Technical Interviews Before You Step Inside.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
              Autonomous 50/50 split mock interviews calibrated to your exact Job Description. Practice with live speech analysis, model rubrics, and zero-penalty question skipping.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Practice Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#curriculum"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-sm transition-colors text-center cursor-pointer"
              >
                Explore Curriculum
              </a>
            </div>

            {/* Micro proof badges */}
            <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 0-1 YOE Campus Ready
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Strict Rubric Scored
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. THESIS SECTION (TALENTPATH METHODOLOGY - HIGH CONTRAST)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-emerald-400 font-sans">
          THE TALENTPATH METHODOLOGY
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight font-sans">
          “We calibrate candidate readiness through real-time generative interview simulations, objective rubrics, and automated skill gap remediation.”
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed pt-1 font-sans">
          Designed specifically to prevent the classic fresher trap of overly difficult architectural questions by strictly matching difficulty to experience level.
        </p>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. FOUR VERTICAL TACTILE FEATURE CARDS                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="features" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Adaptive Questioning */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[var(--theme-surface,#212121)] border border-slate-200/90 dark:border-[var(--theme-border,#2E2E2E)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-zinc-400 uppercase tracking-widest block">
                01 • LEVEL CALIBRATION
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                Adaptive Difficulty Hierarchy
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-300 leading-relaxed font-sans">
                Campus Freshers are never grilled on distributed multi-region SLAs. Questions focus on core DSA, clean syntax, OOP fundamentals, and REST APIs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[var(--theme-border,#2E2E2E)] text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>Calibrate Level</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: 50/50 Split Workspace */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[var(--theme-surface,#212121)] border border-slate-200/90 dark:border-[var(--theme-border,#2E2E2E)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-zinc-400 uppercase tracking-widest block">
                02 • TALENT SHINE SPLIT
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                50/50 Split Practice Workspace
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-300 leading-relaxed font-sans">
                Left pane displays step pills `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]` and expandable rubrics. Right pane features mic dictation, word counter, and zero-penalty skip dock.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[var(--theme-border,#2E2E2E)] text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>View Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Speech & STAR Method */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[var(--theme-surface,#212121)] border border-slate-200/90 dark:border-[var(--theme-border,#2E2E2E)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-zinc-400 uppercase tracking-widest block">
                03 • EVALUATION ENGINE
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                STAR Speech & Semantic Scoring
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-300 leading-relaxed font-sans">
                Evaluates your answer for technical accuracy, STAR communication structure, and analytical clarity with instant model exemplar answers.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[var(--theme-border,#2E2E2E)] text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <span>Inspect Rubrics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Automated Skill Drills */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[var(--theme-surface,#212121)] border border-slate-200/90 dark:border-[var(--theme-border,#2E2E2E)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-zinc-400 uppercase tracking-widest block">
                04 • CLOSED LOOP
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                Targeted Remediation & Skill Drills
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-300 leading-relaxed font-sans">
                Skipped questions or low-scoring competencies are directly transformed into 1-click coding challenges in the Skill Arena to convert gaps into strengths.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[var(--theme-border,#2E2E2E)] text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>Explore Arena</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MONOCHROME PARTNER LOGOS STRIP                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-slate-200/80 dark:border-[var(--theme-border,#2E2E2E)] bg-white dark:bg-[var(--theme-surface-subtle,#1A1A1A)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-400 font-sans">
            CALIBRATED AGAINST INTERVIEW PATTERNS FROM TOP TECH HIRING PARTNERS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 hover:opacity-100 transition-all text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">GOOGLE</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">AMAZON AWS</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">MICROSOFT</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">META</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">TCS DIGITAL</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">INFOSYS DSE</span>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. METHODOLOGY & SCORECARD SHOWCASE                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-800">
              METHODOLOGY HIGHLIGHT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug font-sans">
              Precision Scoring Across Technical &amp; Delivery Rubrics.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
              Every answer is measured against strict multi-dimension parameters: architectural reasoning, code modularity, edge-case analysis, and speech conciseness.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleStart}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Run Free Simulation →
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[var(--theme-surface,#212121)] border border-slate-200/90 dark:border-[var(--theme-border,#2E2E2E)] shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[var(--theme-border,#2E2E2E)] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    REAL-TIME BENCHMARK
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1 font-sans">
                    Software Engineer • Mock Interview Scorecard
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">94 / 100</span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Strong Hire
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 shadow-2xs hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      TECHNICAL MASTERY
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono">
                      Top 2%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-mono font-extrabold text-emerald-700 dark:text-emerald-400">98%</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Accuracy</span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-200/60 dark:bg-emerald-900/60 rounded-full mt-2.5 overflow-hidden">
                    <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full w-[98%]" />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-2 font-sans leading-tight">
                    Optimal algorithm runtime, space trade-offs, and boundary defense.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 shadow-2xs hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      COMMUNICATION QUALITY
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono">
                      STAR
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-mono font-extrabold text-emerald-700 dark:text-emerald-400">95%</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Clarity</span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-200/60 dark:bg-emerald-900/60 rounded-full mt-2.5 overflow-hidden">
                    <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full w-[95%]" />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-2 font-sans leading-tight">
                    Structured STAR responses with quantified impact and verbal poise.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/40 shadow-2xs hover:border-purple-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      SKILL REMEDIATION
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/60 px-1.5 py-0.5 rounded font-mono">
                      Mastered
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-mono font-extrabold text-purple-700 dark:text-purple-400">100%</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Coverage</span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-200/60 dark:bg-purple-900/60 rounded-full mt-2.5 overflow-hidden">
                    <div className="h-full bg-purple-600 dark:bg-purple-400 rounded-full w-full" />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-2 font-sans leading-tight">
                    Targeted practice drills immediately converted gaps into strengths.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. 6-GRID CAPABILITY SHOWCASE                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="curriculum" className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Campus Fresher Calibration', desc: 'No system architecture SLAs for fresh graduates; strictly DSA, OOP, and REST.' },
            { title: 'Talent Shine 50/50 Split', desc: 'Step pills [ 1 ]-[ 5 ], question rubrics on left, live speech and answer dock on right.' },
            { title: 'Raw JD Grounding', desc: 'Paste your target Job Description; questions directly evaluate required stack.' },
            { title: 'Zero-Penalty Skipping', desc: 'Skip unknown questions without score punishment; automatically queued as drills.' },
            { title: 'Web Audio Speech Analysis', desc: 'Real-time mic dictation with volume visualizer, duration timer, and STAR scoring.' },
            { title: 'ATS Resume Alignment', desc: 'Deterministic keyword audit scoring your resume against any target tech role.' }
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-[var(--theme-surface,#212121)] border border-slate-200/80 dark:border-[var(--theme-border,#2E2E2E)] shadow-2xs hover:border-emerald-200 dark:hover:border-emerald-700 transition-all">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans mb-1">{item.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-300 font-sans leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. CLEAN TALENTSHINE FOOTER                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 dark:border-[var(--theme-border,#2E2E2E)] bg-white dark:bg-[var(--theme-surface,#212121)] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              TP
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm font-sans">TalentPath AI</span>
            <span className="text-slate-300 dark:text-zinc-600">•</span>
            <span className="font-sans">Real-Time Career Preparation</span>
          </div>

          <div className="flex items-center gap-6 text-slate-500 dark:text-zinc-400 font-sans">
            <Link to="/interview-setup" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Mock Interview</Link>
            <Link to="/skill-arena" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Skill Arena</Link>
            <Link to="/ats" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Resume ATS</Link>
            <Link to="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Sign In</Link>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-sans">
            © {new Date().getFullYear()} TalentPath AI. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
