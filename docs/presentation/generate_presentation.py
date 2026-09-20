import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ==============================================================================
# COLOR PALETTE — PURPLE + CYAN FUTURISTIC AI SAAS THEME
# ==============================================================================
BG_COLOR        = RGBColor(15, 16, 38)     # #0F1026 Canvas Background
CARD_BG         = RGBColor(25, 26, 58)     # #191A3A Card Background
CARD_BG_ALT     = RGBColor(20, 24, 52)     # #141834 Darker Card
CARD_BG_LIGHT   = RGBColor(32, 34, 72)     # #202248 Highlight Card
BORDER_PURPLE   = RGBColor(124, 58, 237)   # #7C3AED Primary Purple
BORDER_MUTED    = RGBColor(65, 45, 115)    # Subtle Purple
BORDER_CYAN     = RGBColor(6, 182, 212)    # #06B6D4 Secondary Cyan
TEXT_WHITE      = RGBColor(248, 250, 252)  # #F8FAFC
TEXT_MUTED      = RGBColor(165, 180, 252)  # #A5B4FC
ACCENT_CYAN     = RGBColor(6, 182, 212)    # #06B6D4
ACCENT_PURPLE   = RGBColor(168, 85, 247)   # #A855F7
ACCENT_PINK     = RGBColor(236, 72, 153)   # #EC4899
ACCENT_GREEN    = RGBColor(34, 197, 94)    # #22C55E
ACCENT_AMBER    = RGBColor(245, 158, 11)   # #F59E0B

FONT_HEADING = 'Segoe UI'
FONT_BODY    = 'Segoe UI'

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================
def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    return prs

def set_slide_background(slide):
    # Base background shape
    bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5)
    )
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_COLOR
    bg.line.fill.background()

    # Subtle ambient glow top right
    glow1 = slide.shapes.add_shape(
        MSO_SHAPE.OVAL, Inches(10.5), Inches(-1.5), Inches(4.5), Inches(4.5)
    )
    glow1.fill.solid()
    glow1.fill.fore_color.rgb = RGBColor(25, 20, 60)
    glow1.line.fill.background()

    # Subtle ambient glow bottom left
    glow2 = slide.shapes.add_shape(
        MSO_SHAPE.OVAL, Inches(-1.5), Inches(5.0), Inches(4.0), Inches(4.0)
    )
    glow2.fill.solid()
    glow2.fill.fore_color.rgb = RGBColor(18, 30, 65)
    glow2.line.fill.background()

def add_header(slide, title, category, subtitle=None):
    # Category Pill
    pill = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(4.0), Inches(0.32)
    )
    pill.fill.solid()
    pill.fill.fore_color.rgb = RGBColor(35, 25, 75)
    pill.line.color.rgb = BORDER_PURPLE
    pill.line.width = Pt(1)
    
    tf_pill = pill.text_frame
    tf_pill.word_wrap = False
    p_pill = tf_pill.paragraphs[0]
    p_pill.text = f"●  {category.upper()}"
    p_pill.font.name = FONT_HEADING
    p_pill.font.size = Pt(9.5)
    p_pill.font.bold = True
    p_pill.font.color.rgb = ACCENT_CYAN
    p_pill.alignment = PP_ALIGN.LEFT
    tf_pill.margin_left = Inches(0.12)
    tf_pill.margin_top = Inches(0.04)

    # Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.82), Inches(11.7), Inches(0.55))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.name = FONT_HEADING
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE

    # Subtitle
    if subtitle:
        tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(11.7), Inches(0.4))
        tf_sub = tb_sub.text_frame
        tf_sub.word_wrap = True
        tf_sub.margin_left = tf_sub.margin_top = tf_sub.margin_right = tf_sub.margin_bottom = 0
        p_sub = tf_sub.paragraphs[0]
        p_sub.text = subtitle
        p_sub.font.name = FONT_BODY
        p_sub.font.size = Pt(11.5)
        p_sub.font.color.rgb = TEXT_MUTED

def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=BORDER_MUTED, border_width=1):
    card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(border_width)
    return card

def add_badge(slide, left, top, width, height, text, bg_color, text_color, font_size=9.5):
    badge = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    badge.fill.solid()
    badge.fill.fore_color.rgb = bg_color
    badge.line.fill.background()
    tf = badge.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.text = text
    p.font.name = FONT_HEADING
    p.font.size = Pt(font_size)
    p.font.bold = True
    p.font.color.rgb = text_color
    p.alignment = PP_ALIGN.CENTER
    tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
    return badge

# ==============================================================================
# SLIDE BUILDERS (18 SLIDES TOTAL)
# ==============================================================================

# ------------------------------------------------------------------------------
# SLIDE 1: TITLE SLIDE
# ------------------------------------------------------------------------------
def build_slide_1(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)

    # Platform Badge Header
    add_badge(
        slide, Inches(0.8), Inches(0.6), Inches(7.5), Inches(0.35),
        "FULL-STACK AI PLATFORM  •  AUTONOMOUS CAREER PREPARATION ARCHITECTURE",
        RGBColor(35, 25, 75), ACCENT_CYAN, font_size=10
    )

    # Main Project Title Card
    main_card = add_card(slide, Inches(0.8), Inches(1.2), Inches(11.733), Inches(3.2), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=2)
    
    tb = slide.shapes.add_textbox(Inches(1.1), Inches(1.4), Inches(11.1), Inches(2.7))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "AI CAREER PREPARATION AGENT"
    p0.font.name = FONT_HEADING
    p0.font.size = Pt(28)
    p0.font.bold = True
    p0.font.color.rgb = TEXT_WHITE
    p0.space_after = Pt(4)

    p1 = tf.add_paragraph()
    p1.text = "Autonomous, Adaptive Mock Interview Simulation & ATS Career Intelligence Platform"
    p1.font.name = FONT_HEADING
    p1.font.size = Pt(14)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_CYAN
    p1.space_after = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Full-stack intelligent agent with closed-loop perception, evaluation, radar skill profiling, and retention mechanics."
    p2.font.name = FONT_BODY
    p2.font.size = Pt(11)
    p2.font.color.rgb = TEXT_MUTED
    p2.space_after = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = "Stack: React 19 + Vite  |  FastAPI + Python 3.13  |  SQLite ORM"
    p3.font.name = FONT_BODY
    p3.font.size = Pt(11)
    p3.font.color.rgb = RGBColor(200, 210, 240)

    # Architecture Overview Cards (3 Columns)
    creds = [
        ("Client Layer", "React 19 + Vite 8", "Responsive Alexandria UI Theme", ACCENT_CYAN),
        ("Intelligence Layer", "FastAPI + Generative AI", "RAG Pipeline & Audio/Video", ACCENT_PURPLE),
        ("Persistence Layer", "SQLAlchemy + SQLite", "Deterministic Streak & XP Engine", ACCENT_GREEN)
    ]

    for i, (head, line1, line2, acc_col) in enumerate(creds):
        c_left = Inches(0.8 + i * 3.98)
        card = add_card(slide, c_left, Inches(4.65), Inches(3.78), Inches(2.2), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
        
        # Pill inside
        add_badge(slide, c_left + Inches(0.3), Inches(4.85), Inches(2.2), Inches(0.28), head.upper(), RGBColor(30, 25, 60), acc_col, font_size=8.5)
        
        tb_c = slide.shapes.add_textbox(c_left + Inches(0.3), Inches(5.3), Inches(3.2), Inches(1.3))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        
        pc1 = tf_c.paragraphs[0]
        pc1.text = line1
        pc1.font.name = FONT_HEADING
        pc1.font.size = Pt(13)
        pc1.font.bold = True
        pc1.font.color.rgb = TEXT_WHITE
        pc1.space_after = Pt(4)
        
        pc2 = tf_c.add_paragraph()
        pc2.text = line2
        pc2.font.name = FONT_BODY
        pc2.font.size = Pt(11)
        pc2.font.color.rgb = TEXT_MUTED

# ------------------------------------------------------------------------------
# SLIDE 2: PROBLEM STATEMENT & INDUSTRY CONTEXT
# ------------------------------------------------------------------------------
def build_slide_2(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "The Interview Preparation Disconnect",
        "Problem Formulation",
        "Traditional career preparation is fractured, generic, and lacks adaptive feedback loops."
    )

    cards_data = [
        (
            "Fragmented Ecosystem",
            "Disjointed Tools",
            "Students juggle multiple isolated tools:\n• Resumes edited on generic document builders\n• Coding practiced on LeetCode without context\n• Behavioral questions read passively from blogs\n\nNo unified system connects resume deficits to interview questions and daily remediation.",
            BORDER_PURPLE,
            ACCENT_PURPLE
        ),
        (
            "Passive Chatbot Flaw",
            "Stateless & Reactive",
            "Standard conversational chatbots fail as coaches:\n• Purely reactive: Wait for candidate prompt\n• Zero longitudinal memory of past failures\n• No scoring rubrics (STAR, Clarity, Confidence)\n• Cannot prescribe the next optimal activity\n\nChatbots answer queries; they do not build careers.",
            BORDER_CYAN,
            ACCENT_CYAN
        ),
        (
            "Blind Interviewing",
            "The Feedback Vacuum",
            "Candidates enter technical rounds unaware of:\n• Exact ATS keyword omissions vs job descriptions\n• Communication weaknesses in STAR structuring\n• Trade-off articulation under time constraints\n• Specific deficit areas requiring practice\n\nRejections occur without actionable guidance.",
            RGBColor(236, 72, 153),
            ACCENT_PINK
        )
    ]

    for i, (title, tag, text, b_col, a_col) in enumerate(cards_data):
        c_left = Inches(0.8 + i * 3.98)
        add_card(slide, c_left, Inches(2.0), Inches(3.78), Inches(4.2), bg_color=CARD_BG, border_color=b_col, border_width=1.5)
        
        add_badge(slide, c_left + Inches(0.3), Inches(2.25), Inches(2.0), Inches(0.28), tag.upper(), RGBColor(30, 25, 60), a_col, font_size=8.5)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.3), Inches(2.7), Inches(3.2), Inches(3.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEADING
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(10)
        
        lines = text.split('\n')
        for line in lines:
            p_l = tf.add_paragraph()
            p_l.text = line
            p_l.font.name = FONT_BODY
            p_l.font.size = Pt(10.5)
            p_l.font.color.rgb = TEXT_MUTED if not line.startswith('•') else TEXT_WHITE

    # Bottom Takeaway Card
    bot_card = add_card(slide, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.75), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    tb_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.45), Inches(11.3), Inches(0.55))
    tf_b = tb_b.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "💡 Key Research Insight: Job readiness requires an autonomous, closed-loop agent: Resume Audit → Skill Gap → Mock Round → Feedback → Targeted Remediation."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_GREEN

