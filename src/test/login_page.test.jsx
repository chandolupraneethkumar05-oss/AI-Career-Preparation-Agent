import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthContext';

describe('LoginPage Form Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('talentpath_explicit_logout', 'true');
    vi.restoreAllMocks();
  });

  it('renders login form elements and credentials fields properly', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    // Form inputs
    expect(screen.getByPlaceholderText('praneeth@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole('button', { name: /sign in to cockpit/i })).toBeInTheDocument();

    // Instant Sandbox / Demo button
    expect(screen.getByText(/instant demo access/i)).toBeInTheDocument();
  });

  it('allows candidate to type email and password correctly', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('praneeth@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••••••');

    fireEvent.change(emailInput, { target: { value: 'candidate@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    expect(emailInput.value).toBe('candidate@test.com');
    expect(passwordInput.value).toBe('Password123!');
  });
});
