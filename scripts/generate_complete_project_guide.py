"""
Comprehensive Project Guide Generator (DOCX & PDF)
Outputs:
1. AI_Career_Preparation_Agent_Architecture_and_Build_Guide.docx
2. AI_Career_Preparation_Agent_Architecture_and_Build_Guide.pdf

A complete, beginner-friendly, pin-to-pin handbook detailing every technology,
architecture decision, file structure, core engine, database schema, API route,
and production deployment instruction.
"""

import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

DOCX_OUTPUT = "AI_Career_Preparation_Agent_Architecture_and_Build_Guide.docx"
PDF_OUTPUT = "AI_Career_Preparation_Agent_Architecture_and_Build_Guide.pdf"


# =====================================================================
# ReportLab Numbered Canvas for "Page X of Y" and Running Headers
# =====================================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#70685E"))

        # Don't draw header on cover page (page 1)
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 750, "AI Career Preparation Agent • Architecture & Build Guide")
            self.setStrokeColor(colors.HexColor("#E2D9C8"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

            # Footer
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(558, 36, page_text)
            self.drawString(54, 36, "Confidential • Enterprise Academic Blueprint")
            self.line(54, 48, 558, 48)

        self.restoreState()


# =====================================================================
# DOCX Helper Functions
# =====================================================================
def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)


# =====================================================================
# Content Data (Shared across DOCX and PDF generators)
# =====================================================================
CHAPTERS_DATA = [
    {
        "id": "ch1",
        "title": "Chapter 1: Executive Overview & Product Vision",
        "paragraphs": [
            "The AI Career Preparation Agent is an end-to-end, enterprise-grade pedagogical platform designed to empower job candidates to excel in high-stakes technical, behavioral, and architectural interviews. Unlike generic mock interview tools that ask static, repetitive questions, this platform functions as an autonomous pedagogical coach.",
            "It synthesizes dynamic questions tailored to the candidate's chosen target career role, transcribes and evaluates answers in real-time across 5 rigorous rubric axes (Technical Knowledge, Relevance, STAR Communication, Problem-Solving Structure, and Delivery Confidence), and closes the preparation loop by measuring real competency gains over time.",
        ],
        "callouts": [
            ("Core Pedagogical Philosophy", "No candidate should ever see fabricated baseline scores. Data integrity is absolute: zero-evidence fresh accounts start at an uncalibrated 0% baseline, while real scores are earned through verified practice drills, mock interviews, and ATS resume audits.")
        ]
    },
    {
        "id": "ch2",
        "title": "Chapter 2: High-Level System Architecture Blueprint",
        "paragraphs": [
            "The system employs a unified, resilient client-server architecture. In development, the React 18 Single Page Application (SPA) runs via Vite with hot module replacement (HMR), while FastAPI serves REST APIs via Uvicorn. In production, a multi-stage Docker container compiles the frontend into static assets ('dist/') and FastAPI mounts and serves these assets directly, providing a lightning-fast single-port container deployment.",
            "System Architectural Layers:\n"
            "1. Presentation Layer: React 18 SPA, Tailwind CSS v4, Lucide Icons, MediaRecorder & SpeechRecognition APIs.\n"
            "2. State & Context Layer: ThemeContext, AuthContext, InterviewContext with multi-tier storage synchronization.\n"
            "3. API Gateway & Routing: FastAPI RESTful endpoints with automatic OpenAPI documentation and CORS protection.\n"
            "4. AI & Inference Orchestrator: Multi-tier LLM factory prioritizing Google Gemini API (1.5/2.0 Flash) -> OpenAI -> Local Grounded Heuristic Engine.\n"
            "5. RAG & Knowledge Retrieval: In-memory TF-IDF and semantic chunk retrieval grounded in role playbooks.\n"
            "6. Question Vault & Community Exchange: Crowdsourced real company interview questions with automated PII scrubbing.\n"
            "7. Persistence Layer: SQLAlchemy 2.0 ORM with SQLite database (portable development) or PostgreSQL (cloud production)."
        ],
        "callouts": [
            ("Resilient Multi-Tier Fallback", "If an external LLM key is absent or exhausts its rate limit, the system gracefully degrades to the Local Grounded Engine instead of crashing. Candidates experience uninterrupted interview sessions with high-fidelity rubric feedback.")
        ]
    },
    {
        "id": "ch3",
        "title": "Chapter 3: Technology Stack Encyclopedia (The Why, Where, & How)",
        "paragraphs": [
            "Every single library, framework, and tool in this repository was selected deliberately to maximize performance, maintainability, and zero-crash resilience. The matrix below details the exact justification for each component:"
        ],
        "table": {
            "headers": ["Technology", "Role & Location", "Why Chosen (Rationale)", "How It Operates"],
            "col_widths": [1.2, 1.4, 2.2, 2.2],
            "rows": [
                ["React 18", "Frontend Framework\n`src/`", "Declarative component tree, concurrency, widespread industry standard.", "Manages virtual DOM, state hooks, and reactive interview lifecycles."],
                ["Vite v8", "Build Tool & Dev Server\n`vite.config.js`", "Sub-second dev server startup, lightning production bundling with Rolldown.", "Compiles 1,900+ modules into minified JS/CSS chunks in ~600ms."],
                ["Tailwind CSS v4", "Design System & Styling\n`src/index.css`", "Modern CSS variable bindings (@theme), zero-runtime overhead.", "Supplies utility classes and drives dynamic theme color tokens."],
                ["FastAPI", "Backend Web API\n`backend/app/main.py`", "Python 3 async support, native Pydantic typing, auto Swagger UI docs.", "Handles REST routes, authentication, evaluations, and background schedulers."],
                ["Google Gemini API", "Primary LLM Engine\n`gemini_service.py`", "State-of-the-art reasoning, ultra-fast TTFT, generous context window.", "Synthesizes adaptive questions and grades answers via HTTPS REST protocol."],
                ["OpenAI Adapter", "Secondary LLM Engine\n`llm_service.py`", "Ensures interoperability with OpenAI, Azure, Groq, or DeepSeek.", "Emits OpenAI chat completion requests if OPENAI_API_KEY is supplied."],
                ["Local Grounded LLM", "Failsafe Fallback\n`llm_service.py`", "Guarantees 100% uptime: never crashes even if offline or quota exceeded.", "Applies deterministic rubric heuristics and playbook embeddings."],
                ["SQLAlchemy 2.0", "Database ORM\n`backend/app/db/`", "Robust relational mapping, prevents SQL injection, database agnostic.", "Manages schemas, relationships, and queries across SQLite and PostgreSQL."],
                ["MediaRecorder API", "Browser Telemetry\n`MockInterviewPage.jsx`", "Native browser video/audio capture without heavy external npm plugins.", "Streams webcam and microphone buffers into standard WebM/MP4 containers."],
                ["Web Speech API", "Live Voice Transcription\n`MockInterviewPage.jsx`", "Zero-latency real-time candidate verbal transcription in-browser.", "Converts spoken speech to text chunks as the candidate speaks."],
                ["APScheduler", "Background Cron\n`reminder_service.py`", "Autonomous background task scheduling in pure Python.", "Dispatches proactive daily practice reminder alerts based on user timezone."],
                ["Docker", "Containerization\n`Dockerfile`", "Consistent builds across Windows, macOS, Linux, and Cloud instances.", "Multi-stage build compiling Vite frontend and serving via Uvicorn."]
            ]
        }
    },
    {
        "id": "ch4",
        "title": "Chapter 4: Complete Codebase Directory Tour & File Manifest",
        "paragraphs": [
            "A clear directory structure is essential for beginners navigating the project. The tree below highlights the purpose of each key folder and file across both frontend and backend:"
        ],
        "table": {
            "headers": ["Path / Directory", "Primary Responsibility", "Key Files Included"],
            "col_widths": [1.8, 2.4, 2.8],
            "rows": [
                ["`src/components/`", "Reusable presentation UI components", "`GlassCard.jsx`, `GradientButton.jsx`, `Badge.jsx`, `ProgressBar.jsx`"],
                ["`src/components/video/`", "Multimodal video interview tools", "`RecordingControls.jsx`, `AiInterviewerAvatar.jsx`, `RecordingReview.jsx`"],
                ["`src/context/`", "Global application state stores", "`AuthContext.jsx`, `InterviewContext.jsx`, `ThemeContext.jsx`"],
                ["`src/pages/`", "Application route view controllers", "`DashboardPage.jsx`, `MockInterviewPage.jsx`, `SkillGapPage.jsx`, `SettingsPage.jsx`"],
                ["`src/theme/`", "Theme metadata & color palettes", "`themeConfig.js` (System, Warm, White, Dark theme presets)"],
                ["`src/utils/`", "Client-side calculation engines", "`skillGapAnalyzer.js`, `activityService.js`, `feedbackAgent.js`"],
                ["`src/utils/storage/`", "Client storage persistence facade", "`storageService.js` (Scoped localStorage management)"],
                ["`backend/app/api/`", "FastAPI endpoint route definitions", "`routes/interview.py`, `profile.py`, `experiences.py`, `skills.py`"],
                ["`backend/app/db/`", "Database configuration & models", "`database.py`, `models.py` (Users, Interviews, Questions, Skills)"],
                ["`backend/app/schemas/`", "Pydantic request & response contracts", "`interview.py`, `profile.py`, `experience.py`, `activity.py`"],
                ["`backend/app/services/`", "Core business logic & engine services", "`interview_engine.py`, `skill_service.py`, `experience_service.py`"],
                ["`backend/app/services/ai/`", "AI, RAG, and LLM implementations", "`llm/gemini_service.py`, `llm/llm_service.py`, `rag/retrieval_service.py`"],
                ["`tests/`", "Automated backend unit & integration tests", "`test_real_llm_and_role_sync.py`, `test_phase17_experiences.py`"]
            ]
        }
    },
    {
        "id": "ch5",
        "title": "Chapter 5: Core Engines & Key Features Breakdown",
        "subsections": [
            {
                "subtitle": "5.1 Multimodal Mock Interview Engine",
                "text": "The mock interview engine orchestrates realistic technical sessions. Candidates select their Target Role, Interview Focus (Technical, Behavioral STAR, HR, Role Deep Dive), Difficulty (Beginner, Intermediate, Advanced), and Mode (Text, Video, Face-to-Face Voice). The interview engine executes dynamic 180-second countdowns, records continuous audio/video telemetry, transcribes verbal answers in real-time, and branches adaptively."
            },
            {
                "subtitle": "5.2 5-Axis Rubric Answer Evaluation System",
                "text": "Candidate answers are graded objectively against five standardized dimensions:\n1. Technical Accuracy (0-100): Validates technical concepts, algorithms, frameworks, and syntax.\n2. Relevance to Question (0-100): Checks if the candidate directly answered the core inquiry.\n3. Communication & STAR Method (0-100): Measures structured storytelling (Situation, Task, Action, Result).\n4. Problem Solving & Architecture (0-100): Assesses system tradeoffs, scale, and algorithmic efficiency.\n5. Delivery Confidence & Conciseness (0-100): Evaluates clarity, authoritative tone, and avoidance of filler words."
            },
            {
                "subtitle": "5.3 Question Vault & Real Company Experience Integration",
                "text": "The Question Vault (/interview-experiences) is a crowdsourced repository where candidates contribute authentic questions and interview experiences from companies like Stripe, Google, Amazon, and startups. Key integration highlight: Questions submitted and approved in the Question Vault are automatically retrieved by backend/app/services/interview_engine.py via get_vault_questions_for_role(). The engine weaves these questions directly into mock interview sessions for matching target roles, badging them in the UI as: '🏛️ Community Question Vault • Real Company Question'."
            },
            {
                "subtitle": "5.4 Deterministic Gamification & Habit Loop",
                "text": "Preparation consistency is driven by an immutable activity engine (src/utils/activityService.js). Every completed interview awards +100 XP (with bonuses up to +25 XP for high scores), daily drills award +50 XP, and resume scans award +35 XP. The engine calculates consecutive daily streaks deterministically from timestamped activities. Fresh accounts start at 0d streak and 0 XP without hardcoded mock fallbacks."
            },
            {
                "subtitle": "5.5 Four-Theme Architectural Visual Engine",
                "text": "The application offers four distinct visual presentation themes:\n1. System Preference: Dynamically responds to the candidate's operating system dark/light mode.\n2. Warm Scholar: Classical academic dossier with archival parchment (#F8F6F0), porcelain surfaces, and navy accents.\n3. Pure White: Modern, crisp executive white canvas (#FFFFFF) with slate ink and cobalt blue highlights.\n4. Midnight Dark: Deep obsidian canvas (#0B0F17) with midnight surfaces, white typography, and electric cyan accents."
            },
            {
                "subtitle": "5.6 Custom Target Role Customization",
                "text": "In addition to the 6 preset career roles, candidates can define any custom target role (e.g. 'Site Reliability Engineer', 'NLP Research Scientist', 'Fintech Product Manager'). The custom role persists to user storage and the database, dynamically steering LLM question synthesis and competency analytics."
            }
        ]
    },
    {
        "id": "ch6",
        "title": "Chapter 6: Database Schemas & Data Models",
        "paragraphs": [
            "The relational database schema is structured to ensure complete user isolation, data integrity, and strict foreign key cascading. Below is the relational entity overview:"
        ],
        "table": {
            "headers": ["Table Name", "Primary Key", "Foreign Keys", "Key Fields & Responsibilities"],
            "col_widths": [1.4, 1.1, 1.4, 3.1],
            "rows": [
                ["`users`", "`id` (VARCHAR)", "None", "`email`, `name`, `role`, `target_role`, `xp`, `level`, `streak`, `created_at`"],
                ["`profiles`", "`id` (VARCHAR)", "`user_id` -> `users.id`", "`target_role`, `experience_years`, `skills_json`, `feedback_language`"],
                ["`interviews`", "`id` (VARCHAR)", "`user_id` -> `users.id`", "`role`, `interview_type`, `difficulty`, `overall_score`, `status`, `rubric_scores_json`"],
                ["`interview_questions`", "`id` (VARCHAR)", "`session_id` -> `interviews.id`", "`sequence_number`, `question`, `skill`, `difficulty`, `generated_source`"],
                ["`interview_answers`", "`id` (VARCHAR)", "`question_id` -> `questions.id`", "`answer_text`, `duration_seconds`, `audio_url`, `created_at`"],
                ["`interview_experiences`", "`id` (VARCHAR)", "`user_id` -> `users.id`", "`company`, `role`, `experience_text`, `difficulty`, `outcome`, `moderation_status`"],
                ["`interview_experience_questions`", "`id` (VARCHAR)", "`experience_id` -> `experiences.id`", "`question_text`, `round_type`, `topic`, `difficulty`"],
                ["`activities`", "`id` (VARCHAR)", "`user_id` -> `users.id`", "`activity_type`, `title`, `xp_earned`, `timestamp`"]
            ]
        }
    },
    {
        "id": "ch7",
        "title": "Chapter 7: REST API Endpoints Specification",
        "paragraphs": [
            "The backend exposes RESTful endpoints with automatic Swagger OpenAPI documentation at `/docs`:"
        ],
        "table": {
            "headers": ["HTTP Method", "Endpoint Route", "Purpose", "Auth Required"],
            "col_widths": [1.0, 2.5, 2.5, 1.0],
            "rows": [
                ["POST", "`/api/auth/register`", "Register new user account", "No"],
                ["POST", "`/api/auth/login`", "Authenticate and return JWT token", "No"],
                ["GET / PUT", "`/api/profile`", "Retrieve and update user career profile", "Yes"],
                ["POST", "`/api/interview/start`", "Initiate a mock session (synthesizes Q1)", "Yes"],
                ["POST", "`/api/interview/answer`", "Submit candidate answer & grade rubric", "Yes"],
                ["GET", "`/api/interview/{id}`", "Fetch interview results & score matrix", "Yes"],
                ["GET / POST", "`/api/experiences`", "Browse & submit Question Vault entries", "Yes"],
                ["POST", "`/api/resume/analyze`", "Upload resume and perform ATS gap audit", "Yes"],
                ["GET", "`/api/analytics/competencies`", "Fetch real competency growth matrix", "Yes"]
            ]
        }
    },
    {
        "id": "ch8",
        "title": "Chapter 8: Step-by-Step Beginner Build Guide",
        "paragraphs": [
            "If you are starting from scratch and want to build this complete application from ground zero, follow these exact 7 steps:"
        ],
        "table": {
            "headers": ["Step", "Action", "Command / Execution Details"],
            "col_widths": [0.6, 1.8, 4.6],
            "rows": [
                ["1", "Install Prerequisites", "Install Node.js (v18 or v20 LTS), Python (v3.11+), and Git."],
                ["2", "Clone Repository", "git clone https://github.com/chandolupraneethkumar05-oss/AI-Career-Preparation-Agent.git\ncd AI-Career-Preparation-Agent"],
                ["3", "Setup Backend", "cd backend\npython -m venv venv\n# Windows: venv\\Scripts\\activate | Mac/Linux: source venv/bin/activate\npip install -r requirements.txt"],
                ["4", "Configure .env", "Create .env with:\nPORT=8000\nGEMINI_API_KEY=your_gemini_api_key\nGEMINI_MODEL=gemini-1.5-flash\nDATABASE_URL=sqlite:///./interview_ai.db"],
                ["5", "Setup Frontend", "In project root:\nnpm install\nnpm run build   # Verifies Vite bundling and CSS compilation"],
                ["6", "Run Dev Servers", "Terminal 1 (Backend): uvicorn backend.app.main:app --reload --port 8000\nTerminal 2 (Frontend): npm run dev (Access http://localhost:5173)"],
                ["7", "Execute Tests", "Run: python -m pytest\nExpected: 41 passed out of 41 tests (100% pass)"]
            ]
        }
    },
    {
        "id": "ch9",
        "title": "Chapter 9: Production Cloud Deployment Manual (Docker & Render)",
        "paragraphs": [
            "Deploying to production requires zero manual server configuration using the multi-stage Docker build pipeline.",
            "Multi-stage Dockerfile Explained:\n"
            "• Stage 1 (Frontend Builder): Uses `node:20-slim`, runs `npm install`, and executes `npm run build` to output the optimized single-page bundle into `dist/` in ~800ms.\n"
            "• Stage 2 (Backend Runtime): Uses `python:3.11-slim`, installs system build utilities (gcc, g++, curl), installs Python packages from `backend/requirements.txt`, copies backend application code, and copies static `dist/` assets from Stage 1 into the container.\n"
            "• Single-Port Serving: In production, FastAPI mounts `dist/` at the root path (`/`) while mounting API routes under `/api`. Uvicorn serves both web clients and backend endpoints on port 10000."
        ],
        "callouts": [
            ("One-Click Render.com Deployment Steps",
             "1. Push code to your GitHub repo on branch 'main'.\n"
             "2. In Render.com dashboard, click 'New +' -> 'Web Service' and select your repository.\n"
             "3. Select 'Docker' as the Environment runtime.\n"
             "4. In 'Environment Variables', set GEMINI_API_KEY to your Google AI Studio API key.\n"
             "5. Click 'Deploy Web Service'. Render will build the Docker image, run database migrations, and provide a live HTTPS URL in ~3 minutes!")
        ]
    }
]


# =====================================================================
# Build Comprehensive DOCX Guide
# =====================================================================
def build_docx_guide():
    print("Generating Comprehensive DOCX guide...")
    doc = Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x1F, 0x1B, 0x16)
    normal_style.paragraph_format.line_spacing = 1.2
    normal_style.paragraph_format.space_after = Pt(6)

    # Cover Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("AI CAREER PREPARATION AGENT\nCOMPLETE ARCHITECTURE & BUILD HANDBOOK")
    title_run.font.name = 'Georgia'
    title_run.font.size = Pt(22)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub_p.add_run("From Zero to Production: A Comprehensive Beginner-Friendly Blueprint\nMultimodal AI Interviews • Grounded Gemini LLM • Closed-Loop Skill Calibration • Enterprise Deployment")
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(0x70, 0x68, 0x5E)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Metadata Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Platform Version", "v2.4.0 (Enterprise Academic Edition)"),
        ("Target Audience", "Complete Beginners to Senior Full-Stack Engineers"),
        ("Frontend Stack", "React 18, Vite, Tailwind CSS v4, Web Audio & MediaRecorder"),
        ("Backend & AI Stack", "FastAPI, SQLAlchemy, SQLite/PostgreSQL, Google Gemini API, Docker")
    ]
    for row_idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        cell_k.text = k
        cell_v.text = v
        set_cell_background(cell_k, "F2EFE9")
        set_cell_background(cell_v, "FAF8F3")
        cell_k.paragraphs[0].runs[0].font.bold = True
        cell_k.paragraphs[0].runs[0].font.size = Pt(9.5)
        cell_v.paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_margins(cell_k, 80, 80, 120, 120)
        set_cell_margins(cell_v, 80, 80, 120, 120)

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.font.name = 'Georgia'
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.name = 'Georgia'
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x8C, 0x6E, 0x54)
        return h

    def add_callout(title, text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "FAF8F3")
        set_cell_margins(cell, 120, 120, 180, 180)
        p = cell.paragraphs[0]
        r_title = p.add_run(f"📌 {title}: ")
        r_title.bold = True
        r_title.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
        r_text = p.add_run(text)
        r_text.font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_table_data(headers, rows_data):
        tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_row = tbl.rows[0]
        for idx, h in enumerate(headers):
            cell = hdr_row.cells[idx]
            cell.text = h
            set_cell_background(cell, "1A365D")
            cell.paragraphs[0].runs[0].font.bold = True
            cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            set_cell_margins(cell, 90, 90, 100, 100)

        for r_idx, row_values in enumerate(rows_data):
            row = tbl.rows[r_idx + 1]
            bg = "FFFDF9" if r_idx % 2 == 0 else "F8F6F0"
            for c_idx, val in enumerate(row_values):
                cell = row.cells[c_idx]
                cell.text = str(val)
                set_cell_background(cell, bg)
                cell.paragraphs[0].runs[0].font.size = Pt(9)
                set_cell_margins(cell, 80, 80, 100, 100)
        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    for ch in CHAPTERS_DATA:
        add_h1(ch["title"])
        for p in ch.get("paragraphs", []):
            doc.add_paragraph(p)

        for callout in ch.get("callouts", []):
            add_callout(callout[0], callout[1])

        if "table" in ch:
            t = ch["table"]
            add_table_data(t["headers"], t["rows"])

        for sub in ch.get("subsections", []):
            add_h2(sub["subtitle"])
            doc.add_paragraph(sub["text"])

    doc.save(DOCX_OUTPUT)
    print(f"DOCX guide successfully created at: {DOCX_OUTPUT}")


