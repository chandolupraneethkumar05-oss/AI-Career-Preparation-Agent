/**
 * Resilient fetch wrapper with configurable request timeout using AbortController.
 * Ensures long-hanging LLM or backend network requests fail gracefully
 * without freezing client application state.
 */

export const DEFAULT_TIMEOUT_MS = 12000; // 12 seconds default
export const AI_TIMEOUT_MS = 25000;      // 25 seconds for LLM generation

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
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
