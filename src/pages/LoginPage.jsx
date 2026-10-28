import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Mic, 
  X, 
  KeyRound, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState('candidate'); // 'candidate' | 'recruiter'
  
  // Animation & Feedback States
  const [authStatus, setAuthStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Password Reset Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Extract redirect query parameter if present
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/dashboard';

  const triggerErrorShake = (msg) => {
    setAuthStatus('error');
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      triggerErrorShake('Please enter both your email address and password.');
      return;
    }

    setAuthStatus('loading');
    setErrorMessage('');

    try {
      await login(email, password);
      setAuthStatus('success');
      setTimeout(() => {
        navigate(redirectPath);
      }, 650);
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      triggerErrorShake(msg);
    }
  };

  const handleDemoLogin = async () => {
    setAuthStatus('loading');
    setErrorMessage('');

    try {
      await loginAsDemo();
      setAuthStatus('success');
      setTimeout(() => {
        navigate(redirectPath);
      }, 650);
    } catch (err) {
      triggerErrorShake('Could not launch demo sandbox. Please try again.');
    }
  };

  const handleAutoFillDemo = () => {
    setEmail('candidate@example.com');
    setPassword('password123');
    setShowForgotModal(false);
    setErrorMessage('');
    setAuthStatus('idle');
  };

  const handleSendReset = (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
  };

  // SVG Radial Gauge Calculations for 92% readiness
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (0.92 * circumference);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. LEFT COLUMN: INTERACTIVE SIMULATION & CRAFT MOTIVATION      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-gradient-to-br from-[#0F172A] via-[#111E38] to-[#0A192F] relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
        
        {/* Subtle Ambient Lighting Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Brand */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <span className="text-sm font-bold tracking-wider">TP</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">TalentPath</span>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Calibration Active
              </p>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Session</span>
          </span>
        </div>

        {/* Centerpiece: Interactive Mock Interview Simulation Card */}
        <div className="my-8 lg:my-auto relative z-10 max-w-lg mx-auto w-full">
          <div className={`p-6 sm:p-7 rounded-2xl bg-slate-900/80 border transition-all duration-300 backdrop-blur-md shadow-2xl ${
            authStatus === 'success' 
              ? 'border-emerald-500/50 shadow-emerald-500/20' 
              : 'border-slate-800/90 hover:border-slate-700'
          }`}>
            
            {/* Step Progress Pills */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span
                    key={step}
                    className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                      step === 2
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/40'
                        : step < 2
                        ? 'bg-slate-800 text-emerald-400'
                        : 'bg-slate-800/60 text-slate-500'
                    }`}
                  >
                    {step < 2 ? '✓' : step}
                  </span>
                ))}
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Question 2 of 5
              </span>
            </div>

            {/* Question Text Prompt */}
            <div className="space-y-1.5 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Technical Calibration • Distributed Systems
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-white leading-snug">
                “How do you optimize an application for high-throughput reads?”
              </h2>
            </div>

            {/* Live Audio Waveform & Speech Visualizer */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <span>Speech Evaluation</span>
              </div>

              {/* Animated Waveform Bars */}
              <div className="flex items-center gap-1 h-6">
                {[4, 12, 18, 8, 22, 14, 20, 10, 16, 6].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${h}px`,
                      animation: `pulse 1.2s ease-in-out infinite ${i * 0.12}s`
                    }}
                    className="w-1 rounded-full bg-emerald-400/90"
                  />
                ))}
              </div>
            </div>

            {/* Live Readiness Gauge & Key Points */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 72 72">
                    <circle
                      cx="36"
                      cy="36"
                      r={radius}
                      className="text-slate-800"
                      strokeWidth="5"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="36"
                      cy="36"
                      r={radius}
                      className="text-emerald-400 transition-all duration-1000 ease-out"
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-white">92%</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Readiness Match</span>
                  <span className="text-[11px] text-slate-400">Strong Technical Depth</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                <span>Cache-Aside Pattern</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Quotation */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 text-center lg:text-left">
          <blockquote className="text-xs sm:text-sm text-slate-300 italic font-medium leading-relaxed">
            “Interviews are not tests of memory. They are conversations about your craft.”
          </blockquote>
          <cite className="block text-[11px] text-slate-500 not-italic uppercase tracking-widest mt-1 font-semibold">
            — Candidate Growth Journal
          </cite>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. RIGHT COLUMN: CLEAN ORFACTOR-INSPIRED AUTHENTICATION PORTAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white text-slate-900 relative">
        <div className={`w-full max-w-md space-y-6 transition-transform ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>

          {/* Role Switcher Pill */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveRole('candidate')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeRole === 'candidate'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Candidate Portal
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('recruiter')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeRole === 'recruiter'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Recruiter / Admin
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome Back 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in to access your interview cockpit and readiness roadmap.
            </p>
          </div>

          {/* Error Pill (Tactile Slide-Down) */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="text-[11px] font-bold text-rose-800 hover:underline shrink-0 cursor-pointer"
              >
                Auto-fill Demo
              </button>
            </div>
          )}

          {/* 1-Click Demo Fast Track */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={authStatus === 'loading' || authStatus === 'success'}
            className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 flex items-center justify-between transition-all group cursor-pointer hover:border-slate-300"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                  Instant Demo Access
                </span>
                <span className="text-[10px] text-slate-500">
                  Pre-configured mock interviews, resume diagnostic & roadmap
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center group-hover:translate-x-0.5 transition-transform">
              Enter →
            </span>
          </button>

          {/* Subtle Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200"></div>
            <span className="absolute px-3 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
              or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="praneeth@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button with Dynamic Success/Failure Animations */}
            <button
              type="submit"
              disabled={authStatus === 'loading' || authStatus === 'success'}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] ${
                authStatus === 'success'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/30'
              }`}
            >
              {authStatus === 'loading' && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {authStatus === 'success' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Authenticated! Entering Cockpit...</span>
                </>
              )}
              {authStatus !== 'loading' && authStatus !== 'success' && (
                <>
                  <span>Sign In to Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link
              to={`/signup${location.search}`}
              className="text-indigo-600 font-bold hover:underline"
            >
              Create Account
            </Link>
          </p>

        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. PASSWORD RECOVERY MODAL (REPLACES DISABLED WARNING)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-slate-900 relative">
            
            <button
              onClick={() => {
                setShowForgotModal(false);
                setResetSent(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Reset Password</h3>
                <p className="text-xs text-slate-500">Restore your TalentPath candidate account access.</p>
              </div>
            </div>

            {resetSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reset Instructions Dispatched!</span>
                </div>
                <p className="leading-relaxed">
                  We've sent recovery steps to <strong className="font-semibold text-emerald-950">{resetEmail}</strong>. Check your inbox to set a new password.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAutoFillDemo}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Or Auto-Fill Demo Credentials & Sign In Now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="praneeth@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Send Reset Instructions
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoFillDemo}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Fill Demo Credentials (1-Click)</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Shake Keyframe Injection */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>

    </div>
  );
}
