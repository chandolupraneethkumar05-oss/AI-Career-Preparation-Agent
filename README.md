# AI Career Preparation Agent 🤖🎯

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.13-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Academic%20Project-IDP%20Functional%20Prototype-7C3AED)]()

> An autonomous, closed-loop AI career preparation system that bridges resume ATS audits, adaptive multi-round mock interviews, competency radar profiling, and proactive daily retention workflows.

---

## 🎓 Academic Project Information

- **Project Title:** AI Career Preparation Agent
- **Student Name:** Chandolu Praneeth Kumar
- **Registration Number:** `241FA18483`
- **Department:** Artificial Intelligence & Machine Learning (AIML)
- **Course:** MLOPS
- **Academic Year:** 3rd Year — I Semester
- **Institution:** Vignan's Foundation for Science, Technology & Research (Vignan University)
- **Project Category:** Industry Defined Project (IDP) / Functional Prototype

---

## 🌟 System Architecture & Closed-Loop Workflow

Unlike passive chatbots or static mock question banks, the **AI Career Preparation Agent** operates as an autonomous, stateful agent with a closed feedback loop:

```
                  ┌─────────────────────────────────────┐
                  │          1. PERCEPTION              │
                  │   Resume Upload (PDF / TXT / MD)    │
                  │     ATS Keyword & Skill Parsing     │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │          2. EVALUATION              │
                  │   Adaptive 5-Question Mock Rounds   │
                  │ Dynamic Difficulty (Beginner→Staff) │
                  │  Granular Rubric Dimension Scoring  │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │       3. SKILL GAP ISOLATION        │
                  │     6-Axis SVG Competency Radar     │
                  │  Priority Tiering (High / Med / Low)│
                  │   Blended ATS + Interview Scoring   │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │     4. AUTONOMOUS DECISION ENGINE   │
                  │   Next-Best-Action Synthesis (NBA)  │
                  │      Transparent Rule Rationale     │
                  │   Weakness-Targeted Daily Drills    │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │        5. PROACTIVE RETENTION       │
                  │   Deterministic Calendar Day Streak │
                  │   FastAPI Async Background Scheduler│
                  │  Proactive Daily Email Dispatcher   │
                  │   (Suppressed once practiced today) │
                  └─────────────────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. Unified Storage & Activity Logging Layer
- **Centralized Persistence:** Unified atomic service (`src/utils/storage/storageService.js`) maintaining persistent storage keys for user profiles, interview histories, ATS results, skill profiles, and reminder preferences.
- **Deterministic Streak Engine:** Calculates real, calendar-day consecutive activity streaks (`src/utils/activityService.js`). Streaks only increment upon verified activities (`interview_completed`, `challenge_completed`, `ats_scanned`), preventing arbitrary client-side spoofing.
- **Real Metrics & Empty States:** Eliminates fake static numbers (e.g. fake "14 interviews" or "86 questions"). New candidates see honest diagnostic onboarding empty states that unlock as they practice.

### 2. Genuine ATS Resume Analysis Pipeline
- **Production Document Extraction:** Multi-format document parser (`backend/app/services/resume_extractor.py`) supporting PDF (via PyMuPDF `fitz`), DOCX (via `python-docx`), TXT, and Markdown files.
- **Magic Byte & Safety Validation:** Validates file magic signatures (`%PDF`, `PK\x03\x04`), rejects unsupported binaries (`.exe`, `.zip`), enforces a 10MB upload ceiling, and gracefully handles 0-byte or corrupted documents.
- **Scanned PDF Detection:** Identifies non-extractable image-based PDFs and informs the candidate with clear diagnostic guidance rather than failing silently.
- **Canonical Skill Extraction:** Rule-based knowledge taxonomy (`backend/app/services/skill_taxonomy.py`) featuring word-boundary regex guards and extensive alias mapping (`sklearn` → `Scikit-learn`, `k8s` → `Kubernetes`, `tf` → `TensorFlow`, `postgres` → `PostgreSQL`, etc.) preventing false duplicates.
- **Explainable ATS-Style Scoring (0-100):** Transparent 5-tier evaluation rubric:
  - *Skill Match (40 pts):* Ratio of matched core (25 pts) and important (15 pts) competencies.
  - *Target-Role Alignment (25 pts):* Role title match and domain terminology density.
  - *Projects & Implementation (15 pts):* Verified projects section, experience section, and quantifiable metric terms.
  - *Resume Completeness (10 pts):* Section coverage across Experience, Education, Skills, and Projects.
  - *Keyword Density & Structure (10 pts):* Technology token density without keyword stuffing.
  *(Disclaimer: Transparent educational ATS-style rubric model, not a commercial proprietary vendor score).*
- **Closed-Loop Career Synchronization:**
  - Auto-syncs missing core skills to `skill_gaps` table as **High Priority** (score 40).
  - Auto-syncs missing important skills as **Medium Priority** (score 55).
  - Awards canonical **+35 XP** and updates consecutive calendar-day streak.
  - Triggers Autonomous Agent Decision Engine to re-evaluate Next-Best-Action (NBA) and personalize daily conceptual challenges.
- **Privacy & Data Protection:** Candidate full raw resume text is parsed in memory and never stored unencrypted in database columns or emitted to server logs. Multi-user isolation guarantees candidates can only access their own analyses.

### 3. Competency Radar & Skill Gap Analyzer
- **Zero-Dependency SVG Radar Chart:** Visualizes 6 core dimensions: Technical Knowledge, Problem Solving, Communication (STAR), Confidence & Delivery, Relevance, and System Design.
- **Dynamic Feedback Blending:** Integrates recent mock rounds and missing ATS keywords into three actionable tiers (High Priority, Medium Priority, Low Priority).

### 4. Autonomous Agent Decision Engine
- **Next-Best-Action (NBA):** Synthesizes candidate state to prescribe the highest-yield immediate action (e.g., STAR Behavioral Drill, SQL Aggregation Drill, or Advanced Architectural Escalation).
- **Explainable Rationale:** Provides transparent reasoning explaining *why* the coach made each recommendation.
- **Personalized Daily Drills:** Generates daily challenges specifically addressing candidate's weakest evaluated dimension.

### 5. FastAPI Proactive Reminder Microservice
- **Background Scheduler:** Asynchronous asyncio background worker (`backend/app/services/scheduler.py`) periodically verifying candidate preparation status.
- **Anti-Spam Intelligence:** Automatically suppresses reminders if candidate has already practiced on the current calendar day.
- **Branded Notification Templates:** High-impact responsive HTML emails featuring candidate streak status, target role, and 5-minute drill prompt.
- **Development & Live Dispatch Modes:** Seamlessly toggles between live SMTP delivery and rich console development simulation.

### 6. Video Interview & Interview Recording (Phase 15)
- **Recruiter-Style Video Simulation:** Candidate can select between **Text Interview** and **Video Interview** modes during session setup.
- **Graceful Device Fallback:** Clear permissions hierarchy: Video + Audio $\rightarrow$ Audio-Only $\rightarrow$ Text Interview escape hatch.
- **Live Camera & Audio Monitoring:** Responsive HTML5 video mirror preview paired with a Web Audio API (`AudioContext` + `AnalyserNode`) microphone level visualizer.
- **Non-Distracting In-Session Recording:** Browser `MediaRecorder` captures answer audio/video with a subtle, non-intrusive recording indicator and answer timer. Strictly eliminates fake emotional/facial overlays while speaking.
- **Speech-to-Text Transcription:** Real-time verbal answer transcription via Web Speech API with an editable transcript box prior to answer submission.
- **Honest Communication Metrics Engine:** Computes real speaking pace (WPM), canonical filler word detection (`um`, `uh`, `like`, `you know`, `actually`, `basically`), pause tracking, clarity score, and STAR structure detection (Situation, Task, Action, Result) for behavioral scenarios.
- **User-Isolated Storage Abstraction:** Server-side recordings stored in isolated candidate paths (`backend/storage/recordings/{user_id}/{session_id}/`) with HTTP Range chunk streaming generator (`bytes=start-end`) for smooth HTML5 video seeking.
- **Recording Review Player:** Integrated player with seek bar, volume control, playback speed controls (1x, 1.25x, 1.5x), and question timeline jump links.
- **Permanent Delete Protection:** User-isolated deletion endpoint unlinking media files while keeping interview scores, rubric evaluations, and skill progress permanently preserved.
- **Theme Consistency:** Styled natively across all three natural themes (**Nordic Muted Graphite & Fog**, **Slate Minimalist**, and **Warm Stone & Greige**).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19 + Vite 8 | Ultra-fast client application with Hot Module Replacement |
| **Styling & UI** | Tailwind CSS v4 + Lucide React | Futuristic Purple (`#7C3AED`) + Cyan (`#06B6D4`) glassmorphic theme |
| **State & Navigation** | Context API + React Router v7 | Persistent auth, mock interview session, and setup states |
| **Data Visualization** | Custom SVG Components | Zero-dependency responsive line charts, radars, and score rings |
| **Backend API** | FastAPI + Python 3.13 | High-performance asynchronous microservice |
| **Validation** | Pydantic v2 | Type-safe request and response validation |
| **Concurrency** | Asyncio Background Tasks | Non-blocking scheduling loop for proactive reminders |
| **Linting & Quality** | Oxlint | Fast Rust-based JavaScript linter (0 errors) |

