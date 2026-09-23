/**
 * Centralized API Base URL Configuration
 * Resolves API URL dynamically:
 * - In local dev with Vite: Uses '/api' (proxied via vite.config.js to http://127.0.0.1:8000)
 * - In production (Render/Docker): Uses '/api' (FastAPI serves both frontend and API on the same origin)
 * - If VITE_API_URL is explicitly configured: Uses the provided environment variable
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const BACKEND_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