# ------------------------------------------------------------------------------
# SLIDE 3: MOTIVATION & PARADIGM SHIFT
# ------------------------------------------------------------------------------
def build_slide_3(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Paradigm Shift: AI Agent vs. Generic Chatbot",
        "Core Philosophy",
        "Positioning InterviewAI as an active career coach rather than an interactive chat prompt."
    )

    # Left Column: Generic Chatbot (Passive)
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.3), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.25), Inches(2.2), Inches(0.3), "CONVENTIONAL CHATBOT", RGBColor(40, 20, 30), ACCENT_PINK, font_size=9)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.75), Inches(5.1), Inches(3.3))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    pts_bot = [
        ("Passive Interaction", "Only responds when the user types a prompt; no initiative."),
        ("Stateless History", "Treats every question as independent; no candidate trajectory."),
        ("Generic Questions", "Dumps broad internet interview lists without calibration."),
        ("No Rubric Assessment", "Cannot score STAR structure, clarity, or trade-off depth."),
        ("No Remediation Plan", "Leaves candidate to figure out what to practice next.")
    ]
    for i, (hd, dt) in enumerate(pts_bot):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = f"❌  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(250, 150, 170)
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(11)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    # Right Column: AI Career Preparation Agent (Proactive)
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.3), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=2)
    add_badge(slide, Inches(7.1), Inches(2.25), Inches(2.5), Inches(0.3), "AI CAREER AGENT (OUR WORK)", RGBColor(20, 45, 60), ACCENT_CYAN, font_size=9)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.75), Inches(5.1), Inches(3.3))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts_agent = [
        ("Proactive Coaching", "Identifies lowest proficiencies and prescribes next best drill."),
        ("State-Aware Continuity", "Tracks streak, level, XP, and multi-session progress."),
        ("Domain-Calibrated Setup", "Tailors prompts across 6 technical tracks & 3 difficulty tiers."),
        ("Multi-Metric Evaluation", "Scores responses on 5 axes: Technical, STAR, Confidence, etc."),
        ("Adaptive Closed Loop", "Weakness detected in mock interview updates daily practice path.")
    ]
    for i, (hd, dt) in enumerate(pts_agent):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = f"✅  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(11)
        run.font.bold = False
        run.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(8)

    # Bottom Pipeline Callout
    bot_card = add_card(slide, Inches(0.8), Inches(6.45), Inches(11.7), Inches(0.65), bg_color=CARD_BG, border_color=BORDER_PURPLE)
    tb_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.52), Inches(11.3), Inches(0.5))
    tf_b = tb_b.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "🤖 Autonomous Agent Loop: [Analyze Performance] ➔ [Isolate Bottleneck] ➔ [Prioritize Impact] ➔ [Prescribe Focused Action]"
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = TEXT_WHITE

