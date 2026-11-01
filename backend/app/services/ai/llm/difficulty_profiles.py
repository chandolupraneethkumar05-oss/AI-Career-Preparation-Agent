"""
Difficulty Profiles & Level Calibration
AI Career Preparation Agent

Defines role-aware and level-calibrated personas, topic seeds, prompt guidance, and rubric expectations
for Beginner, Intermediate, and Senior candidates across all major tech disciplines.
Ensures questions are strictly role-aligned, level-appropriate, and concise (2-4 sentences max),
matching the professional standards of top technical platforms (LeetCode, Karat, HackerRank).
"""

from typing import Dict, Any, List, Optional

ROLE_TOPIC_SEEDS: Dict[str, Dict[str, List[str]]] = {
    "frontend": {
        "Beginner": [
            "core JavaScript event loop, DOM events, and variable scoping (let vs const vs var)",
            "fundamental React components, JSX syntax, props vs state, and useState hook",
            "basic CSS box model, flexbox alignment, and responsive viewport units",
            "handling user input, form validation, and simple API data fetching with useEffect",
            "debugging browser console errors, network inspection, and basic HTML semantics"
        ],
        "Intermediate": [
            "optimizing React re-renders using React.memo, useMemo, and useCallback hooks",
            "state management architectures (Context API vs Zustand/Redux) and avoiding prop drilling",
            "implementing optimistic UI mutations with rollback on network failure",
            "CSS Grid vs Flexbox for complex responsive layouts and CSS specificity management",
            "web vitals optimization: Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and code splitting"
        ],
        "Senior": [
            "architecting large-scale micro-frontends with Module Federation and shared state",
            "React Concurrent Mode, Suspense boundaries, and Server-Side Rendering (SSR) hydration waterfalls",
            "designing a framework-agnostic design system with accessibility (WCAG 2.1 AAA) and tokenization",
            "real-time collaborative UI state synchronization over WebSockets with CRDTs or OT",
            "optimizing frontend bundle size, critical rendering path, and tree-shaking across monorepos"
        ]
    },
    "backend": {
        "Beginner": [
            "HTTP methods (GET, POST, PUT, DELETE) and appropriate HTTP status codes",
            "basic relational database queries using WHERE, JOIN, and GROUP BY",
            "RESTful API route structuring, request body validation, and error handling",
            "concept of stateless APIs, session cookies, and basic token authentication",
            "reading server logs and debugging database connection errors"
        ],
        "Intermediate": [
            "database indexing strategy (B-trees, composite index ordering) and query execution plans",
            "transaction isolation levels, ACID properties, and preventing race conditions",
            "idempotent API design using idempotency keys and retry handling",
            "caching strategies with Redis: cache-aside, write-through, and handling cache stampedes",
            "connection pooling configuration, rate limiting algorithms, and graceful shutdown"
        ],
        "Senior": [
            "distributed systems data consistency: eventual consistency, saga patterns, and two-phase commit trade-offs",
            "architecting high-throughput event-driven microservices using Kafka or RabbitMQ",
            "database sharding strategies, read-replica replication lag mitigation, and zero-downtime schema migrations",
            "designing a multi-tenant API gateway with dynamic rate limiting, circuit breaking, and distributed tracing",
            "fault tolerance: bulkhead pattern, dead-letter queues, and graceful degradation during downstream outage"
        ]
    },
    "devops": {
        "Beginner": [
            "fundamental differences between containers and virtual machines, and basic Dockerfile syntax",
            "continuous integration concepts: automated linting, unit testing, and build pipelines",
            "managing environment variables and keeping production secrets out of source control",
            "basic Linux commands for process management, file permissions, and disk space inspection",
            "purpose of reverse proxies like Nginx for port forwarding and SSL termination"
        ],
        "Intermediate": [
            "writing multi-stage Dockerfiles to minimize image size and run containers as non-root users",
            "Kubernetes core primitives: Pods, Deployments, Services, and rolling update strategies",
            "Infrastructure as Code with Terraform: state management, remote backends, and avoiding drift",
            "implementing Canary and Blue-Green deployment pipelines with automated rollback triggers",
            "setting up centralized logging and metrics collection with Prometheus and Grafana"
        ],
        "Senior": [
            "multi-region cloud active-active architecture with automated DNS failover and data replication",
            "designing Zero-Trust service mesh architectures with mutual TLS (mTLS) and fine-grained network policies",
            "Kubernetes cluster autoscaling, cgroup resource limit tuning, and diagnosing OOMKilled incidents at scale",
            "disaster recovery strategy: Recovery Point Objective (RPO) and Recovery Time Objective (RTO) validation via chaos drills",
            "cloud infrastructure cost optimization: spot instance orchestrations and storage tier lifecycle policies"
        ]
    },
    "data": {
        "Beginner": [
            "SQL query fundamentals: differences between INNER JOIN, LEFT JOIN, and UNION",
            "exploratory data analysis, handling missing values, and detecting outliers in datasets",
            "difference between Correlation and Causation with practical business examples",
            "basic data visualization choices (histograms, scatter plots, bar charts) for distributions",
            "extracting and cleaning unstructured CSV and JSON data files using Python/Pandas"
        ],
        "Intermediate": [
            "SQL Window Functions (ROW_NUMBER, RANK, LAG/LEAD) for temporal and cohort analysis",
            "A/B testing methodology: hypothesis formulation, sample size calculation, and p-value interpretation",
            "feature engineering: handling skewed numerical features, encoding high-cardinality categorical data",
            "designing batch ELT pipelines with data validation tests and incremental table models",
            "evaluating classification models: Precision-Recall trade-offs, ROC-AUC, and class imbalance"
        ],
        "Senior": [
            "causal inference techniques (Difference-in-Differences, Propensity Score Matching) when randomized trials are infeasible",
            "architecting petabyte-scale data lakes and warehouses with optimal partitioning and clustering",
            "designing real-time streaming data analytics pipelines with late-arriving event watermarking",
            "automated data quality governance, lineage tracking, and anomaly detection across enterprise pipelines",
            "building cross-functional experiment platforms with multi-armed bandit traffic allocation"
        ]
    },
    "ai_ml": {
        "Beginner": [
            "differences between supervised, unsupervised, and reinforcement learning paradigms",
            "dataset splitting (train/validation/test) and why evaluating on training data causes false confidence",
            "precision versus recall trade-off with a concrete real-world use case like medical diagnosis",
            "understanding overfitting: signs on training vs validation loss curves and simple mitigations",
            "basic feature normalization (MinMax vs Standardization) and why scale matters for algorithms"
        ],
        "Intermediate": [
            "detecting and handling data drift (covariate shift) and concept drift in production models",
            "retrieval-augmented generation (RAG): evaluating chunking strategies, embeddings, and re-ranking",
            "bias-variance trade-off diagnosis and applying L1/L2 regularization to mitigate model variance",
            "designing reproducible ML pipelines with experiment tracking, artifact registries, and model versioning",
            "gradient descent variants (SGD, Adam) and learning rate scheduling techniques"
        ],
        "Senior": [
            "optimizing LLM serving under strict latency SLAs: continuous batching, KV-cache paging, and quantization",
            "architecting real-time feature stores with point-in-time correctness to prevent training-serving skew",
            "distributed model training across multiple GPUs: data parallelism, pipeline parallelism, and gradient accumulation",
            "evaluating LLM safety, guardrails, hallucination benchmarking, and automated red-teaming pipelines",
            "mathematical foundations of transformer self-attention mechanisms and efficiency trade-offs (FlashAttention)"
        ]
    },
    "mobile": {
        "Beginner": [
            "mobile application activity and widget lifecycles and preserving state on app backgrounding",
            "performing asynchronous network requests without blocking the main UI thread",
            "trade-offs between native mobile development and cross-platform frameworks",
            "basic mobile layout principles, touch target sizes, and screen density scaling",
            "storing simple key-value preferences and user settings locally on device"
        ],
        "Intermediate": [
            "implementing offline-first architecture with local SQLite/Room/Hive database syncing",
            "state management patterns (Bloc, Riverpod, Provider) to eliminate unnecessary widget rebuilds",
            "profiling mobile app memory leaks, retain cycles, and maintaining consistent 60/120 FPS",
            "handling deep links, push notifications, and background task scheduling across Android and iOS",
            "architecting modular app navigation with type-safe route parameters and authentication guards"
        ],
        "Senior": [
            "designing a native bridge interop layer for high-performance C++/Rust modules in mobile apps",
            "mobile CI/CD automation: automated device testing farms, fastlane builds, and staged rollout rings",
            "optimizing mobile cold startup time, app binary size, and asset tree-shaking",
            "resilient offline data conflict resolution (vector clocks, last-write-wins) for mobile sync",
            "architecting battery consumption and network efficiency for continuous location tracking"
        ]
    },
    "fullstack": {
        "Beginner": [
            "client-server request-response lifecycle, HTTP methods, and status codes",
            "coordinating form validation between frontend client and backend models",
            "understanding CORS headers, why browsers enforce them, and basic configuration",
            "environment variables and keeping secret credentials out of frontend client bundles",
            "basic relational database queries and rendering dynamic lists on the UI"
        ],
        "Intermediate": [
            "designing cursor-based vs offset pagination across database, API, and frontend components",
            "implementing optimistic UI state updates with clean rollback on mutation error",
            "managing authentication state seamlessly across client routing and protected API endpoints",
            "caching architecture: CDN headers, API rate limiting, and database connection pooling",
            "structuring modular monorepos and sharing type contracts between frontend and backend"
        ],
        "Senior": [
            "architecting resilient systems for sudden 20x traffic spikes across CDN, gateway, and database",
            "real-time collaborative state synchronization: WebSockets vs SSE vs polling trade-offs",
            "distributed tracing, frontend real-user monitoring (RUM), and end-to-end incident triage",
            "zero-downtime database schema migrations on high-traffic full-stack applications",
            "micro-frontend and modular service decomposition trade-offs for cross-functional teams"
        ]
    },
    "qa": {
        "Beginner": [
            "core differences between unit tests, integration tests, and end-to-end (E2E) tests",
            "writing clear, reproducible bug reports with steps, expected vs actual behavior, and logs",
            "understanding boundary value analysis and equivalence partitioning for test cases",
            "difference between functional testing, regression testing, and smoke testing",
            "basic API testing using Postman or curl: validating HTTP status codes and JSON payloads"
        ],
        "Intermediate": [
            "designing automated E2E testing suites using Cypress or Playwright with robust selectors",
            "mocking external third-party services and setting up test databases with isolated fixtures",
            "integrating automated test pipelines into CI/CD with parallel execution and flaky test retries",
            "API contract testing with Pact or OpenAPI specs to prevent breaking schema changes",
            "performance and load testing with k6 or JMeter to identify throughput bottlenecks"
        ],
        "Senior": [
            "architecting enterprise test automation frameworks with cross-browser matrix coverage",
            "implementing continuous quality gates, code coverage thresholds, and static analysis in CI/CD",
            "chaos engineering and fault injection testing to validate resilient system recovery",
            "test data management strategies across ephemeral staging environments and databases",
            "measuring quality engineering metrics (Defect Escape Rate, Mean Time to Detect, Flakiness Index)"
        ]
    },
    "cybersecurity": {
        "Beginner": [
            "OWASP Top 10 vulnerabilities: SQL Injection and Cross-Site Scripting (XSS) fundamentals",
            "differences between authentication and authorization, and principles of least privilege",
            "symmetric vs asymmetric encryption concepts and the purpose of SSL/TLS certificates",
            "secure password storage: why salted hashing (bcrypt/argon2) is required over plain SHA-256",
            "identifying phishing vectors, social engineering, and basic multi-factor authentication (MFA)"
        ],
        "Intermediate": [
            "mitigating Cross-Site Request Forgery (CSRF) and Cross-Site Scripting (XSS) in modern SPAs",
            "JWT security: preventing token forgery, handling signature verification, and secure revocation",
            "configuring Content Security Policy (CSP), CORS, and HTTP security headers effectively",
            "vulnerability scanning, dependency audit automation (Snyk/Trivy), and secure code review",
            "implementing role-based access control (RBAC) and attribute-based access control (ABAC)"
        ],
        "Senior": [
            "architecting Zero-Trust enterprise architectures with mutual TLS (mTLS) and fine-grained network policies",
            "threat modeling complex distributed systems (STRIDE framework) and incident response plans",
            "cloud security posture management (CSPM), IAM privilege escalation analysis, and secrets management",
            "defending against Server-Side Request Forgery (SSRF) and supply-chain attacks in dependencies",
            "forensics triage, SIEM correlation rule tuning, and automated red-teaming pipelines"
        ]
    },
    "product": {
        "Beginner": [
            "defining clear user personas, problem statements, and writing effective user stories",
            "differences between agile methodologies: Scrum ceremonies, sprints, and Kanban flow",
            "understanding North Star metrics and standard product KPIs (DAU/MAU, retention, churn)",
            "prioritizing user feature requests using basic frameworks (MoSCoW, Impact vs Effort)",
            "conducting user interviews, synthesizing feedback, and identifying pain points"
        ],
        "Intermediate": [
            "feature prioritization using the RICE framework (Reach, Impact, Confidence, Effort)",
            "designing and interpreting A/B tests: defining hypotheses, sample sizes, and guardrail metrics",
            "managing technical debt trade-offs in partnership with engineering leads",
            "mapping customer journey funnels and identifying drop-off bottlenecks in conversion",
            "crafting product requirements documents (PRDs) with clear scope, edge cases, and success metrics"
        ],
        "Senior": [
            "defining multi-year product strategy, vision, and aligning cross-functional executive stakeholders",
            "balancing technical feasibility, business viability, and customer desirability on complex platforms",
            "go-to-market (GTM) launch architecture, pricing tiering, and commercialization models",
            "building platform ecosystems with third-party developer APIs and developer experience (DevEx)",
            "portfolio governance, resource allocation, and measuring return on engineering investment (ROEI)"
        ]
    },
    "dsa": {
        "Beginner": [
            "Big-O time and space complexity analysis for common array and string operations",
            "differences between Arrays and Linked Lists for insertion, deletion, and random access",
            "implementing two-pointer techniques to solve array searching and palindrome validation",
            "using Hash Maps for O(1) frequency counting and lookup problems",
            "basic recursion concepts, base cases, and avoiding stack overflow errors"
        ],
        "Intermediate": [
            "sliding window optimization for subarray and substring constraints",
            "binary search on sorted arrays and monotonic solution spaces",
            "tree traversal algorithms (BFS, DFS) and validating Binary Search Tree invariants",
            "graph representations (adjacency list vs matrix) and finding connected components",
            "top-down memoization and bottom-up dynamic programming for optimization problems"
        ],
        "Senior": [
            "advanced graph algorithms: Dijkstra's shortest path, topological sorting, and cycle detection",
            "trie data structures for prefix matching, autocomplete, and memory-efficient string indexing",
            "monotonic stacks and queues for next-greater-element and range maximum queries",
            "segment trees and Fenwick trees for dynamic range sum and point update queries in O(log N)",
            "NP-hard problem approximations, backtracking with aggressive branch pruning, and bit manipulation"
        ]
    }
}

