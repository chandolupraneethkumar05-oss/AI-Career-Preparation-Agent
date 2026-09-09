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
    <div className="min-h-screen bg-[#0F1026] text-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-r from-cyan-600/15 via-purple-600/20 to-pink-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#06B6D4] p-0.5 shadow-lg shadow-purple-900/40">
          <div className="w-full h-full bg-[#0F1026] rounded-[10px] flex items-center justify-center">
            <Bot className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-cyan-300 bg-clip-text text-transparent">
            InterviewAI
          </span>
          <p className="text-xs text-[#A5B4FC]/80 font-medium">AI Career Preparation Agent</p>
        </div>
      </Link>

      <GlassCard className="w-full max-w-md p-8 border-purple-500/30 shadow-2xl relative">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create Your Account 🚀
          </h1>
          <p className="text-sm text-[#A5B4FC] mt-2">
            Start your personalized AI career preparation journey today.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-white placeholder-[#A5B4FC]/40 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.rivera@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-white placeholder-[#A5B4FC]/40 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-white placeholder-[#A5B4FC]/40 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A5B4FC] mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1026] border border-purple-500/30 text-white placeholder-[#A5B4FC]/40 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              />
            </div>
          </div>

          <GradientButton
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            icon={ArrowRight}
            className="w-full mt-3"
          >
            Create Account
          </GradientButton>
        </form>

        <p className="text-center text-xs text-[#A5B4FC] mt-6">
          Already have an account?{' '}
          <Link
            to={`/login${location.search}`}
            className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
