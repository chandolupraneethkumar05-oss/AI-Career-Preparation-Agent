"""
Difficulty Profiles & Level Calibration
AI Career Preparation Agent

Defines level-calibrated personas, topic seeds, prompt guidance, and rubric expectations
for Beginner, Intermediate, and Senior candidates.
Ensures beginner candidates receive accessible, foundational, meaningful questions
grounded in core principles rather than enterprise distributed architecture.
"""

from typing import Dict, Any, List

DIFFICULTY_PROFILES: Dict[str, Dict[str, Any]] = {
    "Beginner": {
        "persona": "a supportive, encouraging technical hiring manager conducting a campus or entry-level screening (0-1 years of experience)",
        "focus_seeds": [
            "core language syntax, data types, and variable scoping (let vs const vs var, immutability)",
            "fundamental programming concepts (functions, loops, array methods like map/filter, object manipulation)",
            "basic debugging methodology, error handling (try/catch), and simple API data fetching (fetch/axios)",
            "conceptual clarity of fundamental principles (DOM events, simple SQL queries, basic OOP concepts)",
            "practical comprehension of everyday programming tasks and willingness to learn"
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
        "persona": "a senior engineering lead evaluating a mid-level engineer (2-4 years of experience)",
        "focus_seeds": [
            "component state management, clean architecture, and modular code patterns",
            "database indexing, query efficiency, transactions, and basic concurrency",
            "REST API design, automated unit/integration testing, and resilient error recovery",
            "practical engineering trade-offs and performance considerations in real-world features"
        ],
        "guidance": (
            "Focus on practical engineering problem-solving, maintainability, production trade-offs, "
            "and common architectural patterns."
        ),
        "rubric_expectation": (
            "EVALUATION CRITERIA FOR INTERMEDIATE: "
            "Expect a solid grasp of practical implementation, performance trade-offs, and structured debugging."
        )
    },
    "Senior": {
        "persona": "a Principal Architect evaluating senior/staff level technical excellence and architectural depth",
        "focus_seeds": [
            "distributed architecture, scalability tradeoffs, and high availability SLAs",
            "production failure modes, edge-case recovery, and latency optimization (p99 SLAs)",
            "end-to-end data pipelines, streaming reliability, and consistency models (CAP theorem)",
            "monitoring telemetry, drift detection, and automated canary deployment",
            "security boundaries, data isolation, and API design trade-offs"
        ],
        "guidance": (
            "Probe deeply on architectural trade-offs, catastrophic failure modes, scalability bottlenecks, "
            "and high-concurrency systems."
        ),
        "rubric_expectation": (
            "EVALUATION CRITERIA FOR SENIOR: "
            "Expect rigorous trade-off analysis, system design depth, resilience patterns, and quantitative reasoning."
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
