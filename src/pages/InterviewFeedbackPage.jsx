import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Bot,
  Brain,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
  Flame,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import CircularScore from '../components/CircularScore';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import { useInterview } from '../context/InterviewContext';
import { useAuth } from '../context/AuthContext';
import { synthesizeInterviewFeedback } from '../utils/feedbackAgent';

export default function InterviewFeedbackPage() {
  const navigate = useNavigate();
  const { session, setup, startInterview } = useInterview();
  const { addXP } = useAuth();

  // Synthesize prototype feedback using the isolated agent logic
  const result = synthesizeInterviewFeedback(session.summaryResult, session.answers, setup);

  // Accordion state for question-by-question breakdown (first item open by default)
  const [expandedQuestions, setExpandedQuestions] = useState({ 1: true });

  useEffect(() => {
    // Award XP reward once when landing on feedback
    if (result.xpEarned) {
      addXP(result.xpEarned);
    }

    // Celebratory confetti burst
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }
  }, [addXP, result.xpEarned]);

  const toggleQuestion = (num) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  const handleStartAnother = () => {
    startInterview();
    navigate('/interview-setup');
  };

  // Dimension icon lookup matching Interview Ready rubric
  const getDimensionIcon = (id) => {
    switch (id) {
      case 'technicalKnowledge':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'problemSolving':
        return <Lightbulb className="w-4 h-4 text-cyan-400" />;
      case 'communicationSTAR':
        return <MessageSquare className="w-4 h-4 text-pink-400" />;
      case 'promptRelevance':
        return <Target className="w-4 h-4 text-emerald-400" />;
      case 'confidenceDelivery':
      default:
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      
      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/40 text-purple-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>✨ Interview Performance Report</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          INTERVIEW COMPLETE 🎉
        </h1>

        <p className="text-sm sm:text-base text-[#A5B4FC] max-w-2xl mx-auto leading-relaxed">
          Your AI career coach analyzed your responses and identified your strengths, weaknesses, and next best steps.
        </p>

        <div className="pt-1 flex items-center justify-center gap-3">
          <Badge variant="cyan" size="md">
            {result.questionsCompleted} / {result.totalQuestions} Questions Completed
          </Badge>
          <Badge variant="purple" size="md">
            {result.targetRole}
          </Badge>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OVERALL SCORE CARD                                                    */}
      {/* ========================================================================= */}
      <GlassCard className="p-8 border-purple-500/40 shadow-2xl relative overflow-hidden bg-gradient-to-r from-[#191A3A] via-[#1D1B44] to-[#12233F]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              OVERALL INTERVIEW SCORE
            </span>

            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {result.overallScore}
              </span>
              <span className="text-2xl text-[#A5B4FC]/70 font-semibold">/ 100</span>
            </div>

            <div className="inline-block px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              ● {result.qualitativeRating}
            </div>

            {/* XP and Streak Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-purple-300 text-xs font-bold shadow-sm">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
                <span>+{result.xpEarned} XP Earned</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1026] border border-orange-500/30 text-orange-400 text-xs font-bold shadow-sm">
                <Flame className="w-4 h-4 fill-orange-400 animate-pulse" />
                <span>🔥 {result.streakDays} Day Streak Maintained</span>
              </div>
            </div>
          </div>

          {/* Circular Score Gauge */}
          <div className="shrink-0 flex flex-col items-center">
            <CircularScore
              score={result.overallScore}
              size={140}
              strokeWidth={10}
              color="auto"
              label="Readiness"
            />
          </div>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 4. AI EVALUATION RUBRIC (5 Core Dimensions)                              */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              AI Evaluation Rubric
            </h2>
            <p className="text-xs text-[#A5B4FC]">
              Matched directly to the 5 preparation dimensions established in your interview brief
            </p>
          </div>
          <Badge variant="cyan" size="sm">5 Dimensions</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.rubricDetails.map((dimension) => (
            <GlassCard
              key={dimension.id}
              className="p-5 flex flex-col justify-between space-y-4 border-purple-500/30 hover:border-cyan-500/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#0F1026] border border-purple-500/20">
                      {getDimensionIcon(dimension.id)}
                    </div>
                    <h3 className="text-sm font-bold text-white">{dimension.label}</h3>
                  </div>
                  <Badge variant={dimension.score >= 85 ? 'green' : dimension.score >= 78 ? 'cyan' : 'pink'} size="sm">
                    {dimension.tag}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl font-black text-white">{dimension.score}</span>
                  <span className="text-xs text-[#A5B4FC]">/ 100</span>
                </div>

                <ProgressBar
                  value={dimension.score}
                  gradient={dimension.score >= 85 ? 'green' : dimension.score >= 78 ? 'cyan' : 'purple-pink'}
                  height="h-2"
                />

                <p className="text-xs text-[#A5B4FC] mt-3 leading-relaxed">
                  {dimension.explanation}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. AI PERFORMANCE SUMMARY                                                */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 border-purple-500/40 bg-gradient-to-r from-[#191A3A] via-[#161D3A] to-[#191A3A] space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white">🤖 AI Performance Summary</h2>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-500/30">
            AI Coach Insight
          </span>
        </div>

        <p className="text-sm sm:text-base text-[#F8FAFC] leading-relaxed pt-1">
          "{result.aiSummary}"
        </p>

        <div className="pt-2 text-[11px] text-[#A5B4FC]/70 italic flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Synthesized using multi-dimensional token analysis & candidate response rubrics.</span>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 6. STRENGTHS & 7. AREAS TO IMPROVE (Two Columns)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strengths Card */}
        <GlassCard className="p-6 space-y-4 border-emerald-500/30 bg-[#162235]/60">
          <div className="flex items-center gap-2.5 border-b border-emerald-500/20 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 className="text-base font-bold text-white">💪 Your Strengths</h2>
          </div>

          <ul className="space-y-3 text-xs text-[#A5B4FC]">
            {result.strengths.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#0F1026]/60 border border-emerald-500/20 text-white font-medium"
              >
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Areas to Improve Card */}
        <GlassCard className="p-6 space-y-4 border-amber-500/30 bg-[#251D2C]/60">
          <div className="flex items-center gap-2.5 border-b border-amber-500/20 pb-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-base font-bold text-white">🎯 Areas to Improve</h2>
          </div>

          <ul className="space-y-3 text-xs text-[#A5B4FC]">
            {result.improvements.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#0F1026]/60 border border-amber-500/20 text-white font-medium"
              >
                <span className="text-amber-400 font-bold text-sm">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

      </div>

      {/* ========================================================================= */}
      {/* 8. AGENT RECOMMENDATION (Critical Product Differentiation)                */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 border-cyan-500/40 bg-gradient-to-br from-[#191A3A] via-[#14233F] to-[#191A3A] space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">🤖 AI AGENT RECOMMENDATION</h2>
              <p className="text-xs text-cyan-300 font-medium">Personalized Next Practice Focus</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A5B4FC]">Your next focus:</span>
            <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600/40 to-cyan-500/30 border border-cyan-400/50 text-white font-bold text-xs">
              {result.recommendationFocus}
            </span>
          </div>
        </div>

        <p className="text-sm text-[#F8FAFC] leading-relaxed">
          "{result.recommendationExplanation}"
        </p>

        {/* 3 Clickable Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {result.recommendedActions.map((action) => (
            <div
              key={action.id}
              onClick={() => navigate(action.route)}
              className="p-4 rounded-xl bg-[#0F1026]/80 border border-purple-500/30 hover:border-cyan-400/60 hover:bg-[#1C1F45] transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center">
                    {action.num}
                  </span>
                  <Badge variant={action.badgeColor || 'cyan'} size="sm">
                    {action.tag}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-[#A5B4FC] mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Start Drill</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 9. AGENT DECISION TIMELINE                                                */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 space-y-6 border-purple-500/30">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            How InterviewAI Decided Your Next Step
          </h2>
          <p className="text-xs text-[#A5B4FC] mt-0.5">
            Transparent autonomous reasoning pipeline — moving beyond simple conversational chatbots
          </p>
        </div>

        {/* 5-Step Agent Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative pt-2">
          {result.timelineSteps.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/25 flex flex-col justify-between space-y-2 relative"
            >
              <div>
                <div className="w-7 h-7 rounded-lg bg-purple-900/50 border border-purple-500/40 text-cyan-300 font-extrabold text-xs flex items-center justify-center mb-2">
                  0{step.step}
                </div>
                <h3 className="text-xs font-bold text-white">{step.title}</h3>
                <p className="text-[11px] text-[#A5B4FC] mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 10. QUESTION-BY-QUESTION PERFORMANCE (Expandable Rows)                    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Question-by-Question Performance
            </h2>
            <p className="text-xs text-[#A5B4FC]">
              Expand any question to inspect candidate answers, score metrics, and AI critique
            </p>
          </div>
          <span className="text-xs text-cyan-400 font-mono">
            {result.questionPerformance.length} Inquiries Evaluated
          </span>
        </div>

        <div className="space-y-3">
          {result.questionPerformance.map((item) => {
            const isExpanded = !!expandedQuestions[item.num];
            return (
              <GlassCard
                key={item.num}
                className={`p-0 overflow-hidden border transition-all ${
                  isExpanded ? 'border-cyan-500/40 shadow-lg' : 'border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                {/* Accordion Row Header */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(item.num)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors hover:bg-white/5 cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <span className="w-8 h-8 rounded-lg bg-[#0F1026] border border-purple-500/30 text-cyan-300 text-xs font-extrabold flex items-center justify-center shrink-0">
                      Q{item.num}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                          {item.dimension}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">
                        {item.question}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 ml-2">
                    <div className="text-right">
                      <span className="text-[10px] text-[#A5B4FC] block uppercase">Score</span>
                      <span className="text-sm sm:text-base font-black text-cyan-300 font-mono">
                        {item.score}/100
                      </span>
                    </div>

                    <div className="p-1 rounded-lg bg-[#0F1026] text-[#A5B4FC]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="p-5 border-t border-purple-500/20 bg-[#0F1026]/70 space-y-4 text-xs animate-in fade-in duration-200">
                    {/* Full Question */}
                    <div>
                      <span className="font-bold text-[#A5B4FC] uppercase tracking-wider text-[10px] block mb-1">
                        Full Interview Question:
                      </span>
                      <p className="text-white font-medium p-3 rounded-xl bg-[#191A3A]/70 border border-purple-500/20">
                        "{item.question}"
                      </p>
                    </div>

                    {/* Candidate Answer */}
                    <div>
                      <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px] block mb-1">
                        Candidate Answer Submitted:
                      </span>
                      <p className="text-[#F8FAFC] leading-relaxed p-3 rounded-xl bg-[#191A3A]/40 border border-cyan-500/20">
                        {item.userAnswer}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-300 block mb-0.5">AI Feedback:</span>
                        <p className="text-[#A5B4FC] leading-relaxed">{item.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 11. NEXT BEST ACTION (3 Cards near bottom)                                */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            WHAT SHOULD YOU DO NEXT?
          </h2>
          <p className="text-xs text-[#A5B4FC]">
            Choose your next high-impact preparation activity based on your evaluated skill gaps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <GlassCard
            hoverEffect
            glow="cyan"
            onClick={() => navigate('/skill-gap')}
            className="p-6 cursor-pointer flex flex-col justify-between space-y-4 border-cyan-500/30"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">🎯 Practice Weak Areas</h3>
              <p className="text-xs text-[#A5B4FC] mt-1 leading-relaxed">
                Focus on problem solving and confidence. Inspect your benchmark gap matrix.
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1 pt-2">
              Inspect Skill Gaps →
            </span>
          </GlassCard>

          {/* Card 2 */}
          <GlassCard
            hoverEffect
            glow="purple"
            onClick={() => navigate('/daily-challenge')}
            className="p-6 cursor-pointer flex flex-col justify-between space-y-4 border-orange-500/30"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-3">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">🔥 Daily Challenge</h3>
              <p className="text-xs text-[#A5B4FC] mt-1 leading-relaxed">
                Complete today's personalized challenge to maintain your streak and earn +20 XP.
              </p>
            </div>
            <span className="text-xs font-bold text-orange-400 flex items-center gap-1 pt-2">
              Start Challenge (+20 XP) →
            </span>
          </GlassCard>

          {/* Card 3 */}
          <GlassCard
            hoverEffect
            glow="purple"
            onClick={() => navigate('/interview-setup')}
            className="p-6 cursor-pointer flex flex-col justify-between space-y-4 border-purple-500/30"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">🎤 New Mock Interview</h3>
              <p className="text-xs text-[#A5B4FC] mt-1 leading-relaxed">
                Try another interview round with adaptive questions tailored to your elevated level.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1 pt-2">
              Launch Interview Setup →
            </span>
          </GlassCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 12. FINAL ACTION BUTTONS                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-purple-500/20">
        <GradientButton
          variant="secondary"
          size="lg"
          onClick={() => navigate('/dashboard')}
          icon={LayoutDashboard}
          className="w-full sm:w-auto"
        >
          ← Back to Dashboard
        </GradientButton>

        <GradientButton
          variant="primary"
          size="lg"
          onClick={handleStartAnother}
          icon={ArrowRight}
          className="w-full sm:w-auto px-8 shadow-xl shadow-purple-900/50"
        >
          Start Another Interview →
        </GradientButton>
      </div>

    </div>
  );
}
