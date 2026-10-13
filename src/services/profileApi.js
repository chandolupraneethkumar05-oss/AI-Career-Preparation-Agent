import { storageService } from '../utils/storage/storageService';
import { BACKEND_BASE_URL, authenticatedFetch } from './apiConfig';

const resolveUserId = (id) => id || storageService.getCurrentUser()?.id || 'usr_candidate';

export const profileApi = {
  async getProfile(userId = null) {
    try {
      const effectiveId = resolveUserId(userId);
      const headers = {
        'Accept': 'application/json',
        ...storageService.getAuthHeaders()
      };
      const res = await authenticatedFetch(`${BACKEND_BASE_URL}/api/profile?user_id=${encodeURIComponent(effectiveId)}`, {
        headers
      });
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
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...storageService.getAuthHeaders()
      };
      const res = await authenticatedFetch(`${BACKEND_BASE_URL}/api/profile?user_id=${encodeURIComponent(effectiveId)}`, {
        method: 'PUT',
        headers,
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
