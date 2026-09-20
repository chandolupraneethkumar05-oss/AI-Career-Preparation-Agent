"""
Embedding Service Abstraction & Local Implementation
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483) — Vignan University

Provides a clean provider abstraction for text embeddings:
- BaseEmbeddingService (ABC)
- LocalTfidfEmbeddingService: Uses scikit-learn TfidfVectorizer for deterministic,
  zero-cost, sub-millisecond local vector representations.
- APIEmbeddingService: Extensible adapter for remote embedding endpoints.
"""

import os
from abc import ABC, abstractmethod
from typing import List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from .knowledge_base import KNOWLEDGE_CHUNKS


class BaseEmbeddingService(ABC):
    """Abstract Base Class for text embedding generation."""

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Embeds a single string into a float vector."""
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embeds a list of strings into a list of float vectors."""
        pass

    @abstractmethod
    def compute_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Computes cosine similarity between two float vectors (0.0 to 1.0)."""
        pass


class LocalTfidfEmbeddingService(BaseEmbeddingService):
    """
    Local TF-IDF vectorizer fitted across career knowledge base corpus.
    Produces L2-normalized dense embeddings without requiring external API keys
    or heavy multi-gigabyte neural checkpoints.
    """

    def __init__(self, corpus: Optional[List[str]] = None):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
            lowercase=True,
            min_df=1
        )
        if corpus is None:
            corpus = [
                f"{chunk['title']} {chunk['category']} {chunk['topic']} {chunk['content']}"
                for chunk in KNOWLEDGE_CHUNKS
            ]
        self.vectorizer.fit(corpus)

    def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * len(self.vectorizer.get_feature_names_out())
        sparse_vec = self.vectorizer.transform([text])
        dense_arr = sparse_vec.toarray()[0]
        norm = np.linalg.norm(dense_arr)
        if norm > 0:
            dense_arr = dense_arr / norm
        return dense_arr.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        sparse_mat = self.vectorizer.transform(texts)
        dense_mat = sparse_mat.toarray()
        norms = np.linalg.norm(dense_mat, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normalized = dense_mat / norms
        return normalized.tolist()

    def compute_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        arr_a = np.array(vec_a)
        arr_b = np.array(vec_b)
        dot = float(np.dot(arr_a, arr_b))
        return max(0.0, min(1.0, dot))


class APIEmbeddingService(BaseEmbeddingService):
    """
    Extensible adapter for external cloud embedding APIs (e.g. OpenAI text-embedding-3-small).
    Falls back gracefully to LocalTfidfEmbeddingService if credentials are unset.
    """

    def __init__(self):
        self._fallback = LocalTfidfEmbeddingService()
        self.api_key = os.getenv("OPENAI_API_KEY")

    def embed_text(self, text: str) -> List[float]:
        if not self.api_key:
            return self._fallback.embed_text(text)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            res = client.embeddings.create(input=text, model="text-embedding-3-small")
            return res.data[0].embedding
        except Exception:
            return self._fallback.embed_text(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key:
            return self._fallback.embed_batch(texts)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            res = client.embeddings.create(input=texts, model="text-embedding-3-small")
            return [d.embedding for d in res.data]
        except Exception:
            return self._fallback.embed_batch(texts)

    def compute_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        arr_a = np.array(vec_a)
        arr_b = np.array(vec_b)
        norm_a = np.linalg.norm(arr_a)
        norm_b = np.linalg.norm(arr_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(arr_a, arr_b) / (norm_a * norm_b))


def get_embedding_service() -> BaseEmbeddingService:
    """Factory creating configured embedding service singleton."""
    provider = os.getenv("EMBEDDING_PROVIDER", "local").lower()
    if provider in ["openai", "api"] and os.getenv("OPENAI_API_KEY"):
        return APIEmbeddingService()
    return LocalTfidfEmbeddingService()


# Shared singleton instance
default_embedding_service = get_embedding_service()
