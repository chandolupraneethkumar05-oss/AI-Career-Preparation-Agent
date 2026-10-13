/**
 * Resilient fetch wrapper with configurable request timeout using AbortController.
 * Ensures long-hanging LLM or backend network requests fail gracefully
 * without freezing client application state.
 */

import { storageService } from './storage/storageService';
import { ensureAuthToken } from '../services/apiConfig';

export const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds default
export const AI_TIMEOUT_MS = 30000;      // 30 seconds for LLM generation

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let token = storageService.getToken();
  if (!token) {
    token = await ensureAuthToken();
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    if (response.status === 401) {
      storageService.removeToken();
      const refreshedToken = await ensureAuthToken();
      if (refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken}`);
        response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
      }
    }

    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Please verify your backend server connection.`);
    }
    throw err;
  }
}
