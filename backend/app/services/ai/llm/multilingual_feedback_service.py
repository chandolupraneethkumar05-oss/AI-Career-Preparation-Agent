"""
Multilingual AI Feedback Localization Service
AI Career Preparation Agent

Localizes structured mock interview evaluation reports into Telugu (te) and Hindi (hi)
while strictly preserving standard English technical terms (Python, SQL, STAR, etc.).
Maintains strict language-independent evaluation scores and provides zero-loss fallback.
"""

import copy
import logging
from typing import Dict, Any, List, Optional

from ..languages import (
    SUPPORTED_FEEDBACK_LANGUAGES,
    DEFAULT_FEEDBACK_LANGUAGE,
    PRESERVED_TECHNICAL_TERMS,
    normalize_feedback_language,
    get_language_display_name
)

logger = logging.getLogger("multilingual_feedback")


class MultilingualFeedbackService:
    """
    Dedicated localization engine for structured interview feedback.
    Transforms feedback summaries, strengths, weaknesses, recommendations,
    and next best actions into authentic Telugu or Hindi while ensuring
    technical accuracy and evaluation independence.
    """

    def __init__(self):
        # Comprehensive mapping of common feedback concepts to authentic Telugu
        self._te_strength_templates = [
            ("STAR framework", "STAR framework (Situation, Task, Action, Result) పద్ధతిని సమర్థవంతంగా ఉపయోగించి నిర్మాణాత్మక సమాధానాలు ఇచ్చారు."),
            ("technical accuracy", "కోర్ కాన్సెప్ట్‌లు మరియు అల్గారిథమ్‌లలో స్పష్టమైన సాంకేతిక పరిజ్ఞానం (Technical Accuracy) కనబరిచారు."),
            ("system design", "ఆర్కిటెక్చర్ మరియు System Design లో స్కేలబిలిటీ ట్రేడ్-ఆఫ్స్ ను స్పష్టంగా వివరించారు."),
            ("problem solving", "సమస్య పరిష్కారంలో (Problem Solving) క్రమబద్ధమైన విశ్లేషణా విధానాన్ని ప్రదర్శించారు."),
            ("speaking pace", "స్పష్టమైన స్పీకింగ్ పేస్ (Speaking Pace / WPM) మరియు సమతుల్యమైన ప్రెజెంటేషన్ కనబరిచారు."),
            ("relevance", "ఇంటర్వ్యూయర్ అడిగిన ప్రశ్నకు సూటిగా మరియు ఖచ్చితమైన అంశాలతో సమాధానం ఇచ్చారు.")
        ]

        self._te_weakness_templates = [
            ("STAR", "బిహేవియరల్ ప్రశ్నలకు STAR framework ద్వారా నిర్దిష్టమైన Action మరియు కొలవదగిన Result పై మరింత దృష్టి పెట్టండి."),
            ("metrics", "ప్రాజెక్ట్ వివరణలలో క్వాంటిటేటివ్ మెట్రిక్స్ (latency, accuracy, throughput) స్పష్టంగా ప్రస్తావించండి."),
            ("trade-off", "సాంకేతిక పరిష్కారాన్ని ఎంచుకునే ముందు ప్రత్యామ్నాయాలు మరియు architectural trade-offs ను స్పష్టంగా వివరించండి."),
            ("edge cases", "సిస్టమ్ లోని failure modes మరియు edge cases ను లోతుగా విశ్లేషించడం సాధన చేయండి."),
            ("filler words", "సమాధానం ఇచ్చే సమయంలో filler words తగ్గించి purposeful pauses ఉపయోగించండి.")
        ]

        self._te_recommendations = [
            "బిహేవియరల్ మరియు ప్రాజెక్ట్ ప్రశ్నలకు STAR framework (Situation, Task, Action, Result) విధానాన్ని అనుసరించండి.",
            "ప్రాజెక్ట్ వివరణలలో ఖచ్చితమైన సాంకేతిక మెట్రిక్స్ (latency, accuracy, throughput, F1-Score) తప్పక చేర్చండి.",
            "ఎంచుకున్న పరిష్కారానికి ముందు ఇతర సాంకేతిక ప్రత్యామ్నాయాలు మరియు trade-offs ను స్పష్టంగా వివరించండి.",
            "కోర్ అల్గారిథమ్స్ మరియు డేటా స్ట్రక్చర్స్ కోసం రోజువారీ Daily Challenge సాధన చేయండి."
        ]

        # Comprehensive mapping to authentic Hindi
        self._hi_strength_templates = [
            ("STAR framework", "STAR framework (Situation, Task, Action, Result) का उपयोग करके स्पष्ट और संरचित उत्तर प्रस्तुत किए।"),
            ("technical accuracy", "कोर कॉन्सेप्ट्स और एल्गोरिदम में ठोस तकनीकी सटीकता (Technical Accuracy) प्रदर्शित की।"),
            ("system design", "सिस्टम डिज़ाइन और आर्किटेक्चरल ट्रेड-ऑफ़ (System Design & Scalability) को अच्छी तरह समझाया।"),
            ("problem solving", "समस्या समाधान (Problem Solving) में व्यवस्थित विश्लेषणात्मक दृष्टिकोण दिखाया।"),
            ("speaking pace", "संतुलित और स्पष्ट बोलने की गति (Speaking Pace / WPM) बनाए रखी।"),
            ("relevance", "साक्षात्कारकर्ता के प्रश्नों का सीधा और प्रासंगिक उत्तर दिया।")
        ]

        self._hi_weakness_templates = [
            ("STAR", "व्यवहारिक प्रश्नों में STAR framework के तहत विशिष्ट Action और मापने योग्य Result पर अधिक ध्यान दें।"),
            ("metrics", "प्रोजेक्ट स्पष्टीकरण में ठोस तकनीकी मेट्रिक्स (latency, throughput, accuracy) अवश्य शामिल करें।"),
            ("trade-off", "अंतिम समाधान चुनने से पहले विभिन्न तकनीकी विकल्पों और architectural trade-offs पर चर्चा करें।"),
            ("edge cases", "एल्गोरिदम में edge cases और विफलता परिदृश्यों (failure modes) का गहराई से विश्लेषण करें।"),
            ("filler words", "उत्तर देते समय filler words को कम करें और विचारशील ठहराव (purposeful pauses) का अभ्यास करें।")
        ]

        self._hi_recommendations = [
            "व्यवहारिक और प्रोजेक्ट प्रश्नों के लिए STAR framework (Situation, Task, Action, Result) का पालन करें।",
            "प्रोजेक्ट के परिणामों को समझाने के लिए ठोस मेट्रिक्स (latency, accuracy, throughput, F1-Score) का उपयोग करें।",
            "तकनीकी समाधान का चयन करते समय अन्य विकल्पों और architectural trade-offs का स्पष्ट उल्लेख करें।",
            "तकनीकी अवधारणाओं को सुदृढ़ करने के लिए दैनिक अभ्यास (Daily Challenge) पूरा करें।"
        ]

    def localize_feedback_report(
        self,
        feedback_dict: Dict[str, Any],
        target_language: str = "en"
    ) -> Dict[str, Any]:
        """
        Translates structured feedback into target language (en, te, hi).
        Leaves evaluation scores, rubric numbers, and skill gaps untouched.
        Guarantees fallback to English if any issue occurs.
        """
        normalized_lang = normalize_feedback_language(target_language)
        
        # Deep copy to ensure no side effects on original dictionary
        localized = copy.deepcopy(feedback_dict)

        # English requires no translation
        if normalized_lang == "en":
            localized["feedback_language"] = "en"
            localized["fallback_notice"] = None
            return localized

        try:
            role = localized.get("role") or localized.get("target_role") or "Machine Learning Engineer"
            overall_score = localized.get("overall_score", 75)
            passed = localized.get("passed", overall_score >= 60)
            original_summary = localized.get("feedback_summary", "")

            # 1. Localize Summary
            if normalized_lang == "te":
                readiness_text = "పోటీతత్వ ఉద్యోగ సంసిద్ధతను కనబరిచిన అద్భుతమైన ప్రదర్శన!" if overall_score >= 75 else "మంచి పునాది ప్రయత్నం. మరింత లోతైన సాంకేతిక విశ్లేషణతో మీ నైపుణ్యాలను మరింత మెరుగుపరచుకోవచ్చు."
                localized_summary = (
                    f"మీరు మీ {role} మాక్ ఇంటర్వ్యూను {overall_score}/100 స్కోరుతో విజయవంతంగా పూర్తి చేశారు. "
                    f"{readiness_text} "
                    f"తదుపరి ప్రాధాన్యత: క్రమబద్ధమైన సాంకేతిక సాధన మరియు STAR framework అనుసరణ."
                )
            elif normalized_lang == "hi":
                readiness_text = "सराहनीय प्रदर्शन जो प्रतिस्पर्धी जॉब तत्परता को दर्शाता है!" if overall_score >= 75 else "अच्छा बुनियादी प्रयास। गहरे तकनीकी विश्लेषण और ट्रेड-ऑफ स्पष्टीकरण से इसमें और सुधार किया जा सकता है।"
                localized_summary = (
                    f"आपने अपना {role} मॉक इंटरव्यू {overall_score}/100 के कुल स्कोर के साथ पूरा किया। "
                    f"{readiness_text} "
                    f"मुख्य प्राथमिकता: निरंतर तकनीकी अभ्यास और STAR framework का पालन।"
                )
            localized["feedback_summary"] = localized_summary

            # 2. Localize Strengths (preserving English technical terms)
            raw_strengths = localized.get("strengths", [])
            localized["strengths"] = self._localize_items(
                items=raw_strengths,
                language=normalized_lang,
                category="strength",
                role=role
            )

            # 3. Localize Weaknesses (preserving English technical terms)
            raw_weaknesses = localized.get("weaknesses", [])
            localized["weaknesses"] = self._localize_items(
                items=raw_weaknesses,
                language=normalized_lang,
                category="weakness",
                role=role
            )

            # 4. Localize Recommendations
            localized["recommendations"] = self._get_localized_recommendations(normalized_lang)

            # 5. Localize Next Best Action
            nba = localized.get("next_best_action")
            if isinstance(nba, dict):
                localized["next_best_action"] = self._localize_next_best_action(nba, normalized_lang, role)

            # 6. Localize Communication / Delivery suggestions if present
            comm_metrics = localized.get("communication_metrics")
            if isinstance(comm_metrics, dict) and "suggestions" in comm_metrics:
                comm_metrics["suggestions"] = self._localize_delivery_suggestions(
                    comm_metrics["suggestions"], normalized_lang
                )

            localized["feedback_language"] = normalized_lang
            localized["fallback_notice"] = None
            return localized

        except Exception as err:
            logger.warning(
                f"Localization to '{target_language}' failed: {err}. Gracefully falling back to English."
            )
            # Safe fallback: return original English feedback with fallback notice
            fallback_copy = copy.deepcopy(feedback_dict)
            fallback_copy["feedback_language"] = "en"
            display_name = get_language_display_name(target_language)
            fallback_copy["fallback_notice"] = (
                f"Feedback generated in English ({display_name} feedback temporarily unavailable)."
            )
            return fallback_copy

    def _localize_items(
        self,
        items: List[str],
        language: str,
        category: str,
        role: str
    ) -> List[str]:
        """Localizes bullet points while preserving technical tokens in English."""
        if not items:
            if language == "te":
                return [f"{role} ఇంటర్వ్యూ ప్రశ్నలకు వృత్తిపరమైన దృక్పథంతో సమాధానాలు ఇచ్చారు."] if category == "strength" else ["ఆర్కిటెక్చరల్ trade-offs ను మరింత లోతుగా విశ్లేషించండి."]
            elif language == "hi":
                return [f"{role} साक्षात्कार में पेशेवर रुख के साथ सभी उत्तर पूरे किए।"] if category == "strength" else ["आर्किटेक्चरल trade-offs का और गहराई से विश्लेषण जारी रखें।"]
            return items

        templates = (self._te_strength_templates if category == "strength" else self._te_weakness_templates) if language == "te" else (self._hi_strength_templates if category == "strength" else self._hi_weakness_templates)

        localized_items = []
        for orig in items:
            matched = False
            orig_lower = orig.lower()
            for key, templ in templates:
                if key.lower() in orig_lower:
                    localized_items.append(templ)
                    matched = True
                    break
            if not matched:
                # Retain original technical content wrapped in localized framing
                if language == "te":
                    if category == "strength":
                        localized_items.append(f"{orig} లో అభినందనీయమైన పరిజ్ఞానాన్ని కనబరిచారు.")
                    else:
                        localized_items.append(f"{orig} పై మరింత లోతైన దృష్టి సారించండి.")
                elif language == "hi":
                    if category == "strength":
                        localized_items.append(f"{orig} में सराहनीय तकनीकी समझ प्रदर्शित की।")
                    else:
                        localized_items.append(f"{orig} पर अधिक ध्यान देने की आवश्यकता है।")
                else:
                    localized_items.append(orig)

        return localized_items[:4]

    def _get_localized_recommendations(self, language: str) -> List[str]:
        """Returns standard localized recommendations."""
        if language == "te":
            return self._te_recommendations
        elif language == "hi":
            return self._hi_recommendations
        return [
            "Structure answers with the STAR framework (Situation, Task, Action, Result) for behavioral and project questions.",
            "Incorporate quantifiable business or technical metrics (e.g. latency, accuracy, throughput) in project explanations.",
            "Explicitly evaluate alternative technical options and trade-offs before settling on your chosen solution.",
            "Practice targeted Daily Challenges to bridge active concept gaps."
        ]

    def _localize_next_best_action(
        self,
        nba: Dict[str, Any],
        language: str,
        role: str
    ) -> Dict[str, Any]:
        """Translates next best action card while keeping route intact."""
        route = nba.get("route", "/daily-challenge")
        orig_title = nba.get("title", "")
        
        if language == "te":
            action_label = "ఛాలెంజ్ ప్రారంభించండి" if "/daily-challenge" in route else "రౌండ్ కాన్ఫిగర్ చేయండి"
            if "Skill Gap" in orig_title:
                title = f"{orig_title} నైపుణ్య లోటును భర్తీ చేయండి"
                reason = "ఇంటర్వ్యూ ఫలితాలలో గుర్తించబడిన నైపుణ్య లోటును సరిదిద్దడానికి 10 నిమిషాల లక్ష్య సాధన చేయండి."
            elif "Advanced" in orig_title or "Mock" in orig_title:
                title = f"అడ్వాన్స్‌డ్ {role} మాక్ రౌండ్ ప్రాక్టీస్ చేయండి"
                reason = "ఉన్నత స్థాయి సంసిద్ధత కనబరిచారు! అధునాతన ఆర్కిటెక్చరల్ రౌండ్లకు ముందుకు సాగండి."
            else:
                title = f"రోజువారీ సాంకేతిక డ్రిల్స్ సాధన చేయండి"
                reason = f"{role} నియామక ప్రమాణాలకు అనుగుణంగా మీ సాంకేతిక పరిజ్ఞానాన్ని బలోపేతం చేసుకోండి."
        elif language == "hi":
            action_label = "अभ्यास शुरू करें" if "/daily-challenge" in route else "राउंड सेट करें"
            if "Skill Gap" in orig_title:
                title = f"{orig_title} स्किल गैप को पूरा करें"
                reason = "साक्षात्कार परिणामों में पहचानी गई कमी को दूर करने के लिए 10 मिनट का केंद्रित अभ्यास करें।"
            elif "Advanced" in orig_title or "Mock" in orig_title:
                title = f"उन्नत {role} मॉक राउंड का अभ्यास करें"
                reason = "उच्च स्तर की तत्परता प्रदर्शित! उन्नत आर्किटेक्चरल राउंड में आगे बढ़ें।"
            else:
                title = f"दैनिक तकनीकी अभ्यास पूरा करें"
                reason = f"{role} भर्ती मानकों के लिए अपने तकनीकी ज्ञान को सुदृढ़ करें।"
        else:
            return nba

        return {
            "title": title,
            "action": action_label,
            "route": route,
            "reason": reason
        }

    def _localize_delivery_suggestions(self, suggestions: List[str], language: str) -> List[str]:
        """Translates delivery and communication suggestions into Telugu or Hindi."""
        localized = []
        for sug in suggestions:
            s_lower = sug.lower()
            if language == "te":
                if "pace" in s_lower or "wpm" in s_lower:
                    localized.append("మాట్లాడే వేగం (Speaking Pace / WPM) సమతుల్యంగా ఉంది; సంక్లిష్ట వివరణల సమయంలో ఇదే వేగాన్ని కొనసాగించండి.")
                elif "filler" in s_lower:
                    localized.append("తక్కువ filler words ఉపయోగించారు; పదాల మధ్య purposeful pauses ఇవ్వడం కొనసాగించండి.")
                elif "star" in s_lower:
                    localized.append("STAR framework గమనించబడింది: Situation నుండి Result వరకు స్పష్టమైన పురోగతి ఉంది.")
                else:
                    localized.append(f"{sug}")
            elif language == "hi":
                if "pace" in s_lower or "wpm" in s_lower:
                    localized.append("बोलने की गति (Speaking Pace / WPM) संतुलित थी; जटिल अवधारणाओं को समझाते समय यही गति बनाए रखें।")
                elif "filler" in s_lower:
                    localized.append("Filler words की संख्या कम रही; अनपेक्षित शब्दों के स्थान पर purposeful pauses का उपयोग जारी रखें।")
                elif "star" in s_lower:
                    localized.append("STAR framework देखा गया: Situation से Result तक स्पष्ट और संरचित प्रवाह।")
                else:
                    localized.append(f"{sug}")
            else:
                localized.append(sug)
        return localized


# Singleton instance
multilingual_feedback_service = MultilingualFeedbackService()
