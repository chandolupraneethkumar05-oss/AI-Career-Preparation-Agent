"""
Language Registry & Constants for Multilingual AI Feedback
AI Career Preparation Agent — Academic IDP Project
Candidate: Chandolu Praneeth Kumar (241FA18483) — Vignan University

Defines supported feedback languages, native display labels, validation utilities,
and preserved technical terminology for high-accuracy localization.
"""

from typing import Dict, Any, List

SUPPORTED_FEEDBACK_LANGUAGES: Dict[str, Dict[str, Any]] = {
    "en": {
        "code": "en",
        "name": "English",
        "native": "English",
        "default": True,
        "description": "Standard international technical terminology and explanations"
    },
    "te": {
        "code": "te",
        "name": "Telugu",
        "native": "తెలుగు",
        "default": False,
        "description": "Natural, professional Telugu explanations with standard English technical terms"
    },
    "hi": {
        "code": "hi",
        "name": "Hindi",
        "native": "हिन्दी",
        "default": False,
        "description": "Natural, professional Hindi explanations with standard English technical terms"
    }
}

DEFAULT_FEEDBACK_LANGUAGE = "en"

# Technical terminology that MUST remain in English in Telugu and Hindi feedback reports
PRESERVED_TECHNICAL_TERMS: List[str] = [
    # Languages & Query Languages
    "Python", "JavaScript", "Java", "C++", "C#", "Go", "Rust", "SQL", "HTML", "CSS", "TypeScript",
    # Frameworks & Libraries
    "React", "FastAPI", "Flask", "Django", "Node.js", "PyTorch", "TensorFlow", "Keras",
    "Scikit-learn", "Pandas", "NumPy", "Docker", "Kubernetes", "Git", "GitHub", "SQLAlchemy",
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Apache Spark", "Airflow", "Kafka",
    # Architectural & Engineering Concepts
    "STAR", "STAR framework", "STAR method", "REST API", "API", "CI/CD", "DevOps", "MLOps",
    "Big-O", "O(n)", "O(1)", "O(log n)", "O(n log n)",
    "Microservices", "System Design", "Database", "Index", "Composite Index",
    "Hash Join", "Nested Loop Join", "Foreign Key", "Primary Key",
    # Machine Learning / AI Concepts
    "Overfitting", "Underfitting", "Bias-Variance Tradeoff", "Data Drift", "Concept Drift",
    "Precision", "Recall", "F1-Score", "ROC-AUC", "Confusion Matrix", "Loss Function",
    "Gradient Descent", "Backpropagation", "Hyperparameter", "Cross-Validation",
    "Feature Engineering", "Embeddings", "RAG", "LLM", "Generative AI",
    # Delivery & Communication Metrics
    "WPM", "Words Per Minute", "Cadence", "Pacing"
]


def is_supported_feedback_language(lang_code: str) -> bool:
    """Checks if the language code is supported for AI feedback."""
    if not lang_code:
        return False
    return lang_code.lower().strip() in SUPPORTED_FEEDBACK_LANGUAGES


def normalize_feedback_language(lang_code: str) -> str:
    """
    Normalizes a given language code to a supported code.
    Defaults to DEFAULT_FEEDBACK_LANGUAGE ('en') if invalid or unsupported.
    """
    if not lang_code:
        return DEFAULT_FEEDBACK_LANGUAGE
    code = lang_code.lower().strip()
    return code if code in SUPPORTED_FEEDBACK_LANGUAGES else DEFAULT_FEEDBACK_LANGUAGE


def get_language_display_name(lang_code: str) -> str:
    """Returns a readable label with native script, e.g. 'Telugu (తెలుగు)'."""
    code = normalize_feedback_language(lang_code)
    meta = SUPPORTED_FEEDBACK_LANGUAGES.get(code, SUPPORTED_FEEDBACK_LANGUAGES[DEFAULT_FEEDBACK_LANGUAGE])
    if meta["code"] == "en":
        return meta["name"]
    return f"{meta['name']} ({meta['native']})"
