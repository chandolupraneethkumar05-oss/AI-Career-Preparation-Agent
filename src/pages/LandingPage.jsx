import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Mic,
  FileSearch,
  Brain,
  Code2,
  CheckCircle2,
  ShieldCheck,
  Target,
  Zap,
  Flame,
  Award,
  ChevronRight,
  Cpu
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
    <div className="min-h-screen bg-[#FDFCFC] text-slate-900 selection:bg-indigo-600 selection:text-white font-sans antialiased">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION: INNOVATION CENTER ATRIUM + FLOATING CARD     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-14 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-start p-6 sm:p-10 lg:p-16">
          
          {/* Real Innovation Center Atrium Landscape Photo */}
          <img
            src="/landing-hero-atrium.jpg"
            alt="Technology innovation center interior"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
          />

          {/* Ambient Lighting Gradient for High Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-transparent pointer-events-none" />

          {/* Floating White Architectural Card */}
          <div className="relative z-10 max-w-xl bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl space-y-5 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Real-Time AI Interview Calibration</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 leading-[1.15] font-sans">
              Simulating Real Technical Interviews Before You Step Inside.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              Autonomous 50/50 split mock interviews calibrated to your exact Job Description. Practice with live speech analysis, model rubrics, and zero-penalty question skipping.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Practice Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#curriculum"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors text-center cursor-pointer"
              >
                Explore Curriculum
              </a>
            </div>

            {/* Micro proof badges */}
            <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0-1 YOE Campus Ready
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Raw JD Grounding
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. THESIS SECTION (ON PURE #FDFCFC PORCELAIN CANVAS)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">
          THE TALENTPATH METHODOLOGY
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug tracking-tight font-sans">
          “We calibrate candidate readiness through real-time generative interview simulations, objective rubrics, and automated skill gap remediation.”
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed pt-1 font-sans">
          Designed specifically to prevent the classic fresher trap of overly difficult architectural questions by strictly matching difficulty to experience level.
        </p>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. FOUR VERTICAL TACTILE FEATURE CARDS                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="curriculum" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Adaptive Questioning */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                01 • LEVEL CALIBRATION
              </span>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Adaptive Difficulty Hierarchy
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Campus Freshers are never grilled on distributed multi-region SLAs. Questions focus on core DSA, clean syntax, OOP fundamentals, and REST APIs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
              <span>Calibrate Level</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: 50/50 Split Workspace */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                02 • TALENT SHINE SPLIT
              </span>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                50/50 Split Practice Workspace
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Left pane displays step pills `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]` and expandable rubrics. Right pane features mic dictation, word counter, and zero-penalty skip dock.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <span>View Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Speech & STAR Method */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                03 • EVALUATION ENGINE
              </span>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                STAR Speech & Semantic Scoring
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Evaluates your answer for technical accuracy, STAR communication structure, and analytical clarity with instant model exemplar answers.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-amber-700 flex items-center gap-1">
              <span>Inspect Rubrics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Automated Skill Drills */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                04 • CLOSED LOOP
              </span>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Targeted Remediation & Skill Drills
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Skipped questions or low-scoring competencies are directly transformed into 1-click coding challenges in the Skill Arena to convert gaps into strengths.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-purple-600 flex items-center gap-1">
              <span>Explore Arena</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MONOCHROME PARTNER LOGOS STRIP                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-sans">
            CALIBRATED AGAINST INTERVIEW PATTERNS FROM TOP TECH HIRING PARTNERS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all text-xs font-mono font-bold text-slate-700">
            <span className="hover:text-slate-900 transition-colors">GOOGLE</span>
            <span className="hover:text-slate-900 transition-colors">AMAZON AWS</span>
            <span className="hover:text-slate-900 transition-colors">MICROSOFT</span>
            <span className="hover:text-slate-900 transition-colors">META</span>
            <span className="hover:text-slate-900 transition-colors">TCS DIGITAL</span>
            <span className="hover:text-slate-900 transition-colors">INFOSYS DSE</span>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. ARCHITECTURAL PHOTO BREAK (MATCHING REFERENCE DESIGN)      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-lg h-64 sm:h-80 lg:h-96">
          <img
            src="/landing-arches-break.jpg"
            alt="University Innovation Arches"
            className="w-full h-full object-cover object-center filter brightness-[0.95]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex items-end p-6 sm:p-10">
            <p className="text-white text-xs sm:text-sm font-semibold tracking-wide">
              Engineering Excellence &amp; Objective Evaluation Architecture
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. METHODOLOGY & SCORECARD SHOWCASE                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              METHODOLOGY HIGHLIGHT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug font-sans">
              Precision Scoring Across Technical &amp; Delivery Rubrics.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Every answer is measured against strict multi-dimension parameters: architectural reasoning, code modularity, edge-case analysis, and speech conciseness.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleStart}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Run Free Simulation →
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    REAL-TIME BENCHMARK
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1 font-sans">
                    Software Engineer • Mock Interview Scorecard
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold text-emerald-600">94 / 100</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Strong Hire
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">TECHNICAL ACCURACY</span>
                  <span className="text-base font-mono font-bold text-slate-900 block mt-1">9.2 / 10</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Accurate time complexity analysis.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">STAR STRUCTURE</span>
                  <span className="text-base font-mono font-bold text-slate-900 block mt-1">9.5 / 10</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Measurable situation & action.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">REMEDIATION STATUS</span>
                  <span className="text-base font-mono font-bold text-emerald-600 block mt-1">Zero Gaps</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-sans">1 skipped topic drilled in Arena.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. CAMPUS TREE-LINED AVENUE PHOTO BREAK                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-lg h-56 sm:h-72 lg:h-80">
          <img
            src="/landing-trees-break.jpg"
            alt="University Tree-lined Pathway"
            className="w-full h-full object-cover object-center filter brightness-[0.98]"
          />
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 8. 6-GRID CAPABILITY SHOWCASE                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Campus Fresher Calibration', desc: 'No system architecture SLAs for fresh graduates; strictly DSA, OOP, and REST.' },
            { title: 'Talent Shine 50/50 Split', desc: 'Step pills [ 1 ]-[ 5 ], question rubrics on left, live speech and answer dock on right.' },
            { title: 'Raw JD Grounding', desc: 'Paste your target Job Description; questions directly evaluate required stack.' },
            { title: 'Zero-Penalty Skipping', desc: 'Skip unknown questions without score punishment; automatically queued as drills.' },
            { title: 'Web Audio Speech Analysis', desc: 'Real-time mic dictation with volume visualizer, duration timer, and STAR scoring.' },
            { title: 'ATS Resume Alignment', desc: 'Deterministic keyword audit scoring your resume against any target tech role.' }
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition-all">
              <h4 className="text-xs font-bold text-slate-900 font-sans mb-1">{item.title}</h4>
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 9. CLEAN TALENTSHINE FOOTER                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              TP
            </div>
            <span className="font-bold text-slate-900 text-sm font-sans">TalentPath AI</span>
            <span className="text-slate-300">•</span>
            <span className="font-sans">Real-Time Career Preparation</span>
          </div>

          <div className="flex items-center gap-6 text-slate-500 font-sans">
            <Link to="/interview-setup" className="hover:text-indigo-600 transition-colors">Mock Interview</Link>
            <Link to="/skill-arena" className="hover:text-indigo-600 transition-colors">Skill Arena</Link>
            <Link to="/ats" className="hover:text-indigo-600 transition-colors">Resume ATS</Link>
            <Link to="/login" className="hover:text-indigo-600 transition-colors">Sign In</Link>
          </div>

          <p className="text-[11px] text-slate-400 font-sans">
            © {new Date().getFullYear()} TalentPath AI. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
