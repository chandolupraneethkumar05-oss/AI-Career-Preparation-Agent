"""
Unit Tests for Neural Semantic Answer Evaluator
AI Career Preparation Agent
"""

import unittest
from backend.app.services.ai.evaluation import default_semantic_evaluator


class TestNeuralSemanticEvaluator(unittest.TestCase):
    def setUp(self):
        self.evaluator = default_semantic_evaluator

    def test_minimal_answer_penalized(self):
        """Very short or empty answers should receive honest low scores without crashing."""
        res = self.evaluator.evaluate(
            question_text="Explain database indexing and B-Trees.",
            answer_text="dunno",
            expected_skill="SQL & Databases"
        )
        self.assertEqual(res["overall_score"], 30)
        self.assertFalse(res["passed"])
        self.assertIn("too brief", res["weaknesses"][0].lower())

    def test_nonsense_with_buzzwords_not_artificially_boosted(self):
        """
        Nonsense sentences that include words like 'tradeoff' and numbers
        should not receive high scores, unlike legacy string-length heuristics.
        """
        nonsense = "My dog had 95% tradeoff however 20ms cat potato."
        res = self.evaluator.evaluate(
            question_text="How do you handle class imbalance in machine learning?",
            answer_text=nonsense,
            expected_skill="Machine Learning"
        )
        # Because semantic similarity to ML class imbalance is very low, score remains failing
        self.assertLess(res["technical_accuracy"], 60)
        self.assertFalse(res["passed"])

    def test_strong_technical_answer_evaluated_fairly(self):
        """
        Rigorous engineering answer with concrete trade-offs and metrics
        should achieve passing score and extract genuine trade-offs.
        """
        strong_answer = (
            "To handle extreme class imbalance (e.g. 0.5% fraud rate), standard accuracy gives a misleading diagnostic. "
            "I prioritize PR-AUC over ROC-AUC because it focuses on positive class precision without being inflated by true negatives. "
            "I implement SMOTE for minority oversampling or cost-sensitive focal loss during training. "
            "In production, I tune classification thresholds to minimize financial loss asymmetry, reducing false negatives by 24% at the cost of a 3% false alarm increase."
        )
        res = self.evaluator.evaluate(
            question_text="How do you handle extreme class imbalance in fraud detection models?",
            answer_text=strong_answer,
            expected_skill="Machine Learning",
            target_role="Machine Learning Engineer"
        )
        self.assertGreaterEqual(res["overall_score"], 65)
        self.assertTrue(res["passed"])
        self.assertTrue(res["tradeoffs_detected"])
        self.assertTrue(res["metrics_detected"])
        self.assertGreater(res["semantic_similarity"], 0.30)
        self.assertEqual(res["recommended_follow_up"]["type"], "deeper_technical" if res["overall_score"] >= 80 else "scenario_application")


if __name__ == "__main__":
    unittest.main()
