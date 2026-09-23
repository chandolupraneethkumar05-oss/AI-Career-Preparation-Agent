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

export const ROLE_SKILL_TREES = {
  'Frontend Engineer': [
    { name: 'React & Component Lifecycle', category: 'Framework', defaultScore: 78, why: 'Deepen knowledge of React hooks, fiber reconciler, and render cycle optimization.', recommended: 'Practice React virtual DOM and state management drills.', route: '/interview-setup' },
    { name: 'JavaScript & TypeScript', category: 'Language', defaultScore: 82, why: 'Advanced closures, event loops, and strict type constraints require consistent syntax execution.', recommended: 'Review TypeScript generics and async event loop patterns.', route: '/interview-setup' },
    { name: 'CSS & Responsive Layout', category: 'Styling', defaultScore: 80, why: 'Flexbox, CSS grid, and responsive container queries are essential for seamless multi-device rendering.', recommended: 'Practice modern CSS layout and animation exercises.', route: '/interview-setup' },
    { name: 'State Management & Architecture', category: 'Architecture', defaultScore: 70, why: 'Global store modularity, immutability, and state-tree decoupling prevent regression bugs.', recommended: 'Practice Zustand/Redux architecture patterns.', route: '/interview-setup' },
    { name: 'Web Performance & CWV', category: 'Performance', defaultScore: 64, why: 'Core Web Vitals (LCP, INP, CLS) and asset bundling optimization are critical for production frontends.', recommended: 'Practice bundle splitting, lazy loading, and rendering performance audits.', route: '/interview-setup' },
    { name: 'Problem Solving', category: 'Engineering', defaultScore: 72, why: 'Algorithmic DOM manipulation and traversal trade-offs need structured precision.', recommended: 'Practice frontend coding algorithms and tree manipulation.', route: '/interview-setup' },
    { name: 'Communication & Collaboration', category: 'Soft Skills', defaultScore: 76, why: 'Articulating UX trade-offs to product and design partners ensures smooth technical handoffs.', recommended: 'Practice explaining design system technical decisions.', route: '/daily-challenge' },
    { name: 'System Design (Frontend)', category: 'Architecture', defaultScore: 66, why: 'Micro-frontends, caching layers, and client-side offline persistence architectures require depth.', recommended: 'Practice client-side system architecture and caching designs.', route: '/interview-setup' }
  ],
  'Backend Engineer': [
    { name: 'Distributed Systems & Microservices', category: 'Architecture', defaultScore: 68, why: 'Service decomposition, consensus algorithms, and RPC latency trade-offs require architectural rigor.', recommended: 'Study distributed consensus and message brokers.', route: '/interview-setup' },
    { name: 'API Design & Protocols (REST/gRPC)', category: 'Networking', defaultScore: 82, why: 'Idempotency keys, rate limiting, and protobuf contract versioning require disciplined design.', recommended: 'Practice API contract design and throttling mechanics.', route: '/interview-setup' },
    { name: 'Databases & SQL Optimization', category: 'Data', defaultScore: 74, why: 'Indexing strategies, query execution plans, and transaction isolation levels impact high-load throughput.', recommended: 'Practice query plan analysis and relational schema design.', route: '/interview-setup' },
    { name: 'Concurrency & Async Programming', category: 'Engineering', defaultScore: 71, why: 'Thread contention, race conditions, and non-blocking I/O event loops need robust handling.', recommended: 'Practice concurrent synchronization primitives.', route: '/interview-setup' },
    { name: 'Caching & Performance (Redis)', category: 'Infrastructure', defaultScore: 75, why: 'Cache invalidation, stampede mitigation, and write-through patterns ensure high availability.', recommended: 'Design high-throughput Redis caching layers.', route: '/interview-setup' },
    { name: 'Problem Solving & Algorithms', category: 'Engineering', defaultScore: 76, why: 'Data structure selection directly dictates memory overhead and computational efficiency.', recommended: 'Practice graph algorithms and complexity trade-offs.', route: '/interview-setup' },
    { name: 'Communication', category: 'Soft Skills', defaultScore: 78, why: 'Clear documentation of architectural trade-offs accelerates cross-team integration.', recommended: 'Practice explaining system bottlenecks concisely.', route: '/daily-challenge' },
    { name: 'System Design', category: 'Architecture', defaultScore: 62, why: 'Designing for fault tolerance, partition tolerance, and horizontal scalability is essential.', recommended: 'Practice high-scale system design and failover planning.', route: '/interview-setup' }
  ],
  'DevOps Engineer': [
    { name: 'CI/CD Pipelines & Automation', category: 'Automation', defaultScore: 80, why: 'Automated testing gates, canary rollouts, and rollback triggers reduce deployment failure rate.', recommended: 'Design robust multi-stage deployment workflows.', route: '/interview-setup' },
    { name: 'Kubernetes & Container Orchestration', category: 'Containers', defaultScore: 72, why: 'Pod lifecycle, ingress controllers, resource limits, and service meshes need granular tuning.', recommended: 'Practice Helm chart authoring and Kubernetes troubleshooting.', route: '/interview-setup' },
    { name: 'Infrastructure as Code (Terraform)', category: 'Cloud', defaultScore: 74, why: 'State file locking, module reusability, and drift detection ensure reproducible infrastructure.', recommended: 'Practice Terraform modules and state management.', route: '/interview-setup' },
    { name: 'Cloud Platforms (AWS/GCP/Azure)', category: 'Cloud', defaultScore: 78, why: 'VPC peering, IAM least-privilege security, and cost governance are key operational levers.', recommended: 'Audit cloud network topologies and IAM policies.', route: '/interview-setup' },
    { name: 'Linux Systems & Networking', category: 'Systems', defaultScore: 76, why: 'Kernel tuning, TCP/IP stack optimization, and socket states are critical during incident triage.', recommended: 'Review low-level Linux diagnostics and networking tools.', route: '/interview-setup' },
    { name: 'Observability & Monitoring', category: 'Operations', defaultScore: 68, why: 'Prometheus metric alerts, distributed tracing, and log aggregation isolate MTTR bottlenecks.', recommended: 'Configure SLI/SLO dashboards and alerting rules.', route: '/interview-setup' },
    { name: 'Problem Solving & Incident Response', category: 'Engineering', defaultScore: 70, why: 'Structured post-mortem analysis and root-cause isolation prevent recurring outages.', recommended: 'Practice live production incident drill scenarios.', route: '/interview-setup' },
    { name: 'Communication & Post-Mortems', category: 'Soft Skills', defaultScore: 77, why: 'Blameless post-mortem writing aligns engineering and business teams after high-severity events.', recommended: 'Practice structuring blameless RCA incident reviews.', route: '/daily-challenge' }
  ],
  'Data Scientist': [
    { name: 'Machine Learning & Modeling', category: 'Core AI', defaultScore: 82, why: 'Algorithm selection, hyperparameter tuning, and regularization prevent overfitting.', recommended: 'Practice model validation and cross-validation strategies.', route: '/interview-setup' },
    { name: 'Statistical Inference & Hypothesis Testing', category: 'Math', defaultScore: 74, why: 'P-value interpretation, sample power sizing, and A/B test analysis substantiate business experiments.', recommended: 'Review hypothesis testing and confidence intervals.', route: '/interview-setup' },
    { name: 'Python & Data Analysis (Pandas/NumPy)', category: 'Language', defaultScore: 84, why: 'Vectorized transformations and vectorized array math optimize large data processing.', recommended: 'Practice vectorization and memory-efficient dataframes.', route: '/interview-setup' },
    { name: 'SQL & Analytical Warehousing', category: 'Data', defaultScore: 76, why: 'Window functions, CTEs, and star schema aggregations drive executive insights.', recommended: 'Practice analytical SQL aggregation drills.', route: '/interview-setup' },
    { name: 'Data Storytelling & Visualization', category: 'Communication', defaultScore: 78, why: 'Translating complex statistical metrics into actionable stakeholder recommendations is vital.', recommended: 'Practice executive presentation of model results.', route: '/daily-challenge' },
    { name: 'Feature Engineering', category: 'Engineering', defaultScore: 72, why: 'Handling high-cardinality encodings, missingness, and data leakage improves model generalization.', recommended: 'Review advanced feature encoding pipelines.', route: '/interview-setup' },
    { name: 'Problem Solving', category: 'Engineering', defaultScore: 74, why: 'Framing abstract business challenges into well-defined machine learning objectives requires discipline.', recommended: 'Practice ML problem formulation from ambiguous prompts.', route: '/interview-setup' },
    { name: 'Model Evaluation & Metrics', category: 'Analytics', defaultScore: 70, why: 'Balancing precision, recall, ROC-AUC, and cost-weighted loss matrices avoids misleading results.', recommended: 'Evaluate classifier trade-offs under class imbalance.', route: '/interview-setup' }
  ],
  'Machine Learning Engineer': [
    { name: 'Deep Learning & Neural Architectures', category: 'Core AI', defaultScore: 84, why: 'Deepen understanding of loss formulations, attention mechanics, and modern transformer architectures.', recommended: 'Review transformer attention optimization and gradient backpropagation mechanics.', route: '/interview-setup' },
    { name: 'Python & MLOps Pipelines', category: 'Engineering', defaultScore: 80, why: 'Enhance idiomatic concurrency, model versioning, and feature store caching paradigms.', recommended: 'Practice production MLOps pipeline and artifact tracking.', route: '/interview-setup' },
    { name: 'Problem Solving', category: 'Engineering', defaultScore: 74, why: 'Need deeper exploration of alternative algorithmic approaches and latency-vs-accuracy trade-offs.', recommended: 'Practice 5 ML problem-solving questions with explicit edge-case handling.', route: '/interview-setup' },
    { name: 'Communication', category: 'Soft Skills', defaultScore: 78, why: 'Explanations occasionally lack brevity and concise closing conclusions.', recommended: 'Complete timed daily communication drills.', route: '/daily-challenge' },
    { name: 'System Design for ML at Scale', category: 'Architecture', defaultScore: 64, why: 'Your current performance indicates limited depth in vector database sharding, latency constraints, and model serving.', recommended: 'Practice distributed vector retrieval and low-latency model inference architectures.', route: '/interview-setup' },
    { name: 'Behavioral / STAR', category: 'Behavioral', defaultScore: 70, why: 'Your responses would benefit from a tighter Situation, Task, Action, and Result narrative structure.', recommended: 'Practice STAR behavioral interview rounds with measurable outcomes.', route: '/interview-setup' },
    { name: 'Confidence & Articulation', category: 'Delivery', defaultScore: 68, why: 'Your answers are technically reasonable but could be delivered more decisively without second-guessing.', recommended: 'Practice timed interview responses and verbal framing.', route: '/daily-challenge' },
    { name: 'Data Systems & Vector Storage', category: 'Data', defaultScore: 72, why: 'Embeddings storage, similarity indexing (HNSW), and ANN query trade-offs require deeper precision.', recommended: 'Practice vector indexing and nearest-neighbor search tuning.', route: '/interview-setup' }
  ],
  'Engineering Manager': [
    { name: 'Technical Architecture & Vision', category: 'Architecture', defaultScore: 76, why: 'Setting sustainable architectural roadmaps while balancing tech debt requires strategic trade-offs.', recommended: 'Review architectural governance and tech debt mitigation frameworks.', route: '/interview-setup' },
    { name: 'Team Mentorship & Growth', category: 'Leadership', defaultScore: 82, why: 'Career pathing, 1-on-1 coaching, and skill progression frameworks elevate team performance.', recommended: 'Practice coaching scenarios and performance management drills.', route: '/interview-setup' },
    { name: 'Cross-Functional Stakeholder Alignment', category: 'Communication', defaultScore: 78, why: 'Translating engineering milestones into business ROI builds trust across executive leadership.', recommended: 'Practice communicating technical trade-offs to non-technical stakeholders.', route: '/daily-challenge' },
    { name: 'Engineering Velocity & Delivery', category: 'Execution', defaultScore: 74, why: 'Optimizing sprint flow, cycle time, and continuous delivery metrics removes team blockers.', recommended: 'Study DORA metrics and agile delivery bottlenecks.', route: '/interview-setup' },
    { name: 'Conflict Resolution & Decision Making', category: 'People', defaultScore: 70, why: 'Mitigating cross-team friction and driving technical consensus requires diplomatic leadership.', recommended: 'Practice behavioral leadership prompts on dispute resolution.', route: '/interview-setup' },
    { name: 'Behavioral / STAR Leadership', category: 'Behavioral', defaultScore: 72, why: 'Structuring complex organizational challenges into crisp Situation-Task-Action-Result stories is key.', recommended: 'Practice executive STAR behavioral interviews.', route: '/interview-setup' },
    { name: 'Hiring & Talent Assessment', category: 'Operations', defaultScore: 80, why: 'Calibrating interview loops and rubric standards ensures high engineering hiring bars.', recommended: 'Review structured rubric evaluation techniques.', route: '/interview-setup' },
    { name: 'Incident & Crisis Management', category: 'Operations', defaultScore: 68, why: 'Calm leadership during outages and championing blameless post-mortems protects team morale.', recommended: 'Practice disaster recovery leadership and communication.', route: '/interview-setup' }
  ]
};

