import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Send,
  Zap,
  Target,
  Brain
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import CircularScore from '../components/CircularScore';
import { useAuth } from '../context/AuthContext';
import { MOCK_DAILY_CHALLENGES } from '../data/mockData';

export default function DailyChallengePage() {
  const navigate = useNavigate();
  const { user, addXP, updateUser } = useAuth();

  const [selectedChallengeId, setSelectedChallengeId] = useState('dc-0');
  const challenge = MOCK_DAILY_CHALLENGES.find((c) => c.id === selectedChallengeId) || MOCK_DAILY_CHALLENGES[0];

  const [hasStarted, setHasStarted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(challenge.timeLimitMinutes * 60);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      return localStorage.getItem('interview_ai_daily_challenge_completed') === 'true';
    } catch {
      return false;
    }
  });
  const [challengeResult, setChallengeResult] = useState(null);

  // Reset timer on challenge switch
  useEffect(() => {
    setSecondsRemaining(challenge.timeLimitMinutes * 60);
    setHasStarted(false);
    setUserAnswer('');
  }, [challenge]);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (hasStarted && !isCompleted && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, isCompleted, secondsRemaining]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  const getSampleAnswer = () => {
    if (challenge.id === 'dc-0') {
      return 'Supervised learning trains models on labeled input-output pairs (features X and ground truth targets Y), learning an explicit mapping function to predict targets on unseen data. A real-world production example is customer churn prediction where past cancellation labels guide training. Unsupervised learning discovers latent structures, clusters, or probability densities in unlabeled data without predefined ground truth. A production example is customer segmentation via K-Means or PCA to discover organic purchasing cohorts. Label availability dictates the approach: supervised models require costly human annotation, whereas unsupervised models leverage high-volume ambient logs.';
    }
    if (challenge.id === 'dc-1') {
      return 'Think of Random Forest like a jury of friendly detectives. If you ask just one detective to solve a mystery, they might have personal biases and make mistakes (that is a single decision tree). But in a Random Forest, you ask 100 detectives who each inspect a slightly different clue. At the end, everyone votes on the answer. Because the majority vote combines many diverse opinions, the group decision is much more accurate and less prone to mistakes.';
    }
    return 'The CAP Theorem states that a distributed data store can guarantee at most two out of three properties: Consistency (every read receives the most recent write), Availability (every non-failing node returns a response), and Partition Tolerance (the system functions despite arbitrary network drops). In an instant messaging app, we choose AP (Availability + Partition tolerance) so users can always send and receive messages even during brief network splits, with eventual consistency. In a banking ledger, we strictly choose CP (Consistency + Partition tolerance) because balance transfers must never allow double-spending even if an operation fails or times out during a partition.';
  };

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    const newStreak = (user?.streak || 7) + 1;

    // Award XP and maintain streak
    addXP(challenge.xpReward);
    updateUser({ streak: newStreak });

    // Persist to localStorage
    try {
      localStorage.setItem('interview_ai_daily_challenge_completed', 'true');
      localStorage.setItem('interview_ai_last_challenge_date', new Date().toISOString().split('T')[0]);
      localStorage.setItem('interview_ai_streak', String(newStreak));
    } catch (err) {
      console.error(err);
    }

    let dynamicFeedback = 'Excellent answer! You demonstrated solid command of foundational machine learning principles with clear real-world examples and trade-offs.';
    if (challenge.id === 'dc-0') {
      dynamicFeedback = 'Outstanding explanation! Directly contrasting labeled ground-truth supervision with latent clustering and linking the methodology to data annotation costs demonstrated high technical articulation.';
    } else if (challenge.id === 'dc-1') {
      dynamicFeedback = 'Excellent intuitive breakdown! Using the voting analogy clearly demystified the ensemble concept without getting bogged down in bagging mathematics.';
    } else if (challenge.id === 'dc-2') {
      dynamicFeedback = 'Spot-on CAP analysis! The contrast between eventual consistency in messaging (AP) versus atomic double-spend prevention in banking (CP) is the exact industry mental model interviewers look for.';
    }

    const score = 8.8;
    setChallengeResult({
      score,
      xp: challenge.xpReward,
      feedback: dynamicFeedback
    });
    setIsCompleted(true);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/50 border border-orange-500/40 text-orange-300 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 fill-orange-400" />
          <span>Daily Habit Builder • +{challenge.xpReward} XP</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          TODAY'S CHALLENGE 🎯
        </h1>
        <p className="text-sm text-[#A5B4FC]">
          Solve one high-frequency conceptual challenge daily to keep your technical articulation sharp.
        </p>
      </div>

      {/* Challenge Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {MOCK_DAILY_CHALLENGES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedChallengeId(c.id);
              setIsCompleted(false);
              setChallengeResult(null);
            }}
            className={`
              px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all
              ${selectedChallengeId === c.id
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-md'
                : 'bg-[#191A3A] text-[#A5B4FC] hover:text-white border border-purple-500/20'
              }
            `}
          >
            {c.title.split(' ')[0]} {c.title.split(' ')[1]}...
          </button>
        ))}
      </div>

      {/* Main Challenge Card */}
      <GlassCard className="p-8 border-orange-500/30 bg-gradient-to-b from-[#191A3A] to-[#141C34] space-y-6">
        {/* Meta Specs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{challenge.category}</span>
            <span className="text-xs text-amber-400">{'★'.repeat(challenge.stars)}</span>
            <Badge variant="amber" size="sm">{challenge.difficulty}</Badge>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1 text-cyan-300">
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <Zap className="w-4 h-4" />
              <span>+{challenge.xpReward} XP</span>
            </div>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            "{challenge.title}"
          </h2>
          <p className="text-sm text-[#A5B4FC] leading-relaxed p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20">
            {challenge.prompt}
          </p>
        </div>

        {/* Challenge Interactive Execution */}
        {!hasStarted && !isCompleted ? (
          <div className="text-center py-6 space-y-4">
            <p className="text-xs text-[#A5B4FC]">
              Once you click start, the 5-minute timer will commence. Type your response and submit for instant evaluation.
            </p>
            <GradientButton
              variant="primary"
              size="lg"
              onClick={handleStart}
              icon={Sparkles}
            >
              Start Challenge Now
            </GradientButton>
          </div>
        ) : !isCompleted ? (
          <div className="space-y-4">
            <textarea
              rows={6}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your explanation here... Focus on structured definitions and production examples."
              className="w-full p-4 rounded-xl bg-[#0F1026] border border-purple-500/30 text-sm text-white placeholder-[#A5B4FC]/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => setUserAnswer(getSampleAnswer())}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>⚡ Insert High-Scoring Sample Response</span>
              </button>

              <GradientButton
                variant="pink"
                size="md"
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                icon={Send}
              >
                Submit Answer
              </GradientButton>
            </div>
          </div>
        ) : (
          /* Completion State */
          <div className="p-6 rounded-2xl bg-[#0F1026]/80 border border-emerald-500/40 space-y-6 text-center animate-in fade-in">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-white">Challenge Complete 🎉</h3>
              <div className="flex items-center gap-3 pt-1">
                <Badge variant="green" size="md">+{challengeResult?.xp || challenge.xpReward} XP Awarded</Badge>
                <Badge variant="amber" size="md">🔥 Streak Maintained: {(user?.streak || 7)} Days</Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <CircularScore
                score={Math.round((challengeResult?.score || 8.8) * 10)}
                size={85}
                strokeWidth={7}
                color="#22C55E"
                label="Quality"
              />
              <div className="text-center sm:text-left max-w-sm">
                <p className="text-xs font-bold text-white mb-1">AI Evaluator Feedback</p>
                <p className="text-xs text-[#A5B4FC] leading-relaxed">
                  {challengeResult?.feedback || 'Outstanding conceptual articulation! The contrast between ground truth labels and unsupervised latent discovery was crisp and technically rigorous.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-4">
              <GradientButton
                variant="secondary"
                size="md"
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </GradientButton>
              <GradientButton
                variant="primary"
                size="md"
                onClick={() => navigate('/interview-setup')}
                icon={ArrowRight}
              >
                Start Mock Interview →
              </GradientButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
