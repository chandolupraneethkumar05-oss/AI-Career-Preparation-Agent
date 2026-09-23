/**
 * Career Journey and Career Readiness API Client
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';
import { BACKEND_BASE_URL } from './apiConfig';

export const careerJourneyApi = {
  /**
   * Retrieves the candidate's authentic Career Journey payload including the 14 milestones,
   * current focus, next best action, and multi-dimensional readiness assessment.
   * @param {string} userId Candidate user ID
   */
  async getCareerJourney(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/career-journey?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.debug('[careerJourneyApi] getCareerJourney failed:', err.message);
      }
      return null;
    }
  },

  /**
   * Retrieves the granular Career Readiness Foundation breakdown across the 5 preparation dimensions.
   * @param {string} userId Candidate user ID
   */
  async getReadinessAssessment(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/career-journey/readiness?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.debug('[careerJourneyApi] getReadinessAssessment failed:', err.message);
      }
      return null;
    }
  }
};
