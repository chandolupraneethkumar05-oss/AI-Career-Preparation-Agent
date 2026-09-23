/**
 * Daily Conceptual Drill & Challenge API Client
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';
import { BACKEND_BASE_URL } from './apiConfig';

export const challengeApi = {
  /**
   * Fetches today's dynamic conceptual drill tailored to candidate's skill gaps.
   * @param {string} userId Candidate user ID
   */
  async getDailyChallenge(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/challenges/daily?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[challengeApi] getDailyChallenge failed, using offline fallback:', err.message);
      return null;
    }
  },

  /**
   * Submits candidate's drill articulation, awards XP, updates streak,
   * and records multi-source skill evidence in SQLite.
   * @param {string} userId Candidate user ID
   * @param {object} submissionData { challenge_id, user_answer, topic, target_role }
   */
  async submitChallenge(userId = 'user-001', submissionData) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/challenges/submit?user_id=${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(submissionData)
        },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[challengeApi] submitChallenge failed:', err.message);
      return null;
    }
  },

  /**
   * Fetches past conceptual drill history for the candidate.
   * @param {string} userId Candidate user ID
   * @param {number} limit Number of records to return
   */
  async getChallengeHistory(userId = 'user-001', limit = 30) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/challenges/history?user_id=${encodeURIComponent(userId)}&limit=${limit}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[challengeApi] getChallengeHistory failed:', err.message);
      return null;
    }
  }
};
