"""
Google Gemini Real LLM Service Implementation
AI Career Preparation Agent

Provides direct, high-performance integration with Google Gemini Models (e.g. gemini-1.5-flash, gemini-2.0-flash)
using standard HTTPS JSON protocols. Seamlessly switches from offline local heuristics to live production AI.
"""

import os
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

from .multilingual_feedback_service import multilingual_feedback_service
from ..languages import normalize_feedback_language, is_supported_feedback_language


class GeminiLLMService:
    """
    Production-grade Google Gemini AI client.
    Connects to the official Google Generative Language API endpoint.
    Automatically handles structured output extraction, candidate evaluation,
    question generation, and fallback recovery.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        # Lazy fallback instance to prevent cyclic imports
        self._fallback_instance = None

    @property
    def _fallback(self):
        if self._fallback_instance is None:
            from .llm_service import LocalGroundedLLMService
            self._fallback_instance = LocalGroundedLLMService()
        return self._fallback_instance

    def _call_gemini(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3,
        json_mode: bool = False
    ) -> Optional[str]:
        """
        Executes an HTTPS POST request to the Google Gemini generateContent endpoint.
        Returns the raw generated text or None if error occurs.
        """
        if not self.api_key:
            return None

        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "topP": 0.95,
                "maxOutputTokens": 2048
            }
        }

        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                endpoint,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    resp_json = json.loads(response.read().decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
        except Exception as exc:
            # Log failure and allow caller to use local fallback
            if os.getenv("DEBUG_GEMINI"):
                print(f"[GeminiLLMService] Gemini API call failed: {exc}")
            return None

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
        res = self._call_gemini(prompt, system_instruction, temperature, json_mode=False)
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
        """
        Interactive AI Career Assistant grounded response via Gemini.
        """
        if not self.api_key:
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
    "route": "/daily-challenge or /interview-setup",
    "action_type": "practice or challenge",
    "reason": "Why this action accelerates readiness"
  }}
}}
"""
        raw_resp = self._call_gemini(user_prompt, system_prompt, temperature=0.3, json_mode=True)
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
                        "model_provider": f"gemini ({self.model})",
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
        Dynamically synthesizes adaptive interview questions using Google Gemini.
        """
        if not self.api_key:
            return self._fallback.generate_interview_question(
                career_context, session_config, sequence_number,
                previous_questions, previous_evaluations, retrieved_chunk,
                language, adaptive_decision, **kwargs
            )

        career_context = career_context or {}
        session_config = session_config or {}
        previous_questions = previous_questions or []
        previous_evaluations = previous_evaluations or []

        target_role = session_config.get("target_role") or career_context.get("target_role") or "Machine Learning Engineer"
        difficulty = session_config.get("difficulty") or "Intermediate"
        interview_type = session_config.get("interview_type") or "Technical"
        company_playbook = session_config.get("company_playbook") or "general"

        prev_q_texts = [q.get("question") or q.get("question_text", "") for q in previous_questions]
        last_eval = previous_evaluations[-1] if previous_evaluations else None

        system_prompt = (
            f"You are a Senior Principal Interviewer at a top tier technology company ({company_playbook.title()} playbook). "
            f"You are conducting a live {difficulty}-level {interview_type} mock interview for the role of {target_role}. "
            "Generate an authentic, rigorous, and relevant interview question. Do not duplicate previously asked questions."
        )

        user_prompt = f"""
Sequence Number: Question {sequence_number}
Role: {target_role}
Difficulty: {difficulty}
Interview Type: {interview_type}
Previous Questions Asked: {json.dumps(prev_q_texts)}
Previous Evaluation Context: {json.dumps(last_eval.get('weaknesses', []) if last_eval else [])}
Target Language: {language}