# ------------------------------------------------------------------------------
# SLIDE 4: LITERATURE SURVEY ALIGNMENT
# ------------------------------------------------------------------------------
def build_slide_4(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Research Foundations: AI Interview Assistance",
        "Literature Survey Alignment",
        "Connecting current academic research to the functional prototype implementation."
    )

    survey_pillars = [
        (
            "1. AI-Based Mock Interviews",
            "Question Generation & Flow",
            "Literature Highlights:\n• Dynamic question calibration to role & seniority\n• Paced technical probes and follow-up drills\n• Timed responses mirroring real phone screens\n\nPrototype Implementation:\n✓ Role-calibrated question bank (6 domains)\n✓ Live 3-minute per-question countdown timer\n✓ Adaptive difficulty escalation / reinforcement",
            BORDER_PURPLE,
            ACCENT_PURPLE
        ),
        (
            "2. Multi-Metric Evaluation",
            "Performance Assessment",
            "Literature Highlights:\n• Evaluating structure (STAR framework)\n• Technical concept depth & vocabulary usage\n• Decisiveness and delivery confidence metrics\n\nPrototype Implementation:\n✓ 5-Dimension rubric heuristic scoring\n✓ Question-by-question performance accordion\n✓ Concrete strengths and areas to improve",
            BORDER_CYAN,
            ACCENT_CYAN
        ),
        (
            "3. Skill Gap Detection",
            "Competency Benchmarking",
            "Literature Highlights:\n• Mapping evaluated answers to market criteria\n• Isolating critical hiring threshold deficits\n• Formulating custom remediation roadmaps\n\nPrototype Implementation:\n✓ 8-Skill profile with 6-axis SVG Radar Chart\n✓ Dynamic ranking of Top 3 bottleneck skills\n✓ 4-Step personalized preparation pathway",
            RGBColor(34, 197, 94),
            ACCENT_GREEN
        ),
        (
            "4. Multimodal Analysis",
            "Speech & Gesture Analytics",
            "Literature Highlights:\n• Acoustic speech emotion & pitch analysis\n• Facial expression & eye-gaze tracking\n• Real-time speech-to-text / text-to-speech\n\nPrototype Scope Mapping:\n→ Honest Academic Boundary: Mapped as Future Scope (Phase 2)\n→ Voice Mode signposted as 'Coming Soon'",
            BORDER_MUTED,
            TEXT_MUTED
        )
    ]

    for i, (title, tag, text, b_col, a_col) in enumerate(survey_pillars):
        c_left = Inches(0.8 + i * 2.98)
        add_card(slide, c_left, Inches(2.0), Inches(2.83), Inches(4.35), bg_color=CARD_BG, border_color=b_col, border_width=1.5)
        
        add_badge(slide, c_left + Inches(0.2), Inches(2.18), Inches(1.8), Inches(0.26), tag.upper(), RGBColor(30, 25, 60), a_col, font_size=8)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.2), Inches(2.55), Inches(2.45), Inches(3.7))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEADING
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(8)
        
        for line in text.split('\n'):
            p_l = tf.add_paragraph()
            p_l.text = line
            p_l.font.name = FONT_BODY
            p_l.font.size = Pt(9.5)
            if line.startswith('✓'):
                p_l.font.color.rgb = ACCENT_GREEN
                p_l.font.bold = True
            elif line.startswith('→'):
                p_l.font.color.rgb = ACCENT_AMBER
            elif line.endswith(':'):
                p_l.font.color.rgb = TEXT_WHITE
                p_l.font.bold = True
            else:
                p_l.font.color.rgb = TEXT_MUTED

    # Bottom Note
    bot = add_card(slide, Inches(0.8), Inches(6.5), Inches(11.733), Inches(0.6), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    tb_bot = slide.shapes.add_textbox(Inches(1.0), Inches(6.55), Inches(11.3), Inches(0.5))
    tf_bot = tb_bot.text_frame
    p_bot = tf_bot.paragraphs[0]
    p_bot.text = "📌 Architectural Positioning: The system realizes all core software & decision components while preserving advanced multimodal sensory analytics for future engineering."
    p_bot.font.name = FONT_BODY
    p_bot.font.size = Pt(10)
    p_bot.font.color.rgb = TEXT_MUTED

# ------------------------------------------------------------------------------
# SLIDE 5: PROPOSED SOLUTION OVERVIEW
# ------------------------------------------------------------------------------
def build_slide_5(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Proposed Solution: AI Career Preparation Agent",
        "System Overview",
        "A cohesive client-side web application linking resume analysis, mock rounds, and daily gamified practice."
    )

    modules = [
        ("1. Intelligent Setup", "Role Calibration", "Select from 6 engineering tracks (ML, SWE, Data Science) and 3 difficulty tiers with resume & JD ingestion.", ACCENT_CYAN),
        ("2. Mock Interview", "Timed Simulation", "Active 3:00 timer, word counter, question progression, and adaptive difficulty escalation / reinforcement.", ACCENT_PURPLE),
        ("3. Performance Evaluator", "Multi-Metric Scoring", "Evaluates answers across 5 rubric axes with circular score gauges, strengths, improvements, and decision timeline.", ACCENT_PINK),
        ("4. Skill Gap Analyzer", "SVG Radar Footprint", "Trigonometric 6-axis radar visualizer isolating Top 3 candidate bottlenecks and prescribing 4-step learning paths.", ACCENT_GREEN),
        ("5. ATS Resume Scanner", "Keyword Audit", "Audits resumes against job descriptions, identifying matched vs missing critical engineering keywords (84/100 score).", ACCENT_AMBER),
        ("6. Gamified Control Center", "Dashboard & Streaks", "Central command dashboard tracking 7-day streak, XP level progression, interactive daily practice plan, and achievements.", ACCENT_CYAN)
    ]

    for i, (title, subtitle, desc, acc_col) in enumerate(modules):
        col = i % 3
        row = i // 3
        c_left = Inches(0.8 + col * 3.98)
        c_top = Inches(2.0 + row * 2.3)
        
        add_card(slide, c_left, c_top, Inches(3.78), Inches(2.15), bg_color=CARD_BG, border_color=BORDER_MUTED)
        add_badge(slide, c_left + Inches(0.25), c_top + Inches(0.2), Inches(1.8), Inches(0.25), subtitle.upper(), RGBColor(30, 25, 60), acc_col, font_size=8)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.25), c_top + Inches(0.55), Inches(3.28), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEADING
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(4)
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED

    # Bottom Summary
    bot = add_card(slide, Inches(0.8), Inches(6.75), Inches(11.733), Inches(0.45), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    tb_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.78), Inches(11.3), Inches(0.35))
    p_b = tb_b.text_frame.paragraphs[0]
    p_b.text = "🎯 Core Platform Achievement: Zero dead ends across 13 routes — every page actively informs and updates the user's career state."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = TEXT_WHITE

# ------------------------------------------------------------------------------
# SLIDE 6: PROJECT OBJECTIVES & SCOPE BOUNDARIES
# ------------------------------------------------------------------------------
def build_slide_6(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Project Objectives & Scope Boundaries",
        "Project Scope",
        "Defining explicit academic expectations, technical deliverables, and non-goals."
    )

    # Left Column: Primary Academic Objectives
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.25), Inches(2.4), Inches(0.3), "CORE ACADEMIC OBJECTIVES", RGBColor(35, 20, 65), ACCENT_PURPLE, font_size=9)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.75), Inches(5.1), Inches(3.5))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    objs = [
        ("High-Fidelity AI SaaS UI", "Implement a dark-themed, glassmorphic, responsive frontend following modern design systems."),
        ("Complete Candidate Journey", "Ensure 100% functional user flow: Landing ➔ Setup ➔ Mock ➔ Feedback ➔ Skill Gap ➔ Dashboard."),
        ("Autonomous Agent Behavior", "Demonstrate rule-based decision logic that dynamically recommends remediation based on evaluated deficits."),
        ("Zero-Dependency Data Visuals", "Design pure SVG radar and line charts without external bloat or React 19 compatibility issues."),
        ("Gamified Habit Formation", "Encourage consistency through streaks, XP accumulation, daily challenges, and unlocked achievements.")
    ]
    for i, (hd, dt) in enumerate(objs):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = f"🎯  {hd}\n"
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Right Column: Scope Boundaries
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED, border_width=1.5)
    add_badge(slide, Inches(7.1), Inches(2.25), Inches(2.4), Inches(0.3), "SCOPE & BOUNDARY INTEGRITY", RGBColor(25, 30, 60), ACCENT_CYAN, font_size=9)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.75), Inches(5.1), Inches(3.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    scopes = [
        ("What This System IS", "• A functional full-stack career preparation platform / proof-of-concept\n• Client-side deterministic evaluation & agent reasoning\n• Persistent state architecture with FastAPI backend\n• High-engagement UI demonstrating the entire product vision"),
        ("What This System IS NOT", "• NOT a commercial production SaaS platform\n• NO paid external LLM API dependencies or token latency required\n• NO complex third-party tracking scripts\n• NO ungrounded hallucinated scoring models")
    ]
    for i, (hd, dt) in enumerate(scopes):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = f"📌  {hd}\n"
        p.font.name = FONT_HEADING
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN if "IS" in hd else ACCENT_AMBER
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_WHITE if "IS" in hd else TEXT_MUTED
        p.space_after = Pt(12)

    # Bottom Note
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG, border_color=BORDER_PURPLE)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "⚖️ Academic Honesty: All prototype capabilities are accurately documented; future sensory/cloud features are explicitly segmented."
    p_b.font.name = FONT_BODY
    p_b.font.size = Pt(9.5)
    p_b.font.color.rgb = TEXT_MUTED

