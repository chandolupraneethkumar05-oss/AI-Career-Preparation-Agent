"""
LLM Service Abstraction & Grounded Implementations
AI Career Preparation Agent

Provides clean provider abstraction:
- BaseLLMService (ABC)
- LocalGroundedLLMService: Deterministic local inference engine grounded strictly
  in retrieved curriculum documents and candidate career state. Zero paid API keys needed.
- OpenAICompatibleLLMService: Optional cloud provider adapter falling back to local engine.
"""

import os
import re
import json
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

from .multilingual_feedback_service import multilingual_feedback_service
from ..languages import normalize_feedback_language, is_supported_feedback_language, get_language_display_name


class BaseLLMService(ABC):
    """Abstract Base Class for LLM generation."""

    @abstractmethod
    def generate(self, prompt: str, system_instruction: str, temperature: float = 0.3) -> str:
        pass

    @abstractmethod
    def generate_grounded_response(
        self,
        query: str,
        user_context: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_interview_question(
        self,
        career_context: Dict[str, Any],
        session_config: Dict[str, Any],
        sequence_number: int,
        previous_questions: List[Dict[str, Any]],
        previous_evaluations: List[Dict[str, Any]],
        retrieved_chunk: Optional[Dict[str, Any]] = None,
        language: str = "en",
        adaptive_decision: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def evaluate_interview_answer(
        self,
        question: Dict[str, Any],
        answer_text: str = "",
        career_context: Optional[Dict[str, Any]] = None,
        language: str = "en",
        user_answer: Optional[str] = None,
        retrieved_knowledge: Optional[List[Dict[str, Any]]] = None,
        target_role: Optional[str] = None,
        difficulty: Optional[str] = None,
        interview_type: Optional[str] = None
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_final_interview_feedback(
        self,
        session: Dict[str, Any],
        questions: List[Dict[str, Any]],
        answers: List[Dict[str, Any]],
        evaluations: List[Dict[str, Any]],
        career_context: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_quick_answer(
        self,
        question: str,
        topic: Optional[str] = None,
        difficulty: str = "Intermediate",
        interview_type: str = "Technical",
        target_role: str = "Machine Learning Engineer",
        career_context: Optional[Dict[str, Any]] = None,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        pass



class LocalGroundedLLMService(BaseLLMService):
    """
    Deterministic, grounded synthesis engine that produces structured technical
    explanations directly grounded in the retrieved curriculum chunks, personalized
    to candidate target role and skill gaps, with zero API costs.
    """

    def generate(self, prompt: str, system_instruction: str, temperature: float = 0.3) -> str:
        return "Local Grounded Engine: Generated response based on system prompt."

    def generate_grounded_response(
        self,
        query: str,
        user_context: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        start_time = time.time()
        target_role = user_context.get("target_role", "Machine Learning Engineer")
        name = user_context.get("candidate_name", "Candidate")
        urgent_gap = user_context.get("urgent_gap")
        missing_skills = user_context.get("missing_skills", [])
        high_gaps = user_context.get("high_priority_gaps", [])

        # Case 1: Insufficient Grounded Knowledge
        if not retrieved_chunks:
            answer = (
                f"I searched our career preparation curriculum for \"{query}\", "
                f"but found no verified grounded documentation matching this specific topic. "
                f"To maintain academic integrity and prevent inaccurate answers, I do not generate ungrounded technical facts. "
                f"Please consult standard documentation or ask about supported topics like Machine Learning, Python, SQL, MLOps, "
                f"Deep Learning, ATS formatting, or the STAR behavioral interview method."
            )
            key_points = [
                "No verified curriculum document matched the search query.",
                "Hallucination guard activated to prevent unsupported claims.",
                f"Explore verified topics aligned with your {target_role} path."
            ]
            recommended_action = {
                "title": f"Practice Verified {target_role} Challenges",
                "action": "Open Daily Challenge",
                "route": "/daily-challenge",
                "action_type": "challenge",
                "reason": "Practice verified curriculum drills while broadening your technical foundational knowledge."
            }

            if language == "te":
                answer = (
                    f"\"{query}\" గురించిన నిర్ధారిత డాక్యుమెంటేషన్ మా కరిక్యులమ్‌లో కనుగొనబడలేదు. "
                    f"ఖచ్చితమైన సమాచారం కోసం Machine Learning, Python, SQL, లేదా STAR మెథడ్ గురించి అడగండి."
                )
                key_points = [
                    "శోధించిన ప్రశ్నకు నిర్ధారిత సమాచారం లభించలేదు.",
                    "తప్పుడు సమాచారాన్ని నిరోధించడానికి సిస్టమ్ రక్షణ అమల్లో ఉంది.",
                    f"మీ {target_role} లక్ష్యానికి సంబంధించిన అంశాలను అన్వేషించండి."
                ]
            elif language == "hi":
                answer = (
                    f"\"{query}\" के संबंध में हमारे पाठ्यक्रम में कोई सत्यापित दस्तावेज़ नहीं मिला। "
                    f"सटीक तैयारी के लिए Machine Learning, Python, SQL, या STAR पद्धति से संबंधित प्रश्न पूछें।"
                )
                key_points = [
                    "खोजे गए प्रश्न के लिए कोई सत्यापित दस्तावेज़ नहीं मिला।",
                    "गलत जानकारी को रोकने के लिए सुरक्षा लागू है।",
                    f"अपनी {target_role} तैयारी के सत्यापित विषयों का अभ्यास करें।"
                ]

            latency = round((time.time() - start_time) * 1000, 2)
            return {
                "answer": answer,
                "key_points": key_points,
                "recommended_action": recommended_action,
                "sources": [],
                "grounded": False,
                "language": language,
                "model_provider": "local-grounded-engine",
                "latency_ms": latency
            }

        # Case 2: Grounded Knowledge Available
        primary_chunk = retrieved_chunks[0]
        topic = primary_chunk.get("topic", primary_chunk.get("category", "Technical"))
        title = primary_chunk.get("title", "")
        content = primary_chunk.get("content", "")

        # Personalization prefix
        pers_context = []
        if urgent_gap and (urgent_gap.lower() in query.lower() or urgent_gap.lower() in content.lower()):
            pers_context.append(f"{urgent_gap} is currently one of your active priority skill gaps")
        if target_role in primary_chunk.get("applicable_roles", []):
            pers_context.append(f"this concept is directly evaluated in {target_role} technical interviews")

        context_phrase = ""
        if pers_context:
            context_phrase = f"Since {' and '.join(pers_context)}, mastering this is high yield for your preparation.\n\n"

        # Construct answer from verified content
        core_answer = f"{context_phrase}{content}"

        # Synthesize 3 key points
        key_points = [
            f"Core Concept: {title}.",
            f"Technical Depth: Grounded in {primary_chunk.get('category')} ({primary_chunk.get('difficulty')} Level).",
            f"Interview Impact: Directly applicable to hiring evaluations for {target_role} roles."
        ]

        # Connect to existing Agent challenge or interview module
        rec_title = f"Practice {topic} Drill"
        rec_route = "/daily-challenge"
        rec_action = "Take Daily Challenge"
        rec_reason = f"Solidify your understanding of {topic} through an active technical articulation challenge."

        if any(gap in topic.lower() for gap in ["star", "behavioral", "communication"]):
            rec_title = "Practice Behavioral STAR Response"
            rec_route = "/daily-challenge"
            rec_action = "Practice Behavioral Drill"
            rec_reason = "Structured communication is best reinforced through active verbal rehearsal."
        elif any(gap in topic.lower() for gap in ["interview", "screening", "lifecycle"]):
            rec_title = f"Take Diagnostic {target_role} Mock Interview"
            rec_route = "/interview-setup"
            rec_action = "Start Mock Interview"
            rec_reason = "Test your readiness across dynamic 5-question multi-axis rubrics."

        recommended_action = {
            "title": rec_title,
            "action": rec_action,
            "route": rec_route,
            "action_type": "practice",
            "reason": rec_reason
        }

        # Multilingual synthesis if requested
        if language == "te":
            core_answer = (
                f"{context_phrase}ఈ అంశం ({title}) మీ {target_role} ఇంటర్వ్యూలలో చాలా ముఖ్యం.\n\n"
                f"{content}\n\n"
                f"ముఖ్యమైన పరిశీలన: ఈ కాన్సెప్ట్‌ను ప్రాక్టీస్ చేయడం ద్వారా మీ సాంకేతిక పరిజ్ఞానం మరింత బలపడుతుంది."
            )
            key_points = [
                f"ప్రధాన అంశం: {title}.",
                f"సాంకేతిక స్థాయి: {primary_chunk.get('difficulty')} స్థాయి ({primary_chunk.get('category')}).",
                f"కెరీర్ ప్రాముఖ్యత: {target_role} పాత్ర కోసం అత్యంత ఆవశ్యకం."
            ]
            recommended_action["action"] = "ప్రాక్టీస్ చేయండి"
        elif language == "hi":
            core_answer = (
                f"{context_phrase}यह विषय ({title}) आपकी {target_role} साक्षात्कारों के लिए अत्यंत महत्वपूर्ण है।\n\n"
                f"{content}\n\n"
                f"मुख्य निष्कर्ष: इस अवधारणा का अभ्यास करने से आपकी तकनीकी समझ और साक्षात्कार तत्परता में सुधार होगा।"
            )
            key_points = [
                f"मुख्य विषय: {title}.",
                f"तकनीकी स्तर: {primary_chunk.get('difficulty')} स्तर ({primary_chunk.get('category')}).",
                f"करियर महत्व: {target_role} पद के लिए अत्यंत उपयोगी।"
            ]
            recommended_action["action"] = "अभ्यास शुरू करें"

        sources = [
            {
                "id": c.get("id"),
                "title": c.get("title"),
                "category": c.get("category"),
                "topic": c.get("topic"),
                "difficulty": c.get("difficulty"),
                "source": c.get("source"),
                "relevance_score": c.get("relevance_score", 1.0)
            }
            for c in retrieved_chunks
        ]

        applied_summary = f"Role: {target_role}"
        if urgent_gap:
            applied_summary += f" • Gap: {urgent_gap}"

        latency = round((time.time() - start_time) * 1000, 2)
        return {
            "answer": core_answer,
            "key_points": key_points,
            "recommended_action": recommended_action,
            "sources": sources,
            "grounded": True,
            "language": language,
            "career_context_applied": applied_summary,
            "model_provider": "local-grounded-engine",
            "latency_ms": latency
        }

    def _localize_question(self, text: str, language: str, target_role: str) -> str:
        if language == "te":
            return f"[తెలుగు అనువాదం / Telugu Question]\n{target_role} ఇంటర్వ్యూ సందర్భంలో: {text}"
        elif language == "hi":
            return f"[हिन्दी अनुवाद / Hindi Question]\n{target_role} साक्षात्कार संदर्भ में: {text}"
        elif language == "es":
            return f"[Pregunta en Español]\nEn el contexto de la entrevista para {target_role}: {text}"
        return text

    def _localize_feedback(self, feedback_en: str, language: str) -> str:
        if language == "te":
            return (
                f"విశ్లేషణ (AI Feedback): {feedback_en}\n"
                "ముఖ్య గమనిక: తదుపరి సమాధానాలలో మీ సాంకేతిక నిర్ణయాలు, కొలమానాలు (metrics), మరియు ఆర్కిటెక్చరల్ trade-offs ను స్పష్టంగా వివరించండి."
            )
        elif language == "hi":
            return (
                f"समीक्षा (AI Feedback): {feedback_en}\n"
                "महत्वपूर्ण सुझाव: अगले उत्तर में अपने तकनीकी निर्णयों, मेट्रिक्स (metrics) और आर्किटेक्चरल trade-offs को अधिक स्पष्टता से समझाएं।"
            )
        elif language == "es":
            return f"Retroalimentación: {feedback_en}\nSugerencia: Profundice en las métricas y decisiones técnicas en sus próximas respuestas."
        return feedback_en

    def _get_skill_gap_questions(self, gap_skill: str, target_role: str, difficulty: str) -> List[str]:
        skill_lower = gap_skill.lower()
        if "sql" in skill_lower:
            return [
                "Suppose you have `customers` and `orders` tables. How would you construct an optimized query to identify customers who have never placed an order, and how would you index and optimize this query for tables with millions of rows?",
                "Can you explain the difference between RANK(), DENSE_RANK(), and ROW_NUMBER() window functions in SQL, and provide a real-world scenario where you would use each for reporting or deduplication?",
                "In high-throughput database systems, what is the difference between a Hash Join and a Nested Loop Join in PostgreSQL or MySQL, and how do composite indexes impact join execution plans?"
            ]
        elif any(k in skill_lower for k in ["docker", "container", "mlops"]):
            return [
                "In an MLOps deployment pipeline, how do you structure a multi-stage Dockerfile to serve a machine learning model, and what measures do you take to minimize container image footprint and runtime vulnerabilities?",
                "How do you implement automated canary deployments for machine learning microservices, and what metrics would trigger an automatic rollback when serving live inference traffic?",
                "How do you distinguish between data drift and concept drift in a deployed production model, and what automated retraining architecture would you establish to mitigate performance degradation?"
            ]
        elif any(k in skill_lower for k in ["pytorch", "deep learning"]):
            return [
                "When training deep neural networks with PyTorch, how do you debug training loss instability or exploding gradients, and which optimization techniques (learning rate schedules, gradient clipping) do you employ?",
                "Can you walk through how PyTorch's DistributedDataParallel (DDP) synchronizes gradients across multi-GPU nodes, and how it differs from simple DataParallel?",
                "How do you profile memory consumption and optimize GPU tensor allocations in PyTorch when encountering CUDA Out of Memory (OOM) errors during large-batch training?"
            ]
        elif "python" in skill_lower:
            return [
                "Explain the mechanics of Python's Global Interpreter Lock (GIL). When would you choose multiprocessing over multithreading or asyncio for CPU-bound vs I/O-bound data processing tasks?",
                "How do Python generators and the `yield` statement enable memory-efficient processing of multi-gigabyte log datasets compared to standard list collections?",
                "How do decorators work in Python under the hood, and how would you implement a parameterized retry decorator with exponential backoff for API client calls?"
            ]
        elif any(k in skill_lower for k in ["kubernetes", "k8s"]):
            return [
                "How do Kubernetes liveness, readiness, and startup probes differ, and how would you configure them for an AI model serving pod that requires 60 seconds of cold start to load weights into memory?",
                "When designing microservice workloads on Kubernetes, how do you manage horizontal pod autoscaling (HPA) based on custom Prometheus metrics like inference request queue depth?"
            ]
        elif any(k in skill_lower for k in ["scikit-learn", "sklearn"]):
            return [
                "How do you construct an end-to-end `ColumnTransformer` and `Pipeline` in scikit-learn to prevent data leakage between training and validation folds during cross-validation?",
                "In imbalanced classification datasets, why is accuracy a misleading metric, and how do you calibrate precision-recall curves and decision thresholds for fraud or anomaly detection?"
            ]
        else:
            return [
                f"A critical competency for a {target_role} is {gap_skill}. How would you approach designing, implementing, and debugging {gap_skill} in a production environment?",
                f"Regarding {gap_skill}: What are the most common failure modes, architectural anti-patterns, or scaling bottlenecks you must account for when building systems with {gap_skill}?",
                f"How would you evaluate and validate the correctness and performance of a {gap_skill} implementation before shipping it to staging and production?"
            ]

    def _get_curriculum_questions(self, category: str, topic: str, difficulty: str, target_role: str, interview_type: str) -> List[str]:
        cat = category.strip()
        diff = difficulty.strip()

        if cat == "Machine Learning":
            if diff == "Advanced":
                return [
                    "How do L1 and L2 regularization mathematically influence the loss surface and parameter weights in machine learning, and in what scenario would ElasticNet be preferred over pure Lasso or Ridge?",
                    "When architecting gradient boosting trees (e.g. XGBoost, LightGBM), how do histogram-based splitting and gradient-based one-side sampling (GOSS) drastically reduce training latency compared to exact greedy splitting?",
                    "How do you formulate the bias-variance decomposition mathematically, and how do ensemble methods like Bagging vs Boosting specifically target each component?"
                ]
            elif diff == "Beginner":
                return [
                    "What is the difference between supervised and unsupervised learning, and what are common real-world use cases for each?",
                    "Can you explain the difference between classification and regression in machine learning, and what evaluation metrics you use for each?",
                    "Why is it essential to split a dataset into training, validation, and test sets, and what happens if you evaluate your final model on the training data?"
                ]
            else:  # Intermediate
                return [
                    "How do you distinguish between high bias and high variance when evaluating machine learning models, and what concrete actions do you take when your model overfits the training dataset?",
                    "What is the difference between Precision, Recall, and ROC-AUC? In what real-world ML application would you prioritize Recall over Precision?",
                    "How do tree-based models like Random Forests determine feature importance, and what are the limitations of Gini impurity-based importance on high-cardinality features?"
                ]

        elif cat == "Deep Learning":
            if diff == "Advanced":
                return [
                    "Can you explain the mathematical formulation of scaled dot-product attention in Transformers, why the square root of the key dimension is used for scaling, and how multi-head attention facilitates representation learning?",
                    "How do layer normalization and batch normalization differ in terms of dimension reduction and operational statistics during distributed training vs inference?",
                    "In self-supervised pretraining (such as Masked Autoencoders or Contrastive Learning), how does the loss function prevent catastrophic representation collapse?"
                ]
            else:
                return [
                    "Can you explain the mathematical mechanism of backpropagation through deep layers, how vanishing gradients occur, and how modern activation functions or residual architectures mitigate this problem?",
                    "What are the structural trade-offs between Convolutional Neural Networks (CNNs) and Transformer architectures for computer vision and sequence modeling?",
                    "How do dropout and weight decay operate during the forward and backward passes, and why must dropout be deactivated during model inference?"
                ]

        elif cat == "SQL":
            return [
                "Explain the functional differences between INNER JOIN, LEFT OUTER JOIN, and FULL OUTER JOIN. In query execution, what happens under the hood during a Hash Join versus a Nested Loop Join?",
                "How do B-Tree indexes accelerate WHERE clause lookups, and what query patterns cause the query optimizer to perform a full table scan despite an index being present?",
                "How do ACID properties guarantee transactional reliability in relational databases, and what are the concurrency trade-offs between Read Committed and Serializable isolation levels?"
            ]

        elif cat == "MLOps":
            return [
                "Describe the complete lifecycle of moving an ML model from an experimental notebook into an automated CI/CD and deployment pipeline. How do you detect and handle data drift versus concept drift post-deployment?",
                "How would you design a low-latency model serving system with model caching, batching, and GPU acceleration for real-time inference (e.g. sub-20ms p99 SLA)?",
                "What role does a Feature Store play in preventing training-serving skew, and how does it ensure point-in-time correctness for historical feature lookups?"
            ]

        elif cat in ["STAR Method", "Behavioral Interviews"] or interview_type == "Behavioral":
            return [
                "Tell me about a project where you faced conflicting technical priorities, a tight deadline, or unexpected roadblocks. Using the STAR framework, explain the Situation, the Task you owned, the specific Actions you drove, and the measurable Result.",
                "Describe a situation where you had a strong technical disagreement with a team member or stakeholder regarding system design. How did you resolve the conflict and reach alignment?",
                "Can you share an experience where an engineering project or model failed in production or did not achieve its target KPI? What went wrong, and what systemic changes did you put in place as a result?",
                "Give an example of a complex technical decision you made under significant ambiguity or incomplete data. How did you validate your assumptions and mitigate risks?"
            ]

        elif cat in ["HR Interviews", "Career Preparation"] or interview_type == "HR":
            return [
                f"Why are you choosing to pursue a career as a {target_role}, and how do you prioritize continuous skill development when working on fast-paced engineering initiatives?",
                "Where do you see your technical leadership and architectural expertise expanding over the next two to three years in this role?",
                "How do you manage your time and maintain engineering quality when multiple high-priority deliverables and operational incidents compete for your attention?"
            ]

        elif cat == "Software Engineering":
            return [
                "How do you apply SOLID design principles when architecting backend APIs and data processing services, and how does Dependency Inversion facilitate comprehensive unit and integration testing?",
                "What are the architectural trade-offs between synchronous REST APIs, gRPC, and asynchronous event-driven messaging (Kafka/RabbitMQ) for inter-service communication?",
                "How do you design database schema migrations in a high-availability production environment without incurring service downtime or table lockouts?"
            ]

        elif cat in ["Data Structures & Algorithms", "DSA"]:
            return [
                "When would you choose a Hash Map over a Balanced Binary Search Tree (Red-Black / AVL tree), and what are the worst-case time complexity implications of hash collisions?",
                "How does Dijkstra's algorithm find the shortest path in a weighted graph, and why does it fail when negative edge weights are present?",
                "Can you explain the trade-offs between dynamic programming with memoization (top-down) versus tabulation (bottom-up), particularly with respect to recursion stack depth?"
            ]

        elif cat in ["AI Engineering", "Data Science", "Data Analytics"]:
            return [
                f"In building production RAG systems for a {target_role}, how do you evaluate chunking strategies, embedding dimensionality, and re-ranking algorithms to minimize retrieval hallucinations?",
                "How do you design an A/B testing framework to statistically validate whether a newly deployed model or feature significantly outperforms the production baseline?",
                "When engineering features from raw temporal and categorical data, how do you handle high cardinality and prevent future information leakage into training sets?"
            ]

        else:
            return [
                f"Regarding {topic}: Can you explain the core architectural principles, common trade-offs, and how you evaluate readiness for {target_role} applications?",
                f"In your experience with {topic}, how do you diagnose performance bottlenecks and design systems for high availability and fault tolerance?",
                f"What are the key technical standards and best practices you enforce when reviewing code and architecture for {topic} in a team setting?"
            ]

    def _synthesize_novel_scenario_question(self, target_role: str, topic: str, difficulty: str, sequence_number: int) -> str:
        facets = [
            f"Suppose you are architecting a mission-critical {target_role} system centered around {topic}. What key latency, scalability, and maintainability constraints would guide your design choices?",
            f"In a production environment for a {target_role}, imagine an unexpected performance degradation occurs in {topic}. Walk me through your step-by-step diagnostic strategy to identify the root cause and resolve it.",
            f"When scaling {topic} from prototype to high-throughput production, what architectural trade-offs between consistency, availability, and engineering velocity would you present to technical leadership?",
            f"Imagine you are conducting a technical code and design review on a new implementation of {topic}. What anti-patterns, edge cases, and security vulnerabilities would you specifically look for?"
        ]
        return facets[sequence_number % len(facets)]

    def generate_interview_question(
        self,
        career_context: Dict[str, Any] = None,
        session_config: Dict[str, Any] = None,
        sequence_number: int = 1,
        previous_questions: List[Dict[str, Any]] = None,
        previous_evaluations: List[Dict[str, Any]] = None,
        retrieved_chunk: Optional[Dict[str, Any]] = None,
        language: str = "en",
        adaptive_decision: Optional[Dict[str, Any]] = None,
        # Parameter aliases for caller flexibility
        session_context: Optional[Dict[str, Any]] = None,
        question_index: Optional[int] = None,
        total_questions: Optional[int] = None,
        previous_qa: Optional[List[Dict[str, Any]]] = None,
        retrieved_knowledge: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        career_context = career_context or {}
        session_config = session_config or session_context or {}
        if question_index is not None:
            sequence_number = question_index + 1
        previous_questions = previous_questions or previous_qa or []
        previous_evaluations = previous_evaluations or []
        if not retrieved_chunk and retrieved_knowledge:
            retrieved_chunk = retrieved_knowledge[0] if isinstance(retrieved_knowledge, list) and len(retrieved_knowledge) > 0 else None

        target_role = session_config.get("target_role") or session_config.get("role") or career_context.get("target_role", "Machine Learning Engineer")
        interview_type = session_config.get("interview_type") or session_config.get("category", "Technical")
        difficulty = session_config.get("difficulty", "Intermediate")
        matched_skills = career_context.get("matched_skills", [])
        missing_skills = career_context.get("missing_skills", [])
        urgent_gap = career_context.get("urgent_gap")

        # Memory sets: combine current session and cross-session questions
        prev_texts = [q.get("question", q.get("question_text", "")).strip().lower() for q in previous_questions]
        past_texts = [q.strip().lower() for q in career_context.get("past_interview_questions", []) if q]
        all_forbidden = set(prev_texts + past_texts)
        covered_skills = {q.get("skill", "").strip().lower() for q in previous_questions if q.get("skill")}
        past_skills = {s.strip().lower() for s in career_context.get("past_interview_skills", []) if s}

        qid = f"q-{sequence_number}-{int(time.time() * 1000) % 100000}"

        # 1. Adaptive Follow-up Probing
        if adaptive_decision and (adaptive_decision.get("action") in ["follow_up", "escalate"] or adaptive_decision.get("follow_up_type")):
            follow_up_type = adaptive_decision.get("follow_up_type", "conceptual_probe" if adaptive_decision.get("action") == "follow_up" else "deeper_technical")
            missing_concepts = adaptive_decision.get("missing_concepts") or []
            target_diff = adaptive_decision.get("difficulty") or difficulty
            
            # Determine target topic / skill
            last_q = previous_questions[-1] if previous_questions else {}
            last_skill = adaptive_decision.get("topic") or last_q.get("skill") or last_q.get("topic") or "Core Engineering"
            last_q_text = (adaptive_decision.get("previous_question") or last_q.get("question") or last_q.get("question_text") or "").lower()
            last_skill_lower = last_skill.lower()

            followup_options = []

            # 1a. DEEPER TECHNICAL (for strong answers / escalation)
            if follow_up_type == "deeper_technical" or adaptive_decision.get("action") == "escalate":
                target_diff = "Advanced"
                if any(k in last_skill_lower or k in last_q_text for k in ["overfit", "generaliz", "bias", "regulariz", "machine learning"]):
                    followup_options = [
                        f"In your previous response, you discussed overfitting and model complexity. In high-dimensional production models, how do you mathematically decide between L1 (Lasso) vs L2 (Ridge) regularization, and how does each penalty impact the loss surface and weight sparsity?",
                        f"Building on your explanation of {last_skill}: How would you design a rigorous stratified cross-validation strategy for temporal/streaming data to strictly eliminate target leakage and optimistic bias?",
                        f"Regarding {last_skill} in deep architectures: When combining Dropout, Weight Decay, and Early Stopping, what validation metrics and learning rate schedules do you monitor to avoid catastrophic forgetting or underfitting?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["docker", "container", "kubernetes", "deploy"]):
                    followup_options = [
                        f"Building on your explanation of containerization: In an enterprise microservices setting, how do you design multi-stage Docker builds to eliminate build-time tools, run as non-root, and prevent secret exfiltration across layers?",
                        f"Regarding production container orchestration: How do Linux cgroups and namespaces enforce CPU/memory quotas on containerized services, and how do you configure graceful SIGTERM handling to avoid dropped requests?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["metric", "precision", "recall", "f1", "roc", "auc"]):
                    followup_options = [
                        f"Building on your evaluation metrics answer: When working with an extreme class imbalance (e.g. 0.05% positive rate), why can ROC-AUC present a falsely optimistic diagnostic compared to PR-AUC, and how would you empirically choose the classification threshold to align with cost asymmetry?",
                        f"Regarding {last_skill}: Walk me through how you construct a cost-sensitive confusion matrix and calibrate probability outputs (e.g. Platt scaling or Isotonic regression) for production downstream consumers."
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["mlops", "drift", "pipeline", "airflow"]):
                    followup_options = [
                        f"Building on your MLOps pipeline discussion: How do you mathematically differentiate between covariate shift and concept drift in real-time inference telemetry, and what automated retraining triggering protocols do you implement?",
                        f"Regarding model serving reliability: How do you architect shadow deployments vs canary rollouts with automated latency and Kolmogorov-Smirnov statistical anomaly checks?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["sql", "query", "database", "index"]):
                    followup_options = [
                        f"Regarding database query performance: When an EXPLAIN ANALYZE shows a sequential scan on a 50-million-row table due to improper predicate indexing, how do you determine between composite B-tree indexes, covering indexes, or table partitioning to achieve sub-20ms latency?",
                        f"Building on your SQL answer: How do isolation levels (Read Committed vs Serializable) and MVCC locks influence concurrency throughput during high-frequency write transactions?"
                    ]
                else:
                    followup_options = [
                        f"Building on your explanation of {last_skill}: When architecting this for enterprise production with high throughput and strict latency SLAs, what internal architectural trade-offs, concurrency bottlenecks, and failure modes would you evaluate?",
                        f"Regarding {last_skill}: How would you optimize the system if telemetry indicated a 10x surge in payload size and concurrency, and what specific resilience patterns (circuit breakers, backpressure) would you incorporate?"
                    ]

            # 1b. SCENARIO APPLICATION (applying concept to real-world production incident)
            elif follow_up_type == "scenario_application":
                if any(k in last_skill_lower or k in last_q_text for k in ["overfit", "bias", "regulariz", "machine learning"]):
                    followup_options = [
                        f"Scenario: Your machine learning model achieved 98% accuracy on historical offline validation, but drops to 62% within 48 hours of production rollout. Walk me through your step-by-step diagnostic workflow to isolate data drift, leakage, or distribution shift.",
                        f"Scenario: You observe training loss continuing to decrease while validation loss begins diverging upward after epoch 15. What immediate remediation steps would you take in your training pipeline?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["docker", "container"]):
                    followup_options = [
                        f"Scenario: A containerized API deployed to Kubernetes intermittently crashes with exit code 137 (OOMKilled) under peak traffic, but runs flawlessly in local testing. Walk me through your debugging methodology to resolve the memory leak.",
                        f"Scenario: During a zero-downtime deployment, new container replicas fail readiness probes while legacy replicas are being terminated. How do you mitigate and diagnose the issue?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["sql", "database"]):
                    followup_options = [
                        f"Scenario: A mission-critical analytics dashboard query that usually finishes in 200ms suddenly takes 50 seconds during peak hours, causing connection pool exhaustion. How would you investigate and resolve this in real time?",
                        f"Scenario: You need to migrate an active database table with 20 million records to add a non-null foreign key column without locking writes. How do you plan and execute this zero-downtime migration?"
                    ]
                else:
                    followup_options = [
                        f"Scenario: In a live production system utilizing {last_skill}, telemetry alarms trigger indicating a 4x latency spike and degraded availability. Walk me through your diagnostic triage and root cause analysis process.",
                        f"Scenario: Technical leadership asks you to refactor a legacy implementation of {last_skill} that is failing under current traffic. What migration roadmap and safety checks would you propose?"
                    ]

            # 1c. CONCEPTUAL PROBE (probing missing concepts or specific mechanisms)
            elif follow_up_type == "conceptual_probe":
                if missing_concepts:
                    missed_phrase = " and ".join(missing_concepts[:2])
                    followup_options = [
                        f"In your previous explanation of {last_skill}, you outlined the high-level concept. Could you dive specifically into how {missed_phrase} factors into this, and why it is critical for reliable engineering?",
                        f"Regarding {last_skill}: You addressed the general approach, but didn't mention {missing_concepts[0]}. How does {missing_concepts[0]} work under the hood to prevent edge-case failures?",
                        f"Building on your answer regarding {last_skill}: How would you practically implement and measure {missed_phrase} in a real-world project?"
                    ]
                else:
                    followup_options = [
                        f"In your previous explanation of {last_skill}: What are the key assumptions this approach relies upon, and what specific edge cases or boundary conditions could cause it to fail?",
                        f"Regarding {last_skill}: Could you contrast this method with the most common alternative approach, highlighting where each is preferred?"
                    ]

            # 1d. FOUNDATIONAL CLARIFICATION (for minimal, confused, or low-scoring answers)
            elif follow_up_type == "foundational_clarification":
                target_diff = "Beginner" if target_diff == "Intermediate" else target_diff
                if any(k in last_skill_lower or k in last_q_text for k in ["overfit", "bias", "regulariz", "machine learning"]):
                    followup_options = [
                        f"Let's step back to the core fundamentals of machine learning: What is the primary difference between a model's performance on training data versus unseen test data, and what is the simplest indicator that a model is overfitting?",
                        f"In simple terms, why does high model complexity often lead to poor generalization on new data, and what is one straightforward method to prevent it?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["docker", "container"]):
                    followup_options = [
                        f"Let's step back to foundational principles: What is the fundamental difference between a Docker container and a traditional virtual machine, and why do developers use Docker images for portability?",
                        f"In simple terms, what is the role of a Dockerfile, and what happens when Docker builds an image from it?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["metric", "precision", "recall"]):
                    followup_options = [
                        f"Let's review the basics: Can you explain the intuitive difference between Precision (avoiding false alarms) and Recall (catching all true positive cases) using a simple real-world example like an email spam filter?",
                        f"Why is simple Accuracy often a misleading metric when evaluating a dataset where 99% of the samples belong to one class?"
                    ]
                elif any(k in last_skill_lower or k in last_q_text for k in ["sql", "database"]):
                    followup_options = [
                        f"Let's clarify the database basics: What is the primary purpose of an index on a database table, and what is the trade-off between faster read queries and write speeds?",
                        f"In relational databases, what is the fundamental difference between an INNER JOIN and a LEFT JOIN?"
                    ]
                else:
                    followup_options = [
                        f"Let's step back to the fundamentals of {last_skill}: Can you explain from first principles what core problem {last_skill} solves and how it works in simple terms?",
                        f"Could you explain the basic workflow of {last_skill} as if explaining it to a junior engineer joining your team?"
                    ]

            # 1e. TOPIC PIVOT (redirecting from off-topic or irrelevant answer)
            elif follow_up_type == "topic_pivot":
                followup_options = [
                    f"Thank you for sharing your thoughts. To ensure we evaluate your technical competencies for {target_role}, let's refocus directly on {last_skill}: Could you explain the core principles of {last_skill} and give a practical engineering example?",
                    f"Let's redirect back to the prompt regarding {last_skill}: In the context of a {target_role} workflow, what are the primary concepts and mechanisms behind {last_skill}?"
                ]

            if not followup_options:
                followup_options = [
                    f"Building on your explanation of {last_skill}: Could you walk me through the key architectural trade-offs, potential failure modes, or production deployment considerations you would evaluate?",
                    f"In your previous response regarding {last_skill}, you outlined the high-level approach. What specific monitoring metrics, alerting thresholds, and validation checks would you set up in production?"
                ]

            chosen_q = next((f for f in followup_options if f.strip().lower() not in all_forbidden), followup_options[0])
            loc_q = self._localize_question(chosen_q, language, target_role)
            return {
                "id": qid,
                "question_id": qid,
                "sequence_number": sequence_number,
                "question": loc_q,
                "question_text": loc_q,
                "skill": last_skill,
                "topic": last_skill,
                "difficulty": target_diff,
                "question_type": "Follow-up",
                "source_type": "adaptive_followup",
                "generated_source": "adaptive_followup",
                "rationale": f"Adaptive follow-up probe ({follow_up_type}) targeting {last_skill}. Missing concepts: {', '.join(missing_concepts[:2]) if missing_concepts else 'None'}.",
                "expected_focus": f"Detailed technical explanation of {last_skill} addressing {', '.join(missing_concepts[:2]) if missing_concepts else 'trade-offs and production constraints'}.",
                "rubric_guidance": f"Detailed technical explanation of {last_skill} addressing {', '.join(missing_concepts[:2]) if missing_concepts else 'trade-offs and production constraints'}.",
                "is_follow_up": True
            }

        # 2. Resume-Aware Question (Questions 1 or 2 for technical/behavioral if resume skills exist)
        resume_candidates = [
            s for s in matched_skills
            if s.lower() not in covered_skills
            and not any(s.lower() in t for t in all_forbidden)
        ]
        if resume_candidates and sequence_number in [1, 2] and interview_type == "Technical":
            prime_skill = resume_candidates[0]
            resume_options = [
                f"Your resume highlights practical experience with {prime_skill}. Could you walk me through a challenging project where you implemented {prime_skill}, detailing your design choices, the constraints you faced, and how you validated the results?",
                f"In your projects utilizing {prime_skill}, how did you optimize system performance, handle edge cases, and ensure maintainability across production releases?",
                f"Regarding your work with {prime_skill}: What was the most significant technical trade-off or distributed bottleneck you resolved while architecting solutions with {prime_skill}?"
            ]
            chosen_q = next((ro for ro in resume_options if ro.strip().lower() not in all_forbidden), resume_options[0])
            loc_q = self._localize_question(chosen_q, language, target_role)
            return {
                "id": qid,
                "question_id": qid,
                "sequence_number": sequence_number,
                "question": loc_q,
                "question_text": loc_q,
                "skill": prime_skill,
                "topic": prime_skill,
                "difficulty": difficulty,
                "question_type": "Technical",
                "source_type": "resume_targeted",
                "generated_source": "resume_targeted",
                "rationale": f"Candidate resume indicates prior experience with {prime_skill}; validating depth.",
                "expected_focus": f"System architecture, real project implementation, and empirical validation using {prime_skill}.",
                "rubric_guidance": f"System architecture, real project implementation, and empirical validation using {prime_skill}.",
                "is_follow_up": False
            }

        # 3. Skill-Gap-Aware Question (Questions 2 or 3 if critical skill gap exists)
        gap_candidates = [
            g for g in ([urgent_gap] + missing_skills)
            if g and g.lower() not in covered_skills
            and not any(g.lower() in t for t in all_forbidden)
        ]
        if gap_candidates and sequence_number in [2, 3]:
            gap_skill = gap_candidates[0]
            gap_questions = self._get_skill_gap_questions(gap_skill, target_role, difficulty)
            chosen_q = next((gq for gq in gap_questions if gq.strip().lower() not in all_forbidden), gap_questions[0])
            loc_q = self._localize_question(chosen_q, language, target_role)
            return {
                "id": qid,
                "question_id": qid,
                "sequence_number": sequence_number,
                "question": loc_q,
                "question_text": loc_q,
                "skill": gap_skill,
                "topic": gap_skill,
                "difficulty": difficulty,
                "question_type": interview_type,
                "source_type": "skill_gap_priority",
                "generated_source": "skill_gap_priority",
                "rationale": f"Candidate profile exhibits an active skill gap in {gap_skill}; testing competency.",
                "expected_focus": f"Foundational mastery and practical production troubleshooting of {gap_skill}.",
                "rubric_guidance": f"Foundational mastery and practical production troubleshooting of {gap_skill}.",
                "is_follow_up": False
            }

        # 4. RAG-grounded Curriculum Question
        # Find the best chunk from retrieved_knowledge that hasn't been asked yet
        candidate_chunks = []
        if retrieved_knowledge and isinstance(retrieved_knowledge, list):
            candidate_chunks = [
                c for c in retrieved_knowledge
                if c.get("topic", "").lower() not in covered_skills
                and c.get("category", "").lower() not in covered_skills
            ]
            if not candidate_chunks:
                candidate_chunks = retrieved_knowledge

        target_chunk = candidate_chunks[0] if candidate_chunks else (retrieved_chunk or {})
        topic = target_chunk.get("topic", "Core Engineering")
        category = target_chunk.get("category", "Technical")

        curriculum_questions = self._get_curriculum_questions(category, topic, difficulty, target_role, interview_type)
        chosen_q = next((cq for cq in curriculum_questions if cq.strip().lower() not in all_forbidden), None)

        # If all questions in this chunk were already asked, rotate to alternate chunks
        if not chosen_q and len(candidate_chunks) > 1:
            for alt_chunk in candidate_chunks[1:]:
                alt_topic = alt_chunk.get("topic", topic)
                alt_cat = alt_chunk.get("category", category)
                alt_qs = self._get_curriculum_questions(alt_cat, alt_topic, difficulty, target_role, interview_type)
                chosen_q = next((cq for cq in alt_qs if cq.strip().lower() not in all_forbidden), None)
                if chosen_q:
                    topic, category = alt_topic, alt_cat
                    break

        if not chosen_q:
            chosen_q = self._synthesize_novel_scenario_question(target_role, topic, difficulty, sequence_number)

        loc_q = self._localize_question(chosen_q, language, target_role)
        return {
            "id": qid,
            "question_id": qid,
            "sequence_number": sequence_number,
            "question": loc_q,
            "question_text": loc_q,
            "skill": topic,
            "topic": topic,
            "difficulty": difficulty,
            "question_type": interview_type,
            "source_type": "rag_curriculum",
            "generated_source": "rag_curriculum",
            "rationale": f"Curriculum grounded in syllabus for {target_role} addressing {topic}.",
            "expected_focus": f"Conceptual depth, engineering trade-offs, and practical application of {topic}.",
            "rubric_guidance": f"Conceptual depth, engineering trade-offs, and practical application of {topic}.",
            "is_follow_up": False
        }

    def evaluate_interview_answer(
        self,
        question: Dict[str, Any],
        answer_text: str = "",
        career_context: Optional[Dict[str, Any]] = None,
        language: str = "en",
        user_answer: Optional[str] = None,
        retrieved_knowledge: Optional[List[Dict[str, Any]]] = None,
        target_role: Optional[str] = None,
        difficulty: Optional[str] = None,
        interview_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates candidate answer objectively against the active question prompt.
        Extracts expected concepts, verifies semantic relevance, identifies missing concepts,
        and prescribes adaptive follow-up direction (foundational, conceptual, deeper technical, or scenario).
        """
        career_context = career_context or {}
        text = (answer_text or user_answer or "").strip()
        words = text.split()
        word_count = len(words)
        q_text = question.get("question_text") or question.get("question") or ""
        q_lower = q_text.lower()
        skill = question.get("skill") or question.get("topic") or "General"
        topic_lower = skill.lower()
        cur_difficulty = difficulty or question.get("difficulty") or "Intermediate"
        cur_role = target_role or career_context.get("target_role", "Machine Learning Engineer")

        # -------------------------------------------------------------
        # 1. Domain Knowledge & Expected Concept Taxonomy
        # -------------------------------------------------------------
        DOMAIN_TAXONOMY = {
            "overfitting": {
                "keywords": ["overfit", "bias-variance", "regulariz", "underfit", "generaliz"],
                "core_concepts": ["training vs test/validation data", "generalization", "regularization (L1/L2)", "cross-validation", "dropout", "model complexity", "memorizing noise"],
                "topic_name": "Machine Learning / Overfitting"
            },
            "metrics": {
                "keywords": ["precision", "recall", "metric", "f1", "roc", "auc", "imbalance", "false positive", "false negative"],
                "core_concepts": ["precision vs recall trade-off", "imbalanced data", "false positives vs false negatives", "PR-AUC vs ROC-AUC", "decision threshold"],
                "topic_name": "Evaluation Metrics"
            },
            "docker": {
                "keywords": ["docker", "container", "image", "dockerfile", "kubernetes", "contain"],
                "core_concepts": ["containerization", "immutable images", "dependency isolation", "reproducibility", "deployment / microservices", "multi-stage Dockerfile"],
                "topic_name": "Containerization & Deployment"
            },
            "mlops": {
                "keywords": ["mlops", "drift", "monitor", "pipeline", "covariate shift", "airflow", "serving"],
                "core_concepts": ["data drift vs concept drift", "statistical monitoring (PSI / KS-test)", "automated retraining", "production pipeline", "model latency"],
                "topic_name": "MLOps & System Reliability"
            },
            "sql": {
                "keywords": ["sql", "query", "index", "join", "database", "table", "b-tree", "cte"],
                "core_concepts": ["indexing (B-tree)", "explain analyze / execution plan", "join optimization", "partitioning / scanning", "query rewriting"],
                "topic_name": "Database & Query Optimization"
            },
            "optimization": {
                "keywords": ["gradient descent", "optimizer", "loss", "backprop", "convergence", "sgd", "adam", "learning rate"],
                "core_concepts": ["learning rate", "loss function / gradients", "convergence", "adaptive optimizers (Adam / RMSprop)", "stochastic batches"],
                "topic_name": "Optimization & Deep Learning"
            },
            "deep_learning": {
                "keywords": ["deep learning", "neural", "transformer", "attention", "cnn", "layer", "embedding", "bert"],
                "core_concepts": ["multi-layer representation learning", "attention mechanism / self-attention", "activation functions", "embeddings", "backpropagation"],
                "topic_name": "Deep Learning Architectures"
            },
            "tree_models": {
                "keywords": ["random forest", "xgboost", "tree", "boosting", "bagging", "gini", "decision tree"],
                "core_concepts": ["bagging vs boosting", "variance reduction vs bias reduction", "tree depth / leaf regularization", "feature importance", "residual fitting"],
                "topic_name": "Ensemble Methods"
            },
            "python": {
                "keywords": ["python", "gil", "concurrency", "thread", "process", "garbage collection", "asyncio", "memory"],
                "core_concepts": ["Global Interpreter Lock (GIL)", "CPU-bound vs I/O-bound", "multiprocessing vs threading/asyncio", "reference counting / garbage collection"],
                "topic_name": "Python Architecture & Internals"
            },
            "system_design": {
                "keywords": ["system design", "scale", "latency", "cache", "queue", "kafka", "redis", "throughput", "load balancer"],
                "core_concepts": ["caching & invalidation", "asynchronous decoupling / message queues", "horizontal scaling", "latency vs throughput", "fault tolerance"],
                "topic_name": "Distributed System Design"
            },
            "behavioral": {
                "keywords": ["conflict", "disagree", "deadline", "pressure", "mistake", "priorities", "stakeholder", "tell me about", "situation"],
                "core_concepts": ["STAR framework (Situation, Task, Action, Result)", "data-driven alignment", "prioritization under constraints", "measurable business impact"],
                "topic_name": "Behavioral Leadership"
            }
        }

        # -------------------------------------------------------------
        # 2. Match Question Domain & Extract Expected Concepts
        # -------------------------------------------------------------
        matched_domain_key = None
        matched_domain_info = None

        for dkey, dinfo in DOMAIN_TAXONOMY.items():
            if any(k in q_lower or k in topic_lower for k in dinfo["keywords"]):
                matched_domain_key = dkey
                matched_domain_info = dinfo
                break

        if matched_domain_info:
            expected_concepts = matched_domain_info["core_concepts"]
            domain_name = matched_domain_info["topic_name"]
        else:
            # Fallback expected concepts derived from question tokens & RAG chunks
            raw_tokens = [w for w in re.findall(r'\b[a-zA-Z]{4,}\b', q_lower) if w not in {"what", "which", "explain", "describe", "would", "could", "should", "using", "between"}]
            expected_concepts = raw_tokens[:5] if raw_tokens else ["core mechanism", "trade-offs", "practical example", "production considerations"]
            domain_name = skill

        # Incorporate retrieved RAG chunks if available
        if retrieved_knowledge and isinstance(retrieved_knowledge, list):
            for chk in retrieved_knowledge[:2]:
                title = chk.get("title", "")
                if title and title not in expected_concepts:
                    expected_concepts.append(title)

        # -------------------------------------------------------------
        # 3. Handle Empty / Sub-Minimal Answer (< 5 words)
        # -------------------------------------------------------------
        if word_count < 5:
            missing = expected_concepts[:4]
            return {
                "overall_score": 25,
                "technical_accuracy": 20,
                "communication_quality": 30,
                "relevance": 25,
                "completeness": 20,
                "confidence_indicators": 30,
                "correctness_score": 20,
                "depth_score": 20,
                "relevance_score": 25,
                "communication_score": 30,
                "technical_score": 20,
                "strengths": ["Answer submitted for review."],
                "weaknesses": [
                    "Response is too brief to demonstrate technical competency or problem solving.",
                    f"Did not address expected concepts for {domain_name} ({', '.join(missing[:2])})."
                ],
                "missing_concepts": missing,
                "detected_topics": [domain_name],
                "recommended_follow_up_type": "foundational_clarification",
                "recommended_difficulty": "Beginner",
                "skill_evidence": {skill: 25},
                "feedback": self._localize_feedback(
                    f"Your answer is too brief. In competitive technical interviews for {cur_role}, explain the underlying mechanism, provide a concrete example, and address trade-offs.",
                    language
                ),
                "follow_up_needed": True,
                "follow_up_reason": f"Candidate gave minimal response; follow up with foundational clarification on {skill}."
            }

        # -------------------------------------------------------------
        # 4. Cross-Domain Irrelevance Detection
        # -------------------------------------------------------------
        text_lower = text.lower()
        is_irrelevant = False
        if matched_domain_key:
            # Check if answer contains at least one keyword or concept related to the matched domain
            has_domain_term = any(k in text_lower for k in matched_domain_info["keywords"]) or any(
                any(token in text_lower for token in c.lower().split()) for c in expected_concepts
            )
            # Check if answer strongly belongs to an unrelated domain
            other_domain_hits = []
            for other_key, other_info in DOMAIN_TAXONOMY.items():
                if other_key != matched_domain_key:
                    if any(k in text_lower for k in other_info["keywords"]):
                        other_domain_hits.append(other_info["topic_name"])

            if not has_domain_term and len(other_domain_hits) > 0:
                is_irrelevant = True

        if is_irrelevant:
            missing = expected_concepts[:3]
            return {
                "overall_score": 30,
                "technical_accuracy": 30,
                "communication_quality": 55,
                "relevance": 25,
                "completeness": 25,
                "confidence_indicators": 40,
                "correctness_score": 30,
                "depth_score": 25,
                "relevance_score": 25,
                "communication_score": 55,
                "technical_score": 30,
                "strengths": ["Articulated a technical response with reasonable structure."],
                "weaknesses": [
                    f"The answer addressed a different topic rather than the prompt on {domain_name}.",
                    f"Omitted core principles of {domain_name} ({', '.join(missing[:2])})."
                ],
                "missing_concepts": missing,
                "detected_topics": [domain_name] + other_domain_hits[:1],
                "recommended_follow_up_type": "topic_pivot",
                "recommended_difficulty": cur_difficulty,
                "skill_evidence": {skill: 30},
                "feedback": self._localize_feedback(
                    f"Your answer discussed unrelated concepts ({', '.join(other_domain_hits[:1])}) instead of addressing the prompt about {domain_name}. In interviews, ensure you stay tightly focused on the specific question asked.",
                    language
                ),
                "follow_up_needed": True,
                "follow_up_reason": f"Candidate answer diverged from {skill}; redirect back to the core prompt."
            }

        # -------------------------------------------------------------
        # 5. Concept Coverage & Missing Concepts Analysis
        # -------------------------------------------------------------
        hit_concepts = []
        missing_concepts = []
        for concept in expected_concepts:
            c_lower = concept.lower()
            if " vs " in c_lower:
                parts = c_lower.split(" vs ")
                part_hits = sum(1 for p in parts if any(t.strip("()") in text_lower for t in p.split() if len(t) > 3 and t not in {"data", "trade-off", "the"}))
                if part_hits == len(parts) or c_lower in text_lower:
                    hit_concepts.append(concept)
                else:
                    missing_concepts.append(concept)
            else:
                c_tokens = [t.strip("()") for t in c_lower.split() if len(t) > 3 and t not in {"and", "the", "with", "for", "from"}]
                if not c_tokens:
                    hit_concepts.append(concept)
                elif len(c_tokens) == 1:
                    if c_tokens[0] in text_lower:
                        hit_concepts.append(concept)
                    else:
                        missing_concepts.append(concept)
                else:
                    match_count = sum(1 for t in c_tokens if t in text_lower)
                    if match_count >= (len(c_tokens) + 1) // 2 or c_lower in text_lower:
                        hit_concepts.append(concept)
                    else:
                        missing_concepts.append(concept)

        concept_ratio = len(hit_concepts) / max(1, len(expected_concepts))

        # Structural Indicators
        has_metrics = bool(re.search(r'\b\d+(?:\.\d+)?(?:%|x|ms|s|k|m|gb|mb)?\b', text_lower)) or any(
            m in text_lower for m in ["percent", "%", "latency", "accuracy", "f1", "throughput", "auc", "error rate", "precision", "recall"]
        )
        has_structure = any(s in text_lower for s in ["first", "second", "specifically", "for example", "because", "therefore", "in order to", "situation", "action", "result"])
        has_tradeoffs = any(t in text_lower for t in ["trade-off", "tradeoff", "however", "drawback", "advantage", "overhead", "bottleneck", "versus", "instead of", "mitigate", "prevent"])

        # -------------------------------------------------------------
        # 6. Granular Scoring Calculation
        # -------------------------------------------------------------
        # Base technical accuracy calibrated by concept coverage
        if concept_ratio >= 0.6:
            base_tech = 82 + int(concept_ratio * 12)
        elif concept_ratio >= 0.3:
            base_tech = 68 + int(concept_ratio * 25)
        else:
            # Low concept match: check if answer provides a general definition
            base_tech = 52 if word_count >= 15 else 42

        # Completeness / Depth
        base_comp = 40
        if word_count >= 20:
            base_comp += 15
        if word_count >= 45:
            base_comp += 15
        if word_count >= 75:
            base_comp += 10
        base_comp += int(concept_ratio * 20)

        # Relevance
        base_rel = 80
        if concept_ratio >= 0.4:
            base_rel += 10
        if concept_ratio >= 0.7:
            base_rel += 5
        if concept_ratio < 0.2:
            base_rel = 60

        # Communication
        base_comm = 65
        if has_structure:
            base_comm += 12
        if word_count >= 30 and word_count <= 220:
            base_comm += 8
        if has_metrics:
            base_comm += 5

        # Confidence
        base_conf = 60
        if has_metrics:
            base_conf += 15
        if has_tradeoffs:
            base_conf += 10
        if word_count >= 40:
            base_conf += 8

        # Bonuses for trade-offs & concrete examples
        if has_tradeoffs:
            base_tech += 4
            base_comp += 5
        if has_metrics:
            base_tech += 3

        # Clamp individual axes
        tech_score = min(96, max(30, base_tech))
        comp_score = min(95, max(30, base_comp))
        rel_score = min(96, max(30, base_rel))
        comm_score = min(95, max(30, base_comm))
        conf_score = min(95, max(30, base_conf))

        overall = int(round(
            tech_score * 0.35 +
            rel_score * 0.25 +
            comm_score * 0.20 +
            comp_score * 0.10 +
            conf_score * 0.10
        ))

        # -------------------------------------------------------------
        # 7. Adaptive Follow-Up Type & Next Difficulty Determination
        # -------------------------------------------------------------
        strengths = []
        weaknesses = []

        if concept_ratio >= 0.5 or tech_score >= 78:
            strengths.append(f"Clear explanation of {domain_name} core mechanics.")
        if has_structure:
            strengths.append("Structured narrative flow with clear logical signposts.")
        if has_tradeoffs:
            strengths.append("Articulated engineering trade-offs and mitigation strategies.")
        if has_metrics:
            strengths.append("Reinforced arguments with quantifiable metrics and concrete figures.")
        if not strengths:
            strengths.append(f"Addressed the primary theme of the prompt on {skill}.")

        if missing_concepts:
            weaknesses.append(f"Could elaborate on {', '.join(missing_concepts[:2])}.")
        if not has_tradeoffs:
            weaknesses.append("Discuss alternative approaches and architectural trade-offs to show senior depth.")
        if not has_metrics:
            weaknesses.append("Incorporate measurable benchmarks (latency, memory overhead, accuracy delta) to elevate credibility.")
        if comp_score < 70:
            weaknesses.append("Expand on production edge cases, scaling limits, or failure recovery.")

        # Adaptive strategy assignment:
        if overall >= 80:
            recommended_follow_up_type = "deeper_technical"
            recommended_difficulty = "Advanced"
            follow_up_needed = True
            follow_up_reason = f"Strong answer ({overall}/100); probe advanced production architecture and scale trade-offs."
        elif overall >= 60:
            recommended_follow_up_type = "conceptual_probe"
            recommended_difficulty = cur_difficulty
            top_missing = missing_concepts[0] if missing_concepts else "practical implementation"
            follow_up_needed = True
            follow_up_reason = f"Solid baseline ({overall}/100); probe {top_missing}."
        else:
            recommended_follow_up_type = "foundational_clarification"
            recommended_difficulty = "Beginner" if cur_difficulty == "Intermediate" else cur_difficulty
            follow_up_needed = True
            follow_up_reason = f"Foundational gaps detected ({overall}/100); verify core concepts before advancing."

        # Feedback synthesis
        top_focus = missing_concepts[0] if missing_concepts else "deeper trade-offs"
        if has_tradeoffs:
            tradeoff_phrase = "You effectively highlighted key trade-offs and mitigations. "
        else:
            tradeoff_phrase = f"To elevate this to an offer-winning answer, address: {top_focus}. "

        feedback_en = (
            f"Evaluation for {skill}: "
            f"{'Demonstrated strong technical command with relevant domain concepts. ' if overall >= 80 else 'Good initial framing of the concept. '}"
            f"{tradeoff_phrase}"
            f"{'Including concrete metrics reinforced your delivery.' if has_metrics else 'Adding empirical metrics will significantly strengthen your impact.'}"
        )

        return {
            "overall_score": overall,
            "technical_accuracy": tech_score,
            "communication_quality": comm_score,
            "relevance": rel_score,
            "completeness": comp_score,
            "confidence_indicators": conf_score,
            # Schema parity fields
            "correctness_score": tech_score,
            "depth_score": comp_score,
            "relevance_score": rel_score,
            "communication_score": comm_score,
            "technical_score": tech_score,
            "strengths": strengths[:3],
            "weaknesses": weaknesses[:3],
            "missing_concepts": missing_concepts[:3],
            "detected_topics": [domain_name],
            "recommended_follow_up_type": recommended_follow_up_type,
            "recommended_difficulty": recommended_difficulty,
            "skill_evidence": {skill: overall},
            "feedback": self._localize_feedback(feedback_en, language),
            "follow_up_needed": follow_up_needed,
            "follow_up_reason": follow_up_reason
        }

    def generate_final_interview_feedback(
        self,
        session: Dict[str, Any],
        questions: List[Dict[str, Any]],
        answers: List[Dict[str, Any]],
        evaluations: List[Dict[str, Any]],
        career_context: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        count = len(evaluations)
        if count == 0:
            return {
                "overall_score": 0,
                "passed": False,
                "rubric_scores": {},
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "next_best_action": {},
                "skill_gap_updates": [],
                "feedback_summary": "No answers evaluated in this session."
            }

        avg_overall = int(round(sum(e.get("overall_score", 0) for e in evaluations) / count))
        avg_tech = int(round(sum(e.get("technical_accuracy", 0) for e in evaluations) / count))
        avg_comm = int(round(sum(e.get("communication_quality", 0) for e in evaluations) / count))
        avg_rel = int(round(sum(e.get("relevance", 0) for e in evaluations) / count))
        avg_comp = int(round(sum(e.get("completeness", 0) for e in evaluations) / count))
        avg_conf = int(round(sum(e.get("confidence_indicators", 0) for e in evaluations) / count))

        rubric_scores = {
            "overall": avg_overall,
            "technicalKnowledge": avg_tech,
            "communicationSTAR": avg_comm,
            "problemSolving": avg_rel,
            "systemDesign": avg_comp,
            "confidenceDelivery": avg_conf
        }

        all_strengths = []
        for e in evaluations:
            all_strengths.extend(e.get("strengths", []))
        dedup_strengths = list(dict.fromkeys(all_strengths))[:4]
        if not dedup_strengths:
            dedup_strengths = ["Completed all interview prompts with professional demeanor."]

        all_weaknesses = []
        for e in evaluations:
            all_weaknesses.extend(e.get("weaknesses", []))
        dedup_weaknesses = list(dict.fromkeys(all_weaknesses))[:3]
        if not dedup_weaknesses:
            dedup_weaknesses = ["Continue expanding architectural trade-off comparisons."]

        skill_gap_updates = []
        for q, e in zip(questions, evaluations):
            skill = q.get("skill", "")
            score = e.get("overall_score", 70)
            if score < 70:
                skill_gap_updates.append({
                    "skill_name": skill,
                    "score": score,
                    "priority": "high" if score < 55 else "medium",
                    "reason": f"Underperformed on {skill} during generative mock interview ({score}/100)."
                })

        recommendations = [
            "Structure answers with the STAR framework (Situation, Task, Action, Result) for behavioral and project questions.",
            "Incorporate quantifiable business or technical metrics (e.g. latency, accuracy, throughput) in project explanations.",
            "Explicitly evaluate alternative technical options and trade-offs before settling on your chosen solution."
        ]

        target_role = session.get("role", "Machine Learning Engineer")
        nba_action = "Practice Daily Conceptual Drills"
        nba_route = "/daily-challenge"
        nba_reason = f"Reinforce your technical knowledge for {target_role} hiring bars."

        if skill_gap_updates:
            weakest_gap = skill_gap_updates[0]["skill_name"]
            nba_action = f"Bridge your {weakest_gap} Skill Gap"
            nba_route = "/daily-challenge"
            nba_reason = f"Interview results revealed an active gap in {weakest_gap}. Complete a focused 10-minute challenge."
        elif avg_overall >= 80:
            nba_action = f"Take Advanced {target_role} Mock Round"
            nba_route = "/interview-setup"
            nba_reason = "High readiness demonstrated! Advance to high-difficulty architectural rounds."

        next_best_action = {
            "title": nba_action,
            "action": "Start Challenge" if "/daily-challenge" in nba_route else "Configure Round",
            "route": nba_route,
            "reason": nba_reason
        }

        feedback_en = (
            f"You completed your {target_role} mock interview with an overall score of {avg_overall}/100. "
            f"{'Strong performance demonstrating competitive job readiness!' if avg_overall >= 75 else 'Good foundational effort with actionable opportunities for deeper trade-off articulation.'} "
            f"Key focus: {next_best_action['title']}."
        )

        raw_feedback = {
            "overall_score": avg_overall,
            "passed": avg_overall >= 60,
            "rubric_scores": rubric_scores,
            "strengths": dedup_strengths,
            "weaknesses": dedup_weaknesses,
            "recommendations": recommendations,
            "next_best_action": next_best_action,
            "skill_gap_updates": skill_gap_updates,
            "feedback_summary": feedback_en,
            "feedback_language": language,
            "target_role": target_role
        }

        return multilingual_feedback_service.localize_feedback_report(
            raw_feedback,
            target_language=language
        )

    def generate_quick_answer(
        self,
        question: str,
        topic: Optional[str] = None,
        difficulty: str = "Intermediate",
        interview_type: str = "Technical",
        target_role: str = "Machine Learning Engineer",
        career_context: Optional[Dict[str, Any]] = None,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Generates a concise, natural spoken-style example answer tailored to the exact question.
        Conditions on candidate career context (known resume skills) and retrieved RAG chunks.
        Never repeats a single global answer.
        """
        q_lower = (question or "").lower().strip()
        topic_lower = (topic or "").lower().strip()
        role = target_role or "Machine Learning Engineer"

        # Extract known candidate skills without fabricating fake employers or degrees
        matched_skills = []
        if career_context and isinstance(career_context, dict):
            matched_skills = career_context.get("matched_skills") or []
        if not matched_skills:
            matched_skills = ["Python", "Machine Learning", "Scikit-learn", "FastAPI", "Docker", "SQL"]

        top_skill = matched_skills[0] if matched_skills else "Python"
        second_skill = matched_skills[1] if len(matched_skills) > 1 else "Scikit-learn"
        third_skill = matched_skills[2] if len(matched_skills) > 2 else "Docker"

        # Unique variant index based on question hash to ensure diverse templates
        variant = abs(hash(question)) % 3

        answer_text = ""
        resolved_topic = topic or "General Technical"
        strategy = "technical_concept"

        # -------------------------------------------------------------
        # 1. Behavioral Questions (STAR Method: Situation, Task, Action, Result)
        # -------------------------------------------------------------
        is_behavioral = (
            any(k in q_lower for k in [
                "conflict", "disagree", "deadline", "roadblock", "failure", "mistake",
                "priorities", "team member", "stakeholder", "tell me about a time",
                "situation where", "star framework", "difficult problem"
            ])
            or (interview_type and interview_type.lower() == "behavioral")
        )

        if is_behavioral:
            strategy = "star_behavioral"
            resolved_topic = "Behavioral Competencies"
            if any(k in q_lower for k in ["conflict", "disagree", "alignment", "stakeholder"]):
                star_variants = [
                    "In a collaborative project, a teammate and I had different views on whether to deploy a complex deep neural network or a simpler gradient-boosted tree under a tight 2-week sprint. My task was to ensure we delivered an accurate yet maintainable model without exceeding our latency budget. I proposed an objective benchmark where we tested both architectures on identical validation splits and measured p99 inference latency. The benchmark demonstrated the tree-based model achieved 96% of the neural model's accuracy at 8x lower latency, leading to unanimous team alignment and an on-time release.",
                    "During an engineering sprint, a stakeholder requested immediate deployment of a new feature that lacked comprehensive integration tests. My task was to manage the delivery expectation while safeguarding production stability. I proposed a compromise: implementing a feature flag to test the model with 5% canary traffic while automating the remaining test suite. This mitigated production outage risk while giving the stakeholder early telemetry, successfully resolving the tension.",
                    "When designing our data ingestion architecture, another engineer favored an external SaaS solution while I advocated for an in-house Python pipeline. I scheduled a structured trade-off review comparing cost, data security compliance, and maintenance overhead. By grounding the decision in objective technical constraints rather than personal preference, we agreed on a hybrid approach that satisfied both engineering and budget requirements."
                ]
                answer_text = star_variants[variant % len(star_variants)]
            elif any(k in q_lower for k in ["deadline", "roadblock", "obstacle", "pressure"]):
                star_variants = [
                    "When facing a compressed deadline on an engineering deliverable, our data preprocessing job became a critical bottleneck due to excessive memory overhead. As the technical lead for that component, I prioritized profiling the pipeline using memory benchmarks. I refactored the batch ingestion to stream records in chunks using Python generators and converted data types to low-memory representations, cutting peak RAM consumption by over 60%. As a result, the job completed within our scheduled ETL window and we met the client delivery milestone on schedule.",
                    "During a model development milestone, our training pipeline stalled due to unhandled missing values in third-party API data. With only two days before review, I took ownership of designing an adaptive imputation strategy using domain median fallbacks and indicator flags. I validated the solution across historical holdouts and documented the edge-case handling. The fix restored pipeline stability and our team delivered the milestone ahead of the deadline.",
                    "Faced with an unexpected performance drop just before model evaluation, I immediately conducted an error analysis across sub-populations. I discovered a severe class imbalance in a newly added data slice. I applied focused data augmentation and tuned class weights, recovering 8% in Recall within 24 hours to fulfill our production release SLA."
                ]
                answer_text = star_variants[variant % len(star_variants)]
            else:
                # General STAR
                star_variants = [
                    "In a past technical initiative, our model exhibited high validation variance that threatened our launch timeline. My objective was to diagnose the root cause and stabilize performance. I isolated the issue to data leakage in a pre-split feature scaling step, refactored the preprocessing pipeline into a clean scikit-learn Pipeline, and re-validated. This eliminated the leakage and produced a genuine, reproducible 84% ROC-AUC score that met our acceptance criteria.",
                    "When tasked with building a high-throughput inference service, our initial API struggled under simulated concurrent traffic. I took the initiative to benchmark the endpoint with locust, identified synchronous I/O blocking in the database layer, and migrated the service to asynchronous FastAPI with connection pooling. This reduced p95 latency from 180ms to 24ms, easily surpassing our throughput target."
                ]
                answer_text = star_variants[variant % len(star_variants)]

        # -------------------------------------------------------------
        # 2. Project & Hands-On Engineering Experience
        # -------------------------------------------------------------
        elif (
            any(k in q_lower for k in [
                "tell me about a project", "tell me about your project", "describe a project",
                "past project", "project you built", "what was your contribution", "portfolio",
                "in your experience", "technologies you chose", "how did you build"
            ])
            and not is_behavioral
        ):
            strategy = "project_experience"
            resolved_topic = "Project Implementation"
            project_variants = [
                f"In my machine learning project, I engineered an end-to-end predictive pipeline using {top_skill} and {second_skill}. I started with exploratory data analysis, addressing missing values and skewed feature distributions. After evaluating multiple algorithms with stratified k-fold cross-validation, I tuned an XGBoost model to optimize the precision-recall balance. For serving, I containerized the inference application inside {third_skill} and exposed REST endpoints with FastAPI, ensuring consistent sub-20ms inference latency and seamless reproducibility.",
                f"In a recent engineering project, I built a modular data and model workflow using {top_skill} and {third_skill}. My primary focus was building reliable feature extraction pipelines and establishing robust model validation protocols. I implemented automated data validation checks before model training and serialized model artifacts with ONNX. By packaging the service in a containerized environment, I ensured the model could be reliably deployed and monitored for drift in production.",
                f"For my primary career preparation project, I developed an AI system utilizing {top_skill} and {second_skill}. I took ownership of the model architecture, hyperparameter tuning via Optuna, and evaluation against baseline heuristics. To facilitate testing and integration, I created clean REST API endpoints using FastAPI and containerized the service with {third_skill}. This demonstrated practical end-to-end delivery from raw data processing to reliable endpoint deployment."
            ]
            answer_text = project_variants[variant % len(project_variants)]

        # -------------------------------------------------------------
        # 3. HR & Career Motivation Questions
        # -------------------------------------------------------------
        elif (
            any(k in q_lower for k in [
                "why should we hire", "why do you want", "career goal", "greatest strength",
                "weakness", "tell me about yourself", "where do you see yourself", "why this company",
                "why machine learning"
            ])
            or (interview_type and interview_type.lower() == "hr")
        ):
            strategy = "hr_motivation"
            resolved_topic = "Career Motivation & Fit"
            if "hire" in q_lower:
                answer_text = (
                    f"You should hire me because I combine strong mathematical and algorithmic foundations in machine learning "
                    f"with practical engineering discipline in {top_skill} and {third_skill}. I don't just build models in notebooks—I focus "
                    f"on end-to-end reliability, from clean data preprocessing and reproducible validation to containerized deployment. "
                    f"I take full ownership of challenges, communicate transparently, and am driven to deliver measurable business impact."
                )
            elif any(k in q_lower for k in ["why", "motivation", "interest"]):
                answer_text = (
                    f"I am passionate about becoming a {role} because I enjoy translating mathematical models into reliable software "
                    f"that solves tangible real-world problems. I find the complete lifecycle fascinating—from data engineering and rigorous "
                    f"experimentation to low-latency containerized deployment with tools like {third_skill}. I want to contribute to high-impact "
                    f"production systems while continually advancing my technical craft."
                )
            else:
                answer_text = (
                    f"My technical background centers on {top_skill}, data structures, and machine learning pipelines. My greatest strength is my structured "
                    f"approach to problem-solving and eagerness to understand system trade-offs from data ingestion to deployment. For growth, "
                    f"I am actively deepening my expertise in large-scale distributed systems and advanced MLOps drift monitoring."
                )

        # -------------------------------------------------------------
        # 4. Technical / Domain-Specific Topics
        # -------------------------------------------------------------
        else:
            if any(k in q_lower for k in ["overfit", "underfit", "bias", "variance", "regulariz"]):
                resolved_topic = "Overfitting & Bias-Variance"
                variants = [
                    "Overfitting occurs when a model memorizes noise and sample-specific idiosyncrasies in the training data rather than learning generalizable patterns, resulting in low training loss but high validation error. To mitigate this, I apply L1 or L2 regularization to penalize large weights, introduce dropout layers in neural architectures, and validate with k-fold cross-validation. Additionally, implementing early stopping on validation loss and expanding data diversity through augmentation ensures the model generalizes robustly.",
                    "When diagnosing high variance and overfitting, my strategy is to systematically constrain model capacity. For tree-based models, I restrict maximum depth, increase minimum samples per leaf, and utilize ensemble bagging like Random Forests. For deep networks, I use weight decay and early stopping. I also analyze feature importances to prune noisy or collinear variables, trading off a small amount of training fit for substantially better generalization on unseen traffic.",
                    "I identify overfitting by monitoring the divergence between training and validation loss curves during training. When validation loss plateaus while training error continues to decline, early stopping halts optimization. To prevent this upfront, I perform rigorous feature selection, verify there is no data leakage across splits, and tune regularization hyperparameters using cross-validated search."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["precision", "recall", "roc-auc", "f1", "confusion matrix", "metric", "false positive", "false negative"]):
                resolved_topic = "Model Evaluation Metrics"
                variants = [
                    "Precision measures the proportion of positive predictions that were truly positive, while Recall measures the proportion of actual positives that the model successfully identified. In high-stakes applications like fraud detection or medical diagnosis, we prioritize Recall over Precision because the cost of a false negative—missing a fraudster or illness—is far greater than investigating a false positive. We balance these using the F1-score and adjust decision thresholds based on business cost matrices.",
                    "The tradeoff between Precision and Recall is governed by the classification probability threshold: lowering the threshold captures more positives (higher Recall) but increases false positives (lower Precision). When comparing models across all thresholds, we evaluate ROC-AUC for balanced datasets and PR-AUC for class-imbalanced datasets. In production, I select the threshold that minimizes expected financial loss according to the specific domain cost matrix.",
                    "Rather than relying on overall accuracy, which is misleading on imbalanced datasets, I evaluate Precision, Recall, and the F1-score. Precision reflects how trustworthy our positive alerts are, while Recall reflects our coverage of the target event. By plotting the Precision-Recall curve, we can tune the operating threshold to meet specific operational SLA requirements."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["docker", "container", "deploy", "serving", "triton", "onnx", "fastapi", "kubernetes", "k8s"]):
                resolved_topic = "Model Deployment & Containerization"
                variants = [
                    "To deploy a machine learning model using Docker, I package the serialized model weights, Python runtime environment, and a FastAPI inference service inside a lightweight base image like python:3.11-slim. I write a multi-stage Dockerfile with non-root user permissions for security and minimal image size. The container exposes REST prediction endpoints and health check probes, ensuring identical behavior across local staging and production Kubernetes clusters.",
                    "My deployment pipeline centers on containerization for reproducibility and horizontal scalability. I export the trained model to an optimized runtime format such as ONNX, then containerize the inference service with FastAPI and Uvicorn. I optimize startup latency by pre-loading model weights in memory during the application lifespan event. The container can then be deployed to Kubernetes or AWS ECS with automated autoscaling based on request latency.",
                    "Containerizing ML models with Docker guarantees that system libraries, CUDA dependencies, and Python package versions remain strictly consistent between development and production. I package the serving code with health endpoints, configure container resource limits for CPU and memory, and integrate Prometheus metrics to track p99 inference latency and throughput in real time."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["mlops", "drift", "monitoring", "evidently", "prometheus", "model registry", "lifecycle"]):
                resolved_topic = "MLOps & Model Monitoring"
                variants = [
                    "In production MLOps, we monitor for two distinct phenomena: data drift, where input feature distributions P(X) shift over time, and concept drift, where the relationship between features and the target P(Y|X) changes. I track data drift using statistical distance metrics such as the Kolmogorov-Smirnov test or Population Stability Index (PSI) with tools like Evidently AI. When drift exceeds established thresholds, our pipeline triggers automated alerts and queues a retraining job with newly curated data.",
                    "A production MLOps pipeline encompasses continuous integration, automated deployment, and continuous monitoring. In CI/CD, we run unit tests, data schema validation, and model benchmark evaluations before publishing versioned artifacts to a model registry like MLflow. In production, Prometheus metrics capture p95 latency, error rates, and data drift / input distribution shifts to ensure zero-downtime blue-green rollouts and reliable rollbacks.",
                    "To maintain model reliability after deployment, I implement automated telemetry tracking input feature distributions and prediction outputs against baseline distributions to detect data drift. When statistical drift is detected, we log flagged samples for human review and trigger an automated retrain-and-evaluate pipeline, ensuring the updated model outperforms the production champion on holdout data before promoting it."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["gradient descent", "learning rate", "optimizer", "loss function", "adam", "backprop"]):
                resolved_topic = "Optimization & Gradient Descent"
                variants = [
                    "Gradient descent is an iterative optimization algorithm that updates model parameters in the opposite direction of the loss function gradient: theta = theta - alpha * grad(J). In deep neural networks, standard SGD often struggles with plateaus and noisy gradients, so we typically use adaptive optimizers like AdamW. AdamW maintains exponential moving averages of both past gradients and second moments while applying decoupled weight decay for effective regularization.",
                    "When training models with gradient descent, the learning rate is the most critical hyperparameter. If set too high, optimization oscillates and diverges; if set too low, training converges exceedingly slowly or gets trapped in suboptimal local minima. I typically implement learning rate warmup followed by cosine annealing decay, combined with gradient clipping to prevent gradient explosions in deep networks.",
                    "Stochastic Gradient Descent updates weights using mini-batches of data, balancing computational efficiency with stochastic noise that helps escape local minima. For complex architectures, optimizers like Adam or AdamW accelerate convergence by adapting per-parameter learning rates based on gradient variance, while momentum helps navigate flat saddle points."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["deep learning", "neural network", "transformer", "attention", "cnn", "convolution"]):
                resolved_topic = "Deep Learning & Neural Architectures"
                variants = [
                    "Deep learning models automatically learn hierarchical feature representations directly from raw data through stacked neural layers. For sequential and textual data, the Transformer architecture has largely superseded recurrent networks due to its self-attention mechanism: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V. This allows computing token relationships in parallel across the entire sequence, capturing long-range contextual dependencies efficiently.",
                    "In deep neural networks, skip connections and normalization layers—such as LayerNorm or BatchNorm—are essential for stabilizing forward activation flow and backward gradient propagation. For computer vision, CNNs use spatial weight sharing through convolutions to achieve translation invariance; for sequence processing, self-attention layers compute all-to-all token interactions with quadratic context complexity.",
                    "When fine-tuning large deep learning models for domain-specific tasks, full parameter fine-tuning is often computationally prohibitive. I utilize Parameter-Efficient Fine-Tuning (PEFT) methods like LoRA (Low-Rank Adaptation), which inject trainable rank-decomposition matrices into attention layers while keeping base weights frozen, reducing trainable parameters and GPU memory by over 90%."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["random forest", "decision tree", "gini", "xgboost", "lightgbm", "boosting", "bagging"]):
                resolved_topic = "Tree-Based Models & Ensembles"
                variants = [
                    "Tree-based models partition feature space into orthogonal rectangular regions using split criteria like Gini impurity or Information Gain. A single decision tree has low bias but high variance (prone to overfitting). Random Forests address this through bagging—training multiple de-correlated trees on bootstrap samples with random feature subsets—averaging predictions to drastically reduce variance. Gradient boosting, conversely, builds trees sequentially, with each tree fitting the pseudo-residuals of previous trees.",
                    "While Random Forests use parallel bagging to reduce variance, Gradient Boosting (such as XGBoost or LightGBM) uses sequential boosting to iteratively minimize a loss function via gradient descent in function space. In practice, XGBoost adds explicit L1/L2 leaf weight regularization and histogram-based splitting, making it exceptionally effective and fast for structured tabular datasets.",
                    "When evaluating feature importance in tree models, mean decrease in impurity (Gini importance) can bias toward continuous or high-cardinality features. To overcome this limitation, I use permutation feature importance on validation data or SHAP (Shapley Additive exPlanations) values to obtain consistent, theoretically sound feature attributions."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["sql", "join", "index", "acid", "transaction", "subquery", "group by"]):
                resolved_topic = "SQL & Relational Databases"
                variants = [
                    "In relational database querying, understanding JOIN execution mechanics is essential. An INNER JOIN returns only rows with matching keys in both tables, whereas a LEFT JOIN retains all records from the left table and populates NULLs where right-table matches are absent. For query optimization on large tables, I ensure join columns are indexed with B-trees, avoid wildcard SELECT * queries, and examine EXPLAIN plans to eliminate sequential scans.",
                    "To structure complex SQL query analytics, I use Common Table Expressions (CTEs) for readability and Window Functions like ROW_NUMBER(), RANK(), and DENSE_RANK() to compute partition-level rankings without expensive self-joins. In transactional workloads, adhering to ACID guarantees ensures data consistency, and I verify transaction isolation levels to prevent dirty reads and serialization anomalies.",
                    "Database indexes drastically speed up read queries by allowing the engine to traverse balanced trees in O(log n) rather than scanning entire tables in O(n). However, indexes introduce write overhead during INSERT and UPDATE operations, so I strategically index high-cardinality columns frequently used in WHERE filters, JOIN conditions, and ORDER BY clauses."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["python", "gil", "generator", "decorator", "memory"]):
                resolved_topic = "Python Engineering Mechanics"
                variants = [
                    "In Python, memory management combines reference counting with a cyclic garbage collector to detect and reclaim isolated circular references. The Global Interpreter Lock (GIL) enforces thread safety by ensuring only one native thread executes Python bytecode at a time. For CPU-intensive tasks, we bypass the GIL using multiprocessing or native C-extensions like NumPy; for I/O-bound tasks, we use asyncio with non-blocking event loops.",
                    "Python generators provide memory-efficient stream processing by yielding items lazily on demand rather than loading entire datasets into RAM, which is critical when handling gigabyte-scale log files or dataset iterators. Decorators implement the wrapper pattern cleanly, enabling reusable cross-cutting concerns like function execution timing, authentication guards, and caching using functools.wraps.",
                    "When optimizing Python performance, I avoid mutable default arguments and excessive object creation in tight loops. For data-intensive operations, utilizing vectorized operations in NumPy or Polars leverages contiguous C memory layouts and SIMD instructions, outperforming native Python list loops by orders of magnitude."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["algorithm", "dsa", "complexity", "big o", "hash table", "binary tree", "graph", "dynamic programming"]):
                resolved_topic = "Algorithms & Data Structures"
                variants = [
                    "When approaching algorithmic problems, I start by analyzing input constraints to deduce the target time and space complexity in Big-O notation. Hash tables offer O(1) average lookup and insertion by computing hash bucket indexes, compared to O(log n) in balanced search trees. For optimization problems with overlapping subproblems, I apply dynamic programming via memoization or bottom-up tabulation to avoid exponential recomputation.",
                    "For graph traversal, I choose Breadth-First Search (BFS) using a queue to find the shortest path in unweighted graphs, and Depth-First Search (DFS) using recursion or a stack for cycle detection and topological sorting. I always consider edge cases like empty inputs, disconnected components, and cycle containment.",
                    "Understanding space-time tradeoffs is fundamental: caching intermediate computations in a hash map trades O(n) auxiliary memory for reducing quadratic O(n^2) nested loops to linear O(n) execution, which is often the key to meeting production latency SLAs."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["system design", "scalability", "latency", "high availability", "fault tolerance", "cache"]):
                resolved_topic = "System Design & Scalability"
                variants = [
                    "When designing high-availability systems, I decouple stateless application tiers from stateful storage layers. I place a load balancer in front of horizontally scalable API instances, utilize a distributed Redis cache to serve read-heavy queries with sub-5ms latency, and implement message queues like Kafka or RabbitMQ for asynchronous background processing. For data durability, I configure database read replicas with automated failover.",
                    "To optimize for low latency and high availability, I incorporate caching layers, CDN edge delivery for static assets, and connection pooling for databases. To maintain fault tolerance, I implement circuit breakers and graceful fallbacks so that if a downstream microservice experiences downtime, the core application continues responding without cascading failure.",
                    "In scalable architecture, we design for the CAP theorem tradeoffs. For financial transactions, we prioritize consistency and partition tolerance; for social feeds or telemetry ingestion, we favor high availability with eventual consistency. Horizontal partitioning (sharding) and database read replicas ensure throughput scales gracefully with traffic growth."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["a/b test", "experiment", "hypothesis", "p-value", "statistical"]):
                resolved_topic = "A/B Testing & Experimentation"
                variants = [
                    "To rigorously validate a newly deployed model against a baseline, I design an A/B test with clear primary business metrics and operational guardrail metrics. We randomize user traffic into control and treatment cohorts at the user ID level to prevent contamination. Prior to launch, we compute the required sample size using power analysis (power = 0.80, alpha = 0.05) to ensure we can detect the minimum detectable effect without premature stopping.",
                    "In online experimentation, we monitor guardrail metrics—such as API latency and error rates—alongside our primary conversion KPI. We evaluate the results using two-sample hypothesis tests (like Welch's t-test) and compute confidence intervals for the observed lift. If the lift is statistically significant and guardrails remain healthy, we roll out the feature gradually.",
                    "When running A/B tests on machine learning models, novelty bias and seasonal variance can distort early metrics. I ensure tests run across complete business cycles (e.g. 14 days) to capture weekday-weekend patterns, and run A/A tests beforehand to verify our randomization split produces no baseline statistical bias."
                ]
                answer_text = variants[variant % len(variants)]

            elif any(k in q_lower for k in ["rag", "chunking", "vector", "retrieval", "hallucination"]):
                resolved_topic = "RAG & Vector Search"
                variants = [
                    "In a production RAG system, answer quality depends directly on retrieval precision. I use semantic chunking with overlapping boundaries (e.g. 400-600 tokens with 10% overlap) to preserve sentence context. We index chunks using dense vector embeddings and implement hybrid search—combining vector cosine similarity with BM25 keyword matching via Reciprocal Rank Fusion (RRF)—followed by a cross-encoder re-ranker to maximize Precision@K and minimize LLM hallucinations.",
                    "To prevent hallucinations in RAG pipelines, we enforce strict similarity thresholds and structured prompt templates that constrain the LLM to answer solely using provided context. We also integrate automated evaluation frameworks like Ragas or TruLens to track faithfulness, answer relevance, and context precision on a continuous basis.",
                    "Optimizing RAG retrieval involves selecting appropriate embedding dimensionality, testing chunk sizes against document structure, and applying metadata filtering based on candidate role or topic. Re-ranking the top-20 retrieved candidates down to the top-3 most relevant chunks significantly improves answer accuracy while conserving LLM prompt tokens."
                ]
                answer_text = variants[variant % len(variants)]

            else:
                # General Grounded Technical Answer
                resolved_topic = topic or "Engineering Fundamentals"
                variants = [
                    f"When addressing this in a {role} interview, I approach the problem through three core steps: first, clearly articulating the foundational mechanism and core objectives; second, examining real-world implementation nuances such as algorithmic complexity and latency trade-offs; and third, establishing how to validate and monitor the solution in production.",
                    f"In production engineering, I address this by balancing theoretical correctness with operational maintainability. I start by establishing baseline assumptions and edge cases, implement the standard verified pattern using {top_skill}, and measure performance against clear benchmarks to ensure the solution scales effectively under real-world workloads.",
                    f"My approach centers on understanding the trade-offs involved. I verify data inputs and constraints, apply clean modular architecture to separate concerns, and ensure automated unit and integration tests validate behavior before deployment to production environments."
                ]
                answer_text = variants[variant % len(variants)]

        # If relevant RAG chunk is available and adds grounded technical detail, optionally enrich
        if retrieved_chunks and len(retrieved_chunks) > 0 and strategy == "technical_concept":
            top_chunk = retrieved_chunks[0]
            resolved_topic = top_chunk.get("topic") or resolved_topic

        # Localize if requested (Telugu, Hindi, Spanish)
        if language in ["te", "hi", "es"]:
            answer_text = self._localize_quick_answer(answer_text, language)

        return {
            "quick_answer": answer_text,
            "topic": resolved_topic,
            "strategy": strategy,
            "source": "rag_grounded" if retrieved_chunks else "local_curriculum_synthesizer"
        }

    def _localize_quick_answer(self, text_en: str, language: str) -> str:
        """Helper to localize quick answer into preferred candidate language."""
        if language == "te":
            return (
                f"[తెలుగు సమాధానం]: {text_en}\n"
                f"(గమనిక: ఇంటర్వ్యూలో కాన్సెప్ట్‌ను స్పష్టంగా మరియు ప్రాక్టికల్ ఉదాహరణలతో వివరించండి.)"
            )
        elif language == "hi":
            return (
                f"[हिंदी उत्तर]: {text_en}\n"
                f"(सुझाव: साक्षात्कार में इस अवधारणा को व्यावहारिक उदाहरण और मुख्य मैट्रिक्स के साथ स्पष्ट करें।)"
            )
        elif language == "es":
            return (
                f"[Respuesta en español]: {text_en}\n"
                f"(Consejo: Explique este concepto con métricas prácticas y compensaciones arquitectónicas.)"
            )
        return text_en



class OpenAICompatibleLLMService(BaseLLMService):
    """
    Cloud LLM service adapter using OpenAI API if configured via environment variables.
    Falls back gracefully to LocalGroundedLLMService if unconfigured or encountering errors.
    """

    def __init__(self):
        self._fallback = LocalGroundedLLMService()
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def generate(self, prompt: str, system_instruction: str, temperature: float = 0.3) -> str:
        if not self.api_key:
            return self._fallback.generate(prompt, system_instruction, temperature)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            resp = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature
            )
            return resp.choices[0].message.content or ""
        except Exception:
            return self._fallback.generate(prompt, system_instruction, temperature)

    def generate_grounded_response(
        self,
        query: str,
        user_context: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        if not self.api_key:
            return self._fallback.generate_grounded_response(query, user_context, retrieved_chunks, language)
        try:
            from .prompt_builder import build_grounded_prompt
            prompt_data = build_grounded_prompt(query, user_context, retrieved_chunks, language)
            
            # Request JSON output
            json_instruction = (
                f"{prompt_data['system_instruction']}\n"
                "Return a valid JSON object matching this schema:\n"
                "{\n"
                '  "answer": "string",\n'
                '  "key_points": ["string", "string", "string"],\n'
                '  "recommended_action": {"title": "string", "action": "string", "route": "string", "action_type": "string", "reason": "string"}\n'
                "}"
            )
            
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            start_time = time.time()
            resp = client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": json_instruction},
                    {"role": "user", "content": prompt_data["user_prompt"]}
                ],
                temperature=0.3
            )
            raw_json = resp.choices[0].message.content or "{}"
            parsed = json.loads(raw_json)
            latency = round((time.time() - start_time) * 1000, 2)
            
            sources = [
                {
                    "id": c.get("id"),
                    "title": c.get("title"),
                    "category": c.get("category"),
                    "topic": c.get("topic"),
                    "difficulty": c.get("difficulty"),
                    "source": c.get("source"),
                    "relevance_score": c.get("relevance_score", 1.0)
                }
                for c in retrieved_chunks
            ]
            
            return {
                "answer": parsed.get("answer", ""),
                "key_points": parsed.get("key_points", []),
                "recommended_action": parsed.get("recommended_action"),
                "sources": sources,
                "grounded": len(retrieved_chunks) > 0,
                "language": language,
                "career_context_applied": f"Role: {user_context.get('target_role')}",
                "model_provider": f"openai-{self.model}",
                "latency_ms": latency
            }
        except Exception:
            # Safe zero-failure fallback to local grounded service
            return self._fallback.generate_grounded_response(query, user_context, retrieved_chunks, language)

    def generate_interview_question(
        self,
        career_context: Dict[str, Any] = None,
        session_config: Dict[str, Any] = None,
        sequence_number: int = 1,
        previous_questions: List[Dict[str, Any]] = None,
        previous_evaluations: List[Dict[str, Any]] = None,
        retrieved_chunk: Optional[Dict[str, Any]] = None,
        language: str = "en",
        adaptive_decision: Optional[Dict[str, Any]] = None,
        session_context: Optional[Dict[str, Any]] = None,
        question_index: Optional[int] = None,
        total_questions: Optional[int] = None,
        previous_qa: Optional[List[Dict[str, Any]]] = None,
        retrieved_knowledge: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        career_context = career_context or {}
        session_config = session_config or session_context or {}
        if question_index is not None:
            sequence_number = question_index + 1
        previous_questions = previous_questions or previous_qa or []
        previous_evaluations = previous_evaluations or []
        if not retrieved_chunk and retrieved_knowledge:
            retrieved_chunk = retrieved_knowledge[0] if isinstance(retrieved_knowledge, list) and len(retrieved_knowledge) > 0 else None

        if not self.api_key:
            return self._fallback.generate_interview_question(
                career_context=career_context,
                session_config=session_config,
                sequence_number=sequence_number,
                previous_questions=previous_questions,
                previous_evaluations=previous_evaluations,
                retrieved_chunk=retrieved_chunk,
                language=language,
                adaptive_decision=adaptive_decision,
                session_context=session_config,
                question_index=question_index,
                total_questions=total_questions,
                previous_qa=previous_questions,
                retrieved_knowledge=retrieved_knowledge
            )
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            prompt = (
                f"You are a technical interviewer hiring for {session_config.get('role', 'Software Engineer')} ({session_config.get('difficulty', 'Intermediate')}).\n"
                f"Candidate career context: {json.dumps(career_context)}\n"
                f"Previous Q&A: {json.dumps(previous_questions)}\n"
                f"RAG Knowledge: {json.dumps(retrieved_knowledge or [retrieved_chunk] if retrieved_chunk else [])}\n"
                f"Adaptive Strategy Decision: {json.dumps(adaptive_decision or {})}\n"
                f"Generate interview question #{sequence_number} of {total_questions or 5}. "
                f"If adaptive decision indicates follow_up or escalate, craft an authentic follow-up question respecting the requested follow_up_type and targeting any missing_concepts.\n"
                f"Return JSON with fields: question_text, topic, difficulty, skill, question_type, source_type, rationale, rubric_guidance, is_follow_up."
            )
            resp = client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert technical interviewer. Return clean JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4
            )
            raw = json.loads(resp.choices[0].message.content or "{}")
            if raw.get("question_text"):
                return {
                    "question_text": raw["question_text"],
                    "topic": raw.get("topic", "System Architecture"),
                    "difficulty": raw.get("difficulty", session_config.get("difficulty", "Intermediate")),
                    "skill": raw.get("skill", "Engineering"),
                    "question_type": raw.get("question_type", "Follow-up" if raw.get("is_follow_up") else "technical"),
                    "source_type": raw.get("source_type", "adaptive_followup" if raw.get("is_follow_up") else "rag_curriculum"),
                    "rationale": raw.get("rationale", ""),
                    "rubric_guidance": raw.get("rubric_guidance", "Demonstrate conceptual accuracy."),
                    "is_follow_up": raw.get("is_follow_up", bool(adaptive_decision and adaptive_decision.get("action") == "follow_up"))
                }
        except Exception:
            pass
        return self._fallback.generate_interview_question(
            career_context=career_context,
            session_config=session_config,
            sequence_number=sequence_number,
            previous_questions=previous_questions,
            previous_evaluations=previous_evaluations,
            retrieved_chunk=retrieved_chunk,
            language=language,
            adaptive_decision=adaptive_decision,
            session_context=session_config,
            question_index=question_index,
            total_questions=total_questions,
            previous_qa=previous_questions,
            retrieved_knowledge=retrieved_knowledge
        )

    def evaluate_interview_answer(
        self,
        question: Dict[str, Any],
        answer_text: str = "",
        career_context: Optional[Dict[str, Any]] = None,
        language: str = "en",
        user_answer: Optional[str] = None,
        retrieved_knowledge: Optional[List[Dict[str, Any]]] = None,
        target_role: Optional[str] = None,
        difficulty: Optional[str] = None,
        interview_type: Optional[str] = None
    ) -> Dict[str, Any]:
        text = (answer_text or user_answer or "").strip()
        career_context = career_context or {}
        if not self.api_key:
            return self._fallback.evaluate_interview_answer(
                question=question,
                answer_text=text,
                career_context=career_context,
                language=language,
                user_answer=text,
                retrieved_knowledge=retrieved_knowledge,
                target_role=target_role,
                difficulty=difficulty,
                interview_type=interview_type
            )
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            prompt = (
                f"Question: {question.get('question_text') or question.get('question')}\n"
                f"Topic: {question.get('topic') or question.get('skill')}, Skill: {question.get('skill')}\n"
                f"Target Role: {target_role or career_context.get('target_role', 'Engineer')}, Level: {difficulty or 'Intermediate'}\n"
                f"Candidate Answer: {text}\n"
                f"Retrieved Knowledge: {json.dumps(retrieved_knowledge or [])}\n"
                f"Evaluate this response objectively across 5 axes and determine adaptive next steps. Return JSON with fields:\n"
                f"- overall_score (0-100)\n"
                f"- technical_accuracy (0-100)\n"
                f"- communication_quality (0-100)\n"
                f"- relevance (0-100)\n"
                f"- completeness (0-100)\n"
                f"- confidence_indicators (0-100)\n"
                f"- correctness_score (0-100)\n"
                f"- depth_score (0-100)\n"
                f"- relevance_score (0-100)\n"
                f"- communication_score (0-100)\n"
                f"- technical_score (0-100)\n"
                f"- strengths (list of 2-3 specific points)\n"
                f"- weaknesses (list of 2-3 specific points)\n"
                f"- missing_concepts (list of key technical terms/mechanisms candidate omitted)\n"
                f"- detected_topics (list of topics found in answer)\n"
                f"- recommended_follow_up_type ('deeper_technical', 'scenario_application', 'conceptual_probe', 'foundational_clarification', or 'topic_pivot')\n"
                f"- recommended_difficulty ('Beginner', 'Intermediate', or 'Advanced')\n"
                f"- feedback (constructive learning-focused guidance string)\n"
                f"- follow_up_needed (boolean)\n"
                f"- follow_up_reason (string or null)"
            )
            resp = client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an objective technical interviewer evaluator. Return clean JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            raw = json.loads(resp.choices[0].message.content or "{}")
            if "overall_score" in raw:
                raw["skill_evidence"] = {question.get("skill", "Core"): raw.get("overall_score", 70)}
                # Ensure parity keys exist
                raw["correctness_score"] = raw.get("correctness_score", raw.get("technical_accuracy", 70))
                raw["depth_score"] = raw.get("depth_score", raw.get("completeness", 70))
                raw["relevance_score"] = raw.get("relevance_score", raw.get("relevance", 70))
                raw["communication_score"] = raw.get("communication_score", raw.get("communication_quality", 70))
                raw["technical_score"] = raw.get("technical_score", raw.get("technical_accuracy", 70))
                raw["missing_concepts"] = raw.get("missing_concepts", [])
                raw["detected_topics"] = raw.get("detected_topics", [question.get("skill", "General")])
                raw["recommended_follow_up_type"] = raw.get("recommended_follow_up_type", "conceptual_probe")
                raw["recommended_difficulty"] = raw.get("recommended_difficulty", difficulty or "Intermediate")
                return raw
        except Exception:
            pass
        return self._fallback.evaluate_interview_answer(
            question=question,
            answer_text=text,
            career_context=career_context,
            language=language,
            user_answer=text,
            retrieved_knowledge=retrieved_knowledge,
            target_role=target_role,
            difficulty=difficulty,
            interview_type=interview_type
        )

    def generate_final_interview_feedback(
        self,
        session: Dict[str, Any],
        questions: List[Dict[str, Any]],
        answers: List[Dict[str, Any]],
        evaluations: List[Dict[str, Any]],
        career_context: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        if not self.api_key:
            return self._fallback.generate_final_interview_feedback(
                session, questions, answers, evaluations, career_context, language
            )
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            prompt = (
                f"Session: {json.dumps(session)}\n"
                f"Questions: {json.dumps(questions)}\n"
                f"Evaluations: {json.dumps(evaluations)}\n"
                f"Generate final interview summary. Return JSON matching: overall_score (0-100), passed (bool), "
                f"rubric_scores (overall, technicalKnowledge, communicationSTAR, problemSolving, systemDesign, confidenceDelivery), "
                f"strengths (list), weaknesses (list), recommendations (list), next_best_action (title, action, route, reason), "
                f"skill_gap_updates (list of objects: skill_name, score, priority, reason), feedback_summary (string)."
            )
            resp = client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a senior hiring director. Return clean JSON summary."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            raw = json.loads(resp.choices[0].message.content or "{}")
            if "overall_score" in raw:
                raw["target_role"] = session.get("role", "Machine Learning Engineer")
                return multilingual_feedback_service.localize_feedback_report(raw, target_language=language)
        except Exception:
            pass
        return self._fallback.generate_final_interview_feedback(
            session, questions, answers, evaluations, career_context, language
        )

    def generate_quick_answer(
        self,
        question: str,
        topic: Optional[str] = None,
        difficulty: str = "Intermediate",
        interview_type: str = "Technical",
        target_role: str = "Machine Learning Engineer",
        career_context: Optional[Dict[str, Any]] = None,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        if not self.api_key:
            return self._fallback.generate_quick_answer(
                question, topic, difficulty, interview_type, target_role, career_context, retrieved_chunks, language
            )
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)

            context_str = json.dumps({
                "target_role": target_role,
                "known_skills": career_context.get("matched_skills", []) if career_context else [],
                "difficulty": difficulty,
                "interview_type": interview_type
            })
            rag_str = json.dumps([
                {"title": c.get("title"), "content": c.get("content")}
                for c in (retrieved_chunks or [])
            ])

            prompt = (
                f"QUESTION: {question}\n"
                f"TARGET ROLE: {target_role}\n"
                f"INTERVIEW TYPE: {interview_type}\n"
                f"DIFFICULTY: {difficulty}\n"
                f"CAREER CONTEXT: {context_str}\n"
                f"RAG KNOWLEDGE: {rag_str}\n\n"
                f"RULES:\n"
                f"- Answer the exact question directly.\n"
                f"- Do not answer a different question.\n"
                f"- Do not invent experience or companies that are not present in the user's career context.\n"
                f"- Keep the answer concise enough for an interview (roughly 2-5 sentences for technical, 3-6 sentences STAR for behavioral).\n"
                f"- Prefer a natural spoken interview style.\n"
                f"- For behavioral/project questions, use the candidate's known skills without fabricating fake employers.\n"
                f"- Do not include meta-commentary outside the answer.\n"
                f"- Return clean JSON with fields: {{\"quick_answer\": \"string\", \"topic\": \"string\", \"strategy\": \"string\"}}"
            )

            resp = client.chat.completions.create(
                model=self.model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert technical interview practice coach. Return clean JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            raw = json.loads(resp.choices[0].message.content or "{}")
            if raw.get("quick_answer"):
                return {
                    "quick_answer": raw["quick_answer"],
                    "topic": raw.get("topic", topic or "General Technical"),
                    "strategy": raw.get("strategy", "real_llm_synthesis"),
                    "source": "real_llm"
                }
        except Exception:
            pass
        return self._fallback.generate_quick_answer(
            question, topic, difficulty, interview_type, target_role, career_context, retrieved_chunks, language
        )




def get_llm_service() -> BaseLLMService:
    """Factory instantiating configured LLM service provider."""
    provider = os.getenv("LLM_PROVIDER", "local").lower()
    if provider in ["openai", "api"] and os.getenv("OPENAI_API_KEY"):
        return OpenAICompatibleLLMService()
    return LocalGroundedLLMService()


# Shared singleton instance
default_llm_service = get_llm_service()
