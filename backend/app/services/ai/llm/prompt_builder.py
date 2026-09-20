"""
Grounded Prompt Builder for RAG & LLM
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University

Constructs delineated, hallucination-resistant prompts strictly structuring:
- SYSTEM INSTRUCTIONS
- USER CAREER CONTEXT
- RETRIEVED KNOWLEDGE
- USER REQUEST
"""

from typing import Dict, Any, List, Optional


LANGUAGE_INSTRUCTIONS = {
    "en": "Respond in clear, professional English.",
    "te": "Respond in clear Telugu (తెలుగు) using professional technical vocabulary. Keep technical keywords in English where appropriate for clarity.",
    "hi": "Respond in clear Hindi (हिन्दी) using professional technical vocabulary. Keep technical keywords in English where appropriate for clarity.",
    "es": "Respond in clear, professional Spanish (Español)."
}


def build_grounded_prompt(
    query: str,
    user_context: Dict[str, Any],
    retrieved_chunks: List[Dict[str, Any]],
    language: str = "en"
) -> Dict[str, str]:
    """
    Builds the system instruction and user prompt matching Prompt Section 12 specifications.
    """
    lang_inst = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])

    # 1. System Instructions
    system_instruction = (
        "You are the Senior AI Career Preparation Coach at Vignan University (AIML Department). "
        "Your mission is to help students become job-ready for competitive technical roles. "
        "Strict Grounding Rules:\n"
        "1. Prioritize the factual information in the RETRIEVED KNOWLEDGE section for technical definitions and engineering details.\n"
        "2. Contextualize explanations to the candidate's TARGET ROLE and active SKILL GAPS without inventing unsupported facts.\n"
        "3. If the RETRIEVED KNOWLEDGE section is empty or insufficient, explicitly acknowledge that no grounded curriculum document was found, "
        "and provide general high-level principles clearly labeled as general guidance.\n"
        "4. Be concise, pedagogical, encouraging, and actionable.\n"
        f"5. Language requirement: {lang_inst}"
    )

    # 2. User Career Context Section
    target_role = user_context.get("target_role", "Machine Learning Engineer")
    name = user_context.get("candidate_name", "Candidate")
    exp = user_context.get("experience_level", "Foundational")
    ats_score = user_context.get("ats_score")
    matched = ", ".join(user_context.get("matched_skills", [])) or "None audited"
    missing = ", ".join(user_context.get("missing_skills", [])) or "None identified"
    urgent_gap = user_context.get("urgent_gap", "None")
    nba = user_context.get("next_best_action", {})
    interview_weaknesses = ", ".join(user_context.get("interview_weaknesses", [])) or "None detected"

    career_context_block = (
        f"Candidate Name: {name}\n"
        f"Target Career Role: {target_role}\n"
        f"Experience Level: {exp}\n"
        f"ATS Resume Score: {ats_score}/100 if available\n"
        f"Recognized Skills: {matched}\n"
        f"Identified Priority Skill Gaps: {missing}\n"
        f"Most Urgent Technical Gap: {urgent_gap}\n"
        f"Recent Interview Rubric Weaknesses: {interview_weaknesses}\n"
        f"Current Next-Best-Action: {nba.get('title', 'Practice daily')}"
    )

    # 3. Retrieved Knowledge Section
    if retrieved_chunks:
        knowledge_entries = []
        for i, chunk in enumerate(retrieved_chunks, 1):
            knowledge_entries.append(
                f"[Document {i}]\n"
                f"Title: {chunk.get('title')}\n"
                f"Category: {chunk.get('category')} | Topic: {chunk.get('topic')}\n"
                f"Difficulty: {chunk.get('difficulty')} | Applicable Roles: {', '.join(chunk.get('applicable_roles', []))}\n"
                f"Source: {chunk.get('source')}\n"
                f"Content: {chunk.get('content')}"
            )
        retrieved_knowledge_block = "\n\n".join(knowledge_entries)
    else:
        retrieved_knowledge_block = "NO HIGH-CONFIDENCE GROUNDED KNOWLEDGE CHUNKS RETRIEVED."

    # 4. User Request Section
    user_prompt = (
        "=== USER CAREER CONTEXT ===\n"
        f"{career_context_block}\n\n"
        "=== RETRIEVED KNOWLEDGE ===\n"
        f"{retrieved_knowledge_block}\n\n"
        "=== USER REQUEST ===\n"
        f"Candidate asks: \"{query}\"\n\n"
        "Please provide a grounded, role-personalized response with:\n"
        "1. Direct clear explanation referencing retrieved knowledge.\n"
        "2. Three concise key bullet points.\n"
        "3. Recommended next action connecting to their target role or skill gaps."
    )

    return {
        "system_instruction": system_instruction,
        "user_prompt": user_prompt
    }