# ------------------------------------------------------------------------------
# SLIDE 7: SYSTEM ARCHITECTURE & AGENT ENGINE
# ------------------------------------------------------------------------------
def build_slide_7(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "System Architecture & Autonomous Decision Engine",
        "Technical Architecture",
        "A decoupled 3-tier client architecture separating UI presentation, state persistence, and agent logic."
    )

    # 3 Layers Stack
    layers = [
        (
            "Layer 1: Presentation & Interaction Tier",
            "UI / Component Framework",
            "• Built with React 19 and Tailwind CSS v4 for sub-second reactive rendering\n• 13 Dedicated Pages with glassmorphic cards, responsive grids, and micro-interactions\n• Custom Mathematical SVG Visualizers: 6-Axis Radar Chart & Cubic-Bezier Line Chart\n• Zero third-party chart dependencies ensuring long-term build stability",
            BORDER_PURPLE, ACCENT_PURPLE
        ),
        (
            "Layer 2: State Management & Persistence Tier",
            "Context & LocalStorage",
            "• InterviewContext: Tracks active setup, question timers, submitted answers, and rubric scores\n• AuthContext: Manages demo user session, level calculations (500 XP/tier), and streak\n• LocalStorage Sync: Keys for interview history, ATS audits, streak dates, and daily challenges\n• Cross-Page Data Flow: Live interview evaluations instantly update Dashboard & Skill Gap",
            BORDER_CYAN, ACCENT_CYAN
        ),
        (
            "Layer 3: Autonomous Agent Decision Engine",
            "Deterministic Rule Heuristics",
            "• evaluator.js: Multi-metric rubric engine scoring Technical, Structure, Clarity, and Confidence\n• skillGapAnalyzer.js: Categorizes skills into Strong (≥80%), Needs Practice, and Priority (<65%)\n• Dynamic Bottleneck Ranking: Sorts proficiencies ascending to isolate Top 3 critical deficits\n• Adaptive Pacing Engine: Escalates difficulty (≥8.0) or reinforces foundational checks (<6.5)",
            BORDER_MUTED, ACCENT_GREEN
        )
    ]

    for i, (title, tag, text, b_col, a_col) in enumerate(layers):
        c_top = Inches(2.0 + i * 1.5)
        add_card(slide, Inches(0.8), c_top, Inches(11.733), Inches(1.35), bg_color=CARD_BG, border_color=b_col, border_width=1.5)
        
        add_badge(slide, Inches(1.1), c_top + Inches(0.18), Inches(2.4), Inches(0.24), tag.upper(), RGBColor(30, 25, 60), a_col, font_size=8)
        
        tb = slide.shapes.add_textbox(Inches(1.1), c_top + Inches(0.48), Inches(11.1), Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEADING
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)
        
        p2 = tf.add_paragraph()
        p2.text = text
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED

    # Concrete Rule Box at bottom
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "⚡ Concrete Agent Rule: IF (Communication < 70) ➔ Prescribe STAR Drill  |  IF (Lowest = System Design @ 61%) ➔ Dashboard CTA Routes to Architecture Drill"
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_CYAN

# ------------------------------------------------------------------------------
# SLIDE 8: TECHNOLOGY STACK
# ------------------------------------------------------------------------------
def build_slide_8(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Technology Stack & Implementation Details",
        "Technology Stack",
        "Engineered with modern frontend standards focusing on lightweight execution and zero dependencies."
    )

    techs = [
        (
            "Frontend Core",
            "React 19 + Vite 8",
            "• Modern React v19 component architecture\n• Vite v8 for lightning-fast HMR and 1.05s builds\n• Pure client-side routing via React Router DOM v7\n• ProtectedRoute wrappers and return-path memory\n• Modular layout architecture with shared AppLayout shell",
            BORDER_PURPLE, ACCENT_PURPLE
        ),
        (
            "Styling & Design System",
            "Tailwind CSS v4 + Glassmorphism",
            "• Tailwind CSS v4 compiler integration (@tailwindcss/vite)\n• Custom CSS glow filters, blur backdrops, and radial gradients\n• Purple (#7C3AED) and Cyan (#06B6D4) futuristic AI theme\n• Fully responsive CSS Grid & Flexbox (mobile, tablet, desktop)\n• Zero horizontal overflow across all 13 application views",
            BORDER_CYAN, ACCENT_CYAN
        ),
        (
            "Visual Data Graphics",
            "Zero-Dependency Pure SVG",
            "• RadarChart.jsx: Pure trigonometric SVG spider chart\n  - Concentric polygon grids, vertex indicator dots, labeled axes\n• PerformanceChart.jsx: Pure SVG line & area chart\n  - Smooth cubic-bezier curved paths, glowing data points\n• Zero external chart libraries (eliminates React 19 version clashes)",
            RGBColor(34, 197, 94), ACCENT_GREEN
        ),
        (
            "State & Local Persistence",
            "React Context + Web Storage",
            "• AuthContext: Manages demo user session, level tiers, and streak\n• InterviewContext: Tracks questions, timers, answers, and evaluations\n• LocalStorage Keys:\n  - interview_ai_history (recent sessions & rubrics)\n  - interview_ai_ats_result (latest resume scan data)\n  - interview_ai_daily_challenge (streak and habit tracking)",
            BORDER_MUTED, ACCENT_AMBER
        )
    ]

    for i, (title, tag, text, b_col, a_col) in enumerate(techs):
        col = i % 2
        row = i // 2
        c_left = Inches(0.8 + col * 5.98)
        c_top = Inches(2.0 + row * 2.35)
        
        add_card(slide, c_left, c_top, Inches(5.75), Inches(2.2), bg_color=CARD_BG, border_color=b_col, border_width=1.5)
        add_badge(slide, c_left + Inches(0.25), c_top + Inches(0.2), Inches(2.2), Inches(0.25), tag.upper(), RGBColor(30, 25, 60), a_col, font_size=8)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.25), c_top + Inches(0.55), Inches(5.25), Inches(1.55))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEADING
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(4)
        
        for line in text.split('\n'):
            p_l = tf.add_paragraph()
            p_l.text = line
            p_l.font.name = FONT_BODY
            p_l.font.size = Pt(9.5)
            p_l.font.color.rgb = TEXT_MUTED if not line.startswith('  -') else TEXT_WHITE

    # Bottom metric
    bot = add_card(slide, Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.4), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.82), Inches(11.3), Inches(0.35)).text_frame.paragraphs[0]
    p_b.text = "⚡ Build Performance: Production bundle compiles cleanly in 1.05s (dist: 82 KB CSS, 495 KB JS) with 0 errors."
    p_b.font.name = FONT_BODY
    p_b.font.size = Pt(9.5)
    p_b.font.color.rgb = TEXT_MUTED

