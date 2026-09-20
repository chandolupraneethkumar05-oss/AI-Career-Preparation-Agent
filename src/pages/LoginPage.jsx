import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bot, Sparkles, Mail, Lock, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Extract redirect query parameter if present
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    await login(email, password);
    navigate(redirectPath);
  };

  const handleDemoLogin = async () => {
    setError('');
    await loginAsDemo();
    navigate(redirectPath);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#1F1B16] flex flex-col justify-center items-center px-4 py-12 relative font-sans">
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-10 h-10 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white shadow-xs">
          <span className="font-serif font-bold text-lg text-white">T</span>
        </div>
        <div>
          <span className="text-xl font-serif font-bold tracking-tight text-[#1F1B16]">
            TalentPath
          </span>
          <p className="editorial-overline text-[10px]">AI Career Preparation</p>
        </div>
      </Link>

      {/* Main Login Card */}
      <GlassCard className="w-full max-w-md p-8 border-[#E5E0D5] shadow-xs relative bg-[#FFFDF9]">
        <div className="text-center mb-6">
          <span className="editorial-overline">SIGN IN TO YOUR ACCOUNT</span>
          <h1 className="text-2xl font-serif font-bold text-[#1F1B16] tracking-tight mt-1">
            Candidate Sign In
          </h1>
          <p className="text-xs text-[#70685E] mt-1.5">
            Sign in to continue your personalized interview practice and evaluations.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] text-[#9A421A] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#9A421A]" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Candidate Fast Track */}
        <div className="mb-6 p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-serif font-bold text-[#1A365D] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8C6E54]" /> Quick Demo Access
            </span>
            <span className="text-[10px] uppercase font-bold text-[#70685E] bg-[#F2EFE9] px-2 py-0.5 rounded border border-[#E5E0D5]">
              Immediate
            </span>
          </div>
          <p className="text-xs text-[#70685E] mb-3 leading-relaxed">
            Instant entry to the candidate demo portfolio, mock sessions, ATS scanner, and readiness index.
          </p>
          <GradientButton
            variant="primary"
            size="sm"
            onClick={handleDemoLogin}
            loading={isLoading}
            icon={UserCheck}
            className="w-full text-xs"
          >
            Sign In as Demo Candidate
          </GradientButton>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[#E5E0D5]"></div>
          <span className="flex-shrink mx-4 text-[10px] text-[#70685E] uppercase font-bold tracking-widest">
            or sign in with email
          </span>
          <div className="flex-grow border-t border-[#E5E0D5]"></div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#70685E]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.rivera@career-ai.dev"
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] placeholder-[#70685E]/50 text-sm focus:outline-none focus:border-[#1A365D]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#70685E]">
                Password
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); handleDemoLogin(); }} className="text-xs text-[#1A365D] hover:underline">
                Recover credential?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#70685E]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] placeholder-[#70685E]/50 text-sm focus:outline-none focus:border-[#1A365D]"
              />
            </div>
          </div>

          <GradientButton
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            icon={ArrowRight}
            className="w-full mt-2 text-sm"
          >
            Sign In →
          </GradientButton>
        </form>

        <p className="text-center text-xs text-[#70685E] mt-6">
          Don't have an account?{' '}
          <Link
            to={`/signup${location.search}`}
            className="text-[#1A365D] font-semibold hover:underline"
          >
            Create Account
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
