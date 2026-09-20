import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bot, User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/interview-setup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    await signup(name, email, password);
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

      <GlassCard className="w-full max-w-md p-8 border-[#E5E0D5] shadow-xs relative bg-[#FFFDF9]">
        <div className="text-center mb-6">
          <span className="editorial-overline">CREATE YOUR ACCOUNT</span>
          <h1 className="text-2xl font-serif font-bold text-[#1F1B16] tracking-tight mt-1">
            Register Candidate Account
          </h1>
          <p className="text-xs text-[#70685E] mt-1.5">
            Create your account to start your personalized interview preparation.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] text-[#9A421A] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#9A421A]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
              Candidate Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#70685E]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chandolu Praneeth Kumar"
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] placeholder-[#70685E]/50 text-sm focus:outline-none focus:border-[#1A365D]"
              />
            </div>
          </div>

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
                placeholder="candidate@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] placeholder-[#70685E]/50 text-sm focus:outline-none focus:border-[#1A365D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
              Account Password
            </label>
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

          <div>
            <label className="block text-xs font-semibold text-[#70685E] mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#70685E]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            className="w-full mt-3 text-sm"
          >
            Create Account →
          </GradientButton>
        </form>

        <p className="text-center text-xs text-[#70685E] mt-6">
          Already have an account?{' '}
          <Link
            to={`/login${location.search}`}
            className="text-[#1A365D] font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
