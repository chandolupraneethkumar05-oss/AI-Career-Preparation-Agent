"""
Communication & Delivery Analysis Service
AI Career Preparation Agent

Analyzes candidate verbal delivery and communication signals from interview answers and transcripts:
- Speaking Pace (Words per minute)
- Filler Word Detection (um, uh, like, you know, actually, etc.)
- Pause & Duration metrics
- Structural Clarity
- STAR framework detection for behavioral questions (Situation, Task, Action, Result)
- Grounded, non-judgmental, constructive delivery observations (strictly no emotion or personality inference)
"""

import re
from typing import Dict, Any, List, Optional


# Canonical filler words and conversational crutches
FILLER_PATTERNS = [
    (r"\bum\b", "um"),
    (r"\buh\b", "uh"),
    (r"\buhm\b", "uhm"),
    (r"\ber\b", "er"),
    (r"\bah\b", "ah"),
    (r"\blike\b", "like"),
    (r"\byou know\b", "you know"),
    (r"\bactually\b", "actually"),
    (r"\bbasically\b", "basically"),
    (r"\bliterally\b", "literally"),
    (r"\bsort of\b", "sort of"),
    (r"\bkind of\b", "kind of"),
    (r"\bI mean\b", "I mean"),
    (r"\bright\?\b", "right?"),
]

# STAR keywords and rhetorical transition markers
STAR_KEYWORDS = {
    "situation": [
        "situation", "background", "context", "at my previous", "in my last role",
        "we were working on", "the problem was", "the project started when", "initially"
    ],
    "task": [
        "task", "responsibility", "assigned to", "my goal was", "needed to",
        "objective", "target", "challenge was to", "responsible for"
    ],
    "action": [
        "action", "i decided to", "i implemented", "i designed", "i built",
        "we engineered", "i refactored", "my approach was", "i utilized", "executed",
        "implemented", "designed", "developed", "built", "created"
    ],
    "result": [
        "result", "outcome", "consequently", "impact", "reduced latency by",
        "improved accuracy", "achieved", "delivered", "increased", "measured"
    ]
}