---

## 💻 Getting Started & Local Setup

### Prerequisites
- **Node.js:** v18.0 or higher
- **Python:** v3.10 or higher

### 1. Frontend Setup
```bash
# Clone the repository
git clone https://github.com/chandolupraneethkumar05-oss/AI-Career-Preparation-Agent.git
cd AI-Career-Preparation-Agent

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will launch at `http://localhost:5173/`.

### 2. Backend Setup
```bash
# In a separate terminal, navigate to backend
cd backend

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --port 8000 --reload
```
The backend API documentation will be available at `http://127.0.0.1:8000/docs`.

---

## 🧪 Verification & Demonstration Workflow

To experience the complete autonomous user journey:

1. **New User Registration:**
   - Navigate to `/signup` $\rightarrow$ create a profile.
   - Notice that the Dashboard initially shows clean diagnostic onboarding states (0 streak, 0 interviews, uncalibrated radar).

2. **Resume Audit (ATS Scanner):**
   - Navigate to `/ats` $\rightarrow$ upload a resume or paste your text.
   - Watch the agent extract matched skills and missing keywords, log `+35 XP`, and record the `ats_scanned` activity.

3. **Autonomous Recommendation Update:**
   - Return to `/dashboard` $\rightarrow$ notice the AI Coach recommendation adapts immediately to your ATS score and urges you to take your first diagnostic interview.

