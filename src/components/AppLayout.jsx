import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
  Menu,
  Zap,
  MessageSquare,
  LayoutDashboard,
  Mic,
  Brain,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FeedbackModal from './FeedbackModal';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Close profile dropdown on outside click or ESC key
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/career-journey': return 'Career Journey & Preparation Path';
      case '/weekly-report': return 'Weekly Career Report';
      case '/skill-gap': return 'Skill Gap Assessment';
      case '/interview-feedback': return 'Interview Evaluation Report';
      case '/interview-setup': return 'Interview Setup';
      case '/interview-ready': return 'Interview Readiness';
      case '/mock-interview': return 'Mock Interview Practice';
      case '/daily-challenge': return 'Daily Practice Question';
      case '/skill-arena': return 'Skill Arena & Daily Practice';
      case '/ats': return 'Resume / ATS Diagnostic';
      case '/resume-builder': return 'Professional Resume Builder';
      case '/progress': return 'Progress & Insights Hub';
      case '/interview-experiences': return 'Interview Archive';
      case '/settings': return 'System Settings';
      case '/help': return 'Help & Guide';
      default: return 'Career Hub';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-[var(--theme-bg,#F8FAFC)] text-[var(--theme-text,#0F172A)] antialiased font-sans transition-colors duration-150">
      {/* Static Fixed Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area - Dedicated Scrollable Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Masthead Header Bar — Postman Styled */}
        <header className="sticky top-0 z-30 shrink-0 h-16 bg-[var(--theme-header-bg,rgba(255,255,255,0.95))] backdrop-blur-md border-b border-[var(--theme-border,#E2E8F0)] px-3 sm:px-6 flex items-center justify-between transition-colors shadow-xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-[var(--theme-surface-hover,#F1F5F9)] border border-[var(--theme-border,#E2E8F0)] text-[var(--theme-text-secondary,#334155)] hover:text-[var(--theme-text,#0F172A)] transition-colors md:hidden cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-sans">
              <span className="font-sans font-bold text-[var(--theme-text,#0F172A)] tracking-tight">TalentPath</span>
              <span className="text-[var(--theme-text-muted,#64748B)] opacity-50">/</span>
              <span className="text-[var(--theme-text-secondary,#334155)] font-medium truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Streak Badge */}
            <div className="flex sm:hidden items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
              <span>🔥</span>
              <span>{(user?.streak ?? 0)}d</span>
            </div>

            {/* Feedback Button */}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-surface,#FFFFFF)] border border-[var(--theme-border,#E2E8F0)] hover:bg-[var(--theme-surface-hover,#F1F5F9)] text-[var(--theme-text-secondary,#334155)] hover:text-[var(--theme-text,#0F172A)] text-xs font-semibold transition-colors cursor-pointer"
              title="Share Product Feedback"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Feedback</span>
            </button>

            {/* Desktop Streak & XP Metrics */}
            <div className="hidden sm:flex items-center gap-2 font-sans">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <span>🔥</span>
                <span>{(user?.streak ?? 0)}d Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{(user?.xp ?? 0)} XP</span>
              </div>
            </div>

            {/* Quick Action Practice Button */}
            <button
              onClick={() => navigate('/interview-setup')}
              className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
            >
              <span className="hidden sm:inline">Start </span>Practice
            </button>

            {/* Postman-Style Top-Right Profile Symbol & Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full border border-[var(--theme-border,#E2E8F0)] hover:border-[var(--theme-primary,#4F46E5)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary,#4F46E5)]/30"
                aria-expanded={profileDropdownOpen}
                aria-label="Candidate profile menu"
                title={user?.name || 'Candidate profile'}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Candidate'}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(user?.name)}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-[var(--theme-text-muted,#64748B)] hidden sm:block mr-1" />
              </button>

              {/* Profile Floating Dropdown Menu (Postman Style) */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-2xl bg-[var(--theme-surface,#FFFFFF)] border border-[var(--theme-border,#E2E8F0)] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Candidate Identity Card */}
                  <div className="p-3 rounded-xl bg-[var(--theme-surface-hover,#F1F5F9)] border border-[var(--theme-border,#E2E8F0)] mb-2">
                    <p className="text-sm font-bold text-[var(--theme-text,#0F172A)] truncate">
                      {user?.name || 'Candidate'}
                    </p>
                    <p className="text-xs text-[var(--theme-text-muted,#64748B)] truncate mt-0.5">
                      {user?.email || 'candidate@example.com'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-selected,#EEF2FF)] text-[var(--theme-primary,#4F46E5)] border border-[var(--theme-border,#E2E8F0)] truncate">
                        {user?.targetRole || 'Software Engineer'}
                      </span>
                    </div>
                  </div>

                  {/* Postman-Style Theme Quick Selector */}
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted,#64748B)] mb-1.5">
                      Appearance Theme
                    </p>
                    <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--theme-surface-hover,#F1F5F9)] border border-[var(--theme-border,#E2E8F0)]">
                      {[
                        { id: 'system', icon: '🖥️', label: 'Auto' },
                        { id: 'white', icon: '☀️', label: 'Light' },
                        { id: 'dark', icon: '🌙', label: 'Dark' },
                        { id: 'black', icon: '🌌', label: 'Black' }
                      ].map((t) => {
                        const isCurrent = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTheme(t.id)}
                            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[var(--theme-surface,#FFFFFF)] text-[var(--theme-text,#0F172A)] shadow-xs border border-[var(--theme-border,#E2E8F0)]'
                                : 'text-[var(--theme-text-muted,#64748B)] hover:text-[var(--theme-text,#0F172A)]'
                            }`}
                            title={`${t.label} theme`}
                          >
                            <span className="text-xs mb-0.5">{t.icon}</span>
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="my-1.5 border-t border-[var(--theme-border,#E2E8F0)]" />

                  {/* Menu Options */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--theme-text-secondary,#334155)] hover:text-[var(--theme-text,#0F172A)] hover:bg-[var(--theme-surface-hover,#F1F5F9)] transition-colors cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-[var(--theme-text-muted,#64748B)]" />
                      <span>Settings &amp; Preferences</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/help');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--theme-text-secondary,#334155)] hover:text-[var(--theme-text,#0F172A)] hover:bg-[var(--theme-surface-hover,#F1F5F9)] transition-colors cursor-pointer text-left"
                    >
                      <HelpCircle className="w-4 h-4 text-[var(--theme-text-muted,#64748B)]" />
                      <span>Help &amp; Documentation</span>
                    </button>
                  </div>

                  <div className="my-1.5 border-t border-[var(--theme-border,#E2E8F0)]" />

                  {/* Sign Out Option */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body Viewport with bottom padding for mobile bar */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[var(--theme-header-bg,rgba(255,255,255,0.98))] border-t border-[var(--theme-border,#E2E8F0)] px-2 py-1.5 flex items-center justify-around backdrop-blur-md shadow-lg transition-colors">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname === '/dashboard'
                ? 'text-[var(--theme-primary,#4F46E5)] bg-[var(--theme-selected,#EEF2FF)] font-bold'
                : 'text-[var(--theme-text-muted,#64748B)] hover:text-[var(--theme-text,#0F172A)]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/interview-setup')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname.startsWith('/interview') || location.pathname.startsWith('/mock-interview')
                ? 'text-[var(--theme-primary,#4F46E5)] bg-[var(--theme-selected,#EEF2FF)] font-bold'
                : 'text-[var(--theme-text-muted,#64748B)] hover:text-[var(--theme-text,#0F172A)]'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Practice</span>
          </button>

          <button
            onClick={() => navigate('/skill-gap')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname === '/skill-gap'
                ? 'text-[var(--theme-primary,#4F46E5)] bg-[var(--theme-selected,#EEF2FF)] font-bold'
                : 'text-[var(--theme-text-muted,#64748B)] hover:text-[var(--theme-text,#0F172A)]'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Skill Gap</span>
          </button>

          <button
            onClick={() => navigate('/progress')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname === '/progress'
                ? 'text-[var(--theme-primary,#4F46E5)] bg-[var(--theme-selected,#EEF2FF)] font-bold'
                : 'text-[var(--theme-text-muted,#64748B)] hover:text-[var(--theme-text,#0F172A)]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Progress</span>
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold text-[var(--theme-text-muted,#64748B)] hover:text-[var(--theme-text,#0F172A)] transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </nav>
      </div>

      {/* Global Product Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultContext={location.pathname}
      />
    </div>
  );
}
