/**
 * Authentication API Service
 * Handles candidate sign in, registration, forgot-password token dispatch, and password resets.
 */

import { API_BASE_URL } from './apiConfig';

export const authApi = {
  /**
   * Request password recovery token & email dispatch
   */
  async forgotPassword(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Could not process password recovery request. Please try again.');
    }

    return res.json();
  },

  /**
   * Complete password reset with one-time token
   */
  async resetPassword(token, newPassword) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), new_password: newPassword })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Could not reset password. The link or token may have expired.');
    }

    return res.json();
  }
};