# =====================================================================
# Build Comprehensive PDF Guide with ReportLab
# =====================================================================
def build_pdf_guide():
    print("Generating Comprehensive PDF guide with reportlab...")
    pdf = SimpleDocTemplate(
        PDF_OUTPUT,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    c_primary = colors.HexColor("#1A365D")   # Academic Navy
    c_bronze = colors.HexColor("#8C6E54")    # Aged Bronze
    c_ink = colors.HexColor("#1F1B16")       # Oxford Ink
    c_bg_card = colors.HexColor("#FAF8F3")   # Archival Porcelain
    c_border = colors.HexColor("#E2D9C8")    # Archival Border

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        alignment=1,  # Center
        spaceAfter=6
    )

    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#70685E"),
        alignment=1,  # Center
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=16,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_bronze,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12.5,
        textColor=c_ink,
        spaceAfter=5
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_primary
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_ink
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("AI CAREER PREPARATION AGENT", title_style))
    story.append(Paragraph("Complete Architecture & Build Handbook • Beginner-to-Production Guide", sub_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceAfter=10))

    # Meta Overview Box
    meta_table_data = [
        [Paragraph("<b>Version:</b> v2.4.0 (Enterprise Academic Edition)", table_cell_style),
         Paragraph("<b>Target Audience:</b> Complete Beginners to Full-Stack Engineers", table_cell_style)],
        [Paragraph("<b>Frontend:</b> React 18, Vite, Tailwind CSS v4, Web Audio", table_cell_style),
         Paragraph("<b>Backend & AI:</b> FastAPI, SQLite/PostgreSQL, Google Gemini 1.5/2.0", table_cell_style)]
    ]
    t_meta = Table(meta_table_data, colWidths=[3.5 * inch, 3.5 * inch])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_card),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # Render each chapter with complete details
    for ch in CHAPTERS_DATA:
        story.append(Paragraph(ch["title"], h1_style))

        for p_text in ch.get("paragraphs", []):
            # Format linebreaks if present
            formatted = p_text.replace("\n", "<br/>")
            story.append(Paragraph(formatted, body_style))

        for callout in ch.get("callouts", []):
            c_title, c_text = callout
            c_content = f"<b>📌 {c_title}:</b> {c_text}".replace("\n", "<br/>")
            c_table = Table([[Paragraph(c_content, callout_style)]], colWidths=[7.0 * inch])
            c_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), c_bg_card),
                ('BOX', (0,0), (-1,-1), 1, c_bronze),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ]))
            story.append(Spacer(1, 4))
            story.append(c_table)
            story.append(Spacer(1, 6))

        if "table" in ch:
            t_spec = ch["table"]
            headers = [Paragraph(f"<b>{h}</b>", table_header_style) for h in t_spec["headers"]]
            table_rows = [headers]
            for r in t_spec["rows"]:
                row_cells = []
                for cell_text in r:
                    formatted_cell = str(cell_text).replace("\n", "<br/>").replace("`", "")
                    row_cells.append(Paragraph(formatted_cell, table_cell_style))
                table_rows.append(row_cells)

            col_widths = [w * inch for w in t_spec.get("col_widths", [7.0 / len(t_spec["headers"])] * len(t_spec["headers"]))]
            t = Table(table_rows, colWidths=col_widths, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), c_primary),
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
            ]))
            story.append(Spacer(1, 4))
            story.append(t)
            story.append(Spacer(1, 6))

        for sub in ch.get("subsections", []):
            story.append(Paragraph(sub["subtitle"], h2_style))
            formatted_sub = sub["text"].replace("\n", "<br/>")
            story.append(Paragraph(formatted_sub, body_style))

    pdf.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF guide successfully created at: {PDF_OUTPUT}")


if __name__ == "__main__":
    build_docx_guide()
    build_pdf_guide()
    print("All documents generated successfully.")
