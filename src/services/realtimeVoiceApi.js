/**
 * Realtime Voice API Client
 * AI Career Preparation Agent
 *
 * Interfaces with backend routes:
 * - POST /api/realtime-voice/session
 * - POST /api/realtime-voice/transcript
 * - GET /api/realtime-voice/transcript/:sessionId
 */

import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from '../utils/fetchWithTimeout';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const realtimeVoiceApi = {
  /**
   * Provisions a real-time voice interview session with ephemeral credentials.
   */
  async createSession({
    role = 'Machine Learning Engineer',
    difficulty = 'Intermediate',
    topic = 'System Design & Algorithms',
    interview_id = null,
    voice_name = 'Puck',
    total_questions = 5
  } = {}) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/realtime-voice/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            role,
            difficulty,
            topic,
            interview_id,
            voice_name,
            total_questions: total_questions || 5
          })
        },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) {
        throw new Error(`Realtime voice session error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[realtimeVoiceApi] createSession fallback simulated session:', err.message);
      return {
        session_id: `fallback-${Date.now()}`,
        mode: 'simulated',
        model: 'gemini-2.0-flash-exp',
        ephemeral_token: null,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        system_instruction: `You are an expert technical interviewer conducting a mock interview for a ${role} position.`,
        voice_name: voice_name || 'Puck',
        role,
        difficulty,
        topic,
        total_questions: total_questions || 5,
        websocket_url: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'
      };
    }
  },

  /**
   * Persists an oral conversational turn to the server-side ledger.
   */
  async appendTurn(sessionId, speaker, text) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/realtime-voice/transcript`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionId,
            speaker,
            text
          })
        },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) {
        throw new Error(`Append turn error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[realtimeVoiceApi] appendTurn error:', err.message);
      return { status: 'recorded_locally' };
    }
  },

  /**
   * Retrieves all turns recorded for a voice session.
   */
  async getTranscript(sessionId) {
    try {
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/realtime-voice/transcript/${encodeURIComponent(sessionId)}`,
        { headers: { Accept: 'application/json' } },
        DEFAULT_TIMEOUT_MS
      );
      if (!response.ok) {
        throw new Error(`Get transcript error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[realtimeVoiceApi] getTranscript error:', err.message);
      return [];
    }
  }
};
