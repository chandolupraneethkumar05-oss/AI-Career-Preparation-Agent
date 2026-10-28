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
  BookOpen,
  AlertTriangle,
  Pencil,
  GraduationCap,
  Briefcase
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
  const { user, addXP, updateUser } = useAuth();
  const { session, history } = useInterview();

  // Dialog states
  const [showRationale, setShowRationale] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Edit Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileRole, setProfileRole] = useState(user?.targetRole || user?.role || 'Full Stack Software Engineer');
  const [profileDifficulty, setProfileDifficulty] = useState(user?.difficulty || 'Beginner / Campus Ready');
  const [profileGradYear, setProfileGradYear] = useState(user?.gradYear || '2026');

  // Sync profile form state whenever user changes
  useEffect(() => {
    if (user) {
      if (user.name) setProfileName(user.name);
      if (user.targetRole || user.role) setProfileRole(user.targetRole || user.role);
      if (user.difficulty) setProfileDifficulty(user.difficulty);
      if (user.gradYear) setProfileGradYear(user.gradYear);
    }
  }, [user]);

  // Read verified state from storage and activity service
  const userActivities = useMemo(() => activityService.getActivities(), []);
  const calculatedStreak = useMemo(() => activityService.calculateCurrentStreak(userActivities), [userActivities]);
  const hasPracticedToday = useMemo(() => activityService.hasPracticedToday(userActivities), [userActivities]);
  const streakCount = user?.streak || calculatedStreak || 0;

  const atsData = useMemo(() => storageService.getATSResult(), []);
  const skillProfile = useMemo(() => storageService.getSkillProfile(), []);
  const [liveSkillProfile, setLiveSkillProfile] = useState(() => storageService.getSkillProfile());

  useEffect(() => {
    let mounted = true;
    const currentUserId = user?.id || 'usr_candidate';
    skillApi.getSkillProfile(currentUserId)
      .then((data) => {
        if (mounted && data) {
          setLiveSkillProfile(data);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.debug('[DashboardPage] live skill profile fetch error:', err);
      });
    return () => { mounted = false; };
  }, [user?.id]);

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
  const nextRoute = activeNextAction?.route || '/skill-arena';
  const nextPrimarySkill = activeNextAction?.primary_skill || activeNextAction?.primarySkill || 'Distributed Caching';

  // Real ATS Metrics
  const hasAts = Boolean(atsData && atsData.overallScore !== undefined);
  const atsScore = hasAts ? atsData.overallScore : null;

  // Real Interview History & Readiness Metrics
  const hasInterviews = Array.isArray(history) && history.length > 0;
  const currentReadiness = hasInterviews
    ? (skillProfile?.overallReadiness ?? Math.round(history.reduce((a, b) => a + (b.score || 0), 0) / history.length))
    : (session.summaryResult?.scores?.overall || null);

  // User details
  const firstName = user?.name ? user.name.split(' ')[0] : 'Candidate';
  const userRole = user?.targetRole || user?.role || 'Full Stack Software Engineer';

  // Extract recent skipped skills or low-scoring skills (<70%) from the latest interview session
  const recentRemediationSkills = useMemo(() => {
    const skills = [];
    const seen = new Set();

    // 1. From active/latest session in memory
    if (session?.answers && session.answers.length > 0) {
      session.answers.forEach((ans, idx) => {
        const rawAns = ans.answerText || ans.answer || '';
        const rawScore = ans.evaluation?.scores?.overall ?? (ans.score != null ? ans.score / 10 : 7.5);
        const score = Math.round(rawScore <= 10 ? rawScore * 10 : rawScore);
        const isSkipped = Boolean(ans.skipped) || rawAns.includes('[Skipped by candidate]') || (score === 0 && !rawAns);
        const skillName = ans.skill || ans.topic || ans.category || `Question ${idx + 1}`;

        if ((isSkipped || score < 70) && !seen.has(skillName)) {
          seen.add(skillName);
          skills.push({
            name: skillName,
            isSkipped,
            score,
            question: ans.question || '',
            reason: isSkipped ? 'Skipped during mock interview' : `Scored ${score}% in recent interview`
          });
        }
      });
    }

    // 2. From skill profile gaps if available
    if (skills.length === 0 && liveSkillProfile?.gaps && Array.isArray(liveSkillProfile.gaps)) {
      liveSkillProfile.gaps.slice(0, 3).forEach((gap) => {
        const name = typeof gap === 'string' ? gap : gap.name || gap.skill;
        if (name && !seen.has(name)) {
          seen.add(name);
          skills.push({
            name,
            isSkipped: false,
            score: gap.score || 60,
            question: '',
            reason: 'Identified competency gap for your target role'
          });
        }
      });
    }

    return skills;
  }, [session, liveSkillProfile]);

  // Handle Edit Profile Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (updateUser) {
      updateUser({
        name: profileName.trim() || user?.name || 'Candidate',
        targetRole: profileRole,
        role: profileRole,
        difficulty: profileDifficulty,
        gradYear: profileGradYear
      });
    }
    setShowEditProfileModal(false);
  };

  // Daily Goals / Habit Tracking state
  const [habits, setHabits] = useState(() => {
    return [
      {
        id: 'mock_interview',
        title: 'Daily Practice Session',
        subtitle: 'Complete 1 calibrated interview scenario',
        xpReward: 30,
        completed: hasPracticedToday,
        route: '/interview-setup'
      },
      {
        id: 'skill_arena',
        title: 'Targeted Skill Drill',
        subtitle: 'Review & resolve 1 high-priority gap',
        xpReward: 20,
        completed: userActivities.some(a => a.type === 'challenge_completed' && a.date === new Date().toISOString().split('T')[0]),
        route: '/skill-arena'
      },
      {
        id: 'ats_check',
        title: 'ATS Resume Calibration',
        subtitle: 'Verify resume match score against target JD',
        xpReward: 15,
        completed: Boolean(atsData),
        route: '/ats'
      }
    ];
  });

  const toggleHabit = (id, xpReward) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextState = !h.completed;
        if (nextState) {
          addXP(xpReward);
          activityService.logActivity({
            type: 'habit_completed',
            habitId: id,
            xp: xpReward,
            date: new Date().toISOString().split('T')[0]
          });
        }
        return { ...h, completed: nextState };
      }
      return h;
    }));
  };

  const completedHabitsCount = habits.filter(h => h.completed).length;

  // Real Practice Hours
  const practiceHours = useMemo(() => {
    const interviewCount = history.length;
    const challengeCount = userActivities.filter((a) => a.type === 'challenge_completed').length;
    const totalMinutes = (interviewCount * 15) + (challengeCount * 5);
    return (totalMinutes / 60).toFixed(1);
  }, [history, userActivities]);
  const targetHours = 5.0;
  const practicePercent = Math.min(100, Math.round((parseFloat(practiceHours) / targetHours) * 100));

  // Recent Mock Interviews
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
  const readinessVal = currentReadiness !== null ? currentReadiness : 0;
  const strokeDashoffset = circumference - (readinessVal / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans text-slate-900">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TALENT SHINE TOP DIVISION HERO BANNER                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-slate-300">
        
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Left & Center Information */}
        <div className="flex-1 space-y-4 relative z-10 w-full">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                CAREER READINESS COCKPIT
              </span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Calibration
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, {firstName} 👋
              </h1>

              {/* Edit Profile Quick Action */}
              <button
                type="button"
                onClick={() => setShowEditProfileModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors w-fit cursor-pointer shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Profile</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Targeting: <strong className="font-semibold text-slate-800">{userRole}</strong> • {user?.difficulty || 'Campus Ready 2026'}
            </p>
          </div>

          {/* 3 Minimalist Metric Pills (Clean, No Essays) */}
          <div className="flex items-center gap-2.5 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{currentReadiness !== null ? `${currentReadiness}% Overall Readiness` : '85% Target Readiness'}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{streakCount > 0 ? `${streakCount}-Day Practice Streak` : '7-Day Practice Streak'}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 shadow-2xs">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>{practicePercent}% Daily Goal Met</span>
            </span>
          </div>

          {/* 1-Click Launch Button */}
          <div className="pt-2">
            <button
              onClick={() => navigate('/interview-setup')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
            >
              <span>Start Today's Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Corner: Candidate Boy Character (Clean, No Frames, No Badges) */}
        <div className="hidden md:flex items-center justify-center shrink-0 w-48 lg:w-60 pointer-events-none select-none">
          <img
            src="/boy-illustration-transparent.png"
            alt="Candidate studying with laptop"
            className="w-full h-auto max-h-56 object-contain"
          />
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TARGETED REMEDIATION & SKILL DRILLS (From Interview Skips)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {recentRemediationSkills.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3.5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                TARGETED REMEDIATION &amp; SKILL DRILLS
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {recentRemediationSkills.some(s => s.isSkipped) ? 'SKIPPED TOPICS DETECTED' : 'GAP REINFORCEMENT'}
            </span>
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>High-Priority Remediation from Recent Practice</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Topics you skipped or scored below 70% in your latest interview sessions. Practice targeted drills to convert these gaps into strengths.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {recentRemediationSkills.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {item.name}
                    </span>
                    {item.isSkipped ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold">
                        SKIPPED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-mono font-bold">
                        {item.score}% SCORE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.reason}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/skill-arena')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
                >
                  <span>Practice Drill</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. SECTION I: READINESS INDEX (Clean Cards & Gauges)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            I. CAREER READINESS INDEX
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            hasInterviews && currentReadiness >= 75 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}>
            {hasInterviews ? (currentReadiness >= 75 ? 'Strong Progress' : 'In Progress') : 'Calibration Needed'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-1">
          {/* Circular Gauge */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center w-32 h-32 shrink-0 mx-auto sm:mx-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke={currentReadiness !== null ? "#10B981" : "#94A3B8"}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-slate-900 font-mono">
                  {currentReadiness !== null ? `${currentReadiness}%` : '--'}
                </span>
              </div>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1.5">
              {currentReadiness !== null ? 'Readiness' : 'Uncalibrated'}
            </span>
          </div>

          {/* Metric Progress Bars */}
          <div className="flex-1 space-y-3.5 w-full">
            {/* ATS Resume Match */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">ATS Resume Match</span>
                {hasAts ? (
                  <span className="font-bold text-slate-900 font-mono">{atsScore}%</span>
                ) : (
                  <button
                    onClick={() => navigate('/ats')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Upload Resume to Calibrate →
                  </button>
                )}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${hasAts ? atsScore : 0}%` }}
                />
              </div>
            </div>

            {/* Practice Hours */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Practice Hours Logged</span>
                <span className="font-bold text-slate-900 font-mono">{practiceHours} / {targetHours} hrs</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${practicePercent}%` }}
                />
              </div>
            </div>

            {/* Mock Interview Readiness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Mock Interview Readiness</span>
                {hasInterviews ? (
                  <span className="font-bold text-slate-900 font-mono">{currentReadiness}%</span>
                ) : (
                  <button
                    onClick={() => navigate('/interview-setup')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Take First Interview →
                  </button>
                )}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${currentReadiness !== null ? currentReadiness : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. SECTION II: RECOMMENDED NEXT STEP (Tailored Action)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3.5 border-l-4 border-l-indigo-600">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            II. RECOMMENDED NEXT ACTION
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            CALIBRATED TODAY
          </span>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Priority: {nextHeadline}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            "{nextReason}"
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => navigate(nextRoute)}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
          >
            <span>{nextActionBtn.includes('→') ? nextActionBtn : `${nextActionBtn} →`}</span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowRationale(!showRationale)}
              className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why this recommendation?</span>
            </button>
            <span className="text-xs text-slate-500">
              Focus: <strong className="font-semibold text-slate-800">{nextPrimarySkill}</strong>
            </span>
          </div>

          {showRationale && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fadeIn transition-all">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Agent Decision Engine Rationale:
                </span>
                <button onClick={() => setShowRationale(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Calibrated based on your target role <strong>{userRole}</strong>, skill gaps from mock sessions, and live question skips.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. SECTION III: PRACTICE TOOLS                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            III. PRACTICE MODULES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Tool 1: Mock Interview */}
          <div
            onClick={() => navigate('/interview-setup')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Mock Interview Practice
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice 50/50 workspace interviews with zero-penalty skip and model rubrics
              </p>
            </div>
          </div>

          {/* Tool 2: Resume ATS Scanner */}
          <div
            onClick={() => navigate('/ats')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Resume ATS Scanner
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Match your resume keywords against raw Job Descriptions
              </p>
            </div>
          </div>

          {/* Tool 3: Skill Gap Analysis */}
          <div
            onClick={() => navigate('/skill-gap')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Skill Gap Analysis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect competencies and readiness benchmarks for {userRole}
              </p>
            </div>
          </div>

          {/* Tool 4: Skill Arena */}
          <div
            onClick={() => navigate('/skill-arena')}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Skill Arena Coding
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted practice drills, algorithms, and SQL query execution
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. SECTION IV: DAILY PRACTICE GOALS                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            IV. DAILY PRACTICE GOALS
          </span>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {completedHabitsCount} of {habits.length} completed
          </span>
        </div>

        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                habit.completed
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleHabit(habit.id, habit.xpReward)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                    habit.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 hover:border-slate-600 bg-transparent'
                  }`}
                  title={habit.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {habit.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <div>
                  <p className={`text-xs sm:text-sm font-bold ${
                    habit.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}>
                    {habit.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {habit.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {habit.completed ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Done
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(habit.route)}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. SECTION V: RECENT INTERVIEWS                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            V. RECENT INTERVIEWS
          </span>
          {recentInterviews.length > 0 && (
            <button
              onClick={() => navigate('/progress')}
              className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              View all →
            </button>
          )}
        </div>

        {recentInterviews.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentInterviews.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/interview-feedback')}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 block">
                      {item.score} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      item.score >= 75 ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {item.assessment}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">No mock interviews completed yet</h4>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                Complete your first practice interview to see your scores, hiring evaluation, and feedback here.
              </p>
            </div>
            <button
              onClick={() => navigate('/interview-setup')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
            >
              Start Practice Interview
            </button>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 8. EDIT PROFILE MODAL (TALENT SHINE POPUP)                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-slate-900 relative">
            
            <button
              onClick={() => setShowEditProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Edit Candidate Profile</h3>
                <p className="text-xs text-slate-500">Update your target track, role, and experience level.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Candidate Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Technical Role
                </label>
                <select
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 bg-white"
                >
                  <option value="Full Stack Software Engineer">Full Stack Software Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Cloud / DevOps Engineer">Cloud / DevOps Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Calibration Level / Experience
                </label>
                <select
                  value={profileDifficulty}
                  onChange={(e) => setProfileDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 bg-white"
                >
                  <option value="Beginner / Campus Ready">Beginner / Campus Ready (0-1 YOE)</option>
                  <option value="Intermediate / 1-3 YOE">Intermediate (1-3 YOE)</option>
                  <option value="Senior / Staff">Senior / Staff (4+ YOE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Graduation / Transition Year
                </label>
                <input
                  type="text"
                  value={profileGradYear}
                  onChange={(e) => setProfileGradYear(e.target.value)}
                  placeholder="2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
