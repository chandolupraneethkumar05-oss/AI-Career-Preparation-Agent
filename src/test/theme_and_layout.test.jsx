import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { isValidTheme, resolveEffectiveTheme, getThemeConfig } from '../theme/themeConfig';
import { AuthProvider } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import { storageService } from '../utils/storage/storageService';

function ThemeConsumer() {
  const { theme, effectiveTheme, setTheme, isDark, themeConfig } = useTheme();
  return (
    <div>
      <span data-testid="active-theme">{theme}</span>
      <span data-testid="effective-theme">{effectiveTheme}</span>
      <span data-testid="is-dark">{isDark ? 'true' : 'false'}</span>
      <span data-testid="theme-bg">{themeConfig?.colors?.bg}</span>
      <button data-testid="btn-set-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="btn-set-black" onClick={() => setTheme('black')}>Black</button>
      <button data-testid="btn-set-white" onClick={() => setTheme('white')}>White</button>
    </div>
  );
}

describe('Theme System & Postman Palette Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('validates Postman-inspired theme IDs correctly', () => {
    expect(isValidTheme('system')).toBe(true);
    expect(isValidTheme('white')).toBe(true);
    expect(isValidTheme('dark')).toBe(true);
    expect(isValidTheme('black')).toBe(true);
    expect(isValidTheme('warm')).toBe(true);
    expect(isValidTheme('invalid_theme_xyz')).toBe(false);
  });

  it('resolves concrete theme colors and configurations', () => {
    expect(resolveEffectiveTheme('dark')).toBe('dark');
    expect(resolveEffectiveTheme('black')).toBe('black');
    expect(resolveEffectiveTheme('white')).toBe('white');

    const darkConfig = getThemeConfig('dark');
    expect(darkConfig.colors.bg).toBe('#181818');
    expect(darkConfig.colors.surface).toBe('#212121');
    expect(darkConfig.colors.text).toBe('#F5F5F5');

    const blackConfig = getThemeConfig('black');
    expect(blackConfig.colors.bg).toBe('#000000');
    expect(blackConfig.colors.surface).toBe('#111111');
    expect(blackConfig.colors.text).toBe('#FFFFFF');
  });

  it('switches between light, dark, and black themes and modifies DOM attributes', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    // Initial state (default is white)
    expect(screen.getByTestId('active-theme')).toHaveTextContent('white');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('white');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Switch to Postman Dark
    act(() => {
      fireEvent.click(screen.getByTestId('btn-set-dark'));
    });
    expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Switch to Postman Black (OLED Obsidian)
    act(() => {
      fireEvent.click(screen.getByTestId('btn-set-black'));
    });
    expect(screen.getByTestId('active-theme')).toHaveTextContent('black');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('black');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Switch back to White
    act(() => {
      fireEvent.click(screen.getByTestId('btn-set-white'));
    });
    expect(screen.getByTestId('active-theme')).toHaveTextContent('white');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('white');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('renders top-right profile button and opens Postman-style menu in AppLayout', () => {
    const candidate = {
      id: 'cand-1',
      name: 'Praneeth Kumar',
      email: 'praneeth@example.com',
      targetRole: 'Senior ML Engineer'
    };
    storageService.saveCurrentUser(candidate);
    storageService.setToken('mock-token-xyz');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <ThemeProvider>
            <AppLayout />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Find profile button by aria-label
    const profileBtn = screen.getByLabelText(/candidate profile menu/i);
    expect(profileBtn).toBeInTheDocument();

    // Click profile button to open dropdown
    act(() => {
      fireEvent.click(profileBtn);
    });

    // Check that user info is displayed in both sidebar and header profile menu
    const nameElements = screen.getAllByText('Praneeth Kumar');
    expect(nameElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('praneeth@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Senior ML Engineer').length).toBeGreaterThanOrEqual(2);

    // Check theme switcher options inside dropdown
    expect(screen.getByTitle('Auto theme')).toBeInTheDocument();
    expect(screen.getByTitle('Light theme')).toBeInTheDocument();
    expect(screen.getByTitle('Dark theme')).toBeInTheDocument();
    expect(screen.getByTitle('Black theme')).toBeInTheDocument();

    // Check navigation links
    expect(screen.getByText(/Settings & Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Help & Documentation/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
  });

  it('renders RadioCard and Interview Setup preset boxes with high-contrast text and dark surface classes', async () => {
    const { default: RadioCard } = await import('../components/RadioCard');
    const { container: radioContainer } = render(
      <RadioCard
        title="Test Target Preset"
        description="Clear readable description text inside the box"
        badge="0-1 Yrs • Easy"
        badgeColor="emerald"
        meta="Test Metadata"
        selected={false}
      />
    );

    const titleEl = screen.getByText('Test Target Preset');
    expect(titleEl).toHaveClass('dark:text-white');

    const descEl = screen.getByText('Clear readable description text inside the box');
    expect(descEl).toHaveClass('dark:text-zinc-300');

    // Verify dark surface class on outer box
    const cardBox = radioContainer.firstElementChild;
    expect(cardBox.className).toContain('dark:bg-[var(--theme-surface-subtle)]');
    expect(cardBox.className).toContain('dark:border-[var(--theme-border)]');
  });

  it('renders PerformanceChart with decimated labels and single score badge on 50 points', async () => {
    const { default: PerformanceChart } = await import('../components/PerformanceChart');
    const mockFiftyRounds = Array.from({ length: 50 }, (_, i) => ({
      label: `Round ${i + 1}`,
      score: 70 + (i % 10)
    }));

    const { container } = render(
      <ThemeProvider>
        <PerformanceChart data={mockFiftyRounds} height={210} />
      </ThemeProvider>
    );

    // X-axis text elements should not be 50! Should be decimated to <= 7 labels to avoid overlapping
    const allTexts = container.querySelectorAll('text');
    const roundTexts = Array.from(allTexts).filter(t => t.textContent.includes('Round'));
    expect(roundTexts.length).toBeLessThanOrEqual(7);
    expect(roundTexts.length).toBeGreaterThanOrEqual(4);

    // Verify first and last rounds are always displayed
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Round 50')).toBeInTheDocument();

    // Only one score value pill should be rendered by default (not 50)
    const scoreRects = container.querySelectorAll('rect');
    expect(scoreRects.length).toBe(1);
  });
});
