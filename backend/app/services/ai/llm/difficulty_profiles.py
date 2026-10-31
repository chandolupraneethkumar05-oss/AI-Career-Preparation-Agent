"""
Difficulty Profiles & Level Calibration
AI Career Preparation Agent

Defines level-calibrated personas, topic seeds, prompt guidance, and rubric expectations
for Beginner, Intermediate, and Senior candidates.
Ensures beginner candidates receive accessible, foundational questions grounded in core principles,
while Intermediate and Senior candidates receive rigorous, nuanced, scenario-driven questions
probing real-world architectural trade-offs, concurrency, fault-tolerance, and system design.
"""

from typing import Dict, Any, List

DIFFICULTY_PROFILES: Dict[str, Dict[str, Any]] = {
    "Beginner": {
        "persona": "a supportive, encouraging technical hiring manager conducting a campus or entry-level screening (0-1 years of experience)",
        "focus_seeds": [
            "core language syntax, data types, and variable scoping (let vs const vs var, immutability, pass-by-value vs pass-by-reference)",
            "fundamental programming concepts (pure functions, loops, array methods like map/filter/reduce, object and dictionary manipulation)",
            "basic debugging methodology, error handling (try/catch), and simple asynchronous API data fetching (fetch/async-await)",
            "conceptual clarity of fundamental principles (DOM events, simple SQL queries with WHERE/JOIN, basic OOP encapsulation and inheritance)",
            "practical comprehension of everyday programming tasks, code readability, and willingness to learn"
        ],
        "guidance": (
            "Keep questions conceptual, practical, and accessible for someone with 0-1 years of experience or a student/fresher. "
            "Focus on the 'what' and 'why' of everyday programming mechanisms and basic reasoning. "
            "STRICT PROHIBITION: DO NOT ask about distributed systems, microservices, high availability SLAs, "
            "Kafka, Kubernetes, multi-threading race conditions, database sharding, or complex production failure modes."
        ),
        "rubric_expectation": (
            "EVALUATION CRITERIA FOR BEGINNER: "
            "Award high scores (8-10 / 10) for correct fundamental understanding, clear explanations, "
            "and simple, practical examples. "
            "DO NOT deduct marks for missing enterprise architecture patterns, distributed scalability, "
            "system design nuances, or deep production constraints."
        )
    },
    "Intermediate": {
        "persona": "a rigorous Senior Staff Engineering Lead evaluating a mid-level engineer (2-5 years of industry experience)",
        "focus_seeds": [
            "practical engineering trade-offs in component state management, modular architecture, and decoupling side effects",
            "database indexing internals (composite B-trees, covering indexes), query execution plan (EXPLAIN ANALYZE) optimization, and transaction isolation levels",
            "concurrency, race conditions, distributed locking, and idempotent REST/gRPC API design with graceful degradation",
            "caching strategies (cache-aside, write-through, handling cache stampede/thundering herd) and Redis memory eviction policies",
            "microservices resilience patterns: circuit breakers, retry policies with exponential backoff and jitter, and dead-letter queues",
            "systematic incident debugging: root-cause analysis of memory leaks, connection pool exhaustion, and unhandled promise rejections in production",
            "production ML/Data pipelines: handling data drift, feature leakage, stratified validation, and low-latency inference serving"
        ],
        "guidance": (
            "Ask concrete, real-world scenario-based questions that test practical engineering trade-offs. "
            "Frame questions around an actual problem or system constraint (e.g. 'Suppose an e-commerce checkout service experiences race conditions during high-concurrency inventory decrement...'). "
            "Demand practical justification for why a candidate chooses one approach over another (e.g., PostgreSQL optimistic vs pessimistic locking, or Redis vs local in-memory caching). "
            "Probe for edge-case handling, error recovery, testability, and measurable performance implications."
        ),
        "rubric_expectation": (
            "EVALUATION CRITERIA FOR INTERMEDIATE: "
            "Expect a solid grasp of practical implementation, performance trade-offs, structured debugging, and edge-case resilience. "
            "A top answer must not merely define concepts, but explain HOW to apply them under production constraints, "
            "cite specific mechanisms (e.g., SELECT FOR UPDATE, connection pooling, idempotency keys), and weigh pros vs cons."
        )
    },
    "Senior": {
        "persona": "a Principal Architect and Silicon Valley Hiring Committee Chair evaluating senior/staff level technical mastery and architectural vision",
        "focus_seeds": [
            "distributed systems architecture: CAP theorem practical trade-offs, PACELC, distributed consensus (Raft/Paxos), and event-driven architectures",
            "massive-scale throughput (100k+ QPS): partitioning/sharding strategies, consistent hashing, hot-key mitigation, and read-replica replication lag handling",
            "high availability and disaster recovery: multi-region active-active deployments, zero-downtime database schema migrations, and chaos engineering",
            "latency optimization and p99 SLA preservation: garbage collection tuning, async non-blocking I/O, tail-latency mitigation, and load shedding under heavy backpressure",
            "streaming data platforms: Kafka consumer group rebalances (Eager vs Cooperative Sticky), out-of-order event processing with watermarks, and exactly-once processing semantics",
            "security boundaries and zero-trust architecture: token authentication, mTLS between microservices, secret rotation without downtime, and defense-in-depth API protection",
            "systemic technical leadership: guiding large-scale refactors, setting code review standards, managing technical debt, and cross-team architectural alignment"
        ],
        "guidance": (
            "Challenge the candidate with complex, high-scale architectural dilemmas and production failure scenarios. "
            "Avoid trivia or simple definitions. Ask open-ended system design and incident triage questions with conflicting constraints (e.g., high availability vs strong consistency, ultra-low latency vs complex analytical queries). "
            "Require the candidate to think through quantitative estimation, failure boundaries (e.g., what happens when the primary database crashes mid-transaction), and end-to-end operational telemetry (metrics, distributed tracing, alerting)."
        ),
        "rubric_expectation": (
            "EVALUATION CRITERIA FOR SENIOR: "
            "Expect rigorous, quantitative trade-off analysis, deep architectural insight, resilience patterns, and systems-level thinking. "
            "The candidate should proactively address failure modes, scalability bottlenecks, telemetry/observability, and maintainability. "
            "Score ruthlessly against vague hand-waving: true senior candidates provide concrete, battle-tested solutions."
        )
    }
}


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


def get_difficulty_profile(difficulty: str) -> Dict[str, Any]:
    """Retrieves the calibrated profile for the specified difficulty with normalized keys."""
    normalized = normalize_difficulty(difficulty)
    prof = dict(DIFFICULTY_PROFILES[normalized])
    # Provide backward/forward compatible aliases
    prof["interviewer_persona"] = prof.get("persona", "")
    prof["topic_seeds"] = prof.get("focus_seeds", [])
    prof["rubric_expectations"] = prof.get("rubric_expectation", "")
    return prof