# ------------------------------------------------------------------------------
# SLIDE 9: APPLICATION USER JOURNEY
# ------------------------------------------------------------------------------
def build_slide_9(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Complete Candidate Preparation Journey",
        "User Flow Architecture",
        "Demonstrating both the primary mock interview journey and the secondary resume audit loop."
    )

    # Primary Journey (Top)
    add_card(slide, Inches(0.8), Inches(1.95), Inches(11.733), Inches(2.6), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.1), Inches(3.2), Inches(0.26), "PRIMARY JOURNEY: MOCK INTERVIEW TO HABIT", RGBColor(35, 25, 75), ACCENT_PURPLE, font_size=8.5)

    steps_primary = [
        ("01. Landing", "Hero & CTA"),
        ("02. Setup", "Role & Tier"),
        ("03. Ready", "Rubric Brief"),
        ("04. Mock", "Adaptive Timer"),
        ("05. Feedback", "82% Multi-Score"),
        ("06. Skill Gap", "Radar & Deficits"),
        ("07. Daily Drill", "+50 XP Award"),
        ("08. Dashboard", "Central Command")
    ]

    for idx, (st, sub) in enumerate(steps_primary):
        bx_left = Inches(1.1 + idx * 1.39)
        bx = add_card(slide, bx_left, Inches(2.55), Inches(1.28), Inches(1.7), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
        
        tb = slide.shapes.add_textbox(bx_left, Inches(2.7), Inches(1.28), Inches(1.4))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = st
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_CYAN
        p1.alignment = PP_ALIGN.CENTER
        
        p2 = tf.add_paragraph()
        p2.text = sub
        p2.font.name = FONT_BODY
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.alignment = PP_ALIGN.CENTER

    # Secondary Journey (Bottom)
    add_card(slide, Inches(0.8), Inches(4.75), Inches(11.733), Inches(2.4), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(4.9), Inches(3.2), Inches(0.26), "SECONDARY JOURNEY: RESUME AUDIT & GAP REMEDIATION", RGBColor(20, 45, 60), ACCENT_CYAN, font_size=8.5)

    steps_sec = [
        ("01. Dashboard", "Select Resume/ATS"),
        ("02. ATS Scanner", "Upload PDF & Job Desc"),
        ("03. Audit Report", "84/100 Keyword Match"),
        ("04. Missing Terms", "Detect Cloud/Docker Gap"),
        ("05. Skill Gap", "Prioritize Weak Areas"),
        ("06. Practice Drill", "Resolve Identified Deficit")
    ]

    for idx, (st, sub) in enumerate(steps_sec):
        bx_left = Inches(1.1 + idx * 1.88)
        bx = add_card(slide, bx_left, Inches(5.35), Inches(1.72), Inches(1.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
        
        tb = slide.shapes.add_textbox(bx_left, Inches(5.5), Inches(1.72), Inches(1.2))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = st
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(10.5)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_GREEN
        p1.alignment = PP_ALIGN.CENTER
        
        p2 = tf.add_paragraph()
        p2.text = sub
        p2.font.name = FONT_BODY
        p2.font.size = Pt(9)
        p2.font.color.rgb = TEXT_MUTED
        p2.alignment = PP_ALIGN.CENTER

# ------------------------------------------------------------------------------
# SLIDE 10: MOCK INTERVIEW & FEEDBACK
# ------------------------------------------------------------------------------
def build_slide_10(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Simulating Realistic Technical Interviews",
        "Core Module 1: Interview & Feedback",
        "Timed candidate response recording paired with multi-dimension rubric evaluation."
    )

    # Left Column: Mock Interview Page
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.2), Inches(2.2), Inches(0.26), "MOCK INTERVIEW SIMULATOR", RGBColor(35, 25, 75), ACCENT_PURPLE, font_size=8.5)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    pts_mock = [
        ("Per-Question Timer", "Active 3:00 minute countdown per question enforcing concise articulation under pressure."),
        ("Progression & Word Counter", "Tracks 'Question X of Y' progression with real-time response length validation."),
        ("Domain Question Banks", "Curated technical, behavioral (STAR), HR, and role-based prompts across 6 tracks."),
        ("Adaptive Pacing Triggers", "Scores ≥8.0 escalate difficulty to Advanced; scores <6.5 trigger foundational checks."),
        ("Voice Mode Signposting", "Transparently marked as '🎤 Voice Mode — Coming Soon' (Phase 2 scope boundary).")
    ]
    for i, (hd, dt) in enumerate(pts_mock):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = f"⏱️  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Right Column: Interview Feedback Page
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=1.5)
    add_badge(slide, Inches(7.1), Inches(2.2), Inches(2.2), Inches(0.26), "FEEDBACK & PERFORMANCE REPORT", RGBColor(20, 45, 60), ACCENT_CYAN, font_size=8.5)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts_feed = [
        ("Composite Score Gauge", "Generates overall score (e.g. 82/100) with circular SVG visual progress ring."),
        ("5 Evaluation Rubric Axes", "Scored across Technical Knowledge (86%), Problem Solving (79%), STAR (84%), Relevance (88%), Confidence (76%)."),
        ("Candidate Accordion", "Expandable breakdown showing questions, submitted text, and rubric feedback."),
        ("Agent Decision Timeline", "5-step transparent visualization from Response Evaluated to Practice Recommended."),
        ("Actionable Next Steps", "Direct routing into Skill Gap Analyzer and personalized high-yield drills.")
    ]
    for i, (hd, dt) in enumerate(pts_feed):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = f"📊  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Bottom Banner
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "🎯 Academic Integrity: Evaluator utilizes deterministic multi-metric scoring rules rather than pretending a production neural LLM is running."
    p_b.font.name = FONT_BODY
    p_b.font.size = Pt(9.5)
    p_b.font.color.rgb = TEXT_MUTED

# ------------------------------------------------------------------------------
# SLIDE 11: ATS RESUME SCANNER PROTOTYPE
# ------------------------------------------------------------------------------
def build_slide_11(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Resume Intelligence & Keyword Auditing",
        "Core Module 2: ATS Scanner",
        "Simulated Applicant Tracking System audit matching candidate credentials to job descriptions."
    )

    # Left Column: Upload & Simulation Workflow
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.2), Inches(2.2), Inches(0.26), "ATS PARSING WORKFLOW", RGBColor(35, 25, 75), ACCENT_PURPLE, font_size=8.5)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    pts_ats1 = [
        ("Resume Ingestion Dropzone", "Accepts PDF/DOCX resumes (simulated extraction of Alex_Rivera_Resume.pdf)."),
        ("Job Description Input", "Editable textarea for pasting target engineering job specs and requirements."),
        ("Prototype Parsing Engine", "Simulates tokenization and semantic dictionary cross-referencing."),
        ("Overall Compatibility Score", "Outputs an 84/100 composite ATS readiness score with circular gauge."),
        ("LocalStorage Persistence", "Saves audit results (interview_ai_ats_result) for instant Dashboard display.")
    ]
    for i, (hd, dt) in enumerate(pts_ats1):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = f"📄  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    # Right Column: Keyword Match & Honest Disclosure
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=1.5)
    add_badge(slide, Inches(7.1), Inches(2.2), Inches(2.4), Inches(0.26), "KEYWORD AUDIT BREAKDOWN", RGBColor(20, 45, 60), ACCENT_CYAN, font_size=8.5)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts_ats2 = [
        ("Granular Sub-Metrics", "Keyword Match (91%), Skills Alignment (88%), Formatting (76%), Project Impact (72%), Experience Match (82%)."),
        ("Matched Keywords (13)", "✓ Python, PyTorch, Scikit-Learn, NLP, Model Training, Git, Pandas, NumPy..."),
        ("Missing Critical Keywords (5)", "⚠️ Docker, AWS SageMaker, Kubernetes, MLflow, CI/CD Pipelines (High Priority)"),
        ("Recommended Keywords", "⚡ Distributed Training, Latency Optimization, ONNX/TensorRT, Feature Stores"),
        ("Honest Academic Guidance", "Explicitly advises candidates: 'Add relevant keywords only when they accurately represent your skills.' Labeled as Prototype ATS Score.")
    ]
    for i, (hd, dt) in enumerate(pts_ats2):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = f"🔍  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN if "Matched" in hd else ACCENT_PINK if "Missing" in hd else ACCENT_AMBER
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Bottom Callout
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "💡 ATS Connection: Uncovered missing keywords directly feed into the Skill Gap Analyzer to prioritize interview question topics."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_CYAN

