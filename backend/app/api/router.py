"""
Unified API Router
AI Career Preparation Agent — Academic IDP Project
Student: Chandolu Praneeth Kumar (241FA18483)
"""

from fastapi import APIRouter

from .routes.profile import router as profile_router
from .routes.activities import router as activities_router
from .routes.interviews import router as interviews_router
from .routes.skills import router as skills_router
from .routes.challenges import router as challenges_router
from .routes.progress import router as progress_router
from .routes.recommendations import router as recommendations_router
from .reminders import router as reminders_router
from .resume import router as resume_router
from .routes.ai import router as ai_router
from .routes.skill_arena import router as skill_arena_router
from .routes.experiences import router as experiences_router
from .routes.career_journey import router as career_journey_router
from .routes.weekly_reports import router as weekly_reports_router
from .routes.goals import router as goals_router
from .routes.feedback import router as feedback_router

api_router = APIRouter(prefix="/api")

# Register all modular domain routers
api_router.include_router(profile_router)
api_router.include_router(activities_router)
api_router.include_router(interviews_router)
api_router.include_router(skills_router)
api_router.include_router(challenges_router)
api_router.include_router(progress_router)
api_router.include_router(recommendations_router)
api_router.include_router(ai_router)
api_router.include_router(skill_arena_router)
api_router.include_router(experiences_router)
api_router.include_router(career_journey_router)
api_router.include_router(weekly_reports_router)
api_router.include_router(goals_router)
api_router.include_router(feedback_router)

# Register existing proactive reminder & resume parsing endpoints
api_router.include_router(reminders_router)
api_router.include_router(resume_router)
