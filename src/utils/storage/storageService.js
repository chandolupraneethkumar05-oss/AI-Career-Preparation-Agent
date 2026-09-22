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

  // Multi-tenant user scoping for complete candidate data isolation
  getUserScope(explicitUserId = null) {
    if (explicitUserId) {
      return explicitUserId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    }
    const u = this.getCurrentUser();
    if (u?.id) {
      return u.id.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    }
    if (u?.email) {
      return u.email.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    }
    return 'default';
  },

  scopedKey(key, explicitUserId = null) {
    if (key === STORAGE_KEYS.AUTH_USER || key === STORAGE_KEYS.THEME) {
      return key;
    }
    const scope = this.getUserScope(explicitUserId);
    return `${key}_${scope}`;
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

  getProfile(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.USER_PROFILE, userId), this.getCurrentUser());
  },
  saveProfile(profile, userId = null) {
    return this.set(this.scopedKey(STORAGE_KEYS.USER_PROFILE, userId), profile);
  },

  // 2. Activities
  getActivities(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.ACTIVITIES, userId), []);
  },
  saveActivity(activity, userId = null) {
    const list = this.getActivities(userId);
    const updated = [activity, ...list];
    return this.set(this.scopedKey(STORAGE_KEYS.ACTIVITIES, userId), updated);
  },

  // 3. Interviews
  getInterviews(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.INTERVIEWS, userId), []);
  },
  saveInterview(interview, userId = null) {
    const list = this.getInterviews(userId);
    const updated = [interview, ...list];
    return this.set(this.scopedKey(STORAGE_KEYS.INTERVIEWS, userId), updated);
  },
  setInterviews(interviews, userId = null) {
    return this.set(this.scopedKey(STORAGE_KEYS.INTERVIEWS, userId), interviews);
  },

  // 4. ATS Results
  getATSResult(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.ATS_RESULT, userId), null);
  },
  setATSResult(result, userId = null) {
    this.set(this.scopedKey(STORAGE_KEYS.ATS_SCANNED, userId), true);
    return this.set(this.scopedKey(STORAGE_KEYS.ATS_RESULT, userId), result);
  },

  // 5. Skill Gaps & Profiles
  getSkillGaps(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.SKILL_PROFILE, userId), null);
  },
  saveSkillGaps(gaps, userId = null) {
    return this.set(this.scopedKey(STORAGE_KEYS.SKILL_PROFILE, userId), gaps);
  },
  getSkillProfile(userId = null) {
    return this.getSkillGaps(userId);
  },
  setSkillProfile(profile, userId = null) {
    return this.saveSkillGaps(profile, userId);
  },

  // 6. Challenges
  getChallenges(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.CHALLENGES, userId), []);
  },
  saveChallenge(challenge, userId = null) {
    const list = this.getChallenges(userId);
    const updated = [challenge, ...list];
    this.set(this.scopedKey(STORAGE_KEYS.DAILY_CHALLENGE_COMPLETED, userId), true);
    this.set(this.scopedKey(STORAGE_KEYS.LAST_CHALLENGE_DATE, userId), new Date().toISOString().split('T')[0]);
    return this.set(this.scopedKey(STORAGE_KEYS.CHALLENGES, userId), updated);
  },

  // 7. Achievements
  getAchievements(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.ACHIEVEMENTS, userId), []);
  },
  saveAchievements(achievements, userId = null) {
    return this.set(this.scopedKey(STORAGE_KEYS.ACHIEVEMENTS, userId), achievements);
  },

  // 8. Progress
  getProgress(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.PROGRESS, userId), null);
  },
  saveProgress(progress, userId = null) {
    return this.set(this.scopedKey(STORAGE_KEYS.PROGRESS, userId), progress);
  },

  // 9. Reminder Preferences
  getReminderPrefs(userId = null) {
    return this.get(this.scopedKey(STORAGE_KEYS.REMINDER_PREFS, userId), {
      enabled: false,
      time: '19:00',
      preferred_time: '19:00',
      method: 'email',
      email: '',
      timezone: 'Asia/Kolkata',
      frequency: 'daily'
    });
  },
  setReminderPrefs(prefs, userId = null) {
    return this.set(this.scopedKey(STORAGE_KEYS.REMINDER_PREFS, userId), prefs);
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

  // 11. Backend Synchronization & Hydration
  async hydrateFromBackend(userId = 'user-001') {
    const baseUrl = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const results = { user: null, interviews: 0, ats: false };

    // 1. Profile Hydration
    try {
      const pRes = await fetch(`${baseUrl}/profile?user_id=${encodeURIComponent(userId)}`);
      if (pRes.ok) {
        const profile = await pRes.json();
        if (profile && profile.id) {
          const current = this.getCurrentUser() || {};
          this.saveCurrentUser({ ...current, ...profile });
          results.user = profile;
        }
      }
    } catch (e) {
      if (import.meta.env?.DEV) console.debug('[storageService] Profile hydration skipped:', e.message);
    }

    // 2. Interviews Hydration
    try {
      const iRes = await fetch(`${baseUrl}/interviews?user_id=${encodeURIComponent(userId)}&limit=50`);
      if (iRes.ok) {
        const data = await iRes.json();
        if (data && Array.isArray(data.interviews) && data.interviews.length > 0) {
          const localInterviews = this.getInterviews();
          const localIds = new Set(localInterviews.map((i) => i.id));
          const newFromBackend = data.interviews.filter((i) => !localIds.has(i.id));
          if (newFromBackend.length > 0) {
            this.setInterviews([...localInterviews, ...newFromBackend]);
          }
          results.interviews = data.interviews.length;
        }
      }
    } catch (e) {
      if (import.meta.env?.DEV) console.debug('[storageService] Interviews hydration skipped:', e.message);
    }

    // 3. ATS Analysis Hydration
    try {
      const aRes = await fetch(`${baseUrl}/resume/latest/${encodeURIComponent(userId)}`);
      if (aRes.ok) {
        const atsData = await aRes.json();
        if (atsData && (atsData.ats_score !== undefined || atsData.overallScore !== undefined)) {
          this.setATSResult(atsData);
          results.ats = true;
        }
      }
    } catch (e) {
      if (import.meta.env?.DEV) console.debug('[storageService] ATS hydration skipped:', e.message);
    }

    return results;
  },

  async syncInterviewToBackend(interview, userId = 'user-001') {
    const baseUrl = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api';
    try {
      const res = await fetch(`${baseUrl}/interviews?user_id=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: interview.role || 'Machine Learning Engineer',
          interview_type: interview.interviewType || interview.type || 'Technical',
          difficulty: interview.difficulty || 'Intermediate',
          overall_score: interview.score || interview.overall_score || 75,
          passed: interview.score ? interview.score >= 70 : true,
          questions_count: interview.questionsCount || 5,
          feedback_summary: interview.summary || interview.feedback_summary || 'Mock interview session completed.',
          rubric_scores: interview.rubricScores || {}
        })
      });
      return res.ok;
    } catch (e) {
      if (import.meta.env?.DEV) console.debug('[storageService] Interview sync skipped (offline):', e.message);
      return false;
    }
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