# ------------------------------------------------------------------------------
# SLIDE 12: SKILL GAP ANALYZER
# ------------------------------------------------------------------------------
def build_slide_12(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Identifying & Resolving Competency Deficits",
        "Core Module 3: Skill Gap Analyzer",
        "Trigonometric 6-axis SVG radar visualization coupled with dynamic bottleneck ranking."
    )

    # Left Column: Skill Profile & Radar
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.2), Inches(2.4), Inches(0.26), "COMPETENCY MATRIX & RADAR", RGBColor(35, 25, 75), ACCENT_PURPLE, font_size=8.5)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    pts_sg1 = [
        ("8 Core Engineering Skills", "ML (86%), Python (82%), Communication (78%), Problem Solving (74%), Behavioral (70%), Confidence (68%), SQL (64%), System Design (61%)."),
        ("3-Tier Status Classification", "• Strong (≥80%): Above market hiring bar\n• Needs Practice (65–79%): Inconsistent under pressure\n• Priority (<65%): Critical hiring risk bottleneck"),
        ("Zero-Dependency SVG Radar", "Mathematical 6-axis spider chart with concentric web polygons, radial gradient fill, and vertex indicator points."),
        ("Historical Calibration", "Reflects +6% readiness increase (72% ➔ 78%) compared to diagnostic baseline.")
    ]
    for i, (hd, dt) in enumerate(pts_sg1):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = f"🎯  {hd}\n"
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Right Column: Bottleneck Ranking & Roadmaps
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=1.5)
    add_badge(slide, Inches(7.1), Inches(2.2), Inches(2.4), Inches(0.26), "BOTTLENECKS & LEARNING PATH", RGBColor(20, 45, 60), ACCENT_CYAN, font_size=8.5)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts_sg2 = [
        ("Top 3 Skill Gaps Isolated", "#1 System Design (61% Priority: High)\n#2 SQL & Data (64% Priority: High)\n#3 Delivery Confidence (68% Priority: Medium)"),
        ("Contextual Rationale", "Explains WHY each deficit impacts hiring outcomes and prescribes exact remedial drills."),
        ("4-Step Personalized Path", "Sequential preparation roadmap with Step 1 highlighted ('Recommended Now: System Design Foundations')."),
        ("Prevents Redundant Practice", "Agent filters out strong skills (e.g. ML 86%) to focus candidate energy solely on offer-blocking weaknesses.")
    ]
    for i, (hd, dt) in enumerate(pts_sg2):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = f"📈  {hd}\n"
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Bottom Banner
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "🤖 Agent Decision: SortAscending(Skills) isolates System Design as lowest proficiency ➔ Injects targeted practice into Dashboard CTA."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_CYAN

# ------------------------------------------------------------------------------
# SLIDE 13: GAMIFICATION ENGINE
# ------------------------------------------------------------------------------
def build_slide_13(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Gamification: Daily Challenge, Streak & XP",
        "Consistency & Habit Formation",
        "Driving consistent student preparation via gamified milestones, levels, and achievements."
    )

    cards = [
        (
            "Daily Challenge Module",
            "Habit Builder",
            "• Daily conceptual articulation question:\n  'Explain Supervised vs. Unsupervised Learning'\n• Integrated 5-minute countdown timer\n• High-scoring sample response auto-fill\n• Instant deterministic evaluator feedback\n• Awards +50 XP and maintains active streak",
            BORDER_PURPLE, ACCENT_PURPLE
        ),
        (
            "Streak & Level System",
            "Gamified Retention",
            "• 7-Day active streak tracker with daily checks\n  (M  T  W  T  F  S  S)\n• Calibrated Level Formula: 500 XP per tier\n  - Level 1: 0–499 XP\n  - Level 2: 500–999 XP\n  - Level 3: 1000–1499 XP (Current: L12 @ 1240 XP)\n• Progress bars track distance to next level",
            BORDER_CYAN, ACCENT_CYAN
        ),
        (
            "Dynamic Achievements",
            "Milestone Unlocks",
            "• Honest badge unlock state linked to local activity:\n  ✓ First Interview (Completed mock session)\n  ✓ 7-Day Streak (Active 7 consecutive days)\n  ✓ Resume Optimizer (ATS scan audited)\n  ✓ Practice Champion (Daily drill solved)\n  🔒 30-Day Streak (Progress 23%)",
            RGBColor(34, 197, 94), ACCENT_GREEN
        )
    ]

    for i, (title, tag, text, b_col, a_col) in enumerate(cards):
        c_left = Inches(0.8 + i * 3.98)
        add_card(slide, c_left, Inches(2.0), Inches(3.78), Inches(4.35), bg_color=CARD_BG, border_color=b_col, border_width=1.5)
        add_badge(slide, c_left + Inches(0.25), Inches(2.2), Inches(2.0), Inches(0.26), tag.upper(), RGBColor(30, 25, 60), a_col, font_size=8)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.25), Inches(2.6), Inches(3.28), Inches(3.5))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_HEADING
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(8)
        
        for line in text.split('\n'):
            p_l = tf.add_paragraph()
            p_l.text = line
            p_l.font.name = FONT_BODY
            p_l.font.size = Pt(9.5)
            p_l.font.color.rgb = TEXT_MUTED if not (line.startswith('✓') or line.startswith('🔒')) else (ACCENT_GREEN if line.startswith('✓') else ACCENT_AMBER)

    # Bottom Note
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "💾 Lightweight Architecture: All gamification progress persists in browser localStorage without requiring a heavy backend database."
    p_b.font.name = FONT_BODY
    p_b.font.size = Pt(9.5)
    p_b.font.color.rgb = TEXT_MUTED

# ------------------------------------------------------------------------------
# SLIDE 14: DASHBOARD & PROGRESS
# ------------------------------------------------------------------------------
def build_slide_14(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Centralized Candidate Control Center",
        "Dashboard & Progress Analytics",
        "The focal hub synthesizing interview performance, skill gaps, ATS audits, and longitudinal progress."
    )

    # Left Column: Dashboard Hub
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.2), Inches(2.4), Inches(0.26), "MAIN DASHBOARD HUB (/DASHBOARD)", RGBColor(35, 25, 75), ACCENT_PURPLE, font_size=8.5)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    pts_dash = [
        ("Four Core Candidate Metric Cards", "Streak (7 Days), Total XP (1,240), Readiness (78%), and ATS Score (84/100)."),
        ("AI Coach Recommendation Card", "Prominent card prescribing 'Focus on Confidence & Problem Solving' with expandable 'Why this recommendation?' rationale drawer."),
        ("Interactive Practice Plan", "Task checklist showing 2/3 completed (67% progress) with live toggle and XP awards."),
        ("Clickable Recent Interviews", "Direct routing to historical evaluation feedback reports."),
        ("AI Agent Active Indicator", "Pulsing emerald status badge reminding user of active coaching intelligence.")
    ]
    for i, (hd, dt) in enumerate(pts_dash):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = f"🎛️  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Right Column: Longitudinal Progress
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=1.5)
    add_badge(slide, Inches(7.1), Inches(2.2), Inches(2.4), Inches(0.26), "PROGRESS ANALYTICS (/PROGRESS)", RGBColor(20, 45, 60), ACCENT_CYAN, font_size=8.5)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts_prog = [
        ("Score Progression Line Chart", "Visualizes exact interview score growth: Interview 1 (68) ➔ Int 2 (72) ➔ Int 3 (75) ➔ Int 4 (78) ➔ Current (82)."),
        ("+14 Point Trajectory Net Gain", "Clearly highlights transition from diagnostic baseline to target offer readiness threshold."),
        ("4-Week Bar Chart Trajectory", "Visual composite tracking across Week 1 (68%) through Week 4 (82%)."),
        ("Competency Delta Indicators", "+12% Technical Knowledge, +8% Communication (STAR), +14% Confidence & Delivery.")
    ]
    for i, (hd, dt) in enumerate(pts_prog):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = f"📈  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_GREEN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    # Bottom Note
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "🔄 Dynamic Synthesis: When a user finishes a mock interview or ATS scan, the Dashboard immediately updates without page reloads."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_CYAN

