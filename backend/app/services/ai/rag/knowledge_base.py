"""
Curated RAG Knowledge Base for Career Preparation
AI Career Preparation Agent

Contains high-yield, structured technical and career knowledge chunks
spanning all 18 primary curriculum categories.
"""

from typing import List, Dict, Any

KNOWLEDGE_CHUNKS: List[Dict[str, Any]] = [
    # ----------------------------------------------------
    # 1. INTERVIEW PREPARATION
    # ----------------------------------------------------
    {
        "id": "kb-prep-001",
        "title": "Technical Interview Lifecycle & Preparation Strategy",
        "category": "Interview Preparation",
        "topic": "Interview Lifecycle",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer", "Frontend Developer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "A standard engineering interview process consists of four stages: (1) ATS Resume Screening, "
            "(2) Technical Screening / Coding Assessment, (3) Deep-Dive Technical & Architectural Rounds, and "
            "(4) Behavioral & Culture Alignment. To prepare effectively, candidates should allocate 50% of time "
            "to foundational problem solving and coding, 30% to role-specific system design/ML fundamentals, and "
            "20% to structured behavioral articulation. Research the target company's engineering blog and tech stack "
            "before technical discussions to ground your architectural decisions in their operational constraints."
        )
    },
    {
        "id": "kb-prep-002",
        "title": "Handling Unknowns & Clarifying Requirements in Technical Rounds",
        "category": "Interview Preparation",
        "topic": "Technical Round Dynamics",
        "difficulty": "Intermediate",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "When encountering an unfamiliar technical question or ambiguous problem statement, never guess or remain silent. "
            "First, articulate what you know: restate the core problem and verify input/output constraints. "
            "Second, ask targeted clarifying questions regarding edge cases, expected data scale, latency limits, and resource constraints. "
            "Third, communicate your mental model out loud by proposing a baseline brute-force approach before optimizing. "
            "Interviewers assess analytical reasoning and communication under uncertainty far more than rote memorization."
        )
    },

    # ----------------------------------------------------
    # 2. BEHAVIORAL INTERVIEWS
    # ----------------------------------------------------
    {
        "id": "kb-beh-001",
        "title": "Navigating Conflict Resolution & Technical Disagreements",
        "category": "Behavioral Interviews",
        "topic": "Conflict Resolution",
        "difficulty": "Intermediate",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer", "Frontend Developer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "When interviewers ask 'Tell me about a time you disagreed with a colleague or lead', they evaluate empathy, "
            "objectivity, and commitment to project goals. High-scoring responses follow a 4-step narrative: "
            "(1) Describe the root technical disagreement objectively without personal attribution, "
            "(2) Explain how you gathered empirical evidence (benchmarks, proof-of-concept, latency metrics) rather than arguing opinions, "
            "(3) Show active listening and willingness to compromise or 'disagree and commit' if the team chose an alternative, and "
            "(4) Share the measurable business outcome and what you learned from the collaboration."
        )
    },
    {
        "id": "kb-beh-002",
        "title": "Discussing Engineering Failures & Post-Mortem Reflection",
        "category": "Behavioral Interviews",
        "topic": "Handling Failure",
        "difficulty": "Advanced",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Questions about past failures evaluate accountability, blameless root-cause analysis, and systematic prevention. "
            "Select a genuine technical error (e.g., an unhandled memory leak, bad schema migration, or model training data leakage). "
            "Own the mistake immediately without shifting blame to teammates. Outline the triage process, rapid containment, "
            "and permanent mitigation introduced (e.g., adding automated regression tests, canary deployments, or stricter CI/CD lint gates). "
            "Demonstrating resilience and post-incident process improvement marks engineering maturity."
        )
    },

    # ----------------------------------------------------
    # 3. STAR METHOD
    # ----------------------------------------------------
    {
        "id": "kb-star-001",
        "title": "Mastering the STAR Framework for Structured Storytelling",
        "category": "STAR Method",
        "topic": "STAR Method Architecture",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer", "Frontend Developer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "The STAR framework ensures structured, concise answers in behavioral rounds: "
            "• Situation (15%): Set the business or academic context, team environment, and timeline. "
            "• Task (10%): Clearly identify your specific personal responsibility and target objective. "
            "• Action (55%): Detail your engineering methodology, trade-off evaluations, tools used, and problem-solving steps. Focus on 'I did' rather than 'we did'. "
            "• Result (20%): Quantify the outcome using concrete metrics (e.g., 'reduced inference latency by 35%', 'saved 12 hours of manual QA weekly', 'achieved 94.2% test accuracy')."
        )
    },
    {
        "id": "kb-star-002",
        "title": "Quantifying Business & Engineering Impact in STAR Answers",
        "category": "STAR Method",
        "topic": "Quantifying Impact",
        "difficulty": "Intermediate",
        "applicable_roles": ["Machine Learning Engineer", "Data Scientist", "Software Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Vague results like 'the project was successful and the team liked it' receive low rubric scores. "
            "Anchor your STAR results in at least one of four quantitative dimensions: "
            "(1) Latency / Execution Speed: e.g. reduced p99 query time from 450ms to 42ms. "
            "(2) Accuracy / Quality: e.g. boosted classification F1 score from 0.74 to 0.89 on imbalanced production call data. "
            "(3) Resource Efficiency: e.g. trimmed AWS GPU cluster compute expenditure by 28% via mixed-precision quantization. "
            "(4) Reliability / Uptime: e.g. achieved 99.95% API uptime by implementing exponential backoff retries and circuit breakers."
        )
    },

    # ----------------------------------------------------
    # 4. PYTHON
    # ----------------------------------------------------
    {
        "id": "kb-py-001",
        "title": "Python Memory Management, GIL, and Concurrency Trade-offs",
        "category": "Python",
        "topic": "Memory & GIL",
        "difficulty": "Advanced",
        "applicable_roles": ["Machine Learning Engineer", "Software Engineer", "Data Scientist", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "In CPython, memory is managed via reference counting supplemented by a generational cyclic garbage collector. "
            "The Global Interpreter Lock (GIL) is a mutex synchronizing execution so only one native thread executes Python bytecode at a time, "
            "protecting reference count integrity. Consequently, CPU-bound tasks in Python do not scale with multithreading; "
            "they require multiprocessing, C-extensions, or sub-interpreters (PEP 684). For I/O-bound tasks (network calls, database queries), "
            "asyncio or multithreading yields high throughput with minimal overhead because the GIL is released during system I/O."
        )
    },
    {
        "id": "kb-py-002",
        "title": "Decorators, Generators, and List Comprehensions in Production Python",
        "category": "Python",
        "topic": "Core Language Features",
        "difficulty": "Intermediate",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Decorators in Python are higher-order functions that wrap callable objects to extend behavior without modifying original source code "
            "(used extensively for logging, caching with functools.lru_cache, and authentication guards). "
            "Generators use the 'yield' keyword to produce values lazily on demand, creating stateful iterators that consume O(1) memory "
            "compared to memory-exhaustive list materialization. When processing gigabyte-scale datasets or streaming logs, "
            "generator expressions (x for x in stream) prevent Out-Of-Memory (OOM) fatal crashes."
        )
    },

    # ----------------------------------------------------
    # 5. SQL
    # ----------------------------------------------------
    {
        "id": "kb-sql-001",
        "title": "SQL JOIN Types, Subqueries, and Execution Mechanics",
        "category": "SQL",
        "topic": "Joins & Subqueries",
        "difficulty": "Beginner",
        "applicable_roles": ["Data Scientist", "Data Analytics", "Software Engineer", "Machine Learning Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "SQL JOINs combine rows from two or more tables based on a related column: "
            "• INNER JOIN: Returns records with matching values in both tables. "
            "• LEFT (OUTER) JOIN: Returns all records from the left table, and matched records from the right table (NULL when unaligned). "
            "• RIGHT (OUTER) JOIN: Returns all records from the right table and matching records from the left. "
            "• FULL OUTER JOIN: Returns all records when there is a match in either table. "
            "In technical interviews, watch out for duplicate keys in join columns which cause accidental Cartesian row explosions. "
            "Prefer CTEs (WITH clause) over deeply nested subqueries for maintainability and query optimizer clarity."
        )
    },
    {
        "id": "kb-sql-002",
        "title": "SQL Window Functions, Indexing, and Query Optimization",
        "category": "SQL",
        "topic": "Window Functions & Performance",
        "difficulty": "Advanced",
        "applicable_roles": ["Data Scientist", "Data Analytics", "Machine Learning Engineer", "Software Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Window functions perform calculations across a set of table rows related to the current row without collapsing rows like GROUP BY. "
            "Common functions include ROW_NUMBER(), RANK(), DENSE_RANK(), and LAG()/LEAD() over an OVER(PARTITION BY ... ORDER BY ...) clause. "
            "For query optimization: (1) Ensure WHERE filter columns utilize appropriate B-Tree or Hash indexes, "
            "(2) Avoid SELECT * in production queries to minimize I/O bandwidth, "
            "(3) Avoid using functions on indexed columns in WHERE clauses (e.g. WHERE YEAR(date) = 2026) as they invalidate index seeks, and "
            "(4) Use EXPLAIN / EXPLAIN ANALYZE to inspect table scans vs index seeks."
        )
    },

    # ----------------------------------------------------
    # 6. DATA STRUCTURES & ALGORITHMS
    # ----------------------------------------------------
    {
        "id": "kb-dsa-001",
        "title": "Time & Space Complexity and Hash Map Trade-offs",
        "category": "Data Structures & Algorithms",
        "topic": "Complexity & Hash Maps",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "AI Engineer", "Frontend Developer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Hash tables offer average-case O(1) time complexity for insert, lookup, and delete operations via hash functions mapping keys to buckets. "
            "However, worst-case performance degrades to O(N) during severe hash collision clustering (resolved via separate chaining or open addressing). "
            "In coding interviews, trading space for time using hash sets and hash maps is the most frequent optimization pattern: "
            "transforming an O(N^2) brute force nested loop into an O(N) linear scan with an auxiliary O(N) hash map."
        )
    },
    {
        "id": "kb-dsa-002",
        "title": "Graph Traversal (BFS vs DFS) and Tree Search Algorithms",
        "category": "Data Structures & Algorithms",
        "topic": "Graphs & Trees",
        "difficulty": "Intermediate",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Breadth-First Search (BFS) uses a FIFO queue and visits vertices layer by layer; it guarantees finding the shortest path "
            "in unweighted graphs with O(V + E) time and O(V) space. "
            "Depth-First Search (DFS) uses recursion or a LIFO stack to explore along branches as deep as possible before backtracking; "
            "it is ideal for cycle detection, topological sorting, connected components, and game state trees. "
            "Always track visited nodes using a set to avoid infinite loops in cyclic graphs."
        )
    },

    # ----------------------------------------------------
    # 7. MACHINE LEARNING
    # ----------------------------------------------------
    {
        "id": "kb-ml-001",
        "title": "Overfitting, Underfitting, and the Bias-Variance Tradeoff",
        "category": "Machine Learning",
        "topic": "Overfitting & Regularization",
        "difficulty": "Beginner",
        "applicable_roles": ["Machine Learning Engineer", "Data Scientist", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Overfitting occurs when a statistical model memorizes noise and sample-specific idiosyncrasies of training data, "
            "leading to low training error but poor generalization error on unseen validation datasets (high variance). "
            "Underfitting occurs when the model is too simplistic to capture underlying patterns (high bias). "
            "Techniques to prevent overfitting include: (1) Regularization (L1 Lasso for feature sparsity, L2 Ridge for weight shrinkage), "
            "(2) Cross-Validation (K-Fold stratified), (3) Pruning / Early Stopping, (4) Data Augmentation, and (5) Ensemble methods (Random Forests, Gradient Boosting)."
        )
    },
    {
        "id": "kb-ml-002",
        "title": "Machine Learning Classification Metrics: Precision, Recall, F1, and ROC-AUC",
        "category": "Machine Learning",
        "topic": "Model Evaluation Metrics",
        "difficulty": "Intermediate",
        "applicable_roles": ["Machine Learning Engineer", "Data Scientist", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Accuracy is misleading on class-imbalanced datasets (e.g. 99% negative fraud). "
            "• Precision (TP / (TP + FP)): Measures how many predicted positives were truly positive (critical when false alarms are expensive, e.g. spam filters). "
            "• Recall / Sensitivity (TP / (TP + FN)): Measures how many actual positives were detected (critical when missing a case is fatal, e.g. cancer diagnosis or fraud). "
            "• F1 Score: Harmonic mean of precision and recall, balancing both. "
            "• ROC-AUC: Evaluates diagnostic separation power across all possible classification decision thresholds independently of a fixed 0.5 cutoff."
        )
    },

    # ----------------------------------------------------
    # 8. DEEP LEARNING
    # ----------------------------------------------------
    {
        "id": "kb-dl-001",
        "title": "Backpropagation, Vanishing Gradients, and Modern Activation Functions",
        "category": "Deep Learning",
        "topic": "Backpropagation & Activations",
        "difficulty": "Intermediate",
        "applicable_roles": ["Machine Learning Engineer", "AI Engineer", "Data Scientist"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Backpropagation calculates the gradient of the loss function with respect to every weight in a deep neural network "
            "using the mathematical chain rule of calculus, enabling gradient descent updates. "
            "The vanishing gradient problem occurs when saturating activation functions (like Sigmoid or Tanh) squash derivative outputs into values < 0.25; "
            "multiplying these across deep layers causes gradients to exponentially decay to near zero, halting training. "
            "Modern architectures overcome this using non-saturating activations (ReLU, Leaky ReLU, GELU), residual skip connections (ResNet), "
            "and Batch/Layer Normalization."
        )
    },
    {
        "id": "kb-dl-002",
        "title": "The Transformer Architecture & Self-Attention Mechanism",
        "category": "Deep Learning",
        "topic": "Transformers & Attention",
        "difficulty": "Advanced",
        "applicable_roles": ["AI Engineer", "Machine Learning Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Transformers replaced recurrent architectures by dispensing with recurrence and processing sequences in parallel via Self-Attention. "
            "The scaled dot-product attention formula: Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V. "
            "Queries (Q) match against Keys (K) to compute attention weights, which then scale Values (V). "
            "Multi-Head Attention projects Q, K, and V into multiple lower-dimensional representation subspaces, allowing the model to "
            "simultaneously attend to syntax, positional associations, and long-range semantic dependencies. "
            "Positional Encodings (sinusoidal or rotary RoPE) restore token order awareness lost during parallel execution."
        )
    },

    # ----------------------------------------------------
    # 9. MLOPS
    # ----------------------------------------------------
    {
        "id": "kb-mlops-001",
        "title": "MLOps Lifecycle: Containerization with Docker & Model Serving",
        "category": "MLOps",
        "topic": "Containerization & Serving",
        "difficulty": "Intermediate",
        "applicable_roles": ["Machine Learning Engineer", "DevOps & Cloud Engineer", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "MLOps bridges the gap between experimental Jupyter prototypes and production reliability. "
            "Containerization using Docker packages the trained weights, Python runtime, CUDA GPU drivers, and REST endpoints (FastAPI/Triton) "
            "into an immutable, portable artifact. Multi-stage Docker builds separate the heavy build environment from the lean runtime container, "
            "reducing image sizes and cold-start latencies. Production model serving requires separating CPU orchestration from GPU inference, "
            "utilizing dynamic batching and optimized runtimes like ONNX Runtime or TensorRT for low latency."
        )
    },
    {
        "id": "kb-mlops-002",
        "title": "Data Drift, Concept Drift, and Continuous Model Monitoring",
        "category": "MLOps",
        "topic": "Monitoring & Drift",
        "difficulty": "Advanced",
        "applicable_roles": ["Machine Learning Engineer", "Data Scientist"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Models in production inevitably degrade due to two primary forms of distribution shifts: "
            "(1) Data Drift / Covariate Shift: P(X) changes while P(Y|X) remains constant (e.g., user input demographics shift, but classification boundaries remain identical). Detected via statistical tests like Kolmogorov-Smirnov (KS) or Population Stability Index (PSI). "
            "(2) Concept Drift: P(Y|X) changes (e.g., consumer purchasing patterns change after macroeconomic disruption). "
            "MLOps pipelines must continuously log input payloads, monitor drift metrics, trigger automated retraining alerts, "
            "and execute blue-green or shadow deployments for model updates."
        )
    },

    # ----------------------------------------------------
    # 10. DATA SCIENCE
    # ----------------------------------------------------
    {
        "id": "kb-ds-001",
        "title": "Feature Engineering & Data Preprocessing Strategies",
        "category": "Data Science",
        "topic": "Feature Engineering",
        "difficulty": "Beginner",
        "applicable_roles": ["Data Scientist", "Machine Learning Engineer", "Data Analytics"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Feature engineering often yields greater accuracy improvements than algorithmic tuning. Core techniques include: "
            "• Imputation: Replacing missing values using median (robust to outliers) or predictive KNN/MICE. "
            "• Scaling: StandardScaler (z-score normalization for algorithms assuming normal distribution like SVM/Logistic Regression) vs MinMaxScaler (bound to [0, 1]). "
            "• Categorical Encoding: One-Hot Encoding for low-cardinality nominal features vs Target/Frequency Encoding for high-cardinality features. "
            "• Interaction Features: Multiplying or combining domain signals to capture non-linear synergies."
        )
    },
    {
        "id": "kb-ds-002",
        "title": "A/B Testing, Hypothesis Formulation, and Statistical Significance",
        "category": "Data Science",
        "topic": "A/B Testing & Statistics",
        "difficulty": "Intermediate",
        "applicable_roles": ["Data Scientist", "Data Analytics"],
        "source": "AI Career Knowledge Base",
        "content": (
            "A/B testing is randomized controlled experimentation used to validate whether a new feature or algorithm produces statistically significant impact. "
            "Key steps: (1) Formulate Null Hypothesis H0 (no difference) vs Alternative H1, "
            "(2) Select Primary Metric (e.g. conversion rate) and guardrail metrics (e.g. page load time), "
            "(3) Conduct Power Analysis prior to testing to determine required sample size and duration to detect Minimum Detectable Effect (MDE), and "
            "(4) Calculate p-value against significance threshold alpha (commonly 0.05). If p < alpha, reject H0. Beware of 'peeking' early which inflates Type I false positive rates."
        )
    },

    # ----------------------------------------------------
    # 11. DATA ANALYTICS
    # ----------------------------------------------------
    {
        "id": "kb-da-001",
        "title": "Exploratory Data Analysis (EDA) and Business KPI Design",
        "category": "Data Analytics",
        "topic": "EDA & KPI Formulation",
        "difficulty": "Beginner",
        "applicable_roles": ["Data Analytics", "Data Scientist"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Exploratory Data Analysis (EDA) is the disciplined process of summarizing main data characteristics, detecting anomalies, "
            "and testing hypotheses using summary statistics and visualizations (histograms, box plots, scatter matrices). "
            "When translating raw metrics into executive KPIs, analysts distinguish between leading indicators (e.g., daily active practice sessions) "
            "and lagging indicators (e.g., quarterly interview placement rate). Ensure KPIs are SMART (Specific, Measurable, Achievable, Relevant, Time-bound) "
            "and immune to gaming or metric distortions (Goodhart's Law)."
        )
    },

    # ----------------------------------------------------
    # 12. AI ENGINEERING
    # ----------------------------------------------------
    {
        "id": "kb-aieng-001",
        "title": "Retrieval-Augmented Generation (RAG) Architecture & Vector Embeddings",
        "category": "AI Engineering",
        "topic": "RAG Architecture",
        "difficulty": "Intermediate",
        "applicable_roles": ["AI Engineer", "Machine Learning Engineer", "Software Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Retrieval-Augmented Generation (RAG) mitigates LLM hallucination and knowledge cutoff limitations by dynamically injecting "
            "relevant enterprise/domain documents into the context window at inference time. "
            "The architecture consists of: (1) Document Ingestion & Semantic Chunking, (2) Vector Embedding generation, "
            "(3) Indexing in a vector store, (4) Semantic Retrieval via Cosine Similarity / Hybrid BM25 search, and "
            "(5) Grounded Prompt Synthesis directing the LLM to formulate its answer strictly based on the retrieved context. "
            "RAG provides citation transparency, cost efficiency, and real-time knowledge updates without expensive fine-tuning."
        )
    },
    {
        "id": "kb-aieng-002",
        "title": "Prompt Engineering, Guardrails, and Hallucination Control",
        "category": "AI Engineering",
        "topic": "Prompt Engineering & Guardrails",
        "difficulty": "Intermediate",
        "applicable_roles": ["AI Engineer", "Software Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Production LLM applications require structured, disciplined prompt engineering patterns: "
            "• Role & Persona Setting: Defines model expertise and authoritative domain scope. "
            "• Few-Shot In-Context Learning: Provides concrete input/output exemplars guiding formatting and reasoning. "
            "• Chain-of-Thought (CoT): Encourages step-by-step intermediate deduction before outputting final answers. "
            "• Structured Output Enforcement: Enforcing JSON schemas (via Pydantic or constrained decoding) prevents parsing failures. "
            "• Grounding Guardrails: Explicit instructions instructing the model to reply with 'Insufficient information' when retrieved sources lack the answer."
        )
    },

    # ----------------------------------------------------
    # 13. SOFTWARE ENGINEERING
    # ----------------------------------------------------
    {
        "id": "kb-swe-001",
        "title": "SOLID Design Principles for Maintainable Software",
        "category": "Software Engineering",
        "topic": "SOLID Principles",
        "difficulty": "Intermediate",
        "applicable_roles": ["Software Engineer", "Frontend Developer", "Machine Learning Engineer", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "The SOLID principles govern object-oriented design for decoupled, scalable systems: "
            "• S - Single Responsibility Principle: A class/module should have one, and only one, reason to change. "
            "• O - Open/Closed Principle: Software entities should be open for extension, but closed for modification (use abstract interfaces). "
            "• L - Liskov Substitution Principle: Derived subclasses must be substitutable for their base classes without breaking correctness. "
            "• I - Interface Segregation Principle: Clients should not be forced to depend on interfaces they do not use. "
            "• D - Dependency Inversion Principle: Depend upon abstractions, not concrete implementations (enables easy dependency injection and mocking in tests)."
        )
    },
    {
        "id": "kb-swe-002",
        "title": "RESTful API Architectural Constraints and HTTP Status Codes",
        "category": "Software Engineering",
        "topic": "REST API Design",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Frontend Developer", "AI Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "REST (Representational State Transfer) architectures adhere to 6 guiding constraints: client-server separation, "
            "statelessness, cacheability, uniform interface, layered system, and code-on-demand. "
            "Standard HTTP methods map to CRUD: POST (Create), GET (Read), PUT/PATCH (Update/Partial Update), DELETE (Delete). "
            "Crucial status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request (client syntax error), "
            "401 Unauthorized (unauthenticated), 403 Forbidden (authenticated but lacking permissions), 404 Not Found, 422 Unprocessable Entity, 500 Internal Server Error."
        )
    },

    # ----------------------------------------------------
    # 14. RESUME PREPARATION
    # ----------------------------------------------------
    {
        "id": "kb-res-001",
        "title": "Writing Impactful Resume Bullet Points Using the Google XYZ Formula",
        "category": "Resume Preparation",
        "topic": "Google XYZ Formula",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer", "Frontend Developer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Weak resume bullet points list passive job duties (e.g. 'Responsible for writing Python scripts for ML'). "
            "High-impact technical resumes format every accomplishment using Google's XYZ formula: "
            "'Accomplished [X] as measured by [Y], by doing [Z]'. "
            "Example transformation: 'Engineered an automated model inference pipeline [Z], reducing end-to-end p95 latency by 42% [Y], enabling real-time classification for 50,000 daily active users [X]'. "
            "Always lead with strong action verbs (Architected, Engineered, Optimized, Deployed, Benchmarked) rather than passive verbs."
        )
    },

    # ----------------------------------------------------
    # 15. ATS PREPARATION
    # ----------------------------------------------------
    {
        "id": "kb-ats-001",
        "title": "Applicant Tracking System (ATS) Parsing Architecture & Best Practices",
        "category": "ATS Preparation",
        "topic": "ATS Formatting Rules",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer", "Frontend Developer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Applicant Tracking Systems (ATS) parse resumes into structured entity trees before human recruiters review them. "
            "To maximize ATS parse accuracy: (1) Use single-column layouts; multi-column or floating text boxes frequently scramble reading order. "
            "(2) Use standard headings: 'Experience', 'Education', 'Skills', 'Projects'. "
            "(3) Avoid embedding critical information in image files or tables. "
            "(4) Use canonical industry terminology (e.g. 'Scikit-learn', 'PyTorch', 'Docker', 'Kubernetes') rather than non-standard abbreviations. "
            "(5) Maintain high keyword alignment with the target job description naturally throughout project descriptions."
        )
    },

    # ----------------------------------------------------
    # 16. COMMUNICATION
    # ----------------------------------------------------
    {
        "id": "kb-comm-001",
        "title": "Technical Storytelling and Thinking Out Loud in Coding Rounds",
        "category": "Communication",
        "topic": "Technical Communication",
        "difficulty": "Intermediate",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "AI Engineer", "Frontend Developer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "During live technical coding rounds, silence is detrimental. Interviewers evaluate how you collaborate as a future peer. "
            "Practice 'Thinking Out Loud': (1) Verbalize your understanding and restate constraints, "
            "(2) Discuss trade-offs before writing code (e.g., 'We could use recursion here which is concise, but an iterative approach with a queue avoids call-stack overflow for large inputs'), "
            "(3) Narrate as you type so the interviewer follows your intent, and "
            "(4) Walk through a concrete sample case manually to verify logic before claiming your code is complete."
        )
    },

    # ----------------------------------------------------
    # 17. HR INTERVIEWS
    # ----------------------------------------------------
    {
        "id": "kb-hr-001",
        "title": "Structuring the 'Tell Me About Yourself' Elevator Pitch",
        "category": "HR Interviews",
        "topic": "Elevator Pitch",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer", "Frontend Developer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "'Tell me about yourself' sets the psychological tone of the interview. Keep it concise (90 to 120 seconds) "
            "using the Present-Past-Future structure: "
            "• Present (30s): State who you are right now (e.g. 'I am an engineer specializing in scalable systems and machine learning'). "
            "• Past (45s): Highlight 1-2 major technical achievements or projects demonstrating hands-on technical execution. "
            "• Future (30s): Connect your trajectory to why this specific role and company is the natural next step in your career."
        )
    },

    # ----------------------------------------------------
    # 18. CAREER PREPARATION
    # ----------------------------------------------------
    {
        "id": "kb-car-001",
        "title": "Engineering Roadmaps, Portfolio Projects, and Career Differentiation",
        "category": "Career Preparation",
        "topic": "Career Strategy & Portfolio",
        "difficulty": "Beginner",
        "applicable_roles": ["Software Engineer", "Machine Learning Engineer", "Data Scientist", "AI Engineer", "Frontend Developer", "DevOps & Cloud Engineer"],
        "source": "AI Career Knowledge Base",
        "content": (
            "Generic tutorial projects (like Titanic survival or simple to-do lists) fail to differentiate candidates. "
            "To stand out in technical recruiting: (1) Build and deploy end-to-end applications solving real operational problems with live URLs. "
            "(2) Showcase production-grade engineering habits: comprehensive READMEs, architectural block diagrams, unit tests, and CI/CD workflows. "
            "(3) Actively identify and bridge your personal skill gaps identified through ATS audits and mock interviews. "
            "(4) Consistency beats intensity: completing one small conceptual drill or mock question every day builds compounding career readiness."
        )
    }
]