DIFFICULTY_PROFILES: Dict[str, Dict[str, Any]] = {
    "Beginner": {
        "persona": "a supportive, encouraging technical interviewer conducting an entry-level screening (0-1 years of experience)",
        "guidance": (
            "Ask a crisp, accessible technical question focusing on foundational mechanics and clear explanations. "
            "QUESTION BREVITY RULE: The question MUST be concise and focused (strictly 2 to 4 sentences maximum). "
            "DO NOT ask about distributed systems, microservices, high-scale SLAs, Kubernetes, or multi-threaded race conditions."
        ),
        "rubric_expectation": (
            "Award high marks (80-95%) for correct fundamental understanding, clear terminology, and simple practical examples. "
            "Do NOT deduct points for missing enterprise scale, high availability, or complex edge cases."
        )
    },
    "Intermediate": {
        "persona": "a rigorous engineering lead evaluating a mid-level engineer (2-5 years of industry experience)",
        "guidance": (
            "Ask a practical, scenario-driven question that tests real-world implementation choices and engineering trade-offs. "
            "QUESTION BREVITY RULE: The question MUST be concise and focused (strictly 2 to 4 sentences maximum). "
            "DO NOT write a whole wall of text or full-page essay. Pose a clear problem statement and ask for the candidate's solution and trade-offs."
        ),
        "rubric_expectation": (
            "Expect a solid grasp of practical implementation, performance trade-offs, edge-case resilience, and clear communication. "
            "The candidate should explain WHY they chose a specific approach and how it behaves under production conditions."
        )
    },
    "Senior": {
        "persona": "a Principal Architect evaluating senior/staff level technical mastery and architectural vision",
        "guidance": (
            "Ask an impactful, architectural question probing high-scale distributed trade-offs, fault tolerance, and system constraints. "
            "QUESTION BREVITY RULE: The question MUST be concise and focused (strictly 2 to 4 sentences maximum). "
            "DO NOT write a full-page case study. Present a crisp system dilemma with conflicting constraints (e.g. latency vs consistency, throughput vs isolation) and ask for the architectural decision."
        ),
        "rubric_expectation": (
            "Expect rigorous trade-off analysis, deep architectural insight, resilience patterns, and systems-level thinking. "
            "The candidate should proactively address failure modes, scalability bottlenecks, and operational telemetry."
        )
    }
}


