import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  ArrowUpRight,
  Bot,
  Compass,
  Cpu,
  Flame,
  Layers
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import CircularScore from '../components/CircularScore';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import RadarChart from '../components/RadarChart';
import { useInterview } from '../context/InterviewContext';
import { analyzeSkillGaps } from '../utils/skillGapAnalyzer';

export default function SkillGapPage() {
  const navigate = useNavigate();
  const { session, setup } = useInterview();

  // Run dynamic prototype skill analysis
  const analysis = analyzeSkillGaps(session.summaryResult, session.answers);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Strong':
        return <Badge variant="green" size="sm">Strong</Badge>;
      case 'Needs Practice':
        return <Badge variant="cyan" size="sm">Needs Practice</Badge>;
      case 'Priority':
      default:
        return <Badge variant="pink" size="sm">Priority</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <Badge variant="pink" size="sm">Priority: High</Badge>;
      case 'Medium':
        return <Badge variant="amber" size="sm">Priority: Medium</Badge>;
      case 'Low':
      default:
        return <Badge variant="green" size="sm">Priority: Low</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      
      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-sm">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>🧠 AI Skill Gap Analysis</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          KNOW WHAT TO IMPROVE NEXT
        </h1>

        <p className="text-sm sm:text-base text-[#A5B4FC] max-w-2xl mx-auto leading-relaxed">
          InterviewAI analyzed your recent interview performance to identify the skills that need the most attention.
        </p>

        <div className="pt-1 flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>● AI Analysis Complete</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OVERALL READINESS SCORE CARD                                          */}
      {/* ========================================================================= */}
      <GlassCard className="p-8 border-purple-500/40 shadow-2xl relative overflow-hidden bg-gradient-to-r from-[#191A3A] via-[#161D3A] to-[#12233F]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              INTERVIEW READINESS
            </span>

            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {analysis.overallReadiness}%
              </span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                +{analysis.improvementRate}% vs diagnostic
              </span>
            </div>

            <div className="inline-block px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              ● {analysis.readinessLabel}
            </div>

            <p className="text-sm text-[#A5B4FC] max-w-lg leading-relaxed">
              "{analysis.readinessSummary}"
            </p>

            {/* Historical Progress Metrics */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <div className="px-3 py-2 rounded-xl bg-[#0F1026] border border-purple-500/30 text-xs">
                <span className="text-[#A5B4FC] block text-[10px] uppercase">Previous Readiness</span>
                <span className="font-bold text-white font-mono">{analysis.previousReadiness}%</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#0F1026] border border-cyan-500/30 text-xs">
                <span className="text-[#A5B4FC] block text-[10px] uppercase">Current Readiness</span>
                <span className="font-bold text-cyan-300 font-mono">{analysis.overallReadiness}%</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#0F1026] border border-emerald-500/30 text-xs">
                <span className="text-[#A5B4FC] block text-[10px] uppercase">Improvement</span>
                <span className="font-bold text-emerald-400 font-mono">+{analysis.improvementRate}%</span>
              </div>
            </div>
          </div>

          {/* Circular Score Gauge */}
          <div className="shrink-0 flex flex-col items-center">
            <CircularScore
              score={analysis.overallReadiness}
              size={145}
              strokeWidth={11}
              color="#06B6D4"
              label="Readiness"
            />
          </div>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 4. SKILL GAP OVERVIEW & 5. RADAR CHART (Two Column Layout)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Your Skill Profile (7 Cols) */}
        <GlassCard className="lg:col-span-7 p-6 sm:p-7 space-y-5 border-purple-500/30">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                YOUR SKILL PROFILE
              </h2>
              <p className="text-xs text-[#A5B4FC]">
                Calibrated across 8 core industry competency benchmarks
              </p>
            </div>
            <span className="text-xs text-cyan-400 font-mono font-bold">
              Target: {setup?.targetRole || 'ML Engineer'}
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {analysis.skills.map((skill) => (
              <div
                key={skill.name}
                className="p-3.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 hover:border-purple-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{skill.name}</span>
                    <span className="text-[10px] text-[#A5B4FC]/70 uppercase">({skill.category})</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {getStatusBadge(skill.status)}
                    <span className="text-sm font-extrabold text-white font-mono">{skill.score}%</span>
                  </div>
                </div>

                <ProgressBar
                  value={skill.score}
                  gradient={skill.score >= 80 ? 'green' : skill.score >= 65 ? 'cyan' : 'purple-pink'}
                  height="h-2"
                />
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-[#A5B4FC]/80 border-t border-purple-500/20">
            <span>🟢 80–100%: Strong</span>
            <span>🔵 65–79%: Needs Practice</span>
            <span>🔴 &lt;65%: Priority</span>
          </div>
        </GlassCard>

        {/* Right: Radar Chart (5 Cols) */}
        <GlassCard className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-4 border-cyan-500/30 bg-gradient-to-b from-[#191A3A] to-[#15173B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                AI Skill Profile
              </h2>
            </div>
            <Badge variant="cyan" size="sm">Radar Analysis</Badge>
          </div>

          <p className="text-xs text-[#A5B4FC]">
            Multi-axial visual comparison showing your dimensional strengths and deficit pockets:
          </p>

          <div className="py-2 flex justify-center">
            <RadarChart dimensions={analysis.radarDimensions} size={320} />
          </div>

          <div className="p-3 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 text-xs text-[#A5B4FC]">
            <p className="font-semibold text-white mb-0.5">Key Takeaway:</p>
            <p>
              Your algorithmic profile is broad and well-developed, with asymmetry located primarily in <strong>System Design (61%)</strong> and <strong>Confidence (68%)</strong>.
            </p>
          </div>
        </GlassCard>

      </div>

      {/* ========================================================================= */}
      {/* 6. TOP SKILL GAPS (Dynamically Calculated)                               */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              TOP SKILL GAPS
            </h2>
            <p className="text-xs text-[#A5B4FC]">
              The 3 most critical bottlenecks currently impacting your candidate rating
            </p>
          </div>
          <Badge variant="pink" size="sm">Priority Remediation</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {analysis.topSkillGaps.map((gap) => (
            <GlassCard
              key={gap.name}
              hoverEffect
              glow={gap.priority === 'High' ? 'purple' : 'cyan'}
              className="p-6 flex flex-col justify-between space-y-4 border-purple-500/30"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{gap.priority === 'High' ? '🔴' : '🟠'}</span>
                    <span className="w-6 h-6 rounded-lg bg-purple-900/40 border border-purple-500/30 text-xs font-bold text-cyan-300 flex items-center justify-center">
                      #{gap.rank}
                    </span>
                  </div>
                  {getPriorityBadge(gap.priority)}
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{gap.name}</h3>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-cyan-300 font-mono">{gap.score}%</span>
                    <span className="text-xs text-[#A5B4FC]">Proficiency</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 text-xs space-y-1.5">
                  <span className="font-bold text-amber-300 block">Why:</span>
                  <p className="text-[#A5B4FC] leading-relaxed">{gap.why}</p>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/25 text-xs space-y-1">
                  <span className="font-bold text-cyan-300 block">Recommended Action:</span>
                  <p className="text-white">{gap.recommended}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(gap.route)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#191A3A] border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>Practice {gap.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. AI AGENT INSIGHT (Crucial Agentic Reasoning Card)                      */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 border-cyan-500/40 bg-gradient-to-r from-[#191A3A] via-[#14233F] to-[#191A3A] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">🤖 AI AGENT INSIGHT</h2>
              <p className="text-xs text-cyan-300 font-medium">Continuous Career Coach Reasoning</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40">
            <span>ANALYZING</span>
            <span>→</span>
            <span>DECIDING</span>
            <span>→</span>
            <span className="text-cyan-300">RECOMMENDING</span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#F8FAFC] leading-relaxed font-medium">
          "{analysis.agentInsight}"
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#A5B4FC]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Prevents redundant over-practice of strong skills
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Focuses on highest hiring-risk deficit
          </span>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 8. PERSONALIZED LEARNING PATH                                             */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            YOUR PERSONALIZED PREPARATION PATH
          </h2>
          <p className="text-xs text-[#A5B4FC]">
            Step-by-step roadmap tailored specifically to your evaluated bottleneck
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysis.preparationPath.map((step, idx) => (
            <GlassCard
              key={idx}
              className={`p-5 flex flex-col justify-between space-y-3 transition-all ${
                step.isCurrent
                  ? 'border-cyan-400 shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)] bg-[#1D2149]'
                  : 'border-purple-500/25 bg-[#0F1026]/70 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                      step.isCurrent
                        ? 'bg-cyan-500 text-[#0F1026]'
                        : 'bg-purple-900/40 text-[#A5B4FC] border border-purple-500/30'
                    }`}
                  >
                    0{step.step}
                  </span>

                  <Badge variant={step.isCurrent ? 'cyan' : 'purple'} size="sm">
                    {step.status}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-white mt-2">{step.title}</h3>
                <p className="text-xs text-[#A5B4FC] mt-1 leading-relaxed">{step.desc}</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate(step.route)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    step.isCurrent
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:brightness-110 shadow-md'
                      : 'bg-[#191A3A] text-[#A5B4FC] hover:text-white'
                  }`}
                >
                  {step.isCurrent ? 'Start Step 1 Now →' : 'View Module'}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. RECOMMENDED ACTIVITIES                                                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              RECOMMENDED FOR YOU
            </h2>
            <p className="text-xs text-[#A5B4FC]">
              Targeted drills designed to resolve your identified deficits
            </p>
          </div>
          <Badge variant="purple" size="sm">Curated Queue</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysis.recommendedActivities.map((act) => (
            <GlassCard
              key={act.id}
              hoverEffect
              glow={act.color === 'cyan' ? 'cyan' : 'purple'}
              className="p-5 flex flex-col justify-between space-y-4 border-purple-500/25"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="green" size="sm">{act.xp}</Badge>
                  <span className="text-[11px] text-[#A5B4FC] font-mono">{act.specs}</span>
                </div>

                <h3 className="text-sm font-bold text-white mt-1">{act.title}</h3>
                <p className="text-xs text-[#A5B4FC] mt-1 leading-relaxed">{act.desc}</p>
              </div>

              <GradientButton
                variant={act.color === 'cyan' ? 'primary' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={() => navigate(act.route)}
              >
                {act.buttonLabel}
              </GradientButton>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 10. SKILL IMPROVEMENT TRACKING                                            */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-7 space-y-5 border-purple-500/30">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              SKILL PROGRESS & TRAJECTORY
            </h2>
          </div>
          <span className="text-xs text-[#A5B4FC]">Multi-session comparative tracking</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {analysis.historicalProgress.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 space-y-2"
            >
              <span className="text-xs font-bold text-white block">{item.skill}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#A5B4FC]">
                  {item.previousScore}% → <strong className="text-white">{item.currentScore}%</strong>
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{item.change}%
                </span>
              </div>
              <ProgressBar value={item.currentScore} gradient="green" height="h-1.5" />
              <p className="text-[10px] text-[#A5B4FC]/60 italic mt-1">{item.period}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 11. AGENT DECISION PIPELINE                                               */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 space-y-6 border-purple-500/30">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            HOW INTERVIEWAI IDENTIFIED YOUR SKILL GAPS
          </h2>
          <p className="text-xs text-[#A5B4FC] mt-0.5">
            Transparent autonomous decision pipeline — connecting interview evaluations to actionable drills
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          {analysis.pipelineSteps.map((step) => (
            <div
              key={step.step}
              className="p-3.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="w-6 h-6 rounded-md bg-purple-900/50 border border-purple-500/30 text-cyan-300 font-extrabold text-[11px] flex items-center justify-center mb-1.5">
                  0{step.step}
                </div>
                <h3 className="text-xs font-bold text-white leading-tight">{step.title}</h3>
                <p className="text-[10px] text-[#A5B4FC] mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 12. CTA SECTION                                                           */}
      {/* ========================================================================= */}
      <GlassCard className="p-8 text-center space-y-4 border-purple-500/40 bg-gradient-to-r from-[#191A3A] via-[#1D1B44] to-[#12233F]">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          READY TO IMPROVE?
        </h2>
        <p className="text-sm text-[#A5B4FC] max-w-xl mx-auto">
          Turn your weakest skills into your strongest ones. Choose your high-yield drill or start a new mock round.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <GradientButton
            variant="primary"
            size="lg"
            onClick={() => navigate(analysis.primaryActionRoute)}
            icon={ArrowRight}
            className="w-full sm:w-auto px-8 shadow-xl shadow-purple-900/50"
          >
            {analysis.primaryActionLabel}
          </GradientButton>

          <GradientButton
            variant="secondary"
            size="lg"
            onClick={() => navigate('/interview-setup')}
            icon={Sparkles}
            className="w-full sm:w-auto"
          >
            Take Another Mock Interview →
          </GradientButton>
        </div>
      </GlassCard>

    </div>
  );
}
