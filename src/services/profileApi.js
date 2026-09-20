/**
 * Profile & Settings API Client
 * AI Career Preparation Agent
 */

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const profileApi = {
  async getProfile(userId = 'user-001') {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/profile?user_id=${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[profileApi] getProfile backend error:', err);
      return null;
    }
  },

  async updateProfile(profileData, userId = 'user-001') {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/profile?user_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[profileApi] updateProfile backend error:', err);
      return null;
    }
  }
};
