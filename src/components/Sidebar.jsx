import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  FileSearch,
  Flame,
  Brain,
  TrendingUp,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interview-setup', label: 'Mock Interview', icon: Mic, badge: 'Agent' },
    { to: '/ats', label: 'Resume / ATS', icon: FileSearch },
    { to: '/daily-challenge', label: 'Daily Challenge', icon: Flame, badge: 'XP' },
    { to: '/skill-gap', label: 'Skill Gap', icon: Brain },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/achievements', label: 'Achievements', icon: Award },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={`
        sticky top-0 h-screen 
        bg-[#0D0E22] 
        border-r border-purple-500/20 
        flex flex-col justify-between 
        transition-all duration-300 z-40 
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Top Header / Brand */}
      <div>
        <div className="h-20 flex items-center justify-between px-4 border-b border-purple-500/15">
          {!collapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-0.5 shrink-0 shadow-md shadow-purple-900/30">
                <div className="w-full h-full bg-[#0F1026] rounded-[10px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    InterviewAI
                  </span>
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-[#A5B4FC]/70 font-medium truncate">Career Preparation Agent</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-0.5 shadow-md shadow-purple-900/30">
              <div className="w-full h-full bg-[#0F1026] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-[#191A3A] border border-purple-500/30 text-[#A5B4FC] hover:text-white hover:border-cyan-400/50 transition-colors hidden sm:block"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-cyan-500/10 text-white border border-purple-500/40 shadow-[0_0_15px_-3px_rgba(124,58,237,0.3)]'
                    : 'text-[#A5B4FC]/80 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${collapsed ? '' : 'text-purple-400'}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-purple-500/15 bg-[#0A0B1A]">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#191A3A]/70 border border-purple-500/20">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-[#F8FAFC] truncate">{user?.name || 'Candidate'}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#A5B4FC]">
                    <span className="text-amber-400 font-semibold">Lvl {user?.level || 12}</span>
                    <span>•</span>
                    <span className="text-cyan-300 font-mono">{user?.xp || 1240} XP</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#A5B4FC] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-sm font-bold text-white shadow cursor-pointer"
              title={`${user?.name || 'User'} (Lvl ${user?.level || 12})`}
            >
              {user?.name ? user.name[0] : 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[#A5B4FC] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
