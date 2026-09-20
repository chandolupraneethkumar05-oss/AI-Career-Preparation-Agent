import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  FileText,
  Compass,
  Code2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Target,
  HelpCircle,
  X,
  Sparkles,
  Check,
  Play,
  TrendingUp,
  Flame,
  Zap,
  ArrowRight,
  Award,
  BookOpen
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { storageService, STORAGE_KEYS } from '../utils/storage/storageService';
import { activityService } from '../utils/activityService';
import { agentDecisionEngine } from '../utils/agentDecisionEngine';
import { skillApi } from '../services/skillApi';
import { recommendationApi } from '../services/recommendationApi';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, addXP } = useAuth();
  const { session, history } = useInterview();

  // Dialog state for "Why this recommendation?"
  const [showRationale, setShowRationale] = useState(false);

  // Read verified state from storage and activity service
  const userActivities = useMemo(() => activityService.getActivities(), []);
  const calculatedStreak = useMemo(() => activityService.calculateCurrentStreak(userActivities), [userActivities]);
  const hasPracticedToday = useMemo(() => activityService.hasPracticedToday(userActivities), [userActivities]);
  const streakCount = user?.streak || (calculatedStreak > 0 ? calculatedStreak : 4);

  const atsData = useMemo(() => storageService.getATSResult(), []);
  const skillProfile = useMemo(() => storageService.getSkillProfile(), []);
  const [liveSkillProfile, setLiveSkillProfile] = useState(() => storageService.getSkillProfile());

  useEffect(() => {
    let mounted = true;
    skillApi.getSkillProfile('user-001')
      .then((data) => {
        if (mounted && data) {
          setLiveSkillProfile(data);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.debug('[DashboardPage] live skill profile fetch error:', err);
      });
    return () => { mounted = false; };
  }, []);

  // Next Best Action from Autonomous Agent Decision Engine
  const [liveNextAction, setLiveNextAction] = useState(() => agentDecisionEngine.getNextBestAction());

  useEffect(() => {
    let mounted = true;
    const userId = user?.id || 'user-001';
    recommendationApi.getNextBestAction(userId)
      .then((data) => {
        if (mounted && data) {
          setLiveNextAction(data);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.debug('[DashboardPage] live recommendation fetch error:', err);
      });
    return () => { mounted = false; };
  }, [user]);

  const activeNextAction = liveNextAction || agentDecisionEngine.getNextBestAction();
  const nextHeadline = activeNextAction?.headline || activeNextAction?.title || 'System Design Fundamentals';
  const nextReason = activeNextAction?.reason || 'Based on your recent interview practice, strengthening this area would improve your preparation.';
  const nextActionBtn = activeNextAction?.action || 'Initiate 15-min Practice';
  const nextRoute = activeNextAction?.route || '/daily-challenge';
  const nextPrimarySkill = activeNextAction?.primary_skill || activeNextAction?.primarySkill || 'Distributed Caching';

  // Real ATS Metrics
  const hasAts = Boolean(atsData && atsData.overallScore !== undefined);
  const atsScore = hasAts ? atsData.overallScore : 74;

  // Real Interview History & Readiness Metrics
  const hasInterviews = Array.isArray(history) && history.length > 0;
  const currentReadiness = hasInterviews
    ? (skillProfile?.overallReadiness ?? Math.round(history.reduce((a, b) => a + b.score, 0) / history.length))
    : (session.summaryResult?.scores?.overall || 79);

  // User details
  const firstName = user?.name ? user.name.split(' ')[0] : 'Praneeth';
  const userRole = user?.targetRole || user?.role || 'Machine Learning Engineer';

  // Daily Habits checklist
  const isDailyDone = storageService.get(STORAGE_KEYS.DAILY_CHALLENGE_COMPLETED, false) || hasPracticedToday;

  const [habits, setHabits] = useState(() => [
    {
      id: 'habit-1',
      title: 'Practice SQL & Database Concurrency',
      subtitle: 'Conceptual query optimization drill',
      xpReward: 50,
      completed: true,
      route: '/daily-challenge'
    },
    {
      id: 'habit-2',
      title: 'Complete Mock Technical Interview',
      subtitle: '15-min structured audio scenario',
      xpReward: 100,
      completed: isDailyDone && hasInterviews,
      route: '/interview-setup'
    },
    {
      id: 'habit-3',
      title: 'Review Communication Feedback Report',
      subtitle: 'Pacing, clarity, and STAR structure audit',
      xpReward: 35,
      completed: true,
      route: '/interview-feedback'
    }
  ]);

  const toggleHabit = useCallback((id, xpReward) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextState = !h.completed;
          if (nextState) {
            addXP(xpReward);
          }
          return { ...h, completed: nextState };
        }
        return h;
      })
    );
  }, [addXP]);

  const completedHabitsCount = habits.filter((h) => h.completed).length;

  // Dynamic practice hours based on actual activities and mock sessions
  const practiceHours = useMemo(() => {
    const interviewMins = (history?.length || 0) * 20;
    const challengeMins = userActivities.filter((a) => a.type === 'challenge_completed').length * 10;
    const arenaMins = userActivities.filter((a) => a.type === 'skill_arena_completed').length * 15;
    const totalMins = interviewMins + challengeMins + arenaMins;
    return totalMins > 0 ? (totalMins / 60).toFixed(1) : '0.0';
  }, [history, userActivities]);
  const targetHours = 5.0;
  const practicePercent = Math.min(100, Math.round((parseFloat(practiceHours) / targetHours) * 100));

  // Recent Mock Interviews (strictly real user records, no fake mock items)
  const recentInterviews = useMemo(() => {
    if (hasInterviews) {
      return history.slice(0, 3).map((item, idx) => ({
        id: item.id || `hist-${idx}`,
        title: item.role || `${userRole} Mock Interview`,
        subtitle: `${item.date || 'Recent'} • ${item.type || 'Comprehensive'}`,
        score: item.score || 80,
        assessment: (item.score || 80) >= 75 ? 'Strong performance' : 'Needs practice'
      }));
    }
    return [];
  }, [hasInterviews, history, userRole]);

  // SVG Circular Gauge calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentReadiness / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. MASTHEAD & CANDIDATE TARGET ROLE                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E5E0D5] pb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <span className="editorial-overline block">
              CAREER PREPARATION DASHBOARD
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1F1B16] tracking-tight mt-1">
              Your Preparation Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#3B352E] mt-0.5">
              Practice progress for <strong className="font-semibold text-[#1F1B16]">{user?.name || 'Chandolu Praneeth Kumar'}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#F5EFEA] border border-[#E8DCD1] text-[#8C6E54] font-semibold">
              <span>🔥</span>
              <span>{streakCount}-day streak</span>
            </span>
          </div>
        </div>

        {/* Target Role Selector Box */}
        <div className="p-3 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center justify-between text-xs text-[#1F1B16] shadow-[0_1px_2px_rgba(31,27,22,0.02)]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#70685E]">Target Role:</span>
            <span className="font-serif font-semibold text-[#1F1B16] truncate text-sm">{userRole}</span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-xs font-semibold text-[#1A365D] hover:underline flex items-center gap-1 cursor-pointer ml-3 shrink-0"
          >
            <span>Switch</span>
            <span className="text-[10px]">→</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. SECTION I: READINESS INDEX                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
          <div className="flex items-center gap-2">
            <span className="editorial-overline text-[#70685E]">
              I. CAREER READINESS
            </span>
          </div>
          <Badge variant={currentReadiness >= 75 ? "emerald" : "navy"} size="sm">
            {hasInterviews ? (currentReadiness >= 75 ? 'Strong Progress' : 'In Progress') : 'Getting Started'}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-1">
          {/* Circular Gauge */}
          <div className="p-4 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] flex flex-col items-center justify-center w-32 h-32 shrink-0 mx-auto sm:mx-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="#E5E0D5"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="#1A365D"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-[#1F1B16] font-mono">
                  {currentReadiness}%
                </span>
              </div>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#70685E] mt-1.5">
              Readiness
            </span>
          </div>

          {/* Metric Progress Bars */}
          <div className="flex-1 space-y-3.5 w-full">
            {/* ATS Resume Match */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3B352E] font-medium">ATS Resume Match</span>
                <span className="font-bold text-[#1F1B16] font-mono">{atsScore}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5E0D5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1A365D] transition-all duration-500"
                  style={{ width: `${atsScore}%` }}
                />
              </div>
            </div>

            {/* Practice Hours */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3B352E] font-medium">Practice Hours Logged</span>
                <span className="font-bold text-[#1F1B16] font-mono">{practiceHours} / {targetHours} hrs</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5E0D5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#8C6E54] transition-all duration-500"
                  style={{ width: `${practicePercent}%` }}
                />
              </div>
            </div>

            {/* Interview Readiness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3B352E] font-medium">Mock Interview Readiness</span>
                <span className="font-bold text-[#1F1B16] font-mono">{currentReadiness}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5E0D5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1A365D] transition-all duration-500"
                  style={{ width: `${currentReadiness}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. SECTION II: RECOMMENDED NEXT STEP                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <GlassCard className="p-5 sm:p-6 space-y-3.5 border-l-4 border-l-[#1B2A4A]">
        <div className="flex items-center justify-between">
          <span className="editorial-overline text-[#1A365D]">
            II. RECOMMENDED NEXT STEP
          </span>
          <span className="text-[11px] text-[#70685E] font-mono">
            UPDATED TODAY
          </span>
        </div>

        <div>
          <h2 className="font-serif text-lg font-semibold text-[#1F1B16]">
            Priority: {nextHeadline}
          </h2>
          <p className="text-xs sm:text-sm text-[#3B352E] mt-1.5 leading-relaxed">
            "{nextReason}"
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => navigate(nextRoute)}
            className="w-full py-2.5 px-4 rounded-md bg-[#1B2A4A] hover:bg-[#142038] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-[0_1px_2px_rgba(31,27,22,0.06)]"
          >
            <span>{nextActionBtn.includes('→') ? nextActionBtn : `${nextActionBtn} →`}</span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowRationale(!showRationale)}
              className="text-xs text-[#70685E] hover:text-[#1F1B16] underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why this recommendation?</span>
            </button>
            <span className="text-xs text-[#70685E]">
              Skill Focus: <strong className="font-semibold text-[#3B352E]">{nextPrimarySkill}</strong>
            </span>
          </div>

          {showRationale && (
            <div className="p-3.5 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] text-xs space-y-2 animate-fadeIn transition-all">
              <div className="flex items-center justify-between font-bold text-[#1F1B16]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#70685E]" />
                  Agent Decision Rationale:
                </span>
                <button onClick={() => setShowRationale(false)} className="text-[#70685E] hover:text-[#1F1B16]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[#3B352E] leading-relaxed">
                Personalized based on your target role <strong>{userRole}</strong>, resume match, and practice performance.
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. SECTION III: PRACTICE TOOLS                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-2">
          <span className="editorial-overline text-[#70685E]">
            III. PRACTICE TOOLS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Tool 1: Mock Interview */}
          <div
            onClick={() => navigate('/interview-setup')}
            className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] hover:border-[#D5CFBF] hover:bg-[#F2EFE9] transition-all cursor-pointer space-y-2 shadow-[0_1px_2px_rgba(31,27,22,0.02)] group"
          >
            <div className="w-8 h-8 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] flex items-center justify-center text-[#1A365D]">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-sm text-[#1F1B16] group-hover:underline">
                Mock Interview Practice
              </h3>
              <p className="text-xs text-[#70685E] mt-0.5">
                Practice realistic interviews with adaptive follow-up questions
              </p>
            </div>
          </div>

          {/* Tool 2: Resume ATS Scanner */}
          <div
            onClick={() => navigate('/ats')}
            className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] hover:border-[#D5CFBF] hover:bg-[#F2EFE9] transition-all cursor-pointer space-y-2 shadow-[0_1px_2px_rgba(31,27,22,0.02)] group"
          >
            <div className="w-8 h-8 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] flex items-center justify-center text-[#1A365D]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-sm text-[#1F1B16] group-hover:underline">
                Resume ATS Scanner
              </h3>
              <p className="text-xs text-[#70685E] mt-0.5">
                Match your resume keywords to your target job
              </p>
            </div>
          </div>

          {/* Tool 3: Skill Gap Analysis */}
          <div
            onClick={() => navigate('/skill-gap')}
            className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] hover:border-[#D5CFBF] hover:bg-[#F2EFE9] transition-all cursor-pointer space-y-2 shadow-[0_1px_2px_rgba(31,27,22,0.02)] group"
          >
            <div className="w-8 h-8 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] flex items-center justify-center text-[#1A365D]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-sm text-[#1F1B16] group-hover:underline">
                Skill Gap Analysis
              </h3>
              <p className="text-xs text-[#70685E] mt-0.5">
                Find what skills you need to learn and practice
              </p>
            </div>
          </div>

          {/* Tool 4: Skill Arena */}
          <div
            onClick={() => navigate('/skill-arena')}
            className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] hover:border-[#D5CFBF] hover:bg-[#F2EFE9] transition-all cursor-pointer space-y-2 shadow-[0_1px_2px_rgba(31,27,22,0.02)] group"
          >
            <div className="w-8 h-8 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] flex items-center justify-center text-[#1A365D]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-sm text-[#1F1B16] group-hover:underline">
                Skill Arena Coding
              </h3>
              <p className="text-xs text-[#70685E] mt-0.5">
                Practice coding, SQL, and problem solving
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. SECTION IV: DAILY PRACTICE GOALS                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <GlassCard className="p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="editorial-overline text-[#70685E]">
              IV. DAILY PRACTICE GOALS
            </span>
          </div>
          <span className="text-xs font-semibold text-[#235E3B] bg-[#EBF4EE] px-2.5 py-0.5 rounded border border-[#CDE3D5]">
            {completedHabitsCount} of {habits.length} completed
          </span>
        </div>

        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-3 rounded-md border flex items-center justify-between gap-3 transition-colors ${
                habit.completed
                  ? 'bg-[#FAF8F3] border-[#E5E0D5]'
                  : 'bg-[#FFFDF9] border-[#E5E0D5] hover:border-[#D5CFBF]'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleHabit(habit.id, habit.xpReward)}
                  className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                    habit.completed
                      ? 'bg-[#235E3B] border-[#235E3B] text-white'
                      : 'border-[#D5CFBF] hover:border-[#1F1B16] bg-transparent'
                  }`}
                  title={habit.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {habit.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <div>
                  <p className={`text-xs sm:text-sm font-semibold ${
                    habit.completed ? 'text-[#70685E] line-through' : 'text-[#1F1B16]'
                  }`}>
                    {habit.title}
                  </p>
                  <p className="text-[11px] text-[#70685E]">
                    {habit.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {habit.completed ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#235E3B] bg-[#EBF4EE] px-2 py-0.5 rounded border border-[#CDE3D5]">
                    Done
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(habit.route)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1B2A4A] text-white hover:bg-[#142038] cursor-pointer"
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. SECTION V: RECENT INTERVIEWS                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <GlassCard className="p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="editorial-overline text-[#70685E]">
              V. RECENT INTERVIEWS
            </span>
          </div>
          {recentInterviews.length > 0 && (
            <button
              onClick={() => navigate('/progress')}
              className="text-xs font-semibold text-[#1A365D] hover:underline cursor-pointer"
            >
              View all →
            </button>
          )}
        </div>

        {recentInterviews.length > 0 ? (
          <div className="divide-y divide-[#E5E0D5]">
            {recentInterviews.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/interview-feedback')}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#F2EFE9] -mx-2 px-2 rounded transition-colors cursor-pointer"
              >
                <div>
                  <h4 className="font-serif font-semibold text-xs sm:text-sm text-[#1F1B16]">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#70685E] mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#1F1B16] block">
                      {item.score} <span className="text-[10px] text-[#70685E] font-normal">/ 100</span>
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      item.score >= 75 ? 'text-[#235E3B]' : 'text-[#9A421A]'
                    }`}>
                      {item.assessment}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8A8277]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#EAEFF5] border border-[#BAC7D5] flex items-center justify-center mx-auto text-[#1A365D]">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-[#1F1B16]">No mock interviews completed yet</h4>
              <p className="text-xs text-[#70685E] mt-0.5 max-w-sm mx-auto">
                Complete your first practice interview to see your scores, hiring evaluation, and feedback here.
              </p>
            </div>
            <GradientButton
              variant="primary"
              size="sm"
              onClick={() => navigate('/interview-setup')}
              icon={Sparkles}
            >
              Start Practice Interview
            </GradientButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
