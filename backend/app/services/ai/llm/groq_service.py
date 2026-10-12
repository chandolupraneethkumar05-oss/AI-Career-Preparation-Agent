"""
Groq Real High-Speed LLM Service Implementation
AI Career Preparation Agent

Provides direct, ultra-low latency integration with Groq Cloud LPUs
(e.g. openai/gpt-oss-120b, qwen/qwen3.8-27b, llama-3.3-70b-versatile).
Optimized specifically for real-time interview question generation and dynamic adaptive follow-up probes.
Includes dual-key automatic failover for high availability.
"""

import os
import json
import time
import random
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

from .multilingual_feedback_service import multilingual_feedback_service
from ..languages import normalize_feedback_language, is_supported_feedback_language


class GroqLLMService:
    """
    Production-grade Groq AI client for real-time interactive interview question generation.
    Connects to Groq's OpenAI-compatible completions endpoint with sub-second token generation.
    Supports dual-key redundancy (primary + fallback key).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        fallback_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.fallback_key = fallback_key or os.getenv("GROQ_API_KEY_FALLBACK")
        self.model = model or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self._fallback_instance = None

    @property
    def _fallback(self):
        if self._fallback_instance is None:
            from .llm_service import LocalGroundedLLMService
            self._fallback_instance = LocalGroundedLLMService()
        return self._fallback_instance

    def _call_groq_with_key(
        self,
        key: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3,
        json_mode: bool = False
    ) -> Optional[str]:
        """Executes a single HTTP request to Groq Cloud endpoint."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "CareerPrep/1.0"
        }

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status == 200:
                resp_json = json.loads(response.read().decode("utf-8"))
                choices = resp_json.get("choices", [])
                if choices and "message" in choices[0]:
                    return choices[0]["message"].get("content")
        return None

    def _call_groq(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3,
        json_mode: bool = False
    ) -> Optional[str]:
        """Calls Groq with automatic failover across primary and secondary keys."""
        keys_to_try = [k for k in [self.api_key, self.fallback_key] if k]
        if not keys_to_try:
            return None

        for idx, key in enumerate(keys_to_try):
            try:
                res = self._call_groq_with_key(key, prompt, system_instruction, temperature, json_mode)
                if res:
                    return res
            except Exception as exc:
                if os.getenv("DEBUG_GROQ"):
                    print(f"[GroqLLMService] Key {idx + 1} call failed: {exc}")
                continue
        return None

    def _clean_json_text(self, text: str) -> str:
        """Strips markdown code fences around JSON if present."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()

    def generate(self, prompt: str, system_instruction: str, temperature: float = 0.3) -> str:
        """Simple text generation."""
        res = self._call_groq(prompt, system_instruction, temperature, json_mode=False)
        if res:
            return res.strip()
        return self._fallback.generate(prompt, system_instruction, temperature)

    def generate_grounded_response(
        self,
        query: str,
        user_context: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        """Interactive AI Career Assistant grounded response via Groq."""
        if not self.api_key and not self.fallback_key:
            return self._fallback.generate_grounded_response(query, user_context, retrieved_chunks, language)

        start_time = time.time()
        target_role = user_context.get("target_role", "Machine Learning Engineer")
        cand_name = user_context.get("candidate_name", "Candidate")
        urgent_gap = user_context.get("urgent_gap")

        context_summary = {
            "target_role": target_role,
            "candidate_name": cand_name,
            "priority_gap": urgent_gap,
            "known_skills": user_context.get("matched_skills", [])
        }

        knowledge_snippets = [
            {"title": c.get("title"), "topic": c.get("topic"), "content": c.get("content")}
            for c in retrieved_chunks[:3]
        ]

        system_prompt = (
            "You are an elite AI Career Preparation & Interview Coach. "
            f"The candidate is preparing for {target_role} roles. "
            "Provide insightful, highly actionable, and technically rigorous explanations. "
            "Return clean JSON matching the specified structure without markdown wrapping."
        )

        user_prompt = f"""
Query: {query}
Candidate Career Context: {json.dumps(context_summary)}
Verified Curriculum Context: {json.dumps(knowledge_snippets)}
Requested Language Code: {language} (en=English, te=Telugu, hi=Hindi, es=Spanish)

