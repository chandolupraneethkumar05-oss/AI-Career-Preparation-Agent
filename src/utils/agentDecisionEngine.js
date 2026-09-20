/**
 * Central Agent Decision Engine
 * 
 * Analyzes candidate profile, ATS resume audit, interview history, and recent activity
 * to autonomously prioritize the next highest-yield preparation action with transparent reasoning.
 */

import { storageService } from './storage/storageService.js';
import { activityService } from './activityService.js';

export const agentDecisionEngine = {
  /**
   * Evaluates overall candidate state and prescribes the optimal next action (Phase 19).
   * Returns: { actionType, priority, title, action, reason, source, route, targetRole, primarySkill }
   */
  getNextBestAction(candidateState = null) {
    const state = candidateState || storageService.getUserCareerState();
    const { interviews, atsResult, activities, targetRole } = state;

    const hasPracticedToday = activityService.hasPracticedToday(activities);
    const latestInterview = interviews && interviews.length > 0 ? interviews[0] : null;

    // Rule 1: No Resume Scanned Yet (Source: ATS Audit)
    if (!atsResult) {
      return {
        priority: 'high',
        title: 'Audit Your Resume Against ATS Systems',
        headline: 'Audit Your Resume Against ATS Systems',
        action: 'Scan Your Resume',
        route: '/ats',
        targetRole,
        primarySkill: 'ATS Alignment',
        reason: 'You have not audited your resume against Applicant Tracking Systems yet. Identifying missing keywords is the fastest way to increase interview callbacks.',
        actionType: 'ats_scan',
        source: 'ats_audit'
      };
    }

    // Rule 2: Resume Scanned, but 0 Interviews Completed (Source: Interview Baseline)
    if (!latestInterview) {
      return {
        priority: 'high',
        title: `Take Your Diagnostic ${targetRole} Mock Interview`,
        headline: `Take Your Diagnostic ${targetRole} Mock Interview`,
        action: 'Start 1st Mock Interview',
        route: '/interview-setup',
        targetRole,
        primarySkill: targetRole,
        reason: `Your ATS compatibility is ${atsResult.overallScore}%. Next, establish your baseline technical and communication readiness through a 5-question mock interview.`,
        actionType: 'mock_interview',
        source: 'interview_baseline'
      };
    }

    // Rule 3: ATS Missing Skills detected (Source: ATS Skill Gap)
    const missingSkills = atsResult.missingKeywords || [];
    const urgentMissingSkill = missingSkills.find((s) => ['SQL', 'System Design', 'Docker', 'Kubernetes', 'AWS'].includes(s));

    const scores = latestInterview.scores || {};
    const normalize = (val, fallback) => {
      if (val === undefined || val === null) return fallback;
      return val <= 10 ? Math.round(val * 10) : Math.round(val);
    };
    const commScore = normalize(scores.clarity ?? scores.communication, 75);
    const confScore = normalize(scores.confidence ?? scores.confidenceDelivery, 70);
    const techScore = normalize(scores.technicalKnowledge, 80);

    if (commScore < 70) {
      return {
        priority: 'high',
        title: 'Sharpen STAR Narrative Structure',
        headline: 'Sharpen STAR Narrative Structure',
        action: 'Practice Behavioral STAR Drill',
        route: '/daily-challenge',
        targetRole,
        primarySkill: 'Communication',
        reason: `Your last interview scored ${commScore}% in communication clarity. Practicing the STAR framework (Situation, Task, Action, Result) will directly improve your hiring score.`,
        actionType: 'communication_practice',
        source: 'interview_performance'
      };
    }

    if (confScore < 65) {
      return {
        priority: 'high',
        title: 'Build Verbal Confidence & Delivery',
        headline: 'Build Verbal Confidence & Delivery',
        action: 'Take 5-Minute Articulation Drill',
        route: '/daily-challenge',
        targetRole,
        primarySkill: 'Confidence',
        reason: `Your confidence & delivery score was ${confScore}%. Concise, structured delivery without filler language increases interviewer confidence.`,
        actionType: 'confidence_drill',
        source: 'interview_performance'
      };
    }

    if (urgentMissingSkill) {
      return {
        priority: 'medium',
        title: `Bridge Your ${urgentMissingSkill} Competency Gap`,
        headline: `Bridge Your ${urgentMissingSkill} Competency Gap`,
        action: `Practice ${urgentMissingSkill} Questions`,
        route: '/interview-setup',
        targetRole,
        primarySkill: urgentMissingSkill,
        reason: `${urgentMissingSkill} is missing from your resume and is required for ${targetRole} roles. Target this gap in your next practice round.`,
        actionType: 'skill_challenge',
        source: 'ats_skill_gap'
      };
    }

    if (techScore < 70) {
      return {
        priority: 'medium',
        title: `Deepen ${targetRole} Core Concepts`,
        headline: `Deepen ${targetRole} Core Concepts`,
        action: 'Practice Technical Domain Round',
        route: '/interview-setup',
        targetRole,
        primarySkill: 'Technical Knowledge',
        reason: `Your technical evaluation scored ${techScore}%. Focus on internal mechanisms, mathematical formulations, and failure modes.`,
        actionType: 'technical_practice',
        source: 'interview_performance'
      };
    }

    // Rule 5: If not practiced today (Source: Activity)
    if (!hasPracticedToday) {
      return {
        priority: 'medium',
        title: 'Complete Today’s Practice Challenge',
        headline: 'Daily Practice Pending Today',
        action: "Solve Today's Conceptual Drill",
        route: '/daily-challenge',
        targetRole,
        primarySkill: 'Consistency',
        reason: 'You have not completed a preparation activity today. Spend 5 minutes solving today’s challenge to protect your streak and earn +50 XP.',
        actionType: 'daily_practice',
        source: 'activity'
      };
    }

    // Default: Strong Candidate Continuous Escalation
    return {
      priority: 'low',
      title: 'Advance to Senior-Level Architecture',
      headline: 'Excellent Progress — Advance to Complex Architecture',
      action: 'Try Advanced Technical Tier',
      route: '/interview-setup',
      targetRole,
      primarySkill: 'System Architecture',
      reason: `You've achieved a solid ${latestInterview.score}% interview readiness. Escalate to Advanced difficulty to prepare for senior-level architectural probes.`,
      actionType: 'advanced_escalation',
      source: 'mastery_escalation'
    };
  },

  // Alias for backwards compatibility
  evaluateNextAction(state) {
    return this.getNextBestAction(state);
  },

  /**
   * Generates a personalized daily challenge based on candidate weaknesses
   */
  generatePersonalizedChallenge(candidateState = null) {
    const nextAction = this.getNextBestAction(candidateState);
    const skill = nextAction.primarySkill || 'Machine Learning';

    // Skill-specific targeted challenges
    if (skill === 'Communication' || nextAction.actionType === 'communication_drill') {
      return {
        id: 'dc-personalized-comm',
        title: 'The 60-Second STAR Project Pitch',
        skill: 'Communication & STAR',
        category: 'Behavioral Framing',
        difficulty: 'Intermediate',
        timeLimitMinutes: 3,
        xpReward: 50,
        prompt: 'Describe a challenging production engineering problem you faced using the STAR method (Situation, Task, Action, Result) in under 120 words.',
        criteria: ['Specific technical obstacle', 'Exact personal action taken', 'Quantifiable metric in result'],
        sampleAnswer: 'Situation: Our training pipeline stalled when processing 2M daily telemetry events. Task: Reduce preprocessing latency from 45ms to under 10ms without losing data integrity. Action: I replaced serial pandas transformations with vectorized Polars and partitioned IO batches across 4 worker threads. Result: Pipeline throughput increased by 4.2x, saving $1,400 monthly in compute costs.'
      };
    }

    if (skill === 'Confidence' || nextAction.actionType === 'confidence_drill') {
      return {
        id: 'dc-personalized-conf',
        title: 'Explain Model Overfitting to an Executive',
        skill: 'Confidence & Delivery',
        category: 'Verbal Delivery',
        difficulty: 'Intermediate',
        timeLimitMinutes: 3,
        xpReward: 50,
        prompt: 'Explain the difference between variance and bias to a non-technical stakeholder without using mathematical equations or academic jargon.',
        criteria: ['Clear everyday metaphor', 'Plain language reasoning', 'Actionable business takeaway'],
        sampleAnswer: 'Think of training an AI model like training a new employee. If they memorize every single historical incident word-for-word, they do great on past tests but freeze when a customer asks a slightly new question (that is high variance / overfitting). On the flip side, if they follow a single rigid rule regardless of the situation, they make simplistic blunders (high bias). Our job is striking the sweet spot: giving the model enough flexibility to learn patterns while keeping it grounded so it generalizes reliably to real customers.'
      };
    }

    if (skill === 'SQL' || skill.includes('SQL')) {
      return {
        id: 'dc-personalized-sql',
        title: 'Find the Second-Highest Salary & Window Aggregation',
        skill: 'SQL & Data',
        category: 'Data Engineering',
        difficulty: 'Intermediate',
        timeLimitMinutes: 5,
        xpReward: 50,
        prompt: 'Write a SQL query to find the second-highest salary from an Employee table without using the LIMIT offset pattern, handling potential duplicates correctly.',
        criteria: ['Use of DENSE_RANK() or subquery', 'Correct duplicate handling', 'Clean syntax'],
        sampleAnswer: 'WITH RankedSalaries AS (\n  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk\n  FROM Employee\n)\nSELECT MAX(salary) as SecondHighestSalary\nFROM RankedSalaries\nWHERE rnk = 2;'
      };
    }

    if (skill === 'System Design' || skill.includes('Architecture') || skill === 'Docker') {
      return {
        id: 'dc-personalized-sys',
        title: 'Design a Distributed Caching Invalidation Strategy',
        skill: 'System Design',
        category: 'Scalability',
        difficulty: 'Advanced',
        timeLimitMinutes: 5,
        xpReward: 50,
        prompt: 'In a distributed web system, how do you handle cache invalidation when a database write occurs? Contrast Write-Through vs Cache-Aside with TTL.',
        criteria: ['Write-Through mechanics', 'Cache-Aside with TTL trade-off', 'Race condition mitigation'],
        sampleAnswer: 'In Cache-Aside, the application queries cache first. On miss, it reads DB and populates cache. On DB update, the application deletes (invalidates) the cache key rather than updating it, relying on TTL as a safety fallback. In Write-Through, the application writes to the cache, which synchronously updates the DB before acknowledging. Cache-Aside is simpler and resilient to cache node failures, while Write-Through guarantees consistency at the cost of higher write latency.'
      };
    }

    // Default ML / Core Engineering Challenge
    return {
      id: 'dc-personalized-ml',
      title: 'Explain Supervised vs Unsupervised Learning in Production',
      skill: 'Machine Learning',
      category: 'Core AI',
      difficulty: 'Intermediate',
      timeLimitMinutes: 5,
      xpReward: 50,
      prompt: 'Contrast Supervised vs. Unsupervised Learning with explicit production examples and data annotation cost trade-offs.',
      criteria: ['Clear distinction between labeled and unlabeled data', 'Production use cases', 'Annotation cost trade-off'],
      sampleAnswer: 'Supervised learning trains on labeled input-output pairs to predict targets on unseen data (e.g. churn prediction). Unsupervised learning uncovers latent structures in unlabeled data (e.g. customer segmentation via K-Means). Supervised requires expensive manual labeling, whereas unsupervised operates on ambient event streams.'
    };
  }
};