4. **Adaptive Mock Interview:**
   - Navigate to `/interview-setup` $\rightarrow$ start a 5-question mock session.
   - Experience dynamic difficulty scaling based on your answer scores.
   - Complete the interview $\rightarrow$ receive granular rubrics on `/interview-feedback`.

5. **Skill Gap Radar Calibration:**
   - Navigate to `/skill-gap` $\rightarrow$ inspect the calibrated 6-axis SVG Radar Chart blending your ATS keywords and interview scores.

6. **Daily Challenge & Deterministic Streak:**
   - Navigate to `/daily-challenge` $\rightarrow$ complete today's personalized drill.
   - Observe the calendar day streak increment to `1 Day` and XP increase.

7. **Proactive Daily Reminder Dispatch:**
   - Navigate to `/settings` $\rightarrow$ configure your reminder preferences and click **Dispatch Test Reminder**.
   - Inspect the rendered HTML email preview verified via the FastAPI backend loop.

---

## 📊 ATS Resume Analysis Pipeline: Technical Specifications

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resume/analyze` | Uploads PDF/DOCX (or raw text), runs full extraction, scores against target role, auto-syncs skill gaps, and awards +35 XP. |
| `GET` | `/api/resume/latest` | Retrieves candidate's most recent ATS analysis record. |
| `GET` | `/api/resume/latest/{user_id}` | Multi-user isolated retrieval of latest analysis for specific candidate ID. |
| `GET` | `/api/resume/history/{user_id}` | Chronological history of resume evaluations for user with timestamp pagination. |
| `GET` | `/api/resume/{analysis_id}` | Fetches specific analysis with candidate authorization guard. |
| `POST` | `/api/resume/parse` | Backward-compatibility alias for legacy frontend integrations. |

### ATS-Style Scoring Formula

$$\text{ATS Score} = S_{\text{skills}} (40) + S_{\text{role}} (25) + S_{\text{projects}} (15) + S_{\text{completeness}} (10) + S_{\text{density}} (10)$$

* **Skill Match (40%):** $\left(\frac{|\text{Matched Core}|}{|\text{Core Skills}|} \times 25\right) + \left(\frac{|\text{Matched Important}|}{|\text{Important Skills}|} \times 15\right)$
* **Target-Role Alignment (25%):** Role title match ($10\text{ pts}$) + overall target skill coverage ratio ($15\text{ pts}$).
* **Projects & Implementation (15%):** Verified Projects section ($6\text{ pts}$) + Experience section ($4\text{ pts}$) + quantifiable metrics keywords like `%`, `latency`, `accuracy`, `production` ($5\text{ pts}$).
* **Resume Completeness (10%):** Core structural sections present (Experience 3, Education 3, Skills 2, Projects 2).
* **Keyword Density & Structure (10%):** Technical token distribution ratio without spamming.

> [!NOTE]
> **Disclaimer:** This ATS score is an explainable educational rubric model designed to guide university students on technical keyword alignment and formatting structure. It is NOT an official proprietary score from any commercial ATS vendor (e.g., Workday, Taleo, Greenhouse).

### Security & Privacy Architecture
- **No Plaintext Persistence:** The full unencrypted raw text of candidate resumes is parsed in memory and is never persisted into database columns or emitted into logs. Only structured metadata, extracted skills, and score rubrics are saved.
- **Multi-User Isolation:** Each analysis record is strictly bound to `user_id`. Querying analyses across user boundaries yields HTTP 404.
- **Input Sanitization:** Enforces 10MB file ceiling, verifies binary magic bytes, and rejects malicious executable formats (`.exe`, `.bin`).

### 20-Scenario Verification Test Suite
The automated test suite (`scratch/test_resume_ats_pipeline.py`) validates:
1. Valid PDF upload & text parsing
2. Valid DOCX upload & paragraph extraction
3. Unsupported file type rejection (`.exe`, `.zip`)
4. Empty file handling (0 bytes)
5. Corrupted file error containment
6. High-skill resume calibration (Score $\ge 75$)
7. Low-match resume scoring & gap identification
8. Zero-skill plain prose handling
9. Dynamic role comparison (e.g. Frontend vs ML Engineer)
10. Missing core vs important skill classification
11. Matched skills verification
12. Duplicate alias normalization (`sklearn` $\rightarrow$ `Scikit-learn`)
13. Multi-user tenant isolation
14. Chronological resume history pagination
15. API failure modes & HTTP error codes
16. Database resilience & transaction rollback
17. Session persistence across browser reloads
18. Automatic sync to `skill_gaps` table (High/Medium Priority)
19. Autonomous Next-Best-Action update trigger
20. Personalized daily challenge generation from resume gaps

### 5. Grounded RAG + LLM Career Intelligence System
- **Curated Knowledge Base (18 Domains):** Production curriculum covering Interview Preparation, Behavioral Interviews, STAR Method, Python, SQL, DSA, Machine Learning, Deep Learning, MLOps, Data Science, Data Analytics, AI Engineering, Software Engineering, Resume Preparation, ATS Preparation, Communication, HR Interviews, and Career Preparation.
- **Local TF-IDF & Cosine Retrieval:** Uses `LocalTfidfEmbeddingService` with scikit-learn `TfidfVectorizer` (sublinear TF, L2 normalization) providing sub-millisecond vector indexing with zero paid API keys.
- **Context-Aware Re-ranking Engine:** Dynamically re-ranks retrieved chunks based on candidate target role (+15% boost) and active missing skill gaps (+25% boost).
- **Academic Hallucination Guard:** Enforces strict similarity thresholds (>= 0.10); queries lacking grounded curriculum documentation trigger an honest academic advisory fallback rather than fabricating unsupported claims.
- **Multilingual Grounded LLM:** Generates structured technical responses, 3 concise takeaways, and links to existing preparation drills in English, Telugu (తెలుగు), Hindi (हिन्दी), and Spanish.
- **API Endpoints:**
  - `POST /api/ai/ask`: Evaluates candidate questions using candidate career context + RAG retrieval + LLM synthesis.
  - `GET /api/ai/sources`: Returns full catalog of 18 indexed curriculum categories and topics.
  - `GET /api/ai/status`: Reports operational status of RAG and LLM inference engine.
- **Frontend Integration:** Embedded directly in `DashboardPage.jsx` and accessible at `/assistant` route via `CareerLearningAssistant.jsx`.

### 6. Grounded Generative AI Interview Engine
- **Dynamic Context-Grounded Generation:** Moves beyond static question arrays by synthesizing interview questions grounded in candidate target role, extracted resume skills, active skill gaps, and verified RAG curriculum chunks.
- **Strict Non-Repetition & Cross-Session Memory:** Consecutive interview sessions for the same candidate and role are guaranteed to produce different questions. The engine joins `InterviewQuestion` and `Interview` to remember all previously asked questions, dynamic RAG query facets rotate across turns, and a syllabus synthesizer generates novel production scenarios to maintain 100% diversity across consecutive sessions.
- **5-Axis Hiring Rubric Evaluation:** Formatively evaluates every candidate response across 5 core dimensions:
  - *Technical Accuracy (0-100)*: Correctness, depth, and precision of domain concepts.
  - *Problem Solving (0-100)*: Structured breakdown, trade-off analysis, edge-case consideration.
  - *Communication & Structure (0-100)*: STAR narrative methodology, clarity, concise articulation.
  - *Depth & Practical Experience (0-100)*: Real-world engineering nuances, production considerations.
  - *Role Alignment (0-100)*: Suitability for target level (Beginner / Intermediate / Advanced).
- **Adaptive Multi-Turn Pacing:** Dynamically recalibrates subsequent questions based on evaluated performance:
  - Scores $\ge 85$: Escalates difficulty and probes complex architectural trade-offs.
  - Scores $50-84$: Probes practical implementation depth or branches to complementary domain topics.
  - Scores $< 50$: Adjusts to verify foundational mechanics without penalizing candidate confidence.
  - Short Answers (< 5 words): Formatively flagged with coaching guidance rather than hallucinated responses.
- **Multilingual Mock Interviews:** Configurable interview and feedback languages supporting English, Telugu (తెలుగు), Hindi (हिन्दी), and Spanish (Español).
- **Closed-Loop Synchronization:**
  - Concluding an interview session updates `skill_gaps` table with identified weaknesses.
  - Automatically logs `interview_completed` activity and awards canonical **+100 XP**.
  - Recalibrates Autonomous Next-Best-Action recommendation and updates calendar streak.
- **Zero Confetti Compliance:** The feedback report adheres to clean, professional academic standards with strictly zero distracting celebratory or paper animations.

### Generative Interview API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/interviews/start` | Initializes generative session, retrieves context + RAG chunks, and generates grounded Question #1. |
| `GET` | `/api/interviews/{session_id}/current-question` | Fetches currently pending question for candidate's active session. |
| `/api/interviews/{session_id}/answer` | POST | Formatively grades candidate response across 5 axes, formulates adaptive next step, and yields next question. |
| `POST` | `/api/interviews/{session_id}/complete` | Finalizes interview, calculates multi-turn hiring decision, syncs skill gaps, and awards +100 XP. |
| `GET` | `/api/interviews/{session_id}/detail` | Retrieves complete multi-turn session transcript, individual answer evaluations, and rubric breakdowns. |

