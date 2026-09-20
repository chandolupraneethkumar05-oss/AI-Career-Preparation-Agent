/**
 * Execution API Client
 * AI Career Preparation Agent
 *
 * Communicates with the backend sandbox execution endpoints:
 * - GET /api/execution/capabilities
 * - POST /api/execution/jobs
 * - GET /api/execution/jobs/{job_id}
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const executionApi = {
  /**
   * Retrieves host sandbox capabilities (Docker, Firecracker, Process).
   */
  async getCapabilities() {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/execution/capabilities`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) {
        throw new Error(`Execution capabilities error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[executionApi] getCapabilities fallback:', err.message);
      return {
        docker_available: false,
        firecracker_available: false,
        process_available: true,
        supported_languages: ['python'],
        max_timeout_seconds: 15,
        default_timeout_seconds: 3,
        memory_limit_mb: 256
      };
    }
  },

  /**
   * Submits a script or challenge solution for sandboxed execution.
   */
  async submitJob({
    code,
    challenge_id = null,
    language = 'python',
    limits = null,
    preferred_executor = null,
    test_cases = null
  }) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/execution/jobs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            code,
            challenge_id,
            language,
            limits,
            preferred_executor,
            test_cases
          })
        },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) {
        throw new Error(`Execution submission error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[executionApi] submitJob error:', err.message);
      throw err;
    }
  },

  /**
   * Fetches job status and full execution output.
   */
  async getJob(jobId) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/execution/jobs/${encodeURIComponent(jobId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) {
        throw new Error(`Get job error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[executionApi] getJob error:', err.message);
      throw err;
    }
  }
};
