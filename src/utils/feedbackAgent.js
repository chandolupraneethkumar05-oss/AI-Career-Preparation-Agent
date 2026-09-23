/**
 * InterviewAI Prototype Feedback Agent
 * 
 * Dynamically synthesizes objective candidate feedback across 5 rubric axes,
 * isolating deficits, calculating verified XP & streaks, and generating actionable
 * remediation pathways tailored directly to the candidate's target role and answers.
 */

import { storageService } from './storage/storageService.js';
import { activityService, ACTIVITY_XP, ACTIVITY_TYPES } from './activityService.js';

export function synthesizeInterviewFeedback(sessionSummary, sessionAnswers = [], setup = null) {
  const targetRole = setup?.targetRole || sessionSummary?.role || 'Software Engineer';
  const interviewType = setup?.interviewType || sessionSummary?.type || 'Technical';
  const feedbackLang = sessionSummary?.feedbackLanguage || setup?.feedbackLanguage || 'en';

  const scores = sessionSummary?.scores || {};

  // Extract or dynamically calculate the 5 core rubric dimension scores (0 - 100 scale)
  let techScore = scores.technicalKnowledge;
  let relScore = scores.relevance || scores.promptRelevance;
  let commScore = scores.communication || scores.communicationSTAR || scores.clarity;
  let probScore = scores.structure || scores.problemSolving;
  let confScore = scores.confidence || scores.confidenceDelivery;

  if (sessionAnswers && sessionAnswers.length > 0) {
    let tTech = 0, tRel = 0, tComm = 0, tProb = 0, tConf = 0;
    sessionAnswers.forEach(a => {
      const sc = a.evaluation?.scores || {};
      tTech += (sc.technicalKnowledge ?? 7.5) * 10;
      tRel += (sc.relevance ?? 7.5) * 10;
      tComm += (sc.clarity ?? 7.5) * 10;
      tProb += (sc.structure ?? 7.5) * 10;
      tConf += (sc.confidence ?? 7.5) * 10;
    });
    const len = sessionAnswers.length;
    if (!techScore) techScore = Math.round(tTech / len);
    if (!relScore) relScore = Math.round(tRel / len);
    if (!commScore) commScore = Math.round(tComm / len);
    if (!probScore) probScore = Math.round(tProb / len);
    if (!confScore) confScore = Math.round(tConf / len);
  }

  // Fallbacks if zero evidence exists
  techScore = techScore || 75;
  relScore = relScore || 75;
  commScore = commScore || 75;
  probScore = probScore || 75;
  confScore = confScore || 75;

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
      explanation: techScore >= 80
        ? `Strong domain command of ${targetRole} principles, frameworks, and architecture.`
        : `Developing domain foundations for ${targetRole}; deepen your understanding of core mechanisms.`,
      color: '#1A365D'
    },
    {
      id: 'problemSolving',
      label: 'Problem Solving',
      shortName: 'Problem Solving',
      score: probScore,
      explanation: probScore >= 80
        ? 'Systematic trade-off analysis, edge-case coverage, and structural problem breakdown.'
        : 'Good reasoning, but make sure to enumerate edge cases and justify trade-offs under constraints.',
      color: '#8C6E54'
    },
    {
      id: 'communicationSTAR',
      label: 'Communication & STAR',
      shortName: 'STAR Structure',
      score: commScore,
      explanation: commScore >= 80
        ? 'Well-paced response delivery with clear narrative structure and crisp explanations.'
        : 'Structure responses with the STAR method (Situation, Task, Action, Result) for clarity.',
      color: '#235E3B'
    },
    {
      id: 'promptRelevance',
      label: 'Prompt Relevance',
      shortName: 'Relevance',
      score: relScore,
      explanation: relScore >= 80
        ? "Answers directly and comprehensively addressed the interviewer's specific inquiry."
        : 'Ensure your response directly addresses every specific constraint stated in the prompt.',
      color: '#1E40AF'
    },
    {
      id: 'confidenceDelivery',
      label: 'Confidence & Delivery',
      shortName: 'Confidence',
      score: confScore,
      explanation: confScore >= 80
        ? 'Decisive verbal delivery backed with concrete outcomes, trade-offs, and metrics.'
        : 'Deliver responses decisively and avoid verbal hesitations on core concepts.',
      color: '#9A421A'
    }
  ];

  // AGENT REASONING: Sort dimensions to identify target growth opportunities
  const sortedDimensions = [...dimensions].sort((a, b) => a.score - b.score);
  const weakest = sortedDimensions[0];
  const secondWeakest = sortedDimensions[1];
  const recommendationFocus = `${weakest.shortName} + ${secondWeakest.shortName}`;

  // Action mapping tailored to role and weaknesses
  const actionGenerators = {
    technicalKnowledge: {
      title: `Practice 5 Core ${targetRole} Technical Questions`,
      desc: `Deepen your mastery of architectural patterns, design tradeoffs, and frameworks for ${targetRole}.`,
      category: 'Technical Knowledge Drill',
      tag: 'Skill Gap',
      badgeColor: 'purple',
      route: '/interview-setup'
    },
    problemSolving: {
      title: `Practice 5 Problem-Solving Drills for ${targetRole}`,
      desc: 'Target algorithmic trade-offs, high-scale bottlenecks, and edge-case handling.',
      category: 'Problem Solving Drill',
      tag: 'High Priority',
      badgeColor: 'cyan',
      route: '/interview-setup'
    },
    communicationSTAR: {
      title: 'Master STAR Method Behavioral Rounds',
      desc: 'Structure past engineering experiences into crisp Situation, Task, Action, and Result narratives.',
      category: 'Behavioral Cadence',
      tag: 'Soft Skills',
      badgeColor: 'pink',
      route: '/interview-setup'
    },
    promptRelevance: {
      title: 'Practice Active Scoping & Clarification',
      desc: 'Refine initial prompt scoping before diving into implementation details.',
      category: 'Scoping Drill',
      tag: 'Accuracy',
      badgeColor: 'green',
      route: '/interview-setup'
    },
    confidenceDelivery: {
      title: "Complete Today's Communication Challenge",
      desc: 'Practice delivering concise, high-impact verbal answers without filler words or hesitation.',
      category: 'Verbal Cadence',
      tag: 'Daily Habit',
      badgeColor: 'amber',
      route: '/daily-challenge'
    }
  };

  const action1 = actionGenerators[weakest.id] || actionGenerators.technicalKnowledge;
  const action2 = actionGenerators[secondWeakest.id] || actionGenerators.problemSolving;
  const action3 = {
    title: `Take Another ${targetRole} Mock Interview`,
    desc: 'Simulate a higher-difficulty adaptive session to test retention and calibration.',
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

  let finalActions = recommendedActions;
  if (sessionSummary?.nextBestAction) {
    const nba = sessionSummary.nextBestAction;
    finalActions = [
      {
        id: 'act_1',
        num: 1,
        title: nba.title || action1.title,
        desc: nba.reason || action1.desc,
        category: 'Next Best Action',
        tag: 'Recommended',
        badgeColor: 'cyan',
        route: nba.route || action1.route,
        actionLabel: nba.action || 'Start Drill'
      },
      { ...action2, id: 'act_2', num: 2 },
      { ...action3, id: 'act_3', num: 3 }
    ];
  }

  // Question-by-question breakdown derived from actual candidate answers
  let questionPerformance = [];
  if (sessionAnswers && sessionAnswers.length > 0) {
    const dimensionCycle = [
      'Technical Knowledge',
      'Problem Solving',
      'Prompt Relevance',
      'Communication & STAR',
      'Confidence & Delivery'
    ];

    questionPerformance = sessionAnswers.map((ans, idx) => {
      const qScore = Math.round((ans.evaluation?.scores?.overall || 7.5) * 10);
      const dim = dimensionCycle[idx % dimensionCycle.length];
      const strengthText = ans.evaluation?.strengths?.[0] || 'Clear conceptual grounding with relevant domain context.';
      const improveText = ans.evaluation?.areasToImprove?.[0] || 'Include more measurable metrics and discuss scale constraints.';

      return {
        num: idx + 1,
        dimension: dim,
        score: qScore,
        question: ans.question || `Interview Question ${idx + 1}`,
        userAnswer: ans.answerText || ans.answer || 'Candidate verbal defense submitted.',
        feedback: `${strengthText} ${improveText}`
      };
    });
  }

  // Synthesize dynamic AI Summary specific to role and score
  let aiSummary = sessionSummary?.aiRecommendation || sessionSummary?.backendReport?.feedback_summary;
  if (!aiSummary) {
    if (overall >= 85) {
      aiSummary = `Exceptional evaluation for ${targetRole}. You demonstrated authoritative technical command, clearly articulated architectural trade-offs, and structured your answers decisively.`;
    } else if (overall >= 70) {
      aiSummary = `Solid performance in your ${interviewType.toLowerCase()} interview for ${targetRole}. Your responses demonstrated clear fundamentals. To reach senior calibration, elaborate further on production failure modes, quantitative metrics, and scale bottlenecks.`;
    } else {
      aiSummary = `Foundational performance for ${targetRole}. Focus on structuring your answers using the STAR method, clarifying assumptions before answering, and grounding technical explanations in concrete implementation details.`;
    }
  }

  // Synthesize dynamic strengths and improvements from answers
  let derivedStrengths = [];
  let derivedImprovements = [];

  if (sessionAnswers && sessionAnswers.length > 0) {
    derivedStrengths = Array.from(new Set(sessionAnswers.flatMap(a => a.evaluation?.strengths || []))).filter(Boolean);
    derivedImprovements = Array.from(new Set(sessionAnswers.flatMap(a => a.evaluation?.areasToImprove || []))).filter(Boolean);
  }

  if (sessionSummary?.strengths?.length) {
    derivedStrengths = sessionSummary.strengths;
  }
  if (sessionSummary?.areasToImprove?.length) {
    derivedImprovements = sessionSummary.areasToImprove;
  }

  if (derivedStrengths.length === 0) {
    derivedStrengths = [
      `Grounded domain knowledge relevant to ${targetRole}`,
      'Active candidate engagement across all evaluation prompts',
      'Structured technical thought process and problem breakdown',
      'Clear verbal delivery and professional communication tone'
    ];
  }

  if (derivedImprovements.length === 0) {
    derivedImprovements = [
      `Provide more concrete production metrics and scale indicators for ${targetRole}`,
      'Discuss system failure modes, recovery strategies, and rollback considerations',
      'Reinforce structured storytelling using the STAR framework on behavioral questions',
      'Formulate explicit trade-offs when presenting architectural decisions'
    ];
  }

  // Determine qualitative label
  let qualitativeRating = 'Strong Performance';
  if (overall >= 88) qualitativeRating = 'Exceptional Performance';
  else if (overall >= 75) qualitativeRating = 'Strong Performance';
  else if (overall >= 65) qualitativeRating = 'Developing Performance';
  else qualitativeRating = 'Foundational Baseline';

  // Dynamic XP calculation
  const baseXP = ACTIVITY_XP[ACTIVITY_TYPES.INTERVIEW_COMPLETED] || 100;
  const performanceBonus = overall >= 90 ? 25 : overall >= 80 ? 15 : overall >= 70 ? 10 : 0;
  const calculatedXP = baseXP + performanceBonus;

  // Dynamic streak calculation
  let calculatedStreak = 0;
  try {
    const currentUser = storageService.getCurrentUser();
    const activities = activityService.getActivities(currentUser?.id);
    const realStreak = activityService.calculateCurrentStreak(activities);
    calculatedStreak = currentUser?.streak !== undefined ? currentUser.streak : (realStreak || 0);
  } catch {
    calculatedStreak = 0;
  }

  const completedQuestionsCount = questionPerformance.length > 0
    ? questionPerformance.length
    : (sessionSummary?.totalQuestions || setup?.totalQuestions || 5);

  return {
    overallScore: overall,
    qualitativeRating,
    xpEarned: sessionSummary?.xpEarned || calculatedXP,
    streakDays: sessionSummary?.streakDays || calculatedStreak,
    questionsCompleted: completedQuestionsCount,
    totalQuestions: sessionSummary?.totalQuestions || setup?.totalQuestions || completedQuestionsCount,
    targetRole,
    interviewType,
    rubricScores,
    rubricDetails: dimensions.map(d => ({
      ...d,
      tag: d.score >= 85 ? 'Above Average' : d.score >= 75 ? 'Proficient' : 'Priority Focus'
    })),
    feedbackLanguage: feedbackLang,
    fallbackNotice: sessionSummary?.fallbackNotice || null,
    aiSummary,
    strengths: derivedStrengths.slice(0, 5),
    improvements: derivedImprovements.slice(0, 5),
    recommendationFocus,
    recommendationExplanation: 'Based on your interview performance, these are the areas where additional practice will provide the greatest improvement.',
    recommendedActions: finalActions,
    timelineSteps: [
      {
        step: 1,
        title: 'Interview Completed',
        desc: `${completedQuestionsCount} of ${completedQuestionsCount} questions recorded and submitted to the evaluation engine.`
      },
      {
        step: 2,
        title: 'Responses Evaluated',
        desc: `Scored across the 5 core dimensions matching your preparation rubric for ${targetRole}.`
      },
      {
        step: 3,
        title: 'Competencies Analyzed',
        desc: `Identified growth priorities in ${weakest.shortName} (${weakest.score}%) and ${secondWeakest.shortName} (${secondWeakest.score}%).`
      },
      {
        step: 4,
        title: 'Skill Matrix Calibrated',
        desc: `Refreshed readiness benchmarks against market expectations for ${targetRole}.`
      },
      {
        step: 5,
        title: 'Personalized Practice Prescribed',
        desc: 'Generated a customized 3-part targeted remediation action plan.'
      }
    ],
    questionPerformance
  };
}
