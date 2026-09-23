/**
 * AI Career Intelligence Client Service
 * AI Career Preparation Agent
 */

import { fetchWithTimeout, AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';
import { API_BASE_URL } from './apiConfig';

export const aiApi = {
  /**
   * Sends candidate question to the RAG + LLM intelligence engine.
   * @param {string} message - Technical or career preparation question
   * @param {string} language - Preferred language code ('en', 'te', 'hi', 'es')
   * @param {string} userId - Candidate user ID
   */
  async askQuestion(message, language = 'en', userId = 'user-001') {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/ai/ask`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            message: message.trim(),
            language
          })
        },
        AI_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[aiApi] Backend request failed, utilizing local grounded fallback:', err);
      // Client-side fallback if backend is momentarily offline
      return {
        answer: `I am currently operating in offline mode. For "${message}", please ensure you review core foundational principles in your target domain. Connect to the local FastAPI backend on port 8000 for full grounded RAG retrieval.`,
        key_points: [
          'Backend connection currently unreachable.',
          'Ensure uvicorn app.main:app --port 8000 is running.',
          'All 18 RAG knowledge categories are indexed in SQLite.'
        ],
        recommended_action: {
          title: "Practice Daily Challenge",
          action: "Open Challenge",
          route: "/daily-challenge",
          action_type: "challenge",
          reason: "Continue your streak while backend reconnects."
        },
        sources: [],
        language,
        grounded: false,
        model_provider: "client-fallback",
        career_context_applied: "Offline Fallback"
      };
    }
  },

  /**
   * Retrieves summary catalog of all indexed RAG curriculum knowledge chunks.
   */
  async getKnowledgeSources() {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/ai/sources`, {}, DEFAULT_TIMEOUT_MS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[aiApi] Failed to fetch sources:', err);
      return { total_categories: 18, total_chunks: 25, categories: [] };
    }
  },

  /**
   * Checks operational status of the AI subsystem.
   */
  async getStatus() {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/ai/status`, {}, DEFAULT_TIMEOUT_MS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[aiApi] AI status check offline:', err);
      return { status: 'offline', rag_active: false, supported_languages: ['en', 'te', 'hi', 'es'] };
    }
  }
};
