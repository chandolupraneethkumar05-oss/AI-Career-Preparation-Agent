import '@testing-library/jest-dom';

// Provide global default fetch mock for JSDOM test environments
const originalFetch = global.fetch;

global.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input?.url || '';

  if (url.includes('/auth/demo-login') || url.includes('/api/auth/demo-login')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'mock-test-jwt-token',
        user: { id: 'user-001', name: 'Demo Candidate', email: 'candidate@example.com' }
      })
    };
  }

  if (url.includes('/auth/me') || url.includes('/api/auth/me')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'user-001',
        name: 'Demo Candidate',
        email: 'candidate@example.com',
        role: 'Machine Learning Engineer',
        xp: 150,
        level: 2,
        streak: 3
      })
    };
  }

  if (typeof originalFetch === 'function') {
    return originalFetch(input, init);
  }

  return {
    ok: true,
    status: 200,
    json: async () => ({})
  };
};
