import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Award,
  Flame,
  ArrowRight,
  Printer,
  RotateCw,
  Code2,
  Mic,
  Target,
  ShieldCheck,
  ChevronRight,
  Clock,
  Layers
} from 'lucide-react';
import { weeklyReportApi } from '../services/weeklyReportApi';
import { goalsApi } from '../services/goalsApi';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';

export default function WeeklyReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [goals, setGoals] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRecoveringStreak, setIsRecoveringStreak] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState(null);

  const userId = user?.id || 'user-001';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reportData, goalsData, historyData] = await Promise.all([
        weeklyReportApi.getCurrentReport(userId),
        goalsApi.getWeeklyGoals(userId),
        weeklyReportApi.getReportHistory(userId)
      ]);
      setReport(reportData);
      setGoals(goalsData);
      setHistory(historyData || []);
    } catch (err) {
      if (import.meta.env.DEV) console.debug('Failed to load weekly report data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const updated = await weeklyReportApi.regenerateReport(userId);
      if (updated) setReport(updated);
      const updatedGoals = await goalsApi.getWeeklyGoals(userId);
      if (updatedGoals) setGoals(updatedGoals);
    } catch (err) {
      if (import.meta.env.DEV) console.debug('Failed to regenerate report:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectHistoryReport = async (reportId) => {
    setIsLoading(true);
    try {
      const pastReport = await weeklyReportApi.getReportById(reportId, userId);
      if (pastReport) setReport(pastReport);
    } catch (err) {
      if (import.meta.env.DEV) console.debug('Failed to load historic report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreakRecovery = async () => {
    setIsRecoveringStreak(true);
    setRecoveryMessage(null);
    try {
      const res = await goalsApi.recoverStreak(userId);
      setRecoveryMessage(res);
      if (res.success) {
        // Refresh goals to update streak and cooldown status
        const updatedGoals = await goalsApi.getWeeklyGoals(userId);
        if (updatedGoals) setGoals(updatedGoals);
      }
    } catch (err) {
      setRecoveryMessage({ success: false, message: 'Could not apply streak recovery.' });
    } finally {
      setIsRecoveringStreak(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center space-y-3 font-sans text-[#1F1B16]">
        <div className="w-10 h-10 border-2 border-[#1A365D] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-serif text-[#70685E]">Compiling Weekly AI Career Report...</p>
      </div>
    );
  }

  const summary = report?.summary || {};
  const vsPrev = summary.vs_previous_week || {};
  const interviewPerf = report?.interview_performance || {};
  const codingPerf = report?.coding_performance || {};
  const readiness = report?.readiness_summary || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans text-[#1F1B16]">
      {/* 1. Masthead Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E0D5] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1A365D] text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#8C6E54]" />
            <span>WEEK {report?.week_number || 1} • {report?.year || 2026}</span>
            <span className="text-[#8C6E54]">({report?.start_date} to {report?.end_date})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#1F1B16]">
            Weekly AI Career Report
          </h1>
          <p className="text-xs sm:text-sm text-[#70685E] mt-0.5">
            Objective performance synthesis, verified skill progression, and next week priorities for <strong className="text-[#1F1B16]">{user?.name || 'Candidate'}</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 print:hidden">
          {history.length > 1 && (
            <select
              onChange={(e) => handleSelectHistoryReport(e.target.value)}
              value={report?.id || ''}
              className="px-3 py-2 text-xs rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] font-semibold focus:outline-none focus:border-[#1A365D]"
            >
              {history.map((h) => (
                <option key={h.id} value={h.id}>
                  Week {h.week_number}, {h.year} ({h.start_date})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] hover:bg-[#F2EFE9] text-[#1F1B16] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print or save PDF report"
          >
            <Printer className="w-3.5 h-3.5 text-[#70685E]" />
            <span>Print Report</span>
          </button>

          <GradientButton
            variant="secondary"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            loading={isRegenerating}
            icon={RotateCw}
          >
            {isRegenerating ? 'Analyzing...' : 'Refresh'}
          </GradientButton>
        </div>
      </div>

      {/* 2. Key Highlights Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] shadow-xs space-y-1">
          <span className="editorial-overline text-[9px] block text-[#70685E]">MOCK INTERVIEWS</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#1F1B16]">{summary.total_interviews_this_week || 0}</span>
            {vsPrev.interviews_diff !== undefined && (
              <span className={`text-[11px] font-mono font-semibold ${vsPrev.interviews_diff >= 0 ? 'text-[#235E3B]' : 'text-[#70685E]'}`}>
                {vsPrev.interviews_diff >= 0 ? `+${vsPrev.interviews_diff}` : vsPrev.interviews_diff} vs prev
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#70685E]">Completed sessions</p>
        </div>

        <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] shadow-xs space-y-1">
          <span className="editorial-overline text-[9px] block text-[#70685E]">CODING DRILLS</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#1F1B16]">{summary.total_coding_solved_this_week || 0}</span>
            {vsPrev.coding_diff !== undefined && (
              <span className={`text-[11px] font-mono font-semibold ${vsPrev.coding_diff >= 0 ? 'text-[#235E3B]' : 'text-[#70685E]'}`}>
                {vsPrev.coding_diff >= 0 ? `+${vsPrev.coding_diff}` : vsPrev.coding_diff} vs prev
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#70685E]">Passed tests</p>
        </div>

        <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] shadow-xs space-y-1">
          <span className="editorial-overline text-[9px] block text-[#70685E]">DAILY PRACTICE</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#1F1B16]">{summary.total_daily_drills_this_week || 0}</span>
            <span className="text-[11px] font-mono text-[#70685E]">completed</span>
          </div>
          <p className="text-[10px] text-[#70685E]">Concept questions</p>
        </div>

        <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] shadow-xs space-y-1">
          <span className="editorial-overline text-[9px] block text-[#70685E]">XP EARNED</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#1F1B16]">+{summary.total_xp_gained_this_week || 0}</span>
            <Award className="w-4 h-4 text-[#8C6E54]" />
          </div>
          <p className="text-[10px] text-[#70685E]">Practice rewards</p>
        </div>

        <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="editorial-overline text-[9px] block text-[#70685E]">CURRENT STREAK</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-serif font-bold text-[#1F1B16] flex items-center gap-1">
              <Flame className="w-5 h-5 text-[#8C6E54] fill-[#8C6E54]" />
              {summary.streak_current || 0}d
            </span>
            <span className="text-[10px] font-mono text-[#70685E]">{summary.active_days_count || 0} active days</span>
          </div>
          <p className="text-[10px] text-[#70685E]">Consecutive momentum</p>
        </div>
      </div>

      {/* 3. Weekly Goals Commitment & Streak Recovery Widget */}
      {goals && (
        <GlassCard className="p-5 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-[#1F1B16] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#1A365D]" />
                <span>Weekly Preparation Commitments</span>
                <Badge variant={goals.status === 'completed' ? 'emerald' : 'navy'} size="xs">
                  {goals.status.toUpperCase()}
                </Badge>
              </h3>
              <p className="text-xs text-[#70685E]">Focus Area: <strong className="text-[#1F1B16]">{goals.focus_skill || 'Core Technical & System Architecture'}</strong></p>
            </div>

            {/* Streak Recovery Trigger */}
            <div className="flex items-center gap-2">
              {goals.streak_recovery_available ? (
                <button
                  type="button"
                  onClick={handleStreakRecovery}
                  disabled={isRecoveringStreak}
                  className="px-3 py-1.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] hover:border-[#8C6E54] text-xs font-semibold text-[#8C6E54] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Flame className="w-3.5 h-3.5 fill-[#8C6E54]" />
                  <span>{isRecoveringStreak ? 'Recovering...' : 'Use 30-Day Streak Recovery'}</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-[#70685E]">
                  Streak Recovery: Cooldown Active
                </span>
              )}
            </div>
          </div>

          {recoveryMessage && (
            <div className={`p-3 rounded-md text-xs border ${
              recoveryMessage.success ? 'bg-[#EBF4EE] border-[#235E3B]/30 text-[#235E3B]' : 'bg-[#FDF2F2] border-[#E0A8A8] text-[#9A2A2A]'
            }`}>
              {recoveryMessage.message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Interviews Goal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#70685E]">Mock Interviews</span>
                <span className="text-[#1F1B16] font-mono">{goals.interviews_completed} / {goals.target_interviews}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] overflow-hidden">
                <div
                  className="h-full bg-[#1B2A4A] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (goals.interviews_completed / Math.max(1, goals.target_interviews)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Coding Drills Goal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#70685E]">Skill Arena Drills</span>
                <span className="text-[#1F1B16] font-mono">{goals.coding_completed} / {goals.target_coding_drills}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] overflow-hidden">
                <div
                  className="h-full bg-[#8C6E54] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (goals.coding_completed / Math.max(1, goals.target_coding_drills)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Daily Drills Goal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#70685E]">Daily Practice Questions</span>
                <span className="text-[#1F1B16] font-mono">{goals.daily_drills_completed} / {goals.target_daily_drills}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] overflow-hidden">
                <div
                  className="h-full bg-[#235E3B] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (goals.daily_drills_completed / Math.max(1, goals.target_daily_drills)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 4. AI Qualitative Interpretation Card */}
      <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-2">
          <Sparkles className="w-4 h-4 text-[#8C6E54]" />
          <h3 className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
            AI Coach Qualitative Assessment
          </h3>
          <span className="editorial-overline text-[9px] ml-auto">WEEKLY EVALUATION DIGEST</span>
        </div>
        <p className="text-sm font-serif leading-relaxed text-[#1F1B16] bg-[#FAF8F3] p-4 rounded-md border border-[#E5E0D5]">
          "{report?.ai_interpretation}"
        </p>
      </GlassCard>

      {/* 5. Detailed Breakdown: Interview & Coding Practice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mock Interview Summary */}
        <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#1A365D]" />
              <h3 className="text-sm font-serif font-bold text-[#1F1B16]">Mock Interview Performance</h3>
            </div>
            {interviewPerf.average_score && (
              <Badge variant="navy" size="sm">
                Avg: {interviewPerf.average_score}/100
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#E5E0D5]/60">
              <span className="text-[#70685E]">Total Rounds Completed</span>
              <span className="font-semibold text-[#1F1B16] font-mono">{interviewPerf.total_sessions || 0}</span>
            </div>
            {interviewPerf.highest_scoring_round && (
              <div className="flex items-center justify-between text-xs py-1 border-b border-[#E5E0D5]/60">
                <span className="text-[#70685E]">Highest Performing Round</span>
                <span className="font-semibold text-[#1F1B16]">{interviewPerf.highest_scoring_round}</span>
              </div>
            )}
            {interviewPerf.star_adherence_rate && (
              <div className="flex items-center justify-between text-xs py-1 border-b border-[#E5E0D5]/60">
                <span className="text-[#70685E]">Communication &amp; Structure</span>
                <span className="font-semibold text-[#235E3B] font-mono">{interviewPerf.star_adherence_rate}/100</span>
              </div>
            )}

            {/* Strengths */}
            {interviewPerf.key_strengths?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-[#235E3B] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Demonstrated Strengths:
                </span>
                <ul className="space-y-1">
                  {interviewPerf.key_strengths.map((s, idx) => (
                    <li key={idx} className="text-xs text-[#70685E] pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-[#235E3B]">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {interviewPerf.primary_weaknesses?.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-[#8C6E54] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Growth Opportunities:
                </span>
                <ul className="space-y-1">
                  {interviewPerf.primary_weaknesses.map((w, idx) => (
                    <li key={idx} className="text-xs text-[#70685E] pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-[#8C6E54]">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/interview-setup')}
              className="text-xs text-[#1A365D] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Start New Mock Interview <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>

        {/* Coding Performance Summary */}
        <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#8C6E54]" />
              <h3 className="text-sm font-serif font-bold text-[#1F1B16]">Skill Arena Coding Practice</h3>
            </div>
            <Badge variant="emerald" size="sm">
              {codingPerf.pass_rate || 0}% Pass Rate
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#E5E0D5]/60">
              <span className="text-[#70685E]">Problems Attempted</span>
              <span className="font-semibold text-[#1F1B16] font-mono">{codingPerf.problems_attempted || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#E5E0D5]/60">
              <span className="text-[#70685E]">Problems Successfully Solved</span>
              <span className="font-semibold text-[#1F1B16] font-mono">{codingPerf.problems_solved || 0}</span>
            </div>

            {codingPerf.languages_used?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-[#70685E]">Topics &amp; Frameworks Practiced:</span>
                <div className="flex flex-wrap gap-1.5">
                  {codingPerf.languages_used.map((lang, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16]">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/skill-arena')}
              className="text-xs text-[#1A365D] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Skill Arena Practice <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* 6. Tracked Skills Progress */}
      {report?.skills_progress?.length > 0 && (
        <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1A365D]" />
              <h3 className="text-sm font-serif font-bold text-[#1F1B16]">Skill Progression Matrix</h3>
            </div>
            <span className="editorial-overline text-[10px]">VERIFIED PLATFORM EVIDENCE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {report.skills_progress.map((skill, idx) => (
              <div key={idx} className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-[#1F1B16] truncate">{skill.skill_name}</span>
                  <Badge
                    variant={skill.status === 'proficient' ? 'emerald' : skill.status === 'improving' ? 'navy' : 'bronze'}
                    size="xs"
                  >
                    {skill.status === 'proficient' ? 'Proficient' : skill.status === 'improving' ? 'Improving' : 'Needs Practice'}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#70685E] leading-relaxed line-clamp-2">{skill.recent_activity}</p>
                <div className="text-[10px] font-mono text-[#1A365D]">
                  Evidence Count: {skill.evidence_count}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 7. Next Week Priorities & Immediate Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Week Priorities */}
        <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
            <TrendingUp className="w-4 h-4 text-[#1A365D]" />
            <h3 className="text-sm font-serif font-bold text-[#1F1B16]">High-Impact Next Week Priorities</h3>
          </div>

          <div className="space-y-3">
            {report?.next_week_priorities?.map((priority, idx) => (
              <div key={idx} className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-bold text-[#1F1B16]">{priority.priority_title}</h4>
                  <Badge variant="neutral" size="xs">{priority.target_metric}</Badge>
                </div>
                <p className="text-[11px] text-[#70685E] leading-relaxed">{priority.description}</p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-[#8C6E54] italic">{priority.suggested_action}</span>
                  <button
                    onClick={() => navigate(priority.action_route)}
                    className="text-[11px] text-[#1A365D] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Action <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Areas Requiring Attention */}
        <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
            <AlertCircle className="w-4 h-4 text-[#8C6E54]" />
            <h3 className="text-sm font-serif font-bold text-[#1F1B16]">Areas Requiring Attention</h3>
          </div>

          <div className="space-y-3">
            {report?.areas_requiring_attention?.map((area, idx) => (
              <div key={idx} className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1.5">
                <h4 className="text-xs font-serif font-bold text-[#1F1B16] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8C6E54]" />
                  {area.area_name}
                </h4>
                <p className="text-[11px] text-[#70685E] leading-relaxed">{area.reason}</p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-[#1F1B16] font-medium">{area.action_recommendation}</span>
                  <button
                    onClick={() => navigate(area.action_route)}
                    className="text-[11px] text-[#1A365D] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                  >
                    Resolve <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* 8. Career Readiness Snapshot Footer */}
      <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#235E3B]" />
            <span className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider">Career Readiness Foundation</span>
            <Badge variant="emerald" size="xs">
              {readiness.readiness_band?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-[#70685E]">
            {readiness.completed_milestones} of {readiness.total_milestones} lifecycle milestones completed ({readiness.overall_score}% foundation readiness).
          </p>
        </div>

        <GradientButton
          variant="secondary"
          size="sm"
          onClick={() => navigate('/career-journey')}
          icon={ArrowRight}
        >
          View Full Career Journey
        </GradientButton>
      </GlassCard>
    </div>
  );
}