def _detect_role_category(role: str) -> str:
    r = (role or "").lower()
    if any(k in r for k in ["front", "react", "vue", "angular", "ui", "web designer", "client-side"]):
        return "frontend"
    if any(k in r for k in ["qa", "quality", "test", "automation engineer", "sdet"]):
        return "qa"
    if any(k in r for k in ["security", "cyber", "soc", "infosec", "penetration", "appsec"]):
        return "cybersecurity"
    if any(k in r for k in ["product", "project manager", "technical program", "scrum master"]):
        return "product"
    if any(k in r for k in ["devops", "sre", "cloud", "infra", "platform", "kubernetes", "site reliability"]):
        return "devops"
    if any(k in r for k in ["data science", "data analyst", "analytics", "bi ", "data engineer", "etl", "bigquery", "spark", "databricks", "data warehouse"]):
        return "data"
    if any(k in r for k in ["machine learning", "ml", "ai", "deep learning", "nlp", "computer vision", "llm", "research scientist"]):
        return "ai_ml"
    if any(k in r for k in ["mobile", "android", "ios", "flutter", "swift", "kotlin", "react native"]):
        return "mobile"
    if any(k in r for k in ["full", "fullstack", "full-stack", "software engineer", "software developer", "sde", "application engineer"]):
        return "fullstack"
    if any(k in r for k in ["algorithm", "dsa", "competitive", "problem solving"]):
        return "dsa"
    return "backend"


