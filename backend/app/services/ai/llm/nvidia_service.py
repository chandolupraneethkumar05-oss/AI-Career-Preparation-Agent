"""
NVIDIA NIM Real High-Precision LLM Service Implementation
AI Career Preparation Agent

Provides direct, high-precision integration with NVIDIA NIM Cloud APIs
(e.g., meta/llama-3.3-70b-instruct, nvidia/llama-3.1-nemotron-70b-instruct).
Specialized as the primary calibrated answer evaluator and hiring committee report generator.
Seamlessly falls back through Groq, Gemini, and Local Grounded evaluation if unconfigured.
"""

import os
import json
import time
import re
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

from .multilingual_feedback_service import multilingual_feedback_service
from ..languages import normalize_feedback_language, is_supported_feedback_language
from .difficulty_profiles import get_difficulty_profile, normalize_difficulty


class NvidiaLLMService:
    """
    Production-grade NVIDIA NIM AI client for objective interview answer evaluation
    and hiring committee synthesis. Connects to NVIDIA's OpenAI-compatible completions endpoint.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY")
        self.model = model or os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")
        self._fallback_instance = None

    @property
    def _fallback(self):
        """Lazy fallback cascade: Groq -> Gemini -> Local Grounded."""
        if self._fallback_instance is None:
            if os.getenv("GROQ_API_KEY"):
                try:
                    from .groq_service import GroqLLMService
                    self._fallback_instance = GroqLLMService()
                    return self._fallback_instance
                except Exception:
                    pass
            if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
                try:
                    from .gemini_service import GeminiLLMService
                    self._fallback_instance = GeminiLLMService()
                    return self._fallback_instance
                except Exception:
                    pass
            from .llm_service import LocalGroundedLLMService
            self._fallback_instance = LocalGroundedLLMService()
        return self._fallback_instance

    def _clean_json_text(self, text: str) -> str:
        """Strips markdown code fences and cleans JSON output."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()

    def _call_nvidia(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        json_mode: bool = True
    ) -> Optional[str]:
        """Executes an HTTPS request to the NVIDIA NIM OpenAI-compatible endpoint."""
        if not self.api_key:
            return None

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "CareerPrep-Nvidia/1.0"
        }

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "top_p": 0.7,
            "max_tokens": 2048,
            "stream": False
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers=headers,
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=18) as response:
                if response.status == 200:
                    resp_json = json.loads(response.read().decode("utf-8"))
                    choices = resp_json.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content")
        except urllib.error.HTTPError as http_err:
            if os.getenv("DEBUG_NVIDIA"):
                try:
                    err_body = http_err.read().decode("utf-8")
                    print(f"[NvidiaLLMService] HTTP error {http_err.code}: {err_body}")
                except Exception:
                    print(f"[NvidiaLLMService] HTTP error {http_err.code}")
            return None
        except Exception as exc:
            if os.getenv("DEBUG_NVIDIA"):
                print(f"[NvidiaLLMService] Request failed: {exc}")
            return None

        return None

    def generate(self, prompt: str, system_instruction: str, temperature: float = 0.2) -> str:
        """Direct text generation via NVIDIA NIM."""
        res = self._call_nvidia(prompt, system_instruction, temperature, json_mode=False)
        if res:
            return res.strip()
        return self._fallback.generate(prompt, system_instruction, temperature)

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
        Deep, objective multi-axis evaluation of candidate interview answers using NVIDIA NIM.
        Calibrates technical accuracy, problem solving, communication, and completeness.
        """
        effective_answer = (answer_text or user_answer or "").strip()
        career_context = career_context or {}

        is_skipped = effective_answer in ["", "[Skipped by candidate]", "[Skipped]"]
        if is_skipped:
            return {
                "overall_score": 0,
                "technical_accuracy": 0,
                "problem_solving": 0,
                "communication_quality": 0,
                "relevance": 0,
                "completeness": 0,
                "confidence_indicators": 0,
                "correctness_score": 0,
                "depth_score": 0,
                "relevance_score": 0,
                "communication_score": 0,
                "technical_score": 0,
                "feedback": f"Question on {question.get('skill', 'this topic')} was skipped by the candidate. We have marked this as a high-priority topic for guided practice and roadmap drills.",
                "strengths": [],
                "weaknesses": [f"Candidate skipped the question on {question.get('skill', 'this topic')}"],
                "missing_concepts": [question.get("skill", "Core concept")],
                "detected_topics": [question.get("skill", "Topic")],
                "follow_up_needed": False,
                "follow_up_reason": None,
                "recommended_follow_up_type": "none",
                "recommended_difficulty": question.get("difficulty", "Beginner"),
                "skill_evidence": {question.get("skill", "Engineering Fundamentals"): 0},
                "question_id": question.get("id") or question.get("question_id"),
                "skill": question.get("skill", "Engineering Fundamentals"),
                "language": language,
                "evaluator": "calibrated_skip_handler"
            }

        if not self.api_key or len(effective_answer) < 10:
            return self._fallback.evaluate_interview_answer(
                question=question,
                answer_text=effective_answer,
                career_context=career_context,
                language=language,
                user_answer=effective_answer,
                retrieved_knowledge=retrieved_knowledge,
                target_role=target_role,
                difficulty=difficulty,
                interview_type=interview_type
            )

        q_text = question.get("question") or question.get("question_text") or ""
        skill = question.get("skill") or question.get("topic") or "Technical Knowledge"
        role = target_role or question.get("target_role") or career_context.get("target_role") or "Software Engineer"
        level = normalize_difficulty(difficulty or question.get("difficulty") or "Intermediate")
        q_type = interview_type or question.get("question_type") or "Technical"
        profile = get_difficulty_profile(level)
        rubric_exp = profile.get("rubric_expectations", "Assess correctness and clarity.")

        system_prompt = (
            "You are an expert calibration evaluator and Technical Hiring Committee Evaluator. "
            f"Candidate seniority level is {level}. "
            f"Level scoring guidance: {rubric_exp} "
            "Do NOT demand staff-level or enterprise architecture trade-offs for beginner or intermediate candidates. "
            "Evaluate the candidate's exact answer constructively, objectively, and fairly against this level. "
            "Scoring guidance: "
            "- Score dynamically and authentically based on correctness and clarity for this level. "
            "- Scores must be realistic integers between 30 and 98. "
            "- Weak, vague, or incorrect answers: 30-59. "
            "- Decent, standard answers meeting baseline level expectations: 60-79. "
            "- Clear, accurate answers with sound technical reasoning: 80-94. "
            "- Exceptional, comprehensive answers with deep insight: 95-99. "
            "Return valid JSON matching the exact schema."
        )

        user_prompt = f"""