Return valid JSON with exactly these fields:
{{
  "answer": "Detailed technical and pedagogical response addressing the query directly in the requested language",
  "key_points": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
  "recommended_action": {{
    "title": "Short title of next practice step",
    "action": "Button text",
    "route": "/daily-challenge",
    "action_type": "practice",
    "reason": "Why this action accelerates readiness"
  }}
}}
"""
        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.3, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if parsed.get("answer"):
                    latency = round((time.time() - start_time) * 1000, 2)
                    return {
                        "answer": parsed["answer"],
                        "key_points": parsed.get("key_points", [f"Focus on {target_role} fundamentals"]),
                        "recommended_action": parsed.get("recommended_action", {
                            "title": f"Practice {target_role} Drill",
                            "action": "Open Challenge",
                            "route": "/daily-challenge",
                            "action_type": "practice",
                            "reason": "Reinforce technical understanding."
                        }),
                        "sources": [
                            {"title": c.get("title"), "category": c.get("category"), "difficulty": c.get("difficulty")}
                            for c in retrieved_chunks
                        ],
                        "grounded": bool(retrieved_chunks),
                        "language": language,
                        "career_context_applied": f"Role: {target_role}" + (f" • Gap: {urgent_gap}" if urgent_gap else ""),
                        "model_provider": f"groq ({self.model})",
                        "latency_ms": latency
                    }
            except Exception:
                pass

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
        **kwargs
    ) -> Dict[str, Any]:
        """
        Dynamically synthesizes authentic, high-signal interview questions using Groq LPU.
        Sub-second response time powers fluid interactive interview turn-taking.
        """
        if not self.api_key and not self.fallback_key:
            return self._fallback.generate_interview_question(
                career_context, session_config, sequence_number,
                previous_questions, previous_evaluations, retrieved_chunk,
                language, adaptive_decision, **kwargs
            )

        career_context = career_context or {}
        session_config = session_config or kwargs.get("session_context") or {}
        if kwargs.get("question_index") is not None:
            sequence_number = kwargs["question_index"] + 1
        previous_questions = previous_questions or kwargs.get("previous_qa") or []
        previous_evaluations = previous_evaluations or []

        target_role = (
            session_config.get("target_role")
            or session_config.get("role")
            or career_context.get("target_role")
            or "Machine Learning Engineer"
        )
        difficulty = session_config.get("difficulty") or "Intermediate"
        interview_type = session_config.get("interview_type") or session_config.get("category") or "Technical"
        company_playbook = session_config.get("company_playbook") or "general"

        prev_q_texts = [q.get("question") or q.get("question_text", "") for q in previous_questions]
        past_q_texts = career_context.get("past_interview_questions", [])
        all_forbidden = list(set([t for t in (prev_q_texts + past_q_texts) if t]))
        last_eval = previous_evaluations[-1] if previous_evaluations else None

        subdomain_seeds = [
            "distributed architecture, scalability tradeoffs, and high availability",
            "production failure modes, edge-case recovery, and latency optimization",
            "end-to-end data pipelines, streaming reliability, and consistency models",
            "modern deep learning paradigms, loss surface dynamics, and quantization",
            "monitoring metrics, drift detection, and automated canary deployment",
            "security boundaries, data isolation, and API design trade-offs"
        ]
        focus_seed = subdomain_seeds[sequence_number % len(subdomain_seeds)]

        system_prompt = (
            f"You are a Senior Principal Interviewer at a premier technology enterprise ({company_playbook.title()} playbook). "
            f"You are conducting an authentic {difficulty}-level {interview_type} mock interview for the role of {target_role}. "
            f"Focus topic inspiration: {focus_seed}. "
            "Generate an authentic, high-signal, production-realistic interview question. "
            "STRICT REQUIREMENT: NEVER repeat or closely rephrase any of the previously asked questions."
        )

        user_prompt = f"""
Sequence Number: Question {sequence_number}
Role: {target_role}
Difficulty: {difficulty}
Interview Type: {interview_type}
Topic Seed: {focus_seed}
Strictly Do NOT Duplicate Any of These Questions: {json.dumps(all_forbidden[:15])}
Previous Evaluation Gaps: {json.dumps(last_eval.get('weaknesses', []) if last_eval else [])}
Target Language: {language}