def get_role_turn_facets(target_role: str, category: str = "Technical", difficulty: str = "Intermediate") -> List[str]:
    """
    Dynamically generates 5 distinct, role-calibrated query seeds for RAG syllabus retrieval across interview turns.
    Guarantees that candidates interviewing for Frontend, QA, DevOps, Mobile, Security, Product, or Backend
    receive authentic, domain-appropriate questions instead of unrelated topics.
    """
    cat = _detect_role_category(target_role)
    facets_by_cat = {
        "frontend": [
            f"{target_role} DOM event loop component lifecycle and modern framework fundamentals",
            f"{target_role} state management re-rendering optimization and client caching",
            f"{target_role} responsive CSS grid flexbox and web accessibility WCAG standards",
            f"{target_role} core web vitals LCP CLS bundle size code splitting and SSR",
            f"{target_role} real-world frontend error boundaries optimistic mutations and debugging"
        ],
        "backend": [
            f"{target_role} RESTful API architecture HTTP methods and stateless routing",
            f"{target_role} database query execution indexing B-tree and transaction isolation",
            f"{target_role} caching strategies Redis cache-aside stampede and connection pooling",
            f"{target_role} distributed microservices asynchronous messaging Kafka and idempotency",
            f"{target_role} production fault tolerance rate limiting circuit breakers and telemetry"
        ],
        "fullstack": [
            f"{target_role} client-server request lifecycle CORS and full-stack security validation",
            f"{target_role} end-to-end state synchronization API design and database modeling",
            f"{target_role} caching across CDN edge reverse proxies and database connection pools",
            f"{target_role} server-side rendering optimistic updates and asynchronous background jobs",
            f"{target_role} production monitoring distributed tracing and high-traffic incident triage"
        ],
        "devops": [
            f"{target_role} containerization Docker multi-stage builds and process isolation",
            f"{target_role} CI/CD automated test verification security scanning and release gates",
            f"{target_role} Kubernetes core primitives pods deployments services and ingress",
            f"{target_role} Infrastructure as Code Terraform state remote backends and drift",
            f"{target_role} multi-region cloud disaster recovery zero-trust mTLS and cost tuning"
        ],
        "data": [
            f"{target_role} relational SQL joins aggregations window functions and data models",
            f"{target_role} batch ELT pipelines schema design incremental models and dbt testing",
            f"{target_role} streaming data architectures Kafka watermarks and late-arriving records",
            f"{target_role} data lakehouse partitioning clustering and query cost optimization",
            f"{target_role} data quality governance automated lineage tracking and anomaly alerts"
        ],
        "ai_ml": [
            f"{target_role} machine learning paradigms precision recall and dataset validation",
            f"{target_role} feature engineering regularization bias-variance and model drift",
            f"{target_role} retrieval-augmented generation RAG chunking embeddings and re-ranking",
            f"{target_role} high-throughput model serving continuous batching and quantization",
            f"{target_role} distributed model training safety guardrails and evaluation pipelines"
        ],
        "mobile": [
            f"{target_role} mobile application lifecycle async networking and UI thread safety",
            f"{target_role} offline-first local persistence database syncing and background workers",
            f"{target_role} state management eliminating jank and maintaining 60/120 FPS performance",
            f"{target_role} mobile app memory leak profiling retain cycles and battery optimization",
            f"{target_role} modular architecture native bridge interop and automated CI/CD builds"
        ],
        "qa": [
            f"{target_role} test pyramid unit integration and end-to-end testing strategies",
            f"{target_role} automated test frameworks Cypress Playwright Selenium and test isolation",
            f"{target_role} API contract testing mocking service virtualization and regression suites",
            f"{target_role} performance load testing stress testing and identifying response bottlenecks",
            f"{target_role} defect lifecycle triage root cause analysis and CI/CD quality gates"
        ],
        "cybersecurity": [
            f"{target_role} OWASP top 10 vulnerabilities input sanitization and XSS/CSRF defenses",
            f"{target_role} cryptographic primitives key management hashing and secure session auth",
            f"{target_role} network security firewall rules zero trust and mutual TLS architecture",
            f"{target_role} cloud IAM least privilege role-based access control and token security",
            f"{target_role} threat modeling incident response forensics and vulnerability triage"
        ],
        "product": [
            f"{target_role} product vision roadmap prioritization frameworks RICE and user personas",
            f"{target_role} defining North Star metrics OKRs KPIs and measuring business outcomes",
            f"{target_role} technical feasibility cross-functional trade-offs with engineering leads",
            f"{target_role} A/B experimentation hypothesis design and interpreting conversion funnels",
            f"{target_role} product launch go-to-market strategies and stakeholder alignment"
        ],
        "dsa": [
            f"{target_role} time and space complexity Big-O analysis and fundamental data structures",
            f"{target_role} two-pointer techniques sliding window and hash map frequency indexing",
            f"{target_role} tree traversals binary search trees and monotonic stacks",
            f"{target_role} graph algorithms BFS DFS topological sort and shortest paths",
            f"{target_role} dynamic programming memoization bottom-up tables and optimization"
        ]
    }
    return facets_by_cat.get(cat, facets_by_cat["backend"])


def normalize_difficulty(difficulty: str) -> str:
    """Normalizes any difficulty string into Beginner, Intermediate, or Senior."""
    if not difficulty:
        return "Intermediate"
    d = difficulty.strip().lower()
    if any(k in d for k in ["begin", "junior", "entry", "fresher", "foundational", "easy"]):
        return "Beginner"
    if any(k in d for k in ["senior", "staff", "lead", "principal", "advanced", "hard"]):
        return "Senior"
    return "Intermediate"


def get_difficulty_profile(difficulty: str, target_role: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves the calibrated profile for the specified difficulty with role-aware topic seeds."""
    normalized = normalize_difficulty(difficulty)
    prof = dict(DIFFICULTY_PROFILES[normalized])
    
    # Retrieve role-specific topic seeds
    cat = _detect_role_category(target_role or "backend")
    role_seeds = ROLE_TOPIC_SEEDS.get(cat, ROLE_TOPIC_SEEDS["backend"]).get(normalized, [])
    
    prof["focus_seeds"] = role_seeds
    prof["topic_seeds"] = role_seeds
    prof["interviewer_persona"] = prof.get("persona", "")
    prof["rubric_expectations"] = prof.get("rubric_expectation", "")
    return prof