class CommunicationAnalysisService:
    """
    Evaluates candidate verbal pacing, filler word frequency, and structural coherence.
    """

    # Optimal conversational speaking pace for technical interviews (WPM)
    OPTIMAL_PACE_MIN = 120
    OPTIMAL_PACE_MAX = 155

    def analyze_answer(
        self,
        transcript: str,
        duration_seconds: float,
        is_behavioral: bool = False,
        topic: str = "General"
    ) -> Dict[str, Any]:
        """
        Analyzes a single question answer's verbal communication characteristics.
        """
        text = (transcript or "").strip()
        words = re.findall(r"\b[a-zA-Z0-9'-]+\b", text)
        word_count = len(words)

        effective_duration = max(5.0, duration_seconds) if duration_seconds > 0 else max(15.0, word_count / 2.2)

        # 1. Speaking Pace (Words Per Minute)
        wpm = round((word_count / (effective_duration / 60.0)), 1) if effective_duration > 0 else 0.0

        if wpm < 100:
            pace_status = "slow"
            pace_note = "Your speaking pace was relatively measured. You have room to expand with additional technical details."
        elif wpm > 165:
            pace_status = "fast"
            pace_note = "Your speaking pace was relatively fast. Consider pacing your explanations to give the interviewer time to absorb complex concepts."
        else:
            pace_status = "optimal"
            pace_note = "Your speaking pace was balanced and comfortable for conversational technical comprehension."

        # 2. Filler Word Detection
        filler_breakdown: Dict[str, int] = {}
        total_fillers = 0
        lower_text = text.lower()

        for pattern, label in FILLER_PATTERNS:
            matches = re.findall(pattern, lower_text, re.IGNORECASE)
            if matches:
                count = len(matches)
                filler_breakdown[label] = filler_breakdown.get(label, 0) + count
                total_fillers += count

        filler_ratio = (total_fillers / max(1, word_count)) * 100

        # 3. Measured Pauses Estimation
        # Detect ellipses, pause markers, or trailing phrases
        pause_matches = re.findall(r"(\.\.\.|—|\bpause\b|;\s)", text)
        pause_count = len(pause_matches)
        if effective_duration > 60 and word_count < 80:
            pause_count += int((effective_duration - (word_count / 2.0)) / 10)

        # 4. STAR Analysis (Behavioral Questions Only)
        star_structure = None
        if is_behavioral:
            detected_star: Dict[str, bool] = {}
            for component, phrases in STAR_KEYWORDS.items():
                detected = any(phrase in lower_text for phrase in phrases)
                detected_star[component] = detected

            star_score = int((sum(1 for v in detected_star.values() if v) / 4.0) * 100)
            star_structure = {
                "situation_detected": detected_star["situation"],
                "task_detected": detected_star["task"],
                "action_detected": detected_star["action"],
                "result_detected": detected_star["result"],
                "completeness_score": star_score,
                "missing_elements": [k.capitalize() for k, v in detected_star.items() if not v]
            }

        # 5. Clarity Score (Grounded 0-100)
        # Penalizes high filler density, rewards coherent structure and appropriate length
        base_clarity = 85
        if filler_ratio > 8:
            base_clarity -= 15
        elif filler_ratio > 4:
            base_clarity -= 8

        if word_count < 25:
            base_clarity -= 12
        elif word_count > 300:
            base_clarity -= 5

        clarity_score = max(45, min(95, base_clarity))

        # 6. Delivery Suggestions (Cautious, non-judgmental language)
        suggestions: List[str] = []
        if total_fillers >= 4:
            frequent_filler = max(filler_breakdown.items(), key=lambda x: x[1])[0]
            suggestions.append(
                f"You used '{frequent_filler}' {filler_breakdown[frequent_filler]} times. Replacing verbal fillers with a brief silent pause allows your message to land with more authority."
            )

        if pace_status == "fast":
            suggestions.append(
                "When detailing architecture and system trade-offs, pause between major points so the interviewer can digest your reasoning."
            )
        elif pace_status == "slow":
            suggestions.append(
                "Aim to state your headline takeaway earlier in your response to keep the answer engaging."
            )

        if is_behavioral and star_structure and star_structure["missing_elements"]:
            missing = ", ".join(star_structure["missing_elements"])
            suggestions.append(
                f"For behavioral questions, strengthening the {missing} component helps ground your personal impact in concrete outcomes."
            )

        if not suggestions:
            suggestions.append(
                "Your verbal delivery was clear, steady, and structured."
            )

        return {
            "speaking_pace_wpm": wpm,
            "pace_status": pace_status,
            "pace_note": pace_note,
            "filler_words_count": total_fillers,
            "filler_words_breakdown": filler_breakdown,
            "pause_count": pause_count,
            "total_duration_seconds": round(effective_duration, 1),
            "clarity_score": clarity_score,
            "star_structure": star_structure,
            "delivery_suggestions": suggestions
        }

    def aggregate_session_metrics(
        self,
        segment_metrics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Aggregates multi-question delivery metrics across a full interview session.
        """
        if not segment_metrics:
            return {
                "speaking_pace_wpm": 135.0,
                "pace_status": "optimal",
                "filler_words_count": 0,
                "filler_words_breakdown": {},
                "pause_count": 0,
                "total_duration_seconds": 0.0,
                "clarity_score": 85,
                "star_structure": None,
                "delivery_suggestions": [
                    "Practice verbal pacing by timing your responses to 90–120 seconds."
                ]
            }

        total_duration = sum(m.get("total_duration_seconds", 0) for m in segment_metrics)
        valid_wpms = [m.get("speaking_pace_wpm", 0) for m in segment_metrics if m.get("speaking_pace_wpm", 0) > 0]
        avg_wpm = round(sum(valid_wpms) / len(valid_wpms), 1) if valid_wpms else 135.0

        total_fillers = sum(m.get("filler_words_count", 0) for m in segment_metrics)
        combined_breakdown: Dict[str, int] = {}
        for m in segment_metrics:
            for k, v in m.get("filler_words_breakdown", {}).items():
                combined_breakdown[k] = combined_breakdown.get(k, 0) + v

        total_pauses = sum(m.get("pause_count", 0) for m in segment_metrics)
        clarity_scores = [m.get("clarity_score", 80) for m in segment_metrics]
        avg_clarity = round(sum(clarity_scores) / len(clarity_scores)) if clarity_scores else 80

        # Pacing determination
        if avg_wpm < 105:
            pace_status = "slow"
        elif avg_wpm > 165:
            pace_status = "fast"
        else:
            pace_status = "optimal"

        # Deduplicate suggestions across segments
        all_suggestions = []
        for m in segment_metrics:
            for s in m.get("delivery_suggestions", []):
                if s not in all_suggestions:
                    all_suggestions.append(s)

        # Check behavioral STAR coverage
        star_results = [m.get("star_structure") for m in segment_metrics if m.get("star_structure")]
        overall_star = None
        if star_results:
            overall_star = {
                "behavioral_questions_analyzed": len(star_results),
                "avg_completeness": round(sum(s.get("completeness_score", 0) for s in star_results) / len(star_results))
            }

        return {
            "speaking_pace_wpm": avg_wpm,
            "pace_status": pace_status,
            "filler_words_count": total_fillers,
            "filler_words_breakdown": combined_breakdown,
            "pause_count": total_pauses,
            "total_duration_seconds": round(total_duration, 1),
            "clarity_score": avg_clarity,
            "star_structure": overall_star,
            "delivery_suggestions": all_suggestions[:4]
        }


# Singleton instance
default_communication_service = CommunicationAnalysisService()
