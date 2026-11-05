"""
Just-In-Time (JIT) Skill Primer & Remediation Service
AI Career Preparation Agent

Provides 3-minute high-yield conceptual primers and 2-question verification
checks for ground-zero (0% baseline) skill gaps to solve the assessment trap.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..schemas.skill import SkillPrimerResponse, PrimerQuizQuestion, SkillPrimerVerifyResponse
from .skill_service import record_skill_evidence
from .ai.llm.llm_service import get_skill_primer_llm_service

logger = logging.getLogger("primer_service")

# Curated, zero-hallucination ground-truth primers for core foundational tech skills
CURATED_PRIMERS: Dict[str, Dict[str, Any]] = {
    "docker": {
        "concept_title": "Docker Containerization Fundamentals",
        "plain_english_definition": "Docker packages your application, runtime, libraries, and configurations into a lightweight, portable container that executes identically on any computer or cloud server.",
        "why_role_needs_it": "Modern software engineering and DevOps require Docker to eliminate 'it works on my machine' bugs, standardize CI/CD testing environments, and package microservices for Kubernetes orchestration.",
        "core_mental_models": [
            "Dockerfile = The Recipe (a text blueprint containing sequential instructions: FROM, COPY, RUN, CMD).",
            "Image = The Packaged Snapshot (an immutable, read-only template built from a Dockerfile).",
            "Container = The Running Instance (an isolated, lightweight operating process instantiated from an image)."
        ],
        "interview_golden_qa": {
            "question": "What is the fundamental difference between a Docker container and a traditional Virtual Machine (VM)?",
            "answer": "A Virtual Machine virtualizes physical hardware and runs a full guest operating system on top of a hypervisor, consuming gigabytes of RAM and taking minutes to boot. Docker containers share the host operating system kernel and isolate processes using Linux namespaces and cgroups, booting in milliseconds with minimal resource overhead."
        },
        "verification_quiz": [
            {
                "id": 1,
                "question": "Which of the following correctly describes the relationship between Dockerfile, Image, and Container?",
                "options": [
                    "A Dockerfile is the build recipe, an Image is the read-only template, and a Container is the running instance",
                    "An Image builds a Dockerfile, and a Container stores the raw source code",
                    "A Container is a Virtual Machine that compiles Images into Dockerfiles",
                    "A Dockerfile is a background daemon that monitors running Linux kernels"
                ],
                "correct_option_index": 0,
                "explanation": "You write a Dockerfile, build it into an immutable Image ('docker build'), and run that image as an active Container ('docker run')."
            },
            {
                "id": 2,
                "question": "Why are Docker containers significantly lighter and faster to start than Virtual Machines?",
                "options": [
                    "Containers share the host operating system kernel instead of booting a full guest OS",
                    "Containers do not use any memory or CPU resources on the host machine",
                    "Containers only run compiled binary code and cannot run interpreted languages",
                    "Containers require a dedicated Type-1 hypervisor like VMware ESXi"
                ],
                "correct_option_index": 0,
                "explanation": "Containers achieve process isolation via Linux kernel features (namespaces & cgroups) while sharing the host kernel, avoiding the overhead of a separate guest OS."
            }
        ]
    },
    "java": {
        "concept_title": "Core Java & JVM Memory Architecture",
        "plain_english_definition": "Java is a strongly-typed, object-oriented programming language designed for platform independence through bytecode executed by the Java Virtual Machine (JVM).",
        "why_role_needs_it": "Enterprise backend systems, high-concurrency payment gateways, and large-scale distributed architectures rely on Java for robustness, memory safety, and thread synchronization.",
        "core_mental_models": [
            "JVM Memory = Heap (stores all dynamic objects and class instances) vs. Stack (stores primitive values and thread execution stack frames).",
            "Garbage Collection = Automatic memory management that reclaims heap memory occupied by unreachable objects, using generational hypotheses (Young, Eden, Survivor, Tenured).",
            "OOP Pillars = Encapsulation (hiding state), Inheritance (reusing behavior), Polymorphism (dynamic dispatch), and Abstraction (interfaces)."
        ],
        "interview_golden_qa": {
            "question": "Why is String immutable in Java, and how does the String Constant Pool benefit performance?",
            "answer": "String is immutable for security, thread safety, and memory optimization. Immutability ensures that strings cannot be tampered with when passed as network or database credentials. It also enables the String Constant Pool, where identical string literals share a single heap reference, saving significant memory."
        },
        "verification_quiz": [
            {
                "id": 1,
                "question": "In Java memory architecture, where are instantiated objects stored versus local primitive variables?",
                "options": [
                    "Objects are stored on the Heap; local primitive variables are stored on the Thread Stack",
                    "Objects are stored on the Stack; local primitives are stored on the Heap",
                    "Both objects and local variables are stored exclusively in the Metaspace",
                    "Objects reside on disk while local variables reside in CPU registers"
                ],
                "correct_option_index": 0,
                "explanation": "In Java, all objects and arrays reside in shared Heap memory, whereas each thread has a private Stack for method call frames and local primitive variables."
            },
            {
                "id": 2,
                "question": "What is the primary benefit of String immutability in multi-threaded Java applications?",
                "options": [
                    "Strings are inherently thread-safe without requiring manual synchronization or locks",
                    "Strings can automatically resize their internal byte arrays during execution",
                    "Strings consume zero heap memory when declared inside loops",
                    "Strings can be converted to primitive integers with zero CPU cycles"
                ],
                "correct_option_index": 0,
                "explanation": "Because String objects cannot be modified once created, multiple threads can safely read the same String instance simultaneously without race conditions or locks."
            }
        ]
    },
    "python": {
        "concept_title": "Python Execution Model & Concurrency",
        "plain_english_definition": "Python is a dynamic, high-level language emphasizing developer readability, rapid prototyping, and extensive ecosystem support across backend, data engineering, and AI/ML.",
        "why_role_needs_it": "Python is the primary language for AI/ML pipelines, FastAPI/Django web services, scripting automation, and analytical data transformation.",
        "core_mental_models": [
            "Global Interpreter Lock (GIL) = A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecode simultaneously.",
            "Concurrency Paradigms = Multiprocessing (true parallelism for CPU-bound tasks by spawning separate processes) vs. Asyncio (single-threaded cooperative multitasking for high-concurrency I/O).",
            "Memory Management = Reference counting augmented by a cyclic garbage collector to detect and free circular references."
        ],
        "interview_golden_qa": {
            "question": "When should you choose multiprocessing over threading in Python?",
            "answer": "In CPython, the Global Interpreter Lock (GIL) limits multi-threading to one active CPU core. Therefore, multi-threading is ideal for I/O-bound tasks (network requests, disk I/O) where threads spend most of their time waiting. For CPU-bound tasks (mathematical computation, data processing, encryption), multiprocessing is required to bypass the GIL and utilize multiple physical CPU cores."
        },
        "verification_quiz": [
            {
                "id": 1,
                "question": "What is the primary architectural role of the Global Interpreter Lock (GIL) in CPython?",
                "options": [
                    "It ensures memory safety by allowing only one native thread to execute Python bytecode at a time",
                    "It automatically compiles Python scripts into native x86 machine instructions",
                    "It restricts Python programs to running on a single user operating system",
                    "It encrypts all Python source code prior to runtime execution"
                ],
                "correct_option_index": 0,
                "explanation": "The GIL is a mutual-exclusion lock that protects CPython's internal memory management and reference counts from concurrent access by multiple threads."
            },
            {
                "id": 2,
                "question": "Which Python concurrency model is best suited for high-throughput, network I/O-bound microservices?",
                "options": [
                    "Asynchronous event-loop multitasking with asyncio",
                    "Spawning a heavy OS process for every incoming HTTP request",
                    "Writing raw C-extensions with inline assembly code",
                    "Disabling the garbage collector during request handling"
                ],
                "correct_option_index": 0,
                "explanation": "Asyncio uses a single-threaded cooperative event loop to handle thousands of concurrent I/O sockets efficiently with minimal memory overhead."
            }
        ]
    },
    "sql": {
        "concept_title": "Relational Databases & Query Optimization",
        "plain_english_definition": "SQL (Structured Query Language) is the domain-specific standard for defining, querying, and managing relational data models adhering to ACID transactional guarantees.",
        "why_role_needs_it": "Every software discipline—backend, data engineering, product engineering—relies on SQL to persist business transactions, retrieve aggregate metrics, and prevent data corruption.",
        "core_mental_models": [
            "ACID Guarantees = Atomicity (all-or-nothing), Consistency (rules enforced), Isolation (concurrent operations do not interfere), Durability (committed changes persist).",
            "Indexing = B-Tree data structures that allow logarithmic lookup O(log N) instead of sequential full-table scans O(N).",
            "Normalization = Decomposing tables (1NF, 2NF, 3NF) to eliminate redundant data and avoid update/delete anomalies."
        ],
        "interview_golden_qa": {
            "question": "What is the difference between an INNER JOIN and a LEFT OUTER JOIN?",
            "answer": "An INNER JOIN returns only records where there is a matching key in both tables. A LEFT OUTER JOIN returns all records from the left table, along with matched records from the right table; if no match exists on the right, NULL values are returned for the right table columns."
        },
        "verification_quiz": [
            {
                "id": 1,
                "question": "What is the primary trade-off of adding multiple B-Tree indexes to a relational database table?",
                "options": [
                    "Read queries become significantly faster, but write operations (INSERT, UPDATE, DELETE) become slower",
                    "Database storage usage decreases, but read query latency increases",
                    "Transactions automatically become non-atomic and lose durability",
                    "Table foreign key constraints are permanently disabled"
                ],
                "correct_option_index": 0,
                "explanation": "Indexes speed up SELECT queries by avoiding full-table scans, but every INSERT or UPDATE must also update the B-Tree index structures, adding write overhead."
            },
            {
                "id": 2,
                "question": "What happens when a database transaction experiences a failure before COMMIT is executed?",
                "options": [
                    "The transaction is rolled back, restoring the database to its exact prior consistent state (Atomicity)",
                    "Partial updates are saved to disk and marked as unverified",
                    "The database engine terminates and corrupts the entire schema",
                    "The failed transaction is automatically committed with NULL values"
                ],
                "correct_option_index": 0,
                "explanation": "The Atomicity property guarantees all-or-nothing execution: any failure before COMMIT triggers a full ROLLBACK."
            }
        ]
    },
    "c": {
        "concept_title": "C Systems Programming & Memory Model",
        "plain_english_definition": "C is a low-level procedural language providing direct memory manipulation, minimal runtime overhead, and explicit hardware control.",
        "why_role_needs_it": "Embedded systems, operating system kernels, device drivers, and high-performance game engines rely on C for zero-overhead execution and deterministic memory layouts.",
        "core_mental_models": [
            "Pointers = Variables that store memory addresses directly; pointer arithmetic steps through memory by the size of the underlying type.",
            "Manual Memory Management = The programmer explicitly allocates memory via malloc/calloc and MUST release it with free to avoid leaks.",
            "Memory Safety Hazards = Buffer overflows, dangling pointers, double frees, and segmentation faults occur when accessing invalid memory."
        ],
        "interview_golden_qa": {
            "question": "What is a memory leak in C, and how do you detect and prevent it?",
            "answer": "A memory leak occurs when dynamically allocated heap memory (via malloc or calloc) is no longer referenced by any pointer but has not been freed with free(). Over time, this exhausts available RAM. In production, tools like Valgrind or AddressSanitizer (ASan) detect leaks, and developers follow disciplined ownership patterns to ensure every allocation has a matching free."
        },
        "verification_quiz": [
            {
                "id": 1,
                "question": "What happens if a program attempts to dereference a NULL or uninitialized pointer in C?",
                "options": [
                    "It causes undefined behavior, typically triggering an immediate Segmentation Fault (SIGSEGV)",
                    "The C compiler automatically allocates 4 bytes of heap memory",
                    "The program pauses and prompts the user to enter a valid address",
                    "The CPU executes a graceful rollback to the main function"
                ],
                "correct_option_index": 0,
                "explanation": "Dereferencing a pointer that points to address 0 (NULL) or unmapped memory is undefined behavior and immediately causes an OS memory access violation (SIGSEGV)."
            },
            {
                "id": 2,
                "question": "In C, what is the critical difference between the Stack and the Heap?",
                "options": [
                    "Stack memory is automatically managed with function calls; Heap memory requires explicit malloc and free",
                    "Stack memory is permanent and persists after process termination; Heap memory is cleared every second",
                    "Stack memory can only store strings; Heap memory can only store floating point numbers",
                    "Stack memory is allocated dynamically at runtime using pointers; Heap memory is fixed at compile time"
                ],
                "correct_option_index": 0,
                "explanation": "Stack memory is automatically allocated and popped with function scope frames, while Heap memory is managed dynamically and manually by the developer."
            }
        ]
    },
    "cpp": {
        "concept_title": "Modern C++ (RAII & Smart Pointers)",
        "plain_english_definition": "C++ is a multi-paradigm language combining low-level systems control with zero-cost abstractions, object-oriented design, and generic programming.",
        "why_role_needs_it": "High-frequency trading, game engines, autonomous vehicle robotics, and browser engines rely on C++ for extreme performance and fine-grained resource control.",
        "core_mental_models": [
            "RAII (Resource Acquisition Is Initialization) = Binding resource lifecycles (memory, file handles, sockets) to object scope so cleanup is guaranteed by destructors.",
            "Smart Pointers = std::unique_ptr (exclusive ownership, zero overhead) vs. std::shared_ptr (reference-counted shared ownership).",
            "Move Semantics (std::move) = Transferring ownership of resources from temporary objects (rvalues) instead of making expensive deep copies."
        ],
        "interview_golden_qa": {
            "question": "What is RAII in C++, and why does it eliminate manual delete calls?",
            "answer": "RAII (Resource Acquisition Is Initialization) ties resource management to object lifetime. Resources are acquired in the constructor and released in the destructor. Because stack-allocated objects are automatically destroyed when leaving scope—even during an exception—the destructor cleans up the resource automatically, eliminating memory leaks and the need for manual delete calls."
        },
        "verification_quiz": [
            {
                "id": 1,
                "question": "What is the primary benefit of using std::unique_ptr over raw pointers in modern C++?",
                "options": [
                    "It enforces exclusive resource ownership and automatically deletes the managed object when leaving scope",
                    "It shares ownership across unlimited threads using atomic hardware locks",
                    "It allows pointer arithmetic without checking array boundary limits",
                    "It compiles the underlying class into Java bytecode for cross-platform execution"
                ],
                "correct_option_index": 0,
                "explanation": "std::unique_ptr has zero runtime overhead over a raw pointer and prevents memory leaks by automatically calling delete upon destruction."
            },
            {
                "id": 2,
                "question": "What does move semantics (std::move) accomplish in modern C++?",
                "options": [
                    "It casts an object to an rvalue reference, enabling resource theft instead of expensive deep copies",
                    "It physically moves a source file from one directory to another at runtime",
                    "It shifts bits to the right for integer division",
                    "It moves an object from Heap memory into CPU cache registers permanently"
                ],
                "correct_option_index": 0,
                "explanation": "Move semantics allow heavy heap resources (like std::vector buffers) to be transferred quickly without copying elements."
            }
        ]
    }
}


def _resolve_canonical_skill(skill_name: str) -> str:
    """Normalizes arbitrary skill names to canonical keys."""
    if not skill_name:
        return "docker"
    s = skill_name.strip().lower()
    if "docker" in s or "container" in s:
        return "docker"
    if "java" in s and "script" not in s:
        return "java"
    if "python" in s or "py" == s:
        return "python"
    if "sql" in s or "postgres" in s or "database" in s or "mysql" in s:
        return "sql"
    if s in ["c", "c-lang", "c programming", "c-language"]:
        return "c"
    if "c++" in s or "cpp" in s:
        return "cpp"
    return s


def get_skill_primer(
    skill_name: str,
    target_role: Optional[str] = "Software Engineer",
    difficulty: Optional[str] = "Beginner"
) -> SkillPrimerResponse:
    """
    Retrieves or generates a 3-minute JIT concept primer with 2 verification questions.
    Uses curated zero-hallucination primers for core tech, or generates dynamically via dedicated LLM.
    """
    canon_key = _resolve_canonical_skill(skill_name)
    if canon_key in CURATED_PRIMERS:
        data = CURATED_PRIMERS[canon_key]
        quiz_items = [PrimerQuizQuestion(**q) for q in data["verification_quiz"]]
        return SkillPrimerResponse(
            skill_name=skill_name.capitalize(),
            concept_title=data["concept_title"],
            plain_english_definition=data["plain_english_definition"],
            why_role_needs_it=data["why_role_needs_it"],
            core_mental_models=data["core_mental_models"],
            interview_golden_qa=data["interview_golden_qa"],
            verification_quiz=quiz_items,
            estimated_read_time="3 mins"
        )

    # Dynamic generation for non-curated niche skills via dedicated Skill Primer LLM
    try:
        llm = get_skill_primer_llm_service()
        prompt = f"""
