/**
 * Skill Gap Analyzer Engine
 * 
 * Maps recent interview performance into role-specific skill proficiencies,
 * calculates priority rankings, and dynamically generates agentic preparation paths.
 * 
 * Ready for future LLM integration:
 * This logic can ingest real LLM evaluation payloads, resume parse results, and
 * long-term session histories without altering UI contracts.
 */

export const BASELINE_SKILL_ANALYSIS = {
  overallReadiness: 78,
  previousReadiness: 72,
  improvementRate: 6,
  readinessLabel: 'Good — Almost Interview Ready',
  readinessSummary: "You're performing well in core technical areas, but improving problem solving and confidence could significantly increase your overall interview readiness.",
  skills: [
    { name: 'Machine Learning', score: 86, category: 'Core AI' },
    { name: 'Python', score: 82, category: 'Language' },
    { name: 'Problem Solving', score: 74, category: 'Engineering' },
    { name: 'Communication', score: 78, category: 'Soft Skills' },
    { name: 'System Design', score: 61, category: 'Architecture' },
    { name: 'Behavioral / STAR', score: 70, category: 'Behavioral' },
    { name: 'Confidence', score: 68, category: 'Delivery' },
    { name: 'SQL', score: 64, category: 'Data' }
  ],
  radarDimensions: [
    { name: 'Technical Knowledge', score: 86 },
    { name: 'Problem Solving', score: 74 },
    { name: 'Communication', score: 78 },
    { name: 'Confidence', score: 68 },
    { name: 'Relevance', score: 88 },
    { name: 'Behavioral', score: 70 }
  ],
  historicalProgress: [
    {
      skill: 'Problem Solving',
      previousScore: 68,
      currentScore: 74,
      change: 6,
      period: 'Previous Interview → Current Interview'
    },
    {
      skill: 'Confidence & Delivery',
      previousScore: 62,
      currentScore: 68,
      change: 6,
      period: 'Week 2 Baseline → Current Interview'
    },
    {
      skill: 'Communication (STAR)',
      previousScore: 72,
      currentScore: 78,
      change: 6,
      period: 'Initial Diagnostic → Current Interview'
    }
  ],
  pipelineSteps: [
    {
      step: 1,
      title: 'Interview Responses',
      desc: 'Transcribed candidate verbal and written reasoning across role prompts.'
    },
    {
      step: 2,
      title: 'Performance Scores',
      desc: 'Multi-metric token analysis evaluating clarity, depth, and precision.'
    },
    {
      step: 3,
      title: 'Skill Mapping',
      desc: 'Mapped performance indicators to target industry competency matrices.'
    },
    {
      step: 4,
      title: 'Weakest Skills Identified',
      desc: 'Detected lowest scoring proficiencies below market offer thresholds.'
    },
    {
      step: 5,
      title: 'Priority Ranking',
      desc: 'Ranked gaps by hiring risk impact and estimated time to resolve.'
    },
    {
      step: 6,
      title: 'Personalized Recommendation',
      desc: 'Prescribed targeted high-yield drills to accelerate offer readiness.'
    }
  ]
};

import { storageService } from './storage/storageService';

