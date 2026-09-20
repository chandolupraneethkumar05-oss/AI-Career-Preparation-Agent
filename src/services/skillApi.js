/**
 * Skill & Unified Career Competency Client Service
 * AI Career Preparation Agent
 */

import { storageService } from '../utils/storage/storageService';
import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const skillApi = {
  /**
   * Fetches unified multi-source skill profile (ATS resume evidence + live mock interview performance).
   * @param {string} userId Candidate user ID
   */
  async getSkillProfile(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/skills/profile?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      // Cache in localStorage for offline resilience and fast reloads
      if (data && data.unified_skills) {
        storageService.setSkillProfile(data);
      }
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[skillApi] getSkillProfile request failed, using cached profile:', err.message);
      const cached = storageService.getSkillProfile();
      if (cached) return cached;
      return null;
    }
  },

  /**
   * Fetches unified multi-source skill profile (alias for getSkillProfile).
   */
  async getUnifiedProfile(userId = 'user-001') {
    return this.getSkillProfile(userId);
  },

  /**
   * Updates or logs a candidate's skill gap score.
   */
  async updateSkillGap(gapData, userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/skills/gap?user_id=${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            ...gapData,
            user_id: userId
          })
        },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[skillApi] updateSkillGap failed:', err.message);
      return null;
    }
  },

  /**
   * Lists all registered skills in the career taxonomy.
   */
  async getTaxonomy() {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/skills`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[skillApi] getTaxonomy failed:', err.message);
      return [];
    }
  }
};
