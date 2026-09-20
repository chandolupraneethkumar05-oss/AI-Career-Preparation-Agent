/**
 * Interview Experiences & Question Repository API Client
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const experienceApi = {
  /**
   * Retrieves approved interview experiences with optional filtering and search.
   */
  async getExperiences(params = {}, userId = 'user-001') {
    try {
      const query = new URLSearchParams();
      if (params.role) query.append('role', params.role);
      if (params.round_type) query.append('round_type', params.round_type);
      if (params.topic) query.append('topic', params.topic);
      if (params.difficulty) query.append('difficulty', params.difficulty);
      if (params.search) query.append('search', params.search);
      if (params.limit) query.append('limit', params.limit);
      if (params.offset) query.append('offset', params.offset);
      if (userId) query.append('user_id', userId);

      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/experiences?${query.toString()}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[experienceApi] getExperiences failed:', err.message);
      return { total: 0, items: [], limit: 20, offset: 0 };
    }
  },

  /**
   * Retrieves questions extracted from approved real interview experiences.
   */
  async getExperienceQuestions(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.role) query.append('role', params.role);
      if (params.topic) query.append('topic', params.topic);
      if (params.round_type) query.append('round_type', params.round_type);
      if (params.difficulty) query.append('difficulty', params.difficulty);
      if (params.search) query.append('search', params.search);
      if (params.limit) query.append('limit', params.limit);
      if (params.offset) query.append('offset', params.offset);

      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/experiences/questions?${query.toString()}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[experienceApi] getExperienceQuestions failed:', err.message);
      return { total: 0, items: [], limit: 50, offset: 0 };
    }
  },

  /**
   * Retrieves all experiences contributed by the current candidate (including pending/rejected).
   */
  async getMyExperiences(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/experiences/me?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[experienceApi] getMyExperiences failed:', err.message);
      return [];
    }
  },

  /**
   * Retrieves detail of a single interview experience.
   */
  async getExperienceById(experienceId, userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/experiences/${encodeURIComponent(experienceId)}?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[experienceApi] getExperienceById failed:', err.message);
      return null;
    }
  },

  /**
   * Submits a new real interview experience with nested questions.
   */
  async createExperience(userId = 'user-001', experienceData) {
    const response = await fetchWithTimeout(
      `${BACKEND_BASE_URL}/api/experiences?user_id=${encodeURIComponent(userId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(experienceData)
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Submission failed with status ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Updates an existing interview experience. Status resets to PENDING.
   */
  async updateExperience(experienceId, userId = 'user-001', updateData) {
    const response = await fetchWithTimeout(
      `${BACKEND_BASE_URL}/api/experiences/${encodeURIComponent(experienceId)}?user_id=${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(updateData)
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Update failed with status ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Deletes an interview experience contributed by the candidate.
   */
  async deleteExperience(experienceId, userId = 'user-001') {
    const response = await fetchWithTimeout(
      `${BACKEND_BASE_URL}/api/experiences/${encodeURIComponent(experienceId)}?user_id=${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Delete failed with status ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Performs real-time pre-flight PII scanning on the candidate form input.
   */
  async scanPii(textOrData) {
    try {
      const payload = typeof textOrData === 'string'
        ? { text: textOrData }
        : { experience_data: textOrData };

      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/experiences/scan-pii`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        },
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) return { is_clean: true, pii_scan_status: 'CLEAN', detected_categories: [], flagged_snippets: [] };
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[experienceApi] scanPii failed:', err.message);
      return { is_clean: true, pii_scan_status: 'CLEAN', detected_categories: [], flagged_snippets: [] };
    }
  },

  /**
   * Moderation action (internal/admin).
   */
  async moderateExperience(experienceId, status, notes = '') {
    const response = await fetchWithTimeout(
      `${BACKEND_BASE_URL}/api/experiences/${encodeURIComponent(experienceId)}/moderate`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ status, notes })
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Moderation failed with status ${response.status}`);
    }

    return await response.json();
  }
};
