/**
 * Centralized Achievement Evaluation Engine
 * 
 * Evaluates candidate milestones deterministically based on verified activities,
 * completed mock interviews, ATS resume audits, and practice streaks.
 */

import { storageService } from './storage/storageService.js';
import { ACTIVITY_TYPES } from './activityService.js';

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'ach-first-interview',
    title: 'First Interview',
    desc: 'Completed your first AI mock interview session',
    icon: '🏅',
    category: 'Milestone',
    target: 1,
    check: (state) => state.interviewCount >= 1,
    progress: (state) => (state.interviewCount >= 1 ? 100 : 0)
  },
  {
    id: 'ach-7-day-streak',
    title: '7-Day Streak',
    desc: 'Maintained continuous career preparation for 7 consecutive days',
    icon: '🔥',
    category: 'Consistency',
    target: 7,
    check: (state) => (state.currentStreak >= 7 || state.longestStreak >= 7),
    progress: (state) => Math.min(100, Math.round((Math.max(state.currentStreak || 0, state.longestStreak || 0) / 7) * 100))
  },
  {
    id: 'ach-5-interviews',
    title: 'Interview Explorer',
    desc: 'Complete 5 mock interview practice rounds',
    icon: '🎯',
    category: 'Mastery',
    target: 5,
    check: (state) => state.interviewCount >= 5,
    progress: (state) => Math.min(100, Math.round((state.interviewCount / 5) * 100))
  },
  {
    id: 'ach-perfect-answer',
    title: 'Perfect Answer',
    desc: 'Scored 85+ overall on a comprehensive technical evaluation',
    icon: '💯',
    category: 'Excellence',
    target: 85,
    check: (state) => (state.interviews || []).some((h) => (h.score || 0) >= 85),
    progress: (state) => {
      const maxScore = Math.max(0, ...(state.interviews || []).map((h) => h.score || 0));
      return maxScore >= 85 ? 100 : Math.min(95, Math.round((maxScore / 85) * 100));
    }
  },
  {
    id: 'ach-resume-ready',
    title: 'Resume Optimizer',
    desc: 'Audited your resume against ATS industry algorithms',
    icon: '📄',
    category: 'Preparation',
    target: 1,
    check: (state) => Boolean(state.hasAts || state.atsResult),
    progress: (state) => (state.hasAts || state.atsResult ? 100 : 0)
  },
  {
    id: 'ach-practice-champion',
    title: 'Practice Champion',
    desc: 'Solved and submitted daily conceptual articulation drills',
    icon: '⚡',
    category: 'Daily Habit',
    target: 1,
    check: (state) => state.challengeCount >= 1 || (state.activities || []).some((a) => a.type === ACTIVITY_TYPES.CHALLENGE_COMPLETED),
    progress: (state) => (state.challengeCount >= 1 || (state.activities || []).some((a) => a.type === ACTIVITY_TYPES.CHALLENGE_COMPLETED) ? 100 : 0)
  },
  {
    id: 'ach-skill-improver',
    title: 'Skill Improver',
    desc: 'Analyzed deficit proficiencies and initiated remedial practice',
    icon: '🧠',
    category: 'Analytics',
    target: 1,
    check: (state) => Boolean((state.hasAts || state.atsResult) && state.interviewCount > 0),
    progress: (state) => {
      let count = 0;
      if (state.hasAts || state.atsResult) count += 50;
      if (state.interviewCount > 0) count += 50;
      return count;
    }
  },
  {
    id: 'ach-30-day-streak',
    title: '30-Day Streak',
    desc: 'Practice daily for 30 consecutive days without breaking momentum',
    icon: '🏆',
    category: 'Consistency',
    target: 30,
    check: (state) => (state.currentStreak >= 30 || state.longestStreak >= 30),
    progress: (state) => Math.min(100, Math.round((Math.max(state.currentStreak || 0, state.longestStreak || 0) / 30) * 100))
  },
  {
    id: 'ach-arena-first',
    title: 'Code Challenger',
    desc: 'Completed your first technical challenge in the Skill Arena',
    icon: '💻',
    category: 'Technical Coding',
    target: 1,
    check: (state) => (state.activities || []).some((a) => a.type === 'SKILL_ARENA_ATTEMPT' || a.type === 'ARENA_CHALLENGE') || (state.arenaCount || 0) >= 1,
    progress: (state) => ((state.activities || []).some((a) => a.type === 'SKILL_ARENA_ATTEMPT' || a.type === 'ARENA_CHALLENGE') || (state.arenaCount || 0) >= 1 ? 100 : 0)
  },
  {
    id: 'ach-arena-master',
    title: 'Algorithmic Master',
    desc: 'Completed 5 technical challenges across coding, debugging, or SQL in Skill Arena',
    icon: '⚙️',
    category: 'Technical Coding',
    target: 5,
    check: (state) => {
      const arenaCount = (state.activities || []).filter((a) => a.type === 'SKILL_ARENA_ATTEMPT' || a.type === 'ARENA_CHALLENGE').length + (state.arenaCount || 0);
      return arenaCount >= 5;
    },
    progress: (state) => {
      const arenaCount = (state.activities || []).filter((a) => a.type === 'SKILL_ARENA_ATTEMPT' || a.type === 'ARENA_CHALLENGE').length + (state.arenaCount || 0);
      return Math.min(100, Math.round((arenaCount / 5) * 100));
    }
  }
];

export const achievementService = {
  /**
   * Evaluate all achievements against the unified candidate state.
   */
  evaluateAchievements(candidateState = null) {
    const state = candidateState || storageService.getUserCareerState();
    const existing = storageService.getAchievements();
    const existingMap = new Map((existing || []).map((a) => [a.id, a]));

    const evaluated = ACHIEVEMENT_DEFINITIONS.map((def) => {
      const isUnlocked = def.check(state);
      const prev = existingMap.get(def.id);
      const progress = def.progress(state);

      // Determine unlock timestamp
      let unlockedDate = prev?.unlockedDate || null;
      if (isUnlocked && !unlockedDate) {
        unlockedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      return {
        id: def.id,
        title: def.title,
        desc: def.desc,
        icon: def.icon,
        category: def.category,
        unlocked: isUnlocked,
        unlockedDate: isUnlocked ? unlockedDate : null,
        progress
      };
    });

    storageService.saveAchievements(evaluated);
    return evaluated;
  },

  getUnlockedCount(achievements = null) {
    const list = achievements || storageService.getAchievements();
    return (list || []).filter((a) => a.unlocked).length;
  }
};
