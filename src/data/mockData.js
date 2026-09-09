// Comprehensive Question Bank, Skills, ATS, and Gamification Data

export const MOCK_ROLES = [
  'Machine Learning Engineer',
  'Software Engineer',
  'Data Scientist',
  'AI Engineer',
  'Full Stack Web Developer',
  'DevOps & Cloud Engineer'
];

export const INTERVIEW_TYPES = [
  { id: 'Technical', label: 'Technical', desc: 'Core algorithms, architectures, and engineering concepts' },
  { id: 'HR', label: 'HR & Culture', desc: 'Background, cultural alignment, strengths, and workplace fit' },
  { id: 'Behavioral', label: 'Behavioral (STAR)', desc: 'Conflict resolution, leadership, and situation management' },
  { id: 'Role-Based', label: 'Role-Specific Deep Dive', desc: 'Real-world scenario problem solving and design tradeoffs' }
];

export const DIFFICULTY_LEVELS = [
  { id: 'Beginner', label: 'Beginner', desc: 'Entry-level, foundational concepts & definitions' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Mid-level, practical experience, architectures & tradeoffs' },
  { id: 'Advanced', label: 'Advanced', desc: 'Senior-level, high-scale system design & edge cases' }
];

export const QUESTION_BANK = {
  'Machine Learning Engineer': {
    Technical: [
      {
        id: 'ml_t1',
        difficulty: 'Intermediate',
        question: 'Explain the fundamental difference between Machine Learning and Deep Learning. When would you prefer a classical ML model over a deep neural network?',
        category: 'Machine Learning Fundamentals',
        idealKeywords: ['feature engineering', 'neural networks', 'data scale', 'interpretability', 'overfitting'],
        followUp: 'How do you handle feature selection when tabular data is noisy?'
      },
      {
        id: 'ml_t2',
        difficulty: 'Intermediate',
        question: 'What is overfitting, and what regularization techniques do you apply to prevent it in deep neural networks versus tree-based models?',
        category: 'Model Optimization',
        idealKeywords: ['regularization', 'dropout', 'l1/l2', 'early stopping', 'cross-validation', 'pruning'],
        followUp: 'What metrics in training vs validation loss curves indicate variance issues?'
      },
      {
        id: 'ml_t3',
        difficulty: 'Intermediate',
        question: 'What is the difference between Precision and Recall? In what real-world ML application would you prioritize Recall over Precision?',
        category: 'Model Evaluation',
        idealKeywords: ['false positive', 'false negative', 'medical diagnosis', 'fraud detection', 'f1-score'],
        followUp: 'How does changing the classification decision threshold affect the ROC curve?'
      },
      {
        id: 'ml_t4',
        difficulty: 'Advanced',
        question: 'How does Gradient Descent work mathematically, and why is Stochastic Gradient Descent (SGD) with momentum or Adam preferred in large models?',
        category: 'Optimization Algorithms',
        idealKeywords: ['learning rate', 'gradients', 'momentum', 'adaptive learning rate', 'convergence'],
        followUp: 'How do you choose the initial learning rate and scheduler?'
      },
      {
        id: 'ml_t5',
        difficulty: 'Advanced',
        question: 'Explain how the Transformer architecture uses Multi-Head Self-Attention. Why did it supersede recurrent networks (RNNs/LSTMs) for sequential modeling?',
        category: 'Deep Learning & NLP',
        idealKeywords: ['self-attention', 'query key value', 'parallelization', 'long-range dependencies', 'quadratic complexity'],
        followUp: 'How do FlashAttention or linear attention variants address the quadratic token complexity?'
      }
    ],
    HR: [
      {
        id: 'ml_hr1',
        difficulty: 'Beginner',
        question: 'Tell me about yourself and what sparked your passion for Machine Learning and Artificial Intelligence.',
        category: 'Background & Motivation',
        idealKeywords: ['projects', 'problem-solving', 'impact', 'passion', 'learning', 'journey'],
        followUp: 'What recent AI development or paper has excited you most recently?'
      },
      {
        id: 'ml_hr2',
        difficulty: 'Intermediate',
        question: 'Why do you want to join our engineering team specifically as a Machine Learning Engineer?',
        category: 'Cultural Alignment',
        idealKeywords: ['company mission', 'challenges', 'innovation', 'culture', 'scale'],
        followUp: 'What unique perspective or skill do you bring to our team?'
      },
      {
        id: 'ml_hr3',
        difficulty: 'Intermediate',
        question: 'How do you manage deadlines and stakeholder expectations when an ML research experiment yields lower accuracy than projected?',
        category: 'Expectation Management',
        idealKeywords: ['communication', 'iterative testing', 'stakeholders', 'pivoting', 'business goals'],
        followUp: 'Can you describe a time when an ML hypothesis failed and what you learned?'
      },
      {
        id: 'ml_hr4',
        difficulty: 'Beginner',
        question: 'Where do you see yourself professionally in the next 3 to 5 years in the AI/ML domain?',
        category: 'Career Trajectory',
        idealKeywords: ['leadership', 'architecture', 'mentorship', 'scaling models', 'business value'],
        followUp: 'What specific skill gap are you actively working to close today?'
      }
    ],
    Behavioral: [
      {
        id: 'ml_b1',
        difficulty: 'Intermediate',
        question: 'Describe a situation where you worked on a challenging project with messy or missing data. How did you handle it and what was the outcome? (Use the STAR method)',
        category: 'Problem Solving (STAR)',
        idealKeywords: ['situation', 'task', 'action', 'result', 'imputation', 'data cleaning'],
        followUp: 'If you could redo that project today with new tools, what would you do differently?'
      },
      {
        id: 'ml_b2',
        difficulty: 'Intermediate',
        question: 'Tell me about a disagreement you had with a software developer or product manager regarding model latency vs model accuracy. How did you reach a consensus?',
        category: 'Conflict Resolution (STAR)',
        idealKeywords: ['tradeoffs', 'quantization', 'latency', 'business impact', 'listening', 'collaboration'],
        followUp: 'How did you validate the consensus in production metrics?'
      },
      {
        id: 'ml_b3',
        difficulty: 'Advanced',
        question: 'Describe a time when your ML model made an unexpected or biased prediction in testing. How did you diagnose the root cause and ensure fair outcomes?',
        category: 'Ethical & Quality Ownership',
        idealKeywords: ['bias', 'fairness', 'slice analysis', 'subgroup accuracy', 'root cause', 'mitigation'],
        followUp: 'How did you communicate the issue to leadership?'
      }
    ],
    'Role-Based': [
      {
        id: 'ml_rb1',
        difficulty: 'Advanced',
        question: 'You are tasked with deploying a computer vision or LLM pipeline that needs to process 1,000 requests per second under 100ms latency. How would you architect this?',
        category: 'ML System Design',
        idealKeywords: ['onnx', 'tensorrt', 'batching', 'caching', 'horizontal scaling', 'load balancing'],
        followUp: 'How would you monitor model drift and performance degradation in production?'
      },
      {
        id: 'ml_rb2',
        difficulty: 'Advanced',
        question: 'Design an end-to-end continuous retraining pipeline for an e-commerce recommendation system that handles concept drift. What components would you include?',
        category: 'MLOps Architecture',
        idealKeywords: ['data drift', 'feature store', 'shadow deployment', 'canary release', 'kafka', 'mlflow'],
        followUp: 'How do you prevent catastrophic forgetting during online updates?'
      }
    ]
  },
  'Software Engineer': {
    Technical: [
      {
        id: 'se_t1',
        difficulty: 'Intermediate',
        question: 'Explain the difference between a process and a thread. How does the operating system schedule them, and how do you prevent race conditions?',
        category: 'Operating Systems & Concurrency',
        idealKeywords: ['memory space', 'shared memory', 'mutex', 'semaphore', 'deadlock', 'context switch'],
        followUp: 'What are optimistic vs pessimistic concurrency controls in distributed databases?'
      },
      {
        id: 'se_t2',
        difficulty: 'Intermediate',
        question: 'Describe how a Hash Map works under the hood. What happens during a hash collision, and how is amortized O(1) lookup achieved?',
        category: 'Data Structures',
        idealKeywords: ['hash function', 'buckets', 'chaining', 'open addressing', 'load factor', 'rehashing'],
        followUp: 'What are the security implications of predictable hash seed collisions?'
      },
      {
        id: 'se_t3',
        difficulty: 'Intermediate',
        question: 'Explain the principles of RESTful API design. When might you choose GraphQL or gRPC over standard REST?',
        category: 'API Architecture',
        idealKeywords: ['stateless', 'http verbs', 'overfetching', 'protobuf', 'binary serialization', 'latency'],
        followUp: 'How do you design idempotency for payment or checkout endpoints?'
      },
      {
        id: 'se_t4',
        difficulty: 'Advanced',
        question: 'Walk me through what happens under the hood when a user types a URL into a web browser and presses Enter.',
        category: 'Networking & Systems',
        idealKeywords: ['dns lookup', 'tcp handshake', 'tls', 'http request', 'dom rendering', 'cdn'],
        followUp: 'How does HTTP/2 or HTTP/3 improve over HTTP/1.1 head-of-line blocking?'
      }
    ],
    HR: [
      {
        id: 'se_hr1',
        difficulty: 'Beginner',
        question: 'Tell me about yourself and your primary technical stack.',
        category: 'Background',
        idealKeywords: ['stack', 'backend', 'frontend', 'systems', 'projects', 'problem-solving'],
        followUp: 'What programming language do you feel most productive in, and why?'
      },
      {
        id: 'se_hr2',
        difficulty: 'Intermediate',
        question: 'Where do you see your engineering career evolving over the next 3 to 5 years?',
        category: 'Career Vision',
        idealKeywords: ['architecture', 'mentorship', 'leadership', 'scalability', 'continuous learning'],
        followUp: 'What technical domain are you currently upskilling in?'
      },
      {
        id: 'se_hr3',
        difficulty: 'Beginner',
        question: 'What are your greatest technical strengths, and what is one area you consider a current weakness?',
        category: 'Self-Awareness',
        idealKeywords: ['strengths', 'weakness', 'growth', 'action plan', 'reflection'],
        followUp: 'How have you actively worked to improve on that weakness recently?'
      }
    ],
    Behavioral: [
      {
        id: 'se_b1',
        difficulty: 'Intermediate',
        question: 'Describe a production bug or outage that you were responsible for or helped fix under high pressure. What happened, how did you respond, and what was the resolution?',
        category: 'Incident Management (STAR)',
        idealKeywords: ['triage', 'rollback', 'post-mortem', 'root cause', 'monitoring', 'ownership'],
        followUp: 'What automated guardrail or test did you add to prevent recurrence?'
      },
      {
        id: 'se_b2',
        difficulty: 'Intermediate',
        question: 'Tell me about a time when you had to convince teammates or senior engineers to adopt a new tool or architecture. How did you build support?',
        category: 'Influence & Teamwork (STAR)',
        idealKeywords: ['proof of concept', 'benchmark', 'tradeoffs', 'listening', 'documentation'],
        followUp: 'What resistance did you encounter and how did you resolve it?'
      }
    ],
    'Role-Based': [
      {
        id: 'se_rb1',
        difficulty: 'Advanced',
        question: 'Design a URL shortener like Bitly that handles 100 million active URLs and 10,000 write requests per second. What database, caching, and hashing strategy do you choose?',
        category: 'System Design',
        idealKeywords: ['base62', 'redis cache', 'sharding', 'nosql', 'unique id generator', 'availability'],
        followUp: 'How do you prevent collisions when generating the shortened hash across distributed nodes?'
      }
    ]
  },
  'Data Scientist': {
    Technical: [
      {
        id: 'ds_t1',
        difficulty: 'Intermediate',
        question: 'Explain the Central Limit Theorem and why it is foundational for statistical hypothesis testing and A/B experimentation.',
        category: 'Statistics & Probability',
        idealKeywords: ['sample mean', 'normal distribution', 'variance', 'sample size', 'p-value'],
        followUp: 'How do you determine the required sample size and statistical power before running an A/B test?'
      },
      {
        id: 'ds_t2',
        difficulty: 'Intermediate',
        question: 'How do you detect and handle severe class imbalance in a fraud detection dataset?',
        category: 'Data Science Modeling',
        idealKeywords: ['smote', 'resampling', 'class weights', 'pr-auc', 'stratified k-fold'],
        followUp: 'Why is standard accuracy a misleading metric for imbalanced classification?'
      },
      {
        id: 'ds_t3',
        difficulty: 'Advanced',
        question: 'How do you explain the bias-variance tradeoff mathematically and how do L1 (Lasso) and L2 (Ridge) regularizations influence model coefficients?',
        category: 'Statistical Learning',
        idealKeywords: ['bias', 'variance', 'coefficients', 'sparsity', 'shrinkage', 'overfitting'],
        followUp: 'When would ElasticNet be superior to either Lasso or Ridge alone?'
      }
    ],
    HR: [
      {
        id: 'ds_hr1',
        difficulty: 'Beginner',
        question: 'How do you communicate complex statistical insights or model decisions to non-technical business stakeholders?',
        category: 'Communication',
        idealKeywords: ['storytelling', 'business metrics', 'visualizations', 'simplicity', 'impact'],
        followUp: 'Can you give an example where your data insight changed a business decision?'
      }
    ],
    Behavioral: [
      {
        id: 'ds_b1',
        difficulty: 'Intermediate',
        question: 'Describe a time when data showed an unexpected result that contradicted management expectations. How did you present your findings?',
        category: 'Objectivity & Influence (STAR)',
        idealKeywords: ['integrity', 'verification', 'deep dive', 'presentation', 'constructive dialogue'],
        followUp: 'How did the stakeholders ultimately respond?'
      }
    ],
    'Role-Based': [
      {
        id: 'ds_rb1',
        difficulty: 'Advanced',
        question: 'Design an end-to-end churn prediction pipeline for a subscription SaaS platform. What features would you engineer and how would business teams act on predictions?',
        category: 'Business ML Design',
        idealKeywords: ['feature engineering', 'recency frequency', 'shap values', 'interventions', 'uplift modeling'],
        followUp: 'How would you measure the dollar ROI of the churn reduction program?'
      }
    ]
  },
  'AI Engineer': {
    Technical: [
      {
        id: 'ai_t1',
        difficulty: 'Intermediate',
        question: 'What is Retrieval-Augmented Generation (RAG)? How do chunking strategies and embedding models affect retrieval quality in an enterprise document search engine?',
        category: 'Generative AI & LLMs',
        idealKeywords: ['rag', 'vector database', 'embeddings', 'chunk size', 'semantic search', 'cosine similarity'],
        followUp: 'How do you prevent hallucination when retrieved contexts contradict each other?'
      },
      {
        id: 'ai_t2',
        difficulty: 'Advanced',
        question: 'Compare Low-Rank Adaptation (LoRA) and full fine-tuning. How does LoRA drastically reduce GPU VRAM requirements while preserving generative capabilities?',
        category: 'Model Fine-Tuning & Quantization',
        idealKeywords: ['lora', 'rank', 'matrix decomposition', 'vram', 'adapters', 'frozen weights'],
        followUp: 'What quantization methods (e.g. QLoRA, AWQ) do you use for edge deployment?'
      }
    ],
    HR: [
      {
        id: 'ai_hr1',
        difficulty: 'Beginner',
        question: 'Tell me about yourself and your experience building agentic applications or LLM pipelines.',
        category: 'Background & Motivation',
        idealKeywords: ['agents', 'rag', 'projects', 'evaluation', 'problem-solving'],
        followUp: 'How do you stay abreast of the rapid weekly advancements in generative AI?'
      }
    ],
    Behavioral: [
      {
        id: 'ai_b1',
        difficulty: 'Intermediate',
        question: 'Tell me about a project where an AI model generated hallucinations or edge-case errors in production. How did you troubleshoot and build guardrails?',
        category: 'Safety & Guardrails (STAR)',
        idealKeywords: ['evals', 'grounding', 'guardrails', 'prompt engineering', 'validation'],
        followUp: 'How did you establish continuous regression benchmarking for the prompts?'
      }
    ],
    'Role-Based': [
      {
        id: 'ai_rb1',
        difficulty: 'Advanced',
        question: 'Architect an autonomous multi-agent customer support assistant that handles refunds, order lookups, and technical troubleshooting with human-in-the-loop controls.',
        category: 'Agentic Systems Design',
        idealKeywords: ['tools', 'function calling', 'state machine', 'human-in-the-loop', 'memory', 'fallback'],
        followUp: 'How do you prevent prompt injection attacks in customer-facing agent inputs?'
      }
    ]
  },
  'Full Stack Web Developer': {
    Technical: [
      {
        id: 'fs_t1',
        difficulty: 'Intermediate',
        question: 'Explain the difference between Server-Side Rendering (SSR), Client-Side Rendering (CSR), and Static Site Generation (SSG). What are the Core Web Vitals implications?',
        category: 'Web Architecture',
        idealKeywords: ['hydration', 'lcp', 'seo', 'ttfb', 'next.js', 'bundle size'],
        followUp: 'How do React Server Components (RSC) alter the traditional SSR mental model?'
      },
      {
        id: 'fs_t2',
        difficulty: 'Intermediate',
        question: 'How does the browser event loop work regarding call stack, microtask queue (Promises), and macrotask queue (setTimeout)?',
        category: 'JavaScript Runtime',
        idealKeywords: ['call stack', 'microtasks', 'macrotasks', 'event loop', 'non-blocking', 'async'],
        followUp: 'In what order will code execute when mixing Promise.resolve() and setTimeout(..., 0)?'
      }
    ],
    HR: [
      {
        id: 'fs_hr1',
        difficulty: 'Beginner',
        question: 'Tell me about yourself and an impactful web application you recently designed and deployed end-to-end.',
        category: 'Background',
        idealKeywords: ['frontend', 'backend', 'database', 'ux', 'scalability'],
        followUp: 'What was the toughest engineering decision you made on that project?'
      }
    ],
    Behavioral: [
      {
        id: 'fs_b1',
        difficulty: 'Intermediate',
        question: 'Describe a situation where you had to balance building technical debt vs shipping an urgent feature requested by the product team. How did you navigate the tradeoff?',
        category: 'Tradeoff Management (STAR)',
        idealKeywords: ['technical debt', 'prioritization', 'communication', 'mvp', 'refactoring'],
        followUp: 'How did you ensure the tech debt was eventually paid down?'
      }
    ],
    'Role-Based': [
      {
        id: 'fs_rb1',
        difficulty: 'Advanced',
        question: 'Design a collaborative real-time document editing app like Google Docs. How do you handle concurrent conflict resolution and live cursor updates?',
        category: 'Full Stack System Design',
        idealKeywords: ['websockets', 'ot', 'crdt', 'redis pub/sub', 'optimistic updates', 'latency'],
        followUp: 'Why are CRDTs often preferred over Operational Transformation in decentralized architectures?'
      }
    ]
  },
  'DevOps & Cloud Engineer': {
    Technical: [
      {
        id: 'do_t1',
        difficulty: 'Intermediate',
        question: 'Explain how Kubernetes handles container scheduling, Pod self-healing, and service discovery within a cluster.',
        category: 'Container Orchestration',
        idealKeywords: ['kube-scheduler', 'kubelet', 'etcd', 'service', 'ingress', 'replicaset'],
        followUp: 'What is the difference between liveness and readiness probes?'
      },
      {
        id: 'do_t2',
        difficulty: 'Advanced',
        question: 'What is Infrastructure as Code (IaC)? How do you manage Terraform state files securely across collaborative distributed teams while preventing drift?',
        category: 'Cloud Infrastructure',
        idealKeywords: ['terraform state', 'locking', 's3 backend', 'dynamodb', 'drift detection', 'gitops'],
        followUp: 'How do you implement zero-downtime blue/green or canary deployments?'
      }
    ],
    HR: [
      {
        id: 'do_hr1',
        difficulty: 'Beginner',
        question: 'Tell me about yourself and what drawn you into site reliability engineering and cloud operations.',
        category: 'Background',
        idealKeywords: ['automation', 'reliability', 'ci/cd', 'cloud', 'monitoring'],
        followUp: 'What cloud provider are you most experienced with?'
      }
    ],
    Behavioral: [
      {
        id: 'do_b1',
        difficulty: 'Intermediate',
        question: 'Walk me through a major cloud infrastructure outage or security incident you navigated. What was your incident management protocol and post-mortem outcome?',
        category: 'Incident Response (STAR)',
        idealKeywords: ['incident command', 'rollback', 'rca', 'monitoring', 'preventative actions'],
        followUp: 'How did you ensure transparency with affected engineering teams?'
      }
    ],
    'Role-Based': [
      {
        id: 'do_rb1',
        difficulty: 'Advanced',
        question: 'Design a multi-region, highly available, auto-scaling cloud architecture on AWS/GCP that achieves 99.99% SLA with automated failover and cost optimization.',
        category: 'Cloud System Design',
        idealKeywords: ['multi-region', 'route 53', 'load balancing', 'auto-scaling', 'database replication', 'cost optimization'],
        followUp: 'How do you handle cross-region database replication latency and consistency?'
      }
    ]
  }
};

export const MOCK_USER = {
  name: 'Alex Rivera',
  email: 'alex.rivera@career-ai.dev',
  role: 'Machine Learning Engineer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  level: 12,
  title: 'Interview Explorer',
  xp: 1240,
  xpToNextLevel: 1500,
  streak: 7,
  interviewsCompleted: 14,
  averageScore: 82,
  questionsAnswered: 86,
  weeklyStreak: [
    { day: 'Mon', completed: true },
    { day: 'Tue', completed: true },
    { day: 'Wed', completed: true },
    { day: 'Thu', completed: true },
    { day: 'Fri', completed: true },
    { day: 'Sat', completed: true },
    { day: 'Sun', completed: false, isToday: true }
  ]
};

export const MOCK_SKILL_GAP = {
  targetRole: 'Machine Learning Engineer',
  overallReadiness: 78,
  strongSkills: [
    { name: 'Python & Scientific Stack', score: 92, status: 'Strong', tag: 'Expert' },
    { name: 'Machine Learning & Scikit-Learn', score: 87, status: 'Strong', tag: 'Advanced' },
    { name: 'Deep Learning & PyTorch', score: 84, status: 'Strong', tag: 'Proficient' },
    { name: 'Data Preprocessing & Feature Engineering', score: 81, status: 'Strong', tag: 'Proficient' }
  ],
  needsImprovement: [
    { name: 'SQL & Data Warehousing', score: 72, status: 'Moderate', tag: 'Needs Practice' },
    { name: 'Communication & Answer Structuring', score: 63, status: 'Improvement', tag: 'Priority' },
    { name: 'Docker & Containerization', score: 51, status: 'Weak', tag: 'Skill Gap' },
    { name: 'AWS Cloud & MLOps Infrastructure', score: 43, status: 'Weak', tag: 'Critical Gap' }
  ],
  aiRecommendation: 'Your core algorithmic and machine learning foundations are exceptional (87%+). To cross the threshold into senior hiring pipelines, prioritize cloud deployment (AWS SageMaker/Docker) and polish your STAR-method communication structure.'
};

export const MOCK_ATS_RESULT = {
  overallScore: 84,
  fileName: 'Alex_Rivera_ML_Engineer_Resume.pdf',
  targetRole: 'Machine Learning Engineer',
  breakdown: [
    { label: 'Keyword Match', score: 91, status: 'Excellent', color: '#22C55E' },
    { label: 'Skills Alignment', score: 88, status: 'Strong', color: '#06B6D4' },
    { label: 'Formatting & ATS Parseability', score: 76, status: 'Good', color: '#A855F7' },
    { label: 'Project Impact & Metrics', score: 72, status: 'Needs Improvement', color: '#EAB308' },
    { label: 'Experience Match', score: 82, status: 'Strong', color: '#7C3AED' }
  ],
  matchedKeywords: [
    'Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Transformers', 'NLP', 'Computer Vision',
    'Model Training', 'Hyperparameter Tuning', 'Git', 'Pandas', 'NumPy', 'Data Pipelines'
  ],
  missingKeywords: [
    'AWS / Cloud Infrastructure', 'Docker', 'Kubernetes', 'MLflow / Experiment Tracking', 'CI/CD Pipelines'
  ],
  weakAreas: [
    'Project bullet points lack quantified business outcomes (e.g. state "reduced latency by 32%" rather than "improved model performance").',
    'Cloud containerization credentials (Docker/K8s) are omitted despite being required in 85% of ML job specs.',
    'Resume section headers use non-standard styling that could confuse older legacy ATS parsers.'
  ],
  aiRecommendations: [
    'Add specific cloud and MLOps keywords: AWS SageMaker, Docker, CI/CD, Kubernetes.',
    'Rephrase project descriptions using the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
    'Include a dedicated Technical Skills summary matrix at the top third of page 1 for immediate ATS indexing.',
    'Practice mock technical interview questions on MLOps and System Design to substantiate resume claims.'
  ]
};

export const MOCK_RECENT_INTERVIEWS = [
  {
    id: 'int-103',
    role: 'Machine Learning Engineer',
    type: 'Technical Deep Dive',
    date: 'Yesterday at 4:15 PM',
    score: 82,
    questionsCount: 5,
    status: 'Completed',
    feedbackSummary: 'Solid mathematical explanation of Transformers; could structure STAR responses better.'
  },
  {
    id: 'int-102',
    role: 'AI Engineer',
    type: 'System Design',
    date: '3 days ago',
    score: 76,
    questionsCount: 4,
    status: 'Completed',
    feedbackSummary: 'Good scalability discussion, missed latency caching mechanisms with Redis.'
  },
  {
    id: 'int-101',
    role: 'Machine Learning Engineer',
    type: 'Behavioral (STAR)',
    date: 'Sep 3, 2026',
    score: 85,
    questionsCount: 4,
    status: 'Completed',
    feedbackSummary: 'High empathy, clear conflict resolution narrative, well-structured outcomes.'
  }
];

export const MOCK_ACHIEVEMENTS = [
  {
    id: 'ach-1',
    title: 'First Interview',
    desc: 'Completed your first AI mock interview session',
    icon: '🏅',
    unlocked: true,
    unlockedDate: 'Aug 28, 2026',
    category: 'Milestone'
  },
  {
    id: 'ach-2',
    title: '7-Day Streak',
    desc: 'Maintained continuous career preparation for a full week',
    icon: '🔥',
    unlocked: true,
    unlockedDate: 'Today',
    category: 'Consistency'
  },
  {
    id: 'ach-3',
    title: '10 Interviews Master',
    desc: 'Completed 10 comprehensive interview rounds',
    icon: '🎯',
    unlocked: true,
    unlockedDate: 'Sep 2, 2026',
    category: 'Mastery'
  },
  {
    id: 'ach-4',
    title: 'Perfect Answer',
    desc: 'Scored 9.5 or higher on an in-depth technical response',
    icon: '💯',
    unlocked: true,
    unlockedDate: 'Sep 5, 2026',
    category: 'Excellence'
  },
  {
    id: 'ach-5',
    title: 'Resume Optimizer',
    desc: 'Scored above 80% on the ATS resume evaluation scanner',
    icon: '📄',
    unlocked: true,
    unlockedDate: 'Sep 6, 2026',
    category: 'Preparation'
  },
  {
    id: 'ach-6',
    title: 'Technical Master',
    desc: 'Achieve 90%+ average across 5 consecutive technical interviews',
    icon: '🧠',
    unlocked: false,
    progress: 75,
    category: 'Elite'
  },
  {
    id: 'ach-7',
    title: 'Communication Pro',
    desc: 'Maintain 85%+ score on clarity, STAR structure and confidence',
    icon: '🎤',
    unlocked: false,
    progress: 60,
    category: 'Soft Skills'
  },
  {
    id: 'ach-8',
    title: '30-Day Streak',
    desc: 'Practice daily for 30 consecutive days without breaking momentum',
    icon: '🏆',
    unlocked: false,
    progress: 23,
    category: 'Consistency'
  }
];

export const MOCK_DAILY_CHALLENGES = [
  {
    id: 'dc-0',
    title: 'Explain Supervised vs. Unsupervised Learning',
    category: 'Machine Learning Fundamentals',
    difficulty: 'Foundational',
    stars: 3,
    xpReward: 50,
    timeLimitMinutes: 5,
    prompt: 'Explain the fundamental difference between supervised and unsupervised learning. Provide one real-world production example of each and describe how label availability dictates the training methodology.',
    sampleGuidance: 'Highlight labeled ground truth vs latent cluster discovery, cost of labeling, and real-world examples (e.g. churn prediction vs customer segmentation).'
  },
  {
    id: 'dc-1',
    title: 'Explain Random Forest to a 10-Year-Old',
    category: 'Machine Learning',
    difficulty: 'Intermediate',
    stars: 3,
    xpReward: 35,
    timeLimitMinutes: 5,
    prompt: 'Imagine you are explaining the Random Forest algorithm to a 10-year-old or a non-technical recruiter. Use a simple, vivid analogy (like voting friends or animal detectives) without technical jargon.',
    sampleGuidance: 'Focus on simplicity, ensemble voting concept, and why multiple opinions are better than one single guess.'
  },
  {
    id: 'dc-2',
    title: 'The CAP Theorem Tradeoff',
    category: 'System Design',
    difficulty: 'Advanced',
    stars: 4,
    xpReward: 50,
    timeLimitMinutes: 5,
    prompt: 'Briefly state the CAP Theorem. When building an instant messaging app vs a banking ledger, which two properties do you prioritize and why?',
    sampleGuidance: 'Mention Consistency, Availability, Partition tolerance and provide clear rationale for each system.'
  }
];

export const MOCK_PROGRESS_HISTORY = [
  { week: 'Week 1', overall: 68, technical: 74, communication: 62, confidence: 58 },
  { week: 'Week 2', overall: 73, technical: 79, communication: 66, confidence: 64 },
  { week: 'Week 3', overall: 78, technical: 83, communication: 70, confidence: 69 },
  { week: 'Week 4', overall: 82, technical: 88, communication: 72, confidence: 74 }
];

export const DEFAULT_MOCK_INTERVIEW_RESULT = {
  overallScore: 82,
  qualitativeRating: 'Strong Performance',
  xpEarned: 120,
  streakDays: 7,
  questionsCompleted: 5,
  totalQuestions: 5,
  targetRole: 'Machine Learning Engineer',
  interviewType: 'Technical Deep Dive',
  rubricScores: {
    technicalKnowledge: 86,
    problemSolving: 79,
    communicationSTAR: 84,
    promptRelevance: 88,
    confidenceDelivery: 76
  },
  rubricDetails: [
    {
      id: 'technicalKnowledge',
      label: 'Technical Knowledge',
      score: 86,
      explanation: 'Strong understanding of core ML concepts and terminology.',
      tag: 'Above Average',
      color: '#7C3AED'
    },
    {
      id: 'problemSolving',
      label: 'Problem Solving',
      score: 79,
      explanation: 'Good reasoning, but include more edge cases and trade-off analysis.',
      tag: 'Needs Focus',
      color: '#06B6D4'
    },
    {
      id: 'communicationSTAR',
      label: 'Communication & STAR',
      score: 84,
      explanation: 'Well structured responses with generally clear explanations.',
      tag: 'Proficient',
      color: '#A855F7'
    },
    {
      id: 'promptRelevance',
      label: 'Prompt Relevance',
      score: 88,
      explanation: "Responses directly addressed the interviewer's questions.",
      tag: 'Excellent',
      color: '#22C55E'
    },
    {
      id: 'confidenceDelivery',
      label: 'Confidence & Delivery',
      score: 76,
      explanation: 'Good delivery, but answers can be more decisive and concise.',
      tag: 'Priority Area',
      color: '#EC4899'
    }
  ],
  aiSummary: "You demonstrated strong understanding of machine learning fundamentals and addressed the main concepts correctly. Your answers were relevant and technically sound. To improve your interview readiness, focus on giving more concrete project examples, measurable outcomes, and concise conclusions.",
  strengths: [
    'Strong technical terminology',
    'Good understanding of ML concepts',
    'Relevant answers',
    'Clear explanation of core concepts',
    'Good response structure'
  ],
  improvements: [
    'Include more real-world examples',
    'Add measurable project results',
    'Improve STAR structure for behavioral questions',
    'Give concise conclusions',
    'Explain trade-offs more explicitly'
  ],
  recommendationFocus: 'Problem Solving + Confidence',
  recommendationExplanation: 'Based on your interview performance, these are the areas where additional practice will provide the greatest improvement.',
  recommendedActions: [
    {
      id: 'act_1',
      num: 1,
      title: 'Practice 5 ML problem-solving questions',
      desc: 'Deepen edge-case handling and latency-vs-accuracy trade-offs.',
      category: 'Problem Solving Drill',
      tag: 'High Priority',
      badgeColor: 'cyan',
      route: '/interview-setup'
    },
    {
      id: 'act_2',
      num: 2,
      title: "Complete today's communication challenge",
      desc: 'Practice delivering concise, high-impact verbal answers using the STAR method.',
      category: 'Verbal Cadence',
      tag: 'Daily Habit',
      badgeColor: 'amber',
      route: '/daily-challenge'
    },
    {
      id: 'act_3',
      num: 3,
      title: 'Take another Technical Mock Interview',
      desc: 'Simulate a higher-difficulty adaptive round to test your retention.',
      category: 'Comprehensive Mock',
      tag: 'Readiness Test',
      badgeColor: 'purple',
      route: '/interview-setup'
    }
  ],
  timelineSteps: [
    {
      step: 1,
      title: 'Interview Completed',
      desc: '5 of 5 questions recorded and submitted to the evaluation engine.'
    },
    {
      step: 2,
      title: 'Responses Evaluated',
      desc: 'Scored across the 5 core dimensions matching your preparation rubric.'
    },
    {
      step: 3,
      title: 'Weaknesses Identified',
      desc: 'Isolated deficits in Problem Solving (79%) and Confidence (76%).'
    },
    {
      step: 4,
      title: 'Skill Gap Updated',
      desc: 'Refreshed candidate readiness benchmarks against market standards.'
    },
    {
      step: 5,
      title: 'Personalized Practice Recommended',
      desc: 'Generated a customized 3-part remediation action plan.'
    }
  ],
  questionPerformance: [
    {
      num: 1,
      dimension: 'Technical Knowledge',
      score: 88,
      question: 'Explain the fundamental difference between Machine Learning and Deep Learning. When would you prefer a classical ML model over a deep neural network?',
      userAnswer: 'Machine Learning relies on explicit feature engineering algorithms like Random Forests and SVMs, whereas Deep Learning uses layered neural networks to learn representations from raw data. In our past project we used XGBoost for tabular data for low latency and high interpretability, while using Transformers for semantic search.',
      feedback: 'Excellent explanation of representation learning vs feature engineering. Concrete project example added strong credibility.'
    },
    {
      num: 2,
      dimension: 'Problem Solving',
      score: 76,
      question: 'What is overfitting, and what regularization techniques do you apply to prevent it in deep neural networks versus tree-based models?',
      userAnswer: 'Overfitting happens when the model memorizes noise in the training set and fails to generalize to validation data. For neural networks we use dropout, batch normalization, weight decay (L2), and early stopping. For tree models, we prune max depth, set minimum samples per leaf, and tune subsample ratios.',
      feedback: 'Good enumeration of techniques. Mentioning validation loss curve monitoring and early stopping criteria would elevate this further.'
    },
    {
      num: 3,
      dimension: 'Prompt Relevance',
      score: 91,
      question: 'What is the difference between Precision and Recall? In what real-world ML application would you prioritize Recall over Precision?',
      userAnswer: 'Precision measures true positives over all predicted positives (purity), whereas Recall measures true positives over all actual positives (completeness). In medical cancer diagnosis or financial fraud detection, Recall is strictly prioritized because a false negative can be catastrophic.',
      feedback: 'Spot-on definition with an exceptionally relevant real-world scenario (medical screening). Directly addressed both parts of the prompt.'
    },
    {
      num: 4,
      dimension: 'Communication & STAR',
      score: 84,
      question: 'Describe a situation where you worked on a challenging project with messy or missing data. How did you handle it and what was the outcome?',
      userAnswer: 'In our predictive maintenance pipeline, sensor logs had 25% missing values due to network drops. I led the imputation strategy, comparing KNN with forward-fill, and established an automated data validation pipeline. This improved model AUC by 14% and reduced downtime alarms.',
      feedback: 'Good adherence to Situation, Task, Action, Result. Quantified outcome (+14% AUC) was very effective.'
    },
    {
      num: 5,
      dimension: 'Confidence & Delivery',
      score: 73,
      question: 'You are tasked with deploying a computer vision or LLM pipeline that needs to process 1,000 requests per second under 100ms latency. How would you architect this?',
      userAnswer: 'I would use model quantization (FP16 or INT8 with TensorRT), dynamic request batching, and horizontal Pod autoscaling behind an Envoy load balancer. I think Redis caching could also help for common embeddings.',
      feedback: 'Solid architectural elements mentioned, but delivery could sound more decisive regarding cache invalidation and cold-start mitigations.'
    }
  ]
};

export const DEFAULT_DASHBOARD_DATA = {
  userName: 'Alex Rivera',
  targetRole: 'Machine Learning Engineer',
  streak: 7,
  xp: 1240,
  xpMax: 1500,
  level: 12,
  readiness: 78,
  readinessDelta: 6,
  atsScore: 84,
  atsDelta: 4,
  atsKeywordMatch: 88,
  atsSkillsMatch: 82,
  atsFormatting: 90,

  agentRecommendation: {
    title: 'Focus on Confidence & Problem Solving',
    description: 'Your technical knowledge is strong, but your recent interview performance shows that confidence and problem solving have the largest improvement opportunities.',
    rationale: `InterviewAI analyzed:
• Interview scores (73% Confidence, 76% Problem Solving)
• Skill gaps against target Machine Learning Engineer benchmarks
• Previous performance trajectory (+14 points overall)
and selected this activity as your next best action.`,
    primaryActionLabel: 'Practice Now →',
    primaryActionRoute: '/skill-gap'
  },

  agentStatus: {
    isActive: true,
    lastAnalysis: 'Today',
    profile: 'Machine Learning Engineer',
    currentFocus: 'Confidence + Problem Solving',
    nextRecommendation: 'Communication Challenge'
  },

  skills: [
    { name: 'Machine Learning', score: 86, category: 'Core AI' },
    { name: 'Python', score: 82, category: 'Language' },
    { name: 'Communication', score: 78, category: 'Soft Skills' },
    { name: 'Problem Solving', score: 74, category: 'Engineering' },
    { name: 'Behavioral / STAR', score: 70, category: 'Behavioral' },
    { name: 'Confidence', score: 68, category: 'Delivery' }
  ],

  performanceHistory: [
    { label: 'Interview 1', shortLabel: 'Int 1', score: 68, role: 'Software Engineer' },
    { label: 'Interview 2', shortLabel: 'Int 2', score: 72, role: 'Data Scientist' },
    { label: 'Interview 3', shortLabel: 'Int 3', score: 75, role: 'AI Engineer' },
    { label: 'Interview 4', shortLabel: 'Int 4', score: 78, role: 'ML Engineer' },
    { label: 'Current', shortLabel: 'Current', score: 82, role: 'ML Engineer' }
  ],

  todayPracticePlan: [
    {
      id: 'tp-1',
      title: 'Problem Solving',
      category: 'Engineering',
      specs: '5 questions',
      xpReward: 50,
      completed: true,
      route: '/interview-setup'
    },
    {
      id: 'tp-2',
      title: 'Communication Practice',
      category: 'Soft Skills',
      specs: '10 minutes',
      xpReward: 75,
      completed: true,
      route: '/daily-challenge'
    },
    {
      id: 'tp-3',
      title: 'Machine Learning Challenge',
      category: 'Core AI',
      specs: '5 questions',
      xpReward: 50,
      completed: false,
      route: '/daily-challenge'
    }
  ],

  recentInterviews: [
    {
      id: 'int-d1',
      role: 'Machine Learning Engineer',
      type: 'Technical Interview',
      score: 82,
      date: 'Today',
      questionsCount: 5,
      feedbackSummary: 'Strong ML architecture discussion, refine concise STAR delivery and failure mode trade-offs.'
    },
    {
      id: 'int-d2',
      role: 'Data Scientist',
      type: 'Role-Based Interview',
      score: 76,
      date: '2 days ago',
      questionsCount: 4,
      feedbackSummary: 'Clear understanding of data processing, explain validation curve monitoring in detail.'
    },
    {
      id: 'int-d3',
      role: 'Software Engineer',
      type: 'Technical Interview',
      score: 71,
      date: '5 days ago',
      questionsCount: 4,
      feedbackSummary: 'Good algorithm choices, practice edge-case error handling under time limits.'
    }
  ],

  weeklyStreak: [
    { day: 'M', fullDay: 'Mon', completed: true },
    { day: 'T', fullDay: 'Tue', completed: true },
    { day: 'W', fullDay: 'Wed', completed: true },
    { day: 'T', fullDay: 'Thu', completed: true },
    { day: 'F', fullDay: 'Fri', completed: true },
    { day: 'S', fullDay: 'Sat', completed: true },
    { day: 'S', fullDay: 'Sun', completed: true }
  ],

  recentAchievements: [
    {
      id: 'ach-d1',
      title: '7 Day Streak',
      desc: 'Completed 7 consecutive days',
      icon: '🔥',
      date: 'Today'
    },
    {
      id: 'ach-d2',
      title: 'Interview Pro',
      desc: 'Completed 5 mock interviews',
      icon: '🎯',
      date: 'Yesterday'
    },
    {
      id: 'ach-d3',
      title: 'Improving Fast',
      desc: 'Improved interview score by 10+',
      icon: '📈',
      date: 'Sep 6'
    }
  ]
};