### 7. Skill Arena: Career-Focused Technical Practice
- **Career-Aware Selection:** Recommends technical practice directly tied to the candidate's target role and active skill gaps rather than serving generic LeetCode problems.
- **Four Distinct Practice Modes:**
  1. *Coding Challenge*: Pattern-based, structured algorithmic implementation with required construct and signature verification.
  2. *Debug Challenge*: Real-world code snippets with intentional defects (e.g., mutable default argument traps, PyTorch un-zeroed gradients, pre-split data leakage); evaluates bug identification and idiomatic repair.
  3. *Technical MCQ*: Conceptual distinction questions testing nuances, edge cases, and statistical definitions (e.g., p-value meaning, ROC-AUC vs PR-AUC in imbalanced regimes).
  4. *Predict Output*: Safe, static execution tracing testing language mechanics (e.g., Python late-binding closures in loops, SQL NULL grouping behaviors).
- **Safe Structured Evaluation (Security Boundary):**
  > [!IMPORTANT]
  > **Security Notice:** Secure arbitrary code execution is intentionally not included in this phase. The server never executes arbitrary user-submitted code using `exec()`, `eval()`, subprocesses, or shell commands. Solutions are evaluated deterministically using structured criteria, syntax heuristics, and keyword/concept coverage. A sandboxed execution architecture may be introduced as a separate future phase.
