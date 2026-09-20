import React, { useState, useMemo } from 'react';
import { Lock, CheckCircle2, Award, Zap, Flame, Target, Sparkles, Filter } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import { storageService } from '../utils/storage/storageService';
import { achievementService } from '../utils/achievementService';
import { useAuth } from '../context/AuthContext';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');

  const state = useMemo(() => storageService.getUserCareerState(), []);
  const dynamicAchievements = useMemo(
    () => achievementService.evaluateAchievements(state),
    [state]
  );

  const unlockedCount = dynamicAchievements.filter((a) => a.unlocked).length;
  const totalCount = dynamicAchievements.length;
  const completionPercent = Math.round((unlockedCount / (totalCount || 1)) * 100);

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(dynamicAchievements.map((a) => a.category || 'General'))];
    return cats;
  }, [dynamicAchievements]);

  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'All') return dynamicAchievements;
    return dynamicAchievements.filter((a) => a.category === activeCategory);
  }, [dynamicAchievements, activeCategory]);

  const userXP = user?.xp ?? 1240;
  const currentLevel = user?.level ?? Math.max(1, Math.floor(userXP / 1000) + 1);
  const nextLevelXP = currentLevel * 1000;
  const currentLevelBaseXP = (currentLevel - 1) * 1000;
  const levelProgress = Math.min(100, Math.max(0, Math.round(((userXP - currentLevelBaseXP) / 1000) * 100)));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#70685E]">
              Milestones &amp; Badges
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#235E3B]" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1B16] tracking-tight">
            Achievements &amp; Badges
          </h1>
          <p className="text-sm text-[#70685E] mt-1">
            Celebrate your practice milestones, interview progress, and achievements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="navy" size="md">
            {unlockedCount} of {totalCount} Badges Earned ({completionPercent}%)
          </Badge>
        </div>
      </div>

      {/* Overview Milestone Banner */}
      <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Level Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-md bg-[#1B2A4A] flex items-center justify-center text-lg font-serif font-bold text-white shadow-xs shrink-0">
              Lvl {currentLevel}
            </div>
            <div>
              <span className="text-xs text-[#70685E] uppercase font-mono font-semibold tracking-wider">Candidate Level</span>
              <h3 className="font-serif text-lg font-bold text-[#1F1B16]">
                {currentLevel >= 15 ? 'Lead Candidate' : currentLevel >= 10 ? 'Senior Candidate' : 'Practicing Candidate'}
              </h3>
              <p className="text-xs text-[#1A365D] font-mono font-semibold">{userXP} Total XP</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#70685E] font-medium">Advancement to Level {currentLevel + 1}</span>
              <span className="text-[#1F1B16] font-mono font-bold">{levelProgress}%</span>
            </div>
            <ProgressBar value={levelProgress} height="h-2" />
            <span className="text-[10px] text-[#70685E] block text-right font-mono">
              {nextLevelXP - userXP} XP required for Level {currentLevel + 1}
            </span>
          </div>

          {/* Unlock Stats */}
          <div className="flex items-center justify-around border-t md:border-t-0 md:border-l border-[#E5E0D5] pt-4 md:pt-0 md:pl-6">
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-[#235E3B] font-mono">{unlockedCount}</div>
              <div className="text-[11px] text-[#70685E] font-medium uppercase font-mono">Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-[#9A421A] font-mono">{totalCount - unlockedCount}</div>
              <div className="text-[11px] text-[#70685E] font-medium uppercase font-mono">Locked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-[#1A365D] font-mono">{completionPercent}%</div>
              <div className="text-[11px] text-[#70685E] font-medium uppercase font-mono">Completed</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-[#70685E] shrink-0 ml-1" />
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const count = cat === 'All' 
            ? dynamicAchievements.length 
            : dynamicAchievements.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5
                ${isActive
                  ? 'bg-[#1B2A4A] text-white border border-[#1B2A4A] shadow-xs'
                  : 'bg-[#FFFDF9] text-[#70685E] hover:text-[#1F1B16] hover:bg-[#F2EFE9] border border-[#E5E0D5]'
                }
              `}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-sm ${isActive ? 'bg-white/20 text-white' : 'bg-[#FAF8F3] text-[#70685E]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredAchievements.map((ach) => (
          <GlassCard
            key={ach.id}
            hoverEffect={ach.unlocked}
            className={`
              p-5 flex flex-col justify-between space-y-4 relative transition-all rounded-md
              ${ach.unlocked
                ? 'border-[#E5E0D5] bg-[#FFFDF9]'
                : 'border-[#E5E0D5] bg-[#FAF8F3] opacity-85'
              }
            `}
          >
            <div>
              {/* Badge Icon & Status */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`
                    w-12 h-12 rounded-md flex items-center justify-center text-2xl
                    ${ach.unlocked
                      ? 'bg-[#EAEFF5] text-[#1A365D] border border-[#BDD0E2]'
                      : 'bg-[#F2EFE9] text-[#70685E] border border-[#E5E0D5]'
                    }
                  `}
                >
                  {ach.icon}
                </div>

                <div className="flex flex-col items-end gap-1">
                  {ach.unlocked ? (
                    <Badge variant="green" size="sm">Earned</Badge>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-[#70685E] font-semibold font-mono">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </div>
                  )}
                  <span className="text-[10px] text-[#70685E] font-mono font-medium">
                    {ach.category}
                  </span>
                </div>
              </div>

              {/* Title & Desc */}
              <h3 className="font-serif text-base font-bold text-[#1F1B16] mb-1">{ach.title}</h3>
              <p className="text-xs text-[#70685E] leading-relaxed">{ach.desc}</p>
            </div>

            {/* Bottom Progress or Date */}
            <div className="pt-3 border-t border-[#E5E0D5]">
              {ach.unlocked ? (
                <div className="flex items-center justify-between text-[10px] text-[#235E3B] font-mono">
                  <span className="flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#235E3B]" />
                    Earned
                  </span>
                  <span className="text-[#70685E]">{ach.unlockedDate || 'Active'}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-[#70685E] font-mono">
                    <span>Progress</span>
                    <span className="font-bold text-[#1F1B16]">{ach.progress || 0}%</span>
                  </div>
                  <ProgressBar
                    value={ach.progress || 0}
                    height="h-1.5"
                  />
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
