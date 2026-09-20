/**
 * Centralized Storage Service
 * 
 * Provides a unified, type-safe persistence layer over browser localStorage.
 * Serves as the single source of truth for user data, activities, interviews,
 * ATS audits, challenges, and derived career readiness state.
 */

export const STORAGE_KEYS = {
  AUTH_USER: 'interview_ai_auth_user',
  USER_PROFILE: 'interview_ai_user_profile',
  INTERVIEWS: 'interview_ai_history',
  ATS_RESULT: 'interview_ai_ats_result',
  ATS_SCANNED: 'interview_ai_ats_scanned',
  CHALLENGES: 'interview_ai_challenges',
  DAILY_CHALLENGE_COMPLETED: 'interview_ai_daily_challenge_completed',
  LAST_CHALLENGE_DATE: 'interview_ai_last_challenge_date',
  STREAK: 'interview_ai_streak',
  ACTIVITIES: 'interview_ai_activities',
  SKILL_PROFILE: 'interview_ai_skill_profile',
  ACHIEVEMENTS: 'interview_ai_achievements',
  PROGRESS: 'interview_ai_progress',
  REMINDER_PREFS: 'interview_ai_reminder_prefs',
  ACTIVE_SETUP: 'interview_ai_active_setup',
  THEME: 'interview_ai_theme'
};

export const storageService = {
  // Generic safe primitives
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[storageService] Failed to read key "${key}":`, err);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[storageService] Failed to save key "${key}":`, err);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[storageService] Failed to remove key "${key}":`, err);
      return false;
    }
  },

  // 1. User & Profile
  getCurrentUser() {
    return this.get(STORAGE_KEYS.AUTH_USER, null);
  },
  saveCurrentUser(user) {
    return this.set(STORAGE_KEYS.AUTH_USER, user);
  },
  getUser() {
    return this.getCurrentUser();
  },
  setUser(user) {
    return this.saveCurrentUser(user);
  },

  getProfile() {
    return this.get(STORAGE_KEYS.USER_PROFILE, this.getCurrentUser());
  },
  saveProfile(profile) {
    return this.set(STORAGE_KEYS.USER_PROFILE, profile);
  },

  // 2. Activities
  getActivities() {
    return this.get(STORAGE_KEYS.ACTIVITIES, []);
  },
  saveActivity(activity) {
    const list = this.getActivities();
    const updated = [activity, ...list];
    return this.set(STORAGE_KEYS.ACTIVITIES, updated);
  },

  // 3. Interviews
  getInterviews() {
    return this.get(STORAGE_KEYS.INTERVIEWS, []);
  },
  saveInterview(interview) {
    const list = this.getInterviews();
    const updated = [interview, ...list];
    return this.set(STORAGE_KEYS.INTERVIEWS, updated);
  },
  setInterviews(interviews) {
    return this.set(STORAGE_KEYS.INTERVIEWS, interviews);
  },

  // 4. ATS Results
  getATSResult() {
    return this.get(STORAGE_KEYS.ATS_RESULT, null);
  },
  setATSResult(result) {
    this.set(STORAGE_KEYS.ATS_SCANNED, true);
    return this.set(STORAGE_KEYS.ATS_RESULT, result);
  },

  // 5. Skill Gaps & Profiles
  getSkillGaps() {
    return this.get(STORAGE_KEYS.SKILL_PROFILE, null);
  },
  saveSkillGaps(gaps) {
    return this.set(STORAGE_KEYS.SKILL_PROFILE, gaps);
  },
  getSkillProfile() {
    return this.getSkillGaps();
  },
  setSkillProfile(profile) {
    return this.saveSkillGaps(profile);
  },

  // 6. Challenges
  getChallenges() {
    return this.get(STORAGE_KEYS.CHALLENGES, []);
  },
  saveChallenge(challenge) {
    const list = this.getChallenges();
    const updated = [challenge, ...list];
    this.set(STORAGE_KEYS.DAILY_CHALLENGE_COMPLETED, true);
    this.set(STORAGE_KEYS.LAST_CHALLENGE_DATE, new Date().toISOString().split('T')[0]);
    return this.set(STORAGE_KEYS.CHALLENGES, updated);
  },

  // 7. Achievements
  getAchievements() {
    return this.get(STORAGE_KEYS.ACHIEVEMENTS, []);
  },
  saveAchievements(achievements) {
    return this.set(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  },

  // 8. Progress
  getProgress() {
    return this.get(STORAGE_KEYS.PROGRESS, null);
  },
  saveProgress(progress) {
    return this.set(STORAGE_KEYS.PROGRESS, progress);
  },

  // 9. Reminder Preferences
  getReminderPrefs() {
    return this.get(STORAGE_KEYS.REMINDER_PREFS, {
      enabled: false,
      time: '19:00',
      preferred_time: '19:00',
      method: 'email',
      email: '',
      timezone: 'Asia/Kolkata',
      frequency: 'daily'
    });
  },
  setReminderPrefs(prefs) {
    return this.set(STORAGE_KEYS.REMINDER_PREFS, prefs);
  },

  // 10. Theme Preferences (Locked to single official Editorial Scholar theme)
  getTheme() {
    return 'editorial_scholar';
  },
  setTheme(themeId) {
    return this.set(STORAGE_KEYS.THEME, 'editorial_scholar');
  },

  // 10. Centralized Derived Candidate State (Phase 18)
  getUserCareerState() {
    const user = this.getCurrentUser();
    const interviews = this.getInterviews();
    const atsResult = this.getATSResult();
    const activities = this.getActivities();
    const challenges = this.getChallenges();
    const skillProfile = this.getSkillProfile();

    const targetRole = user?.targetRole || user?.role || 'Machine Learning Engineer';
    const interviewCount = interviews.length;
    const latestInterview = interviewCount > 0 ? interviews[0] : null;
    const averageScore = interviewCount > 0
      ? Math.round(interviews.reduce((sum, item) => sum + (item.score || 0), 0) / interviewCount)
      : 0;

    return {
      user,
      targetRole,
      xp: user?.xp || 0,
      level: user?.level || 1,
      interviews,
      interviewCount,
      latestInterview,
      averageScore,
      atsResult,
      hasAts: Boolean(atsResult && atsResult.overallScore !== undefined),
      activities,
      challenges,
      challengeCount: challenges.length,
      skillProfile
    };
  },

  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      return true;
    } catch (err) {
      console.error('[storageService] Failed to clear storage:', err);
      return false;
    }
  }
};

