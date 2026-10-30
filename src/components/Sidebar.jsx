import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic, 
  FileSearch, 
  Code2, 
  TrendingUp, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  X,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen = false, setMobileOpen = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navSections = [
    {
      title: 'Practice & Cockpit',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/interview-setup', label: 'Mock Interview', icon: Mic },
        { to: '/skill-arena', label: 'Skill Arena & Daily', icon: Code2 },
        { to: '/peer-room', label: 'Peer Chamber', icon: Users },
      ]
    },
    {
      title: 'Analytics & Tools',
      items: [
        { to: '/ats', label: 'Resume / ATS', icon: FileSearch },
        { to: '/progress', label: 'Progress & Insights', icon: TrendingUp },
        { to: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
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
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Element */}
      <aside
        className={`
          bg-white 
          border-r border-slate-200 
          flex flex-col justify-between 
          transition-all duration-200 z-50 
          h-screen
          fixed inset-y-0 left-0
          md:sticky md:top-0
          ${mobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0 w-64 md:w-auto'}
          ${collapsed ? 'md:w-16' : 'md:w-60'}
        `}
      >
        {/* Top Header / Brand */}
        <div>
          <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200 bg-white">
            {(!collapsed || mobileOpen) ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-600/30">
                  <span className="font-sans font-bold text-xs tracking-wider">TP</span>
                </div>
                <div className="truncate">
                  <span className="font-sans font-bold text-base tracking-tight text-slate-900 block">
                    TalentPath
                  </span>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold truncate">
                    Career Prep Agent
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
                <span className="font-sans font-bold text-xs">TP</span>
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors hidden md:block cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
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
                    <span className="text-[9px] font-sans uppercase tracking-widest text-slate-400 font-bold select-none">
                      {section.title}
                    </span>
                  </div>
                ) : sIdx > 0 ? (
                  <div className="my-1.5 border-t border-slate-100" />
                ) : null}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleNavClick}
                      className={({ isActive }) => `
                        flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-colors duration-150
                        ${isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
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
        <div className="p-2.5 border-t border-slate-200 bg-white">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="truncate flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name || 'Candidate'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.targetRole || 'ML Engineer'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
