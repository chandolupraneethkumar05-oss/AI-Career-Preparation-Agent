import React, { createContext, useContext, useState, useEffect } from 'react';
import { QUESTION_BANK, MOCK_RECENT_INTERVIEWS } from '../data/mockData';
import { evaluateAnswer } from '../utils/evaluator';

const InterviewContext = createContext(null);

const STORAGE_INTERVIEWS_KEY = 'interview_ai_history';

export function InterviewProvider({ children }) {
  // Setup preferences
  const [setup, setSetup] = useState({
    targetRole: 'Machine Learning Engineer',
    interviewType: 'Technical',
    difficulty: 'Intermediate',
    resumeFileName: 'Alex_Rivera_Resume.pdf',
    jobDescription: ''
  });

  // Active interview session state
  const [session, setSession] = useState({
    active: false,
    questions: [],
    currentIndex: 0,
    answers: [],
    currentDifficulty: 'Intermediate',
    adaptiveEvent: null, // { type: 'escalation' | 'reinforcement' | 'standard', message: '...' }
    isFinished: false,
    summaryResult: null
  });

  // Recent interviews history
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INTERVIEWS_KEY);
      return saved ? JSON.parse(saved) : MOCK_RECENT_INTERVIEWS;
    } catch {
      return MOCK_RECENT_INTERVIEWS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_INTERVIEWS_KEY, JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Update setup parameters
  const updateSetup = (fields) => {
    setSetup(prev => ({ ...prev, ...fields }));
  };

  // Start new interview with configured settings
  const startInterview = (overrideSetup = null) => {
    const config = overrideSetup || setup;
    const roleQuestions = QUESTION_BANK[config.targetRole] || QUESTION_BANK['Machine Learning Engineer'];
    let selectedQuestions = roleQuestions[config.interviewType] || roleQuestions['Technical'] || [];
    
    if (selectedQuestions.length === 0) {
      selectedQuestions = roleQuestions['Technical'] || [];
    }

    // Clone questions and ensure difficulty is labeled
    const sessionQuestions = selectedQuestions.slice(0, 5).map(q => ({
      ...q,
      currentDifficulty: q.difficulty || config.difficulty || 'Intermediate'
    }));

    setSession({
      active: true,
      questions: sessionQuestions,
      currentIndex: 0,
      answers: [],
      currentDifficulty: config.difficulty || 'Intermediate',
      adaptiveEvent: null,
      isFinished: false,
      summaryResult: null
    });
  };

  // Submit answer for the current question
  const submitCurrentAnswer = (answerText) => {
    const currentQ = session.questions[session.currentIndex];
    if (!currentQ) return null;

    const evaluation = evaluateAnswer(
      currentQ,
      answerText,
      setup.targetRole,
      setup.interviewType,
      session.currentDifficulty
    );

    const record = {
      questionId: currentQ.id,
      question: currentQ.question,
      category: currentQ.category,
      difficulty: session.currentDifficulty,
      answerText,
      evaluation
    };

    const newAnswers = [...session.answers, record];
    let nextDifficulty = session.currentDifficulty;
    let adaptiveEvent = null;

    // ADAPTIVE DIFFICULTY LOGIC BASED ON PREVIOUS ANSWER SCORE
    const score = evaluation.scores.overall;

    if (score >= 8.0) {
      nextDifficulty = 'Advanced';
      adaptiveEvent = {
        type: 'escalation',
        previousScore: score,
        title: '⚡ Adaptive Escalation Triggered',
        badge: 'Higher Difficulty',
        message: `Outstanding response (${score}/10). The AI Agent has escalated the difficulty to Advanced to test deeper architectural and edge-case mastery.`
      };
    } else if (score < 6.5) {
      nextDifficulty = 'Beginner';
      adaptiveEvent = {
        type: 'reinforcement',
        previousScore: score,
        title: '🎯 Adaptive Reinforcement Triggered',
        badge: 'Foundational Check',
        message: `Conceptual gap detected (${score}/10). The AI Agent has adapted the next question to verify your core foundational principles before progressing.`
      };
    } else {
      nextDifficulty = 'Intermediate';
      adaptiveEvent = {
        type: 'standard',
        previousScore: score,
        title: '● Calibrated Standard Pacing',
        badge: 'On Track',
        message: `Solid performance (${score}/10). Maintaining calibrated intermediate difficulty.`
      };
    }

    // Modify or annotate subsequent questions with the new adaptive difficulty
    let newQuestions = [...session.questions];
    if (session.currentIndex + 1 < newQuestions.length) {
      newQuestions[session.currentIndex + 1] = {
        ...newQuestions[session.currentIndex + 1],
        currentDifficulty: nextDifficulty,
        adaptiveTriggered: adaptiveEvent.type !== 'standard'
      };
    }

    // If follow-up suggested and not yet added
    if (evaluation.isAdaptiveFollowUpSuggested && evaluation.followUpQuestion && !currentQ.isFollowUp && newQuestions.length < 6) {
      const followUpItem = {
        id: `${currentQ.id}_adaptive_probe`,
        question: `[Adaptive ${nextDifficulty} Follow-up] ${evaluation.followUpQuestion}`,
        category: `Adaptive Probe: ${currentQ.category}`,
        idealKeywords: currentQ.idealKeywords || ['architecture', 'tradeoffs'],
        difficulty: nextDifficulty,
        currentDifficulty: nextDifficulty,
        isFollowUp: true,
        adaptiveTriggered: true
      };
      newQuestions.splice(session.currentIndex + 1, 0, followUpItem);
    }

    setSession(prev => ({
      ...prev,
      questions: newQuestions,
      answers: newAnswers,
      currentDifficulty: nextDifficulty,
      adaptiveEvent
    }));

    return evaluation;
  };

  // Move to next question or conclude interview
  const advanceQuestion = () => {
    const nextIdx = session.currentIndex + 1;
    if (nextIdx < session.questions.length) {
      setSession(prev => ({
        ...prev,
        currentIndex: nextIdx
      }));
      return false; // More questions remaining
    } else {
      completeInterview();
      return true; // Finished
    }
  };

  const completeInterview = () => {
    const answers = session.answers;
    if (answers.length === 0) return null;

    let totalTech = 0;
    let totalRel = 0;
    let totalClarity = 0;
    let totalStruct = 0;
    let totalConf = 0;
    let totalOverall = 0;

    answers.forEach(a => {
      const sc = a.evaluation.scores;
      totalTech += sc.technicalKnowledge;
      totalRel += sc.relevance;
      totalClarity += sc.clarity;
      totalStruct += sc.structure;
      totalConf += sc.confidence;
      totalOverall += sc.overall;
    });

    const count = answers.length;
    const finalScores = {
      overall: Math.round((totalOverall / count) * 10),
      technicalKnowledge: Math.round((totalTech / count) * 10),
      relevance: Math.round((totalRel / count) * 10),
      clarity: Math.round((totalClarity / count) * 10),
      structure: Math.round((totalStruct / count) * 10),
      confidence: Math.round((totalConf / count) * 10)
    };

    const allStrengths = Array.from(new Set(answers.flatMap(a => a.evaluation.strengths))).slice(0, 4);
    const allImprovements = Array.from(new Set(answers.flatMap(a => a.evaluation.areasToImprove))).slice(0, 3);

    let finalRecommendation = 'Focus on structuring your answers using real-world metrics, and deepen your explanation of system failure modes.';
    if (finalScores.overall >= 85) {
      finalRecommendation = 'Outstanding performance! You are performing at a senior candidate level. Focus next on executive communication and high-scale architecture tradeoffs.';
    } else if (finalScores.overall < 70) {
      finalRecommendation = 'Recommend revisiting foundational concepts and preparing structured project stories using the STAR method.';
    }

    const summaryResult = {
      role: setup.targetRole,
      type: setup.interviewType,
      difficulty: setup.difficulty,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      scores: finalScores,
      strengths: allStrengths,
      areasToImprove: allImprovements,
      aiRecommendation: finalRecommendation,
      answersCount: answers.length
    };

    setSession(prev => ({
      ...prev,
      isFinished: true,
      summaryResult
    }));

    // Save to history
    const historyItem = {
      id: `int-${Date.now()}`,
      role: setup.targetRole,
      type: setup.interviewType,
      date: 'Just now',
      score: finalScores.overall,
      questionsCount: answers.length,
      status: 'Completed',
      feedbackSummary: finalRecommendation
    };

    setHistory(prev => [historyItem, ...prev]);

    return summaryResult;
  };

  const resetInterview = () => {
    setSession({
      active: false,
      questions: [],
      currentIndex: 0,
      answers: [],
      currentDifficulty: setup.difficulty || 'Intermediate',
      adaptiveEvent: null,
      isFinished: false,
      summaryResult: null
    });
  };

  return (
    <InterviewContext.Provider
      value={{
        setup,
        updateSetup,
        session,
        startInterview,
        submitCurrentAnswer,
        advanceQuestion,
        completeInterview,
        resetInterview,
        history
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