- **Closed-Loop Evidence & Recalculation:** Submitting attempts logs `SkillEvidence(source_type="skill_arena")`, awards canonical XP (25/40/60), updates demonstrated scores, recalculates skill gaps, and immediately prompts the autonomous recommendation engine to pivot to other deficit areas.
- **Adaptive Difficulty & Anti-Repetition:** Calibrates difficulty (Foundational, Intermediate, Advanced) based on current score with escalation ($\ge 85$) and de-escalation ($<50$), and excludes recently attempted/completed challenges.

### Skill Arena API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/skill-arena/challenges` | Returns filtered challenge catalog with candidate completion status. |
| `GET` | `/api/skill-arena/next` | Returns prioritized next challenge based on target role, skill gaps, and anti-repetition. |
| `POST` | `/api/skill-arena/submit` | Safely evaluates submission, records SkillEvidence, awards XP, and triggers profile sync. |
| `GET` | `/api/skill-arena/history` | Returns candidate's historical attempts in reverse chronological order. |
| `GET` | `/api/skill-arena/stats` | Returns candidate accuracy, total XP earned, and skills practiced in Skill Arena. |

---

### 8. Personalized Themes & Appearance System

- **6 Canonical Themes:** **Midnight (Default)** (futuristic purple/cyan), **Dark** (slate/indigo), **Light** (crisp high-contrast editorial), **Ocean** (marine blue/cyan), **Emerald** (forest jade/mint), and **Sunset** (dusk rose/amber).
- **Zero-FOUC Architecture:** Inline bootstrap script in `index.html` initializes the active theme immediately upon DOM parse before React mounts, preventing theme flicker.
- **Centralized Design Tokens:** Standardized CSS custom variables (`--theme-bg`, `--theme-surface`, `--theme-primary`, etc.) bound to Tailwind `@theme` utilities and scoped class overrides (`.bg-[#0F1026]`, `.bg-[#191A3A]`, `.bg-[#0D0E22]`, `.glass-panel`).
- **Accessible Contrast:** Dedicated light mode accessibility calibration for high-contrast typography (`#0F172A`), crisp input borders, and preserved gradient button readability.
- **Interactive Settings Integration:** Visual mini-preview cards in `SettingsPage.jsx` with window headers, miniature sidebars, active checkmark indicators, and instant zero-reload switching.
- **Isolated Persistence:** Stored under `interview_ai_theme` via `storageService.js` with zero mutation or side effects on career preparation data.