# ------------------------------------------------------------------------------
# SLIDE 15: IMPLEMENTED VS FUTURE SCOPE
# ------------------------------------------------------------------------------
def build_slide_15(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Academic Honesty: Implemented vs. Future Scope",
        "System Boundaries",
        "A rigorous, transparent comparison between what is built today and what belongs to Phase 2 production."
    )

    # Left Column: Implemented in Prototype (16 items)
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_PURPLE, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.2), Inches(2.6), Inches(0.26), "IMPLEMENTED IN PROTOTYPE (16 FEATURES)", RGBColor(25, 45, 35), ACCENT_GREEN, font_size=8.5)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.55), Inches(5.1), Inches(3.8))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    pts_impl = [
        "✓  Full React 19 + Vite Frontend with 13 Connected Routes",
        "✓  Futuristic Purple + Cyan AI SaaS Design & Glassmorphic Cards",
        "✓  Multi-Track Interview Setup (6 Domains, 4 Types, 3 Tiers)",
        "✓  Timed Mock Interview Simulator with Adaptive Question Difficulty",
        "✓  Deterministic Multi-Metric Scoring Engine (5 Rubric Axes)",
        "✓  Automated Interview Feedback Report & Accordion Transcripts",
        "✓  Visible 5-Step Agent Decision Timeline",
        "✓  Skill Gap Analyzer with Zero-Dependency 6-Axis SVG Radar Chart",
        "✓  Dynamic Top 3 Bottleneck Ranking & 4-Step Preparation Path",
        "✓  Simulated ATS Scanner with Keyword Match vs Missing Analysis",
        "✓  Daily Challenge System ('Supervised vs. Unsupervised Learning')",
        "✓  Streak Tracking (7-Day Checkmark Bar) & Level Progression",
        "✓  Centralized Command Dashboard with AI Coach Recommendations",
        "✓  Longitudinal Score Progression Chart (+14 Points Trajectory)",
        "✓  Dynamic Gamified Achievement Badge Milestone Unlocks",
        "✓  Client-Side State Persistence via Browser LocalStorage"
    ]
    for i, item in enumerate(pts_impl):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = item
        p.font.name = FONT_BODY
        p.font.size = Pt(8.8)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)

    # Right Column: Future Scope (Phase 2)
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED, border_width=1.5)
    add_badge(slide, Inches(7.1), Inches(2.2), Inches(2.6), Inches(0.26), "FUTURE SCOPE ROADMAP (PHASE 2)", RGBColor(40, 30, 20), ACCENT_AMBER, font_size=8.5)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.55), Inches(5.1), Inches(3.8))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts_fut = [
        "→  Real LLM Integration (Gemini 2.5 Flash via @google/genai SDK)",
        "→  Real-Time Bidirectional Voice Interviewer (Gemini Live API)",
        "→  Native Speech-to-Text (STT) & Text-to-Speech (TTS) Pipeline",
        "→  Speech Emotion Recognition (Pitch, Cadence, Tone Analysis)",
        "→  Computer Vision Gesture & Facial Expression Assessment",
        "→  Eye-Contact & Gaze Tracking using WebRTC Video Feeds",
        "→  Deep Semantic Answer Similarity & Knowledge Graph Traversal",
        "→  Production Enterprise ATS Parser with Vector DB Indexing",
        "→  Cloud PostgreSQL Database with Multi-Tenant Candidate Sync",
        "→  Production OAuth 2.0 / Firebase Security Authentication",
        "→  Automated Video Mock Playback with Timestamped Criticisms",
        "→  Cohort Peer Benchmarking and Global University Leaderboards"
    ]
    for i, item in enumerate(pts_fut):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = item
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(4)

    # Bottom Integrity Note
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG, border_color=BORDER_PURPLE)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "🛡️ Scope Boundary: Advanced enterprise telemetry and cloud data warehouse connectors are planned for future engineering iterations."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_CYAN

