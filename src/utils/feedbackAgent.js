/**
 * InterviewAI Prototype Feedback Agent
 * 
 * ARCHITECTURE NOTE:
 * This module isolates the agentic reasoning and recommendation engine.
 * Currently, it calculates dimension rankings and generates targeted actions.
 * In production Phase 2, this function can be swapped to call an LLM (e.g., Gemini 2.5 Flash)
 * using structured output schema, incorporating resume history and cross-session progress.
 */

import { DEFAULT_MOCK_INTERVIEW_RESULT } from '../data/mockData';

export function synthesizeInterviewFeedback(sessionSummary, sessionAnswers = [], setup = null) {
  if (!sessionSummary && (!sessionAnswers || sessionAnswers.length === 0)) {
    return DEFAULT_MOCK_INTERVIEW_RESULT;
  }

  const base = DEFAULT_MOCK_INTERVIEW_RESULT;
  const scores = sessionSummary?.scores || {};

  // Extract or calculate the 5 core rubric dimension scores (0 - 100 scale)
  const techScore = scores.technicalKnowledge || 86;
  const relScore = scores.relevance || scores.promptRelevance || 88;
  const commScore = scores.communication || scores.communicationSTAR || scores.clarity || 84;
  const probScore = scores.structure || scores.problemSolving || 79;
  const confScore = scores.confidence || scores.confidenceDelivery || 76;
  const overall = scores.overall || Math.round((techScore + relScore + commScore + probScore + confScore) / 5);

  const rubricScores = {
    technicalKnowledge: techScore,
    problemSolving: probScore,
    communicationSTAR: commScore,
    promptRelevance: relScore,
    confidenceDelivery: confScore
  };

  const dimensions = [
    {
      id: 'technicalKnowledge',
      label: 'Technical Knowledge',
      shortName: 'Technical Depth',
      score: techScore,
      explanation: techScore >= 85
        ? 'Strong command of core concepts, algorithms, and domain terminology.'
        : 'Good foundations, but needs more depth in internal mechanisms.',
      color: '#7C3AED'
    },
    {
      id: 'problemSolving',
      label: 'Problem Solving',
      shortName: 'Problem Solving',
      score: probScore,
      explanation: probScore >= 82
        ? 'Excellent analytical reasoning and systematic trade-off handling.'
        : 'Good reasoning, but include more edge cases and trade-off analysis.',
      color: '#06B6D4'
    },
    {
      id: 'communicationSTAR',
      label: 'Communication & STAR',
      shortName: 'STAR Structure',
      score: commScore,
      explanation: commScore >= 80
        ? 'Well-structured responses with clear narrative and concise explanations.'
        : 'Structure responses with the STAR framework (Situation, Task, Action, Result).',
      color: '#A855F7'
    },
    {
      id: 'promptRelevance',
      label: 'Prompt Relevance',
      shortName: 'Relevance',
      score: relScore,
      explanation: relScore >= 85
        ? "Responses directly and comprehensively addressed the interviewer's prompt."
        : 'Focus closely on the specific constraints given in the question.',
      color: '#22C55E'
    },
    {
      id: 'confidenceDelivery',
      label: 'Confidence & Delivery',
      shortName: 'Confidence',
      score: confScore,
      explanation: confScore >= 80
        ? 'Decisive delivery backed with concrete outcomes and metrics.'
        : 'Good delivery, but answers can be more decisive and concise.',
      color: '#EC4899'
    }
  ];

  // AGENT REASONING: Sort to find the two lowest scoring dimensions
  const sortedDimensions = [...dimensions].sort((a, b) => a.score - b.score);
  const weakest = sortedDimensions[0];
  const secondWeakest = sortedDimensions[1];

  const recommendationFocus = `${weakest.shortName} + ${secondWeakest.shortName}`;

  // Action mapping based on weakest skills
  const actionGenerators = {
    technicalKnowledge: {
      title: 'Practice 5 Core Technical Questions',
      desc: 'Deepen understanding of core algorithms and architectural fundamentals.',
      category: 'Technical Knowledge Drill',
      tag: 'Skill Gap',
      badgeColor: 'purple',
      route: '/interview-setup'
    },
    problemSolving: {
      title: 'Practice 5 ML Problem-Solving Questions',
      desc: 'Target algorithmic trade-offs, edge cases, and high-scale failure modes.',
      category: 'Problem Solving Drill',
      tag: 'High Priority',
      badgeColor: 'cyan',
      route: '/interview-setup'
    },
    communicationSTAR: {
      title: 'Master STAR Method Behavioral Rounds',
      desc: 'Structure past experiences into clear Situation, Task, Action, and Result stories.',
      category: 'Behavioral Cadence',
      tag: 'Soft Skills',
      badgeColor: 'pink',
      route: '/interview-setup'
    },
    promptRelevance: {
      title: 'Practice Active Listening & Query Scoping',
      desc: 'Refine initial response scoping before diving into technical details.',
      category: 'Scoping Drill',
      tag: 'Accuracy',
      badgeColor: 'green',
      route: '/interview-setup'
    },
    confidenceDelivery: {
      title: "Complete Today's Communication Challenge",
      desc: 'Practice delivering concise, high-impact verbal answers without hesitation.',
      category: 'Verbal Cadence',
      tag: 'Daily Habit',
      badgeColor: 'amber',
      route: '/daily-challenge'
    }
  };

  const action1 = actionGenerators[weakest.id] || base.recommendedActions[0];
  const action2 = actionGenerators[secondWeakest.id] || base.recommendedActions[1];
  const action3 = {
    title: 'Take Another Technical Mock Interview',
    desc: 'Simulate a higher-difficulty adaptive round to reinforce retention.',
    category: 'Comprehensive Mock',
    tag: 'Readiness Test',
    badgeColor: 'purple',
    route: '/interview-setup'
  };

  const recommendedActions = [
    { ...action1, id: 'act_1', num: 1 },
    { ...action2, id: 'act_2', num: 2 },
    { ...action3, id: 'act_3', num: 3 }
  ];

  // Synthesize questionPerformance from sessionAnswers if available, else default
  let questionPerformance = base.questionPerformance;
  if (sessionAnswers && sessionAnswers.length > 0) {
    const dimensionCycle = [
      'Technical Knowledge',
      'Problem Solving',
      'Prompt Relevance',
      'Communication & STAR',
      'Confidence & Delivery'
    ];

    questionPerformance = sessionAnswers.map((ans, idx) => {
      const qScore = Math.round((ans.evaluation?.scores?.overall || 7.8) * 10);
      const dim = dimensionCycle[idx % dimensionCycle.length];
      const feedback = ans.evaluation?.strengths?.[0] || 'Clear conceptual grounding with relevant domain context.';

      return {
        num: idx + 1,
        dimension: dim,
        score: qScore,
        question: ans.question || `Interview Question ${idx + 1}`,
        userAnswer: ans.answerText || 'Candidate response recorded.',
        feedback: `${feedback} ${ans.evaluation?.areasToImprove?.[0] || 'Include more measurable metrics to strengthen this response.'}`
      };
    });
  }

  // Determine qualitative label
  let qualitativeRating = 'Strong Performance';
  if (overall >= 88) qualitativeRating = 'Exceptional Performance';
  else if (overall >= 75) qualitativeRating = 'Strong Performance';
  else if (overall >= 65) qualitativeRating = 'Developing Performance';
  else qualitativeRating = 'Foundational Baseline';

  return {
    overallScore: overall,
    qualitativeRating,
    xpEarned: 120,
    streakDays: 7,
    questionsCompleted: questionPerformance.length,
    totalQuestions: questionPerformance.length,
    targetRole: setup?.targetRole || sessionSummary?.role || 'Machine Learning Engineer',
    interviewType: setup?.interviewType || sessionSummary?.type || 'Technical Deep Dive',
    rubricScores,
    rubricDetails: dimensions.map(d => ({
      ...d,
      tag: d.score >= 85 ? 'Above Average' : d.score >= 78 ? 'Proficient' : 'Priority Focus'
    })),
    aiSummary: sessionSummary?.aiRecommendation
      ? `You demonstrated solid command of ${setup?.targetRole || 'engineering'} principles. Your answers were relevant and technically grounded. ${sessionSummary.aiRecommendation}`
      : base.aiSummary,
    strengths: sessionSummary?.strengths?.length
      ? sessionSummary.strengths
      : base.strengths,
    improvements: sessionSummary?.areasToImprove?.length
      ? sessionSummary.areasToImprove
      : base.improvements,
    recommendationFocus,
    recommendationExplanation: `Based on your interview performance, these are the areas where additional practice will provide the greatest improvement.`,
    recommendedActions,
    timelineSteps: [
      {
        step: 1,
        title: 'Interview Completed',
        desc: `${questionPerformance.length} of ${questionPerformance.length} questions recorded and submitted to the evaluation engine.`
      },
      {
        step: 2,
        title: 'Responses Evaluated',
        desc: `Scored across the 5 core dimensions matching your preparation rubric.`
      },
      {
        step: 3,
        title: 'Weaknesses Identified',
        desc: `Isolated deficits in ${weakest.shortName} (${weakest.score}%) and ${secondWeakest.shortName} (${secondWeakest.score}%).`
      },
      {
        step: 4,
        title: 'Skill Gap Updated',
        desc: `Refreshed candidate readiness benchmarks against market standards.`
      },
      {
        step: 5,
        title: 'Personalized Practice Recommended',
        desc: `Generated a customized 3-part remediation action plan.`
      }
    ],
    questionPerformance
  };
}
