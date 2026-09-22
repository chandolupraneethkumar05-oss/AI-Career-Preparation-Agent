import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic, 
  FileSearch, 
  Flame, 
  Code2, 
  Brain, 
  TrendingUp, 
  Award, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  X,
  Target,
  BookOpen,
  Compass,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen = false, setMobileOpen = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navSections = [
    {
      title: 'Core',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/career-journey', label: 'Career Journey', icon: Compass },
        { to: '/progress', label: 'Progress Analytics', icon: TrendingUp },
      ]
    },
    {
      title: 'Practice & Arena',
      items: [
        { to: '/interview-setup', label: 'Mock Interview', icon: Mic },
        { to: '/skill-arena', label: 'Skill Arena', icon: Code2 },
        { to: '/daily-challenge', label: 'Daily Practice', icon: Flame },
        { to: '/interview-experiences', label: 'Question Vault', icon: BookOpen },
      ]
    },
    {
      title: 'Diagnostics',
      items: [
        { to: '/ats', label: 'Resume / ATS', icon: FileSearch },
        { to: '/skill-gap', label: 'Skill Gap', icon: Brain },
        { to: '/weekly-report', label: 'Weekly Report', icon: FileText },
      ]
    },
    {
      title: 'Account',
      items: [
        { to: '/achievements', label: 'Milestones', icon: Award },
        { to: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[#1F1B16]/20 backdrop-blur-[1px] z-40 sm:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Element */}
      <aside
        className={`
          bg-[#F8F6F0] 
          border-r border-[#E5E0D5] 
          flex flex-col justify-between 
          transition-all duration-150 z-50 
          h-screen
          fixed inset-y-0 left-0
          sm:sticky sm:top-0
          ${mobileOpen ? 'translate-x-0 w-64 shadow-lg' : '-translate-x-full sm:translate-x-0'}
          ${collapsed ? 'sm:w-16' : 'sm:w-60'}
        `}
      >
        {/* Top Header / Brand Masthead */}
        <div>
          <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#E5E0D5] bg-[#FFFDF9]">
            {(!collapsed || mobileOpen) ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <span className="font-serif font-bold text-xs tracking-wider">TP</span>
                </div>
                <div className="truncate">
                  <span className="font-serif font-bold text-base tracking-tight text-[#1F1B16] block">
                    TalentPath
                  </span>
                  <p className="text-[9px] uppercase tracking-widest text-[#5C554B] font-bold truncate">
                    Career Prep Agent
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white shadow-sm">
                <span className="font-serif font-bold text-xs">TP</span>
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md border border-[#E5E0D5] text-[#5C554B] hover:text-[#1F1B16] hover:bg-[#F2EFE9] transition-colors hidden sm:block cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-md border border-[#E5E0D5] text-[#5C554B] hover:text-[#1F1B16] hover:bg-[#F2EFE9] sm:hidden"
              title="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="p-2 space-y-3 mt-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navSections.map((section, sIdx) => (
              <div key={section.title} className="space-y-0.5">
                {(!collapsed || mobileOpen) ? (
                  <div className="px-3 pt-1 pb-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#5C554B] font-bold select-none">
                      {section.title}
                    </span>
                  </div>
                ) : sIdx > 0 ? (
                  <div className="my-1.5 border-t border-[#E5E0D5]/70" />
                ) : null}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleNavClick}
                      className={({ isActive }) => `
                        flex items-center gap-2.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors duration-150
                        ${isActive
                          ? 'bg-[#EAEFF5] text-[#1A365D] font-semibold border border-[#D0DBE7] shadow-none'
                          : 'text-[#5C554B] hover:text-[#1F1B16] hover:bg-[#F2EFE9] border border-transparent'
                        }
                        ${collapsed && !mobileOpen ? 'justify-center px-1.5 py-2' : ''}
                      `}
                      title={collapsed && !mobileOpen ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {(!collapsed || mobileOpen) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Candidate Profile Bar */}
        <div className="p-2.5 border-t border-[#E5E0D5] bg-[#FFFDF9]">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-[#F2EFE9] border border-[#E5E0D5]">
              <div className="truncate flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1F1B16] truncate">
                  {user?.name || 'Candidate'}
                </p>
                <p className="text-[10px] text-[#5C554B] truncate">
                  {user?.targetRole || 'ML Engineer'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[#5C554B] hover:text-[#9A421A] hover:bg-[#FDF2E9] transition-colors shrink-0 cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-md text-[#5C554B] hover:text-[#9A421A] hover:bg-[#FDF2E9] transition-colors cursor-pointer"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
