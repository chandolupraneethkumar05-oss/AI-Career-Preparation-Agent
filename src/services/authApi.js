/**
 * Authentication API Service
 * Handles candidate sign in, registration, forgot-password token dispatch, and password resets.
 * Cryptographically secured via signed, time-limited JWT tokens with zero API key requirement.
 */

import { API_BASE_URL } from './apiConfig';

const parseErrorDetail = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    const msgs = data.detail.map(item => {
      if (typeof item === 'string') return item;
      return item.msg || item.message || JSON.stringify(item);
    }).filter(Boolean);
    if (msgs.length) return msgs.join('. ');
  }
  if (data.detail && typeof data.detail === 'object') {
    return data.detail.msg || data.detail.message || JSON.stringify(data.detail);
  }
  if (data.message && typeof data.message === 'string') return data.message;
  return fallback;
};

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
      throw new Error(parseErrorDetail(err, 'Could not process password recovery request. Please verify your email.'));
    }

    return res.json();
  },

  /**
   * Complete password reset with one-time signed token
   */
  async resetPassword(token, newPassword) {
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new Error('A valid password reset token or recovery session is required. Please request a new recovery link.');
    }

    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: cleanToken,
        new_password: newPassword
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(err, 'Could not reset password. The recovery link or token may have expired.'));
    }

    return res.json();
  }
};
