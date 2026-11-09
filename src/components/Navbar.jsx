import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Flame, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleStartInterview = () => {
    if (isAuthenticated && user) {
      navigate('/interview-setup');
    } else {
      navigate('/login?redirect=/interview-setup');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavAnchor = (e, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (window.location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${sectionId}`);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const isLoggedIn = Boolean(isAuthenticated && user);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[var(--theme-surface,#212121)]/95 backdrop-blur-md border-b border-slate-200 dark:border-[var(--theme-border,#2E2E2E)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo: Clean TalentShine Sans-Serif Mark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
              <span className="font-sans font-bold text-base tracking-wider text-white">TP</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  TalentPath
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                  AI Edition
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
                Career Preparation Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7 font-sans text-xs uppercase tracking-wider font-semibold">
            <a href="#features" onClick={(e) => handleNavAnchor(e, 'features')} className="text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
              Features
            </a>
            <a href="#how-it-works" onClick={(e) => handleNavAnchor(e, 'how-it-works')} className="text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
              How It Works
            </a>
            <a href="#curriculum" onClick={(e) => handleNavAnchor(e, 'curriculum')} className="text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
              Curriculum
            </a>
            <Link to="/ats" className="text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Resume Scanner
            </Link>
            <Link to="/skill-arena" className="text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Daily Practice
            </Link>
          </div>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[var(--theme-surface-subtle,#1A1A1A)] hover:bg-slate-100 dark:hover:bg-[var(--theme-surface-hover,#2A2A2A)] border border-slate-200 dark:border-[var(--theme-border,#2E2E2E)] transition-all text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {user?.name ? user.name[0] : 'C'}
                  </div>
                  <span>{user?.name ? user.name.split(' ')[0] : 'Candidate'}</span>
                  <div className="flex items-center text-amber-600 dark:text-amber-400 font-bold gap-0.5 ml-1 font-mono text-[11px]">
                    <Flame className="w-3 h-3 fill-amber-500" />
                    <span>{user?.streak || 7}d</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-[var(--theme-border,#2E2E2E)] transition-all cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleStartInterview}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
                >
                  <span>Start Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[var(--theme-surface,#212121)] border-b border-slate-200 dark:border-[var(--theme-border,#2E2E2E)] px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 font-sans text-xs uppercase tracking-wider font-semibold">
            <a
              href="#features"
              onClick={(e) => handleNavAnchor(e, 'features')}
              className="px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleNavAnchor(e, 'how-it-works')}
              className="px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#curriculum"
              onClick={(e) => handleNavAnchor(e, 'curriculum')}
              className="px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
            >
              Curriculum
            </a>
            <Link
              to="/ats"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Resume Scanner
            </Link>
            <Link
              to="/skill-arena"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Daily Practice
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[var(--theme-border,#2E2E2E)] flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200"
                >
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200"
                >
                  Sign In
                </Link>
                <button
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleStartInterview();
                  }}
                >
                  <span>Start Practice</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