Target Role: {role}
Seniority / Difficulty: {level}
Interview Type: {q_type}
Tested Skill / Competency: {skill}
Question Asked: {q_text}
Candidate's Exact Response:
\"\"\"{effective_answer}\"\"\"

Relevant Grounded Knowledge / Curriculum Reference:
{json.dumps(retrieved_knowledge or [])}

Target Language: {language}

Return valid JSON with exactly these fields:
{{
  "overall_score": 82,
  "technical_accuracy": 85,
  "problem_solving": 80,
  "communication_quality": 82,
  "relevance": 88,
  "completeness": 76,
  "confidence_indicators": 80,
  "feedback": "Concise, constructive mentoring paragraph explaining exactly what was strong, what nuance was missing, and how to improve.",
  "strengths": ["Specific strength citing candidate's words 1", "Specific strength citing candidate's words 2"],
  "weaknesses": ["Specific concrete gap or missed trade-off 1", "Specific concrete gap 2"],
  "missing_concepts": ["Specific technical concept, API, mechanism, or metric the candidate omitted"],
  "detected_topics": ["{skill}"],
  "follow_up_needed": false,
  "follow_up_reason": "Specific technical topic to probe if follow-up is recommended, or null",
  "recommended_follow_up_type": "conceptual_probe",
  "recommended_difficulty": "{level}"
}}
"""

        raw_resp = self._call_nvidia(user_prompt, system_prompt, temperature=0.2, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if "overall_score" in parsed:
                    overall = int(parsed.get("overall_score", 70))
                    tech = int(parsed.get("technical_accuracy", overall))
                    comm = int(parsed.get("communication_quality", overall))
                    rel = int(parsed.get("relevance", overall))
                    comp = int(parsed.get("completeness", overall))
                    conf = int(parsed.get("confidence_indicators", overall))
                    prob = int(parsed.get("problem_solving", comp))

                    parsed["overall_score"] = overall
                    parsed["technical_accuracy"] = tech
                    parsed["problem_solving"] = prob
                    parsed["communication_quality"] = comm
                    parsed["relevance"] = rel
                    parsed["completeness"] = comp
                    parsed["confidence_indicators"] = conf

                    # Standardize parity keys across consumers
                    parsed["correctness_score"] = tech
                    parsed["depth_score"] = comp
                    parsed["relevance_score"] = rel
                    parsed["communication_score"] = comm
                    parsed["technical_score"] = tech

                    parsed["feedback"] = parsed.get("feedback") or "Good conceptual response covering fundamental requirements."
                    parsed["strengths"] = parsed.get("strengths") or ["Demonstrated solid core understanding"]
                    parsed["weaknesses"] = parsed.get("weaknesses") or ["Could articulate edge-case failure modes in deeper detail"]
                    parsed["missing_concepts"] = parsed.get("missing_concepts") or []
                    parsed["detected_topics"] = parsed.get("detected_topics") or [skill]
                    parsed["follow_up_needed"] = bool(parsed.get("follow_up_needed", False))
                    parsed["follow_up_reason"] = parsed.get("follow_up_reason")
                    parsed["recommended_follow_up_type"] = parsed.get("recommended_follow_up_type", "conceptual_probe")
                    parsed["recommended_difficulty"] = parsed.get("recommended_difficulty", level)
                    parsed["skill_evidence"] = {skill: tech}
                    parsed["question_id"] = question.get("id") or question.get("question_id")
                    parsed["skill"] = skill
                    parsed["language"] = language
                    parsed["evaluator"] = f"nvidia_{self.model}"

                    # Localize if non-English
                    if language and language != "en" and is_supported_feedback_language(language):
                        parsed = multilingual_feedback_service.localize_feedback_report(parsed, target_language=language)

                    return parsed
            except Exception as e:
                if os.getenv("DEBUG_NVIDIA"):
                    print(f"[NvidiaLLMService] Failed to parse JSON response: {e}")

        # Fallback if NVIDIA request failed
        return self._fallback.evaluate_interview_answer(
            question=question,
            answer_text=effective_answer,
            career_context=career_context,
            language=language,
            user_answer=effective_answer,
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
        """
        Synthesizes comprehensive final hiring committee report using NVIDIA NIM.
        Computes calibrated rubric scores, strengths, weaknesses, and skill updates.
        """
        if not self.api_key:
            return self._fallback.generate_final_interview_feedback(
                session, questions, answers, evaluations, career_context, language
            )

        role = session.get("role") or career_context.get("target_role") or "Software Engineer"
        system_prompt = (
            "You are a Senior Engineering Director and Hiring Committee Chair. "
            "Synthesize the candidate's complete interview trajectory into a calibrated hiring evaluation. "
            "Evaluate performance strictly against the actual questions and candidate answers provided. "
            "Return valid JSON matching the exact schema."
        )

        qa_pairs = []
        for i, q in enumerate(questions):
            ans_text = answers[i].get("answer_text", "") if i < len(answers) and isinstance(answers[i], dict) else (answers[i] if i < len(answers) else "")
            ev = evaluations[i] if i < len(evaluations) else {}
            qa_pairs.append({
                "sequence": i + 1,
                "question": q.get("question") or q.get("question_text"),
                "skill": q.get("skill"),
                "answer": ans_text,
                "score": ev.get("overall_score") or ev.get("scores", {}).get("overall")
            })

        user_prompt = f"""
