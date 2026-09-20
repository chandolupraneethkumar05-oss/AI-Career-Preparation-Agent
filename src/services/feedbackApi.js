/**
 * User Product Feedback API Client
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const feedbackApi = {
  /**
   * Submits product feedback or bug report.
   * @param {Object} feedback Feedback payload
   * @param {string} userId Candidate user ID
   */
  async submitFeedback(feedback, userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/feedback?user_id=${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(feedback)
        },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[feedbackApi] submitFeedback failed:', err.message);
      throw err;
    }
  },

  /**
   * Retrieves past feedback items by this candidate.
   * @param {string} userId Candidate user ID
   */
  async getMyFeedback(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/feedback/mine?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[feedbackApi] getMyFeedback failed:', err.message);
      return [];
    }
  }
};