---

### 9. Career Journey & Career Readiness Foundation (Phase 18)

- **Authentic Preparation Lifecycle:** Maps the candidate's actual preparation trajectory through 14 deterministic milestones without fabricating achievements, scores, or dates:
  1. `PROFILE`: Candidate identity, experience tier, and target institution documented.
  2. `TARGET_ROLE`: Target industry track selected for curriculum grounding and rubric calibration.
  3. `RESUME`: Curriculum vitae or professional resume document submitted.
  4. `RESUME_ANALYSIS`: ATS parsing, taxonomy extraction, and keyword coverage scoring.
  5. `SKILL_GAP`: Comparative gap analysis against target role benchmarks.
  6. `RECOMMENDATION`: Autonomous Next-Best-Action synthesized across diagnostics.
  7. `PRACTICE`: Daily conceptual articulation and system design comprehension drills.
  8. `SKILL_IMPROVEMENT`: Demonstrable competency elevation verified across multi-source evidence entries.
  9. `CODING`: Hands-on algorithm implementation, debugging, and prediction in Skill Arena.
  10. `INTERVIEW`: Multi-turn technical oral and textual defense simulations conducted in AI chamber.
  11. `EVALUATION`: Canonical 4-pillar rubric scoring, technical accuracy, and committee calibration.
  12. `FEEDBACK`: Actionable Socratic notes, missing concepts, strengths, and committee deliberations.
  13. `PROGRESS`: Measurable skill velocity across consecutive preparation drills and active streak.
  14. `READINESS`: Holistic preparation foundation synthesized across resume, coding, interviews, and communication.

- **Multi-Dimensional Readiness Foundation:**
  Rather than an ungrounded or speculative single score, candidates receive a transparent **Readiness Band** grounded in verified evidence across 5 core dimensions:
  - **Resume & ATS Baseline:** Evaluates keyword alignment, structural integrity, and ATS compatibility.
  - **Technical Competency Depth:** Grounded in assessed technical accuracy across resume skills and question responses.
  - **Coding & Problem Solving Drills:** Tracks hands-on algorithmic implementations and conceptual drills.
  - **Mock Interview Simulation:** Synthesizes completed interview sessions, passing rate, and rubric averages.
  - **Communication & Articulation:** Evaluates verbal clarity, STAR structuring, and acoustic metrics.

