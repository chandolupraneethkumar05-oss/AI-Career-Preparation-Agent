import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Brain,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { useInterview } from '../context/InterviewContext';

export default function InterviewReadyPage() {
  const navigate = useNavigate();
  const { setup, startInterview } = useInterview();

  const handleStartSession = () => {
    startInterview();
    navigate('/mock-interview');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Interview Brief & Agent Calibration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          YOUR INTERVIEW IS READY ✨
        </h1>
        <p className="text-sm text-[#A5B4FC] max-w-xl mx-auto">
          The AI Interviewer has personalized a live session targeting your selected role and experience level.
        </p>
      </div>

      {/* Main Preparation Summary Card */}
      <GlassCard className="p-8 border-purple-500/40 shadow-2xl relative overflow-hidden space-y-8">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 text-center">
            <span className="text-[10px] text-[#A5B4FC] uppercase font-bold tracking-wider block mb-1">Target Role</span>
            <p className="text-xs sm:text-sm font-black text-white line-clamp-1">{setup.targetRole}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 text-center">
            <span className="text-[10px] text-[#A5B4FC] uppercase font-bold tracking-wider block mb-1">Interview Type</span>
            <Badge variant="cyan" size="sm">{setup.interviewType}</Badge>
          </div>
          <div className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 text-center">
            <span className="text-[10px] text-[#A5B4FC] uppercase font-bold tracking-wider block mb-1">Difficulty</span>
            <Badge variant="pink" size="sm">{setup.difficulty}</Badge>
          </div>
          <div className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 text-center">
            <span className="text-[10px] text-[#A5B4FC] uppercase font-bold tracking-wider block mb-1">Estimated Time</span>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>15-20 min</span>
            </div>
          </div>
        </div>

        {/* Evaluation Rubric Areas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              AI Agent Evaluation Rubric
            </h3>
            <span className="text-xs text-[#A5B4FC]">Weighted Multi-Dimension Scoring</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Brain, label: 'Technical Knowledge', desc: 'Accuracy of mechanisms, domain terminology, and architecture depth.', color: 'text-purple-400' },
              { icon: Lightbulb, label: 'Problem Solving', desc: 'Trade-off analysis, edge-case anticipation, and analytical clarity.', color: 'text-cyan-400' },
              { icon: MessageSquare, label: 'Communication & STAR', desc: 'Structured delivery (Situation, Task, Action, Result) and brevity.', color: 'text-pink-400' },
              { icon: Target, label: 'Prompt Relevance', desc: 'Directly addressing all facets of the interviewer’s prompt.', color: 'text-emerald-400' },
              { icon: TrendingUp, label: 'Confidence & Delivery', desc: 'Decisive phrasing, presence of concrete metrics and quantifiable outcomes.', color: 'text-amber-400' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-[#0F1026]/50 border border-purple-500/20 flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-[#191A3A] shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.label}</h4>
                    <p className="text-[11px] text-[#A5B4FC] mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pro-Tips for candidate */}
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
          <Bot className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-[#A5B4FC] space-y-1">
            <strong className="text-white">Interviewer Advice:</strong>
            <p>
              Type comprehensive answers (60–150 words). Include concrete technical keywords, practical projects you’ve built, and quantifiable metrics to maximize your AI readiness score.
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate('/interview-setup')}
            className="text-xs font-semibold text-[#A5B4FC] hover:text-white transition-colors"
          >
            ← Modify Setup
          </button>

          <GradientButton
            variant="primary"
            size="lg"
            onClick={handleStartSession}
            icon={ArrowRight}
            className="w-full sm:w-auto px-10 py-4 shadow-xl shadow-purple-900/50 text-base"
          >
            Start Interview →
          </GradientButton>
        </div>
      </GlassCard>
    </div>
  );
}