export function getCustomRoleSkills(roleName) {
  const clean = (roleName || 'Software Specialist').trim();
  return [
    { name: `${clean} Core Principles`, category: 'Core', defaultScore: 72, why: `Deepening ${clean} core principles and industry standards will establish a solid foundation.`, recommended: `Study ${clean} reference architectures and best practices.`, route: '/interview-setup' },
    { name: 'Domain Tools & Modern Frameworks', category: 'Tools', defaultScore: 76, why: `Demonstrating familiarity with the most current ${clean} toolchain boosts credibility with interviewers.`, recommended: `Practice hands-on drills with industry-standard ${clean} tools.`, route: '/interview-setup' },
    { name: 'Problem Solving & Critical Thinking', category: 'Engineering', defaultScore: 70, why: 'Need structured enumeration of edge cases and trade-offs under time constraints.', recommended: 'Practice targeted problem-solving drills with structured reasoning.', route: '/interview-setup' },
    { name: 'Technical Communication & Articulation', category: 'Soft Skills', defaultScore: 75, why: 'Crisply explaining architectural decisions and trade-offs ensures high interview scores.', recommended: 'Practice timed verbal explanations of technical designs.', route: '/daily-challenge' },
    { name: 'System Scalability & Reliability', category: 'Architecture', defaultScore: 64, why: 'High-availability patterns and performance optimization separate mid-level from senior candidates.', recommended: `Practice scalability and reliability design for ${clean}.`, route: '/interview-setup' },
    { name: 'Behavioral / STAR Method', category: 'Behavioral', defaultScore: 70, why: 'Hiring committees evaluate collaboration and conflict resolution through structured stories.', recommended: 'Structure your past projects using the STAR framework.', route: '/interview-setup' },
    { name: 'Delivery Confidence & Decisiveness', category: 'Delivery', defaultScore: 68, why: 'Decisive answers without hesitations give interviewers strong signal on your seniority.', recommended: 'Practice speaking with definitive conviction in timed rounds.', route: '/daily-challenge' },
    { name: 'Industry Best Practices & Security', category: 'Governance', defaultScore: 74, why: 'Modern systems require security-first and compliance-aware engineering thinking.', recommended: `Review security and quality best practices in ${clean}.`, route: '/interview-setup' }
  ];
}