Return valid JSON with exactly these fields:
{{
  "question": "The fresh, authentic interview question to ask the candidate",
  "skill": "Specific core skill tested (e.g. PyTorch, Distributed Systems, SQL, STAR Leadership)",
  "topic": "Specific technical topic",
  "rationale": "Why this question is critical for this candidate at this stage",
  "expected_focus": "Key technical points, trade-offs, and architecture the candidate should cover",
  "rubric_guidance": "Evaluation guidance for scoring candidate's answer"
}}
"""
        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.7, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                q_text = parsed.get("question")
                if q_text:
                    qid = f"groq_q_{sequence_number}_{int(time.time())}"
                    return {
                        "id": qid,
                        "question_id": qid,
                        "sequence_number": sequence_number,
                        "question": q_text,
                        "question_text": q_text,
                        "skill": parsed.get("skill", "Engineering Fundamentals"),
                        "topic": parsed.get("topic", "Technical Architecture"),
                        "difficulty": difficulty,
                        "question_type": interview_type,
                        "source_type": "groq_dynamic_real_llm",
                        "generated_source": f"groq_{self.model}",
                        "rationale": parsed.get("rationale", f"Live Groq generation for {target_role}"),
                        "expected_focus": parsed.get("expected_focus", "Architectural trade-offs and concrete implementation."),
                        "rubric_guidance": parsed.get("rubric_guidance", "Examine correctness, edge cases, and depth."),
                        "is_follow_up": bool(last_eval and sequence_number > 1)
                    }
            except Exception:
                pass

        return self._fallback.generate_interview_question(
            career_context, session_config, sequence_number,
            previous_questions, previous_evaluations, retrieved_chunk,
            language, adaptive_decision, **kwargs
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
        """Deep multi-axis evaluation of candidate interview answers using Groq or local evaluator."""
        effective_answer = answer_text or user_answer or ""
        if (not self.api_key and not self.fallback_key) or len(effective_answer.strip()) < 10:
            return self._fallback.evaluate_interview_answer(
                question, answer_text, career_context, language,
                user_answer, retrieved_knowledge, target_role, difficulty, interview_type
            )

        q_text = question.get("question") or question.get("question_text", "")
        skill = question.get("skill") or question.get("topic", "Technical Knowledge")
        role = target_role or question.get("target_role") or "Machine Learning Engineer"

        system_prompt = (
            "You are an expert calibration evaluator for technical and behavioral interviews. "
            "Score candidate answers with fairness and rigor. "
            "Scores must be realistic integers between 30 and 98 based on technical depth, clarity, and correctness. "
            "Return valid JSON matching the exact schema."
        )

        user_prompt = f"""
Target Role: {role}
Tested Skill: {skill}
Question Asked: {q_text}
Candidate's Answer: {effective_answer}
Target Language: {language}

Return valid JSON with exactly these fields:
{{
  "overall_score": 75,
  "technical_accuracy": 78,
  "communication_quality": 74,
  "relevance": 80,
  "completeness": 70,
  "strengths": ["Specific strong point 1", "Specific strong point 2"],
  "weaknesses": ["Specific area for improvement 1", "Specific area for improvement 2"],
  "missing_concepts": ["Key term or mechanism candidate omitted"],
  "constructive_feedback": "Helpful mentoring paragraph explaining how to reach a staff-level answer",
  "follow_up_recommendation": "Suggested next probing question topic"
}}
"""
        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.2, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if "overall_score" in parsed:
                    parsed["question_id"] = question.get("id") or question.get("question_id")
                    parsed["skill"] = skill
                    parsed["language"] = language
                    parsed["evaluator"] = f"groq_{self.model}"
                    return parsed
            except Exception:
                pass

        return self._fallback.evaluate_interview_answer(
            question, answer_text, career_context, language,
            user_answer, retrieved_knowledge, target_role, difficulty, interview_type
        )

    def generate_final_interview_feedback(
        self,
        session: Dict[str, Any],
        questions: List[Dict[str, Any]],
        answers: List[str],
        evaluations: List[Dict[str, Any]],
        career_context: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Generates comprehensive final interview report."""
        if not self.api_key and not self.fallback_key:
            return self._fallback.generate_final_interview_feedback(
                session, questions, answers, evaluations, career_context, language
            )

        summary_payload = {
            "role": session.get("role", "Machine Learning Engineer"),
            "difficulty": session.get("difficulty", "Intermediate"),
            "questions_count": len(questions),
            "evaluations_summary": [
                {"score": e.get("overall_score"), "strengths": e.get("strengths"), "weaknesses": e.get("weaknesses")}
                for e in evaluations
            ]
        }

        system_prompt = "You are a Senior Engineering Hiring Director. Synthesize a comprehensive hiring report in clean JSON."
        user_prompt = f"Interview Session Summary:\n{json.dumps(summary_payload)}\nLanguage: {language}\nReturn clean JSON."

        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.2, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if "overall_score" in parsed:
                    parsed["target_role"] = session.get("role", "Machine Learning Engineer")
                    return multilingual_feedback_service.localize_feedback_report(parsed, target_language=language)
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
        """Provides quick model answer strategy for candidate review."""
        if not self.api_key and not self.fallback_key:
            return self._fallback.generate_quick_answer(
                question, topic, difficulty, interview_type, target_role, career_context, retrieved_chunks, language
            )

        system_prompt = "You are an expert technical interview practice coach. Return clean JSON."
        user_prompt = (
            f"Question: {question}\nTarget Role: {target_role}\nInterview Type: {interview_type}\nDifficulty: {difficulty}\n"
            "Return JSON: {\"quick_answer\": \"concise model response\", \"topic\": \"topic\", \"strategy\": \"strategy\"}"
        )

        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.3, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if parsed.get("quick_answer"):
                    return {
                        "quick_answer": parsed["quick_answer"],
                        "topic": parsed.get("topic", topic or "Technical"),
                        "strategy": parsed.get("strategy", "groq_lpu_synthesis"),
                        "source": "groq_llm"
                    }
            except Exception:
                pass

        return self._fallback.generate_quick_answer(
            question, topic, difficulty, interview_type, target_role, career_context, retrieved_chunks, language
        )
