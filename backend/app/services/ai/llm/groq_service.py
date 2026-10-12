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
  "confidence_indicators": 75,
  "feedback": "Helpful mentoring paragraph explaining strengths, nuances, and how to reach a staff-level answer",
  "strengths": ["Specific strong point 1", "Specific strong point 2"],
  "weaknesses": ["Specific area for improvement 1", "Specific area for improvement 2"],
  "missing_concepts": ["Key term or mechanism candidate omitted"],
  "detected_topics": ["{skill}"],
  "follow_up_needed": false,
  "follow_up_reason": "Suggested next probing question topic",
  "recommended_follow_up_type": "conceptual_probe",
  "recommended_difficulty": "{difficulty or 'Intermediate'}"
}}
"""
        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.2, json_mode=True)
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

                    parsed["overall_score"] = overall
                    parsed["technical_accuracy"] = tech
                    parsed["communication_quality"] = comm
                    parsed["relevance"] = rel
                    parsed["completeness"] = comp
                    parsed["confidence_indicators"] = conf
                    parsed["correctness_score"] = tech
                    parsed["depth_score"] = comp
                    parsed["relevance_score"] = rel
                    parsed["communication_score"] = comm
                    parsed["technical_score"] = tech

                    parsed["feedback"] = parsed.get("feedback") or parsed.get("constructive_feedback") or "Good technical explanation covering primary mechanisms."
                    parsed["strengths"] = parsed.get("strengths") or ["Demonstrated solid baseline understanding"]
                    parsed["weaknesses"] = parsed.get("weaknesses") or ["Could articulate edge-case failure modes in deeper detail"]
                    parsed["missing_concepts"] = parsed.get("missing_concepts") or []
                    parsed["detected_topics"] = parsed.get("detected_topics") or [skill]
                    parsed["follow_up_needed"] = bool(parsed.get("follow_up_needed", False))
                    parsed["follow_up_reason"] = parsed.get("follow_up_reason") or parsed.get("follow_up_recommendation")
                    parsed["recommended_follow_up_type"] = parsed.get("recommended_follow_up_type", "conceptual_probe")
                    parsed["recommended_difficulty"] = parsed.get("recommended_difficulty", difficulty or "Intermediate")
                    parsed["skill_evidence"] = parsed.get("skill_evidence") or {skill: tech}

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

        target_role = session.get("target_role") or session.get("role") or "Software Engineer"
        valid_evals = [e for e in evaluations if isinstance(e, dict) and e.get("overall_score") is not None]
        avg_score = int(round(sum(e["overall_score"] for e in valid_evals) / len(valid_evals))) if valid_evals else 75

        eval_summary = [
            {
                "question": q.get("question") if isinstance(q, dict) else str(q),
                "score": ev.get("overall_score", 70) if isinstance(ev, dict) else 70,
                "strengths": ev.get("strengths", []) if isinstance(ev, dict) else [],
                "weaknesses": ev.get("weaknesses", []) if isinstance(ev, dict) else []
            }
            for q, ev in zip(questions, evaluations)
        ]

        system_prompt = (
            "You are a Senior Engineering Hiring Committee Lead. Synthesize a comprehensive hiring report in clean JSON. "
            "Assess candidate readiness with objectivity, actionable guidance, and deep architectural rigor."
        )
        user_prompt = f"""
Target Role: {target_role}
Average Calibrated Score: {avg_score}
Round Details: {json.dumps(eval_summary)}
Language: {language}

Return valid JSON with exactly:
{{
  "overall_score": {avg_score},
  "passed": {str(avg_score >= 75).lower()},
  "strengths": ["Top overall strength 1", "Top overall strength 2"],
  "weaknesses": ["Primary growth gap 1", "Primary growth gap 2"],
  "recommendations": ["Concrete action item 1", "Concrete action item 2"],
  "feedback_summary": "Comprehensive 2-paragraph executive assessment of candidate competence, architectural trade-offs, and hiring recommendation.",
  "rubric_scores": {{
    "technicalKnowledge": {avg_score},
    "problemSolving": {max(40, avg_score - 2)},
    "communicationSTAR": {min(98, avg_score + 3)},
    "systemDesign": {avg_score},
    "confidenceDelivery": {min(98, avg_score + 1)}
  }}
}}
"""

        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.25, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if "overall_score" in parsed:
                    fallback_res = self._fallback.generate_final_interview_feedback(
                        session, questions, answers, evaluations, career_context, language
                    )
                    parsed["target_role"] = target_role
                    parsed["passed"] = bool(parsed.get("passed", parsed["overall_score"] >= 75))
                    parsed["rubric_scores"] = parsed.get("rubric_scores") or fallback_res.get("rubric_scores", {})
                    parsed["strengths"] = parsed.get("strengths") or fallback_res.get("strengths", [])
                    parsed["weaknesses"] = parsed.get("weaknesses") or fallback_res.get("weaknesses", [])
                    parsed["recommendations"] = parsed.get("recommendations") or fallback_res.get("recommendations", [])
                    parsed["feedback_summary"] = parsed.get("feedback_summary") or fallback_res.get("feedback_summary", "")
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

    def analyze_resume(
        self,
        resume_text: str,
        target_role: str,
        job_description: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Deep contextual resume evaluation and ATS scoring using Groq."""
        if not self.api_key and not self.fallback_key:
            return None

        system_prompt = (
            "You are a Senior Principal Technical Recruiter and ATS Auditor. "
            "Analyze the candidate's actual resume text against the target role and job description. "
            "Extract verified technical skills actually mentioned in the resume. "
            "Identify missing skills and concepts that are strictly necessary or expected for this specific target role. "
            "Write 2-3 genuine strengths and 2-3 constructive weaknesses directly citing the candidate's resume content. "
            "Provide an executive summary and realistic ATS match score (0-100). "
            "Return valid JSON matching the exact schema."
        )

        user_prompt = f"""
Target Role: {target_role}
Job Description: {job_description or ("Standard industry requirements for " + target_role)}
Candidate Resume Text:
{resume_text[:4000]}

Return valid JSON with exactly these fields:
{{
  "ats_score": 75,
  "extracted_skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
  "matched_skills": ["Python", "Docker", "PostgreSQL"],
  "missing_skills": ["Kubernetes", "System Design"],
  "strengths": ["Specific strong point citing candidate project/experience 1", "Specific strong point 2"],
  "weaknesses": ["Specific actionable gap for this target role 1", "Specific actionable gap 2"],
  "summary": "Professional executive summary of candidate suitability for {target_role}.",
  "score_breakdown": {{
    "keyword_match_score": 75,
    "section_completeness_score": 85,
    "quantifiable_impact_score": 70,
    "format_readability_score": 80
  }}
}}
"""

        raw_resp = self._call_groq(user_prompt, system_prompt, temperature=0.2, json_mode=True)
        if raw_resp:
            try:
                parsed = json.loads(self._clean_json_text(raw_resp))
                if "ats_score" in parsed and "extracted_skills" in parsed:
                    return parsed
            except Exception:
                pass
        return None