Return valid JSON with exactly these fields:
{{
  "question": "The interview question to read to the candidate",
  "skill": "Specific core skill tested (e.g. PyTorch, Distributed Systems, SQL, STAR Leadership)",
  "topic": "Specific technical topic",
  "rationale": "Why this question is critical for this candidate at this stage",
  "expected_focus": "Key technical points, trade-offs, and architecture the candidate should cover",
  "rubric_guidance": "Evaluation guidance for scoring candidate's answer"
}}
"""
        raw_resp = self._call_gemini(user_prompt, system_prompt, temperature=0.35, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                q_text = parsed.get("question")
                if q_text:
                    qid = f"gemini_q_{sequence_number}_{int(time.time())}"
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
                        "source_type": "gemini_dynamic_real_llm",
                        "generated_source": f"gemini_{self.model}",
                        "rationale": parsed.get("rationale", f"Live evaluation for {target_role}"),
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
        """
        Deep multi-axis evaluation of candidate interview answers using Google Gemini.
        """
        effective_answer = answer_text or user_answer or ""
        if not self.api_key or len(effective_answer.strip()) < 10:
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
Question Asked: {q_text}
Skill / Topic: {skill}
Candidate Answer: {effective_answer}
Feedback Language: {language}

Evaluate the candidate's answer and return valid JSON with these exact fields:
{{
  "overall_score": integer 30-98,
  "technical_accuracy": integer 30-98,
  "communication_quality": integer 30-98,
  "relevance": integer 30-98,
  "completeness": integer 30-98,
  "confidence_indicators": integer 30-98,
  "strengths": ["Clear strength 1", "Clear strength 2"],
  "weaknesses": ["Specific weakness or missing point 1", "Specific weakness or missing point 2"],
  "missing_concepts": ["Specific technical concept or trade-off not mentioned"],
  "recommended_follow_up_type": "deeper_technical or conceptual_probe or foundational_clarification",
  "recommended_difficulty": "Advanced or Intermediate or Beginner",
  "feedback": "2-3 paragraphs of actionable, constructive feedback in the requested language ({language})"
}}
"""
        raw_resp = self._call_gemini(user_prompt, system_prompt, temperature=0.2, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                overall = int(parsed.get("overall_score", 70))
                tech = int(parsed.get("technical_accuracy", overall))
                comm = int(parsed.get("communication_quality", overall))
                rel = int(parsed.get("relevance", overall))
                comp = int(parsed.get("completeness", overall))
                conf = int(parsed.get("confidence_indicators", overall))

                return {
                    "overall_score": overall,
                    "technical_accuracy": tech,
                    "communication_quality": comm,
                    "relevance": rel,
                    "completeness": comp,
                    "confidence_indicators": conf,
                    "structure_score": comm,
                    "correctness_score": tech,
                    "depth_score": comp,
                    "relevance_score": rel,
                    "communication_score": comm,
                    "technical_score": tech,
                    "strengths": parsed.get("strengths", ["Addressed core prompt"]),
                    "weaknesses": parsed.get("weaknesses", ["Expand on system trade-offs"]),
                    "missing_concepts": parsed.get("missing_concepts", []),
                    "detected_topics": [skill],
                    "recommended_follow_up_type": parsed.get("recommended_follow_up_type", "conceptual_probe"),
                    "recommended_difficulty": parsed.get("recommended_difficulty", "Intermediate"),
                    "skill_evidence": {skill: overall},
                    "feedback": parsed.get("feedback", "Good effort. Deepen your explanation of production scale and trade-offs."),
                    "follow_up_needed": True,
                    "follow_up_reason": f"Evaluated with Gemini AI ({overall}/100)"
                }
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
        answers: List[Dict[str, Any]],
        evaluations: List[Dict[str, Any]],
        career_context: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Synthesizes overall interview performance report via Gemini.
        """
        if not self.api_key or not evaluations:
            return self._fallback.generate_final_interview_feedback(
                session, questions, answers, evaluations, career_context, language
            )

        target_role = session.get("target_role", "Machine Learning Engineer")
        avg_score = int(round(sum(e.get("overall_score", 0) for e in evaluations) / len(evaluations)))

        system_prompt = (
            "You are a Hiring Committee Lead providing the executive summary for an interview round. "
            "Summarize the candidate's performance with candor, highlighting critical strengths and concrete gap remediation."
        )

        eval_summary = [
            {
                "question": q.get("question"),
                "score": ev.get("overall_score"),
                "strengths": ev.get("strengths"),
                "weaknesses": ev.get("weaknesses")
            }
            for q, ev in zip(questions, evaluations)
        ]

        user_prompt = f"""
Target Role: {target_role}
Average Score: {avg_score}
Round Details: {json.dumps(eval_summary)}
Language: {language}

Return valid JSON with:
{{
  "overall_score": {avg_score},
  "passed": boolean (true if overall_score >= 75),
  "strengths": ["Top overall strength 1", "Top overall strength 2"],
  "weaknesses": ["Primary growth gap 1", "Primary growth gap 2"],
  "recommendations": ["Concrete action item 1", "Concrete action item 2"],
  "feedback_summary": "Comprehensive 2-paragraph executive assessment"
}}
"""
        raw_resp = self._call_gemini(user_prompt, system_prompt, temperature=0.25, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                fallback_res = self._fallback.generate_final_interview_feedback(
                    session, questions, answers, evaluations, career_context, language
                )
                fallback_res.update({
                    "overall_score": parsed.get("overall_score", avg_score),
                    "passed": parsed.get("passed", avg_score >= 75),
                    "strengths": parsed.get("strengths", fallback_res.get("strengths", [])),
                    "weaknesses": parsed.get("weaknesses", fallback_res.get("weaknesses", [])),
                    "recommendations": parsed.get("recommendations", fallback_res.get("recommendations", [])),
                    "feedback_summary": parsed.get("feedback_summary", fallback_res.get("feedback_summary", ""))
                })
                return fallback_res
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
        """
        Instant expert interview model answer synthesis via Gemini.
        """
        if not self.api_key:
            return self._fallback.generate_quick_answer(
                question, topic, difficulty, interview_type, target_role, career_context, retrieved_chunks, language
            )

        system_prompt = (
            f"You are a Principal {target_role} coaching an interviewee. "
            "Give a direct, spoken interview answer (3-5 sentences) that sounds natural, confident, and demonstrates senior depth. "
            "Avoid conversational fluff. Return clean JSON."
        )

        user_prompt = f"""
Question: {question}
Topic: {topic or 'Technical Fundamentals'}
Role: {target_role}
Difficulty: {difficulty}
Interview Type: {interview_type}
Language: {language}

Return JSON with:
{{
  "quick_answer": "Concise spoken interview answer directly in {language}",
  "topic": "{topic or 'Technical Fundamentals'}",
  "strategy": "architectural_synthesis"
}}
"""
        raw_resp = self._call_gemini(user_prompt, system_prompt, temperature=0.3, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if parsed.get("quick_answer"):
                    return {
                        "quick_answer": parsed["quick_answer"],
                        "topic": parsed.get("topic", topic or "Engineering"),
                        "strategy": parsed.get("strategy", "gemini_real_llm"),
                        "source": f"gemini_{self.model}"
                    }
            except Exception:
                pass

        return self._fallback.generate_quick_answer(
            question, topic, difficulty, interview_type, target_role, career_context, retrieved_chunks, language
        )
