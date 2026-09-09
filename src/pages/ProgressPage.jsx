import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Brain,
  Award,
  Zap,
  CheckCircle2,
  FileText
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import PerformanceChart from '../components/PerformanceChart';
import { MOCK_PROGRESS_HISTORY, DEFAULT_DASHBOARD_DATA } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';

export default function ProgressPage() {
  const { user } = useAuth();
  const { history } = useInterview();
  const navigate = useNavigate();

  const progressHistory = MOCK_PROGRESS_HISTORY;
  const performanceHistory = DEFAULT_DASHBOARD_DATA.performanceHistory;

  // Derive dynamic stats from history
  const totalInterviews = history && history.length > 0 ? history.length : 14;
  const avgScore = history && history.length > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length)
    : 82;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Longitudinal Performance Tracking
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Performance & Progress 📊
          </h1>
          <p className="text-sm text-[#A5B4FC] mt-1">
            Visualizing your interview readiness trajectory and competency evolution over time.
          </p>
        </div>

        <GradientButton
          variant="primary"
          size="md"
          onClick={() => navigate('/interview-setup')}
          icon={Sparkles}
        >
          Practice New Round
        </GradientButton>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-5 text-center border-purple-500/30 space-y-1">
          <span className="text-xs text-[#A5B4FC] font-semibold uppercase">Interviews Done</span>
          <p className="text-3xl font-black text-white">{totalInterviews}</p>
          <span className="text-[11px] text-emerald-400 font-semibold">+3 this week</span>
        </GlassCard>

        <GlassCard className="p-5 text-center border-cyan-500/30 space-y-1">
          <span className="text-xs text-[#A5B4FC] font-semibold uppercase">Average Score</span>
          <p className="text-3xl font-black text-cyan-300">{avgScore}%</p>
          <span className="text-[11px] text-emerald-400 font-semibold">↑ 14% since start</span>
        </GlassCard>

        <GlassCard className="p-5 text-center border-pink-500/30 space-y-1">
          <span className="text-xs text-[#A5B4FC] font-semibold uppercase">Questions Answered</span>
          <p className="text-3xl font-black text-pink-300">{user?.questionsAnswered || 86}</p>
          <span className="text-[11px] text-[#A5B4FC]">Across 3 domains</span>
        </GlassCard>

        <GlassCard className="p-5 text-center border-orange-500/30 space-y-1">
          <span className="text-xs text-[#A5B4FC] font-semibold uppercase">Current Streak</span>
          <p className="text-3xl font-black text-orange-400 flex items-center justify-center gap-1">
            <Flame className="w-6 h-6 fill-orange-400" />
            <span>{user?.streak || 7}d</span>
          </p>
          <span className="text-[11px] text-orange-300 font-semibold">Top consistency</span>
        </GlassCard>
      </div>

      {/* Primary SVG Performance Chart */}
      <GlassCard className="p-6 sm:p-7 border-purple-500/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Interview Score Progression
            </h3>
            <p className="text-xs text-[#A5B4FC]">
              Exact score progression from diagnostic to recent mock sessions
            </p>
          </div>
          <Badge variant="cyan" size="sm">+14 Points Net Gain</Badge>
        </div>

        <div className="pt-2">
          <PerformanceChart data={performanceHistory} height={210} />
        </div>

        <div className="p-3.5 rounded-xl bg-[#0F1026]/70 border border-emerald-500/30 flex items-center justify-between">
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Candidate rating escalated from Baseline (68%) to Strong Hire threshold (82%)
          </span>
          <span className="text-xs text-white font-mono font-bold">5 Sessions Scored</span>
        </div>
      </GlassCard>

      {/* Trajectory Highlights (Week 1 -> Week 4 Bar Progression) */}
      <GlassCard className="p-6 space-y-6 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">4-Week Composite Trajectory</h3>
            <p className="text-xs text-[#A5B4FC]">Longitudinal candidate readiness index</p>
          </div>
          <Badge variant="purple" size="sm">Monthly Review</Badge>
        </div>

        {/* Bar Chart Visualization */}
        <div className="grid grid-cols-4 gap-4 pt-4 items-end h-56">
          {progressHistory.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs font-bold text-white font-mono">{item.overall}%</span>
              <div
                className="w-full max-w-[60px] rounded-xl bg-gradient-to-t from-purple-700 to-cyan-400 border border-cyan-400/40 shadow-lg shadow-purple-900/30 transition-all duration-700"
                style={{ height: `${(item.overall / 100) * 160}px` }}
              />
              <span className="text-xs text-[#A5B4FC] font-semibold mt-1">{item.week}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Dimension Growth Indicators */}
      <GlassCard className="p-6 space-y-5 border-purple-500/30">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <h3 className="text-base font-bold text-white">Competency Growth Metrics</h3>
          <span className="text-xs text-cyan-400 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/skill-gap')}>
            View Skill Gap Analysis →
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A5B4FC]">Technical Knowledge</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> 12%
              </span>
            </div>
            <p className="text-xl font-bold text-white">88%</p>
            <ProgressBar value={88} gradient="purple-cyan" height="h-1.5" />
          </div>

          <div className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A5B4FC]">Communication (STAR)</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> 8%
              </span>
            </div>
            <p className="text-xl font-bold text-white">72%</p>
            <ProgressBar value={72} gradient="cyan" height="h-1.5" />
          </div>

          <div className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A5B4FC]">Confidence & Delivery</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> 14%
              </span>
            </div>
            <p className="text-xl font-bold text-white">74%</p>
            <ProgressBar value={74} gradient="amber" height="h-1.5" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
