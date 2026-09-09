import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Sparkles, Menu, X, ArrowRight, Flame, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GradientButton from './GradientButton';

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
    <nav className="sticky top-0 z-50 w-full bg-[#0F1026]/85 backdrop-blur-xl border-b border-purple-500/20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#06B6D4] p-0.5 shadow-lg shadow-purple-900/30 group-hover:shadow-cyan-500/30 transition-all duration-300">
              <div className="w-full h-full bg-[#0F1026] rounded-[10px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-cyan-300 bg-clip-text text-transparent">
                  InterviewAI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Agent v1.0
                </span>
              </div>
              <span className="text-xs text-[#A5B4FC]/80 font-medium">
                AI Career Preparation Agent
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[#A5B4FC] hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-[#A5B4FC] hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#agent-vision" className="text-sm font-medium text-[#A5B4FC] hover:text-white transition-colors">
              Agent Journey
            </a>
            <Link to="/ats" className="text-sm font-medium text-[#A5B4FC] hover:text-white transition-colors flex items-center gap-1">
              ATS Scanner
            </Link>
            <Link to="/daily-challenge" className="text-sm font-medium text-[#A5B4FC] hover:text-white transition-colors flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              Daily Practice
            </Link>
          </div>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#191A3A] border border-purple-500/30 hover:border-cyan-400/50 transition-all text-xs font-semibold text-[#F8FAFC]"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <span>{user.name.split(' ')[0]}</span>
                  <div className="flex items-center text-orange-400 font-bold gap-0.5 ml-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    <span>{user.streak || 7}d</span>
                  </div>
                </Link>

                <GradientButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/interview-setup')}
                  icon={Sparkles}
                >
                  Start Mock Interview
                </GradientButton>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-[#A5B4FC] hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <GradientButton
                  variant="primary"
                  size="sm"
                  onClick={handleStartInterview}
                  icon={ArrowRight}
                >
                  Start Mock Interview
                </GradientButton>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#191A3A] border border-purple-500/20 text-[#A5B4FC] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F1026] border-b border-purple-500/20 px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-[#A5B4FC] hover:bg-[#191A3A]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-[#A5B4FC] hover:bg-[#191A3A]"
            >
              How It Works
            </a>
            <Link
              to="/ats"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-[#A5B4FC] hover:bg-[#191A3A]"
            >
              ATS Resume Scanner
            </Link>
            <Link
              to="/daily-challenge"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-[#A5B4FC] hover:bg-[#191A3A] flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              Daily Challenge
            </Link>
          </div>

          <div className="pt-4 border-t border-purple-500/20 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#191A3A] border border-purple-500/30 text-sm font-semibold text-white"
                >
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Link>
                <GradientButton
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/interview-setup');
                  }}
                >
                  Start Mock Interview
                </GradientButton>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-2.5 rounded-xl bg-[#191A3A] border border-purple-500/30 text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <GradientButton
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleStartInterview();
                  }}
                >
                  Start Mock Interview →
                </GradientButton>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
