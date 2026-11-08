/**
 * Frontend API client for Resume Builder
 * AI Career Preparation Agent - Phase 3
 */

import { API_BASE_URL, authenticatedFetch } from './apiConfig';

export const resumeBuilderApi = {
  /**
   * Fetch available resume templates metadata
   */
  async getTemplates() {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/templates`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch templates');
    }
    return res.json();
  },

  /**
   * List all drafts for the authenticated user
   */
  async getDrafts() {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/drafts`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch drafts');
    }
    return res.json();
  },

  /**
   * Get a specific draft by ID
   */
  async getDraftById(draftId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/drafts/${draftId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Draft not found');
    }
    return res.json();
  },

  /**
   * Create a new draft
   */
  async createDraft(payload) {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create draft');
    }
    return res.json();
  },

  /**
   * Update an existing draft
   */
  async updateDraft(draftId, payload) {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/drafts/${draftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update draft');
    }
    return res.json();
  },

  /**
   * Delete a draft
   */
  async deleteDraft(draftId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/drafts/${draftId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete draft');
    }
    return res.json();
  },

  /**
   * Compile resume content to plain ATS-ready text
   */
  async compileText(content) {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/compile-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to compile text');
    }
    return res.json();
  },

  /**
   * Compile a saved draft to plain ATS-ready text
   */
  async compileDraftText(draftId) {
    const res = await authenticatedFetch(`${API_BASE_URL}/resume-builder/drafts/${draftId}/compile-text`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to compile draft text');
    }
    return res.json();
  },
};
