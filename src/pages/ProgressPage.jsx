import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import PerformanceChart from '../components/PerformanceChart';
import { useInterview } from '../context/InterviewContext';
import { activityService } from '../utils/activityService';
import { storageService } from '../utils/storage/storageService';

export default function ProgressPage() {
  const { history } = useInterview();
  const navigate = useNavigate();

  const userActivities = activityService.getActivities();
  const currentStreak = activityService.calculateCurrentStreak(userActivities);
  const skillProfile = storageService.getSkillProfile();

  // Derive dynamic stats from real history
  const hasInterviews = Array.isArray(history) && history.length > 0;
  const totalInterviews = hasInterviews ? history.length : 0;
  const avgScore = hasInterviews
    ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length)
    : 0;

  const challengeCount = userActivities.filter((a) => a.type === 'challenge_completed').length;
  const questionsAnswered = (totalInterviews * 5) + challengeCount;

  const scoreGain = hasInterviews && history.length > 1
    ? history[0].score - history[history.length - 1].score
    : 0;

  // Chart data
  const performanceHistory = hasInterviews
    ? (history.length === 1
        ? [
            { label: 'Baseline', score: history[0].score, date: history[0].date || 'Day 1' },
            { label: 'Current', score: history[0].score, date: history[0].date || 'Day 1' }
          ]
        : [...history].reverse().map((item, idx) => ({
            label: `Round ${idx + 1}`,
            score: item.score,
            date: item.date || `Session ${idx + 1}`
          })))
    : [];

  // Derive real competency skills from interview history or resume evidence
  const atsResult = storageService.getATSResult();
  const hasEvidence = hasInterviews || Boolean(atsResult);

  let techSkill = 0;
  let commSkill = 0;
  let confSkill = 0;

  if (hasInterviews) {
    let techSum = 0;
    let commSum = 0;
    let confSum = 0;
    let validCount = 0;

    history.forEach(h => {
      const s = h.scores || {};
      const t = s.technicalKnowledge || s.technicalAccuracy || s.overall;
      const c = s.communication || s.communicationSTAR || s.clarity;
      const cf = s.confidence || s.confidenceDelivery || s.structure || s.problemSolving;
      if (typeof t === 'number') techSum += t;
      if (typeof c === 'number') commSum += c;
      if (typeof cf === 'number') confSum += cf;
      validCount++;
    });

    if (validCount > 0) {
      techSkill = Math.round(techSum / validCount);
      commSkill = Math.round(commSum / validCount);
      confSkill = Math.round(confSum / validCount);
    }
  } else if (skillProfile?.hasEvidence && Array.isArray(skillProfile?.skills) && skillProfile.skills.length > 0) {
    techSkill = skillProfile.skills[0]?.score || 0;
    commSkill = skillProfile.skills.find(s => s.name?.toLowerCase().includes('comm'))?.score || 0;
    confSkill = skillProfile.skills.find(s => s.name?.toLowerCase().includes('prob') || s.name?.toLowerCase().includes('conf'))?.score || 0;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#70685E]">
              Performance Analytics
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#235E3B]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1F1B16] tracking-tight">
            Performance &amp; Growth
          </h1>
          <p className="text-sm text-[#70685E] mt-1">
            Visualizing your interview readiness, score trends, and skill growth over time.
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
        <GlassCard className="p-5 text-center border-[#E5E0D5] bg-[#FFFDF9] space-y-1">
          <span className="text-xs text-[#70685E] font-mono font-semibold uppercase tracking-wider">Interviews Done</span>
          <p className="text-3xl font-serif font-bold text-[#1F1B16]">{totalInterviews}</p>
          <span className="text-[11px] text-[#235E3B] font-mono font-semibold">
            {totalInterviews > 0 ? `${totalInterviews} completed` : 'Awaiting 1st round'}
          </span>
        </GlassCard>

        <GlassCard className="p-5 text-center border-[#E5E0D5] bg-[#FFFDF9] space-y-1">
          <span className="text-xs text-[#70685E] font-mono font-semibold uppercase tracking-wider">Average Score</span>
          <p className="text-3xl font-serif font-bold text-[#1A365D]">
            {hasInterviews ? `${avgScore}%` : 'N/A'}
          </p>
          <span className="text-[11px] text-[#235E3B] font-mono font-semibold">
            {hasInterviews ? (scoreGain !== 0 ? `${scoreGain >= 0 ? '↑ +' : '↓ '}${scoreGain}% progression` : 'Baseline score') : 'Diagnostic pending'}
          </span>
        </GlassCard>

        <GlassCard className="p-5 text-center border-[#E5E0D5] bg-[#FFFDF9] space-y-1">
          <span className="text-xs text-[#70685E] font-mono font-semibold uppercase tracking-wider">Questions Answered</span>
          <p className="text-3xl font-serif font-bold text-[#1F1B16]">{questionsAnswered}</p>
          <span className="text-[11px] text-[#70685E] font-mono">
            {questionsAnswered > 0 ? `${totalInterviews * 5} mock + ${challengeCount} drill` : 'Start practicing'}
          </span>
        </GlassCard>

        <GlassCard className="p-5 text-center border-[#E5E0D5] bg-[#FFFDF9] space-y-1">
          <span className="text-xs text-[#70685E] font-mono font-semibold uppercase tracking-wider">Continuity Record</span>
          <p className="text-3xl font-serif font-bold text-[#9A421A] flex items-center justify-center gap-1">
            <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-[#9A421A]' : 'opacity-40'}`} />
            <span>{currentStreak}d</span>
          </p>
          <span className="text-[11px] text-[#9A421A] font-mono font-semibold">
            {currentStreak > 0 ? 'Active continuity' : 'Initiate continuity'}
          </span>
        </GlassCard>
      </div>

      {/* Primary SVG Performance Chart */}
      <GlassCard className="p-6 sm:p-7 border-[#E5E0D5] bg-[#FFFDF9] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1F1B16] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1A365D]" />
              Interview Score Progression
            </h3>
            <p className="text-xs text-[#70685E]">
              Exact score progression from diagnostic to recent mock sessions
            </p>
          </div>
          <Badge variant={hasInterviews ? 'navy' : 'neutral'} size="sm">
            {hasInterviews ? `${history.length} Session${history.length > 1 ? 's' : ''} Scored` : '0 Sessions'}
          </Badge>
        </div>

        {hasInterviews ? (
          <>
            <div className="pt-2">
              <PerformanceChart data={performanceHistory} height={210} />
            </div>

            <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between">
              <span className="text-xs text-[#235E3B] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Score Progress: {history.length > 1 ? `${history[history.length - 1].score}% → ${history[0].score}%` : `Initial score established at ${history[0].score}%`}
              </span>
              <span className="text-xs text-[#1F1B16] font-mono font-bold">Latest: {history[0].score}%</span>
            </div>
          </>
        ) : (
          <div className="py-12 px-6 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-md bg-[#EAEFF5] border border-[#BDD0E2] flex items-center justify-center text-[#1A365D]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-base font-serif font-bold text-[#1F1B16]">No Progression Curve Yet</p>
            <p className="text-xs text-[#70685E] max-w-sm">
              Complete your first mock interview round to start tracking your score growth over time.
            </p>
            <button
              onClick={() => navigate('/interview-setup')}
              className="mt-1 px-4 py-2 rounded-md bg-[#1B2A4A] hover:bg-[#142038] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Start First Mock Interview →
            </button>
          </div>
        )}
      </GlassCard>

      {/* Trajectory Highlights */}
      <GlassCard className="p-6 space-y-6 border-[#E5E0D5] bg-[#FFFDF9]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1F1B16]">4-Week Performance Overview</h3>
            <p className="text-xs text-[#70685E]">Weekly interview readiness trend</p>
          </div>
          <Badge variant="navy" size="sm">Monthly Review</Badge>
        </div>

        {hasInterviews ? (
          <div className="grid grid-cols-4 gap-4 pt-4 items-end h-56">
            {[
              { week: 'Week 1', overall: history[history.length - 1]?.score || 70 },
              { week: 'Week 2', overall: history[Math.max(0, history.length - 2)]?.score || history[0].score },
              { week: 'Week 3', overall: history[1]?.score || history[0].score },
              { week: 'Week 4', overall: history[0]?.score || 80 }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-bold text-[#1F1B16] font-mono">{item.overall}%</span>
                <div
                  className="w-full max-w-[54px] rounded-sm bg-[#1B2A4A] border border-[#142038] transition-all duration-700"
                  style={{ height: `${(item.overall / 100) * 160}px` }}
                />
                <span className="text-xs text-[#70685E] font-semibold mt-1 font-mono">{item.week}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-[#70685E]">
              Weekly milestones will be logged as you complete mock interview rounds across the month.
            </p>
          </div>
        )}
      </GlassCard>

      {/* Dimension Growth Indicators */}
      <GlassCard className="p-6 space-y-5 border-[#E5E0D5] bg-[#FFFDF9]">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
          <h3 className="font-serif text-base font-bold text-[#1F1B16]">Competency Growth Metrics</h3>
          <span className="text-xs text-[#1A365D] font-semibold cursor-pointer hover:underline" onClick={() => navigate('/skill-gap')}>
            View Skill Gap Analysis →
          </span>
        </div>
        
        {!hasEvidence ? (
          <div className="p-6 rounded-md bg-[#FAF8F3] border border-dashed border-[#D5CFBF] text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8C6E54] font-semibold">
              Competencies Uncalibrated • Awaiting 1st Round
            </span>
            <p className="text-sm text-[#70685E] max-w-md mx-auto">
              Your competency growth matrix calibrates automatically once you complete your initial diagnostic interview or upload an ATS resume.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/interview-setup')}
                className="px-3.5 py-1.5 rounded-md bg-[#1B2A4A] text-white text-xs font-semibold hover:bg-[#142038] transition-colors cursor-pointer"
              >
                Launch Diagnostic Interview →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#70685E]">Technical Knowledge</span>
                <span className="text-xs font-mono font-bold text-[#235E3B] flex items-center">
                  {techSkill > 0 ? `${techSkill}%` : 'Pending'}
                </span>
              </div>
              <p className="text-xl font-serif font-bold text-[#1F1B16]">{techSkill > 0 ? `${techSkill}%` : '—'}</p>
              <ProgressBar value={techSkill} height="h-1.5" />
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#70685E]">Communication (STAR)</span>
                <span className="text-xs font-mono font-bold text-[#235E3B] flex items-center">
                  {commSkill > 0 ? `${commSkill}%` : 'Pending'}
                </span>
              </div>
              <p className="text-xl font-serif font-bold text-[#1F1B16]">{commSkill > 0 ? `${commSkill}%` : '—'}</p>
              <ProgressBar value={commSkill} height="h-1.5" />
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#70685E]">Confidence & Delivery</span>
                <span className="text-xs font-mono font-bold text-[#235E3B] flex items-center">
                  {confSkill > 0 ? `${confSkill}%` : 'Pending'}
                </span>
              </div>
              <p className="text-xl font-serif font-bold text-[#1F1B16]">{confSkill > 0 ? `${confSkill}%` : '—'}</p>
              <ProgressBar value={confSkill} height="h-1.5" />
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
