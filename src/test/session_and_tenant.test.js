import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService, STORAGE_KEYS } from '../utils/storage/storageService';
import { authenticatedFetch, getWebSocketUrl } from '../services/apiConfig';
import { interviewApi } from '../services/interviewApi';

describe('Phase 2: Frontend Tenant Isolation, Session Handling & Truthful API Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. storageService.clearAll() complete scoping cleanup', () => {
    it('removes both root keys and all scoped keys matching ${baseKey}_${scope}', () => {
      // Set root keys
      storageService.setToken('test-token');
      localStorage.setItem('talentpath_explicit_logout', 'true');

      // Set scoped keys for multiple users
      localStorage.setItem(storageService.scopedKey(STORAGE_KEYS.USER_PROFILE, 'user-A'), JSON.stringify({ name: 'A' }));
      localStorage.setItem(storageService.scopedKey(STORAGE_KEYS.INTERVIEWS, 'user-A'), JSON.stringify([1, 2]));
      localStorage.setItem(storageService.scopedKey(STORAGE_KEYS.ACTIVITIES, 'user-B'), JSON.stringify(['act']));
      localStorage.setItem(storageService.scopedKey(STORAGE_KEYS.ACHIEVEMENTS, 'user-B'), JSON.stringify(['ach']));

      // Unrelated key that should NOT be removed
      localStorage.setItem('unrelated_app_key', 'preserve_me');

      expect(localStorage.length).toBeGreaterThan(4);

      storageService.clearAll();

      expect(storageService.getToken()).toBeNull();
      expect(localStorage.getItem('talentpath_explicit_logout')).toBeNull();
      expect(localStorage.getItem(storageService.scopedKey(STORAGE_KEYS.USER_PROFILE, 'user-A'))).toBeNull();
      expect(localStorage.getItem(storageService.scopedKey(STORAGE_KEYS.INTERVIEWS, 'user-A'))).toBeNull();
      expect(localStorage.getItem(storageService.scopedKey(STORAGE_KEYS.ACTIVITIES, 'user-B'))).toBeNull();
      expect(localStorage.getItem('unrelated_app_key')).toBe('preserve_me');
    });
  });

  describe('2. Two-account switching and tenant data isolation', () => {
    it('completely isolates cached data between Candidate A and Candidate B', () => {
      // Candidate A logs in
      storageService.saveCurrentUser({ id: 'candidate-A', name: 'Alice', email: 'alice@example.com' });
      storageService.saveProfile({ id: 'candidate-A', title: 'Senior ML Engineer' }, 'candidate-A');
      storageService.setInterviews([{ id: 'int-A-1', role: 'MLE', score: 88 }], 'candidate-A');
      storageService.setATSResult({ overallScore: 92, targetRole: 'MLE' }, 'candidate-A');

      // Verify Candidate A data is available
      expect(storageService.getProfile('candidate-A')?.title).toBe('Senior ML Engineer');
      expect(storageService.getInterviews('candidate-A')).toHaveLength(1);
      expect(storageService.getATSResult('candidate-A')?.overallScore).toBe(92);

      // Now switch user context to Candidate B
      storageService.saveCurrentUser({ id: 'candidate-B', name: 'Bob', email: 'bob@example.com' });

      // Candidate B MUST NOT see Candidate A's data
      expect(storageService.getProfile('candidate-B')).toBeNull();
      expect(storageService.getInterviews('candidate-B')).toHaveLength(0);
      expect(storageService.getATSResult('candidate-B')).toBeNull();

      // Candidate B creates their own data
      storageService.saveProfile({ id: 'candidate-B', title: 'Frontend Developer' }, 'candidate-B');
      storageService.setInterviews([{ id: 'int-B-1', role: 'Frontend', score: 76 }], 'candidate-B');

      // Verify Candidate B has their data
      expect(storageService.getProfile('candidate-B')?.title).toBe('Frontend Developer');
      expect(storageService.getInterviews('candidate-B')).toHaveLength(1);

      // Switch back to Candidate A and verify pristine isolation
      storageService.saveCurrentUser({ id: 'candidate-A', name: 'Alice', email: 'alice@example.com' });
      expect(storageService.getProfile('candidate-A')?.title).toBe('Senior ML Engineer');
      expect(storageService.getInterviews('candidate-A')).toHaveLength(1);
      expect(storageService.getInterviews('candidate-A')[0].id).toBe('int-A-1');
      expect(storageService.getProfile('candidate-B')?.title).toBe('Frontend Developer');
    });
  });

  describe('3. authenticatedFetch() 401 handling', () => {
    it('dispatches auth:unauthorized and does NOT retry as demo user on 401', async () => {
      storageService.setToken('expired-invalid-token');

      let unauthorizedDispatched = false;
      const listener = () => {
        unauthorizedDispatched = true;
      };
      window.addEventListener('auth:unauthorized', listener);

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ detail: 'Token has been revoked or expired' })
      });

      const response = await authenticatedFetch('/api/profile');

      expect(response.status).toBe(401);
      expect(storageService.getToken()).toBeNull();
      expect(unauthorizedDispatched).toBe(true);

      // Verify fetch was called exactly once (no retry with demo token)
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      window.removeEventListener('auth:unauthorized', listener);
    });
  });

  describe('4. storageService.hydrateFromBackend() and syncInterviewToBackend()', () => {
    it('hydrateFromBackend() aborts cleanly without calling fetch if token is absent', async () => {
      storageService.removeToken();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const result = await storageService.hydrateFromBackend('user-001');

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toEqual({ user: null, interviews: 0, ats: false });
    });

    it('hydrateFromBackend() clears stale server interviews when backend returns empty list', async () => {
      storageService.setToken('valid-token-xyz');
      // Set prior stale server interview and an unsynced local interview
      storageService.setInterviews([
        { id: 'stale-server-int-1', role: 'MLE', score: 85, synced: true },
        { id: 'offline_rec_local_1', role: 'MLE', score: 90, synced: false }
      ], 'user-001');

      // Mock backend returning empty interviews list
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url.includes('/interviews?')) {
          return {
            ok: true,
            json: async () => ({ interviews: [] })
          };
        }
        return { ok: false };
      });

      await storageService.hydrateFromBackend('user-001');

      const current = storageService.getInterviews('user-001');
      // Stale server item cleared; unsynced local item preserved
      expect(current).toHaveLength(1);
      expect(current[0].id).toBe('offline_rec_local_1');
    });

    it('syncInterviewToBackend() preserves score of 0 and does not replace with default 75', async () => {
      storageService.setToken('valid-token-xyz');

      let capturedPayload = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
        capturedPayload = JSON.parse(opts.body);
        return { ok: true };
      });

      const success = await storageService.syncInterviewToBackend({
        role: 'Machine Learning Engineer',
        score: 0,
        summary: 'Candidate scored zero on questions'
      }, 'user-001');

      expect(success).toBe(true);
      expect(capturedPayload).toBeDefined();
      expect(capturedPayload.overall_score).toBe(0);
      expect(capturedPayload.passed).toBe(false);
    });
  });

  describe('5. Truthful failure in interviewApi', () => {
    it('startSession() throws real HTTP 401 error and does not return offline fallback', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ detail: 'Authentication credentials are invalid' })
      });

      await expect(
        interviewApi.startSession({ role: 'Machine Learning Engineer', userId: 'user-001' })
      ).rejects.toThrow('Authentication credentials are invalid');
    });

    it('submitAnswer() throws real HTTP 403 error and does not return offline fallback', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 403,
        ok: false,
        json: async () => ({ detail: 'Forbidden: Cannot access another user session' })
      });

      await expect(
        interviewApi.submitAnswer('sess-123', { questionId: 'q-1', answer: 'My answer', userId: 'user-001' })
      ).rejects.toThrow('Forbidden');
    });

    it('saveRecording() throws real HTTP 403 error and does not return offline fallback', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 403,
        ok: false,
        json: async () => ({ detail: 'Forbidden: Candidate does not own this recording session' })
      });

      await expect(
        interviewApi.saveRecording({ sessionId: 'sess-123', userId: 'user-001' })
      ).rejects.toThrow('Forbidden');
    });

    it('saveRecording() falls back gracefully with unsynced status when genuine network error occurs', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await interviewApi.saveRecording({ sessionId: 'sess-net-err', userId: 'user-001' });
      expect(result).toBeDefined();
      expect(result.id).toBe('offline_rec_sess-net-err');
      expect(result.status).toBe('unsynced');
      expect(result.synced).toBe(false);
      expect(result.is_offline_stub).toBe(true);
      expect(result.sync_strategy).toBe('retain_local_until_reconnect');
    });
  });

  describe('6. getWebSocketUrl() URL-safe construction and duplicate prevention', () => {
    it('constructs valid WebSocket URL without duplicated /api prefixes', () => {
      // 1. Path with leading /api
      const urlWithApi = getWebSocketUrl('/api/interviews/ws');
      expect(urlWithApi).not.toContain('/api/api');
      expect(urlWithApi).toMatch(/^wss?:\/\/.*\/api\/interviews\/ws$/);

      // 2. Path without /api
      const urlWithoutApi = getWebSocketUrl('/interviews/ws');
      expect(urlWithoutApi).not.toContain('/api/api');
      expect(urlWithoutApi).toMatch(/^wss?:\/\/.*\/api\/interviews\/ws$/);

      // 3. Path without leading slash
      const urlNoSlash = getWebSocketUrl('interviews/ws');
      expect(urlNoSlash).not.toContain('/api/api');
      expect(urlNoSlash).toMatch(/^wss?:\/\/.*\/api\/interviews\/ws$/);
    });
  });
});
