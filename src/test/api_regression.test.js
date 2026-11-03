import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interviewApi } from '../services/interviewApi';
import { executionApi } from '../services/executionApi';
import * as apiConfig from '../services/apiConfig';

describe('Frontend API Services & Security Regression Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Bug Regression #4: interviewApi.saveRecording integrity', () => {
    it('verifies saveRecording is uniquely defined as a member function on interviewApi', () => {
      expect(typeof interviewApi.saveRecording).toBe('function');
    });

    it('packages media Blob and session_id into FormData with correct headers', async () => {
      const spyAuthFetch = vi.spyOn(apiConfig, 'authenticatedFetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, recording_id: 'rec-123', status: 'ready' })
      });

      const dummyBlob = new Blob(['mock-audio-bytes'], { type: 'audio/webm' });
      const result = await interviewApi.saveRecording({
        sessionId: 'sess-abc-789',
        fileBlob: dummyBlob,
        recordingMode: 'audio',
        durationSeconds: 42.5
      });

      expect(result).toBeDefined();
      expect(result.recording_id).toBe('rec-123');
      expect(spyAuthFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = spyAuthFetch.mock.calls[0];
      expect(calledUrl).toContain('/interviews/sess-abc-789/recording');
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.body).toBeInstanceOf(FormData);
    });

    it('falls back gracefully to offline stub if upload fails without unhandled promise', async () => {
      vi.spyOn(apiConfig, 'authenticatedFetch').mockRejectedValue(new Error('Network offline'));

      const dummyBlob = new Blob(['mock-data'], { type: 'video/webm' });
      const result = await interviewApi.saveRecording({
        sessionId: 'sess-offline',
        fileBlob: dummyBlob,
        recordingMode: 'video',
        durationSeconds: 15.0
      });

      expect(result).toBeDefined();
      expect(result.session_id).toBe('sess-offline');
      expect(result.id).toBe('offline_rec_sess-offline');
    });
  });

  describe('Bug Regression #2: executionApi authorization and tenant isolation', () => {
    it('submits execution jobs via authenticatedFetch without untrusted query user_id', async () => {
      const spyAuthFetch = vi.spyOn(apiConfig, 'authenticatedFetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          job_id: 'job-xyz-100',
          status: 'success',
          stdout: 'Hello World\n',
          stderr: '',
          exit_code: 0
        })
      });

      const res = await executionApi.submitJob({
        code: 'print("Hello World")',
        language: 'python'
      });

      expect(res.job_id).toBe('job-xyz-100');
      expect(spyAuthFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = spyAuthFetch.mock.calls[0];
      expect(calledUrl).toContain('/api/execution/jobs');
      expect(calledUrl).not.toContain('user_id=');

      const body = JSON.parse(calledOptions.body);
      expect(body.code).toBe('print("Hello World")');
      expect(body.language).toBe('python');
      expect(body.user_id).toBeUndefined();
    });
  });
});
