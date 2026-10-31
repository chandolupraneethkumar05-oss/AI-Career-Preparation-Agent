/**
 * Authentication API Service
 * Handles candidate sign in, registration, forgot-password token dispatch, and password resets.
 */

import { API_BASE_URL } from './apiConfig';

export const authApi = {
  /**
   * Request password recovery token & email dispatch with optional API Key verification
   */
  async forgotPassword(email, apiKey = '') {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanApiKey = (apiKey || '').trim();
    const headers = { 'Content-Type': 'application/json' };
    if (cleanApiKey) {
      headers['X-API-Key'] = cleanApiKey;
    }

    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: cleanEmail,
        api_key: cleanApiKey || undefined
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Could not process password recovery request. Please try again.');
    }

    return res.json();
  },

  /**
   * Complete password reset with one-time token and optional API Key verification
   */
  async resetPassword(token, newPassword, apiKey = '') {
    const cleanApiKey = (apiKey || '').trim();
    const headers = { 'Content-Type': 'application/json' };
    if (cleanApiKey) {
      headers['X-API-Key'] = cleanApiKey;
    }

    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token: token.trim(),
        new_password: newPassword,
        api_key: cleanApiKey || undefined
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Could not reset password. The link or token may have expired.');
    }

    return res.json();
  }
};
