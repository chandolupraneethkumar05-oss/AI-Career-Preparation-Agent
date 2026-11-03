import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { storageService } from '../utils/storage/storageService';

function DummyConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="user-name">{user?.name || 'none'}</span>
      <button onClick={() => login('test@example.com', 'Secret123!')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext & ProtectedRoute Workflows', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('throws an error when useAuth is consumed outside of AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DummyConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });

  it('provides authentication state and handles explicit logout cleanly', async () => {
    localStorage.setItem('talentpath_explicit_logout', 'true');
    render(
      <AuthProvider>
        <DummyConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-state')).toHaveTextContent('logged-out');
  });

  it('renders protected child component when user is authenticated', () => {
    const testUser = { id: 'u1', name: 'Alice Test', email: 'alice@test.com' };
    storageService.saveCurrentUser(testUser);
    storageService.setToken('mock-jwt-token-123');

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByTestId('protected-content')).toHaveTextContent('Secret Dashboard');
  });

  it('redirects unauthenticated users away from protected routes to login', () => {
    localStorage.setItem('talentpath_explicit_logout', 'true');

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/interview/session-123']}>
          <Routes>
            <Route
              path="/interview/:id"
              element={
                <ProtectedRoute>
                  <div>Secret Interview</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-page">Please Log In</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
