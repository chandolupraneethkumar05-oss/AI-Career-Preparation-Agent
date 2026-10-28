import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Menu, X, ArrowRight, Flame, LayoutDashboard, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleStartInterview = () => {
    if (isAuthenticated) {
      navigate('/interview-setup');
    } else {
      navigate('/login?redirect=/interview-setup');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo: Clean TalentShine Sans-Serif Mark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
              <span className="font-sans font-bold text-base tracking-wider text-white">TP</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                  TalentPath
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  AI Edition
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-sans">
                Career Preparation Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7 font-sans text-xs uppercase tracking-wider font-semibold">
            <a href="#features" className="text-slate-600 hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-slate-600 hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#curriculum" className="text-slate-600 hover:text-indigo-600 transition-colors">
              Curriculum
            </a>
            <Link to="/ats" className="text-slate-600 hover:text-indigo-600 transition-colors">
              Resume Scanner
            </Link>
            <Link to="/skill-arena" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Daily Practice
            </Link>
          </div>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs font-semibold text-slate-900"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {user?.name ? user.name[0] : 'C'}
                  </div>
                  <span>{user?.name ? user.name.split(' ')[0] : 'Candidate'}</span>
                  <div className="flex items-center text-amber-600 font-bold gap-0.5 ml-1 font-mono text-[11px]">
                    <Flame className="w-3 h-3 fill-amber-500" />
                    <span>{user?.streak || 7}d</span>
                  </div>
                </Link>

                <button
                  onClick={() => navigate('/interview-setup')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Practice</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleStartInterview}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
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
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 font-sans text-xs uppercase tracking-wider font-semibold">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              How It Works
            </a>
            <Link
              to="/ats"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Resume Scanner
            </Link>
            <Link
              to="/skill-arena"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Daily Practice
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Link>
                <button
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/interview-setup');
                  }}
                >
                  Start Practice
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  Sign In
                </Link>
                <button
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
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
