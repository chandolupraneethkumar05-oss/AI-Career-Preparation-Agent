/**
 * Activity Service & Streak Calculation Engine
 * 
 * Tracks immutable, timestamped preparation activities (interviews, daily drills, ATS scans, skill drills)
 * and provides deterministic streak and daily practice calculations.
 */

import { storageService, STORAGE_KEYS } from './storage/storageService.js';

export const ACTIVITY_TYPES = {
  INTERVIEW_COMPLETED: 'interview_completed',
  CHALLENGE_COMPLETED: 'challenge_completed',
  RESUME_ANALYZED: 'resume_analyzed',
  ATS_SCANNED: 'ats_scanned', // Alias for resume_analyzed
  SKILL_ACTIVITY_COMPLETED: 'skill_activity_completed',
  SKILL_PRACTICE: 'skill_practice', // Alias for skill_activity_completed
  DIAGNOSTIC_COMPLETED: 'diagnostic_completed'
};

export const ACTIVITY_XP = {
  [ACTIVITY_TYPES.INTERVIEW_COMPLETED]: 100,
  [ACTIVITY_TYPES.CHALLENGE_COMPLETED]: 50,
  [ACTIVITY_TYPES.RESUME_ANALYZED]: 35,
  [ACTIVITY_TYPES.ATS_SCANNED]: 35,
  [ACTIVITY_TYPES.SKILL_ACTIVITY_COMPLETED]: 25,
  [ACTIVITY_TYPES.SKILL_PRACTICE]: 25,
  [ACTIVITY_TYPES.DIAGNOSTIC_COMPLETED]: 50
};

export const activityService = {
  /**
   * Record a verified, meaningful user activity.
   * Supports both recordActivity(type, metadata) and recordActivity({ type, ... })
   */
  recordActivity(typeOrObject, metadataParam = {}) {
    try {
      let type, metadata, relatedModule, xpEarned, title;

      if (typeof typeOrObject === 'string') {
        type = typeOrObject;
        metadata = metadataParam || {};
        relatedModule = metadata.relatedModule || type.split('_')[0];
        xpEarned = metadata.xpEarned || ACTIVITY_XP[type] || 25;
        title = metadata.title || formatActivityTitle(type, metadata);
      } else if (typeOrObject && typeof typeOrObject === 'object') {
        type = typeOrObject.type;
        metadata = typeOrObject.details || typeOrObject.metadata || {};
        relatedModule = typeOrObject.relatedModule || type.split('_')[0];
        xpEarned = typeOrObject.xpEarned || ACTIVITY_XP[type] || 25;
        title = typeOrObject.title || formatActivityTitle(type, metadata);
      } else {
        return null;
      }

      const user = storageService.getCurrentUser();
      const currentUserId = user?.id || user?.email || 'candidate';
      const activities = this.getActivities(currentUserId);
      const now = Date.now();

      // De-duplication: Prevent duplicate recordings if identical event fires within 2500ms
      const recentDuplicate = activities.find(
        (a) => a.type === type && (now - new Date(a.timestamp).getTime() < 2500)
      );
      if (recentDuplicate) {
        return recentDuplicate;
      }

      const newActivity = {
        id: `act-${now}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUserId,
        type,
        relatedModule,
        title,
        timestamp: new Date().toISOString(),
        metadata,
        details: metadata, // alias for backwards compatibility
        xpEarned
      };

      const updated = [newActivity, ...activities];
      storageService.set(storageService.scopedKey(STORAGE_KEYS.ACTIVITIES, currentUserId), updated);

      // Sync deterministic streak into storage
      const currentStreak = this.calculateCurrentStreak(updated);
      storageService.setStreak(currentStreak, currentUserId);

      // Update user XP and level in storage
      if (user) {
        const currentXP = user.xp || 0;
        const newXP = currentXP + xpEarned;
        const newLevel = Math.floor(newXP / 500) + 1;
        storageService.saveCurrentUser({
          ...user,
          xp: newXP,
          level: Math.max(user.level || 1, newLevel),
          streak: currentStreak
        });
      }

      return newActivity;
    } catch (err) {
      console.error('[activityService] Failed to record activity:', err);
      return null;
    }
  },

  /**
   * Retrieve all recorded user activities
   */
  getActivities(userId = null) {
    const effectiveId = userId || storageService.getCurrentUser()?.id;
    return storageService.getActivities(effectiveId);
  },

  /**
   * Check if the user has completed at least one meaningful activity on the specified date
   */
  hasPracticedToday(activities = null, targetDate = new Date()) {
    const list = activities || this.getActivities();
    if (!list || list.length === 0) return false;

    const targetKey = toDateKey(targetDate);
    return list.some((act) => toDateKey(new Date(act.timestamp)) === targetKey);
  },

  /**
   * Deterministically calculate the current consecutive day practice streak
   */
  calculateCurrentStreak(activities = null) {
    const list = activities || this.getActivities();
    if (!list || list.length === 0) return 0;

    // Extract all unique dates with meaningful activities
    const activeDates = new Set(
      list.map((act) => toDateKey(new Date(act.timestamp)))
    );

    const today = new Date();
    const todayKey = toDateKey(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    // If no activity today and no activity yesterday, streak has lapsed
    let startDay = new Date(today);
    if (!activeDates.has(todayKey)) {
      if (!activeDates.has(yesterdayKey)) {
        return 0;
      }
      // Practiced yesterday, active streak still counts through today until midnight
      startDay = yesterday;
    }

    let streak = 0;
    let cursor = new Date(startDay);

    while (activeDates.has(toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  },

  /**
   * Calculate longest consecutive streak achieved in history
   */
  calculateLongestStreak(activities = null) {
    const list = activities || this.getActivities();
    if (!list || list.length === 0) return 0;

    const sortedDates = Array.from(
      new Set(list.map((act) => toDateKey(new Date(act.timestamp))))
    ).sort();

    if (sortedDates.length === 0) return 0;

    let longest = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRun += 1;
        if (currentRun > longest) longest = currentRun;
      } else {
        currentRun = 1;
      }
    }

    return longest;
  },

  /**
   * Get activities filtered to today
   */
  getTodayActivities() {
    const todayKey = toDateKey(new Date());
    return this.getActivities().filter(
      (act) => toDateKey(new Date(act.timestamp)) === todayKey
    );
  }
};

/**
 * Format date as YYYY-MM-DD in local time
 */
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatActivityTitle(type, details) {
  switch (type) {
    case ACTIVITY_TYPES.INTERVIEW_COMPLETED:
      return `Mock Interview: ${details.role || 'Software'} (${details.score || 0}%)`;
    case ACTIVITY_TYPES.CHALLENGE_COMPLETED:
      return `Daily Drill: ${details.skill || 'Conceptual'} Completed`;
    case ACTIVITY_TYPES.RESUME_ANALYZED:
    case ACTIVITY_TYPES.ATS_SCANNED:
      return `ATS Resume Audit: ${details.fileName || 'Resume.pdf'}`;
    case ACTIVITY_TYPES.SKILL_ACTIVITY_COMPLETED:
    case ACTIVITY_TYPES.SKILL_PRACTICE:
      return `Skill Drill: ${details.skillName || 'Targeted'} Practiced`;
    default:
      return 'Career Preparation Activity';
  }
}
