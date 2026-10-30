/**
 * Reverse Mock Interview & Peer Room API Service
 * AI Career Preparation Agent
 */

import { API_BASE_URL, authenticatedFetch } from './apiConfig';

export const reverseInterviewApi = {
  /**
   * Starts a reverse mock interview session where user tests AI applicant Alex.
   */
  async start(role = 'Software Engineer', difficulty = 'Intermediate') {
    const res = await authenticatedFetch(`${API_BASE_URL}/interviews/reverse/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, difficulty })
    });
    if (!res.ok) {
      throw new Error(`Failed to start reverse interview: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * User poses a question, probe, or hint to candidate Alex.
   */
  async ask(sessionId, message) {
    const res = await authenticatedFetch(`${API_BASE_URL}/interviews/reverse/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message })
    });
    if (!res.ok) {
      throw new Error(`Failed to send question to candidate: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Concludes the reverse interview session and grades the user's interviewing skills.
   */
  async finish(sessionId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/interviews/reverse/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!res.ok) {
      throw new Error(`Failed to finish reverse interview: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Creates a new collaborative peer interview room.
   */
  async createPeerRoom(role = 'Software Engineer', difficulty = 'Intermediate', topic = null) {
    const res = await authenticatedFetch(`${API_BASE_URL}/peer-rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, difficulty, topic })
    });
    if (!res.ok) {
      throw new Error(`Failed to create peer room: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Retrieves status and participant metadata of a peer room.
   */
  async getPeerRoom(roomId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/peer-rooms/${roomId}`);
    if (!res.ok) {
      throw new Error(`Failed to get peer room info: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Generates or retrieves the joint 360° evaluation report for a peer room.
   */
  async getPeerReport(roomId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/peer-rooms/${roomId}/report`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch peer report: ${res.statusText}`);
    }
    return res.json();
  }
};
