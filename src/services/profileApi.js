import { storageService } from '../utils/storage/storageService';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

const resolveUserId = (id) => id || storageService.getCurrentUser()?.id || 'usr_candidate';

export const profileApi = {
  async getProfile(userId = null) {
    try {
      const effectiveId = resolveUserId(userId);
      const res = await fetch(`${BACKEND_BASE_URL}/api/profile?user_id=${encodeURIComponent(effectiveId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[profileApi] getProfile backend error:', err);
      return null;
    }
  },

  async updateProfile(profileData, userId = null) {
    try {
      const effectiveId = resolveUserId(userId);
      const res = await fetch(`${BACKEND_BASE_URL}/api/profile?user_id=${encodeURIComponent(effectiveId)}`, {
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
