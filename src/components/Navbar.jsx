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
    <nav className="sticky top-0 z-50 w-full bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E5E0D5] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo: Alexandria Masthead Mark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white shadow-xs">
              <span className="font-serif font-bold text-lg tracking-wider text-white">T</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-serif font-bold tracking-tight text-[#1F1B16]">
                  TalentPath
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5]">
                  AI Edition
                </span>
              </div>
              <span className="editorial-overline text-[10px]">
                Career Preparation Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-sans text-xs uppercase tracking-wider font-semibold">
            <a href="#features" className="text-[#70685E] hover:text-[#1A365D] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-[#70685E] hover:text-[#1A365D] transition-colors">
              How It Works
            </a>
            <a href="#agent-vision" className="text-[#70685E] hover:text-[#1A365D] transition-colors">
              Curriculum
            </a>
            <Link to="/ats" className="text-[#70685E] hover:text-[#1A365D] transition-colors flex items-center gap-1">
              Resume Scanner
            </Link>
            <Link to="/daily-challenge" className="text-[#70685E] hover:text-[#1A365D] transition-colors flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#8C6E54]" />
              Daily Practice
            </Link>
          </div>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] hover:border-[#1A365D] transition-all text-xs font-semibold text-[#1F1B16]"
                >
                  <div className="w-6 h-6 rounded-md bg-[#1B2A4A] flex items-center justify-center text-[11px] font-serif font-bold text-white">
                    {user.name ? user.name[0] : 'C'}
                  </div>
                  <span>{user.name ? user.name.split(' ')[0] : 'Candidate'}</span>
                  <div className="flex items-center text-[#8C6E54] font-bold gap-0.5 ml-1 font-mono text-[11px]">
                    <Flame className="w-3 h-3 fill-[#8C6E54]" />
                    <span>{user.streak || 7}d</span>
                  </div>
                </Link>

                <GradientButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/interview-setup')}
                  icon={Sparkles}
                >
                  Start Practice
                </GradientButton>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-bold uppercase tracking-wider text-[#70685E] hover:text-[#1F1B16] transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <GradientButton
                  variant="primary"
                  size="sm"
                  onClick={handleStartInterview}
                  icon={ArrowRight}
                >
                  Start Practice
                </GradientButton>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] hover:bg-[#F2EFE9]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFDF9] border-b border-[#E5E0D5] px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 font-sans text-xs uppercase tracking-wider font-semibold">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-[#70685E] hover:bg-[#FAF8F3] hover:text-[#1F1B16]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-[#70685E] hover:bg-[#FAF8F3] hover:text-[#1F1B16]"
            >
              How It Works
            </a>
            <Link
              to="/ats"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-[#70685E] hover:bg-[#FAF8F3] hover:text-[#1F1B16]"
            >
              ATS Audit
            </Link>
            <Link
              to="/daily-challenge"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-[#70685E] hover:bg-[#FAF8F3] hover:text-[#1F1B16] flex items-center gap-2"
            >
              <Flame className="w-3.5 h-3.5 text-[#8C6E54]" />
              Daily Practice
            </Link>
          </div>

          <div className="pt-4 border-t border-[#E5E0D5] flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1F1B16]"
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
                  Start Practice
                </GradientButton>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full py-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1F1B16]"
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
                  Start Practice →
                </GradientButton>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
