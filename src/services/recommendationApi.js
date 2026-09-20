/**
 * Autonomous Recommendations API Client
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const recommendationApi = {
  /**
   * Fetches the candidate's optimal Next-Best-Action calculated autonomously
   * across ATS resume audits, interview rubrics, and unified skill gaps.
   * @param {string} userId Candidate user ID
   */
  async getNextBestAction(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/recommendations/next-action?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[recommendationApi] getNextBestAction failed:', err.message);
      return null;
    }
  }
};
