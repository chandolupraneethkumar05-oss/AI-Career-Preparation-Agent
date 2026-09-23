/**
 * Frontend API client for ATS Resume Analysis Pipeline
 * AI Career Preparation Agent
 */

import { storageService } from '../utils/storage/storageService';
import { BACKEND_BASE_URL } from './apiConfig';

export const resumeApi = {
  /**
   * Upload and analyze a PDF/DOCX resume file or raw text against target role
   */
  async analyzeResume({ file, rawText, targetRole, jobDescription, userId = 'user-001' }) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (rawText) {
      formData.append('rawText', rawText);
    }
    if (targetRole) {
      formData.append('target_role', targetRole);
      formData.append('targetRole', targetRole);
    }
    if (jobDescription) {
      formData.append('job_description', jobDescription);
      formData.append('jobDescription', jobDescription);
    }
    formData.append('user_id', userId);
    formData.append('userId', userId);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/resume/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status ${res.status}`);
      }

      const data = await res.json();
      // Cache latest result in localStorage for fast browser reloads
      storageService.setATSResult(data);
      return data;
    } catch (err) {
      console.warn('[resumeApi] Backend analysis failed:', err.message);
      throw err;
    }
  },

  /**
   * Fetch the candidate's latest saved resume analysis
   */
  async getLatestAnalysis(userId = 'user-001') {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/resume/latest/${userId}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      storageService.setATSResult(data);
      return data;
    } catch (err) {
      console.warn('[resumeApi] Fetching latest analysis from backend failed, using local cache:', err.message);
      return storageService.getATSResult();
    }
  },

  /**
   * Fetch chronological analysis history for candidate
   */
  async getAnalysisHistory(userId = 'user-001', limit = 10) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/resume/history/${userId}?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.analyses || [];
    } catch (err) {
      console.warn('[resumeApi] Failed to fetch resume history from backend:', err.message);
      return [];
    }
  },

  /**
   * Fetch a specific analysis record by ID
   */
  async getAnalysisById(analysisId) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/resume/${analysisId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[resumeApi] Failed to fetch analysis by ID:', err.message);
      throw err;
    }
  }
};
