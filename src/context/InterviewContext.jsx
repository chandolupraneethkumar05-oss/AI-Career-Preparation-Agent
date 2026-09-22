import React, { createContext, useContext, useState, useEffect } from 'react';
import { QUESTION_BANK } from '../data/mockData';
import { evaluateAnswer } from '../utils/evaluator';
import { storageService } from '../utils/storage/storageService';
import { activityService, ACTIVITY_TYPES } from '../utils/activityService';
import { analyzeSkillGaps } from '../utils/skillGapAnalyzer';
import { achievementService } from '../utils/achievementService';
import { interviewApi } from '../services/interviewApi';
import { initializeRubricMatrix, getCompanyPlaybook } from '../data/companyPlaybooks';

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  // Setup preferences
  const initialUser = storageService.getCurrentUser();
  const getActiveUserId = () => storageService.getCurrentUser()?.id || 'usr_candidate';

  const [setup, setSetup] = useState({
    targetRole: initialUser?.targetRole || initialUser?.role || 'Machine Learning Engineer',
    interviewType: 'Technical',
    difficulty: 'Intermediate',
    companyPlaybook: 'general',
    resumeFileName: initialUser?.name ? `${initialUser.name.replace(/\s+/g, '_')}_Resume.pdf` : 'Candidate_Resume.pdf',
    jobDescription: '',
    interviewLanguage: 'en',
    feedbackLanguage: initialUser?.feedbackLanguage || 'en',
    interviewMode: 'text', // 'text' | 'video' | 'face_to_face'
    interviewerPersona: 'julian',
    totalQuestions: 5
  });


  // Active interview session state
  const [session, setSession] = useState({
    sessionId: null,
    active: false,
    isLoading: false,
    questions: [],
    currentIndex: 0,
    answers: [],
    currentDifficulty: 'Intermediate',
    companyPlaybook: 'general',
    rubricMatrix: initializeRubricMatrix('general'),
    adaptiveEvent: null, // { type: 'escalation' | 'reinforcement' | 'standard', message: '...' }
    isFinished: false,
    summaryResult: null,
    totalQuestions: 5,
    isAiEngineActive: false,
    interviewMode: 'text',
    interviewerPersona: 'julian',
    recordingData: null,
    communicationAnalysis: null,
    recordedBlob: null
  });

  // Recent interviews history (Honest real storage, defaults to empty)
  const [history, setHistory] = useState(() => {
    return storageService.getInterviews();
  });

  useEffect(() => {
    storageService.setInterviews(history);
  }, [history]);

  // Update setup parameters
  const updateSetup = (fields) => {
    setSetup(prev => {
      const next = { ...prev, ...fields };
      if (fields.targetRole) {
        const currentUser = storageService.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            targetRole: fields.targetRole,
            role: fields.targetRole
          };
          storageService.saveCurrentUser(updatedUser);
          if (updatedUser.id) {
            storageService.saveProfile(updatedUser, updatedUser.id);
          }
        }
      }
      return next;
    });
  };


  // Start new interview with configured settings
  const startInterview = async (overrideSetup = null) => {
    const config = overrideSetup || setup;
    const questionLimit = config.totalQuestions || 5;
    const mode = config.interviewMode || setup.interviewMode || 'text';

    const activePlaybook = config.companyPlaybook || setup.companyPlaybook || 'general';

    // Reset session and indicate loading while AI engine initializes
    setSession({
      sessionId: null,
      active: true,
      isLoading: true,
      questions: [],
      currentIndex: 0,
      answers: [],
      currentDifficulty: config.difficulty || 'Intermediate',
      companyPlaybook: activePlaybook,
      rubricMatrix: initializeRubricMatrix(activePlaybook),
      adaptiveEvent: null,
      isFinished: false,
      summaryResult: null,
      totalQuestions: questionLimit,
      isAiEngineActive: false,
      interviewMode: mode,
      interviewerPersona: config.interviewerPersona || setup.interviewerPersona || 'julian',
      recordingData: null,
      communicationAnalysis: null,
      recordedBlob: null,
      hintsUsed: 0,
      hintsPerQuestion: {}
    });

    // Asynchronously initialize dynamic session via FastAPI Generative AI Interview Engine
    try {
      const backendSession = await interviewApi.startSession({
        userId: getActiveUserId(),
        role: config.targetRole,
        interviewType: config.interviewType,
        difficulty: config.difficulty,
        totalQuestions: questionLimit,
        interviewLanguage: config.interviewLanguage || 'en',
        feedbackLanguage: config.feedbackLanguage || 'en',
        interviewMode: mode
      });


      if (backendSession && backendSession.current_question) {
        const firstQ = backendSession.current_question;
        const mappedFirstQ = {
          id: firstQ.id,
          question: firstQ.question,
          category: firstQ.skill || config.interviewType,
          difficulty: firstQ.difficulty || config.difficulty,
          currentDifficulty: firstQ.difficulty || config.difficulty,
          generatedSource: firstQ.generated_source || 'rag_grounded',
          expectedFocus: firstQ.expected_focus || '',
          isFollowUp: firstQ.is_follow_up || false,
          adaptiveTriggered: false
        };

        setSession(prev => ({
          ...prev,
          sessionId: backendSession.session_id,
          questions: [mappedFirstQ],
          totalQuestions: backendSession.total_questions || questionLimit,
          isAiEngineActive: true,
          isLoading: false
        }));
        return backendSession;
      }
    } catch (err) {
      console.warn('[InterviewContext] Backend interview initialization fell back to local bank:', err);
    }

    // Offline / Network Failure Fallback only:
    const roleQuestions = QUESTION_BANK[config.targetRole] || QUESTION_BANK['Machine Learning Engineer'];
    let selectedQuestions = roleQuestions[config.interviewType] || roleQuestions['Technical'] || [];
    if (selectedQuestions.length === 0) {
      selectedQuestions = roleQuestions['Technical'] || [];
    }
    const sessionQuestions = selectedQuestions.slice(0, questionLimit).map(q => ({
      ...q,
      currentDifficulty: q.difficulty || config.difficulty || 'Intermediate'
    }));

    setSession(prev => ({
      ...prev,
      questions: sessionQuestions,
      isAiEngineActive: false,
      isLoading: false
    }));
  };


  // Submit answer for the current question
  const submitCurrentAnswer = async (answerText) => {
    const currentQ = session.questions[session.currentIndex];
    if (!currentQ) return null;

    let evaluation = null;
    let nextDifficulty = session.currentDifficulty;
    let adaptiveEvent = null;
    let newQuestions = [...session.questions];

    if (session.sessionId && session.isAiEngineActive) {
      try {
        const submissionResult = await interviewApi.submitAnswer(session.sessionId, {
          questionId: currentQ.id,
          answer: answerText,
          userId: getActiveUserId(),
          currentQuestionMeta: currentQ,
          targetRole: setup.targetRole,
          interviewType: setup.interviewType,
          difficulty: session.currentDifficulty
        });


        if (submissionResult && submissionResult.evaluation) {
          const ev = submissionResult.evaluation;
          const overall10 = Math.round((ev.overall_score / 10) * 10) / 10;
          
          evaluation = {
            scores: {
              overall: overall10,
              technicalKnowledge: Math.round(ev.technical_accuracy / 10),
              relevance: Math.round(ev.relevance / 10),
              clarity: Math.round(ev.communication_quality / 10),
              structure: Math.round(ev.completeness / 10),
              confidence: Math.round(ev.confidence_indicators / 10)
            },
            strengths: ev.strengths || [],
            areasToImprove: ev.weaknesses || [],
            missingConcepts: ev.missing_concepts || [],
            detectedTopics: ev.detected_topics || [],
            recommendedFollowUpType: ev.recommended_follow_up_type || null,
            aiRecommendation: ev.feedback || 'Answer evaluated by AI Generative Engine.',
            adaptiveNote: ev.follow_up_reason || submissionResult.adaptive_decision?.reason || null,
            rawEvaluation: ev,
            isAdaptiveFollowUpSuggested: ev.follow_up_needed,
            followUpQuestion: ev.follow_up_reason
          };

          const decision = submissionResult.adaptive_decision;
          if (decision?.action === 'escalate') {
            nextDifficulty = 'Advanced';
            adaptiveEvent = {
              type: 'escalation',
              previousScore: overall10,
              title: '⚡ Adaptive Escalation Triggered',
              badge: 'Higher Difficulty',
              message: decision.reason || `Strong answer (${overall10}/10). The AI Agent has escalated to Advanced concepts.`
            };
          } else if (decision?.action === 'reinforce' || decision?.action === 'follow_up') {
            nextDifficulty = decision.difficulty || 'Beginner';
            const followUpLabels = {
              deeper_technical: 'Deeper Technical Probe',
              scenario_application: 'Production Scenario Probe',
              conceptual_probe: 'Conceptual Clarification',
              foundational_clarification: 'Foundational Reinforcement',
              topic_pivot: 'Curriculum Focus'
            };
            const typeBadge = followUpLabels[decision.follow_up_type] || (decision.action === 'follow_up' ? 'Deep Probe' : 'Foundational Check');

            adaptiveEvent = {
              type: 'reinforcement',
              previousScore: overall10,
              title: decision.action === 'follow_up' ? `🔍 Adaptive Follow-up: ${typeBadge}` : '🎯 Adaptive Reinforcement Triggered',
              badge: typeBadge,
              message: decision.reason || `Targeted adaptation (${overall10}/10). The AI Agent has adapted the next question.`
            };
          } else {
            nextDifficulty = 'Intermediate';
            adaptiveEvent = {
              type: 'standard',
              previousScore: overall10,
              title: '● Calibrated Standard Pacing',
              badge: 'On Track',
              message: `Solid response (${overall10}/10). Advancing along the calibrated curriculum.`
            };
          }

          if (submissionResult.next_question) {
            const nq = submissionResult.next_question;
            const mappedNextQ = {
              id: nq.id,
              question: nq.question,
              category: nq.skill || currentQ.category,
              difficulty: nq.difficulty || nextDifficulty,
              currentDifficulty: nq.difficulty || nextDifficulty,
              generatedSource: nq.generated_source || 'rag_grounded',
              expectedFocus: nq.expected_focus || '',
              isFollowUp: nq.is_follow_up || false,
              adaptiveTriggered: nq.is_follow_up || decision?.action !== 'standard'
            };
            newQuestions[session.currentIndex + 1] = mappedNextQ;
          }
        }
      } catch (err) {
        console.warn('[InterviewContext] submitAnswer backend error, using local fallback:', err);
      }
    }

    // Fallback if backend was not reachable or evaluation is null
    if (!evaluation) {
      evaluation = evaluateAnswer(
        currentQ,
        answerText,
        setup.targetRole,
        setup.interviewType,
        session.currentDifficulty
      );

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

      if (session.currentIndex + 1 >= newQuestions.length && session.currentIndex + 1 < (session.totalQuestions || 5)) {
        const roleQuestions = QUESTION_BANK[setup.targetRole] || QUESTION_BANK['Machine Learning Engineer'];
        let selectedQuestions = roleQuestions[setup.interviewType] || roleQuestions['Technical'] || [];
        const fallbackQ = selectedQuestions[(session.currentIndex + 1) % (selectedQuestions.length || 1)] || {
          id: `fallback_${session.currentIndex + 1}`,
          question: 'Can you describe a challenging technical problem you solved recently and your approach?',
          category: 'Problem Solving',
          difficulty: nextDifficulty
        };
        newQuestions[session.currentIndex + 1] = {
          ...fallbackQ,
          currentDifficulty: nextDifficulty,
          adaptiveTriggered: adaptiveEvent.type !== 'standard'
        };
      } else if (session.currentIndex + 1 < newQuestions.length) {
        newQuestions[session.currentIndex + 1] = {
          ...newQuestions[session.currentIndex + 1],
          currentDifficulty: nextDifficulty,
          adaptiveTriggered: adaptiveEvent.type !== 'standard'
        };
      }

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
    }

    const qHints = session.hintsPerQuestion?.[currentQ.id] || 0;
    const record = {
      questionId: currentQ.id,
      question: currentQ.question,
      category: currentQ.category,
      difficulty: session.currentDifficulty,
      answerText,
      evaluation,
      hintsUsed: qHints
    };

    const newAnswers = [...session.answers, record];

    // Update live company rubric matrix based on answer evaluation signals
    const updatedRubric = { ...(session.rubricMatrix || initializeRubricMatrix(session.companyPlaybook || 'general')) };
    const compKeys = Object.keys(updatedRubric);
    if (compKeys.length > 0) {
      const compKey = compKeys[session.currentIndex % compKeys.length];
      if (updatedRubric[compKey]) {
        const scoreVal = evaluation?.scores?.overall ? Math.round(evaluation.scores.overall * 10) : 75;
        const status = scoreVal >= 70 ? 'verified' : scoreVal < 55 ? 'weak' : 'pending';
        const snippet = answerText ? (answerText.length > 120 ? answerText.slice(0, 117) + '...' : answerText) : 'Verbal response recorded';
        updatedRubric[compKey] = {
          ...updatedRubric[compKey],
          status,
          score: scoreVal,
          evidence: [...(updatedRubric[compKey].evidence || []), snippet]
        };
      }
    }

    setSession(prev => ({
      ...prev,
      questions: newQuestions,
      answers: newAnswers,
      currentDifficulty: nextDifficulty,
      rubricMatrix: updatedRubric,
      adaptiveEvent
    }));

    return evaluation;
  };

  // Track Socratic preceptor hints requested by candidate
  const recordHintUsed = (questionId) => {
    setSession(prev => {
      const qId = questionId || prev.questions[prev.currentIndex]?.id || `q_${prev.currentIndex + 1}`;
      const currentCount = prev.hintsPerQuestion?.[qId] || 0;
      return {
        ...prev,
        hintsUsed: (prev.hintsUsed || 0) + 1,
        hintsPerQuestion: {
          ...(prev.hintsPerQuestion || {}),
          [qId]: currentCount + 1
        }
      };
    });
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

  const completeInterview = async () => {
    const answers = session.answers;
    if (!answers || answers.length === 0) return null;

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
    let finalScores = {
      overall: Math.round((totalOverall / count) * 10),
      technicalKnowledge: Math.round((totalTech / count) * 10),
      relevance: Math.round((totalRel / count) * 10),
      clarity: Math.round((totalClarity / count) * 10),
      structure: Math.round((totalStruct / count) * 10),
      confidence: Math.round((totalConf / count) * 10)
    };

    let allStrengths = Array.from(new Set(answers.flatMap(a => a.evaluation.strengths))).slice(0, 4);
    let allImprovements = Array.from(new Set(answers.flatMap(a => a.evaluation.areasToImprove))).slice(0, 3);
    let finalRecommendation = 'Focus on structuring your answers using real-world metrics, and deepen your explanation of system failure modes.';

    if (finalScores.overall >= 85) {
      finalRecommendation = 'Outstanding performance! You are performing at a senior candidate level. Focus next on executive communication and high-scale architecture tradeoffs.';
    } else if (finalScores.overall < 70) {
      finalRecommendation = 'Recommend revisiting foundational concepts and preparing structured project stories using the STAR method.';
    }

    let backendReport = null;
    if (session.sessionId && session.isAiEngineActive) {
      try {
        backendReport = await interviewApi.completeSession(session.sessionId, getActiveUserId());

        if (backendReport) {
          finalScores = {
            overall: backendReport.overall_score,
            technicalKnowledge: backendReport.rubric_scores?.technicalKnowledge || finalScores.technicalKnowledge,
            relevance: backendReport.rubric_scores?.problemSolving || finalScores.relevance,
            clarity: backendReport.rubric_scores?.communicationSTAR || finalScores.clarity,
            structure: backendReport.rubric_scores?.systemDesign || finalScores.structure,
            confidence: backendReport.rubric_scores?.confidenceDelivery || finalScores.confidence
          };
          if (backendReport.strengths?.length) allStrengths = backendReport.strengths;
          if (backendReport.weaknesses?.length) allImprovements = backendReport.weaknesses;
          if (backendReport.feedback_summary) finalRecommendation = backendReport.feedback_summary;
        }
      } catch (err) {
        console.warn('[InterviewContext] completeSession backend error, using local aggregate:', err);
      }
    }

    // Compute FAANG Hiring Committee Calibration Verdict (5 Canonical Tiers)
    const currentRubric = session.rubricMatrix || initializeRubricMatrix(session.companyPlaybook || 'general');
    const compValues = Object.values(currentRubric);
    const verifiedCount = compValues.filter(c => c.status === 'verified').length;
    const weakCount = compValues.filter(c => c.status === 'weak').length;
    const rubricCoveragePct = compValues.length > 0 ? Math.round((verifiedCount / compValues.length) * 100) : 0;
    const totalHintsUsed = session.hintsUsed || 0;

    let committeeVerdict = 'Lean Hire';
    let committeeReasoning = 'Candidate demonstrated solid baseline competence with areas for growth.';

    if (finalScores.overall >= 88 && rubricCoveragePct >= 75 && weakCount === 0) {
      committeeVerdict = 'Strong Hire';
      committeeReasoning = 'Universal Strong Hire consensus. Exceptional command across algorithmic depth, architectural trade-offs, and high autonomous execution without requiring steering.';
    } else if (finalScores.overall >= 78 && weakCount === 0) {
      committeeVerdict = 'Hire';
      committeeReasoning = 'Solid FAANG-bar performance. Demonstrates strong fundamentals, structured reasoning, and responsive adaptation to Socratic questions.';
    } else if (finalScores.overall >= 68 && weakCount <= 1) {
      committeeVerdict = 'Lean Hire';
      committeeReasoning = 'Acceptable technical baseline demonstrating coachability. Exhibits minor gaps in edge-case handling or architectural scale limits.';
    } else if (finalScores.overall >= 55 || weakCount === 2) {
      committeeVerdict = 'Lean No Hire';
      committeeReasoning = 'Mixed performance with critical skills unverified. Needed multiple hints to formulate solutions.';
    } else {
      committeeVerdict = 'No Hire';
      committeeReasoning = 'Significant conceptual or execution gaps. Fails to satisfy core role requirements or demonstrate independent problem solving.';
    }

    // Calibrated Seniority Benchmark (L3 to L6)
    let seniorityBenchmark = {
      level: 'L4 — Mid-Level / SDE II',
      title: 'Mid-Level Software Engineer / Systems Developer',
      scope: 'Competent execution of core algorithms and standard system designs with occasional coach hints on complex problems.',
      targetYears: '2–4 Years Industry Equivalent',
      status: 'Target Met'
    };

    if (finalScores.overall >= 90) {
      seniorityBenchmark = {
        level: 'L6 — Staff / Principal Architect',
        title: 'Staff Engineer / Principal Systems Architect',
        scope: 'Exemplary independent architecture leadership, proactive edge-case handling, fault-tolerant system boundaries, and clear technical synthesis.',
        targetYears: '8+ Years Industry Equivalent',
        status: 'Exceeded Senior Bar'
      };
    } else if (finalScores.overall >= 80) {
      seniorityBenchmark = {
        level: 'L5 — Senior Engineer / Tech Lead',
        title: 'Senior Engineer / Technical Lead',
        scope: 'Independent solution design, crisp trade-off explanations, mastery of design patterns, and effective coachability.',
        targetYears: '5–7 Years Industry Equivalent',
        status: 'Target Met'
      };
    } else if (finalScores.overall < 65) {
      seniorityBenchmark = {
        level: 'L3 — Junior / Associate Engineer',
        title: 'Junior / Associate Software Engineer',
        scope: 'Demonstrates foundational potential; requires structured mentorship on production constraints and architectural scale.',
        targetYears: '0–2 Years Industry Equivalent',
        status: 'Development Focus'
      };
    }

    // Canonical 4-Pillar Industry Rubric
    const baseAutonomy = finalScores.confidence || 80;
    const autonomyScore = Math.min(100, Math.max(45,
      totalHintsUsed === 0 ? Math.min(100, baseAutonomy + 8) :
      totalHintsUsed === 1 ? Math.min(95, baseAutonomy + 2) :
      totalHintsUsed === 2 ? Math.max(60, baseAutonomy - 8) :
      Math.max(48, baseAutonomy - 18)
    ));

    const industryPillars = {
      algorithmicDepth: {
        name: 'Algorithmic & Technical Depth',
        score: Math.min(100, Math.max(45, finalScores.technicalKnowledge || 75)),
        criteria: 'Correctness, optimal time/space complexity (Big-O), and edge-case handling',
        status: (finalScores.technicalKnowledge || 75) >= 80 ? 'Exceptional' : (finalScores.technicalKnowledge || 75) >= 65 ? 'Proficient' : 'Developing'
      },
      architectureQuality: {
        name: 'Architecture & Code Quality',
        score: Math.min(100, Math.max(45, finalScores.structure || 78)),
        criteria: 'Modular design, fault tolerance, scalability, and trade-off justification',
        status: (finalScores.structure || 78) >= 80 ? 'Exceptional' : (finalScores.structure || 78) >= 65 ? 'Proficient' : 'Developing'
      },
      communicationPacing: {
        name: 'Communication & Thought Process',
        score: Math.min(100, Math.max(45, finalScores.clarity || 80)),
        criteria: 'Structured answers (STAR / Top-Down), speaking clarity, and proactive clarification',
        status: (finalScores.clarity || 80) >= 80 ? 'Exceptional' : (finalScores.clarity || 80) >= 65 ? 'Proficient' : 'Developing'
      },
      autonomyCoachability: {
        name: 'Autonomy & Coachability',
        score: autonomyScore,
        criteria: totalHintsUsed === 0
          ? 'Answered all interview questions independently without needing hints (0 hints used)'
          : totalHintsUsed === 1
          ? 'High independence; used 1 coach hint and applied it immediately'
          : `Used ${totalHintsUsed} coach hints; showed good coachability with guided problem solving`,
        hintsUsed: totalHintsUsed,
        status: autonomyScore >= 85 ? 'Exceptional' : autonomyScore >= 70 ? 'Proficient' : 'Developing'
      }
    };

    const summaryResult = {
      role: setup.targetRole,
      type: setup.interviewType,
      difficulty: setup.difficulty,
      companyPlaybook: session.companyPlaybook || setup.companyPlaybook || 'general',
      rubricMatrix: currentRubric,
      totalHintsUsed,
      seniorityBenchmark,
      industryPillars,
      hiringCommittee: {
        verdict: committeeVerdict,
        reasoning: committeeReasoning,
        rubricCoveragePct,
        verifiedCount,
        totalCompetencies: compValues.length,
        seniorityLevel: seniorityBenchmark.level,
        autonomyTier: totalHintsUsed === 0 ? 'Full Autonomy' : totalHintsUsed === 1 ? 'High Autonomy (Coachability Verified)' : 'Guided Execution'
      },
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      scores: finalScores,
      strengths: allStrengths,
      areasToImprove: allImprovements,
      aiRecommendation: finalRecommendation,
      feedbackLanguage: backendReport?.feedback_language || setup.feedbackLanguage || 'en',
      fallbackNotice: backendReport?.fallback_notice || null,
      recommendations: backendReport?.recommendations || [],
      nextBestAction: backendReport?.next_best_action || null,
      answersCount: answers.length,
      backendReport
    };

    setSession(prev => ({
      ...prev,
      answers,
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
      feedbackSummary: finalRecommendation,
      scores: finalScores
    };

    setHistory(prev => [historyItem, ...prev]);

    // Background sync with FastAPI backend
    storageService.syncInterviewToBackend(historyItem, getActiveUserId()).catch(() => {});


    // Record immutable activity and update skill gap model
    activityService.recordActivity({
      type: ACTIVITY_TYPES.INTERVIEW_COMPLETED,
      relatedModule: 'interview',
      title: `Mock Interview: ${setup.targetRole} (${finalScores.overall}%)`,
      details: {
        role: setup.targetRole,
        type: setup.interviewType,
        difficulty: setup.difficulty,
        score: finalScores.overall,
        scores: finalScores
      },
      xpEarned: 100
    });

    // Update persistent skill gap analysis
    analyzeSkillGaps(summaryResult, answers);

    // Evaluate and persist unlocked achievements
    achievementService.evaluateAchievements();

    return summaryResult;
  };

  const setRecordingData = (data) => {
    setSession(prev => ({
      ...prev,
      recordingData: data
    }));
  };

  const setCommunicationAnalysis = (data) => {
    setSession(prev => ({
      ...prev,
      communicationAnalysis: data
    }));
  };

  const setRecordedBlob = (blob) => {
    setSession(prev => ({
      ...prev,
      recordedBlob: blob
    }));
  };

  const resetInterview = () => {
    setSession({
      sessionId: null,
      active: false,
      isLoading: false,
      questions: [],
      currentIndex: 0,
      answers: [],
      currentDifficulty: setup.difficulty || 'Intermediate',
      adaptiveEvent: null,
      isFinished: false,
      summaryResult: null,
      totalQuestions: setup.totalQuestions || 5,
      isAiEngineActive: false,
      interviewMode: setup.interviewMode || 'text',
      interviewerPersona: setup.interviewerPersona || 'julian',
      recordingData: null,
      communicationAnalysis: null,
      recordedBlob: null
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
        recordHintUsed,
        setRecordingData,
        setCommunicationAnalysis,
        setRecordedBlob,
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
