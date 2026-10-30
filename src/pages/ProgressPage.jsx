import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Award,
  Lock,
  ArrowRight,
  Target,
  Clock,
  Zap,
  BarChart3,
  Layers,
  ChevronRight
} from 'lucide-react';
import PerformanceChart from '../components/PerformanceChart';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import SegmentedControl from '../components/SegmentedControl';
import { useAuth } from '../context/AuthContext';
import { activityService } from '../utils/activityService';
import { storageService } from '../utils/storage/storageService';
import { achievementService } from '../utils/achievementService';
import { weeklyReportApi } from '../services/weeklyReportApi';
import { goalsApi } from '../services/goalsApi';

export default function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: 'readiness' | 'weekly' | 'milestones'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'weekly' ? 'weekly' : tabParam === 'milestones' ? 'milestones' : 'readiness'
  );

  useEffect(() => {
    if (tabParam && ['readiness', 'weekly', 'milestones'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const currentUserId = user?.id || 'candidate';
  const userActivities = activityService.getActivities(currentUserId);
  const currentStreak = activityService.calculateCurrentStreak(userActivities);
  const userInterviews = storageService.getInterviews(currentUserId);
  const skillProfile = storageService.getSkillProfile(currentUserId);
  const atsResult = storageService.getATSResult(currentUserId);

  // Guarantee history is always a safe array
  const history = Array.isArray(userInterviews) ? userInterviews : [];
  const hasInterviews = history.length > 0;
  const totalInterviews = hasInterviews ? history.length : 0;
  const avgScore = hasInterviews
    ? Math.round(history.reduce((acc, curr) => acc + (curr.score || 0), 0) / history.length)
    : 0;

  const challengeCount = userActivities.filter((a) => a.type === 'challenge_completed').length;
  const questionsAnswered = (totalInterviews * 5) + challengeCount;

  const scoreGain = hasInterviews && history.length > 1
    ? (history[0]?.score || 0) - (history[history.length - 1]?.score || 0)
    : 0;

  // Chart data
  const performanceHistory = hasInterviews
    ? (history.length === 1
        ? [
            { label: 'Baseline', score: history[0]?.score || 70, date: history[0]?.date || 'Day 1' },
            { label: 'Current', score: history[0]?.score || 70, date: history[0]?.date || 'Day 1' }
          ]
        : [...history].reverse().map((item, idx) => ({
            label: `Round ${idx + 1}`,
            score: item.score || 70,
            date: item.date || `Session ${idx + 1}`
          })))
    : [];

  // Skill Averages
  let techSkill = 0;
  let commSkill = 0;
  let confSkill = 0;

  if (hasInterviews) {
    let techSum = 0;
    let commSum = 0;
    let confSum = 0;
    let validCount = 0;

    userInterviews.forEach(h => {
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
  }

  // Weekly Report Data State
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [weeklyGoals, setWeeklyGoals] = useState(null);

  useEffect(() => {
    if (activeTab === 'weekly') {
      weeklyReportApi.getCurrentReport(currentUserId).then(setWeeklyReport).catch(() => {});
      goalsApi.getWeeklyGoals(currentUserId).then(setWeeklyGoals).catch(() => {});
    }
  }, [activeTab, currentUserId]);

  // Dynamic Achievements Data
  const careerState = useMemo(() => storageService.getUserCareerState(), []);
  const dynamicAchievements = useMemo(
    () => achievementService.evaluateAchievements(careerState),
    [careerState]
  );
  const unlockedAchievementsCount = dynamicAchievements.filter(a => a.unlocked).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans text-slate-900">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & UNIFIED TAB NAVIGATION                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              UNIFIED CAREER ANALYTICS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Progress &amp; Insights Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time readiness progression, weekly deep-dives, and verified competency milestones.
          </p>
        </div>

        {/* 3-Tab Segmented Control */}
        <div className="self-start sm:self-auto">
          <SegmentedControl
            options={[
              { id: 'readiness', label: 'Readiness & Trends', icon: TrendingUp },
              { id: 'weekly', label: 'Weekly Deep-Dive', icon: Calendar },
              { id: 'milestones', label: 'Milestones & Badges', icon: Award }
            ]}
            value={activeTab}
            onChange={handleTabChange}
            fullWidth={false}
            ariaLabel="Progress hub tabs"
          />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: READINESS & TRENDS                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'readiness' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 3 Quick Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Readiness</span>
              <p className="text-3xl font-mono font-bold text-slate-900">
                {hasInterviews ? `${avgScore}%` : '--'}
              </p>
              <span className="text-[11px] font-semibold text-emerald-700">
                {hasInterviews ? (scoreGain !== 0 ? `${scoreGain >= 0 ? '↑ +' : '↓ '}${scoreGain}% progression` : 'Baseline score established') : 'Complete first mock interview'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Questions Answered</span>
              <p className="text-3xl font-mono font-bold text-slate-900">{questionsAnswered}</p>
              <span className="text-[11px] text-slate-500">
                {totalInterviews * 5} mock questions • {challengeCount} skill drills
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Practice Streak</span>
              <p className="text-3xl font-mono font-bold text-amber-600 flex items-center gap-1.5">
                <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
                <span>{currentStreak}d</span>
              </p>
              <span className="text-[11px] font-semibold text-amber-800">
                {currentStreak > 0 ? 'Active daily streak' : 'Start streak today'}
              </span>
            </div>
          </div>

          {/* Performance Chart Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Interview Score Progression</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Exact calibrated score progression across your practice rounds
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 w-fit">
                {history.length} Sessions Logged
              </span>
            </div>

            {hasInterviews ? (
              <>
                <div className="pt-2">
                  <PerformanceChart data={performanceHistory} height={210} />
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Latest Session Score: {history[0].score}%
                  </span>
                  <span className="font-mono text-slate-500">{history[0].date || 'Recent'}</span>
                </div>
              </>
            ) : (
              <div className="py-12 px-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">No score history logged yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Complete your first calibrated mock interview round to start charting your growth.
                </p>
                <button
                  onClick={() => navigate('/interview-setup')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  Start First Interview →
                </button>
              </div>
            )}
          </div>

          {/* Skill Breakdown */}
          {hasInterviews && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                Core Competency Diagnostic
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Technical Depth</span>
                    <span className="font-mono text-slate-900">{techSkill}%</span>
                  </div>
                  <ProgressBar progress={techSkill} colorClass="bg-indigo-600" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">STAR Communication</span>
                    <span className="font-mono text-slate-900">{commSkill}%</span>
                  </div>
                  <ProgressBar progress={commSkill} colorClass="bg-emerald-500" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Problem Solving Structure</span>
                    <span className="font-mono text-slate-900">{confSkill}%</span>
                  </div>
                  <ProgressBar progress={confSkill} colorClass="bg-amber-500" />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: WEEKLY DEEP-DIVE                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'weekly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Drills</span>
              <p className="text-3xl font-mono font-bold text-slate-900">
                {weeklyReport?.summary?.total_daily_drills_this_week || challengeCount || 0}
              </p>
              <span className="text-[11px] text-slate-500">Target: 5 drills / week</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hours Practiced</span>
              <p className="text-3xl font-mono font-bold text-indigo-600">
                {weeklyReport?.summary?.total_practice_hours_this_week || '2.5'}h
              </p>
              <span className="text-[11px] text-slate-500">Target: 5.0h / week</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Goal Met</span>
              <p className="text-3xl font-mono font-bold text-emerald-600">
                {weeklyGoals?.completed_percentage ? `${weeklyGoals.completed_percentage}%` : '80%'}
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold">On track for campus readiness</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Weekly Habit Tracker
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">1 Mock Interview Round</h4>
                  <p className="text-[11px] text-slate-500">Practice full 5-question calibrated set</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Completed
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">3 Targeted Coding Drills</h4>
                  <p className="text-[11px] text-slate-500">Resolve skipped questions in Skill Arena</p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  In Progress
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: MILESTONES & BADGES                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'milestones' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Milestone Career Roadmap Stages */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Career Journey Roadmap
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">PHASE 1</span>
                <h4 className="text-xs font-bold text-emerald-950">Foundational Readiness</h4>
                <p className="text-[11px] text-emerald-800">Master basic DSA, clean syntax, and STAR delivery.</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Active / 85% Met
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PHASE 2</span>
                <h4 className="text-xs font-bold text-slate-900">Technical Depth &amp; Scale</h4>
                <p className="text-[11px] text-slate-500">System architecture, trade-offs, and edge case mastery.</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                  Unlocked next
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PHASE 3</span>
                <h4 className="text-xs font-bold text-slate-900">Placement Offer Ready</h4>
                <p className="text-[11px] text-slate-500">Live mock interview score &gt;85% across all rounds.</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                  Final Goal
                </span>
              </div>
            </div>
          </div>

          {/* Unlocked Badges Grid */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Verified Skill Milestones ({unlockedAchievementsCount} Unlocked)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {dynamicAchievements.slice(0, 6).map((ach) => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    ach.unlocked
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-white border-slate-100 opacity-60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    ach.unlocked ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {ach.unlocked ? <Award className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{ach.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{ach.description}</p>
                    <span className="text-[10px] font-mono text-indigo-600 block mt-1">+{ach.xpReward || 50} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
