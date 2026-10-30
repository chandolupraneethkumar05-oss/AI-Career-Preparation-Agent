/**
 * Centralized API Base URL Configuration
 * Resolves API URL dynamically:
 * - In local dev with Vite: Uses '/api' (proxied via vite.config.js to http://127.0.0.1:8000)
 * - In production (Render/Docker): Uses '/api' (FastAPI serves both frontend and API on the same origin)
 * - If VITE_API_URL is explicitly configured: Uses the provided environment variable
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const BACKEND_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

import { storageService } from '../utils/storage/storageService';

let demoLoginInFlight = null;

/**
 * Ensures an active JWT access token is present in storage.
 * If missing, lazily initializes a genuine token via /auth/demo-login.
 */
export async function ensureAuthToken(force = false) {
  const existingToken = storageService.getToken();
  if (existingToken) return existingToken;

  // Suppress automatic background demo login if the candidate explicitly logged out
  if (!force && typeof window !== 'undefined' && localStorage.getItem('talentpath_explicit_logout') === 'true') {
    return null;
  }

  if (demoLoginInFlight) return demoLoginInFlight;

  demoLoginInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          storageService.setToken(data.access_token);
          if (data.user) {
            storageService.saveCurrentUser(data.user);
          }
          return data.access_token;
        }
      }
    } catch (err) {
      console.warn('[apiConfig] Auto-initialization of demo auth token failed:', err);
    } finally {
      demoLoginInFlight = null;
    }
    return null;
  })();

  return demoLoginInFlight;
}

/**
 * Universal authenticated fetch with automated token attachment,
 * transparent token initialization, and single-attempt retry on HTTP 401.
 */
export async function authenticatedFetch(url, options = {}) {
  let token = storageService.getToken();
  if (!token) {
    token = await ensureAuthToken();
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  // If token was rejected (expired/invalidated), refresh and retry once
  if (response.status === 401) {
    storageService.removeToken();
    const refreshedToken = await ensureAuthToken();
    if (refreshedToken) {
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
}


/**
 * Resolves the absolute WebSocket URL matching current origin or VITE_API_URL.
 */
export function getWebSocketUrl(path) {
  const normPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') {
    return `ws://127.0.0.1:8000/api${normPath}`;
  }

  // If API_BASE_URL is relative (e.g. '/api'), use current window location
  if (API_BASE_URL.startsWith('/')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${API_BASE_URL}${normPath}`;
  }

  // If API_BASE_URL is absolute
  const parsed = new URL(API_BASE_URL);
  const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  const basePath = parsed.pathname.replace(/\/+$/, '');
  return `${protocol}//${parsed.host}${basePath}${normPath}`;
}
