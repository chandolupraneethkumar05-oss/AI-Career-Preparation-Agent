import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Flame, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GradientButton from './GradientButton';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0F1026] text-[#F8FAFC] flex flex-row antialiased overflow-x-hidden">
      {/* Dynamic Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-20 bg-[#0F1026]/85 backdrop-blur-xl border-b border-purple-500/20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A5B4FC]">
              <span className="text-purple-400">InterviewAI</span>
              <span>/</span>
              <span className="text-white">
                {location.pathname === '/skill-gap'
                  ? 'Skill Gap'
                  : location.pathname === '/interview-feedback'
                  ? 'Interview Results'
                  : location.pathname === '/interview-setup'
                  ? 'Interview Setup'
                  : location.pathname === '/interview-ready'
                  ? 'Interview Ready'
                  : location.pathname === '/mock-interview'
                  ? 'Mock Interview'
                  : location.pathname === '/daily-challenge'
                  ? 'Daily Challenge'
                  : location.pathname === '/ats'
                  ? 'Resume / ATS'
                  : location.pathname === '/achievements'
                  ? 'Achievements'
                  : location.pathname === '/progress'
                  ? 'Progress Analytics'
                  : location.pathname === '/settings'
                  ? 'Settings'
                  : 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak & XP Pills */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191A3A] border border-orange-500/30 text-orange-400 text-xs font-bold shadow-sm">
                <Flame className="w-4 h-4 fill-orange-400 animate-bounce" />
                <span>{user?.streak || 7} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191A3A] border border-purple-500/30 text-purple-300 text-xs font-bold shadow-sm">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
                <span>{user?.xp || 1240} XP</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <GradientButton
              size="sm"
              variant="primary"
              onClick={() => navigate('/interview-setup')}
              icon={Sparkles}
            >
              Start Mock Interview
            </GradientButton>
          </div>
        </header>

        {/* Page Body Viewport */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
