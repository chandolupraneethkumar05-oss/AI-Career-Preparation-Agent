import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Target,
  Palette,
  LogOut,
  Save,
  CheckCircle2
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { MOCK_ROLES } from '../data/mockData';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { setup, updateSetup } = useInterview();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [role, setRole] = useState(setup.targetRole || 'Machine Learning Engineer');
  const [difficulty, setDifficulty] = useState(setup.difficulty || 'Intermediate');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({ name, role });
    updateSetup({ targetRole: role, difficulty });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            User Preferences
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Application Settings ⚙️
        </h1>
        <p className="text-sm text-[#A5B4FC] mt-1">
          Configure profile metadata, target role alignment, and prototype defaults.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully to local state!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <GlassCard className="p-6 space-y-4 border-purple-500/30">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Profile Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={user?.email || 'alex.rivera@career-ai.dev'}
                disabled
                className="w-full p-2.5 rounded-xl bg-[#0F1026]/50 border border-purple-500/20 text-[#A5B4FC]/60 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </GlassCard>

        {/* Target Role & Preferences */}
        <GlassCard className="p-6 space-y-4 border-purple-500/30">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Career Alignment Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
                Default Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                {MOCK_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#191A3A] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
                Preferred Evaluation Strictness
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="Beginner" className="bg-[#191A3A] text-white">Beginner (Foundational)</option>
                <option value="Intermediate" className="bg-[#191A3A] text-white">Intermediate (Mid-level)</option>
                <option value="Advanced" className="bg-[#191A3A] text-white">Advanced (Senior / Staff)</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Theme Information */}
        <GlassCard className="p-6 space-y-3 border-purple-500/30">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-pink-400" />
            <h3 className="text-base font-bold text-white">Visual Design Theme</h3>
          </div>
          <p className="text-xs text-[#A5B4FC]">
            Current theme: <strong className="text-white">Purple + Cyan Futuristic AI SaaS</strong>
          </p>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-[#A5B4FC]">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0F1026] border border-white/40" /> Background (#0F1026)
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#A5B4FC]">
              <span className="w-3.5 h-3.5 rounded-full bg-[#7C3AED]" /> Primary (#7C3AED)
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#A5B4FC]">
              <span className="w-3.5 h-3.5 rounded-full bg-[#06B6D4]" /> Cyan (#06B6D4)
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#A5B4FC]">
              <span className="w-3.5 h-3.5 rounded-full bg-[#191A3A] border border-white/20" /> Card (#191A3A)
            </div>
          </div>
        </GlassCard>

        {/* Save & Logout Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:text-white hover:bg-red-500/20 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>

          <GradientButton
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
          >
            Save Changes
          </GradientButton>
        </div>
      </form>
    </div>
  );
}