- **5 Readiness Bands:**
  - `Getting Started`: Onboarding candidate with profile initializations pending.
  - `Building Foundations`: Profile & target role established; initial diagnostic resume audit recommended.
  - `Developing`: Active preparation underway across resume audits, conceptual drills, or initial mock interviews.
  - `Interview Ready`: Verified resume baseline ($\ge 65$), coding drill completions, and satisfactory mock interview performance ($\ge 70\%$).
  - `Strong Preparation`: Comprehensive multi-dimensional rigor evidenced across high ATS coverage, multiple coding challenges, and consistent high interview evaluations ($\ge 80\%$).

- **Academic Non-Predictive Disclaimer:**
  > [!IMPORTANT]
  > *Career readiness reflects structured preparation evidence and drill history recorded within the platform. It does NOT predict or guarantee employment or real-world interview outcomes.*

- **API Endpoints:**
  | Method | Endpoint | Description |
  |---|---|---|
  | `GET` | `/api/career-journey` | Retrieves full aggregated career journey payload (14 milestones, current focus, next best action, readiness assessment, stats). |
  | `GET` | `/api/career-journey/readiness` | Retrieves granular multi-dimensional readiness assessment across the 5 preparation dimensions. |

---

### Current Limitations
- **Scanned Image PDFs:** Image-only PDFs are safely detected and rejected with clear diagnostic instructions to upload text-based PDFs.
- **Local LLM Synthesis:** Default local inference engine provides deterministic grounded extraction from curriculum with zero paid API costs; can be seamlessly switched to OpenAI/Claude via environment variables.
- **Safe Evaluation Only:** Arbitrary user code execution is prohibited on the server in Phase 13.

### Future Scope: Advanced Generative Practice
- **Dynamic Real-Time Audio Interviewer:** Streaming voice-to-voice mock interview rounds with conversational turn-taking via WebSockets.
- **Autonomous Multi-Agent Resume Tailoring:** Specialized agents collaborating to tailor resume bullets to job descriptions.
- **Sandboxed Code Execution Engine:** Isolated containerized environment for executing arbitrary multi-language code submissions with resource constraints.

```
ai_interview_preparation_agent/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai.py                # Grounded RAG query endpoints
│   │   │   ├── reminders.py         # Proactive reminder endpoints & status
│   │   │   ├── resume.py            # ATS resume extraction & scoring
│   │   │   ├── router.py            # Unified API router
│   │   │   └── routes/
│   │   │       ├── activities.py    # Activity logging & XP engine
│   │   │       ├── career_journey.py # Career Journey lifecycle & readiness
│   │   │       ├── challenges.py    # Daily practice question generator & evaluator
│   │   │       ├── experiences.py   # Real interview question & experience archives
│   │   │       ├── feedback.py      # User product feedback & bug reporting
│   │   │       ├── goals.py         # Weekly goals & 30-day streak recovery
│   │   │       ├── interviews.py    # Generative AI Interview routes
│   │   │       ├── profile.py       # Candidate profile & target roles
│   │   │       ├── progress.py      # Gamification & achievements
│   │   │       ├── recommendations.py # Next-Best-Action synthesis
│   │   │       ├── skill_arena.py   # Skill Arena coding practice
│   │   │       ├── skills.py        # 6-Axis skill profile & gaps
│   │   │       └── weekly_reports.py # Weekly AI Career Report endpoints
│   │   ├── db/
│   │   │   ├── database.py          # SQLite engine & dynamic ALTER migrations
│   │   │   └── models.py            # User, WeeklyReport, WeeklyGoal, ProductFeedback, etc.
│   │   ├── schemas/
│   │   │   ├── career_journey.py    # Lifecycle milestones & readiness assessment
│   │   │   ├── feedback.py          # Product feedback submission schemas
│   │   │   ├── goals.py             # Weekly goals & streak recovery schemas
│   │   │   ├── interview.py         # Generative interview request/response schemas
│   │   │   ├── weekly_report.py     # Weekly AI Career Report schemas
│   │   │   └── skill_arena.py       # Skill Arena request/response schemas
│   │   ├── services/
│   │   │   ├── career_journey_service.py # 14-milestone lifecycle synthesis
│   │   │   ├── feedback_service.py  # Anti-spam validated feedback service
│   │   │   ├── goal_service.py      # Commitments sync & 30-day streak recovery
│   │   │   ├── weekly_report_service.py # Weekly report aggregation & AI digest
│   │   │   ├── resume_extractor.py  # Hardened multi-format text parser
│   │   │   └── scheduler.py         # 60-second asyncio background scheduler
│   │   └── main.py                  # FastAPI entrypoint with security headers & readiness probe
│   ├── career_agent.db              # SQLite persistent database
│   └── requirements.txt
├── src/
│   ├── components/                  # GlassCard, RadarChart, FeedbackModal, CameraPreview, etc.
│   ├── context/
│   │   ├── AuthContext.jsx          # User state, XP, Level, and Auth
│   │   ├── InterviewContext.jsx     # Active multi-turn generative interview session
│   │   └── ThemeContext.jsx         # Global personalized theme state
│   ├── pages/                       # Dashboard, CareerJourney, WeeklyReport, MockInterview, etc.
│   ├── services/
│   │   ├── careerJourneyApi.js      # REST client for Career Journey & Readiness
│   │   ├── feedbackApi.js           # REST client for User Feedback
│   │   ├── goalsApi.js              # REST client for Weekly Goals & Streak Recovery
│   │   ├── weeklyReportApi.js       # REST client for Weekly AI Career Report
│   │   ├── interviewApi.js          # REST client for Generative Interview Engine
│   │   └── skillArenaApi.js         # REST client for Skill Arena Coding Practice
│   └── utils/                       # Fetch with timeout, storage, activity helpers
```

