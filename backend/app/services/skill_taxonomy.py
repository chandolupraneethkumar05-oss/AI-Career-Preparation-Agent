"""
Centralized Skill Taxonomy & Canonical Normalization Engine
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University
"""

import re
from abc import ABC, abstractmethod
from typing import Dict, List, Set, Tuple, Optional, Any


# ----------------------------------------------------------------------
# 1. CANONICAL SKILL DEFINITIONS & ALIASES
# ----------------------------------------------------------------------

# Maps canonical skill name -> list of aliases/variations (lowercase)
CANONICAL_SKILL_ALIASES: Dict[str, List[str]] = {
    # Programming Languages
    "Python": ["python", "python3", "py"],
    "Java": ["java", "jdk", "jvm"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "csharp"],
    "C": ["c programming", "c language"],
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "R": ["r programming", "r language", "r script"],
    "Go": ["golang", "go language"],
    "Rust": ["rust", "rustlang"],
    "SQL": ["sql", "structured query language", "t-sql", "pl/sql"],

    # Machine Learning & AI
    "Machine Learning": ["machine learning", "ml", "statistical learning", "supervised learning", "unsupervised learning"],
    "Deep Learning": ["deep learning", "dl", "neural networks", "dnn", "ann", "cnn", "rnn"],
    "Scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
    "TensorFlow": ["tensorflow", "tf", "tf2"],
    "PyTorch": ["pytorch", "torch"],
    "Keras": ["keras"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "SciPy": ["scipy"],
    "Computer Vision": ["computer vision", "cv", "opencv", "image processing", "yolo"],
    "NLP": ["nlp", "natural language processing", "spacy", "nltk", "text processing"],
    "LLM": ["llm", "large language model", "large language models", "generative ai", "genai"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "Transformers": ["transformers", "hugging face", "huggingface", "bert", "gpt"],
    "Feature Engineering": ["feature engineering", "feature extraction", "feature selection"],
    "Model Evaluation": ["model evaluation", "model validation", "cross-validation", "hyperparameter tuning"],

    # MLOps & Production
    "MLOps": ["mlops", "machine learning operations", "ml ops", "model operations", "mlops & deployment"],
    "Model Deployment": ["model deployment", "model serving", "triton", "torchserve", "model inference", "serving"],
    "Docker": ["docker", "dockerfile", "containerization", "containers"],
    "Kubernetes": ["kubernetes", "k8s", "container orchestration"],
    "MLflow": ["mlflow", "experiment tracking"],
    "DVC": ["dvc", "data version control"],
    "CI/CD": ["ci/cd", "cicd", "ci-cd", "continuous integration", "continuous deployment", "github actions"],
    "Model Monitoring": ["model monitoring", "data drift", "concept drift", "evidently"],
    "Airflow": ["airflow", "apache airflow", "dag orchestration"],
    "FastAPI": ["fastapi", "fast-api"],
    "Flask": ["flask"],
    "Django": ["django"],

    # Cloud Platforms
    "AWS": ["aws", "amazon web services", "sagemaker", "ec2", "s3", "lambda"],
    "GCP": ["gcp", "google cloud", "google cloud platform", "vertex ai", "bigquery"],
    "Azure": ["azure", "microsoft azure", "azure ml"],

    # Databases & Big Data
    "PostgreSQL": ["postgresql", "postgres", "psql"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "Apache Spark": ["spark", "apache spark", "pyspark"],
    "Apache Kafka": ["kafka", "apache kafka"],

    # Frontend & Web
    "React": ["react", "react.js", "reactjs"],
    "HTML5": ["html", "html5"],
    "Tailwind CSS": ["tailwind", "tailwind css", "tailwindcss"],
    "CSS3": ["css", "css3"],
    "Node.js": ["node.js", "nodejs", "node"],
    "Redux": ["redux", "redux toolkit"],
    "Next.js": ["next.js", "nextjs"],

    # Software Engineering & Core Fundamentals
    "System Design": ["system design", "distributed systems", "high availability", "scalability"],
    "Data Structures & Algorithms": ["data structures", "algorithms", "dsa", "leetcode"],
    "REST API": ["rest api", "rest apis", "restful api", "restful apis", "restful"],
    "Microservices": ["microservices", "microservice architecture"],
    "Git": ["git", "github", "gitlab", "version control"],
    "Linux": ["linux", "unix", "bash", "shell scripting"],
    "Unit Testing": ["unit testing", "pytest", "unittest", "test driven development", "tdd"],
    "Communication": ["communication", "star framework", "behavioral", "soft skills", "interpersonal", "communication (star)", "clarity"],

    # Data Analytics & Visualization
    "Statistics": ["statistics", "biostatistics", "statistical modeling", "hypothesis testing", "a/b testing"],
    "Tableau": ["tableau"],
    "Power BI": ["power bi", "powerbi"],
    "Data Visualization": ["data visualization", "matplotlib", "seaborn", "plotly"]
}

# Inverted index: lowercase alias -> canonical name
ALIAS_TO_CANONICAL: Dict[str, str] = {}
for canonical, aliases in CANONICAL_SKILL_ALIASES.items():
    ALIAS_TO_CANONICAL[canonical.lower()] = canonical
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias.lower()] = canonical


# ----------------------------------------------------------------------
# 2. TARGET ROLE SKILL REQUIREMENTS
# ----------------------------------------------------------------------

ROLE_REQUIREMENTS: Dict[str, Dict[str, List[str]]] = {
    "Machine Learning Engineer": {
        "core_skills": [
            "Python", "Machine Learning", "MLOps", "PyTorch", "Scikit-learn",
            "Deep Learning", "Docker", "SQL"
        ],
        "important_skills": [
            "TensorFlow", "MLflow", "CI/CD", "FastAPI", "Kubernetes",
            "Feature Engineering", "Git", "System Design", "Model Monitoring"
        ],
        "optional_skills": [
            "AWS", "GCP", "Apache Spark", "Airflow", "DVC", "C++"
        ]
    },
    "Data Scientist": {
        "core_skills": [
            "Python", "SQL", "Pandas", "NumPy", "Statistics",
            "Machine Learning", "Scikit-learn"
        ],
        "important_skills": [
            "Data Visualization", "Feature Engineering", "A/B Testing",
            "Tableau", "Power BI", "Git", "Deep Learning"
        ],
        "optional_skills": [
            "R", "Apache Spark", "AWS", "BigQuery", "Docker", "NLP", "MLflow"
        ]
    },
    "Software Engineer": {
        "core_skills": [
            "Python", "Java", "Data Structures & Algorithms",
            "SQL", "System Design", "Git"
        ],
        "important_skills": [
            "REST API", "Microservices", "Docker", "PostgreSQL",
            "Unit Testing", "CI/CD", "Linux"
        ],
        "optional_skills": [
            "C++", "JavaScript", "Redis", "Apache Kafka", "Kubernetes", "AWS", "FastAPI"
        ]
    },
    "AI Engineer": {
        "core_skills": [
            "Python", "PyTorch", "LLM", "RAG", "Transformers",
            "Deep Learning", "FastAPI"
        ],
        "important_skills": [
            "Docker", "Machine Learning", "NLP", "Git", "Vector Databases",
            "Model Evaluation", "Cloud"
        ],
        "optional_skills": [
            "Kubernetes", "AWS", "GCP", "CI/CD", "MLflow", "System Design", "C++"
        ]
    },
    "Frontend Developer": {
        "core_skills": [
            "JavaScript", "TypeScript", "React", "HTML5", "CSS3",
            "Tailwind CSS", "Git"
        ],
        "important_skills": [
            "REST API", "Redux", "Next.js", "Node.js", "Unit Testing"
        ],
        "optional_skills": [
            "Docker", "GraphQL", "CI/CD", "Web Performance", "Linux"
        ]
    },
    "Full Stack Web Developer": {
        "core_skills": [
            "JavaScript", "React", "Node.js", "Python", "SQL",
            "HTML5", "CSS3", "Git"
        ],
        "important_skills": [
            "TypeScript", "REST API", "PostgreSQL", "MongoDB",
            "Docker", "Tailwind CSS", "FastAPI"
        ],
        "optional_skills": [
            "Microservices", "CI/CD", "AWS", "Redis", "Next.js", "System Design"
        ]
    },
    "DevOps & Cloud Engineer": {
        "core_skills": [
            "Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Git", "Python"
        ],
        "important_skills": [
            "Terraform", "Ansible", "Jenkins", "Prometheus", "Grafana",
            "PostgreSQL", "System Design"
        ],
        "optional_skills": [
            "GCP", "Azure", "Apache Kafka", "Redis", "Go", "Security"
        ]
    }
}

# Alias role names for flexible matching
ROLE_ALIASES = {
    "ml engineer": "Machine Learning Engineer",
    "mle": "Machine Learning Engineer",
    "aiml engineer": "Machine Learning Engineer",
    "ai/ml engineer": "Machine Learning Engineer",
    "sde": "Software Engineer",
    "software development engineer": "Software Engineer",
    "full stack developer": "Full Stack Web Developer",
    "full stack web developer": "Full Stack Web Developer",
    "fullstack": "Full Stack Web Developer",
    "devops engineer": "DevOps & Cloud Engineer",
    "cloud engineer": "DevOps & Cloud Engineer"
}


def get_canonical_role(role_name: str) -> str:
    """Normalizes any role input string into a supported canonical role."""
    if not role_name:
        return "Machine Learning Engineer"
    cleaned = role_name.strip()
    if cleaned in ROLE_REQUIREMENTS:
        return cleaned
    cleaned_lower = cleaned.lower()
    if cleaned_lower in ROLE_ALIASES:
        return ROLE_ALIASES[cleaned_lower]
    for key in ROLE_REQUIREMENTS.keys():
        if key.lower() in cleaned_lower or cleaned_lower in key.lower():
            return key
    return "Machine Learning Engineer"


# ----------------------------------------------------------------------
# 3. EXTENSIBLE SKILL EXTRACTOR INTERFACE (ABC)
# ----------------------------------------------------------------------

class BaseSkillExtractor(ABC):
    """
    Abstract interface for skill extraction.
    Designed so future AI/LLM-based extractors can be seamlessly swapped in.
    """

    @abstractmethod
    def extract_skills(self, text: str) -> List[str]:
        """Extracts and returns a sorted list of unique canonical skills."""
        pass


class RuleBasedSkillExtractor(BaseSkillExtractor):
    """
    High-precision knowledge-base skill extractor.
    Uses regex word boundaries and canonical alias normalization.
    Guards against false-positive matching of ordinary English words.
    """

    def __init__(self):
        # Pre-compile patterns for longer phrases first (greedy phrase matching)
        self._compiled_patterns: List[Tuple[re.Pattern, str]] = []
        
        # Sort aliases by length descending so multi-word aliases match before single words
        all_aliases = sorted(
            ALIAS_TO_CANONICAL.items(),
            key=lambda x: len(x[0]),
            reverse=True
        )

        for alias, canonical in all_aliases:
            # Special case short aliases that need strict boundary guards
            if alias in {"c", "r"}:
                pattern = re.compile(rf"(?:\b{re.escape(alias)}\b\s+(?:programming|language|code|script))|(?:\b(?:programming in|learning|using)\s+{re.escape(alias)}\b)", re.IGNORECASE)
            elif alias in {"js", "ts", "ml", "dl", "tf", "cv", "dsa"}:
                pattern = re.compile(rf"\b{re.escape(alias)}\b", re.IGNORECASE)
            elif alias in {"c++", "c#"}:
                pattern = re.compile(rf"(?:^|\s|\b){re.escape(alias)}(?:\s|\b|$|[,\.;])", re.IGNORECASE)
            elif alias in {"ci/cd", "ci-cd"}:
                pattern = re.compile(rf"\b{re.escape(alias)}\b", re.IGNORECASE)
            else:
                pattern = re.compile(rf"\b{re.escape(alias)}\b", re.IGNORECASE)
            
            self._compiled_patterns.append((pattern, canonical))

    def extract_skills(self, text: str) -> List[str]:
        if not text:
            return []

        matched_skills: Set[str] = set()
        
        for pattern, canonical in self._compiled_patterns:
            if pattern.search(text):
                matched_skills.add(canonical)

        return sorted(list(matched_skills))


# Global default instance
default_skill_extractor = RuleBasedSkillExtractor()


def normalize_skill(skill_name: str) -> str:
    """
    Normalizes any raw skill name, topic, or question keyword into its canonical taxonomy form.
    Handles aliases, capitalization variations, and composite names (e.g. 'MLOps / CI/CD' -> 'MLOps').
    """
    if not skill_name:
        return "General"

    clean = skill_name.strip()
    low = clean.lower()

    # Direct canonical or alias match
    if low in ALIAS_TO_CANONICAL:
        return ALIAS_TO_CANONICAL[low]

    # Handle split topics like "Machine Learning / Overfitting" or "Docker & Kubernetes"
    for part in re.split(r"[/&,;\-—|]", clean):
        part_clean = part.strip().lower()
        if part_clean in ALIAS_TO_CANONICAL:
            return ALIAS_TO_CANONICAL[part_clean]

    # Substring search in canonical names or aliases
    for canonical, aliases in CANONICAL_SKILL_ALIASES.items():
        if canonical.lower() == low or low == canonical.lower():
            return canonical
        if canonical.lower() in low or low in canonical.lower():
            return canonical
        for a in aliases:
            if a == low or a in low:
                return canonical

    return clean.title()