Target Role: {role}
Session Type: {session.get("type", "Technical")}
Total Questions Completed: {len(questions)}
Candidate Performance Trajectory:
{json.dumps(qa_pairs, indent=2)}

Return valid JSON with exactly these fields:
{{
  "overall_score": 82,
  "passed": true,
  "rubric_scores": {{
    "overall": 82,
    "technicalKnowledge": 85,
    "communicationSTAR": 80,
    "problemSolving": 82,
    "systemDesign": 80,
    "confidenceDelivery": 84
  }},
  "strengths": ["Demonstrated strong algorithmic reasoning in distributed systems", "Clear communication of failure modes"],
  "weaknesses": ["Could articulate concrete latency trade-offs with explicit p99 numbers", "Needs deeper consideration of data consistency edge-cases"],
  "recommendations": ["Practice designing distributed event-driven architectures with idempotent consumers", "Drill BigQuery and streaming storage trade-offs"],
  "next_best_action": {{
    "title": "Practice Distributed Streaming Architecture",
    "action": "Start Challenge",
    "route": "/daily-challenge",
    "reason": "Reinforce exactly-once semantics and eventual consistency trade-offs."
  }},
  "skill_gap_updates": [
    {{
      "skill_name": "Distributed Systems",
      "score": 82,
      "priority": "medium",
      "reason": "Demonstrated solid conceptual foundation with minor nuance gaps."
    }}
  ],
  "feedback_summary": "Comprehensive executive summary of the candidate's interview performance, suitability for {role}, and key growth areas."
}}
"""

        raw_resp = self._call_nvidia(user_prompt, system_prompt, temperature=0.2, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if "overall_score" in parsed:
                    parsed["target_role"] = role
                    parsed["evaluator"] = f"nvidia_{self.model}"
                    if language and language != "en" and is_supported_feedback_language(language):
                        return multilingual_feedback_service.localize_feedback_report(parsed, target_language=language)
                    return parsed
            except Exception:
                pass

        return self._fallback.generate_final_interview_feedback(
            session, questions, answers, evaluations, career_context, language
        )

    def generate_interview_question(self, *args, **kwargs) -> Dict[str, Any]:
        """
        Question generation is delegated to Groq (or fallback cascade)
        to maintain ultra-low latency interactive question turn-taking.
        """
        if os.getenv("GROQ_API_KEY"):
            try:
                from .groq_service import GroqLLMService
                return GroqLLMService().generate_interview_question(*args, **kwargs)
            except Exception:
                pass
        return self._fallback.generate_interview_question(*args, **kwargs)

    def generate_grounded_response(self, *args, **kwargs) -> Dict[str, Any]:
        """Grounded knowledge queries are delegated to Gemini/Google AI Studio (or fallback)."""
        if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
            try:
                from .gemini_service import GeminiLLMService
                return GeminiLLMService().generate_grounded_response(*args, **kwargs)
            except Exception:
                pass
        return self._fallback.generate_grounded_response(*args, **kwargs)

    def generate_quick_answer(self, *args, **kwargs) -> Dict[str, Any]:
        """Quick answers are delegated to Gemini/Google AI Studio (or fallback)."""
        if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
            try:
                from .gemini_service import GeminiLLMService
                return GeminiLLMService().generate_quick_answer(*args, **kwargs)
            except Exception:
                pass
        return self._fallback.generate_quick_answer(*args, **kwargs)