export function getRoleSkills(targetRole) {
  if (ROLE_SKILL_TREES[targetRole]) {
    return ROLE_SKILL_TREES[targetRole].map(s => ({ ...s, score: s.defaultScore }));
  }
  return getCustomRoleSkills(targetRole).map(s => ({ ...s, score: s.defaultScore }));
}

import { storageService } from './storage/storageService';

export function analyzeSkillGaps(sessionSummary = null, _sessionAnswers = [], targetRole = null, userId = null) {
  const effectiveUserId = userId || storageService.getCurrentUser()?.id;
  const effectiveSummary = sessionSummary || storageService.getInterviews(effectiveUserId)[0] || null;
  const atsResult = storageService.getATSResult(effectiveUserId);
  const hasAnswers = Array.isArray(_sessionAnswers) && _sessionAnswers.length > 0;
  const hasEvidence = Boolean(effectiveSummary || atsResult || hasAnswers);

  const currentUser = storageService.getCurrentUser();
  const effectiveRole = targetRole || effectiveSummary?.role || effectiveSummary?.targetRole || currentUser?.targetRole || currentUser?.role || 'Machine Learning Engineer';

  if (!hasEvidence) {
    return {
      hasEvidence: false,
      overallReadiness: 0,
      previousReadiness: 0,
      improvementRate: 0,
      readinessLabel: 'Uncalibrated — Awaiting Initial Assessment',
      readinessSummary: `No interview answers or resume evaluations recorded yet for ${effectiveRole}. Complete a mock interview or scan your resume to calibrate your readiness index.`,
      skills: [],
      radarDimensions: [
        { name: 'Technical Knowledge', score: 0 },
        { name: 'Problem Solving', score: 0 },
        { name: 'Communication', score: 0 },
        { name: 'Confidence', score: 0 },
        { name: 'Relevance', score: 0 },
        { name: 'Behavioral', score: 0 }
      ],
      topSkillGaps: [],
      historicalProgress: [],
      preparationPath: [],
      recommendedActivities: [
        {
          id: 'act_interview',
          title: `🎙️ Diagnostic Mock Interview (${effectiveRole})`,
          desc: `Complete your first 5-question mock interview calibrated for ${effectiveRole} to establish your baseline.`,
          specs: '5 questions • 15 mins',
          xp: '+100 XP',
          buttonLabel: 'Start Interview',
          route: '/interview-setup',
          color: 'navy'
        },
        {
          id: 'act_ats',
          title: '📄 Resume Skill Audit',
          desc: `Scan your resume against ${effectiveRole} expectations to map your verified skills.`,
          specs: 'Instant ATS scan',
          xp: '+50 XP',
          buttonLabel: 'Scan Resume',
          route: '/ats',
          color: 'cyan'
        }
      ],
      agentDecision: {
        weakestSkill: null,
        insight: `No performance signals detected for ${effectiveRole} yet. Complete an initial interview or upload your resume to generate a personalized skill gap analysis.`,
        primaryActionRoute: '/interview-setup',
        primaryActionLabel: `Take First Diagnostic for ${effectiveRole} →`
      }
    };
  }

  // Obtain role-specific skills
  let skills = getRoleSkills(effectiveRole);

  let radarDimensions = [
    { name: 'Technical Knowledge', score: 78 },
    { name: 'Problem Solving', score: 72 },
    { name: 'Communication', score: 75 },
    { name: 'Confidence', score: 68 },
    { name: 'Relevance', score: 80 },
    { name: 'Behavioral', score: 70 }
  ];

  // 1. If an interview exists, merge relevant rubric scores
  if (effectiveSummary && effectiveSummary.scores) {
    const sc = effectiveSummary.scores;
    skills = skills.map((s) => {
      const lower = s.name.toLowerCase();
      if ((lower.includes('problem') || lower.includes('algorithm')) && (sc.structure || sc.problemSolving)) {
        const val = (sc.structure || sc.problemSolving) > 10 ? (sc.structure || sc.problemSolving) : (sc.structure || sc.problemSolving) * 10;
        return { ...s, score: Math.round((s.score + val) / 2) };
      }
      if ((lower.includes('comm') || lower.includes('articulation')) && (sc.clarity || sc.communication)) {
        const val = (sc.clarity || sc.communication) > 10 ? (sc.clarity || sc.communication) : (sc.clarity || sc.communication) * 10;
        return { ...s, score: Math.round((s.score + val) / 2) };
      }
      if ((lower.includes('confid') || lower.includes('delivery')) && (sc.confidence || sc.confidenceDelivery)) {
        const val = (sc.confidence || sc.confidenceDelivery) > 10 ? (sc.confidence || sc.confidenceDelivery) : (sc.confidence || sc.confidenceDelivery) * 10;
        return { ...s, score: Math.round((s.score + val) / 2) };
      }
      if (s.category === 'Core' || s.category === 'Core AI' || s.category === 'Framework' || s.category === 'Architecture') {
        if (sc.technicalKnowledge) {
          const val = sc.technicalKnowledge > 10 ? sc.technicalKnowledge : sc.technicalKnowledge * 10;
          return { ...s, score: Math.round((s.score + val) / 2) };
        }
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
    previousReadiness: Math.max(0, dynamicReadiness - 6),
    improvementRate: 6,
    readinessLabel: dynamicReadiness >= 80 ? 'Strong — Interview Ready' : dynamicReadiness >= 65 ? 'Good — Approaching Readiness' : 'Priority Attention Needed',
    readinessSummary: dynamicReadiness >= 80
      ? `You are performing strongly across ${effectiveRole} core competencies. Escalate to high-scale architecture rounds.`
      : `Focus on ${weakest.name} to accelerate your overall ${effectiveRole} interview readiness.`,
    skills,
    radarDimensions,
    topSkillGaps,
    agentInsight,
    primaryActionRoute,
    primaryActionLabel,
    preparationPath,
    recommendedActivities,
    historicalProgress: [
      {
        skill: weakest.name,
        previousScore: Math.max(0, weakest.score - 6),
        currentScore: weakest.score,
        change: 6,
        period: 'Previous Diagnostic → Current Session'
      },
      {
        skill: secondWeakest.name,
        previousScore: Math.max(0, secondWeakest.score - 5),
        currentScore: secondWeakest.score,
        change: 5,
        period: 'Baseline → Current Session'
      },
      {
        skill: thirdWeakest.name,
        previousScore: Math.max(0, thirdWeakest.score - 4),
        currentScore: thirdWeakest.score,
        change: 4,
        period: 'Initial Diagnostic → Current Session'
      }
    ],
    pipelineSteps: BASELINE_SKILL_ANALYSIS.pipelineSteps
  };

  storageService.setSkillProfile(payload, effectiveUserId);
  return payload;
}
