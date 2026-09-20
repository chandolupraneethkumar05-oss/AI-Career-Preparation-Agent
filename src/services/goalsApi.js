/**
 * Weekly Goals & Streak Recovery API Client
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const goalsApi = {
  /**
   * Retrieves active weekly commitments and streak recovery status.
   * @param {string} userId Candidate user ID
   */
  async getWeeklyGoals(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/goals/weekly?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[goalsApi] getWeeklyGoals failed:', err.message);
      return null;
    }
  },

  /**
   * Updates weekly target numbers or focus skill.
   * @param {Object} updates Target updates
   * @param {string} userId Candidate user ID
   */
  async updateWeeklyGoals(updates, userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/goals/weekly?user_id=${encodeURIComponent(userId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(updates)
        },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[goalsApi] updateWeeklyGoals failed:', err.message);
      return null;
    }
  },

  /**
   * Invokes 30-day streak recovery.
   * @param {string} userId Candidate user ID
   */
  async recoverStreak(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/goals/streak-recovery?user_id=${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' }
        },
        DEFAULT_TIMEOUT_MS
      );
      const data = await response.json();
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[goalsApi] recoverStreak failed:', err.message);
      return { success: false, message: 'Could not connect to server to recover streak.' };
    }
  }
};