Generate a concise, 3-minute foundational primer for the skill: '{skill_name}', needed for the role '{target_role}' at {difficulty} level.
Return valid JSON with:
{{
  "concept_title": "{skill_name} Fundamentals",
  "plain_english_definition": "2-sentence simple definition of what {skill_name} is",
  "why_role_needs_it": "Why a {target_role} uses {skill_name} in production",
  "core_mental_models": ["Model 1", "Model 2", "Model 3"],
  "interview_golden_qa": {{"question": "Top interview question about {skill_name}", "answer": "Ideal model answer"}},
  "verification_quiz": [
    {{
      "id": 1,
      "question": "Conceptual multiple-choice question testing understanding of {skill_name}",
      "options": ["Correct option", "Distractor 1", "Distractor 2", "Distractor 3"],
      "correct_option_index": 0,
      "explanation": "Why option 0 is correct"
    }},
    {{
      "id": 2,
      "question": "Second conceptual multiple-choice question on trade-offs or use-case",
      "options": ["Correct option", "Distractor 1", "Distractor 2", "Distractor 3"],
      "correct_option_index": 0,
      "explanation": "Why option 0 is correct"
    }}
  ]
}}
"""
        raw_res = llm.generate(prompt=prompt, system_instruction="You are a Technical Educator creating 3-minute concept primers.")
        # Extract json
        start_idx = raw_res.find("{")
        end_idx = raw_res.rfind("}") + 1
        if start_idx != -1 and end_idx != -1:
            parsed = json.loads(raw_res[start_idx:end_idx])
            quiz_items = [PrimerQuizQuestion(**q) for q in parsed.get("verification_quiz", [])]
            return SkillPrimerResponse(
                skill_name=skill_name.capitalize(),
                concept_title=parsed.get("concept_title", f"{skill_name} Fundamentals"),
                plain_english_definition=parsed.get("plain_english_definition", f"{skill_name} is a key technological competency for {target_role}."),
                why_role_needs_it=parsed.get("why_role_needs_it", f"{target_role} roles utilize {skill_name} to design and deploy software."),
                core_mental_models=parsed.get("core_mental_models", [f"Foundational construct of {skill_name}", "Core workflow", "Standard best practices"]),
                interview_golden_qa=parsed.get("interview_golden_qa", {"question": f"What is {skill_name}?", "answer": f"{skill_name} is a critical component in modern software engineering."}),
                verification_quiz=quiz_items,
                estimated_read_time="3 mins"
            )
    except Exception as e:
        logger.warning(f"Dynamic primer generation for {skill_name} failed: {e}. Falling back to default.")

    # Graceful fallback primer
    fallback_quiz = [
        PrimerQuizQuestion(
            id=1,
            question=f"What is the primary role of {skill_name} in a {target_role} technical stack?",
            options=[
                f"{skill_name} provides standardized engineering capabilities and improves system scalability",
                f"{skill_name} replaces the entire operating system kernel",
                f"{skill_name} is only used for graphic design assets",
                f"{skill_name} permanently disables cloud network firewalls"
            ],
            correct_option_index=0,
            explanation=f"{skill_name} is utilized to build robust, scalable engineering solutions."
        ),
        PrimerQuizQuestion(
            id=2,
            question=f"When preparing for an interview involving {skill_name}, what is the best strategy?",
            options=[
                f"Master core architecture, common failure modes, and practical trade-offs of {skill_name}",
                f"Memorize random trivia without understanding runtime mechanics",
                f"Avoid mentioning {skill_name} when asked by the interviewer",
                f"Claim 10 years of experience without knowing basic syntax"
            ],
            correct_option_index=0,
            explanation=f"Interviewers value candidates who articulate architecture, constraints, and trade-offs of {skill_name} clearly."
        )
    ]
    return SkillPrimerResponse(
        skill_name=skill_name.capitalize(),
        concept_title=f"{skill_name.capitalize()} Fundamentals",
        plain_english_definition=f"{skill_name.capitalize()} is an essential engineering tool and methodology utilized in modern {target_role} systems.",
        why_role_needs_it=f"{target_role} positions require {skill_name.capitalize()} to construct, validate, and maintain reliable production workflows.",
        core_mental_models=[
            f"Core Architecture: The foundational components that power {skill_name.capitalize()}.",
            f"Execution Flow: How data and requests flow through {skill_name.capitalize()} in production.",
            f"Defensive Engineering: Common bottlenecks, failure modes, and error recovery patterns."
        ],
        interview_golden_qa={
            "question": f"What core problem does {skill_name.capitalize()} solve?",
            "answer": f"{skill_name.capitalize()} provides standardized, reliable mechanisms to solve complex distributed engineering problems while reducing operational overhead."
        },
        verification_quiz=fallback_quiz,
        estimated_read_time="3 mins"
    )


def verify_primer_quiz(
    db: Session,
    user_id: str,
    skill_name: str,
    answers: Dict[int, int]
) -> SkillPrimerVerifyResponse:
    """
    Evaluates candidate answers to the 2-question primer quiz.
    Upon passing, records verified skill evidence in career_agent.db,
    elevates baseline skill score, awards +35 XP, and updates closed-loop Next-Best-Action.
    """
    primer = get_skill_primer(skill_name)
    quiz = primer.verification_quiz
    if not quiz:
        return SkillPrimerVerifyResponse(
            passed=True,
            score=100,
            awarded_xp=35,
            message="Primer completed! Foundation established.",
            next_action_title=f"Practice 5-Question Mock Interview on {skill_name.capitalize()}",
            next_action_route="/interview-setup"
        )

    correct_count = 0
    total = len(quiz)
    for q in quiz:
        user_ans = answers.get(q.id)
        if user_ans is not None and user_ans == q.correct_option_index:
            correct_count += 1

    score_pct = int((correct_count / total) * 100)
    passed = score_pct >= 50

    if passed:
        # Record verified skill evidence in database to close the loop!
        record_skill_evidence(
            db=db,
            user_id=user_id,
            skill_name=skill_name.capitalize(),
            source_type="primer_verified",
            source_id="jit_concept_primer",
            score=max(60, score_pct),
            evidence_text=f"Demonstrated foundational understanding of {skill_name.capitalize()} via 3-minute JIT Concept Primer ({correct_count}/{total} correct).",
            confidence="medium"
        )
        awarded_xp = 35
        message = f"Congratulations! You scored {score_pct}%. Your foundational knowledge of {skill_name.capitalize()} is verified (+{awarded_xp} XP awarded)."
    else:
        awarded_xp = 0
        message = f"You answered {correct_count}/{total} correctly ({score_pct}%). Review the core mental models and try again to unlock your interview drill."

    return SkillPrimerVerifyResponse(
        passed=passed,
        score=score_pct,
        awarded_xp=awarded_xp,
        message=message,
        next_action_title=f"Take 5-Question Targeted Drill on {skill_name.capitalize()}",
        next_action_route="/interview-setup"
    )
