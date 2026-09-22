import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Target,
  Palette,
  LogOut,
  Save,
  CheckCircle2,
  Bell,
  Mail,
  Clock,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  Globe,
  History,
  RefreshCw
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../utils/storage/storageService';
import { reminderApi } from '../services/reminderApi';
import { profileApi } from '../services/profileApi';
import { SUPPORTED_FEEDBACK_LANGUAGES } from '../data/languages';
import { MOCK_ROLES } from '../data/mockData';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+5:30)' },
  { value: 'America/New_York', label: 'America/New_York (US Eastern - UTC-4/5)' },
  { value: 'America/Chicago', label: 'America/Chicago (US Central - UTC-5/6)' },
  { value: 'America/Denver', label: 'America/Denver (US Mountain - UTC-6/7)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific - UTC-7/8)' },
  { value: 'Europe/London', label: 'Europe/London (GMT / BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET / CEST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - UTC+9)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+8)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' }
];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { setup, updateSetup } = useInterview();
  const { theme: activeTheme, setTheme: changeTheme, availableThemes } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Candidate');
  const [role, setRole] = useState(user?.targetRole || user?.role || setup.targetRole || 'Machine Learning Engineer');
  const [difficulty, setDifficulty] = useState(setup.difficulty || 'Intermediate');
  const [feedbackLanguage, setFeedbackLanguage] = useState(user?.feedbackLanguage || setup.feedbackLanguage || 'en');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user?.targetRole || user?.role) {
      setRole(user.targetRole || user.role);
    }
  }, [user?.targetRole, user?.role]);

  // Proactive Daily Reminders State
  const initialPrefs = storageService.getReminderPrefs();
  const [reminderEnabled, setReminderEnabled] = useState(initialPrefs.enabled ?? true);
  const [reminderTime, setReminderTime] = useState(initialPrefs.preferred_time || initialPrefs.time || '19:00');
  const [reminderEmail, setReminderEmail] = useState(initialPrefs.email || user?.email || 'candidate@example.com');
  const [reminderTimezone, setReminderTimezone] = useState(initialPrefs.timezone || 'Asia/Kolkata');
  const [reminderFrequency, setReminderFrequency] = useState(initialPrefs.frequency || 'daily');
  const [reminderStatus, setReminderStatus] = useState(null);
  const [reminderHistory, setReminderHistory] = useState([]);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [testDispatching, setTestDispatching] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchReminderDetails = async () => {
    setRefreshingStatus(true);
    try {
      const prefs = await reminderApi.getPreferences();
      if (prefs) {
        setReminderEnabled(prefs.enabled ?? false);
        setReminderTime(prefs.preferred_time || prefs.time || '19:00');
        if (prefs.email) setReminderEmail(prefs.email);
        if (prefs.timezone) setReminderTimezone(prefs.timezone);
        if (prefs.frequency) setReminderFrequency(prefs.frequency);
      }

      const status = await reminderApi.getStatus();
      setReminderStatus(status);

      const history = await reminderApi.getHistory(5);
      setReminderHistory(history);
    } catch (err) {
      if (import.meta.env.DEV) console.debug('Failed to load reminder details:', err);
    } finally {
      setRefreshingStatus(false);
    }
  };

  useEffect(() => {
    fetchReminderDetails();
    const currentUserId = user?.id || 'usr_candidate';
    profileApi.getProfile(currentUserId).then((res) => {
      if (res?.profile?.feedback_language) {
        setFeedbackLanguage(res.profile.feedback_language);
      }
      if (res?.user?.target_role) {
        setRole(res.user.target_role);
      }
    }).catch(() => {});
  }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    const currentUserId = user?.id || 'usr_candidate';
    updateUser({ name, role, targetRole: role, feedbackLanguage });
    updateSetup({ targetRole: role, difficulty, feedbackLanguage });
    profileApi.updateProfile({ target_role: role, role, name, feedback_language: feedbackLanguage }, currentUserId).catch(() => {});


    const newReminderPrefs = {
      enabled: reminderEnabled,
      preferred_time: reminderTime,
      time: reminderTime,
      email: reminderEmail,
      timezone: reminderTimezone,
      frequency: reminderFrequency,
      method: 'email',
      target_role: role
    };

    await reminderApi.updatePreferences(newReminderPrefs);
    const updatedStatus = await reminderApi.getStatus();
    setReminderStatus(updatedStatus);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestReminder = async () => {
    setTestDispatching(true);
    setTestResult(null);

    const payload = {
      email: reminderEmail,
      targetRole: role,
      candidateName: name,
      currentStreak: user?.streak || 0,
      weakSkill: 'Communication (STAR Method)'
    };

    try {
      const data = await reminderApi.triggerTest(payload);
      setTestResult(data);
      setShowPreviewModal(true);
      // Refresh status and audit logs
      const updatedStatus = await reminderApi.getStatus();
      setReminderStatus(updatedStatus);
      const history = await reminderApi.getHistory(5);
      setReminderHistory(history);
    } finally {
      setTestDispatching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="border-b border-[#E5E0D5] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="editorial-overline">CANDIDATE PROFILE • SYSTEM PREFERENCES</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Application &amp; Candidate Preferences
        </h1>
        <p className="text-sm text-[#70685E] mt-1 font-sans">
          Manage your profile, target role, practice difficulty, reminders, and system settings.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] text-[#235E3B] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#235E3B]" />
          <span className="font-semibold">Preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <User className="w-4 h-4 text-[#1A365D]" />
            <h3 className="text-base font-serif font-bold text-[#1F1B16]">I. Candidate Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
                Candidate Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] text-sm focus:outline-none focus:border-[#1A365D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || 'candidate@example.com'}
                disabled
                className="w-full p-2.5 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] text-[#70685E] text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </GlassCard>

        {/* Target Role & Preferences */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <Target className="w-4 h-4 text-[#8C6E54]" />
            <h3 className="text-base font-serif font-bold text-[#1F1B16]">II. Career Alignment &amp; Difficulty Level</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
                Default Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] text-sm focus:outline-none focus:border-[#1A365D]"
              >
                {MOCK_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
                Practice Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] text-sm focus:outline-none focus:border-[#1A365D]"
              >
                <option value="Beginner">Beginner (Foundational Level)</option>
                <option value="Intermediate">Intermediate (Mid-Level Professional)</option>
                <option value="Advanced">Advanced (Senior Level)</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* AI Feedback Language Preference */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#1F1B16]">
                  III. AI Feedback Language
                </h3>
                <p className="text-xs text-[#70685E]">
                  Choose language for evaluation reports and practice feedback
                </p>
              </div>
            </div>
            <Badge variant="emerald" size="sm">
              Phase 16 Multilingual
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {SUPPORTED_FEEDBACK_LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                onClick={() => setFeedbackLanguage(lang.code)}
                className={`
                  p-4 rounded-md border cursor-pointer transition-all text-left flex flex-col justify-between
                  ${feedbackLanguage === lang.code
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-sm'
                    : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                  }
                `}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold font-serif text-[#1F1B16]">{lang.name}</span>
                    {feedbackLanguage === lang.code && (
                      <CheckCircle2 className="w-4 h-4 text-[#1A365D]" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#8C6E54] block mb-1">
                    {lang.native}
                  </span>
                  <p className="text-[11px] text-[#70685E] leading-relaxed">
                    {lang.description}
                  </p>
                </div>
                {lang.code !== 'en' && (
                  <div className="mt-3 pt-2 border-t border-[#E5E0D5] text-[10px] text-[#235E3B] font-mono">
                    Technical terms preserved in English
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-2.5 text-xs text-[#70685E]">
            <Sparkles className="w-4 h-4 text-[#8C6E54] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1F1B16] block mb-0.5">Evaluation Independence Guarantee:</strong>
              <span>Evaluation rubrics, STAR indices, and skill metrics remain strictly objective. Linguistic preference only translates pedagogical commentary.</span>
            </div>
          </div>
        </GlassCard>

        {/* Proactive Daily Practice Reminders */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] flex items-center justify-center text-[#9A421A]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#1F1B16]">
                  IV. Proactive Daily Practice Reminders
                </h3>
                <p className="text-xs text-[#70685E]">
                  Autonomous schedule notifications dispatched when daily preparation is pending
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchReminderDetails}
                disabled={refreshingStatus}
                title="Refresh reminder status"
                className="p-1.5 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] text-[#70685E] hover:text-[#1F1B16] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingStatus ? 'animate-spin text-[#1A365D]' : ''}`} />
              </button>
              <Badge variant="navy" size="sm">FastAPI Scheduler</Badge>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
            <div className="space-y-0.5">
              <label htmlFor="reminderToggle" className="text-sm font-semibold text-[#1F1B16] cursor-pointer">
                Enable Proactive Preparation Prompts
              </label>
              <p className="text-xs text-[#70685E]">
                Notifications are automatically suppressed once daily practice is completed.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="reminderToggle"
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E5E0D5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A365D]"></div>
            </label>
          </div>

          {/* Configuration Inputs & Live Status */}
          {reminderEnabled && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Live Status Banner */}
              {reminderStatus && (
                <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#70685E] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#1A365D]" />
                      Candidate Local Time: <strong className="text-[#1F1B16] font-mono">{reminderStatus.current_local_time || '--:--'}</strong> ({reminderStatus.timezone || reminderTimezone})
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {reminderStatus.practiced_today ? (
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EBF4EE] text-[#235E3B] border border-[#C2E0C6] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#235E3B]" />
                          Practice Completed Today (Suppressed)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FDF2E9] text-[#9A421A] border border-[#F0D5C0] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#9A421A]" />
                          Practice Pending Today
                        </span>
                      )}

                      {reminderStatus.reminder_sent_today && (
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EAEFF5] text-[#1A365D] border border-[#D0DBE7] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#1A365D]" />
                          Dispatched Today
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#70685E]">
                    <span className="text-[#1F1B16] font-medium">{reminderStatus.status_message}</span>
                  </p>
                </div>
              )}

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#70685E] mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1A365D]" />
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] text-sm focus:outline-none focus:border-[#1A365D] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#70685E] mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8C6E54]" />
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] text-sm focus:outline-none focus:border-[#1A365D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#70685E] mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#1A365D]" />
                    Timezone
                  </label>
                  <select
                    value={reminderTimezone}
                    onChange={(e) => setReminderTimezone(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] text-sm focus:outline-none focus:border-[#1A365D]"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#70685E] mb-1.5 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#8C6E54]" />
                    Dispatch Test
                  </label>
                  <button
                    type="button"
                    onClick={handleTestReminder}
                    disabled={testDispatching}
                    className="w-full p-2.5 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] text-[#1F1B16] text-sm font-semibold hover:bg-[#EAE6DD] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className={`w-3.5 h-3.5 ${testDispatching ? 'animate-bounce' : ''}`} />
                    <span>{testDispatching ? 'Dispatching...' : 'Dispatch Preview'}</span>
                  </button>
                </div>
              </div>

              {/* Recent Dispatched Reminders Audit Log */}
              {reminderHistory && reminderHistory.length > 0 && (
                <div className="pt-3 border-t border-[#E5E0D5] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1F1B16]">
                    <History className="w-3.5 h-3.5 text-[#8C6E54]" />
                    <span>Recent Notification History</span>
                  </div>
                  <div className="space-y-1.5">
                    {reminderHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#1F1B16] block">{item.subject}</span>
                          <span className="text-[11px] text-[#70685E]">
                            Date: {item.reminder_date} • Dispatched: {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 w-fit ${
                          item.status === 'development'
                            ? 'bg-[#EAEFF5] text-[#1A365D] border border-[#D0DBE7]'
                            : item.status === 'sent'
                            ? 'bg-[#EBF4EE] text-[#235E3B] border border-[#C2E0C6]'
                            : 'bg-[#FDF2E9] text-[#9A421A] border border-[#F0D5C0]'
                        }`}>
                          {item.status === 'development' ? 'Archived (Dev Mode)' : item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Appearance & Official Visual Identity */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#1F1B16]">
                  V. Official Visual Identity &amp; Aesthetics
                </h3>
                <p className="text-xs text-[#70685E]">
                  Authoritative design language across the entire application
                </p>
              </div>
            </div>

            <Badge variant="navy" size="sm">
              Single Official Design System
            </Badge>
          </div>

          {/* Authoritative Alexandria Theme Card */}
          <div className="p-5 rounded-md border border-[#1A365D] bg-[#FAF8F3] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <span className="font-serif font-bold text-[#1F1B16] text-base">
                    Alexandria Editorial Theme
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#1A365D] text-white">
                    Official Style
                  </span>
                </div>
                <p className="text-xs text-[#70685E] mt-1 leading-relaxed">
                  Clean editorial design inspired by classic typography and clear parchment styling for focused, distraction-free interview practice.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded bg-[#EBF4EE] border border-[#C2E0C6] text-[#235E3B] text-xs font-semibold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active &amp; Enforced</span>
              </div>
            </div>

            {/* Swatches Bar */}
            <div className="pt-3 border-t border-[#E5E0D5] flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded border border-[#E5E0D5] shadow-xs" style={{ backgroundColor: '#F8F6F0' }} />
                <span className="text-[11px] text-[#70685E]">Canvas (#F8F6F0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded border border-[#E5E0D5] shadow-xs" style={{ backgroundColor: '#FFFDF9' }} />
                <span className="text-[11px] text-[#70685E]">Surface (#FFFDF9)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded shadow-xs" style={{ backgroundColor: '#1A365D' }} />
                <span className="text-[11px] text-[#70685E]">Academic Navy (#1A365D)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded shadow-xs" style={{ backgroundColor: '#8C6E54' }} />
                <span className="text-[11px] text-[#70685E]">Aged Bronze (#8C6E54)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded shadow-xs" style={{ backgroundColor: '#235E3B' }} />
                <span className="text-[11px] text-[#70685E]">Verification Green (#235E3B)</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Save & Logout Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D5]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] text-[#9A421A] hover:bg-[#FBE8DB] text-xs font-semibold transition-colors"
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
            Commit Changes
          </GradientButton>
        </div>
      </form>

      {/* Test Reminder Preview Modal */}
      {showPreviewModal && testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="max-w-xl w-full rounded-lg bg-[#FFFDF9] border border-[#E5E0D5] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <div className="flex items-center gap-2 text-[#1A365D] font-bold text-sm font-serif">
                <Sparkles className="w-4 h-4 text-[#8C6E54]" />
                <span>Proactive Practice Reminder Dispatched</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-[#70685E] hover:text-[#1F1B16] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                <span className="text-[#70685E]">Recipient:</span>
                <span className="font-mono text-[#1F1B16] font-bold">{testResult.recipient}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                <span className="text-[#70685E]">Delivery Mode:</span>
                <span className="font-mono text-[#1A365D]">{testResult.deliveryMode}</span>
              </div>
              {testResult.deliveryMode?.includes('development') && (
                <div className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[11px] text-[#70685E]">
                  ℹ️ <strong>Development Mode:</strong> Dispatched and audited to SQLite (<code className="text-[#1A365D]">reminder_logs</code>). Operates without external SMTP credentials.
                </div>
              )}
              <div className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                <span className="text-[#70685E] block">Subject:</span>
                <span className="text-[#1F1B16] font-bold block">{testResult.subject}</span>
              </div>
              <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                <span className="text-[#70685E] block font-semibold">Message Preview:</span>
                <p className="text-[#1F1B16] whitespace-pre-line font-sans leading-relaxed">
                  {testResult.bodyPreview}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D5]">
              <span className="text-[11px] text-[#235E3B] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified via FastAPI background loop</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 rounded-md bg-[#1B2A4A] text-white text-xs font-semibold hover:bg-[#142038]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
