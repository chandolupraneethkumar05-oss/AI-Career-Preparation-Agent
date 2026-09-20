/**
 * Frontend API client for Proactive Daily Practice Reminders
 * AI Career Preparation Agent — Academic IDP Project
 * Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University
 */

import { storageService } from '../utils/storage/storageService';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const reminderApi = {
  /**
   * Fetch active candidate reminder preferences
   */
  async getPreferences() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/reminders/preferences`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        enabled: data.enabled ?? false,
        preferred_time: data.preferred_time || data.time || '19:00',
        time: data.preferred_time || data.time || '19:00',
        email: data.email || '',
        timezone: data.timezone || 'Asia/Kolkata',
        frequency: data.frequency || 'daily',
        target_role: data.target_role || 'Machine Learning Engineer'
      };
    } catch (err) {
      console.warn('[reminderApi] Backend unavailable, using local storage:', err.message);
      const local = storageService.getReminderPrefs();
      return {
        enabled: local.enabled ?? false,
        preferred_time: local.preferred_time || local.time || '19:00',
        time: local.preferred_time || local.time || '19:00',
        email: local.email || '',
        timezone: local.timezone || 'Asia/Kolkata',
        frequency: local.frequency || 'daily',
        target_role: local.targetRole || 'Machine Learning Engineer'
      };
    }
  },

  /**
   * Update candidate reminder preferences
   */
  async updatePreferences(prefs) {
    // 1. Always persist to localStorage for instant local reactivity
    storageService.setReminderPrefs(prefs);

    // 2. Persist to SQLite backend
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/reminders/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: prefs.enabled,
          preferred_time: prefs.preferred_time || prefs.time,
          time: prefs.preferred_time || prefs.time,
          email: prefs.email,
          timezone: prefs.timezone,
          frequency: prefs.frequency,
          target_role: prefs.target_role || prefs.targetRole
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('[reminderApi] Failed to sync preferences with backend:', err.message);
      return { ...prefs, offline: true };
    }
  },

  /**
   * Fetch live reminder status (meaningful practice check, schedule, local time)
   */
  async getStatus() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/reminders/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[reminderApi] Backend status unavailable, computing offline preview:', err.message);
      const prefs = storageService.getReminderPrefs();
      const activities = storageService.getActivities();
      const todayStr = new Date().toISOString().split('T')[0];
      const practicedToday = activities.some((a) => {
        const aDate = a.timestamp ? a.timestamp.split('T')[0] : '';
        return aDate === todayStr;
      });

      return {
        enabled: prefs.enabled ?? false,
        preferred_time: prefs.preferred_time || prefs.time || '19:00',
        method: 'email',
        email: prefs.email || '',
        timezone: prefs.timezone || 'Asia/Kolkata',
        current_local_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        practiced_today: practicedToday,
        reminder_sent_today: false,
        last_reminder: null,
        status_message: practicedToday
          ? "Today's career practice completed. Reminders suppressed."
          : `Practice pending. Reminder scheduled for ${prefs.preferred_time || prefs.time || '19:00'}.`
      };
    }
  },

  /**
   * Fetch audit history of dispatched/logged reminders
   */
  async getHistory(limit = 5) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/reminders/history?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[reminderApi] Backend history unavailable:', err.message);
      return [];
    }
  },

  /**
   * Trigger immediate test reminder dispatch
   */
  async triggerTest(payload) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/reminders/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('[reminderApi] Backend test dispatch failed, simulating locally:', err.message);
      return {
        status: 'development',
        delivered: false,
        email_sent: false,
        deliveryMode: 'development_fallback',
        recipient: payload.email || 'candidate@vignan.ac.in',
        subject: `⚡ AI Career Coach: Practice pending for ${payload.targetRole || 'Engineering'}`,
        bodyPreview: `Hello ${payload.candidateName || 'Candidate'},\n\nYour AI Career Coach detected your daily practice is pending.\nA 10-minute conceptual challenge is ready to keep your skills sharp.\n\nMode: Local Fallback Simulation`,
        htmlContent: '',
        timestamp: new Date().toISOString(),
        explanation: 'Local offline simulation preview (FastAPI backend was not reachable).'
      };
    }
  }
};
