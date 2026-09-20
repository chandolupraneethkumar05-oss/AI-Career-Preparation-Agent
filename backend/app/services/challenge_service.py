"""
Daily Conceptual Drill Service
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..db.models import Challenge, User, SkillGap
from ..schemas.challenge import DailyChallengeResponse, ChallengeSubmitRequest, ChallengeSubmitResponse
from ..schemas.activity import ActivityCreate
from .activity_service import record_activity, has_practiced_today
from .skill_service import record_skill_evidence, sync_unified_skill_profile
from .skill_taxonomy import normalize_skill, get_canonical_role, ROLE_REQUIREMENTS


def utc_now():
    return datetime.now(timezone.utc)


DRILL_CATALOG = [
    # Machine Learning
    {
        "id": "drill-bias-variance-01",
        "topic": "Bias-Variance Tradeoff & Generalization",
        "target_skill": "Machine Learning",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "Explain the Bias-Variance Tradeoff in statistical machine learning. How do model complexity, L1/L2 regularization, and ensemble methods (bagging vs boosting) specifically mitigate high variance versus high bias?",
        "ideal_keywords": ["overfitting", "underfitting", "regularization", "variance", "bias", "bagging", "boosting", "generalization"]
    },
    {
        "id": "drill-ml-foundations-02",
        "topic": "Supervised vs Unsupervised Learning Fundamentals",
        "target_skill": "Machine Learning",
        "difficulty": "Foundational",
        "target_role": "Machine Learning Engineer",
        "question": "Contrast Supervised and Unsupervised Learning from first principles. How do target labels dictate loss formulations, and what are canonical production use cases for each paradigm?",
        "ideal_keywords": ["supervised", "unsupervised", "labels", "clustering", "regression", "classification", "loss", "ground truth"]
    },

    # Deep Learning
    {
        "id": "drill-vanishing-gradients-03",
        "topic": "Deep Learning Optimization & Vanishing Gradients",
        "target_skill": "Deep Learning",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "What mathematical mechanisms cause the vanishing and exploding gradient problem in deep recurrent and feedforward networks, and how do modern architectural innovations like Residual Connections (ResNets), Layer Normalization, and specialized activations (GELU/ReLU) resolve this?",
        "ideal_keywords": ["gradient", "backpropagation", "residual", "normalization", "gelu", "relu", "chain rule", "eigenvalues"]
    },
    {
        "id": "drill-transformers-attention-04",
        "topic": "Transformer Multi-Head Self-Attention Mechanics",
        "target_skill": "Deep Learning",
        "difficulty": "Advanced",
        "target_role": "Machine Learning Engineer",
        "question": "Explain the scaled dot-product attention formula in Transformer architectures. Why is the square root of key dimension scaling factor critical for softmax stability, and how does multi-head attention project queries, keys, and values into distinct representation subspaces?",
        "ideal_keywords": ["transformer", "attention", "query", "key", "value", "softmax", "scaling", "multi-head", "dot-product"]
    },

    # Model Monitoring
    {
        "id": "drill-model-monitoring-05",
        "topic": "Model Monitoring: Data Drift vs Concept Drift",
        "target_skill": "Model Monitoring",
        "difficulty": "Foundational",
        "target_role": "Machine Learning Engineer",
        "question": "Define and contrast Data Drift (covariate shift) versus Concept Drift in production machine learning systems. How does an engineering team distinguish between input feature distribution changes and changes in the relationship between features and target labels?",
        "ideal_keywords": ["data drift", "concept drift", "covariate shift", "distribution", "features", "target", "labels", "production"]
    },
    {
        "id": "drill-model-monitoring-06",
        "topic": "Statistical Drift Detection & Performance Degradation",
        "target_skill": "Model Monitoring",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "Identify whether sudden feature distribution shifts represent data drift, concept drift, or upstream data pipeline degradation. How do statistical metrics like the Kolmogorov-Smirnov (KS) test, Population Stability Index (PSI), and Evidently AI detect divergence before model accuracy declines?",
        "ideal_keywords": ["drift", "kolmogorov-smirnov", "psi", "population stability index", "evidently", "degradation", "statistical", "monitoring"]
    },
    {
        "id": "drill-model-monitoring-07",
        "topic": "Automated Continuous Model Monitoring & Retraining Architecture",
        "target_skill": "Model Monitoring",
        "difficulty": "Advanced",
        "target_role": "Machine Learning Engineer",
        "question": "Design an end-to-end real-time monitoring and automated retraining architecture for low-latency ML inference. How do you handle delayed ground-truth feedback loops, shadow deployments, and safe automated rollback triggers?",
        "ideal_keywords": ["monitoring", "retraining", "feedback", "ground truth", "shadow", "rollback", "latency", "pipeline"]
    },

    # MLOps
    {
        "id": "drill-mlops-lifecycle-08",
        "topic": "MLOps Experiment Tracking & Model Registry",
        "target_skill": "MLOps",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "Explain how experiment tracking frameworks like MLflow and model registries govern artifact versioning, hyperparameter auditing, and reproducible model promotion across staging and production environments.",
        "ideal_keywords": ["mlops", "mlflow", "registry", "versioning", "artifacts", "reproducibility", "staging", "promotion"]
    },

    # Docker & Containerization
    {
        "id": "drill-docker-mlops-09",
        "topic": "MLOps Containerization & Reproducibility",
        "target_skill": "Docker",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "Why is multi-stage Docker containerization critical when deploying GPU-accelerated PyTorch/TensorFlow models to Kubernetes clusters, and how do you optimize image size while ensuring deterministic CUDA dependencies?",
        "ideal_keywords": ["docker", "cuda", "multi-stage", "kubernetes", "reproducibility", "deployment", "gpu"]
    },

    # SQL & Relational Databases
    {
        "id": "drill-sql-indexing-10",
        "topic": "SQL Query Optimization & Indexing Mechanisms",
        "target_skill": "SQL",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "How do B-tree vs Hash indexes in relational databases (PostgreSQL/MySQL) improve query latency on high-cardinality foreign keys, and what causes an index scan to degrade into a sequential table scan during complex JOIN operations?",
        "ideal_keywords": ["sql", "b-tree", "indexing", "query plan", "join", "latency", "explain analyze", "sequential scan"]
    },
    {
        "id": "drill-sql-foundations-11",
        "topic": "SQL Window Functions & Aggregation Mechanics",
        "target_skill": "SQL",
        "difficulty": "Foundational",
        "target_role": "Data Scientist",
        "question": "Explain the difference between ROW_NUMBER(), RANK(), and DENSE_RANK() window functions in SQL. Provide an example where PARTITION BY and ORDER BY change analytical results.",
        "ideal_keywords": ["sql", "window", "row_number", "rank", "dense_rank", "partition by", "order by", "aggregation"]
    },

    # Python
    {
        "id": "drill-python-foundations-12",
        "topic": "Python Memory Model & Mutable Defaults",
        "target_skill": "Python",
        "difficulty": "Foundational",
        "target_role": "Machine Learning Engineer",
        "question": "Explain why using mutable objects (like lists or dictionaries) as default argument values in Python functions causes subtle runtime bugs. How does Python evaluate default arguments at definition time versus call time?",
        "ideal_keywords": ["python", "mutable", "immutable", "default", "binding", "definition", "list", "dictionary"]
    },
    {
        "id": "drill-python-advanced-13",
        "topic": "Python Generators, Memory Optimization & GIL",
        "target_skill": "Python",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "How do Python generators (yield statements) achieve memory-efficient streaming of massive datasets compared to eager list comprehension, and what are the performance implications of the Global Interpreter Lock (GIL) on multi-threading vs multiprocessing?",
        "ideal_keywords": ["python", "generator", "yield", "memory", "gil", "multiprocessing", "threading", "lazy"]
    },

    # Feature Engineering
    {
        "id": "drill-feature-eng-14",
        "topic": "Feature Engineering & Data Leakage Prevention",
        "target_skill": "Feature Engineering",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "What causes target leakage during feature engineering in tabular predictive pipelines, and how do proper cross-validation partitioning, target encoding with smoothing, and scikit-learn Pipelines ensure statistical integrity?",
        "ideal_keywords": ["feature engineering", "leakage", "target encoding", "cross-validation", "pipeline", "cardinality", "scaling"]
    },

    # Statistics
    {
        "id": "drill-stats-hyp-15",
        "topic": "Statistical Hypothesis Testing & P-Values",
        "target_skill": "Statistics",
        "difficulty": "Foundational",
        "target_role": "Data Scientist",
        "question": "Define a p-value in classical hypothesis testing from first principles. How do Type I errors (false positives / alpha) and Type II errors (false negatives / beta) relate to the statistical power of an experiment?",
        "ideal_keywords": ["statistics", "p-value", "null hypothesis", "type i error", "type ii error", "alpha", "beta", "power"]
    },
    {
        "id": "drill-stats-ab-16",
        "topic": "A/B Testing Experiment Design & Sample Size Determination",
        "target_skill": "Statistics",
        "difficulty": "Intermediate",
        "target_role": "Data Scientist",
        "question": "When designing an online A/B test, how do Minimum Detectable Effect (MDE), baseline conversion rate, and statistical power determine the required sample size? How do you guard against the peeking problem?",
        "ideal_keywords": ["a/b testing", "mde", "sample size", "conversion", "peeking", "bonferroni", "significance"]
    },

    # PyTorch
    {
        "id": "drill-pytorch-autograd-17",
        "topic": "PyTorch Distributed Training & Autograd Graph",
        "target_skill": "PyTorch",
        "difficulty": "Advanced",
        "target_role": "Machine Learning Engineer",
        "question": "Explain how PyTorch's dynamic computational graph (Autograd) tracks gradients during backward passes, and how DistributedDataParallel (DDP) achieves all-reduce gradient synchronization across multiple GPU nodes.",
        "ideal_keywords": ["pytorch", "autograd", "gradient", "ddp", "distributed", "backward", "tensor", "all-reduce"]
    },

    # Scikit-learn
    {
        "id": "drill-sklearn-pipelines-18",
        "topic": "Scikit-Learn Pipelines & Estimator API",
        "target_skill": "Scikit-learn",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "How does Scikit-Learn's Pipeline and ColumnTransformer architecture prevent data leakage between training and validation folds during cross-validation? Contrast fit(), transform(), and fit_transform() mechanics.",
        "ideal_keywords": ["scikit-learn", "pipeline", "columntransformer", "fit", "transform", "leakage", "cross-validation"]
    },

    # Kubernetes
    {
        "id": "drill-k8s-scaling-19",
        "topic": "Kubernetes Pod Autoscaling & Production Orchestration",
        "target_skill": "Kubernetes",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "Explain how Horizontal Pod Autoscalers (HPA) and Custom Metrics (such as GPU utilization or inference queue depth via Prometheus) ensure zero downtime during sudden traffic spikes in production model serving.",
        "ideal_keywords": ["kubernetes", "k8s", "hpa", "autoscaling", "prometheus", "metrics", "latency", "deployment"]
    },

    # CI/CD
    {
        "id": "drill-cicd-pipeline-20",
        "topic": "Automated CI/CD Testing & Continuous Deployment",
        "target_skill": "CI/CD",
        "difficulty": "Intermediate",
        "target_role": "Machine Learning Engineer",
        "question": "What automated quality gates should be enforced in a Git-driven CI/CD pipeline before model artifacts are promoted from staging to production canary deployments?",
        "ideal_keywords": ["ci/cd", "continuous integration", "canary", "testing", "regression", "automation", "pipeline"]
    },

    # Communication & STAR Method
    {
        "id": "drill-star-behavioral-21",
        "topic": "STAR Method Behavioral Articulation",
        "target_skill": "Communication",
        "difficulty": "Foundational",
        "target_role": "Machine Learning Engineer",
        "question": "Describe a challenging technical disagreement you experienced regarding model selection or system architecture. Using the STAR framework (Situation, Task, Action, Result), explain how you resolved the conflict with empirical data.",
        "ideal_keywords": ["situation", "task", "action", "result", "metrics", "data", "compromise", "evaluation"]
    },

    # System Design
    {
        "id": "drill-system-design-22",
        "topic": "High-Throughput Distributed System Design",
        "target_skill": "System Design",
        "difficulty": "Advanced",
        "target_role": "Software Engineer",
        "question": "Design a high-throughput, low-latency rate limiter capable of handling 500,000 requests per second across geographically distributed regions. Compare the Token Bucket vs Leaky Bucket algorithms and justify your caching tier architecture.",
        "ideal_keywords": ["system design", "token bucket", "rate limiter", "redis", "latency", "distributed", "concurrency"]
    },

    # Git
    {
        "id": "drill-git-workflows-23",
        "topic": "Git Branching Workflows: Merge vs Rebase",
        "target_skill": "Git",
        "difficulty": "Foundational",
        "target_role": "Software Engineer",
        "question": "Compare git merge versus git rebase when integrating feature branch commits into main. What are the trade-offs regarding commit history linearity, golden rule of rebasing, and resolving conflicts?",
        "ideal_keywords": ["git", "merge", "rebase", "commit", "history", "branch", "conflict", "linear"]
    }
]


def get_daily_challenge(db: Session, user_id: str) -> DailyChallengeResponse:
    """
    Selects or synthesizes today's conceptual drill, tailored to candidate's
    critical skill gaps where possible, with adaptive difficulty calibration.
    """
    user = db.query(User).filter(User.id == user_id).first()
    target_role = user.target_role if user else "Machine Learning Engineer"
    practiced = has_practiced_today(db, user_id)

    # 1. Fetch user's critical skill gaps (high priority first, then largest gap)
    critical_gap = (
        db.query(SkillGap)
        .filter(SkillGap.user_id == user_id)
        .filter(SkillGap.priority == "high")
        .order_by((SkillGap.target_score - SkillGap.current_score).desc())
        .first()
    )
    if not critical_gap:
        critical_gap = (
            db.query(SkillGap)
            .filter(SkillGap.user_id == user_id)
            .filter(SkillGap.current_score < 75)
            .order_by((SkillGap.target_score - SkillGap.current_score).desc())
            .first()
        )

    # 2. Check previous challenge history for difficulty calibration
    recent_challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == user_id)
        .order_by(desc(Challenge.submitted_at))
        .limit(5)
        .all()
    )

    target_difficulty = "Intermediate"
    if critical_gap:
        score = critical_gap.current_score
        if score < 55:
            target_difficulty = "Foundational"
        elif score >= 75:
            target_difficulty = "Advanced"
        else:
            target_difficulty = "Intermediate"

        # Check past performance for this specific skill
        gap_canonical = normalize_skill(critical_gap.skill_name).lower()
        same_skill_challenges = [
            c for c in recent_challenges
            if gap_canonical in c.topic.lower() or normalize_skill(c.topic).lower() == gap_canonical
        ]
        if same_skill_challenges:
            last_score = same_skill_challenges[0].score
            if last_score >= 85 and target_difficulty == "Foundational":
                target_difficulty = "Intermediate"
            elif last_score >= 85 and target_difficulty == "Intermediate":
                target_difficulty = "Advanced"
            elif last_score < 50:
                target_difficulty = "Foundational"

    # 3. Match drill from catalog
    selected = None
    if critical_gap:
        gap_canonical = normalize_skill(critical_gap.skill_name).lower()

        # Step A: Filter matching drills
        candidates = []
        for drill in DRILL_CATALOG:
            d_skill = normalize_skill(drill.get("target_skill", "")).lower()
            topic = drill["topic"].lower()
            keywords = [k.lower() for k in drill.get("ideal_keywords", [])]
            if (gap_canonical == d_skill or
                gap_canonical in d_skill or
                d_skill in gap_canonical or
                gap_canonical in topic or
                any(gap_canonical in kw for kw in keywords)):
                candidates.append(drill)

        if candidates:
            # Prefer matching difficulty
            diff_match = next((d for d in candidates if d.get("difficulty", "").lower() == target_difficulty.lower()), None)
            selected = diff_match or candidates[0]

    if not selected:
        # Deterministic rotation based on calendar day
        day_index = utc_now().timetuple().tm_yday % len(DRILL_CATALOG)
        selected = DRILL_CATALOG[day_index]

    return DailyChallengeResponse(
        challenge_id=selected["id"],
        topic=selected["topic"],
        difficulty=selected["difficulty"],
        question=selected["question"],
        target_role=selected["target_role"],
        xp_reward=50,
        ideal_keywords=selected["ideal_keywords"],
        already_completed=practiced
    )


def submit_challenge_answer(db: Session, user_id: str, data: ChallengeSubmitRequest) -> ChallengeSubmitResponse:
    """
    Evaluates candidate's conceptual drill response, records completion,
    logs multi-source skill evidence, synchronizes unified skill profile,
    awards canonical +50 XP, and calculates streak.
    """
    answer_text = data.user_answer.strip()
    words = answer_text.split()
    word_count = len(words)

    # Find drill definition
    drill = next((d for d in DRILL_CATALOG if d["id"] == data.challenge_id), None)
    ideal_keywords = drill["ideal_keywords"] if drill else ["model", "data", "metrics"]

    # Match keywords
    matched = [kw for kw in ideal_keywords if kw.lower() in answer_text.lower()]
    keyword_coverage = len(matched) / max(1, len(ideal_keywords))

    # Compute heuristic score
    length_score = min(100, int((word_count / 80) * 100))
    keyword_score = int(keyword_coverage * 100)
    final_score = min(100, max(45, int((length_score * 0.4) + (keyword_score * 0.6))))
    passed = final_score >= 60

    strengths = []
    improvements = []

    if keyword_coverage >= 0.5:
        strengths.append(f"Strong coverage of key domain vocabulary: {', '.join(matched[:3])}")
    else:
        improvements.append(f"Incorporate technical terms like: {', '.join(ideal_keywords[:3])}")

    if word_count >= 60:
        strengths.append(f"Thorough articulation ({word_count} words)")
    else:
        improvements.append("Elaborate on real-world engineering constraints and failure modes")

    feedback = (
        f"Solid conceptual depth! You scored {final_score}/100 with {len(matched)}/{len(ideal_keywords)} "
        "core keywords identified."
    )

    now = utc_now()
    challenge_record = Challenge(
        user_id=user_id,
        challenge_id=data.challenge_id,
        topic=data.topic or (drill["topic"] if drill else "Conceptual Articulation Drill"),
        difficulty=drill["difficulty"] if drill else "Intermediate",
        question=drill["question"] if drill else "Technical question",
        user_answer=answer_text,
        score=final_score,
        xp_earned=50,
        completed=True,
        submitted_at=now
    )
    db.add(challenge_record)
    db.flush()

    # Record verified activity (+50 XP)
    act = record_activity(
        db=db,
        user_id=user_id,
        data=ActivityCreate(
            type="challenge_completed",
            related_module="challenge",
            title=f"Completed Daily Drill: {challenge_record.topic} ({final_score}%)",
            xp_earned=50,
            details={
                "challengeId": data.challenge_id,
                "score": final_score,
                "wordCount": word_count
            }
        )
    )

    # Record multi-source skill evidence into SkillEvidence ledger
    target_skill_name = drill.get("target_skill") if drill else None
    if not target_skill_name and data.topic:
        target_skill_name = data.topic
    if not target_skill_name:
        target_skill_name = "Machine Learning"

    canonical_skill = normalize_skill(target_skill_name)
    record_skill_evidence(
        db=db,
        user_id=user_id,
        skill_name=canonical_skill,
        source_type="challenge",
        source_id=f"chal_{challenge_record.id}",
        score=final_score,
        evidence_text=f"Daily Drill '{challenge_record.topic}' ({challenge_record.difficulty}): {feedback}",
        confidence="medium" if final_score >= 60 else "low"
    )

    # Sync unified skill profile to propagate new score to SkillGap table & radar
    user = db.query(User).filter(User.id == user_id).first()
    active_role = user.target_role if user else "Machine Learning Engineer"
    sync_unified_skill_profile(db=db, user_id=user_id, target_role=active_role)

    return ChallengeSubmitResponse(
        challenge_id=data.challenge_id,
        topic=challenge_record.topic,
        score=final_score,
        passed=passed,
        xp_earned=50,
        streak=user.streak if user else 1,
        feedback=feedback,
        strengths=strengths,
        improvements=improvements
    )
