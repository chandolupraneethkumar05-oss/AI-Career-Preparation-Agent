/**
 * Weekly AI Career Report API Client
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const weeklyReportApi = {
  /**
   * Retrieves the current week's report.
   * @param {string} userId Candidate user ID
   */
  async getCurrentReport(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/reports/weekly?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[weeklyReportApi] getCurrentReport failed:', err.message);
      return null;
    }
  },

  /**
   * Forces regeneration of the weekly report.
   * @param {string} userId Candidate user ID
   */
  async regenerateReport(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/reports/weekly/generate?user_id=${encodeURIComponent(userId)}`,
        { method: 'POST', headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[weeklyReportApi] regenerateReport failed:', err.message);
      return null;
    }
  },

  /**
   * Retrieves historical weekly reports archive.
   * @param {string} userId Candidate user ID
   */
  async getReportHistory(userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/reports/weekly/history?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[weeklyReportApi] getReportHistory failed:', err.message);
      return [];
    }
  },

  /**
   * Retrieves a specific report by ID.
   * @param {string} reportId Report ID
   * @param {string} userId Candidate user ID
   */
  async getReportById(reportId, userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/reports/weekly/${encodeURIComponent(reportId)}?user_id=${encodeURIComponent(userId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[weeklyReportApi] getReportById failed:', err.message);
      return null;
    }
  }
};
