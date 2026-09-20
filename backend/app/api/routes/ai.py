"""
AI Career Intelligence API Endpoints
AI Career Preparation Agent
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.ai import (
    AskAIRequest,
    AskAIResponse,
    KnowledgeSourcesResponse,
    AIStatusResponse
)
from ...services.ai.ai_orchestrator import ai_orchestrator

router = APIRouter(prefix="/ai", tags=["AI Career Intelligence & RAG"])


@router.post("/ask", response_model=AskAIResponse)
def ask_career_assistant(
    payload: AskAIRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate career/technical question using RAG retrieval over
    curated career preparation curriculum and personalizes response using candidate career context.
    """
    if not payload.message or len(payload.message.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query message must contain at least 2 characters.")

    try:
        response = ai_orchestrator.process_query(request=payload, db=db)
        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI Assistant execution failed: {str(exc)}")


@router.get("/sources", response_model=KnowledgeSourcesResponse)
def get_knowledge_sources():
    """Returns catalog of all 18 indexed RAG curriculum knowledge categories and topics."""
    return ai_orchestrator.get_knowledge_sources_summary()


@router.get("/status", response_model=AIStatusResponse)
def get_ai_status():
    """Returns operational status of the RAG retrieval engine and LLM provider."""
    return ai_orchestrator.get_ai_status()