export function analyzeSkillGaps(sessionSummary = null, _sessionAnswers = []) {
  const base = BASELINE_SKILL_ANALYSIS;

  // Retrieve persistent interview and ATS context
  const effectiveSummary = sessionSummary || storageService.getInterviews()[0] || null;
  const atsResult = storageService.getATSResult();

  // Clone skills array so we can calculate reactive scores
  let skills = base.skills.map((s) => ({ ...s }));
  let radarDimensions = base.radarDimensions.map((r) => ({ ...r }));

  // 1. If an interview exists, merge relevant rubric scores
  if (effectiveSummary && effectiveSummary.scores) {
    const sc = effectiveSummary.scores;
    skills = skills.map((s) => {
      if (s.name === 'Problem Solving' && (sc.structure || sc.problemSolving)) {
        const val = (sc.structure || sc.problemSolving) > 10 ? (sc.structure || sc.problemSolving) : (sc.structure || sc.problemSolving) * 10;
        return { ...s, score: Math.round((s.score + val) / 2) };
      }
      if (s.name === 'Communication' && (sc.clarity || sc.communication)) {
        const val = (sc.clarity || sc.communication) > 10 ? (sc.clarity || sc.communication) : (sc.clarity || sc.communication) * 10;
        return { ...s, score: Math.round((s.score + val) / 2) };
      }
      if (s.name === 'Confidence' && (sc.confidence || sc.confidenceDelivery)) {
        const val = (sc.confidence || sc.confidenceDelivery) > 10 ? (sc.confidence || sc.confidenceDelivery) : (sc.confidence || sc.confidenceDelivery) * 10;
        return { ...s, score: Math.round((s.score + val) / 2) };
      }
      if (s.name === 'Machine Learning' && sc.technicalKnowledge) {
        const val = sc.technicalKnowledge > 10 ? sc.technicalKnowledge : sc.technicalKnowledge * 10;
        return { ...s, score: Math.round((s.score + val) / 2) };
      }
      return s;
    });

    radarDimensions = radarDimensions.map((r) => {
      if (r.name === 'Technical Knowledge' && sc.technicalKnowledge) {
        return { ...r, score: sc.technicalKnowledge > 10 ? sc.technicalKnowledge : Math.round(sc.technicalKnowledge * 10) };
      }
      if (r.name === 'Problem Solving' && (sc.structure || sc.problemSolving)) {
        const val = sc.structure || sc.problemSolving;
        return { ...r, score: val > 10 ? val : Math.round(val * 10) };
      }
      if (r.name === 'Communication' && (sc.clarity || sc.communication)) {
        const val = sc.clarity || sc.communication;
        return { ...r, score: val > 10 ? val : Math.round(val * 10) };
      }
      if (r.name === 'Confidence' && (sc.confidence || sc.confidenceDelivery)) {
        const val = sc.confidence || sc.confidenceDelivery;
        return { ...r, score: val > 10 ? val : Math.round(val * 10) };
      }
      if (r.name === 'Relevance' && sc.relevance) {
        return { ...r, score: sc.relevance > 10 ? sc.relevance : Math.round(sc.relevance * 10) };
      }
      return r;
    });
  }

  // 2. If ATS scan exists, incorporate missing vs matched keywords into skill gaps
  if (atsResult) {
    const missing = (atsResult.missingKeywords || []).map((k) => k.toLowerCase());
    const matched = (atsResult.matchedKeywords || []).map((k) => k.toLowerCase());

    skills = skills.map((s) => {
      const lower = s.name.toLowerCase();
      // If skill is missing in ATS, lower score into priority/practice threshold
      if (missing.some((m) => lower.includes(m) || m.includes(lower))) {
        return { ...s, score: Math.min(s.score, 58) };
      }
      // If skill was verified in resume, boost confidence
      if (matched.some((m) => lower.includes(m) || m.includes(lower))) {
        return { ...s, score: Math.max(s.score, 82) };
      }
      return s;
    });
  }

  // Calculate status for each skill:
  // 80–100: Strong
  // 65–79: Needs Practice
  // Below 65: Priority
  skills = skills.map((s) => {
    let status = 'Needs Practice';
    let priority = 'Medium';
    if (s.score >= 80) {
      status = 'Strong';
      priority = 'Low';
    } else if (s.score < 65) {
      status = 'Priority';
      priority = 'High';
    }
    return { ...s, status, priority };
  });

  // Sort skills ascending by score to isolate top gaps
  const sortedSkills = [...skills].sort((a, b) => a.score - b.score);
  const weakest = sortedSkills[0];
  const secondWeakest = sortedSkills[1];
  const thirdWeakest = sortedSkills[2];

  // Specific explanations and recommendations for common skills
  const gapMetadata = {
    'System Design': {
      why: 'Your current performance indicates limited depth in architecture, scalability, and trade-off discussions.',
      recommended: 'Practice system-design fundamentals and caching architectures.',
      route: '/interview-setup'
    },
    'SQL': {
      why: 'Query optimization, window functions, and data warehousing schemas require additional precision.',
      recommended: 'Practice analytical SQL aggregation drills.',
      route: '/interview-setup'
    },
    'Confidence': {
      why: 'Your answers are technically reasonable but could be delivered more decisively without second-guessing.',
      recommended: 'Practice timed interview responses and verbal framing.',
      route: '/daily-challenge'
    },
    'Behavioral / STAR': {
      why: 'Your responses would benefit from a tighter Situation, Task, Action, and Result narrative structure.',
      recommended: 'Practice STAR behavioral interview rounds with measurable outcomes.',
      route: '/interview-setup'
    },
    'Problem Solving': {
      why: 'Need deeper exploration of alternative algorithmic approaches and latency-vs-accuracy trade-offs.',
      recommended: 'Practice 5 ML problem-solving questions with explicit edge-case handling.',
      route: '/interview-setup'
    },
    'Communication': {
      why: 'Explanations occasionally lack brevity and concise closing conclusions.',
      recommended: 'Complete timed daily communication drills.',
      route: '/daily-challenge'
    },
    'Machine Learning': {
      why: 'Deepen understanding of loss formulations and modern transformer architectures.',
      recommended: 'Review deep learning optimization mechanics.',
      route: '/interview-setup'
    },
    'Python': {
      why: 'Enhance idiomatic concurrency and memory efficiency paradigms.',
      recommended: 'Practice advanced Python algorithmic patterns.',
      route: '/interview-setup'
    }
  };

  const topSkillGaps = [weakest, secondWeakest, thirdWeakest].map((skill, index) => {
    const meta = gapMetadata[skill.name] || {
      why: 'Performance data shows room for higher depth and structured execution.',
      recommended: `Practice targeted ${skill.name} mock exercises.`,
      route: '/interview-setup'
    };
    return {
      rank: index + 1,
      name: skill.name,
      score: skill.score,
      priority: skill.priority,
      status: skill.status,
      why: meta.why,
      recommended: meta.recommended,
      route: meta.route
    };
  });

  // AGENT DECISION LOGIC:
  // Automatically select dynamic agent insight and primary practice action based on weakest skill
  let agentInsight = '';
  let primaryActionRoute = '/interview-setup';
  let primaryActionLabel = `Practice ${weakest.name} →`;

  if (weakest.name === 'System Design') {
    agentInsight = 'Your technical knowledge is currently stronger than your system design architecture depth. InterviewAI recommends prioritizing scalability and distributed system fundamentals before your next mock interview.';
    primaryActionRoute = '/interview-setup';
    primaryActionLabel = 'Practice System Design Fundamentals →';
  } else if (weakest.name === 'Confidence' || secondWeakest.name === 'Confidence') {
    agentInsight = 'Your technical knowledge is currently stronger than your communication and confidence scores. Instead of recommending another purely technical interview, InterviewAI recommends a communication-focused practice session next.';
    primaryActionRoute = '/daily-challenge';
    primaryActionLabel = 'Start Confidence & Delivery Drill →';
  } else if (weakest.name === 'Behavioral / STAR') {
    agentInsight = 'Your algorithmic comprehension is solid, but hiring committees reject 60% of candidates who fail behavioral STAR structuring. The agent recommends dedicating your next session to structured behavioral narratives.';
    primaryActionRoute = '/interview-setup';
    primaryActionLabel = 'Practice Behavioral / STAR Questions →';
  } else if (weakest.name === 'Problem Solving') {
    agentInsight = 'Your conceptual knowledge is established, but problem-solving under constraint requires deeper practice with edge-case enumeration and trade-off analysis.';
    primaryActionRoute = '/interview-setup';
    primaryActionLabel = 'Practice Problem Solving Questions →';
  } else {
    agentInsight = `Analysis isolates ${weakest.name} as your primary bottleneck to offer-readiness. Addressing this gap will yield the highest immediate score improvement.`;
    primaryActionRoute = '/interview-setup';
    primaryActionLabel = `Practice ${weakest.name} →`;
  }

  // Personalized Preparation Path
  const preparationPath = [
    {
      step: 1,
      title: `Improve ${weakest.name}`,
      status: 'Recommended Now',
      isCurrent: true,
      desc: `Directly address your highest priority gap (${weakest.score}% proficiency).`,
      route: primaryActionRoute
    },
    {
      step: 2,
      title: `Practice ${secondWeakest.name}`,
      status: 'Recommended',
      isCurrent: false,
      desc: `Reinforce your secondary growth opportunity (${secondWeakest.score}% proficiency).`,
      route: secondWeakest.name === 'Confidence' ? '/daily-challenge' : '/interview-setup'
    },
    {
      step: 3,
      title: `Practice ${thirdWeakest.name}`,
      status: 'Upcoming',
      isCurrent: false,
      desc: `Round out tertiary competency to cross the 80% readiness threshold.`,
      route: '/interview-setup'
    },
    {
      step: 4,
      title: 'Take Another Mock Interview',
      status: 'After Practice',
      isCurrent: false,
      desc: 'Benchmark post-remediation performance with an adaptive mock evaluation.',
      route: '/interview-setup'
    }
  ];

  // Recommended Activities
  const recommendedActivities = [
    {
      id: 'act_confidence',
      title: '🎯 Confidence Challenge',
      desc: 'Timed articulation drill to build decisive speaking habits.',
      specs: '5 questions • 5 mins',
      xp: '+50 XP',
      buttonLabel: 'Start Challenge',
      route: '/daily-challenge',
      color: 'cyan'
    },
    {
      id: 'act_star',
      title: '💬 STAR Interview Practice',
      desc: 'Structure stories using Situation, Task, Action, and Result.',
      specs: '10 minutes',
      xp: '+75 XP',
      buttonLabel: 'Practice Now',
      route: '/interview-setup',
      color: 'pink'
    },
    {
      id: 'act_sysdesign',
      title: '🏗 System Design Basics',
      desc: 'Master distributed caching, sharding, and latency trade-offs.',
      specs: '15 minutes',
      xp: '+100 XP',
      buttonLabel: 'Practice Now',
      route: '/interview-setup',
      color: 'purple'
    },
    {
      id: 'act_mock',
      title: '🎤 Technical Mock Interview',
      desc: 'Full-length adaptive interview with comprehensive agent scoring.',
      specs: '15–20 minutes',
      xp: '+120 XP',
      buttonLabel: 'Start Interview',
      route: '/interview-setup',
      color: 'green'
    }
  ];

  const dynamicReadiness = Math.round(
    radarDimensions.reduce((acc, curr) => acc + curr.score, 0) / Math.max(1, radarDimensions.length)
  );

  const payload = {
    overallReadiness: dynamicReadiness,
    previousReadiness: base.previousReadiness,
    improvementRate: Math.max(0, dynamicReadiness - base.previousReadiness),
    readinessLabel: dynamicReadiness >= 80 ? 'Strong — Interview Ready' : dynamicReadiness >= 65 ? 'Good — Approaching Readiness' : 'Priority Attention Needed',
    readinessSummary: dynamicReadiness >= 80 ? 'You are performing strongly across core dimensions. Escalate to high-scale architecture rounds.' : `Focus on ${weakest.name} to accelerate your overall interview readiness.`,
    skills,
    radarDimensions,
    topSkillGaps,
    agentInsight,
    primaryActionRoute,
    primaryActionLabel,
    preparationPath,
    recommendedActivities,
    historicalProgress: base.historicalProgress,
    pipelineSteps: base.pipelineSteps
  };

  storageService.setSkillProfile(payload);
  return payload;
}
