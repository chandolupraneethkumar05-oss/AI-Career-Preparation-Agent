import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Zap, MessageSquare, LayoutDashboard, Mic, Brain, TrendingUp } from 'lucide-react';
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
      case '/skill-arena': return 'Skill Arena & Daily Practice';
      case '/ats': return 'Resume / ATS Diagnostic';
      case '/progress': return 'Progress & Insights Hub';
      case '/interview-experiences': return 'Interview Archive';
      case '/settings': return 'System Settings';
      default: return 'Career Hub';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg,#F8FAFC)] text-[var(--theme-text,#0F172A)] flex flex-row antialiased overflow-x-hidden font-sans transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Masthead Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between transition-colors shadow-xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors md:hidden cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 font-sans">
              <span className="font-sans font-bold text-slate-900 tracking-tight">TalentPath</span>
              <span className="opacity-50">/</span>
              <span className="text-slate-700 font-medium truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Streak Badge */}
            <div className="flex sm:hidden items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
              <span>🔥</span>
              <span>{(user?.streak ?? 0)}d</span>
            </div>

            {/* Feedback Button */}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
              title="Share Product Feedback"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Feedback</span>
            </button>

            {/* Desktop Streak & XP Metrics */}
            <div className="hidden sm:flex items-center gap-2 font-sans">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <span>🔥</span>
                <span>{(user?.streak ?? 0)}d Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>{(user?.xp ?? 0)} XP</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => navigate('/interview-setup')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              <span className="hidden sm:inline">Start </span>Practice
            </button>
          </div>
        </header>

        {/* Page Body Viewport with bottom padding for mobile bar */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[var(--theme-header-bg,rgba(255,253,249,0.98))] border-t border-[var(--theme-border,#E5E0D5)] px-2 py-1.5 flex items-center justify-around backdrop-blur-md shadow-lg transition-colors">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname === '/dashboard'
                ? 'text-[var(--theme-primary,#1A365D)] bg-[var(--theme-selected,#EAEFF5)] font-bold'
                : 'text-[var(--theme-text-muted,#70685E)] hover:text-[var(--theme-text,#1F1B16)]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/interview-setup')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname.startsWith('/interview') || location.pathname.startsWith('/mock-interview')
                ? 'text-[var(--theme-primary,#1A365D)] bg-[var(--theme-selected,#EAEFF5)] font-bold'
                : 'text-[var(--theme-text-muted,#70685E)] hover:text-[var(--theme-text,#1F1B16)]'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Practice</span>
          </button>

          <button
            onClick={() => navigate('/skill-gap')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname === '/skill-gap'
                ? 'text-[var(--theme-primary,#1A365D)] bg-[var(--theme-selected,#EAEFF5)] font-bold'
                : 'text-[var(--theme-text-muted,#70685E)] hover:text-[var(--theme-text,#1F1B16)]'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Skill Gap</span>
          </button>

          <button
            onClick={() => navigate('/progress')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
              location.pathname === '/progress'
                ? 'text-[var(--theme-primary,#1A365D)] bg-[var(--theme-selected,#EAEFF5)] font-bold'
                : 'text-[var(--theme-text-muted,#70685E)] hover:text-[var(--theme-text,#1F1B16)]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Progress</span>
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold text-[var(--theme-text-muted,#70685E)] hover:text-[var(--theme-text,#1F1B16)] transition-colors cursor-pointer"
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