---

## 📈 Phases 19–22: Advanced Career Analytics & Production Readiness

### Phase 19: Weekly AI Career Report (`/weekly-report`)
- **Deterministic Data Synthesis:** Compiles candidate's last 7 days of completed mock interviews, passed coding problems, active practice days, XP gained, and verified skill evidence.
- **Previous Week Comparison:** Computes genuine diff metrics ($+N$ interviews, $+N$ solved problems, $+N$ XP) comparing with the preceding 7-day window.
- **AI Qualitative Interpretation:** Generates a personalized pedagogical assessment celebrating demonstrated candidate competencies and outlining areas needing remediation.
- **High-Impact Priorities:** Outlines 3 to 5 targeted, actionable goals with direct routes to mock interviews, coding sandboxes, and daily practice questions.
- **Historic Archive & Print Mode:** Allows candidates to review historical weekly reports or print/export clean PDF dossiers.

### Phase 20: Weekly Goals & Meaningful Gamification (`/api/goals/weekly`)
- **Weekly Commitments Tracker:** Candidates set and track target interviews, coding drills, and daily practice questions.
- **30-Day Streak Recovery:** A protective learning mechanic that allows students to recover an accidentally broken daily streak at most once every 30 rolling calendar days.
- **Career-Focused Gamification:** Milestones and XP strictly reward genuine career actions (mock interviews, ATS audits, coding proofs) with zero random or casino mechanics.

### Phase 21: User Product Feedback (`/api/feedback`)
- **In-App Modal:** Non-intrusive feedback modal accessible directly from the application header bar.
- **Structured Categorization:** Submissions categorized across `bug`, `interview_flow`, `scoring`, `feature_request`, `ui_ux`, and `general`.
- **Anti-Spam & Privacy Safeguards:** Enforces a rate limit of 5 submissions per hour per user, with explicit client warnings against submitting passwords or private credentials.

### Phase 22: Security & Production Readiness
- **HTTP Security Headers Middleware:** Automatically injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin` into all responses.
- **Health & Readiness Probes:** Standardized root `/health`, `/api/health`, and `/api/ready` endpoints verifying SQLite database responsiveness and background scheduler status.
- **Upload Hardening:** Enforces 10MB file limits, magic-byte inspection, file extension whitelisting, and path traversal prevention.
- **Configuration Template:** Clean `.env.example` documenting all configuration keys without real secrets.

---

## 📜 Academic Attribution

- **Candidate / Developer:** Chandolu Praneeth Kumar
- **Registration Number:** `241FA18483`
- **Department:** Artificial Intelligence & Machine Learning (AIML)
- **Course:** MLOPS
- **Year & Semester:** 3rd Year — I Semester
- **Institution:** Vignan's Foundation for Science, Technology & Research (Vignan University)
- **Project Scope:** Industry Defined Project (IDP) / Functional Prototype
- **License:** MIT License — Academic & Open-Source Research Use Only.
