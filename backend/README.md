# AI Career Preparation Agent — FastAPI + SQLite Backend

---

## 🏛️ Architecture Overview

The backend serves as the persistent intelligence layer for the AI Career Preparation Agent:

```
┌───────────────────────────────────────────────────────────┐
│                    REACT 19 + VITE UI                     │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP REST / JSON (port 5173 -> 8000)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                      │
│                                                           │
│  [Unified Router]                                         │
│   ├── /api/profile        (Candidate profile & targets)   │
│   ├── /api/activities     (Canonical XP & streak engine)  │
│   ├── /api/interviews     (Mock interviews & rubrics)     │
│   ├── /api/skills         (6-Axis radar & skill gaps)     │
│   ├── /api/challenges     (Daily conceptual drills)       │
│   ├── /api/progress       (Dashboard aggregation & NBA)   │
│   ├── /api/recommendations(Next-Best-Action engine)       │
│   ├── /api/reminders      (Proactive reminder scheduler)  │
│   └── /api/resume         (ATS token & keyword extractor) │
│                                                           │
│  [Service Layer]                                          │
│   ├── activity_service.py (Streak & XP calculation)       │
│   ├── interview_service.py(Rubric evaluation & feedback)  │
│   ├── skill_service.py    (Competency gap tracking)       │
│   ├── challenge_service.py(Dynamic drill generator)       │
│   ├── recommendation_service.py (7-rule decision engine)  │
│   └── progress_service.py (Dashboard aggregation)         │
│                                                           │
│  [Database Layer: SQLAlchemy ORM]                         │
│   └── career_agent.db (SQLite Database)                   │
└───────────────────────────────────────────────────────────┘
```

---

## 🗄️ Relational Database Models (`career_agent.db`)

1. **`users`**: Primary candidate identity, total XP, current level, consecutive streak, longest streak.
2. **`profiles`**: Biography, target company, career track, and resume headlines.
3. **`activities`**: Immutable preparation audit trail (`interview_completed`, `challenge_completed`, `resume_analyzed`, `skill_activity_completed`).
4. **`interviews`**: Mock interview session records, scores (0-100), rubric breakdown, question-answer transcripts.
5. **`skills`**: Core domain taxonomy (Machine Learning, PyTorch, Docker, Kubernetes, Communication, System Design).
6. **`skill_gaps`**: Candidate-specific competency levels, target scores, and gap priorities (high, medium, low).
7. **`challenges`**: Daily conceptual drill submissions, keyword matching scores, and awarded XP.
8. **`achievements`**: Dynamic milestone badges and progress tracking.
9. **`recommendations`**: AI Next-Best-Action decisions with explainable rationale.
10. **`reminder_preferences`**: Proactive notification scheduling preferences.

---

## 🚀 Running the Backend

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation (Swagger UI) is available at:
- **`http://127.0.0.1:8000/docs`**
- **`http://127.0.0.1:8000/redoc`**
