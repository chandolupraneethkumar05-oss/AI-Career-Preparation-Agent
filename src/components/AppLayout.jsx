import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Zap, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GradientButton from './GradientButton';
import FeedbackModal from './FeedbackModal';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      case '/skill-arena': return 'Skill Arena Practice';
      case '/ats': return 'Resume / ATS Diagnostic';
      case '/achievements': return 'Academic Milestones';
      case '/progress': return 'Career Readiness Progress';
      case '/interview-experiences': return 'Interview Archive';
      case '/settings': return 'System Settings';
      default: return 'Career Hub';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg,#F8F6F0)] text-[var(--theme-text,#1F1B16)] flex flex-row antialiased overflow-x-hidden font-sans transition-colors duration-150">
      {/* Editorial Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Masthead Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[var(--theme-header-bg,rgba(255,253,249,0.98))] border-b border-[var(--theme-border,#E5E0D5)] px-4 sm:px-6 flex items-center justify-between transition-colors shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-md bg-[var(--theme-surface-subtle,#F2EFE9)] border border-[var(--theme-border,#E5E0D5)] text-[var(--theme-text-muted,#70685E)] hover:text-[var(--theme-text,#1F1B16)] transition-colors sm:hidden cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-2 text-xs text-[var(--theme-text-muted,#70685E)]">
              <span className="font-serif font-semibold text-[var(--theme-text,#1F1B16)] tracking-tight">TalentPath</span>
              <span className="opacity-50">/</span>
              <span className="text-[var(--theme-text-secondary,#3B352E)] font-medium truncate max-w-[150px] sm:max-w-none">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Feedback Button */}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--theme-surface-low,#FAF8F3)] border border-[var(--theme-border,#E5E0D5)] hover:bg-[var(--theme-surface-hover,#F2EFE9)] text-[var(--theme-text-muted,#70685E)] hover:text-[var(--theme-text,#1F1B16)] text-xs font-semibold transition-colors cursor-pointer"
              title="Share Product Feedback"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--theme-bronze,#8C6E54)]" />
              <span>Feedback</span>
            </button>

            {/* Streak & XP Metrics */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--theme-surface-subtle,#F2EFE9)] border border-[var(--theme-border,#E5E0D5)] text-[var(--theme-bronze,#8C6E54)] text-xs font-semibold">
                <span>🔥</span>
                <span>{(user?.streak ?? 0)}d Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--theme-surface-subtle,#F2EFE9)] border border-[var(--theme-border,#E5E0D5)] text-[var(--theme-text-secondary,#3B352E)] text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-[var(--theme-text-muted,#70685E)]" />
                <span>{(user?.xp ?? 0)} XP</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <GradientButton
              size="sm"
              variant="primary"
              onClick={() => navigate('/interview-setup')}
              className="text-xs"
            >
              <span className="hidden xs:inline">Start </span>Interview
            </GradientButton>
          </div>
        </header>

        {/* Page Body Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
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
