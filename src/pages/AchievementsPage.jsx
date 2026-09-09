import React from 'react';
import { Lock, CheckCircle2, Award, Sparkles } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { MOCK_ACHIEVEMENTS } from '../data/mockData';

export default function AchievementsPage() {
  const { user } = useAuth();
  const { history } = useInterview();

  const isDailyDone = (() => {
    try {
      return localStorage.getItem('interview_ai_daily_challenge_completed') === 'true';
    } catch {
      return false;
    }
  })();

  const isATSScanned = (() => {
    try {
      return localStorage.getItem('interview_ai_ats_scanned') === 'true';
    } catch {
      return true;
    }
  })();

  const currentStreak = user?.streak || 7;
  const interviewCount = history.length;

  // Dynamically calibrate achievements based on candidate's real actions
  const dynamicAchievements = [
    {
      id: 'ach-1',
      title: 'First Interview',
      desc: 'Completed your first AI mock interview session',
      icon: '🏅',
      unlocked: interviewCount > 0,
      unlockedDate: 'Aug 28, 2026',
      progress: 100,
      category: 'Milestone'
    },
    {
      id: 'ach-2',
      title: '7-Day Streak',
      desc: 'Maintained continuous career preparation for a full week',
      icon: '🔥',
      unlocked: currentStreak >= 7,
      unlockedDate: 'Today',
      progress: 100,
      category: 'Consistency'
    },
    {
      id: 'ach-3',
      title: 'Interview Explorer',
      desc: 'Completed 5 mock interview practice sessions',
      icon: '🎯',
      unlocked: interviewCount >= 5,
      unlockedDate: interviewCount >= 5 ? 'Sep 2, 2026' : null,
      progress: Math.min(100, Math.round((interviewCount / 5) * 100)),
      category: 'Mastery'
    },
    {
      id: 'ach-4',
      title: 'Perfect Answer',
      desc: 'Scored 85+ overall on a comprehensive technical evaluation',
      icon: '💯',
      unlocked: history.some((h) => h.score >= 85),
      unlockedDate: 'Sep 5, 2026',
      progress: 100,
      category: 'Excellence'
    },
    {
      id: 'ach-5',
      title: 'Resume Optimizer',
      desc: 'Audited your resume against ATS industry algorithms',
      icon: '📄',
      unlocked: isATSScanned,
      unlockedDate: 'Sep 6, 2026',
      progress: 100,
      category: 'Preparation'
    },
    {
      id: 'ach-6',
      title: 'Practice Champion',
      desc: 'Solved and submitted a daily conceptual articulation drill',
      icon: '⚡',
      unlocked: isDailyDone,
      unlockedDate: isDailyDone ? 'Today' : null,
      progress: isDailyDone ? 100 : 0,
      category: 'Daily Habit'
    },
    {
      id: 'ach-7',
      title: 'Skill Improver',
      desc: 'Analyzed deficit proficiencies via the Skill Gap Analyzer',
      icon: '🧠',
      unlocked: true,
      unlockedDate: 'Today',
      progress: 100,
      category: 'Analytics'
    },
    {
      id: 'ach-8',
      title: '30-Day Streak',
      desc: 'Practice daily for 30 consecutive days without breaking momentum',
      icon: '🏆',
      unlocked: currentStreak >= 30,
      progress: Math.min(100, Math.round((currentStreak / 30) * 100)),
      category: 'Consistency'
    }
  ];

  const unlockedCount = dynamicAchievements.filter((a) => a.unlocked).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Gamified Career Milestones
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Achievements & Badges 🏆
          </h1>
          <p className="text-sm text-[#A5B4FC] mt-1">
            Celebrate consistent practice, algorithmic mastery, and interview excellence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="purple" size="md">
            {unlockedCount} of {dynamicAchievements.length} Badges Unlocked
          </Badge>
        </div>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dynamicAchievements.map((ach) => (
          <GlassCard
            key={ach.id}
            hoverEffect={ach.unlocked}
            glow={ach.unlocked ? 'purple' : 'none'}
            className={`
              p-5 flex flex-col justify-between space-y-4 relative transition-all
              ${ach.unlocked
                ? 'border-purple-500/40 bg-gradient-to-b from-[#191A3A] to-[#161735]'
                : 'border-slate-800 bg-[#0E0F20]/70 opacity-65'
              }
            `}
          >
            <div>
              {/* Badge Icon & Status */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md
                    ${ach.unlocked
                      ? 'bg-gradient-to-tr from-purple-600 to-cyan-500/80 shadow-purple-900/40'
                      : 'bg-slate-800 text-slate-500'
                    }
                  `}
                >
                  {ach.icon}
                </div>

                {ach.unlocked ? (
                  <Badge variant="green" size="sm">Unlocked</Badge>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] text-[#A5B4FC]/60 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked</span>
                  </div>
                )}
              </div>

              {/* Title & Desc */}
              <h3 className="text-base font-bold text-white mb-1">{ach.title}</h3>
              <p className="text-xs text-[#A5B4FC] leading-relaxed">{ach.desc}</p>
            </div>

            {/* Bottom Progress or Date */}
            <div className="pt-3 border-t border-purple-500/15">
              {ach.unlocked ? (
                <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Unlocked: {ach.unlockedDate || 'Active'}
                </span>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#A5B4FC]">
                    <span>Progress</span>
                    <span>{ach.progress || 0}%</span>
                  </div>
                  <ProgressBar
                    value={ach.progress || 0}
                    gradient="purple-cyan"
                    height="h-1.5"
                  />
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