# ------------------------------------------------------------------------------
# SLIDE 16: ADVANTAGES & LIMITATIONS
# ------------------------------------------------------------------------------
def build_slide_16(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Critical Evaluation: Advantages & Limitations",
        "Critical Evaluation",
        "An honest engineering appraisal of prototype strengths and operational limitations."
    )

    # Left Column: Advantages
    c1 = add_card(slide, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=1.5)
    add_badge(slide, Inches(1.1), Inches(2.2), Inches(2.2), Inches(0.26), "PROTOTYPE ADVANTAGES", RGBColor(20, 45, 60), ACCENT_CYAN, font_size=8.5)

    tb1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    pts_adv = [
        ("Unified Ecosystem", "Connects resume auditing, mock interviewing, and skill gap remediation in a single fluid application."),
        ("Agentic Continuous Loop", "Replaces passive question dumping with an active coach that prescribes high-yield actions based on evaluated deficits."),
        ("High Visual Engagement", "Futuristic AI theme with responsive dark-mode cards, glowing indicators, and zero-dependency SVG charts."),
        ("Gamified Habit Formation", "Streak counters, XP awards, and daily challenges encourage consistent daily preparation."),
        ("Zero Latency & Cost", "Runs entirely client-side without external API downtime, cloud bills, or backend infrastructure failures.")
    ]
    for i, (hd, dt) in enumerate(pts_adv):
        p = tf1.paragraphs[0] if i == 0 else tf1.add_paragraph()
        p.text = f"🌟  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(8)

    # Right Column: Limitations
    c2 = add_card(slide, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.5), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED, border_width=1.5)
    add_badge(slide, Inches(7.1), Inches(2.2), Inches(2.2), Inches(0.26), "HONEST LIMITATIONS", RGBColor(40, 25, 25), ACCENT_PINK, font_size=8.5)

    tb2 = slide.shapes.add_textbox(Inches(7.1), Inches(2.6), Inches(5.1), Inches(3.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts_lim = [
        ("Rule-Based Heuristic Evaluation", "Uses deterministic rubric heuristics rather than nuanced semantic deep-learning evaluation."),
        ("Client-Side Storage Only", "Data is persisted in browser localStorage; clearing browser cache clears candidate progress."),
        ("Simulated ATS Parser", "Keyword extraction matches a curated engineering taxonomy rather than proprietary ATS enterprise engines."),
        ("No Real-Time Audio or Vision", "Voice mode is signposted but requires Phase 2 integration for acoustic/visual emotion detection."),
        ("Single Candidate Session", "Lacks multi-user authentication, cloud syncing, and multi-device profile handoffs.")
    ]
    for i, (hd, dt) in enumerate(pts_lim):
        p = tf2.paragraphs[0] if i == 0 else tf2.add_paragraph()
        p.text = f"⚠️  {hd}: "
        p.font.name = FONT_HEADING
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_PINK
        
        run = p.add_run()
        run.text = dt
        run.font.name = FONT_BODY
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    # Bottom Banner
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG, border_color=BORDER_PURPLE)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "🎯 Engineering Trade-off: Prioritized complete front-to-back user experience and zero-latency local evaluation."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = TEXT_MUTED

# ------------------------------------------------------------------------------
# SLIDE 17: LIVE DEMONSTRATION FLOW
# ------------------------------------------------------------------------------
def build_slide_17(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)
    add_header(
        slide,
        "Live Demonstration Walkthrough Script",
        "Evaluation Demo Script",
        "Step-by-step evaluator script demonstrating the unbroken career preparation workflow."
    )

    steps = [
        ("Step 1: Landing Page", "Visit '/' ➔ Observe futuristic AI branding, audio waveform, and value proposition.", ACCENT_CYAN),
        ("Step 2: Demo Fast-Track", "Click 'Start Mock Interview' ➔ Instant login as Alex Rivera with return-path memory.", ACCENT_CYAN),
        ("Step 3: Interview Setup", "Configure Machine Learning Engineer + Technical Deep Dive + Intermediate tier.", ACCENT_PURPLE),
        ("Step 4: Interview Ready", "Inspect calibrated briefing, 5 evaluation rubrics, and Voice Mode Coming Soon notice.", ACCENT_PURPLE),
        ("Step 5: Mock Interview", "Experience live 3:00 timer, insert sample answer, observe adaptive difficulty triggers.", ACCENT_PINK),
        ("Step 6: Feedback Report", "Review 82/100 score gauge, 5-dimension rubric breakdown, and agent decision timeline.", ACCENT_PINK),
        ("Step 7: Skill Gap Analyzer", "Inspect SVG 6-axis Radar Chart and dynamic Top 3 deficit bottlenecks.", ACCENT_GREEN),
        ("Step 8: Daily Challenge", "Solve Supervised vs Unsupervised drill, insert response, earn +50 XP, advance streak.", ACCENT_GREEN),
        ("Step 9: Main Dashboard", "Observe updated scores, interactive practice plan, and AI coach recommendation.", ACCENT_AMBER),
        ("Step 10: ATS Resume Scanner", "Upload resume PDF, paste job description, audit matched vs missing keywords.", ACCENT_AMBER)
    ]

    for i, (title, desc, col) in enumerate(steps):
        r = i // 2
        c = i % 2
        c_left = Inches(0.8 + c * 5.98)
        c_top = Inches(2.0 + r * 0.88)
        
        add_card(slide, c_left, c_top, Inches(5.75), Inches(0.78), bg_color=CARD_BG, border_color=BORDER_MUTED)
        add_badge(slide, c_left + Inches(0.15), c_top + Inches(0.15), Inches(1.8), Inches(0.24), title.upper(), RGBColor(30, 25, 60), col, font_size=8)
        
        tb = slide.shapes.add_textbox(c_left + Inches(2.05), c_top + Inches(0.12), Inches(3.55), Inches(0.55))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_WHITE

    # Bottom Summary
    bot = add_card(slide, Inches(0.8), Inches(6.65), Inches(11.733), Inches(0.55), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    p_b = slide.shapes.add_textbox(Inches(1.0), Inches(6.68), Inches(11.3), Inches(0.45)).text_frame.paragraphs[0]
    p_b.text = "⚡ Evaluator Note: The entire demo runs instantaneously in any standard browser at http://localhost:5173/ with zero server lag."
    p_b.font.name = FONT_HEADING
    p_b.font.size = Pt(9.5)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_GREEN

# ------------------------------------------------------------------------------
# SLIDE 18: CONCLUSION & ACKNOWLEDGEMENTS
# ------------------------------------------------------------------------------
def build_slide_18(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide)

    # Architecture Summary Badge Header
    add_badge(
        slide, Inches(0.8), Inches(0.6), Inches(7.5), Inches(0.35),
        "FULL-STACK AI PLATFORM  •  AUTONOMOUS ARCHITECTURE SUMMARY",
        RGBColor(35, 25, 75), ACCENT_CYAN, font_size=10
    )

    # Core Conclusion Hero Card
    main_card = add_card(slide, Inches(0.8), Inches(1.2), Inches(11.733), Inches(3.2), bg_color=CARD_BG, border_color=BORDER_CYAN, border_width=2)
    
    tb = slide.shapes.add_textbox(Inches(1.1), Inches(1.4), Inches(11.1), Inches(2.7))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "CONCLUSION: TRANSFORMING CAREER PREPARATION"
    p0.font.name = FONT_HEADING
    p0.font.size = Pt(28)
    p0.font.bold = True
    p0.font.color.rgb = TEXT_WHITE
    p0.space_after = Pt(8)

    p1 = tf.add_paragraph()
    p1.text = "The AI Career Preparation Agent demonstrates that interview readiness can be transformed from fragmented self-study into a connected, adaptive, and agent-driven digital experience."
    p1.font.name = FONT_BODY
    p1.font.size = Pt(13.5)
    p1.font.color.rgb = TEXT_MUTED
    p1.space_after = Pt(12)

    p2 = tf.add_paragraph()
    p2.text = "Core Takeaway: The key innovation is not merely an interview chatbot, but an autonomous closed-loop career workflow: Resume Audit ➔ Skill Gap ➔ Mock Simulation ➔ Performance Assessment ➔ Personalized Daily Practice."
    p2.font.name = FONT_HEADING
    p2.font.size = Pt(11.5)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_GREEN

    # Architecture Highlights & Open-Source Readiness (2 Cards)
    c1 = add_card(slide, Inches(0.8), Inches(4.65), Inches(5.7), Inches(2.2), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    add_badge(slide, Inches(1.1), Inches(4.85), Inches(2.4), Inches(0.26), "OPEN ARCHITECTURE", RGBColor(30, 25, 60), ACCENT_CYAN, font_size=8.5)
    
    tb_c1 = slide.shapes.add_textbox(Inches(1.1), Inches(5.25), Inches(5.1), Inches(1.4))
    tf_c1 = tb_c1.text_frame
    tf_c1.word_wrap = True
    
    p = tf_c1.paragraphs[0]
    p.text = "Production-Ready Stack"
    p.font.name = FONT_HEADING
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(2)
    
    p2 = tf_c1.add_paragraph()
    p2.text = "Modular Architecture  |  FastAPI + React 19\nDeterministic Rubric Scoring & RAG Pipeline\nZero Cloud Secrets Committed"
    p2.font.name = FONT_BODY
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = TEXT_MUTED

    c2 = add_card(slide, Inches(6.8), Inches(4.65), Inches(5.7), Inches(2.2), bg_color=CARD_BG_ALT, border_color=BORDER_MUTED)
    add_badge(slide, Inches(7.1), Inches(4.85), Inches(2.4), Inches(0.26), "TECHNICAL OVERVIEW", RGBColor(35, 20, 60), ACCENT_PURPLE, font_size=8.5)
    
    tb_c2 = slide.shapes.add_textbox(Inches(7.1), Inches(5.25), Inches(5.1), Inches(1.4))
    tf_c2 = tb_c2.text_frame
    tf_c2.word_wrap = True
    
    p3 = tf_c2.paragraphs[0]
    p3.text = "AI Career Preparation Platform"
    p3.font.name = FONT_HEADING
    p3.font.size = Pt(15)
    p3.font.bold = True
    p3.font.color.rgb = ACCENT_CYAN
    p3.space_after = Pt(4)
    
    p4 = tf_c2.add_paragraph()
    p4.text = "Prototype codebase is fully operational and open for live committee demonstration and architectural evaluation."
    p4.font.name = FONT_BODY
    p4.font.size = Pt(10.5)
    p4.font.color.rgb = TEXT_WHITE

# ==============================================================================
# MAIN SCRIPT EXECUTION
# ==============================================================================
def main():
    prs = create_deck()
    print("Generating Slide 1: Title...")
    build_slide_1(prs)
    print("Generating Slide 2: Problem Statement...")
    build_slide_2(prs)
    print("Generating Slide 3: Motivation (Agent vs Chatbot)...")
    build_slide_3(prs)
    print("Generating Slide 4: Literature Survey...")
    build_slide_4(prs)
    print("Generating Slide 5: Proposed Solution...")
    build_slide_5(prs)
    print("Generating Slide 6: Objectives & Scope...")
    build_slide_6(prs)
    print("Generating Slide 7: System Architecture...")
    build_slide_7(prs)
    print("Generating Slide 8: Technology Stack...")
    build_slide_8(prs)
    print("Generating Slide 9: User Journey...")
    build_slide_9(prs)
    print("Generating Slide 10: Mock Interview & Feedback...")
    build_slide_10(prs)
    print("Generating Slide 11: ATS Resume Scanner...")
    build_slide_11(prs)
    print("Generating Slide 12: Skill Gap Analyzer...")
    build_slide_12(prs)
    print("Generating Slide 13: Gamification Engine...")
    build_slide_13(prs)
    print("Generating Slide 14: Central Dashboard...")
    build_slide_14(prs)
    print("Generating Slide 15: Implemented vs Future Scope...")
    build_slide_15(prs)
    print("Generating Slide 16: Advantages & Limitations...")
    build_slide_16(prs)
    print("Generating Slide 17: Live Demo Flow...")
    build_slide_17(prs)
    print("Generating Slide 18: Conclusion & Q&A...")
    build_slide_18(prs)

    import os
    output_filename = "AI_Career_Preparation_Agent_Architecture_Presentation.pptx"
    presentation_dir = os.path.join(os.path.dirname(__file__))
    target_path = os.path.join(presentation_dir, output_filename)
    prs.save(target_path)
    
    print(f"\n[SUCCESS] Presentation saved to:")
    print(f"  - {target_path}")

if __name__ == "__main__":
    main()
